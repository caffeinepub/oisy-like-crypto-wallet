import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  raised?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ children, className, style, raised = false, hover = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        raised ? 'glass-card-raised' : 'glass-card',
        hover && 'cursor-pointer transition-all duration-200 hover:border-teal/30 hover:-translate-y-0.5 hover:shadow-card-hover',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
