import { supabase } from '@/lib/supabase/client';
import { Profile, ProfileFormData, ProfileCompletion } from '@/types/profile';

export class ProfileService {
  // Get current user's profile
  static async getCurrentProfile(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error in getCurrentProfile:', error);
      return null;
    }
  }

  // Update profile
  static async updateProfile(profileData: Partial<ProfileFormData>): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          full_name: profileData.first_name && profileData.last_name 
            ? `${profileData.first_name} ${profileData.last_name}` 
            : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return null;
    }
  }

  // Upload avatar
  static async uploadAvatar(file: File): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await this.updateProfile({ avatar_url: publicUrl });

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
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