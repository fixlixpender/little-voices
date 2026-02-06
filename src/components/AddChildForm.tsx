"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AddChildForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);

    // 1. Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in!");
      setLoading(false);
      return;
    }

    // 2. Insert the child with YOUR user_id
    const { error } = await supabase
      .from('children')
      .insert([{ 
        name, 
        user_id: user.id // Links the child to Filipe
      }]);

    if (error) {
      alert(error.message);
    } else {
      setName('');
      alert(`${name} added to your family!`);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-2xl bg-white/40 backdrop-blur-sm p-6 rounded-3xl border border-white mb-6">
      <form onSubmit={handleAddChild} className="flex gap-4">
        <input
          type="text"
          placeholder="Add a child (e.g. Phoebe)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 p-3 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#A3B18A] text-slate-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#A3B18A] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#2C5F5D] transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Child'}
        </button>
      </form>
    </div>
  );
}