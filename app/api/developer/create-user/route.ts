import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      firstName, 
      lastName, 
      chapter, 
      role = 'active_member', // Only allow 'admin' or 'active_member'
      chapter_role = 'member',
      is_developer = false, 
      developer_permissions = [],
      member_status = 'active'
    } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !chapter) {
      return NextResponse.json({ 
        error: 'Email, firstName, lastName, and chapter are required' 
      }, { status: 400 });
    }

    // Add role validation
    if (!['admin', 'active_member'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Only admin and active_member are allowed.' 
      }, { status: 400 });
    }

    // Create server-side Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve chapter ID to chapter name
    let chapterName = chapter;
    let chapterId = chapter;
    
    // If chapter is a UUID, resolve it to the chapter name
    if (chapter.length === 36 && chapter.includes('-')) {
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select('id, name')
        .eq('id', chapter)
        .single();
      
      if (chapterError || !chapterData) {
        console.error('❌ Chapter not found:', chapter);
        return NextResponse.json({ 
          error: `Chapter not found: ${chapter}` 
        }, { status: 400 });
      }
      
      chapterName = chapterData.name;
      chapterId = chapterData.id;
      console.log('✅ Resolved chapter:', { id: chapterId, name: chapterName });
    }

    // Generate a secure temporary password
    const tempPassword = generateTempPassword();
    
    // 1. Create user in Supabase Auth
    const { data: newUserAuth, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        chapter: chapterName, // Store the chapter name, not UUID
        role: role
      }
    });

    if (authError) {
      console.error('❌ Auth user creation error:', authError);
      return NextResponse.json({ 
        error: `Failed to create auth user: ${authError.message}` 
      }, { status: 500 });
    }

    if (!newUserAuth.user) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
    }

    // 2. Create profile in profiles table - Use upsert to handle existing records
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: newUserAuth.user.id,
        email: email.toLowerCase(),
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        chapter: chapterName, // Store the chapter name, not UUID
        chapter_id: chapterId, // Store the chapter ID separately
        role: role,
        chapter_role: chapter_role,
        member_status: member_status,
        is_developer: is_developer,
        developer_permissions: developer_permissions,
        access_level: is_developer ? 'elevated' : 'standard',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', newUserAuth.user.id)
        .single();
      
      if (existingProfile) {
        console.log('⚠️ Profile already exists, updating instead');
        // Update existing profile
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            email: email.toLowerCase(),
            full_name: `${firstName} ${lastName}`,
            first_name: firstName,
            last_name: lastName,
            chapter: chapterName, // Store the chapter name, not UUID
            chapter_id: chapterId, // Store the chapter ID separately
            role: role,
            chapter_role: chapter_role,
            member_status: member_status,
            is_developer: is_developer,
            developer_permissions: developer_permissions,
            access_level: is_developer ? 'elevated' : 'standard',
            updated_at: new Date().toISOString()
          })
          .eq('id', newUserAuth.user.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Profile update failed:', updateError);
          // Rollback: delete the auth user
          await supabase.auth.admin.deleteUser(newUserAuth.user.id);
          return NextResponse.json({ 
            error: `Failed to update existing profile: ${updateError.message}` 
          }, { status: 500 });
        }
        
        console.log('✅ Existing profile updated:', updatedProfile.id);
      } else {
        // Profile doesn't exist, rollback auth user
        console.error('❌ Profile creation failed and no existing profile found');
        await supabase.auth.admin.deleteUser(newUserAuth.user.id);
        return NextResponse.json({ 
          error: `Failed to create user profile: ${profileError.message}` 
        }, { status: 500 });
      }
    } else {
      console.log('✅ New profile created:', newProfile.id);
    }

    return NextResponse.json({ 
      success: true,
      message: 'User created successfully', 
      user: {
        id: newUserAuth.user.id,
        email: newUserAuth.user.email,
        full_name: `${firstName} ${lastName}`,
        chapter: chapterName, // Return the chapter name, not UUID
        role: role
      },
      tempPassword: tempPassword,
      instructions: [
        'User account created successfully',
        'Temporary password provided above',
        'User should change password on first login',
        'User will be redirected to profile completion if needed'
      ]
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Simple password generator function
function generateTempPassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each required character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

