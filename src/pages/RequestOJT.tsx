// @ts-nocheck -- tuple-driven form retained while shared domain types are consolidated.
import { useEffect, useMemo, useState } from "react";
import { Download, FileText, UploadCloud, X } from "lucide-react";
import FormField from "../components/FormField.jsx";
import { api } from "../lib/api.ts";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const initialForm = { firstName: "", lastName: "", phone: "", school: "", program: "", yearLevel: "4th Year", studentId: "", industry: "", hours: "", startDate: "", skills: "", motivation: "" };
const initialResume = { email: "", address: "", objective: "", education: "", experience: "", references: "" };

const readSaved = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};

const escapeHtml = (value = "") => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

function createResumeFile(form, resumeData) {
  const fullName = `${form.firstName} ${form.lastName}`.trim() || "Student Resume";
  const section = (title, value) => value ? `<h2>${title}</h2><p>${escapeHtml(value).replace(/\n/g, "<br>")}</p>` : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#1e293b;line-height:1.5;margin:42px}h1{margin-bottom:4px;color:#0f172a}h2{font-size:16px;color:#2563eb;border-bottom:1px solid #cbd5e1;padding-bottom:4px;margin-top:22px}p{white-space:normal}</style></head><body><h1>${escapeHtml(fullName)}</h1><p>${escapeHtml(resumeData.email)}${resumeData.email && form.phone ? " · " : ""}${escapeHtml(form.phone)}<br>${escapeHtml(resumeData.address)}</p>${section("Career Objective", resumeData.objective)}${section("Education", resumeData.education || [form.program, form.school].filter(Boolean).join(" — "))}${section("Skills", form.skills)}${section("Experience", resumeData.experience)}${section("References", resumeData.references)}</body></html>`;
  return new File([new Blob([html], { type: "application/msword" })], `${fullName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "resume"}.doc`, { type: "application/msword" });
}

