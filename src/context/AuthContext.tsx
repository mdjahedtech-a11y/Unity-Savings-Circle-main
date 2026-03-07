import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Member } from '../types/index';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  member: Member | null;
  loading: boolean;
  isAdmin: boolean;
  isMainAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  member: null,
  loading: true,
  isAdmin: false,
  isMainAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMemberProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMemberProfile(session.user.id);
      } else {
        setMember(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMemberProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching member profile:', error);
      } else {
        setMember(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
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
  const isMainAdmin = member?.phone === '01580824066' || phoneFromEmail === '01580824066';
  const isAdmin = member?.role === 'admin' || isMainAdmin;

  return (
    <AuthContext.Provider value={{ session, user, member, loading, isAdmin, isMainAdmin, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
