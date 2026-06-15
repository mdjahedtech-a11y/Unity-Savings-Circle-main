import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { TvSponsor } from '../types';

export const SponsorOverlay: React.FC = () => {
  const [sponsor, setSponsor] = useState<TvSponsor | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchSponsor = async () => {
      const { data, error } = await supabase
        .from('tv_sponsors')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setSponsor(data);
        // If interval is 0, show instantly/always if active
        if (data.is_active && data.show_interval_seconds === 0) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    };

    fetchSponsor();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('tv_sponsors_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tv_sponsors' },
        (payload) => {
          const newData = payload.new as TvSponsor;
          setSponsor(newData);
          if (newData.is_active && newData.show_interval_seconds === 0) {
            setIsVisible(true);
          } else if (!newData.is_active) {
            setIsVisible(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!sponsor || !sponsor.is_active || sponsor.show_interval_seconds === 0) return;

    const showInterval = sponsor.show_interval_seconds * 1000;
    const duration = sponsor.display_duration_seconds * 1000;

    const cycle = () => {
      setIsVisible(true);
      setTimeout(() => {
        setIsVisible(false);
      }, duration);
    };

    // First appearance
    const initialDelay = setTimeout(cycle, 2000);

    const interval = setInterval(cycle, showInterval + duration);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [sponsor]);

  if (!sponsor || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 100, y: 50, opacity: 0, scale: 0.5, rotate: 5 }}
        animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
        exit={{ x: -100, opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
        transition={{ 
          type: 'spring', 
          damping: 12, 
          stiffness: 120,
          opacity: { duration: 0.3 }
        }}
        className="absolute bottom-6 md:bottom-12 right-6 md:right-12 z-50 pointer-events-none"
      >
        <div className="relative group">
          {/* Pulsing Colorful Glow Layers (More Transparent) */}
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-[2rem] blur-xl opacity-20 animate-pulse" />
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl opacity-30" />
          
          <div className="relative flex items-center gap-5 bg-black/10 backdrop-blur-md border border-white/5 p-4 md:p-5 pl-7 md:pl-8 rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden">
            {/* Animated Scanner Shine Effect (Subtle) */}
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-z-0"
            />

            <div className="flex flex-col relative z-10">
              <span className="text-[9px] md:text-[10px] font-black text-cyan-400 opacity-60 uppercase tracking-[0.4em] mb-1.5 drop-shadow-sm">
                Official Sponsor
              </span>
              <h4 className="text-2xl md:text-3xl font-black text-white/90 uppercase tracking-tighter leading-none italic">
                {sponsor.name}
              </h4>
              <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-500/40 to-indigo-500/40 mt-2 rounded-full" />
            </div>

            {sponsor.image_url ? (
              <div className="relative z-10 w-14 h-14 md:w-20 md:h-20 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20 group-hover:scale-105 transition-transform duration-500">
                <img 
                  src={sponsor.image_url} 
                  alt={sponsor.name} 
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
            ) : (
              <div className="relative z-10 w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-indigo-600/30 via-purple-600/30 to-pink-600/30 flex items-center justify-center border border-white/10 group-hover:rotate-6 transition-transform duration-500">
                <span className="text-2xl md:text-3xl font-black text-white/60 drop-shadow-md">{sponsor.name.charAt(0)}</span>
              </div>
            )}

            {/* Corner Accent Particles */}
            <div className="absolute top-0 right-0 p-1 opacity-40">
               <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
