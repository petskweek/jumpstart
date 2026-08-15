export type Role = "student" | "company" | "admin";

export interface Posting {
  id: number;
  title: string;
  department: string | null;
  description: string;
  location: string | null;
  requiredHours: number;
  requirements: string | null;
  status: "draft" | "active" | "closed";
  createdAt: string;
  company: string;
}

export interface Application {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  school: string;
  program: string;
  yearLevel: string;
  studentId: string;
  preferredIndustry: string;
  requiredHours: number;
  preferredStartDate: string;
  skills: string | null;
  motivation: string;
  hasResume: boolean;
  hasTranscript: boolean;
  status: "pending" | "reviewed" | "approved" | "rejected" | "withdrawn";
  companyStatus: "pending" | "accepted" | "rejected";
  createdAt: string;
  postingId: number | null;
  postingTitle: string | null;
  company: string | null;
}

export interface ReportSummary {
  students: number;
  companies: number;
  activePostings: number;
  activeInternships: number;
  pendingApplications: number;
}

export interface OjtProgress {
  placementId: number;
  student: string;
  company: string;
  requiredHours: number;
  approvedHours: number;
}

export interface SavedDocument {
  id: number;
  type: "resume" | "transcript";
  name: string;
  createdAt: string;
}

const baseUrl = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("jumpstart_auth_token") ?? sessionStorage.getItem("jumpstart_auth_token");
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body: { message?: string } = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status}).`);
  return body as unknown as T;
}

export const api = {
  getPostings: () => request<{ postings: Posting[] }>("/api/postings"),
  getCompanyPostings: (_companyId: number) => request<{ postings: Posting[] }>("/api/company/postings"),
  createPosting: (posting: Pick<Posting, "title" | "description" | "requiredHours"> & Partial<Pick<Posting, "department" | "location" | "requirements" | "status">>) => request<{ postingId: number; message: string }>("/api/postings", { method: "POST", body: JSON.stringify(posting) }),
  updatePostingState: (postingId: number, action: "close" | "restore" | "publish") => request<{ message: string }>(`/api/postings/${postingId}`, { method: "PATCH", body: JSON.stringify({ action }) }),
  permanentlyDeletePosting: (postingId: number) => request<{ message: string }>(`/api/postings/${postingId}`, { method: "DELETE" }),
  applyToPosting: (jobPostingId: number, motivation: string) => request<{ applicationId: number; message: string }>("/api/postings/apply", { method: "POST", body: JSON.stringify({ jobPostingId, motivation }) }),
  getApplications: () => request<{ applications: Application[] }>("/api/applications"),
  getMyDocuments: () => request<{ documents: SavedDocument[] }>("/api/documents"),
  updateOwnApplication: (applicationId: number, action: "withdraw" | "restore") => request<{ message: string }>(`/api/applications/${applicationId}`, { method: "PATCH", body: JSON.stringify({ action }) }),
  editOwnApplication: (applicationId: number, fields: Partial<Pick<Application, "firstName" | "lastName" | "email" | "phone" | "school" | "program" | "yearLevel" | "studentId" | "preferredIndustry" | "requiredHours" | "preferredStartDate" | "skills" | "motivation">>) => request<{ message: string; application: Application }>(`/api/applications/${applicationId}`, { method: "PATCH", body: JSON.stringify({ action: "edit", ...fields }) }),
  deleteOwnApplication: (applicationId: number) => request<{ message: string }>(`/api/applications/${applicationId}`, { method: "DELETE" }),
  decideApplication: (applicationId: number, decision: "accepted" | "rejected" | "approved", notes = "") => request<{ message: string }>("/api/applications/decision", { method: "POST", body: JSON.stringify({ applicationId, decision, notes }) }),
  getReports: () => request<{ summary: ReportSummary; ojtProgress: OjtProgress[] }>("/api/admin/reports"),
};
