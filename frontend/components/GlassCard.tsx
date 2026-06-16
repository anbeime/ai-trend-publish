import React, { useState, useRef } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverEffect = false,
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onClick={onClick}
      style={{
        '--mouse-x': `${position.x}px`,
        '--mouse-y': `${position.y}px`,
        '--spotlight-opacity': opacity,
      } as React.CSSProperties}
      className={`
        relative overflow-hidden rounded-2xl border border-white/10
        bg-black/20 backdrop-blur-xl
        transition-all duration-500
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${hoverEffect ? 'active:scale-[0.98]' : ''}
        ${className}
      `}
    >
      {/* 1. Background Gradient Glow (Subtle) */}
      <div 
        className="pointer-events-none absolute -inset-px transition-opacity duration-500 opacity-[var(--spotlight-opacity)]"
        style={{
          background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />
      
      {/* 2. Border Glow (High Contrast) */}
      <div 
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-[var(--spotlight-opacity)] transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(34,211,238,0.4), transparent 40%)`,
          maskImage: `linear-gradient(black, black) content-box, linear-gradient(black, black)`,
          WebkitMaskImage: `linear-gradient(black, black) content-box, linear-gradient(black, black)`,
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />

      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};
