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
        {/* Shifting Ambient Glows */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/15 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-500/20 transition-all duration-1000 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3 group-hover:bg-emerald-500/15 transition-all duration-1000" />
        <div className="absolute top-1/2 left-1/2 w-[250px] h-[250px] bg-purple-500/10 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center gap-2 bg-white/5 dark:bg-white/5 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-gray-100/10 dark:border-white/10 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Wallet className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-gray-400 dark:text-white/40 text-[9px] font-black uppercase tracking-[0.25em]">Vault Status: Secured</span>
          </div>

          <div className="relative h-14 md:h-16 flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
              {!showBalance ? (
                <motion.div
                  key="hidden"
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="relative">
                    <p className="text-indigo-500/60 dark:text-indigo-300/40 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      Verify Identity
                    </p>
                    
                    {/* Scanning Pulse Animation */}
                    <div className="flex items-center gap-3 bg-indigo-500/5 px-6 py-3 rounded-2xl border border-indigo-500/10 relative overflow-hidden">
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent skew-x-12"
                      />
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            opacity: [0.2, 1, 0.2],
                            scale: [1, 1.2, 1]
                          }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                          className="w-2 h-2 rounded-full bg-indigo-500/40"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="visible"
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 1.1 }}
                  className="flex flex-col items-center relative"
                >
                  {/* Holographic wealth particles */}
                  <div className="absolute inset-x-0 -top-12 -bottom-12 pointer-events-none overflow-visible">
                    {[...Array(8)].map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
                        animate={{ 
                          opacity: [0, 0.4, 0],
                          y: [-20, -100],
                          x: (i % 2 === 0 ? -1 : 1) * (20 + Math.random() * 60),
                          scale: [0.5, 1.2, 0.8],
                          rotate: Math.random() * 360
                        }}
                        transition={{ 
                          duration: 2 + Math.random() * 2, 
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: "easeOut"
                        }}
                        className="absolute left-1/2 top-1/2 text-indigo-400/20 font-black text-2xl"
                      >
                        ৳
                      </motion.span>
                    ))}
                  </div>

                  <div className="relative group/bal">
                    <span className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter drop-shadow-2xl z-10 selection:bg-indigo-500/30">
                      ৳{balance.toLocaleString()}
                    </span>
                    <motion.div 
                      layoutId="balanceLine"
                      className="mt-3 h-1 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-40 rounded-full blur-[1px]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 rounded-full bg-gray-50 dark:bg-white/5 backdrop-blur-md border border-gray-100 dark:border-white/10 text-gray-400 dark:text-white/20 hover:text-indigo-500 dark:hover:text-white/60 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{showBalance ? 'Hide Wealth' : 'Reveal Assets'}</span>
            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
