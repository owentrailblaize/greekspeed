import { supabase } from '@/lib/supabase/client';
import { logger } from "@/lib/utils/logger";

export class BannerService {
  private static supabaseClient = supabase;

  /**
   * Upload banner image to Supabase Storage
   */
  static async uploadBanner(file: File, userId: string): Promise<string | null> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        logger.error('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
        return null;
      }

      // Validate file size (max 10MB for banners)
      if (file.size > 10 * 1024 * 1024) {
        logger.error('File size must be less than 10MB');
        return null;
      }

      // Generate unique filename
      let fileExt = 'jpg';
      if (file.type === 'image/png') fileExt = 'png';
      else if (file.type === 'image/gif') fileExt = 'gif';
      
      const fileName = `${userId}-banner-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Uploading banner

      // Upload file to Supabase Storage
      const { data, error } = await this.supabaseClient.storage
        .from('user-banners')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        logger.error('Error uploading banner:', { context: [error] });
        return null;
      }

      // Get public URL
      const { data: urlData } = this.supabaseClient.storage
        .from('user-banners')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      logger.error('Error in uploadBanner:', { context: [error] });
      return null;
    }
  }

  /**
   * Delete old banner if it exists
   */
  static async deleteOldBanner(bannerUrl: string | null): Promise<void> {
    if (!bannerUrl) return;

    try {
      // Extract filename from URL
      const urlParts = bannerUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      await this.supabaseClient.storage
        .from('user-banners')
        .remove([fileName]);
    } catch (error) {
      logger.error('Error deleting old banner:', { context: [error] });
    }
  }

  /**
   * Update user's banner_url in profiles table
   */
  static async updateProfileBanner(userId: string, bannerUrl: string | null): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient
        .from('profiles')
        .update({ banner_url: bannerUrl })
        .eq('id', userId);

      if (error) {
        logger.error('Error updating profile banner:', { context: [error] });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in updateProfileBanner:', { context: [error] });
      return false;
    }
  }
}
