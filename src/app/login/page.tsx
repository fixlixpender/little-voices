"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  // These are the "State" variables that hold your typing
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Please fill in both fields");
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/');
      router.refresh();
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents the form from just refreshing the page
    
    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Account created! You can now log in.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#dddddd] flex items-center justify-center p-6 text-slate-900">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md border border-white">
        <h1 className="text-3xl font-bold text-[#f5ac44] mb-8 text-center italic">Little Voices</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Email</label>
            <input 
              type="email" 
              placeholder="your@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 outline-none focus:border-[#A3B18A] transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 outline-none focus:border-[#A3B18A] transition-all"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#f5ac44] text-white p-4 rounded-2xl font-bold hover:bg-[#2b2b2b] transition-all shadow-md mt-4 disabled:opacity-50"
          >
            {loading ? 'Working on it...' : 'Login'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-500 text-sm mb-2">First time here?</p>
          <button 
            onClick={handleSignUp}
            disabled={loading}
            className="text-[#f5ac44] font-bold hover:text-[#2b2b2b] transition-colors"
          >
            Create an Account
          </button>
        </div>
      </div>
    </main>
  );
}