import { X, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ConfirmModalProps {
 open: boolean;
 onClose: () => void;
 onConfirm: () => void;
 icon: LucideIcon;
 iconBgColor: string;
 iconColor: string;
 title: string;
 description: string;
 confirmLabel?: string;
 confirmGradient?: string;
 cancelLabel?: string;
 loading?: boolean;
 loadingLabel?: string;
 disabled?: boolean;
 children?: ReactNode;
 customIcon?: ReactNode;
}

export default function ConfirmModal({
 open,
 onClose,
 onConfirm,
 icon: Icon,
 iconBgColor,
 iconColor,
 title,
 description,
 confirmLabel = 'Confirmar',
 confirmGradient = 'from-blue-600 to-indigo-600',
 cancelLabel = 'Cancelar',
 loading = false,
 loadingLabel,
 disabled = false,
 children,
 customIcon,
}: ConfirmModalProps) {
 if (!open) return null;

 return (
 <div
 className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
 onClick={() => !loading && onClose()}
 >
 <div
 className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-[scaleIn_0.2s_ease-out]"
 onClick={e => e.stopPropagation()}
 >
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-xl ${iconBgColor} flex items-center justify-center`}>
 {customIcon || <Icon className={`w-5 h-5 ${iconColor}`} />}
 </div>
 <div>
 <h3 className="text-lg font-bold text-white">{title}</h3>
 <p className="text-xs text-gray-400 text-gray-500">{description}</p>
 </div>
 </div>
 {!loading && (
 <button
 onClick={onClose}
 className="p-2 rounded-xl hover:bg-gray-700 transition text-gray-400 flex-shrink-0"
 >
 <X className="w-5 h-5"/>
 </button>
 )}
 </div>

 {children}

 <div className="flex gap-3">
 <button
 onClick={onClose}
 disabled={loading}
 className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 font-semibold hover:bg-gray-200 hover:bg-gray-600 disabled:opacity-50 transition-all"
 >
 {cancelLabel}
 </button>
 <button
 onClick={onConfirm}
 disabled={loading || disabled}
 className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r ${confirmGradient} text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg active:scale-[0.98]`}
 >
 {loading ? (
 <span className="animate-pulse">{loadingLabel || 'Procesando...'}</span>
 ) : (
 <><Icon className="w-4 h-4"/> {confirmLabel}</>
 )}
 </button>
 </div>
 </div>
 </div>
 );
}
