import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { generateProfileSlug, sanitizeUsername, isReservedWord } from '../lib/utils/usernameUtils';

// Load environment variables from .env.local
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  username: string | null;
  profile_slug: string | null;
}

// Parse full_name into first_name and last_name if needed
function parseFullName(fullName: string | null): { firstName: string | null; lastName: string | null } {
  if (!fullName || !fullName.trim()) {
    return { firstName: null, lastName: null };
  }

  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/).filter(p => p.length > 0);

  if (parts.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  // Take first part as first name, rest as last name
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

// Generate base username with fallbacks
function generateBaseUsernameWithFallback(
  firstName: string | null,
  lastName: string | null,
  fullName: string | null,
  email: string | null,
  profileId: string
): string {
  // Use first_name/last_name if available
  let first = (firstName || '').trim();
  let last = (lastName || '').trim();

  // If missing, try to parse from full_name
  if ((!first && !last) && fullName) {
    const parsed = parseFullName(fullName);
    first = (parsed.firstName || '').trim();
    last = (parsed.lastName || '').trim();
  }

  // If we have names, use them
  if (first || last) {
    const firstPart = sanitizeUsername(first || 'user');
    const lastPart = sanitizeUsername(last || 'name');

    if (firstPart && lastPart) {
      return `${firstPart}.${lastPart}`;
    }
    return firstPart || lastPart || 'user';
  }

  // Fallback to email if available
  if (email) {
    const emailPart = email.split('@')[0];
    const sanitized = sanitizeUsername(emailPart);
    if (sanitized && sanitized.length >= 3) {
      return sanitized;
    }
  }

  // Final fallback: use last 8 chars of profile ID
  const idPart = profileId.slice(-8).replace(/-/g, '');
  return `user${idPart}`;
}

async function migrateUsernames() {
  console.log('🚀 Starting targeted username migration...\n');

  const startTime = Date.now();

  // Step 1: Get all profiles with null username
  console.log('📥 Fetching profiles without usernames...');
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, full_name, email, username, profile_slug')
    .is('username', null)
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching profiles:', fetchError);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ No profiles need migration!');
    return;
  }

  console.log(`📊 Found ${profiles.length} profiles without usernames\n`);

  // Step 2: Pre-fetch all existing usernames
  console.log('📥 Loading existing usernames into cache...');
  const { data: existingUsernames, error: usernameError } = await supabase
    .from('profiles')
    .select('username')
    .not('username', 'is', null);

  if (usernameError) {
    console.error('❌ Error fetching existing usernames:', usernameError);
    process.exit(1);
  }

  const usernameSet = new Set(
    (existingUsernames || [])
      .map(p => p.username?.toLowerCase().trim())
      .filter(Boolean) as string[]
  );

  console.log(`✅ Loaded ${usernameSet.size} existing usernames into cache\n`);

  // Step 3: Check if username exists (using cache)
  const cachedUsernameExists = (username: string): boolean => {
    return usernameSet.has(username.toLowerCase().trim());
  };

  // Step 4: Generate unique username
  const generateUniqueUsernameCached = (
    firstName: string | null,
    lastName: string | null,
    fullName: string | null,
    email: string | null,
    profileId: string
  ): string => {
    let baseUsername = generateBaseUsernameWithFallback(
      firstName,
      lastName,
      fullName,
      email,
      profileId
    );

    // If base username is reserved, add a number
    if (isReservedWord(baseUsername)) {
      baseUsername = `${baseUsername}1`;
    }

    let username = baseUsername;
    let counter = 0;
    const maxAttempts = 1000;

    // Check cache and increment until unique
    while (cachedUsernameExists(username)) {
      counter++;
      if (counter > maxAttempts) {
        const timestamp = Date.now().toString().slice(-6);
        username = `${baseUsername}${timestamp}`;
        break;
      }
      username = `${baseUsername}${counter}`;
    }

    // Add to cache immediately
    usernameSet.add(username.toLowerCase().trim());

    return username;
  };

  // Step 5: Process profiles sequentially
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalErrors = 0;
  let totalSkipped = 0;

  console.log('🔄 Processing profiles...\n');

  for (const profile of profiles) {
    try {
      // Check if profile has any name data
      const hasFirstName = profile.first_name && profile.first_name.trim();
      const hasLastName = profile.last_name && profile.last_name.trim();
      const hasFullName = profile.full_name && profile.full_name.trim();
      const hasEmail = profile.email && profile.email.trim();

      // Skip if no name data at all
      if (!hasFirstName && !hasLastName && !hasFullName && !hasEmail) {
        console.log(`⏭️  Skipping ${profile.id} - no name or email data`);
        totalSkipped++;
        totalProcessed++;
        continue;
      }

      // Generate unique username
      const username = generateUniqueUsernameCached(
        profile.first_name,
        profile.last_name,
        profile.full_name,
        profile.email,
        profile.id
      );

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
        // Handle duplicate key error
        if (updateError.message.includes('duplicate key') || updateError.code === '23505') {
          console.warn(`⚠️  Duplicate detected for ${profile.id}, retrying...`);

          const timestamp = Date.now().toString().slice(-6);
          const retryUsername = `${username}${timestamp}`;
          const retrySlug = generateProfileSlug(retryUsername);

          usernameSet.add(retryUsername.toLowerCase().trim());

          const { error: retryError } = await supabase
            .from('profiles')
            .update({
              username: retryUsername,
              profile_slug: retrySlug,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);

          if (retryError) {
            console.error(`❌ Failed to update ${profile.id} after retry:`, retryError.message);
            totalErrors++;
          } else {
            totalSuccess++;
            const displayName = profile.full_name || profile.email || profile.id;
            console.log(`✅ ${displayName} → ${retryUsername}`);
          }
        } else {
          console.error(`❌ Failed to update ${profile.id}:`, updateError.message);
          totalErrors++;
        }
      } else {
        totalSuccess++;
        const displayName = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || profile.id;
        console.log(`✅ ${displayName} → ${username}`);
      }

      totalProcessed++;

      // Small delay every 50 profiles
      if (totalProcessed % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (err) {
      console.error(`❌ Error processing ${profile.id}:`, err instanceof Error ? err.message : err);
      totalErrors++;
      totalProcessed++;
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('📈 FINAL MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated: ${totalSuccess} profiles`);
  console.log(`⏭️  Skipped (no data): ${totalSkipped} profiles`);
  console.log(`❌ Errors: ${totalErrors} profiles`);
  console.log(`📊 Total processed: ${totalProcessed} profiles`);
  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log('='.repeat(60));

  // Verify results
  console.log('\n🔍 Verifying migration...');
  const { count: remainingNull, error: verifyError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .is('username', null);

  if (!verifyError) {
    console.log(`📊 Remaining profiles without username: ${remainingNull}`);
    if (remainingNull === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log(`⚠️  ${remainingNull} profiles still need usernames.`);
    }
  }
}

// Run migration
migrateUsernames()
  .then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });