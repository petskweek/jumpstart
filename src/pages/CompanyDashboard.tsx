// @ts-nocheck -- migrated JSX preserved while dashboard domain types are consolidated.
import React, { useEffect, useState } from "react";
import {
  Building2, Briefcase, Users, CheckCircle2, TrendingUp, Eye, Pencil, Trash2,
  Plus, Star, Award, ClipboardCheck, MessageSquare, X
} from "lucide-react";
import PortalTabs from "../components/PortalTabs.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { Modal, DetailRow } from "../components/Modal.jsx";
import FormField from "../components/FormField.jsx";
import { ojtStudentsSeed } from "../data/mockData.js";
import { api } from "../lib/api.ts";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export default function CompanyDashboard({ notify, user }) {
  const [tab, setTab] = useState("Job Postings");
  const [certFor, setCertFor] = useState(null);
  const [postings, setPostings] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [modal, setModal] = useState(null);
  const [evalStudent, setEvalStudent] = useState(ojtStudentsSeed[0].name);
  const [evalPeriod, setEvalPeriod] = useState("Weekly");
  const [evalNotes, setEvalNotes] = useState("");
  const [messages, setMessages] = useState(["Jamie Cruz has completed 240/240 hours with a 4.8 average — ready for sign-off."]);
  const [msgInput, setMsgInput] = useState("");
  const [postingForm, setPostingForm] = useState({
    title: "", department: "", location: "", requiredHours: 240,
    description: "", requirements: "", status: "active",
  });
  const [isCreatingPosting, setIsCreatingPosting] = useState(false);
  const [postingError, setPostingError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const loadCompanyData = () => Promise.all([api.getCompanyPostings(user.id), api.getApplications()])
      .then(([postingData, applicationData]) => {
        if (!active) return;
        setPostings(postingData.postings.map((posting) => ({
          id: posting.id, title: posting.title, dept: posting.department || "General", status: posting.status[0].toUpperCase() + posting.status.slice(1),
          applicants: applicationData.applications.filter((application) => application.postingId === posting.id).length,
          posted: new Date(posting.createdAt).toLocaleDateString(),
        })));
        setApplicants(applicationData.applications.map((application) => ({
          id: application.id, name: `${application.firstName} ${application.lastName}`, for: application.postingTitle || "OJT Placement", school: application.school,
          firstName: application.firstName, lastName: application.lastName, email: application.email, phone: application.phone,
          yearLevel: application.yearLevel, studentId: application.studentId, preferredIndustry: application.preferredIndustry,
          requiredHours: application.requiredHours, preferredStartDate: application.preferredStartDate, skills: application.skills,
          motivation: application.motivation, submitted: application.createdAt, hasResume: application.hasResume, hasTranscript: application.hasTranscript,
          program: application.program, gpa: "—", status: application.companyStatus === "accepted" ? "Accepted" : application.status === "rejected" ? "Rejected" : "New",
        })));
      })
      .catch((error) => notify(error.message || "Unable to load company data."));
    loadCompanyData();
    const refreshTimer = window.setInterval(loadCompanyData, 10000);
    const refreshOnFocus = () => loadCompanyData();
    window.addEventListener("focus", refreshOnFocus);
    return () => { active = false; window.clearInterval(refreshTimer); window.removeEventListener("focus", refreshOnFocus); };
  }, [user?.id]);

  const deletePosting = async (p) => {
    try {
      await api.updatePostingState(p.id, "close");
      setPostings(current => current.map(x => x.id === p.id ? { ...x, status: "Closed" } : x));
      notify(`Moved posting to closed: ${p.title}`);
    } catch (error) { notify(error.message || "Unable to close posting."); }
  };
  const restorePosting = async (p) => {
    try {
      await api.updatePostingState(p.id, "restore");
      setPostings(current => current.map(x => x.id === p.id ? { ...x, status: "Active" } : x));
      notify(`Restored posting: ${p.title}`);
    } catch (error) { notify(error.message || "Unable to restore posting."); }
  };
  const publishPosting = async (p) => {
    try {
      await api.updatePostingState(p.id, "publish");
      setPostings(current => current.map(x => x.id === p.id ? { ...x, status: "Active" } : x));
      notify(`Published posting: ${p.title}`);
    } catch (error) { notify(error.message || "Unable to publish posting."); }
  };
  const permanentlyDeletePosting = async (p) => {
    if (!window.confirm(`Permanently delete "${p.title}" from the database? This cannot be undone.`)) return;
    try {
      await api.permanentlyDeletePosting(p.id);
      setPostings(current => current.filter(x => x.id !== p.id));
      notify(`Permanently deleted posting: ${p.title}`);
    } catch (error) { notify(error.message || "Unable to permanently delete posting."); }
  };
  const openCreatePosting = () => {
    setPostingForm({ title: "", department: "", location: "", requiredHours: 240, description: "", requirements: "", status: "active" });
    setPostingError("");
    setModal({ title: "Create New Posting", body: "createPosting" });
  };
  const createPosting = async (event) => {
    event.preventDefault();
    setPostingError("");
    setIsCreatingPosting(true);
    try {
      const result = await api.createPosting({ ...postingForm, requiredHours: Number(postingForm.requiredHours) });
      setPostings([{ id: result.postingId, title: postingForm.title, dept: postingForm.department || "General", status: postingForm.status[0].toUpperCase() + postingForm.status.slice(1), applicants: 0, posted: new Date().toLocaleDateString() }, ...postings]);
      setModal(null);
      notify("Job posting published successfully");
    } catch (error) { setPostingError(error.message || "Unable to create posting."); }
    finally { setIsCreatingPosting(false); }
  };
  const acceptApplicant = async (a) => {
    try { await api.decideApplication(a.id, "accepted"); setApplicants(applicants.map(x => x.id === a.id ? { ...x, status: "Accepted" } : x)); notify(`${a.name} accepted`); }
    catch (error) { notify(error.message || "Unable to accept applicant."); }
  };
  const rejectApplicant = async (a) => {
    try { await api.decideApplication(a.id, "rejected"); setApplicants(applicants.map(x => x.id === a.id ? { ...x, status: "Rejected" } : x)); notify(`${a.name} rejected`); }
    catch (error) { notify(error.message || "Unable to reject applicant."); }
  };
  const submitEvaluation = () => { notify(`${evalPeriod} evaluation submitted for ${evalStudent}`); setEvalNotes(""); };
  const sendMessage = () => { if (!msgInput.trim()) return; setMessages([...messages, msgInput]); setMsgInput(""); notify("Message sent to school admin"); };

  return (
    <section className="bg-cyan-50/50 py-10">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <h1 className="font-display font-bold text-3xl text-cyan-600">Company Portal</h1>
        <p className="font-body text-slate-500 mt-1 mb-6">Manage job postings, review applicants, and find talented interns</p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900">{user?.name || "Company"}</h2>
              <p className="font-body text-sm text-slate-500">{user?.email || "Company account"}</p>
              <div className="flex gap-5 mt-1 text-xs font-body text-slate-500">
                <span>Active Postings <b className="text-cyan-600">{postings.filter(p => p.status === "Active").length}</b></span>
                <span>Total Applicants <b className="text-cyan-600">47</b></span>
                <span>Hired This Year <b className="text-cyan-600">8</b></span>
              </div>
            </div>
          </div>
          <button onClick={() => setModal({ title: "Edit Company Profile", body: "editProfile" })} className="bg-cyan-600 text-white font-body font-semibold text-sm px-4 py-2 rounded-lg hover:bg-cyan-700">Edit Profile</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            ["Active Postings", postings.filter(p => p.status === "Active").length, <Briefcase className="w-4 h-4 text-cyan-600" />],
            ["New Applicants", applicants.filter(a => a.status === "New").length, <Users className="w-4 h-4 text-blue-600" />],
            ["Interviews", "8", <CheckCircle2 className="w-4 h-4 text-emerald-600" />],
            ["Success Rate", "87%", <TrendingUp className="w-4 h-4 text-purple-600" />],
          ].map(([label, val, icon]) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-body text-xs text-slate-500">{label}</span>{icon}
              </div>
              <p className="font-display font-bold text-2xl text-slate-900">{val}</p>
            </div>
          ))}
        </div>

        <PortalTabs tabs={["Job Postings", "Applicants", "OJT Students"]} active={tab} setActive={setTab} accent="text-cyan-600" />

        {tab === "Job Postings" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-slate-900">Your Job Postings</h3>
              <button onClick={openCreatePosting} className="bg-cyan-600 text-white text-xs font-body font-semibold px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-cyan-700"><Plus className="w-3.5 h-3.5" />Create New Posting</button>
            </div>
            <div className="space-y-4">
              {postings.map((j) => (
                <div key={j.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <h4 className="font-display font-semibold text-slate-900">{j.title}</h4>
                      <p className="font-body text-xs text-slate-500">{j.dept}</p>
                    </div>
                    <StatusBadge status={j.status} />
                  </div>
                  <div className="flex gap-6 text-xs font-body text-slate-500 mt-3">
                    <span>Applicants: {j.applicants}</span>
                    <span>Posted: {j.posted}</span>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => setModal({ title: j.title, body: "posting", data: j })} className="text-xs font-body font-semibold border border-slate-300 rounded-lg px-3 py-1.5 flex items-center gap-1 hover:bg-slate-50"><Eye className="w-3.5 h-3.5" />View</button>
                    <button onClick={() => setModal({ title: `Edit: ${j.title}`, body: "editPosting", data: j })} className="text-xs font-body font-semibold border border-slate-300 rounded-lg px-3 py-1.5 flex items-center gap-1 hover:bg-slate-50"><Pencil className="w-3.5 h-3.5" />Edit</button>
                    {j.status === "Draft" && <button onClick={() => publishPosting(j)} className="text-xs font-body font-semibold text-white bg-emerald-600 rounded-lg px-3 py-1.5 hover:bg-emerald-700">Publish Now</button>}
                    {j.status !== "Closed" && <button onClick={() => deletePosting(j)} className="text-xs font-body font-semibold text-rose-500 border border-rose-200 rounded-lg px-3 py-1.5 flex items-center gap-1 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" />Delete</button>}
                    {j.status === "Closed" && <button onClick={() => restorePosting(j)} className="text-xs font-body font-semibold text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50">Restore</button>}
                    {j.status === "Closed" && <button onClick={() => permanentlyDeletePosting(j)} className="text-xs font-body font-semibold text-white bg-rose-600 rounded-lg px-3 py-1.5 hover:bg-rose-700">Delete Permanently</button>}
                  </div>
                </div>
              ))}
              {postings.length === 0 && <p className="font-body text-sm text-slate-400 text-center py-6">No postings yet.</p>}
            </div>
          </div>
        )}

        {tab === "Applicants" && (
          <div>
            <h3 className="font-display font-bold text-slate-900 mb-4">Recent Applicants</h3>
            <div className="space-y-4">
              {applicants.map((a) => (
                <div key={a.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <h4 className="font-display font-semibold text-slate-900">{a.name}</h4>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="font-body text-xs text-slate-500 mt-1">Applied for: {a.for}</p>
                  <div className="flex flex-wrap gap-6 text-xs font-body text-slate-500 mt-2">
                    <span>School <b className="text-slate-800">{a.school}</b></span>
                    <span>Program <b className="text-slate-800">{a.program}</b></span>
                    <span>GPA <b className="text-slate-800">{a.gpa}</b></span>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => setModal({ title: a.name, body: "applicant", data: a })} className="bg-cyan-600 text-white text-xs font-body font-semibold px-3 py-1.5 rounded-lg hover:bg-cyan-700">View Profile</button>
                    {a.status !== "Accepted" && <button onClick={() => acceptApplicant(a)} className="text-xs font-body font-semibold text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50">Accept</button>}
                    <button onClick={() => rejectApplicant(a)} className="text-xs font-body font-semibold text-rose-500 border border-rose-200 rounded-lg px-3 py-1.5 hover:bg-rose-50">Reject</button>
                  </div>
                </div>
              ))}
              {applicants.length === 0 && <p className="font-body text-sm text-slate-400 text-center py-6">No applicants left to review.</p>}
            </div>
          </div>
        )}

        {tab === "OJT Students" && (
          <div>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {[
                ["Skilled talent pipeline", "Evaluate future hires on real performance before extending an offer."],
                ["Cost-effective workforce", "Fresh, motivated support for projects without long-term headcount cost."],
                ["Community & reputation", "Strengthen ties with partner schools and boost employer brand."],
              ].map(([t, d]) => (
                <div key={t} className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
                  <h4 className="font-display font-semibold text-slate-900 text-sm mb-1">{t}</h4>
                  <p className="font-body text-xs text-slate-600">{d}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
              <h3 className="font-display font-semibold text-slate-900 mb-4">OJT Students — Performance</h3>
              <div className="space-y-4">
                {ojtStudentsSeed.map((s) => (
                  <div key={s.name} className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                    <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-display font-semibold flex items-center justify-center">{s.name[0]}</div>
                    <div className="flex-1 min-w-[140px]">
                      <p className="font-body font-semibold text-sm text-slate-900">{s.name}</p>
                      <p className="font-body text-xs text-slate-500">{s.role}</p>
                    </div>
                    <div className="w-40">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${Math.min((s.hours / s.req) * 100, 100)}%` }} />
                      </div>
                      <p className="text-xs font-body text-slate-500 mt-1">{s.hours}/{s.req} hrs</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-body font-semibold text-amber-500"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {s.score}</span>
                    <button onClick={() => { setEvalStudent(s.name); document.getElementById("eval-form")?.scrollIntoView({ behavior: "smooth" }); notify(`Selected ${s.name} for evaluation below`); }} className="text-xs font-body font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">Evaluate</button>
                    <button
                      disabled={s.hours < s.req}
                      onClick={() => setCertFor(s.name)}
                      className={`text-xs font-body font-semibold rounded-lg px-3 py-1.5 flex items-center gap-1 ${s.hours >= s.req ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                    >
                      <Award className="w-3.5 h-3.5" /> Certificate
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div id="eval-form" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-display font-semibold text-slate-900 mb-3 flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-cyan-600" /> Submit Evaluation</h3>
                <select value={evalStudent} onChange={(e) => setEvalStudent(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body mb-3">
                  {ojtStudentsSeed.map(s => <option key={s.name}>{s.name}</option>)}
                </select>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setEvalPeriod("Weekly")} className={`flex-1 text-xs font-body font-semibold py-2 rounded-lg ${evalPeriod === "Weekly" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600"}`}>Weekly</button>
                  <button onClick={() => setEvalPeriod("Monthly")} className={`flex-1 text-xs font-body font-semibold py-2 rounded-lg ${evalPeriod === "Monthly" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600"}`}>Monthly</button>
                </div>
                <textarea value={evalNotes} onChange={(e) => setEvalNotes(e.target.value)} rows={3} placeholder="Performance notes..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body mb-3" />
                <button onClick={submitEvaluation} className="w-full bg-cyan-600 text-white font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-cyan-700">Submit Evaluation</button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-display font-semibold text-slate-900 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-purple-600" /> Message School Admin</h3>
                <div className="bg-slate-50 rounded-lg p-3 text-xs font-body text-slate-500 mb-3 h-20 overflow-y-auto space-y-1">
                  {messages.map((m, i) => <p key={i}><span className="font-semibold text-slate-700">You:</span> {m}</p>)}
                </div>
                <div className="flex gap-2">
                  <input value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Message the school about a student's qualification..." className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-body" />
                  <button onClick={sendMessage} className="bg-purple-600 text-white text-xs font-body font-semibold px-4 rounded-lg hover:bg-purple-700">Send</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {certFor && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-5" onClick={() => setCertFor(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative border-8 border-double border-cyan-500" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setCertFor(null)} className="absolute top-3 right-3 text-slate-400"><X className="w-5 h-5" /></button>
            <div className="text-center">
              <Award className="w-10 h-10 text-cyan-600 mx-auto mb-3" />
              <p className="font-body text-xs uppercase tracking-widest text-slate-400">Certificate of Completion</p>
              <h2 className="font-display font-bold text-2xl text-slate-900 mt-2">{certFor}</h2>
              <p className="font-body text-sm text-slate-500 mt-3">has successfully completed the required On-the-Job Training hours at</p>
              <p className="font-display font-semibold text-cyan-600 mt-1">Tech Solutions Inc.</p>
              <p className="font-body text-xs text-slate-400 mt-5">Issued via Jump Start · June 2026</p>
              <button onClick={() => notify("Certificate downloaded (demo)")} className="mt-5 bg-cyan-600 text-white font-body font-semibold text-sm px-5 py-2 rounded-lg hover:bg-cyan-700">Download Certificate</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)} accent="text-cyan-600" wide={modal.body === "applicant"}>
          {modal.body === "createPosting" && (
            <form onSubmit={createPosting} className="space-y-4">
              <p className="font-body text-xs text-slate-500 -mt-2">Describe the OJT role and the kind of student your company is looking for.</p>
              <FormField id="posting-title" label="Position / Role" placeholder="e.g. Software Development Intern" value={postingForm.title} onChange={(e) => setPostingForm({ ...postingForm, title: e.target.value })} required />
              <div className="grid sm:grid-cols-2 gap-3">
                <FormField id="posting-department" label="Department" placeholder="e.g. Engineering" value={postingForm.department} onChange={(e) => setPostingForm({ ...postingForm, department: e.target.value })} />
                <FormField id="posting-location" label="Work Location" placeholder="e.g. Manila / Hybrid" value={postingForm.location} onChange={(e) => setPostingForm({ ...postingForm, location: e.target.value })} />
              </div>
              <FormField id="posting-hours" label="Required OJT Hours" type="number" min="1" value={postingForm.requiredHours} onChange={(e) => setPostingForm({ ...postingForm, requiredHours: e.target.value })} required />
              <FormField id="posting-description" label="Job Description" type="textarea" placeholder="Describe the responsibilities, projects, and learning opportunities..." value={postingForm.description} onChange={(e) => setPostingForm({ ...postingForm, description: e.target.value })} required />
              <FormField id="posting-requirements" label="Student Qualifications" type="textarea" placeholder="e.g. Course, year level, technical skills, communication skills..." value={postingForm.requirements} onChange={(e) => setPostingForm({ ...postingForm, requirements: e.target.value })} required />
              <div>
                <label htmlFor="posting-status" className="block text-sm font-body font-medium text-slate-700 mb-1">Posting Status</label>
                <select id="posting-status" value={postingForm.status} onChange={(e) => setPostingForm({ ...postingForm, status: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="active">Publish now</option>
                  <option value="draft">Save as draft</option>
                </select>
              </div>
              {postingError && <p role="alert" className="text-xs font-body text-red-600">{postingError}</p>}
              <button type="submit" disabled={isCreatingPosting} className="w-full bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-body font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 disabled:opacity-60">
                {isCreatingPosting ? "Creating posting..." : postingForm.status === "draft" ? "Save Draft" : "Publish Posting"}
              </button>
            </form>
          )}
          {modal.body === "posting" && (
            <>
              <DetailRow label="Department" value={modal.data.dept} />
              <DetailRow label="Status" value={modal.data.status} />
              <DetailRow label="Applicants" value={modal.data.applicants} />
              <DetailRow label="Posted" value={modal.data.posted} />
            </>
          )}
          {modal.body === "editPosting" && (
            <div className="space-y-3">
              <FormField label="Title" placeholder={modal.data.title} />
              <FormField label="Department" placeholder={modal.data.dept} />
              <button onClick={() => { setModal(null); notify("Posting updated"); }} className="w-full bg-cyan-600 text-white font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-cyan-700">Save Changes</button>
            </div>
          )}
          {modal.body === "applicant" && (
            <div className="space-y-5">
              <ApplicantSection title="Application" fields={[["Applied For", modal.data.for], ["Status", modal.data.status], ["Submitted", new Date(modal.data.submitted).toLocaleDateString()]]} />
              <ApplicantSection title="Personal Information" fields={[["First Name", modal.data.firstName], ["Last Name", modal.data.lastName], ["Email", modal.data.email], ["Phone Number", modal.data.phone]]} />
              <ApplicantSection title="Academic Information" fields={[["School / University", modal.data.school], ["Program / Course", modal.data.program], ["Year Level", modal.data.yearLevel], ["Student ID", modal.data.studentId]]} />
              <ApplicantSection title="OJT Preferences" fields={[["Preferred Industry", modal.data.preferredIndustry], ["Required Duration", `${modal.data.requiredHours} hours`], ["Preferred Start Date", new Date(modal.data.preferredStartDate).toLocaleDateString()]]} />
              <ApplicantSection title="Skills and Motivation" fields={[["Skills & Qualifications", modal.data.skills || "Not provided"], ["Why this OJT?", modal.data.motivation]]} wide />
              <div>
                <h4 className="font-display font-semibold text-sm text-slate-900 mb-3 pb-2 border-b border-slate-200">Submitted Documents</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {modal.data.hasResume ? <a href={`${API_URL}/api/applications/${modal.data.id}/documents/resume`} target="_blank" rel="noreferrer" className="text-center bg-cyan-600 text-white font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-cyan-700">View Resume</a> : <span className="text-center bg-slate-100 text-slate-400 text-sm py-2.5 rounded-lg">No Resume</span>}
                  {modal.data.hasTranscript ? <a href={`${API_URL}/api/applications/${modal.data.id}/documents/transcript`} target="_blank" rel="noreferrer" className="text-center border border-cyan-300 text-cyan-700 font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-cyan-50">View Transcript</a> : <span className="text-center bg-slate-100 text-slate-400 text-sm py-2.5 rounded-lg">No Transcript</span>}
                </div>
              </div>
            </div>
          )}
          {modal.body === "editProfile" && (
            <div className="space-y-3">
              <FormField label="Company Name" placeholder="Tech Solutions Inc." />
              <FormField label="Industry" placeholder="Technology & Software Development" />
              <button onClick={() => { setModal(null); notify("Company profile updated"); }} className="w-full bg-cyan-600 text-white font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-cyan-700">Save Changes</button>
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}

function ApplicantSection({ title, fields, wide = false }) {
  return <section><h4 className="font-display font-semibold text-sm text-slate-900 mb-3 pb-2 border-b border-slate-200">{title}</h4><div className={wide ? "grid gap-3" : "grid sm:grid-cols-2 gap-3"}>{fields.map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap break-words">{value || "—"}</p></div>)}</div></section>;
}
