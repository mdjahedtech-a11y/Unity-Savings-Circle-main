import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Member, SystemSettings } from '../types/index';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  member: Member | null;
  systemSettings: SystemSettings | null;
  loading: boolean;
  
  // Global Cache
  cache: {
    dashboard: { stats: any; members: any[]; allPayments: any[]; recentPayments: any[] } | null;
    membersList: { members: any[]; monthlyPayments: string[] } | null;
    discussion: { posts: any[] } | null;
    mySavings: { payments: any[] } | null;
    reports: { data: any[]; allTimeTotal: number; month: string; year: string } | null;
    lastUpdated: { [key: string]: number };
  };
  setCache: (key: string, data: any) => void;
  prefetchAllData: (member: Member) => Promise<void>;
  
  dashboardLoaded: boolean;
  setDashboardLoaded: (loaded: boolean) => void;
  isAdmin: boolean;
  isMainAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  member: null,
  systemSettings: null,
  loading: true,
  cache: { dashboard: null, membersList: null, discussion: null, mySavings: null, reports: null, lastUpdated: {} },
  setCache: () => {},
  prefetchAllData: async () => {},
  dashboardLoaded: false,
  setDashboardLoaded: () => {},
  isAdmin: false,
  isMainAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateSettings: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [cache, setCacheState] = useState<any>({
    dashboard: null,
    membersList: null,
    discussion: null,
    mySavings: null,
    reports: null,
    lastUpdated: {}
  });
  const fetchingProfileFor = React.useRef<string | null>(null);

  const setCache = (key: string, data: any) => {
    setCacheState((prev: any) => ({
      ...prev,
      [key]: data,
      lastUpdated: { ...prev.lastUpdated, [key]: Date.now() }
    }));
  };

  const prefetchAllData = async (memberData: Member) => {
    // Only prefetch if we haven't fetched in the last 2 minutes
    const lastFetch = cache.lastUpdated.all || 0;
    if (Date.now() - lastFetch < 120000) return;

    console.log('Starting background prefetch of all data...');
    
    try {
      // 1. Prefetch Dashboard Data
      const dashPromise = Promise.all([
        supabase.from('members').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('payments')
          .select(`id, month, year, payment_date, total_amount, member_id, members (name, photo_url)`)
          .order('payment_date', { ascending: false })
          .limit(10)
      ]).then(([membersRes, allPaymentsRes, recentRes]) => {
        if (!membersRes.error && !allPaymentsRes.error && !recentRes.error) {
          setCache('dashboard', {
            members: membersRes.data,
            allPayments: allPaymentsRes.data,
            recentPayments: recentRes.data
          });
          
          // Optimization: Populate membersList cache from this same data
          const membersWithSavings = (membersRes.data || []).map(m => {
            const savings = (allPaymentsRes.data || [])
              .filter(p => p.member_id === m.id && p.payment_status === 'paid')
              .reduce((sum, p) => sum + (p.total_amount || 0), 0);
            return { ...m, total_savings: savings };
          });

          // Assume current month for membersList monthlyPayments pre-fill
          const currentMonth = new Date().toLocaleString('default', { month: 'long' });
          const currentYear = new Date().getFullYear();
          const paidMemberIds = (allPaymentsRes.data || [])
            .filter(p => p.month === currentMonth && p.year === currentYear && p.payment_status === 'paid')
            .map(p => p.member_id);

          setCache('membersList', {
            members: membersWithSavings,
            monthlyPayments: paidMemberIds
          });
        }
      });

      // 2. Prefetch Discussion Data
      const discPromise = supabase
        .from('posts')
        .select(`
          id, member_id, content, created_at,
          members(id, name, role),
          comments(id, post_id, member_id, content, created_at, members(id, name, role)),
          post_likes(id, post_id, member_id)
        `)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            const formattedData = data.map((post: any) => ({
              ...post,
              likes: post.post_likes.length,
              hasLiked: post.post_likes.some((l: any) => l.member_id === memberData.id)
            }));
            setCache('discussion', { posts: formattedData });
          }
        });

      // 3. Prefetch My Savings
      const savePromise = supabase
        .from('payments')
        .select('id, month, year, total_amount, penalty, payment_date, payment_method, payment_status, created_at')
        .eq('member_id', memberData.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setCache('mySavings', { payments: data });
          }
        });

      // 4. Prefetch Reports Data (Current Month)
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();
      
      const reportPromise = Promise.all([
        supabase.from('members').select('*').order('name'),
        supabase.from('payments').select('*').eq('month', currentMonth).eq('year', currentYear),
        supabase.from('payments').select('total_amount').eq('payment_status', 'paid')
      ]).then(([membersRes, paymentsRes, allTotalRes]) => {
        if (!membersRes.error && !paymentsRes.error) {
          const members = membersRes.data || [];
          const payments = paymentsRes.data || [];
          const allTimeTotal = (allTotalRes.data || []).reduce((sum, p) => sum + (p.total_amount || 0), 0);
          
          const paymentMap = new Map();
          payments.forEach(p => paymentMap.set(p.member_id, p));

          const reportData = members.map(m => {
            const p = paymentMap.get(m.id);
            return {
              ...m,
              paymentStatus: p ? p.payment_status : 'unpaid',
              paymentMethod: p ? p.payment_method : '-',
              amountPaid: p ? p.total_amount : 0,
              penalty: p ? p.penalty : 0,
              expectedAmount: m.share_count * 1000
            };
          });

          setCache('reports', { 
            data: reportData, 
            allTimeTotal, 
            month: currentMonth, 
            year: currentYear.toString() 
          });
        }
      });

      await Promise.all([dashPromise, discPromise, savePromise, reportPromise]);
      setCache('all', { timestamp: Date.now() });
      console.log('Background prefetch completed successfully');
    } catch (err) {
      console.error('Background prefetch failed:', err);
    }
  };

  useEffect(() => {
    // Safety timeout to ensure the app opens even if initialization hangs
    const safetyTimer = setTimeout(() => {
      console.warn('Auth initialization safety timer fired. Setting loading to false.');
      setLoading(false);
    }, 20000);

    const initializeAuth = async () => {
      const startTime = Date.now();
      
      console.log('Auth initialization started...');

      const finish = () => {
        console.log('Auth initialization finished, setting loading to false.');
        clearTimeout(safetyTimer);
        setLoading(false);
      };

      try {
        // Use a race for the entire initialization process
        await Promise.race([
          (async () => {
            // 1. Fetch system settings (non-blocking)
            fetchSystemSettings().catch(err => console.warn('Settings fetch failed:', err));

            // 2. Get current session with internal timeout
            const sessionPromise = supabase.auth.getSession();
            const sessionResult = await Promise.race([
              sessionPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Session fetch timeout')), 15000))
            ]) as any;

            const initialSession = sessionResult?.data?.session;
            console.log('Initial session fetched:', !!initialSession);
            
            setSession(initialSession || null);
            setUser(initialSession?.user ?? null);

            if (initialSession?.user) {
              console.log('Fetching member profile for user:', initialSession.user.id);
              await fetchMemberProfile(initialSession.user.id, initialSession.user.email).catch(err => {
                console.error('Profile fetch failed:', err);
              });
            }
          })(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Global init timeout')), 25000))
        ]).catch(err => {
          console.warn('Auth initialization timed out or partially failed:', err.message);
        });
      } catch (error) {
        console.error('Auth initialization unexpected error:', error);
      } finally {
        finish();
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth state change event:', event);
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // If we have a user but no member profile, or if the user changed, fetch profile
        // Only fetch if not already fetching for this user
        if (fetchingProfileFor.current !== currentSession.user.id) {
          fetchMemberProfile(currentSession.user.id, currentSession.user.email).catch(err => {
            console.error('Profile fetch failed in auth change:', err);
          });
        }
      } else {
        setMember(null);
        // Only set loading to false if we're not initializing
        // (initializeAuth handles the initial loading state)
        if (event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchMemberProfile = async (userId: string, userEmail?: string) => {
    if (fetchingProfileFor.current === userId) return;
    fetchingProfileFor.current = userId;

    try {
      console.log('Fetching profile for:', userId);
      
      // 1. Try to find by auth_user_id
      let { data, error } = await supabase
        .from('members')
        .select('id, auth_user_id, name, phone, password, photo_url, share_count, role, created_at, father_mother_name, agreement_accepted, agreement_date, signature_data, passport_photo_url')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching member profile by ID:', error);
      }

      // 2. If not found by ID, try to find by phone extracted from email
      if (!data && userEmail) {
        const phoneFromEmail = userEmail.split('@')[0]?.split('_')[0];
        
        // Special Case: Main Admin Email
        const isAdminEmail = userEmail === 'mdjahedtech@gmail.com';
        
        const variations = [
          phoneFromEmail,
          phoneFromEmail.startsWith('0') ? phoneFromEmail.substring(1) : '0' + phoneFromEmail,
          phoneFromEmail.startsWith('88') ? phoneFromEmail.substring(2) : '88' + phoneFromEmail,
          phoneFromEmail.startsWith('880') ? phoneFromEmail.substring(3) : null,
          isAdminEmail ? '01580824066' : null, // Specifically look for Jahed's phone if it's his email
        ].filter(Boolean) as string[];

        const { data: phoneData, error: phoneError } = await supabase
          .from('members')
          .select('id, auth_user_id, name, phone, password, photo_url, share_count, role, created_at, father_mother_name, agreement_accepted, agreement_date, signature_data, passport_photo_url')
          .in('phone', variations)
          .limit(1)
          .maybeSingle();
          
          if (!phoneError && phoneData) {
            data = phoneData;
            // Link the auth_user_id if it's not set OR if it's the admin forced link
            if (!data.auth_user_id || (isAdminEmail && data.auth_user_id !== userId)) {
              console.log('Linking/Re-linking auth_user_id for member:', data.id);
              const { error: linkError } = await supabase
                .from('members')
                .update({ auth_user_id: userId })
                .eq('id', data.id);
              
              if (linkError) {
                console.error('Failed to link auth_user_id:', linkError);
              } else {
                console.log('Successfully linked auth_user_id');
                // Only show toast if it was a change
                if (data.auth_user_id !== userId) {
                  // @ts-ignore - sonner toast
                  import('sonner').then(({ toast }) => {
                    toast.success('Admin account auto-linked successfully!');
                  });
                }
                data.auth_user_id = userId;
              }
            }
          }
        }

      if (data) {
        console.log('Profile found:', data.name);
        setMember(data);
        // Start background prefetch
        prefetchAllData(data);
      } else {
        console.log('No profile found for user.');
        setMember(null);
      }
    } catch (err) {
      console.error('Unexpected error in fetchMemberProfile:', err);
    } finally {
      fetchingProfileFor.current = null;
    }
  };

  const fetchSystemSettings = async (retryCount = 0) => {
    try {
      const fetchPromise = supabase
        .from('app_settings')
        .select('id, show_dashboard, show_reports, show_investments, show_discussion, show_savings')
        .maybeSingle();

      const { data, error } = await Promise.race([
        fetchPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Settings fetch timeout')), 10000))
      ]) as any;

      if (error) {
        if (retryCount < 1) {
          console.warn(`Settings fetch failed (attempt ${retryCount + 1}), retrying...`);
          return fetchSystemSettings(retryCount + 1);
        }
        console.error('Error fetching system settings:', error);
        // Fallback to defaults
        setSystemSettings({
          id: 'default',
          show_dashboard: true,
          show_reports: true,
          show_investments: true,
          show_discussion: true,
          show_savings: true
        });
        return;
      }

      if (data) {
        setSystemSettings(data);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          show_dashboard: true,
          show_reports: true,
          show_investments: true,
          show_discussion: true,
          show_savings: true
        };
        
        // Don't wait too long for the insert either
        try {
          const { data: newData, error: insertError } = await Promise.race([
            supabase.from('app_settings').insert(defaultSettings).select().maybeSingle(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Insert timeout')), 5000))
          ]) as any;
          
          if (!insertError && newData) {
            setSystemSettings(newData);
          } else {
            console.warn('Failed to insert default settings, using temporary defaults');
            setSystemSettings({ id: 'temp', ...defaultSettings });
          }
        } catch (e) {
          console.warn('Timeout inserting default settings, using temporary defaults');
          setSystemSettings({ id: 'temp', ...defaultSettings });
        }
      }
    } catch (err) {
      if (retryCount < 1) {
        const waitTime = (retryCount + 1) * 1000;
        console.warn(`Unexpected error fetching settings (attempt ${retryCount + 1}), retrying in ${waitTime}ms...`, err);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return fetchSystemSettings(retryCount + 1);
      }
      console.error('Final error fetching settings after retries:', err);
      // Fallback to defaults on any unexpected error or timeout
      setSystemSettings({
        id: 'default',
        show_dashboard: true,
        show_reports: true,
        show_investments: true,
        show_discussion: true,
        show_savings: true
      });
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      // Optimistic update
      if (systemSettings) {
        setSystemSettings({ ...systemSettings, ...newSettings });
      }

      if (!systemSettings || systemSettings.id === 'default' || systemSettings.id === 'temp') {
        const baseSettings = systemSettings || {
          show_dashboard: true,
          show_reports: true,
          show_investments: true,
          show_discussion: true,
          show_savings: true
        };

        const settingsToInsert = {
          show_dashboard: newSettings.show_dashboard ?? baseSettings.show_dashboard,
          show_reports: newSettings.show_reports ?? baseSettings.show_reports,
          show_investments: newSettings.show_investments ?? baseSettings.show_investments,
          show_discussion: newSettings.show_discussion ?? baseSettings.show_discussion,
          show_savings: newSettings.show_savings ?? baseSettings.show_savings,
        };

        const { data, error } = await supabase
          .from('app_settings')
          .insert(settingsToInsert)
          .select()
          .maybeSingle();

        if (error) throw error;
        if (data) setSystemSettings(data);
        return;
      }

      const { data, error } = await supabase
        .from('app_settings')
        .update(newSettings)
        .eq('id', systemSettings.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSystemSettings(data);
      } else {
        // If the row was deleted or not found, try to recreate it
        const { data: newData, error: insertError } = await supabase
          .from('app_settings')
          .insert({ ...systemSettings, ...newSettings })
          .select()
          .maybeSingle();
        
        if (insertError) throw insertError;
        if (newData) setSystemSettings(newData);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      // Revert optimistic update by re-fetching
      await fetchSystemSettings();
      throw err;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMember(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchMemberProfile(user.id);
    }
  };

  const phoneFromEmail = user?.email?.split('@')[0]?.split('_')[0];
  const isMainAdmin = member?.phone?.includes('1580824066') || 
                     phoneFromEmail?.includes('1580824066') ||
                     user?.email === 'mdjahedtech@gmail.com';
  const isAdmin = member?.role === 'admin' || isMainAdmin;

  return (
    <AuthContext.Provider value={{ session, user, member, systemSettings, loading, cache, setCache, prefetchAllData, dashboardLoaded, setDashboardLoaded, isAdmin, isMainAdmin, signOut, refreshProfile, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
