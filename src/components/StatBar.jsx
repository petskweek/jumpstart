import React from "react";

export default function StatBar() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white font-body">
        {[["5,000+", "Active Students"], ["500+", "Partner Companies"], ["50+", "Partner Schools"], ["95%", "Success Rate"]].map(([num, label]) => (
          <div key={label}>
            <div className="font-display text-3xl font-extrabold">{num}</div>
            <div className="text-sm text-blue-50 mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
