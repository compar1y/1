import { X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { Shape } from '../data/models';

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="animate-sheet relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper pb-safe shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 rounded-full bg-cream p-2 text-muted hover:text-ink"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'sage';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const styles = {
    primary: 'bg-terra text-white shadow-[0_4px_0_var(--color-terra-dark)] active:translate-y-0.5 active:shadow-none',
    sage: 'bg-sage-dark text-white shadow-[0_4px_0_#45523a] active:translate-y-0.5 active:shadow-none',
    secondary: 'bg-paper text-ink border border-line',
    ghost: 'text-terra',
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-paper p-4 ${className}`}>{children}</div>;
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'gold' }) {
  const t = {
    neutral: 'bg-cream text-muted',
    ok: 'bg-[#e4ecdc] text-sage-dark',
    warn: 'bg-[#f6e7c8] text-[#8a6418]',
    bad: 'bg-[#f3dcd3] text-terra-dark',
    gold: 'bg-gold text-ink',
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${t}`}>{children}</span>;
}

/** Desenho do tapete a partir das cores do modelo (substitua por fotos reais quando tiver). */
export function RugPreview({ shape, colors, className = '' }: { shape: Shape; colors: string[]; className?: string }) {
  const c = colors.length ? colors : ['#EDE3D1'];
  const rings = 6;
  if (shape === 'redondo' || shape === 'oval') {
    const rx = 46;
    const ry = shape === 'oval' ? 32 : 46;
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        {Array.from({ length: rings }).map((_, i) => {
          const k = 1 - i / rings;
          return <ellipse key={i} cx="50" cy="50" rx={rx * k} ry={ry * k} fill={c[i % c.length]} stroke="#0001" strokeWidth=".4" />;
        })}
      </svg>
    );
  }
  if (shape === 'quadrado') {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        {Array.from({ length: rings }).map((_, i) => {
          const s = 92 * (1 - i / rings);
          return <rect key={i} x={50 - s / 2} y={50 - s / 2} width={s} height={s} rx="3" fill={c[i % c.length]} stroke="#0001" strokeWidth=".4" />;
        })}
      </svg>
    );
  }
  const stripes = 9;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <rect x="4" y="18" width="92" height="64" rx="4" fill={c[0]} />
      {Array.from({ length: stripes }).map((_, i) =>
        i % 2 ? <rect key={i} x="4" y={18 + (64 / stripes) * i} width="92" height={64 / stripes} fill={c[(Math.floor(i / 2) % (c.length - 1 || 1)) + (c.length > 1 ? 1 : 0)]} /> : null
      )}
      <rect x="4" y="18" width="92" height="64" rx="4" fill="none" stroke="#0002" strokeWidth=".6" />
    </svg>
  );
}

export function useCountdown(endsAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  const left = endsAt ? Math.max(0, endsAt - now) : 0;
  const mm = String(Math.floor(left / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  return { left, label: `${mm}:${ss}` };
}
