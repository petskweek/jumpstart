import React from "react";
import { X } from "lucide-react";

export function Modal({ title, onClose, children, accent = "text-slate-900" }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-5" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        <h3 className={`font-display font-bold text-lg mb-4 ${accent}`}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm font-body py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}
