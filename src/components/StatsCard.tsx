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

export function StatsCard({ title, value, icon: Icon, trend, color = "text-white", delay = 0, onClick }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: delay * 0.5 }}
      onClick={onClick}
      className={cn(onClick && "cursor-pointer")}
    >
      <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors group shadow-sm dark:shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-white/60">{title}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2 tracking-tight">{value}</h3>
              {trend && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <span>↑</span> {trend}
                </p>
              )}
            </div>
            <div className={cn("p-3 rounded-xl bg-gray-100 dark:bg-white/5 group-hover:scale-110 transition-transform", color)}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
