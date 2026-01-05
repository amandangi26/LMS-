
import { createClient } from '@supabase/supabase-js';
import { Member, Resource, Payment, AccessLog, AttendanceLog, Notice, ProgressEntry } from '../types';

// Detect environment variables from import.meta.env (Vite)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vtysxdqqgbqbremdcvce.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create client only if key is available
export const isDbConfigured = SUPABASE_ANON_KEY.length > 0 &&
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
  SUPABASE_ANON_KEY !== 'public-anon-key-placeholder';

export const supabase = isDbConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const handleError = (error: any, context: string) => {
  const message = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
  console.warn(`Database Sync Notice [${context}]:`, message);
  throw new Error(message);
};

export const dbService = {
  // Members
  async getMembers(): Promise<Member[]> {
    if (!supabase) throw new Error("Cloud Database Not Configured");
    const { data, error } = await supabase
      .from('members')
      .select('*, progress(*)');

    if (error) return handleError(error, 'getMembers');

    return (data || []).map(m => ({
      ...m,
      fatherName: m.father_name,
      seatNo: m.seat_no,
      batchTime: m.batch_time,
      joinDate: m.join_date,
      membershipStatus: m.membership_status,
      progress: m.progress?.map((p: any) => ({
        id: p.id,
        date: p.date,
        score: p.score,
        subject: p.subject
      })) || []
    }));
  },

  async upsertMember(member: Partial<Member>) {
    if (!supabase) {
      console.error("Database Client not initialized");
      return null;
    }

    // Prepare payload
    const dbPayload: any = {
      name: member.name,
      father_name: member.fatherName,
      address: member.address,
      phone: member.phone,
      seat_no: member.seatNo,
      batch_time: member.batchTime,
      fee: member.fee,
      dues: member.dues,
      join_date: member.joinDate,
      membership_status: member.membershipStatus,
      email: member.email
    };

    // If ID exists, include it (Update/Upsert)
    if (member.id && !member.id.startsWith('mem-')) {
      dbPayload.id = member.id;
    }

    console.log("Saving Member Payload:", dbPayload);

    let result;
    if (dbPayload.id) {
      // Update existing
      result = await supabase.from('members').upsert(dbPayload).select();
    } else {
      // Insert new
      result = await supabase.from('members').insert([dbPayload]).select();
    }

    const { data, error } = result;

    if (error) {
      console.error("Supabase Save Error:", error);
      return handleError(error, 'upsertMember');
    }

    console.log("Supabase Save Success:", data);
    return data ? data[0] : null;
  },

  async deleteMember(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) return handleError(error, 'deleteMember');
  },

  // Resources
  async getResources(): Promise<Resource[]> {
    if (!supabase) throw new Error("Cloud Database Not Configured");
    const { data, error } = await supabase.from('resources').select('*');
    if (error) return handleError(error, 'getResources');
    return (data || []).map(r => ({
      ...r,
      accessUrl: r.access_url
    }));
  },

  async addResource(resource: Omit<Resource, 'id'>) {
    if (!supabase) return null;
    const { data, error } = await supabase.from('resources').insert([{
      title: resource.title,
      author: resource.author,
      category: resource.category,
      subject: resource.subject,
      type: resource.type,
      access_url: resource.accessUrl,
      description: resource.description
    }]).select();
    if (error) return handleError(error, 'addResource');
    return data ? data[0] : null;
  },

  async deleteResource(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) return handleError(error, 'deleteResource');
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    if (!supabase) throw new Error("Cloud Database Not Configured");
    const { data, error } = await supabase.from('payments').select('*');
    if (error) return handleError(error, 'getPayments');
    return (data || []).map(p => ({
      ...p,
      memberId: p.member_id,
      paymentMethod: p.payment_method
    }));
  },

  async addPayment(payment: Omit<Payment, 'id'>) {
    if (!supabase) return null;
    const { data, error } = await supabase.from('payments').insert([{
      member_id: payment.memberId,
      amount: payment.amount,
      date: payment.date,
      reason: payment.reason,
      payment_method: payment.paymentMethod
    }]).select();
    if (error) return handleError(error, 'addPayment');
    return data ? data[0] : null;
  },

  // Progress
  async addProgress(memberId: string, entry: ProgressEntry) {
    if (!supabase) return null;
    const { data, error } = await supabase.from('progress').insert([{
      member_id: memberId,
      date: entry.date,
      score: entry.score,
      subject: entry.subject
    }]).select();
    if (error) return handleError(error, 'addProgress');
    return data ? data[0] : null;
  },

  // Attendance
  async getAttendance(): Promise<AttendanceLog[]> {
    if (!supabase) throw new Error("Cloud Database Not Configured");
    const { data, error } = await supabase.from('attendance').select('*');
    if (error) return handleError(error, 'getAttendance');
    return (data || []).map(a => ({
      ...a,
      memberId: a.member_id,
      checkIn: a.check_in,
      checkOut: a.check_out
    }));
  },

  async upsertAttendance(log: AttendanceLog) {
    if (!supabase) return null;
    const isTempId = log.id.startsWith('att-');
    const { data, error } = await supabase.from('attendance').upsert({
      id: isTempId ? undefined : log.id,
      member_id: log.memberId,
      check_in: log.checkIn,
      check_out: log.checkOut,
      status: log.status
    }).select();
    if (error) return handleError(error, 'upsertAttendance');
    return data ? data[0] : null;
  },

  async archiveMember(id: string, reason: string) {
    if (!supabase) return null;
    const { error } = await supabase.from('members').update({
      status: 'Archived',
      archive_reason: reason,
      archived_at: new Date().toISOString()
    }).eq('id', id);
    if (error) return handleError(error, 'archiveMember');
    return true;
  },

  async restoreMember(id: string) {
    if (!supabase) return null;
    const { error } = await supabase.from('members').update({
      status: 'Active',
      archive_reason: null,
      archived_at: null
    }).eq('id', id);
    if (error) return handleError(error, 'restoreMember');
    return true;
  },

  // Notices
  async getNotices(): Promise<Notice[]> {
    if (!supabase) throw new Error("Cloud Database Not Configured");
    const { data, error } = await supabase.from('notices').select('*');
    if (error) return handleError(error, 'getNotices');
    return data || [];
  }
};
