'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Megaphone, Send, Mail, Smartphone, X } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import { CreateAnnouncementData } from '@/types/announcements';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/supabase/auth-context';
import { useEffect } from 'react';

export function SendAnnouncementButton() {
  const { profile } = useProfile();
  const { session } = useAuth();
  const chapterId = profile?.chapter_id;
  const { createAnnouncement, loading: announcementsLoading } = useAnnouncements(chapterId || null);
  
  const [showModal, setShowModal] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementType, setAnnouncementType] = useState<'general' | 'urgent' | 'event' | 'academic'>('general');
  const [sendSMS, setSendSMS] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailRecipientCount, setEmailRecipientCount] = useState<number | null>(null);
  const [smsRecipientCount, setSmsRecipientCount] = useState<number | null>(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Auto-set SMS for urgent announcements
  useEffect(() => {
    setSendSMS(announcementType === 'urgent');
  }, [announcementType]);

  // Fetch recipient counts when modal opens
  useEffect(() => {
    const fetchRecipientCounts = async () => {
      if (!chapterId || !session?.access_token || !showModal) return;
      
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
          setSmsRecipientCount(data.sms_recipients);
        }
      } catch (error) {
        console.error('Error fetching recipient counts:', error);
      } finally {
        setLoadingRecipients(false);
      }
    };

    fetchRecipientCounts();
  }, [chapterId, session?.access_token, showModal]);

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
        send_sms: sendSMS,
        metadata: {}
      };

      await createAnnouncement(announcementData);
      
      // Reset form
      setAnnouncement("");
      setAnnouncementTitle("");
      setAnnouncementType('general');
      setSendSMS(false);
      setShowModal(false);
      
      toast.success('Announcement sent successfully!');
    } catch (error) {
      toast.error('Failed to send announcement');
      console.error('Error sending announcement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Modern Minimalistic Widget */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full group relative overflow-hidden rounded-full bg-gradient-to-r from-navy-600 to-blue-600 hover:from-navy-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]"
      >
        {/* Subtle shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        
        <div className="relative flex items-center justify-center gap-2 px-4 py-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm">
            <Megaphone className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-medium text-sm">Send Announcement</span>
        </div>
      </button>

      {/* Modal - Enhanced Design */}
      {showModal && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowModal(false)} 
          />
          <div className="relative flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-r from-navy-600 to-blue-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Megaphone className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Send Announcement</h3>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Announcement title..."
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full border-gray-200 focus:border-navy-500 focus:ring-navy-500"
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
                  className="min-h-[120px] w-full border-gray-200 focus:border-navy-500 focus:ring-navy-500 resize-none"
                />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id="send-sms-notification"
                      checked={sendSMS}
                      onCheckedChange={(checked) => setSendSMS(checked as boolean)}
                    />
                    <Label htmlFor="send-sms-notification" className="text-sm cursor-pointer font-medium">
                      Send SMS notification
                    </Label>
                  </div>
                  
                  {/* Notification disclaimers - More compact */}
                  <div className="text-xs text-gray-500 space-y-1 pl-1 pt-2 border-t border-gray-100">
                    {emailRecipientCount !== null && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span>Email: <span className="font-medium text-gray-700">{emailRecipientCount}</span> {emailRecipientCount === 1 ? 'recipient' : 'recipients'}</span>
                      </p>
                    )}
                    {sendSMS && smsRecipientCount !== null && (
                      <p className="flex items-center gap-1.5">
                        <Smartphone className="h-3 w-3 text-gray-400" />
                        <span>SMS: <span className="font-medium text-gray-700">{smsRecipientCount}</span> {smsRecipientCount === 1 ? 'recipient' : 'recipients'}</span>
                      </p>
                    )}
                    {loadingRecipients && (
                      <p className="text-gray-400">Loading recipient counts...</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 pt-2">
                  <Button 
                    className="bg-gradient-to-r from-navy-600 to-blue-600 hover:from-navy-700 hover:to-blue-700 w-full shadow-md"
                    onClick={handleSendAnnouncement}
                    disabled={isSubmitting || announcementsLoading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Announcement'}
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full border-gray-200 hover:bg-gray-50"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
