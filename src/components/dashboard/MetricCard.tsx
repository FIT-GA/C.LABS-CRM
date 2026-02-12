import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  variant?: "default" | "primary";
}

export function MetricCard({ title, value, icon, variant = "default" }: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-5 rounded-xl border transition-all duration-300 card-glow-hover",
        variant === "primary" 
          ? "bg-card border-primary/35" 
          : "bg-card border-border"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-xl",
          variant === "primary"
            ? "bg-primary/20 text-primary"
            : "bg-primary/10 text-primary"
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
