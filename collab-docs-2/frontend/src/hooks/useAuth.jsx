import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getMe } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUsername = localStorage.getItem('cd_username');
    if (savedUsername) {
      getMe()
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.removeItem('cd_username'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username) => {
    const { data } = await apiLogin(username);
    localStorage.setItem('cd_username', data.user.username);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('cd_username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
