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
import { useScopedChapterId } from '@/lib/hooks/useScopedChapterId';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import { CreateAnnouncementData } from '@/types/announcements';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/supabase/auth-context';
import { useEffect } from 'react';

export function SendAnnouncementButton() {
  const { profile } = useProfile();
  const { session } = useAuth();
  const chapterId = useScopedChapterId();
  const { createAnnouncement, loading: announcementsLoading } = useAnnouncements(chapterId || null);
  
  const [showModal, setShowModal] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementType, setAnnouncementType] = useState<'general' | 'urgent' | 'event' | 'academic'>('general');
  // Separate toggles so execs can optionally include alumni
  const [sendSmsToMembers, setSendSmsToMembers] = useState(false);
  const [sendSmsToAlumni, setSendSmsToAlumni] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailRecipientCount, setEmailRecipientCount] = useState<number | null>(null);
  const [memberSmsRecipientCount, setMemberSmsRecipientCount] = useState<number | null>(null);
  const [alumniSmsRecipientCount, setAlumniSmsRecipientCount] = useState<number | null>(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Auto-set SMS for urgent announcements
  useEffect(() => {
    // Preserve existing behavior: urgent auto-enables member SMS
    setSendSmsToMembers(announcementType === 'urgent');
    // Alumni SMS starts as opt-in per announcement
    setSendSmsToAlumni(false);
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
          // Existing member/admin SMS count
          setMemberSmsRecipientCount(data.sms_recipients);
          // Alumni SMS count if provided by API
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
        // Existing member/admin SMS behavior
        send_sms: sendSmsToMembers,
        // New alumni SMS behavior
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
        className="w-full group relative overflow-hidden rounded-full sm:hidden transition-all duration-300 bg-brand-primary hover:bg-brand-primary-hover"
        style={{
          boxShadow: `
            0 8px 16px rgba(0, 0, 0, 0.25),
            0 4px 8px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* Inner glow effect - darker */}
        <div 
          className="absolute inset-0 rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent 70%)',
          }}
        />
        
        {/* Subtle shimmer effect on hover - darker */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        
        <div className="relative flex items-center justify-center gap-2 px-4 py-3 z-10">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
            <Megaphone 
              className="h-4 w-4 text-white drop-shadow-lg transition-transform duration-200 group-hover:scale-110" 
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
              }}
            />
          </div>
          <span className="text-white font-medium text-sm drop-shadow-lg">Send Announcement</span>
        </div>

        {/* Hover shine effect - darker */}
        <div 
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.3), transparent 60%)',
          }}
        />
      </button>

      {/* Desktop version - keep original styling */}
      <button
        onClick={() => setShowModal(true)}
        className="hidden sm:block w-full group relative overflow-hidden rounded-full bg-gradient-to-r from-brand-primary to-brand-accent hover:from-brand-primary-hover hover:to-brand-accent transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]"
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

      {/* Modal - Responsive (Mobile Bottom Drawer / Desktop Centered) */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)} 
          />
          
          {/* Mobile: Bottom Drawer */}
          <div className="fixed inset-0 z-[9999] sm:hidden flex items-end justify-center p-0">
            <div className="relative bg-white shadow-xl w-full flex flex-col max-h-[85dvh] mt-[15dvh] rounded-t-2xl rounded-b-none pb-[env(safe-area-inset-bottom)]">
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-r from-brand-primary to-brand-accent p-4 flex-shrink-0">
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
              
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Announcement title..."
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full border-gray-200 focus:border-brand-primary focus:ring-brand-primary"
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
                  className="min-h-[120px] w-full border-gray-200 focus:border-brand-primary focus:ring-brand-primary resize-none"
                />
                
                <div className="space-y-3">
                  {/* Member SMS toggle */}
                  <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id="send-sms-members-mobile"
                      checked={sendSmsToMembers}
                      onCheckedChange={(checked) => setSendSmsToMembers(checked as boolean)}
                    />
                    <Label htmlFor="send-sms-members-mobile" className="text-sm cursor-pointer font-medium">
                      Send SMS to active members
                    </Label>
                  </div>

                  {/* Alumni SMS toggle */}
                  <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id="send-sms-alumni-mobile"
                      checked={sendSmsToAlumni}
                      onCheckedChange={(checked) => setSendSmsToAlumni(checked as boolean)}
                    />
                    <Label htmlFor="send-sms-alumni-mobile" className="text-sm cursor-pointer font-medium">
                      Send SMS to alumni
                    </Label>
                  </div>
                  
                  {/* Notification disclaimers */}
                  <div className="text-xs text-gray-500 space-y-1 pl-1 pt-2 border-t border-gray-100">
                    {emailRecipientCount !== null && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span>Email: <span className="font-medium text-gray-700">{emailRecipientCount}</span> {emailRecipientCount === 1 ? 'recipient' : 'recipients'}</span>
                      </p>
                    )}
                    {sendSmsToMembers && memberSmsRecipientCount !== null && (
                      <p className="flex items-center gap-1.5">
                        <Smartphone className="h-3 w-3 text-gray-400" />
                        <span>SMS to members: <span className="font-medium text-gray-700">{memberSmsRecipientCount}</span> {memberSmsRecipientCount === 1 ? 'recipient' : 'recipients'}</span>
                      </p>
                    )}
                    {sendSmsToAlumni && alumniSmsRecipientCount !== null && (
                      <p className="flex items-center gap-1.5">
                        <Smartphone className="h-3 w-3 text-gray-400" />
                        <span>SMS to alumni: <span className="font-medium text-gray-700">{alumniSmsRecipientCount}</span> {alumniSmsRecipientCount === 1 ? 'recipient' : 'recipients'}</span>
                      </p>
                    )}
                    {loadingRecipients && (
                      <p className="text-gray-400">Loading recipient counts...</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex flex-col space-y-2 flex-shrink-0 border-t border-gray-200 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
                <Button 
                  className="w-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent hover:from-brand-primary-hover hover:to-brand-accent shadow-lg shadow-brand-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSendAnnouncement}
                  disabled={isSubmitting || announcementsLoading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Announcement'}
                </Button>
                <Button 
                  variant="outline"
                  className="w-full rounded-full bg-white/80 backdrop-blur-md border border-brand-primary/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-brand-primary-hover hover:text-primary-900 transition-all duration-300"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop: Centered Modal */}
          <div className="hidden sm:flex fixed inset-0 z-[9999] items-center justify-center p-4">
            <div className="relative bg-white shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden">
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-r from-brand-primary to-brand-accent p-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Megaphone className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Send Announcement</h3>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Announcement title..."
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full border-gray-200 focus:border-brand-primary focus:ring-brand-primary"
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
                  className="min-h-[150px] w-full border-gray-200 focus:border-brand-primary focus:ring-brand-primary resize-none"
                />
                
                <div className="space-y-4">
                  {/* Member SMS toggle */}
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id="send-sms-members-desktop"
                      checked={sendSmsToMembers}
                      onCheckedChange={(checked) => setSendSmsToMembers(checked as boolean)}
                    />
                    <Label htmlFor="send-sms-members-desktop" className="text-sm cursor-pointer font-medium">
                      Send SMS to active members
                    </Label>
                  </div>

                  {/* Alumni SMS toggle */}
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id="send-sms-alumni-desktop"
                      checked={sendSmsToAlumni}
                      onCheckedChange={(checked) => setSendSmsToAlumni(checked as boolean)}
                    />
                    <Label htmlFor="send-sms-alumni-desktop" className="text-sm cursor-pointer font-medium">
                      Send SMS to alumni
                    </Label>
                  </div>
                  
                  {/* Notification disclaimers */}
                  <div className="text-sm text-gray-600 space-y-2 pl-1 pt-3 border-t border-gray-200">
                    {emailRecipientCount !== null && (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>Email: <span className="font-medium text-gray-700">{emailRecipientCount}</span> {emailRecipientCount === 1 ? 'recipient' : 'recipients'}</span>
                      </p>
                    )}
                    {sendSmsToMembers && memberSmsRecipientCount !== null && (
                      <p className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-gray-400" />
                        <span>SMS to members: <span className="font-medium text-gray-700">{memberSmsRecipientCount}</span> {memberSmsRecipientCount === 1 ? 'recipient' : 'recipients'}</span>
                      </p>
                    )}
                    {sendSmsToAlumni && alumniSmsRecipientCount !== null && (
                      <p className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-gray-400" />
                        <span>SMS to alumni: <span className="font-medium text-gray-700">{alumniSmsRecipientCount}</span> {alumniSmsRecipientCount === 1 ? 'recipient' : 'recipients'}</span>
                      </p>
                    )}
                    {loadingRecipients && (
                      <p className="text-gray-400">Loading recipient counts...</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex flex-row-reverse gap-3 flex-shrink-0 border-t border-gray-200 p-6">
                <Button 
                  className="rounded-full bg-gradient-to-r from-brand-primary to-brand-accent hover:from-brand-primary-hover hover:to-brand-accent shadow-lg shadow-brand-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSendAnnouncement}
                  disabled={isSubmitting || announcementsLoading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Announcement'}
                </Button>
                <Button 
                  variant="outline"
                  className="rounded-full bg-white border border-brand-primary/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 text-brand-primary-hover hover:text-primary-900 transition-all duration-300"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
