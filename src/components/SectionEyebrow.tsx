import React from "react";

export default function SectionEyebrow({ children, color = "text-blue-600" }) {
  return <div className={`font-body font-semibold text-xs tracking-widest uppercase ${color} mb-2`}>{children}</div>;
}