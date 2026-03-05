import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { motion } from 'motion/react';
import { PieChart, Loader2, AlertCircle, Phone } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  React.useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cooldown > 0) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Check if member exists
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('phone', phone)
        .single();

      if (memberError || !member) {
        throw new Error('Member not found. Please contact admin.');
      }

      // 2. Auto-login using a fixed password for all users (since password is removed from UI)
      // In a real app, this would be OTP. For this request, we use a shared secret.
      const cleanPhone = phone.trim().replace(/[^0-9]/g, ''); // Remove all non-numeric characters
      const email = `${cleanPhone}@savings.app`; // Use a simple, valid domain
      const password = `savings-app-${cleanPhone}`; // Deterministic password

      // Try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If sign in fails, try to sign up (auto-register)
      if (signInError) {
        // If the error is NOT "Invalid login credentials", it might be a network issue or something else.
        // But usually, if the user doesn't exist, signIn returns "Invalid login credentials".
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: member.name,
            }
          }
        });

        if (signUpError) {
          // Check for rate limit specifically
          if (signUpError.message.includes('security purposes') || signUpError.message.includes('rate limit')) {
            throw new Error('Too many attempts. Please wait 60 seconds before trying again.');
          }
          throw signUpError;
        }

        // Link auth user to member record if sign up was successful
        if (signUpData.user) {
          const { error: updateError } = await supabase
            .from('members')
            .update({ auth_user_id: signUpData.user.id })
            .eq('phone', phone);
            
          if (updateError) console.error('Error linking member:', updateError);
        }
      }

      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      let message = err.message;
      
      if (message === 'Invalid login credentials') {
        message = 'Login failed. Please try again.';
      } else if (message.includes('security purposes') || message.includes('rate limit')) {
        message = 'Too many attempts. Please wait.';
        setCooldown(60);
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center shadow-2xl shadow-pink-500/20 rotate-3">
            <PieChart className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <Card className="border-white/20 bg-black/20 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Welcome Back
            </CardTitle>
            <p className="text-white/50 text-sm mt-2">
              Enter your phone number to continue
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-200 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error} {cooldown > 0 && `(${cooldown}s)`}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all"
                    placeholder="017..."
                    required
                    disabled={cooldown > 0}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500 text-white border-0 h-12 text-lg shadow-lg shadow-pink-500/20 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || cooldown > 0}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : cooldown > 0 ? `Wait ${cooldown}s` : 'Continue'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-white/30">
                Contact admin if you are not a member yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
