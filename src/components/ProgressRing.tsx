import React from "react";

// Signature element: circular progress ring used across dashboards
// to show hours-toward-future progress.
export default function ProgressRing({ value, max, size = 120, stroke = 10, color = "#2563eb", label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="50%" y="47%" textAnchor="middle" className="font-display font-bold" fontSize={size * 0.18} fill="#0f172a">{value}</text>
        <text x="50%" y="63%" textAnchor="middle" className="font-body" fontSize={size * 0.1} fill="#64748b">/ {max} hrs</text>
      </svg>
      {label && <div className="text-sm font-body font-medium text-slate-600 mt-2">{label}</div>}
    </div>
  );
}
