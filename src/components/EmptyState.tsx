import { type ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  /** Icon component (Lucide icon) */
  icon?: LucideIcon;
  /** Emoji or custom icon element */
  emoji?: string;
  /** Title text */
  title: string;
  /** Description / subtitle */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Optional secondary content below */
  children?: ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * EmptyState — A friendly empty state with icon, message, and optional action.
 * Use this whenever a list, log, or view has no data to display.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  emoji,
  title,
  description,
  action,
  children,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`bg-gray-800 rounded-2xl p-8 sm:p-12 shadow-sm border border-gray-700 text-center animate-[fadeIn_0.3s_ease-out] ${className}`}
    >
      {/* Icon / Emoji */}
      {emoji ? (
        <span className="text-5xl block mb-4">{emoji}</span>
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-400 max-w-sm mx-auto mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-900/50 transition-all active:scale-95 text-sm"
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </button>
      )}

      {/* Extra children */}
      {children}
    </div>
  );
}
