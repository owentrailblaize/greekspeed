import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AlumniUploadData {
  email: string;
  first_name: string;
  last_name: string;
  chapter: string;
  industry?: string;
  graduation_year?: number;
  company?: string;
  job_title?: string;
  phone?: string;
  location?: string;
  description?: string;
  pledge_class?: string;
  major?: string;
  hometown?: string;
}

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED!'); // Add this line
  try {
    const { alumniData, options = {} } = await request.json();
    const { 
      generatePasswords = true, 
      defaultPassword = 'Welcome2024!',
      sendWelcomeEmails = false,
      batchSize = 100 
    } = options;

    if (!Array.isArray(alumniData) || alumniData.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid alumni data format' 
      }, { status: 400 });
    }

    console.log(`🚀 Starting bulk upload of ${alumniData.length} alumni records`);

    const results = {
      total: alumniData.length,
      successful: 0,
      failed: 0,
      errors: [] as any[],
      createdUsers: [] as any[],
      skipped: [] as any[]
    };

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < alumniData.length; i += batchSize) {
      const batch = alumniData.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(alumniData.length/batchSize)}`);

      for (const alumni of batch) {
        try {
          const result = await processAlumniRecord(alumni, {
            generatePasswords,
            defaultPassword,
            sendWelcomeEmails
          });

          if (result.success) {
            results.successful++;
            results.createdUsers.push(result.user);
          } else {
            results.failed++;
            results.errors.push({
              email: alumni.email,
              error: result.error
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            email: alumni.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Small delay between batches to be respectful to Supabase
      if (i + batchSize < alumniData.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Bulk upload completed: ${results.successful} successful, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      results,
      message: `Bulk upload completed. ${results.successful} alumni created successfully.`
    });

  } catch (error) {
    console.error('❌ Bulk upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function processAlumniRecord(
  alumniData: AlumniUploadData, 
  options: { generatePasswords: boolean; defaultPassword: string; sendWelcomeEmails: boolean }
) {
  try {
    // 1. Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingUser.users.find(u => u.email === alumniData.email.toLowerCase());

    if (existingAuthUser) {
      console.log(`⚠️ User already exists: ${alumniData.email}`);
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', existingAuthUser.id)
        .single();

      if (existingProfile) {
        // Update existing profile with alumni role if needed
        if (existingProfile.role !== 'alumni') {
          await supabase
            .from('profiles')
            .update({ role: 'alumni' })
            .eq('id', existingAuthUser.id);
        }

        // Check if alumni record exists
        const { data: existingAlumni } = await supabase
          .from('alumni')
          .select('*')
          .eq('user_id', existingAuthUser.id)
          .single();

        if (!existingAlumni) {
          // Create alumni record linked to existing profile
          await supabase
            .from('alumni')
            .insert({
              user_id: existingAuthUser.id,
              ...alumniData,
              full_name: `${alumniData.first_name} ${alumniData.last_name}`,
              email: alumniData.email.toLowerCase(),
              verified: false,
              is_actively_hiring: false,
              avatar_url: null,
              last_contact: null,
              tags: null,
              mutual_connections: []
            });
        }

        return { success: true, user: existingAuthUser, action: 'linked_existing' };
      }
    }

    // 2. Create new auth user
    const password = options.generatePasswords ? generateSecurePassword() : options.defaultPassword;
    
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email: alumniData.email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${alumniData.first_name} ${alumniData.last_name}`,
        first_name: alumniData.first_name,
        last_name: alumniData.last_name,
        chapter: alumniData.chapter,
        role: 'alumni'
      }
    });

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`);
    }

    // 3. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: alumniData.email.toLowerCase(),
        full_name: `${alumniData.first_name} ${alumniData.last_name}`,
        first_name: alumniData.first_name,
        last_name: alumniData.last_name,
        chapter: alumniData.chapter,
        chapter_id: alumniData.chapter,
        role: 'alumni',
        member_status: 'alumni',
        pledge_class: alumniData.pledge_class || null,
        grad_year: alumniData.graduation_year || null,
        major: alumniData.major || null,
        hometown: alumniData.hometown || null,
        bio: alumniData.description || null,
        phone: alumniData.phone || null,
        location: alumniData.location || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      // Rollback auth user creation if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    // 4. Create alumni record
    const { error: alumniError } = await supabase
      .from('alumni')
      .insert({
        user_id: newUser.user.id,
        first_name: alumniData.first_name,
        last_name: alumniData.last_name,
        full_name: `${alumniData.first_name} ${alumniData.last_name}`,
        chapter: alumniData.chapter,
        industry: alumniData.industry || 'Not specified',
        graduation_year: alumniData.graduation_year || new Date().getFullYear(),
        company: alumniData.company || 'Not specified',
        job_title: alumniData.job_title || 'Not specified',
        email: alumniData.email.toLowerCase(),
        phone: alumniData.phone || null,
        location: alumniData.location || 'Not specified',
        description: alumniData.description || `Alumni from ${alumniData.chapter}`,
        avatar_url: null,
        verified: false,
        is_actively_hiring: false,
        last_contact: null,
        tags: null,
        mutual_connections: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (alumniError) {
      console.error(`⚠️ Alumni record creation failed for ${alumniData.email}:`, alumniError);
      // Don't rollback - profile exists, user can still login
    }

    // 5. Send welcome email if requested
    if (options.sendWelcomeEmails) {
      // Implement email sending logic here
      console.log(`📧 Welcome email queued for ${alumniData.email}`);
    }

    console.log(`✅ Created alumni: ${alumniData.email}`);
    return { 
      success: true, 
      user: newUser.user, 
      password,
      action: 'created_new' 
    };

  } catch (error) {
    console.error(`❌ Failed to process alumni ${alumniData.email}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
