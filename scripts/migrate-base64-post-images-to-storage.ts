/**
 * One-time migration: find posts with base64 image_url or metadata.image_urls,
 * upload each image to Supabase Storage (post-images bucket, path migrated/{post_id}/{index}.{ext}),
 * then update the post row to use the new public URLs. No posts are deleted.
 * Deduplicates by content hash before upload so the same image is only stored once per post.
 *
 * Run: npx tsx scripts/migrate-base64-post-images-to-storage.ts [post_id]
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const BUCKET = 'post-images';
const MIGRATED_PREFIX = 'migrated';
const BATCH_SIZE = 10;
const DELAY_MS = 200;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function isDataUrl(s: unknown): s is string {
  return typeof s === 'string' && s.startsWith('data:');
}

function getExtensionFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/(\w+);/);
  if (match) {
    const mime = match[1].toLowerCase();
    if (mime === 'jpeg' || mime === 'jpg') return 'jpg';
    if (mime === 'png' || mime === 'gif' || mime === 'webp') return mime;
    return mime;
  }
  return 'png';
}

function parseDataUrl(dataUrl: string): { buffer: Buffer; ext: string } {
  const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!base64Match) throw new Error('Invalid data URL format');
  const buffer = Buffer.from(base64Match[1], 'base64');
  const ext = getExtensionFromDataUrl(dataUrl);
  return { buffer, ext };
}

function collectDataUrls(post: {
  id: string;
  image_url?: string | null;
  metadata?: { image_urls?: unknown } | null;
}): string[] {
  const urls: string[] = [];
  if (isDataUrl(post.image_url)) urls.push(post.image_url);
  const metaUrls = post.metadata?.image_urls;
  if (Array.isArray(metaUrls)) {
    for (const u of metaUrls) {
      if (isDataUrl(u)) urls.push(u);
    }
  }
  return urls;
}

/** Deduplicate data URLs by content hash so the same image is only uploaded once per post. */
function deduplicateDataUrlsByHash(dataUrls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const dataUrl of dataUrls) {
    try {
      const { buffer } = parseDataUrl(dataUrl);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      if (seen.has(hash)) continue;
      seen.add(hash);
      result.push(dataUrl);
    } catch {
      result.push(dataUrl);
    }
  }
  return result;
}

async function uploadToStorage(postId: string, dataUrl: string, index: number): Promise<string> {
  const { buffer, ext } = parseDataUrl(dataUrl);
  const filePath = `${MIGRATED_PREFIX}/${postId}/${index}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, { cacheControl: '3600', upsert: true, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return urlData.publicUrl;
}

async function migratePost(post: {
  id: string;
  image_url?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<{ ok: boolean; error?: string }> {
  const rawUrls = collectDataUrls(post);
  const dataUrls = deduplicateDataUrlsByHash(rawUrls);
  if (dataUrls.length === 0) return { ok: true };

  const newUrls: string[] = [];
  try {
    for (let i = 0; i < dataUrls.length; i++) {
      const url = await uploadToStorage(post.id, dataUrls[i], i);
      newUrls.push(url);
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const updatePayload: { image_url: string | null; metadata: Record<string, unknown> } = {
    image_url: newUrls[0] ?? null,
    metadata: { ...(post.metadata || {}), image_urls: newUrls },
  };

  const { error } = await supabase
    .from('posts')
    .update({ image_url: updatePayload.image_url, metadata: updatePayload.metadata })
    .eq('id', post.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function main() {
  console.log('Fetching posts that may contain base64 images...');

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, image_url, metadata')
    .or('image_url.not.is.null,metadata->image_urls.not.is.null');

  if (error) {
    console.error('Failed to fetch posts:', error.message);
    process.exit(1);
  }

  const toMigrate = (posts || []).filter((p) => collectDataUrls(p).length > 0);
  console.log(`Found ${toMigrate.length} post(s) with data: URLs to migrate.`);

  if (toMigrate.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let done = 0;
  let failed = 0;

  for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
    const batch = toMigrate.slice(i, i + BATCH_SIZE);
    for (const post of batch) {
      const result = await migratePost(post);
      if (result.ok) {
        done++;
        const n = collectDataUrls(post).length;
        console.log(`[${done + failed}/${toMigrate.length}] Migrated post ${post.id} (${n} image(s))`);
      } else {
        failed++;
        console.error(`[${done + failed}/${toMigrate.length}] Skipped post ${post.id}: ${result.error}`);
      }
    }
    if (i + BATCH_SIZE < toMigrate.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`Done. Migrated: ${done}, Failed: ${failed}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});