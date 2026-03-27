import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Check, Upload, FileText, Download, User, Calendar, Hash } from 'lucide-react';
import html2canvas from 'html2canvas';

const AGREEMENT_POINTS = [
  "মেয়াদকাল: সমিতির প্রাথমিক মেয়াদকাল হবে ৫ (পাঁচ) বছর। তবে পাঁচ বছর পূর্ণ হওয়ার পর সমিতি বিলুপ্ত করা হবে না, বরং কার্যক্রম অব্যাহত থাকিবে।",
  "সদস্যপদ: একজন সদস্য সমিতিতে নিজের নামে এক বা একাধিক সদস্য শেয়ার সংখ্যা গ্রহণ করিতে পারিবে।",
  "ঋণ সংক্রান্ত: কোনো সদস্য সমিতি হইতে ব্যক্তিগত প্রয়োজনে 'ধার-দেনা' বা লোন (ঋণ) গ্রহণ করিতে পারিবেন না।",
  "লাভ-লোকসান: সমিতির সকল লাভ এবং লোকসান সকল সদস্য সমানভাবে বহন করিতে বাধ্য থাকিবেন।",
  "সিদ্ধান্ত গ্রহণ: কোনো সদস্যের একক সিদ্ধান্ত গ্রহণযোগ্য হবে না। যেকোনো সিদ্ধান্তের ক্ষেত্রে সংখ্যাগরিষ্ঠ সদস্যের মতামতই চূড়ান্ত বলিয়া গণ্য হইবে।",
  "সঞ্চয় ও সময়সীমা: প্রত্যেক সদস্যকে প্রতি মাসের ১ থেকে ১৫ তারিখের মধ্যে নির্ধারিত ১০০০/- (এক হাজার) টাকা (খরচসহ) ক্যাশিয়ারের নিকট জমা দিতে হবে।",
  "বিলম্ব ফি: ১৫ তারিখের পর থেকে ২য় মাস পর্যন্ত সময় অতিবাহিত করিলে ১০০/- টাকা বিলম্ব ফি প্রদান করিতে হইবে।",
  "ব্যাংক অ্যাকাউন্ট: সমিতির অর্থ সুরক্ষার লক্ষ্যে ব্যাংকে 'জয়েন্ট অ্যাকাউন্ট' (যৌথ নামে) টাকা জমা রাখা হইবে।",
  "জমা ও প্রমাণ: ক্যাশিয়ার প্রতি মাসের টাকা পরবর্তী ২০ তারিখের মধ্যে ব্যাংকে জমা দিবেন এবং জমাকৃত স্লিপ সমিতির গ্রুপে আপলোড করিয়া প্রমাণ নিশ্চিত করিবেন।",
  "সদস্যপদ বাতিল: পরপর ৩ (তিন) মাস সঞ্চয়ের টাকা জমা দিতে ব্যর্থ হইলে উক্ত সদস্যের সদস্যপদ স্বয়ংক্রিয়ভাবে বাতিল বলিয়া গণ্য হইবে।",
  "বাতিল সদস্যের পাওনা: বাতিলকৃত সদস্যের সঞ্চয়কৃত টাকা সমিতির মেয়াদ শেষ হওয়ার পর (লভ্যাংশ ব্যতীত) ফেরত প্রদান করা হবে। মেয়াদ শেষ না হওয়া পর্যন্ত কোনো সদস্য টাকা উত্তোলনের জন্য কোনো প্রকার সামাজিক বা আইনি তদবির করিতে পারিবেন না।",
  "সভা ও উপস্থিতি: সমিতির প্রয়োজনে পরিচালনা কমিটি মিটিং কল করলে প্রত্যেক সদস্যের উপস্থিতি বাধ্যতামূলক। প্রবাসীদের ক্ষেত্রে আলোচনার বিষয়বস্তু ও সিদ্ধান্ত জানানো হবে এবং তাদের প্রস্তাবনা বিবেচনা করা হবে।",
  "শৃঙ্খলা ও বহিষ্কার: কোনো সদস্যের কারণে বিশৃঙ্খলা দেখা দিলে সকল সদস্যের মতামতের ভিত্তিতে উক্ত সদস্যকে সাময়িক বা স্থায়ীভাবে বহিষ্কার করার ক্ষমতা সমিতি সংরক্ষণ করিবে।",
  "পেমেন্ট মাধ্যম: হিসাবরক্ষকের বিকাশ নাম্বারে অবশ্যই 'খরচসহ' কিস্তির টাকা পরিশোধ করিতে হইবে।",
  "সদস্যপদ প্রত্যাহার: ৫ বছর পূর্ণ হওয়ার পর কোনো সদস্য চাইলে সদস্যপদ বাতিল করিতে পারিবেন। সেক্ষেত্রে তিনি তার সঞ্চয়কৃত অর্থ সহ (মুনাফা ও লোকসান) সমান ভাবে ফেরত পাইবেন।",
  "অভিভাবক সংক্রান্ত: সমিতির অভ্যন্তরীণ কোনো বিষয়ে কোনো সদস্যের অভিভাবক (গার্জিয়ান) হস্তক্ষেপ করিতে পারিবেন না।"
];

