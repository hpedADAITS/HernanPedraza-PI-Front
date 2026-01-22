import React, { ReactNode, ButtonHTMLAttributes } from 'react';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  delay?: number;
}

export function AnimatedButton({
  children,
  delay = 0,
  className = '',
  ...props
}: AnimatedButtonProps) {
  return (
    <button
      className={`animate-fade-in-up ${className}`}
      style={{
        animation: `fadeInUp 0.5s ease-out ${delay}s both`,
      }}
      {...props}
    >
      {children}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </button>
  );
}
