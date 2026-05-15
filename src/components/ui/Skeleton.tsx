import React from "react"
import { cn } from "../../lib/utils"

const Skeleton = React.memo(({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-indigo-100/30 dark:bg-indigo-500/10 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-indigo-400/40 dark:before:via-indigo-300/20 before:to-transparent shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]",
        className
      )}
      {...props}
    />
  )
});

export { Skeleton }
