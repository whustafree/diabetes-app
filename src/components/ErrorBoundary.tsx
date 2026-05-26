import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Error capturado:', error);
    console.error('[ErrorBoundary] Stack del componente:', errorInfo.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
          <div className="max-w-md w-full">
            {/* Icono */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-200 dark:shadow-red-900/50">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>

            {/* Título */}
            <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white text-center mb-2">
              Algo salió mal
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
              La aplicación encontró un error inesperado. No te preocupes, tus datos están seguros.
            </p>

            {/* Detalle del error */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Detalle del error
              </p>
              <p className="text-sm font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                {this.state.error?.message || 'Error desconocido'}
              </p>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/50"
              >
                <Home className="w-4 h-4" />
                Recargar página
              </button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8">
              Si el error persiste, intenta cerrar sesión y volver a iniciarla.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
