import React from "react";

export default function ProfilePage() {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center bg-neutral-950 text-white px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b0b10] p-8 text-center shadow-2xl">
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-purple-400">
          Profile
        </p>
        <h1 className="mt-4 text-2xl font-bold">Profile page cleared</h1>
        <p className="mt-3 text-sm text-neutral-400">
          This page is ready for your new profile design.
        </p>
      </div>
    </div>
  );
}
