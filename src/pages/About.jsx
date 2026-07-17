import React from "react";
import { Users, Building2, ShieldCheck, Sparkles, Star } from "lucide-react";
import StatBar from "../components/StatBar.jsx";

export default function About() {
  return (
    <>
      <section className="bg-gradient-to-r from-blue-700 to-cyan-500 text-white text-center py-16">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl">About On-the-Job Training</h1>
        <p className="font-body text-blue-50 mt-3">Bridging the gap between education and professional experience</p>
      </section>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-14">
        <h2 className="font-display font-bold text-2xl text-blue-600 text-center mb-6">What is OJT?</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm font-body text-slate-600 leading-relaxed space-y-4">
          <p>On-the-Job Training (OJT) is a hands-on method of teaching the skills, knowledge, and competencies needed for students to perform a specific job within the workplace. It's an essential component of many educational programs, providing real-world experience in the student's field of study.</p>
          <p>Through OJT, students gain practical experience, develop professional skills, and build valuable industry connections that help them transition from academic learning to professional careers — tracked every step of the way through logged hours and regular evaluations.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mb-3"><Sparkles className="w-5 h-5 text-white" /></div>
            <h3 className="font-display font-bold text-slate-900 mb-2">Our Mission</h3>
            <p className="font-body text-sm text-slate-600">To provide a seamless platform connecting students with quality OJT opportunities, verified hours, and real feedback that builds career-ready skills.</p>
          </div>
          <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center mb-3"><Star className="w-5 h-5 text-white" /></div>
            <h3 className="font-display font-bold text-slate-900 mb-2">Our Vision</h3>
            <p className="font-body text-sm text-slate-600">To become the leading platform for OJT placement — a trusted bridge between education and industry that benefits students, companies, and schools alike.</p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <h2 className="font-display font-bold text-2xl text-blue-600 text-center mb-10">Benefits of OJT</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <Users />, c: "bg-blue-600", title: "For Students", items: ["Gain real-world work experience", "Apply classroom knowledge practically", "Build professional network", "Enhance resume and employability", "Explore career paths and interests"] },
              { icon: <Building2 />, c: "bg-cyan-600", title: "For Companies", items: ["Access skilled talent pool before hiring", "Evaluate potential employees on real performance", "Fresh perspectives and ideas", "Cost-effective workforce solutions", "Direct pipeline of pre-trained hires"] },
              { icon: <ShieldCheck />, c: "bg-purple-600", title: "For Schools", items: ["Enhanced student outcomes", "Industry partnerships and collaboration", "Improved curriculum relevance", "Higher graduate employment rates", "Better institutional reputation"] },
            ].map((g) => (
              <div key={g.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className={`w-11 h-11 rounded-xl ${g.c} flex items-center justify-center mb-4 text-white`}>{React.cloneElement(g.icon, { className: "w-5 h-5" })}</div>
                <h3 className="font-display font-bold text-slate-900 mb-3">{g.title}</h3>
                <ul className="space-y-2">
                  {g.items.map((i) => <li key={i} className="text-sm font-body text-slate-600 flex gap-2"><span className="text-blue-500">•</span>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-14">
        <h2 className="font-display font-bold text-2xl text-blue-600 text-center mb-10">How Jump Start Works</h2>
        <div className="space-y-4">
          {[
            ["1", "Student Registration", "Students create profiles, upload credentials, and specify OJT preferences and career interests.", "bg-blue-600"],
            ["2", "Company Posting", "Companies post available OJT positions with specific requirements, responsibilities, and benefits."],
            ["3", "Matching & Application", "The platform matches students with suitable positions. Students browse, apply, and track applications.", "bg-purple-600"],
            ["4", "School Approval", "School administrators review and approve placements, ensuring alignment with academic requirements."],
            ["5", "OJT Experience & DTR", "Students log daily time records, and companies submit weekly and monthly performance evaluations.", "bg-cyan-600"],
            ["6", "Qualification & Certification", "Once hours and evaluations meet requirements, the school is notified and the company generates a certificate of completion.", "bg-emerald-600"],
          ].map(([n, title, desc, color], idx) => (
            <div key={n} className="bg-white border-l-4 rounded-xl p-5 shadow-sm flex gap-4" style={{ borderLeftColor: ["#2563eb","#0891b2","#7c3aed","#2563eb","#0891b2","#059669"][idx] }}>
              <div className={`w-8 h-8 rounded-full ${color || "bg-blue-600"} text-white font-display font-bold text-sm flex items-center justify-center shrink-0`}>{n}</div>
              <div>
                <h4 className="font-display font-semibold text-slate-900">{title}</h4>
                <p className="font-body text-sm text-slate-600 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <StatBar />
    </>
  );
}
