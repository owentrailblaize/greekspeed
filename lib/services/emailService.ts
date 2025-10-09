import sgMail from '@sendgrid/mail';
import { getEmailBaseUrl } from '@/lib/utils/urlUtils';
import sgClient from '@sendgrid/client';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
sgClient.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface PasswordResetEmail {
  to: string;
  resetLink: string;
  userName: string;
}

export interface WelcomeEmail {
  to: string;
  userName: string;
  chapterName: string;
}

export interface NotificationEmail {
  to: string;
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export interface ChapterAnnouncementEmail {
  to: string;
  firstName: string;
  chapterName: string;
  title: string;
  summary?: string;
  content: string;
  announcementId: string;
  announcementType: 'general' | 'urgent' | 'event' | 'academic';
}

// NEW: Event notification interface
export interface EventNotificationEmail {
  to: string;
  firstName: string;
  chapterName: string;
  eventTitle: string;
  eventDescription?: string;
  eventLocation?: string;
  eventStartTime: string;
  eventEndTime: string;
  eventId: string;
}

// NEW: Connection request notification interface
export interface ConnectionRequestEmail {
  to: string;
  firstName: string;
  chapterName: string;
  actorFirstName: string;
  message?: string;
  connectionId: string;
}

// NEW: Connection accepted notification interface
export interface ConnectionAcceptedEmail {
  to: string;
  firstName: string;
  chapterName: string;
  actorFirstName: string;
  connectionId: string;
}

// NEW: Message notification interface
export interface MessageNotificationEmail {
  to: string;
  firstName: string;
  chapterName: string;
  actorFirstName: string;
  messagePreview: string;
  connectionId: string;
}

// Add these interfaces after line 85 (after MessageNotificationEmail interface)
export interface PasswordChangeConfirmationEmail {
  to: string;
  firstName: string;
  chapterName: string;
  timestamp: string;
  deviceInfo?: string;
}

export interface PasswordResetInstructionsEmail {
  to: string;
  firstName: string;
  chapterName: string;
  resetLink: string;
  timestamp: string;
}

export class EmailService {
  private static fromEmail = process.env.SENDGRID_FROM_EMAIL || 'devin@trailblaize.net';
  private static fromName = process.env.SENDGRID_FROM_NAME || 'GreekSpeed';

  /**
   * Send a chapter announcement email using dynamic template
   */
  static async sendChapterAnnouncement({
    to,
    firstName,
    chapterName,
    title,
    summary,
    content,
    announcementId,
    announcementType
  }: ChapterAnnouncementEmail): Promise<boolean> {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: `Chapter Announcement: ${title}`,
        templateId: process.env.SENDGRID_ANNOUNCEMENT_TEMPLATE_ID!, // Use your new dynamic template ID
        dynamicTemplateData: {
          payload: {
            title: title,
            summary: summary || content.substring(0, 200) + (content.length > 200 ? '...' : ''), // Use content as summary if no summary provided
            announcement_id: announcementId
          },
          recipient: {
            first_name: firstName,
            email: to
          },
          chapter: {
            name: chapterName
          },
          cta: {
            label: 'Read Full Announcement',
            url: 'https://www.trailblaize.net/' 
          },
          unsubscribe: `{{unsubscribe}}`,
          unsubscribe_preferences: `{{unsubscribe_preferences}}`
        }
      };