export default function RequestOJT({ notify, user, setPage }) {
  const storageKey = useMemo(() => `jumpstart_ojt_draft_${user?.id ?? "guest"}`, [user?.id]);
  const resumeKey = useMemo(() => `jumpstart_resume_draft_${user?.id ?? "guest"}`, [user?.id]);
  const [form, setForm] = useState(initialForm);
  const [resumeData, setResumeData] = useState(initialResume);
  const [resume, setResume] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [savedDocuments, setSavedDocuments] = useState({ resume: null, transcript: null });
  const [replacing, setReplacing] = useState({ resume: false, transcript: false });
  const [showResumeBuilder, setShowResumeBuilder] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(false);
  const [companyApplications, setCompanyApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedForm = readSaved(storageKey, initialForm);
    const savedResume = readSaved(resumeKey, { data: initialResume, generated: false });
    setForm({ ...initialForm, ...savedForm });
    setResumeData({ ...initialResume, ...savedResume.data });
    setGeneratedResume(Boolean(savedResume.generated));
    setResume(savedResume.generated ? createResumeFile({ ...initialForm, ...savedForm }, { ...initialResume, ...savedResume.data }) : null);
    setTranscript(null);
    setReplacing({ resume: false, transcript: false });
    setError("");
    if (user?.id) api.getMyDocuments().then(({ documents }) => setSavedDocuments({ resume: documents.find(document => document.type === "resume") ?? null, transcript: documents.find(document => document.type === "transcript") ?? null })).catch(() => setSavedDocuments({ resume: null, transcript: null }));
  }, [storageKey, resumeKey]);

  useEffect(() => { if (user?.id) localStorage.setItem(storageKey, JSON.stringify(form)); }, [form, storageKey, user?.id]);
  useEffect(() => { if (user?.id) localStorage.setItem(resumeKey, JSON.stringify({ data: resumeData, generated: generatedResume })); }, [resumeData, generatedResume, resumeKey, user?.id]);

  useEffect(() => {
    if (user?.role !== "company") return;
    api.getApplications().then(({ applications }) => {
      setCompanyApplications(applications);
      setSelectedApplication(current => applications.find(application => application.id === current?.id) ?? applications[0] ?? null);
    }).catch(error => { setCompanyApplications([]); setSelectedApplication(null); notify(error.message || "Unable to load OJT applications."); });
  }, [user?.id, user?.role]);

  const updateField = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const updateResumeField = event => setResumeData(current => ({ ...current, [event.target.name]: event.target.value }));

  const useCreatedResume = () => {
    if (!form.firstName || !form.lastName || !resumeData.email || !resumeData.objective) {
      setError("Add your name, email, and career objective before saving the created resume.");
      return;
    }
    const file = createResumeFile(form, resumeData);
    setResume(file);
    setGeneratedResume(true);
    setShowResumeBuilder(false);
    setError("");
    notify("Resume created and attached to your application.");
  };

  const downloadCreatedResume = () => {
    const file = createResumeFile(form, resumeData);
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = file.name; anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError("");
    if (!resume && !savedDocuments.resume) { setError("Please upload a PDF/Word resume or create one below."); return; }
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      payload.append("resume", resume);
      if (transcript) payload.append("transcript", transcript);
      const token = localStorage.getItem("jumpstart_auth_token") ?? sessionStorage.getItem("jumpstart_auth_token");
      const response = await fetch(`${API_URL}/api/ojt/apply`, { method: "POST", credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: payload });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Application service returned an error (HTTP ${response.status}).`);
      localStorage.removeItem(storageKey); localStorage.removeItem(resumeKey);
      setForm(initialForm); setResumeData(initialResume); setResume(null); setTranscript(null); setGeneratedResume(false); setReplacing({ resume: false, transcript: false });
      notify("Application submitted successfully.");
      setPage("studentDashboard");
    } catch (requestError) { setError(requestError.message || "Unable to submit your application."); }
    finally { setIsSubmitting(false); }
  };

  const fields = [
    ["First Name *", "firstName", "John"], ["Last Name *", "lastName", "Doe"], ["Phone Number *", "phone", "+63 900 000 0000"],
    ["School/University *", "school", "University Name", "text", true], ["Program/Course *", "program", "e.g., Computer Science"], ["Student ID Number *", "studentId", "2024-12345"],
    ["Required Duration (Hours) *", "hours", "e.g., 240", "number"], ["Preferred Start Date *", "startDate", "", "date", true], ["Skills & Qualifications", "skills", "List relevant skills and certifications", "textarea", true], ["Why do you want this OJT? *", "motivation", "Tell us about your career goals", "textarea", true],
  ];

  const renderFields = list => list.map(([label, name, placeholder, type = "text", full]) => <FormField key={name} label={label} id={name} name={name} type={type} placeholder={placeholder} value={form[name]} onChange={updateField} required={label.includes("*")} full={full} />);

  if (user?.role === "company") return <section className="bg-cyan-50/50 py-12 min-h-[70vh]"><div className="max-w-6xl mx-auto px-5 sm:px-8">
    <div className="mb-7"><p className="text-xs font-bold uppercase tracking-widest text-cyan-600">Company access</p><h1 className="font-display font-bold text-3xl text-slate-900 mt-1">Student OJT Applications</h1><p className="text-sm text-slate-500 mt-2">View submitted application forms for your company postings. These forms are read-only.</p></div>
    {companyApplications.length === 0 ? <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center"><FileText className="w-10 h-10 text-slate-300 mx-auto mb-3"/><h2 className="font-display font-semibold text-slate-800">No applications yet</h2><p className="text-sm text-slate-500 mt-1">Student forms submitted to your active postings will appear here.</p></div> : <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <aside className="bg-white border border-slate-200 rounded-2xl p-3 h-fit"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 py-2">Applications ({companyApplications.length})</p>{companyApplications.map(application => <button type="button" key={application.id} onClick={() => setSelectedApplication(application)} className={`w-full text-left rounded-xl px-3 py-3 mb-1 transition-colors ${selectedApplication?.id === application.id ? "bg-cyan-50 border border-cyan-200" : "hover:bg-slate-50 border border-transparent"}`}><p className="font-semibold text-sm text-slate-900">{application.firstName} {application.lastName}</p><p className="text-xs text-slate-500 mt-0.5 truncate">{application.postingTitle || "OJT Placement Request"}</p><span className="inline-block text-[11px] font-semibold mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{application.status}</span></button>)}</aside>
      {selectedApplication && <article className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"><div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-5 text-white"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-cyan-100 uppercase tracking-wider">Read-only application form</p><h2 className="font-display font-bold text-xl mt-1">{selectedApplication.firstName} {selectedApplication.lastName}</h2><p className="text-sm text-cyan-50 mt-1">Applied for {selectedApplication.postingTitle || "OJT Placement"}</p></div><span className="self-start bg-white/15 border border-white/25 rounded-full px-3 py-1 text-xs font-semibold capitalize">{selectedApplication.status}</span></div></div><div className="p-6 space-y-6">
        <ReadOnlySection title="Personal Information" fields={[["First Name", selectedApplication.firstName], ["Last Name", selectedApplication.lastName], ["Email", selectedApplication.email], ["Phone Number", selectedApplication.phone]]}/>
        <ReadOnlySection title="Academic Information" fields={[["School / University", selectedApplication.school], ["Program / Course", selectedApplication.program], ["Year Level", selectedApplication.yearLevel], ["Student ID", selectedApplication.studentId]]}/>
        <ReadOnlySection title="OJT Preferences" fields={[["Preferred Industry", selectedApplication.preferredIndustry], ["Required Duration", `${selectedApplication.requiredHours} hours`], ["Preferred Start Date", new Date(selectedApplication.preferredStartDate).toLocaleDateString()], ["Submitted", new Date(selectedApplication.createdAt).toLocaleDateString()]]}/>
        <ReadOnlySection title="Skills and Motivation" fields={[["Skills & Qualifications", selectedApplication.skills || "Not provided"], ["Why this OJT?", selectedApplication.motivation]]} wide/>
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center gap-3"><FileText className="w-5 h-5 text-cyan-600"/><div><p className="text-sm font-semibold text-slate-800">Submitted documents</p><p className="text-xs text-slate-500">Resume and transcript details remain protected in the student's application record.</p></div></div>
      </div></article>}
    </div>}
  </div></section>;

  if (!user || user.role !== "student") return <section className="min-h-[60vh] bg-slate-50 flex items-center justify-center px-5"><div className="max-w-md text-center bg-white border border-slate-200 rounded-2xl p-8"><h1 className="font-display font-bold text-2xl text-slate-900">Student sign-in required</h1><p className="font-body text-slate-500 mt-3">Only logged-in Student accounts can submit an OJT application.</p><button onClick={() => setPage("signin")} className="mt-6 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg">Sign In</button></div></section>;

  return <section className="bg-slate-50 py-14"><div className="max-w-3xl mx-auto px-5 sm:px-8">
    <h1 className="font-display font-bold text-3xl text-blue-600 text-center">Request OJT Placement</h1>
    <p className="text-slate-500 text-center mt-2 mb-8">Your draft is saved automatically when you move to another page.</p>
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4"><h2 className="font-display font-semibold text-white">OJT Application Form</h2></div>
      <div className="p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">{renderFields(fields.slice(0, 3))}</div>
        <div><h3 className="font-display font-semibold text-slate-900 text-sm mb-3 pb-2 border-b">Academic Information</h3><div className="grid sm:grid-cols-2 gap-4">{renderFields(fields.slice(3, 6))}<div><label className="block text-sm font-medium text-slate-700 mb-1">Year Level</label><div className="border rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-600">4th Year</div></div></div></div>
        <div><h3 className="font-display font-semibold text-slate-900 text-sm mb-3 pb-2 border-b">OJT Preferences & Hours</h3><div className="grid sm:grid-cols-2 gap-4"><div><label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-1">Preferred Industry *</label><select id="industry" name="industry" value={form.industry} onChange={updateField} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><option value="">Select industry</option><option>Technology</option><option>Marketing</option><option>Finance</option><option>Healthcare</option></select></div>{renderFields(fields.slice(6))}</div></div>
        <div><h3 className="font-display font-semibold text-slate-900 text-sm mb-3 pb-2 border-b">Required Documents</h3><div className="grid sm:grid-cols-2 gap-4">
          <div>{savedDocuments.resume && !replacing.resume && !resume ? <div className="border-2 border-emerald-200 bg-emerald-50 rounded-xl p-5 text-center"><FileText className="w-6 h-6 text-emerald-600 mx-auto mb-2"/><p className="text-sm font-medium text-slate-700">Saved Resume/CV</p><p className="text-xs text-emerald-700 mt-1 truncate">{savedDocuments.resume.name}</p><p className="text-xs text-slate-500 mt-2">This file will be attached automatically.</p><button type="button" onClick={() => setReplacing(current => ({ ...current, resume: true }))} className="mt-3 text-xs font-semibold text-blue-700 border border-blue-200 bg-white rounded-lg px-4 py-2">Replace Resume</button></div> : <label className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 block"><UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-2"/><p className="text-sm font-medium text-slate-700 mb-1">{savedDocuments.resume ? "Choose Replacement Resume *" : "Upload Resume/CV *"}</p><p className="text-xs text-slate-400 mb-2">PDF, DOC, or DOCX · maximum 5 MB</p><input type="file" name="resume" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={event => { setResume(event.target.files?.[0] || null); setGeneratedResume(false); }}/><div className="bg-slate-100 rounded-lg px-3 py-1.5 text-xs text-slate-500 truncate">{resume ? resume.name : "Choose File"}</div>{savedDocuments.resume && <button type="button" onClick={event => { event.preventDefault(); setReplacing(current => ({ ...current, resume: false })); setResume(null); }} className="mt-2 text-xs text-slate-500">Keep Existing Resume</button>}</label>}<button type="button" onClick={() => { setShowResumeBuilder(true); setReplacing(current => ({ ...current, resume: true })); }} className="mt-3 w-full border border-blue-200 bg-blue-50 text-blue-700 font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100"><FileText className="w-4 h-4"/>Create Resume Manually</button></div>
          <div>{savedDocuments.transcript && !replacing.transcript && !transcript ? <div className="border-2 border-emerald-200 bg-emerald-50 rounded-xl p-5 text-center"><FileText className="w-6 h-6 text-emerald-600 mx-auto mb-2"/><p className="text-sm font-medium text-slate-700">Saved Transcript</p><p className="text-xs text-emerald-700 mt-1 truncate">{savedDocuments.transcript.name}</p><p className="text-xs text-slate-500 mt-2">This file will be attached automatically.</p><button type="button" onClick={() => setReplacing(current => ({ ...current, transcript: true }))} className="mt-3 text-xs font-semibold text-blue-700 border border-blue-200 bg-white rounded-lg px-4 py-2">Replace Transcript</button></div> : <label className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 block"><UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-2"/><p className="text-sm font-medium text-slate-700 mb-1">{savedDocuments.transcript ? "Choose Replacement Transcript" : "Upload Transcript of Records"}</p><p className="text-xs text-slate-400 mb-2">PDF, DOC, or DOCX · maximum 5 MB</p><input type="file" name="transcript" accept=".pdf,.doc,.docx" className="hidden" onChange={event => setTranscript(event.target.files?.[0] || null)}/><div className="bg-slate-100 rounded-lg px-3 py-1.5 text-xs text-slate-500 truncate">{transcript ? transcript.name : "Choose File"}</div>{savedDocuments.transcript && <button type="button" onClick={event => { event.preventDefault(); setReplacing(current => ({ ...current, transcript: false })); setTranscript(null); }} className="mt-2 text-xs text-slate-500">Keep Existing Transcript</button>}</label>}</div>
        </div></div>
        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-lg shadow-sm hover:opacity-90 disabled:opacity-60">{isSubmitting ? "Submitting…" : "Submit Application"}</button>
      </div>
    </form>
  </div>

  {showResumeBuilder && <div className="fixed inset-0 z-50 bg-slate-900/50 p-4 overflow-y-auto flex items-center justify-center"><div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center"><div><h2 className="font-display font-bold text-xl text-slate-900">Create Your Resume</h2><p className="text-xs text-slate-500 mt-1">Your details are saved automatically.</p></div><button type="button" onClick={() => setShowResumeBuilder(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5"/></button></div><div className="p-6 grid sm:grid-cols-2 gap-4">
    <FormField label="Email Address *" id="resume-email" name="email" type="email" value={resumeData.email} onChange={updateResumeField} placeholder="student@email.com"/>
    <FormField label="Address" id="resume-address" name="address" value={resumeData.address} onChange={updateResumeField} placeholder="City, Province"/>
    <FormField label="Career Objective *" id="resume-objective" name="objective" type="textarea" value={resumeData.objective} onChange={updateResumeField} placeholder="Describe your goals and the opportunity you are seeking" full/>
    <FormField label="Education" id="resume-education" name="education" type="textarea" value={resumeData.education} onChange={updateResumeField} placeholder="Degree, institution, dates, and achievements" full/>
    <FormField label="Experience and Projects" id="resume-experience" name="experience" type="textarea" value={resumeData.experience} onChange={updateResumeField} placeholder="Projects, responsibilities, organizations, or work experience" full/>
    <FormField label="References" id="resume-references" name="references" type="textarea" value={resumeData.references} onChange={updateResumeField} placeholder="Name, position, and contact information" full/>
    <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 pt-2"><button type="button" onClick={useCreatedResume} className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-lg">Save & Use This Resume</button><button type="button" onClick={downloadCreatedResume} className="flex-1 border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"><Download className="w-4 h-4"/>Download Word File</button></div>
  </div></div></div>}
  </section>;
}

function ReadOnlySection({ title, fields, wide = false }) {
  return <section><h3 className="font-display font-semibold text-sm text-slate-900 mb-3 pb-2 border-b border-slate-200">{title}</h3><div className={wide ? "grid gap-3" : "grid sm:grid-cols-2 gap-3"}>{fields.map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{value || "—"}</p></div>)}</div></section>;
}
