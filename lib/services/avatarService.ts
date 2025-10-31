import { supabase } from '@/lib/supabase/client';
import { logger } from "@/lib/utils/logger";

export class AvatarService {
  private static supabaseClient = supabase;

  /**
   * Upload avatar image to Supabase Storage
   */
  static async uploadAvatar(file: File, userId: string): Promise<string | null> {
    try {
      // Validate file type more strictly
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        logger.error('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
        return null;
      }

      // Generate unique filename with proper extension
      let fileExt = 'jpg'; // Default to jpg
      if (file.type === 'image/png') fileExt = 'png';
      else if (file.type === 'image/gif') fileExt = 'gif';
      
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;
      
      // Uploading file

      // Upload file to Supabase Storage
      const { data, error } = await this.supabaseClient.storage
        .from('user-avatar')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        logger.error('Error uploading avatar:', { context: [error] });
        return null;
      }

      // Get public URL
      const { data: urlData } = this.supabaseClient.storage
        .from('user-avatar')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      logger.error('Error in uploadAvatar:', { context: [error] });
      return null;
    }
  }

  /**
   * Delete old avatar if it exists
   */
  static async deleteOldAvatar(avatarUrl: string | null): Promise<void> {
    if (!avatarUrl) return;

    try {
      // Extract just the filename from URL
      const urlParts = avatarUrl.split('/');
      const fileName = urlParts[urlParts.length - 1]; // Get just the filename

      // Delete from storage
      await this.supabaseClient.storage
        .from('user-avatar')
        .remove([fileName]);
    } catch (error) {
      logger.error('Error deleting old avatar:', { context: [error] });
    }
  }

  /**
   * Update user's avatar_url in profiles table
   */
  static async updateProfileAvatar(userId: string, avatarUrl: string | null): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

      if (error) {
        logger.error('Error updating profile avatar:', { context: [error] });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in updateProfileAvatar:', { context: [error] });
      return false;
    }
  }
}
