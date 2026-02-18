import React from "react";
import { cn } from "@/lib/utils";

type ProgressRingProps = {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  variant?: "primary" | "secondary" | "success";
  children?: React.ReactNode;
  className?: string;
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  children,
  variant = "primary",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.max(0, Math.min(100, progress ?? 0));
  const offset = circumference - (clamped / 100) * circumference;

  const colorMap: Record<NonNullable<ProgressRingProps["variant"]>, string> = {
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--secondary))",
    success: "hsl(var(--success, var(--primary)))",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={strokeWidth}
          strokeOpacity={0.18}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={colorMap[variant] || colorMap.primary}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
};
