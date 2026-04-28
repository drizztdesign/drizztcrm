import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-bg-3 animate-pulse rounded", className)} />;
}
