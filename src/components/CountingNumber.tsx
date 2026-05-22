import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

interface CountingNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  className?: string;
}

export const CountingNumber: React.FC<CountingNumberProps> = ({ 
  value, 
  duration = 10, 
  prefix = '', 
  className 
}) => {
  const count = useMotionValue(1);
  const rounded = useTransform(count, (latest) => {
    // Format with commas: ৳1,234,567
    return prefix + Math.round(latest).toLocaleString();
  });

  useEffect(() => {
    const controls = animate(count, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // Custom smooth ease-out (Quartic)
    });

    return () => controls.stop();
  }, [value, duration, count]);

  return (
    <motion.h3 className={className}>
      {rounded}
    </motion.h3>
  );
};
