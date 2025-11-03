export type EventStatus = 'draft' | 'published' | 'cancelled';
export type RSVPStatus = 'attending' | 'maybe' | 'not_attending';

export interface Event {
  id: string;
  chapter_id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
  budget_label?: string;
  budget_amount?: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  attendee_count?: number;
  maybe_count?: number;
  not_attending_count?: number;
}

export interface EventWithRSVPs extends Event {
  attendee_count: number;
  maybe_count: number;
  not_attending_count: number;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: RSVPStatus;
  responded_at: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  budget_label?: string;
  budget_amount?: number;
  send_sms?: boolean;
  created_by?: string;
  updated_by?: string;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: EventStatus;
  updated_by?: string;
}

export interface RSVPRequest {
  status: RSVPStatus;
}

// For display purposes
export interface EventDisplay {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
  budget_label?: string;
  budget_amount?: number;
  attendee_count: number;
  maybe_count: number;
  not_attending_count: number;
  formatted_date: string;
  formatted_time: string;
}
