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

  const TimeUnit = ({ value, label, color }: { value: number, label: string, color: string }) => (
    <div className="flex flex-col items-center px-2 sm:px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 min-w-[50px] sm:min-w-[60px]">
      <motion.span 
        key={value}
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`text-lg sm:text-xl font-bold ${color} font-mono`}
      >
        {value.toString().padStart(2, '0')}
      </motion.span>
      <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-white/60 font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl border border-white/30">
      <div className="hidden sm:flex items-center justify-center w-8 h-8 bg-white/20 rounded-full shrink-0">
        <Clock className="w-4 h-4 text-white animate-pulse" />
      </div>
      <div className="flex flex-col mr-1 sm:mr-2 shrink-0">
        <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-widest opacity-90">Remaining Time</span>
        <span className="text-[8px] sm:text-[10px] text-white/80 font-medium">5 Years Savings Goal</span>
      </div>
      <div className="flex gap-1 sm:gap-2">
        <TimeUnit value={timeLeft.days} label="Days" color="text-white" />
        <TimeUnit value={timeLeft.hours} label="Hrs" color="text-white" />
        <TimeUnit value={timeLeft.minutes} label="Min" color="text-white" />
        <TimeUnit value={timeLeft.seconds} label="Sec" color="text-white" />
      </div>
    </div>
  );
};
