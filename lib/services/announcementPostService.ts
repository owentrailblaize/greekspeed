import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class AnnouncementPostService {
  /**
   * Convert an announcement to a pinned post
   */
  static async createPinnedPostFromAnnouncement(announcement: any): Promise<string | null> {
    try {
      // Create the post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          chapter_id: announcement.chapter_id,
          author_id: announcement.sender_id,
          content: `📢 ${announcement.title}:\n\n${announcement.content}`,
          is_announcement: true,
          announcement_id: announcement.id,
          is_pinned: true,
          pinned_until: announcement.auto_unpin_at || null
        })
        .select('id')
        .single();

      if (postError) {
        console.error('Error creating pinned post:', postError);
        return null;
      }

      // Update the announcement with the post reference
      await supabase
        .from('announcements')
        .update({
          is_pinned_post: true,
          pinned_post_id: post.id
        })
        .eq('id', announcement.id);

      return post.id;
    } catch (error) {
      console.error('Error in createPinnedPostFromAnnouncement:', error);
      return null;
    }
  }

  /**
   * Unpin an announcement post
   */
  static async unpinAnnouncementPost(announcementId: string): Promise<boolean> {
    try {
      // Get the announcement and its post
      const { data: announcement, error: announcementError } = await supabase
        .from('announcements')
        .select('pinned_post_id')
        .eq('id', announcementId)
        .single();

      if (announcementError || !announcement?.pinned_post_id) {
        return false;
      }

      // Unpin the post
      await supabase
        .from('posts')
        .update({
          is_pinned: false,
          pinned_until: null
        })
        .eq('id', announcement.pinned_post_id);

      // Update the announcement
      await supabase
        .from('announcements')
        .update({
          is_pinned_post: false,
          pinned_post_id: null,
          auto_unpin_at: null
        })
        .eq('id', announcementId);

      return true;
    } catch (error) {
      console.error('Error unpinning announcement post:', error);
      return false;
    }
  }

  /**
   * Mark announcement as read and unpin if needed
   */
  static async markAnnouncementAsRead(announcementId: string, userId: string): Promise<boolean> {
    try {
      // Mark as read in announcement_recipients
      await supabase
        .from('announcement_recipients')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('announcement_id', announcementId)
        .eq('recipient_id', userId);

      // Check if this should auto-unpin
      const { data: announcement, error: announcementError } = await supabase
        .from('announcements')
        .select('is_pinned_post, pinned_post_id, auto_unpin_at')
        .eq('id', announcementId)
        .single();

      if (announcementError || !announcement) {
        return false;
      }

      // If it's a pinned post and should auto-unpin, unpin it
      if (announcement.is_pinned_post && announcement.auto_unpin_at) {
        const unpinDate = new Date(announcement.auto_unpin_at);
        if (new Date() >= unpinDate) {
          await this.unpinAnnouncementPost(announcementId);
        }
      }

      return true;
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      return false;
    }
  }
}
