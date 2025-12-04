export interface CustomEmailDraft {
  id: number;
  name: string;
  subject: string;
  preheaderText: string | null;
  htmlContent: string;
  status: "draft" | "sent" | "scheduled";
  targetAudience: string | null;
  sentCount: number;
  includeTracking: boolean;
  createdAt: string;
  sentAt: string | null;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  isActive: boolean;
  audience: string | null;
  seniority: string | null;
  companySize: string | null;
  country: string | null;
  riskLevel: string | null;
}

export interface TargetAudience {
  allUsers?: boolean;
  specificUserIds?: number[];
  audience?: string[];
  seniority?: string[];
  companySize?: string[];
  country?: string[];
  riskLevel?: string[];
}

export interface CreateCustomEmailRequest {
  name: string;
  subject: string;
  preheaderText?: string;
  htmlContent: string;
  targetAudience?: TargetAudience;
  includeTracking?: boolean;
}

export interface UpdateCustomEmailRequest extends CreateCustomEmailRequest {
  id: number;
}

export interface SendEmailRequest {
  testMode?: boolean;
  testEmail?: string;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  sent?: number;
  failed?: number;
  total?: number;
  errors?: string[];
  testMode?: boolean;
}
