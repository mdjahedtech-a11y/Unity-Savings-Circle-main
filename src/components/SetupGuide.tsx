import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { FileText, Copy, Check, ShieldAlert, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function SetupGuide() {
  const [copied, setCopied] = useState(false);
  const { user, member, refreshProfile } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const handleSyncAccount = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    setSyncing(true);
    try {
      // 1. Check if member already has auth_user_id
      if (member?.auth_user_id === user.id) {
        toast.success('Account already correctly linked!');
        return;
      }

      // 2. Try to find member by phone (extracted from email)
      const phoneFromEmail = user.email?.split('@')[0]?.split('_')[0];
      const isAdminEmail = user.email === 'mdjahedtech@gmail.com';

      const variations = [
        phoneFromEmail,
        phoneFromEmail?.startsWith('0') ? phoneFromEmail.substring(1) : '0' + (phoneFromEmail || ''),
        phoneFromEmail?.startsWith('88') ? phoneFromEmail.substring(2) : '88' + (phoneFromEmail || ''),
        isAdminEmail ? '01580824066' : null,
      ].filter(Boolean) as string[];

      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .in('phone', variations)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!memberData) {
        toast.error('No member record found for your phone number');
        return;
      }

      // 3. Update the auth_user_id manually
      const { error: updateError } = await supabase
        .from('members')
        .update({ auth_user_id: user.id })
        .eq('id', memberData.id);

      if (updateError) throw updateError;

      toast.success('Account synced successfully! You are now fully linked.');
      await refreshProfile();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Sync failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  const sqlContent = `
-- Drop existing tables to reset schema (WARNING: DELETES DATA)
drop table if exists payments;
drop table if exists members;

-- Create Members Table
create table members (
  id uuid default uuid_generate_v4() primary key,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text unique not null,
  password text, -- Storing explicitly for admin recovery as requested
  photo_url text,
  father_mother_name text,
  passport_photo_url text,
  agreement_accepted boolean default false,
  agreement_date timestamp with time zone,
  signature_data text,
  share_count int default 1,
  role text check (role in ('admin', 'user')) default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Payments Table
create table payments (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references members(id) on delete cascade not null,
  month text not null,
  year int not null,
  share_amount int not null,
  penalty int default 0,
  total_amount int not null,
  payment_status text check (payment_status in ('paid', 'pending', 'unpaid')) default 'pending',
  payment_method text,
  payment_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table members enable row level security;
alter table payments enable row level security;

-- Create Policies

-- Members:
-- Everyone can view members (needed for login checks)
drop policy if exists "Members are viewable by everyone." on members;
create policy "Members are viewable by everyone." on members for select using (true);

-- Admins can insert new members (Provisioning)
drop policy if exists "Admins can insert members." on members;
create policy "Admins can insert members." on members for insert with check (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
  or 
  -- Allow initial seed if table is empty
  (select count(*) from members) = 0
);

-- Admins can update members
drop policy if exists "Admins can update members." on members;
create policy "Admins can update members." on members for update using (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);

-- Admins can delete members
drop policy if exists "Admins can delete members." on members;
create policy "Admins can delete members." on members for delete using (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);

-- Users can update their own 'auth_user_id' during auto-login
drop policy if exists "Users can link their auth account." on members;
create policy "Users can link their auth account." on members for update using (
  true 
);

-- Payments:
drop policy if exists "Payments are viewable by everyone." on payments;
create policy "Payments are viewable by everyone." on payments for select using (true);

drop policy if exists "Admins can insert payments." on payments;
create policy "Admins can insert payments." on payments for insert with check (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can update payments." on payments;
create policy "Admins can update payments." on payments for update using (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can delete payments." on payments;
create policy "Admins can delete payments." on payments for delete using (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);

-- FIX ONLY SQL (Run this if you don't want to reset data)
/*
ALTER TABLE members ADD COLUMN IF NOT EXISTS father_mother_name text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS passport_photo_url text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS agreement_accepted boolean default false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS agreement_date timestamp with time zone;
ALTER TABLE members ADD COLUMN IF NOT EXISTS signature_data text;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method text;

-- If you get RLS error, ensure your admin user is linked:
-- 1. Get your Auth ID from Supabase Auth -> Users
-- 2. Run: UPDATE members SET auth_user_id = 'YOUR_AUTH_ID' WHERE phone = 'YOUR_PHONE';

-- RESTORE ALL DATA VISIBILITY (Undo Restricted Report Policy)
-- Run this if your data disappeared after the last update
DROP POLICY IF EXISTS "Users can only see their own payments." ON payments;
DROP POLICY IF EXISTS "Payments are viewable by everyone." ON payments;
CREATE POLICY "Payments are viewable by everyone." ON payments FOR SELECT USING (true);

-- PERFORMANCE INDEXES (Make the app feel instant)
-- Run these to speed up data loading as your member list grows
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_month_year ON payments(month, year);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_auth_user_id ON members(auth_user_id);
*/

-- Seed Main Admin
insert into members (name, phone, role, share_count, password)
values ('Jahed', '01580824066', 'admin', 1, '1414635406')
on conflict (phone) do update set name = 'Jahed', role = 'admin', password = '1414635406';
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-indigo-900 dark:via-purple-900 dark:to-blue-900 p-8 flex items-center justify-center transition-colors duration-300">
      <Card className="max-w-3xl w-full bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-xl dark:shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-indigo-400 dark:to-violet-400">
            Database Update Required
          </CardTitle>
          <p className="text-center text-gray-500 dark:text-white/60 mt-2">
            We've updated the system to support Phone-Only Login (No Password).
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Warning:</strong> The SQL below will reset your tables. Existing data will be cleared.
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-semibold text-base">Having "Permission Denied" (RLS) Errors?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              If you already ran the SQL but still get "Permission Denied" when adding payments, your account ID might not be linked in the members table.
            </p>
            <Button 
              size="sm" 
              onClick={handleSyncAccount}
              disabled={syncing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full flex items-center justify-center gap-2"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              {syncing ? 'Syncing...' : 'Quick Fix: Sync My Account Now'}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center font-bold text-white">1</div>
              <p>Go to <a href="https://supabase.com" target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline">Supabase SQL Editor</a></p>
            </div>
            <div className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center font-bold text-white">2</div>
              <p>Run the following SQL script:</p>
            </div>
          </div>

          <div className="relative bg-gray-900 dark:bg-black/50 rounded-xl p-4 border border-gray-800 dark:border-white/10">
            <div className="absolute top-4 right-4">
              <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </Button>
            </div>
            <pre className="text-xs text-gray-300 dark:text-white/70 font-mono overflow-x-auto h-64 p-2">
              {sqlContent}
            </pre>
          </div>

          <div className="text-center">
            <Button onClick={() => window.location.reload()} className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-purple-900 dark:hover:bg-white/90">
              I've Run the SQL Script
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
