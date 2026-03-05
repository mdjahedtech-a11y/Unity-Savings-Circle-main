export type Role = 'admin' | 'user';

export interface Member {
  id: string;
  auth_user_id?: string;
  name: string;
  phone: string;
  photo_url?: string;
  share_count: number;
  role: Role;
  created_at?: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'unpaid';

export interface Payment {
  id: string;
  member_id: string;
  month: string; // e.g., "January"
  year: number; // e.g., 2024
  share_amount: number;
  penalty: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_date?: string;
  created_at?: string;
  members?: Member; // For join queries
}

export interface MonthlyReport {
  month: string;
  year: number;
  total_collection: number;
  total_penalty: number;
  paid_count: number;
  pending_count: number;
  details: Payment[];
}
