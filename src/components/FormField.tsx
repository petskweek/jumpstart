import React from "react";

export default function FormField({ label, placeholder, type = "text", full = false, ...inputProps }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label htmlFor={inputProps.id} className="block text-sm font-body font-medium text-slate-700 mb-1">{label}</label>
      {type === "textarea" ? (
        <textarea placeholder={placeholder} rows={3} {...inputProps} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue-500" />
      ) : (
        <input type={type} placeholder={placeholder} {...inputProps} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  );
}
