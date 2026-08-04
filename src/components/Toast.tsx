import React from "react";
import { CheckCircle2 } from "lucide-react";

// Bottom-of-screen confirmation shown after any button action
export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white font-body text-sm px-5 py-3 rounded-full shadow-xl flex items-center gap-2 max-w-[90vw]">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="truncate">{message}</span>
    </div>
  );
}
