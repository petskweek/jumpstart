import React, { useState } from "react";
import {
  ShieldCheck, Settings, Users2, Clock, CheckCircle2, Building2, UserPlus, Users,
  BarChart3, TrendingUp, FileBarChart2, FileText, Bell, MessageSquare
} from "lucide-react";
import PortalTabs from "../components/PortalTabs.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import { Modal, DetailRow } from "../components/Modal.jsx";
import FormField from "../components/FormField.jsx";
import { initialApprovals, initialManagedStudents } from "../data/mockData.js";

export default function AdminDashboard({ notify, user }) {
  const [tab, setTab] = useState("Approvals");
  const [approvals, setApprovals] = useState(initialApprovals);
  const [studentsList, setStudentsList] = useState(initialManagedStudents);
  const [modal, setModal] = useState(null);

  const approve = (p) => { setApprovals(approvals.filter(x => x.id !== p.id)); notify(`Approved ${p.name}'s placement`); };
  const reject = (p) => { setApprovals(approvals.filter(x => x.id !== p.id)); notify(`Rejected ${p.name}'s application`); };
  const addStudent = () => {
    const ns = { id: Date.now(), name: "New Student", program: "Undeclared | 1st Year", status: "Searching", company: "-" };
    setStudentsList([ns, ...studentsList]); notify("Student added");
  };
  const downloadReport = (name) => notify(`Generating "${name}"... (demo — connect a backend to export real files)`);

  return (
    <section className="bg-purple-50/50 py-10">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <h1 className="font-display font-bold text-3xl text-purple-600">School Admin Portal</h1>
        <p className="font-body text-slate-500 mt-1 mb-6">Monitor students, approve placements, and generate reports</p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900">{user?.name || "School Administrator"}</h2>
              <p className="font-body text-sm text-slate-500">{user?.email || "School account"}</p>
              <div className="flex gap-5 mt-1 text-xs font-body text-slate-500">
                <span>Total Students <b className="text-purple-600">1,247</b></span>
                <span>Placed This Year <b className="text-purple-600">892</b></span>
                <span>Partner Companies <b className="text-purple-600">156</b></span>
              </div>
            </div>
          </div>
          <button onClick={() => setModal({ title: "Settings", body: "settings" })} className="bg-purple-600 text-white font-body font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-purple-700"><Settings className="w-4 h-4" />Settings</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            ["Active Students", "1,247", "↑ 12% from last year", "border-purple-500", <Users2 className="w-4 h-4 text-purple-500" />],
            ["Pending Approvals", approvals.length, "Requires attention", "border-blue-500", <Clock className="w-4 h-4 text-blue-500" />],
            ["Successfully Placed", "892", "71.5% placement rate", "border-emerald-500", <CheckCircle2 className="w-4 h-4 text-emerald-500" />],
            ["Partner Companies", "156", "↑ 8 new this month", "border-orange-500", <Building2 className="w-4 h-4 text-orange-500" />],
          ].map(([label, val, sub, border, icon]) => (
            <div key={label} className={`bg-white border-l-4 ${border} border-t border-r border-b border-slate-200 rounded-xl p-4 shadow-sm`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-body text-xs text-slate-500">{label}</span>{icon}
              </div>
              <p className="font-display font-bold text-2xl text-slate-900">{val}</p>
              <p className="font-body text-xs text-emerald-600 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <PortalTabs tabs={["Approvals", "Students", "Analytics", "Reports", "Notifications"]} active={tab} setActive={setTab} accent="text-purple-600" />

        {tab === "Approvals" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-slate-900">Pending Approvals</h3>
              <span className="bg-blue-600 text-white text-xs font-body font-semibold px-3 py-1.5 rounded-lg">{approvals.length} Pending</span>
            </div>
            <div className="space-y-4">
              {approvals.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <h4 className="font-display font-semibold text-slate-900">{p.name}</h4>
                    <StatusBadge status="Pending Review" />
                  </div>
                  <p className="font-body text-sm text-slate-500 mt-1">Position: {p.position}</p>
                  <p className="font-body text-sm text-slate-500">Company: {p.company}</p>
                  <p className="font-body text-xs text-slate-400 mt-1">Submitted: {p.submitted}</p>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => setModal({ title: p.name, body: "approval", data: p })} className="bg-purple-600 text-white text-xs font-body font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-purple-700"><FileText className="w-3.5 h-3.5" />View Application</button>
                    <button onClick={() => approve(p)} className="bg-emerald-600 text-white text-xs font-body font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" />Approve</button>
                    <button onClick={() => reject(p)} className="text-xs font-body font-semibold text-rose-500 border border-rose-200 rounded-lg px-3 py-1.5 hover:bg-rose-50">Reject</button>
                  </div>
                </div>
              ))}
              {approvals.length === 0 && <p className="font-body text-sm text-slate-400 text-center py-6">All caught up — no pending approvals.</p>}
            </div>
          </div>
        )}

        {tab === "Students" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-slate-900">Student Management</h3>
              <button onClick={addStudent} className="bg-purple-600 text-white text-xs font-body font-semibold px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-purple-700"><UserPlus className="w-3.5 h-3.5" />Add Student</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
              {studentsList.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center"><Users className="w-4 h-4 text-purple-600" /></div>
                  <div className="flex-1 min-w-[140px]">
                    <p className="font-body font-semibold text-sm text-slate-900">{s.name}</p>
                    <p className="font-body text-xs text-slate-500">{s.program}</p>
                  </div>
                  <StatusBadge status={s.status} />
                  <span className="font-body text-sm text-slate-600 w-40">{s.company}</span>
                  <button onClick={() => setModal({ title: s.name, body: "student", data: s })} className="text-xs font-body font-semibold border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50">View Details</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Analytics" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-600" /> Placement by Department</h3>
              {[["Computer Science", 85], ["Business Administration", 78], ["Engineering", 92], ["Marketing", 68]].map(([d, pct]) => (
                <div key={d} className="mb-3">
                  <div className="flex justify-between text-sm font-body text-slate-600 mb-1"><span>{d}</span><span className="font-semibold">{pct}%</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500" style={{ width: `${pct}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Monthly Placement Trend</h3>
              {[["January 2026", 145], ["February 2026", 178], ["March 2026", 156]].map(([m, n]) => (
                <div key={m} className="flex justify-between text-sm font-body py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600">{m}</span><span className="font-semibold text-purple-600">{n} students</span>
                </div>
              ))}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                <span className="font-body text-sm text-slate-700">Total (Q1 2026)</span>
                <span className="font-display font-bold text-lg text-purple-600">479</span>
              </div>
              <p className="text-xs font-body text-emerald-600 mt-1">↑ 15% increase from Q1 2025</p>
            </div>
          </div>
        )}

        {tab === "Reports" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-slate-900">Generate Reports</h3>
              <button onClick={() => downloadReport("Custom Report")} className="bg-purple-600 text-white text-xs font-body font-semibold px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-purple-700"><FileBarChart2 className="w-3.5 h-3.5" />Generate Custom Report</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["Student Placement Report", "Comprehensive report of all student placements including company details and placement rates.", <FileText className="w-4 h-4 text-purple-600" />],
                ["Partner Company Report", "List of all partner companies with their hiring statistics and feedback.", <Building2 className="w-4 h-4 text-blue-600" />],
                ["Analytics Dashboard", "Detailed analytics including trends, success rates, and department performance.", <TrendingUp className="w-4 h-4 text-emerald-600" />],
                ["Student Directory", "Complete directory of all students with their OJT status and contact information.", <Users2 className="w-4 h-4 text-orange-600" />],
              ].map(([title, desc, icon]) => (
                <div key={title} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-2">{icon}<h4 className="font-display font-semibold text-slate-900 text-sm">{title}</h4></div>
                  <p className="font-body text-xs text-slate-500 mb-4">{desc}</p>
                  <button onClick={() => downloadReport(title)} className="w-full border border-slate-300 text-slate-700 text-xs font-body font-semibold py-2 rounded-lg hover:bg-slate-50">Download Report</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Notifications" && (
          <div>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-purple-600" /> Qualification Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-sm font-semibold text-slate-900">Jamie Cruz has met all OJT requirements</p>
                      <p className="font-body text-xs text-slate-500 mt-0.5">240/240 hours · 4.8 avg evaluation · Tech Solutions Inc. — auto-flagged as OJT-ready</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-sm font-semibold text-slate-900">Alex Rivera is approaching qualification</p>
                      <p className="font-body text-xs text-slate-500 mt-0.5">182/240 hours · on pace to qualify in ~3 weeks</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center">
                <ProgressRing value={38} max={50} color="#7c3aed" label="Students OJT-Ready" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
              <h3 className="font-display font-semibold text-slate-900 mb-4">DTR & Evaluation Overview</h3>
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase">
                    <th className="pb-2">Student</th><th className="pb-2">Company</th><th className="pb-2">Hours</th><th className="pb-2">Avg. Eval</th><th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Jamie Cruz", "Tech Solutions Inc.", "240/240", "4.8", "Qualified", "emerald"],
                    ["Alex Rivera", "Tech Solutions Inc.", "182/240", "4.5", "In Progress", "blue"],
                    ["Sam Torres", "Tech Solutions Inc.", "96/240", "4.1", "In Progress", "blue"],
                  ].map((r) => (
                    <tr key={r[0]} className="border-t border-slate-100">
                      <td className="py-2 font-medium text-slate-900">{r[0]}</td>
                      <td className="text-slate-600">{r[1]}</td>
                      <td className="text-slate-600">{r[2]}</td>
                      <td className="text-slate-600">{r[3]}</td>
                      <td className="text-right"><span className={`text-xs font-semibold px-2 py-1 rounded-full bg-${r[5]}-100 text-${r[5]}-700`}>{r[4]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-display font-semibold text-slate-900 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-600" /> Messages from Companies</h3>
              <div className="bg-slate-50 rounded-lg p-3 text-xs font-body text-slate-600">
                <p><span className="font-semibold text-slate-800">Tech Solutions Inc.:</span> Jamie Cruz has completed 240/240 hours with a 4.8 average — ready for sign-off.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)} accent="text-purple-600">
          {modal.body === "approval" && (
            <>
              <DetailRow label="Position" value={modal.data.position} />
              <DetailRow label="Company" value={modal.data.company} />
              <DetailRow label="Submitted" value={modal.data.submitted} />
            </>
          )}
          {modal.body === "student" && (
            <>
              <DetailRow label="Program" value={modal.data.program} />
              <DetailRow label="Status" value={modal.data.status} />
              <DetailRow label="Company" value={modal.data.company} />
            </>
          )}
          {modal.body === "settings" && (
            <div className="space-y-3">
              <FormField label="Institution Name" placeholder="University of Technology" />
              <FormField label="Department" placeholder="Career Services & OJT Coordination" />
              <button onClick={() => { setModal(null); notify("Settings saved"); }} className="w-full bg-purple-600 text-white font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-purple-700">Save Changes</button>
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}
