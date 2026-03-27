import React from "react"
import { cn } from "../../lib/utils"

const Skeleton = React.memo(({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-white/10", className)}
      {...props}
    />
  )
});

export { Skeleton }
