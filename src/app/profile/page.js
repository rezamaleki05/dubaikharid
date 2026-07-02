'use client';

import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useWishlist } from '@/context/WishlistContext';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './Profile.module.css';

// ── SVG OUTLINE MONOCHROME ICONS ──
const ProfileIcons = {
  dashboard: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  orders: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  requests: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  wishlist: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  notifications: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  payments: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  addresses: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  account: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  coupons: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5H18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2H9" />
      <path d="M12 11h4M12 15h4M12 7h.01M8 11h.01M8 15h.01" />
    </svg>
  ),
  support: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  logout: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  lock: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  unlock: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  )
};

// ── 10-STAGE DETAILED TIMELINE CONFIGURATION ──
const DETAILED_STEPS = [
  { id: 'pending', text: 'ثبت سفارش', code: 'pending' },
  { id: 'reviewing', text: 'در حال بررسی', code: 'reviewing' },
  { id: 'price_tagged', text: 'قیمت‌گذاری شد', code: 'price_tagged' },
  { id: 'paid', text: 'پرداخت انجام شد', code: 'paid' },
  { id: 'purchased', text: 'خرید از امارات', code: 'purchased' },
  { id: 'warehouse_dubai', text: 'انبار دبی', code: 'warehouse_dubai' },
  { id: 'shipped', text: 'ارسال به ایران', code: 'shipped' },
  { id: 'customs', text: 'ترخیص', code: 'customs' },
  { id: 'local_shipping', text: 'ارسال برای مشتری', code: 'local_shipping' },
  { id: 'delivered', text: 'تحویل شده', code: 'delivered' }
];

const getDetailedStepIndex = (status) => {
  const map = {
    pending: 1,
    reviewing: 2,
    price_tagged: 3,
    approved: 4,
    paid: 4,
    purchased: 5,
    noon_dubai: 5,
    warehouse_dubai: 6,
    processing: 6,
    shipped: 7,
    customs: 8,
    local_shipping: 9,
    delivered: 10
  };
  return map[status] || 1;
};

// Simplified 6-Step Stepper (Dashboard)
const DASHBOARD_STEPS = [
  { text: 'ثبت سفارش', step: 1 },
  { text: 'در حال بررسی', step: 2 },
  { text: 'قیمت نهایی اعلام شد', step: 3 },
  { text: 'پرداخت', step: 4 },
  { text: 'خرید به ایران', step: 5 },
  { text: 'تحویل به مشتری', step: 6 }
];

const getDashboardStep = (status) => {
  const index = getDetailedStepIndex(status);
  if (index <= 1) return 1;
  if (index === 2) return 2;
  if (index === 3) return 3;
  if (index === 4) return 4;
  if (index >= 5 && index <= 9) return 5;
  return 6;
};

// Clean number presentation
const fmtToman = (n) => Math.round(n).toLocaleString('fa-IR');

