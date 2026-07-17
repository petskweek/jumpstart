import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";
import FormField from "../components/FormField.jsx";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const initialForm = { firstName: "", lastName: "", phone: "", school: "", program: "", yearLevel: "4th Year", studentId: "", industry: "", hours: "", startDate: "", skills: "", motivation: "" };

export default function RequestOJT({ notify, user, setPage }) {
  const [form, setForm] = useState(initialForm);
  const [resume, setResume] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  useEffect(() => {
    setForm(initialForm);
    setResume(null);
    setTranscript(null);
    setError("");
  }, [user?.id]);

  if (!user || user.role !== "student") {
    return <section className="min-h-[60vh] bg-slate-50 flex items-center justify-center px-5"><div className="max-w-md text-center bg-white border border-slate-200 rounded-2xl p-8"><h1 className="font-display font-bold text-2xl text-slate-900">Student sign-in required</h1><p className="font-body text-slate-500 mt-3">Only logged-in Student accounts can submit an OJT application.</p><button onClick={() => setPage("signin")} className="mt-6 bg-blue-600 text-white font-body font-semibold px-5 py-2.5 rounded-lg">Sign In</button></div></section>;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!resume) { setError("Please upload your resume or CV."); return; }
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      payload.append("resume", resume);
      if (transcript) payload.append("transcript", transcript);
      const response = await fetch(`${API_URL}/api/ojt/apply.php`, { method: "POST", credentials: "include", body: payload });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Application service returned an error (HTTP ${response.status}).`);
      setForm(initialForm); setResume(null); setTranscript(null);
      notify("Application submitted successfully.");
      setPage("studentDashboard");
    } catch (requestError) {
      setError(requestError.message || "Unable to submit your application.");
    } finally { setIsSubmitting(false); }
  };

  const fields = [
    ["First Name *", "firstName", "John"], ["Last Name *", "lastName", "Doe"], ["Phone Number *", "phone", "+1 (555) 123-4567"],
    ["School/University *", "school", "University Name", "text", true], ["Program/Course *", "program", "e.g., Computer Science"], ["Student ID Number *", "studentId", "2024-12345"],
    ["Required Duration (Hours) *", "hours", "e.g., 240", "number"], ["Preferred Start Date *", "startDate", "", "date", true], ["Skills & Qualifications", "skills", "List relevant skills, certifications...", "textarea", true], ["Why do you want this OJT? *", "motivation", "Tell us about your career goals...", "textarea", true],
  ];

  return <section className="bg-slate-50 py-14"><div className="max-w-3xl mx-auto px-5 sm:px-8"><h1 className="font-display font-bold text-3xl text-blue-600 text-center">Request OJT Placement</h1><p className="font-body text-slate-500 text-center mt-2 mb-8">Fill out the form below to apply for an on-the-job training position</p><form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4"><h2 className="font-display font-semibold text-white">OJT Application Form</h2></div><div className="p-6 space-y-6"><div className="grid sm:grid-cols-2 gap-4">{fields.slice(0, 3).map(([label, name, placeholder, type = "text", full]) => <FormField key={name} label={label} id={name} name={name} type={type} placeholder={placeholder} value={form[name]} onChange={updateField} required={label.includes("*")} full={full} />)}</div><div><h3 className="font-display font-semibold text-slate-900 text-sm mb-3 pb-2 border-b border-slate-200">Academic Information</h3><div className="grid sm:grid-cols-2 gap-4">{fields.slice(3, 6).map(([label, name, placeholder, type = "text", full]) => <FormField key={name} label={label} id={name} name={name} type={type} placeholder={placeholder} value={form[name]} onChange={updateField} required full={full} />)}<div><label className="block text-sm font-body font-medium text-slate-700 mb-1">Year Level</label><div className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-body bg-slate-100 text-slate-600">4th Year</div></div></div></div><div><h3 className="font-display font-semibold text-slate-900 text-sm mb-3 pb-2 border-b border-slate-200">OJT Preferences & Hours</h3><div className="grid sm:grid-cols-2 gap-4"><div><label htmlFor="industry" className="block text-sm font-body font-medium text-slate-700 mb-1">Preferred Industry *</label><select id="industry" name="industry" value={form.industry} onChange={updateField} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body"><option value="">Select industry</option><option>Technology</option><option>Marketing</option><option>Finance</option><option>Healthcare</option></select></div>{fields.slice(6).map(([label, name, placeholder, type = "text", full]) => <FormField key={name} label={label} id={name} name={name} type={type} placeholder={placeholder} value={form[name]} onChange={updateField} required={label.includes("*")} full={full} />)}</div></div><div><h3 className="font-display font-semibold text-slate-900 text-sm mb-3 pb-2 border-b border-slate-200">Required Documents</h3><div className="grid sm:grid-cols-2 gap-4">{[["resume", "Upload Resume/CV *", resume, setResume], ["transcript", "Upload Transcript of Records", transcript, setTranscript]].map(([name, label, file, setFile]) => <label key={name} className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 block"><UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-2" /><p className="text-sm font-body font-medium text-slate-700 mb-2">{label}</p><input type="file" name={name} accept=".pdf,.doc,.docx" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} /><div className="bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-body text-slate-500">{file ? file.name : "Choose File"}</div></label>)}</div></div>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-body font-semibold py-3 rounded-lg shadow-sm hover:opacity-90 disabled:opacity-60">{isSubmitting ? "Submitting…" : "Submit Application"}</button></div></form></div></section>;
}
