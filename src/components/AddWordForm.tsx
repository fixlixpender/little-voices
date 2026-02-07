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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        // Try 'audio/mp4' if 'audio/webm' continues to be silent on iPhone
        const blob = new Blob(chunks, { type: 'audio/mp4' }); 
        setAudioBlob(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !originalWord || !translatedWord) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    try {
      let imageUrl = null;
      let audioUrl = null;

      // Photo Upload
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('memories')
          .upload(fileName, imageFile);

        if (!uploadError) {
          const { data } = supabase.storage.from('memories').getPublicUrl(fileName);
          imageUrl = data.publicUrl;
        }
      }

      // --- AUDIO UPLOAD LOGIC ---
      if (audioBlob) {
        // Use a unique name for every recording
        const fileName = `${user!.id}/${Date.now()}.webm`;
        
        const { error: audioUploadError } = await supabase.storage
          .from('voices') // Make sure this matches your bucket name exactly!
          .upload(fileName, audioBlob);

        if (audioUploadError) {
          console.error("Audio upload error:", audioUploadError);
          alert("Audio upload failed: " + audioUploadError.message);
        } else {
          // Get the actual URL to save in the database
          const { data: audioPublicUrlData } = supabase.storage
            .from('voices')
            .getPublicUrl(fileName);
            
          audioUrl = audioPublicUrlData.publicUrl;
          console.log("Audio URL generated:", audioUrl); // Check your console for this!
        }
      }

      // Database Insert
      const { error } = await supabase
        .from('dictionary_entries')
        .insert([{
          child_id: selectedChildId,
          original_word: originalWord,
          translated_word: translatedWord,
          image_url: imageUrl,
          audio_url: audioUrl,
          user_id: user?.id
        }]);

      if (error) throw error;

      // Reset
      setOriginalWord('');
      setTranslatedWord('');
      setImageFile(null);
      setAudioBlob(null);
      if (onMemoryAdded) onMemoryAdded();
      alert("Memory saved!");

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white p-8 rounded-[2.5rem] shadow-sm mb-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Child Selection */}
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4 text-center sm:text-left">Who said it?</span>
          <div className="flex gap-3 flex-wrap justify-center sm:justify-start">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildId(child.id)}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                  selectedChildId === child.id ? "bg-[#f5ac44] text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>

        {/* Word Inputs */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="What they said"
            value={originalWord}
            onChange={(e) => setOriginalWord(e.target.value)}
            className="w-full p-5 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#f5ac44] transition-all"
          />
          <input
            type="text"
            placeholder="What it means"
            value={translatedWord}
            onChange={(e) => setTranslatedWord(e.target.value)}
            className="w-full p-5 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#f5ac44] transition-all"
          />
        </div>

        {/* Media Row (Photo & Voice) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Photo Upload */}
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
            <svg className="w-6 h-6 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{imageFile ? 'Photo Added' : 'Add Photo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </label>

          {/* Voice Record */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex flex-col items-center justify-center h-32 border-2 rounded-2xl transition-all ${
              isRecording ? 'border-red-500 bg-red-50 animate-pulse' : audioBlob ? 'border-[#2C5F5D] bg-teal-50' : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <svg className={`w-6 h-6 mb-2 ${isRecording ? 'text-red-500' : audioBlob ? 'text-[#2C5F5D]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {isRecording ? 'Recording...' : audioBlob ? 'Voice Captured' : 'Add Voice'}
            </span>
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-5 rounded-2xl transition-all shadow-xl disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? 'Saving Memory...' : 'Save Memory'}
        </button>
      </form>
    </div>
  );
}