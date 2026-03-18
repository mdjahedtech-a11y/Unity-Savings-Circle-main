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

  useEffect(() => {
    fetchSystemSettings();
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMemberProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMemberProfile(session.user.id, session.user.email);
      } else {
        setMember(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMemberProfile = async (userId: string, userEmail?: string) => {
    try {
      // 1. Try to find by auth_user_id
      let { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching member profile by ID:', error);
      }

      // 2. If not found by ID, try to find by phone extracted from email
      if (!data && userEmail) {
        const phoneFromEmail = userEmail.split('@')[0]?.split('_')[0];
        if (phoneFromEmail && phoneFromEmail.length >= 10) {
          // Try multiple variations
          const variations = [
            phoneFromEmail,
            phoneFromEmail.startsWith('0') ? phoneFromEmail.substring(1) : '0' + phoneFromEmail,
            phoneFromEmail.startsWith('88') ? phoneFromEmail.substring(2) : '88' + phoneFromEmail,
            phoneFromEmail.startsWith('880') ? phoneFromEmail.substring(3) : null,
          ].filter(Boolean) as string[];

          for (const variant of variations) {
            const { data: phoneData, error: phoneError } = await supabase
              .from('members')
              .select('*')
              .eq('phone', variant)
              .maybeSingle();
            
            if (!phoneError && phoneData) {
              data = phoneData;
              // Link the auth_user_id if it's not set
              if (!data.auth_user_id) {
                await supabase
                  .from('members')
                  .update({ auth_user_id: userId })
                  .eq('id', data.id);
              }
              break;
            }
          }
        }
      }

      if (data) {
        setMember(data);
      } else {
        setMember(null);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching system settings:', error);
        // Fallback to defaults if table doesn't exist or error
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
        
        const { data: newData, error: insertError } = await supabase
          .from('app_settings')
          .insert(defaultSettings)
          .select()
          .single();
        
        if (!insertError && newData) {
          setSystemSettings(newData);
        } else {
          setSystemSettings({ id: 'temp', ...defaultSettings });
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching settings:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      if (!systemSettings) return;

      // If the current settings are just local defaults (no real DB ID), try to create them
      if (systemSettings.id === 'default' || systemSettings.id === 'temp') {
        const { data, error } = await supabase
          .from('app_settings')
          .insert({
            show_dashboard: newSettings.show_dashboard ?? systemSettings.show_dashboard,
            show_reports: newSettings.show_reports ?? systemSettings.show_reports,
            show_investments: newSettings.show_investments ?? systemSettings.show_investments,
            show_discussion: newSettings.show_discussion ?? systemSettings.show_discussion,
            show_savings: newSettings.show_savings ?? systemSettings.show_savings,
          })
          .select()
          .single();

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
          .insert(newSettings)
          .select()
          .single();
        
        if (insertError) throw insertError;
        if (newData) setSystemSettings(newData);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
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
  const isMainAdmin = member?.phone?.includes('1580824066') || phoneFromEmail?.includes('1580824066');
  const isAdmin = member?.role === 'admin' || isMainAdmin;

  return (
    <AuthContext.Provider value={{ session, user, member, systemSettings, loading, dashboardLoaded, setDashboardLoaded, isAdmin, isMainAdmin, signOut, refreshProfile, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
