export type ContactChannel = "Appel" | "WhatsApp" | "SMS" | "Facebook";
export type ReportStatus = "Validé" | "En attente" | "Refusé";
export type GainStatus = "Nul" | "En cours" | "Payé";

export interface CallReport {
  id: string;
  created_at: string;
  date: string;
  contact_channel: ContactChannel;
  client_name: string;
  phone: string;
  commune: string;
  gain_name: string;
  announced_gain: string;
  gain_status: GainStatus;
  product: string;
  point_of_sale: string;
  code_capsule: string;
  participated: boolean;
  internal_actions: boolean;
  complaint: string;
  priority: string;
  follow_up: boolean;
  company_action: string;
  internal_comment: string;
  status: ReportStatus;
  duration_seconds: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  table: string;
  timezone: string;
}

export type DataMode = "local" | "supabase";
