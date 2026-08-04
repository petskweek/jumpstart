import React from "react";

// Segmented pill tab bar used across all three portals
export default function PortalTabs({ tabs, active, setActive, accent = "text-blue-600" }) {
  return (
    <div className="inline-flex flex-wrap bg-slate-100 rounded-lg p-1 mb-6 gap-1">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setActive(t)}
          className={`text-xs sm:text-sm font-body font-semibold px-4 py-2 rounded-md transition-colors ${
            active === t ? `bg-white shadow-sm ${accent}` : "text-slate-500"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
