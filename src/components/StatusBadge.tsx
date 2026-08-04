import React from "react";

export default function StatusBadge({ status }) {
  const map = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-rose-100 text-rose-700",
    Withdrawn: "bg-slate-200 text-slate-600",
    Active: "bg-emerald-100 text-emerald-700",
    Closed: "bg-slate-200 text-slate-600",
    New: "bg-amber-100 text-amber-700",
    Applied: "bg-blue-100 text-blue-700",
    Reviewed: "bg-blue-100 text-blue-700",
    Accepted: "bg-emerald-100 text-emerald-700",
    Placed: "bg-emerald-500 text-white",
    Interviewing: "bg-blue-500 text-white",
    Searching: "bg-slate-400 text-white",
    "Pending Review": "bg-amber-400 text-white",
  };
  return (
    <span className={`text-xs font-body font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${map[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
