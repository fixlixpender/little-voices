"use client";
import React from 'react';

export default function MemoriesPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-slate-50">
      <h1 className="text-2xl font-bold mb-2 text-slate-800">All Memories</h1>
      <p className="text-slate-500 mb-6 text-sm">Every little word, captured forever.</p>
      
      {/* Search and Feed components will be moved here later */}
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-3xl">
        <span className="text-4xl mb-4">📚</span>
        <p className="text-slate-400">Your full history will appear here.</p>
      </div>
    </div>
  );
}
