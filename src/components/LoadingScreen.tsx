import React from 'react';
import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-[#0f172a]">
      <div className="relative">
        {/* Outer glowing rings */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-indigo-500/20 dark:border-indigo-500/10 will-change-transform"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ width: '120px', height: '120px', margin: '-10px' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-purple-500/20 dark:border-purple-500/10 will-change-transform"
          animate={{
            scale: [1.2, 1.8, 1.2],
            opacity: [0.2, 0.05, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
          style={{ width: '120px', height: '120px', margin: '-10px' }}
        />

        {/* Main Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-24 h-24 rounded-3xl bg-white dark:bg-gray-800 shadow-2xl flex items-center justify-center overflow-hidden border border-gray-100 dark:border-white/10"
        >
          <img 
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" 
            alt="Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          
          {/* Scanning effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent h-1/2 w-full will-change-[top]"
            animate={{
              top: ['-50%', '100%'],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      </div>

      {/* Text Animation */}
      <div className="mt-8 flex flex-col items-center">
        <motion.h2 
          className="text-xl font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          Unity Savings Circle
        </motion.h2>
        
        {/* Loading Bar */}
        <div className="mt-4 w-48 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ width: '60%' }}
          />
        </div>
        
        <motion.p 
          className="mt-2 text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-[0.2em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Syncing Data...
        </motion.p>
      </div>
    </div>
  );
}
