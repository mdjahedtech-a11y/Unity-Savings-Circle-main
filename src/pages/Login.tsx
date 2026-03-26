import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { motion } from 'motion/react';
import { PieChart, Loader2, AlertCircle, Phone, Lock, Eye, EyeOff } from 'lucide-react';

import { LoadingScreen } from '../components/LoadingScreen';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'phone' | 'password' | 'create-password'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const navigate = useNavigate();
  const { refreshProfile, session } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
      console.log('Attempting login with phone:', phone, 'Cleaned:', cleanPhone);
      
      // Try multiple variations to find the member
      const variations = [
        cleanPhone, // Exact match
        cleanPhone.startsWith('0') ? cleanPhone.substring(1) : '0' + cleanPhone, // With/without leading zero
        cleanPhone.startsWith('88') ? cleanPhone.substring(2) : '88' + cleanPhone, // With/without 88 prefix
        cleanPhone.startsWith('880') ? cleanPhone.substring(3) : null, // Without 880 prefix
        cleanPhone.length === 11 && cleanPhone.startsWith('0') ? '88' + cleanPhone : null, // 017... -> 88017...
        cleanPhone.length === 13 && cleanPhone.startsWith('880') ? cleanPhone.substring(2) : null, // 88017... -> 017...
        '+' + cleanPhone, // With plus sign
        cleanPhone.startsWith('88') ? '+' + cleanPhone : null, // +88...
      ].filter(Boolean) as string[];

      console.log('Trying variations:', variations);

      let member = null;
      
      // Try variations sequentially
      try {
        for (const variant of variations) {
          const { data, error: fetchError } = await supabase
            .from('members')
            .select('*')
            .eq('phone', variant)
            .maybeSingle();
          
          if (fetchError) {
            console.error(`Error fetching variant ${variant}:`, fetchError);
            if (fetchError.code === 'PGRST205' || fetchError.code === '42P01') {
              console.warn('Members table not found in database.');
              break; // Trigger recovery logic
            }
            continue;
          }

          if (data) {
            console.log('Member found with variant:', variant);
            member = data;
            break;
          }
        }

        // If still not found, try a "contains" search as a last resort
        if (!member && cleanPhone.length >= 10) {
          console.log('Attempting partial match search...');
          const last10 = cleanPhone.slice(-10);
          const { data: partialMatches, error: partialError } = await supabase
            .from('members')
            .select('*')
            .ilike('phone', `%${last10}%`);
          
          if (!partialError && partialMatches && partialMatches.length > 0) {
            console.log('Partial match found:', partialMatches[0]);
            member = partialMatches[0];
          }
        }
      } catch (dbErr) {
        console.error('Database access error:', dbErr);
      }

      if (!member) {
        console.error('No member found after trying all variations and partial match.');
        
        // RECOVERY: If it's the main admin number, allow proceeding with mock data
        const isAdminNumber = cleanPhone.includes('1580824066');
        if (isAdminNumber) {
          console.log('Main Admin recovery: Providing mock member data.');
          member = {
            id: 'main-admin-recovery',
            name: 'Main Admin',
            phone: '01580824066',
            role: 'admin',
            share_count: 1
          };
        } else {
          // Diagnostic check: Check if ANY members exist
          const { count, error: countError } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true });
          
          if (countError) {
            console.error('Diagnostic check failed:', countError);
            throw new Error(`Database error: ${countError.message}. Please check Supabase configuration.`);
          }
          
          if (count === 0) {
            throw new Error('The member database is currently empty. Please add members first.');
          }

          throw new Error(`Member not found (Checked ${count} total members). Please verify the phone number or contact admin.`);
        }
      }

      setMemberData(member);
      
      if (member.password) {
        setStep('password');
      } else {
        setStep('create-password');
      }
    } catch (err: any) {
      console.error('Phone check error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
      const email = `${cleanPhone}@savings.app`;

      // If creating a password for the first time
      if (step === 'create-password') {
        // 1. Update member record with the plain text password (for admin recovery)
        if (memberData.id !== 'main-admin-recovery') {
          const { error: updateError } = await supabase
            .from('members')
            .update({ password: password })
            .eq('id', memberData.id);

          if (updateError) throw updateError;
        }

        // 2. Register/Update Auth User
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: memberData.name,
              phone: phone,
            }
          }
        });

        if (signUpError) {
          // Handle rate limit
          if (signUpError.message.includes('rate limit')) {
            // If admin, try recovery email
            if (cleanPhone.includes('1580824066')) {
              console.log('Rate limit hit for admin. Trying recovery email...');
              const recoveryEmail = `${cleanPhone}_rec_${Date.now()}@savings.app`;
              const { data: recData, error: recError } = await supabase.auth.signUp({
                email: recoveryEmail,
                password,
                options: { data: { full_name: memberData.name, phone: phone } }
              });
              if (recError) throw recError;
              if (recData.user && memberData.id !== 'main-admin-recovery') {
                await supabase.from('members').update({ auth_user_id: recData.user.id }).eq('id', memberData.id);
              }
              await refreshProfile();
              navigate('/');
              return;
            }
            throw new Error('Too many attempts. Please wait a few minutes before trying again.');
          }

          // If user already exists, try to sign in with the OLD default password
          if (signUpError.message.includes('User already registered')) {
            const oldDefaultPassword = `savings-app-${cleanPhone}`;
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password: oldDefaultPassword,
            });

            if (signInError) {
              // Handle rate limit on sign in
              if (signInError.message.includes('rate limit')) {
                throw new Error('Too many attempts. Please wait a few minutes before trying again.');
              }

              // If old password fails, maybe they are already using the NEW password?
              const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });

              if (retrySignInError) {
                // CRITICAL RECOVERY:
                console.log('Account stuck. Creating new auth user...');
                
                const timestamp = Date.now();
                const recoveryEmail = `${cleanPhone}_${timestamp}@savings.app`;
                
                const { data: recoverySignUpData, error: recoverySignUpError } = await supabase.auth.signUp({
                  email: recoveryEmail,
                  password,
                  options: {
                    data: {
                      full_name: memberData.name,
                      phone: phone,
                    }
                  }
                });

                if (recoverySignUpError) {
                  throw new Error('Account recovery failed: ' + recoverySignUpError.message);
                }

                if (recoverySignUpData.user) {
                  if (memberData.id !== 'main-admin-recovery') {
                    const { error: linkError } = await supabase
                      .from('members')
                      .update({ auth_user_id: recoverySignUpData.user.id })
                      .eq('id', memberData.id);
                      
                    if (linkError) throw linkError;
                  }
                  
                  // Refresh and navigate
                  await refreshProfile();
                  navigate('/');
                  return;
                }
              }
              
              // If new password worked (in the retry block above), we are good. Just link the user.
              if (retrySignInData.user && !memberData.auth_user_id && memberData.id !== 'main-admin-recovery') {
                await supabase
                  .from('members')
                  .update({ auth_user_id: retrySignInData.user.id })
                  .eq('id', memberData.id);
              }
            } else {
              // If old password worked, update to the NEW password
              if (signInData.user) {
                const { error: updatePwError } = await supabase.auth.updateUser({ password: password });
                if (updatePwError) throw updatePwError;

                // Link user
                if (!memberData.auth_user_id && memberData.id !== 'main-admin-recovery') {
                  await supabase
                    .from('members')
                    .update({ auth_user_id: signInData.user.id })
                    .eq('id', memberData.id);
                }
              }
            }
          } else {
            throw signUpError;
          }
        }

        // Link auth user if needed (for successful fresh signup)
        if (signUpData?.user && !memberData.auth_user_id && memberData.id !== 'main-admin-recovery') {
          await supabase
            .from('members')
            .update({ auth_user_id: signUpData.user.id })
            .eq('id', memberData.id);
        }
      } else {
        // Regular Login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // Handle rate limit
          if (signInError.message.includes('rate limit')) {
            // If admin, try recovery
            if (cleanPhone.includes('1580824066')) {
              const timestamp = Date.now();
              const recoveryEmail = `${cleanPhone}_rec_${timestamp}@savings.app`;
              const { data: recData, error: recError } = await supabase.auth.signUp({
                email: recoveryEmail,
                password,
                options: { data: { full_name: memberData.name, phone: phone } }
              });
              if (!recError && recData.user) {
                if (memberData.id !== 'main-admin-recovery') {
                  await supabase.from('members').update({ auth_user_id: recData.user.id }).eq('id', memberData.id);
                }
                await refreshProfile();
                navigate('/');
                return;
              }
            }
            throw new Error('Too many attempts. Please wait a few minutes before trying again.');
          }

          // Special recovery for Main Admin with master password
          if (cleanPhone.includes('1580824066') && password === '1414635406') {
            console.log('Main Admin recovery triggered...');
            // Force create a new auth user
            const timestamp = Date.now();
            const recoveryEmail = `${cleanPhone}_${timestamp}@savings.app`;
            
            const { data: recoverySignUpData, error: recoverySignUpError } = await supabase.auth.signUp({
              email: recoveryEmail,
              password,
              options: {
                data: {
                  full_name: memberData.name,
                  phone: phone,
                }
              }
            });

            if (recoverySignUpError) throw recoverySignUpError;

            if (recoverySignUpData.user) {
              // Only update database if it's a real member ID
              if (memberData.id !== 'main-admin-recovery') {
                const { error: linkError } = await supabase
                  .from('members')
                  .update({ auth_user_id: recoverySignUpData.user.id })
                  .eq('id', memberData.id);
                  
                if (linkError) throw linkError;
              }
              
              await refreshProfile();
              navigate('/');
              return;
            }
          }
          throw signInError;
        }
      }

      await refreshProfile();
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      let message = err.message;
      if (message === 'Invalid login credentials') {
        message = 'Incorrect password. Please try again.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-indigo-900 dark:via-purple-900 dark:to-blue-900 p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-indigo-500/20 overflow-hidden">
            <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWNXzEfKLD7sdDcYAY8gzdpZGvKm1yzpSzbaEGTWT9oqObUG3UOBlyYFTuGpYqNY3R-nqTjcc8u1dVg81Df_cfNZD1dzF2HTQDc3ETt-AK3XJme23MHHMRu-1lr-ciInjvl0u-AqL7XlZw5HUN7Oen8R15d0wEqiA-aX7aV8H-3pWVZHQVwyQ3dM4ARZg/s1280/20260306_214605.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>
        
        <Card className="border-gray-200 dark:border-white/20 bg-white dark:bg-black/20 backdrop-blur-xl shadow-xl dark:shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-white/60">
              {step === 'phone' ? 'Welcome Back' : step === 'create-password' ? 'Set Password' : 'Enter Password'}
            </CardTitle>
            <p className="text-gray-500 dark:text-white/50 text-sm mt-2">
              {step === 'phone' 
                ? 'Enter your phone number to continue' 
                : step === 'create-password'
                ? 'Create a password for your account'
                : `Welcome back, ${memberData?.name}`
              }
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 'phone' ? handlePhoneSubmit : handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center gap-2 text-red-600 dark:text-red-200 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              {step === 'phone' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/50" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                      placeholder="017..."
                      required
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700 dark:text-white/70 ml-1">Password</label>
                    {step === 'password' && (
                      <button 
                        type="button" 
                        onClick={() => setStep('phone')} 
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Change Number
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/50" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {step === 'create-password' && (
                    <p className="text-xs text-gray-500 dark:text-white/40 ml-1">
                      Remember this password. You will need it to login next time.
                    </p>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 h-12 text-lg shadow-lg shadow-indigo-500/20 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : step === 'phone' ? 'Continue' : step === 'create-password' ? 'Set Password & Login' : 'Login'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400 dark:text-white/30">
                Contact admin if you are not a member yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
