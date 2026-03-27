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
    <div className="relative w-full overflow-hidden bg-white/10 dark:bg-white/5 backdrop-blur-md border-b border-white/10 dark:border-white/5 shadow-sm">
      <div className="flex items-center h-12">
        {/* Breaking Badge */}
        <div className="relative z-10 flex items-center h-full px-4 bg-gradient-to-r from-red-600 to-orange-500 shadow-lg">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 bg-red-500 blur-md opacity-20"
          />
          <span className="relative text-[10px] font-black tracking-tighter text-white uppercase flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" />
            Breaking
          </span>
        </div>

        {/* Marquee Content */}
        <div className="flex-1 overflow-hidden relative group">
          <motion.div
            className="flex whitespace-nowrap items-center"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            whileHover={{ animationPlayState: 'paused' }}
          >
            <div className="flex items-center gap-12 pr-12">
              {/* Duplicate content for seamless loop */}
              {[...Array(2)].map((_, loopIdx) => (
                <div key={loopIdx} className="flex items-center gap-12">
                  {messages.map((msg, idx) => (
                    <span key={`${loopIdx}-${idx}`} className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <span className="text-orange-500 animate-pulse">🔥</span>
                      {msg.text}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
          
          {/* Fades for smooth edges */}
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white/20 dark:from-gray-900/20 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white/20 dark:from-gray-900/20 to-transparent z-10 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
