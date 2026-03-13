import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'user-avatar';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Returns true if the URL is an OAuth provider avatar we should copy to our storage
 * (LinkedIn URLs expire; copying gives us a stable URL).
 */
export function isOAuthAvatarUrl(url: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('media.licdn.com') ||
    url.includes('lh3.googleusercontent.com')
  );
}

/**
 * Fetch image from URL and upload to Supabase storage using the same path pattern
 * as AvatarService (userId-timestamp.ext). Server-only; use with createServerSupabaseClient().
 * Returns the public URL or null on any failure.
 */
export async function uploadAvatarFromUrl(
  imageUrl: string,
  userId: string,
  supabase: SupabaseClient
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'image/*',
        'User-Agent':
          'Mozilla/5.0 (compatible; Trailblaize/1.0; +https://trailblaize.net)',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[avatarFromUrl] Fetch failed:', response.status, imageUrl);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const isImage =
      contentType.startsWith('image/') ||
      /\.(jpe?g|png|gif|webp)(\?|$)/i.test(imageUrl);
    if (!isImage) {
      console.warn('[avatarFromUrl] Response is not an image:', contentType);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      console.warn('[avatarFromUrl] Image too large:', arrayBuffer.byteLength);
      return null;
    }
    if (arrayBuffer.byteLength === 0) {
      console.warn('[avatarFromUrl] Empty response');
      return null;
    }

    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('gif')) ext = 'gif';
    else if (contentType.includes('webp')) ext = 'webp';

    const filePath = `${userId}-${Date.now()}.${ext}`;
    const contentTypeForStorage =
      ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, arrayBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentTypeForStorage,
      });

    if (error) {
      console.warn('[avatarFromUrl] Upload failed:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[avatarFromUrl] Error:', message);
    return null;
  }
}
