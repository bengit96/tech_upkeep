import { Package, Wrench } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'monospace' | 'minimal';
  className?: string;
  showIcon?: boolean;
}

const sizeConfig = {
  sm: {
    icon: 'h-5 w-5',
    wrench: 'h-3 w-3',
    text: 'text-xl',
    gap: 'gap-2',
  },
  md: {
    icon: 'h-7 w-7',
    wrench: 'h-4 w-4',
    text: 'text-2xl',
    gap: 'gap-3',
  },
  lg: {
    icon: 'h-9 w-9',
    wrench: 'h-5 w-5',
    text: 'text-3xl md:text-4xl',
    gap: 'gap-4',
  },
  xl: {
    icon: 'h-12 w-12',
    wrench: 'h-6 w-6',
    text: 'text-4xl md:text-5xl',
    gap: 'gap-5',
  },
};

export default function Logo({
  size = 'md',
  variant = 'default',
  className = '',
  showIcon = true
}: LogoProps) {
  const config = sizeConfig[size];

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center ${config.gap} ${className}`}>
        <span className={`${config.text} font-semibold font-[family-name:var(--font-jetbrains)]`}>
          <span className="text-yellow-300">{APP_NAME}</span>
          <span className="text-yellow-400">()</span>
        </span>
      </div>
    );
  }

  if (variant === 'monospace') {
    return (
      <div className={`flex items-center justify-center ${config.gap} ${className}`}>
        {showIcon && (
          <div className="relative flex-shrink-0">
            <Package className={`${config.icon} text-blue-500`} strokeWidth={2.5} />
            <Wrench
              className={`${config.wrench} text-purple-500 absolute -bottom-0.5 -right-0.5`}
              strokeWidth={2.5}
            />
          </div>
        )}
        <h1 className={`${config.text} font-semibold font-[family-name:var(--font-jetbrains)]`}>
          <span className="text-yellow-300">{APP_NAME}</span>
          <span className="text-yellow-400">()</span>
        </h1>
      </div>
    );
  }

  // default variant
  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {showIcon && (
        <div className="relative flex-shrink-0">
          <Package className={`${config.icon} text-blue-500`} strokeWidth={2.5} />
          <Wrench
            className={`${config.wrench} text-purple-500 absolute -bottom-0.5 -right-0.5`}
            strokeWidth={2.5}
          />
        </div>
      )}
      <h1 className={`${config.text} font-semibold font-[family-name:var(--font-jetbrains)]`}>
        <span className="text-yellow-300">{APP_NAME}</span>
        <span className="text-yellow-400">()</span>
      </h1>
    </div>
  );
}
