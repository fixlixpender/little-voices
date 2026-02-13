"use client";
import React from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen bg-slate-50">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Settings</h1>
      
      <div className="space-y-4">
        <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-700 mb-2">Family Sharing</h2>
          <p className="text-xs text-slate-500 mb-4">Connect with Rebecca to share memories instantly.</p>
          <button className="w-full py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold">
            Generate Invite Code
          </button>
        </section>

        <button 
          onClick={handleLogout}
          className="w-full py-4 bg-red-50 text-red-500 font-bold rounded-2xl border border-red-100 hover:bg-red-100 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
