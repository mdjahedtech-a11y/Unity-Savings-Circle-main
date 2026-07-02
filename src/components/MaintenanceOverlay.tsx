import React from 'react';
import { motion } from 'motion/react';
import { PowerOff, ShieldAlert, Zap, Lock } from 'lucide-react';

export const MaintenanceOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black">
      {/* Animated Background Layers */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-transparent rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-pink-500/30 via-orange-500/20 to-transparent rounded-full blur-[120px]" 
        />
      </div>

      <div className="relative w-full max-w-lg px-6">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative"
        >
          {/* Main Card */}
          <div className="relative bg-zinc-950/80 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden text-center">
            
            {/* Glossy Scanline Effect */}
            <motion.div 
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent pointer-events-none"
            />

            {/* Icon Container */}
            <div className="relative mb-8 inline-block">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"
              />
              <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center border-2 border-white/20 shadow-2xl rotate-12">
                <PowerOff className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-pink-500 p-2 rounded-xl shadow-lg border border-white/20 -rotate-12">
                <Lock className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Text Content */}
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter italic mb-4">
              System <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Offline</span>
            </h1>
            
            <p className="text-zinc-400 text-sm md:text-base font-medium leading-relaxed mb-8 max-w-xs mx-auto">
              The application has been temporarily disabled by the administrator for maintenance. Please check back later.
            </p>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Admin Locked</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                <Zap className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Maintenance</span>
              </div>
            </div>

            {/* Decorative Grid */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
          </div>

          {/* Bottom Floating Warning */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center justify-center gap-2 text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em]"
          >
            <ShieldAlert className="w-3 h-3" />
            Restricted Access Protocol Active
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
