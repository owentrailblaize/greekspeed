import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapter_id');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Get basic invitation counts
    const { count: totalInvitations } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId);
    
    const { count: activeInvitations } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId)
      .eq('is_active', true);
    
    // Get total usage count
    const { data: invitationIds } = await supabase
      .from('invitations')
      .select('id')
      .eq('chapter_id', chapterId);

    const { count: totalUsage } = await supabase
      .from('invitation_usage')
      .select('*', { count: 'exact', head: true })
      .in('invitation_id', invitationIds?.map(inv => inv.id) || []);
    
    // Get pending approvals (users who used invitations but haven't been approved yet)
    const { count: pendingApprovals } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId)
      .eq('role', 'active_member')
      .eq('member_status', 'probation');
    
    return NextResponse.json({
      total_invitations: totalInvitations || 0,
      active_invitations: activeInvitations || 0,
      total_usage: totalUsage || 0,
      pending_approvals: pendingApprovals || 0
    });
  } catch (error) {
    logger.error('Error getting invitation stats:', { context: [error] });
    return NextResponse.json({ error: 'Failed to get invitation stats' }, { status: 500 });
  }
}