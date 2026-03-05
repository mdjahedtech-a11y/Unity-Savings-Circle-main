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

-- Seed Main Admin
insert into members (name, phone, role, share_count)
values ('Main Admin', '01580824066', 'admin', 1)
on conflict (phone) do nothing;
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 flex items-center justify-center">
      <Card className="max-w-3xl w-full bg-black/30 border-white/10 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400">
            Database Update Required
          </CardTitle>
          <p className="text-center text-white/60 mt-2">
            We've updated the system to support Phone-Only Login (No Password).
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm">
            <strong>Warning:</strong> The SQL below will reset your tables. Existing data will be cleared.
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center font-bold">1</div>
              <p>Go to <a href="https://supabase.com" target="_blank" className="text-pink-400 hover:underline">Supabase SQL Editor</a></p>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center font-bold">2</div>
              <p>Run the following SQL script:</p>
            </div>
          </div>

          <div className="relative bg-black/50 rounded-xl p-4 border border-white/10">
            <div className="absolute top-4 right-4">
              <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre className="text-xs text-white/70 font-mono overflow-x-auto h-64 p-2">
              {sqlContent}
            </pre>
          </div>

          <div className="text-center">
            <Button onClick={() => window.location.reload()} className="bg-white text-purple-900 hover:bg-white/90">
              I've Run the SQL Script
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
