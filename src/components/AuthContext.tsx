// components/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  username: null,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  logout: () => {},
});


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('username'));


  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/login`, { username, password });
      console.log(response);
      if (response.data.success) {
        localStorage.setItem('username', username);
        localStorage.setItem('token', response.data.access_token);
        setUsername(username);
        setIsAuthenticated(true);
        console.log('Login successful, updating context...');
        return true;
      }
      
    } catch (error) {
      console.error('Login failed', error);
    }
    return false;
  };

  const register = async (username: string, password: string) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/register`, { username, password });
      if (response.data.success) {
        localStorage.setItem('username', username);
        localStorage.setItem('token', response.data.access_token);
        setUsername(username);
        setIsAuthenticated(true);
        console.log('Login successful, updating context...');
        return true;
      }
    } catch (error) {
      console.error('Registration failed', error);
      return false;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    setUsername(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ username, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);