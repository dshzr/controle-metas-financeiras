/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { api, authState } from './lib/api';
import { Auth } from './components/Auth';
import { SidebarLayout } from './components/SidebarLayout';
import { Dashboard } from './pages/Dashboard';
import { Bills } from './pages/Bills';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{email: string} | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData.user);
    } catch (err) {
      console.error(err);
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('Token') || err.message.includes('Logado'))) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    const token = authState.getToken();
    if (token) {
      setIsAuthenticated(true);
      fetchData().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    fetchData();
  };

  const handleLogout = () => {
    authState.clearToken();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="/" element={<SidebarLayout user={user} onLogout={handleLogout} />}>
        <Route index element={<Dashboard onSessionExpired={handleLogout} />} />
        <Route path="bills" element={<Bills />} />
      </Route>
    </Routes>
  );
}
