import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Home,
  Calendar,
  Plus,
  Bell,
  User,
  Settings as SettingsIcon,
  LogOut,
  Sun,
  Moon,
  Users,
  FileText,
  StickyNote,
  MessageSquare,
  Wallet,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';

export default function Layout({ children, showSidebar = true }: { children: React.ReactNode, showSidebar?: boolean }) {
  const { user, isAdmin, signOut, systemSettings } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);
  const lastBackPress = useRef<number>(0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Double back to exit logic
  useEffect(() => {
    if (!showSidebar) return;
    const mainPaths = ['/', '/members', '/reports', '/my-savings'];
    if (!mainPaths.includes(location.pathname)) return;

    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (mainPaths.includes(location.pathname)) {
        const now = Date.now();
        window.history.pushState(null, '', window.location.pathname);
        if (now - lastBackPress.current < 2000) {
          setShowExitModal(true);
        } else {
          toast("Press back again to exit app");
          lastBackPress.current = now;
        }
      } else {
        navigate(-1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, navigate, showSidebar]);

  const confirmExit = () => {
    window.close();
    if (!window.closed) {
      toast.error("Browser prevented closing. Please close the tab manually.");
    }
    setShowExitModal(false);
  };

  const navItems = React.useMemo(() => [
    { name: 'Reports', path: '/reports', icon: Calendar, key: 'show_reports' },
    { name: 'Members', path: '/members', icon: Users, key: 'always_visible' },
    { name: 'Dashboard', path: '/', icon: Home, key: 'show_dashboard', isCenter: true },
    { name: 'Discussion', path: '/discussion', icon: Bell, key: 'show_discussion' },
    { name: 'My Savings', path: '/my-savings', icon: User, key: 'show_savings' },
  ].filter(item => {
    if (item.key === 'always_visible') return true;
    return (systemSettings as any)?.[item.key] !== false;
  }), [systemSettings]);

  // Desktop sidebar items (more comprehensive)
  const desktopNavItems = React.useMemo(() => [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, key: 'show_dashboard' },
    { name: 'Members', path: '/members', icon: Users, key: 'always_visible' },
    { name: 'Reports', path: '/reports', icon: FileText, key: 'show_reports' },
    { name: 'Investments', path: '/investments', icon: StickyNote, key: 'show_investments' },
    { name: 'Discussion', path: '/discussion', icon: MessageSquare, key: 'show_discussion' },
    { name: 'My Savings', path: '/my-savings', icon: Wallet, key: 'show_savings' },
    ...(isAdmin ? [{ name: 'Settings', path: '/settings', icon: SettingsIcon, key: 'admin_only' }] : []),
  ].filter(item => {
    if (isAdmin) return true;
    if (item.key === 'always_visible') return true;
    if (item.key === 'admin_only') return false;
    return (systemSettings as any)?.[item.key] !== false;
  }), [isAdmin, systemSettings]);

  return (
    <div className="min-h-screen transition-colors duration-300 text-gray-900 dark:text-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-white/10"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Exit App?</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Are you sure you want to close the application?</p>
              <div className="flex gap-4 justify-end">
                <Button variant="ghost" onClick={() => setShowExitModal(false)} className="rounded-xl">
                  No, Stay
                </Button>
                <Button variant="danger" onClick={confirmExit} className="rounded-xl px-8">
                  Yes, Exit
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      {showSidebar && (
        <div className="lg:hidden flex items-center justify-between py-3 px-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-500/10 border border-white/20">
              <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base sm:text-lg tracking-tight text-gray-900 dark:text-white whitespace-nowrap">Unity Savings Circle</span>
              <span className="text-[8px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest -mt-1 whitespace-nowrap">Made by Jahed Hasan</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="text-gray-600 dark:text-white/80 h-9 w-9 bg-white/50 dark:bg-white/5 rounded-xl">
                <SettingsIcon className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-600 dark:text-white/80 h-9 w-9 bg-white/50 dark:bg-white/5 rounded-xl">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-red-500 dark:text-red-400 h-9 w-9 bg-white/50 dark:bg-white/5 rounded-xl">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg border-r border-white/20 dark:border-white/10 p-8 transition-colors duration-300">
            <div className="flex items-center gap-4 mb-12 px-2">
              <div className="w-14 h-14 rounded-[1.25rem] bg-white flex items-center justify-center shadow-xl shadow-indigo-500/20 overflow-hidden border border-white/20">
                <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xl xl:text-2xl tracking-tight leading-tight text-gray-900 dark:text-white whitespace-nowrap">Unity Savings Circle</span>
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest whitespace-nowrap">Made by Jahed Hasan</span>
              </div>
            </div>

            <nav className="flex-1 flex flex-col gap-3">
              {desktopNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group",
                    location.pathname === item.path
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40"
                      : "text-gray-500 dark:text-white/60 hover:bg-white dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white hover:shadow-md"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                    location.pathname === item.path ? "text-white" : "text-gray-400 dark:text-white/40 group-hover:text-indigo-600 dark:group-hover:text-white"
                  )} />
                  <span className="font-semibold tracking-wide">{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="pt-8 border-t border-white/20 dark:border-white/10">
              <div className="flex items-center justify-between mb-6 px-2">
                 <span className="text-sm font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest">Theme</span>
                 <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-10 w-10 p-0 rounded-xl bg-white dark:bg-white/5 shadow-sm text-gray-600 dark:text-white">
                   {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                 </Button>
              </div>
              <div className="flex items-center gap-4 px-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate w-36">{user?.email?.split('@')[0]}</span>
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest">{isAdmin ? 'Administrator' : 'Member'}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-4 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl px-5 py-4"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Sign Out</span>
              </Button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 p-6 lg:p-12 overflow-x-hidden",
          showSidebar ? "pb-32 lg:pb-12" : "pb-12"
        )}>
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {showSidebar && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/5 z-50 px-2 pb-safe pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-end justify-around h-14 relative">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              if (item.isCenter) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative -top-6 flex flex-col items-center group"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90",
                      "bg-indigo-600 text-white shadow-indigo-500/40 border-4 border-white dark:border-gray-900"
                    )}>
                      <item.icon className="w-7 h-7" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold mt-1 transition-colors",
                      isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-white/30"
                    )}>
                      {item.name}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex-1 flex flex-col items-center justify-center h-full group"
                >
                  <div className={cn(
                    "p-1 transition-all duration-300",
                    isActive ? "text-indigo-600 dark:text-indigo-400 scale-110" : "text-gray-400 dark:text-white/30"
                  )}>
                    <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium mt-0.5 transition-colors text-center leading-tight px-1",
                    isActive ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-gray-400 dark:text-white/30"
                  )}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
