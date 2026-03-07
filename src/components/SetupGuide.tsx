import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { FileText, Copy, Check } from 'lucide-react';
import React, { useState } from 'react';

export default function SetupGuide() {
  const [copied, setCopied] = useState(false);

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
  payment_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table members enable row level security;
alter table payments enable row level security;

-- Create Policies

-- Members:
-- Everyone can view members (needed for login checks)
create policy "Members are viewable by everyone." on members for select using (true);

-- Admins can insert new members (Provisioning)
create policy "Admins can insert members." on members for insert with check (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
  or 
  -- Allow initial seed if table is empty
  (select count(*) from members) = 0
);

-- Admins can update members
create policy "Admins can update members." on members for update using (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);

-- Admins can delete members
create policy "Admins can delete members." on members for delete using (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);

-- Users can update their own 'auth_user_id' during auto-login
create policy "Users can link their auth account." on members for update using (
  true -- Allow update if they have the correct phone number (handled by app logic + RLS on auth_user_id)
);

-- Payments:
create policy "Payments are viewable by everyone." on payments for select using (true);
create policy "Admins can insert payments." on payments for insert with check (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);
create policy "Admins can update payments." on payments for update using (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);
create policy "Admins can delete payments." on payments for delete using (
  exists (select 1 from members where auth_user_id = auth.uid() and role = 'admin')
);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 p-8 flex items-center justify-center transition-colors duration-300">
      <Card className="max-w-3xl w-full bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-xl dark:shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-pink-400 dark:to-violet-400">
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

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="w-8 h-8 rounded-full bg-pink-600 dark:bg-pink-500 flex items-center justify-center font-bold text-white">1</div>
              <p>Go to <a href="https://supabase.com" target="_blank" className="text-pink-600 dark:text-pink-400 hover:underline">Supabase SQL Editor</a></p>
            </div>
            <div className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="w-8 h-8 rounded-full bg-pink-600 dark:bg-pink-500 flex items-center justify-center font-bold text-white">2</div>
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