      await sgMail.send(msg);
      // Chapter announcement email sent successfully
      return true;
    } catch (error) {
      console.error('❌ Failed to send chapter announcement email:', error);
      // Add detailed error logging
      if (error && typeof error === 'object' && 'response' in error) {
        const sgError = error as any;
        console.error('SendGrid Response Body:', JSON.stringify(sgError.response?.body, null, 2));
        console.error('SendGrid Response Headers:', sgError.response?.headers);
      }
      console.error('Error details:', {
        to,
        templateId: process.env.SENDGRID_ANNOUNCEMENT_TEMPLATE_ID,
        fromEmail: this.fromEmail,
        hasApiKey: !!process.env.SENDGRID_API_KEY
      });
      return false;
    }
  }

  /**
   * Send announcement to multiple recipients
   */
  static async sendAnnouncementToChapter(
    recipients: Array<{
      email: string;
      firstName: string;
      chapterName: string;
    }>,
    announcementData: {
      title: string;
      summary?: string;
      content: string;
      announcementId: string;
      announcementType: 'general' | 'urgent' | 'event' | 'academic';
      // priority: 'low' | 'normal' | 'high' | 'urgent';
    }
  ): Promise<{ successful: number; failed: number }> {
    const results = await Promise.allSettled(
      recipients.map(recipient => 
        this.sendChapterAnnouncement({
          to: recipient.email,
          firstName: recipient.firstName,
          chapterName: recipient.chapterName,
          ...announcementData
        })
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.length - successful;

    return { successful, failed };
  }

  /**
   * NEW: Send an event notification email using dynamic template
   */
  static async sendEventNotification({
    to,
    firstName,
    chapterName,
    eventTitle,
    eventDescription,
    eventLocation,
    eventStartTime,
    eventEndTime,
    eventId
  }: EventNotificationEmail): Promise<boolean> {
    try {
      // Format the start time for display
      const startDate = new Date(eventStartTime);
      const endDate = new Date(eventEndTime);
      
      const formatDateTime = (date: Date) => {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });
      };

      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: `New Event: ${eventTitle}`,
        templateId: process.env.SENDGRID_EVENT_TEMPLATE_ID!, // NEW: Event template ID
        dynamicTemplateData: {
          payload: {
            event: {
              title: eventTitle,
              description: eventDescription || '',
              location: eventLocation || '',
              start_at_human: formatDateTime(startDate),
              end_at_human: formatDateTime(endDate),
              event_id: eventId
            }
          },
          recipient: {
            first_name: firstName,
            email: to
          },
          chapter: {
            name: chapterName
          },
          cta: {
            label: 'View Event',
            url: 'https://www.trailblaize.net/' // Link to main app
          },
          unsubscribe: `{{unsubscribe}}`,
          unsubscribe_preferences: `{{unsubscribe_preferences}}`
        }
      };

      await sgMail.send(msg);
      // Event notification email sent successfully
      return true;
    } catch (error) {
      console.error('❌ Failed to send event notification email:', error);
      // Add detailed error logging
      if (error && typeof error === 'object' && 'response' in error) {
        const sgError = error as any;
        console.error('SendGrid Response Body:', JSON.stringify(sgError.response?.body, null, 2));
        console.error('SendGrid Response Headers:', sgError.response?.headers);
      }
      console.error('Error details:', {
        to,
        templateId: process.env.SENDGRID_EVENT_TEMPLATE_ID,
        fromEmail: this.fromEmail,
        hasApiKey: !!process.env.SENDGRID_API_KEY
      });
      return false;
    }
  }

  /**
   * NEW: Send event notification to multiple recipients
   */
  static async sendEventToChapter(
    recipients: Array<{
      email: string;
      firstName: string;
      chapterName: string;
    }>,
    eventData: {
      eventTitle: string;
      eventDescription?: string;
      eventLocation?: string;
      eventStartTime: string;
      eventEndTime: string;
      eventId: string;
    }
  ): Promise<{ successful: number; failed: number }> {
    const results = await Promise.allSettled(
      recipients.map(recipient => 
        this.sendEventNotification({
          to: recipient.email,
          firstName: recipient.firstName,
          chapterName: recipient.chapterName,
          ...eventData
        })
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.length - successful;

    return { successful, failed };
  }

  /**
   * Send a password reset email
   */
  static async sendPasswordResetEmail({ to, resetLink, userName }: PasswordResetEmail): Promise<boolean> {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: 'Reset Your GreekSpeed Password',
        html: this.getPasswordResetTemplate(resetLink, userName),
        text: this.getPasswordResetTextTemplate(resetLink, userName),
      };

      await sgMail.send(msg);
      // Password reset email sent successfully
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Send a welcome email to new users
   */
  static async sendWelcomeEmail({ to, userName, chapterName }: WelcomeEmail): Promise<boolean> {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: `Welcome to GreekSpeed, ${userName}!`,
        html: this.getWelcomeTemplate(userName, chapterName),
        text: this.getWelcomeTextTemplate(userName, chapterName),
      };

      await sgMail.send(msg);
      // Welcome email sent successfully
      return true;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Send a notification email
   */
  static async sendNotificationEmail({ 
    to, 
    userName, 
    title, 
    message, 
    actionUrl, 
    actionText 
  }: NotificationEmail): Promise<boolean> {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: `GreekSpeed: ${title}`,
        html: this.getNotificationTemplate(userName, title, message, actionUrl, actionText),
        text: this.getNotificationTextTemplate(userName, title, message, actionUrl, actionText),
      };

      await sgMail.send(msg);
      // Notification email sent successfully
      return true;
    } catch (error) {
      console.error('❌ Failed to send notification email:', error);
      return false;
    }
  }

  /**
   * Send a custom email
   */
  static async sendCustomEmail({ to, subject, html, text }: EmailTemplate): Promise<boolean> {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject,
        html,
        text,
      };

      await sgMail.send(msg);
      // Custom email sent successfully
      return true;
    } catch (error) {
      console.error('❌ Failed to send custom email:', error);
      return false;
    }
  }

  /**
   * NEW: Send a connection accepted email using dynamic template
   */
  static async sendConnectionAcceptedNotification({
    to,
    firstName,
    chapterName,
    actorFirstName,
    connectionId
  }: ConnectionAcceptedEmail): Promise<boolean> {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: `${actorFirstName} accepted your connection request on Trailblaize`,
        templateId: process.env.SENDGRID_CONNECTION_ACCEPTED_TEMPLATE_ID!,
        dynamicTemplateData: {
          recipient: {
            first_name: firstName,
            email: to
          },
          actor: {
            first_name: actorFirstName
          },
          chapter: {
            name: chapterName
          },
          cta: {
            label: 'View Connection',
            url: `${getEmailBaseUrl()}/dashboard/notifications`
          },
          unsubscribe: `${getEmailBaseUrl()}/unsubscribe?email=${encodeURIComponent(to)}`,
          unsubscribe_preferences: `${getEmailBaseUrl()}/preferences?email=${encodeURIComponent(to)}`
        },
      };

      await sgMail.send(msg);
      // Connection accepted email sent successfully
      return true;
    } catch (error) {
      console.error('Error sending connection accepted email:', error);
      return false;
    }
  }

  /**
   * NEW: Send a connection request email using dynamic template
   */
  static async sendConnectionRequestNotification({
    to,
    firstName,
    chapterName,
    actorFirstName,
    message,
    connectionId
  }: ConnectionRequestEmail): Promise<boolean> {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: `${actorFirstName} wants to connect with you on Trailblaize`,
        templateId: process.env.SENDGRID_CONNECTION_REQUEST_TEMPLATE_ID!,
        dynamicTemplateData: {
          payload: {
            message: message || null
          },
          recipient: {
            first_name: firstName,
            email: to
          },
          actor: {
            first_name: actorFirstName
          },
          chapter: {
            name: chapterName
          },
          cta: {
            label: 'View Request',
            url: `${getEmailBaseUrl()}/dashboard/notifications`
          },
          unsubscribe: `${getEmailBaseUrl()}/unsubscribe?email=${encodeURIComponent(to)}`,
          unsubscribe_preferences: `${getEmailBaseUrl()}/preferences?email=${encodeURIComponent(to)}`
        },
      };

      await sgMail.send(msg);
      // Connection request email sent successfully
      return true;
    } catch (error) {
      console.error('Error sending connection request email:', error);
      return false;
    }
  }

  /**
   * Send a new message email notification using dynamic template
   */
  static async sendMessageNotification({
    to,
    firstName,
    chapterName,
    actorFirstName,
    messagePreview,
    connectionId
  }: MessageNotificationEmail): Promise<boolean> {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: `New message from ${actorFirstName} on Trailblaize`,
        templateId: process.env.SENDGRID_MESSAGE_TEMPLATE_ID!,
        dynamicTemplateData: {
          payload: {
            preview: messagePreview
          },
          recipient: {
            first_name: firstName,
            email: to
          },
          actor: {
            first_name: actorFirstName
          },
          chapter: {
            name: chapterName
          },
          cta: {
            label: 'Open Chat',
            url: `${getEmailBaseUrl()}/dashboard/messages`
          },
          unsubscribe: `${getEmailBaseUrl()}/unsubscribe?email=${encodeURIComponent(to)}`,
          unsubscribe_preferences: `${getEmailBaseUrl()}/preferences?email=${encodeURIComponent(to)}`
        },
      };

      await sgMail.send(msg);
      // Message notification email sent successfully
      return true;
    } catch (error) {
      console.error('Error sending message notification email:', error);
      return false;
    }
  }

  // Email Templates
  private static getPasswordResetTemplate(resetLink: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>GreekSpeed Alumni Network</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset your password for your GreekSpeed account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetLink}" class="button">Reset My Password</a>
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
            <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>© 2024 GreekSpeed. All rights reserved.</p>
            <p>This email was sent from a notification-only address that cannot accept incoming email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getPasswordResetTextTemplate(resetLink: string, userName: string): string {
    return `
      Password Reset Request - GreekSpeed Alumni Network
      
      Hello ${userName},
      
      We received a request to reset your password for your GreekSpeed account.
      
      To reset your password, visit this link:
      ${resetLink}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, please ignore this email or contact support if you have concerns.
      
      ---
      © 2024 GreekSpeed. All rights reserved.
      This email was sent from a notification-only address that cannot accept incoming email.
    `;
  }

  private static getWelcomeTemplate(userName: string, chapterName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GreekSpeed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #1e40af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to GreekSpeed!</h1>
            <p>Your Alumni Network Awaits</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Welcome to GreekSpeed! We're excited to have you join the ${chapterName} alumni network.</p>
            
            <h3>What you can do now:</h3>
            <div class="feature">
              <strong>📱 Complete Your Profile</strong><br>
              Add your professional information, current role, and contact details.
            </div>
            <div class="feature">
              <strong>🔗 Connect with Alumni</strong><br>
              Find and connect with fellow alumni from your chapter and others.
            </div>
            <div class="feature">
              <strong>📢 Stay Updated</strong><br>
              Receive announcements and updates from your chapter.
            </div>
            <div class="feature">
              <strong>💼 Professional Network</strong><br>
              Discover career opportunities and professional connections.
            </div>
            
            <a href="${getEmailBaseUrl()}/dashboard" class="button">Get Started</a>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 GreekSpeed. All rights reserved.</p>
            <p>This email was sent from a notification-only address that cannot accept incoming email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getWelcomeTextTemplate(userName: string, chapterName: string): string {
    return `
      Welcome to GreekSpeed! - Your Alumni Network Awaits
      
      Hello ${userName},
      
      Welcome to GreekSpeed! We're excited to have you join the ${chapterName} alumni network.
      
      What you can do now:
      
      📱 Complete Your Profile
      Add your professional information, current role, and contact details.
      
      🔗 Connect with Alumni
      Find and connect with fellow alumni from your chapter and others.
      
      📢 Stay Updated
      Receive announcements and updates from your chapter.
      
      💼 Professional Network
      Discover career opportunities and professional connections.
      
      Get started: ${getEmailBaseUrl()}/dashboard
      
      If you have any questions, feel free to reach out to our support team.
      
      ---
      © 2024 GreekSpeed. All rights reserved.
      This email was sent from a notification-only address that cannot accept incoming email.
    `;
  }

  private static getNotificationTemplate(
    userName: string, 
    title: string, 
    message: string, 
    actionUrl?: string, 
    actionText?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 ${title}</h1>
            <p>GreekSpeed Alumni Network</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>${message}</p>
            ${actionUrl && actionText ? `<a href="${actionUrl}" class="button">${actionText}</a>` : ''}
            <p>Stay connected with your alumni network!</p>
          </div>
          <div class="footer">
            <p>© 2024 GreekSpeed. All rights reserved.</p>
            <p>This email was sent from a notification-only address that cannot accept incoming email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getNotificationTextTemplate(
    userName: string, 
    title: string, 
    message: string, 
    actionUrl?: string, 
    actionText?: string
  ): string {
    return `
      ${title} - GreekSpeed Alumni Network
      
      Hello ${userName},
      
      ${message}
      
      ${actionUrl && actionText ? `${actionText}: ${actionUrl}` : ''}
      
      Stay connected with your alumni network!
      
      ---
      © 2024 GreekSpeed. All rights reserved.
      This email was sent from a notification-only address that cannot accept incoming email.
    `;
  }

  /**
   * Send event reminder emails to users who haven't RSVP'd
   */
  static async sendEventReminderToChapter(
    recipients: Array<{ email: string; firstName: string; chapterName: string }>,
    eventData: {
      eventTitle: string;
      eventDescription?: string;
      eventLocation?: string;
      eventStartTime: string;
      eventEndTime: string;
      eventId: string;
      startAtRelative?: string;
    }
  ): Promise<{ successful: number; failed: number }> {
    const results = await Promise.allSettled(
      recipients.map(recipient => 
        this.sendEventReminder({
          to: recipient.email,
          firstName: recipient.firstName,
          chapterName: recipient.chapterName,
          ...eventData
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return { successful, failed };
  }

  /**
   * Send individual event reminder email
   */
  static async sendEventReminder({
    to,
    firstName,
    chapterName,
    eventTitle,
    eventDescription,
    eventLocation,
    eventStartTime,
    eventEndTime,
    eventId,
    startAtRelative
  }: {
    to: string;
    firstName: string;
    chapterName: string;
    eventTitle: string;
    eventDescription?: string;
    eventLocation?: string;
    eventStartTime: string;
    eventEndTime: string;
    eventId: string;
    startAtRelative?: string;
  }): Promise<boolean> {
    try {
      const startDate = new Date(eventStartTime);
      const endDate = new Date(eventEndTime);
      
      const formatDateTime = (date: Date) => {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });
      };

      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: `Event Reminder: ${eventTitle}`,
        templateId: process.env.SENDGRID_EVENT_REMINDER_TEMPLATE_ID!,
        dynamicTemplateData: {
          recipient: {
            first_name: firstName
          },
          chapter: {
            name: chapterName
          },
          payload: {
            event: {
              title: eventTitle,
              description: eventDescription || '',
              location: eventLocation || '',
              start_at_human: formatDateTime(startDate),
              start_at_relative: startAtRelative || this.getRelativeTime(startDate)
            }
          },
          cta: {
            url: 'https://www.trailblaize.net'
          },
          unsubscribe: `{{unsubscribe}}`,
          unsubscribe_preferences: `{{unsubscribe_preferences}}`
        }
      };

      await sgMail.send(msg);
      // Event reminder email sent successfully
      return true;
    } catch (error) {
      console.error(`❌ Failed to send event reminder email to: ${to}`, error);
      return false;
    }
  }

  /**
   * Get relative time string (e.g., "in 2 hours", "tomorrow")
   */
  private static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours <= 0) {
        return 'now';
      } else if (diffHours === 1) {
        return 'in 1 hour';
      } else {
        return `in ${diffHours} hours`;
      }
    } else if (diffDays === 1) {
      return 'tomorrow';
    } else {
      return `in ${diffDays} days`;
    }
  }

  /**
   * Send password change confirmation email using dynamic template
   */
  static async sendPasswordChangeConfirmation({
    to,
    firstName,
    chapterName,
    timestamp,
    deviceInfo
  }: PasswordChangeConfirmationEmail): Promise<boolean> {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: '✅ Password Successfully Changed - GreekSpeed',
        templateId: process.env.SENDGRID_PASSWORD_CHANGE_TEMPLATE_ID!,
        dynamicTemplateData: {
          recipient: {
            first_name: firstName,
            email: to
          },
          chapter: {
            name: chapterName
          },
          timestamp: timestamp,
          device_info: deviceInfo || 'Unknown Device',
          dashboard_link: `${getEmailBaseUrl()}/dashboard`
        }
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password change confirmation email:', error);
      return false;
    }
  }

  /**
   * Send password reset instructions email using dynamic template
   */
  static async sendPasswordResetInstructions({
    to,
    firstName,
    chapterName,
    resetLink,
    timestamp
  }: PasswordResetInstructionsEmail): Promise<boolean> {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: 'Reset Your GreekSpeed Password',
        templateId: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID!,
        dynamicTemplateData: {
          recipient: {
            first_name: firstName,
            email: to
          },
          chapter: {
            name: chapterName
          },
          reset_link: resetLink,
          timestamp: timestamp
        }
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset instructions email:', error);
      return false;
    }
  }

  /**
   * Add email to SendGrid global suppression list
   */
  static async addToSuppressionList(email: string): Promise<boolean> {
    try {
      await sgClient.request({
        method: 'POST',
        url: '/v3/suppression/global',
        body: {
          emails: [email]
        }
      });
      console.log(`✅ Added ${email} to SendGrid global suppression list`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to add ${email} to suppression list:`, error);
      return false;
    }
  }

  /**
   * Remove email from SendGrid global suppression list
   */
  static async removeFromSuppressionList(email: string): Promise<boolean> {
    try {
      await sgClient.request({
        method: 'DELETE',
        url: `/v3/suppression/global/${email}`
      });
      console.log(`✅ Removed ${email} from SendGrid global suppression list`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove ${email} from suppression list:`, error);
      return false;
    }
  }

  /**
   * Check if email is in global suppression list
   */
  static async isSuppressed(email: string): Promise<boolean> {
    try {
      const [response] = await sgClient.request({
        method: 'GET',
        url: `/v3/suppression/global/${email}`
      });
      return response.statusCode === 200;
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        return false; // Not suppressed
      }
      console.error(`❌ Error checking suppression status for ${email}:`, error);
      return false;
    }
  }

  /**
   * Sync all users' notification preferences with SendGrid
   */
  static async syncAllUserPreferences(): Promise<void> {
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = createServerSupabaseClient();
      
      // Get all users with their notification settings
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          email,
          notification_settings!left(
            email_enabled,
            announcement_notifications
          )
        `)
        .not('email', 'is', null);

      if (error) {
        console.error('❌ Failed to fetch users:', error);
        return;
      }

      console.log(`🔄 Syncing ${users?.length || 0} users with SendGrid...`);

      for (const user of users || []) {
        const settings = user.notification_settings?.[0];
        const shouldReceiveEmails = settings?.email_enabled && settings?.announcement_notifications;
        
        if (shouldReceiveEmails) {
          await this.removeFromSuppressionList(user.email);
        } else {
          await this.addToSuppressionList(user.email);
        }
      }

      console.log('✅ Sync completed');
    } catch (error) {
      console.error('❌ Error syncing user preferences:', error);
    }
  }
}

