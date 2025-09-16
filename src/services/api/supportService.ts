import { supabase } from '@/config/supabase';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: 'bug' | 'feature_request' | 'account' | 'billing' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  admin_notes?: string;
  attachments?: string[];
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_from_support: boolean;
  attachments?: string[];
  created_at: string;
}

/**
 * Support Service - Manages support tickets and messages
 */
class SupportService {
  /**
   * Create a new support ticket
   */
  async createTicket(ticket: {
    subject: string;
    description: string;
    category: SupportTicket['category'];
    priority: SupportTicket['priority'];
    attachments?: string[];
  }): Promise<SupportTicket> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: 'open',
        attachments: ticket.attachments || [],
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create support ticket');
    return data;
  }

  /**
   * Get user's support tickets
   */
  async getUserTickets(userId: string, page = 1, limit = 20): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific support ticket
   */
  async getTicket(ticketId: string): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Support ticket not found');
    return data;
  }

  /**
   * Update a support ticket
   */
  async updateTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update support ticket');
    return data;
  }

  /**
   * Add a message to a support ticket
   */
  async addMessage(ticketId: string, message: string, attachments?: string[]): Promise<SupportMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        message,
        is_from_support: false,
        attachments: attachments || [],
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to add message');
    return data;
  }

  /**
   * Get messages for a support ticket
   */
  async getTicketMessages(ticketId: string): Promise<SupportMessage[]> {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Close a support ticket
   */
  async closeTicket(ticketId: string): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status: 'closed',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (error) throw error;
  }

  /**
   * Reopen a support ticket
   */
  async reopenTicket(ticketId: string): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status: 'open',
        resolved_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (error) throw error;
  }

  /**
   * Get support statistics
   */
  async getSupportStats(userId: string): Promise<{
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    averageResponseTime: number;
  }> {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('status, created_at, resolved_at')
      .eq('user_id', userId);

    if (error) throw error;

    const totalTickets = tickets?.length || 0;
    const openTickets = tickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0;
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;

    // Calculate average response time (simplified)
    const averageResponseTime = 24; // hours

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      averageResponseTime,
    };
  }

  /**
   * Subscribe to ticket updates
   */
  subscribeToTicketUpdates(ticketId: string, callback: (ticket: SupportTicket) => void) {
    return supabase
      .channel('ticket-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets',
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          callback(payload.new as SupportTicket);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to new messages
   */
  subscribeToMessages(ticketId: string, callback: (message: SupportMessage) => void) {
    return supabase
      .channel('support-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          callback(payload.new as SupportMessage);
        }
      )
      .subscribe();
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscription: any) {
    supabase.removeChannel(subscription);
  }
}

// Export singleton instance
export const supportService = new SupportService();