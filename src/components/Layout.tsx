import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  Wallet,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, show: true },
    { name: 'Members', path: '/members', icon: Users, show: true },
    { name: 'Reports', path: '/reports', icon: FileText, show: isAdmin },
    { name: 'My Savings', path: '/my-savings', icon: Wallet, show: !isAdmin },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white font-sans selection:bg-pink-500 selection:text-white">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center">
            <PieChart className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Unity Savings Circle</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/90 pt-20 px-6"
          >
            <div className="flex flex-col gap-4">
              {navItems.filter(item => item.show).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl transition-all",
                    location.pathname === item.path
                      ? "bg-white/20 text-white shadow-lg border border-white/10"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-lg">{item.name}</span>
                </Link>
              ))}
              <Button 
                variant="danger" 
                className="mt-8 w-full justify-start gap-3 p-4"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-black/20 backdrop-blur-xl border-r border-white/10 p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Unity Savings Circle</span>
          </div>

          <nav className="flex-1 flex flex-col gap-2">
            {navItems.filter(item => item.show).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-white/20 to-white/5 text-white shadow-lg border border-white/10"
                    : "text-white/60 hover:bg-white/10 hover:text-white hover:pl-5"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  location.pathname === item.path ? "text-pink-400" : "text-white/60 group-hover:text-white"
                )} />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white truncate w-32">{user?.email}</span>
                <span className="text-xs text-white/50 capitalize">{isAdmin ? 'Admin' : 'Member'}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 pb-6 z-40">
        <div className="flex justify-around items-center">
          {navItems.filter(item => item.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                location.pathname === item.path
                  ? "text-pink-400"
                  : "text-white/50 hover:text-white"
              )}
            >
              <item.icon className={cn("w-6 h-6", location.pathname === item.path && "fill-current/20")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
