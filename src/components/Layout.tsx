import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  Wallet,
  PieChart,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, show: true },
    { name: 'Members', path: '/members', icon: Users, show: true },
    { name: 'Reports', path: '/reports', icon: FileText, show: true },
    { name: 'My Savings', path: '/my-savings', icon: Wallet, show: true },
  ];

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-gradient-to-br dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 dark:text-white font-sans selection:bg-pink-50 selection:text-white">
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
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-white/5 backdrop-blur-lg border-b border-gray-200 dark:border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
            <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">Unity Savings Circle</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-600 dark:text-white/80">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-white/80">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-0 z-40 bg-white/95 dark:bg-black/90 pt-20 px-6"
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
                      ? "bg-pink-50 text-pink-600 dark:bg-white/20 dark:text-white shadow-sm dark:shadow-lg border border-pink-100 dark:border-white/10"
                      : "text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
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
        <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white/80 dark:bg-black/20 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 p-6 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg shadow-purple-500/30 overflow-hidden">
              <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-xl tracking-tight leading-tight text-gray-900 dark:text-white">Unity Savings Circle</span>
          </div>

          <nav className="flex-1 flex flex-col gap-2">
            {navItems.filter(item => item.show).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  location.pathname === item.path
                    ? "bg-pink-50 text-pink-600 dark:bg-gradient-to-r dark:from-white/20 dark:to-white/5 dark:text-white shadow-sm dark:shadow-lg border border-pink-100 dark:border-white/10"
                    : "text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white hover:pl-5"
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
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav - Floating & Stylish */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-2xl shadow-pink-500/10 p-1.5 flex justify-between items-center">
          {navItems.filter(item => item.show).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex-1 flex flex-col items-center justify-center py-2"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-xl shadow-lg shadow-pink-500/25"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "relative z-10 flex flex-col items-center gap-0.5 transition-colors duration-200",
                  isActive ? "text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "fill-white/20")} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <motion.span 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-[10px] font-bold tracking-wide"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
