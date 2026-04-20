import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, Receipt, LogOut, Menu, X, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authState } from '../lib/api';

interface SidebarLayoutProps {
  user: { email: string } | null;
  onLogout: () => void;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
    { to: '/bills', icon: <Receipt size={20} />, label: 'Contas a Pagar' },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col pt-6 pb-4">
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200 shrink-0">
          <TrendingUp size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">GoalFlow</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="px-4 mt-auto">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-4">
             <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-full flex items-center justify-center uppercase font-bold text-sm shrink-0">
                {user.email.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.email.split('@')[0]}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 shrink-0 border-r border-gray-100 bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile Header elements */}
      <header className="md:hidden absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <TrendingUp size={24} className="text-brand-primary" />
          <h1 className="text-lg font-bold">GoalFlow</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-gray-900/40 z-50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white z-50 shadow-2xl safe-area-leftsafe-area-top safe-area-bottom"
            >
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto w-full pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
};
