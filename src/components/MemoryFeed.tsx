"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function MemoryFeed({ refreshKey }: { refreshKey?: number }) {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string | null>(null); // Lightbox State

  const fetchMemories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('dictionary_entries')
        .select(`
          *,
          children (
            name
          )
        `)
        .eq('user_id', user.id) // Filter by your user ID
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching memories:', error);
      } else {
        setMemories(data || []);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMemories();
  }, [refreshKey]); // Refreshes when a new memory or child is added

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this memory?")) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('dictionary_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Security: Only delete your own

      if (error) {
        alert("Error deleting: " + error.message);
      } else {
        // Optimistic UI update: Remove from list immediately
        setMemories(memories.filter(m => m.id !== id));
      }
    }
  };

  if (loading) return <div className="text-slate-400 italic">Loading memories...</div>;

  return (
    <div className="w-full max-w-2xl space-y-4">
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 px-4">
        Recent Memories
      </h2>
      
      {memories.length === 0 ? (
        <p className="text-slate-400 italic px-4">No memories saved yet.</p>
      ) : (
        memories.map((memory) => (
          <div 
            key={memory.id} 
            className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="flex items-center flex-1">
              {/* Image Section with Lightbox Trigger */}
              {memory.image_url && (
                <div 
                  className="relative w-20 h-20 flex-shrink-0 mr-4 cursor-pointer overflow-hidden rounded-2xl border border-slate-100 shadow-inner"
                  onClick={() => setSelectedImg(memory.image_url)}
                >
                  <img
                    src={memory.image_url}
                    alt="Memory"
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-[#f5ac44] uppercase tracking-wider block mb-1">
                  {memory.children?.name} said:
                </span>
                {memory.audio_url && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // We pass the URL directly into the constructor
                      const audio = new Audio(memory.audio_url);
                      
                      // We tell the browser it's audio, but let it handle the MIME type automatically
                      audio.play().catch(err => {
                        console.error("Playback failed:", err);
                        alert("Please ensure your phone is not on silent mode.");
                      });
                    }}
                    className="ml-4 p-3 bg-[#f5ac44] text-white rounded-full active:scale-95 shadow-lg"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </button>
                )}
                <p className="text-xl font-bold text-slate-800 leading-tight">
                  {memory.original_word} <span className="text-slate-400 font-medium italic text-lg">is</span> <span className="text-[#f5ac44] italic">{memory.translated_word}</span>
                </p>
                <div className="flex items-center mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f5ac44] mr-2"></div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    {new Date(memory.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Trash Button */}
            <button
              onClick={() => handleDelete(memory.id)}
              className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        ))
      )}

      {/* LIGHTBOX MODAL */}
      {selectedImg && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-6 animate-in fade-in duration-300"
          onClick={() => setSelectedImg(null)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center">
             <button 
              className="absolute -top-12 right-0 text-white hover:text-[#f5ac44] transition-colors"
              onClick={() => setSelectedImg(null)}
            >
              <span className="text-sm font-bold uppercase tracking-widest">Close [×]</span>
            </button>
            <img 
              src={selectedImg} 
              className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border-4 border-white/10"
              alt="Zoomed Memory"
            />
          </div>
        </div>
      )}
    </div>
  );
}