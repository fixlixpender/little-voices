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

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

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
    let audioUrl = null; // Step 1: Initialize the audio variable

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

    // --- AUDIO UPLOAD LOGIC (New) ---
    if (audioBlob) {
      const fileName = `${Math.random()}.webm`;
      const { error: audioUploadError } = await supabase.storage
        .from('voices') // Make sure this bucket exists in Supabase!
        .upload(fileName, audioBlob);

      if (audioUploadError) {
        alert("Audio upload failed: " + audioUploadError.message);
      } else {
        const { data: audioPublicUrlData } = supabase.storage
          .from('voices')
          .getPublicUrl(fileName);
        audioUrl = audioPublicUrlData.publicUrl;
      }
    }

    // --- FINAL DATABASE INSERT ---
    const { error } = await supabase
      .from('dictionary_entries')
      .insert([{
        child_id: selectedChildId,
        original_word: originalWord,
        translated_word: translatedWord,
        image_url: imageUrl,
        audio_url: audioUrl, // Step 2: Add the audio link to the database row
        user_id: user?.id
      }]);

    if (error) {
      alert("Error saving memory: " + error.message);
    } else {
      // Step 3: Reset everything on success
      setOriginalWord('');
      setTranslatedWord('');
      setImageFile(null);
      setAudioBlob(null); // Clear the voice note
      if (onMemoryAdded) onMemoryAdded();
      alert("Memory saved successfully!");
    }

    setLoading(false);
  };

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

        {/* RECORD VOICE SECTION */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Add a voice note
            </span>
            
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all active:scale-90 shadow-md ${
                  isRecording 
                    ? 'bg-red-500 text-white shadow-red-200' 
                    : audioBlob 
                      ? 'bg-[#2C5F5D] text-white' 
                      : 'bg-white text-slate-400 hover:text-slate-600'
                }`}
              >
                {isRecording && (
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></span>
                )}
                
                {isRecording ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                ) : audioBlob ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                )}
              </button>

              <div className="flex flex-col">
                <span className={`text-sm font-bold uppercase tracking-tight ${isRecording ? 'text-red-500' : 'text-slate-700'}`}>
                  {isRecording ? 'Recording...' : audioBlob ? 'Voice Captured!' : 'Tap to record'}
                </span>
                {audioBlob && !isRecording && (
                  <button 
                    type="button"
                    onClick={() => setAudioBlob(null)}
                    className="text-[10px] text-slate-400 hover:text-red-500 uppercase font-bold tracking-widest text-left mt-1"
                  >
                    Discard & Re-record
                  </button>
                )}
              </div>
            </div>
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