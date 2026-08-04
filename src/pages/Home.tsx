import React from "react";
import { Users, Building2, ShieldCheck, CheckCircle2, FileText, TrendingUp, ClipboardCheck, Award, ChevronRight, Sparkles } from "lucide-react";
import SectionEyebrow from "../components/SectionEyebrow.jsx";
import StatBar from "../components/StatBar.jsx";

export default function Home({ setPage }) {
  return (
    <>
      <section className="bg-gradient-to-b from-blue-50 to-cyan-50">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-20 md:py-24 text-center">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl leading-tight text-blue-600">
            Jump Start: Streamlining OJT for a Brighter Future
          </h1>
          <p className="font-body text-slate-600 text-lg mt-6 max-w-2xl mx-auto">
            Connect students with companies, manage internships seamlessly, and build the foundation for successful careers.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <button onClick={() => setPage("request")} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-body font-semibold px-8 py-3.5 rounded-lg shadow-lg hover:opacity-90 flex items-center gap-2">
              Register Now <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 md:py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Users className="w-5 h-5 text-blue-600" />, bg: "bg-blue-100", title: "Student Portal",
              items: ["Create & Manage Profile", "View Available OJT Positions", "Apply and Track Requests", "Secure File Upload"],
              btn: "Go to Student Portal", page: "studentDashboard", btnClass: "bg-blue-600 hover:bg-blue-700" },
            { icon: <Building2 className="w-5 h-5 text-cyan-600" />, bg: "bg-cyan-100", title: "Company Portal",
              items: ["Post OJT Openings", "Manage Job Requirements", "Review Students Profiles", "Direct Student Selection"],
              btn: "Go to Company Portal", page: "companyDashboard", btnClass: "bg-cyan-600 hover:bg-cyan-700" },
            { icon: <ShieldCheck className="w-5 h-5 text-purple-600" />, bg: "bg-purple-100", title: "School Admin Portal",
              items: ["Monitor Hiring Progress", "Manage Student Accounts", "Generate Reports & Analytics", "Approve OJT Applications"],
              btn: "Go to Admin Portal", page: "adminDashboard", btnClass: "bg-purple-600 hover:bg-purple-700" },
          ].map((c) => (
            <div key={c.title} className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center mb-4`}>{c.icon}</div>
              <h3 className="font-display font-bold text-lg text-slate-900 mb-3">{c.title}</h3>
              <ul className="space-y-3 mb-6">
                {c.items.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-body text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> {i}
                  </li>
                ))}
              </ul>
              <button onClick={() => setPage(c.page)} className={`w-full text-white font-body font-semibold text-sm py-2.5 rounded-lg ${c.btnClass}`}>
                {c.btn}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-10">
            <SectionEyebrow>What's inside</SectionEyebrow>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">Core Platform Features</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { icon: <FileText />, title: "Document Management", desc: "Secure upload and storage of student documents and credentials", c: "bg-blue-600" },
              { icon: <TrendingUp />, title: "Real-time Tracking", desc: "Monitor application status, hiring, and hours in real time", c: "bg-cyan-600" },
              { icon: <Users />, title: "Profile Matching", desc: "Smart matching between student skills and company requirements", c: "bg-purple-600" },
              { icon: <ClipboardCheck />, title: "Approval Workflow", desc: "Streamlined approval process for schools and companies", c: "bg-indigo-600" },
              { icon: <Award />, title: "Certification", desc: "Companies generate official certificates of completion", c: "bg-emerald-600" },
            ].map((f) => (
              <div key={f.title} className="text-center">
                <div className={`w-12 h-12 rounded-xl ${f.c} flex items-center justify-center mx-auto mb-3 text-white`}>
                  {React.cloneElement(f.icon, { className: "w-5 h-5" })}
                </div>
                <h4 className="font-display font-semibold text-slate-900 text-sm mb-1">{f.title}</h4>
                <p className="font-body text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StatBar />

      <section className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-center py-16">
        <h2 className="font-display font-bold text-2xl sm:text-3xl mb-3">Ready to Get Started?</h2>
        <p className="font-body text-blue-50 mb-7">Join thousands of students and companies already using Jump Start to build successful careers.</p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setPage("request")} className="bg-white text-blue-700 font-body font-semibold px-6 py-3 rounded-lg">Register Now</button>
          <button onClick={() => setPage("signin")} className="border border-white/50 text-white font-body font-semibold px-6 py-3 rounded-lg">Sign In</button>
        </div>
      </section>
    </>
  );
}