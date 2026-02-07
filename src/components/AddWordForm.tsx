"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AddWordFormProps {
  onMemoryAdded?: () => void;
}

export default function AddWordForm({ onMemoryAdded }: AddWordFormProps) {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [originalWord, setOriginalWord] = useState('');
  const [translatedWord, setTranslatedWord] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null); // Re-added Image State
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
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
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    let imageUrl = null;

    // --- PHOTO UPLOAD LOGIC ---
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(fileName, imageFile);

      if (uploadError) {
        alert("Image upload failed: " + uploadError.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('memories')
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from('dictionary_entries')
      .insert([{
        child_id: selectedChildId,
        original_word: originalWord,
        translated_word: translatedWord,
        image_url: imageUrl, // Save the image URL!
        user_id: user?.id
      }]);

    if (error) {
      alert("Error saving memory: " + error.message);
    } else {
      setOriginalWord('');
      setTranslatedWord('');
      setImageFile(null); // Reset photo
      if (onMemoryAdded) onMemoryAdded();
      alert("Memory saved!");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-2xl bg-white p-8 rounded-[2.5rem] shadow-sm mb-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* WHO SAID IT? */}
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Who said it?</span>
          <div className="flex gap-3 flex-wrap">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildId(child.id)}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                  selectedChildId === child.id ? "bg-[#f5ac44] text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>

        {/* WORDS */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="What they said"
            value={originalWord}
            onChange={(e) => setOriginalWord(e.target.value)}
            className="w-full p-5 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#f5ac44]"
          />
          <input
            type="text"
            placeholder="What it means"
            value={translatedWord}
            onChange={(e) => setTranslatedWord(e.target.value)}
            className="w-full p-5 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#f5ac44]"
          />
        </div>

        {/* CAPTURE THE MOMENT (RE-ADDED) */}
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Capture the moment</span>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <p className="text-sm text-slate-500">{imageFile ? imageFile.name : 'Add a photo'}</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-5 rounded-2xl transition-all shadow-xl disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Memory'}
        </button>
      </form>
    </div>
  );
}