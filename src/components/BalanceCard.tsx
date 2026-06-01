import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Eye, EyeOff, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface BalanceCardProps {
  balance: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance }) => {
  const [showBalance, setShowBalance] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-xl mx-auto"
    >
      <div 
        onClick={() => setShowBalance(!showBalance)}
        className={cn(
          "relative overflow-hidden cursor-pointer group",
          "rounded-[2.5rem] p-6 md:p-8 transition-all duration-500 shadow-2xl",
          "bg-indigo-950 border border-white/5"
        )}
      >
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-500/15 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 blur-[80px] rounded-full -translate-x-1/3 translate-y-1/3 group-hover:bg-emerald-500/10 transition-all duration-700" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <Wallet className="w-4 h-4 text-indigo-400" />
            <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Total Savings</span>
          </div>

          <div className="relative h-14 md:h-16 flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
              {!showBalance ? (
                <motion.div
                  key="hidden"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex flex-col items-center justify-center"
                >
                  <p className="text-indigo-300/40 text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Tap to check balance
                  </p>
                  <div className="flex gap-2.5">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.2, 0.5, 0.2]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2, 
                          delay: i * 0.15 
                        }}
                        className="w-2.5 h-2.5 rounded-full bg-indigo-400/40"
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="visible"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col items-center relative"
                >
                  {/* Floating Taka Particles */}
                  <div className="absolute inset-0 overflow-visible pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
                        animate={{ 
                          opacity: [0, 1, 0],
                          y: -60,
                          x: (i % 2 === 0 ? -1 : 1) * (10 + i * 15),
                          scale: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 2 + Math.random(), 
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                        className="absolute text-indigo-400/30 font-bold text-xl"
                      >
                        ৳
                      </motion.span>
                    ))}
                  </div>

                  <span className="text-3xl md:text-5xl font-black text-white tracking-tighter drop-shadow-md z-10">
                    ৳{balance.toLocaleString()}
                  </span>
                  
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="mt-2 h-0.5 w-16 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/40 hover:text-white/80 transition-all shadow-lg"
          >
            {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
