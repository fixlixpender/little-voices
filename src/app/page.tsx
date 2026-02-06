"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AddChildForm from '@/components/AddChildForm';
import AddWordForm from '@/components/AddWordForm';
import MemoryFeed from '@/components/MemoryFeed';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
      }
    });
  }, [router]);

  if (!session) return null; // Prevent flicker while checking session

  return (
    <main className="min-h-screen bg-transparent py-10 px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 italic tracking-tight">Little Voices</h1>
        <button
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          className="text-[10px] font-black text-slate-400 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-full border border-slate-200 hover:border-red-200 transition-all uppercase tracking-[0.2em] bg-white/50 shadow-sm active:scale-95"
        >
          Logout
        </button>
      </div>
      
      <AddChildForm />
      <AddWordForm />
      <MemoryFeed />
    </main>
  );
}
