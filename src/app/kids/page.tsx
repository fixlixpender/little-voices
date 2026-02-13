"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function KidsPage() {
  const [kids, setKids] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl'>('girl');

  const fetchKids = async () => {
    const { data } = await supabase.from('kids').select('*').order('name');
    if (data) setKids(data);
  };

  useEffect(() => { fetchKids(); }, []);

  const addKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Default colors: Pink for girls, Blue for boys
    const color = gender === 'girl' ? '#FFC0CB' : '#ADD8E6';

    const { error } = await supabase.from('kids').insert({
      name: newName,
      gender,
      user_id: user.id,
      color_preference: color
    });

    if (!error) {
      setNewName('');
      fetchKids();
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen bg-slate-50 pb-32">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">My Children</h1>
      
      {/* Input Form */}
      <form onSubmit={addKid} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
        <input 
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Child's Name"
          className="w-full p-4 rounded-2xl bg-slate-50 border-none mb-4 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
        />
        
        <div className="flex gap-3 mb-6">
          <button 
            type="button"
            onClick={() => setGender('girl')}
            className={`flex-1 py-3 rounded-xl border-2 transition-all ${gender === 'girl' ? 'border-pink-300 bg-pink-50 text-pink-600' : 'border-slate-100 text-slate-400'}`}
          >
            Girl 🎀
          </button>
          <button 
            type="button"
            onClick={() => setGender('boy')}
            className={`flex-1 py-3 rounded-xl border-2 transition-all ${gender === 'boy' ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
          >
            Boy 🧢
          </button>
        </div>

        <button type="submit" className="w-full py-4 bg-[#F5AC44] text-white font-bold rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-transform">
          Add Child
        </button>
      </form>

      {/* List of Kids */}
      <div className="space-y-4">
        {kids.map((kid) => (
          <div 
            key={kid.id} 
            className="p-5 bg-white rounded-2xl shadow-sm border-l-8 flex justify-between items-center"
            style={{ borderLeftColor: kid.color_preference }}
          >
            <div>
              <p className="font-bold text-slate-800 text-lg">{kid.name}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{kid.gender}</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-xl">
              {kid.gender === 'girl' ? '👧' : '👦'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