export function AgreementForm({ documentOnly = false }: { documentOnly?: boolean }) {
  const { member, refreshProfile } = useAuth();
  const [checkedPoints, setCheckedPoints] = useState<boolean[]>(new Array(AGREEMENT_POINTS.length).fill(false));
  const [fatherMotherName, setFatherMotherName] = useState('');
  const [signature, setSignature] = useState('');
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const handleCheck = (index: number) => {
    const newChecked = [...checkedPoints];
    newChecked[index] = !newChecked[index];
    setCheckedPoints(newChecked);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassportPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (checkedPoints.some(p => !p)) {
      toast.error('অনুগ্রহ করে সকল পয়েন্টে টিক দিন।');
      return;
    }
    if (!fatherMotherName || !signature || !passportPhoto) {
      toast.error('অনুগ্রহ করে সকল তথ্য পূরণ করুন এবং ছবি আপলোড করুন।');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({
          father_mother_name: fatherMotherName,
          signature_data: signature,
          passport_photo_url: passportPhoto,
          agreement_accepted: true,
          agreement_date: new Date().toISOString()
        })
        .eq('id', member?.id);

      if (error) throw error;
      
      toast.success('এগ্রিমেন্ট সফলভাবে সম্পন্ন হয়েছে।');
      await refreshProfile();
      setShowDocument(true);
    } catch (error) {
      console.error('Error submitting agreement:', error);
      toast.error('এগ্রিমেন্ট সাবমিট করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async () => {
    if (!documentRef.current) {
      toast.error('ডকুমেন্ট পাওয়া যায়নি।');
      return;
    }
    
    const toastId = toast.loading('ডকুমেন্ট ডাউনলোড হচ্ছে...');
    try {
      // Create a clone for rendering to avoid scaling issues
      const element = documentRef.current;
      const canvas = await html2canvas(element, {
        scale: 3, // High quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800, // Fixed width for consistent output
        height: element.scrollHeight
      });
      
      const link = document.createElement('a');
      link.download = `Unity_Agreement_${member?.name || 'Member'}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('ডাউনলোড সফল হয়েছে।', { id: toastId });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('ডাউনলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', { id: toastId });
    }
  };

  if (showDocument || member?.agreement_accepted || documentOnly) {
    return (
      <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">সদস্যপদ এগ্রিমেন্ট ডকুমেন্ট</h2>
          <Button onClick={downloadDocument} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20">
            <Download className="w-4 h-4" />
            ডাউনলোড (PNG)
          </Button>
        </div>

        {/* Document Container with Scaling for Mobile */}
        <div className="overflow-x-auto pb-8 px-2 sm:px-0 flex justify-center">
          <div className="origin-top scale-[0.45] sm:scale-[0.7] md:scale-100 transition-transform duration-300">
            <div 
              ref={documentRef}
              className="bg-white p-12 shadow-2xl border-[16px] border-double border-green-700 rounded-sm text-gray-900 font-serif relative"
              style={{ width: '800px', minHeight: '1100px' }}
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-green-50 rounded-full -mr-48 -mt-48 opacity-40 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-50 rounded-full -ml-48 -mb-48 opacity-40 pointer-events-none" />

              {/* Header Section - Improved Layout */}
              <div className="relative z-10 flex flex-col items-center space-y-6">
                <h3 className="text-2xl font-bold text-green-800 border-b-2 border-green-200 pb-1">বিসমিল্লাহির রাহমানির রাহিম</h3>
                
                <div className="w-full flex justify-between items-start">
                  {/* Photo on Left */}
                  <div className="w-32 h-40 border-4 border-green-100 shadow-xl overflow-hidden bg-gray-50 rounded-lg">
                    {member?.passport_photo_url || passportPhoto ? (
                      <img 
                        src={member?.passport_photo_url || passportPhoto || ''} 
                        alt="Passport" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">ছবি নেই</div>
                    )}
                  </div>

                  {/* Logo and Name in Center */}
                  <div className="flex-1 flex flex-col items-center pt-2">
                    <img 
                      src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" 
                      alt="Logo" 
                      className="w-24 h-24 object-contain rounded-full shadow-lg border-2 border-green-50 mb-4" 
                      referrerPolicy="no-referrer"
                    />
                    <h1 className="text-5xl font-black text-green-700 tracking-tighter drop-shadow-sm">Unity Savings Circle</h1>
                  </div>

                  {/* Empty space to balance photo */}
                  <div className="w-32" />
                </div>

                <div className="bg-green-700 text-white py-2 px-8 rounded-full text-sm font-bold uppercase tracking-[0.2em] shadow-md">
                  সদস্যপদ গ্রহণ ও পরিচালনা নীতিমালা (অঙ্গীকারনামা)
                </div>
                
                <p className="text-base font-medium text-gray-700 max-w-2xl mx-auto leading-relaxed text-center italic">
                  এতদ্বারা আমি নিম্নস্বাক্ষরকারী, এই সমিতির একজন সদস্য হিসেবে সমিতির স্থায়িত্ব, শৃঙ্খলা এবং আর্থিক স্বচ্ছতা বজায় রাখার স্বার্থে নিম্নলিখিত ১৬টি (সংশোধিত) নীতিমালা মানিয়া চলিতে বাধ্য থাকিব:
                </p>
              </div>

              {/* Points Grid - Better Spacing */}
              <div className="grid grid-cols-2 gap-x-10 gap-y-5 mt-12 text-[14px] leading-relaxed text-justify relative z-10 px-4">
                {AGREEMENT_POINTS.map((point, idx) => (
                  <div key={idx} className="flex gap-3 bg-green-50/30 p-2 rounded-lg border border-green-100/50">
                    <span className="font-black text-green-700 min-w-[24px] text-lg">{idx + 1}.</span>
                    <p className="text-gray-800 font-medium">{point}</p>
                  </div>
                ))}
              </div>

              {/* Footer Info - Premium Styling */}
              <div className="mt-16 pt-10 border-t-4 border-green-700 grid grid-cols-2 gap-12 relative z-10 px-4">
                <div className="space-y-6">
                  <div className="flex flex-col gap-1 border-b-2 border-gray-200 pb-2">
                    <span className="text-xs font-bold text-green-700 uppercase tracking-widest">আবেদনকারীর নাম</span>
                    <span className="text-2xl font-bold text-gray-900">{member?.name}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-b-2 border-gray-200 pb-2">
                    <span className="text-xs font-bold text-green-700 uppercase tracking-widest">পিতা/মাতার নাম</span>
                    <span className="text-2xl font-bold text-gray-900">{member?.father_mother_name || fatherMotherName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-green-700 text-white p-3 rounded-2xl shadow-lg">
                      <Hash className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">শেয়ার সংখ্যা</span>
                      <span className="text-3xl font-black text-green-700">{member?.share_count} টি</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 text-right flex flex-col items-end justify-between">
                  <div className="text-center space-y-2">
                    <div className="font-handwriting text-4xl text-blue-900 border-b-2 border-gray-400 px-10 min-w-[250px] pb-2 italic">
                      {member?.signature_data || signature}
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">আবেদনকারীর স্বাক্ষর</span>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-200 shadow-inner">
                    <Calendar className="w-5 h-5 text-green-700" />
                    <span className="text-xl font-bold text-gray-700">
                      তারিখ: {member?.agreement_date ? new Date(member.agreement_date).toLocaleDateString('bn-BD') : new Date().toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Branding */}
              <div className="mt-16 text-center border-t border-gray-100 pt-6">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.5em]">Unity Savings Circle • Official Membership Document • 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">সদস্যপদ অঙ্গীকারনামা</h1>
          <p className="text-gray-500 dark:text-white/60">সমিতির সদস্য হিসেবে যোগ দিতে নিচের নীতিমালাগুলো পড়ুন এবং সম্মতি দিন।</p>
        </div>

        <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden">
          <CardHeader className="bg-green-600 text-white py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              নীতিমালা ও শর্তাবলী (১৬টি পয়েন্ট)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {AGREEMENT_POINTS.map((point, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 ${checkedPoints[idx] ? 'bg-green-50/50 dark:bg-green-500/5' : ''}`}
                  onClick={() => handleCheck(idx)}
                >
                  <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${checkedPoints[idx] ? 'bg-green-600 border-green-600' : 'border-gray-300 dark:border-white/20'}`}>
                    {checkedPoints[idx] && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-green-600 mb-1 block">পয়েন্ট {idx + 1}</span>
                    <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed">{point}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              ব্যক্তিগত তথ্য ও স্বাক্ষর
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-white/80">পিতা/মাতার নাম</label>
                <input
                  type="text"
                  value={fatherMotherName}
                  onChange={(e) => setFatherMotherName(e.target.value)}
                  placeholder="পিতা বা মাতার নাম লিখুন"
                  className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-white/80">স্বাক্ষর (নাম লিখুন)</label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                  className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-green-500 outline-none font-handwriting text-lg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700 dark:text-white/80">পাসপোর্ট সাইজ ছবি আপলোড করুন</label>
              <div className="flex items-center gap-6">
                <div className="w-32 h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-white/5">
                  {passportPhoto ? (
                    <img src={passportPhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    ছবি সিলেক্ট করুন
                  </label>
                  <p className="text-xs text-gray-500">JPG, PNG ফরম্যাট (সর্বোচ্চ ২MB)</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-white/5">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-lg font-bold shadow-lg shadow-green-600/20"
              >
                {loading ? 'প্রসেসিং হচ্ছে...' : 'অঙ্গীকারনামা সম্পন্ন করুন'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
