import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

export const CountdownTimer = () => {
  // End date: March 1, 2031 (5 years from March 1, 2026)
  const targetDate = new Date(2031, 2, 1, 0, 0, 0).getTime(); // March is index 2
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    console.log('CountdownTimer mounted, target:', new Date(targetDate).toLocaleString());
    setIsMounted(true);
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isMounted) return null;

  const TimeUnit = React.memo(({ value, label, color }: { value: number, label: string, color: string }) => (
    <div className="flex flex-col items-center px-1.5 py-0.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 min-w-[34px] sm:min-w-[38px]">
      <motion.span 
        key={value}
        initial={{ y: 2, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`text-xs sm:text-sm font-black ${color} font-mono`}
      >
        {value.toString().padStart(2, '0')}
      </motion.span>
      <span className="text-[6px] uppercase tracking-tighter text-white/50 font-bold leading-none">{label}</span>
    </div>
  ));

  return (
    <div className="flex items-center gap-2 p-1.5 bg-indigo-600/90 dark:bg-indigo-500/20 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
      <div className="hidden xs:flex items-center justify-center w-6 h-6 bg-white/10 rounded-lg shrink-0">
        <Clock className="w-3.5 h-3.5 text-white animate-pulse" />
      </div>
      <div className="flex flex-col mr-1 shrink-0">
        <span className="text-[8px] font-black text-white uppercase tracking-tight leading-none">Remained Time</span>
        <span className="text-[6px] text-white/60 font-bold mt-0.5">SAVINGS GOAL</span>
      </div>
      <div className="flex gap-1">
        <TimeUnit value={timeLeft.days} label="Days" color="text-white" />
        <TimeUnit value={timeLeft.hours} label="Hrs" color="text-white" />
        <TimeUnit value={timeLeft.minutes} label="Min" color="text-white" />
        <TimeUnit value={timeLeft.seconds} label="Sec" color="text-white" />
      </div>
    </div>
  );
};
