import { supabase } from '@/lib/supabase/client';
import { Profile, ProfileFormData, ProfileCompletion } from '@/types/profile';
import { logger } from "@/lib/utils/logger";

export class ProfileService {
  // Get current user's profile
  static async getCurrentProfile(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          chapters!left(name)
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        logger.error('Error fetching profile:', { context: [error] });
        return null;
      }

      // Transform the data to include chapter name
      if (profile) {
        profile.chapter = profile.chapters?.name || null;
        delete profile.chapters; // Remove the nested chapters object
      }

      return profile;
    } catch (error) {
      logger.error('Error in getCurrentProfile:', { context: [error] });
      return null;
    }
  }

  // Update profile
  static async updateProfile(profileData: Partial<ProfileFormData>): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Prepare the update data, handling special cases
      const updateData: any = {
        ...profileData,
        updated_at: new Date().toISOString()
      };

      // Handle first_name and last_name updates
      if (profileData.first_name || profileData.last_name) {
        const currentProfile = await this.getCurrentProfile();
        const firstName = profileData.first_name || currentProfile?.first_name || '';
        const lastName = profileData.last_name || currentProfile?.last_name || '';
        
        updateData.first_name = firstName;
        updateData.last_name = lastName;
        updateData.full_name = `${firstName} ${lastName}`.trim();
      }

      // Remove undefined values to avoid overwriting with null
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Updating profile with data

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select(`
          *,
          chapters!left(name)
        `)
        .single();

      if (error) {
        logger.error('Error updating profile:', { context: [error] });
        throw error;
      }

      // Transform the data to include chapter name
      if (profile) {
        profile.chapter = profile.chapters?.name || null;
        delete profile.chapters; // Remove the nested chapters object
      }

      // Profile updated successfully
      return profile;
    } catch (error) {
      logger.error('Error in updateProfile:', { context: [error] });
      throw error;
    }
  }

  // Upload avatar
  static async uploadAvatar(file: File): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;  // Changed: user ID as folder

      const { error: uploadError } = await supabase.storage
        .from('user-avatar')  // Changed: correct bucket name
        .upload(filePath, file);

      if (uploadError) {
        logger.error('Error uploading avatar:', { context: [uploadError] });
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatar')  // Changed: correct bucket name
        .getPublicUrl(filePath);

      await this.updateProfile({ avatar_url: publicUrl });

      return publicUrl;
    } catch (error) {
      logger.error('Error in uploadAvatar:', { context: [error] });
      return null;
    }
  }

  // Calculate profile completion
  static calculateCompletion(profile: Profile): ProfileCompletion {
    const requiredFields = ['first_name', 'last_name', 'chapter', 'role'];
    const optionalFields = ['bio', 'phone', 'location', 'avatar_url'];
    const allFields = [...requiredFields, ...optionalFields];

    const completedFields = allFields.filter(field => {
      const value = profile[field as keyof Profile];
      return value !== null && value !== undefined && value !== '';
    }).length;

    const missingFields = allFields.filter(field => {
      const value = profile[field as keyof Profile];
      return value === null || value === undefined || value === '';
    });

    return {
      totalFields: allFields.length,
      completedFields,
      percentage: Math.round((completedFields / allFields.length) * 100),
      missingFields
    };
  }
} 