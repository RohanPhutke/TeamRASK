import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of the authentication context
interface AuthContextType {
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string) => void;
  logout: () => void;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType>({
  username: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

// Authentication Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem('username')
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!username);

  const login = (newUsername: string) => {
    localStorage.setItem('username', newUsername);
    setUsername(newUsername);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('username');
    setUsername(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ username, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = () => useContext(AuthContext);
