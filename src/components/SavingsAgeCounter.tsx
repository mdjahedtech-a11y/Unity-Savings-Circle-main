import React, { useState, useEffect } from 'react';

export const SavingsAgeCounter: React.FC = () => {
  const [age, setAge] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Start date: March 1st, 2026
    const startDate = new Date('2026-03-01T00:00:00Z');

    const updateCounter = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();

      if (diff <= 0) {
        setAge({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setAge({ days, hours, minutes, seconds });
    };

    updateCounter();
    const timer = setInterval(updateCounter, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
            {age.days}
          </span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Days</span>
        </div>
        
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-gray-700 dark:text-white/80 tracking-tighter">
            {age.hours}
          </span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">H</span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-gray-700 dark:text-white/80 tracking-tighter">
            {age.minutes}
          </span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">M</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {age.seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest">Sec</span>
        </div>
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Running</span>
      </div>
    </div>
  );
};
