import React, { useState } from "react";
import Logo from "./Logo.jsx";

const NavLink = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`text-sm font-body font-medium px-1 py-2 border-b-2 transition-colors ${
      active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:text-blue-600"
    }`}
  >
    {label}
  </button>
);

const portalLabelByRole = { student: "Student Portal", company: "Company Portal", admin: "School Portal" };
const portalPageByRole = { student: "studentDashboard", company: "companyDashboard", admin: "adminDashboard" };

export default function Navbar({ page, setPage, user, onLogout }) {
  const [open, setOpen] = useState(false);
  const links = [
    { id: "home", label: "Home" },
    { id: "about", label: "About OJT" },
    { id: "request", label: "Request OJT" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setPage("home")}><Logo /></button>
          {user && <span className="hidden sm:inline text-sm font-body font-semibold text-slate-700">{user.name}</span>}
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <NavLink key={l.id} label={l.label} active={page === l.id} onClick={() => setPage(l.id)} />
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {user ? <>
            <button onClick={() => setPage(portalPageByRole[user.role])} className="text-sm font-body font-semibold text-blue-600">{portalLabelByRole[user.role]}</button>
            <button onClick={onLogout} className="border border-slate-300 text-slate-700 font-body font-semibold text-sm px-4 py-2 rounded-lg">Log out</button>
          </> : <button onClick={() => setPage("signin")} className="bg-blue-600 hover:bg-blue-700 text-white font-body font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm transition-colors">Sign In</button>}
        </div>
        <button className="md:hidden text-slate-700" onClick={() => setOpen(!open)} aria-label="Menu">
          <div className="w-6 h-0.5 bg-slate-700 mb-1.5"></div>
          <div className="w-6 h-0.5 bg-slate-700 mb-1.5"></div>
          <div className="w-6 h-0.5 bg-slate-700"></div>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 px-5 py-3 flex flex-col gap-3">
          {links.map((l) => (
            <button key={l.id} onClick={() => { setPage(l.id); setOpen(false); }} className="text-left text-slate-700 font-body font-medium py-1">
              {l.label}
            </button>
          ))}
          {user ? <>
            <button onClick={() => { setPage(portalPageByRole[user.role]); setOpen(false); }} className="bg-blue-600 text-white font-body font-semibold text-sm px-4 py-2.5 rounded-lg text-center">{portalLabelByRole[user.role]}</button>
            <button onClick={() => { onLogout(); setOpen(false); }} className="text-left text-slate-700 font-body font-medium py-1">Log out</button>
          </> : <button onClick={() => { setPage("signin"); setOpen(false); }} className="bg-blue-600 text-white font-body font-semibold text-sm px-4 py-2.5 rounded-lg text-center">Sign In</button>}
        </div>
      )}
    </header>
  );
}
