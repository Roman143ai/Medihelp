
import React, { useState } from 'react';
import { User, AdminSettings, Order, MedicinePrice } from '../types';
import { 
  Users, Settings, Image as ImageIcon, ClipboardList, LogOut, Trash2, Edit2, 
  Check, X, Plus, DollarSign, PenTool, LayoutTemplate, ShieldCheck, Activity, Search,
  PhoneCall, MapPin, Heart, MessageSquare, Save, Camera, Sparkles, User as UserIcon, Code,
  Eye, EyeOff, TrendingUp, Zap
} from 'lucide-react';

interface AdminProps {
  users: User[];
  orders: Order[];
  settings: AdminSettings;
  priceList: MedicinePrice[];
  setSettings: (s: AdminSettings) => void;
  setPriceList: (p: MedicinePrice[]) => void;
  setOrders: (o: Order[]) => void;
  onLogout: () => void;
}

const ECGLine = ({ className = "", opacity = "opacity-20", height = "h-10", bold = false }) => (
  <div className={`absolute bottom-0 left-0 w-full ${height} overflow-hidden pointer-events-none z-0 ${opacity} ${className}`}>
    <div className={`${bold ? 'ecg-line-bold' : 'ecg-line'} h-full`}></div>
  </div>
);

const AdminDashboard: React.FC<AdminProps> = ({ users, orders, settings, priceList, setSettings, setPriceList, setOrders, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'orders' | 'prices'>('users');
  const [replyText, setReplyText] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const handleReplyOrder = (orderId: string) => {
    const newOrders = orders.map(o => o.id === orderId ? { ...o, status: 'Replied' as const, adminReply: replyText } : o);
    setOrders(newOrders);
    setReplyText('');
    alert("রিপ্লাই পাঠানো হয়েছে!");
  };

  const updateSetting = (key: keyof AdminSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleImageUpload = (key: keyof AdminSettings | 'welcomeImage', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (key === 'welcomeImage') {
          setSettings({ ...settings, welcomeBanner: { ...settings.welcomeBanner, image: reader.result as string } });
        } else {
          updateSetting(key as keyof AdminSettings, reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getActiveTabTitle = () => {
    switch(activeTab) {
      case 'users': return 'রোগীদের তালিকা';
      case 'orders': return 'ঔষধের অর্ডারসমূহ';
      case 'prices': return 'মূল্য তালিকা এডিট';
      case 'settings': return 'অ্যাপ কন্ট্রোল প্যানেল';
      default: return 'অ্যাডমিন ড্যাশবোর্ড';
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0f172a] text-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-[#1e293b]/50 backdrop-blur-xl p-6 flex flex-col gap-8 border-r border-white/5 z-20">
        <div className="flex items-center gap-3 px-2">
           <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-500/20"><ShieldCheck size={24} /></div>
           <div>
             <h1 className="text-lg font-black tracking-tighter">Medi Help</h1>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Master Admin</p>
           </div>
        </div>
        
        <nav className="flex flex-col gap-1">
          <SidebarBtn active={activeTab === 'users'} icon={<Users size={18}/>} label="ইউজার ম্যানেজমেন্ট" onClick={() => setActiveTab('users')} />
          <SidebarBtn active={activeTab === 'orders'} icon={<ClipboardList size={18}/>} label="ঔষধের অর্ডারসমূহ" onClick={() => setActiveTab('orders')} />
          <SidebarBtn active={activeTab === 'prices'} icon={<DollarSign size={18}/>} label="মূল্য তালিকা এডিট" onClick={() => setActiveTab('prices')} />
          <SidebarBtn active={activeTab === 'settings'} icon={<Settings size={18}/>} label="অ্যাপ সেটিংস" onClick={() => setActiveTab('settings')} />
        </nav>

        <button onClick={onLogout} className="mt-auto flex items-center justify-center gap-2 py-4 bg-red-600/10 text-red-500 rounded-2xl transition-all font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white group overflow-hidden relative">
          <ECGLine opacity="opacity-0 group-hover:opacity-20" height="h-full" />
          <LogOut size={16} className="relative z-10"/> <span className="relative z-10">সিস্টেম লগআউট</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen custom-scrollbar bg-slate-950/20 relative">
        <div className="max-w-6xl mx-auto space-y-10 relative z-10">
           
           {/* Smart Admin Banner Header */}
           <div className="relative overflow-hidden bg-white rounded-[40px] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] group">
              {/* Background ECG Effect like Smart Diagnosis */}
              <ECGLine opacity="opacity-20" height="h-full" bold={true} className="text-red-600" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 blur-[120px] rounded-full -mr-40 -mt-40"></div>
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/5 blur-[100px] rounded-full -ml-30 -mb-30"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-[.2em] mb-4 shadow-lg shadow-red-200">
                    <Zap size={12} className="fill-current" /> Live Control Center
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-none tracking-tighter mb-4">
                    {getActiveTabTitle()}
                  </h2>
                  <p className="text-slate-500 font-bold text-lg md:text-xl max-w-xl">
                    রিয়েল-টাইম ডাটা মনিটর করুন এবং স্বাস্থ্যসেবা অ্যাপের সকল সেটিংস এখান থেকে নিয়ন্ত্রণ করুন।
                  </p>
                </div>

                <div className="flex gap-4">
                   <div className="px-8 py-6 bg-slate-900 rounded-[32px] text-center shadow-xl border border-white/5">
                      <p className="text-red-500 font-black text-3xl mb-1">{users.length}</p>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">মোট ইউজার</p>
                   </div>
                   <div className="px-8 py-6 bg-slate-50 rounded-[32px] text-center border-2 border-slate-100 shadow-sm">
                      <p className="text-slate-900 font-black text-3xl mb-1">{orders.filter(o => o.status === 'Pending').length}</p>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">পেন্ডিং অর্ডার</p>
                   </div>
                </div>
              </div>
           </div>

           {/* Tab Specific Content */}
           {activeTab === 'users' && (
             <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-[32px] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5">
                       <th className="p-6">রোগীর প্রোফাইল</th>
                       <th className="p-6 text-center">ইউজার আইডি</th>
                       <th className="p-6 text-center">পাসওয়ার্ড</th>
                       <th className="p-6">মোবাইল ও ঠিকানা</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {users.map(u => (
                       <tr key={u.id} className="hover:bg-white/5 transition-all">
                         <td className="p-6 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-slate-700 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                             {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-500" />}
                           </div>
                           <div>
                             <p className="font-black text-base text-white">{u.name}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase">রক্ত: {u.bloodGroup || 'N/A'}</span>
                                <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded uppercase">বয়স: {u.age || 'N/A'}</span>
                             </div>
                           </div>
                         </td>
                         <td className="p-6 text-center">
                           <span className="px-4 py-1.5 bg-blue-600/10 text-blue-400 rounded-xl font-black text-xs border border-blue-600/20 shadow-inner">#{u.id}</span>
                         </td>
                         <td className="p-6 text-center">
                            <div className="inline-flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5">
                               <span className="font-mono text-sm tracking-[.3em] text-slate-300">
                                 {showPasswords[u.id] ? u.password : '••••••'}
                               </span>
                               <button onClick={() => togglePassword(u.id)} className="text-slate-500 hover:text-white transition-all p-1">
                                 {showPasswords[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                               </button>
                            </div>
                         </td>
                         <td className="p-6 text-sm font-bold text-slate-400">
                           <div className="flex items-center gap-2 mb-1">
                              <PhoneCall size={12} className="text-slate-600"/> <span>{u.mobile || 'মোবাইল নেই'}</span>
                           </div>
                           <div className="flex items-start gap-2">
                              <MapPin size={12} className="text-slate-600 mt-0.5"/> 
                              <span className="text-[10px] font-medium text-slate-600 leading-tight max-w-[160px]">{u.address || 'ঠিকানা দেওয়া হয়নি'}</span>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {activeTab === 'settings' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
               <div className="space-y-8">
                  <SettingBox title="অ্যাপ ব্যানার সেটিংস" icon={<ImageIcon className="text-blue-500"/>}>
                     <ImageInput label="হোম ফুটার ব্যানার (প্রোমো)" value={settings.homeFooterBanner} onUpload={e => handleImageUpload('homeFooterBanner', e)} />
                     <TextAreaInput label="ফুটার ডেভেলপার ইনফো টেক্সট" value={settings.footerBannerText} onChange={v => updateSetting('footerBannerText', v)} />
                     <div className="h-px bg-white/5 my-4"></div>
                     <TextAreaInput label="ওয়েলকাম মেসেজ টেক্সট (হোম)" value={settings.welcomeBanner.text} onChange={v => updateSetting('welcomeBanner', { ...settings.welcomeBanner, text: v })} />
                  </SettingBox>

                  <SettingBox title="ডিজিটাল সিগনেচার" icon={<PenTool className="text-red-600"/>}>
                     <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white/5 rounded-[32px] border border-white/5">
                        <div className="bg-white p-4 rounded-2xl shadow-xl w-full sm:w-auto flex items-center justify-center">
                           <img src={settings.digitalSignature} className="h-16 object-contain" />
                        </div>
                        <label className="w-full sm:flex-1 flex flex-col items-center justify-center py-6 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border-2 border-dashed border-white/10 group">
                           <Camera size={24} className="mb-2 text-slate-500 group-hover:text-red-500 group-hover:scale-110 transition-all" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">সিগনেচার আপডেট করুন</span>
                           <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload('digitalSignature', e)} />
                        </label>
                     </div>
                  </SettingBox>
               </div>

               <div className="space-y-8">
                  <SettingBox title="প্রেসক্রিপশন ডিজাইন" icon={<LayoutTemplate className="text-purple-600"/>}>
                     <div className="grid grid-cols-2 gap-3 mb-6">
                        {['Standard', 'Modern', 'Minimal', 'Classic'].map(t => (
                           <button key={t} onClick={() => updateSetting('prescriptionTheme', t)} className={`py-4 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${settings.prescriptionTheme === t ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:border-purple-600/30'}`}>
                              {t}
                           </button>
                        ))}
                     </div>
                     <TextInput label="প্রেসক্রিপশন হেডার টাইটেল" value={settings.prescriptionHeader} onChange={v => updateSetting('prescriptionHeader', v)} />
                     <TextAreaInput label="প্রেসক্রিপশন ফুটার ডিসক্লেইমার" value={settings.prescriptionFooter} onChange={v => updateSetting('prescriptionFooter', v)} />
                  </SettingBox>
                  
                  <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-[32px] shadow-2xl relative overflow-hidden group">
                     <ECGLine opacity="opacity-20" height="h-full" />
                     <div className="relative z-10 flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-xl"><Sparkles className="text-white" size={32}/></div>
                        <h4 className="text-2xl font-black text-white">ইনস্ট্যান্ট আপডেট সিস্টেম</h4>
                        <p className="text-white/70 text-base font-medium leading-relaxed">অ্যাডমিন প্যানেলে করা যেকোনো পরিবর্তন সাথে সাথেই সকল ইউজারদের অ্যাপ্লিকেশনে কার্যকর হয়ে যাবে।</p>
                     </div>
                  </div>
               </div>
             </div>
           )}

           {activeTab === 'orders' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
                {orders.length === 0 ? (
                  <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center opacity-50">
                    <ClipboardList size={64} className="mb-4 text-slate-700" />
                    <p className="text-xl font-black uppercase tracking-widest text-slate-500">কোনো অর্ডার নেই</p>
                  </div>
                ) : orders.map(o => (
                  <div key={o.id} className="bg-[#1e293b] p-6 rounded-[32px] border border-white/5 space-y-4 shadow-xl flex flex-col group hover:border-red-500/30 transition-all">
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-xl font-black text-white leading-tight mb-1">{o.medName}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-500 uppercase bg-white/5 px-2 py-0.5 rounded">qty: {o.quantity}</span>
                             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{o.userName}</span>
                          </div>
                       </div>
                       <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg ${o.status === 'Pending' ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white'}`}>{o.status === 'Pending' ? 'পেন্ডিং' : 'রিপ্লাইড'}</span>
                    </div>
                    <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3 text-sm font-bold text-slate-400">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><PhoneCall size={14}/></div>
                          <span>{o.phone}</span>
                       </div>
                       <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mt-0.5"><MapPin size={14}/></div>
                          <span className="leading-snug">{o.address}</span>
                       </div>
                    </div>
                    {o.status === 'Pending' ? (
                       <div className="space-y-3 pt-2 mt-auto">
                          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="রিপ্লাই মেসেজ লিখুন..." className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:border-red-600 h-24 transition-all focus:bg-slate-900/80"></textarea>
                          <button onClick={() => handleReplyOrder(o.id)} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95">রিপ্লাই পাঠান</button>
                       </div>
                    ) : (
                       <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mt-auto">
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2"><MessageSquare size={12}/> প্রদত্ত রিপ্লাই</p>
                          <p className="text-xs font-bold text-slate-200 italic leading-relaxed">"{o.adminReply}"</p>
                       </div>
                    )}
                  </div>
                ))}
             </div>
           )}

           {activeTab === 'prices' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-left-4 duration-500">
                 <div className="lg:col-span-1 bg-[#1e293b] p-8 rounded-[40px] border border-white/5 space-y-6 h-fit shadow-2xl">
                    <div className="w-12 h-12 bg-red-600/10 text-red-600 rounded-2xl flex items-center justify-center mb-2 shadow-inner"><Plus size={24}/></div>
                    <h3 className="text-xl font-black text-white">নতুন ঔষধ যোগ করুন</h3>
                    <form onSubmit={(e) => {
                       e.preventDefault();
                       const fd = new FormData(e.currentTarget);
                       const p: MedicinePrice = {
                          id: Date.now().toString(),
                          name: fd.get('name') as string,
                          generic: fd.get('generic') as string,
                          company: fd.get('company') as string,
                          price: fd.get('price') as string
                       };
                       setPriceList([...priceList, p]);
                       e.currentTarget.reset();
                    }} className="space-y-4">
                       <div className="space-y-1.5">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">ব্র্যান্ডের নাম</p>
                          <input name="name" required className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl font-bold text-sm outline-none focus:border-red-600" />
                       </div>
                       <div className="space-y-1.5">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">জেনেরিক নাম</p>
                          <input name="generic" required className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl font-bold text-sm outline-none focus:border-red-600" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">কোম্পানি</p>
                             <input name="company" required className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl font-bold text-sm outline-none focus:border-red-600" />
                          </div>
                          <div className="space-y-1.5">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">মূল্য (৳)</p>
                             <input name="price" required className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl font-bold text-sm outline-none focus:border-red-600" />
                          </div>
                       </div>
                       <button className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-500/20 active:scale-95 transition-all mt-4">ডাটাবেস আপডেট করুন</button>
                    </form>
                 </div>
                 <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
                    {priceList.length === 0 ? (
                       <div className="col-span-full p-20 bg-white/5 border border-dashed border-white/10 rounded-[40px] text-center opacity-30">
                          <DollarSign size={48} className="mx-auto mb-2" />
                          <p className="font-black uppercase tracking-widest text-xs">মূল্য তালিকায় কোনো ঔষধ নেই</p>
                       </div>
                    ) : priceList.map(p => (
                       <div key={p.id} className="bg-[#1e293b] p-6 rounded-[32px] border border-white/5 flex justify-between items-center group shadow-lg hover:border-white/20 transition-all">
                          <div>
                             <p className="font-black text-base text-white group-hover:text-red-500 transition-colors">{p.name}</p>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{p.generic}</p>
                             <p className="text-[9px] font-bold text-slate-600 mt-1">{p.company}</p>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="text-xl font-black text-white px-3 py-1 bg-red-600/10 rounded-xl border border-red-600/20 shadow-inner">৳{p.price}</span>
                             <button onClick={() => setPriceList(priceList.filter(item => item.id !== p.id))} className="text-slate-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 p-2"><Trash2 size={18}/></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

const SidebarBtn = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-xs relative group ${active ? 'bg-red-600 text-white shadow-xl shadow-red-500/20' : 'text-slate-500 hover:bg-white/5'}`}>
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}`}>
      {icon}
    </div>
    <span className="uppercase tracking-widest text-[9px]">{label}</span>
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
    )}
  </button>
);

const SettingBox = ({ title, icon, children }: any) => (
   <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-[40px] border border-white/5 p-8 space-y-6 shadow-2xl">
      <h3 className="text-xl font-black flex items-center gap-3 border-b border-white/5 pb-5 text-white">{icon} {title}</h3>
      <div className="space-y-6">{children}</div>
   </div>
);

const ImageInput = ({ label, value, onUpload }: any) => (
   <div className="space-y-2.5">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">{label}</p>
      <div className="flex items-center gap-5">
         <div className="w-24 h-16 bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-inner group">
            {value ? <img src={value} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-slate-700"/></div>}
         </div>
         <label className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all text-center group">
            <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">ফটো আপলোড</span>
            <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
         </label>
      </div>
   </div>
);

const TextInput = ({ label, value, onChange }: any) => (
   <div className="space-y-2.5">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">{label}</p>
      <input className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl text-sm font-bold outline-none focus:border-red-600 transition-all focus:bg-slate-900/80" value={value} onChange={e => onChange(e.target.value)} />
   </div>
);

const TextAreaInput = ({ label, value, onChange }: any) => (
   <div className="space-y-2.5">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">{label}</p>
      <textarea className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl text-sm font-bold outline-none focus:border-red-600 h-24 transition-all focus:bg-slate-900/80 leading-relaxed" value={value} onChange={e => onChange(e.target.value)} />
   </div>
);

export default AdminDashboard;
