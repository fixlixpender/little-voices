"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// 1. Add the interface for the new prop
interface AddWordFormProps {
  onMemoryAdded?: () => void;
}

export default function AddWordForm({ onMemoryAdded }: AddWordFormProps) {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [originalWord, setOriginalWord] = useState('');
  const [translatedWord, setTranslatedWord] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch children for the selection buttons
  useEffect(() => {
    const fetchChildren = async () => {
      // 1. Get the current logged-in user's ID
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. Only select children where the user_id matches yours
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('user_id', user.id); 

        if (data) setChildren(data);
      }
    };
    fetchChildren();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !originalWord || !translatedWord) {
      alert("Please fill in all fields and select a child.");
      return;
    }

    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    // 2. The new insert logic with the error check
    const { error } = await supabase
      .from('dictionary_entries')
      .insert([{
        child_id: selectedChildId,
        original_word: originalWord,
        translated_word: translatedWord,
        user_id: user?.id
      }]);

    if (error) {
      alert("Error saving memory: " + error.message);
    } else {
      // 3. Clear the fields and trigger the refresh!
      setOriginalWord('');
      setTranslatedWord('');
      
      if (onMemoryAdded) {
        onMemoryAdded(); // This sends the signal to page.tsx to refresh the feed
      }
      
      alert("Memory saved!");
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-2xl bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] mb-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* WHO SAID IT SECTION */}
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">
            Who said it?
          </span>
          <div className="flex gap-3 flex-wrap">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildId(child.id)}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all active:scale-95 ${
                  selectedChildId === child.id
                    ? "bg-[#f5ac44] text-white shadow-lg"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>

        {/* INPUTS SECTION */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="What they said (e.g., 'Titties')"
            value={originalWord}
            onChange={(e) => setOriginalWord(e.target.value)}
            className="w-full p-5 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-[#f5ac44] outline-none transition-all text-slate-900"
          />
          <input
            type="text"
            placeholder="What it means (e.g., 'Sweets')"
            value={translatedWord}
            onChange={(e) => setTranslatedWord(e.target.value)}
            className="w-full p-5 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-[#f5ac44] outline-none transition-all text-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-5 rounded-2xl transition-all active:scale-[0.98] shadow-xl disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Memory'}
        </button>
      </form>
    </div>
  );
}