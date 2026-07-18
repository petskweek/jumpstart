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
  school: string;
  program: string;
  requiredHours: number;
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

const baseUrl = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body: { message?: string } = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status}).`);
  return body as unknown as T;
}

export const api = {
  getPostings: () => request<{ postings: Posting[] }>("/api/postings/index.php"),
  getCompanyPostings: (companyId: number) => request<{ postings: Posting[] }>(`/api/postings/index.php?companyId=${companyId}`),
  createPosting: (posting: Pick<Posting, "title" | "description" | "requiredHours"> & Partial<Pick<Posting, "department" | "location" | "requirements" | "status">>) => request<{ postingId: number; message: string }>("/api/postings/index.php", { method: "POST", body: JSON.stringify(posting) }),
  applyToPosting: (jobPostingId: number, motivation: string) => request<{ applicationId: number; message: string }>("/api/postings/apply.php", { method: "POST", body: JSON.stringify({ jobPostingId, motivation }) }),
  getApplications: () => request<{ applications: Application[] }>("/api/applications/index.php"),
  decideApplication: (applicationId: number, decision: "accepted" | "rejected" | "approved", notes = "") => request<{ message: string }>("/api/applications/decision.php", { method: "POST", body: JSON.stringify({ applicationId, decision, notes }) }),
  getReports: () => request<{ summary: ReportSummary; ojtProgress: OjtProgress[] }>("/api/admin/reports.php"),
};
