"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AddChildForm from '@/components/AddChildForm';
import AddWordForm from '@/components/AddWordForm';
import MemoryFeed from '@/components/MemoryFeed';

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  // This key is the "trigger" to refresh the child list
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
      }
    });
  }, [router]);

  // When a child is added, we bump this number to force a re-render
  const handleChildAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!session) return null;

  return (
    <main className="min-h-screen bg-transparent py-10 px-6 flex flex-col items-center text-slate-800">
      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold italic tracking-tight">Little Voices</h1>
        <button
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          className="text-[10px] font-black text-slate-400 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-full border border-slate-200 hover:border-red-200 transition-all uppercase tracking-[0.2em] bg-white/50 shadow-sm active:scale-95"
        >
          Logout
        </button>
      </div>

      <AddChildForm onChildAdded={handleChildAdded} />
      
      {/* Adding the key here forces the component to reload when refreshKey changes */}
      <AddWordForm 
        key={`word-form-${refreshKey}`} 
        onMemoryAdded={handleChildAdded} 
      />
      
      <MemoryFeed key={`feed-${refreshKey}`} />
    </main>
  );
}
