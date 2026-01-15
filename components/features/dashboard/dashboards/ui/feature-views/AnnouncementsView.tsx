'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Megaphone, Send, Mail, Smartphone } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import { CreateAnnouncementData } from '@/types/announcements';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/supabase/auth-context';

export function AnnouncementsView() {
  const { profile } = useProfile();
  const { session } = useAuth();
  const chapterId = profile?.chapter_id;
  const { createAnnouncement, loading: announcementsLoading } = useAnnouncements(chapterId || null);
  
  const [announcement, setAnnouncement] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementType, setAnnouncementType] = useState<'general' | 'urgent' | 'event' | 'academic'>('general');
  // Separate SMS toggles so execs can explicitly choose members vs alumni audiences
  const [sendSmsToMembers, setSendSmsToMembers] = useState(false);
  const [sendSmsToAlumni, setSendSmsToAlumni] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailRecipientCount, setEmailRecipientCount] = useState<number | null>(null);
  const [memberSmsRecipientCount, setMemberSmsRecipientCount] = useState<number | null>(null);
  const [alumniSmsRecipientCount, setAlumniSmsRecipientCount] = useState<number | null>(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  useEffect(() => {
    // Preserve existing behavior: auto-enable member SMS for urgent
    setSendSmsToMembers(announcementType === 'urgent');
    // Alumni SMS starts off opt-in for clarity
    setSendSmsToAlumni(false);
  }, [announcementType]);

  useEffect(() => {
    const fetchRecipientCounts = async () => {
      if (!chapterId || !session?.access_token) return;
      
      setLoadingRecipients(true);
      try {
        const response = await fetch(
          `/api/announcements/recipient-counts?chapter_id=${chapterId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setEmailRecipientCount(data.email_recipients);
          // Maintain existing behavior for member SMS counts
          setMemberSmsRecipientCount(data.sms_recipients);
          // New alumni-specific SMS count, falls back to 0 if not present
          setAlumniSmsRecipientCount(
            typeof data.alumni_sms_recipients === 'number'
              ? data.alumni_sms_recipients
              : null
          );
        }
      } catch (error) {
        console.error('Error fetching recipient counts:', error);
      } finally {
        setLoadingRecipients(false);
      }
    };

    fetchRecipientCounts();
  }, [chapterId, session?.access_token]);

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcement.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      const announcementData: CreateAnnouncementData = {
        title: announcementTitle.trim(),
        content: announcement.trim(),
        announcement_type: announcementType,
        // Existing behavior: member/admin SMS
        send_sms: sendSmsToMembers,
        // New: alumni SMS flag so backend can target alumni separately
        send_sms_to_alumni: sendSmsToAlumni,
        metadata: {}
      };

      await createAnnouncement(announcementData);
      
      // Reset form
      setAnnouncement("");
      setAnnouncementTitle("");
      setAnnouncementType('general');
      setSendSmsToMembers(false);
      setSendSmsToAlumni(false);
      
      toast.success('Announcement sent successfully!');
    } catch (error) {
      toast.error('Failed to send announcement');
      console.error('Error sending announcement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Megaphone className="h-5 w-5 text-purple-600" />
          <span>Chapter Announcements</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Announcement title..."
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
            className="md:col-span-2"
          />
          <Select 
            value={announcementType} 
            onValueChange={(value: string) => setAnnouncementType(value as 'general' | 'urgent' | 'event' | 'academic')}
          >
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="academic">Academic</SelectItem>
          </Select>
        </div>
        
        <Textarea
          placeholder="Write a chapter announcement..."
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          className="min-h-[120px]"
        />
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-3 flex-1">
            {/* Member SMS toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-sms-members"
                checked={sendSmsToMembers}
                onCheckedChange={(checked) => setSendSmsToMembers(checked as boolean)}
              />
              <Label htmlFor="send-sms-members" className="text-sm cursor-pointer">
                Send SMS to active members
              </Label>
            </div>

            {/* Alumni SMS toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-sms-alumni"
                checked={sendSmsToAlumni}
                onCheckedChange={(checked) => setSendSmsToAlumni(checked as boolean)}
              />
              <Label htmlFor="send-sms-alumni" className="text-sm cursor-pointer">
                Send SMS to alumni
              </Label>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1 pl-1">
              {emailRecipientCount !== null && (
                <p className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email will be sent to <span className="font-medium">{emailRecipientCount}</span> {emailRecipientCount === 1 ? 'member' : 'members'} with email notifications enabled
                </p>
              )}
              {sendSmsToMembers && memberSmsRecipientCount !== null && (
                <p className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  SMS will be sent to <span className="font-medium">{memberSmsRecipientCount}</span> {memberSmsRecipientCount === 1 ? 'member' : 'members'} with SMS consent
                </p>
              )}
              {sendSmsToAlumni && alumniSmsRecipientCount !== null && (
                <p className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  SMS will be sent to <span className="font-medium">{alumniSmsRecipientCount}</span> {alumniSmsRecipientCount === 1 ? 'alumni' : 'alumni'} with SMS consent
                </p>
              )}
              {loadingRecipients && (
                <p className="text-gray-400">Loading recipient counts...</p>
              )}
            </div>
          </div>
          
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleSendAnnouncement}
            disabled={isSubmitting || announcementsLoading}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Announcement'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

