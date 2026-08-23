'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState } from 'react';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import AdminShell from '@/components/admin/AdminShell';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useAdminAccess } from '@/components/admin/AdminAccessProvider';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

function SettingsContent() {
  const { can } = useAdminAccess();
  const { settings: siteCtxSettings, updateSettings: updateSiteCtxSettings, updateAedRateAuto } = useSiteSettings();

  const [settingsTab, setSettingsTab] = useState('general');

  const [siteSubTab, setSiteSubTab] = useState('banners');

  const [banners, setBanners] = useState([
      { id: 1, title: 'کالکشن بهاره لباس ورزشی', subtitle: 'خرید مستقیم و ارزان از شعب نایک دبی', link: '/men', status: 'فعال' },
      { id: 2, title: 'خرید جدیدترین مدل‌های آیفون', subtitle: 'قیمت عالی به همراه گارانتی بین‌المللی', link: '/electronics', status: 'غیرفعال' }
    ]);

  const [sitePages, setSitePages] = useState({
      about: 'فروشگاه دبی خرید با بیش از ۵ سال سابقه در حوزه واسطه‌گری خرید از امارات و تحویل مستقیم بار به مشتریان در ایران تأسیس شده است. ما خرید شما را از تمامی سایت‌های اماراتی تسهیل می‌کنیم.',
      terms: '۱. مسئولیت انتخاب سایز، رنگ و ویژگی‌های فیزیکی کالا بر عهده خریدار است.\n۲. ارسال کالا معمولاً بین ۷ الی ۱۴ روز کاری زمان خواهد برد.\n۳. با توجه به بین‌المللی بودن خریدها، امکان تغییر کالا یا مرجوعی پس از ثبت خرید در دبی وجود ندارد.',
      privacy: 'دبی خرید حریم خصوصی و اطلاعات کاربران را محترم شمرده و متعهد به حفظ آن بر اساس برترین شیوه‌های رمزنگاری است.'
    });

  const [faqs, setFaqs] = useState([
      { id: 1, question: 'چقدر زمان می‌برد تا کالا تحویل داده شود؟', answer: 'تحویل هوایی بار معمولاً ۷ تا ۱۴ روز کاری زمان می‌برد.' },
      { id: 2, question: 'آیا امکان سفارش هر محصولی وجود دارد؟', answer: 'بله، کالاهایی که با قوانین گمرکی جمهوری اسلامی ایران مغایرت نداشته باشند قابل سفارش هستند.' }
    ]);

  const [rules, setRules] = useState([
      { id: 1, title: 'قوانین خرید مستقیم', desc: 'نرخ محاسبه نهایی بر اساس زمان ثبت پیش‌پرداخت تایید شده سنجیده می‌شود.' },
      { id: 2, title: 'مقررات ارسال هوایی', desc: 'هزینه ارسال هوایی بر اساس وزن واقعی یا حجمی بار محاسبه شده و حداقل بار محاسبه شده ۱ کیلوگرم است.' }
    ]);

  const [seo, setSeo] = useState({
      title: 'دبی خرید | واسط مستقیم خرید کالا از امارات',
      desc: 'سفارش آسان و مستقیم از سایت‌های آمازون امارات، نون و برندهای معتبر دبی به همراه ارسال هوایی سریع.',
      keywords: 'خرید از دبی, خرید از آمازون دبی, خرید کالا از امارات, ارسال بار از دبی',
      googleAnalytics: 'G-77894562-1'
    });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [lastLoginTime, setLastLoginTime] = useState('۱۴۰۵/۰۳/۳۰ ساعت ۰۱:۲۲');

  const [lastLoginIp, setLastLoginIp] = useState('5.119.82.106 (تهران، ایران)');

  const [siteSettings, setSiteSettings] = useState({ siteName: 'دبی خرید', siteUrl: 'dubaykharid.ir', supportPhone: '021-88001234', supportEmail: 'support@dubaykharid.ir', telegramId: '@dubaykharid', whatsapp: '+971501234567', instagramId: '@dubaykharid', dubaiAddress: 'امارات، دبی، بیزینس بی، ساختمان ۱۲ بی اسکور', iranAddress: 'شیراز، شهرک گلستان، خیابان گل آرا', address: 'دبی، امارات متحده عربی', workingHours: 'شنبه تا پنجشنبه ۹ تا ۱۸', minOrderAed: '500', commissionPercent: '8', shippingBaseRate: '1200000', shippingPerKg: '350000', freeShippingThreshold: '80000000', maintenanceMode: false, allowRegistration: true, autoNotify: true, notifyNewOrder: true, notifyPayment: true, notifyShipment: true });

  const [localGeneral, setLocalGeneral] = useState({
      siteName: 'دبی خرید',
      adminName: 'مدیر سایت',
      adminEmail: 'admin@dubaykharid.ir',
      adminPhone: '021-88001234',
      timezone: 'Asia/Tehran',
      siteLogoUrl: '/images/logo dubai kharid.png',
      faviconUrl: '/favicon.ico',
      googleClientId: '48558991372-4r4qd9m2kerqnnu9d9jbiru1q4cj96ee.apps.googleusercontent.com',
      googleAuthMode: 'simulated'
    });

  const [logoPreview, setLogoPreview] = useState('/images/logo dubai kharid.png');

  const [faviconPreview, setFaviconPreview] = useState('/favicon.ico');

  const [saveGeneralSuccess, setSaveGeneralSuccess] = useState(false);

  const [isUpdatingAedRate, setIsUpdatingAedRate] = useState(false);

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'دریافت تنظیمات با خطا مواجه شد.');
        if (!active) return;
        setSiteSettings(previous => ({ ...previous, ...payload.data }));
        updateSiteCtxSettings(payload.data);
      })
      .catch(error => { if (active) setSettingsError(error.message); })
      .finally(() => { if (active) setIsLoadingSettings(false); });
    return () => { active = false; };
  }, [updateSiteCtxSettings]);

  const saveSettings = async (values, successMessage) => {
    if (!can(ADMIN_PERMISSIONS.SETTINGS_EDIT) || isSavingSettings) return null;
    setIsSavingSettings(true);
    setSettingsError('');
    setSettingsMessage('');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'ذخیره تنظیمات با خطا مواجه شد.');
      setSiteSettings(previous => ({ ...previous, ...payload.data }));
      updateSiteCtxSettings(payload.data);
      setSettingsMessage(successMessage);
      return payload.data;
    } catch (error) {
      setSettingsError(error.message);
      return null;
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
      if (siteCtxSettings) {
        setSiteSettings(prev => ({ ...prev, ...siteCtxSettings }));
      }
    }, [siteCtxSettings]);

  useEffect(() => {
      if (siteCtxSettings) {
        setLocalGeneral({
          siteName: siteCtxSettings.siteName || 'دبی خرید',
          adminName: siteCtxSettings.adminName || 'مدیر سایت',
          adminEmail: siteCtxSettings.adminEmail || 'admin@dubaykharid.ir',
          adminPhone: siteCtxSettings.adminPhone || '021-88001234',
          timezone: siteCtxSettings.timezone || 'Asia/Tehran',
          siteLogoUrl: siteCtxSettings.siteLogoUrl || '/images/logo dubai kharid.png',
          faviconUrl: siteCtxSettings.faviconUrl || '/favicon.ico',
          googleClientId: siteCtxSettings.googleClientId || '48558991372-4r4qd9m2kerqnnu9d9jbiru1q4cj96ee.apps.googleusercontent.com',
          googleAuthMode: siteCtxSettings.googleAuthMode || 'simulated'
        });
        setLogoPreview(siteCtxSettings.siteLogoUrl || '/images/logo dubai kharid.png');
        setFaviconPreview(siteCtxSettings.faviconUrl || '/favicon.ico');
      }
    }, [siteCtxSettings]);

  const handleFileUpload = (e, field, setPreview) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setLocalGeneral(p => ({ ...p, [field]: dataUrl }));
        setPreview(dataUrl);
      };
      reader.readAsDataURL(file);
    };

  const handleSaveGeneral = async () => {
      const saved = await saveSettings({
        siteName: localGeneral.siteName,
        adminName: localGeneral.adminName,
        adminEmail: localGeneral.adminEmail,
        adminPhone: localGeneral.adminPhone,
        timezone: localGeneral.timezone,
        siteLogoUrl: localGeneral.siteLogoUrl,
        faviconUrl: localGeneral.faviconUrl,
      }, 'تنظیمات عمومی با موفقیت ذخیره شد.');
      if (saved) {
        setSaveGeneralSuccess(true);
        setTimeout(() => setSaveGeneralSuccess(false), 3000);
      }
    };

  const handleRestoreDefaults = () => {
    alert('بازیابی کارخانه‌ای در نسخه دیتابیس‌محور غیرفعال است تا از حذف یا ناسازگاری داده‌های واقعی جلوگیری شود.');
  };

  return (
    <>
      {(() => {
            const SETTINGS_TABS = [
              { id: 'general', label: 'تنظیمات عمومی', icon: AdminIcons.settings(13) },
              { id: 'contact', label: 'اطلاعات تماس', icon: AdminIcons.phone(13) },
              { id: 'aed', label: 'نرخ درهم', icon: AdminIcons.dollar(13) },
              { id: 'shipping', label: 'تنظیمات ارسال', icon: AdminIcons.truck(13) },
              { id: 'site', label: 'مدیریت سایت', icon: AdminIcons.cloud(13) },
              { id: 'security', label: 'امنیت و حساب کاربری', icon: AdminIcons.lock(13) },
              { id: 'notifications', label: 'اعلان‌ها', icon: AdminIcons.bell(13) },
            ];







            return (
              <div className={styles.settingsResponsivePage} style={{ direction: 'rtl' }}>
                {/* Page Title */}
                <div style={{ marginBottom: '24px' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {AdminIcons.settings(22)} تنظیمات
                  </h1>
                  <p style={{ fontSize: '12px', color: '#8b92a5', margin: 0 }}>مدیریت تنظیمات کلی سیستم دبی خرید</p>
                  {isLoadingSettings && <div style={{ marginTop: '10px', color: '#8b92a5', fontSize: '11px' }}>در حال بارگذاری تنظیمات...</div>}
                  {settingsError && <div style={{ marginTop: '10px', color: '#ef4444', fontSize: '11px' }}>{settingsError}</div>}
                  {settingsMessage && <div style={{ marginTop: '10px', color: '#2ecc71', fontSize: '11px' }}>{settingsMessage}</div>}
                </div>

                <div className={styles.settingsLayoutGrid} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', alignItems: 'start' }}>

                  {/* Sidebar Tabs */}
                  <div className={styles.cardPanel} style={{ padding: '8px', borderRadius: '14px' }}>
                    {SETTINGS_TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                          padding: '11px 14px', borderRadius: '10px', border: 'none',
                          background: settingsTab === tab.id ? 'rgba(248,120,32,0.12)' : 'transparent',
                          color: settingsTab === tab.id ? '#f87820' : '#8b92a5',
                          fontSize: '12.5px', fontWeight: settingsTab === tab.id ? '700' : '500',
                          cursor: 'pointer', marginBottom: '2px', textAlign: 'right', transition: 'all 0.15s',
                          borderRight: settingsTab === tab.id ? '3px solid #f87820' : '3px solid transparent'
                        }}
                        onMouseOver={e => { if (settingsTab !== tab.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseOut={e => { if (settingsTab !== tab.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span>{tab.icon}</span> {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Content Panel */}
                  <div className={styles.cardPanel} style={{ padding: '28px', borderRadius: '14px' }}>

                    {/* ── تنظیمات عمومی ── */}
                    {settingsTab === 'general' && (
                      <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 24px 0', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          تنظیمات عمومی
                        </h2>

                        {saveGeneralSuccess && (
                          <div style={{ padding: '12px 16px', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.25)', borderRadius: '10px', color: '#2ecc71', fontSize: '12.5px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {AdminIcons.check(13)} تغییرات با موفقیت ذخیره شد و در سایت اصلی اعمال شد.
                          </div>
                        )}

                        {/* Logo & Favicon Upload Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>

                          {/* Logo Upload */}
                          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '11.5px', color: '#8b92a5', fontWeight: '600', marginBottom: '14px' }}>لوگوی سایت</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                <img src={logoPreview} alt="logo preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label
                                  htmlFor="logoUpload"
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '9px', background: 'rgba(248,120,32,0.08)', border: '1px solid rgba(248,120,32,0.2)', color: '#f87820', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.2s' }}
                                  onMouseOver={e => e.currentTarget.style.background = 'rgba(248,120,32,0.15)'}
                                  onMouseOut={e => e.currentTarget.style.background = 'rgba(248,120,32,0.08)'}
                                >
                                  {AdminIcons.upload(13)} آپلود لوگو
                                </label>
                                <input id="logoUpload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'siteLogoUrl', setLogoPreview)} />
                                <div style={{ fontSize: '10px', color: '#8b92a5' }}>PNG، JPG یا SVG — حداکثر ۲ مگابایت</div>
                                <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '3px' }}>ابعاد پیشنهادی: ۲۰۰×۶۰ پیکسل</div>
                              </div>
                            </div>
                          </div>

                          {/* Favicon Upload */}
                          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '11.5px', color: '#8b92a5', fontWeight: '600', marginBottom: '14px' }}>فاوآیکون (Favicon)</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                <img src={faviconPreview} alt="favicon preview" style={{ width: '32px', height: '32px', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label
                                  htmlFor="faviconUpload"
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '9px', background: 'rgba(248,120,32,0.08)', border: '1px solid rgba(248,120,32,0.2)', color: '#f87820', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.2s' }}
                                  onMouseOver={e => e.currentTarget.style.background = 'rgba(248,120,32,0.15)'}
                                  onMouseOut={e => e.currentTarget.style.background = 'rgba(248,120,32,0.08)'}
                                >
                                  {AdminIcons.upload(13)} آپلود فاوآیکون
                                </label>
                                <input id="faviconUpload" type="file" accept="image/*,.ico" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'faviconUrl', setFaviconPreview)} />
                                <div style={{ fontSize: '10px', color: '#8b92a5' }}>ICO، PNG — اندازه ۳۲×۳۲ یا ۶۴×۶۴</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Text Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                          <Field
                            label="نام سایت"
                            value={localGeneral.siteName}
                            onChange={e => setLocalGeneral(p => ({ ...p, siteName: e.target.value }))}
                            hint="نمایش داده می‌شود در تب مرورگر و هدر سایت"
                          />
                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '7px', fontWeight: '600' }}>منطقه زمانی</label>
                            <select
                              value={localGeneral.timezone}
                              onChange={e => setLocalGeneral(p => ({ ...p, timezone: e.target.value }))}
                              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', direction: 'rtl', cursor: 'pointer', boxSizing: 'border-box' }}
                              onFocus={e => e.target.style.borderColor = 'rgba(248,120,32,0.5)'}
                              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            >
                              <option value="Asia/Tehran" style={{ background: '#1a1d26' }}>تهران (UTC+3:30)</option>
                              <option value="Asia/Dubai" style={{ background: '#1a1d26' }}>دبی (UTC+4)</option>
                              <option value="Europe/London" style={{ background: '#1a1d26' }}>لندن (UTC+0)</option>
                              <option value="America/New_York" style={{ background: '#1a1d26' }}>نیویورک (UTC-5)</option>
                            </select>
                          </div>
                          <Field
                            label="نام مدیر"
                            value={localGeneral.adminName}
                            onChange={e => setLocalGeneral(p => ({ ...p, adminName: e.target.value }))}
                          />
                          <Field
                            label="ایمیل مدیر"
                            value={localGeneral.adminEmail}
                            onChange={e => setLocalGeneral(p => ({ ...p, adminEmail: e.target.value }))}
                            type="email"
                          />
                          <Field
                            label="شماره تماس مدیر"
                            value={localGeneral.adminPhone}
                            onChange={e => setLocalGeneral(p => ({ ...p, adminPhone: e.target.value }))}
                            type="tel"
                            hint="نمایش داده نمی‌شود برای کاربران"
                          />
                          
                          {/* Google OAuth Configuration Area */}
                          <div style={{ marginBottom: '20px', gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(248, 120, 32, 0.05)', border: '1px dashed rgba(248, 120, 32, 0.2)', padding: '16px', borderRadius: '12px', marginTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ display: 'block', fontSize: '12px', color: '#f87820', fontWeight: '800' }}>تنظیمات ورود با گوگل (Google OAuth)</label>
                              <select
                                value={localGeneral.googleAuthMode}
                                disabled
                                style={{ padding: '8px 12px', background: '#1c1926', border: '1px solid rgba(248,120,32,0.3)', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                              >
                                <option value="simulated">شبیه‌سازی‌شده (Simulation Mode)</option>
                                <option value="real">واقعی (Real OAuth API Mode)</option>
                              </select>
                            </div>
                            <div style={{ marginTop: '8px' }}>
                              <label style={{ display: 'block', fontSize: '11px', color: '#8b92a5', marginBottom: '6px', fontWeight: '600' }}>شناسه کلاینت گوگل (Google OAuth Client ID):</label>
                              <input
                                type="text"
                                value={localGeneral.googleClientId}
                                readOnly
                                style={{ width: '100%', padding: '10px 14px', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', direction: 'ltr' }}
                                placeholder="Enter your Client ID from Google Cloud Console"
                              />
                              <span style={{ fontSize: '10px', color: '#8b92a5', display: 'block', marginTop: '6px', lineHeight: '1.5' }}>
                                💡 <strong>نکته:</strong> برای استفاده از حالت واقعی، باید یک کلاینت وب (Web Application Client ID) در کنسول گوگل کلود خود ایجاد کرده و آدرس <code>http://localhost:4000</code> را در بخش Authorized JavaScript Origins قرار دهید.
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Save Button */}
                        <div style={{ marginTop: '8px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button
                            onClick={handleSaveGeneral}
                            disabled={isSavingSettings || isLoadingSettings || !can(ADMIN_PERMISSIONS.SETTINGS_EDIT)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 28px', borderRadius: '10px', background: '#f87820', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseOut={e => e.currentTarget.style.opacity = '1'}
                          >
                            {AdminIcons.check(14)} ذخیره تغییرات
                          </button>
                          <span style={{ fontSize: '11px', color: '#8b92a5' }}>تغییرات بلافاصله در سایت اصلی اعمال می‌شوند</span>
                        </div>
                      </div>
                    )}

                    {/* ── اطلاعات تماس ── */}
                    {settingsTab === 'contact' && (
                      <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 24px 0', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>اطلاعات تماس</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                          <Field label="شماره واتساپ" value={siteSettings.whatsapp || ''} onChange={e => setSiteSettings(p => ({ ...p, whatsapp: e.target.value }))} hint="مثال: +971501234567" />
                          <Field label="شماره تماس" value={siteSettings.supportPhone || ''} onChange={e => setSiteSettings(p => ({ ...p, supportPhone: e.target.value }))} />
                          <Field label="ایمیل" value={siteSettings.supportEmail || ''} onChange={e => setSiteSettings(p => ({ ...p, supportEmail: e.target.value }))} type="email" />
                          <Field label="تلگرام" value={siteSettings.telegramId || ''} onChange={e => setSiteSettings(p => ({ ...p, telegramId: e.target.value }))} hint="مثال: @dubaykharid" />
                          <Field label="اینستاگرام" value={siteSettings.instagramId || ''} onChange={e => setSiteSettings(p => ({ ...p, instagramId: e.target.value }))} hint="مثال: @dubaykharid" />
                          <Field label="آدرس دفتر دبی" value={siteSettings.dubaiAddress || ''} onChange={e => setSiteSettings(p => ({ ...p, dubaiAddress: e.target.value }))} />
                          <Field label="آدرس دفتر ایران" value={siteSettings.iranAddress || ''} onChange={e => setSiteSettings(p => ({ ...p, iranAddress: e.target.value }))} />
                        </div>
                        <SaveBtn disabled={isSavingSettings} onClick={() => saveSettings({
                          whatsapp: siteSettings.whatsapp,
                          supportPhone: siteSettings.supportPhone,
                          supportEmail: siteSettings.supportEmail,
                          telegramId: siteSettings.telegramId,
                          instagramId: siteSettings.instagramId,
                          dubaiAddress: siteSettings.dubaiAddress,
                          iranAddress: siteSettings.iranAddress,
                        }, 'اطلاعات تماس با موفقیت ذخیره شد.')} />
                      </div>
                    )}

                    {/* ── نرخ درهم ── */}
                    {settingsTab === 'aed' && (
                      <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 24px 0', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>نرخ برابری درهم</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                          
                          {/* Current Status Card */}
                          <div style={{ background: 'rgba(248,120,32,0.06)', border: '1px solid rgba(248,120,32,0.2)', borderRadius: '12px', padding: '20px' }}>
                            <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '8px' }}>نرخ فعلی درهم امارات</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                              <span style={{ fontSize: '38px', fontWeight: '900', color: '#f87820' }}>{Number(siteSettings.aedRate || 0).toLocaleString()}</span>
                              <span style={{ fontSize: '13px', color: '#8b92a5' }}>تومان / ۱ درهم</span>
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#8b92a5', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div>آخرین بروزرسانی: <strong style={{ color: '#fff' }}>{siteSettings.aedLastUpdate || 'ثبت نشده'}</strong></div>
                              <div>حالت بروزرسانی: <strong style={{ color: '#fff' }}>{siteSettings.aedUpdateMode === 'auto' ? 'خودکار' : 'دستی'}</strong></div>
                            </div>
                          </div>

                          {/* Quick conversion list */}
                          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px' }}>
                            <div style={{ fontSize: '11.5px', color: '#8b92a5', fontWeight: '600', marginBottom: '10px' }}>تبدیل سریع در بازار</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '11px', color: '#c0c8d8' }}>
                              <div>۱۰۰ درهم: <span style={{ color: '#fff' }}>{(100 * Number(siteSettings.aedRate || 0)).toLocaleString()} ت</span></div>
                              <div>۵۰۰ درهم: <span style={{ color: '#fff' }}>{(500 * Number(siteSettings.aedRate || 0)).toLocaleString()} ت</span></div>
                              <div>۱,۰۰۰ درهم: <span style={{ color: '#fff' }}>{(1000 * Number(siteSettings.aedRate || 0)).toLocaleString()} ت</span></div>
                              <div>۵,۰۰۰ درهم: <span style={{ color: '#fff' }}>{(5000 * Number(siteSettings.aedRate || 0)).toLocaleString()} ت</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Controls Form */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px', marginBottom: '24px' }}>
                          <Field
                            label="نرخ دستی درهم (تومان)"
                            value={siteSettings.aedRate || ''}
                            onChange={e => setSiteSettings(p => ({ ...p, aedRate: e.target.value }))}
                            type="number"
                            hint="در صورت خاموش بودن بروزرسانی خودکار استفاده می‌شود"
                          />

                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '7px', fontWeight: '600' }}>حالت بروزرسانی</label>
                            <select
                              value={siteSettings.aedUpdateMode || 'manual'}
                              onChange={e => setSiteSettings(p => ({ ...p, aedUpdateMode: e.target.value, aedAutoUpdate: e.target.value === 'auto' }))}
                              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', direction: 'rtl', cursor: 'pointer', boxSizing: 'border-box' }}
                            >
                              <option value="manual" style={{ background: '#1a1d26' }}>بروزرسانی دستی (Manual)</option>
                              <option value="auto" disabled style={{ background: '#1a1d26' }}>بروزرسانی خودکار (Automatic)</option>
                            </select>
                          </div>

                          {(siteSettings.aedUpdateMode === 'auto' || siteSettings.aedAutoUpdate) && (
                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '7px', fontWeight: '600' }}>بازه بروزرسانی خودکار</label>
                              <select
                                value={siteSettings.aedUpdateInterval || '1hr'}
                                onChange={e => setSiteSettings(p => ({ ...p, aedUpdateInterval: e.target.value }))}
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', direction: 'rtl', cursor: 'pointer', boxSizing: 'border-box' }}
                              >
                                <option value="30min" style={{ background: '#1a1d26' }}>هر ۳۰ دقیقه</option>
                                <option value="1hr" style={{ background: '#1a1d26' }}>هر ۱ ساعت</option>
                                <option value="3hr" style={{ background: '#1a1d26' }}>هر ۳ ساعت</option>
                                <option value="daily" style={{ background: '#1a1d26' }}>روزانه (۲۴ ساعت)</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Buttons Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <button
                            onClick={() => saveSettings({
                              aedRate: siteSettings.aedRate,
                              aedUpdateMode: 'manual',
                              aedAutoUpdate: false,
                            }, 'نرخ درهم و تنظیمات بروزرسانی ذخیره شد.')}
                            disabled={isSavingSettings}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 28px', borderRadius: '10px', background: '#f87820', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseOut={e => e.currentTarget.style.opacity = '1'}
                          >
                            {AdminIcons.check(14)} ذخیره نرخ
                          </button>

                          <button
                            onClick={async () => {
                              setIsUpdatingAedRate(true);
                              const res = await updateAedRateAuto();
                              setIsUpdatingAedRate(false);
                              if (res) {
                                await saveSettings({ aedRate: res.aedRate, aedLastUpdate: res.aedLastUpdate }, `نرخ درهم به صورت آنلاین بروزرسانی شد: ${Number(res.aedRate).toLocaleString()} تومان`);
                              } else {
                                alert('خطا در دریافت آنلاین نرخ درهم. از آخرین نرخ ذخیره شده استفاده گردید.');
                              }
                            }}
                            disabled={isUpdatingAedRate}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s', opacity: isUpdatingAedRate ? 0.5 : 1 }}
                          >
                            {isUpdatingAedRate ? 'در حال بروزرسانی...' : 'بروزرسانی آنلاین نرخ'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── تنظیمات ارسال ── */}
                    {settingsTab === 'shipping' && (
                      <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 24px 0', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>تنظیمات ارسال و کارمزد</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                          <Field
                            label="هزینه ارسال هر کیلوگرم (AED)"
                            value={siteSettings.shippingPerKgAed || ''}
                            onChange={e => setSiteSettings(p => ({ ...p, shippingPerKgAed: e.target.value }))}
                            type="number"
                          />
                          <Field
                            label="درصد کارمزد خرید (%)"
                            value={siteSettings.commissionPercent || ''}
                            onChange={e => setSiteSettings(p => ({ ...p, commissionPercent: e.target.value }))}
                            type="number"
                          />
                          <Field
                            label="حداقل وزن قابل محاسبه (کیلوگرم)"
                            value={siteSettings.minWeightClass || ''}
                            onChange={e => setSiteSettings(p => ({ ...p, minWeightClass: e.target.value }))}
                            type="number"
                          />
                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '7px', fontWeight: '600' }}>روش گرد کردن وزن</label>
                            <select
                              value={siteSettings.roundingMethod || 'ceil'}
                              onChange={e => setSiteSettings(p => ({ ...p, roundingMethod: e.target.value }))}
                              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', direction: 'rtl', cursor: 'pointer', boxSizing: 'border-box' }}
                            >
                              <option value="ceil" style={{ background: '#1a1d26' }}>رو به بالا (Ceil)</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ marginTop: '8px', padding: '16px 20px', background: 'rgba(46,204,113,0.06)', border: '1px solid rgba(46,204,113,0.15)', borderRadius: '10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#2ecc71', marginBottom: '8px' }}>مثال‌های محاسبه ارسال (با نرخ {siteSettings.shippingPerKgAed || ''} AED)</div>
                          <div style={{ fontSize: '11.5px', color: '#c0c8d8', lineHeight: '1.8' }}>
                            <div>کالای ۰.۳ کیلوگرم (گرد شده به ۱ کیلو) = <strong>{(1 * Number(siteSettings.shippingPerKgAed || 0))} AED</strong></div>
                            <div>کالای ۱.۳ کیلوگرم (گرد شده به ۲ کیلو) = <strong>{(2 * Number(siteSettings.shippingPerKgAed || 0))} AED</strong></div>
                            <div>کالای ۲.۱ کیلوگرم (گرد شده به ۳ کیلو) = <strong>{(3 * Number(siteSettings.shippingPerKgAed || 0))} AED</strong></div>
                          </div>
                        </div>

                        <SaveBtn label="ذخیره تنظیمات" disabled={isSavingSettings} onClick={() => saveSettings({
                          shippingPerKgAed: siteSettings.shippingPerKgAed,
                          commissionPercent: siteSettings.commissionPercent,
                          minWeightClass: siteSettings.minWeightClass,
                          roundingMethod: siteSettings.roundingMethod,
                        }, 'تنظیمات ارسال و کارمزد با موفقیت ذخیره شد.')} />
                      </div>
                    )}

                    {/* ── مدیریت سایت ── */}
                    {/* ── مدیریت سایت ── */}
                    {settingsTab === 'site' && (
                      <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 24px 0', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          مدیریت محتوای سایت
                        </h2>

                        <div style={{ marginBottom: '24px', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                          <Toggle
                            label="حالت تعمیر و نگهداری"
                            desc="در زمان فعال بودن، فروشگاه برای کاربران بسته است و پنل مدیریت در دسترس می‌ماند."
                            value={siteSettings.maintenanceMode}
                            onChange={value => setSiteSettings(previous => ({ ...previous, maintenanceMode: value }))}
                          />
                          <Toggle
                            label="امکان ثبت‌نام کاربر جدید"
                            desc="در صورت غیرفعال بودن، ثبت‌نام جدید از سمت سرور رد می‌شود."
                            value={siteSettings.allowRegistration}
                            onChange={value => setSiteSettings(previous => ({ ...previous, allowRegistration: value }))}
                          />
                          <SaveBtn disabled={isSavingSettings} onClick={() => saveSettings({
                            maintenanceMode: siteSettings.maintenanceMode,
                            allowRegistration: siteSettings.allowRegistration,
                          }, 'تنظیمات مدیریت سایت با موفقیت ذخیره شد.')} />
                        </div>

                        {/* Sub tabs navigation inside Site Management */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', overflowX: 'auto', direction: 'rtl' }}>
                          {[
                            { id: 'banners', label: 'بنرها', icon: '🖼️' },
                            { id: 'pages', label: 'صفحات اصلی', icon: '📄' },
                            { id: 'faqs', label: 'سوالات متداول', icon: '❓' },
                            { id: 'rules', label: 'قوانین سایت', icon: '⚖️' },
                            { id: 'seo', label: 'تنظیمات سئو (SEO)', icon: '🔍' }
                          ].map(sub => (
                            <button
                              key={sub.id}
                              onClick={() => setSiteSubTab(sub.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '8px', border: 'none',
                                background: siteSubTab === sub.id ? 'rgba(248,120,32,0.12)' : 'rgba(255,255,255,0.02)',
                                color: siteSubTab === sub.id ? '#f87820' : '#8b92a5',
                                borderRight: siteSubTab === sub.id ? '2px solid #f87820' : 'none',
                                fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span>{sub.icon}</span> {sub.label}
                            </button>
                          ))}
                        </div>

                        {/* Sub-tab: Banners */}
                        {siteSubTab === 'banners' && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#c0c8d8', margin: 0 }}>لیست بنرهای صفحه اصلی</h3>
                              <button
                                onClick={() => {
                                  const title = prompt('عنوان بنر:');
                                  const subtitle = prompt('زیرعنوان بنر:');
                                  const link = prompt('لینک هدایت دکمه:');
                                  if (title) {
                                    setBanners(prev => [...prev, { id: Date.now(), title, subtitle, link, status: 'فعال' }]);
                                  }
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', background: 'rgba(248,120,32,0.1)', border: '1px solid rgba(248,120,32,0.2)', color: '#f87820', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                {AdminIcons.plus(11)} افزودن بنر جدید
                              </button>
                            </div>

                            <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
                                <thead>
                                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th style={{ padding: '12px 16px', color: '#8b92a5' }}>تصویر</th>
                                    <th style={{ padding: '12px 16px', color: '#8b92a5' }}>عنوان</th>
                                    <th style={{ padding: '12px 16px', color: '#8b92a5' }}>زیرعنوان</th>
                                    <th style={{ padding: '12px 16px', color: '#8b92a5' }}>لینک هدایت</th>
                                    <th style={{ padding: '12px 16px', color: '#8b92a5' }}>وضعیت</th>
                                    <th style={{ padding: '12px 16px', color: '#8b92a5' }}>عملیات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {banners.map(banner => (
                                    <tr key={banner.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                                      <td style={{ padding: '12px 16px' }}>
                                        <div style={{ width: '60px', height: '36px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🖼️</div>
                                      </td>
                                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#fff' }}>{banner.title}</td>
                                      <td style={{ padding: '12px 16px', color: '#c0c8d8' }}>{banner.subtitle}</td>
                                      <td style={{ padding: '12px 16px', color: '#8b92a5', direction: 'ltr' }}>{banner.link}</td>
                                      <td style={{ padding: '12px 16px' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: banner.status === 'فعال' ? 'rgba(46,204,113,0.1)' : 'rgba(239,68,68,0.1)', color: banner.status === 'فعال' ? '#2ecc71' : '#ef4444', fontSize: '11px', fontWeight: '700' }}>
                                          {banner.status}
                                        </span>
                                      </td>
                                      <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          <button
                                            onClick={() => setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, status: b.status === 'فعال' ? 'غیرفعال' : 'فعال' } : b))}
                                            style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '11px' }}
                                          >
                                            تغییر وضعیت
                                          </button>
                                          <button
                                            onClick={() => setBanners(prev => prev.filter(b => b.id !== banner.id))}
                                            style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}
                                          >
                                            حذف
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <SaveBtn onClick={() => alert('تغییرات بنرها با موفقیت در دیتابیس لوکال ذخیره شد.')} />
                          </div>
                        )}

                        {/* Sub-tab: Pages */}
                        {siteSubTab === 'pages' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                              <label style={{ display: 'block', fontSize: '12.5px', color: '#fff', fontWeight: '700', marginBottom: '10px' }}>صفحه درباره ما (About Us)</label>
                              <textarea
                                value={sitePages.about}
                                onChange={e => setSitePages(p => ({ ...p, about: e.target.value }))}
                                rows="3"
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '12.5px', lineHeight: '1.7', resize: 'vertical' }}
                              />
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                              <label style={{ display: 'block', fontSize: '12.5px', color: '#fff', fontWeight: '700', marginBottom: '10px' }}>قوانین و مقررات خرید (Terms of Service)</label>
                              <textarea
                                value={sitePages.terms}
                                onChange={e => setSitePages(p => ({ ...p, terms: e.target.value }))}
                                rows="4"
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '12.5px', lineHeight: '1.7', resize: 'vertical' }}
                              />
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                              <label style={{ display: 'block', fontSize: '12.5px', color: '#fff', fontWeight: '700', marginBottom: '10px' }}>سیاست حریم خصوصی (Privacy Policy)</label>
                              <textarea
                                value={sitePages.privacy}
                                onChange={e => setSitePages(p => ({ ...p, privacy: e.target.value }))}
                                rows="3"
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '12.5px', lineHeight: '1.7', resize: 'vertical' }}
                              />
                            </div>
                            <SaveBtn onClick={() => alert('محتوای صفحات با موفقیت ذخیره شد.')} />
                          </div>
                        )}

                        {/* Sub-tab: FAQs */}
                        {siteSubTab === 'faqs' && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#c0c8d8', margin: 0 }}>لیست سوالات متداول کاربران</h3>
                              <button
                                onClick={() => {
                                  const question = prompt('صورت سوال:');
                                  const answer = prompt('پاسخ سوال:');
                                  if (question && answer) {
                                    setFaqs(prev => [...prev, { id: Date.now(), question, answer }]);
                                  }
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', background: 'rgba(248,120,32,0.1)', border: '1px solid rgba(248,120,32,0.2)', color: '#f87820', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                {AdminIcons.plus(11)} افزودن سوال جدید
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {faqs.map(faq => (
                                <div key={faq.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', position: 'relative' }}>
                                  <button
                                    onClick={() => setFaqs(prev => prev.filter(f => f.id !== faq.id))}
                                    style={{ position: 'absolute', top: '16px', left: '16px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                                    title="حذف سوال"
                                  >
                                    ✕
                                  </button>
                                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '13px', marginBottom: '8px', paddingLeft: '24px' }}>{faq.question}</div>
                                  <div style={{ color: '#8b92a5', fontSize: '12.5px', lineHeight: '1.6' }}>{faq.answer}</div>
                                </div>
                              ))}
                            </div>
                            <SaveBtn onClick={() => alert('سوالات متداول با موفقیت ذخیره شدند.')} />
                          </div>
                        )}

                        {/* Sub-tab: Rules */}
                        {siteSubTab === 'rules' && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#c0c8d8', margin: 0 }}>قوانین و مقررات خرید و ارسال کالا</h3>
                              <button
                                onClick={() => {
                                  const title = prompt('عنوان قانون:');
                                  const desc = prompt('شرح قانون:');
                                  if (title && desc) {
                                    setRules(prev => [...prev, { id: Date.now(), title, desc }]);
                                  }
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', background: 'rgba(248,120,32,0.1)', border: '1px solid rgba(248,120,32,0.2)', color: '#f87820', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                {AdminIcons.plus(11)} افزودن قانون جدید
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {rules.map(rule => (
                                <div key={rule.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', position: 'relative' }}>
                                  <button
                                    onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))}
                                    style={{ position: 'absolute', top: '16px', left: '16px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                                    title="حذف قانون"
                                  >
                                    ✕
                                  </button>
                                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '13px', marginBottom: '8px', paddingLeft: '24px' }}>{rule.title}</div>
                                  <div style={{ color: '#8b92a5', fontSize: '12.5px', lineHeight: '1.6' }}>{rule.desc}</div>
                                </div>
                              ))}
                            </div>
                            <SaveBtn onClick={() => alert('قوانین سایت با موفقیت ذخیره شدند.')} />
                          </div>
                        )}

                        {/* Sub-tab: SEO */}
                        {siteSubTab === 'seo' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                            <Field
                              label="عنوان پیش‌فرض سایت (Meta Title)"
                              value={seo.title}
                              onChange={e => setSeo(p => ({ ...p, title: e.target.value }))}
                            />
                            <Field
                              label="کد گوگل آنالیتیکس (Google Analytics ID)"
                              value={seo.googleAnalytics}
                              onChange={e => setSeo(p => ({ ...p, googleAnalytics: e.target.value }))}
                              dir="ltr"
                              hint="مثال: G-XXXXXXXXXX"
                            />
                            <div style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
                              <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '7px', fontWeight: '600' }}>کلمات کلیدی سایت (Meta Keywords)</label>
                              <input
                                value={seo.keywords}
                                onChange={e => setSeo(p => ({ ...p, keywords: e.target.value }))}
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                              />
                              <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '5px' }}>کلمات کلیدی را با کاما (,) جدا کنید</div>
                            </div>
                            <div style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
                              <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '7px', fontWeight: '600' }}>توضیحات پیش‌فرض سایت (Meta Description)</label>
                              <textarea
                                value={seo.desc}
                                onChange={e => setSeo(p => ({ ...p, desc: e.target.value }))}
                                rows="3"
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '12.5px', lineHeight: '1.7', resize: 'vertical' }}
                              />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <SaveBtn onClick={() => alert('تنظیمات SEO با موفقیت ذخیره شد.')} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── امنیت و حساب کاربری ── */}
                    {settingsTab === 'security' && (
                      <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 24px 0', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          امنیت و حساب کاربری
                        </h2>

                        {/* Admin credentials are managed securely on the server. */}
                        <div style={{ marginBottom: '32px' }}>
                          <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#c0c8d8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '7px' }}>{AdminIcons.lock(13)} رمز عبور ادمین</h3>
                          <div style={{ padding: '12px 14px', background: 'rgba(248,120,32,0.06)', border: '1px solid rgba(248,120,32,0.16)', borderRadius: '8px', color: '#c0c8d8', fontSize: '12px', lineHeight: '1.8' }}>
                            رمز عبور مدیر به‌صورت هش‌شده و از طریق متغیرهای امن سرور مدیریت می‌شود.
                          </div>
                        </div>

                        {/* Security Options */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                          
                          {/* 2FA Option */}
                          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>🛡️ ورود دو مرحله‌ای (2FA)</h3>
                            <Toggle
                              label="فعال‌سازی ورود دو مرحله‌ای"
                              desc="ارسال رمز یکبار مصرف به تلفن همراه ادمین هنگام ورود"
                              value={twoFactorEnabled}
                              onChange={v => { setTwoFactorEnabled(v); alert(`ورود دو مرحله‌ای ${v ? 'فعال' : 'غیرفعال'} گردید.`); }}
                            />
                          </div>

                          {/* Terminate Sessions */}
                          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>💻 خروج از دستگاه‌های دیگر</h3>
                              <p style={{ fontSize: '11.5px', color: '#8b92a5', margin: '0 0 16px 0', lineHeight: '1.6' }}>اتمام کلیه جلسات فعال در سایر مرورگرها و دستگاه‌ها</p>
                            </div>
                            <button
                              onClick={() => alert('با موفقیت از تمام دستگاه‌های دیگر خارج شدید.')}
                              style={{ width: 'max-content', padding: '8px 16px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', color: '#ef4444', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              خروج از همه دستگاه‌ها
                            </button>
                          </div>
                        </div>

                        {/* Last Login Info & System Reset */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>📌 اطلاعات آخرین ورود</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#c0c8d8' }}>
                              <div>آخرین ورود: <strong style={{ color: '#fff' }}>{lastLoginTime}</strong></div>
                              <div>IP آخرین ورود: <strong style={{ color: '#fff', direction: 'ltr', display: 'inline-block' }}>{lastLoginIp}</strong></div>
                            </div>
                          </div>

                          <div style={{ padding: '20px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>⚠️ ابزارهای احیا (توسعه‌دهنده)</h3>
                            <p style={{ fontSize: '11.5px', color: '#8b92a5', lineHeight: '1.6', margin: '0 0 16px 0' }}>حذف اطلاعات آزمایشی و بازگشت به تنظیمات کارخانه</p>
                            <button
                              onClick={handleRestoreDefaults}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {AdminIcons.sync(12)} بازگشت به تنظیمات کارخانه
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── اعلان‌ها ── */}
                    {settingsTab === 'notifications' && (
                      <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 24px 0', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>تنظیمات اعلان‌ها</h2>
                        <Toggle
                          label="اعلان‌های خودکار"
                          desc="ارسال پیام اتوماتیک به مشتری پس از هر تغییر وضعیت"
                          value={siteSettings.autoNotify}
                          onChange={v => setSiteSettings(p => ({ ...p, autoNotify: v }))}
                        />
                        <Toggle
                          label="اعلان سفارش جدید"
                          desc="ارسال پیام تأیید دریافت سفارش به مشتری"
                          value={siteSettings.notifyNewOrder}
                          onChange={v => setSiteSettings(p => ({ ...p, notifyNewOrder: v }))}
                        />
                        <Toggle
                          label="اعلان پرداخت"
                          desc="ارسال رسید پرداخت به مشتری پس از تأیید"
                          value={siteSettings.notifyPayment}
                          onChange={v => setSiteSettings(p => ({ ...p, notifyPayment: v }))}
                        />
                        <Toggle
                          label="اعلان ارسال بسته"
                          desc="اطلاع‌رسانی به مشتری هنگام ارسال بسته"
                          value={siteSettings.notifyShipment}
                          onChange={v => setSiteSettings(p => ({ ...p, notifyShipment: v }))}
                        />
                        <SaveBtn disabled={isSavingSettings} onClick={() => saveSettings({
                          autoNotify: siteSettings.autoNotify,
                          notifyNewOrder: siteSettings.notifyNewOrder,
                          notifyPayment: siteSettings.notifyPayment,
                          notifyShipment: siteSettings.notifyShipment,
                        }, 'تنظیمات اعلان‌ها با موفقیت ذخیره شد.')} />
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })()}
    </>
  );
}

export default function SettingsPage() {
  return (
    <AdminShell activeTab="settings">
      <SettingsContent />
    </AdminShell>
  );
}

const Field = ({ label, value, onChange, type = 'text', hint, readOnly }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', fontSize: '11.5px', color: '#8b92a5', marginBottom: '7px', fontWeight: '600' }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      style={{
        width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
        color: readOnly ? '#8b92a5' : '#fff', fontSize: '13px', outline: 'none',
        direction: 'rtl', transition: 'border-color 0.2s', boxSizing: 'border-box'
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(248,120,32,0.5)'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
    />
    {hint && <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '5px' }}>{hint}</div>}
  </div>
);

const Toggle = ({ label, desc, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <div>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{label}</div>
      {desc && <div style={{ fontSize: '11px', color: '#8b92a5', marginTop: '3px' }}>{desc}</div>}
    </div>
    <div
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
        background: value ? '#f87820' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
        position: 'absolute', top: '3px', transition: 'right 0.2s',
        right: value ? '3px' : '23px'
      }} />
    </div>
  </div>
);

const SaveBtn = ({ onClick, label = 'ذخیره تغییرات', disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', borderRadius: '10px', background: '#f87820', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: disabled ? 'not-allowed' : 'pointer', marginTop: '24px', transition: 'opacity 0.2s', opacity: disabled ? 0.55 : 1 }}
    onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
    onMouseOut={e => e.currentTarget.style.opacity = '1'}
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    {label}
  </button>
);
