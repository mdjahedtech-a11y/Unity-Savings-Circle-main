import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { MarqueeText } from '../types';
import { Zap } from 'lucide-react';

export function Marquee() {
  const [messages, setMessages] = useState<MarqueeText[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('marquee_texts')
        .select('text')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching marquee messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveMessages();

    // Real-time subscription
    const subscription = supabase
      .channel('marquee_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marquee_texts' }, () => {
        fetchActiveMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading || messages.length === 0) return null;

  const combinedText = messages.map(m => m.text).join('   •   ');

  return (
    <div className="relative w-full px-4 py-2">
      <div className="relative overflow-hidden bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl shadow-indigo-500/5">
        <div className="flex items-center h-10 md:h-12">
          {/* Breaking Badge */}
          <div className="relative z-20 flex items-center h-full px-4 md:px-6 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 border-r border-white/10">
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-white"
            />
            <span className="relative text-[9px] md:text-[10px] font-black tracking-[0.2em] text-white uppercase flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Update
            </span>
          </div>

          {/* Marquee Content */}
          <div className="flex-1 overflow-hidden relative group">
            <motion.div
              className="flex whitespace-nowrap items-center h-full"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="flex items-center gap-12 pr-12">
                {/* Duplicate content for seamless loop */}
                {[...Array(2)].map((_, loopIdx) => (
                  <div key={loopIdx} className="flex items-center gap-16">
                    {messages.map((msg, idx) => (
                      <span key={`${loopIdx}-${idx}`} className="text-[11px] md:text-sm font-bold text-gray-700 dark:text-white/90 flex items-center gap-4 tracking-tight">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                        {msg.text}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Edge Fades */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white/40 dark:from-indigo-950/20 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/40 dark:from-indigo-950/20 to-transparent z-10 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
