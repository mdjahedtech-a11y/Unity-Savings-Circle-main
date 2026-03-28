import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Check, Upload, FileText, Download, User, Calendar, Hash, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { removeBackground } from '../services/removeBgService';
import { cn } from '../lib/utils';

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

export function AgreementForm({ documentOnly = false, memberData }: { documentOnly?: boolean; memberData?: any }) {
  const { member: authMember, refreshProfile } = useAuth();
  const member = memberData || authMember;
  const [checkedPoints, setCheckedPoints] = useState<boolean[]>(new Array(AGREEMENT_POINTS.length).fill(false));
  const [fatherMotherName, setFatherMotherName] = useState('');
  const [signature, setSignature] = useState('');
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [viewMode, setViewMode] = useState<'fit' | 'full'>('fit');
  const [scale, setScale] = useState(1);
  const documentRef = useRef<HTMLDivElement>(null);

  // Handle dynamic scaling for mobile view
  React.useEffect(() => {
    const updateScale = () => {
      const container = document.getElementById('agreement-container');
      if (container) {
        const containerWidth = container.offsetWidth;
        if (viewMode === 'fit') {
          const newScale = Math.min(1, containerWidth / 800);
          setScale(newScale);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    const container = document.getElementById('agreement-container');
    if (container) observer.observe(container);
    
    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      observer.disconnect();
    };
  }, [viewMode, showDocument, member?.agreement_accepted, documentOnly]);

  const handleCheck = (index: number) => {
    const newChecked = [...checkedPoints];
    newChecked[index] = !newChecked[index];
    setCheckedPoints(newChecked);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setProcessingPhoto(true);
    const toastId = toast.loading('Removing background and resizing...');
    
    try {
      const processedImageBase64 = await removeBackground(file);
      setPassportPhoto(processedImageBase64);
      
      // Automatically update profile picture in database if member exists
      if (member?.id) {
        await supabase
          .from('members')
          .update({ photo_url: processedImageBase64 })
          .eq('id', member.id);
        
        // Refresh profile to update UI elsewhere
        await refreshProfile();
      }
      
      toast.success('Photo processed and profile updated successfully', { id: toastId });
    } catch (error: any) {
      console.error('Error processing photo:', error);
      toast.error(error.message || 'Failed to process photo', { id: toastId });
    } finally {
      setProcessingPhoto(false);
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
          photo_url: passportPhoto, // Automatically update profile picture
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

  if (showDocument || member?.agreement_accepted || documentOnly) {
    return (
      <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6 px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 dark:bg-gray-900/50 p-4 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-white/10">
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">সদস্যপদ এগ্রিমেন্ট ডকুমেন্ট</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">আপনার এগ্রিমেন্টটি এখান থেকে দেখে নিন</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={() => setViewMode(viewMode === 'fit' ? 'full' : 'fit')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 h-11 px-6 font-bold shadow-sm"
            >
              <FileText className="w-4 h-4" />
              {viewMode === 'fit' ? 'Zoom In' : 'Zoom Out'}
            </Button>
          </div>
        </div>

        {/* Document Container with Dynamic Scaling */}
        <div id="agreement-container" className={`w-full ${viewMode === 'full' ? 'overflow-x-auto' : 'overflow-hidden'} pb-10 flex justify-center min-h-[600px]`}>
          <div 
            style={{ 
              transform: `scale(${scale})`, 
              transformOrigin: 'top center',
              width: '800px',
              height: `${1550 * scale}px`, // Increased height to prevent cutoff
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              marginBottom: `${-1550 * (1 - scale)}px` // Offset the scale transform for layout
            }}
          >
            <div 
              ref={documentRef}
              data-agreement-document
              className="bg-white shadow-2xl rounded-sm font-serif relative"
              style={{ 
                width: '800px', 
                minHeight: '1500px', // Increased minHeight
                padding: '40px',
                border: '16px double #15803d',
                color: '#111827',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Decorative Background Elements */}
              <div 
                className="absolute top-0 right-0 w-96 h-96 rounded-full -mr-48 -mt-48 opacity-40 pointer-events-none" 
                style={{ backgroundColor: '#f0fdf4' }}
              />
              <div 
                className="absolute bottom-0 left-0 w-96 h-96 rounded-full -ml-48 -mb-48 opacity-40 pointer-events-none" 
                style={{ backgroundColor: '#f0fdf4' }}
              />

              {/* Header Section */}
              <div className="relative z-10 flex flex-col items-center space-y-6">
                <h3 className="text-2xl font-bold border-b-2 pb-1" style={{ color: '#166534', borderBottomColor: '#bbf7d0' }}>বিসমিল্লাহির রাহমানির রাহিম</h3>
                
                <div className="w-full flex justify-between items-start">
                  {/* Photo on Left */}
                  <div className="w-32 h-40 border-4 shadow-xl overflow-hidden rounded-lg" style={{ borderColor: '#dcfce7', backgroundColor: '#f9fafb' }}>
                    {member?.passport_photo_url || passportPhoto ? (
                      <img 
                        src={member?.passport_photo_url || passportPhoto || ''} 
                        alt="Passport" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: '#9ca3af' }}>ছবি নেই</div>
                    )}
                  </div>

                  {/* Logo and Name in Center */}
                  <div className="flex-1 flex flex-col items-center pt-2 px-2">
                    <img 
                      src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" 
                      alt="Logo" 
                      className="w-20 h-20 object-contain rounded-full shadow-lg border-2 mb-3" 
                      style={{ borderColor: '#f0fdf4', borderStyle: 'solid' }}
                      referrerPolicy="no-referrer"
                    />
                    <h1 className="text-4xl font-black tracking-tighter drop-shadow-sm" style={{ color: '#15803d', whiteSpace: 'nowrap' }}>Unity Savings Circle</h1>
                  </div>

                  {/* Empty space to balance photo */}
                  <div className="w-32" />
                </div>

                <div className="py-2 px-8 rounded-full text-sm font-bold uppercase tracking-[0.2em] shadow-md" style={{ backgroundColor: '#15803d', color: '#ffffff' }}>
                  সদস্যপদ গ্রহণ ও পরিচালনা নীতিমালা (অঙ্গীকারনামা)
                </div>
                
                <p className="text-base font-medium max-w-2xl mx-auto leading-relaxed text-center italic" style={{ color: '#374151' }}>
                  এতদ্বারা আমি নিম্নস্বাক্ষরকারী, এই সমিতির একজন সদস্য হিসেবে সমিতির স্থায়িত্ব, শৃঙ্খলা এবং আর্থিক স্বচ্ছতা বজায় রাখার স্বার্থে নিম্নলিখিত ১৬টি (সংশোধিত) নীতিমালা মানিয়া চলিতে বাধ্য থাকিব:
                </p>
              </div>

              {/* Points Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-10 text-[13px] leading-relaxed text-justify relative z-10 px-4 flex-grow">
                {AGREEMENT_POINTS.map((point, idx) => (
                  <div key={idx} className="flex gap-2 p-2 rounded-lg border" style={{ backgroundColor: 'rgba(240, 253, 244, 0.3)', borderColor: 'rgba(220, 252, 231, 0.5)', borderStyle: 'solid' }}>
                    <span className="font-black min-w-[20px] text-base" style={{ color: '#15803d' }}>{idx + 1}.</span>
                    <p className="font-medium" style={{ color: '#1f2937' }}>{point}</p>
                  </div>
                ))}
              </div>

              {/* Footer Info - Fixed Overlapping and Visibility */}
              <div className="mt-auto pt-8 border-t-4 grid grid-cols-2 gap-10 relative z-10 px-4 mb-4" style={{ borderTopColor: '#15803d', borderTopStyle: 'solid' }}>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', color: '#15803d' }}>আবেদনকারীর নাম</span>
                    <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '4px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827', display: 'block' }}>{member?.name}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', color: '#15803d' }}>পিতা/মাতার নাম</span>
                    <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '4px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827', display: 'block' }}>{member?.father_mother_name || fatherMotherName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="p-2.5 rounded-xl shadow-md" style={{ backgroundColor: '#15803d', color: '#ffffff' }}>
                      <Hash className="w-6 h-6" />
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', color: '#9ca3af' }}>শেয়ার সংখ্যা</span>
                      <span style={{ fontSize: '26px', fontWeight: '900', color: '#15803d' }}>{member?.share_count} টি</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between py-2">
                  <div className="text-center space-y-2">
                    <div style={{ 
                      fontFamily: '"Dancing Script", cursive', 
                      fontSize: '36px', 
                      borderBottom: '2px solid #9ca3af', 
                      paddingLeft: '32px', 
                      paddingRight: '32px', 
                      paddingBottom: '4px', 
                      fontStyle: 'italic', 
                      minWidth: '240px',
                      color: '#1e3a8a',
                      lineHeight: '1.2'
                    }}>
                      {member?.signature_data || signature}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6b7280', display: 'block' }}>আবেদনকারীর স্বাক্ষর</span>
                  </div>
                  
                  <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-inner mt-8" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderStyle: 'solid' }}>
                    <Calendar className="w-6 h-6" style={{ color: '#15803d' }} />
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151' }}>
                      তারিখ: {member?.agreement_date ? new Date(member.agreement_date).toLocaleDateString('bn-BD') : new Date().toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Branding */}
              <div className="mt-10 text-center border-t pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4em', color: '#9ca3af' }}>Unity Savings Circle • Official Membership Document • 2026</p>
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
                <div className="w-32 h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-white/5 relative">
                  {passportPhoto ? (
                    <img src={passportPhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-300" />
                  )}
                  {processingPhoto && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                      <Loader2 className="h-8 w-8 animate-spin text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Processing</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={processingPhoto}
                  />
                  <label
                    htmlFor="photo-upload"
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors",
                      processingPhoto && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {processingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {processingPhoto ? 'প্রসেসিং হচ্ছে...' : 'ছবি সিলেক্ট করুন'}
                  </label>
                  <p className="text-xs text-gray-500">JPG, PNG ফরম্যাট (সর্বোচ্চ ৫MB)</p>
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
