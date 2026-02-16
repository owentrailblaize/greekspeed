import { SupabaseClient } from '@supabase/supabase-js';

export interface CascadeDeleteResult {
  success: boolean;
  userId: string;
  deletions: string[];
  errors: string[];
  message: string;
}

/**
 * Fully cascading user deletion.
 * Removes all child-table rows, storage files, the profile row, and the auth user.
 *
 * @param supabase  A Supabase client initialised with the **service-role key**.
 * @param userId    The `auth.users.id` / `profiles.id` of the user to delete.
 */
export async function cascadeDeleteUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<CascadeDeleteResult> {
  const deletions: string[] = [];
  const errors: string[] = [];

  // ── 0. Verify the user exists ──────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, avatar_url, banner_url')
    .eq('id', userId)
    .single();

  if (!profile) {
    return {
      success: false,
      userId,
      deletions: [],
      errors: ['User not found'],
      message: 'User not found',
    };
  }

  // ── 1. Delete child-table data (children first) ────────
  const deleteOperations: { label: string; exec: () => PromiseLike<{ error: any }> }[] = [
    // Social / feed
    { label: 'comment_likes',   exec: () => supabase.from('comment_likes').delete().eq('user_id', userId) },
    { label: 'post_likes',      exec: () => supabase.from('post_likes').delete().eq('user_id', userId) },
    { label: 'post_comments',   exec: () => supabase.from('post_comments').delete().eq('author_id', userId) },
    { label: 'posts',           exec: () => supabase.from('posts').delete().eq('author_id', userId) },

    // Messaging
    { label: 'messages',        exec: () => supabase.from('messages').delete().eq('sender_id', userId) },

    // Events
    { label: 'event_rsvps',     exec: () => supabase.from('event_rsvps').delete().eq('user_id', userId) },
    { label: 'events',          exec: () => supabase.from('events').delete().eq('created_by', userId) },

    // Announcements
    { label: 'announcement_recipients', exec: () => supabase.from('announcement_recipients').delete().eq('recipient_id', userId) },
    { label: 'announcements',          exec: () => supabase.from('announcements').delete().eq('sender_id', userId) },

    // Dues
    { label: 'dues_assignments', exec: () => supabase.from('dues_assignments').delete().eq('user_id', userId) },

    // Tasks (both directions)
    { label: 'tasks (assignee)', exec: () => supabase.from('tasks').delete().eq('assignee_id', userId) },
    { label: 'tasks (assigner)', exec: () => supabase.from('tasks').delete().eq('assigned_by', userId) },

    // Invitations
    { label: 'invitation_usage', exec: () => supabase.from('invitation_usage').delete().eq('user_id', userId) },
    { label: 'invitations',      exec: () => supabase.from('invitations').delete().eq('created_by', userId) },

    // Recruitment
    { label: 'recruits', exec: () => supabase.from('recruits').delete().eq('submitted_by', userId) },

    // Documents
    { label: 'documents', exec: () => supabase.from('documents').delete().eq('owner_id', userId) },

    // Profile imports
    { label: 'profile_imports', exec: () => supabase.from('profile_imports').delete().eq('user_id', userId) },

    // Connections (both sides)
    { label: 'connections', exec: () => supabase.from('connections').delete().or(`requester_id.eq.${userId},recipient_id.eq.${userId}`) },

    // Alumni record
    { label: 'alumni', exec: () => supabase.from('alumni').delete().eq('user_id', userId) },

    // SMS logs (best-effort — tables may not exist in every env)
    { label: 'sms_logs',              exec: () => supabase.from('sms_logs').delete().eq('sent_by', userId) },
    { label: 'sms_notification_logs', exec: () => supabase.from('sms_notification_logs').delete().eq('user_id', userId) },
  ];

  for (const op of deleteOperations) {
    try {
      const { error } = await op.exec();
      if (error) {
        console.warn(`⚠️  cascade-delete [${op.label}]: ${error.message}`);
        errors.push(`${op.label}: ${error.message}`);
      } else {
        deletions.push(op.label);
      }
    } catch (err) {
      errors.push(`${op.label}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // ── 2. Clean up Supabase Storage ──────────────────────
  await deleteUserStorage(supabase, userId, deletions, errors);

  // ── 3. Delete the profile row ─────────────────────────
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    console.error('❌ Profile deletion error:', profileError);
    errors.push(`profiles: ${profileError.message}`);
  } else {
    deletions.push('profiles');
  }

  // ── 4. Delete the Supabase Auth user (always last) ────
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.error('❌ Auth deletion error:', authError);
    errors.push(`auth: ${authError.message}`);
  } else {
    deletions.push('auth');
  }

  return {
    success: errors.length === 0,
    userId,
    deletions,
    errors,
    message:
      errors.length === 0
        ? 'User and all associated data deleted successfully'
        : 'User deleted with some warnings',
  };
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

async function deleteUserStorage(
  supabase: SupabaseClient,
  userId: string,
  deletions: string[],
  errors: string[],
) {
  const buckets = ['user-avatar', 'user-banners', 'post-images'];

  for (const bucket of buckets) {
    try {
      // Files stored under a userId/ prefix
      const { data: files } = await supabase.storage.from(bucket).list(userId);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from(bucket).remove(paths);
        deletions.push(`storage:${bucket}/${userId}`);
      }

      // Avatars may also be stored at root level as {userId}-{ts}.ext
      if (bucket === 'user-avatar') {
        const { data: rootFiles } = await supabase.storage
          .from(bucket)
          .list('', { search: userId });
        if (rootFiles && rootFiles.length > 0) {
          const rootPaths = rootFiles
            .filter((f) => f.name.startsWith(userId))
            .map((f) => f.name);
          if (rootPaths.length > 0) {
            await supabase.storage.from(bucket).remove(rootPaths);
            deletions.push(`storage:${bucket}/root`);
          }
        }
      }
    } catch (err) {
      errors.push(
        `storage:${bucket}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }
}