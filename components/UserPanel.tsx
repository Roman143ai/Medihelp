
import React, { useState, useEffect, useCallback } from 'react';
import { User, AdminSettings, MedicinePrice, Order, MedicalRecord, Prescription } from '../types';
import { THEMES, DEFAULT_SYMPTOMS, PREV_ILLNESSES, DEFAULT_TESTS } from '../constants';
import { 
  User as UserIcon, LogOut, Stethoscope, Search, ShoppingBag, 
  Settings, Bell, CreditCard, Camera, FileText, Download, X,
  Heart, Home, MapPin, PhoneCall, Gift, CheckCircle, Activity,
  ChevronRight, Calendar, UserCheck, Droplet, Thermometer, ArrowRight, Sparkles, Edit3, Save, Plus, MessageSquare, ClipboardList, Info, FileSearch, ExternalLink, FileSpreadsheet, Presentation, Mail, History, Zap, Trash2, CameraIcon, ImageIcon, Loader2, Scissors, KeyRound, AlertTriangle
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { generateDiagnosis, getMedicineInfo, findAlternatives } from '../services/geminiService';
import PrescriptionView from './PrescriptionView';
import { getCroppedImg } from '../utils/cropImage';

interface UserPanelProps {
  user: User;
  settings: AdminSettings;
  priceList: MedicinePrice[];
  orders: Order[];
  onUpdateUser: (user: User, oldId?: string) => void;
  onPlaceOrder: (order: Order) => void;
  onLogout: () => void;
}

const LOADING_MESSAGES = [
  "আপনার তথ্যগুলো অত্যন্ত গুরুত্ব সহকারে দেখা হচ্ছে...",
  "এআই আপনার লক্ষনগুলো বিশ্লেষণ করছে...",
  "একটি নির্ভুল প্রেসক্রিপশন তৈরির কাজ চলছে...",
  "একটু অপেক্ষা করুন, সিগন্যাল যাচাই করা হচ্ছে...",
  "আপনার সুস্বাস্থ্য নিশ্চিত করতে আমরা তথ্য মেলাচ্ছি...",
  "ডেটাবেস থেকে সঠিক ঔষধের তথ্য খোঁজা হচ্ছে..."
];

const ECGLine = ({ className = "", opacity = "opacity-20", height = "h-10", bold = false }) => (
  <div className={`absolute bottom-0 left-0 w-full ${height} overflow-hidden pointer-events-none z-0 ${opacity} ${className}`}>
    <div className={`${bold ? 'ecg-line-bold' : 'ecg-line'} h-full`}></div>
  </div>
);

const UserPanel: React.FC<UserPanelProps> = ({ user, settings, priceList, orders, onUpdateUser, onPlaceOrder, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'diagnosis' | 'search' | 'shop' | 'prices' | 'profile' | 'updates' | 'medInfo' | 'history'>('home');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [searchResult, setSearchResult] = useState<string>('');
  const [alternatives, setAlternatives] = useState<any[]>([]);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempUser, setTempUser] = useState<User>(user);

  // Cropper states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    setTempUser(user);
  }, [user]);

  // Mobile Back Button Management
  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      if (imageToCrop) {
        setImageToCrop(null);
        return;
      }
      if (prescription) {
        setPrescription(null);
        return;
      }
      if (isEditingProfile) {
        setIsEditingProfile(false);
        return;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        return;
      }
    };

    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [activeTab, prescription, isEditingProfile, imageToCrop]);

  const changeTab = (tab: typeof activeTab) => {
    setErrorMsg(null);
    if (tab !== activeTab) {
      window.history.pushState({ tab }, '');
      setActiveTab(tab);
      if (tab !== 'diagnosis') {
        setPrescription(null);
      }
    }
  };

  // Loading message rotator
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const [record, setRecord] = useState<MedicalRecord>({
    patientName: user.name,
    patientAge: user.age || '',
    patientGender: user.gender || '',
    symptoms: [],
    customSymptoms: '',
    prevIllnesses: [],
    customPrevIllnesses: '',
    pastMeds: '',
    tests: [],
    bp: '',
    diabetes: ''
  });

  const handleDiagnosis = async () => {
    if (record.symptoms.length === 0 && !record.customSymptoms) {
      alert("অনুগ্রহ করে আপনার সমস্যার অন্তত একটি লক্ষণ সিলেক্ট করুন বা লিখে দিন।");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await generateDiagnosis(record, user);
      if (result) {
        const currentPrescriptions = user.prescriptions || [];
        const updatedPrescriptions = [result, ...currentPrescriptions].slice(0, 5);
        onUpdateUser({ ...user, prescriptions: updatedPrescriptions });
        setPrescription(result);
        setActiveTab('diagnosis');
      }
    } catch (error: any) {
      console.error("Diagnosis Failed:", error);
      setErrorMsg(error.message || "এআই সার্ভিস থেকে কোনো রেসপন্স পাওয়া যায়নি। আপনার ইন্টারনেট চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleMedInfo = async () => {
    const q = (document.getElementById('medQueryInfo') as HTMLInputElement).value;
    if(!q) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const info = await getMedicineInfo(q);
      setSearchResult(info);
    } catch(e: any) {
      setErrorMsg("তথ্য সংগ্রহে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAlternatives = async () => {
    const q = (document.getElementById('medQueryAlt') as HTMLInputElement).value;
    if(!q) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const alts = await findAlternatives(q);
      setAlternatives(alts);
    } catch(e: any) {
      setErrorMsg("বিকল্প ঔষধ খুঁজে পাওয়া যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, pixelCrop: any) => {
    setCroppedAreaPixels(pixelCrop);
  }, []);

  const handleSaveCroppedImage = async () => {
    setIsCropping(true);
    try {
      if (imageToCrop && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        setTempUser({ ...tempUser, profilePic: croppedImage });
        setImageToCrop(null);
      }
    } catch (e) {
      console.error(e);
    }
    setIsCropping(false);
  };

  const handleProfilePicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        window.history.pushState({ view: 'cropping' }, '');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (!tempUser.id.trim() || !tempUser.password.trim()) {
      alert("ইউজার আইডি এবং পাসওয়ার্ড অবশ্যই প্রদান করতে হবে।");
      return;
    }
    onUpdateUser(tempUser, user.id);
    setIsEditingProfile(false);
  };

  const repliedOrders = orders.filter(o => o.status === 'Replied');

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 pb-28">
      {/* Dynamic Image Cropper Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden flex flex-col h-[80vh] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><Scissors size={20} className="text-red-600"/> ফটো ক্রপ করুন</h3>
               <button onClick={() => window.history.back()} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"><X size={20}/></button>
            </div>
            
            <div className="flex-1 relative bg-slate-100">
               <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
               />
            </div>

            <div className="p-8 space-y-6">
               <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">জুম লেভেল</span>
                     <span className="text-xs font-black text-red-600">{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
               </div>
               
               <div className="flex gap-4">
                  <button onClick={() => window.history.back()} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">বাতিল</button>
                  <button onClick={handleSaveCroppedImage} disabled={isCropping} className="flex-1 py-5 bg-red-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                     {isCropping ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16}/>}
                     {isCropping ? 'প্রসেসিং...' : 'সেভ করুন'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[1000] bg-white/95 backdrop-blur-xl flex items-center justify-center p-6 text-center overflow-hidden">
          <ECGLine opacity="opacity-30" height="h-full" bold={true} className="text-red-600" />
          <div className="relative z-10 max-w-sm w-full space-y-8 animate-in zoom-in-95 duration-500">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-red-600/10 rounded-full animate-ping"></div>
              <div className="absolute inset-0 bg-red-600/5 rounded-full animate-pulse scale-150"></div>
              <div className="relative w-full h-full bg-white rounded-3xl border border-red-100 shadow-2xl shadow-red-200 flex items-center justify-center">
                 <Heart className="text-red-600 animate-pulse" size={56} fill="currentColor" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">সিগন্যাল প্রসেসিং হচ্ছে...</h3>
              <div className="flex items-center justify-center gap-2">
                 <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
              </div>
              <p className="text-lg font-bold text-red-600 min-h-[3rem] transition-all duration-500">
                {LOADING_MESSAGES[loadingMsgIdx]}
              </p>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-2">
        <ECGLine opacity="opacity-10" height="h-full" />
        <div className="max-w-6xl mx-auto flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
               <Heart className="text-white animate-pulse" size={16} fill="currentColor" />
             </div>
             <h1 className="text-lg font-black tracking-tight text-slate-800">Medi Help</h1>
          </div>
          <div className="flex items-center gap-2">
             {repliedOrders.length > 0 && (
               <div className="relative mr-2">
                 <Bell className="text-red-600 animate-bounce" size={20} />
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center">{repliedOrders.length}</span>
               </div>
             )}
             <button onClick={() => changeTab('profile')} className="flex items-center gap-2 p-1 bg-slate-100 rounded-full border border-slate-200 hover:bg-white transition-all relative overflow-hidden group">
                <ECGLine opacity="opacity-10" height="h-full" />
                {user.profilePic ? (
                  <img src={user.profilePic} className="w-7 h-7 rounded-full object-cover relative z-10" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center relative z-10">
                    <UserIcon size={12} className="text-slate-500" />
                  </div>
                )}
                <span className="text-xs font-bold text-slate-700 pr-2 hidden sm:inline relative z-10">{user.name}</span>
             </button>
             <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-all">
                <LogOut size={18} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="relative overflow-hidden bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full -mr-32 -mt-32 opacity-50 group-hover:scale-110 transition-transform duration-1000"></div>
              <ECGLine opacity="opacity-[0.05]" height="h-full" />
              <div className="relative z-10 w-28 h-28 md:w-32 md:h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center">
                 {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : <UserIcon size={48} className="text-slate-300" />}
              </div>
              <div className="relative z-10 text-center md:text-left flex-1">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-red-100">
                    <Activity size={12} className="animate-pulse" /> Patient Profile Active
                 </div>
                 <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">স্বাগতম, <span className="text-red-600">{user.name}</span>!</h2>
                 <p className="text-slate-500 font-medium text-sm md:text-base max-w-lg leading-relaxed">{settings.welcomeBanner.text}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
               <div onClick={() => changeTab('diagnosis')} className="col-span-2 md:col-span-3 rounded-[32px] p-7 bg-white text-slate-900 border-2 border-slate-100 cursor-pointer group flex flex-col justify-between min-h-[200px] shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-95">
                  <ECGLine opacity="opacity-15" height="h-full" bold={true} />
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center shadow-sm border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all duration-500"><Stethoscope size={28} /></div>
                    <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-xl shadow-red-200 group-hover:scale-110 transition-transform duration-500">
                       <Heart className="text-white animate-pulse" size={24} fill="currentColor" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black mb-1.5 tracking-tight text-slate-900">স্মার্ট ডায়াগনসিস</h3>
                    <p className="text-sm text-slate-500 font-bold max-w-[240px] leading-relaxed">AI দিয়ে লক্ষণ বিশ্লেষণ করে সঠিক প্রেসক্রিপশন তৈরি করুন।</p>
                  </div>
                  <div className="absolute bottom-6 right-6 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-125 transition-all duration-300"><ArrowRight size={24} /></div>
               </div>
               
               <CompactBento icon={<History />} title="প্রেসক্রিপশন হিস্ট্রি" color="text-red-500 bg-red-50" onClick={() => changeTab('history')} />
               <CompactBento icon={<Search />} title="বিকল্প ঔষধ" color="text-emerald-500 bg-emerald-50" onClick={() => changeTab('search')} />
               <CompactBento icon={<Info />} title="ঔষধের কাজ" color="text-blue-500 bg-blue-50" onClick={() => changeTab('medInfo')} />
               <CompactBento icon={<ShoppingBag />} title="ঔষধ অর্ডার" color="text-purple-500 bg-purple-50" onClick={() => changeTab('shop')} />
               <CompactBento icon={<CreditCard />} title="মূল্য তালিকা" color="text-orange-500 bg-orange-50" onClick={() => changeTab('prices')} />
               <CompactBento icon={<Gift />} title="অফার ও আপডেট" color="text-rose-500 bg-rose-50" onClick={() => changeTab('updates')} />
            </div>

            {/* Smart Developer Footer Banner */}
            <div className="relative w-full rounded-[40px] overflow-hidden shadow-2xl mt-12 bg-white border-2 border-slate-100 group p-10 md:p-14">
               <ECGLine opacity="opacity-15" height="h-full" bold={true} className="text-red-600" />
               <div className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex-1 text-center md:text-left space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-[.2em] shadow-xl shadow-red-200"><Zap size={14} className="fill-current animate-pulse" /> মেডি হেল্প ডেভেলপার</div>
                    <div>
                       <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tighter">রিমন মাহমুদ রোমান</h2>
                       <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center md:items-start">
                          <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm"><PhoneCall size={18} className="text-red-600" /><span className="text-lg font-black text-slate-800">01617365471</span></div>
                          <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm"><Mail size={18} className="text-red-600" /><span className="text-lg font-black text-slate-800 lowercase">romantechgp@gmail.com</span></div>
                       </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-4">
                     <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center text-red-600 border border-red-100 shadow-inner group-hover:scale-110 transition-all"><Heart size={48} fill="currentColor" className="animate-pulse" /></div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[.3em]">Health Care Expert</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'diagnosis' && !prescription && (
          <div className="max-w-4xl mx-auto space-y-12 pb-20">
             <div className="flex justify-between items-center bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
               <h2 className="text-2xl font-black flex items-center gap-3"><Stethoscope size={28} className="text-red-600"/> রোগের লক্ষণ ও তথ্য প্রদান করুন</h2>
               <button onClick={() => window.history.back()} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"><X size={20}/></button>
            </div>
            
            {errorMsg && (
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-[32px] flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                 <AlertTriangle className="text-red-600 shrink-0" size={24} />
                 <div>
                    <h4 className="text-lg font-black text-red-900">সমস্যা হয়েছে!</h4>
                    <p className="text-red-700 font-bold text-sm leading-relaxed">{errorMsg}</p>
                    <p className="text-xs text-red-500 mt-2">ভেরসেল ড্যাশবোর্ড থেকে API_KEY সেট করা আছে কি না তা যাচাই করুন।</p>
                 </div>
              </div>
            )}

            <div className="bg-white border-2 border-slate-100 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden space-y-12">
               <ECGLine opacity="opacity-[0.05]" height="h-full" bold={true} />
               <section className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput label="রোগীর নাম" value={record.patientName || ''} onChange={(v: string) => setRecord({...record, patientName: v})} placeholder="নাম লিখুন" />
                  <FormInput label="বয়স" value={record.patientAge || ''} onChange={(v: string) => setRecord({...record, patientAge: v})} placeholder="বয়স" />
                  <div className="space-y-1 bg-slate-50 p-4 rounded-3xl">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">লিঙ্গ</p>
                     <select className="w-full bg-transparent text-sm font-black outline-none" value={record.patientGender} onChange={e => setRecord({...record, patientGender: e.target.value})}>
                        <option value="">নির্বাচন করুন</option>
                        <option value="পুরুষ">পুরুষ</option>
                        <option value="মহিলা">মহিলা</option>
                     </select>
                  </div>
               </section>
               <section className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">আপনার বর্তমান লক্ষণসমূহ (সিলেক্ট করুন)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {DEFAULT_SYMPTOMS.map(s => (
                        <label key={s} className={`flex items-center gap-2 p-3 rounded-2xl cursor-pointer border-2 transition-all ${record.symptoms.includes(s) ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                           <input type="checkbox" className="hidden" checked={record.symptoms.includes(s)} onChange={(e) => {
                             const newS = e.target.checked ? [...record.symptoms, s] : record.symptoms.filter(x => x !== s);
                             setRecord({...record, symptoms: newS});
                           }} />
                           <span className="text-xs font-black">{s}</span>
                        </label>
                     ))}
                  </div>
                  <textarea placeholder="অন্যান্য লক্ষণ বিস্তারিত লিখুন..." className="w-full p-5 mt-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-bold outline-none focus:border-red-600 min-h-[100px]" value={record.customSymptoms} onChange={e => setRecord({...record, customSymptoms: e.target.value})} />
               </section>
               <button onClick={handleDiagnosis} disabled={loading} className={`w-full py-8 rounded-[40px] text-white font-black text-2xl shadow-2xl flex items-center justify-center gap-4 transition-all ${loading ? 'bg-slate-400' : 'bg-red-600 hover:scale-[1.01]'}`}>
                  {loading ? <Activity className="animate-spin" /> : <Sparkles />}
                  {loading ? 'এআই সকল তথ্য বিশ্লেষণ করছে...' : 'স্মার্ট প্রেসক্রিপশন জেনারেট করুন'}
               </button>
            </div>
          </div>
        )}

        {activeTab === 'diagnosis' && prescription && (
           <PrescriptionView prescription={prescription} user={user} settings={settings} />
        )}

        {activeTab === 'search' && (
           <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-emerald-700 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
                 <h2 className="text-3xl font-black mb-6 relative z-10">বিকল্প ঔষধ অনুসন্ধান</h2>
                 <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                    <input id="medQueryAlt" className="flex-1 p-5 bg-white/10 border border-white/20 rounded-3xl text-lg font-bold outline-none placeholder:text-white/30" placeholder="ঔষধ বা জেনেরিক নাম লিখুন..." />
                    <button onClick={handleSearchAlternatives} className="px-10 py-5 bg-white text-emerald-700 rounded-3xl font-black text-xs uppercase tracking-widest">অনুসন্ধান</button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {alternatives.map((alt, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                       <p className="text-xl font-black text-slate-900 mb-1">{alt.name}</p>
                       <p className="text-xs font-black text-emerald-600 uppercase mb-2">{alt.generic}</p>
                       <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                          <p className="text-sm font-bold text-slate-500">{alt.company}</p>
                          <p className="text-lg font-black text-slate-900">৳{alt.price}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'medInfo' && (
           <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-blue-600 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
                 <h2 className="text-3xl font-black mb-6 relative z-10">ঔষধের কাজ জানুন</h2>
                 <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                    <input id="medQueryInfo" className="flex-1 p-5 bg-white/10 border border-white/20 rounded-3xl text-lg font-bold outline-none placeholder:text-white/30" placeholder="ঔষধের নাম লিখুন..." />
                    <button onClick={handleMedInfo} className="px-10 py-5 bg-white text-blue-600 rounded-3xl font-black text-xs uppercase tracking-widest">তথ্য দেখুন</button>
                 </div>
              </div>
              {searchResult && <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm text-lg font-medium leading-relaxed whitespace-pre-wrap">{searchResult}</div>}
           </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
           <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-black flex items-center gap-3"><History size={28} className="text-red-600"/> পূর্ববর্তী প্রেসক্রিপশনসমূহ</h2>
              <div className="grid gap-4">
                 {user.prescriptions?.map((p, i) => (
                    <div key={i} onClick={() => setPrescription(p)} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex justify-between items-center cursor-pointer hover:border-red-600 transition-all">
                       <div>
                          <p className="text-lg font-black text-slate-900">{p.diagnosis}</p>
                          <p className="text-xs font-bold text-slate-500">{p.date}</p>
                       </div>
                       <ChevronRight className="text-slate-300" />
                    </div>
                 ))}
                 {(!user.prescriptions || user.prescriptions.length === 0) && (
                    <div className="text-center py-20 opacity-30">
                       <FileText size={48} className="mx-auto mb-4" />
                       <p className="font-black uppercase tracking-widest text-xs">কোনো রেকর্ড নেই</p>
                    </div>
                 )}
              </div>
           </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-2xl border border-slate-200 p-2 rounded-full shadow-2xl flex gap-1 z-[100] no-print">
         <NavItem active={activeTab === 'home'} icon={<Home size={20}/>} label="Home" onClick={() => changeTab('home')} />
         <NavItem active={activeTab === 'diagnosis'} icon={<Stethoscope size={20}/>} label="Check" onClick={() => { setPrescription(null); changeTab('diagnosis'); }} />
         <NavItem active={activeTab === 'shop'} icon={<ShoppingBag size={20}/>} label="Shop" onClick={() => changeTab('shop')} />
         <NavItem active={activeTab === 'medInfo'} icon={<Info size={20}/>} label="Info" onClick={() => changeTab('medInfo')} />
         <NavItem active={activeTab === 'search'} icon={<Search size={20}/>} label="Search" onClick={() => changeTab('search')} />
      </nav>
    </div>
  );
};

// Sub-components
const FormInput = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-1 bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 focus-within:border-indigo-600 transition-all">
    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</p>
    <input type="text" placeholder={placeholder} className="w-full bg-transparent text-sm font-black outline-none" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const NavItem = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-500 relative overflow-hidden group ${active ? 'bg-slate-950 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
    <ECGLine opacity={active ? "opacity-30" : "opacity-0 group-hover:opacity-10"} height="h-full" />
    <span className="relative z-10">{icon}</span>
    {active && <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{label}</span>}
  </button>
);

const CompactBento = ({ icon, title, color, onClick }: any) => (
  <div onClick={onClick} className="bg-white border border-slate-200 rounded-[32px] p-5 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-slate-50 transition-all group shadow-sm relative overflow-hidden">
     <ECGLine opacity="opacity-10" height="h-full" />
     <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-all shadow-inner relative z-10`}>
        {React.cloneElement(icon as React.ReactElement, { size: 22 })}
     </div>
     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 relative z-10 leading-tight">{title}</h4>
  </div>
);

export default UserPanel;
