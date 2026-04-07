import { createContext, useContext, useState, useEffect } from 'react';
import { verifyApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if a valid session exists via cookie
  useEffect(() => {
    const storedToken = sessionStorage.getItem('booky_token');
    if (storedToken) {
      verifyApi(storedToken)
        .then((res) => {
          setToken(storedToken);
          setUser(res.data.user);
        })
        .catch(() => {
          sessionStorage.removeItem('booky_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    sessionStorage.setItem('booky_token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('booky_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
