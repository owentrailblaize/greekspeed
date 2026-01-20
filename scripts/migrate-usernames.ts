import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { generateUniqueUsername, generateProfileSlug } from '../lib/utils/usernameUtils';

// Load environment variables from .env.local
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure .env.local contains:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateUsernames() {
  console.log('🚀 Starting username migration...');
  
  const BATCH_SIZE = 1000; // Supabase default limit
  let offset = 0;
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalErrors = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch profiles in batches
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, username, profile_slug', { count: 'exact' })
      .is('username', null)
      .range(offset, offset + BATCH_SIZE - 1)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      break;
    }

    if (!profiles || profiles.length === 0) {
      console.log('✅ No more profiles to migrate');
      hasMore = false;
      break;
    }

    console.log(`\n📦 Processing batch: ${offset + 1} to ${offset + profiles.length} (${profiles.length} profiles)`);

    let batchSuccess = 0;
    let batchErrors = 0;

    for (const profile of profiles) {
      try {
        // Generate unique username
        const username = await generateUniqueUsername(
          profile.first_name,
          profile.last_name,
          profile.id
        );
        
        // Generate slug
        const slug = generateProfileSlug(username);
        
        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username,
            profile_slug: slug,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
        
        if (updateError) {
          console.error(`❌ Failed to update profile ${profile.id}:`, updateError.message);
          batchErrors++;
          totalErrors++;
        } else {
          console.log(`✅ [${totalProcessed + 1}] ${profile.first_name || ''} ${profile.last_name || ''} → ${username}`);
          batchSuccess++;
          totalSuccess++;
        }
        
        totalProcessed++;
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        console.error(`❌ Error processing profile ${profile.id}:`, err instanceof Error ? err.message : err);
        batchErrors++;
        totalErrors++;
        totalProcessed++;
      }
    }

    console.log(`📊 Batch Summary: ✅ ${batchSuccess} | ❌ ${batchErrors}`);

    // Check if we have more profiles to process
    if (profiles.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      offset += BATCH_SIZE;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 FINAL MIGRATION SUMMARY:');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${totalSuccess}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log(`📊 Total Processed: ${totalProcessed}`);
  console.log('='.repeat(60));
}

// Run migration
migrateUsernames()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });