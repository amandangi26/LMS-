
import { createClient } from '@supabase/supabase-js';
import { Member, Resource, Payment, AccessLog, AttendanceLog, Notice, ProgressEntry, ChatMessage } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vtysxdqqgbqbremdcvce.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isDbConfigured = SUPABASE_ANON_KEY.length > 0 && SUPABASE_ANON_KEY !== 'public-anon-key-placeholder';

export const supabase = isDbConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const handleError = (error: any, context: string) => {
  console.error(`Database Error [${context}]:`, error);
  const message = error?.message || error?.details || (typeof error === 'object' ? JSON.stringify(error) : String(error));
  throw new Error(message);
};

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const mapMember = (m: any): Member => ({
  ...m,
  fatherName: m.father_name || m.fatherName,
  seatNo: m.seat_no || m.seatNo,
  batchTime: m.batch_time || m.batchTime,
  joinDate: m.join_date || m.joinDate,
  membershipStatus: m.membership_status || m.membershipStatus,
  password: m.password,
  isArchived: m.status === 'Archived',
  progress: m.progress?.map((p: any) => ({
    id: p.id,
    date: p.date,
    score: p.score,
    subject: p.subject
  })) || [],
  idProofType: m.id_proof_type,
  idProofImage: m.id_proof_image
});

export const dbService = {
  // Members
  async getMembers(): Promise<Member[]> {
    if (!supabase) throw new Error("Cloud Database Not Configured");
    const { data, error } = await supabase
      .from('members')
      .select('*, progress(*)');

    if (error) return handleError(error, 'getMembers');
    return (data || []).map(mapMember);
  },

  async getMemberByEmail(email: string): Promise<Member | null> {
    if (!supabase) throw new Error("Cloud Database Not Configured");
    const { data, error } = await supabase
      .from('members')
      .select('*, progress(*)')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No record found
      return handleError(error, 'getMemberByEmail');
    }
    return data ? mapMember(data) : null;
  },

  async upsertMember(member: Partial<Member>) {
    if (!supabase) return null;
    const id = member.id || generateUUID();
    const dbPayload: any = {
      id,
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
      email: member.email,
      password: member.password
    };

    // Use 'status' column as seen in Supabase screenshot
    if (member.isArchived !== undefined) {
      dbPayload.status = member.isArchived ? 'Archived' : 'Active';
      if (member.isArchived) {
        dbPayload.archived_at = new Date().toISOString();
      } else {
        dbPayload.archived_at = null;
      }
    }

    const { data, error } = await supabase
      .from('members')
      .upsert(dbPayload)
      .select()
      .single();

    if (error) return handleError(error, 'upsertMember');
    return mapMember(data);
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
    return data || [];
  },

  async upsertResource(resource: Partial<Resource>) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('resources')
      .upsert({ ...resource, id: resource.id || generateUUID() })
      .select()
      .single();
    if (error) return handleError(error, 'upsertResource');
    return data;
  },

  async deleteResource(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) return handleError(error, 'deleteResource');
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('payments').select('*');
    if (error) return handleError(error, 'getPayments');
    return data || [];
  },

  async addPayment(payment: Omit<Payment, 'id'>) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('payments')
      .insert({ ...payment, id: generateUUID() })
      .select()
      .single();
    if (error) return handleError(error, 'addPayment');
    return data;
  },

  // Attendance
  async getAttendance(): Promise<AttendanceLog[]> {
    if (!supabase) return [];
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
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        id: log.id,
        member_id: log.memberId,
        check_in: log.checkIn,
        check_out: log.checkOut,
        status: log.status
      })
      .select()
      .single();
    if (error) return handleError(error, 'upsertAttendance');
    return data;
  },

  // Notices
  async getNotices(): Promise<Notice[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('notices').select('*').order('date', { ascending: false });
    if (error) return handleError(error, 'getNotices');
    return data || [];
  },

  async addNotice(notice: Omit<Notice, 'id'>) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('notices')
      .insert({ ...notice, id: generateUUID() })
      .select()
      .single();
    if (error) return handleError(error, 'addNotice');
    return data;
  },

  async deleteNotice(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) return handleError(error, 'deleteNotice');
  },

  // Progress
  async addProgress(memberId: string, entry: ProgressEntry) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('progress')
      .insert({
        member_id: memberId,
        date: entry.date,
        score: entry.score,
        subject: entry.subject
      })
      .select()
      .single();
    if (error) return handleError(error, 'addProgress');
    return data;
  },

  // Chat
  async getMessages(): Promise<ChatMessage[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) return handleError(error, 'getMessages');
    return data || [];
  },

  async sendMessage(msg: Omit<ChatMessage, 'id' | 'created_at'>) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('messages')
      .insert({ ...msg, id: generateUUID() })
      .select()
      .single();
    if (error) return handleError(error, 'sendMessage');
    return data;
  }
};
