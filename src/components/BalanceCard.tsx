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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-md mx-auto"
    >
      <div 
        onClick={() => setShowBalance(!showBalance)}
        className={cn(
          "relative overflow-hidden cursor-pointer group",
          "rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-5 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10",
          "bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10"
        )}
      >
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-500/10 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-emerald-500/5 blur-[60px] rounded-full -translate-x-1/3 translate-y-1/3 group-hover:bg-emerald-500/10 transition-all duration-700" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-100 dark:border-white/10">
            <Wallet className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-gray-400 dark:text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Total Savings</span>
          </div>

          <div className="relative h-12 md:h-14 flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
              {!showBalance ? (
                <motion.div
                  key="hidden"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex flex-col items-center justify-center"
                >
                  <p className="text-indigo-500/40 dark:text-indigo-300/20 text-[8px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    Check Balance
                  </p>
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2, 
                          delay: i * 0.15 
                        }}
                        className="w-2 h-2 rounded-full bg-indigo-500/20 dark:bg-indigo-400/20"
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="visible"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center relative"
                >
                  {/* Floating Taka Particles */}
                  <div className="absolute inset-0 overflow-visible pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
                        animate={{ 
                          opacity: [0, 1, 0],
                          y: -40,
                          x: (i % 2 === 0 ? -1 : 1) * (8 + i * 12),
                          scale: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 1.5 + Math.random(), 
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                        className="absolute text-indigo-500/20 dark:text-indigo-400/20 font-bold text-lg"
                      >
                        ৳
                      </motion.span>
                    ))}
                  </div>

                  <span className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter drop-shadow-sm z-10">
                    ৳{balance.toLocaleString()}
                  </span>
                  
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="mt-1.5 h-0.5 w-12 bg-gradient-to-r from-transparent via-indigo-500/20 dark:via-indigo-400/20 to-transparent"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full bg-gray-50 dark:bg-white/5 backdrop-blur-md border border-gray-100 dark:border-white/10 text-gray-400 dark:text-white/20 hover:text-indigo-500 dark:hover:text-white/50 transition-all shadow-sm"
          >
            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