function ProfileContent() {
  const { currentUser, isLoggedIn, logout } = useAuth();
  const { settings, updateSettings } = useSiteSettings();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  // Lists
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [activeCouponFilter, setActiveCouponFilter] = useState('active');
  const [activeOrderFilter, setActiveOrderFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Form states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // New Request Form
  const [reqUrl, setReqUrl] = useState('');
  const [reqSite, setReqSite] = useState('Amazon.ae');
  const [reqQty, setReqQty] = useState(1);
  const [reqNotes, setReqNotes] = useState('');
  const [reqProductName, setReqProductName] = useState('');
  const [reqImg, setReqImg] = useState('');

  // New Address Form
  const [addrTitle, setAddrTitle] = useState('');
  const [addrText, setAddrText] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [editingAddrId, setEditingAddrId] = useState(null);

  // New Ticket Form
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');

  // Load context on mount
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditEmail(currentUser.email || '');
      setEditPhone(currentUser.phone || '');
      setEditAddress(currentUser.address || '');
    }
  }, [currentUser]);

  // Load and seed user orders, payments, notifications, tickets, and addresses
  useEffect(() => {
    if (!currentUser) return;

    try {
      // 1. Seed & Load Leads/Orders
      const savedLeads = localStorage.getItem('dubaiKharidLeads');
      let leads = savedLeads ? JSON.parse(savedLeads) : [];

      // Seed mock orders for رضا ملکی if empty
      const isReza = currentUser.phone === '09123456789' || currentUser.email === 'reza.mohammadi@gmail.com';
      const rezaLeads = leads.filter(l => l.phone === currentUser.phone);
      
      if (isReza && rezaLeads.length === 0) {
        const mockLeads = [
          {
            id: 'DK-1256',
            customerName: currentUser.name,
            phone: currentUser.phone,
            address: currentUser.address || 'تهران، خیابان ولیعصر، برج نیایش، واحد ۵',
            totalToman: 24850000,
            status: 'price_tagged', // Step 3
            paymentStatus: 'pending',
            paymentMethod: 'gateway',
            date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
            productName: "Apple Watch Series 9 (45mm - Midnight)",
            img: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=200&q=80",
            store: 'Apple.com',
            isRequest: true
          },
          {
            id: 'DK-1255',
            customerName: currentUser.name,
            phone: currentUser.phone,
            address: currentUser.address || 'تهران، خیابان ولیعصر، برج نیایش، واحد ۵',
            totalToman: 18650000,
            status: 'shipped', // Step 7
            paymentStatus: 'paid',
            paymentMethod: 'gateway',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            productName: "iPhone 15 Pro Case & Charger bundle",
            img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80",
            store: 'Amazon.ae',
            isRequest: false
          },
          {
            id: 'DK-1254',
            customerName: currentUser.name,
            phone: currentUser.phone,
            address: currentUser.address || 'تهران، خیابان ولیعصر، برج نیایش، واحد ۵',
            totalToman: 6980000,
            status: 'delivered', // Step 10
            paymentStatus: 'paid',
            paymentMethod: 'gateway',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            productName: "AirPods Pro 2nd Gen USB-C",
            img: "https://images.unsplash.com/photo-1588449668338-d1517689ee76?w=200&q=80",
            store: 'Noon.com',
            isRequest: false
          },
          {
            id: 'DK-1253',
            customerName: currentUser.name,
            phone: currentUser.phone,
            address: currentUser.address || 'تهران، خیابان ولیعصر، برج نیایش، واحد ۵',
            totalToman: 21950000,
            status: 'pending', // Step 1
            paymentStatus: 'pending',
            paymentMethod: 'gateway',
            date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            productName: "Sony PlayStation 5 Slim Edition Console",
            img: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=200&q=80",
            store: 'Amazon.ae',
            isRequest: true
          },
          {
            id: 'DK-1252',
            customerName: currentUser.name,
            phone: currentUser.phone,
            address: currentUser.address || 'تهران، خیابان ولیعصر، برج نیایش، واحد ۵',
            totalToman: 4280000,
            status: 'delivered', // Step 10
            paymentStatus: 'paid',
            paymentMethod: 'gateway',
            date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            productName: "Adidas Ultraboost Light Running Shoes",
            img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80",
            store: 'Adidas.ae',
            isRequest: false
          }
        ];
        leads = [...mockLeads, ...leads];
        localStorage.setItem('dubaiKharidLeads', JSON.stringify(leads));
      }

      // Filter user leads
      const userLeads = leads.filter(l => l.phone === currentUser.phone);
      setOrders(userLeads);
      
      // Separate purchase requests (requests are leads marked as isRequest = true)
      setPurchaseRequests(userLeads.filter(l => l.isRequest));

      // 2. Seed & Load Addresses
      const savedAddr = localStorage.getItem(`dubaiKharidAddress_${currentUser.phone}`);
      let userAddrList = savedAddr ? JSON.parse(savedAddr) : [];
      if (userAddrList.length === 0) {
        userAddrList = [
          { id: 1, title: 'دفتر کار تهران', text: 'تهران، میدان ونک، خیابان ملاصدرا، ساختمان نگین، واحد ۱۲', phone: '02188442211' },
          { id: 2, title: 'منزل شیراز', text: 'شیراز، شهرک گلستان، خیابان گل آرا، کوچه ۴، پلاک ۱۲', phone: '09176168381' }
        ];
        localStorage.setItem(`dubaiKharidAddress_${currentUser.phone}`, JSON.stringify(userAddrList));
      }
      setAddresses(userAddrList);

      // 3. Seed & Load Support Tickets
      const savedTickets = localStorage.getItem(`dubaiKharidTickets_${currentUser.phone}`);
      let userTickets = savedTickets ? JSON.parse(savedTickets) : [];
      if (userTickets.length === 0) {
        userTickets = [
          {
            id: 'TCK-8721',
            title: 'سوال در مورد ترخیص سفارش ۱۲۵۵',
            msg: 'سلام، زمان حدودی ترخیص بار کارگو سفارش ۱۲۵۵ چه زمانی است؟',
            priority: 'high',
            date: '۱۴۰۳/۰۳/۲۱',
            status: 'answered',
            reply: 'با سلام، محموله این سفارش در حال حاضر در گمرک امام خمینی قرار دارد و فرآیند ترخیص آن حداکثر تا ۲ روز کاری دیگر تکمیل شده و به پست ایران تحویل خواهد شد.'
          }
        ];
        localStorage.setItem(`dubaiKharidTickets_${currentUser.phone}`, JSON.stringify(userTickets));
      }
      setTickets(userTickets);

      // 4. Seed & Load Notifications
      const savedNotifs = localStorage.getItem(`dubaiKharidNotifs_${currentUser.phone}`);
      let userNotifs = savedNotifs ? JSON.parse(savedNotifs) : [];
      if (userNotifs.length === 0) {
        userNotifs = [
          { id: 1, text: 'قیمت نهایی سفارش شماره ۱۲۵۶ اعلام شد.', date: '۱۰ دقیقه پیش', read: false },
          { id: 2, text: 'سفارش شماره ۱۲۵۵ برای شما ارسال شد.', date: '۲ ساعت پیش', read: true },
          { id: 3, text: 'پرداخت سفارش شماره ۱۲۵۴ تایید شد.', date: '۵ ساعت پیش', read: true },
          { id: 4, text: 'درخواست خرید شما ثبت شد.', date: 'دیروز', read: true },
          { id: 5, text: 'سفارش شماره ۱۲۵۲ تحویل شد.', date: '۲ روز پیش', read: true }
        ];
        localStorage.setItem(`dubaiKharidNotifs_${currentUser.phone}`, JSON.stringify(userNotifs));
      }
      setNotifications(userNotifs);

    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Order click expansion handler
  const handleOrderClick = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Submit New Purchase Request
  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!reqUrl || !reqProductName) {
      alert('لطفاً آدرس کالا و نام کالا را وارد کنید.');
      return;
    }

    try {
      const savedLeads = localStorage.getItem('dubaiKharidLeads');
      const leads = savedLeads ? JSON.parse(savedLeads) : [];

      const newId = `DK-${Math.floor(1000 + Math.random() * 9000)}`;
      const newRequest = {
        id: newId,
        customerName: currentUser.name,
        phone: currentUser.phone,
        address: currentUser.address || '',
        totalToman: 0, // Admin calculates this
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'gateway',
        date: new Date().toISOString(),
        productName: reqProductName,
        img: reqImg || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=200&q=80',
        store: reqSite,
        isRequest: true,
        details: reqNotes,
        originalUrl: reqUrl
      };

      const updated = [newRequest, ...leads];
      localStorage.setItem('dubaiKharidLeads', JSON.stringify(updated));

      // Reload
      const userLeads = updated.filter(l => l.phone === currentUser.phone);
      setOrders(userLeads);
      setPurchaseRequests(userLeads.filter(l => l.isRequest));

      // Add Notification
      const currentNotifs = [...notifications];
      const newNotif = { id: Date.now(), text: `درخواست خرید برای "${reqProductName}" با موفقیت ثبت شد.`, date: 'هم‌اکنون', read: false };
      localStorage.setItem(`dubaiKharidNotifs_${currentUser.phone}`, JSON.stringify([newNotif, ...currentNotifs]));
      setNotifications([newNotif, ...currentNotifs]);

      // Reset
      setReqUrl('');
      setReqProductName('');
      setReqImg('');
      setReqNotes('');
      setReqQty(1);
      
      alert(`درخواست خرید شما با شناسه ${newId} ثبت شد. قیمت نهایی پس از بررسی ادمین اعلام خواهد شد.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Cancel purchase request
  const handleCancelRequest = (reqId) => {
    if (!window.confirm('آیا از لغو این درخواست خرید مطمئن هستید؟')) return;

    try {
      const savedLeads = localStorage.getItem('dubaiKharidLeads');
      let leads = savedLeads ? JSON.parse(savedLeads) : [];

      // Update state to cancelled
      leads = leads.map(l => l.id === reqId ? { ...l, status: 'cancelled' } : l);
      localStorage.setItem('dubaiKharidLeads', JSON.stringify(leads));

      // Reload
      const userLeads = leads.filter(l => l.phone === currentUser.phone);
      setOrders(userLeads);
      setPurchaseRequests(userLeads.filter(l => l.isRequest));
    } catch (err) {
      console.error(err);
    }
  };

  // Manage Addresses (Add / Edit / Delete)
  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!addrTitle || !addrText) {
      alert('لطفاً عنوان و آدرس را وارد کنید.');
      return;
    }

    try {
      let updatedAddrList = [...addresses];
      if (editingAddrId) {
        // Edit Mode
        updatedAddrList = updatedAddrList.map(a => a.id === editingAddrId ? { ...a, title: addrTitle, text: addrText, phone: addrPhone } : a);
        setEditingAddrId(null);
      } else {
        // Add Mode
        const newAddr = {
          id: Date.now(),
          title: addrTitle,
          text: addrText,
          phone: addrPhone
        };
        updatedAddrList.push(newAddr);
      }

      localStorage.setItem(`dubaiKharidAddress_${currentUser.phone}`, JSON.stringify(updatedAddrList));
      setAddresses(updatedAddrList);

      // Reset Form
      setAddrTitle('');
      setAddrText('');
      setAddrPhone('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAddressClick = (addr) => {
    setEditingAddrId(addr.id);
    setAddrTitle(addr.title);
    setAddrText(addr.text);
    setAddrPhone(addr.phone || '');
  };

  const handleDeleteAddress = (addrId) => {
    if (!window.confirm('آیا از حذف این آدرس مطمئن هستید؟')) return;
    try {
      const filtered = addresses.filter(a => a.id !== addrId);
      localStorage.setItem(`dubaiKharidAddress_${currentUser.phone}`, JSON.stringify(filtered));
      setAddresses(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Support Ticket
  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!ticketTitle || !ticketMsg) {
      alert('لطفاً عنوان و متن تیکت را وارد کنید.');
      return;
    }

    try {
      const newTicket = {
        id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        title: ticketTitle,
        msg: ticketMsg,
        priority: ticketPriority,
        date: new Date().toLocaleDateString('fa-IR'),
        status: 'pending',
        reply: ''
      };

      const updated = [newTicket, ...tickets];
      localStorage.setItem(`dubaiKharidTickets_${currentUser.phone}`, JSON.stringify(updated));
      setTickets(updated);

      setTicketTitle('');
      setTicketMsg('');
      setTicketPriority('medium');

      alert('تیکت شما با موفقیت ثبت شد و پاسخ آن به زودی در همین بخش قرار خواهد گرفت.');
      
      // Auto reply simulation in 5 seconds
      setTimeout(() => {
        const freshTickets = JSON.parse(localStorage.getItem(`dubaiKharidTickets_${currentUser.phone}`) || '[]');
        const updatedWithReply = freshTickets.map(t => t.id === newTicket.id ? { 
          ...t, 
          status: 'answered', 
          reply: 'سلام خدمت شما کاربر گرامی، درخواست شما به بخش فنی/مالی ارجاع داده شد و همکاران ما در حال پیگیری این موضوع هستند. پیشاپیش از شکیبایی شما سپاسگزاریم.' 
        } : t);
        localStorage.setItem(`dubaiKharidTickets_${currentUser.phone}`, JSON.stringify(updatedWithReply));
        setTickets(updatedWithReply);
      }, 5000);

    } catch (err) {
      console.error(err);
    }
  };

  // Profile info editor
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!editName) {
      alert('وارد کردن نام الزامی است.');
      return;
    }

    try {
      const usersSaved = localStorage.getItem('dubaiKharidUsers');
      let usersList = usersSaved ? JSON.parse(usersSaved) : [];

      const updatedUser = {
        ...currentUser,
        name: editName,
        email: editEmail,
        address: editAddress
      };

      const idx = usersList.findIndex(u => u.phone === currentUser.phone);
      if (idx !== -1) {
        usersList[idx] = updatedUser;
      } else {
        usersList.push(updatedUser);
      }

      localStorage.setItem('dubaiKharidUsers', JSON.stringify(usersList));
      localStorage.setItem('dubaiKharidCurrentUser', JSON.stringify(updatedUser));
      
      alert('مشخصات حساب شما با موفقیت ذخیره شد.');
    } catch (err) {
      console.error(err);
    }
  };

  // Password editor
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('تکرار رمز عبور همخوانی ندارد.');
      return;
    }

    try {
      const usersSaved = localStorage.getItem('dubaiKharidUsers');
      let usersList = usersSaved ? JSON.parse(usersSaved) : [];

      const updatedUser = {
        ...currentUser,
        password: newPassword
      };

      const idx = usersList.findIndex(u => u.phone === currentUser.phone);
      if (idx !== -1) {
        usersList[idx] = updatedUser;
      }

      localStorage.setItem('dubaiKharidUsers', JSON.stringify(usersList));
      localStorage.setItem('dubaiKharidCurrentUser', JSON.stringify(updatedUser));

      setNewPassword('');
      setConfirmPassword('');
      alert('رمز عبور شما با موفقیت تغییر یافت.');
    } catch (err) {
      console.error(err);
    }
  };

  // Pay ready-to-pay lead
  const handlePayOrder = (orderId) => {
    router.push(`/payment?id=${orderId}`);
  };

  // Active status checks
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const pendingRequestsCount = purchaseRequests.filter(r => r.status === 'pending').length;
  const readyToPayCount = orders.filter(o => o.status === 'price_tagged' && o.paymentStatus !== 'paid').length;
  const shippingCount = orders.filter(o => o.status === 'shipped' || o.status === 'local_shipping').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  // Filtered orders list
  const getFilteredOrders = () => {
    if (activeOrderFilter === 'all') return orders;
    
    // Status translation maps
    const map = {
      pending: 'pending',
      price_tagged: 'price_tagged',
      purchased: 'purchased',
      noon_dubai: 'purchased',
      warehouse_dubai: 'processing',
      processing: 'processing',
      shipped: 'shipped',
      customs: 'customs',
      local_shipping: 'local_shipping',
      delivered: 'delivered',
      cancelled: 'cancelled'
    };

    return orders.filter(o => {
      const mapped = map[o.status] || 'pending';
      if (activeOrderFilter === 'pending') return mapped === 'pending';
      if (activeOrderFilter === 'ready_to_pay') return o.status === 'price_tagged' && o.paymentStatus !== 'paid';
      if (activeOrderFilter === 'purchasing') return mapped === 'purchased';
      if (activeOrderFilter === 'shipped_uae') return mapped === 'shipped';
      if (activeOrderFilter === 'customs') return mapped === 'customs';
      if (activeOrderFilter === 'local_shipping') return mapped === 'local_shipping';
      if (activeOrderFilter === 'delivered') return mapped === 'delivered';
      if (activeOrderFilter === 'cancelled') return mapped === 'cancelled';
      return true;
    });
  };

  // Main UI Render
  if (!currentUser) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <div style={{ padding: '150px 20px', textAlign: 'center', color: '#fff' }}>
          در حال بارگذاری اطلاعات پنل...
        </div>
        <Footer />
      </div>
    );
  }

  // Find the single latest order for dashboard visual stepper
  const latestOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContainer} dir="rtl">
        <div className={styles.dashboardGrid}>
          
          {/* RIGHT SIDEBAR PANEL */}
          <aside className={styles.sidebarCard}>
            <div className={styles.userProfileHeader}>
              <img src={currentUser.avatar} alt="avatar" className={styles.profileAvatar} />
              <h2 className={styles.profileName}>{currentUser.name}</h2>
              <span className={styles.profileMeta}>خوش آمدید عزیز</span>
            </div>

            <nav className={styles.sidebarMenu}>
              <button 
                className={`${styles.menuBtn} ${activeMenu === 'dashboard' ? styles.menuBtnActive : ''}`}
                onClick={() => setActiveMenu('dashboard')}
              >
                <div className={styles.menuBtnInner}>
                  {ProfileIcons.dashboard()}
                  <span>داشبورد</span>
                </div>
              </button>

              <button 
                className={`${styles.menuBtn} ${activeMenu === 'orders' ? styles.menuBtnActive : ''}`}
                onClick={() => { setActiveMenu('orders'); setActiveOrderFilter('all'); }}
              >
                <div className={styles.menuBtnInner}>
                  {ProfileIcons.orders()}
                  <span>سفارشات من</span>
                </div>
                {activeOrdersCount > 0 && <span className={styles.badge}>{activeOrdersCount}</span>}
              </button>

              <button 
                className={`${styles.menuBtn} ${activeMenu === 'requests' ? styles.menuBtnActive : ''}`}
                onClick={() => setActiveMenu('requests')}
              >
                <div className={styles.menuBtnInner}>
                  {ProfileIcons.requests()}
                  <span>درخواست‌های خرید</span>
                </div>
                {pendingRequestsCount > 0 && <span className={styles.badge}>{pendingRequestsCount}</span>}
              </button>

              <button 
                className={`${styles.menuBtn} ${activeMenu === 'wishlist' ? styles.menuBtnActive : ''}`}
                onClick={() => setActiveMenu('wishlist')}
              >
                <div className={styles.menuBtnInner}>
                  {ProfileIcons.wishlist()}
                  <span>علاقه‌مندی‌ها</span>
                </div>
                {wishlistItems && wishlistItems.length > 0 && <span className={styles.badge}>{wishlistItems.length}</span>}
              </button>

              <button 
                className={`${styles.menuBtn} ${activeMenu === 'notifications' ? styles.menuBtnActive : ''}`}
                onClick={() => setActiveMenu('notifications')}
              >
                <div className={styles.menuBtnInner}>
                  {ProfileIcons.notifications()}
                  <span>اعلان‌ها</span>
                </div>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className={styles.badge} style={{ background: '#f87820' }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              <button 
                className={`${styles.menuBtn} ${activeMenu === 'payments' ? styles.menuBtnActive : ''}`}
                onClick={() => setActiveMenu('payments')}
              >
                <div className={styles.menuBtnInner}>
                  {ProfileIcons.payments()}
                  <span>پرداخت‌ها</span>
                </div>
              </button>

              <button 
                className={`${styles.menuBtn} ${activeMenu === 'addresses' ? styles.menuBtnActive : ''}`}
                onClick={() => setActiveMenu('addresses')}
              >
                <div className={styles.menuBtnInner}>
                  {ProfileIcons.addresses()}
                  <span>آدرس‌های من</span>
                </div>
              </button>

              <button 
                className={`${styles.menuBtn} ${activeMenu === 'account' ? styles.menuBtnActive : ''}`}
                onClick={() => setActiveMenu('account')}
              >
                <div className={styles.menuBtnInner}>
                  {ProfileIcons.account()}
                  <span>اطلاعات حساب</span>
                </div>
              </button>

              <button 
                className={`${styles.menuBtn} ${activeMenu === 'coupons' ? styles.menuBtnActive : ''}`}
                onClick={() => setActiveMenu('coupons')}
              >
                <div className={styles.menuBtnInner}>
                  {ProfileIcons.coupons()}
                  <span>کدهای تخفیف</span>
                </div>
              </button>

              <button 
                className={`${styles.menuBtn} ${activeMenu === 'support' ? styles.menuBtnActive : ''}`}
                onClick={() => setActiveMenu('support')}
              >
                <div className={styles.menuBtnInner}>
                  {ProfileIcons.support()}
                  <span>پشتیبانی</span>
                </div>
              </button>

              <button 
                className={`${styles.menuBtn} ${styles.logoutBtn}`}
                onClick={() => { logout(); router.push('/'); }}
              >
                <div className={styles.menuBtnInner}>
                  {ProfileIcons.logout()}
                  <span>خروج</span>
                </div>
              </button>
            </nav>
          </aside>

          {/* CENTRAL VIEWS */}
          <section className={styles.contentCard}>

            {/* 1. VIEW: DASHBOARD */}
            {activeMenu === 'dashboard' && (
              <div>
                <div className={styles.welcomeHeader}>
                  <h1 className={styles.welcomeTitle}>داشبورد</h1>
                  <p className={styles.welcomeSubtitle}>{currentUser.name} عزیز، خوش آمدید 👋</p>
                </div>

                {/* Stats row cards */}
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryCard} onClick={() => { setActiveMenu('orders'); setActiveOrderFilter('all'); }}>
                    <div className={styles.summaryText}>
                      <span className={styles.summaryLabel}>سفارشات فعال</span>
                      <span className={styles.summaryValue}>{activeOrdersCount}</span>
                      <span className={styles.summaryAction}>مشاهده همه</span>
                    </div>
                    <div className={styles.iconWrapper} style={{ background: 'rgba(248, 120, 32, 0.1)', color: '#f87820' }}>
                      {ProfileIcons.orders(20)}
                    </div>
                  </div>

                  <div className={styles.summaryCard} onClick={() => setActiveMenu('requests')}>
                    <div className={styles.summaryText}>
                      <span className={styles.summaryLabel}>درخواست‌های خرید</span>
                      <span className={styles.summaryValue}>{pendingRequestsCount}</span>
                      <span className={styles.summaryAction}>مشاهده همه</span>
                    </div>
                    <div className={styles.iconWrapper} style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                      {ProfileIcons.requests(20)}
                    </div>
                  </div>

                  <div className={styles.summaryCard} onClick={() => { setActiveMenu('orders'); setActiveOrderFilter('ready_to_pay'); }}>
                    <div className={styles.summaryText}>
                      <span className={styles.summaryLabel}>آماده پرداخت</span>
                      <span className={styles.summaryValue}>{readyToPayCount}</span>
                      <span className={styles.summaryAction}>مشاهده</span>
                    </div>
                    <div className={styles.iconWrapper} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                      {ProfileIcons.payments(20)}
                    </div>
                  </div>

                  <div className={styles.summaryCard} onClick={() => { setActiveMenu('orders'); setActiveOrderFilter('shipped_uae'); }}>
                    <div className={styles.summaryText}>
                      <span className={styles.summaryLabel}>در حال ارسال</span>
                      <span className={styles.summaryValue}>{shippingCount}</span>
                      <span className={styles.summaryAction}>مشاهده</span>
                    </div>
                    <div className={styles.iconWrapper} style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
                      {ProfileIcons.addresses(20)}
                    </div>
                  </div>

                  <div className={styles.summaryCard} onClick={() => { setActiveMenu('orders'); setActiveOrderFilter('delivered'); }}>
                    <div className={styles.summaryText}>
                      <span className={styles.summaryLabel}>تحویل شده</span>
                      <span className={styles.summaryValue}>{deliveredCount}</span>
                      <span className={styles.summaryAction}>مشاهده همه</span>
                    </div>
                    <div className={styles.iconWrapper} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      {ProfileIcons.wishlist(20)}
                    </div>
                  </div>
                </div>

                {/* Main grids */}
                <div className={styles.dashboardCols}>
                  
                  {/* Left Main column */}
                  <div className={styles.mainPanelCol}>
                    {/* Stepper tracking for last order */}
                    {latestOrder && (
                      <div className={styles.panelCard}>
                        <h3 className={styles.cardHeaderTitle}>آخرین سفارش شما</h3>
                        <div className={styles.stepperContainer}>
                          <div className={styles.stepperProduct}>
                            <div className={styles.prodInfo}>
                              <img src={latestOrder.img} alt="latest" className={styles.prodImg} />
                              <div className={styles.prodMeta}>
                                <span className={styles.prodName}>{latestOrder.productName}</span>
                                <span className={styles.prodSub}>ثبت شده در: {new Date(latestOrder.date).toLocaleDateString('fa-IR')}</span>
                              </div>
                            </div>
                            <button className={styles.trackDetailsBtn} onClick={() => { setActiveMenu('orders'); setExpandedOrderId(latestOrder.id); }}>
                              مشاهده جزئیات
                            </button>
                          </div>

                          {/* Stepper progress indicator */}
                          <div className={styles.stepperProgressRow}>
                            <div className={styles.stepperLine}></div>
                            <div 
                              className={styles.stepperFill}
                              style={{ width: `${Math.max(0, (getDashboardStep(latestOrder.status) - 1) * 20)}%` }}
                            ></div>

                            {DASHBOARD_STEPS.map((s) => {
                              const activeStep = getDashboardStep(latestOrder.status);
                              const isCompleted = s.step < activeStep;
                              const isActive = s.step === activeStep;

                              return (
                                <div key={s.step} className={`${styles.stepperStep} ${isCompleted ? styles.stepCompleted : ''} ${isActive ? styles.stepActive : ''}`}>
                                  <div className={styles.stepIconDot}>
                                    {isCompleted ? '✓' : isActive ? '●' : ProfileIcons.lock(12)}
                                  </div>
                                  <span className={styles.stepLabelText}>{s.text}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Stepper Action Bar */}
                          <div className={styles.stepperStatusFooter}>
                            <div style={{ textAlign: 'right' }}>
                              <div className={styles.statusTextLabel}>وضعیت فعلی:</div>
                              <div className={styles.statusValueText}>
                                {latestOrder.status === 'price_tagged' ? 'قیمت نهایی اعلام شد' : latestOrder.status === 'pending' ? 'در حال بررسی' : 'خرید و بسته‌بندی در دبی'}
                              </div>
                            </div>
                            {latestOrder.status === 'price_tagged' && latestOrder.paymentStatus !== 'paid' && (
                              <button className={styles.payActiveBtn} onClick={() => handlePayOrder(latestOrder.id)}>
                                مشاهده و پرداخت
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Orders table */}
                    <div className={styles.panelCard}>
                      <h3 className={styles.cardHeaderTitle}>سفارشات اخیر شما</h3>
                      {orders.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#8b92a5' }}>هنوز سفارشی ثبت نکرده‌اید.</div>
                      ) : (
                        <div className={styles.tableContainer}>
                          <table className={styles.recentOrdersTable}>
                            <thead>
                              <tr>
                                <th>سفارش</th>
                                <th>تاریخ</th>
                                <th>مبلغ</th>
                                <th>وضعیت</th>
                                <th>وضعیت سفارش</th>
                                <th>عملیات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.slice(0, 5).map(o => (
                                <tr key={o.id}>
                                  <td>
                                    <div className={styles.tableProdName}>
                                      <img src={o.img} alt="thumbnail" className={styles.tableProdImg} />
                                      <div>
                                        <span style={{ fontWeight: 'bold', color: '#fff', display: 'block' }}>{o.productName}</span>
                                        <span style={{ fontSize: '10px', color: '#8b92a5' }}>#{o.id}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>{new Date(o.date).toLocaleDateString('fa-IR')}</td>
                                  <td style={{ fontWeight: 'bold', color: '#f87820' }}>{o.totalToman > 0 ? `${fmtToman(o.totalToman)} تومان` : 'در انتظار محاسبه'}</td>
                                  <td>{o.paymentStatus === 'paid' ? '● پرداخت شده' : '● قیمت اعلام شده'}</td>
                                  <td>
                                    <span style={{
                                      fontSize: '11px',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      background: o.status === 'price_tagged' ? 'rgba(59,130,246,0.1)' : o.status === 'delivered' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)',
                                      color: o.status === 'price_tagged' ? '#3b82f6' : o.status === 'delivered' ? '#10b981' : '#f97316',
                                      fontWeight: 'bold'
                                    }}>
                                      {o.status === 'price_tagged' ? 'آماده پرداخت' : o.status === 'delivered' ? 'تحویل شده' : o.status === 'pending' ? 'در حال بررسی' : 'در حال ارسال'}
                                    </span>
                                  </td>
                                  <td>
                                    <button className={styles.tableActionBtn} onClick={() => { setActiveMenu('orders'); setExpandedOrderId(o.id); }}>
                                      مشاهده
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {orders.length > 5 && (
                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                              <span 
                                onClick={() => setActiveMenu('orders')} 
                                style={{ color: '#f87820', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                              >
                                مشاهده همه سفارشات ←
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side Column */}
                  <div className={styles.sidePanelCol}>
                    {/* Recent activities log */}
                    <div className={styles.panelCard}>
                      <h3 className={styles.cardHeaderTitle}>آخرین فعالیت‌ها</h3>
                      <div className={styles.activityList}>
                        {notifications.slice(0, 5).map(n => (
                          <div key={n.id} className={styles.activityItem}>
                            <div className={styles.activityIcon} style={{ background: 'rgba(248,120,32,0.1)', color: '#f87820' }}>
                              ⚡
                            </div>
                            <div className={styles.activityText}>
                              <p className={styles.activityDesc}>{n.text}</p>
                              <span className={styles.activityTime}>{n.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Support widget */}
                    <div className={styles.panelCard}>
                      <h3 className={styles.cardHeaderTitle} style={{ marginBottom: '8px' }}>پشتیبانی سریع</h3>
                      <p style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '16px', textAlign: 'right' }}>هر سوالی دارید ما در خدمت شما هستیم</p>
                      <div className={styles.supportWidget}>
                        <button className={`${styles.supportBtn} ${styles.ticketBtn}`} onClick={() => setActiveMenu('support')}>
                          ثبت تیکت
                        </button>
                        <a 
                          href="https://wa.me/971501234567" 
                          target="_blank" 
                          rel="noreferrer" 
                          className={`${styles.supportBtn} ${styles.whatsappBtn}`}
                          style={{ textDecoration: 'none' }}
                        >
                          چت واتساپ
                        </a>
                      </div>
                    </div>

                    {/* Banner Card widget */}
                    <div className={styles.bannerWidget}>
                      <h4 className={styles.bannerTitle}>کالاهای شما در راه است</h4>
                      <p className={styles.bannerDesc}>سفارشات خود را آنلاین دنبال کنید</p>
                      <button className={styles.bannerBtn} onClick={() => setActiveMenu('orders')}>
                        پیگیری سفارش
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2. VIEW: MY ORDERS */}
            {activeMenu === 'orders' && (
              <div>
                <h2 className={styles.welcomeTitle} style={{ marginBottom: '24px' }}>سفارشات من</h2>
                
                {/* Horizontal tabs */}
                <div className={styles.filterTabs}>
                  {[
                    { id: 'all', text: 'همه' },
                    { id: 'pending', text: 'در انتظار بررسی' },
                    { id: 'ready_to_pay', text: 'آماده پرداخت' },
                    { id: 'purchasing', text: 'در حال خرید' },
                    { id: 'shipped_uae', text: 'در حال ارسال از امارات' },
                    { id: 'customs', text: 'در حال ترخیص' },
                    { id: 'local_shipping', text: 'ارسال داخل ایران' },
                    { id: 'delivered', text: 'تحویل شده' },
                    { id: 'cancelled', text: 'لغو شده' }
                  ].map(t => (
                    <button 
                      key={t.id} 
                      className={`${styles.filterTabBtn} ${activeOrderFilter === t.id ? styles.filterTabBtnActive : ''}`}
                      onClick={() => setActiveOrderFilter(t.id)}
                    >
                      {t.text}
                    </button>
                  ))}
                </div>

                {/* Orders list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {getFilteredOrders().length === 0 ? (
                    <div className={styles.panelCard} style={{ textAlign: 'center', padding: '60px', color: '#8b92a5' }}>
                      هیچ سفارشی در این دسته‌بندی یافت نشد.
                    </div>
                  ) : (
                    getFilteredOrders().map(o => {
                      const isExpanded = expandedOrderId === o.id;
                      const stepIdx = getDetailedStepIndex(o.status);

                      return (
                        <div key={o.id} style={{ display: 'flex', flexDirection: 'column' }}>
                          {/* Top Row Card */}
                          <div 
                            className={styles.panelCard} 
                            style={{ 
                              cursor: 'pointer', 
                              borderColor: isExpanded ? '#f87820' : 'rgba(255,255,255,0.05)',
                              background: isExpanded ? 'rgba(248, 120, 32, 0.03)' : 'rgba(13, 8, 28, 0.55)',
                              transition: 'all 0.25s' 
                            }}
                            onClick={() => handleOrderClick(o.id)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <img src={o.img} alt="thumbnail" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', display: 'block' }}>{o.productName}</span>
                                  <span style={{ fontSize: '11px', color: '#8b92a5' }}>کد سفارش: <strong style={{ color: '#ff9d00', fontFamily: 'monospace' }}>#{o.id}</strong> | تاریخ: {new Date(o.date).toLocaleDateString('fa-IR')}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ textItems: 'right' }}>
                                  <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>مبلغ کل:</span>
                                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#f87820' }}>
                                    {o.totalToman > 0 ? `${fmtToman(o.totalToman)} تومان` : 'در انتظار محاسبه'}
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: '11px',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontWeight: 'bold',
                                  background: o.status === 'price_tagged' ? 'rgba(59, 130, 246, 0.1)' : o.status === 'delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                                  color: o.status === 'price_tagged' ? '#3b82f6' : o.status === 'delivered' ? '#10b981' : '#f97316'
                                }}>
                                  {o.status === 'price_tagged' ? 'آماده پرداخت' : o.status === 'delivered' ? 'تحویل شده' : o.status === 'pending' ? 'در حال بررسی' : 'در حال ترخیص/ارسال'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Expanded 10-Step Timeline Details */}
                          {isExpanded && (
                            <div className={styles.orderDetailCard}>
                              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#fff', margin: '0 0 24px 0', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                                وضعیت لحظه‌ای سفارش (مسیر ترخیص و کارگو هوایی)
                              </h4>

                              {o.status === 'cancelled' ? (
                                <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.06)', border: '1px dashed rgba(239,68,68,0.2)', padding: '16px', borderRadius: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                  ❌ این سفارش به علت انصراف شما یا مغایرت قوانین گمرکی لغو شده است.
                                </div>
                              ) : (
                                <div className={styles.detailedTimeline}>
                                  <div className={styles.detailedLine}></div>
                                  <div 
                                    className={styles.detailedFill}
                                    style={{ width: `${Math.max(0, (stepIdx - 1) * 11.11)}%` }}
                                  ></div>

                                  {DETAILED_STEPS.map((s, idx) => {
                                    const isCompleted = (idx + 1) < stepIdx;
                                    const isActive = (idx + 1) === stepIdx;

                                    return (
                                      <div key={s.id} className={`${styles.detailedStep} ${isCompleted ? styles.detailedStepCompleted : ''} ${isActive ? styles.detailedStepActive : ''}`}>
                                        <div className={styles.detailedStepIcon}>
                                          {isCompleted ? '✓' : isActive ? '●' : ProfileIcons.lock(10)}
                                        </div>
                                        <span className={styles.detailedStepLabel}>{s.text}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Details info */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '16px', marginTop: '24px' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>فروشگاه مبدا:</span>
                                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{o.store || 'نون امارات (Noon)'}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>آدرس ارسال در ایران:</span>
                                  <span style={{ fontSize: '12px', color: '#d1d5db', lineHeight: '1.4' }}>{o.address || 'ثبت نشده'}</span>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                  <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>وضعیت پرداخت:</span>
                                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: o.paymentStatus === 'paid' ? '#10b981' : '#f97316' }}>
                                    {o.paymentStatus === 'paid' ? '💳 تایید شده آنلاین' : '⏳ در انتظار پرداخت'}
                                  </span>
                                  {o.status === 'price_tagged' && o.paymentStatus !== 'paid' && (
                                    <button 
                                      className={styles.payActiveBtn} 
                                      style={{ marginTop: '8px', padding: '6px 14px', fontSize: '10.5px' }}
                                      onClick={() => handlePayOrder(o.id)}
                                    >
                                      پرداخت آنلاین فاکتور
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 3. VIEW: PURCHASE REQUESTS */}
            {activeMenu === 'requests' && (
              <div>
                <h2 className={styles.welcomeTitle} style={{ marginBottom: '24px' }}>ثبت درخواست خرید محصول خارجی</h2>
                
                {/* Form to submit request */}
                <form className={styles.requestSubmitForm} onSubmit={handleSubmitRequest}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '16px', textAlign: 'right' }}>اطلاعات کالا در سایتهای امارات (آمازون، نون و...):</h3>
                  
                  <div className={styles.formRowFull}>
                    <label className={styles.label}>لینک صفحه محصول *</label>
                    <input 
                      type="url" 
                      className={styles.inputField} 
                      placeholder="https://www.amazon.ae/dp/..."
                      value={reqUrl}
                      onChange={(e) => setReqUrl(e.target.value)}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>نام محصول *</label>
                      <input 
                        type="text" 
                        className={styles.inputField} 
                        placeholder="مثال: کفش ورزشی نایک زنانه"
                        value={reqProductName}
                        onChange={(e) => setReqProductName(e.target.value)}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>فروشگاه مبدا</label>
                      <select 
                        className={styles.inputField}
                        value={reqSite}
                        onChange={(e) => setReqSite(e.target.value)}
                        style={{ cursor: 'pointer', background: '#1c1926' }}
                      >
                        <option value="Amazon.ae">آمازون امارات (Amazon.ae)</option>
                        <option value="Noon.com">نون امارات (Noon.com)</option>
                        <option value="Namshi.com">نمشی (Namshi)</option>
                        <option value="Adidas.ae">آدیداس دبی</option>
                        <option value="Apple.com">اپل استور امارات</option>
                        <option value="Other">سایر فروشگاه‌ها</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>تعداد</label>
                      <input 
                        type="number" 
                        min="1"
                        className={styles.inputField} 
                        value={reqQty}
                        onChange={(e) => setReqQty(parseInt(e.target.value))}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>لینک تصویر محصول (اختیاری)</label>
                      <input 
                        type="url" 
                        className={styles.inputField} 
                        placeholder="https://image-url.com/pic.jpg"
                        value={reqImg}
                        onChange={(e) => setReqImg(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.formRowFull}>
                    <label className={styles.label}>توضیحات تکمیلی (سایز، رنگ، گارانتی یا مشخصات فنی)</label>
                    <textarea 
                      className={`${styles.inputField} ${styles.textareaField}`}
                      placeholder="رنگ مشکی، سایز ۴۲ مردانه و..."
                      value={reqNotes}
                      onChange={(e) => setReqNotes(e.target.value)}
                    />
                  </div>

                  <button type="submit" className={styles.saveBtn}>
                    🚀 ثبت درخواست خرید
                  </button>
                </form>

                {/* Requests list */}
                <div className={styles.panelCard}>
                  <h3 className={styles.cardHeaderTitle}>لیست درخواست‌های ارسال شده</h3>
                  {purchaseRequests.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#8b92a5' }}>هنوز هیچ درخواست خریدی ثبت نکرده‌اید.</div>
                  ) : (
                    <div className={styles.tableContainer}>
                      <table className={styles.recentOrdersTable}>
                        <thead>
                          <tr>
                            <th>محصول درخواستی</th>
                            <th>سایت مبدا</th>
                            <th>تاریخ ثبت</th>
                            <th>وضعیت قیمت</th>
                            <th>مبلغ نهایی</th>
                            <th>عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseRequests.map(r => (
                            <tr key={r.id}>
                              <td>
                                <div className={styles.tableProdName}>
                                  <img src={r.img} alt="thumb" className={styles.tableProdImg} />
                                  <div>
                                    <span style={{ fontWeight: 'bold', color: '#fff', display: 'block' }}>{r.productName}</span>
                                    <span style={{ fontSize: '10px', color: '#8b92a5' }}>شناسه: #{r.id}</span>
                                  </div>
                                </div>
                              </td>
                              <td>{r.store}</td>
                              <td>{new Date(r.date).toLocaleDateString('fa-IR')}</td>
                              <td>
                                <span style={{
                                  fontSize: '11px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: r.status === 'price_tagged' ? 'rgba(16,185,129,0.1)' : r.status === 'cancelled' ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
                                  color: r.status === 'price_tagged' ? '#10b981' : r.status === 'cancelled' ? '#ef4444' : '#f97316',
                                  fontWeight: 'bold'
                                }}>
                                  {r.status === 'price_tagged' ? 'محاسبه شده' : r.status === 'cancelled' ? 'لغو شده' : 'در انتظار بررسی'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 'bold', color: '#f87820' }}>
                                {r.totalToman > 0 ? `${fmtToman(r.totalToman)} تومان` : '⏳ در حال محاسبه'}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {r.status === 'price_tagged' && r.paymentStatus !== 'paid' && (
                                    <button 
                                      className={styles.payActiveBtn}
                                      style={{ padding: '4px 10px', fontSize: '10.5px' }}
                                      onClick={() => handlePayOrder(r.id)}
                                    >
                                      پرداخت آنلاین
                                    </button>
                                  )}
                                  {r.status === 'pending' && (
                                    <button 
                                      className={styles.tableActionBtn}
                                      style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                                      onClick={() => handleCancelRequest(r.id)}
                                    >
                                      لغو درخواست
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. VIEW: WISHLIST */}
            {activeMenu === 'wishlist' && (
              <div>
                <h2 className={styles.welcomeTitle} style={{ marginBottom: '24px' }}>علاقه‌مندی‌های من</h2>
                
                {wishlistItems && wishlistItems.length === 0 ? (
                  <div className={styles.panelCard} style={{ textAlign: 'center', padding: '60px', color: '#8b92a5' }}>
                    هنوز هیچ محصولی را به علاقه‌مندی‌های خود اضافه نکرده‌اید.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {wishlistItems.map(item => (
                      <div key={item.id} className={styles.panelCard} style={{ position: 'relative' }}>
                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' }} />
                        <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#fff', display: 'block', height: '36px', overflow: 'hidden', textAlign: 'right' }}>{item.name}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '900', color: '#f87820' }}>{fmtToman(item.price)} تومان</span>
                          <button 
                            onClick={() => toggleWishlist(item)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            ❤️ حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. VIEW: NOTIFICATIONS */}
            {activeMenu === 'notifications' && (
              <div>
                <h2 className={styles.welcomeTitle} style={{ marginBottom: '24px' }}>اعلان‌ها و رویدادها</h2>
                <div className={styles.panelCard}>
                  <div className={styles.activityList}>
                    {notifications.map(n => (
                      <div key={n.id} className={styles.activityItem} style={{ padding: '16px 0' }}>
                        <div className={styles.activityIcon} style={{ background: n.read ? 'rgba(255,255,255,0.03)' : 'rgba(248,120,32,0.1)', color: n.read ? '#8b92a5' : '#f87820' }}>
                          🔔
                        </div>
                        <div className={styles.activityText}>
                          <p className={styles.activityDesc} style={{ fontWeight: n.read ? 'normal' : 'bold' }}>{n.text}</p>
                          <span className={styles.activityTime}>{n.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. VIEW: PAYMENTS */}
            {activeMenu === 'payments' && (
              <div>
                <h2 className={styles.welcomeTitle} style={{ marginBottom: '24px' }}>تراکنش‌ها و پرداخت‌ها</h2>
                <div className={styles.panelCard}>
                  <div className={styles.tableContainer}>
                    <table className={styles.recentOrdersTable}>
                      <thead>
                        <tr>
                          <th>شماره تراکنش</th>
                          <th>سفارش</th>
                          <th>تاریخ پرداخت</th>
                          <th>مبلغ پرداخت شده</th>
                          <th>وضعیت</th>
                          <th>رسید</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.filter(o => o.paymentStatus === 'paid').map(o => (
                          <tr key={o.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>TRX-{Math.floor(100000 + Math.random() * 900000)}</td>
                            <td>{o.productName}</td>
                            <td>{new Date(o.date).toLocaleDateString('fa-IR')}</td>
                            <td style={{ fontWeight: 'bold', color: '#10b981' }}>{fmtToman(o.totalToman)} تومان</td>
                            <td>
                              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>✓ پرداخت موفق</span>
                            </td>
                            <td>
                              <a 
                                href={`#download-invoice-${o.id}`}
                                onClick={(e) => { e.preventDefault(); alert('دانلود رسید پرداخت آغاز شد (فایل شبیه‌سازی شده PDF)...'); }}
                                style={{ fontSize: '11.5px', color: '#f87820', fontWeight: 'bold', textDecoration: 'none' }}
                              >
                                📥 دانلود رسید
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 7. VIEW: ADDRESSES */}
            {activeMenu === 'addresses' && (
              <div>
                <h2 className={styles.welcomeTitle} style={{ marginBottom: '24px' }}>دفترچه آدرس‌های من</h2>
                
                {/* Form to add address */}
                <form className={styles.requestSubmitForm} onSubmit={handleSaveAddress}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '16px', textAlign: 'right' }}>
                    {editingAddrId ? 'ویرایش آدرس جاری' : 'افزودن آدرس جدید جهت تحویل سفارش'}
                  </h3>
                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>عنوان آدرس (مثال: خانه، محل کار)</label>
                      <input 
                        type="text" 
                        className={styles.inputField} 
                        placeholder="منزل پدری و..."
                        value={addrTitle}
                        onChange={(e) => setAddrTitle(e.target.value)}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>شماره تماس تحویل‌گیرنده</label>
                      <input 
                        type="tel" 
                        className={styles.inputField} 
                        placeholder="09121112233"
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.formRowFull}>
                    <label className={styles.label}>آدرس کامل پستی</label>
                    <textarea 
                      className={`${styles.inputField} ${styles.textareaField}`}
                      placeholder="استان، شهر، خیابان اصلی، پلاک، واحد و کد پستی"
                      value={addrText}
                      onChange={(e) => setAddrText(e.target.value)}
                    />
                  </div>
                  <button type="submit" className={styles.saveBtn}>
                    {editingAddrId ? '✓ بروزرسانی آدرس' : '➕ ثبت آدرس جدید'}
                  </button>
                  {editingAddrId && (
                    <button 
                      type="button" 
                      className={styles.tableActionBtn} 
                      style={{ marginRight: '10px', height: '40px' }}
                      onClick={() => { setEditingAddrId(null); setAddrTitle(''); setAddrText(''); setAddrPhone(''); }}
                    >
                      انصراف
                    </button>
                  )}
                </form>

                {/* Addresses grid */}
                <div className={styles.addressGrid}>
                  {addresses.map(a => (
                    <div key={a.id} className={styles.addressCard}>
                      <div className={styles.addressHeader}>
                        <strong style={{ color: '#fff', fontSize: '13px' }}>{a.title}</strong>
                        <div className={styles.addressActions}>
                          <button className={`${styles.actionBtnText} ${styles.editAddrBtn}`} onClick={() => handleEditAddressClick(a)}>
                            ویرایش
                          </button>
                          <button className={`${styles.actionBtnText} ${styles.deleteAddrBtn}`} onClick={() => handleDeleteAddress(a.id)}>
                            حذف
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', color: '#c9ccd8', margin: '0 0 8px 0', lineHeight: '1.5', textAlign: 'right' }}>{a.text}</p>
                      {a.phone && <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', textAlign: 'right' }}>📞 تلفن: {a.phone}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. VIEW: ACCOUNT INFO */}
            {activeMenu === 'account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className={styles.panelCard}>
                  <h3 className={styles.sectionTitle} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>اطلاعات حساب کاربری</h3>
                  <form onSubmit={handleUpdateProfile}>
                    <div className={styles.formRow}>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>نام و نام خانوادگی:</label>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={styles.inputField} 
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>شماره موبایل (غیرقابل ویرایش):</label>
                        <input 
                          type="text" 
                          value={editPhone}
                          className={`${styles.inputField} ${styles.inputFieldDisabled}`}
                          disabled
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className={styles.formRowFull}>
                      <label className={styles.label}>آدرس ایمیل:</label>
                      <input 
                        type="email" 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className={styles.inputField} 
                        dir="ltr"
                        style={{ textAlign: 'right' }}
                      />
                    </div>
                    <div className={styles.formRowFull}>
                      <label className={styles.label}>آدرس پیش‌فرض جهت ارسال سفارشات:</label>
                      <textarea 
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className={`${styles.inputField} ${styles.textareaField}`}
                      />
                    </div>
                    <button type="submit" className={styles.saveBtn} style={{ marginTop: '10px' }}>
                      ذخیره اطلاعات پروفایل
                    </button>
                  </form>
                </div>

                <div className={styles.panelCard}>
                  <h3 className={styles.sectionTitle} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>تغییر رمز عبور ورود به پنل</h3>
                  <form onSubmit={handleChangePassword}>
                    <div className={styles.formRow}>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>رمز عبور جدید:</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={styles.inputField} 
                          placeholder="حداقل ۶ کاراکتر"
                          dir="ltr"
                          style={{ textAlign: 'right' }}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>تکرار رمز عبور جدید:</label>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={styles.inputField} 
                          placeholder="تکرار رمز عبور"
                          dir="ltr"
                          style={{ textAlign: 'right' }}
                        />
                      </div>
                    </div>
                    <button type="submit" className={styles.saveBtn} style={{ marginTop: '10px' }}>
                      تغییر رمز عبور
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 9. VIEW: DISCOUNT CODES */}
            {activeMenu === 'coupons' && (
              <div>
                <h2 className={styles.welcomeTitle} style={{ marginBottom: '24px' }}>کدهای تخفیف و جوایز</h2>
                
                {/* Horizontal tabs */}
                <div className={styles.filterTabs}>
                  <button 
                    className={`${styles.filterTabBtn} ${activeCouponFilter === 'active' ? styles.filterTabBtnActive : ''}`}
                    onClick={() => setActiveCouponFilter('active')}
                  >
                    کدهای فعال و آماده استفاده
                  </button>
                  <button 
                    className={`${styles.filterTabBtn} ${activeCouponFilter === 'used' ? styles.filterTabBtnActive : ''}`}
                    onClick={() => setActiveCouponFilter('used')}
                  >
                    تاریخچه کدهای استفاده شده
                  </button>
                </div>

                {activeCouponFilter === 'active' ? (
                  <div className={styles.couponList}>
                    <div className={styles.couponCard}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '13px', display: 'block', marginBottom: '6px' }}>کد خوش‌آمدگویی دبی‌خرید</strong>
                        <span style={{ fontSize: '11px', color: '#8b92a5' }}>کد تخفیف ۱۰ درصدی برای اولین سفارش خرید دبی</span>
                      </div>
                      <span className={styles.couponCode}>DUBAISTART</span>
                    </div>

                    <div className={styles.couponCard}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '13px', display: 'block', marginBottom: '6px' }}>تخفیف ویژه کارگو هوایی</strong>
                        <span style={{ fontSize: '11px', color: '#8b92a5' }}>تخفیف ۱۵ درصدی حمل کالا برای محصولات سنگین وزن</span>
                      </div>
                      <span className={styles.couponCode}>CARGO15</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.couponList}>
                    <div className={styles.couponCard} style={{ opacity: 0.6 }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '13px', display: 'block', marginBottom: '6px' }}>کد جشنواره نوروز</strong>
                        <span style={{ fontSize: '11px', color: '#8b92a5' }}>استفاده شده در سفارش #1252</span>
                      </div>
                      <span className={styles.couponCode} style={{ textDecoration: 'line-through' }}>NOWRUZ1403</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 10. VIEW: SUPPORT */}
            {activeMenu === 'support' && (
              <div>
                <h2 className={styles.welcomeTitle} style={{ marginBottom: '24px' }}>پشتیبانی کاربری و تیکت‌ها</h2>
                
                {/* Submit ticket form */}
                <form className={styles.requestSubmitForm} onSubmit={handleSubmitTicket}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '16px', textAlign: 'right' }}>ثبت تیکت پشتیبانی جدید</h3>
                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>موضوع تیکت *</label>
                      <input 
                        type="text" 
                        className={styles.inputField} 
                        placeholder="مثال: سوال در مورد رهگیری هوایی"
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>اولویت بررسی</label>
                      <select 
                        className={styles.inputField}
                        value={ticketPriority}
                        onChange={(e) => setTicketPriority(e.target.value)}
                        style={{ cursor: 'pointer', background: '#1c1926' }}
                      >
                        <option value="low">کم اهمیت</option>
                        <option value="medium">متوسط</option>
                        <option value="high">فوری / اضطراری</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.formRowFull}>
                    <label className={styles.label}>متن پیام *</label>
                    <textarea 
                      className={`${styles.inputField} ${styles.textareaField}`}
                      placeholder="متن پیام خود را بنویسید..."
                      value={ticketMsg}
                      onChange={(e) => setTicketMsg(e.target.value)}
                    />
                  </div>
                  <button type="submit" className={styles.saveBtn}>
                    ✉️ ارسال تیکت پشتیبانی
                  </button>
                </form>

                {/* Tickets list */}
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#fff', marginBottom: '16px', textAlign: 'right' }}>تیکت‌های ارسال شده شما:</h3>
                  {tickets.map(t => (
                    <div key={t.id} className={styles.ticketBox}>
                      <div className={styles.ticketHeader}>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '13px' }}>{t.title}</strong>
                          <span style={{ fontSize: '10px', color: '#8b92a5', marginRight: '10px' }}>کد تیکت: #{t.id}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#8b92a5', marginLeft: '12px' }}>تاریخ: {t.date}</span>
                          <span style={{
                            fontSize: '10.5px',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontWeight: 'bold',
                            background: t.status === 'answered' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)',
                            color: t.status === 'answered' ? '#10b981' : '#f97316'
                          }}>
                            {t.status === 'answered' ? 'پاسخ داده شده' : 'در انتظار پاسخ'}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', color: '#d1d5db', lineHeight: '1.5', margin: '0 0 12px 0', textAlign: 'right' }}>{t.msg}</p>
                      
                      {t.reply && (
                        <div className={styles.ticketAnswer}>
                          <strong style={{ color: '#f87820', fontSize: '11px', display: 'block', marginBottom: '4px', textAlign: 'right' }}>پاسخ پشتیبان دبی‌خرید:</strong>
                          <p style={{ fontSize: '11.5px', color: '#fff', margin: 0, lineHeight: '1.5', textAlign: 'right' }}>{t.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{padding: '100px', textAlign: 'center', color: '#fff'}}>در حال بارگذاری پنل کاربری...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
