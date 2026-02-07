"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Memory {
  id: string;
  original_word: string;
  translated_word: string;
  created_at: string;
  image_url: string | null;
  children: { name: string };
}

export default function MemoryFeed() {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredMemories = searchQuery !== '' 
    ? memories.filter(m => 
        m.original_word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.translated_word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.children?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  : showAll 
    ? memories 
    : memories.slice(0, 3);

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('memories').getPublicUrl(path);
    return data.publicUrl;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const fetchMemories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('dictionary_entries')
      .select(`
        id,
        original_word,
        translated_word,
        created_at,
        image_url,
        children ( name )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching:", error.message);
    } else {
      setMemories(data as any);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    // 1. Confirm with the user first (Good UX)
    if (!window.confirm("Are you sure you want to delete this memory?")) return;

    try {
      // 2. Get the current user specifically for this action
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Session expired. Please log in again.");
        return;
      }

      // 3. Perform the delete with BOTH IDs for security
      const { error } = await supabase
        .from('dictionary_entries')
        .delete()
        .eq('id', id)          // The specific word ID
        .eq('user_id', user.id); // Ensures Filipe can only delete Filipe's words

      if (error) {
        console.error("Delete error:", error);
        alert("Could not delete: " + error.message);
      } else {
        // 4. Update the UI immediately so the word disappears
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  useEffect(() => {
    fetchMemories();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dictionary_entries' }, () => {
        fetchMemories();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return (
    <div className="flex justify-center p-10">
      <p className="text-slate-500 animate-pulse font-bold tracking-widest uppercase text-xs">Loading memories...</p>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mt-10 space-y-6 pb-20 px-4">
      {/* SEARCH SECTION */}
      <div className="mb-8">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search for a word or a child..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-5 pl-14 rounded-[2rem] bg-white/40 border-none shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] focus:bg-white focus:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] outline-none transition-all text-slate-900 placeholder:text-gray-400"
          />
          <svg className="absolute left-5 top-5 text-gray-400 group-focus-within:text-[#cdb4f0] transition-colors" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        {searchQuery === '' && memories.length > 3 && (
          <p className="text-[10px] text-slate-500/60 mt-3 italic px-4 font-medium">
            Showing last 3 memories. Use search to find more!
          </p>
        )}
      </div>

      {/* DYNAMIC HEADER SECTION */}
      <div className="flex justify-between items-end px-4 mb-2">
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">
          {searchQuery ? 'Search Results' : showAll ? 'All Memories' : 'Recent Memories'}
        </h2>
        
        {!searchQuery && memories.length > 3 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] font-black text-slate-500 hover:text-[#2C5F5D] transition-colors uppercase tracking-widest bg-white/40 px-4 py-2 rounded-full shadow-sm"
          >
            {showAll ? 'Show Less' : `View All (${memories.length})`}
          </button>
        )}
      </div>
      
      {/* FEED LIST */}
      <div className="space-y-6">
        {memories.length === 0 ? (
          <div className="bg-white/30 p-12 rounded-[2.5rem] border-2 border-dashed border-white/50 text-center">
            <p className="text-slate-500 font-medium italic opacity-60">No memories saved yet. Time to catch a funny word!</p>
          </div>
        ) : (
          filteredMemories.map((memory) => (
            <div 
              key={memory.id} 
              className="group bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border-none transition-all hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-1 flex justify-between items-center"
            >
              <div className="flex items-center gap-6">
                {/* IMAGE SECTION */}
                {memory.image_url && (
                  <div className="relative w-20 h-20 flex-shrink-0 mr-4 cursor-pointer" onClick={() => setSelectedImg(memory.image_url)}>
                    <img
                      src={memory.image_url}
                      alt="Memory"
                      className="w-full h-full object-cover rounded-2xl shadow-sm hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                {/* TEXT CONTENT */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-[#f5ac44] uppercase tracking-[0.15em]">
                    {memory.children?.name || 'Unknown'} said:
                  </span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">
                      {memory.original_word}
                    </span>
                    <span className="text-gray-600 font-serif italic text-xl">is</span>
                    <span className="text-3xl font-semibold text-[#f5ac44] italic tracking-tight">
                      {memory.translated_word}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#cdb4f0]" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {formatDate(memory.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* DELETE BUTTON */}
              <button 
                onClick={() => handleDelete(memory.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                title="Delete memory"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* LIGHTBOX MODAL */}
      {selectedImg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setSelectedImg(null)}
        >
          <button className="absolute top-10 right-10 text-white text-4xl">&times;</button>
          <img 
            src={selectedImg} 
            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" 
            alt="Zoomed memory"
          />
        </div>
      )}
    </div>
  );
}