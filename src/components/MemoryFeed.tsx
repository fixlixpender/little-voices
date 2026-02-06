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
    const confirmed = window.confirm("Are you sure you want to delete this memory?");
    if (!confirmed) return;

    const { error } = await supabase
      .from('dictionary_entries')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      setMemories(memories.filter(m => m.id !== id));
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

  if (loading) return <p className="text-[#2C5F5D] animate-pulse px-2">Loading memories...</p>;

  return (
    <div className="w-full max-w-2xl mt-10 space-y-4 pb-20">
      {/* SEARCH SECTION */}
      <div className="px-2 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a word or a child..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-12 rounded-2xl bg-white/50 border border-white focus:bg-white focus:ring-2 focus:ring-[#A3B18A] outline-none transition-all text-slate-900 placeholder:text-gray-400"
          />
          <svg className="absolute left-4 top-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        {searchQuery === '' && memories.length > 3 && (
          <p className="text-[10px] text-[#2C5F5D] mt-2 italic px-2">
            Showing last 3 memories. Use search to find more!
          </p>
        )}
      </div>

      {/* DYNAMIC HEADER SECTION */}
      <div className="flex justify-between items-center px-2 mb-6">
        <h2 className="text-xl font-bold text-[#2C5F5D] uppercase tracking-widest">
          {searchQuery ? 'Search Results' : showAll ? 'All Memories' : 'Recent Memories'}
        </h2>
        
        {!searchQuery && memories.length > 3 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-bold text-[#A3B18A] hover:text-[#2C5F5D] transition-colors uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-white"
          >
            {showAll ? 'Show Less' : `View All (${memories.length})`}
          </button>
        )}
      </div>
      
      {/* FEED LIST */}
      {memories.length === 0 ? (
        <div className="bg-white/50 p-8 rounded-3xl border border-dashed border-gray-300 text-center">
          <p className="text-gray-500 italic">No memories saved yet.</p>
        </div>
      ) : (
        filteredMemories.map((memory) => (
          <div key={memory.id} className="group bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-none transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex justify-between items-center transition-all hover:shadow-md">
            
            <div className="flex items-center gap-5">
              {memory.image_url && (
                <div className="relative h-20 w-20 flex-shrink-0">
                  <img 
                    src={getImageUrl(memory.image_url)} 
                    alt="Moment" 
                    onClick={() => setSelectedImage(getImageUrl(memory.image_url!))}
                    className="h-full w-full object-cover rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:scale-105 transition-transform"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#A3B18A] uppercase tracking-tighter">
                  {memory.children?.name || 'Unknown'} said:
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-slate-900 leading-tight">
                    {memory.original_word}
                  </span>
                  <span className="text-gray-400 text-lg">is</span>
                  <span className="text-2xl font-medium text-[#2C5F5D] leading-tight italic">
                    {memory.translated_word}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">
                  {formatDate(memory.created_at)}
                </span>
              </div>
            </div>

            <button 
              onClick={() => handleDelete(memory.id)}
              className="ml-4 p-3 text-red-200 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        ))
      )}

      {/* LIGHTBOX MODAL */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Enlarged moment" 
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            />
            <button 
              className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 p-2 rounded-full transition-all"
              onClick={() => setSelectedImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}