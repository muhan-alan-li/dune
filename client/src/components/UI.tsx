import type React from 'react';
import type { ReactNode } from 'react';

export function Button({ children, onClick, disabled = false, type = 'button', variant = 'primary' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; variant?: 'primary' | 'quiet' | 'danger' }): React.ReactElement {
  return <button className={`button ${variant}`} type={type} onClick={onClick} disabled={disabled}>{children}</button>;
}
export function Panel({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }): React.ReactElement { return <section className={`panel ${className}`}>{title && <h2>{title}</h2>}{children}</section>; }
export function StatusPill({ children, good = false }: { children: ReactNode; good?: boolean }): React.ReactElement { return <span className={`pill ${good ? 'good' : ''}`}>{children}</span>; }
export function HelpPopover({ label, children }: { label: string; children: ReactNode }): React.ReactElement { return <span className="help" title={String(children)} aria-label={label}>?</span>; }
export function Loading({ text = 'Loading…' }: { text?: string }): React.ReactElement { return <p className="muted" role="status">{text}</p>; }
