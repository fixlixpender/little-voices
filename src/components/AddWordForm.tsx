"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AddWordForm() {
  const [children, setChildren] = useState<{id: string, name: string}[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [originalWord, setOriginalWord] = useState('');
  const [translatedWord, setTranslatedWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 1. Fetch children that belong ONLY to the logged-in user
  useEffect(() => {
    const fetchChildren = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not found or not logged in");
        return;
      }

      const { data, error } = await supabase
        .from('children')
        .select('id, name')
        .eq('user_id', user.id); // Filter by your unique ID

      if (error) {
        console.error("Error fetching children:", error.message);
      } else if (data) {
        setChildren(data);
        // Automatically select the first child (e.g., Phoebe) if available
        if (data.length > 0) {
          setSelectedChildId(data[0].id);
        }
      }
    };

    fetchChildren();
  }, []);

  // 2. Handle saving the new word
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return alert("Please log in");

  let uploadedImageUrl = null;

  // 1. If there's an image, upload it first
  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`; // Organize files by User ID

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('memories')
      .upload(fileName, imageFile);

    if (uploadError) {
      alert("Error uploading image: " + uploadError.message);
      setLoading(false);
      return;
    }
    
    uploadedImageUrl = uploadData.path;
  }

  // 2. Save the database entry with the image path
  const { error } = await supabase
    .from('dictionary_entries')
    .insert([{ 
      original_word: originalWord, 
      translated_word: translatedWord, 
      child_id: selectedChildId,
      user_id: user.id,
      image_url: uploadedImageUrl // Saving the path here
    }]);

  if (error) {
    alert(error.message);
  } else {
    setOriginalWord('');
    setTranslatedWord('');
    setImageFile(null);
    setPreviewUrl(null);
    alert("Memory saved with photo!");
  }
  setLoading(false);
};

  return (
    <div className="w-full max-w-2xl bg-white p-6 rounded-3xl shadow-sm border border-white/50 mb-6">
      <h3 className="text-[#2C5F5D] font-bold mb-4 px-1 text-sm uppercase tracking-wider">Who said it?</h3>
      
      {/* Child Selection Pills */}
      <div className="flex flex-wrap gap-3 mb-8">
        {children.length === 0 ? (
          <p className="text-gray-400 text-sm italic">Add a child first to start saving words!</p>
        ) : (
          children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => setSelectedChildId(child.id)}
              className={`px-6 py-2 rounded-full font-bold transition-all transform active:scale-95 ${
                selectedChildId === child.id 
                  ? 'bg-[#f5ac44] text-white shadow-md' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {child.name}
            </button>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input 
            type="text"
            placeholder="What they said (e.g., 'Isha')" 
            value={originalWord}
            onChange={(e) => setOriginalWord(e.target.value)}
            className="w-full p-4 border-2 border-gray-50 rounded-2xl text-slate-900 placeholder:text-gray-400 outline-none focus:border-[#A3B18A] bg-gray-50 transition-all"
          />
        </div>

        <div>
          <input 
            type="text"
            placeholder="What it means (e.g., 'Misha')" 
            value={translatedWord}
            onChange={(e) => setTranslatedWord(e.target.value)}
            className="w-full p-4 border-2 border-gray-50 rounded-2xl text-slate-900 placeholder:text-gray-400 outline-none focus:border-[#A3B18A] bg-gray-50 transition-all"
          />
        </div>

          <div className="space-y-4 mb-4">
            <label className="block text-sm font-bold text-[#2C5F5D] px-1 uppercase tracking-wider">
              Capture the moment
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                id="photo-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                  }
                }}
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-4 rounded-2xl flex items-center justify-center transition-all border-2 border-dashed border-gray-300 w-full"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                    <span className="text-xs font-medium">Add a photo</span>
                  </div>
                )}
              </label>
            </div>
          </div>

        <button 
          type="submit" 
          disabled={loading || !selectedChildId}
          className="w-full bg-[#f5ac44] text-white p-4 rounded-2xl font-bold hover:bg-[#f5ac44] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Saving to the cloud...' : 'Save Memory'}
        </button>
      </form>
    </div>
  );
}