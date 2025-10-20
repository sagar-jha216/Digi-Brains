import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  style?: CSSProperties;
}

const GlassCard = ({ children, className, hover = false, style }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "bg-card/60 backdrop-blur-lg border border-border rounded-lg shadow-soft transition-all",
        hover && "hover:shadow-glow hover:scale-[1.02] cursor-pointer",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlassCard;
