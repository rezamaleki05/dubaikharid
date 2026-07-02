'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSiteSettings } from './SiteSettingsContext';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <AuthInnerProvider>{children}</AuthInnerProvider>
    </SessionProvider>
  );
}

function AuthInnerProvider({ children }) {
  const { settings } = useSiteSettings();
  const { data: session, status } = useSession();
  const [currentUser, setCurrentUser] = useState(null);
  const [showOAuth, setShowOAuth] = useState(null); // 'apple' or null
  const [oauthLoading, setOauthLoading] = useState(false);
  const [customOauthEmail, setCustomOauthEmail] = useState('');
  const [customOauthName, setCustomOauthName] = useState('');

  // Load user from localStorage on mount (for credentials login)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('dubaiKharidCurrentUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // Only load if not standard google auth (which is handled by NextAuth session)
        if (parsed.authProvider !== 'google') {
          setCurrentUser(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading current user:', e);
    }
  }, []);

  // Sync NextAuth session with local Auth state
  useEffect(() => {
    if (session && session.user) {
      const googleUser = {
        name: session.user.name,
        email: session.user.email,
        phone: '09999999999', // Default phone
        avatar: session.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.name)}&backgroundColor=f87820&textColor=ffffff`,
        dateRegistered: new Date().toLocaleDateString('fa-IR'),
        authProvider: 'google'
      };

      setCurrentUser(googleUser);
      localStorage.setItem('dubaiKharidCurrentUser', JSON.stringify(googleUser));

      // Sync with local users registry for admin dashboard
      try {
        const usersSaved = localStorage.getItem('dubaiKharidUsers');
        const users = usersSaved ? JSON.parse(usersSaved) : [];
        if (!users.some(u => u.email === session.user.email)) {
          users.push(googleUser);
          localStorage.setItem('dubaiKharidUsers', JSON.stringify(users));
        }
      } catch (err) {
        console.error(err);
      }
    } else if (status === 'unauthenticated') {
      // If NextAuth session is inactive, but local storage thinks we have Google login, clear it
      try {
        const savedUser = localStorage.getItem('dubaiKharidCurrentUser');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.authProvider === 'google') {
            setCurrentUser(null);
            localStorage.removeItem('dubaiKharidCurrentUser');
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [session, status]);

  // Standard Register
  const register = (name, phone, email, password) => {
    try {
      const usersSaved = localStorage.getItem('dubaiKharidUsers');
      const users = usersSaved ? JSON.parse(usersSaved) : [];

      if (users.some(u => u.phone === phone)) {
        return { success: false, message: 'این شماره موبایل قبلاً در سیستم ثبت شده است.' };
      }

      const newUser = {
        name,
        phone,
        email: email || '',
        password,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f87820&textColor=ffffff`,
        dateRegistered: new Date().toLocaleDateString('fa-IR'),
        authProvider: 'credentials'
      };

      users.push(newUser);
      localStorage.setItem('dubaiKharidUsers', JSON.stringify(users));
      
      // Auto login after registration
      setCurrentUser(newUser);
      localStorage.setItem('dubaiKharidCurrentUser', JSON.stringify(newUser));
      return { success: true };
    } catch (e) {
      return { success: false, message: 'خطا در ثبت‌نام. مجدداً تلاش کنید.' };
    }
  };

  // Standard Login
  const login = (phone, password) => {
    try {
      const usersSaved = localStorage.getItem('dubaiKharidUsers');
      const users = usersSaved ? JSON.parse(usersSaved) : [];

      // Default fallback demo user
      const defaultUsers = [
        {
          name: 'رضا محمدی',
          phone: '09123456789',
          email: 'reza.mohammadi@gmail.com',
          password: 'password123',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
          dateRegistered: '1403/01/15',
          authProvider: 'credentials'
        }
      ];

      const allUsers = [...defaultUsers, ...users];
      const matched = allUsers.find(u => u.phone === phone && u.password === password);

      if (!matched) {
        return { success: false, message: 'شماره موبایل یا رمز عبور اشتباه است.' };
      }

      setCurrentUser(matched);
      localStorage.setItem('dubaiKharidCurrentUser', JSON.stringify(matched));
      return { success: true };
    } catch (e) {
      return { success: false, message: 'خطا در ورود به حساب. مجدداً تلاش کنید.' };
    }
  };

  // Logout
  const logout = () => {
    try {
      localStorage.removeItem('dubaiKharidCurrentUser');
      setCurrentUser(null);
      if (session) {
        signOut({ callbackUrl: '/' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Google Login (NextAuth)
  const triggerGoogleLogin = () => {
    signIn('google', { callbackUrl: '/profile' });
  };

  // Apple Login (Simulated fallback)
  const triggerAppleLogin = () => setShowOAuth('apple');

  const handleSocialSelect = (name, email) => {
    setOauthLoading(true);
    setTimeout(() => {
      const socialUser = {
        name,
        email,
        phone: '09999999999',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=000000&textColor=ffffff`,
        dateRegistered: new Date().toLocaleDateString('fa-IR'),
        authProvider: 'apple'
      };

      setCurrentUser(socialUser);
      localStorage.setItem('dubaiKharidCurrentUser', JSON.stringify(socialUser));
      
      try {
        const usersSaved = localStorage.getItem('dubaiKharidUsers');
        const users = usersSaved ? JSON.parse(usersSaved) : [];
        if (!users.some(u => u.email === email)) {
          users.push(socialUser);
          localStorage.setItem('dubaiKharidUsers', JSON.stringify(users));
        }
      } catch (err) {
        console.error(err);
      }

      setOauthLoading(false);
      setShowOAuth(null);
      setCustomOauthEmail('');
      setCustomOauthName('');
    }, 1500);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoggedIn: !!currentUser,
      register,
      login,
      logout,
      triggerGoogleLogin,
      triggerAppleLogin
    }}>
      {children}

      {/* Simulated Apple OAuth Dialog Overlay */}
      {showOAuth === 'apple' && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.appleCard}>
            {oauthLoading ? (
              <div style={modalStyles.loaderContainer}>
                <div style={modalStyles.spinnerApple}></div>
                <p style={{ marginTop: '16px', color: '#fff', fontSize: '14px' }}>در حال ارتباط با Apple ID...</p>
              </div>
            ) : (
              <>
                <div style={modalStyles.appleHeader}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.83-.98 2.94 1.07.08 2.15-.52 2.81-1.33z"></path>
                  </svg>
                  <h2 style={modalStyles.appleTitle}>Sign in with Apple ID</h2>
                  <p style={modalStyles.appleSubtitle}>ثبت ورود از طریق شناسه‌ی اپل‌آیدی</p>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <label style={{ fontSize: '11px', color: '#a1a1a6', display: 'block', marginBottom: '6px' }}>شناسه Apple ID:</label>
                    <input 
                      type="email" 
                      placeholder="name@icloud.com" 
                      style={modalStyles.appleInput}
                      value={customOauthEmail || 'reza.mohammadi@icloud.com'}
                      onChange={(e) => setCustomOauthEmail(e.target.value)}
                    />
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <label style={{ fontSize: '11px', color: '#a1a1a6', display: 'block', marginBottom: '6px' }}>نام کاربری:</label>
                    <input 
                      type="text" 
                      placeholder="رضا محمدی" 
                      style={modalStyles.appleInput}
                      value={customOauthName || 'رضا محمدی'}
                      onChange={(e) => setCustomOauthName(e.target.value)}
                    />
                  </div>

                  <button 
                    type="button" 
                    style={modalStyles.appleSubmit}
                    onClick={() => {
                      const finalName = customOauthName || 'رضا محمدی';
                      const finalEmail = customOauthEmail || 'reza.mohammadi@icloud.com';
                      handleSocialSelect(finalName, finalEmail);
                    }}
                  >
                    ادامه و تایید با Face ID / رمز عبور
                  </button>
                </div>

                <button 
                  onClick={() => setShowOAuth(null)}
                  style={modalStyles.appleCancel}
                >
                  انصراف و بازگشت
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    fontFamily: 'inherit',
    backdropFilter: 'blur(4px)'
  },
  loaderContainer: {
    padding: '40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinnerApple: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderTop: '4px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  appleCard: {
    background: '#1c1c1e',
    color: '#ffffff',
    width: '100%',
    maxWidth: '380px',
    borderRadius: '14px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    direction: 'rtl'
  },
  appleHeader: {
    padding: '24px 24px 16px',
    textAlign: 'center',
    borderBottom: '1px solid #3a3a3c'
  },
  appleTitle: {
    margin: '12px 0 4px',
    fontSize: '19px',
    fontWeight: '600'
  },
  appleSubtitle: {
    margin: 0,
    fontSize: '12px',
    color: '#8e8e93'
  },
  appleInput: {
    width: '100%',
    background: '#2c2c2e',
    border: '1px solid #3a3a3c',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#fff',
    outline: 'none',
    textAlign: 'right',
    fontFamily: 'inherit',
    direction: 'ltr'
  },
  appleSubmit: {
    width: '100%',
    background: '#ffffff',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '11px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '8px'
  },
  appleCancel: {
    background: 'none',
    border: 'none',
    borderTop: '1px solid #3a3a3c',
    color: '#0a84ff',
    padding: '15px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'inherit'
  }
};

if (typeof window !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleTag);
}
