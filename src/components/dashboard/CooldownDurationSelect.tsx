import type { MouseEventHandler } from 'react';
import { COOLDOWN_OPTIONS } from '@/constants/cooldowns';
import { t } from '@/i18n';

interface CooldownDurationSelectProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLSelectElement>;
}

export function CooldownDurationSelect({
  value,
  onChange,
  disabled = false,
  className,
  onClick,
}: CooldownDurationSelectProps) {
  return (
    <select
      value={value}
      onClick={onClick}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      className={className}
      aria-label={t('Cooldown duration')}
    >
      {COOLDOWN_OPTIONS.map((option) => (
        <option key={option.valueMs} value={option.valueMs}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
