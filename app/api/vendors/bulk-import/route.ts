import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { BulkVendorImportResult, BulkVendorImportRow } from '@/types/vendors';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeType(type?: string | null): string {
  const value = type?.trim();
  return value && value.length > 0 ? value : 'Other';
}

function sanitizeText(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

async function createSupabaseFromCookies() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });
}

async function authenticateRequest(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      return { user, supabase: authenticatedSupabase };
    }
  }

  const cookieSupabase = await createSupabaseFromCookies();
  const {
    data: { user },
    error,
  } = await cookieSupabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { user, supabase: cookieSupabase };
}

async function isDuplicateVendor(
  supabase: any,
  chapterId: string,
  vendor: BulkVendorImportRow
): Promise<{ isDuplicate: boolean; existingId?: string; reason?: string }> {
  const name = vendor.name.trim();
  const { data: matches } = await supabase
    .from('vendor_contacts')
    .select('id, name, email, phone')
    .eq('chapter_id', chapterId)
    .eq('is_active', true)
    .ilike('name', name);

  if (!matches || matches.length === 0) {
    return { isDuplicate: false };
  }

  if (vendor.email) {
    const email = vendor.email.trim().toLowerCase();
    const emailMatch = matches.find((entry: any) => (entry.email || '').toLowerCase() === email);
    if (emailMatch) {
      return { isDuplicate: true, existingId: emailMatch.id, reason: 'Same vendor name and email' };
    }
  }

  if (vendor.phone) {
    const phoneDigits = vendor.phone.replace(/\D/g, '');
    const phoneMatch = matches.find((entry: any) => (entry.phone || '').replace(/\D/g, '') === phoneDigits);
    if (phoneMatch) {
      return { isDuplicate: true, existingId: phoneMatch.id, reason: 'Same vendor name and phone' };
    }
  }

  const exactNameMatch = matches.find((entry: any) => (entry.name || '').trim().toLowerCase() === name.toLowerCase());
  if (exactNameMatch) {
    return { isDuplicate: true, existingId: exactNameMatch.id, reason: 'Vendor name already exists' };
  }

  return { isDuplicate: false };
}

function validateVendorRow(vendor: BulkVendorImportRow, row: number) {
  const name = vendor.name?.trim();

  if (!name) {
    return { row, name: 'Unknown', error: 'Vendor name is required' };
  }

  if (vendor.email && vendor.email.trim().length > 0 && !isValidEmail(vendor.email.trim())) {
    return { row, name, error: 'Invalid email format' };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = auth;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, chapter_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.chapter_id) {
      return NextResponse.json({ error: 'User must belong to a chapter' }, { status: 400 });
    }

    const body = await request.json();
    const { vendors, options = {} } = body;
    const { skipDuplicates = true, batchSize = 30 } = options;

    if (!Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json({ error: 'No vendor rows were provided' }, { status: 400 });
    }

    if (vendors.length > 1000) {
      return NextResponse.json({ error: 'Too many rows. Maximum import size is 1000.' }, { status: 400 });
    }

    const results: BulkVendorImportResult = {
      total: vendors.length,
      successful: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
      createdVendors: [],
      skippedDuplicates: [],
    };

    for (let i = 0; i < vendors.length; i += batchSize) {
      const batch = vendors.slice(i, i + batchSize) as BulkVendorImportRow[];

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const rowIndex = i + j + 2;

        const validationError = validateVendorRow(row, rowIndex);
        if (validationError) {
          results.failed++;
          results.errors.push(validationError);
          continue;
        }

        const duplicate = await isDuplicateVendor(supabase, profile.chapter_id, row);
        if (duplicate.isDuplicate) {
          results.duplicates++;
          if (skipDuplicates) {
            results.skippedDuplicates.push({
              row: rowIndex,
              name: row.name.trim(),
              existingId: duplicate.existingId!,
              reason: duplicate.reason || 'Duplicate vendor',
            });
            continue;
          }

          results.failed++;
          results.errors.push({
            row: rowIndex,
            name: row.name.trim(),
            error: `Duplicate: ${duplicate.reason || 'Vendor already exists'}`,
          });
          continue;
        }

        const insertData = {
          chapter_id: profile.chapter_id,
          name: row.name.trim(),
          type: normalizeType(row.type),
          contact_person: sanitizeText(row.contact_person),
          email: sanitizeText(row.email)?.toLowerCase() || null,
          phone: sanitizeText(row.phone),
          notes: sanitizeText(row.notes),
          website: sanitizeText(row.website),
          address: sanitizeText(row.address),
          is_active: true,
          created_by: user.id,
          updated_by: user.id,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('vendor_contacts')
          .insert([insertData])
          .select('id, name')
          .single();

        if (insertError) {
          results.failed++;
          results.errors.push({
            row: rowIndex,
            name: row.name.trim(),
            error: insertError.message || 'Failed to create vendor',
          });
          continue;
        }

        results.successful++;
        results.createdVendors.push({ id: inserted.id, name: inserted.name });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Import completed. ${results.successful} vendor contacts created.`,
    });
  } catch (error) {
    console.error('Vendor bulk import failed:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
