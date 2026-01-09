import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { canAccessDeveloperPortal } from '@/lib/developerPermissions';
import { canManageChapter } from '@/lib/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/branding/upload-logo
 * Upload a logo file to Supabase Storage and return the public URL
 */
export async function POST(request: NextRequest) {
  try {
    // Create authenticated supabase client using await cookies()
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {}, // No-op for API routes
          remove() {}, // No-op for API routes
        },
      }
    );

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

