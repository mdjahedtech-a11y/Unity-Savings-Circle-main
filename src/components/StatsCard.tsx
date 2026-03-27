import React from 'react';
import { Card, CardContent } from './ui/Card';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color?: string;
  delay?: number;
  onClick?: () => void;
}

export const StatsCard = React.memo(({ title, value, icon: Icon, trend, color = "text-indigo-600", delay = 0, onClick }: StatsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: delay * 0.5 }}
      onClick={onClick}
      className={cn(onClick && "cursor-pointer")}
    >
      <Card className="hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 group hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
        <CardContent className="p-4 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest">{title}</p>
              <h3 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-3 tracking-tight">{value}</h3>
              {trend && (
                <p className="text-[10px] sm:text-xs text-emerald-500 font-bold mt-1 sm:mt-2 flex items-center gap-1">
                  <span className="bg-emerald-500/10 p-0.5 rounded-full">↑</span> {trend}
                </p>
              )}
            </div>
            <div className={cn("p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 group-hover:scale-110 transition-transform duration-300", color)}>
              <Icon className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
