export type UserRole = 'EMPLOYEE' | 'SCRUTINY_OFFICER' | 'MEDICAL_OFFICER' | 'FINANCE_OFFICER' | 'DDO';

export interface User {
  user_id: number;
  name: string;
  email: string;
  role: UserRole;
  account_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  last_login?: string | null;
  department?: string;
  profession?: string;
  employeeId?: string;
  contact?: string;
  role_id?: number;
  created_at?: string;
}

export interface Employee {
  employeeId: number;
  user_id: number;
  employee_code: string;
  full_name: string;
  department: string;
  designation: string;
  office_location: string;
  grade_pay: number;
  contact_number: string;
  address: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  created_at: string;
}

export interface Hospital {
  hospital_id: number;
  hospital_name: string;
  hospital_type: string;
  hospital_registration_number: string;
  city: string;
  state: string;
  contact_number: string;
}

export type ClaimStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'SCRUTINY_PENDING'
  | 'SCRUTINY_APPROVED' 
  | 'MEDICAL_PENDING'
  | 'MEDICAL_APPROVED' 
  | 'FINANCE_PENDING'
  | 'FINANCE_APPROVED' 
  | 'DDO_PENDING'
  | 'DDO_SANCTIONED' 
  | 'PAYMENT_PROCESSED' 
  | 'QUERY_RAISED' 
  | 'REJECTED';

export interface Claim {
  claim_id: string | number;
  user_id?: string;
  employeeId?: number;
  hospital_id?: number;
  claim_number?: string;
  admission_date?: string;
  discharge_date?: string;
  diagnosis?: string;
  total_bill_amount?: number;
  totalBillAmount?: number;
  eligible_reimbursement_amount?: number | null;
  approvedAmount?: number | null;
  claim_status?: ClaimStatus;
  current_stage?: number;
  current_workflow_stage?: string;
  submission_timestamp?: string | null;
  last_updated_timestamp?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Document {
  document_id: number;
  claim_id: number;
  document_type: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_hash: string;
  uploaded_by: number;
  upload_timestamp: string;
  // AI Analysis results (not in DB but useful for UI)
  ai_analysis?: {
    extracted_amount?: number;
    extracted_date?: string;
    confidence_score: number;
    is_legible: boolean;
    potential_fraud_flags: string[];
    summary: string;
  };
}

export interface Treatment {
  treatment_id: number;
  claim_id: number;
  treatment_code: string;
  treatment_name: string;
  treatment_category: string;
  verified_by_medical_officer: number | null;
  verification_date: string | null;
  medical_officer_remarks: string | null;
}

export interface Payment {
  payment_id: number;
  claim_id: number;
  approved_amount: number;
  payment_status: string;
  payment_date: string;
  treasury_transaction_reference: string;
}

export interface Query {
  query_id: number;
  claim_id: number;
  raised_by_user_id: number;
  raised_stage: string;
  query_description: string;
  sent_to_stage: string;
  query_status: 'OPEN' | 'RESOLVED';
  created_timestamp: string;
  resolved_timestamp: string | null;
}

export interface WorkflowLog {
  workflow_log_id: number;
  claim_id: number;
  stage_id: number;
  officer_id: number;
  action_type: string;
  remarks: string;
  previous_hash: string;
  current_hash: string;
  action_timestamp: string;
}

export interface AuditLog {
  audit_log_id: number;
  user_id: number;
  action_type: string;
  entity_type: string;
  entity_id: number;
  timestamp: string;
  ip_address: string;
}

// Legacy types for compatibility during migration
export type ClaimResponse = Claim;
export type DocumentResponse = Document;
export type QueryResponse = Query;
export type CalculationResponse = {
  system_calculated: number;
  breakdown: {
    rule: string;
    category: string;
    cap: number;
    applied_amount: number;
  }[];
  claimed_amount: number;
};
export type HospitalCheckResponse = {
  hospital_name: string;
  is_empanelled: boolean;
  empanelment_tier: string | null;
  warning: string | null;
};
