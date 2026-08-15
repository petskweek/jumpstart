
// @ts-nocheck -- migrated JSX preserved while dashboard domain types are consolidated.
import React, { useEffect, useState } from "react";
import {
  Users, Mail, Phone, Building2, Briefcase, MapPin, Clock, FileText, Award, TrendingUp,
  Play, Square, Calendar, Star, BarChart3, UploadCloud
} from "lucide-react";
import PortalTabs from "../components/PortalTabs.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import { Modal, DetailRow } from "../components/Modal.jsx";
import FormField from "../components/FormField.jsx";
import { initialDocuments, dtrLogs } from "../data/mockData.js";
import { api } from "../lib/api.ts";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const formatFullName = (firstName, lastName, fallback = "Student") => {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || fallback;
  return fullName.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, letter => letter.toUpperCase());
};

export default function StudentDashboard({ notify, user }) {
  const [tab, setTab] = useState("My Applications");
  const [clockedIn, setClockedIn] = useState(false);
  const [apps, setApps] = useState([]);
  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [docs, setDocs] = useState(initialDocuments);
  const [modal, setModal] = useState(null);
  const [ojtApplication, setOjtApplication] = useState(null);
  const completed = 182;
  const required = 240;
  const qualified = completed >= required;
  const displayName = formatFullName(ojtApplication?.firstName, ojtApplication?.lastName, user?.name || "Student");
  const displayPhone = ojtApplication?.phone || "No phone number provided";

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/ojt/my-application.php`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setOjtApplication(data?.application || null))
      .catch(() => setOjtApplication(null));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setPositionsLoading(true);
    Promise.all([api.getApplications(), api.getPostings()])
      .then(([applicationData, postingData]) => {
        setApps(applicationData.applications.map((application) => ({
          id: application.id,
          title: application.postingTitle || "OJT Placement Request",
          company: application.company || "School placement review",
          location: "—",
          hours: `${application.requiredHours} hours`,
          applied: new Date(application.createdAt).toLocaleDateString(),
          status: application.status[0].toUpperCase() + application.status.slice(1),
          postingId: application.postingId,
          firstName: application.firstName,
          lastName: application.lastName,
          email: application.email,
          phone: application.phone,
          school: application.school,
          program: application.program,
          yearLevel: application.yearLevel,
          studentId: application.studentId,
          preferredIndustry: application.preferredIndustry,
          requiredHours: application.requiredHours,
          preferredStartDate: application.preferredStartDate.slice(0, 10),
          skills: application.skills || "",
          motivation: application.motivation,
        })));
        setPositions(postingData.postings.map((posting) => ({
          id: posting.id,
          title: posting.title,
          company: posting.company,
          desc: posting.description,
          location: posting.location || "Location to be confirmed",
          hours: `${posting.requiredHours} hours`,
          tags: posting.requirements?.split(",").map((item) => item.trim()).filter(Boolean) || [],
          applied: applicationData.applications.some((application) => application.postingId === posting.id && !["rejected", "withdrawn"].includes(application.status)),
        })));
      })
      .catch((error) => { setPositions([]); notify(error.message || "Unable to load live OJT data."); })
      .finally(() => setPositionsLoading(false));
  }, [user?.id]);

  const withdraw = async (a) => {
    try {
      await api.updateOwnApplication(a.id, "withdraw");
      setApps(current => current.map(x => x.id === a.id ? { ...x, status: "Withdrawn" } : x));
      if (a.postingId) setPositions(current => current.map(x => x.id === a.postingId ? { ...x, applied: false } : x));
      notify(`Withdrew application: ${a.title}`);
    } catch (error) { notify(error.message || "Unable to withdraw application."); }
  };
  const restore = async (a) => {
    try {
      await api.updateOwnApplication(a.id, "restore");
      setApps(current => current.map(x => x.id === a.id ? { ...x, status: "Pending" } : x));
      if (a.postingId) setPositions(current => current.map(x => x.id === a.postingId ? { ...x, applied: true } : x));
      notify(`Restored application: ${a.title}`);
    } catch (error) { notify(error.message || "Unable to restore application."); }
  };
  const permanentlyDelete = async (a) => {
    if (!window.confirm(`Permanently delete the withdrawn application for "${a.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteOwnApplication(a.id);
      setApps(current => current.filter(x => x.id !== a.id));
      notify(`Permanently deleted application: ${a.title}`);
    } catch (error) { notify(error.message || "Unable to delete application."); }
  };
  const saveApplicationEdits = async () => {
    const a = modal.data;
    try {
      await api.editOwnApplication(a.id, a);
      setApps(current => current.map(item => item.id === a.id ? { ...item, ...a, hours: `${a.requiredHours} hours` } : item));
      setModal(current => ({ ...current, editing: false }));
      notify("Application details updated.");
    } catch (error) { notify(error.message || "Unable to update application."); }
  };
  const applyNow = async (p) => {
    try {
      await api.applyToPosting(p.id, `I am interested in the ${p.title} OJT opportunity.`);
      setPositions(positions.map(x => x.id === p.id ? { ...x, applied: true } : x));
      notify(`Applied to ${p.title} at ${p.company}!`);
    } catch (error) { notify(error.message || "Unable to submit application."); }
  };
  const replaceDoc = (name) => { setDocs(docs.map(d => d.name === name ? { ...d, date: "2026-07-07" } : d)); notify(`${name} replaced`); };
  const uploadDoc = () => { const name = `New_Document_${docs.length + 1}.pdf`; setDocs([...docs, { name, date: "2026-07-07" }]); notify("Document uploaded"); };

  return (
    <section className="bg-blue-50/60 py-10">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <h1 className="font-display font-bold text-3xl text-blue-600">Student Portal</h1>
        <p className="font-body text-slate-500 mt-1 mb-6">Manage your profile, applications, and find OJT opportunities</p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900 leading-tight">{displayName}</h2>
              {ojtApplication && <p className="font-body text-sm text-slate-500 mt-1">{ojtApplication.program} <span className="text-slate-300 mx-1">•</span> {ojtApplication.yearLevel} <span className="text-slate-300 mx-1">•</span> {ojtApplication.school}</p>}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-body text-slate-500">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user?.email || ""}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {displayPhone}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setModal({ title: "Edit Profile", body: "editProfile" })} className="bg-blue-600 text-white font-body font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-700">Edit Profile</button>
        </div>

        <PortalTabs tabs={["My Applications", "Available Positions", "My OJT & DTR", "Documents"]} active={tab} setActive={setTab} accent="text-blue-600" />

        {tab === "My Applications" && (
          <div>
            <h3 className="font-display font-bold text-slate-900 mb-4">My Applications</h3>
            <div className="space-y-4">
              {apps.map((a) => (
                <div key={a.id} className="bg-white border-l-4 border-blue-500 rounded-xl shadow-sm p-5">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <h4 className="font-display font-semibold text-slate-900">{a.title}</h4>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="font-body text-sm text-slate-500 flex items-center gap-1 mt-1"><Building2 className="w-3.5 h-3.5" /> {a.company}</p>
                  <div className="flex flex-wrap gap-4 text-xs font-body text-slate-500 mt-2">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {a.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {a.hours}</span>
                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Applied: {a.applied}</span>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => setModal({ title: a.title, body: "application", data: { ...a }, editing: false })} className="text-xs font-body font-semibold border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-50">View Details</button>
                    {a.status === "Pending" && <button onClick={() => withdraw(a)} className="text-xs font-body font-semibold text-rose-500 rounded-lg px-3 py-1.5 hover:bg-rose-50">Withdraw Application</button>}
                    {a.status === "Withdrawn" && <button onClick={() => restore(a)} className="text-xs font-body font-semibold text-emerald-600 rounded-lg px-3 py-1.5 hover:bg-emerald-50">Restore Application</button>}
                    {a.status === "Withdrawn" && <button onClick={() => permanentlyDelete(a)} className="text-xs font-body font-semibold text-white bg-rose-600 rounded-lg px-3 py-1.5 hover:bg-rose-700">Delete Permanently</button>}
                  </div>
                </div>
              ))}
              {apps.length === 0 && <div className="bg-white border border-slate-200 rounded-xl p-8 text-center"><FileText className="w-9 h-9 text-slate-300 mx-auto mb-2"/><p className="font-semibold text-sm text-slate-700">No applications yet</p><p className="text-xs text-slate-500 mt-1">Applications you submit will appear here.</p></div>}
            </div>
          </div>
        )}

        {tab === "Available Positions" && (
          <div>
            <h3 className="font-display font-bold text-slate-900 mb-4">Available OJT Positions</h3>
            <div className="space-y-5">
              {positions.map((p) => (
                <article key={p.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-6 sm:px-8 sm:py-7">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-display font-semibold text-sm text-slate-900">{p.title}</h4>
                      <p className="font-body text-sm text-slate-700 flex items-center gap-1.5 mt-2"><Building2 className="w-4 h-4 text-slate-700" /> {p.company}</p>
                    </div>
                    <StatusBadge status={p.applied ? "Applied" : "New"} />
                  </div>
                  <p className="font-body text-sm text-slate-700 mt-7 leading-relaxed">{p.desc}</p>
                  <div className="grid sm:grid-cols-2 gap-4 text-xs font-body text-slate-500 mt-8 max-w-2xl">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> {p.location}</span>
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> {p.hours}</span>
                  </div>
                  <p className="font-body text-xs font-semibold text-slate-700 mt-6">Requirements:</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {p.tags.map((t) => <span key={t} className="border border-slate-300 bg-white text-slate-700 text-[11px] font-body px-3 py-1 rounded-md">{t}</span>)}
                    {p.tags.length === 0 && <span className="text-xs font-body text-slate-400">No specific requirements listed.</span>}
                  </div>
                  <div className="flex gap-3 mt-8">
                    <button disabled={p.applied} onClick={() => applyNow(p)} className={`min-w-24 text-xs font-body font-semibold px-5 py-2.5 rounded-lg ${p.applied ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-700 text-white hover:bg-blue-800"}`}>
                      {p.applied ? "Applied ✓" : "Apply Now"}
                    </button>
                    <button onClick={() => setModal({ title: p.title, body: "position", data: p })} className="border border-slate-300 text-slate-800 text-xs font-body font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-50">Learn More</button>
                  </div>
                </article>
              ))}
              {positionsLoading && <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm font-body text-slate-500">Loading positions from the database...</div>}
              {!positionsLoading && positions.length === 0 && <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center"><Briefcase className="w-9 h-9 text-slate-300 mx-auto mb-2"/><p className="font-semibold text-sm text-slate-700">No active job postings</p><p className="text-xs text-slate-500 mt-1">Published company postings will appear here.</p></div>}
            </div>
          </div>
        )}

        {tab === "My OJT & DTR" && (
          <div>
            <div className={`rounded-2xl p-5 mb-6 flex items-center gap-4 border ${qualified ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"}`}>
              {qualified ? <Award className="w-8 h-8 text-emerald-600 shrink-0" /> : <TrendingUp className="w-8 h-8 text-blue-600 shrink-0" />}
              <div>
                <h3 className="font-display font-semibold text-slate-900 text-sm">
                  {qualified ? "You've met the requirements — your admin has been notified!" : "On track to qualify for OJT completion"}
                </h3>
                <p className="font-body text-xs text-slate-600 mt-0.5">{required - completed > 0 ? `${required - completed} hours left, plus evaluation review, to auto-notify your school admin.` : "Your school admin has received an automatic qualification notice."}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center shadow-sm">
                <ProgressRing value={completed} max={required} label="Hours Completed" />
              </div>

              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /> Daily Time Record (DTR)</h3>
                  <button
                    onClick={() => { setClockedIn(!clockedIn); notify(clockedIn ? "Clocked out — have a great day!" : "Clocked in — timer started"); }}
                    className={`flex items-center gap-2 text-xs font-body font-semibold px-4 py-2 rounded-lg text-white ${clockedIn ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                  >
                    {clockedIn ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {clockedIn ? "Clock Out" : "Clock In"}
                  </button>
                </div>
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs uppercase">
                      <th className="pb-2">Date</th><th className="pb-2">Time In</th><th className="pb-2">Time Out</th><th className="pb-2 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clockedIn && <tr className="text-emerald-600 font-medium"><td className="py-1.5">Today</td><td>9:00 AM</td><td>—</td><td className="text-right">in progress</td></tr>}
                    {dtrLogs.map((r) => (
                      <tr key={r.date} className="border-t border-slate-100 text-slate-600">
                        <td className="py-1.5">{r.date}</td><td>{r.in}</td><td>{r.out}</td><td className="text-right">{r.hrs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-cyan-600" /> Weekly Evaluations</h3>
                {[["Jun 23–27", 4.6], ["Jun 16–20", 4.4], ["Jun 9–13", 4.2]].map(([wk, score]) => (
                  <div key={wk} className="flex items-center justify-between py-2 border-t border-slate-100 first:border-t-0">
                    <span className="font-body text-sm text-slate-600">{wk}</span>
                    <span className="flex items-center gap-1 text-sm font-body font-semibold text-amber-500"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {score}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-600" /> Monthly Evaluation — June</h3>
                <ul className="space-y-2 font-body text-sm text-slate-600">
                  <li className="flex justify-between"><span>Work Quality</span><span className="font-semibold text-slate-900">Excellent</span></li>
                  <li className="flex justify-between"><span>Attendance</span><span className="font-semibold text-slate-900">98%</span></li>
                  <li className="flex justify-between"><span>Communication</span><span className="font-semibold text-slate-900">Very Good</span></li>
                </ul>
                <p className="text-xs font-body text-slate-500 mt-2 bg-slate-50 rounded-lg p-3">"John consistently delivers reliable, detail-oriented work and communicates proactively with the team."</p>
              </div>
            </div>
          </div>
        )}

        {tab === "Documents" && (
          <div>
            <h3 className="font-display font-bold text-slate-900 mb-4">My Documents</h3>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="space-y-3">
                {docs.map((d) => (
                  <div key={d.name} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-body text-sm font-medium text-slate-900">{d.name}</p>
                        <p className="font-body text-xs text-slate-400">Uploaded on {d.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setModal({ title: d.name, body: "docPreview", data: d })} className="text-xs font-body font-semibold border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50">View</button>
                      <button onClick={() => replaceDoc(d.name)} className="text-xs font-body font-semibold border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50">Replace</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={uploadDoc} className="w-full mt-4 bg-blue-600 text-white font-body font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700">
                <UploadCloud className="w-4 h-4" /> Upload New Document
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)} accent="text-blue-600">
          {modal.body === "application" && (
            <div>
              <div className="flex justify-between items-center mb-3 pr-7"><p className="text-xs text-slate-500">Submitted application data</p>{["Pending", "Withdrawn"].includes(modal.data.status) && <button type="button" onClick={() => setModal(current => ({ ...current, editing: !current.editing }))} className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">{modal.editing ? "Cancel Edit" : "Edit"}</button>}</div>
              {!modal.editing ? <>
                <DetailRow label="First Name" value={modal.data.firstName} /><DetailRow label="Last Name" value={modal.data.lastName} />
                <DetailRow label="Email" value={modal.data.email} /><DetailRow label="Phone" value={modal.data.phone} />
                <DetailRow label="School" value={modal.data.school} /><DetailRow label="Program" value={modal.data.program} />
                <DetailRow label="Year Level" value={modal.data.yearLevel} /><DetailRow label="Student ID" value={modal.data.studentId} />
                <DetailRow label="Preferred Industry" value={modal.data.preferredIndustry} /><DetailRow label="Required Hours" value={`${modal.data.requiredHours} hours`} />
                <DetailRow label="Preferred Start" value={new Date(`${modal.data.preferredStartDate}T00:00:00`).toLocaleDateString()} />
                <DetailRow label="Skills" value={modal.data.skills || "—"} /><DetailRow label="Motivation" value={modal.data.motivation} />
                <DetailRow label="Company" value={modal.data.company} /><DetailRow label="Applied On" value={modal.data.applied} /><DetailRow label="Status" value={modal.data.status} />
              </> : <div className="grid gap-3">
                {[['First Name','firstName','text'],['Last Name','lastName','text'],['Email','email','email'],['Phone','phone','text'],['School','school','text'],['Program','program','text'],['Year Level','yearLevel','text'],['Student ID','studentId','text'],['Preferred Industry','preferredIndustry','text'],['Required Hours','requiredHours','number'],['Preferred Start Date','preferredStartDate','date']].map(([label, name, type]) => <FormField key={name} label={`${label} *`} id={`edit-${name}`} name={name} type={type} value={modal.data[name]} onChange={event => setModal(current => ({ ...current, data: { ...current.data, [name]: event.target.value } }))} required />)}
                <FormField label="Skills" id="edit-skills" name="skills" type="textarea" value={modal.data.skills} onChange={event => setModal(current => ({ ...current, data: { ...current.data, skills: event.target.value } }))} />
                <FormField label="Motivation *" id="edit-motivation" name="motivation" type="textarea" value={modal.data.motivation} onChange={event => setModal(current => ({ ...current, data: { ...current.data, motivation: event.target.value } }))} required />
                <button type="button" onClick={saveApplicationEdits} className="w-full bg-blue-600 text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-blue-700">Save Changes</button>
              </div>}
            </div>
          )}
          {modal.body === "position" && (
            <>
              <p className="font-body text-sm text-slate-600 mb-3">{modal.data.desc}</p>
              <DetailRow label="Company" value={modal.data.company} />
              <DetailRow label="Location" value={modal.data.location} />
              <DetailRow label="Hours" value={modal.data.hours} />
              <DetailRow label="Requirements" value={modal.data.tags.join(", ")} />
            </>
          )}
          {modal.body === "docPreview" && (
            <div className="bg-slate-50 rounded-lg p-6 text-center font-body text-sm text-slate-500">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              Preview not available in this demo — in the live app this would open {modal.data.name}.
            </div>
          )}
          {modal.body === "editProfile" && (
            <div className="space-y-3">
              <FormField label="Full Name" placeholder="John Doe" />
              <FormField label="Program/Course" placeholder="Computer Science" />
              <button onClick={() => { setModal(null); notify("Profile updated"); }} className="w-full bg-blue-600 text-white font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-blue-700">Save Changes</button>
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}
