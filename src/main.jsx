import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './components/Auth.jsx';
import { App } from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 1000, // 15 segundos acorde a la especificación
      refetchOnWindowFocus: false,
    },
  },
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Límite de errores capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bone-50 flex items-center justify-center p-6 text-obsidian">
          <div className="bezel-shell max-w-lg w-full">
            <div className="bezel-core p-8 bg-white text-center space-y-4">
              <h2 className="font-serif text-2xl font-bold text-red-700">
                Se produjo un error en la aplicación
              </h2>
              <p className="text-xs text-bone-600 font-mono bg-bone-100 p-3 rounded-lg overflow-x-auto text-left">
                {this.state.error?.message || 'Error inesperado'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-obsidian text-bone-50 rounded-xl text-xs font-semibold"
              >
                Recargar Sistema
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
