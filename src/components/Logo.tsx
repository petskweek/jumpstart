import React from "react";
import { GraduationCap } from "lucide-react";

export default function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
        <GraduationCap className="w-5 h-5 text-white" />
      </div>
      <span className={`font-display font-bold text-lg ${light ? "text-white" : "text-slate-900"}`}>Jump Start</span>
    </div>
  );
}
