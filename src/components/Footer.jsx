import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import Logo from "./Logo.jsx";

const portalByRole = {
  student: { page: "studentDashboard", label: "Student Portal" },
  company: { page: "companyDashboard", label: "Company Portal" },
  admin: { page: "adminDashboard", label: "School Portal" },
};

export default function Footer({ setPage, user }) {
  const portal = user && portalByRole[user.role];
  return (
    <footer className="bg-slate-900 text-slate-300 font-body">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Every clocked-in hour builds toward a student's career. Connecting students, companies, and schools, seamlessly.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-white mb-3 text-sm">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => setPage("home")} className="hover:text-cyan-400">Home</button></li>
            <li><button onClick={() => setPage("about")} className="hover:text-cyan-400">About OJT</button></li>
            <li><button onClick={() => setPage("request")} className="hover:text-cyan-400">Request OJT</button></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-white mb-3 text-sm">Portals</h4>
          <ul className="space-y-2 text-sm">
            {portal ? <li><button onClick={() => setPage(portal.page)} className="hover:text-cyan-400">{portal.label}</button></li> : <li><button onClick={() => setPage("signin")} className="hover:text-cyan-400">Sign in to your portal</button></li>}
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-white mb-3 text-sm">Contact Us</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@jumpstart.edu</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +1 (555) 123-4567</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> 123 Education St, City</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">© 2026 Jump Start. All rights reserved.</div>
    </footer>
  );
}
