import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  LogOut, 
  Wallet,
  PieChart,
  StickyNote,
  MessageSquare,
  Sun,
  Moon,
  Settings as SettingsIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';

export default function Layout({ children }: { children: React.ReactNode }) {
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
    // Only active on main pages to prevent interfering with deep navigation
    const mainPaths = ['/', '/members', '/reports', '/my-savings'];
    if (!mainPaths.includes(location.pathname)) return;

    // Push state to intercept back button
    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = (e: PopStateEvent) => {
      // Prevent default back navigation
      e.preventDefault();
      
      // If we are on a main page, we intercept
      if (mainPaths.includes(location.pathname)) {
        const now = Date.now();
        
        // Always push state back so we stay on the page
        window.history.pushState(null, '', window.location.pathname);

        if (now - lastBackPress.current < 2000) {
          // Second press within 2 seconds
          setShowExitModal(true);
        } else {
          // First press
          toast("Press back again to exit app");
          lastBackPress.current = now;
        }
      } else {
        // Allow normal back navigation for other pages (if any)
        navigate(-1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, navigate]);

  const confirmExit = () => {
    window.close();
    // Fallback if window.close() is blocked
    if (!window.closed) {
      toast.error("Browser prevented closing. Please close the tab manually.");
    }
    setShowExitModal(false);
  };

  const navItems = [
    { name: 'Members', path: '/members', icon: Users, key: 'always_visible', color: 'from-emerald-500 to-teal-400' },
    { name: 'Reports', path: '/reports', icon: FileText, key: 'show_reports', color: 'from-amber-500 to-orange-400' },
    { name: 'Investments', path: '/investments', icon: StickyNote, key: 'show_investments', color: 'from-purple-500 to-indigo-400' },
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, key: 'show_dashboard', color: 'from-blue-500 to-cyan-400' },
    { name: 'Discussion', path: '/discussion', icon: MessageSquare, key: 'show_discussion', color: 'from-pink-500 to-rose-400' },
    { name: 'My Savings', path: '/my-savings', icon: Wallet, key: 'show_savings', color: 'from-indigo-500 to-blue-400' },
    ...(isAdmin ? [{ name: 'Settings', path: '/settings', icon: SettingsIcon, key: 'admin_only', color: 'from-gray-600 to-gray-400' }] : []),
  ].filter(item => {
    if (isAdmin) return true;
    if (item.key === 'always_visible') return true;
    if (item.key === 'admin_only') return false;
    return (systemSettings as any)?.[item.key] !== false;
  });

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-[#0f172a] dark:text-white font-sans selection:bg-pink-50 selection:text-white">
      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-white/10"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Exit App?</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to close the application?</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowExitModal(false)}>
                  No, Stay
                </Button>
                <Button variant="danger" onClick={confirmExit}>
                  Yes, Exit
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm border border-gray-100 dark:border-white/10">
            <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">Unity Savings Circle</span>
            <span className="text-[10px] text-gray-500 dark:text-white/40 font-medium -mt-1">Made by Jahed Hasan</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-600 dark:text-white/80 h-9 w-9">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-red-500 hover:text-red-600 h-9 w-9">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-gray-900/50 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 p-6 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg shadow-purple-500/30 overflow-hidden border border-gray-100 dark:border-white/10">
              <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-tight text-gray-900 dark:text-white">Unity Savings Circle</span>
              <span className="text-xs text-gray-500 dark:text-white/40 font-medium">Made by Jahed Hasan</span>
            </div>
          </div>

          <nav className="flex-1 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  location.pathname === item.path
                    ? "bg-pink-50 text-pink-600 dark:bg-white/10 dark:text-white shadow-sm border border-pink-100 dark:border-white/10"
                    : "text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white hover:pl-5"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  location.pathname === item.path ? "text-pink-600 dark:text-pink-400" : "text-gray-400 dark:text-white/60 group-hover:text-gray-600 dark:group-hover:text-white"
                )} />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="pt-6 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-4 px-2">
               <span className="text-sm font-medium text-gray-500 dark:text-white/50">Theme</span>
               <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-8 w-8 p-0 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white">
                 {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
               </Button>
            </div>
            <div className="flex items-center gap-3 px-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate w-32">{user?.email}</span>
                <span className="text-xs text-gray-500 dark:text-white/50 capitalize">{isAdmin ? 'Admin' : 'Member'}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden pb-28 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav - Clean & Simple Design */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center h-full relative group"
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300 flex flex-col items-center gap-1",
                  isActive ? "text-pink-600 dark:text-pink-400" : "text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60"
                )}>
                  <item.icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                </div>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-pink-600 dark:bg-pink-400"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
