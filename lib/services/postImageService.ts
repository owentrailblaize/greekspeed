import { supabase } from '@/lib/supabase/client';

const BUCKET = 'post-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export class PostImageService {
  /**
   * Upload a single image File to Supabase Storage and return the public URL.
   */
  static async uploadImage(file: File, userId: string): Promise<string> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG, GIF, and WebP are allowed.`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File "${file.name}" exceeds 10 MB limit.`);
    }

    let fileExt = 'jpg';
    if (file.type === 'image/png') fileExt = 'png';
    else if (file.type === 'image/gif') fileExt = 'gif';
    else if (file.type === 'image/webp') fileExt = 'webp';

    const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) {
      throw new Error(`Upload failed for "${file.name}": ${error.message}`);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  /**
   * Upload multiple image Files in parallel, returning their public URLs in order.
   */
  static async uploadImages(files: File[], userId: string): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadImage(file, userId)));
  }
}
