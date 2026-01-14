import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { canAccessDeveloperPortal } from '@/lib/developerPermissions';
import { canManageChapter } from '@/lib/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper to authenticate - supports both Bearer token and cookies
async function authenticateRequest(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Try Bearer token first (for client-side hooks)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      console.log('✅ Authenticated via Bearer token:', user.id);
      return { 
        user, 
        supabase: createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!) 
      };
    }
  }
  
  // Fall back to cookies - use request.cookies directly (more reliable in Next.js 15)
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {}, // No-op for API routes
        remove() {}, // No-op for API routes
      },
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('❌ Cookie auth failed:', error?.message || 'No user');
      return null;
    }
    
    console.log('✅ Authenticated via cookies:', user.id);
    return { 
      user, 
      supabase: createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!) 
    };
  } catch (cookieError) {
    console.error('❌ Cookie auth exception:', cookieError);
    return null;
  }
}

/**
 * POST /api/branding/upload-logo
 * Upload a logo file to Supabase Storage and return the public URL
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate using the helper function (supports Bearer token and cookies)
    const auth = await authenticateRequest(request);
    if (!auth) {
      console.error('❌ POST /api/branding/upload-logo: Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, supabase } = auth;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, chapter_id, chapter_role, is_developer')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chapterId = formData.get('chapterId') as string;
    const variant = (formData.get('variant') as string) || 'primary'; // 'primary' or 'secondary'

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    if (variant !== 'primary' && variant !== 'secondary') {
      return NextResponse.json(
        { error: 'Variant must be "primary" or "secondary"' },
        { status: 400 }
      );
    }

    // Check permissions (developer can upload for any chapter, chapter admin only for their own)
    const isDeveloper = canAccessDeveloperPortal(profile);
    const canManage = canManageChapter(profile.role as any, profile.chapter_role);

    if (!isDeveloper && (!canManage || profile.chapter_id !== chapterId)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to upload logo for this chapter' },
        { status: 403 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Only JPEG, PNG, GIF, and SVG images are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate file extension
    let fileExt = 'png'; // Default
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') fileExt = 'jpg';
    else if (file.type === 'image/gif') fileExt = 'gif';
    else if (file.type === 'image/svg+xml') fileExt = 'svg';

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${variant}-${timestamp}.${fileExt}`;
    const storagePath = `${chapterId}/${fileName}`;

    // Use service role client for storage operations
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from('chapter-logos')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload logo: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = serviceSupabase.storage
      .from('chapter-logos')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: storagePath,
      variant,
      message: 'Logo uploaded successfully',
    });
  } catch (error) {
    console.error('Error in upload logo API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

