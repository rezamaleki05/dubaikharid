'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { SessionProvider, getProviders, signIn, signOut, useSession } from 'next-auth/react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus>
      <AuthInnerProvider>{children}</AuthInnerProvider>
    </SessionProvider>
  );
}

function AuthInnerProvider({ children }) {
  const { status } = useSession();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [googleAvailable, setGoogleAvailable] = useState(false);

  const refreshCurrentUser = useCallback(async () => {
    setIsLoadingUser(true);
    try {
      const response = await fetch('/api/account/me', { cache: 'no-store' });
      if (!response.ok) {
        setCurrentUser(null);
        return null;
      }
      const payload = await response.json();
      setCurrentUser(payload.data);
      return payload.data;
    } catch {
      setCurrentUser(null);
      return null;
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    getProviders()
      .then(providers => setGoogleAvailable(Boolean(providers?.google)))
      .catch(() => setGoogleAvailable(false));
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      Promise.resolve().then(() => {
        setCurrentUser(null);
        setIsLoadingUser(false);
      });
      return;
    }
    Promise.resolve().then(refreshCurrentUser);
  }, [refreshCurrentUser, status]);

  const login = async (phone, password) => {
    try {
      const result = await signIn('credentials', { phone, password, redirect: false });
      if (!result?.ok) return { success: false, message: 'شماره/ایمیل یا رمز عبور اشتباه است' };
      const user = await refreshCurrentUser();
      if (!user) return { success: false, message: 'ورود به حساب امکان‌پذیر نیست.' };
      return { success: true };
    } catch {
      return { success: false, message: 'خطا در ورود به حساب. مجدداً تلاش کنید.' };
    }
  };

  const register = async (name, phone, email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password }),
      });
      const payload = await response.json();
      if (!response.ok) return { success: false, message: payload.error || 'خطا در ثبت‌نام.' };
      return login(phone, password);
    } catch {
      return { success: false, message: 'خطا در ثبت‌نام. مجدداً تلاش کنید.' };
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    await signOut({ redirect: false });
  };

  const triggerGoogleLogin = () => {
    if (googleAvailable) signIn('google', { callbackUrl: '/profile' });
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoggedIn: Boolean(currentUser),
      authLoading: status === 'loading' || isLoadingUser,
      googleAvailable,
      register,
      login,
      logout,
      refreshCurrentUser,
      triggerGoogleLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
