import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

const DEFAULT_USERS = {
  operario: {
    id: 'usr-operario-01',
    nombre: 'Javier Domínguez',
    email: 'operador@olivicolalujan.com.ar',
    rol: 'Operario',
    badge: 'Planta Luján',
  },
  admin: {
    id: 'usr-admin-01',
    nombre: 'Valeria Rivas',
    email: 'administracion@olivicolalujan.com.ar',
    rol: 'Administrador',
    badge: 'Gerencia de Operaciones',
  },
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('olivicola-lujan-user-session');
      return saved ? JSON.parse(saved) : DEFAULT_USERS.operario;
    } catch {
      return DEFAULT_USERS.operario;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem('olivicola-lujan-user-session', JSON.stringify(currentUser));
    } catch (e) {
      console.warn(e);
    }
  }, [currentUser]);

  const switchRole = (roleKey) => {
    if (DEFAULT_USERS[roleKey]) {
      setCurrentUser(DEFAULT_USERS[roleKey]);
      setIsAuthenticated(true);
    }
  };

  const login = (roleKey = 'operario') => {
    setCurrentUser(DEFAULT_USERS[roleKey] || DEFAULT_USERS.operario);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        role: currentUser.rol,
        isAuthenticated,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
