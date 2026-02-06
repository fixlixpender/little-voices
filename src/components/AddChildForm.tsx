"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

// We define that this component now expects a function called onChildAdded
interface AddChildFormProps {
  onChildAdded?: () => void;
}

export default function AddChildForm({ onChildAdded }: AddChildFormProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in!");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('children')
      .insert([{ 
        name, 
        user_id: user.id 
      }]);

    if (error) {
      alert(error.message);
    } else {
      setName('');
      // This is the magic line: it tells the Parent (page.tsx) to refresh
      if (onChildAdded) {
        onChildAdded();
      }
    }
    setLoading(false);
  };

  return (
    <form 
      onSubmit={handleAddChild} 
      className="w-full max-w-2xl bg-white/20 backdrop-blur-md p-4 rounded-[2.5rem] border border-white/30 shadow-sm mb-8"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Add a child (e.g. Phoebe)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 p-4 px-6 rounded-full bg-white/40 border-none focus:bg-white outline-none transition-all text-slate-900 placeholder:text-gray-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#f5ac44] hover:bg-[#2C5F5D] text-white font-bold py-4 px-8 rounded-full transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-md"
        >
          {loading ? '...' : 'Add Child'}
        </button>
      </div>
    </form>
  );
}