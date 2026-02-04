
import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, UserPlus, ShieldCheck, HeartPulse, ArrowRight } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, onRegister }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (users.find(u => u.id === userId)) {
        setError('এই ইউজার আইডি ইতিমধ্যে নিবন্ধিত!');
        return;
      }
      onRegister({ id: userId, name, password, themeIndex: 0 });
    } else {
      if (userId === '2' && password === '2') {
        onLogin({ id: '2', name: 'Admin', password: '2' });
        return;
      }
      const user = users.find(u => u.id === userId && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('ভুল আইডি অথবা পাসওয়ার্ড!');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: Branding/Visual - Desktop Only */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full -ml-48 -mb-48"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-12">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
              <HeartPulse size={32} className="text-white" />
            </div>
            <span className="text-3xl font-black tracking-tight">Medi Help</span>
          </div>
          <h2 className="text-6xl font-black text-white leading-tight mb-6">
            স্মার্ট প্রযুক্তিতে <br /> <span className="text-blue-500">উন্নত স্বাস্থ্যসেবা</span>
          </h2>
          <p className="text-slate-400 text-xl max-w-md">
            আপনার স্বাস্থ্য আমাদের কাছে সবচেয়ে গুরুত্বপূর্ণ। সহজেই বিশেষজ্ঞ পরামর্শ এবং প্রেসক্রিপশন পান।
          </p>
        </div>

        <div className="relative z-10 flex gap-8">
           <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
              <p className="text-white font-bold text-2xl mb-1">১০০%</p>
              <p className="text-slate-400 text-sm">নিরাপদ তথ্য</p>
           </div>
           <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
              <p className="text-white font-bold text-2xl mb-1">২৪/৭</p>
              <p className="text-slate-400 text-sm">এআই সাপোর্ট</p>
           </div>
        </div>
      </div>

      {/* Right Side: Form & Mobile Header */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 bg-slate-50/50">
        <div className="w-full max-w-md">
          {/* Mobile Enhanced Header */}
          <div className="lg:hidden flex flex-col items-center justify-center mb-10 text-center">
            <div className="relative mb-6">
              {/* Glowing Background Pulse */}
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse scale-150"></div>
              {/* Blinking Heart Icon Container */}
              <div className="relative w-20 h-20 bg-white rounded-[24px] shadow-2xl shadow-blue-200 flex items-center justify-center border border-slate-100 ring-4 ring-blue-50">
                <HeartPulse size={48} className="text-blue-600 animate-pulse" fill="currentColor" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Medi Help</h1>
            <div className="px-5 py-2 bg-white rounded-full shadow-sm border border-slate-200">
               <p className="text-blue-600 font-bold text-sm tracking-tight">
                  আপনার ডিজিটাল স্বাস্থ্যসঙ্গী, সর্বদা আপনার পাশে।
               </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-1">
              {isRegister ? 'নতুন প্রোফাইল' : 'স্বাগতম ফিরে এসেছেন'}
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              আপনার তথ্য দিয়ে {isRegister ? 'রেজিস্ট্রেশন' : 'লগইন'} সম্পন্ন করুন
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">পূর্ণ নাম</label>
                <input
                  type="text"
                  required
                  className="w-full px-5 py-4 premium-input font-bold text-slate-900 placeholder-slate-400 border-slate-200"
                  value={name}
                  placeholder="যেমন: রিমন মাহমুদ"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ইউজার আইডি</label>
              <input
                type="text"
                required
                className="w-full px-5 py-4 premium-input font-bold text-slate-900 placeholder-slate-400 border-slate-200"
                value={userId}
                placeholder="আপনার আইডি দিন"
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">পাসওয়ার্ড</label>
              <input
                type="password"
                required
                className="w-full px-5 py-4 premium-input font-bold text-slate-900 placeholder-slate-400 border-slate-200"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100 animate-shake">
                <ShieldCheck size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[20px] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-lg active:scale-95"
            >
              {isRegister ? 'রেজিস্ট্রেশন সম্পন্ন করুন' : 'লগইন করুন'}
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-slate-400 hover:text-blue-600 font-bold text-sm transition-all"
            >
              {isRegister ? 'ইতিমধ্যে একাউন্ট আছে? লগইন করুন' : 'একাউন্ট নেই? নতুন প্রোফাইল তৈরি করুন'}
            </button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[.3em]">Health Care Reimagined</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
