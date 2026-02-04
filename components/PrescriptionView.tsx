
import React, { useState } from 'react';
import { Prescription, User, AdminSettings } from '../types';
import { ShieldCheck, HeartPulse, FileText, Activity, Download, Loader2 } from 'lucide-react';

interface PrescriptionViewProps {
  prescription: Prescription;
  user: User;
  settings: AdminSettings;
}

const PrescriptionView: React.FC<PrescriptionViewProps> = ({ prescription, user, settings }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = () => {
    setDownloading(true);
    const element = document.getElementById('prescription-content');
    if (!element) {
      setDownloading(false);
      return;
    }

    // High quality settings for clear Bengali font rendering
    const opt = {
      margin:       0,
      filename:     `MediHelp_${prescription.patientName}_${prescription.id}.pdf`,
      image:        { type: 'jpeg', quality: 1.0 },
      html2canvas:  { 
        scale: 3, // Increased scale for better font clarity
        useCORS: true, 
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use global html2pdf provided via index.html script tag
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save().then(() => {
      setDownloading(false);
    }).catch((err: any) => {
      console.error('PDF Generation error:', err);
      setDownloading(false);
      // Fallback to print if library fails
      window.print();
    });
  };

  const themeClasses = {
    'Standard': 'border-blue-600 bg-white text-slate-900',
    'Modern': 'border-slate-800 bg-slate-50 text-slate-900',
    'Minimal': 'border-slate-200 bg-white text-slate-800',
    'Classic': 'border-red-600 bg-rose-50/20 text-slate-900'
  }[settings.prescriptionTheme as keyof typeof themeClasses] || 'border-blue-600 bg-white';

  const accentColor = {
    'Standard': 'text-blue-600',
    'Modern': 'text-slate-800',
    'Minimal': 'text-slate-600',
    'Classic': 'text-red-600'
  }[settings.prescriptionTheme as keyof typeof themeClasses] || 'text-blue-600';

  return (
    <div className="space-y-4 pb-28 no-print-container">
      {/* Download Action Bar */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-4 flex flex-col md:flex-row justify-between items-center gap-4 no-print shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
             <ShieldCheck size={24}/>
           </div>
           <div>
             <h3 className="text-lg font-black text-slate-900 leading-tight">প্রেসক্রিপশন প্রস্তুত</h3>
             <p className="text-slate-500 font-bold text-xs">সরাসরি PDF ফাইলটি ডাউনলোড করতে নিচের বাটনটিতে ক্লিক করুন।</p>
           </div>
        </div>
        <button 
          onClick={handleDownloadPDF} 
          disabled={downloading}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />} 
          {downloading ? 'ফাইল তৈরি হচ্ছে...' : 'PDF ফাইলটি ডাউনলোড করুন'}
        </button>
      </div>

      {/* A4 Printable Prescription Container */}
      <div id="prescription-content" className={`mx-auto w-full max-w-[800px] shadow-2xl overflow-hidden print:shadow-none print:max-w-none print:w-full print:mx-0 print:border-none border-t-[8px] ${themeClasses} flex flex-col min-h-[296mm] prescription-printable`} style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
        
        {/* Header Section */}
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white">
           <div className="flex items-center gap-4">
              <div className={`w-14 h-14 ${accentColor.replace('text', 'bg').replace('-600', '-100')} rounded-2xl flex items-center justify-center ${accentColor}`}>
                <HeartPulse size={36} />
              </div>
              <div>
                <h1 className={`text-2xl font-black tracking-tight ${accentColor}`}>{settings.prescriptionHeader}</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[.3em]">Digital Medical Services</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Prescription ID</p>
              <p className={`text-xl font-black ${accentColor}`}>#{prescription.id}</p>
              <p className="text-xs font-bold text-slate-500 mt-1">তারিখ: {prescription.date}</p>
           </div>
        </div>

        {/* Patient Details Bar */}
        <div className="bg-slate-50/50 border-b border-slate-200 px-10 py-5 grid grid-cols-4 gap-6">
           <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Patient Name</p>
              <p className="font-bold text-slate-800 text-sm truncate">{prescription.patientName}</p>
           </div>
           <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Age / Gender</p>
              <p className="font-bold text-slate-800 text-sm">{prescription.patientAge}Y / {prescription.patientGender}</p>
           </div>
           <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Blood Group</p>
              <p className="font-bold text-slate-800 text-sm">{user.bloodGroup || 'N/A'}</p>
           </div>
           <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Mobile</p>
              <p className="font-bold text-slate-800 text-sm">{user.mobile || 'N/A'}</p>
           </div>
        </div>

        {/* Prescription Main Body */}
        <div className="flex-1 flex bg-white">
           {/* Left Info Panel */}
           <div className="w-[30%] p-8 border-r border-slate-100 bg-slate-50/20 space-y-8">
              <div>
                 <h4 className={`text-[10px] font-black uppercase mb-3 tracking-widest ${accentColor} flex items-center gap-2`}>
                   Diagnosis <Activity size={10}/>
                 </h4>
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm font-bold text-slate-800 text-sm leading-relaxed">
                    {prescription.diagnosis}
                 </div>
              </div>

              <div>
                 <h4 className={`text-[10px] font-black uppercase mb-3 tracking-widest ${accentColor} flex items-center gap-2`}>
                   Vitals <Activity size={10}/>
                 </h4>
                 <div className="space-y-2 px-1">
                    <div className="flex justify-between items-center text-sm font-bold">
                       <span className="text-slate-500">BP:</span>
                       <span className="text-slate-900">120/80</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold">
                       <span className="text-slate-500">Diabetes:</span>
                       <span className="text-slate-900">5.6 mmol</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Medication Panel (Rx) */}
           <div className="flex-1 p-10">
              <div className="text-4xl font-serif text-slate-200 mb-8 italic select-none">Rx</div>
              <div className="space-y-8">
                 {prescription.medicines.map((med, idx) => (
                   <div key={idx} className="border-b border-slate-100 pb-6 last:border-0">
                     <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                           <h3 className="text-[17px] font-black text-slate-900 leading-tight">
                             <span className={accentColor}>{idx + 1}.</span> {med.englishName}
                             <span className="text-slate-500 text-[15px] font-bold ml-2">({med.bengaliName})</span>
                           </h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Generic: {med.genericName}</p>
                        </div>
                        <div className={`px-4 py-1.5 ${accentColor.replace('text', 'bg').replace('-600', '-100')} ${accentColor} rounded-xl font-black text-xs border border-current whitespace-nowrap shadow-sm`}>
                          {med.dosage}
                        </div>
                     </div>
                     <p className="text-sm text-slate-600 mt-3 italic leading-relaxed">
                        <span className="font-bold text-slate-800 not-italic">কাজ:</span> {med.purpose}
                     </p>
                   </div>
                 ))}
              </div>

              {/* Doctors' Advice */}
              {prescription.advice && (
                <div className={`mt-12 p-6 rounded-[24px] border-2 border-dashed ${accentColor.replace('text', 'border').replace('-600', '-200')} bg-slate-50/40 relative`}>
                   <h4 className={`text-[11px] font-black uppercase mb-3 flex items-center gap-2 ${accentColor}`}>
                      <FileText size={16}/> ডাক্তারের পরামর্শ ও নির্দেশনা
                   </h4>
                   <p className="text-[15px] text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                      {prescription.advice}
                   </p>
                </div>
              )}
           </div>
        </div>

        {/* Footer & Signature Section */}
        <div className="p-10 border-t border-slate-100 bg-white">
           <div className="flex justify-between items-end gap-10">
              <div className="max-w-md">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Disclaimer / ডিসক্লেইমার</p>
                 <p className="text-[11px] font-bold text-slate-400 leading-snug italic">
                   {settings.prescriptionFooter}
                 </p>
              </div>
              <div className="text-center w-48 flex flex-col items-center">
                 {settings.digitalSignature ? (
                   <img src={settings.digitalSignature} className="h-14 object-contain mb-2 opacity-90" alt="Signature" />
                 ) : (
                   <div className="h-14 mb-2"></div>
                 )}
                 <div className="w-full h-[1.5px] bg-slate-200 mx-auto mb-1.5"></div>
                 {/* Space left blank as requested */}
                 <div className="h-4"></div> 
                 <p className="text-[8px] font-bold text-slate-400 mt-0.5">Medi Help Verified</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionView;
