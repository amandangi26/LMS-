
export interface Resource {
  id: string;
  title: string;
  author: string;
  category: string;
  subject?: string;
  type: 'PDF' | 'eBook' | 'Video' | 'Audiobook' | 'Article';
  accessUrl: string;
  thumbnail?: string;
  description: string;
}

export interface ProgressEntry {
  id: string;
  date: string;
  score?: string;
  subject?: string;
  improvement?: string;
  goal?: string;
}

export interface Member {
  id: string;
  name: string;
  fatherName: string;
  address: string;
  phone: string;
  seatNo: string;
  batchTime: string;
  fee: string;
  dues: string;
  joinDate: string;
  membershipStatus: 'Basic' | 'Premium';
  email: string;
  progress?: ProgressEntry[];
  status?: 'Active' | 'Archived';
  archiveReason?: string;
  archivedAt?: string;
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  reason: 'Subscription' | 'Premium Resource' | 'Donation';
  paymentMethod: 'UPI' | 'CASH' | 'Card' | 'Wallet';
}

export interface AccessLog {
  id: string;
  resourceId: string;
  memberId: string;
  accessDate: string;
}

export interface AttendanceLog {
  id: string;
  memberId: string;
  checkIn: string;
  checkOut?: string;
  status: 'Present' | 'Late' | 'Left';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'High' | 'Normal';
}

export type View = 'dashboard' | 'catalog' | 'members' | 'ai-assistant' | 'payments' | 'batch' | 'attendance' | 'progress' | 'history';
