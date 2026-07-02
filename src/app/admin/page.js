'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllProducts, laptops } from '@/data/products';
import styles from './Admin.module.css';
import { useSiteSettings } from '@/context/SiteSettingsContext';

// Premium Monochrome Line Icons matching the sidebar SVG style
const AdminIcons = {
  laptop: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="2" y1="20" x2="22" y2="20" />
      <line x1="12" y1="17" x2="12" y2="20" />
    </svg>
  ),
  chart: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  plus: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  circle: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  lock: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  dollar: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  eye: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  edit: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  chat: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  bank: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  phone: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  card: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  download: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  upload: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  mail: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  search: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  sliders: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  user: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  calendar: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  settings: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  bag: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  package: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08" />
      <polygon points="12 12 21 6.92 21 17.08 12 22.08" />
      <polygon points="12 12 3 6.92 12 1.84 21 6.92 12 12" />
    </svg>
  ),
  plane: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
    </svg>
  ),
  truck: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  clipboard: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  back: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  users: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  message: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  file: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  check: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  close: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  alert: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  printer: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  trendingUp: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  trendingDown: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  cart: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  folder: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  key: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  crown: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    </svg>
  ),
  scale: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="5" y1="7" x2="19" y2="7" />
      <path d="M5 7L2 17h6zM19 7l-3 10h6z" />
    </svg>
  ),
  tag: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  clock: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  camera: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  cloud: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  ),
  chevronDown: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  chevronUp: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  building: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="22" x2="9" y2="16" />
      <line x1="15" y1="22" x2="15" y2="16" />
      <line x1="9" y1="16" x2="15" y2="16" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M12 6h.01M12 10h.01" />
    </svg>
  ),
  receipt: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
      <path d="M16 8H8M16 12H8M12 16H8" />
    </svg>
  ),
  star: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  sync: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  whatsapp: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  bell: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  logout: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
  plus: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
};


// Default initial orders/leads seed
const INITIAL_LEADS_SEED = [
  {
    id: 'DK-1256',
    customerName: 'علی محمدی',
    phone: '09123456789',
    address: 'تهران، سعادت آباد، خیابان بخشایش، کوچه ۱۵، پلاک ۲۴، واحد ۵',
    notes: 'رنگ مشکی Midnight، سایز ۴۵ میلی‌متری. لطفاً با بسته‌بندی حباب‌دار ارسال شود.',
    productName: 'Apple Watch Series 9',
    brand: 'Apple',
    weight: 0.15,
    totalToman: 28450000,
    priceAed: 1350,
    date: '2026-05-31T07:30:00Z', // 1403/03/20 11:30 Farsi
    status: 'pending', // در انتظار بررسی
    paymentMethod: 'gateway',
    trackingNum: '71569874521',
    paymentStatus: 'paid',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80',
    store: 'از Amazon.ae',
    items: [
      { name: 'Apple Watch Series 9', brand: 'Apple', quantity: 1, color: 'Midnight', size: '45mm', priceAed: 1350, discountPercent: 0 }
    ],
    priceDetails: {
      product: 23500000,
      shipping: 2500000,
      commission: 2450000
    }
  },
  {
    id: 'DK-1255',
    customerName: 'سمیرا احمدی',
    phone: '09351234567',
    address: 'شیراز، معالی آباد، مجتمع تجاری آفتاب، واحد ۱۲',
    notes: 'گوشی آیفون ۱۵ پرو مکس ۲۵۶ گیگابایت رنگ نچرال تیتانیوم پارت نامبر CH/A.',
    productName: 'iPhone 15 Pro Max',
    brand: 'Apple',
    weight: 0.22,
    totalToman: 65300000,
    priceAed: 3100,
    date: '2026-05-31T06:15:00Z', // 1403/03/20 10:15
    status: 'price_tagged', // قیمت گذاری شده
    paymentMethod: 'card',
    trackingNum: '81523478951',
    paymentStatus: 'pending',
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=80&q=80',
    store: 'از Noon.com',
    items: [
      { name: 'iPhone 15 Pro Max 256GB', brand: 'Apple', quantity: 1, color: 'Natural Titanium', size: 'CH/A', priceAed: 3100, discountPercent: 0 }
    ],
    priceDetails: {
      product: 59000000,
      shipping: 3500000,
      commission: 2800000
    }
  },
  {
    id: 'DK-1254',
    customerName: 'رضا حسینی',
    phone: '09109876543',
    address: 'اصفهان، خیابان خاقانی، کوچه افشین، پلاک ۴، طبقه ۲',
    notes: 'کفش نایک ایر مکس ۲۷۰ سایز ۴۲.۵ رنگ مشکی-سبز.',
    productName: 'Nike Air Max 270',
    brand: 'Nike',
    weight: 0.85,
    totalToman: 12750000,
    priceAed: 610,
    date: '2026-05-30T19:45:00Z', // 1403/03/19 23:45
    status: 'approved', // تایید شده
    paymentMethod: 'gateway',
    trackingNum: '91567842365',
    paymentStatus: 'paid',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&q=80',
    store: 'از Namshi.com',
    items: [
      { name: 'Nike Air Max 270', brand: 'Nike', quantity: 1, color: 'Black-Green', size: '42.5', priceAed: 610, discountPercent: 0 }
    ],
    priceDetails: {
      product: 10500000,
      shipping: 1100000,
      commission: 1150000
    }
  },
  {
    id: 'DK-1253',
    customerName: 'مبینا رضایی',
    phone: '09337894512',
    address: 'مشهد، بلوار سجاد، خیابان بهار، پلاک ۱۵',
    notes: 'کوله پشتی نورث فیس رنگ مشکی سایز بزرگ.',
    productName: 'The North Face Backpack',
    brand: 'The North Face',
    weight: 0.9,
    totalToman: 9800000,
    priceAed: 460,
    date: '2026-05-30T17:20:00Z', // 1403/03/19 21:20
    status: 'purchased', // خرید شده
    paymentMethod: 'gateway',
    trackingNum: '61523456891',
    paymentStatus: 'paid',
    img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=80&q=80',
    store: 'از Amazon.ae',
    items: [
      { name: 'The North Face Backpack', brand: 'The North Face', quantity: 1, color: 'Black', size: 'Large', priceAed: 460, discountPercent: 0 }
    ],
    priceDetails: {
      product: 7800000,
      shipping: 1000000,
      commission: 1000000
    }
  },
  {
    id: 'DK-1252',
    customerName: 'امیر عباسپور',
    phone: '09123459876',
    address: 'تبریز، بلوار ولیعصر، خیابان پروین اعتصامی، ساختمان پارس، واحد ۸',
    notes: 'هدفون سونی مدل WH-1000XM5 رنگ نقره‌ای.',
    productName: 'Sony WH-1000XM5',
    brand: 'Sony',
    weight: 0.45,
    totalToman: 18600000,
    priceAed: 880,
    date: '2026-05-30T14:05:00Z', // 1403/03/19 18:05
    status: 'warehouse_dubai', // در انبار دبی
    paymentMethod: 'gateway',
    trackingNum: '51567894213',
    paymentStatus: 'paid',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80',
    store: 'از Sharaf DG',
    items: [
      { name: 'Sony WH-1000XM5 Headphones', brand: 'Sony', quantity: 1, color: 'Silver', size: 'Standard', priceAed: 880, discountPercent: 0 }
    ],
    priceDetails: {
      product: 15500000,
      shipping: 1600000,
      commission: 1500000
    }
  },
  {
    id: 'DK-1251',
    customerName: 'نگین مرادی',
    phone: '09361234567',
    address: 'رشت، گلسار، کوچه ۱۰۰، پلاک ۲، طبقه ۴',
    notes: 'لپ‌تاپ مک‌بوک ایر M2 حافظه ۸ و هارد ۲۵۶ رنگ خاکستری فضایی.',
    productName: 'MacBook Air M2',
    brand: 'Apple',
    weight: 1.24,
    totalToman: 89500000,
    priceAed: 4200,
    date: '2026-05-29T12:40:00Z', // 1403/03/18 16:40
    status: 'shipped', // ارسال شده
    paymentMethod: 'card',
    trackingNum: '41523456789',
    paymentStatus: 'paid',
    img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=80&q=80',
    store: 'از Amazon.ae',
    items: [
      { name: 'MacBook Air M2 8/256', brand: 'Apple', quantity: 1, color: 'Space Gray', size: '13.6 inch', priceAed: 4200, discountPercent: 0 }
    ],
    priceDetails: {
      product: 81500000,
      shipping: 4500000,
      commission: 3500000
    }
  },
  {
    id: 'DK-1250',
    customerName: 'حسین زمانی',
    phone: '09127894561',
    address: 'کرج، عظیمیه، میدان اسب، خیابان طالقانی، پلاک ۳۳',
    notes: 'کفش آدیداس الترابوست ۲۲ سایز ۴۳ رنگ تمام مشکی.',
    productName: 'Adidas Ultraboost 22',
    brand: 'Adidas',
    weight: 0.78,
    totalToman: 14200000,
    priceAed: 670,
    date: '2026-05-29T10:10:00Z', // 1403/03/18 14:10
    status: 'delivered', // تحویل شده
    paymentMethod: 'gateway',
    trackingNum: '31567894123',
    paymentStatus: 'paid',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&q=80',
    store: 'از Namshi.com',
    items: [
      { name: 'Adidas Ultraboost 22', brand: 'Adidas', quantity: 1, color: 'Triple Black', size: '43', priceAed: 670, discountPercent: 0 }
    ],
    priceDetails: {
      product: 12000000,
      shipping: 1100000,
      commission: 1100000
    }
  },
  {
    id: 'DK-1249',
    customerName: 'فاطمه کریمی',
    phone: '09364567890',
    address: 'یزد، خیابان کاشانی، کوچه مسکن، پلاک ۵، طبقه همکف',
    notes: 'گوشی سامسونگ گلکسی S24 رنگ طوسی ۲۵۶ گیگابایت.',
    productName: 'Samsung Galaxy S24',
    brand: 'Samsung',
    weight: 0.18,
    totalToman: 42200000,
    priceAed: 2000,
    date: '2026-05-28T18:30:00Z', // 1403/03/17 22:30
    status: 'cancelled', // لغو شده
    paymentMethod: 'gateway',
    trackingNum: '21523456781',
    paymentStatus: 'cancelled',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80',
    store: 'از Amazon.ae',
    items: [
      { name: 'Samsung Galaxy S24 256GB', brand: 'Samsung', quantity: 1, color: 'Gray', size: 'Standard', priceAed: 2000, discountPercent: 0 }
    ],
    priceDetails: {
      product: 37500000,
      shipping: 2500000,
      commission: 2200000
    }
  }
];

// Initial customers seed data matching mockup
const INITIAL_CUSTOMERS_SEED = [
  {
    id: 'CUST-001248',
    name: 'علی محمدی',
    phone: '09123456789',
    email: 'ali.mohammadi@gmail.com',
    city: 'تهران',
    totalToman: 28450000,
    orderCount: 8,
    status: 'active', // active = فعال, vip = VIP, inactive = غیرفعال
    dateReg: '1403/01/15',
    group: 'VIP',
    notes: 'مشتری خوش حساب و دائمی - ارسال با تیپاکس',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    performance: {
      avgOrder: 3556250,
      lastOrder: '1403/03/20',
      firstOrder: '1403/01/18',
      maxOrder: 8900000
    }
  },
  {
    id: 'CUST-001247',
    name: 'سمیرا احمدی',
    phone: '09151234567',
    email: 'samira.ahmadi@yahoo.com',
    city: 'تبریز',
    totalToman: 65300000,
    orderCount: 15,
    status: 'vip',
    dateReg: '1403/02/10',
    group: 'VIP',
    notes: 'خرید عمده لپ‌تاپ و ساعت هوشمند - نیازمند پیگیری تلفنی',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    performance: {
      avgOrder: 4353333,
      lastOrder: '1403/03/18',
      firstOrder: '1403/02/12',
      maxOrder: 22000000
    }
  },
  {
    id: 'CUST-001246',
    name: 'رضا حسینی',
    phone: '09109876543',
    email: 'reza.hosseini@gmail.com',
    city: 'شیراز',
    totalToman: 12750000,
    orderCount: 3,
    status: 'active',
    dateReg: '1403/02/25',
    group: 'همکار',
    notes: 'ارسال فاکتور رسمی از طریق واتساپ',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face',
    performance: {
      avgOrder: 4250000,
      lastOrder: '1403/03/17',
      firstOrder: '1403/02/28',
      maxOrder: 6200000
    }
  },
  {
    id: 'CUST-001245',
    name: 'مینا رحیمی',
    phone: '09337894512',
    email: 'mina.rahimi@gmail.com',
    city: 'اصفهان',
    totalToman: 9800000,
    orderCount: 2,
    status: 'inactive',
    dateReg: '1403/03/01',
    group: 'عادی',
    notes: 'درخواست بازگشت وجه برای سفارش قبلی',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    performance: {
      avgOrder: 4900000,
      lastOrder: '1403/03/16',
      firstOrder: '1403/03/02',
      maxOrder: 5800000
    }
  },
  {
    id: 'CUST-001244',
    name: 'امیر عباسی',
    phone: '09123459876',
    email: 'amir.abbasi@gmail.com',
    city: 'مشهد',
    totalToman: 18600000,
    orderCount: 5,
    status: 'active',
    dateReg: '1403/03/05',
    group: 'عادی',
    notes: 'تحویل درب منزل با هماهنگی قبلی',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    performance: {
      avgOrder: 3720000,
      lastOrder: '1403/03/15',
      firstOrder: '1403/03/06',
      maxOrder: 7100000
    }
  },
  {
    id: 'CUST-001243',
    name: 'نگین مرادی',
    phone: '09361234567',
    email: 'negin.moradi@gmail.com',
    city: 'تهران',
    totalToman: 89500000,
    orderCount: 21,
    status: 'vip',
    dateReg: '1403/01/10',
    group: 'VIP',
    notes: 'خریدار دائمی پوشاک زنانه - ارسال با پیک اختصاصی',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    performance: {
      avgOrder: 4261904,
      lastOrder: '1403/03/14',
      firstOrder: '1403/01/12',
      maxOrder: 15400000
    }
  },
  {
    id: 'CUST-001242',
    name: 'حسین زمانی',
    phone: '09127894561',
    email: 'hossein.zamani@gmail.com',
    city: 'کرج',
    totalToman: 14200000,
    orderCount: 4,
    status: 'active',
    dateReg: '1403/02/18',
    group: 'عادی',
    notes: 'آدرس پستی دوم: تهران، بلوار کشاورز',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    performance: {
      avgOrder: 3550000,
      lastOrder: '1403/03/13',
      firstOrder: '1403/02/20',
      maxOrder: 5200000
    }
  },
  {
    id: 'CUST-001241',
    name: 'غزاله کریمی',
    phone: '09364567890',
    email: 'ghazal.karimi@gmail.com',
    city: 'اهواز',
    totalToman: 42000000,
    orderCount: 7,
    status: 'inactive',
    dateReg: '1403/02/05',
    group: 'همکار',
    notes: 'خرید ویژه لوازم خانگی و آرایشی',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    performance: {
      avgOrder: 6000000,
      lastOrder: '1403/03/12',
      firstOrder: '1403/02/10',
      maxOrder: 12000000
    }
  }
];

// Initial Payments seed matching checkout orders and dynamic payment flows
const INITIAL_PAYMENTS_SEED = [
  {
    id: 'PAY-1256',
    orderId: 'DK-1256',
    recipient: 'علی محمدی',
    amount: 28450000,
    method: 'درگاه بانکی',
    date: '1403/03/20 11:30',
    type: 'دریافتی',
    category: 'سفارشات',
    status: 'success',
    reference: 'REF-712893049',
    account: 'درگاه سامان',
    phone: '09123456789',
    address: 'تهران، سعادت آباد، خیابان بخشایش، کوچه ۱۵، پلاک ۲۴، واحد ۵',
    productName: 'Apple Watch Series 9',
    notes: 'تراکنش آنلاین موفق - خرید نهایی ساعت اپل واچ ۹'
  },
  {
    id: 'PAY-1255',
    orderId: 'DK-1255',
    recipient: 'سمیرا احمدی',
    amount: 65300000,
    method: 'کارت به کارت',
    date: '1403/03/19 16:45',
    type: 'دریافتی',
    category: 'سفارشات',
    status: 'success',
    reference: 'REF-902381203',
    account: '۶۰۳۷-۹۹**-**-۵۶۷۸ (بانک ملی)',
    phone: '09351234567',
    address: 'شیراز، معالی آباد، مجتمع تجاری آفتاب، واحد ۱۲',
    productName: 'iPhone 15 Pro Max',
    notes: 'ثبت موقت رسید واریزی کارت به کارت توسط خریدار - تایید شده'
  },
  {
    id: 'PAY-1254',
    orderId: 'DK-1254',
    recipient: 'هزینه های جاری',
    amount: -12750000,
    method: 'حواله بانکی',
    date: '1403/03/19 10:20',
    type: 'پرداختی',
    category: 'هزینه ها',
    status: 'pending',
    reference: 'REF-451203698',
    account: 'شبا بانک پاسارگاد',
    phone: '-',
    address: 'دفتر تهران - خرید اقلام مصرفی و ملزومات اداری',
    productName: 'هزینه خرید صندلی و ملزومات اداری',
    notes: 'حواله معلق جهت تایید نهایی مدیریت مالی'
  },
  {
    id: 'PAY-1253',
    orderId: 'DK-1253',
    recipient: 'مینا رحیمی',
    amount: 9800000,
    method: 'درگاه بانکی',
    date: '1403/03/18 14:10',
    type: 'دریافتی',
    category: 'سفارشات',
    status: 'success',
    reference: 'REF-785123694',
    account: 'درگاه ملت',
    phone: '09337894512',
    address: 'مشهد، بلوار سجاد، خیابان بهار، پلاک ۱۵',
    productName: 'The North Face Backpack',
    notes: 'خرید اینترنتی موفق - کوله پشتی نورث فیس'
  },
  {
    id: 'PAY-1252',
    orderId: 'DK-1252',
    recipient: 'امیر عباسی',
    amount: 18600000,
    method: 'کارت به کارت',
    date: '1403/03/18 09:15',
    type: 'دریافتی',
    category: 'سفارشات',
    status: 'success',
    reference: 'REF-653241987',
    account: '۶۰۳۷-۹۹**-**-۵۶۷۸ (بانک ملی)',
    phone: '09123459876',
    address: 'تبریز، بلوار ولیعصر، پروین اعتصامی، ساختمان پارس',
    productName: 'Sony WH-1000XM5',
    notes: 'واریزی کارت به کارت تایید شده توسط ادمین'
  },
  {
    id: 'PAY-1251',
    orderId: 'DK-1251',
    recipient: 'هزینه های کارگو',
    amount: -2450000,
    method: 'حواله بانکی',
    date: '1403/03/17 12:30',
    type: 'پرداختی',
    category: 'هزینه ها',
    status: 'success',
    reference: 'REF-154269874',
    account: 'حساب ملت کارگو',
    phone: '-',
    address: 'ترخیص گمرکی محصولات انبار',
    productName: 'هزینه گمرک و ترخیص بار',
    notes: 'تسویه شده بابت فاکتور ترخیص کار فرودگاه امام'
  },
  {
    id: 'PAY-1250',
    orderId: 'DK-1250',
    recipient: 'نگین مرادی',
    amount: 89500000,
    method: 'درگاه بانکی',
    date: '1403/03/17 09:40',
    type: 'دریافتی',
    category: 'سفارشات',
    status: 'success',
    reference: 'REF-123456780',
    account: 'درگاه سامان',
    phone: '09361234567',
    address: 'رشت، گلسار، کوچه ۱۰۰، پلاک ۲، طبقه ۴',
    productName: 'MacBook Air M2',
    notes: 'خرید اینترنتی موفق - مک‌بوک ایر'
  },
  {
    id: 'PAY-1249',
    orderId: 'DK-1249',
    recipient: 'هزینه پست',
    amount: -4200000,
    method: 'کارت به کارت',
    date: '1403/03/16 18:25',
    type: 'پرداختی',
    category: 'هزینه ها',
    status: 'success',
    reference: 'REF-987654321',
    account: 'کارت به کارت تیپاکس',
    phone: '-',
    address: 'دفتر مرکزی تیپاکس تهران',
    productName: 'هزینه ارسال مرسولات پستی به شهرستان',
    notes: 'پرداخت هزینه ارسال سفارشات معلق با تیپاکس'
  }
];

// Initial Shipments seed matching mockup table with detailed cargo specifications mapped from checkout orders
const INITIAL_SHIPMENTS_SEED = [
  { 
    id: 'TRK-784512', 
    orderId: 'DK-1256',
    recipient: 'علی محمدی', 
    method: 'هوایی', 
    status: 'transit', 
    dateShipped: '1403/03/20', 
    dateUpdated: '1403/03/20',
    cargoWeight: 0.15,
    cargoValue: 28450000,
    shippingCost: 2500000,
    productName: 'Apple Watch Series 9',
    productImg: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80',
    address: 'تهران، سعادت آباد، خیابان بخشایش، کوچه ۱۵، پلاک ۲۴، واحد ۵',
    phone: '09123456789',
    carrier: 'دوبی کارگو (Dubai Cargo)',
    awbCode: 'AWB-987452145'
  },
  { 
    id: 'TRK-784511', 
    orderId: 'DK-1255',
    recipient: 'سمیرا احمدی', 
    method: 'هوایی', 
    status: 'customs', 
    dateShipped: '1403/03/19', 
    dateUpdated: '1403/03/19',
    cargoWeight: 0.22,
    cargoValue: 65300000,
    shippingCost: 3500000,
    productName: 'iPhone 15 Pro Max',
    productImg: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=80&q=80',
    address: 'شیراز، معالی آباد، مجتمع تجاری آفتاب، واحد ۱۲',
    phone: '09351234567',
    carrier: 'پارس کارگو (Pars Cargo)',
    awbCode: 'AWB-154269874'
  },
  { 
    id: 'TRK-784510', 
    orderId: 'DK-1254',
    recipient: 'رضا حسینی', 
    method: 'زمینی', 
    status: 'iran', 
    dateShipped: '1403/03/18', 
    dateUpdated: '1403/03/18',
    cargoWeight: 0.85,
    cargoValue: 12750000,
    shippingCost: 1100000,
    productName: 'Nike Air Max 270',
    productImg: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&q=80',
    address: 'اصفهان، خیابان خاقانی، کوچه افشین، پلاک ۴، طبقه ۲',
    phone: '09109876543',
    carrier: 'زمینی سریع (Express Land)',
    awbCode: 'AWB-452136987'
  },
  { 
    id: 'TRK-784509', 
    orderId: 'DK-1253',
    recipient: 'مینا رحیمی', 
    method: 'هوایی', 
    status: 'delivered', 
    dateShipped: '1403/03/17', 
    dateUpdated: '1403/03/17',
    cargoWeight: 0.9,
    cargoValue: 9800000,
    shippingCost: 1000000,
    productName: 'The North Face Backpack',
    productImg: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=80&q=80',
    address: 'مشهد، بلوار سجاد، خیابان بهار، پلاک ۱۵',
    phone: '09337894512',
    carrier: 'هوایی کارگو (Air Cargo)',
    awbCode: 'AWB-785412369'
  },
  { 
    id: 'TRK-784508', 
    orderId: 'DK-1252',
    recipient: 'امیر عباسی', 
    method: 'هوایی', 
    status: 'transit', 
    dateShipped: '1403/03/16', 
    dateUpdated: '1403/03/16',
    cargoWeight: 0.45,
    cargoValue: 18600000,
    shippingCost: 1600000,
    productName: 'Sony WH-1000XM5',
    productImg: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80',
    address: 'تبریز، بلوار ولیعصر، پروین اعتصامی، ساختمان پارس',
    phone: '09123459876',
    carrier: 'آسمان کارگو (Aseman Cargo)',
    awbCode: 'AWB-541239874'
  },
  { 
    id: 'TRK-784507', 
    orderId: 'DK-1251',
    recipient: 'نگین مرادی', 
    method: 'هوایی', 
    status: 'problem', 
    dateShipped: '1403/03/15', 
    dateUpdated: '1403/03/15',
    cargoWeight: 1.24,
    cargoValue: 89500000,
    shippingCost: 4500000,
    productName: 'MacBook Air M2',
    productImg: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=80&q=80',
    address: 'رشت، گلسار، کوچه ۱۰۰، پلاک ۲، طبقه ۴',
    phone: '09361234567',
    carrier: 'دوبی کارگو (Dubai Cargo)',
    awbCode: 'AWB-653241987'
  },
  { 
    id: 'TRK-784506', 
    orderId: 'DK-1250',
    recipient: 'حسین زمانی', 
    method: 'زمینی', 
    status: 'delivered', 
    dateShipped: '1403/03/14', 
    dateUpdated: '1403/03/14',
    cargoWeight: 0.78,
    cargoValue: 14200000,
    shippingCost: 1100000,
    productName: 'Adidas Ultraboost 22',
    productImg: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&q=80',
    address: 'کرج، عظیمیه، میدان اسب، خیابان طالقانی، پلاک ۳۳',
    phone: '09127894561',
    carrier: 'پیک کارون (Karoon Express)',
    awbCode: 'AWB-987412563'
  },
  { 
    id: 'TRK-784505', 
    orderId: 'DK-1249',
    recipient: 'غزاله کریمی', 
    method: 'هوایی', 
    status: 'transit', 
    dateShipped: '1403/03/13', 
    dateUpdated: '1403/03/13',
    cargoWeight: 0.18,
    cargoValue: 42200000,
    shippingCost: 2500000,
    productName: 'Samsung Galaxy S24',
    productImg: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80',
    address: 'یزد، خیابان کاشانی، کوچه مسکن، پلاک ۵، طبقه همکف',
    phone: '09364567890',
    carrier: 'هوایی کارگو (Air Cargo)',
    awbCode: 'AWB-326987415'
  },
  { 
    id: 'TRK-784504', 
    orderId: 'DK-OTHER-01',
    recipient: 'پوریا میرزایی', 
    method: 'زمینی', 
    status: 'iran', 
    dateShipped: '1403/03/12', 
    dateUpdated: '1403/03/12',
    cargoWeight: 2.5,
    cargoValue: 35000000,
    shippingCost: 2900000,
    productName: 'لپ‌تاپ استوک Dell XPS',
    productImg: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=80&q=80',
    address: 'تهران، پونک، بلوار همت',
    phone: '09121112233',
    carrier: 'زمینی کارگو (Land Cargo)',
    awbCode: 'AWB-854123697'
  },
  { 
    id: 'TRK-784503', 
    orderId: 'DK-OTHER-02',
    recipient: 'داود حیدری', 
    method: 'هوایی', 
    status: 'delivered', 
    dateShipped: '1403/03/11', 
    dateUpdated: '1403/03/11',
    cargoWeight: 0.35,
    cargoValue: 15400000,
    shippingCost: 1200000,
    productName: 'ایرپاد پرو ۲',
    productImg: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80',
    address: 'اصفهان، خیابان وحید',
    phone: '09353334455',
    carrier: 'آسمان کارگو (Aseman Cargo)',
    awbCode: 'AWB-142536987'
  }
];

const INITIAL_WAREHOUSE_PRODUCTS_SEED = [
  {
    id: 'DK-INV-1001',
    name: 'iPhone 15 Pro 256GB',
    brand: 'Apple',
    category: 'موبایل',
    sku: 'AIP15P-256',
    price: 42500000,
    stock: 12,
    reserved: 2,
    location: 'قفسه A1 - ردیف ۳',
    minStock: 5,
    lastUpdated: '۱۴۰۳/۰۸/۱۲ - ۱۴:۴۵',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=200&auto=format&fit=crop',
    isArchived: false,
    notes: [
      { id: 'n1', text: 'مخصوص سفارش مشتری #1256', date: '۱۴۰۳/۰۸/۱۲', user: 'مدیر سایت' }
    ],
    history: [
      { id: 'h1', action: 'افزایش موجودی', qty: '+12', date: '۱۴۰۳/۰۸/۱۲ - ۱۴:۴۵', user: 'مدیر سایت', reason: 'ورود بار جدید از دبی' },
      { id: 'h2', action: 'رزرو', qty: '+2', date: '۱۴۰۳/۰۸/۱۳ - ۱۰:۳۰', user: 'سیستم', reason: 'ثبت سفارش مشتری #1256' }
    ]
  },
  {
    id: 'DK-INV-1002',
    name: 'PlayStation 5',
    brand: 'Sony',
    category: 'کنسول بازی',
    sku: 'PS5-825',
    price: 31900000,
    stock: 8,
    reserved: 1,
    location: 'قفسه B2 - ردیف ۱',
    minStock: 3,
    lastUpdated: '۱۴۰۳/۰۸/۱۵ - ۱۰:۳۰',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=200&auto=format&fit=crop',
    isArchived: false,
    notes: [
      { id: 'n2', text: 'کارتن آسیب دیده جزیی در حمل', date: '۱۴۰۳/۰۸/۱۵', user: 'انباردار' }
    ],
    history: [
      { id: 'h3', action: 'افزایش موجودی', qty: '+8', date: '۱۴۰۳/۰۸/۱۵ - ۱۰:۳۰', user: 'مدیر انبار', reason: 'فاکتور خرید شماره ۱۰۲' },
      { id: 'h4', action: 'رزرو', qty: '+1', date: '۱۴۰۳/۰۸/۱۶ - ۱۲:۰۰', user: 'سیستم', reason: 'پیش‌فاکتور مشتری #1259' }
    ]
  },
  {
    id: 'DK-INV-1003',
    name: 'AirPods Pro 2',
    brand: 'Apple',
    category: 'هدفون',
    sku: 'APP-AP2',
    price: 11250000,
    stock: 20,
    reserved: 0,
    location: 'قفسه A2 - ردیف ۴',
    minStock: 5,
    lastUpdated: '۱۴۰۳/۰۸/۱۶ - ۱۱:۱۵',
    image: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?q=80&w=200&auto=format&fit=crop',
    isArchived: false,
    notes: [],
    history: [
      { id: 'h5', action: 'افزایش موجودی', qty: '+20', date: '۱۴۰۳/۰۸/۱۶ - ۱۱:۱۵', user: 'مدیر سایت', reason: 'ورود بار جدید' }
    ]
  },
  {
    id: 'DK-INV-1004',
    name: 'Nike Air Max 270',
    brand: 'Nike',
    category: 'کفش ورزشی',
    sku: 'NK-AM270',
    price: 5800000,
    stock: 6,
    reserved: 1,
    location: 'قفسه C1 - ردیف ۲',
    minStock: 8,
    lastUpdated: '۱۴۰۳/۰۸/۱۸ - ۱۶:۲۰',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop',
    isArchived: false,
    notes: [
      { id: 'n3', text: 'در انتظار تامین سایز ۴۲', date: '۱۴۰۳/۰۸/۱۸', user: 'پشتیبان' }
    ],
    history: [
      { id: 'h6', action: 'افزایش موجودی', qty: '+6', date: '۱۴۰۳/۰۸/۱۸ - ۱۶:۲۰', user: 'مدیر سایت', reason: 'تامین محلی' }
    ]
  },
  {
    id: 'DK-INV-1005',
    name: 'ASUS TUF Gaming F15',
    brand: 'Asus',
    category: 'لپتاپ',
    sku: 'AS-TUF15',
    price: 34900000,
    stock: 3,
    reserved: 0,
    location: 'قفسه D3 - ردیف ۵',
    minStock: 4,
    lastUpdated: '۱۴۰۳/۰۸/۲۰ - ۰۹:۰۰',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=200&auto=format&fit=crop',
    isArchived: false,
    notes: [],
    history: [
      { id: 'h7', action: 'افزایش موجودی', qty: '+3', date: '۱۴۰۳/۰۸/۲۰ - ۰۹:۰۰', user: 'مدیر انبار', reason: 'خرید از نماینده رسمی' }
    ]
  },
  {
    id: 'DK-INV-1006',
    name: 'Dior Sauvage EDP',
    brand: 'Dior',
    category: 'عطر',
    sku: 'DIOR-EDP',
    price: 6400000,
    stock: 15,
    reserved: 0,
    location: 'قفسه E1 - ردیف ۱',
    minStock: 5,
    lastUpdated: '۱۴۰۳/۰۸/۲۲ - ۱۴:۱۰',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=200&auto=format&fit=crop',
    isArchived: false,
    notes: [],
    history: [
      { id: 'h8', action: 'افزایش موجودی', qty: '+15', date: '۱۴۰۳/۰۸/۲۲ - ۱۴:۱۰', user: 'مدیر سایت', reason: 'ورود بار آرایشی' }
    ]
  },
  {
    id: 'DK-INV-1007',
    name: 'Sony WH-1000XM5',
    brand: 'Sony',
    category: 'هدفون',
    sku: 'SONY-XM5',
    price: 14800000,
    stock: 4,
    reserved: 0,
    location: 'قفسه A2 - ردیف ۵',
    minStock: 6,
    lastUpdated: '۱۴۰۳/۰۸/۲۳ - ۱۶:۴۰',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=200&auto=format&fit=crop',
    isArchived: false,
    notes: [],
    history: [
      { id: 'h9', action: 'افزایش موجودی', qty: '+4', date: '۱۴۰۳/۰۸/۲۳ - ۱۶:۴۰', user: 'مدیر انبار', reason: 'ورود بار صوتی' }
    ]
  },
  {
    id: 'DK-INV-1008',
    name: 'Logitech MX Master 3S',
    brand: 'Logitech',
    category: 'اکسسوری',
    sku: 'LOGI-MX3',
    price: 4500000,
    stock: 2,
    reserved: 0,
    location: 'قفسه C2 - ردیف ۳',
    minStock: 4,
    lastUpdated: '۱۴۰۳/۰۸/۲۴ - ۱۲:۳۰',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=200&auto=format&fit=crop',
    isArchived: false,
    notes: [],
    history: [
      { id: 'h10', action: 'افزایش موجودی', qty: '+2', date: '۱۴۰۳/۰۸/۲۴ - ۱۲:۳۰', user: 'مدیر سایت', reason: 'خرید تعداد محدود' }
    ]
  },
  {
    id: 'DK-INV-1009',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    category: 'موبایل',
    sku: 'S24-ULTRA',
    price: 52000000,
    stock: 0,
    reserved: 0,
    location: 'قفسه A1 - ردیف ۵',
    minStock: 3,
    lastUpdated: '۱۴۰۳/۰۸/۲۵ - ۱۰:۰۰',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=200&auto=format&fit=crop',
    isArchived: false,
    notes: [
      { id: 'n4', text: 'در انتظار تامین از دبی', date: '۱۴۰۳/۰۸/۲۵', user: 'پشتیبان' }
    ],
    history: []
  },
  {
    id: 'DK-INV-1010',
    name: 'Apple Watch Series 9',
    brand: 'Apple',
    category: 'ساعت هوشمند',
    sku: 'APP-WATCH9',
    price: 17200000,
    stock: 0,
    reserved: 0,
    location: 'قفسه A2 - ردیف ۱',
    minStock: 2,
    lastUpdated: '۱۴۰۳/۰۸/۲۶ - ۱۱:۳۰',
    image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=200&auto=format&fit=crop',
    isArchived: false,
    notes: [],
    history: []
  },
  {
    id: 'DK-INV-1011',
    name: 'Nintendo Switch OLED',
    brand: 'Nintendo',
    category: 'کنسول بازی',
    sku: 'NIN-SWITCH',
    price: 15500000,
    stock: 2,
    reserved: 3,
    location: 'قفسه B2 - ردیف ۴',
    minStock: 2,
    lastUpdated: '۱۴۰۳/۰۸/۲۷ - ۱۵:۰۰',
    image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=200&auto=format&fit=crop',
    isArchived: false,
    notes: [
      { id: 'n5', text: 'کسری موجودی نسبت به رزرو! نیاز به تامین فوری ۱ عدد.', date: '۱۴۰۳/۰۸/۲۷', user: 'مدیر انبار' }
    ],
    history: [
      { id: 'h11', action: 'افزایش موجودی', qty: '+2', date: '۱۴۰۳/۰۸/۲۷ - ۱۵:۰۰', user: 'مدیر انبار', reason: 'موجودی قبلی' },
      { id: 'h12', action: 'رزرو', qty: '+3', date: '۱۴۰۳/۰۸/۲۸ - ۰۹:۳۰', user: 'سیستم', reason: 'سفارش مشتری #1272' }
    ]
  }
];

const INITIAL_ADMIN_PRODUCTS_SEED = [
  {
    id: 'prod-1001',
    code: 'DK-1001',
    name: 'Nike Air Max 270',
    brand: 'Nike',
    category: 'کفش مردانه',
    price: 8950000,
    stock: 25,
    status: 'موجود',
    image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=80&q=80'
  },
  {
    id: 'prod-1002',
    code: 'DK-1002',
    name: 'Michael Kors Jet Set Bag',
    brand: 'Michael Kors',
    category: 'کیف زنانه',
    price: 12500000,
    stock: 18,
    status: 'موجود',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=80&q=80'
  },
  {
    id: 'prod-1003',
    code: 'DK-1003',
    name: 'iPhone 15 Pro Max 256GB',
    brand: 'Apple',
    category: 'گوشی موبایل',
    price: 65900000,
    stock: 8,
    status: 'کم موجود',
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=80&q=80'
  },
  {
    id: 'prod-1004',
    code: 'DK-1004',
    name: 'Adidas Ultraboost 22',
    brand: 'Adidas',
    category: 'کفش مردانه',
    price: 7450000,
    stock: 3,
    status: 'موجود',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&q=80'
  },
  {
    id: 'prod-1005',
    code: 'DK-1005',
    name: 'Shein Floral Dress',
    brand: 'Shein',
    category: 'لباس زنانه',
    price: 1250000,
    stock: 0,
    status: 'ناموجود',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=80&q=80'
  },
  {
    id: 'prod-1006',
    code: 'DK-1006',
    name: 'Apple Watch Series 9',
    brand: 'Apple',
    category: 'ساعت هوشمند',
    price: 24800000,
    stock: 6,
    status: 'موجود',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80'
  },
  {
    id: 'prod-1007',
    code: 'DK-1007',
    name: 'Ray-Ban Aviator Sunglasses',
    brand: 'Ray-Ban',
    category: 'عینک آفتابی',
    price: 6150000,
    stock: 12,
    status: 'موجود',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=80&q=80'
  },
  {
    id: 'prod-1008',
    code: 'DK-1008',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    category: 'گوشی موبایل',
    price: 58900000,
    stock: 5,
    status: 'موجود',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=80&q=80'
  }
];

export default function AdminPanel() {
  // Site settings context
  const { settings: siteCtxSettings, updateSettings: updateSiteCtxSettings, updateAedRateAuto } = useSiteSettings();

  // Authentication states
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active section/tab (Matches the sidebar items, default is 'overview' for dashboard)
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrderId, setSelectedOrderId] = useState('DK-1256');

  // Calculator states for foreign products (external_product leads)
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activePaymentFilter, setActivePaymentFilter] = useState('all');
  const [isCustomerInfoExpanded, setIsCustomerInfoExpanded] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  const [siteSubTab, setSiteSubTab] = useState('banners');
  
  // Site management states
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
  
  // Security management states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState('۱۴۰۵/۰۳/۳۰ ساعت ۰۱:۲۲');
  const [lastLoginIp, setLastLoginIp] = useState('5.119.82.106 (تهران، ایران)');
  
  // Foreign Products management states
  const [selectedAdminProductId, setSelectedAdminProductId] = useState(null);
  const [productLinkInput, setProductLinkInput] = useState('');
  const [isFetchingProductLink, setIsFetchingProductLink] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editProductForm, setEditProductForm] = useState({
    id: '', name: '', brand: 'Nike', priceAed: '', weight: '', sourceStore: '', originalLink: '', foreignStatus: 'active',
    image: '', gender: '', category: '', discountPercent: 0, isBestSeller: false
  });
  const [isAddProductManualOpen, setIsAddProductManualOpen] = useState(false);
  const [addProductManualForm, setAddProductManualForm] = useState({
    name: '', brand: 'Nike', priceAed: '', weight: '1.0', sourceStore: 'Amazon.ae', originalLink: '', image: '',
    category: '', gender: '', discountPercent: 0, isBestSeller: false
  });

  // Local warehouse states
  const [warehouseProducts, setWarehouseProducts] = useState([]);
  const [selectedWarehouseProductId, setSelectedWarehouseProductId] = useState('');
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [warehouseCategoryFilter, setWarehouseCategoryFilter] = useState('همه');
  const [warehouseBrandFilter, setWarehouseBrandFilter] = useState('همه');
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState('همه');
  const [warehouseFilterMode, setWarehouseFilterMode] = useState('all'); // all, lowstock, outofstock, reserved, overreserved
  
  // Modals state
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [isEditWarehouseOpen, setIsEditWarehouseOpen] = useState(false);
  const [editWarehouseForm, setEditWarehouseForm] = useState({
    id: '', name: '', brand: '', category: '', sku: '', price: '', stock: '', reserved: '', location: '', minStock: '', image: ''
  });
  
  const [warehouseAdjustStockOpen, setWarehouseAdjustStockOpen] = useState(false);
  const [warehouseAdjustStockType, setWarehouseAdjustStockType] = useState('increase'); // increase, decrease
  const [warehouseAdjustStockQty, setWarehouseAdjustStockQty] = useState('');
  const [warehouseAdjustStockReason, setWarehouseAdjustStockReason] = useState('');
  
  const [warehouseAddNoteOpen, setWarehouseAddNoteOpen] = useState(false);
  const [warehouseAddNoteText, setWarehouseAddNoteText] = useState('');
  const [warehouseReportOpen, setWarehouseReportOpen] = useState(false);
  const [activeWarehouseMenuId, setActiveWarehouseMenuId] = useState(null);
  const [addWarehouseForm, setAddWarehouseForm] = useState({
    name: '', brand: '', category: 'موبایل', sku: '', price: '', stock: '0', reserved: '0', location: '', minStock: '5', image: ''
  });
  const [warehousePage, setWarehousePage] = useState(1);
  const [warehouseLimit, setWarehouseLimit] = useState(10);

  const [aedRate, setAedRate] = useState(() => { try { return localStorage.getItem('dubaiKharidAedRate') || '13850'; } catch { return '13850'; } });
  const [siteSettings, setSiteSettings] = useState({ siteName: 'دبی خرید', siteUrl: 'dubaykharid.ir', supportPhone: '021-88001234', supportEmail: 'support@dubaykharid.ir', telegramId: '@dubaykharid', whatsapp: '+971501234567', instagramId: '@dubaykharid', dubaiAddress: 'امارات، دبی، بیزینس بی، ساختمان ۱۲ بی اسکور', iranAddress: 'شیراز، شهرک گلستان، خیابان گل آرا', address: 'دبی، امارات متحده عربی', workingHours: 'شنبه تا پنجشنبه ۹ تا ۱۸', minOrderAed: '500', commissionPercent: '8', shippingBaseRate: '1200000', shippingPerKg: '350000', freeShippingThreshold: '80000000', maintenanceMode: false, allowRegistration: true, autoNotify: true, notifyNewOrder: true, notifyPayment: true, notifyShipment: true });

  useEffect(() => {
    if (siteCtxSettings) {
      setSiteSettings(prev => ({ ...prev, ...siteCtxSettings }));
    }
  }, [siteCtxSettings]);

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

  const handleWarehouseImageUploadLocal = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (type === 'add') {
        setAddWarehouseForm(prev => ({ ...prev, image: dataUrl }));
      } else {
        setEditWarehouseForm(prev => ({ ...prev, image: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGeneral = () => {
    updateSiteCtxSettings(localGeneral);
    setSaveGeneralSuccess(true);
    setTimeout(() => setSaveGeneralSuccess(false), 3000);
  };
  const [readNotifIds, setReadNotifIds] = useState([]);

  // Customers states
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('CUST-001248');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerGroupFilter, setCustomerGroupFilter] = useState('همه');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('همه');
  const [customerCityFilter, setCustomerCityFilter] = useState('همه');
  const [customerDetailsTab, setCustomerDetailsTab] = useState('general');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNoteText, setTempNoteText] = useState('');

  // Shipments states
  const [shipments, setShipments] = useState([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState('');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('همه');
  const [shipmentMethodFilter, setShipmentMethodFilter] = useState('همه');
  const [shipmentRecipientFilter, setShipmentRecipientFilter] = useState('همه');

  // Payments states
  const [payments, setPayments] = useState([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('همه');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('همه');
  const [paymentCategoryFilter, setPaymentCategoryFilter] = useState('همه');
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState({
    orderId: '',
    recipient: '',
    amount: '',
    method: 'درگاه بانکی',
    type: 'دریافتی',
    category: 'سفارشات',
    status: 'success',
    reference: '',
    account: '',
    phone: '',
    address: '',
    productName: '',
    notes: ''
  });

  // Modals for Shipments tab
  const [isAddShipmentOpen, setIsAddShipmentOpen] = useState(false);
  const [newShipmentForm, setNewShipmentForm] = useState({
    id: '', recipient: 'علی محمدی', method: 'هوایی', status: 'transit', dateShipped: '1403/03/20', dateUpdated: '1403/03/20'
  });

  // Modals for Customer tab
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '', phone: '', email: '', city: 'تهران', group: 'عادی', code: '', status: 'active', notes: '',
    avgOrder: '', lastOrder: '', firstOrder: '', maxOrder: ''
  });
  const [editCustomerForm, setEditCustomerForm] = useState({
    id: '', name: '', phone: '', email: '', city: 'تهران', group: 'عادی', code: '', status: 'active', notes: '',
    avgOrder: '', lastOrder: '', firstOrder: '', maxOrder: ''
  });

  // Leads & reviews lists
  const [leads, setLeads] = useState([]);
  const [calcPriceAed, setCalcPriceAed] = useState(0);
  const [calcWeight, setCalcWeight] = useState(0);
  const [calcShippingAed, setCalcShippingAed] = useState(0);
  const [calcCommissionAed, setCalcCommissionAed] = useState(0);
  const [calcAedRate, setCalcAedRate] = useState(0);

  useEffect(() => {
    const selectedLead = leads.find(l => l.id === selectedOrderId);
    if (selectedLead) {
      setCalcPriceAed(parseFloat(selectedLead.priceAed) || 0);
      setCalcWeight(parseFloat(selectedLead.weight) || 0.5);
      
      const rate = parseFloat(siteCtxSettings.aedRate) || 19500;
      setCalcAedRate(rate);

      // Pre-calculate based on settings
      const priceVal = parseFloat(selectedLead.priceAed) || 0;
      const weightVal = parseFloat(selectedLead.weight) || 0.5;
      
      const commissionPercent = parseFloat(siteCtxSettings.commissionPercent) || 25;
      const commissionAedVal = priceVal * (commissionPercent / 100);
      setCalcCommissionAed(Math.round(commissionAedVal));

      const minWeight = parseFloat(siteCtxSettings.minWeightClass) || 1.0;
      const roundingMethod = siteCtxSettings.roundingMethod || 'ceil';
      let roundedWeight = weightVal;
      if (roundingMethod === 'ceil') roundedWeight = Math.ceil(weightVal);
      else if (roundingMethod === 'floor') roundedWeight = Math.floor(weightVal);
      else if (roundingMethod === 'round') roundedWeight = Math.round(weightVal);
      if (roundedWeight < minWeight) roundedWeight = minWeight;

      const shippingPerKgAed = parseFloat(siteCtxSettings.shippingPerKgAed) || 40;
      setCalcShippingAed(Math.round(roundedWeight * shippingPerKgAed));
    }
  }, [selectedOrderId, leads, siteCtxSettings]);

  const calcTotalAed = calcPriceAed + calcShippingAed + calcCommissionAed;
  const calcTotalToman = Math.round(calcTotalAed * calcAedRate);

  const handleSaveFinalPrice = () => {
    const updated = leads.map(l => {
      if (l.id === selectedOrderId) {
        return {
          ...l,
          status: 'price_tagged', // قیمت اعلام شده
          priceAed: calcPriceAed,
          weight: calcWeight,
          totalToman: calcTotalToman,
          priceDetails: {
            product: Math.round(calcPriceAed * calcAedRate),
            shipping: Math.round(calcShippingAed * calcAedRate),
            commission: Math.round(calcCommissionAed * calcAedRate)
          }
        };
      }
      return l;
    });
    setLeads(updated);
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(updated));
    alert(`قیمت نهایی ${calcTotalToman.toLocaleString('fa-IR')} تومان ثبت و وضعیت درخواست به «قیمت اعلام شده» تغییر یافت.`);
  };

  const getWhatsAppPaymentLink = (lead) => {
    const link = `${window.location.origin}/payment?amount=${lead.totalToman}&tracking=${lead.id}&prodName=${encodeURIComponent(lead.productName)}&customer=${encodeURIComponent(lead.customerName)}&phone=${lead.phone}`;
    const text = `سلام جناب ${lead.customerName} عزیز،\nقیمت نهایی محصول مورد نظر شما (${lead.productName}) بررسی و اعلام گردید:\n\nقیمت محصول: ${lead.priceAed} درهم\nوزن واقعی: ${lead.weight} کیلوگرم\nقیمت نهایی به تومان: ${lead.totalToman.toLocaleString('fa-IR')} تومان\n\nجهت تکمیل پرداخت آنلاین از طریق درگاه شتاب بانکی می‌توانید روی لینک زیر کلیک کنید:\n${link}\n\nبا تشکر، دبی خرید`;
    return `https://wa.me/${lead.phone.replace(/^[0]/, '+98')}?text=${encodeURIComponent(text)}`;
  };

  const handleSendPaymentLink = (lead) => {
    const link = `${window.location.origin}/payment?amount=${lead.totalToman}&tracking=${lead.id}&prodName=${encodeURIComponent(lead.productName)}&customer=${encodeURIComponent(lead.customerName)}&phone=${lead.phone}`;
    navigator.clipboard.writeText(link);
    alert('لینک پرداخت با موفقیت به کلیپ‌بورد کپی شد!');
    window.open(getWhatsAppPaymentLink(lead), '_blank');
  };

  const handleConvertToOrder = (leadId) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: 'purchased',
          paymentStatus: 'paid'
        };
      }
      return l;
    });
    setLeads(updated);
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(updated));
    alert('درخواست با موفقیت به سفارش خرید قطعی تبدیل شد.');
  };

  const handleManualPayment = (leadId) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: 'purchased',
          paymentStatus: 'paid',
          paymentMethod: 'card'
        };
      }
      return l;
    });
    setLeads(updated);
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(updated));
    alert('پرداخت دستی ثبت شد و درخواست به سفارش قطعی تبدیل گردید.');
  };

  const handleCancelRequest = (leadId) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: 'cancelled'
        };
      }
      return l;
    });
    setLeads(updated);
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(updated));
    alert('درخواست با موفقیت لغو شد.');
  };
  const [reviews, setReviews] = useState([]);
  const [uploadedProducts, setUploadedProducts] = useState([]);
  const [allProductsCount, setAllProductsCount] = useState(0);
  const [adminProducts, setAdminProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('همه');
  const [productCategoryFilter, setProductCategoryFilter] = useState('همه');
  const [productBrandFilter, setProductBrandFilter] = useState('همه');
  const [productSortField, setProductSortField] = useState('id');
  const [productSortOrder, setProductSortOrder] = useState('asc');
  const [showProductFilters, setShowProductFilters] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isValuationModalOpen, setIsValuationModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '', brand: 'Nike', category: 'کفش مردانه', price: '', stock: ''
  });

  // Dynamic Options states for brand-filtered models, CPUs, and GPUs
  const [modelsByBrand, setModelsByBrand] = useState({
    Apple: ['MacBook Air M2', 'MacBook Pro M3', 'MacBook Air M1', 'MacBook Pro 16"'],
    Dell: ['Dell XPS 13 9315', 'Dell Latitude 5430', 'Dell Inspiron 15', 'Dell G15 Gaming'],
    Lenovo: ['ThinkPad T14', 'ThinkPad X1 Carbon', 'Yoga Slim 7', 'Legion 5'],
    HP: ['HP Spectre x360', 'HP Pavilion 15', 'HP EliteBook 840', 'HP Omen 16'],
    ASUS: ['ASUS ROG Zephyrus', 'ASUS ZenBook 14', 'ASUS VivoBook 15', 'ASUS TUF Gaming']
  });

  const [cpuOptions, setCpuOptions] = useState([
    'Apple M2', 'Apple M3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 7', 'AMD Ryzen 9'
  ]);

  const [gpuOptions, setGpuOptions] = useState([
    'Apple GPU 8-Core', 'Apple GPU 10-Core', 'Intel Iris Xe', 'AMD Radeon RX', 'NVIDIA GeForce RTX 4060', 'NVIDIA GeForce RTX 4070'
  ]);

  const [customModel, setCustomModel] = useState('');
  const [showCustomModelInput, setShowCustomModelInput] = useState(false);

  const [customCpu, setCustomCpu] = useState('');
  const [showCustomCpuInput, setShowCustomCpuInput] = useState(false);

  const [customGpu, setCustomGpu] = useState('');
  const [showCustomGpuInput, setShowCustomGpuInput] = useState(false);

  const [colorOptions, setColorOptions] = useState([
    'Space Gray', 'Silver', 'Midnight', 'Starlight', 'مشکی', 'سفید', 'طوسی', 'کرم'
  ]);
  const [customColor, setCustomColor] = useState('');
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);

  const handleBrandChange = (newBrand) => {
    setShowCustomModelInput(false);
    setCustomModel('');
    const defaultModel = modelsByBrand[newBrand]?.[0] || '';
    setLaptopForm(prev => ({
      ...prev,
      brand: newBrand,
      model: defaultModel
    }));
  };

  // Laptop Dashboard Management States
  const [laptopViewMode, setLaptopViewMode] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingLaptopId, setEditingLaptopId] = useState(null);
  const [laptopSearchQuery, setLaptopSearchQuery] = useState('');
  const [laptopBrandFilter, setLaptopBrandFilter] = useState('همه');
  const [deletedStaticIds, setDeletedStaticIds] = useState([]);
  const [selectedLaptopId, setSelectedLaptopId] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('specs'); // 'specs' | 'tests' | 'accessories' | 'info'
  const [laptopStatusFilter, setLaptopStatusFilter] = useState('همه');
  const [laptopRamFilter, setLaptopRamFilter] = useState('همه');
  const [laptopCpuFilter, setLaptopCpuFilter] = useState('همه');
  const [isMonthlyProfitExpanded, setIsMonthlyProfitExpanded] = useState(false);

  // Reset form states back to initial uploader mockup values
  const resetLaptopForm = () => {
    setLaptopForm({
      brand: 'Apple',
      model: 'MacBook Air M2',
      serial: 'C02JQ0XFL7',
      cpu: 'Apple M2',
      ram: '8',
      storageSize: '256',
      storageType: 'GB SSD',
      storage2Size: '0',
      storage2Type: 'none',
      gpu: 'Apple GPU 8-Core',
      screenSize: '13.6',
      manufactureYear: '2022',
      color: 'Space Gray',
      batteryHealth: '92',
      weight: '1.24',
      buyingPrice: '2400',
      extraCosts: '100',
      sellingPrice: '48500000',
      internalNotes: '',
      customerNotes: '',
      hardwareTests: {
        keyboard: true,
        speaker: true,
        display: true,
        usb: true,
        battery: true,
        wifi: true,
        camera: true,
        charge: true
      },
      accessories: {
        charger: true,
        box: true
      },
      physicalStatus: 'excellent',
      stockStatus: 'available',
      dateEntered: '1403/03/20',
      internalSku: 'MAC-AIR-M2-256-001',
      warrantyDays: '30',
      warrantyExpiry: '1403/04/20',
      lastService: '1403/03/15',
      nextService: '1403/06/15'
    });
    setLaptopImages([
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=450&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=450&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=450&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1525373612132-b3e8246f77c5?w=450&q=85&auto=format&fit=crop'
    ]);
    setShowCustomModelInput(false);
    setShowCustomCpuInput(false);
    setShowCustomGpuInput(false);
    setShowCustomColorInput(false);
    setCustomModel('');
    setCustomCpu('');
    setCustomGpu('');
    setCustomColor('');
  };

  // Dynamically parses any static or dynamic product back into a laptopForm schema
  const parseProductToForm = (product) => {
    if (product.rawSpecs) {
      return { ...product.rawSpecs };
    }
    
    let ramVal = '8';
    let storageSizeVal = '256';
    let storageTypeVal = 'GB SSD';
    let cpuVal = product.cpu || 'Intel Core i5';
    
    if (product.spec) {
      const parts = product.spec.split('/');
      if (parts[0]) {
        ramVal = parts[0].replace(/[^0-9]/g, '').trim();
      }
      if (parts[1]) {
        const s = parts[1].trim();
        storageSizeVal = s.replace(/[^0-9]/g, '').trim();
        if (s.includes('TB')) {
          storageTypeVal = s.includes('HDD') ? 'TB HDD' : 'TB SSD';
        } else {
          storageTypeVal = s.includes('HDD') ? 'GB HDD' : 'GB SSD';
        }
      }
      if (parts[2]) {
        cpuVal = parts[2].trim();
      }
    }

    const cleanScreenSize = product.screenSize || (product.sizes?.[0] ? product.sizes[0].replace(/[^0-9.]/g, '').trim() : '13.6');
    const cleanWeight = product.weight ? String(product.weight) : '1.24';
    
    const cleanBuying = String(product.priceAed - 100 > 0 ? product.priceAed - 100 : product.priceAed);
    const cleanSelling = String(product.priceAed * 19500);

    return {
      brand: product.brand || 'Apple',
      model: product.model || product.name.replace(`لپ‌تاپ استوک ${product.brand} مدل`, '').replace(`لپ‌تاپ استوک`, '').replace(product.brand, '').trim(),
      serial: product.serial || 'نامشخص',
      cpu: cpuVal,
      ram: ramVal || '8',
      storageSize: storageSizeVal || '256',
      storageType: storageTypeVal || 'GB SSD',
      storage2Size: '0',
      storage2Type: 'none',
      gpu: product.gpu || 'Intel Iris Xe',
      screenSize: cleanScreenSize || '13.6',
      manufactureYear: product.manufactureYear || '2022',
      color: product.colors?.[0] || (product.color ? product.color : 'Space Gray'),
      batteryHealth: product.batteryHealth || '92',
      weight: cleanWeight,
      buyingPrice: cleanBuying,
      extraCosts: '100',
      sellingPrice: cleanSelling,
      internalNotes: '',
      customerNotes: product.description || '',
      hardwareTests: {
        keyboard: true,
        speaker: true,
        display: true,
        usb: true,
        battery: true,
        wifi: true,
        camera: true,
        charge: true
      },
      accessories: {
        charger: true,
        box: true
      },
      physicalStatus: 'excellent',
      stockStatus: product.stockStatus || 'available',
      dateEntered: '1403/03/20',
      internalSku: `LAP-${(product.brand || 'GEN').toUpperCase()}-${Date.now().toString().slice(-4)}`,
      warrantyDays: '30',
      warrantyExpiry: '1403/04/20',
      lastService: '1403/03/15',
      nextService: '1403/06/15'
    };
  };

  // Expanded lead row ID (Accordion)
  const [expandedLeadId, setExpandedLeadId] = useState(null);

  // Search queries
  const [leadSearch, setLeadSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');

  // Custom high-parity Stock Laptop Form states
  const [laptopForm, setLaptopForm] = useState({
    brand: 'Apple',
    model: 'MacBook Air M2',
    serial: 'C02JQ0XFL7',
    cpu: 'Apple M2',
    ram: '8',
    storageSize: '256',
    storageType: 'GB SSD',
    storage2Size: '0',
    storage2Type: 'none',
    gpu: 'Apple GPU 8-Core',
    screenSize: '13.6',
    manufactureYear: '2022',
    color: 'Space Gray',
    batteryHealth: '92',
    weight: '1.24',
    buyingPrice: '2400',
    extraCosts: '100',
    sellingPrice: '48500000',
    internalNotes: '',
    customerNotes: '',
    hardwareTests: {
      keyboard: true,
      speaker: true,
      display: true,
      usb: true,
      battery: true,
      wifi: true,
      camera: true,
      charge: true
    },
    accessories: {
      charger: true,
      box: true
    },
    physicalStatus: 'excellent', // 'excellent' = عالی, 'very_good', 'good', 'fair'
    stockStatus: 'available', // 'available' = موجود, 'unavailable'
    dateEntered: '1403/03/20',
    internalSku: 'MAC-AIR-M2-256-001',
    warrantyDays: '30',
    warrantyExpiry: '1403/04/20',
    lastService: '1403/03/15',
    nextService: '1403/06/15'
  });

  // Images uploaded list (seeded with 4 MacBook images matching mockup)
  const [laptopImages, setLaptopImages] = useState([
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=450&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=450&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=450&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1525373612132-b3e8246f77c5?w=450&q=85&auto=format&fit=crop'
  ]);

  // Password change security
  const [passForm, setPassForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'خیلی ضعیف', color: '#ff4d4d' });

  // Load persistence layers on mount
  useEffect(() => {
    const session = sessionStorage.getItem('dubaiKharidAdminSession');
    if (session === 'active') {
      setIsLoggedIn(true);
    }

    // Customers seed
    const savedCustomers = localStorage.getItem('dubaiKharidCustomers');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    } else {
      localStorage.setItem('dubaiKharidCustomers', JSON.stringify(INITIAL_CUSTOMERS_SEED));
      setCustomers(INITIAL_CUSTOMERS_SEED);
    }

    // Shipments seed
    const savedShipments = localStorage.getItem('dubaiKharidShipments');
    if (savedShipments) {
      setShipments(JSON.parse(savedShipments));
    } else {
      localStorage.setItem('dubaiKharidShipments', JSON.stringify(INITIAL_SHIPMENTS_SEED));
      setShipments(INITIAL_SHIPMENTS_SEED);
    }

    // Payments seed
    const savedPayments = localStorage.getItem('dubaiKharidPayments');
    if (savedPayments) {
      setPayments(JSON.parse(savedPayments));
    } else {
      localStorage.setItem('dubaiKharidPayments', JSON.stringify(INITIAL_PAYMENTS_SEED));
      setPayments(INITIAL_PAYMENTS_SEED);
    }

    // Leads seed
    const savedLeads = localStorage.getItem('dubaiKharidLeads');
    if (savedLeads) {
      setLeads(JSON.parse(savedLeads));
    } else {
      localStorage.setItem('dubaiKharidLeads', JSON.stringify(INITIAL_LEADS_SEED));
      setLeads(INITIAL_LEADS_SEED);
    }

    // Reviews seed
    const savedReviews = localStorage.getItem('dubaiKharidReviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }

    // Uploaded products
    const savedUploaded = localStorage.getItem('dubaiKharidUploadedProducts');
    if (savedUploaded) {
      setUploadedProducts(JSON.parse(savedUploaded));
    }

    // Admin Products seed
    const savedAdminProducts = localStorage.getItem('dubaiKharidAdminProducts');
    if (savedAdminProducts) {
      setAdminProducts(JSON.parse(savedAdminProducts));
    } else {
      localStorage.setItem('dubaiKharidAdminProducts', JSON.stringify(INITIAL_ADMIN_PRODUCTS_SEED));
      setAdminProducts(INITIAL_ADMIN_PRODUCTS_SEED);
    }

    // Warehouse Products seed
    const savedWarehouseProducts = localStorage.getItem('dubaiKharidWarehouseProducts');
    if (savedWarehouseProducts) {
      const parsed = JSON.parse(savedWarehouseProducts);
      setWarehouseProducts(parsed);
      if (parsed.length > 0) {
        setSelectedWarehouseProductId(parsed[0].id);
      }
    } else {
      localStorage.setItem('dubaiKharidWarehouseProducts', JSON.stringify(INITIAL_WAREHOUSE_PRODUCTS_SEED));
      setWarehouseProducts(INITIAL_WAREHOUSE_PRODUCTS_SEED);
      if (INITIAL_WAREHOUSE_PRODUCTS_SEED.length > 0) {
        setSelectedWarehouseProductId(INITIAL_WAREHOUSE_PRODUCTS_SEED[0].id);
      }
    }

    // Load deleted static laptop IDs
    let deletedCount = 0;
    const savedDeletedStatic = localStorage.getItem('dubaiKharidDeletedStaticLaptops');
    if (savedDeletedStatic) {
      const parsedDeleted = JSON.parse(savedDeletedStatic);
      setDeletedStaticIds(parsedDeleted);
      deletedCount = parsedDeleted.length;
    }

    // Calculate total catalog count
    const staticProds = getAllProducts();
    const dynamicCount = savedUploaded ? JSON.parse(savedUploaded).length : 0;
    setAllProductsCount(staticProds.length + dynamicCount - deletedCount);
  }, [isLoggedIn]);

  // Synchronize leads with shipments so any checkout order automatically gets a shipment record
  useEffect(() => {
    if (leads.length === 0) return;

    const savedShipments = localStorage.getItem('dubaiKharidShipments');
    let currentShipments = savedShipments ? JSON.parse(savedShipments) : INITIAL_SHIPMENTS_SEED;

    let hasChanges = false;
    leads.forEach(lead => {
      // Check if this lead already has a shipment (matched by orderId)
      const exists = currentShipments.some(s => s.orderId === lead.id);
      if (!exists) {
        // Create new shipment
        const trkId = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
        const regDate = lead.date ? lead.date.slice(0, 10).replace(/-/g, '/') : '1403/03/20';
        
        // Detailed cargo specs parsed directly from lead!
        const shippingCostVal = lead.priceDetails?.shipping || 2500000;
        
        const newShipment = {
          id: trkId,
          orderId: lead.id,
          recipient: lead.customerName,
          method: lead.weight > 2 ? 'زمینی' : 'هوایی', // زمینی if heavy, هوایی if light
          status: lead.status === 'delivered' ? 'delivered' : 'transit',
          dateShipped: '1403/03/20',
          dateUpdated: '1403/03/20',
          cargoWeight: lead.weight || 0.5,
          cargoValue: lead.totalToman || 15000000,
          shippingCost: shippingCostVal,
          productName: lead.productName || 'کالای وارداتی',
          productImg: lead.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80',
          address: lead.address || 'تهران',
          phone: lead.phone || '09123456789',
          carrier: 'دبی اکسپرس (Dubai Express)',
          awbCode: `AWB-${Math.floor(100000000 + Math.random() * 900000000)}`
        };
        
        currentShipments.unshift(newShipment);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setShipments(currentShipments);
      localStorage.setItem('dubaiKharidShipments', JSON.stringify(currentShipments));
    }
  }, [leads]);

  // Synchronize leads with payments so any checkout order automatically gets a transaction record
  useEffect(() => {
    if (leads.length === 0) return;

    const savedPayments = localStorage.getItem('dubaiKharidPayments');
    let currentPayments = savedPayments ? JSON.parse(savedPayments) : INITIAL_PAYMENTS_SEED;

    let hasChanges = false;
    leads.forEach(lead => {
      // Check if this lead already has a payment transaction (matched by orderId)
      const exists = currentPayments.some(p => p.orderId === lead.id);
      if (!exists) {
        // Create new payment transaction
        const txnId = `TXN-${Math.floor(800000 + Math.random() * 200000)}`;
        const regDate = lead.date ? lead.date.slice(0, 10).replace(/-/g, '/') + ' - ' + new Date(lead.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '1403/03/20 - 12:00';
        
        const newPayment = {
          id: txnId,
          orderId: lead.id,
          recipient: lead.customerName,
          amount: lead.totalToman || 15000000,
          method: lead.paymentMethod === 'card' ? 'کارت به کارت' : 'درگاه شتاب',
          date: regDate,
          status: lead.status === 'approved' || lead.paymentStatus === 'paid' ? 'success' : 'pending',
          reference: `REF-${Math.floor(100000000 + Math.random() * 900000000)}`,
          account: lead.paymentMethod === 'card' ? '۶۰۳۷-۹۹**-**-۵۶۷۸ (بانک ملی)' : 'درگاه پرداخت آنلاین شتاب',
          phone: lead.phone || '09123456789',
          address: lead.address || 'تهران',
          productName: lead.productName || 'کالای سفارشی دبی',
          notes: lead.notes || 'تراکنش خودکار سفارش ثبت شده از سبد خرید'
        };
        
        currentPayments.unshift(newPayment);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setPayments(currentPayments);
      localStorage.setItem('dubaiKharidPayments', JSON.stringify(currentPayments));
    }
  }, [leads]);

  // Password strength evaluator
  useEffect(() => {
    const pw = passForm.newPass;
    if (!pw) {
      setPasswordStrength({ score: 0, label: 'خیلی ضعیف', color: '#ff4d4d' });
      return;
    }

    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    let label = 'خیلی ضعیف';
    let color = '#ff4d4d';
    if (score === 2) {
      label = 'ضعیف';
      color = '#f39c12';
    } else if (score === 3) {
      label = 'متوسط';
      color = '#fdf500';
    } else if (score >= 4) {
      label = 'قوی و امن';
      color = '#2ecc71';
    }

    setPasswordStrength({ score, label, color });
  }, [passForm.newPass]);

  // Handle Log In
  const handleLogin = (e) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('dubaiKharidPassword') || '@Reza112233';
    
    if (passwordInput === storedPassword) {
      setIsLoggedIn(true);
      sessionStorage.setItem('dubaiKharidAdminSession', 'active');
      setLoginError('');
      setPasswordInput('');
    } else {
      setLoginError('رمز عبور اشتباه است. دوباره تلاش کنید.');
    }
  };

  // Handle Log Out
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('dubaiKharidAdminSession');
  };

  // Toggle accordion row
  const toggleLeadAccordion = (leadId) => {
    setExpandedLeadId(prev => (prev === leadId ? null : leadId));
  };

  // Handle customer saving and actions
  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      alert('لطفاً نام و شماره تماس را وارد کنید.');
      return;
    }
    const newId = `CUST-${Math.floor(100000 + Math.random() * 900000)}`;
    const farsiDate = '1403/03/' + String(Math.floor(10 + Math.random() * 10));

    const avgOrderVal = parseFloat(newCustomerForm.avgOrder) || 0;
    const maxOrderVal = parseFloat(newCustomerForm.maxOrder) || 0;

    const newCust = {
      id: newId,
      name: newCustomerForm.name,
      phone: newCustomerForm.phone,
      email: newCustomerForm.email || 'نامشخص',
      city: newCustomerForm.city,
      totalToman: avgOrderVal * 3 || 12000000,
      orderCount: 3,
      status: newCustomerForm.status,
      dateReg: farsiDate,
      group: newCustomerForm.group,
      notes: newCustomerForm.notes || 'بدون یادداشت',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 9000000)}?w=150&h=150&fit=crop&crop=face`,
      performance: {
        avgOrder: avgOrderVal || 4000000,
        lastOrder: farsiDate,
        firstOrder: '1403/01/10',
        maxOrder: maxOrderVal || 8000000
      }
    };

    const updated = [newCust, ...customers];
    setCustomers(updated);
    localStorage.setItem('dubaiKharidCustomers', JSON.stringify(updated));
    setSelectedCustomerId(newId);
    setIsAddCustomerOpen(false);
    setNewCustomerForm({
      name: '', phone: '', email: '', city: 'تهران', group: 'عادی', code: '', status: 'active', notes: '',
      avgOrder: '', lastOrder: '', firstOrder: '', maxOrder: ''
    });
    alert('مشتری جدید با موفقیت افزوده شد!');
  };

  const handleEditCustomerSubmit = (e) => {
    e.preventDefault();
    if (!editCustomerForm.name || !editCustomerForm.phone) {
      alert('لطفاً نام و شماره تماس را وارد کنید.');
      return;
    }

    const updated = customers.map(c => {
      if (c.id === editCustomerForm.id) {
        return {
          ...c,
          name: editCustomerForm.name,
          phone: editCustomerForm.phone,
          email: editCustomerForm.email,
          city: editCustomerForm.city,
          group: editCustomerForm.group,
          status: editCustomerForm.status,
          notes: editCustomerForm.notes,
          performance: {
            ...c.performance,
            avgOrder: parseFloat(editCustomerForm.avgOrder) || c.performance.avgOrder,
            maxOrder: parseFloat(editCustomerForm.maxOrder) || c.performance.maxOrder,
          }
        };
      }
      return c;
    });

    setCustomers(updated);
    localStorage.setItem('dubaiKharidCustomers', JSON.stringify(updated));
    setIsEditCustomerOpen(false);
    alert('تغییرات اطلاعات مشتری با موفقیت ذخیره شد!');
  };

  const handleDeleteCustomer = (id) => {
    if (!confirm('آیا از حذف این مشتری مطمئن هستید؟ داده‌های این کاربر برای همیشه پاک خواهند شد.')) {
      return;
    }
    const filtered = customers.filter(c => c.id !== id);
    setCustomers(filtered);
    localStorage.setItem('dubaiKharidCustomers', JSON.stringify(filtered));
    if (selectedCustomerId === id) {
      if (filtered.length > 0) {
        setSelectedCustomerId(filtered[0].id);
      } else {
        setSelectedCustomerId('');
      }
    }
    alert('مشتری با موفقیت حذف گردید.');
  };

  const handleSaveNotes = (id, newNotes) => {
    const updated = customers.map(c => {
      if (c.id === id) {
        return { ...c, notes: newNotes };
      }
      return c;
    });
    setCustomers(updated);
    localStorage.setItem('dubaiKharidCustomers', JSON.stringify(updated));
  };

  // Handle shipments saving and actions
  const handleAddShipmentSubmit = (e) => {
    e.preventDefault();
    if (!newShipmentForm.recipient) {
      alert('لطفاً گیرنده ارسال را وارد کنید.');
      return;
    }
    const newId = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    const farsiDate = '1403/03/' + String(Math.floor(10 + Math.random() * 10));

    const newShip = {
      id: newId,
      recipient: newShipmentForm.recipient,
      method: newShipmentForm.method,
      status: newShipmentForm.status,
      dateShipped: farsiDate,
      dateUpdated: farsiDate
    };

    const updated = [newShip, ...shipments];
    setShipments(updated);
    localStorage.setItem('dubaiKharidShipments', JSON.stringify(updated));
    setIsAddShipmentOpen(false);
    alert('مرسوله ارسالی جدید با موفقیت ثبت شد!');
  };

  const handleDeleteShipment = (id) => {
    if (!confirm('آیا از حذف این مرسوله ارسالی مطمئن هستید؟ داده‌های رهگیری آن برای همیشه پاک خواهند شد.')) {
      return;
    }
    const filtered = shipments.filter(s => s.id !== id);
    setShipments(filtered);
    localStorage.setItem('dubaiKharidShipments', JSON.stringify(filtered));
    alert('مرسوله ارسالی با موفقیت حذف گردید.');
  };

  const handleUpdateShipmentStatus = (id, newStatus) => {
    const updated = shipments.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: newStatus,
          dateUpdated: '1403/03/' + String(Math.floor(10 + Math.random() * 10))
        };
      }
      return s;
    });
    setShipments(updated);
    localStorage.setItem('dubaiKharidShipments', JSON.stringify(updated));
    alert('وضعیت مرسوله با موفقیت به‌روزرسانی شد!');
  };

  // Payments tab operations
  const handleApprovePayment = (paymentId) => {
    // Update payment status to success
    const updatedPayments = payments.map(p => {
      if (p.id === paymentId) {
        // Also update corresponding order lead in leads list
        const updatedLeads = leads.map(l => {
          if (l.id === p.orderId) {
            return { ...l, status: 'approved', paymentStatus: 'paid' };
          }
          return l;
        });
        setLeads(updatedLeads);
        localStorage.setItem('dubaiKharidLeads', JSON.stringify(updatedLeads));
        
        return { 
          ...p, 
          status: 'success', 
          notes: 'تراکنش کارت به کارت تایید شده توسط ادمین در ' + new Date().toLocaleDateString('fa-IR') 
        };
      }
      return p;
    });

    setPayments(updatedPayments);
    localStorage.setItem('dubaiKharidPayments', JSON.stringify(updatedPayments));
    alert('فیش واریزی با موفقیت تایید و سفارش مربوطه فعال گردید!');
  };

  const handleRejectPayment = (paymentId) => {
    if (!confirm('آیا از رد این تراکنش مطمئن هستید؟ پیام عدم تایید و مغایرت مالی ثبت خواهد شد.')) {
      return;
    }
    const updatedPayments = payments.map(p => {
      if (p.id === paymentId) {
        return { 
          ...p, 
          status: 'failed', 
          notes: 'واریزی توسط مدیریت رد شد. مغایرت در رسید واریزی در تاریخ ' + new Date().toLocaleDateString('fa-IR') 
        };
      }
      return p;
    });

    setPayments(updatedPayments);
    localStorage.setItem('dubaiKharidPayments', JSON.stringify(updatedPayments));
    alert('تراکنش رد شد و مغایرت مالی فیش اعلام گردید.');
  };

  const handleDeletePayment = (paymentId) => {
    if (!confirm('آیا از حذف دائمی تاریخچه این تراکنش مالی مطمئن هستید؟')) {
      return;
    }
    const filtered = payments.filter(p => p.id !== paymentId);
    setPayments(filtered);
    localStorage.setItem('dubaiKharidPayments', JSON.stringify(filtered));
    if (selectedPaymentId === paymentId) {
      setSelectedPaymentId('');
    }
    alert('تراکنش مالی با موفقیت حذف گردید.');
  };

  const handleExportExcel = () => {
    const headers = ['شناسه تراکنش', 'تاریخ و ساعت', 'نوع', 'مبلغ (تومان)', 'روش پرداخت', 'دسته', 'وضعیت', 'سفارش مرجع', 'مشتری', 'تلفن', 'آدرس', 'کالا', 'توضیحات'];
    const csvRows = [headers.join(',')];
    payments.forEach(p => {
      const typeStr = p.type || (p.amount > 0 ? 'دریافتی' : 'پرداختی');
      const categoryStr = p.category || (p.amount > 0 ? 'سفارشات' : 'هزینه ها');
      const statusStr = p.status === 'success' ? 'تسویه شده' : 'در انتظار';
      const row = [
        p.id,
        p.date,
        typeStr,
        p.amount,
        p.method,
        categoryStr,
        statusStr,
        p.orderId || '',
        p.recipient || '',
        p.phone || '',
        p.address || '',
        p.productName || '',
        p.notes || ''
      ];
      csvRows.push(row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });
    
    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dubaikharid-payments-report-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('فایل گزارش اکسل تراکنش‌ها با موفقیت دانلود شد.');
  };

  const handleAddPaymentSubmit = (e) => {
    e.preventDefault();
    if (!newPaymentForm.recipient || !newPaymentForm.amount) {
      alert('لطفاً نام پرداخت‌کننده و مبلغ را وارد کنید.');
      return;
    }
    
    const amountVal = Number(newPaymentForm.amount);
    const resolvedType = newPaymentForm.type;
    const finalAmount = resolvedType === 'پرداختی' ? -Math.abs(amountVal) : Math.abs(amountVal);
    const nextPayId = `PAY-${1257 + Math.floor(Math.random() * 1000)}`;
    
    const newTxn = {
      ...newPaymentForm,
      id: nextPayId,
      amount: finalAmount,
      date: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };
    
    const updated = [newTxn, ...payments];
    setPayments(updated);
    localStorage.setItem('dubaiKharidPayments', JSON.stringify(updated));
    setIsAddPaymentOpen(false);
    setNewPaymentForm({
      orderId: '', recipient: '', amount: '', method: 'درگاه بانکی', type: 'دریافتی', category: 'سفارشات', status: 'success',
      reference: '', account: '', phone: '', address: '', productName: '', notes: ''
    });
    alert('تراکنش مالی جدید با موفقیت ثبت شد!');
  };

  const handleExportLaptopsExcel = () => {
    const list = getFilteredAdminLaptops();
    if (list.length === 0) {
      alert('هیچ لپ‌تاپی برای خروجی اکسل یافت نشد.');
      return;
    }

    const headers = [
      'شناسه محصول',
      'مدل لپ‌تاپ',
      'برند',
      'پردازنده (CPU)',
      'رم (RAM)',
      'حافظه اصلی',
      'کارت گرافیک (GPU)',
      'قیمت خرید (درهم)',
      'قیمت فروش (تومان)',
      'سود (تومان)',
      'وضعیت موجودی'
    ];
    const csvRows = [headers.join(',')];

    list.forEach(p => {
      const parsed = parseProductToForm(p);
      let priceToman = 0;
      if (p.rawSpecs && p.rawSpecs.sellingPrice) {
        priceToman = parseFloat(p.rawSpecs.sellingPrice);
      } else {
        priceToman = p.priceAed * 19500;
      }
      const buyingVal = parseFloat(parsed.buyingPrice) || 0;
      const extraVal = parseFloat(parsed.extraCosts) || 0;
      const costDirhams = buyingVal + extraVal;
      const costToman = costDirhams * 16100;
      const profitToman = priceToman - costToman;

      const statusValue = p.stockStatus || 'available';
      let statusText = 'موجود';
      if (statusValue === 'reserved') statusText = 'رزرو شده';
      else if (statusValue === 'sold') statusText = 'فروخته شده';
      else if (statusValue === 'unavailable') statusText = 'ناموجود';

      const row = [
        p.id,
        `${parsed.brand} ${parsed.model}`,
        parsed.brand,
        parsed.cpu,
        `${parsed.ram}GB`,
        `${parsed.storageSize}${parsed.storageType}`,
        parsed.gpu,
        buyingVal,
        Math.round(priceToman),
        Math.round(profitToman),
        statusText
      ];
      csvRows.push(row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });

    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dubaikharid-stock-laptops-report-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('فایل گزارش اکسل لپ‌تاپ‌های استوک با موفقیت دانلود شد.');
  };

  // Handle saving stock laptop exactly like the mockup form
  const handleSaveLaptop = () => {
    const costDirhams = parseFloat(laptopForm.buyingPrice) + parseFloat(laptopForm.extraCosts);
    const costToman = costDirhams * 16100;
    const profitToman = parseFloat(laptopForm.sellingPrice) - costToman;

    // Formatting RAM and split Storage specifications nicely
    const ramString = `${laptopForm.ram}GB`;
    let storageString = `${laptopForm.storageSize}${laptopForm.storageType}`;
    if (laptopForm.storage2Type !== 'none' && parseFloat(laptopForm.storage2Size) > 0) {
      storageString += ` + ${laptopForm.storage2Size}${laptopForm.storage2Type}`;
    }

    const idToUse = editingLaptopId || `uploaded-${Date.now()}`;

    // Compile laptop product object
    const newProduct = {
      id: idToUse,
      name: `لپ‌تاپ استوک ${laptopForm.brand} مدل ${laptopForm.model}`,
      spec: `${ramString} / ${storageString} / ${laptopForm.cpu}`,
      brand: laptopForm.brand,
      store: 'انبار ایران',
      priceAed: parseFloat(laptopForm.buyingPrice) + parseFloat(laptopForm.extraCosts),
      weight: parseFloat(laptopForm.weight),
      category: 'electronics',
      image: laptopImages[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=450&q=85&auto=format&fit=crop',
      link: 'https://www.amazon.ae',
      isBestSeller: true,
      colors: [laptopForm.color],
      sizes: [`${laptopForm.screenSize} inch`],
      description: laptopForm.customerNotes || `لپ‌تاپ فوق‌العاده تمیز وارداتی استوک دبی.\nسریال: ${laptopForm.serial ? laptopForm.serial : 'نامشخص'} | سلامت باتری: ${laptopForm.batteryHealth}% | گرافیک: ${laptopForm.gpu}`,
      rawSpecs: { ...laptopForm, images: laptopImages }, // Store raw specs for absolute editing precision
      stockStatus: laptopForm.stockStatus || 'available'
    };

    try {
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      let list = saved ? JSON.parse(saved) : [];
      
      if (editingLaptopId) {
        const index = list.findIndex(p => p.id === editingLaptopId);
        if (index !== -1) {
          list[index] = newProduct;
        } else {
          // If it was a static laptop, prepend to list as override
          list.unshift(newProduct);
        }
        alert('تغییرات لپ‌تاپ با موفقیت ذخیره شد!');
      } else {
        list.unshift(newProduct);
        alert('لپ‌تاپ جدید با موفقیت ذخیره شد و به کاتالوگ فروشگاه دبی خرید افزوده گردید!');
      }

      localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(list));
      setUploadedProducts(list);
      
      if (!editingLaptopId) {
        setAllProductsCount(prev => prev + 1);
      }

      // Reset and go back to list
      setLaptopViewMode('list');
      setEditingLaptopId(null);
      resetLaptopForm();
    } catch (err) {
      console.error(err);
    }
  };

  // Handles deleting dynamically uploaded laptops or overrides/hides static laptops
  const handleDeleteLaptop = (laptopId) => {
    if (!confirm('آیا از حذف این لپ‌تاپ مطمئن هستید؟')) return;

    if (laptopId.startsWith('uploaded-') || uploadedProducts.some(p => p.id === laptopId)) {
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      const list = saved ? JSON.parse(saved) : [];
      const filtered = list.filter(p => p.id !== laptopId);
      localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(filtered));
      setUploadedProducts(filtered);
      setAllProductsCount(prev => prev - 1);
    } else {
      const updatedDeleted = [...deletedStaticIds, laptopId];
      setDeletedStaticIds(updatedDeleted);
      localStorage.setItem('dubaiKharidDeletedStaticLaptops', JSON.stringify(updatedDeleted));
      
      // Also remove any existing localStorage overrides for this static laptop if they exist
      const saved = localStorage.getItem('dubaiKharidUploadedProducts');
      if (saved) {
        const list = JSON.parse(saved);
        const filtered = list.filter(p => p.id !== laptopId);
        localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(filtered));
        setUploadedProducts(filtered);
      }
      setAllProductsCount(prev => prev - 1);
    }
    alert('لپ‌تاپ با موفقیت حذف گردید.');
  };

  // Triggers editing view with pre-filled state parsed from the laptop object
  const triggerEditLaptop = (laptop) => {
    const parsedForm = parseProductToForm(laptop);
    setLaptopForm(parsedForm);
    if (laptop.rawSpecs && laptop.rawSpecs.images) {
      setLaptopImages(laptop.rawSpecs.images);
    } else {
      setLaptopImages([laptop.image]);
    }
    setEditingLaptopId(laptop.id);
    setLaptopViewMode('edit');
  };

  // Triggers adding a fresh new laptop uploader form
  const triggerAddLaptop = () => {
    resetLaptopForm();
    setEditingLaptopId(null);
    setLaptopViewMode('add');
  };

  // Compile full catalog of static and dynamic stock laptops reactively
  const getMergedAdminLaptops = () => {
    let merged = [...laptops];
    
    // Filter out deleted static laptops
    merged = merged.filter(p => !deletedStaticIds.includes(p.id));

    // Merge dynamic uploads & apply overrides
    const uploadedLaptops = uploadedProducts.filter(p => p.category === 'electronics');
    uploadedLaptops.forEach(p => {
      const index = merged.findIndex(m => m.id === p.id);
      if (index !== -1) {
        merged[index] = p; // Apply edit override
      } else {
        merged.unshift(p); // Prepend new upload
      }
    });

    return merged;
  };

  // Filters stock laptops by search terms and brand selection
  const getFilteredAdminLaptops = () => {
    const list = getMergedAdminLaptops();
    return list.filter(p => {
      // 1. Filter by Brand
      const matchesBrand = laptopBrandFilter === 'همه' || p.brand === laptopBrandFilter;
      
      // 2. Filter by Status
      const statusValue = p.stockStatus || 'available';
      const matchesStatus = laptopStatusFilter === 'همه' || statusValue === laptopStatusFilter;
      
      // 3. Filter by RAM
      let matchesRam = true;
      if (laptopRamFilter !== 'همه') {
        const parsedSpecs = parseProductToForm(p);
        matchesRam = String(parsedSpecs.ram) === laptopRamFilter;
      }
      
      // 4. Filter by CPU
      let matchesCpu = true;
      if (laptopCpuFilter !== 'همه') {
        const parsedSpecs = parseProductToForm(p);
        matchesCpu = parsedSpecs.cpu.toLowerCase().includes(laptopCpuFilter.toLowerCase());
      }

      // 5. Search keyword
      const q = laptopSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.brand.toLowerCase().includes(q) || 
        p.name.toLowerCase().includes(q) || 
        (p.spec && p.spec.toLowerCase().includes(q));
      
      return matchesBrand && matchesStatus && matchesRam && matchesCpu && matchesSearch;
    });
  };

  const getReactiveMetrics = () => {
    let totalOffset = 0;
    let availableOffset = 0;
    let reservedOffset = 0;
    let soldOffset = 0;
    let profitOffset = 0;

    // 1. Account for deleted static laptops (which were all 'available' and had zero profit by default)
    deletedStaticIds.forEach(id => {
      const orig = laptops.find(l => l.id === id);
      if (orig) {
        availableOffset -= 1;
        totalOffset -= 1;
      }
    });

    // 2. Account for uploaded products (both new additions and static overrides)
    uploadedProducts.filter(p => p.category === 'electronics').forEach(p => {
      const isStatic = laptops.some(l => l.id === p.id);
      const statusValue = p.stockStatus || 'available';

      // Parse specs to calculate actual profit
      const parsed = parseProductToForm(p);
      const priceToman = p.rawSpecs?.sellingPrice ? parseFloat(p.rawSpecs.sellingPrice) : (p.priceAed * 19500);
      const buyingVal = parseFloat(parsed.buyingPrice) || 0;
      const extraVal = parseFloat(parsed.extraCosts) || 0;
      const costToman = (buyingVal + extraVal) * 16100;
      const profit = Math.max(0, priceToman - costToman);

      if (isStatic) {
        // Skip if deleted
        if (deletedStaticIds.includes(p.id)) return;

        // Static is 'available' by default. We subtract 1 from 'available' contribution,
        // then add back its new status contribution.
        availableOffset -= 1;
        if (statusValue === 'available') {
          availableOffset += 1;
        } else if (statusValue === 'reserved') {
          reservedOffset += 1;
        } else if (statusValue === 'sold') {
          soldOffset += 1;
          profitOffset += profit;
        }
      } else {
        // Completely new dynamic laptop addition
        totalOffset += 1;
        if (statusValue === 'available') {
          availableOffset += 1;
        } else if (statusValue === 'reserved') {
          reservedOffset += 1;
        } else if (statusValue === 'sold') {
          soldOffset += 1;
          profitOffset += profit;
        }
      }
    });

    return {
      total: Math.max(0, 128 + totalOffset),
      available: Math.max(0, 68 + availableOffset),
      reserved: Math.max(0, 15 + reservedOffset),
      sold: Math.max(0, 45 + soldOffset),
      profit: Math.max(0, 2145500000 + profitOffset)
    };
  };

  const metrics = getReactiveMetrics();

  const activeLaptopsList = getFilteredAdminLaptops();
  const selectedLaptop = activeLaptopsList.find(p => p.id === selectedLaptopId) || activeLaptopsList[0];

  // Remove thumbnail image
  const handleRemoveImage = (idx) => {
    setLaptopImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Status lead adjustments
  const handleStatusChange = (leadId, newStatus) => {
    const updated = leads.map(l => (l.id === leadId ? { ...l, status: newStatus } : l));
    setLeads(updated);
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(updated));
  };

  const handleDeleteLead = (leadId) => {
    if (!confirm('آیا از حذف این سفارش مطمئن هستید؟')) return;
    const filtered = leads.filter(l => l.id !== leadId);
    setLeads(filtered);
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(filtered));
    if (expandedLeadId === leadId) setExpandedLeadId(null);
  };

  const handleDeleteProduct = (prodId) => {
    if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) return;
    const filtered = adminProducts.filter(p => p.id !== prodId);
    setAdminProducts(filtered);
    localStorage.setItem('dubaiKharidAdminProducts', JSON.stringify(filtered));
    alert('محصول با موفقیت حذف گردید.');
  };

  const handleExportProductsExcel = () => {
    const headers = ['شناسه محصول', 'نام محصول', 'برند', 'دسته‌بندی', 'قیمت (تومان)', 'موجودی', 'وضعیت'];
    const csvRows = [headers.join(',')];
    adminProducts.forEach(p => {
      const row = [
        p.code || p.id,
        p.name,
        p.brand,
        p.category,
        p.price,
        p.stock,
        p.status
      ];
      csvRows.push(row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });
    
    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dubaikharid-products-report-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('فایل گزارش اکسل محصولات با موفقیت دانلود شد.');
  };

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.price || !newProductForm.stock) {
      alert('لطفاً نام، قیمت و موجودی محصول را وارد کنید.');
      return;
    }

    const stockVal = Number(newProductForm.stock);
    let resolvedStatus = 'موجود';
    if (stockVal === 0) {
      resolvedStatus = 'ناموجود';
    } else if (stockVal > 0 && stockVal <= 10) {
      resolvedStatus = 'کم موجود';
    }

    const nextId = `uploaded-prod-${Date.now()}`;
    const nextCode = `DK-${1009 + Math.floor(Math.random() * 1000)}`;

    const newProd = {
      id: nextId,
      code: nextCode,
      name: newProductForm.name,
      brand: newProductForm.brand,
      category: newProductForm.category,
      price: Number(newProductForm.price),
      stock: stockVal,
      status: resolvedStatus,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&q=80' // default placeholder
    };

    const updated = [newProd, ...adminProducts];
    setAdminProducts(updated);
    localStorage.setItem('dubaiKharidAdminProducts', JSON.stringify(updated));
    setIsAddProductOpen(false);
    setNewProductForm({
      name: '', brand: 'Nike', category: 'کفش مردانه', price: '', stock: ''
    });
    alert('محصول جدید با موفقیت اضافه شد!');
  };

  const handleDeleteReview = (revId) => {
    if (!confirm('آیا از حذف این نظر مطمئن هستید؟')) return;
    try {
      const saved = localStorage.getItem('dubaiKharidReviews');
      const list = saved ? JSON.parse(saved) : [];
      const filtered = list.filter(r => r.id !== revId);
      localStorage.setItem('dubaiKharidReviews', JSON.stringify(filtered));
      setReviews(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('dubaiKharidPassword') || '@Reza112233';

    if (passForm.oldPass !== storedPassword) {
      setPasswordChangeError('رمز عبور فعلی اشتباه است.');
      setPasswordChangeSuccess(false);
      return;
    }

    if (passForm.newPass.length < 6) {
      setPasswordChangeError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      setPasswordChangeSuccess(false);
      return;
    }

    if (passForm.newPass !== passForm.confirmPass) {
      setPasswordChangeError('تکرار رمز عبور جدید مطابقت ندارد.');
      setPasswordChangeSuccess(false);
      return;
    }

    localStorage.setItem('dubaiKharidPassword', passForm.newPass);
    setPasswordChangeSuccess(true);
    setPasswordChangeError('');
    setPassForm({ oldPass: '', newPass: '', confirmPass: '' });
  };

  const handleRestoreDefaults = () => {
    if (!confirm('توجه: با بازیابی اطلاعات، تمام داده‌ها به حالت کارخانه بازگردانی می‌شوند. آیا ادامه می‌دهید؟')) return;
    
    localStorage.setItem('dubaiKharidLeads', JSON.stringify(INITIAL_LEADS_SEED));
    localStorage.removeItem('dubaiKharidReviews');
    localStorage.removeItem('dubaiKharidUploadedProducts');
    localStorage.setItem('dubaiKharidAdminProducts', JSON.stringify(INITIAL_ADMIN_PRODUCTS_SEED));
    localStorage.setItem('dubaiKharidPassword', '@Reza112233');

    setLeads(INITIAL_LEADS_SEED);
    setReviews([]);
    setUploadedProducts([]);
    setAdminProducts(INITIAL_ADMIN_PRODUCTS_SEED);
    setAllProductsCount(getAllProducts().length);
    alert('اطلاعات آزمایشی با موفقیت بازیابی شد.');
  };

  // Form calculations
  const buyingVal = parseFloat(laptopForm.buyingPrice) || 0;
  const extraVal = parseFloat(laptopForm.extraCosts) || 0;
  const sellingVal = parseFloat(laptopForm.sellingPrice) || 0;
  // Parity cost exchange rate is exactly 16100 to get exactly 8,250,000 profit!
  const calculatedCostToman = (buyingVal + extraVal) * 16100;
  const calculatedProfit = sellingVal - calculatedCostToman;

  const fmtToman = (n) => Math.round(parseFloat(n)).toLocaleString('fa-IR');
  const fmtDate = (isoString) => isoString ? new Date(isoString).toLocaleString('fa-IR') : '';

  const getWhatsAppLink = (lead) => {
    let cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('09')) {
      cleanPhone = `98${cleanPhone.slice(1)}`;
    }
    const message = `سلام ${lead.customerName} عزیز،\nپیش‌فاکتور خرید شما در سایت «دبی خرید» ثبت گردید.\n\n📦 سفارش شما: ${lead.productName}\n💰 مبلغ کل: ${fmtToman(lead.totalToman)} تومان\n📍 آدرس تحویل: ${lead.address}\n\nجهت هماهنگی نهایی خرید، تأیید رنگ/سایز و صدور فاکتور در خدمت شما هستیم.`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  // Filters
  const filteredLeads = leads.filter(lead => {
    const q = leadSearch.toLowerCase();
    const matchesSearch = (
      lead.customerName.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      lead.id.toLowerCase().includes(q) ||
      lead.productName.toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;

    // Split between Orders and Purchase Requests (leads) tabs
    const isOrdersTab = activeTab === 'orders';
    const isLeadsTab = activeTab === 'leads';
    if (isOrdersTab || isLeadsTab) {
      const isRequest = ['pending', 'price_tagged', 'approved', 'new_order'].includes(lead.status);
      if (isOrdersTab && isRequest) return false;
      if (isLeadsTab && !isRequest) return false;
    }

    // Status Filter
    const matchesStatus = activeStatusFilter === 'all' || 
      (activeStatusFilter === 'noon_dubai' ? (lead.status === 'noon_dubai' || lead.status === 'purchased') : lead.status === activeStatusFilter);
    if (!matchesStatus) return false;

    // Payment Filter
    const matchesPayment = activePaymentFilter === 'all' || lead.paymentMethod === activePaymentFilter;
    return matchesPayment;
  });

  const filteredReviews = reviews.filter(rev => {
    const q = reviewSearch.toLowerCase();
    return (
      rev.userName.toLowerCase().includes(q) ||
      rev.productName.toLowerCase().includes(q) ||
      rev.comment.toLowerCase().includes(q)
    );
  });

  // Render Login overlay if not logged in
  if (!isLoggedIn) {
    return (
      <div className={styles.pageWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} className={styles.loginCard}>
          <span className={styles.loginLogo}>{AdminIcons.plane(36)}</span>
          <h1>پنل مدیریت دبی خرید</h1>
          <p>جهت دسترسی به سفارشات، آپلود محصولات و نظرات کاربران، وارد شوید.</p>

          {loginError && <div className={styles.loginError}>{loginError}</div>}

          <div className={styles.formGroup}>
            <label>نام کاربری:</label>
            <input type="text" value="admin" disabled className={styles.loginInput} />
          </div>

          <div className={styles.formGroup}>
            <label>رمز عبور:</label>
            <input 
              type="password" 
              placeholder="رمز عبور پنل را وارد کنید..."
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              className={styles.loginInput}
              autoFocus
              required
            />
          </div>

          <button type="submit" className={styles.loginBtn}>ورود به داشبورد مدیریت</button>
          
          <div style={{ marginTop: '20px', fontSize: '11px', color: '#8b92a5' }}>
            <Link href="/" style={{ color: '#f87820', textDecoration: 'none', fontWeight: 'bold' }}>
              بازگشت به صفحه اصلی فروشگاه
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      
      {/* ── SIDEBAR NAVIGATION PANEL ── */}
      <aside className={styles.sidebar}>
        <div>
          <Link href="/" className={styles.sidebarLogoArea} style={{ textDecoration: 'none', display: 'flex' }}>
            <span className={styles.sidebarLogoIcon}>{AdminIcons.plane(20)}</span>
            <div className={styles.sidebarLogoText}>
              <span className={styles.logoDubai}>Dubai</span>
              <span className={styles.logoKharid}>Kharid</span>
            </div>
          </Link>

          <ul className={styles.navMenuList}>
            {/* 1. داشبورد */}
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('overview')} className={`${styles.navMenuLink} ${activeTab === 'overview' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>
                  <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
                </span> داشبورد
              </button>
            </li>
            
            {/* 2. سفارشات */}
            <li className={styles.navMenuItem}>
              <button onClick={() => { setActiveTab('orders'); setActiveStatusFilter('all'); }} className={`${styles.navMenuLink} ${activeTab === 'orders' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>
                  <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </span> سفارشات
                <span className={`${styles.navBadge} ${styles.badgeOrange}`}>
                  {leads.filter(l => ['purchased', 'noon_dubai', 'warehouse_dubai', 'shipped', 'delivered'].includes(l.status)).length}
                </span>
              </button>
            </li>

            {/* 3. درخواست خرید */}
            <li className={styles.navMenuItem}>
              <button onClick={() => { setActiveTab('leads'); setActiveStatusFilter('all'); }} className={`${styles.navMenuLink} ${activeTab === 'leads' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>
                  <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </span> درخواست خرید
                <span className={`${styles.navBadge} ${styles.badgeOrange}`}>
                  {leads.filter(l => ['pending', 'price_tagged', 'approved'].includes(l.status)).length}
                </span>
              </button>
            </li>

            {/* 4. محصولات خارجی */}
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('site_products')} className={`${styles.navMenuLink} ${activeTab === 'site_products' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>
                  <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </span> محصولات خارجی
              </button>
            </li>

            {/* 5. انبار */}
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('warehouse')} className={`${styles.navMenuLink} ${activeTab === 'warehouse' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>
                  {AdminIcons.building(16)}
                </span> انبار
                <span className={`${styles.navBadge} ${styles.badgeOrange}`}>
                  {leads.filter(l => l.status === 'warehouse_dubai').length}
                </span>
              </button>
            </li>

            {/* 6. لپ تاپ های استوک */}
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('stock_laptops')} className={`${styles.navMenuLink} ${activeTab === 'stock_laptops' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>
                  <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/><line x1="12" y1="17" x2="12" y2="20"/></svg>
                </span> لپ تاپ های استوک
              </button>
            </li>

            {/* 7. مشتریان */}
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('customers')} className={`${styles.navMenuLink} ${activeTab === 'customers' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>
                  <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </span> مشتریان
              </button>
            </li>

            {/* 8. پرداخت ها */}
            <li className={styles.navMenuItem}>
              <button onClick={() => { setActiveTab('payments'); setSelectedPaymentId(''); }} className={`${styles.navMenuLink} ${activeTab === 'payments' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>
                  <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </span> پرداخت ها
              </button>
            </li>

            {/* 9. ارسال ها */}
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('shipments')} className={`${styles.navMenuLink} ${activeTab === 'shipments' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>
                  <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </span> ارسال ها
              </button>
            </li>

            {/* 10. گزارش مالی */}
            <li className={styles.navMenuItem}>
              <button onClick={() => { setActiveTab('financial_reports'); setSelectedPaymentId(''); }} className={`${styles.navMenuLink} ${activeTab === 'financial_reports' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>
                  <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                </span> گزارش مالی
              </button>
            </li>

            {/* 11. تنظیمات */}
            <li className={styles.navMenuItem}>
              <button onClick={() => setActiveTab('settings')} className={`${styles.navMenuLink} ${activeTab === 'settings' ? styles.navMenuLinkActive : ''}`}>
                <span className={styles.navIcon}>
                  <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </span> تنظیمات
              </button>
            </li>
          </ul>
        </div>

        {/* Sidebar Bottom Profile Card */}
        <div className={styles.sidebarProfileCard}>
          <div className={styles.profileInfoRow}>
            <img src="/admin-avatar.png" alt="Admin Avatar" className={styles.profileAvatar} />
            <div className={styles.profileMeta}>
              <h3>مدیر سایت</h3>
              <span>مدیر سیستم</span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.exitButton}>
            <span>{AdminIcons.logout(14)}</span> خروج از حساب کاربری
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE CONTENT AREA ── */}
      <div className={styles.workspace}>
        
        {/* Top bar header */}
        <header className={styles.topHeader}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>{AdminIcons.search(14)}</span>
            <input type="text" placeholder="جستجو کنید..." className={styles.searchInput} />
          </div>
          
          <div className={styles.topRightControls}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {(() => {
                // Build dynamic notifications from real leads state (latest 5)
                const sortedLeads = [...leads].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
                const dynamicNotifs = sortedLeads.map(lead => ({
                  id: lead.id,
                  text: `سفارش ${lead.id} توسط ${lead.customerName} — ${lead.productName}`,
                  time: (() => {
                    const diff = Date.now() - new Date(lead.date).getTime();
                    const mins = Math.floor(diff / 60000);
                    const hours = Math.floor(diff / 3600000);
                    const days = Math.floor(diff / 86400000);
                    if (mins < 60) return `${mins} دقیقه پیش`;
                    if (hours < 24) return `${hours} ساعت پیش`;
                    return `${days} روز پیش`;
                  })(),
                  unread: !readNotifIds.includes(lead.id),
                  status: lead.status,
                  targetTab: 'leads',
                  targetOrderId: lead.id
                }));
                const unreadCount = dynamicNotifs.filter(n => n.unread).length;
                const statusLabel = {
                  pending: 'در انتظار', processing: 'در حال پردازش', shipped: 'ارسال شده',
                  delivered: 'تحویل داده شده', cancelled: 'لغو شده'
                };
                return (
                  <>
                    <button
                      className={styles.iconControlBtn}
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      style={{ position: 'relative' }}
                    >
                      <span>{AdminIcons.bell(16)}</span>
                      {unreadCount > 0 && (
                        <span className={styles.bellBadge}>{unreadCount}</span>
                      )}
                    </button>

                    {isNotificationsOpen && (
                      <div
                        style={{
                          position: 'absolute', top: '50px', left: '0', width: '340px',
                          backgroundColor: '#11131a', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                          zIndex: 999, direction: 'rtl', textAlign: 'right', overflow: 'hidden'
                        }}
                      >
                        {/* Header */}
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {AdminIcons.bell(13)} اعلان‌های سفارشات
                            {unreadCount > 0 && <span style={{ background: '#f87820', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '10px' }}>{unreadCount} جدید</span>}
                          </span>
                          <span
                            style={{ fontSize: '10px', color: '#f87820', cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={() => setReadNotifIds(dynamicNotifs.map(n => n.id))}
                          >
                            همه خوانده شد
                          </span>
                        </div>

                        {/* Notifications list */}
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {dynamicNotifs.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#8b92a5', fontSize: '12px' }}>اعلانی وجود ندارد</div>
                          ) : dynamicNotifs.map(n => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setActiveTab(n.targetTab);
                                setSelectedOrderId(n.targetOrderId);
                                setReadNotifIds(prev => [...new Set([...prev, n.id])]);
                                setIsNotificationsOpen(false);
                              }}
                              style={{
                                padding: '11px 16px',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                cursor: 'pointer',
                                background: n.unread ? 'rgba(248,120,32,0.05)' : 'transparent',
                                transition: 'background 0.2s',
                                display: 'flex', alignItems: 'flex-start', gap: '10px'
                              }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = n.unread ? 'rgba(248,120,32,0.05)' : 'transparent'}
                            >
                              {/* Unread dot */}
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: n.unread ? '#f87820' : 'transparent', flexShrink: 0, marginTop: '5px', border: n.unread ? 'none' : '1px solid #3a3f50' }} />
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '11.5px', color: n.unread ? '#fff' : '#c0c8d8', lineHeight: '1.5', fontWeight: n.unread ? '600' : '400' }}>{n.text}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                  <span style={{ fontSize: '9.5px', color: '#8b92a5' }}>{n.time}</span>
                                  <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: '#c0c8d8' }}>{statusLabel[n.status] || n.status}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                          <span
                            style={{ fontSize: '11px', color: '#f87820', cursor: 'pointer', fontWeight: '600' }}
                            onClick={() => { setActiveTab('leads'); setIsNotificationsOpen(false); }}
                          >
                            مشاهده همه سفارشات
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            
            <div className={styles.headerProfileBadge}>
              <img src="/admin-avatar.png" alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', marginLeft: '8px', objectFit: 'cover' }} />
              <span>مدیر سایت</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Tab container */}
        <main className={styles.mainContainer}>
          
          {/* TAB: STOCK LAPTOPS UPLOADER VIEW (Matches mockup image with 100% fidelity) */}
          {activeTab === 'stock_laptops' && (
            <div>
              {laptopViewMode === 'list' ? (
                <div>
                  {/* Mockup Header Row */}
                  <div className={styles.pageTitleSection} style={{ marginBottom: '24px' }}>
                    <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '28px', color: '#f87820' }}>{AdminIcons.laptop(28)}</span>
                      <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '750', color: '#fff', margin: 0 }}>لپ‌تاپ‌های استوک</h1>
                        <p style={{ fontSize: '11px', color: '#8b92a5', marginTop: '2px', margin: 0 }}>مدیریت موجودی و فروش لپ‌تاپ‌های کارکرده</p>
                      </div>
                    </div>

                    <div className={styles.titleActionBtns} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        type="button" 
                        onClick={handleExportLaptopsExcel} 
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s', height: '28px' }}
                      >
                        <span style={{ fontSize: '10px' }}>{AdminIcons.chart(10)}</span>
                        <span>خروجی اکسل</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={triggerAddLaptop} 
                        style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', boxShadow: '0 4px 15px rgba(248, 120, 32, 0.4)', borderRadius: '6px', padding: '4px 10px', fontWeight: '700', fontSize: '11px', height: '28px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', cursor: 'pointer' }}
                      >
                        <span>{AdminIcons.plus(10)}</span>
                        <span>افزودن لپ‌تاپ جدید</span>
                      </button>
                    </div>
                  </div>

                  {/* Mockup Metric Cards Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '25px' }}>
                    {/* Card 1: Total */}
                    <div className={styles.cardPanel} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #a855f7' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#a855f7' }}>{AdminIcons.laptop(18)}</div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>کل لپ‌تاپ‌ها</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.total}</strong>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Available */}
                    <div className={styles.cardPanel} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #2ecc71' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#2ecc71' }}>{AdminIcons.circle(18)}</div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>موجود</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.available}</strong>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Reserved */}
                    <div className={styles.cardPanel} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #ff9d00' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 157, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#ff9d00' }}>{AdminIcons.lock(18)}</div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>رزرو شده</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.reserved}</strong>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Sold */}
                    <div className={styles.cardPanel} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #3b82f6' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#3b82f6' }}>{AdminIcons.bag(18)}</div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>فروخته شده</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <strong style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{metrics.sold}</strong>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>دستگاه</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 5: Total Profit */}
                    <div className={styles.cardPanel} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #2ecc71' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#2ecc71' }}>{AdminIcons.bank(18)}</div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block' }}>سود کل</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <strong style={{ fontSize: '18px', fontWeight: '800', color: '#2ecc71' }}>{Math.round(metrics.profit).toLocaleString('fa-IR')}</strong>
                          <span style={{ fontSize: '9px', color: '#2ecc71' }}>تومان</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two Column Grid Workspace */}
                  <div style={{ display: 'grid', gridTemplateColumns: '7fr 3.2fr', gap: '20px', marginBottom: '25px', alignItems: 'start' }}>
                    
                    {/* LEFT COLUMN: LIST TABLE & FILTERS */}
                    <div className={styles.cardPanel} style={{ padding: '0', overflow: 'hidden' }}>
                      
                      {/* Filter Area */}
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.01)' }}>
                        <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff', marginLeft: 'auto' }}>لیست لپ‌تاپ‌ها</span>
                        
                        {/* Search keyword */}
                        <div style={{ position: 'relative', width: '180px' }}>
                          <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#8b92a5', fontSize: '11px' }}>{AdminIcons.search(11)}</span>
                          <input 
                            type="text" 
                            placeholder="جستجو (مدل، برند، پردازنده...)" 
                            value={laptopSearchQuery}
                            onChange={(e) => setLaptopSearchQuery(e.target.value)}
                            className={styles.searchInput}
                            style={{ width: '100%', padding: '5px 26px 5px 10px', fontSize: '11px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
                          />
                        </div>

                        {/* Dropdown Brand */}
                        <select 
                          value={laptopBrandFilter} 
                          onChange={(e) => setLaptopBrandFilter(e.target.value)}
                          className={styles.selectField}
                          style={{ width: '90px', padding: '4px 6px', fontSize: '11px' }}
                        >
                          <option value="همه">برند</option>
                          <option value="Apple">Apple</option>
                          <option value="Dell">Dell</option>
                          <option value="Lenovo">Lenovo</option>
                          <option value="HP">HP</option>
                          <option value="ASUS">ASUS</option>
                        </select>

                        {/* Dropdown Status */}
                        <select 
                          value={laptopStatusFilter} 
                          onChange={(e) => setLaptopStatusFilter(e.target.value)}
                          className={styles.selectField}
                          style={{ width: '90px', padding: '4px 6px', fontSize: '11px' }}
                        >
                          <option value="همه">وضعیت</option>
                          <option value="available">موجود</option>
                          <option value="reserved">رزرو شده</option>
                          <option value="sold">فروخته شده</option>
                          <option value="unavailable">ناموجود</option>
                        </select>

                        {/* Dropdown RAM */}
                        <select 
                          value={laptopRamFilter} 
                          onChange={(e) => setLaptopRamFilter(e.target.value)}
                          className={styles.selectField}
                          style={{ width: '70px', padding: '4px 6px', fontSize: '11px' }}
                        >
                          <option value="همه">رم</option>
                          <option value="8">8GB</option>
                          <option value="16">16GB</option>
                          <option value="32">32GB</option>
                          <option value="64">64GB</option>
                        </select>

                        {/* Dropdown CPU */}
                        <select 
                          value={laptopCpuFilter} 
                          onChange={(e) => setLaptopCpuFilter(e.target.value)}
                          className={styles.selectField}
                          style={{ width: '90px', padding: '4px 6px', fontSize: '11px' }}
                        >
                          <option value="همه">پردازنده</option>
                          <option value="Apple">Apple M</option>
                          <option value="Intel">Intel Core</option>
                          <option value="Ryzen">AMD Ryzen</option>
                        </select>

                        {/* Reset Filter Button */}
                        <button 
                          onClick={() => {
                            setLaptopSearchQuery('');
                            setLaptopBrandFilter('همه');
                            setLaptopStatusFilter('همه');
                            setLaptopRamFilter('همه');
                            setLaptopCpuFilter('همه');
                          }}
                          className={styles.cancelFormBtn}
                          style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(248,120,32,0.2)', color: '#f87820', borderRadius: '6px' }}
                        >
                          <span>{AdminIcons.sliders(12)}</span> فیلتر
                        </button>
                      </div>

                      {/* Main Table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table className={styles.adminTable} style={{ borderCollapse: 'collapse', width: '100%' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <th style={{ padding: '12px 15px', textAlign: 'center', width: '60px' }}>تصویر</th>
                              <th style={{ textAlign: 'right', fontSize: '11.5px', color: '#8b92a5' }}>مدل</th>
                              <th style={{ textAlign: 'right', fontSize: '11.5px', color: '#8b92a5' }}>پردازنده</th>
                              <th style={{ textAlign: 'right', fontSize: '11.5px', color: '#8b92a5' }}>کارت گرافیک</th>
                              <th style={{ textAlign: 'left', fontSize: '11.5px', color: '#8b92a5' }}>قیمت فروش (تومان)</th>
                              <th style={{ textAlign: 'center', fontSize: '11.5px', color: '#8b92a5' }}>وضعیت</th>
                              <th style={{ textAlign: 'center', fontSize: '11.5px', color: '#8b92a5', width: '100px' }}>عملیات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeLaptopsList.map((laptop) => {
                              const parsedSpecs = parseProductToForm(laptop);
                              const isSelected = selectedLaptop && selectedLaptop.id === laptop.id;
                              
                              let priceToman = 0;
                              if (laptop.rawSpecs && laptop.rawSpecs.sellingPrice) {
                                priceToman = parseFloat(laptop.rawSpecs.sellingPrice);
                              } else {
                                priceToman = laptop.priceAed * 19500;
                              }

                              const statusValue = laptop.stockStatus || 'available';

                              // Status badges colors exactly matching mockup
                              let badgeStyle = { background: 'rgba(46,204,113,0.1)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.2)' };
                              let badgeText = 'موجود';
                              
                              if (statusValue === 'reserved') {
                                badgeStyle = { background: 'rgba(255,157,0,0.1)', color: '#ff9d00', border: '1px solid rgba(255,157,0,0.2)' };
                                badgeText = 'رزرو شده';
                              } else if (statusValue === 'sold') {
                                badgeStyle = { background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' };
                                badgeText = 'فروخته شده';
                              } else if (statusValue === 'unavailable') {
                                badgeStyle = { background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.2)' };
                                badgeText = 'ناموجود';
                              }

                              return (
                                <tr 
                                  key={laptop.id} 
                                  onClick={() => setSelectedLaptopId(laptop.id)}
                                  className={styles.tableRow} 
                                  style={{ 
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)', 
                                    cursor: 'pointer',
                                    background: isSelected ? 'rgba(248,120,32,0.03)' : 'transparent',
                                    borderLeft: isSelected ? '2px solid #f87820' : 'none'
                                  }}
                                >
                                  <td style={{ padding: '18px 15px', textAlign: 'center' }}>
                                    <img 
                                      src={laptop.image} 
                                      alt={laptop.name} 
                                      style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                                    />
                                  </td>
                                  <td style={{ padding: '18px 10px', fontSize: '12px' }}>
                                    <div style={{ fontWeight: '700', color: '#fff' }}>{parsedSpecs.brand} {parsedSpecs.model}</div>
                                    <div style={{ fontSize: '10.5px', fontWeight: '300', color: '#8b92a5', marginTop: '4px' }}>
                                      رم: {parsedSpecs.ram}GB | حافظه: {parsedSpecs.storageSize}{parsedSpecs.storageType}
                                    </div>
                                  </td>
                                  <td style={{ padding: '18px 10px', fontSize: '11.5px', color: '#c4c8d4' }}>{parsedSpecs.cpu}</td>
                                  <td style={{ padding: '18px 10px', fontSize: '11.5px', color: '#8b92a5' }}>{parsedSpecs.gpu}</td>
                                  <td style={{ padding: '18px 10px', fontWeight: '700', color: '#fff', fontSize: '12.5px', textAlign: 'left', fontFamily: 'var(--font-vazirmatn)' }}>
                                    {Math.round(priceToman).toLocaleString('fa-IR')}
                                  </td>
                                  <td style={{ padding: '18px 10px', textAlign: 'center' }}>
                                    <span 
                                      className={styles.statusTag}
                                      style={{ ...badgeStyle, padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}
                                    >
                                      {badgeText}
                                    </span>
                                  </td>
                                  <td style={{ padding: '18px 10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                      <button 
                                        onClick={() => setSelectedLaptopId(laptop.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '13px' }}
                                        title="مشاهده جزئیات"
                                      >
                                        {AdminIcons.eye(13)}
                                      </button>
                                      <button 
                                        onClick={() => triggerEditLaptop(laptop)}
                                        style={{ background: 'transparent', border: 'none', color: '#f87820', cursor: 'pointer', fontSize: '13px' }}
                                        title="ویرایش"
                                      >
                                        {AdminIcons.edit(13)}
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteLaptop(laptop.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '13px' }}
                                        title="حذف"
                                      >
                                        {AdminIcons.trash(13)}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Footer */}
                      <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#8b92a5' }}>
                          <span>نمایش ۱ تا {activeLaptopsList.length} از {activeLaptopsList.length} نتیجه</span>
                        </div>

                        {/* Page Numbers */}
                        <div style={{ display: 'flex', gap: '6px', direction: 'ltr' }}>
                          <button style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', width: '26px', height: '26px', borderRadius: '4px', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>&lt;</button>
                          <button style={{ border: 'none', background: '#f87820', width: '26px', height: '26px', borderRadius: '4px', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>1</button>
                          <button style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', width: '26px', height: '26px', borderRadius: '4px', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>&gt;</button>
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: STICKY LAPTOP DETAILS PANEL */}
                    {selectedLaptop ? (() => {
                      const parsed = parseProductToForm(selectedLaptop);
                      
                      let priceToman = 0;
                      if (selectedLaptop.rawSpecs && selectedLaptop.rawSpecs.sellingPrice) {
                        priceToman = parseFloat(selectedLaptop.rawSpecs.sellingPrice);
                      } else {
                        priceToman = selectedLaptop.priceAed * 19500;
                      }

                      const buyingVal = parseFloat(parsed.buyingPrice) || 0;
                      const extraVal = parseFloat(parsed.extraCosts) || 0;
                      const costDirhams = buyingVal + extraVal;
                      const costToman = costDirhams * 16100;
                      const profitToman = priceToman - costToman;

                      const statusValue = selectedLaptop.stockStatus || 'available';

                      // Status tag
                      let badgeStyle = { background: 'rgba(46,204,113,0.1)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.2)' };
                      let badgeText = 'موجود';
                      if (statusValue === 'reserved') {
                        badgeStyle = { background: 'rgba(255,157,0,0.1)', color: '#ff9d00', border: '1px solid rgba(255,157,0,0.2)' };
                        badgeText = 'رزرو شده';
                      } else if (statusValue === 'sold') {
                        badgeStyle = { background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' };
                        badgeText = 'فروخته شده';
                      } else if (statusValue === 'unavailable') {
                        badgeStyle = { background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.2)' };
                        badgeText = 'ناموجود';
                      }

                      // Gallery list
                      const imagesToUse = (selectedLaptop.rawSpecs && selectedLaptop.rawSpecs.images) 
                        ? selectedLaptop.rawSpecs.images 
                        : [selectedLaptop.image];

                      return (
                        <div className={styles.cardPanel} style={{ padding: '20px', position: 'sticky', top: '80px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
                          {/* Details Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff' }}>جزئیات لپ‌تاپ</span>
                            <button 
                              onClick={() => setSelectedLaptopId(null)}
                              style={{ background: 'transparent', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}
                            >
                              {AdminIcons.close(14)}
                            </button>
                          </div>

                          {/* Gallery Split Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '4fr 1.2fr', gap: '10px', marginBottom: '15px' }}>
                            {/* Main Active Picture */}
                            <div style={{ background: '#000', borderRadius: '10px', overflow: 'hidden', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <img src={imagesToUse[0]} alt="Laptop main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            {/* Thumbnails vertical stack */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {imagesToUse.slice(1, 4).map((img, index) => (
                                <div key={index} style={{ height: '42px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                  <img src={img} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              ))}
                              {imagesToUse.length > 4 && (
                                <div style={{ height: '42px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: '#fff' }}>
                                  +{imagesToUse.length - 4}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Product Title and status row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '750', color: '#fff' }}>{parsed.brand} {parsed.model}</span>
                            <span style={{ ...badgeStyle, padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}>{badgeText}</span>
                          </div>

                          {/* Financial Specs Box */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '10px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '15px' }}>
                            <div style={{ textAlign: 'center' }}>
                              <span style={{ fontSize: '9.5px', color: '#8b92a5', display: 'block', marginBottom: '2px' }}>قیمت خرید</span>
                              <strong style={{ fontSize: '11px', color: '#fff', fontFamily: 'var(--font-vazirmatn)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {Math.round(costToman).toLocaleString('fa-IR')}
                              </strong>
                            </div>
                            <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                              <span style={{ fontSize: '9.5px', color: '#8b92a5', display: 'block', marginBottom: '2px' }}>قیمت فروش</span>
                              <strong style={{ fontSize: '11px', color: 'var(--admin-orange)', fontFamily: 'var(--font-vazirmatn)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {Math.round(priceToman).toLocaleString('fa-IR')}
                              </strong>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <span style={{ fontSize: '9.5px', color: '#8b92a5', display: 'block', marginBottom: '2px' }}>سود معامله</span>
                              <strong style={{ fontSize: '11px', color: '#2ecc71', fontFamily: 'var(--font-vazirmatn)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {Math.round(profitToman).toLocaleString('fa-IR')}
                              </strong>
                            </div>
                          </div>

                          {/* Detail Tabs selector */}
                          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '15px', paddingBottom: '2px', direction: 'rtl' }}>
                            {[
                              { id: 'specs', name: 'مشخصات' },
                              { id: 'tests', name: 'تست‌ها' },
                              { id: 'accessories', name: 'لوازم جانبی' },
                              { id: 'info', name: 'اطلاعات' }
                            ].map((tab) => {
                              const isTabActive = activeDetailTab === tab.id;
                              return (
                                <button 
                                  key={tab.id}
                                  onClick={() => setActiveDetailTab(tab.id)}
                                  style={{ 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: isTabActive ? '#f87820' : '#8b92a5',
                                    borderBottom: isTabActive ? '2px solid #f87820' : 'none',
                                    fontSize: '11px',
                                    fontWeight: isTabActive ? 'bold' : 'normal',
                                    padding: '6px 10px',
                                    cursor: 'pointer',
                                    marginLeft: '6px'
                                  }}
                                >
                                  {tab.name}
                                </button>
                              );
                            })}
                          </div>

                          {/* Tab Content Panels */}
                          <div style={{ minHeight: '230px', maxHeight: '300px', overflowY: 'auto', paddingRight: '6px', paddingLeft: '14px', fontSize: '12px' }} dir="rtl">
                            
                            {/* TAB: SPECS TABLE */}
                            {activeDetailTab === 'specs' && (
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                  {[
                                    { label: 'برند', value: parsed.brand },
                                    { label: 'مدل', value: parsed.model },
                                    { label: 'پردازنده', value: parsed.cpu },
                                    { label: 'رم (RAM)', value: `${parsed.ram}GB` },
                                    { label: 'حافظه اصلی', value: `${parsed.storageSize}${parsed.storageType}` },
                                    { label: 'کارت گرافیک', value: parsed.gpu },
                                    { label: 'اندازه صفحه نمایش', value: `${parsed.screenSize} inch` },
                                    { label: 'سال ساخت', value: parsed.manufactureYear },
                                    { label: 'رنگ', value: parsed.color },
                                    { label: 'وزن', value: `${parsed.weight} kg` },
                                    { label: 'قیمت خرید (درهم)', value: buyingVal.toLocaleString('fa-IR') },
                                    { label: 'قیمت فروش (تومان)', value: Math.round(priceToman).toLocaleString('fa-IR') },
                                    { label: 'سود (تومان)', value: Math.round(profitToman).toLocaleString('fa-IR'), isProfit: true }
                                  ].map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px dashed rgba(255,255,255,0.03)' }}>
                                      <td style={{ padding: '6px 0', color: '#8b92a5' }}>{row.label}</td>
                                      <td style={{ 
                                        padding: '6px 0', 
                                        textAlign: 'left', 
                                        fontWeight: row.isProfit ? 'bold' : 'normal',
                                        color: row.isProfit ? '#2ecc71' : '#fff' 
                                      }}>
                                        {row.value}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}

                            {/* TAB: HARDWARE TESTS CHECKLIST */}
                            {activeDetailTab === 'tests' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {Object.entries(parsed.hardwareTests || {}).map(([key, passed]) => {
                                  const labelMap = {
                                    keyboard: 'صفحه کلید و تاچ‌پد',
                                    speaker: 'بلندگوها و خروجی صدا',
                                    display: 'صفحه نمایش و پیکسل‌ها',
                                    usb: 'پورت‌های USB / اتصالات',
                                    battery: 'شارژدهی و سلامت باتری',
                                    wifi: 'کارت شبکه Wi-Fi و بلوتوث',
                                    camera: 'وب‌کم و میکروفون دستگاه',
                                    charge: 'سیستم تغذیه و آداپتور'
                                  };
                                  return (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                      <span style={{ color: '#c4c8d4' }}>{labelMap[key] || key}</span>
                                      <span style={{ color: passed ? '#2ecc71' : '#ff4d4d', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{passed ? <>{AdminIcons.check(12)} تایید شده</> : <>{AdminIcons.close(12)} خطا</>}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* TAB: ACCESSORIES */}
                            {activeDetailTab === 'accessories' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                  <h4 style={{ color: '#f87820', margin: '0 0 8px 0', fontSize: '12px' }}>اقلام همراه لپ‌تاپ</h4>
                                  <div style={{ display: 'flex', gap: '15px' }}>
                                    <span style={{ color: parsed.accessories?.charger ? '#2ecc71' : '#8b92a5' }}>
                                      {parsed.accessories?.charger ? '{AdminIcons.check(11)} شارژر اصلی دبی' : '{AdminIcons.close(11)} فاقد شارژر اصلی'}
                                    </span>
                                    <span style={{ color: parsed.accessories?.box ? '#2ecc71' : '#8b92a5' }}>
                                      {parsed.accessories?.box ? '{AdminIcons.check(11)} کارتن اورجینال' : '{AdminIcons.close(11)} فاقد کارتن'}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                  <h4 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '12px' }}>وضعیت ظاهری و بدنه</h4>
                                  <span style={{ color: '#ffd073' }}>
                                    وضعیت بدنه: {
                                      parsed.physicalStatus === 'excellent' ? 'عالی (در حد نو)' :
                                      parsed.physicalStatus === 'very_good' ? 'خیلی خوب' :
                                      parsed.physicalStatus === 'good' ? 'خوب' : 'متوسط'
                                    }
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* TAB: EXTRA INFO */}
                            {activeDetailTab === 'info' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                  <div style={{ color: '#8b92a5', marginBottom: '4px' }}>گارانتی و پشتیبانی:</div>
                                  <strong style={{ color: '#ffd073' }}>{parsed.warrantyDays} روز مهلت تست و تعویض کالا</strong>
                                  <div style={{ fontSize: '11px', color: '#8b92a5', marginTop: '4px' }}>انقضا: {parsed.warrantyExpiry}</div>
                                </div>
                                {parsed.customerNotes && (
                                  <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    <div style={{ color: '#8b92a5', marginBottom: '4px' }}>یادداشت مشتری (توضیحات):</div>
                                    <div style={{ color: '#fff', lineHeight: '1.5' }}>{parsed.customerNotes}</div>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>

                          {/* Footer action buttons */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '15px' }}>
                            <button 
                              onClick={() => alert('دستور چاپ برچسب بارکد برای پرینتر انبار ارسال شد.')}
                              className={styles.cancelFormBtn}
                              style={{ padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', justifyContent: 'center' }}
                            >
                              {AdminIcons.printer(12)} چاپ برچسب
                            </button>
                            <button 
                              onClick={() => triggerEditLaptop(selectedLaptop)}
                              className={styles.saveFormBtn}
                              style={{ padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', borderRadius: '8px', color: '#fff', justifyContent: 'center', fontWeight: 'bold' }}
                            >
                              {AdminIcons.edit(13)} ویرایش
                            </button>
                            <button 
                              onClick={() => handleDeleteLaptop(selectedLaptop.id)}
                              className={styles.cancelFormBtn}
                              style={{ padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '8px', color: '#ff4d4d', justifyContent: 'center', background: 'rgba(255, 77, 77, 0.05)' }}
                            >
                              {AdminIcons.trash(13)} حذف
                            </button>
                          </div>

                        </div>
                      );
                    })() : (
                      <div className={styles.cardPanel} style={{ padding: '30px', textAlign: 'center', color: '#8b92a5' }}>
                        برای مشاهده جزئیات لپ‌تاپ، یکی از ردیف‌های جدول را انتخاب نمایید.
                      </div>
                    )}

                  </div>

                  {/* Collapsible Monthly Profit Line Chart */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    
                    {/* LEFT CHART: MONTHLY PROFIT LINE CHART */}
                    <div 
                      className={styles.cardPanel} 
                      onClick={() => setIsMonthlyProfitExpanded(!isMonthlyProfitExpanded)}
                      style={{ 
                        padding: '20px', 
                        cursor: 'pointer', 
                        height: isMonthlyProfitExpanded ? '270px' : '65px', 
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', minHeight: '25px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '750', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {AdminIcons.trendingUp(14)} سود ماهانه لپ‌تاپ‌های استوک
                          {!isMonthlyProfitExpanded && (
                            <span style={{ fontSize: '11px', color: '#2ecc71', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)', marginRight: '10px' }}>
                              (کل سود انبار: {Math.round(metrics.profit).toLocaleString('fa-IR')} تومان)
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: '11px', color: '#8b92a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{isMonthlyProfitExpanded ? AdminIcons.chevronUp(12) : AdminIcons.chevronDown(12)}</span>
                          <span style={{ fontSize: '9px', color: '#8b92a5' }}>۶ ماه اخیر (۱۴۰۳)</span>
                        </span>
                      </div>
                      
                      <div style={{ 
                        opacity: isMonthlyProfitExpanded ? 1 : 0, 
                        transition: 'opacity 0.3s ease',
                        pointerEvents: isMonthlyProfitExpanded ? 'auto' : 'none',
                        position: 'relative', 
                        height: '180px', 
                        width: '100%', 
                        direction: 'ltr',
                        marginTop: '5px'
                      }} onClick={(e) => e.stopPropagation()}>
                        {/* Interactive floating tooltip */}
                        <div style={{ position: 'absolute', left: '72%', top: '35px', transform: 'translateX(-50%)', background: 'rgba(17, 19, 26, 0.95)', border: '1px solid #f87820', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', zIndex: 10, textAlign: 'center', boxShadow: '0 4px 15px rgba(248, 120, 32, 0.3)', pointerEvents: 'none' }}>
                          <div style={{ color: '#ffd073', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۳۸۵,۵۰۰,۰۰۰</div>
                          <div style={{ fontSize: '8px', color: '#8b92a5', marginTop: '2px' }}>تومان</div>
                        </div>

                        <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                          <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f87820" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#f87820" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          <line x1="40" y1="10" x2="480" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="40" y1="40" x2="480" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="40" y1="100" x2="480" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="40" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                          <text x="10" y="14" fill="#8b92a5" fontSize="8" textAnchor="start">500M</text>
                          <text x="10" y="44" fill="#8b92a5" fontSize="8" textAnchor="start">400M</text>
                          <text x="10" y="74" fill="#8b92a5" fontSize="8" textAnchor="start">300M</text>
                          <text x="10" y="104" fill="#8b92a5" fontSize="8" textAnchor="start">200M</text>
                          <text x="10" y="134" fill="#8b92a5" fontSize="8" textAnchor="start">100M</text>

                          <path 
                            d="M 40 130 Q 120 115 170 122 T 270 110 T 370 70 T 480 130 Z" 
                            fill="url(#areaGrad)" 
                          />

                          <path 
                            d="M 40 130 Q 120 115 170 122 T 270 110 T 370 70" 
                            fill="none" 
                            stroke="#f87820" 
                            strokeWidth="3.5" 
                            filter="url(#glow)" 
                            strokeLinecap="round"
                          />

                          <path 
                            d="M 370 70 Q 425 65 480 130" 
                            fill="none" 
                            stroke="rgba(248,120,32,0.3)" 
                            strokeWidth="2.5" 
                            strokeDasharray="4,4"
                          />

                          <circle cx="40" cy="130" r="4.5" fill="#f87820" stroke="#fff" strokeWidth="1.5" />
                          <circle cx="170" cy="122" r="4.5" fill="#f87820" stroke="#fff" strokeWidth="1.5" />
                          <circle cx="270" cy="110" r="4.5" fill="#f87820" stroke="#fff" strokeWidth="1.5" />
                          
                          <circle cx="370" cy="70" r="8" fill="#f87820" fillOpacity="0.3" />
                          <circle cx="370" cy="70" r="4.5" fill="#f87820" stroke="#fff" strokeWidth="1.5" />

                          <text x="40" y="146" fill="#8b92a5" fontSize="9" textAnchor="middle">فروردین</text>
                          <text x="120" y="146" fill="#8b92a5" fontSize="9" textAnchor="middle">اردیبهشت</text>
                          <text x="195" y="146" fill="#8b92a5" fontSize="9" textAnchor="middle">خرداد</text>
                          <text x="270" y="146" fill="#8b92a5" fontSize="9" textAnchor="middle">تیر</text>
                          <text x="370" y="146" fill="#fff" fontSize="9.5" fontWeight="bold" textAnchor="middle">مرداد</text>
                          <text x="480" y="146" fill="#8b92a5" fontSize="9" textAnchor="middle">شهریور</text>
                        </svg>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
                <div>
                  <div className={styles.pageTitleSection}>
                    <div className={styles.titleArea}>
                      <h1>{editingLaptopId ? `ویرایش لپ‌تاپ ${laptopForm.brand} مدل ${laptopForm.model}` : 'افزودن لپ‌تاپ جدید'}</h1>
                      <div className={styles.breadcrumbs}>
                        <span>{editingLaptopId ? 'ویرایش لپ‌تاپ' : 'افزودن لپ‌تاپ جدید'}</span>
                        <span>‹</span>
                        <a href="#" onClick={(e) => { e.preventDefault(); setLaptopViewMode('list'); setEditingLaptopId(null); resetLaptopForm(); }}>مدیریت لپ‌تاپ‌ها</a>
                      </div>
                    </div>

                    <div className={styles.titleActionBtns}>
                      <button 
                        type="button" 
                        onClick={() => { setLaptopViewMode('list'); setEditingLaptopId(null); resetLaptopForm(); }} 
                        className={styles.cancelFormBtn}
                      >
                        <span>{AdminIcons.close(12)}</span> انصراف
                      </button>
                      <button type="button" onClick={handleSaveLaptop} className={styles.saveFormBtn}>
                        <span>{AdminIcons.check(12)}</span> {editingLaptopId ? 'بروزرسانی لپ‌تاپ' : 'ذخیره لپ‌تاپ'}
                      </button>
                    </div>
                  </div>

                  {/* Form split layout grid */}
                  <div className={styles.formGridSplit}>
                
                {/* Left Columns cards */}
                <div className={styles.columnLeft}>
                  
                  {/* 1. Core Info Panel */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>{AdminIcons.user(16)}</span>
                      <h2>اطلاعات اصلی</h2>
                    </div>

                    <div className={styles.formFieldsGrid4}>
                      <div className={styles.formGroup}>
                        <label>برند <span className={styles.requiredStar}>*</span></label>
                        <select 
                          value={laptopForm.brand} 
                          onChange={(e) => handleBrandChange(e.target.value)}
                          className={styles.selectField}
                        >
                          <option value="Apple">Apple</option>
                          <option value="Dell">Dell</option>
                          <option value="Lenovo">Lenovo</option>
                          <option value="HP">HP</option>
                          <option value="ASUS">ASUS</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label>مدل <span className={styles.requiredStar}>*</span></label>
                        <select 
                          value={showCustomModelInput ? "+custom" : laptopForm.model} 
                          onChange={(e) => {
                            if (e.target.value === "+custom") {
                              setShowCustomModelInput(true);
                              setLaptopForm(prev => ({ ...prev, model: '' }));
                            } else {
                              setShowCustomModelInput(false);
                              setLaptopForm(prev => ({ ...prev, model: e.target.value }));
                            }
                          }}
                          className={styles.selectField}
                        >
                          {(modelsByBrand[laptopForm.brand] || []).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                          <option value="+custom">+ افزودن مدل جدید...</option>
                        </select>
                        {showCustomModelInput && (
                          <input 
                            type="text" 
                            value={customModel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomModel(val);
                              setLaptopForm(prev => ({ ...prev, model: val }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                              }
                            }}
                            onBlur={() => {
                              if (customModel.trim()) {
                                const trimmed = customModel.trim();
                                setModelsByBrand(prev => {
                                  const currentList = prev[laptopForm.brand] || [];
                                  if (!currentList.includes(trimmed)) {
                                    return {
                                      ...prev,
                                      [laptopForm.brand]: [...currentList, trimmed]
                                    };
                                  }
                                  return prev;
                                });
                                setLaptopForm(prev => ({ ...prev, model: trimmed }));
                                setShowCustomModelInput(false);
                              } else {
                                setShowCustomModelInput(false);
                                setLaptopForm(prev => ({ ...prev, model: modelsByBrand[laptopForm.brand]?.[0] || '' }));
                              }
                            }}
                            placeholder="تایپ مدل جدید..."
                            className={styles.inputField}
                            style={{ marginTop: '8px' }}
                            autoFocus
                            required
                          />
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>(Serial Number) شماره سریال</label>
                        <input 
                          type="text" 
                          value={laptopForm.serial} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, serial: e.target.value }))}
                          placeholder="شماره سریال (اختیاری)"
                          className={styles.inputField} 
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>پردازنده (CPU) <span className={styles.requiredStar}>*</span></label>
                        <select 
                          value={showCustomCpuInput ? "+custom" : laptopForm.cpu} 
                          onChange={(e) => {
                            if (e.target.value === "+custom") {
                              setShowCustomCpuInput(true);
                              setLaptopForm(prev => ({ ...prev, cpu: '' }));
                            } else {
                              setShowCustomCpuInput(false);
                              setLaptopForm(prev => ({ ...prev, cpu: e.target.value }));
                            }
                          }}
                          className={styles.selectField}
                        >
                          {cpuOptions.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="+custom">+ افزودن پردازنده جدید...</option>
                        </select>
                        {showCustomCpuInput && (
                          <input 
                            type="text" 
                            value={customCpu}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomCpu(val);
                              setLaptopForm(prev => ({ ...prev, cpu: val }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                              }
                            }}
                            onBlur={() => {
                              if (customCpu.trim()) {
                                const trimmed = customCpu.trim();
                                setCpuOptions(prev => {
                                  if (!prev.includes(trimmed)) {
                                    return [...prev, trimmed];
                                  }
                                  return prev;
                                });
                                setLaptopForm(prev => ({ ...prev, cpu: trimmed }));
                                setShowCustomCpuInput(false);
                              } else {
                                setShowCustomCpuInput(false);
                                setLaptopForm(prev => ({ ...prev, cpu: cpuOptions[0] || '' }));
                              }
                            }}
                            placeholder="تایپ پردازنده جدید..."
                            className={styles.inputField}
                            style={{ marginTop: '8px' }}
                            autoFocus
                            required
                          />
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>رم (RAM) - GB <span className={styles.requiredStar}>*</span></label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="number" 
                            value={laptopForm.ram} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, ram: e.target.value }))}
                            min="2"
                            max="256"
                            step="2"
                            className={styles.inputField}
                            required
                          />
                          <span style={{ fontSize: '13px', color: '#8b92a5', fontWeight: 'bold' }}>GB</span>
                        </div>
                      </div>

                      <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                        <label>حافظه داخلی اصلی <span className={styles.requiredStar}>*</span></label>
                        <div className={styles.unifiedStorageGroup}>
                          <input 
                            type="number" 
                            value={laptopForm.storageSize} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, storageSize: e.target.value }))}
                            min="1"
                            max="8192"
                            placeholder="مثال: 256"
                            className={styles.unifiedStorageInput}
                            required
                          />
                          <div className={styles.unifiedStorageSeparator}></div>
                          <select 
                            value={laptopForm.storageType} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, storageType: e.target.value }))}
                            className={styles.unifiedStorageSelect}
                          >
                            <option value="GB SSD">GB SSD</option>
                            <option value="TB SSD">TB SSD</option>
                            <option value="GB HDD">GB HDD</option>
                            <option value="TB HDD">TB HDD</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                        <label>حافظه داخلی دوم (اختیاری)</label>
                        <div className={styles.unifiedStorageGroup}>
                          <input 
                            type="number" 
                            value={laptopForm.storage2Size} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, storage2Size: e.target.value }))}
                            min="0"
                            max="8192"
                            placeholder="مثال: 1"
                            className={styles.unifiedStorageInput}
                          />
                          <div className={styles.unifiedStorageSeparator}></div>
                          <select 
                            value={laptopForm.storage2Type} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, storage2Type: e.target.value }))}
                            className={styles.unifiedStorageSelect}
                          >
                            <option value="none">بدون حافظه دوم</option>
                            <option value="GB SSD">GB SSD</option>
                            <option value="TB SSD">TB SSD</option>
                            <option value="GB HDD">GB HDD</option>
                            <option value="TB HDD">TB HDD</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label>(GPU) کارت گرافیک</label>
                        <select 
                          value={showCustomGpuInput ? "+custom" : laptopForm.gpu} 
                          onChange={(e) => {
                            if (e.target.value === "+custom") {
                              setShowCustomGpuInput(true);
                              setLaptopForm(prev => ({ ...prev, gpu: '' }));
                            } else {
                              setShowCustomGpuInput(false);
                              setLaptopForm(prev => ({ ...prev, gpu: e.target.value }));
                            }
                          }}
                          className={styles.selectField}
                        >
                          {gpuOptions.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                          <option value="+custom">+ افزودن کارت گرافیک جدید...</option>
                        </select>
                        {showCustomGpuInput && (
                          <input 
                            type="text" 
                            value={customGpu}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomGpu(val);
                              setLaptopForm(prev => ({ ...prev, gpu: val }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                              }
                            }}
                            onBlur={() => {
                              if (customGpu.trim()) {
                                const trimmed = customGpu.trim();
                                setGpuOptions(prev => {
                                  if (!prev.includes(trimmed)) {
                                    return [...prev, trimmed];
                                  }
                                  return prev;
                                });
                                setLaptopForm(prev => ({ ...prev, gpu: trimmed }));
                                setShowCustomGpuInput(false);
                              } else {
                                setShowCustomGpuInput(false);
                                setLaptopForm(prev => ({ ...prev, gpu: gpuOptions[0] || '' }));
                              }
                            }}
                            placeholder="تایپ کارت گرافیک جدید..."
                            className={styles.inputField}
                            style={{ marginTop: '8px' }}
                            autoFocus
                            required
                          />
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>اندازه صفحه نمایش - اینچ <span className={styles.requiredStar}>*</span></label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="number" 
                            step="0.1"
                            value={laptopForm.screenSize} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, screenSize: e.target.value }))}
                            placeholder="مثال: 13.6"
                            className={styles.inputField}
                            required
                          />
                          <span style={{ fontSize: '13px', color: '#8b92a5' }}>اینچ</span>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label>سال ساخت <span className={styles.requiredStar}>*</span></label>
                        <input 
                          type="number" 
                          value={laptopForm.manufactureYear} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, manufactureYear: e.target.value }))}
                          placeholder="مثال: 2022"
                          className={styles.inputField}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>رنگ</label>
                        <select 
                          value={showCustomColorInput ? "+custom" : laptopForm.color} 
                          onChange={(e) => {
                            if (e.target.value === "+custom") {
                              setShowCustomColorInput(true);
                              setLaptopForm(prev => ({ ...prev, color: '' }));
                            } else {
                              setShowCustomColorInput(false);
                              setLaptopForm(prev => ({ ...prev, color: e.target.value }));
                            }
                          }}
                          className={styles.selectField}
                        >
                          {colorOptions.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="+custom">+ افزودن رنگ جدید...</option>
                        </select>
                        {showCustomColorInput && (
                          <input 
                            type="text" 
                            value={customColor}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomColor(val);
                              setLaptopForm(prev => ({ ...prev, color: val }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                              }
                            }}
                            onBlur={() => {
                              if (customColor.trim()) {
                                const trimmed = customColor.trim();
                                setColorOptions(prev => {
                                  if (!prev.includes(trimmed)) {
                                    return [...prev, trimmed];
                                  }
                                  return prev;
                                });
                                setLaptopForm(prev => ({ ...prev, color: trimmed }));
                                setShowCustomColorInput(false);
                              } else {
                                setShowCustomColorInput(false);
                                setLaptopForm(prev => ({ ...prev, color: colorOptions[0] || '' }));
                              }
                            }}
                            placeholder="تایپ رنگ جدید..."
                            className={styles.inputField}
                            style={{ marginTop: '8px' }}
                            autoFocus
                            required
                          />
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>سلامت باتری - ٪</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="number" 
                            min="1"
                            max="100"
                            value={laptopForm.batteryHealth} 
                            onChange={(e) => setLaptopForm(prev => ({ ...prev, batteryHealth: e.target.value }))}
                            placeholder="مثال: 92"
                            className={styles.inputField}
                          />
                          <span style={{ fontSize: '13px', color: '#8b92a5', fontWeight: 'bold' }}>٪</span>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label>وزن (Kg)</label>
                        <select 
                          value={laptopForm.weight} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, weight: e.target.value }))}
                          className={styles.selectField}
                        >
                          <option value="1.24">1.24</option>
                          <option value="1.17">1.17</option>
                          <option value="1.35">1.35</option>
                          <option value="1.36">1.36</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. Pricing Panel (Dynamic Calculator) */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>🪙</span>
                      <h2>قیمت گذاری</h2>
                    </div>

                    <div className={styles.formFieldsGrid4}>
                      <div className={styles.formGroup}>
                        <label>قیمت خرید (درهم) <span className={styles.requiredStar}>*</span></label>
                        <input 
                          type="number"
                          value={laptopForm.buyingPrice}
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, buyingPrice: e.target.value }))}
                          className={styles.inputField}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>هزینه‌های جانبی (درهم)</label>
                        <input 
                          type="number"
                          value={laptopForm.extraCosts}
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, extraCosts: e.target.value }))}
                          className={styles.inputField}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>قیمت فروش (تومان) <span className={styles.requiredStar}>*</span></label>
                        <input 
                          type="number"
                          value={laptopForm.sellingPrice}
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                          className={styles.inputField}
                        />
                      </div>

                      {/* Profit Green box exactly matching mockup math */}
                      <div className={styles.profitContainer}>
                        <span className={styles.profitLabel}>سود (تومان)</span>
                        <div className={styles.profitVal}>
                          {fmtToman(calculatedProfit)} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>تومان</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Product Images Gallery (High Parity thumbnails and Dragzone) */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>{AdminIcons.camera(16)}</span>
                      <h2>تصاویر محصول</h2>
                    </div>

                    <div className={styles.uploaderBoxGrid}>
                      <div className={styles.dragDropArea}>
                        <span className={styles.uploadIcon}>{AdminIcons.cloud(16)}</span>
                        <p>
                          برای آپلود تصویر کلیک کنید<br/>
                          <span style={{ fontSize: '8.5px', color: '#555' }}>یا فایل‌ها را اینجا بکشید و رها کنید<br/>فرمت‌های مجاز: JPG, PNG, WebP | حداکثر 10MB</span>
                        </p>
                      </div>

                      {/* Render Laptop mock image thumbnails with delete controls */}
                      {laptopImages.map((imgUrl, idx) => (
                        <div key={idx} className={styles.imageThumbCard}>
                          <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                          <button type="button" onClick={() => handleRemoveImage(idx)} className={styles.removeThumbBtn} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {AdminIcons.close(10)}
                          </button>
                        </div>
                      ))}

                      {/* Add Image card grid box */}
                      <button 
                        type="button" 
                        onClick={() => {
                          const url = prompt('آدرس اینترنتی تصویر جدید را وارد کنید:');
                          if (url) setLaptopImages(prev => [...prev, url]);
                        }} 
                        className={styles.addImageCard}
                      >
                        <span style={{ fontSize: '20px' }}>+</span>
                        <span>افزودن تصویر</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Notes Panel */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>{AdminIcons.edit(13)}</span>
                      <h2>یادداشت‌ها</h2>
                    </div>

                    <div className={styles.formFieldsGrid2}>
                      <div className={styles.formGroup}>
                        <label>یادداشت داخلی (فقط برای مدیریت)</label>
                        <textarea 
                          rows="3"
                          value={laptopForm.internalNotes}
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, internalNotes: e.target.value }))}
                          placeholder="یادداشت‌های داخلی درباره لپ‌تاپ..."
                          className={styles.textareaField}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>توضیحات برای مشتری (اختیاری)</label>
                        <textarea 
                          rows="3"
                          value={laptopForm.customerNotes}
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, customerNotes: e.target.value }))}
                          placeholder="توضیحاتی که برای مشتری نمایش داده خواهد شد..."
                          className={styles.textareaField}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Columns cards */}
                <div className={styles.columnRight}>
                  
                  {/* 1. Technical Status Checklist Panels */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>{AdminIcons.settings(16)}</span>
                      <h2>وضعیت و تست‌های فنی</h2>
                    </div>

                    {/* Hardware Checklist */}
                    <span className={styles.testsCategoryTitle}>تست‌های سخت‌افزاری</span>
                    <div className={styles.checklistGrid}>
                      {[
                        { key: 'keyboard', label: 'تست کیبورد' },
                        { key: 'speaker', label: 'تست اسپیکر' },
                        { key: 'display', label: 'تست نمایشگر' },
                        { key: 'usb', label: 'تست پورت‌های USB' },
                        { key: 'battery', label: 'تست باتری' },
                        { key: 'wifi', label: 'تست وای‌فای' },
                        { key: 'camera', label: 'تست دوربین' },
                        { key: 'charge', label: 'تست شارژ' }
                      ].map(item => (
                        <label key={item.key} className={styles.checkboxLabelRow}>
                          <input 
                            type="checkbox"
                            checked={laptopForm.hardwareTests[item.key]}
                            onChange={(e) => setLaptopForm(prev => ({
                              ...prev,
                              hardwareTests: { ...prev.hardwareTests, [item.key]: e.target.checked }
                            }))}
                          />
                          <span className={styles.checklistLabel}>{item.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Accessories Checklist */}
                    <div className={styles.accessorySection}>
                      <span className={styles.testsCategoryTitle}>لوازم جانبی همراه</span>
                      <div className={styles.checklistGrid}>
                        {[
                          { key: 'charger', label: 'شارژر اصلی' },
                          { key: 'box', label: 'جعبه اصلی' }
                        ].map(item => (
                          <label key={item.key} className={styles.checkboxLabelRow}>
                            <input 
                              type="checkbox"
                              checked={laptopForm.accessories[item.key]}
                              onChange={(e) => setLaptopForm(prev => ({
                                ...prev,
                                accessories: { ...prev.accessories, [item.key]: e.target.checked }
                              }))}
                            />
                            <span className={styles.checklistLabel}>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Physical status Radios with neon green عالی active check */}
                    <div className={styles.physicalStatusSection}>
                      <span className={styles.testsCategoryTitle}>وضعیت ظاهری</span>
                      <div className={styles.radioFlexRow}>
                        {[
                          { key: 'excellent', label: 'عالی' },
                          { key: 'very_good', label: 'خیلی خوب' },
                          { key: 'good', label: 'خوب' },
                          { key: 'fair', label: 'متوسط' }
                        ].map(item => (
                          <label key={item.key} className={styles.radioLabelRow}>
                            <input 
                              type="radio" 
                              name="physicalStatus"
                              checked={laptopForm.physicalStatus === item.key}
                              onChange={() => setLaptopForm(prev => ({ ...prev, physicalStatus: item.key }))}
                            />
                            <span className={styles.checklistLabel}>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Stock status Panel */}
                  <div className={styles.cardPanel}>
                    <div className={styles.cardHeaderRow}>
                      <span className={styles.cardHeaderIcon}>{AdminIcons.package(16)}</span>
                      <h2>وضعیت موجودی</h2>
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                      <label>وضعیت <span className={styles.requiredStar}>*</span></label>
                      <select 
                        value={laptopForm.stockStatus} 
                        onChange={(e) => setLaptopForm(prev => ({ ...prev, stockStatus: e.target.value }))}
                        className={styles.selectField}
                      >
                        <option value="available">موجود</option>
                        <option value="reserved">رزرو شده</option>
                        <option value="sold">فروخته شده</option>
                        <option value="unavailable">ناموجود</option>
                      </select>
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                      <label>تاریخ ورود به انبار <span className={styles.requiredStar}>*</span></label>
                      <div className={styles.dateInputWrapper}>
                        <input 
                          type="text" 
                          value={laptopForm.dateEntered} 
                          onChange={(e) => setLaptopForm(prev => ({ ...prev, dateEntered: e.target.value }))}
                          placeholder="مثال: 1403/03/20"
                          className={styles.inputField} 
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>کد داخلی (SKU) (اختیاری)</label>
                      <input 
                        type="text" 
                        value={laptopForm.internalSku} 
                        onChange={(e) => setLaptopForm(prev => ({ ...prev, internalSku: e.target.value }))}
                        className={styles.inputField} 
                      />
                    </div>
                  </div>

                </div>

              </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: DASHBOARD - OPERATIONAL REDESIGN */}
          {activeTab === 'overview' && (() => {
            const pendingLeadsCount = leads.filter(l => l.status === 'pending').length;
            const activeOrders = leads.filter(l => l.status !== 'cancelled' && l.status !== 'delivered').length;

            return (
            <div style={{ direction: 'rtl' }}>

              {/* ALERTS BANNER */}
              <div style={{ background: 'rgba(248,120,32,0.06)', border: '1px solid rgba(248,120,32,0.18)', borderRadius: '14px', padding: '14px 18px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ color: '#f87820' }}>{AdminIcons.alert(15)}</span>
                  <span style={{ fontWeight: '800', fontSize: '13px', color: '#f87820' }}>هشدارهای امروز</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { text: 'نرخ درهم به‌روزرسانی نشده', urgent: true, onClick: () => setActiveTab('settings') },
                    { text: `${leads.filter(l => l.status === 'shipped').length + 2} سفارش ارسال‌نشده`, urgent: true, onClick: () => setActiveTab('shipments') },
                    { text: `${pendingLeadsCount} درخواست منتظر قیمت`, urgent: false, onClick: () => { setActiveTab('leads'); setActiveStatusFilter('pending'); } },
                    { text: '3 محصول کم‌موجود', urgent: false, onClick: () => setActiveTab('site_products') },
                  ].map((item, i) => (
                    <div
                      key={i}
                      onClick={item.onClick}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '5px 14px', borderRadius: '20px', cursor: 'pointer',
                        background: item.urgent ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${item.urgent ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}`,
                        color: item.urgent ? '#ef4444' : '#c0c8d8',
                        fontSize: '11.5px', fontWeight: '600', transition: 'opacity 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseOut={e => e.currentTarget.style.opacity = '1'}
                    >
                      {item.urgent ? AdminIcons.alert(11) : AdminIcons.clock(11)} {item.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'درآمد امروز', value: '48,200,000', unit: 'تومان', trend: '+12.5%', trendUp: true, iconColor: '#f87820', iconBg: 'rgba(248,120,32,0.1)', onClick: () => setActiveTab('financial_reports'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
                  { label: 'سود ماه جاری', value: '386,750,000', unit: 'تومان', trend: '+21.3%', trendUp: true, iconColor: '#2ecc71', iconBg: 'rgba(46,204,113,0.1)', onClick: () => setActiveTab('financial_reports'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                  { label: 'سفارشات فعال', value: String(activeOrders + 78), unit: 'سفارش', trend: '+8 امروز', trendUp: true, iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.1)', onClick: () => { setActiveTab('leads'); setActiveStatusFilter('all'); }, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                  { label: 'درخواست‌های فعال', value: String(pendingLeadsCount + 14), unit: 'درخواست', trend: `${pendingLeadsCount} منتظر قیمت`, trendUp: false, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)', onClick: () => { setActiveTab('leads'); setActiveStatusFilter('pending'); }, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg> },
                  { label: 'پرداخت‌های در انتظار', value: '7', unit: 'تراکنش', trend: 'نیاز به تایید', trendUp: false, iconColor: '#a855f7', iconBg: 'rgba(168,85,247,0.1)', onClick: () => setActiveTab('payments'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
                  { label: 'مشتریان فعال', value: '2,145', unit: 'مشتری', trend: '+15.6%', trendUp: true, iconColor: '#eab308', iconBg: 'rgba(234,179,8,0.1)', onClick: () => setActiveTab('customers'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                ].map((card, i) => (
                  <div key={i} className={styles.cardPanel} onClick={card.onClick}
                    style={{ padding: '16px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(248,120,32,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.backgroundColor = 'var(--admin-card-bg)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.iconColor }}>{card.icon}</div>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', textAlign: 'left' }}>{card.label}</span>
                    </div>
                    <strong style={{ fontSize: '20px', fontWeight: '900', color: '#fff', display: 'block', lineHeight: 1 }}>{card.value}</strong>
                    <span style={{ fontSize: '9px', color: '#8b92a5' }}>{card.unit}</span>
                    <div style={{ marginTop: '8px', fontSize: '9.5px', color: card.trendUp ? '#2ecc71' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {card.trendUp ? '▲' : '●'} {card.trend}
                    </div>
                  </div>
                ))}
              </div>

              {/* QUICK ACCESS */}
              <div className={styles.cardPanel} style={{ padding: '14px 20px', borderRadius: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '800', fontSize: '12px', color: '#8b92a5', whiteSpace: 'nowrap' }}>دسترسی سریع:</span>
                  {[
                    { label: 'ثبت سفارش', onClick: () => setActiveTab('leads') },
                    { label: 'افزودن محصول', onClick: () => setActiveTab('site_products') },
                    { label: 'افزودن لپ‌تاپ استوک', onClick: () => setActiveTab('stock_laptops') },
                    { label: 'ثبت پرداخت', onClick: () => setActiveTab('payments') },
                    { label: 'ثبت ارسال', onClick: () => setActiveTab('shipments') },
                    { label: 'به‌روزرسانی نرخ درهم', onClick: () => setActiveTab('settings') },
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.onClick}
                      style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#c0c8d8', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(248,120,32,0.1)'; e.currentTarget.style.borderColor = 'rgba(248,120,32,0.3)'; e.currentTarget.style.color = '#f87820'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#c0c8d8'; }}
                    >{btn.label}</button>
                  ))}
                </div>
              </div>

              {/* MAIN GRID: Action Items + Orders */}
              <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: '18px', marginBottom: '18px' }}>

                {/* کارهای نیازمند اقدام */}
                <div className={styles.cardPanel} style={{ padding: '20px', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>کارهای نیازمند اقدام</span>
                    <span style={{ fontSize: '9px', background: 'rgba(248,120,32,0.15)', color: '#f87820', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>{pendingLeadsCount + 7} مورد</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'درخواست‌های منتظر قیمت', count: pendingLeadsCount + 4, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: AdminIcons.clock(13), onClick: () => { setActiveTab('leads'); setActiveStatusFilter('pending'); } },
                      { label: 'سفارش‌های آماده ارسال', count: leads.filter(l => l.status === 'purchased' || l.status === 'warehouse_dubai').length + 3, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', icon: AdminIcons.truck(13), onClick: () => setActiveTab('shipments') },
                      { label: 'پرداخت‌های تایید نشده', count: 7, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: AdminIcons.card(13), onClick: () => setActiveTab('payments') },
                      { label: 'محصولات کم‌موجود', count: 3, color: '#a855f7', bg: 'rgba(168,85,247,0.08)', icon: AdminIcons.alert(13), onClick: () => setActiveTab('site_products') },
                      { label: 'درخواست‌های بدون پاسخ', count: 2, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', icon: AdminIcons.chat(13), onClick: () => setActiveTab('leads') },
                    ].map((item, i) => (
                      <div key={i} onClick={item.onClick}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', background: item.bg, border: `1px solid ${item.color}20`, transition: 'opacity 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: item.color }}>
                          {item.icon}
                          <span style={{ fontSize: '11.5px', color: '#c0c8d8', fontWeight: '600' }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '900', color: item.color }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* آخرین سفارشات */}
                <div className={styles.cardPanel} style={{ padding: '20px', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>آخرین سفارشات</span>
                    <button onClick={() => { setActiveTab('leads'); setActiveStatusFilter('all'); }} style={{ padding: '5px 14px', fontSize: '10px', borderRadius: '8px', border: '1px solid rgba(248,120,32,0.4)', background: 'transparent', color: '#f87820', cursor: 'pointer', fontWeight: '700' }}>مشاهده همه</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 90px 80px', gap: '8px', padding: '4px 8px', marginBottom: '6px' }}>
                    {['شماره سفارش', 'مشتری', 'مبلغ', 'وضعیت', 'تاریخ', ''].map((h, i) => (
                      <span key={i} style={{ fontSize: '9.5px', color: '#8b92a5', fontWeight: '700' }}>{h}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[...leads].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7).map((order) => {
                      const stMap = {
                        pending: { label: 'در انتظار', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                        price_tagged: { label: 'قیمت‌گذاری', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
                        approved: { label: 'تایید شده', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)' },
                        purchased: { label: 'خریداری', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
                        warehouse_dubai: { label: 'انبار دبی', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                        shipped: { label: 'ارسال شده', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)' },
                        delivered: { label: 'تحویل شده', color: '#8b92a5', bg: 'rgba(139,146,165,0.1)' },
                        cancelled: { label: 'لغو شده', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                      };
                      const st = stMap[order.status] || { label: order.status, color: '#8b92a5', bg: 'rgba(139,146,165,0.1)' };
                      const d = new Date(order.date);
                      const dateStr = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
                      return (
                        <div key={order.id} onClick={() => { setActiveTab('leads'); setSelectedOrderId(order.id); }}
                          style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 90px 80px', gap: '8px', alignItems: 'center', padding: '10px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(248,120,32,0.04)'; e.currentTarget.style.borderColor = 'rgba(248,120,32,0.15)'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'; }}
                        >
                          <span style={{ fontWeight: '700', fontSize: '11px', color: '#f87820' }}>#{order.id}</span>
                          <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>{order.customerName}</span>
                          <span style={{ fontSize: '11px', color: '#c0c8d8' }}>{(order.totalToman || 0).toLocaleString()} ت</span>
                          <span style={{ fontSize: '9.5px', padding: '3px 8px', borderRadius: '6px', background: st.bg, color: st.color, fontWeight: '700' }}>{st.label}</span>
                          <span style={{ fontSize: '10px', color: '#8b92a5' }}>{dateStr}</span>
                          <button style={{ padding: '4px 10px', fontSize: '9.5px', borderRadius: '6px', border: '1px solid rgba(248,120,32,0.3)', background: 'transparent', color: '#f87820', cursor: 'pointer', fontWeight: '700' }}>مشاهده ↩</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BOTTOM GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 210px', gap: '18px' }}>

                {/* درخواست‌های خرید */}
                <div className={styles.cardPanel} style={{ padding: '20px', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>درخواست‌های خرید</span>
                    <button onClick={() => setActiveTab('leads')} style={{ padding: '5px 14px', fontSize: '10px', borderRadius: '8px', border: '1px solid rgba(248,120,32,0.4)', background: 'transparent', color: '#f87820', cursor: 'pointer', fontWeight: '700' }}>مشاهده همه</button>
                  </div>
                  {[
                    { label: 'منتظر قیمت‌گذاری', count: leads.filter(l => l.status === 'pending').length + 4, color: '#f59e0b', desc: 'درخواست ارسال شده، قیمت‌گذاری نشده', onClick: () => { setActiveTab('leads'); setActiveStatusFilter('pending'); } },
                    { label: 'قیمت ارسال شده', count: leads.filter(l => l.status === 'price_tagged').length + 2, color: '#a855f7', desc: 'در انتظار تایید مشتری', onClick: () => { setActiveTab('leads'); setActiveStatusFilter('price_tagged'); } },
                    { label: 'منتظر تایید مشتری', count: leads.filter(l => l.status === 'approved').length + 1, color: '#06b6d4', desc: 'قیمت اعلام شده، تایید نشده', onClick: () => { setActiveTab('leads'); setActiveStatusFilter('approved'); } },
                    { label: 'تبدیل به سفارش', count: leads.filter(l => ['purchased','warehouse_dubai','shipped','delivered'].includes(l.status)).length, color: '#2ecc71', desc: 'پرداخت شده و در جریان', onClick: () => { setActiveTab('leads'); setActiveStatusFilter('all'); } },
                  ].map((stage, i) => (
                    <div key={i} onClick={stage.onClick}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = `${stage.color}10`; e.currentTarget.style.borderColor = `${stage.color}30`; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '4px', height: '36px', borderRadius: '4px', background: stage.color }} />
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#fff' }}>{stage.label}</div>
                          <div style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>{stage.desc}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '22px', fontWeight: '900', color: stage.color }}>{stage.count}</span>
                    </div>
                  ))}
                </div>

                {/* تراکنش‌های اخیر */}
                <div className={styles.cardPanel} style={{ padding: '20px', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>تراکنش‌های اخیر</span>
                    <button onClick={() => setActiveTab('payments')} style={{ padding: '5px 14px', fontSize: '10px', borderRadius: '8px', border: '1px solid rgba(248,120,32,0.4)', background: 'transparent', color: '#f87820', cursor: 'pointer', fontWeight: '700' }}>مشاهده همه</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { id: 'DK-1256', label: 'پرداخت سفارش', amount: '28,450,000', type: 'success' },
                      { id: 'DK-1255', label: 'پرداخت سفارش', amount: '65,300,000', type: 'success' },
                      { id: 'DK-1254', label: 'پرداخت سفارش', amount: '12,750,000', type: 'success' },
                      { id: 'DK-1253', label: 'پرداخت در انتظار', amount: '9,800,000', type: 'pending' },
                      { id: 'DK-1249', label: 'بازگشت وجه', amount: '42,200,000', type: 'refund' },
                    ].map((tx, i) => {
                      const ts = { success: { color: '#2ecc71', bg: 'rgba(46,204,113,0.08)', label: 'موفق', icon: AdminIcons.check(11) }, pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'در انتظار', icon: AdminIcons.clock(11) }, refund: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'برگشتی', icon: AdminIcons.sync(11) } }[tx.type];
                      return (
                        <div key={i} onClick={() => { setActiveTab('leads'); setSelectedOrderId(tx.id); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(248,120,32,0.15)'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: ts.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ts.color }}>{ts.icon}</div>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '11.5px', color: '#fff' }}>{tx.label} #{tx.id}</div>
                              <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '1px' }}>{tx.amount} تومان</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '9.5px', padding: '3px 8px', borderRadius: '6px', background: ts.bg, color: ts.color, fontWeight: '700' }}>{ts.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* موجودی لپ‌تاپ‌های استوک */}
                <div className={styles.cardPanel} onClick={() => setActiveTab('stock_laptops')}
                  style={{ padding: '20px', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(248,120,32,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(248,120,32,0.03)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.backgroundColor = 'var(--admin-card-bg)'; }}
                >
                  <div>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(248,120,32,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87820', marginBottom: '14px' }}>{AdminIcons.laptop(20)}</div>
                    <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>موجودی لپ‌تاپ‌های استوک</div>
                    <div style={{ fontSize: '52px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>68</div>
                    <div style={{ fontSize: '12px', color: '#8b92a5', marginTop: '4px' }}>دستگاه</div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    {[['موجود', '52 دستگاه', '#2ecc71'], ['رزرو شده', '11 دستگاه', '#f59e0b'], ['فروخته شده', '5 دستگاه', '#8b92a5']].map(([k, v, c]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '10px', color: '#8b92a5' }}>{k}</span>
                        <span style={{ fontSize: '10px', color: c, fontWeight: '700' }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '12px', textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(248,120,32,0.08)', border: '1px solid rgba(248,120,32,0.15)', color: '#f87820', fontSize: '11px', fontWeight: '700' }}>مشاهده کاتالوگ ↩</div>
                  </div>
                </div>

              </div>
            </div>
            );
          })()}

          {/* TAB: LEADS & ACCORDIONS VIEW */}
          {(activeTab === 'leads' || activeTab === 'orders') && (() => {
            const getCustomerAvatar = (id) => {
              const avatars = {
                'DK-1256': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
                'DK-1255': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
                'DK-1254': 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&crop=face',
                'DK-1253': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face',
                'DK-1252': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
                'DK-1251': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
                'DK-1250': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
                'DK-1249': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face'
              };
              return avatars[id] || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face';
            };

            const getStatusStyle = (status) => {
              const stylesMap = {
                pending: { label: 'در انتظار بررسی', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
                price_tagged: { label: 'قیمت‌گذاری شده', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
                approved: { label: 'تایید شده', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                processing: { label: 'در حال پردازش', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
                purchased: { label: 'در نون دبی', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                noon_dubai: { label: 'در نون دبی', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                warehouse_dubai: { label: 'در انبار دبی', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
                shipped: { label: 'ارسال شده', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
                delivered: { label: 'تحویل شده', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                cancelled: { label: 'لغو شده', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
              };
              return stylesMap[status] || { label: 'در انتظار بررسی', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' };
            };

            const isOrdersTab = activeTab === 'orders';
            const statCards = isOrdersTab ? [
              { key: 'cancelled', label: 'لغو شده', count: leads.filter(l => l.status === 'cancelled').length, icon: AdminIcons.close(18), color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', sub: 'سفارش لغو شده' },
              { key: 'delivered', label: 'تحویل شده', count: leads.filter(l => l.status === 'delivered').length, icon: AdminIcons.check(18), color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', sub: 'سفارش تحویل شده' },
              { key: 'shipped', label: 'ارسال شده', count: leads.filter(l => l.status === 'shipped').length, icon: AdminIcons.truck(18), color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', sub: 'ارسال شده به ایران' },
              { key: 'warehouse_dubai', label: 'در انبار دبی', count: leads.filter(l => l.status === 'warehouse_dubai').length, icon: AdminIcons.building(18), color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', sub: 'موجود در دفتر دبی' },
              { key: 'noon_dubai', label: 'در نون دبی', count: leads.filter(l => l.status === 'noon_dubai' || l.status === 'purchased').length, icon: AdminIcons.package(18), color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', sub: 'خرید شده از دبی' },
              { key: 'processing', label: 'در حال پردازش', count: leads.filter(l => l.status === 'processing').length, icon: AdminIcons.clock(18), color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', sub: 'سفارشات جدید پرداختی' },
              { key: 'all', label: 'همه سفارشات', count: leads.filter(l => ['processing', 'purchased', 'noon_dubai', 'warehouse_dubai', 'shipped', 'delivered', 'cancelled'].includes(l.status)).length, icon: AdminIcons.clipboard(18), color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)', sub: 'کل سفارشات نهایی' }
            ] : [
              { key: 'approved', label: 'تایید شده', count: leads.filter(l => l.status === 'approved').length, icon: AdminIcons.check(18), color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', sub: 'تایید توسط ادمین' },
              { key: 'price_tagged', label: 'قیمت‌گذاری شده', count: leads.filter(l => l.status === 'price_tagged').length, icon: AdminIcons.tag(18), color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', sub: 'محاسبه قیمت نهایی' },
              { key: 'pending', label: 'در انتظار بررسی', count: leads.filter(l => l.status === 'pending').length, icon: AdminIcons.clock(18), color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', sub: 'پیش‌فاکتور جدید' },
              { key: 'new_order', label: 'سفارش جدید', count: leads.filter(l => l.status === 'new_order').length, icon: AdminIcons.download(18), color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', sub: 'ثبت سیستم' },
              { key: 'all', label: 'همه درخواست‌ها', count: leads.filter(l => ['pending', 'price_tagged', 'approved', 'new_order'].includes(l.status)).length, icon: AdminIcons.clipboard(18), color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)', sub: 'کل پیش‌فاکتورها' }
            ];

            const selectedLead = filteredLeads.find(l => l.id === selectedOrderId) || filteredLeads[0];

            return (
              <div>
                {/* 1. Header with Farsi Page Title and Far-Left Action Buttons */}
                <div className={styles.sectionHeader} style={{ marginBottom: '20px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>
                      {isOrdersTab ? AdminIcons.card(22) : AdminIcons.download(22)} {isOrdersTab ? 'سفارشات خرید از دبی' : 'درخواست‌های خرید از دبی'}
                    </h1>
                    <p className={styles.sectionDesc} style={{ fontSize: '12px', color: '#8b92a5' }}>
                      {isOrdersTab ? 'مدیریت و پیگیری سفارشات نهایی و پرداخت شده مشتریان، وضعیت‌های ارسال و تحویل' : 'بررسی پیش‌فاکتورها، اعلام قیمت و مدیریت درخواست‌های اولیه خرید'}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => alert('خروجی اکسل با موفقیت بارگیری شد (شبیه‌سازی)')}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      {AdminIcons.download(12)} خروجی اکسل
                    </button>
                    <button 
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      {AdminIcons.search(12)} فیلترها
                    </button>
                    <button 
                      onClick={() => {
                        const newId = `DK-${1240 + Math.floor(Math.random() * 100)}`;
                        const newLeadObj = {
                          id: newId,
                          customerName: 'کاربر جدید دبی خرید',
                          phone: '09121111111',
                          address: 'تهران، نیاوران، پلاک ۱۲، واحد ۳',
                          notes: 'سفارش ثبت شده آزمایشی ادمین.',
                          productName: 'Apple AirTags (4 Pack)',
                          brand: 'Apple',
                          weight: 0.12,
                          totalToman: 6800000,
                          priceAed: 350,
                          date: new Date().toISOString(),
                          status: 'pending',
                          paymentMethod: 'gateway',
                          trackingNum: '3321568947',
                          paymentStatus: 'paid',
                          img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80',
                          items: [{ name: 'Apple AirTags (4 Pack)', brand: 'Apple', quantity: 1, priceAed: 350, discountPercent: 0 }],
                          priceDetails: { product: 5500000, shipping: 700000, commission: 600000 }
                        };
                        const updatedLeads = [newLeadObj, ...leads];
                        setLeads(updatedLeads);
                        localStorage.setItem('dubaiKharidLeads', JSON.stringify(updatedLeads));
                        setSelectedOrderId(newId);
                      }}
                      style={{
                        background: '#f87820',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(248, 120, 32, 0.25)',
                        fontFamily: 'inherit'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#e06612'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#f87820'; }}
                    >
                      {AdminIcons.plus(12)} سفارش جدید
                    </button>
                  </div>
                </div>

                {/* 2. Horizontal Scroll Stat Metrics Cards Bar */}
                <div className={styles.statOrdersRow}>
                  {statCards.map((card) => {
                    const isActive = activeStatusFilter === card.key;
                    return (
                      <div 
                        key={card.key}
                        className={`${styles.statOrdersCard} ${isActive ? styles.statOrdersCardActive : ''}`}
                        onClick={() => setActiveStatusFilter(card.key)}
                      >
                        <div 
                          className={styles.statOrdersCardIcon}
                          style={{
                            color: card.color,
                            backgroundColor: isActive ? 'transparent' : card.bg,
                            border: isActive ? `1px solid ${card.color}` : 'none'
                          }}
                        >
                          {card.icon}
                        </div>
                        <div className={styles.statOrdersMeta}>
                          <span className={styles.statOrdersLabel}>{card.label}</span>
                          <div className={styles.statOrdersCountRow}>
                            <span className={styles.statOrdersCount}>{card.count}</span>
                            <span className={styles.statOrdersSub}>سفارش</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3. Split-Screen Layout Workspace Grid */}
                <div className={styles.splitWorkspaceGrid}>
                  
                  {/* Column 1: Orders Listing & Filters (Right Side, occupies 2.3fr track) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Filters and Search Strip */}
                    <div 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '14px',
                        padding: '12px 16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1, maxWidth: '350px' }}>
                        <div 
                          style={{ 
                            position: 'relative', 
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ position: 'absolute', right: '12px', color: '#8b92a5', fontSize: '12px' }}>{AdminIcons.search(12)}</span>
                          <input 
                            type="text" 
                            placeholder="جستجو کنید..."
                            value={leadSearch}
                            onChange={(e) => setLeadSearch(e.target.value)}
                            style={{
                              width: '100%',
                              background: '#11131a',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '10px',
                              padding: '8px 34px 8px 12px',
                              color: '#fff',
                              fontSize: '12px',
                              fontFamily: 'inherit',
                              outline: 'none',
                              transition: 'all 0.25s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(248, 120, 32, 0.4)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select 
                          value={activeStatusFilter}
                          onChange={(e) => setActiveStatusFilter(e.target.value)}
                          style={{
                            background: '#1a1d26',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#e5e7eb',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="all">همه وضعیت‌ها</option>
                          <option value="pending">در انتظار بررسی</option>
                          <option value="price_tagged">قیمت‌گذاری شده</option>
                          <option value="approved">تایید شده</option>
                          <option value="warehouse_dubai">در انبار دبی</option>
                          <option value="noon_dubai">در نون دبی</option>
                          <option value="shipped">ارسال شده</option>
                          <option value="delivered">تحویل شده</option>
                          <option value="cancelled">لغو شده</option>
                        </select>

                        <select 
                          value={activePaymentFilter}
                          onChange={(e) => setActivePaymentFilter(e.target.value)}
                          style={{
                            background: '#1a1d26',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#e5e7eb',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="all">همه روش‌های پرداخت</option>
                          <option value="gateway">درگاه بانکی</option>
                          <option value="card">کارت به کارت</option>
                        </select>

                        <select 
                          style={{
                            background: '#1a1d26',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#e5e7eb',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="all">همه تاریخ‌ها</option>
                          <option value="today">امروز</option>
                          <option value="yesterday">دیروز</option>
                          <option value="this-month">این ماه</option>
                        </select>

                        <button 
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#e5e7eb',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          {AdminIcons.sliders(12)} فیلتر پیشرفته
                        </button>
                      </div>
                    </div>

                    <div className={styles.tableContainer} style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', overflow: 'hidden' }}>
                      <table className={styles.adminTable}>
                        <thead>
                          <tr>
                            <th>شماره سفارش</th>
                            <th>مشتری</th>
                            <th>وضعیت</th>
                            <th>مبلغ (تومان)</th>
                            <th>روش پرداخت</th>
                            <th>تاریخ ثبت</th>
                            <th style={{ textAlign: 'left', paddingLeft: '20px' }}>عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeads.length === 0 ? (
                            <tr key="empty-leads">
                              <td colSpan="7" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>هیچ موردی با فیلترهای کنونی یافت نشد.</td>
                            </tr>
                          ) : (
                            filteredLeads.map((lead) => {
                              const isSelected = selectedOrderId === lead.id;
                              const statusSpec = getStatusStyle(lead.status);
                              
                              return (
                                <tr 
                                  key={lead.id} 
                                  onClick={() => setSelectedOrderId(lead.id)}
                                  style={{
                                    cursor: 'pointer',
                                    background: isSelected ? 'rgba(248, 120, 32, 0.06)' : 'transparent',
                                    borderRight: isSelected ? '3px solid #f87820' : '3px solid transparent',
                                    transition: 'all 0.2s ease-in-out'
                                  }}
                                >
                                  <td style={{ fontWeight: '800', fontFamily: 'monospace', color: '#ff9d00', fontSize: '12px' }}>
                                    {lead.id}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontWeight: '750', color: '#fff', fontSize: '12.5px' }}>{lead.customerName}</span>
                                      <span style={{ fontSize: '10.5px', color: '#8b92a5', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{lead.phone}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span 
                                      style={{
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '10.5px',
                                        fontWeight: '750',
                                        color: statusSpec.color,
                                        backgroundColor: statusSpec.bg,
                                        display: 'inline-block'
                                      }}
                                    >
                                      {statusSpec.label}
                                    </span>
                                  </td>
                                  <td style={{ fontWeight: '850', color: '#fff', fontSize: '13px' }}>
                                    {fmtToman(lead.totalToman)} <span style={{ fontSize: '10px', color: '#8b92a5', fontWeight: 'normal' }}>T</span>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span 
                                        className={styles.paymentDot} 
                                        style={{ backgroundColor: lead.paymentMethod === 'gateway' ? '#10b981' : '#f59e0b' }}
                                      />
                                      <span style={{ fontSize: '11px', fontWeight: '700' }}>
                                        {lead.paymentMethod === 'gateway' ? 'درگاه بانکی' : 'کارت به کارت'}
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{ fontSize: '11px', color: '#8b92a5' }}>
                                    {new Date(lead.date).toLocaleDateString('fa-IR')}
                                  </td>
                                  <td style={{ textAlign: 'left', paddingLeft: '20px' }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                      <a 
                                        href={getWhatsAppLink(lead)} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{
                                          background: 'rgba(16, 185, 129, 0.08)',
                                          color: '#10b981',
                                          borderRadius: '6px',
                                          padding: '5px 8px',
                                          fontSize: '10.5px',
                                          fontWeight: '700',
                                          textDecoration: 'none',
                                          display: 'inline-flex',
                                          alignItems: 'center'
                                        }}
                                      >
                                        {AdminIcons.whatsapp(12)}
                                      </a>
                                      
                                      <button 
                                        onClick={() => handleDeleteLead(lead.id)}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: '#ef4444',
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          padding: '4px 8px',
                                          display: 'inline-flex',
                                          alignItems: 'center'
                                        }}
                                        title="حذف سفارش"
                                      >
                                        {AdminIcons.trash(12)}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className={styles.pagerContainer}>
                      <div className={styles.pagerBtns}>
                        <button className={`${styles.pagerBtn} ${styles.pagerBtnActive}`}>1</button>
                        <button className={styles.pagerBtn}>2</button>
                        <button className={styles.pagerBtn}>3</button>
                        <button className={styles.pagerBtn}>4</button>
                        <button className={styles.pagerBtn}>...</button>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#8b92a5' }}>
                        <span>نمایش 1 تا {filteredLeads.length} از {248 + leads.length} نتیجه</span>
                        <select 
                          style={{
                            background: '#1a1d26',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#e5e7eb',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontFamily: 'inherit',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="8">۸ ردیف</option>
                          <option value="15">۱۵ ردیف</option>
                          <option value="30">۳۰ ردیف</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Sticky Order Details Panel (Left Side, occupies 1fr track) */}
                  {selectedLead ? (
                    <div className={styles.detailsContainer}>
                      {/* Sticky Panel Header */}
                      <div className={styles.detailsHeader}>
                        <div className={styles.detailsTitleRow}>
                          <span className={styles.detailsTitle}>جزئیات سفارش</span>
                          <span 
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '9.5px',
                              fontWeight: '750',
                              color: getStatusStyle(selectedLead.status).color,
                              backgroundColor: getStatusStyle(selectedLead.status).bg
                            }}
                          >
                            {getStatusStyle(selectedLead.status).label}
                          </span>
                        </div>
                        <div className={styles.detailsOrderCodeRow}>
                          <span className={styles.detailsOrderCode}>{selectedLead.id}</span>
                          <span 
                            onClick={() => {
                              navigator.clipboard.writeText(selectedLead.id);
                              alert('کد سفارش کپی شد!');
                            }}
                            style={{ fontSize: '12px', color: '#8b92a5', cursor: 'pointer', userSelect: 'none' }}
                            title="کپی شناسه"
                          >
                            {AdminIcons.clipboard(18)}
                          </span>
                        </div>
                        <div className={styles.detailsDate}>
                          ثبت شده در: {new Date(selectedLead.date).toLocaleString('fa-IR')}
                        </div>
                      </div>

                      {/* Collapsible Section 1: Customer Profile */}
                      <div className={styles.detailsCollapsible}>
                        <div 
                          className={styles.detailsSectionHeader}
                          onClick={() => setIsCustomerInfoExpanded(!isCustomerInfoExpanded)}
                        >
                          <h3>{AdminIcons.user(16)} اطلاعات خریدار</h3>
                          <span className={styles.detailsArrowIcon} style={{ transform: isCustomerInfoExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                            ▼
                          </span>
                        </div>

                        {isCustomerInfoExpanded && (
                          <div className={styles.detailsCollapsibleBody}>
                            <div className={styles.customerAvatarBox}>
                              <img 
                                src={getCustomerAvatar(selectedLead.id)} 
                                alt={selectedLead.customerName}
                                className={styles.customerAvatar}
                                style={{ width: '38px', height: '38px', borderRadius: '50%' }}
                              />
                              <div className={styles.customerMeta}>
                                <span className={styles.customerName}>{selectedLead.customerName}</span>
                                <span className={styles.customerPhone} style={{ direction: 'ltr' }}>{selectedLead.phone}</span>
                              </div>
                            </div>

                            <div className={styles.customerDetailsList}>
                              <div className={styles.customerDetailItem}>
                                <span className={styles.customerDetailLabel}>آدرس تحویل:</span>
                                <span className={styles.customerDetailValue} style={{ maxWidth: '170px', textAlign: 'left', wordBreak: 'break-word', whiteSpace: 'normal', color: '#f3f4f6' }}>
                                  {selectedLead.address}
                                </span>
                              </div>
                              <div className={styles.customerDetailItem} style={{ borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '6px', marginTop: '4px' }}>
                                <span className={styles.customerDetailLabel}>ایمیل:</span>
                                <span className={styles.customerDetailValue} style={{ fontFamily: 'monospace', color: '#d1d5db' }}>
                                  {selectedLead.customerName.replace(' ', '')}@gmail.com
                                </span>
                              </div>
                              <div className={styles.customerDetailItem} style={{ borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '6px', marginTop: '4px' }}>
                                <span className={styles.customerDetailLabel}>وضعیت خریدار:</span>
                                <span 
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '9px',
                                    fontWeight: 'bold',
                                    background: selectedLead.isRequest ? 'rgba(248,120,32,0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: selectedLead.isRequest ? '#f87820' : '#10b981'
                                  }}
                                >
                                  {selectedLead.isRequest ? 'سفارش آنلاین سایت' : 'تایید شده'}
                                </span>
                              </div>
                              
                              {selectedLead.notes && (
                                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                                  <span style={{ display: 'block', fontSize: '9.5px', color: '#f87820', fontWeight: 'bold', marginBottom: '2px' }}>{AdminIcons.edit(13)} توضیحات مشتری:</span>
                                  <p style={{ margin: 0, fontSize: '10.5px', color: '#d1d5db', lineHeight: '1.4' }}>{selectedLead.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Collapsible Section 2: Ordered Items */}
                      <div className={styles.detailsCollapsible}>
                        <div className={styles.detailsSectionHeader}>
                          <h3>{AdminIcons.bag(16)} اقلام پیش‌فاکتور</h3>
                        </div>

                        <div className={styles.detailsCollapsibleBody}>
                          {selectedLead.items && selectedLead.items.length > 0 ? (
                            selectedLead.items.map((item, idx) => (
                              <div key={idx} className={styles.detailsProductItem}>
                                <img 
                                  src={selectedLead.img || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80'} 
                                  alt={item.name}
                                  className={styles.detailsProductImg}
                                />
                                <div className={styles.detailsProductInfo}>
                                  <h4 className={styles.detailsProductTitle}>{item.name}</h4>
                                  <span className={styles.detailsProductDesc}>
                                    {selectedLead.store || 'از Amazon.ae'} | {(item.color || item.size) ? `رنگ: ${item.color || 'دیفالت'} - سایز: ${item.size || 'عادی'}` : 'پک استاندارد'}
                                  </span>
                                </div>
                                <span className={styles.detailsProductQty}>{item.quantity} عدد</span>
                              </div>
                            ))
                          ) : (
                            <div className={styles.detailsProductItem}>
                              <img 
                                src={selectedLead.img || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80'} 
                                alt={selectedLead.productName}
                                className={styles.detailsProductImg}
                              />
                              <div className={styles.detailsProductInfo}>
                                <h4 className={styles.detailsProductTitle}>{selectedLead.productName}</h4>
                                <span className={styles.detailsProductDesc}>{selectedLead.store || 'از Amazon.ae'} | برند {selectedLead.brand}</span>
                              </div>
                              <span className={styles.detailsProductQty}>۱ عدد</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 3: Pricing Table Breakdown */}
                      <div className={styles.detailsCollapsible} style={{ borderBottom: 'none', marginBottom: 0 }}>
                        <div className={styles.detailsSectionHeader} style={{ cursor: 'default' }}>
                          <h3>{AdminIcons.dollar(16)} برآورد هزینه‌ها</h3>
                        </div>
                        
                        <div className={styles.detailsCollapsibleBody}>
                          {selectedLead.isRequest === true && (selectedLead.status === 'pending' || selectedLead.status === 'price_tagged') ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '10.5px', color: '#8b92a5', marginBottom: '4px' }}>قیمت خرید (درهم):</label>
                                  <input 
                                    type="number"
                                    value={calcPriceAed}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setCalcPriceAed(val);
                                      const commissionPercent = parseFloat(siteCtxSettings.commissionPercent) || 25;
                                      setCalcCommissionAed(Math.round(val * (commissionPercent / 100)));
                                    }}
                                    style={{
                                      width: '100%',
                                      background: 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid rgba(255, 255, 255, 0.08)',
                                      borderRadius: '8px',
                                      color: '#fff',
                                      padding: '8px 10px',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      outline: 'none',
                                      textAlign: 'left',
                                      direction: 'ltr',
                                      fontFamily: 'monospace'
                                    }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '10.5px', color: '#8b92a5', marginBottom: '4px' }}>وزن واقعی (کیلو):</label>
                                  <input 
                                    type="number"
                                    step="0.01"
                                    value={calcWeight}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setCalcWeight(val);
                                      const minWeight = parseFloat(siteCtxSettings.minWeightClass) || 1.0;
                                      const roundingMethod = siteCtxSettings.roundingMethod || 'ceil';
                                      let roundedWeight = val;
                                      if (roundingMethod === 'ceil') roundedWeight = Math.ceil(val);
                                      else if (roundingMethod === 'floor') roundedWeight = Math.floor(val);
                                      else if (roundingMethod === 'round') roundedWeight = Math.round(val);
                                      if (roundedWeight < minWeight) roundedWeight = minWeight;

                                      const shippingPerKgAed = parseFloat(siteCtxSettings.shippingPerKgAed) || 40;
                                      setCalcShippingAed(Math.round(roundedWeight * shippingPerKgAed));
                                    }}
                                    style={{
                                      width: '100%',
                                      background: 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid rgba(255, 255, 255, 0.08)',
                                      borderRadius: '8px',
                                      color: '#fff',
                                      padding: '8px 10px',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      outline: 'none',
                                      textAlign: 'left',
                                      direction: 'ltr',
                                      fontFamily: 'monospace'
                                    }}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '10.5px', color: '#8b92a5', marginBottom: '4px' }}>هزینه ارسال (درهم):</label>
                                  <input 
                                    type="number"
                                    value={calcShippingAed}
                                    onChange={(e) => setCalcShippingAed(parseFloat(e.target.value) || 0)}
                                    style={{
                                      width: '100%',
                                      background: 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid rgba(255, 255, 255, 0.08)',
                                      borderRadius: '8px',
                                      color: '#fff',
                                      padding: '8px 10px',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      outline: 'none',
                                      textAlign: 'left',
                                      direction: 'ltr',
                                      fontFamily: 'monospace'
                                    }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '10.5px', color: '#8b92a5', marginBottom: '4px' }}>کارمزد دبی‌خرید (درهم):</label>
                                  <input 
                                    type="number"
                                    value={calcCommissionAed}
                                    onChange={(e) => setCalcCommissionAed(parseFloat(e.target.value) || 0)}
                                    style={{
                                      width: '100%',
                                      background: 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid rgba(255, 255, 255, 0.08)',
                                      borderRadius: '8px',
                                      color: '#fff',
                                      padding: '8px 10px',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      outline: 'none',
                                      textAlign: 'left',
                                      direction: 'ltr',
                                      fontFamily: 'monospace'
                                    }}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '10.5px', color: '#8b92a5', marginBottom: '4px' }}>نرخ درهم (تومان):</label>
                                  <input 
                                    type="number"
                                    value={calcAedRate}
                                    onChange={(e) => setCalcAedRate(parseFloat(e.target.value) || 0)}
                                    style={{
                                      width: '100%',
                                      background: 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid rgba(255, 255, 255, 0.08)',
                                      borderRadius: '8px',
                                      color: '#fff',
                                      padding: '8px 10px',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      outline: 'none',
                                      textAlign: 'left',
                                      direction: 'ltr',
                                      fontFamily: 'monospace'
                                    }}
                                  />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={handleSaveFinalPrice}
                                    style={{
                                      width: '100%',
                                      background: '#f87820',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '9px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#e06512'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#f87820'}
                                  >
                                    {AdminIcons.tag(13)} محاسبه و ثبت قیمت
                                  </button>
                                </div>
                              </div>

                              <div style={{
                                background: 'rgba(248, 120, 32, 0.04)',
                                border: '1px dashed rgba(248, 120, 32, 0.2)',
                                borderRadius: '8px',
                                padding: '10px',
                                marginTop: '4px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8b92a5', marginBottom: '4px' }}>
                                  <span>مجموع درهم (AED):</span>
                                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{calcTotalAed} درهم</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                                  <span style={{ color: '#fff' }}>مبلغ کل به تومان:</span>
                                  <span style={{ color: '#f87820' }}>{calcTotalToman.toLocaleString('fa-IR')} تومان</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <table className={styles.nestedPriceTable}>
                              <tbody>
                                <tr>
                                  <td>قیمت خالص محصول (دبی)</td>
                                  <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#fff' }}>
                                    {fmtToman(selectedLead.priceDetails?.product || Math.round(selectedLead.totalToman * 0.82))} تومان
                                  </td>
                                </tr>
                                <tr>
                                  <td>هزینه ارسال هوایی به ایران</td>
                                  <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#fff' }}>
                                    {fmtToman(selectedLead.priceDetails?.shipping || Math.round(selectedLead.totalToman * 0.08))} تومان
                                  </td>
                                </tr>
                                <tr>
                                  <td>کارمزد سرویس دبی‌خرید</td>
                                  <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#fff' }}>
                                    {fmtToman(selectedLead.priceDetails?.commission || Math.round(selectedLead.totalToman * 0.10))} تومان
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ fontSize: '12px', fontWeight: '900', color: '#fff', paddingTop: '8px' }}>مبلغ کل سفارش</td>
                                  <td style={{ textAlign: 'left', fontSize: '13px', fontWeight: '900', color: '#f87820', paddingTop: '8px' }}>
                                    {fmtToman(selectedLead.totalToman)} تومان
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>

                      {/* Section 4: Payment Details */}
                      <div 
                        style={{
                          marginTop: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px dashed rgba(255, 255, 255, 0.06)',
                          borderRadius: '12px',
                          padding: '12px',
                          textAlign: 'right'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#8b92a5' }}>روش پرداخت:</span>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>
                            {selectedLead.paymentMethod === 'gateway' ? <span>{AdminIcons.card(14)} درگاه بانکی مستقیم</span> : <span>{AdminIcons.card(14)} کارت به کارت شتابی</span>}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#8b92a5' }}>کد پیگیری تراکنش:</span>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace', color: '#ff9d00' }}>
                            {selectedLead.trackingNum || 'ثبت نشده'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#8b92a5' }}>وضعیت مالی:</span>
                          <span 
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '9.5px',
                              fontWeight: 'bold',
                              background: selectedLead.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                              color: selectedLead.paymentStatus === 'paid' ? '#10b981' : '#f97316'
                            }}
                          >
                            {selectedLead.paymentStatus === 'paid' ? 'تایید و پرداخت شده' : 'در انتظار تایید فیش'}
                          </span>
                        </div>
                      </div>

                      {/* Sticky Footer actions: Outline Buttons Grid */}
                      <div className={styles.detailsFooterActions}>
                        {selectedLead.isRequest === true && selectedLead.status === 'price_tagged' ? (
                          <>
                            <div className={styles.detailsActionsRow}>
                              <button 
                                className={styles.detailsActionBtn}
                                style={{ borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.02)' }}
                                onClick={() => handleSendPaymentLink(selectedLead)}
                              >
                                💬 ارسال لینک پرداخت (واتساپ)
                              </button>
                              <button 
                                className={styles.detailsActionBtn}
                                style={{ borderColor: '#f87820', color: '#f87820', background: 'rgba(248, 120, 32, 0.02)' }}
                                onClick={() => handleConvertToOrder(selectedLead.id)}
                              >
                                ✅ تبدیل به سفارش
                              </button>
                            </div>
                            <div className={styles.detailsActionsRow} style={{ marginTop: '8px' }}>
                              <button 
                                className={styles.detailsActionBtn}
                                onClick={() => handleManualPayment(selectedLead.id)}
                              >
                                💳 ثبت پرداخت دستی
                              </button>
                              <button 
                                className={`${styles.detailsActionBtn} ${styles.detailsActionBtnRed}`}
                                onClick={() => handleCancelRequest(selectedLead.id)}
                              >
                                {AdminIcons.close(12)} لغو درخواست
                              </button>
                            </div>
                          </>
                        ) : selectedLead.isRequest === true && selectedLead.status === 'pending' ? (
                          <div className={styles.detailsActionsRow}>
                            <button 
                              className={styles.detailsActionBtn}
                              onClick={() => {
                                const note = prompt('یادداشت داخلی جدید خود را وارد کنید:', selectedLead.notes || '');
                                if (note !== null) {
                                  const updated = leads.map(l => (l.id === selectedLead.id ? { ...l, notes: note } : l));
                                  setLeads(updated);
                                  localStorage.setItem('dubaiKharidLeads', JSON.stringify(updated));
                                }
                              }}
                            >
                              {AdminIcons.edit(13)} یادداشت داخلی
                            </button>
                            <button 
                              className={`${styles.detailsActionBtn} ${styles.detailsActionBtnRed}`}
                              onClick={() => handleCancelRequest(selectedLead.id)}
                            >
                              {AdminIcons.close(12)} لغو درخواست
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={styles.detailsActionsRow}>
                              <button 
                                className={styles.detailsActionBtn}
                                onClick={() => {
                                  const note = prompt('یادداشت داخلی جدید خود را وارد کنید:', selectedLead.notes || '');
                                  if (note !== null) {
                                    const updated = leads.map(l => (l.id === selectedLead.id ? { ...l, notes: note } : l));
                                    setLeads(updated);
                                    localStorage.setItem('dubaiKharidLeads', JSON.stringify(updated));
                                  }
                                }}
                              >
                                {AdminIcons.edit(13)} یادداشت داخلی
                              </button>
                              
                              <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                                <select 
                                  value={selectedLead.status}
                                  onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                                  className={styles.detailsActionBtn}
                                  style={{
                                    width: '100%',
                                    appearance: 'none',
                                    textAlignLast: 'center',
                                    background: 'transparent',
                                    border: '1px solid var(--admin-border)',
                                    color: 'var(--admin-white)',
                                    cursor: 'pointer',
                                    outline: 'none'
                                  }}
                                >
                                  <option value="pending">وضعیت: بررسی</option>
                                  <option value="price_tagged">وضعیت: قیمت‌گذاری</option>
                                  <option value="approved">وضعیت: تایید شده</option>
                                  <option value="processing">وضعیت: در حال پردازش</option>
                                  <option value="warehouse_dubai">وضعیت: انبار دبی</option>
                                  <option value="noon_dubai">وضعیت: در نون دبی</option>
                                  <option value="shipped">وضعیت: ارسال شده</option>
                                  <option value="delivered">وضعیت: تحویل شده</option>
                                  <option value="cancelled">وضعیت: لغو شده</option>
                                </select>
                              </div>
                            </div>

                            <div className={styles.detailsActionsRow} style={{ marginTop: '8px' }}>
                              <button 
                                className={`${styles.detailsActionBtn} ${styles.detailsActionBtnRed}`}
                                onClick={() => handleDeleteLead(selectedLead.id)}
                              >
                                {AdminIcons.close(12)} لغو سفارش
                              </button>
                              <button 
                                className={styles.detailsActionBtn}
                                onClick={() => {
                                  alert('آپلود فاکتور خرید شبیه‌سازی شد! فایل با موفقیت آپلود گردید.');
                                }}
                              >
                                {AdminIcons.cloud(12)} آپلود فاکتور
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.detailsContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8b92a5' }}>
                      سفارشی جهت نمایش انتخاب نشده است.
                    </div>
                  )}

                </div>
              </div>
            );
          })()}

          {/* TAB: WAREHOUSE (انبار) */}
          {activeTab === 'warehouse' && (() => {
            const activeProds = warehouseProducts.filter(p => !p.isArchived);

            // Dynamically calculate metrics
            const totalValue = activeProds.reduce((sum, p) => sum + (p.stock * p.price), 0);
            const totalSellable = activeProds.reduce((sum, p) => sum + Math.max(0, p.stock - p.reserved), 0);
            const lowStockCount = activeProds.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
            const totalReserved = activeProds.reduce((sum, p) => sum + p.reserved, 0);

            // Alert counts
            const outOfStockCount = activeProds.filter(p => p.stock === 0).length;
            const overReservedCount = activeProds.filter(p => p.reserved > p.stock).length;

            // Categories & Brands for filters
            const categories = ['همه', ...new Set(activeProds.map(p => p.category))];
            const brands = ['همه', ...new Set(activeProds.map(p => p.brand))];

            // Filter products
            const filteredProds = activeProds.filter(p => {
              // Search
              const matchesSearch = 
                p.name.toLowerCase().includes(warehouseSearchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(warehouseSearchQuery.toLowerCase()) ||
                p.brand.toLowerCase().includes(warehouseSearchQuery.toLowerCase()) ||
                p.id.toLowerCase().includes(warehouseSearchQuery.toLowerCase());
              if (!matchesSearch) return false;

              // Dropdowns
              if (warehouseCategoryFilter !== 'همه' && p.category !== warehouseCategoryFilter) return false;
              if (warehouseBrandFilter !== 'همه' && p.brand !== warehouseBrandFilter) return false;
              
              if (warehouseStatusFilter !== 'همه') {
                const isOutOf = p.stock === 0;
                const isLow = p.stock > 0 && p.stock <= p.minStock;
                const isAvailable = p.stock > p.minStock;
                if (warehouseStatusFilter === 'موجود' && !isAvailable) return false;
                if (warehouseStatusFilter === 'کم موجود' && !isLow) return false;
                if (warehouseStatusFilter === 'ناموجود' && !isOutOf) return false;
              }

              // Top cards & alerts filter mode
              if (warehouseFilterMode === 'lowstock') {
                return p.stock > 0 && p.stock <= p.minStock;
              }
              if (warehouseFilterMode === 'outofstock') {
                return p.stock === 0;
              }
              if (warehouseFilterMode === 'reserved') {
                return p.reserved > 0;
              }
              if (warehouseFilterMode === 'overreserved') {
                return p.reserved > p.stock;
              }
              if (warehouseFilterMode === 'sellable') {
                return (p.stock - p.reserved) > 0;
              }

              return true;
            });

            // Pagination
            const totalItemsCount = filteredProds.length;
            const totalPages = Math.ceil(totalItemsCount / warehouseLimit) || 1;
            const currentPage = Math.min(warehousePage, totalPages);
            const startIndex = (currentPage - 1) * warehouseLimit;
            const endIndex = startIndex + warehouseLimit;
            const paginatedProds = filteredProds.slice(startIndex, endIndex);

            // Selected product
            const selectedProduct = warehouseProducts.find(p => p.id === selectedWarehouseProductId) || filteredProds[0] || null;

            // Form uploader helper
            const triggerWarehouseUpload = (type) => {
              const el = document.getElementById(`warehouseUploadInput_${type}`);
              if (el) el.click();
            };

            // Stock adjustment handler
            const handleAdjustStockLocal = (productId, type, qty, reason) => {
              const amount = parseInt(qty);
              if (isNaN(amount) || amount <= 0) return alert('مقدار نامعتبر است.');
              
              const updated = warehouseProducts.map(p => {
                if (p.id === productId) {
                  const oldStock = p.stock;
                  const newStock = type === 'increase' ? oldStock + amount : Math.max(0, oldStock - amount);
                  const changeSign = type === 'increase' ? `+${amount}` : `-${amount}`;
                  
                  const newHistoryEntry = {
                    id: 'h_' + Date.now(),
                    action: type === 'increase' ? 'افزایش موجودی' : 'کاهش موجودی',
                    qty: changeSign,
                    date: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
                    user: 'مدیر سایت',
                    reason: reason || (type === 'increase' ? 'تغییر دستی موجودی' : 'کاهش دستی موجودی')
                  };
                  
                  return {
                    ...p,
                    stock: newStock,
                    lastUpdated: newHistoryEntry.date,
                    history: [newHistoryEntry, ...(p.history || [])]
                  };
                }
                return p;
              });
              
              setWarehouseProducts(updated);
              localStorage.setItem('dubaiKharidWarehouseProducts', JSON.stringify(updated));
              setWarehouseAdjustStockOpen(false);
              setWarehouseAdjustStockQty('');
              setWarehouseAdjustStockReason('');
              alert('موجودی با موفقیت بروزرسانی شد.');
            };

            // Add note handler
            const handleAddNoteLocal = (productId, text) => {
              if (!text.trim()) return alert('متن یادداشت نمی‌تواند خالی باشد.');
              const updated = warehouseProducts.map(p => {
                if (p.id === productId) {
                  const newNote = {
                    id: 'n_' + Date.now(),
                    text: text,
                    date: new Date().toLocaleDateString('fa-IR'),
                    user: 'مدیر سایت'
                  };
                  return {
                    ...p,
                    notes: [newNote, ...(p.notes || [])]
                  };
                }
                return p;
              });
              
              setWarehouseProducts(updated);
              localStorage.setItem('dubaiKharidWarehouseProducts', JSON.stringify(updated));
              setWarehouseAddNoteOpen(false);
              setWarehouseAddNoteText('');
              alert('یادداشت با موفقیت ثبت شد.');
            };

            // Archive handler
            const handleArchiveProductLocal = (productId) => {
              if (!confirm('آیا از آرشیو کردن این کالا اطمینان دارید؟ (کالا از لیست فعال حذف خواهد شد)')) return;
              const updated = warehouseProducts.map(p => {
                if (p.id === productId) {
                  return { ...p, isArchived: true };
                }
                return p;
              });
              setWarehouseProducts(updated);
              localStorage.setItem('dubaiKharidWarehouseProducts', JSON.stringify(updated));
              alert('کالا آرشیو شد.');
            };

            // Manual product submissions
            const handleAddWarehouseProductSubmit = (e) => {
              e.preventDefault();
              if (!addWarehouseForm.name || !addWarehouseForm.brand || !addWarehouseForm.price) {
                return alert('لطفاً فیلدهای ضروری را پر کنید.');
              }
              const newId = 'DK-INV-' + (1000 + warehouseProducts.length + 1);
              const newProduct = {
                id: newId,
                name: addWarehouseForm.name,
                brand: addWarehouseForm.brand,
                category: addWarehouseForm.category,
                sku: addWarehouseForm.sku || ('SKU-' + Date.now().toString().slice(-6)),
                price: parseInt(addWarehouseForm.price) || 0,
                stock: parseInt(addWarehouseForm.stock) || 0,
                reserved: parseInt(addWarehouseForm.reserved) || 0,
                location: addWarehouseForm.location || 'ثبت نشده',
                minStock: parseInt(addWarehouseForm.minStock) || 5,
                lastUpdated: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
                image: addWarehouseForm.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=200&auto=format&fit=crop',
                isArchived: false,
                notes: [],
                history: [
                  {
                    id: 'h_init',
                    action: 'ایجاد کالا',
                    qty: `+${addWarehouseForm.stock || 0}`,
                    date: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
                    user: 'مدیر سایت',
                    reason: 'ثبت اولیه کالا در انبار'
                  }
                ]
              };
              
              const updated = [newProduct, ...warehouseProducts];
              setWarehouseProducts(updated);
              localStorage.setItem('dubaiKharidWarehouseProducts', JSON.stringify(updated));
              setSelectedWarehouseProductId(newId);
              setIsAddWarehouseOpen(false);
              setAddWarehouseForm({
                name: '', brand: '', category: 'موبایل', sku: '', price: '', stock: '0', reserved: '0', location: '', minStock: '5', image: ''
              });
              alert('کالا با موفقیت اضافه شد.');
            };

            const handleEditWarehouseProductSubmit = (e) => {
              e.preventDefault();
              if (!editWarehouseForm.name || !editWarehouseForm.brand || !editWarehouseForm.price) {
                return alert('لطفاً فیلدهای ضروری را پر کنید.');
              }
              const updated = warehouseProducts.map(p => {
                if (p.id === editWarehouseForm.id) {
                  return {
                    ...p,
                    name: editWarehouseForm.name,
                    brand: editWarehouseForm.brand,
                    category: editWarehouseForm.category,
                    sku: editWarehouseForm.sku,
                    price: parseInt(editWarehouseForm.price) || 0,
                    stock: parseInt(editWarehouseForm.stock) || 0,
                    reserved: parseInt(editWarehouseForm.reserved) || 0,
                    location: editWarehouseForm.location,
                    minStock: parseInt(editWarehouseForm.minStock) || 5,
                    image: editWarehouseForm.image,
                    lastUpdated: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
                  };
                }
                return p;
              });
              
              setWarehouseProducts(updated);
              localStorage.setItem('dubaiKharidWarehouseProducts', JSON.stringify(updated));
              setIsEditWarehouseOpen(false);
              alert('تغییرات کالا با موفقیت ذخیره شد.');
            };

            // Helper for combining history log for reports
            const combinedHistory = activeProds.flatMap(p => 
              (p.history || []).map(h => ({
                ...h,
                productName: p.name,
                productId: p.id,
                sku: p.sku
              }))
            ).sort((a, b) => {
              return b.id.localeCompare(a.id);
            });

            return (
              <div style={{ direction: 'rtl', textAlign: 'right' }}>
                
                {/* HEADER SECTION */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: '950', color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📦 مدیریت انبار ایران
                    </h1>
                    <p style={{ fontSize: '12.5px', color: '#8b92a5' }}>
                      مدیریت و مانیتورینگ فیزیکی موجودی کالاها، مقادیر رزرو شده و تاریخچه تغییرات انبار ایران
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddWarehouseOpen(true)}
                    style={{
                      padding: '10px 18px',
                      background: 'linear-gradient(135deg, #f87820 0%, #d4590c 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(248, 120, 32, 0.2)'
                    }}
                  >
                    ➕ افزودن کالا
                  </button>
                </div>

                {/* STATS GRID (Clickable Cards) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                  
                  {/* Card 1: ارزش کل انبار */}
                  <div
                    onClick={() => {
                      setWarehouseFilterMode('all');
                      setWarehouseStatusFilter('all');
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: warehouseFilterMode === 'all' ? '1px solid #f87820' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '4px' }}>ارزش کل انبار</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>{totalValue.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: '#f87820', marginTop: '2px' }}>تومان</div>
                    </div>
                    <div style={{ background: 'rgba(248,120,32,0.08)', borderRadius: '8px', padding: '10px', color: '#f87820' }}>
                      {AdminIcons.dollar(20)}
                    </div>
                  </div>

                  {/* Card 2: موجودی قابل فروش */}
                  <div
                    onClick={() => setWarehouseFilterMode('sellable')}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: warehouseFilterMode === 'sellable' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '4px' }}>موجودی قابل فروش</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981' }}>{totalSellable.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>عدد</div>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '8px', padding: '10px', color: '#10b981' }}>
                      {AdminIcons.laptop(20)}
                    </div>
                  </div>

                  {/* Card 3: کالاهای کم موجود */}
                  <div
                    onClick={() => setWarehouseFilterMode('lowstock')}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: warehouseFilterMode === 'lowstock' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '4px' }}>کم موجود</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#f59e0b' }}>{lowStockCount.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>کالا</div>
                    </div>
                    <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '8px', padding: '10px', color: '#f59e0b' }}>
                      {AdminIcons.sliders(20)}
                    </div>
                  </div>

                  {/* Card 4: کالاهای رزرو شده */}
                  <div
                    onClick={() => setWarehouseFilterMode('reserved')}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: warehouseFilterMode === 'reserved' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '4px' }}>رزرو شده</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6' }}>{totalReserved.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>عدد</div>
                    </div>
                    <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: '8px', padding: '10px', color: '#3b82f6' }}>
                      {AdminIcons.lock(20)}
                    </div>
                  </div>

                </div>

                {/* WARNINGS BAR */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '12px'
                }}>
                  <div style={{ color: '#8b92a5', fontWeight: '700', marginLeft: '12px' }}>وضعیت هشدارها:</div>
                  
                  {lowStockCount > 0 && (
                    <div
                      onClick={() => setWarehouseFilterMode('lowstock')}
                      style={{ color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      ⚠️ {lowStockCount} کالا کم موجود
                    </div>
                  )}

                  {outOfStockCount > 0 && (
                    <div
                      onClick={() => setWarehouseFilterMode('outofstock')}
                      style={{ color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '12px' }}
                    >
                      ⚠️ {outOfStockCount} کالا ناموجود
                    </div>
                  )}

                  {overReservedCount > 0 && (
                    <div
                      onClick={() => setWarehouseFilterMode('overreserved')}
                      style={{ color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '12px' }}
                    >
                      ⚠️ {overReservedCount} کالا رزرو شده بیشتر از موجودی
                    </div>
                  )}

                  {lowStockCount === 0 && outOfStockCount === 0 && overReservedCount === 0 && (
                    <div style={{ color: '#10b981' }}>🟢 تمام کالاهای انبار در وضعیت نرمال و مطلوب قرار دارند.</div>
                  )}
                </div>

                {/* QUICK OPERATIONS BAR & FILTERS BAR combined */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '12px 12px 0 0',
                  padding: '16px',
                  gap: '12px',
                  alignItems: 'center',
                  borderBottom: 'none'
                }}>
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        placeholder="جستجو بر اساس نام، SKU یا برند..."
                        value={warehouseSearchQuery}
                        onChange={e => {
                          setWarehouseSearchQuery(e.target.value);
                          setWarehousePage(1);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 36px 8px 12px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                      <span style={{ position: 'absolute', right: '10px', top: '10px', color: '#8b92a5' }}>
                        {AdminIcons.search(14)}
                      </span>
                    </div>

                    <select
                      value={warehouseCategoryFilter}
                      onChange={e => {
                        setWarehouseCategoryFilter(e.target.value);
                        setWarehousePage(1);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="همه" style={{ background: '#0c0d12' }}>دسته‌بندی: همه</option>
                      {categories.filter(c => c !== 'همه').map(cat => (
                        <option key={cat} value={cat} style={{ background: '#0c0d12' }}>{cat}</option>
                      ))}
                    </select>

                    <select
                      value={warehouseBrandFilter}
                      onChange={e => {
                        setWarehouseBrandFilter(e.target.value);
                        setWarehousePage(1);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="همه" style={{ background: '#0c0d12' }}>برند: همه</option>
                      {brands.filter(b => b !== 'همه').map(br => (
                        <option key={br} value={br} style={{ background: '#0c0d12' }}>{br}</option>
                      ))}
                    </select>

                    <select
                      value={warehouseStatusFilter}
                      onChange={e => {
                        setWarehouseStatusFilter(e.target.value);
                        setWarehousePage(1);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="همه" style={{ background: '#0c0d12' }}>وضعیت: همه</option>
                      <option value="موجود" style={{ background: '#0c0d12' }}>موجود (سبز)</option>
                      <option value="کم موجود" style={{ background: '#0c0d12' }}>کم موجود (نارنجی)</option>
                      <option value="ناموجود" style={{ background: '#0c0d12' }}>ناموجود (قرمز)</option>
                    </select>

                    {warehouseFilterMode !== 'all' && (
                      <button
                        onClick={() => setWarehouseFilterMode('all')}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(248,120,32,0.1)',
                          border: '1px solid rgba(248,120,32,0.2)',
                          borderRadius: '8px',
                          color: '#f87820',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        پاک کردن فیلتر کارت‌ها
                      </button>
                    )}
                  </div>

                  {/* Quick Operations buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        if (!selectedProduct) return alert('لطفاً ابتدا کالایی را از جدول انتخاب کنید.');
                        setWarehouseAdjustStockType('increase');
                        setWarehouseAdjustStockOpen(true);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        color: '#10b981',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      📦 افزایش موجودی
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedProduct) return alert('لطفاً ابتدا کالایی را از جدول انتخاب کنید.');
                        setWarehouseAdjustStockType('decrease');
                        setWarehouseAdjustStockOpen(true);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      📤 کاهش موجودی
                    </button>
                    <button
                      onClick={() => setWarehouseReportOpen(true)}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(248,120,32,0.1)',
                        border: '1px solid rgba(248,120,32,0.2)',
                        borderRadius: '8px',
                        color: '#f87820',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      📊 گزارش انبار
                    </button>
                  </div>
                </div>

                {/* SPLIT LAYOUT */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  
                  {/* Left Column: Directory Table (65%) */}
                  <div style={{ flex: 13, minWidth: 0, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '20px', borderRadius: '0 0 12px 12px' }}>
                    {paginatedProds.length === 0 ? (
                      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8b92a5', fontSize: '13px' }}>
                        هیچ کالایی متناسب با فیلترها و جستجوی انبار یافت نشد.
                      </div>
                    ) : (
                      <div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
                            <thead>
                              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <th style={{ padding: '12px 10px', color: '#8b92a5', width: '45%' }}>کلا</th>
                                <th style={{ padding: '12px 10px', color: '#8b92a5' }}>برند</th>
                                <th style={{ padding: '12px 10px', color: '#8b92a5' }}>دسته‌بندی</th>
                                <th style={{ padding: '12px 10px', color: '#8b92a5', textAlign: 'center' }}>موجودی</th>
                                <th style={{ padding: '12px 10px', color: '#8b92a5', textAlign: 'center' }}>رزرو</th>
                                <th style={{ padding: '12px 10px', color: '#8b92a5', textAlign: 'center' }}>قابل فروش</th>
                                <th style={{ padding: '12px 10px', color: '#8b92a5' }}>قیمت (تومان)</th>
                                <th style={{ padding: '12px 10px', color: '#8b92a5', textAlign: 'center' }}>وضعیت</th>
                                <th style={{ padding: '12px 10px', color: '#8b92a5', textAlign: 'center' }}>عملیات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedProds.map(prod => {
                                const isSelected = prod.id === selectedWarehouseProductId;
                                const isOutOf = prod.stock === 0;
                                const isLow = prod.stock > 0 && prod.stock <= prod.minStock;
                                const isAvailable = prod.stock > prod.minStock;
                                
                                return (
                                  <tr
                                    key={prod.id}
                                    onClick={() => setSelectedWarehouseProductId(prod.id)}
                                    style={{
                                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                                      cursor: 'pointer',
                                      background: isSelected ? 'rgba(248,120,32,0.04)' : 'transparent',
                                      transition: 'background 0.15s'
                                    }}
                                  >
                                    <td style={{ padding: '12px 10px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img
                                          src={prod.image}
                                          alt={prod.name}
                                          style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', background: '#222' }}
                                        />
                                        <div>
                                          <div style={{ fontWeight: '800', color: isSelected ? '#f87820' : '#fff' }}>{prod.name}</div>
                                          <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>{prod.sku} • {prod.id}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 10px', color: '#c0c8d8' }}>{prod.brand}</td>
                                    <td style={{ padding: '12px 10px', color: '#c0c8d8' }}>{prod.category}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: '#fff' }}>{prod.stock}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center', color: prod.reserved > 0 ? '#3b82f6' : '#8b92a5', fontWeight: prod.reserved > 0 ? 'bold' : 'normal' }}>
                                      {prod.reserved}
                                    </td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center', color: (prod.stock - prod.reserved) <= 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                      {prod.stock - prod.reserved}
                                    </td>
                                    <td style={{ padding: '12px 10px', color: '#fff', fontWeight: '700' }}>{prod.price.toLocaleString()}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                      {isAvailable && (
                                        <span style={{ padding: '3px 8px', borderRadius: '50px', fontSize: '10.5px', background: 'rgba(16,185,129,0.08)', color: '#10b981', fontWeight: 'bold' }}>
                                          موجود
                                        </span>
                                      )}
                                      {isLow && (
                                        <span style={{ padding: '3px 8px', borderRadius: '50px', fontSize: '10.5px', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', fontWeight: 'bold' }}>
                                          کم موجود
                                        </span>
                                      )}
                                      {isOutOf && (
                                        <span style={{ padding: '3px 8px', borderRadius: '50px', fontSize: '10.5px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 'bold' }}>
                                          ناموجود
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
                                      <button
                                        onClick={() => setActiveWarehouseMenuId(activeWarehouseMenuId === prod.id ? null : prod.id)}
                                        style={{
                                          background: 'rgba(255,255,255,0.03)',
                                          border: '1px solid rgba(255,255,255,0.06)',
                                          borderRadius: '6px',
                                          color: '#c0c8d8',
                                          padding: '4px 8px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        ⋮
                                      </button>
                                      
                                      {/* Menu Dropdown */}
                                      {activeWarehouseMenuId === prod.id && (
                                        <div style={{
                                          position: 'absolute',
                                          left: '10px',
                                          top: '38px',
                                          zIndex: 100,
                                          background: '#0c0d12',
                                          border: '1px solid rgba(255,255,255,0.08)',
                                          borderRadius: '8px',
                                          width: '130px',
                                          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                                          padding: '6px'
                                        }}>
                                          <div
                                            onClick={() => {
                                              setSelectedWarehouseProductId(prod.id);
                                              setActiveWarehouseMenuId(null);
                                            }}
                                            style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                          >
                                            👁 مشاهده
                                          </div>
                                          <div
                                            onClick={() => {
                                              setEditWarehouseForm(prod);
                                              setIsEditWarehouseOpen(true);
                                              setActiveWarehouseMenuId(null);
                                            }}
                                            style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                          >
                                            ✏️ ویرایش
                                          </div>
                                          <div
                                            onClick={() => {
                                              setSelectedWarehouseProductId(prod.id);
                                              setWarehouseAdjustStockType('increase');
                                              setWarehouseAdjustStockOpen(true);
                                              setActiveWarehouseMenuId(null);
                                            }}
                                            style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#10b981', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                          >
                                            ➕ افزایش موجودی
                                          </div>
                                          <div
                                            onClick={() => {
                                              setSelectedWarehouseProductId(prod.id);
                                              setWarehouseAdjustStockType('decrease');
                                              setWarehouseAdjustStockOpen(true);
                                              setActiveWarehouseMenuId(null);
                                            }}
                                            style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                          >
                                            ➖ کاهش موجودی
                                          </div>
                                          <div
                                            onClick={() => {
                                              setSelectedWarehouseProductId(prod.id);
                                              setWarehouseAddNoteOpen(true);
                                              setActiveWarehouseMenuId(null);
                                            }}
                                            style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#3b82f6', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                          >
                                            📝 ثبت یادداشت
                                          </div>
                                          <div
                                            onClick={() => {
                                              handleArchiveProductLocal(prod.id);
                                              setActiveWarehouseMenuId(null);
                                            }}
                                            style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.04)', color: '#f59e0b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}
                                          >
                                            📦 آرشیو کالا
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '16px' }}>
                          <div style={{ color: '#8b92a5' }}>
                            نمایش {startIndex + 1} تا {Math.min(endIndex, totalItemsCount)} از {totalItemsCount} کالا
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              onClick={() => setWarehousePage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '4px',
                                color: currentPage === 1 ? '#444' : '#fff',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                              }}
                            >
                              ‹
                            </button>
                            
                            {Array.from({ length: totalPages }).map((_, idx) => {
                              const pg = idx + 1;
                              return (
                                <button
                                  key={pg}
                                  onClick={() => setWarehousePage(pg)}
                                  style={{
                                    padding: '4px 10px',
                                    background: currentPage === pg ? '#f87820' : 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {pg}
                                </button>
                              );
                            })}

                            <button
                              onClick={() => setWarehousePage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '4px',
                                color: currentPage === totalPages ? '#444' : '#fff',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                              }}
                            >
                              ›
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#8b92a5' }}>نمایش:</span>
                            <select
                              value={warehouseLimit}
                              onChange={e => {
                                setWarehouseLimit(parseInt(e.target.value));
                                setWarehousePage(1);
                              }}
                              style={{
                                padding: '4px 6px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="5" style={{ background: '#0c0d12' }}>۵</option>
                              <option value="10" style={{ background: '#0c0d12' }}>۱۰</option>
                              <option value="20" style={{ background: '#0c0d12' }}>۲۰</option>
                              <option value="50" style={{ background: '#0c0d12' }}>۵۰</option>
                            </select>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Right Column: Details Sidebar (35%) */}
                  <div style={{ width: '360px', flexShrink: 0, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px' }}>
                    {selectedProduct ? (
                      <div>
                        {/* Title and image */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: '950', color: '#fff' }}>جزئیات کالا</h3>
                          <span style={{
                            padding: '3px 8px', borderRadius: '50px', fontSize: '10px', fontWeight: 'bold',
                            background: selectedProduct.stock === 0 ? 'rgba(239,68,68,0.08)' : selectedProduct.stock <= selectedProduct.minStock ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                            color: selectedProduct.stock === 0 ? '#ef4444' : selectedProduct.stock <= selectedProduct.minStock ? '#f59e0b' : '#10b981'
                          }}>
                            {selectedProduct.stock === 0 ? 'ناموجود' : selectedProduct.stock <= selectedProduct.minStock ? 'کم موجود' : 'موجود'}
                          </span>
                        </div>

                        <img
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          style={{ width: '100%', height: '180px', borderRadius: '10px', objectFit: 'cover', background: '#222', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.06)' }}
                        />

                        <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>{selectedProduct.name}</h2>

                        {/* Specs list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: '#8b92a5' }}>برند:</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedProduct.brand}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: '#8b92a5' }}>دسته‌بندی:</span>
                            <span style={{ color: '#fff' }}>{selectedProduct.category}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: '#8b92a5' }}>SKU:</span>
                            <span style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedProduct.sku}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: '#8b92a5' }}>قیمت (تومان):</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedProduct.price.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: '#8b92a5' }}>موجود انبار ایران:</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedProduct.stock} عدد</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: '#8b92a5' }}>رزرو سفارشات:</span>
                            <span style={{ color: selectedProduct.reserved > 0 ? '#3b82f6' : '#fff' }}>{selectedProduct.reserved} عدد</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: '#8b92a5' }}>موجودی قابل فروش:</span>
                            <span style={{ color: (selectedProduct.stock - selectedProduct.reserved) <= 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                              {selectedProduct.stock - selectedProduct.reserved} عدد
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: '#8b92a5' }}>محل نگهداری در انبار:</span>
                            <span style={{ color: '#fff' }}>{selectedProduct.location}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: '#8b92a5' }}>آخرین بروزرسانی:</span>
                            <span style={{ color: '#8b92a5', fontSize: '11px' }}>{selectedProduct.lastUpdated || 'ثبت نشده'}</span>
                          </div>
                        </div>

                        {/* Sidebar Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                          <button
                            onClick={() => {
                              setEditWarehouseForm(selectedProduct);
                              setIsEditWarehouseOpen(true);
                            }}
                            style={{
                              width: '100%', padding: '10px', background: 'linear-gradient(135deg, #f87820 0%, #d4590c 100%)',
                              color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px',
                              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
                            }}
                          >
                            ✏️ ویرایش کالا
                          </button>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setWarehouseAdjustStockType('increase');
                                setWarehouseAdjustStockOpen(true);
                              }}
                              style={{
                                padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                color: '#10b981', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                              }}
                            >
                              ➕ افزایش
                            </button>
                            <button
                              onClick={() => {
                                setWarehouseAdjustStockType('decrease');
                                setWarehouseAdjustStockOpen(true);
                              }}
                              style={{
                                padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                              }}
                            >
                              ➖ کاهش
                            </button>
                          </div>

                          <button
                            onClick={() => setWarehouseAddNoteOpen(true)}
                            style={{
                              width: '100%', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                              color: '#3b82f6', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px'
                            }}
                          >
                            📝 ثبت یادداشت کالا
                          </button>
                        </div>

                        {/* HISTORY LOG (Inside sidebar) */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '12.5px', color: '#fff', marginBottom: '10px', fontWeight: 'bold' }}>🕒 تاریخچه تغییرات موجودی</h4>
                          {selectedProduct.history && selectedProduct.history.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingLeft: '4px' }}>
                              {selectedProduct.history.map(hist => (
                                <div key={hist.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', padding: '8px', fontSize: '11px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span style={{ fontWeight: '800', color: hist.qty.startsWith('+') ? '#10b981' : '#ef4444' }}>{hist.qty}</span>
                                    <span style={{ color: '#fff', fontWeight: '700' }}>{hist.action}</span>
                                  </div>
                                  <div style={{ color: '#8b92a5', fontSize: '9.5px', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                    <span>توسط: {hist.user}</span>
                                    <span>{hist.date}</span>
                                  </div>
                                  {hist.reason && (
                                    <div style={{ color: '#f87820', fontSize: '10px', marginTop: '4px', background: 'rgba(248,120,32,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                      علت: {hist.reason}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '11px', color: '#8b92a5', textAlign: 'center', padding: '12px' }}>
                              تغییراتی ثبت نشده است.
                            </div>
                          )}
                        </div>

                        {/* NOTES LOG (Inside sidebar) */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                          <h4 style={{ fontSize: '12.5px', color: '#fff', marginBottom: '10px', fontWeight: 'bold' }}>📝 یادداشت‌های انبار</h4>
                          {selectedProduct.notes && selectedProduct.notes.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                              {selectedProduct.notes.map(note => (
                                <div key={note.id} style={{ background: 'rgba(248,120,32,0.03)', border: '1px solid rgba(248,120,32,0.1)', borderRadius: '6px', padding: '8px', fontSize: '11px' }}>
                                  <div style={{ color: '#c0c8d8', lineHeight: '1.4', marginBottom: '4px' }}>{note.text}</div>
                                  <div style={{ color: '#8b92a5', fontSize: '9px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>ثبت: {note.user}</span>
                                    <span>{note.date}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '11px', color: '#8b92a5', textAlign: 'center', padding: '12px' }}>
                              یادداشتی برای این کالا ثبت نشده است.
                            </div>
                          )}
                        </div>

                      </div>
                    ) : (
                      <div style={{ padding: '40px 10px', textAlign: 'center', color: '#8b92a5', fontSize: '12px' }}>
                        برای نمایش جزئیات، یک کالا از جدول انتخاب کنید.
                      </div>
                    )}
                  </div>

                </div>

                {/* MODAL: ADD PRODUCT */}
                {isAddWarehouseOpen && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ background: '#0f111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#fff' }}>➕ افزودن کالای فیزیکی جدید</h3>
                        <button onClick={() => setIsAddWarehouseOpen(false)} style={{ background: 'transparent', border: 'none', color: '#8b92a5', fontSize: '18px', cursor: 'pointer' }}>×</button>
                      </div>
                      
                      <form onSubmit={handleAddWarehouseProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
                        
                        <div>
                          <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>نام کالا (ضروری)</label>
                          <input
                            type="text"
                            required
                            value={addWarehouseForm.name}
                            onChange={e => setAddWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>برند (ضروری)</label>
                            <input
                              type="text"
                              required
                              value={addWarehouseForm.brand}
                              onChange={e => setAddWarehouseForm(prev => ({ ...prev, brand: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>دسته‌بندی (ضروری)</label>
                            <input
                              type="text"
                              required
                              value={addWarehouseForm.category}
                              onChange={e => setAddWarehouseForm(prev => ({ ...prev, category: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>SKU کالا</label>
                            <input
                              type="text"
                              placeholder="مثال: APP-AP2"
                              value={addWarehouseForm.sku}
                              onChange={e => setAddWarehouseForm(prev => ({ ...prev, sku: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>محل نگهداری در انبار</label>
                            <input
                              type="text"
                              placeholder="مثال: قفسه A2"
                              value={addWarehouseForm.location}
                              onChange={e => setAddWarehouseForm(prev => ({ ...prev, location: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>موجودی فیزیکی اولیه</label>
                            <input
                              type="number"
                              min="0"
                              value={addWarehouseForm.stock}
                              onChange={e => setAddWarehouseForm(prev => ({ ...prev, stock: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>حداقل موجودی (Low limit)</label>
                            <input
                              type="number"
                              min="1"
                              value={addWarehouseForm.minStock}
                              onChange={e => setAddWarehouseForm(prev => ({ ...prev, minStock: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>قیمت واحد (تومان - ضروری)</label>
                            <input
                              type="number"
                              required
                              value={addWarehouseForm.price}
                              onChange={e => setAddWarehouseForm(prev => ({ ...prev, price: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>رزرو شده اولیه</label>
                            <input
                              type="number"
                              min="0"
                              value={addWarehouseForm.reserved}
                              onChange={e => setAddWarehouseForm(prev => ({ ...prev, reserved: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                        </div>

                        {/* Local Image Uploader */}
                        <div>
                          <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>تصویر محصول</label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="آدرس اینترنتی تصویر..."
                              value={addWarehouseForm.image}
                              onChange={e => setAddWarehouseForm(prev => ({ ...prev, image: e.target.value }))}
                              style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                            <button
                              type="button"
                              onClick={() => triggerWarehouseUpload('add')}
                              style={{
                                padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold'
                              }}
                            >
                              📁 آپلود فایل
                            </button>
                            <input
                              id="warehouseUploadInput_add"
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => handleWarehouseImageUploadLocal(e, 'add')}
                            />
                          </div>
                          {addWarehouseForm.image && (
                            <img
                              src={addWarehouseForm.image}
                              alt="پیش‌نمایش"
                              style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', marginTop: '10px', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                          )}
                        </div>

                        <button
                          type="submit"
                          style={{
                            width: '100%', padding: '10px', marginTop: '10px',
                            background: 'linear-gradient(135deg, #f87820 0%, #d4590c 100%)',
                            color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                          }}
                        >
                          ثبت نهایی کالا در انبار
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL: EDIT PRODUCT */}
                {isEditWarehouseOpen && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ background: '#0f111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#fff' }}>✏️ ویرایش کالای فیزیکی</h3>
                        <button onClick={() => setIsEditWarehouseOpen(false)} style={{ background: 'transparent', border: 'none', color: '#8b92a5', fontSize: '18px', cursor: 'pointer' }}>×</button>
                      </div>
                      
                      <form onSubmit={handleEditWarehouseProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
                        
                        <div>
                          <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>نام کالا (ضروری)</label>
                          <input
                            type="text"
                            required
                            value={editWarehouseForm.name}
                            onChange={e => setEditWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>برند (ضروری)</label>
                            <input
                              type="text"
                              required
                              value={editWarehouseForm.brand}
                              onChange={e => setEditWarehouseForm(prev => ({ ...prev, brand: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>دسته‌بندی (ضروری)</label>
                            <input
                              type="text"
                              required
                              value={editWarehouseForm.category}
                              onChange={e => setEditWarehouseForm(prev => ({ ...prev, category: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>SKU کالا</label>
                            <input
                              type="text"
                              value={editWarehouseForm.sku}
                              onChange={e => setEditWarehouseForm(prev => ({ ...prev, sku: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>محل نگهداری در انبار</label>
                            <input
                              type="text"
                              value={editWarehouseForm.location}
                              onChange={e => setEditWarehouseForm(prev => ({ ...prev, location: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>موجودی فیزیکی</label>
                            <input
                              type="number"
                              min="0"
                              value={editWarehouseForm.stock}
                              onChange={e => setEditWarehouseForm(prev => ({ ...prev, stock: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>حداقل موجودی (Low limit)</label>
                            <input
                              type="number"
                              min="1"
                              value={editWarehouseForm.minStock}
                              onChange={e => setEditWarehouseForm(prev => ({ ...prev, minStock: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>قیمت واحد (تومان)</label>
                            <input
                              type="number"
                              required
                              value={editWarehouseForm.price}
                              onChange={e => setEditWarehouseForm(prev => ({ ...prev, price: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>رزرو شده سفارشات</label>
                            <input
                              type="number"
                              min="0"
                              value={editWarehouseForm.reserved}
                              onChange={e => setEditWarehouseForm(prev => ({ ...prev, reserved: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                        </div>

                        {/* Local Image Uploader */}
                        <div>
                          <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>تصویر محصول</label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="آدرس اینترنتی تصویر..."
                              value={editWarehouseForm.image}
                              onChange={e => setEditWarehouseForm(prev => ({ ...prev, image: e.target.value }))}
                              style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                            <button
                              type="button"
                              onClick={() => triggerWarehouseUpload('edit')}
                              style={{
                                padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold'
                              }}
                            >
                              📁 آپلود فایل
                            </button>
                            <input
                              id="warehouseUploadInput_edit"
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => handleWarehouseImageUploadLocal(e, 'edit')}
                            />
                          </div>
                          {editWarehouseForm.image && (
                            <img
                              src={editWarehouseForm.image}
                              alt="پیش‌نمایش"
                              style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', marginTop: '10px', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                          )}
                        </div>

                        <button
                          type="submit"
                          style={{
                            width: '100%', padding: '10px', marginTop: '10px',
                            background: 'linear-gradient(135deg, #f87820 0%, #d4590c 100%)',
                            color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                          }}
                        >
                          ذخیره تغییرات
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL: ADJUST STOCK */}
                {warehouseAdjustStockOpen && selectedProduct && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ background: '#0f111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', width: '400px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '950', color: '#fff', marginBottom: '16px' }}>
                        {warehouseAdjustStockType === 'increase' ? '📦 ثبت افزایش موجودی فیزیکی' : '📤 ثبت کاهش موجودی فیزیکی'}
                      </h3>
                      
                      <div style={{ fontSize: '12px', color: '#8b92a5', marginBottom: '12px' }}>
                        کالا: <strong style={{ color: '#fff' }}>{selectedProduct.name}</strong> • موجودی فعلی: <strong style={{ color: '#fff' }}>{selectedProduct.stock} عدد</strong>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                        <div>
                          <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>تعداد کالا</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="تعداد تغییر..."
                            value={warehouseAdjustStockQty}
                            onChange={e => setWarehouseAdjustStockQty(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: '#8b92a5', marginBottom: '4px' }}>علت تغییر موجودی</label>
                          <input
                            type="text"
                            placeholder="مثال: فاکتور خرید، کسری فیزیکی، آسیب‌دیدگی..."
                            value={warehouseAdjustStockReason}
                            onChange={e => setWarehouseAdjustStockReason(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button
                            onClick={() => handleAdjustStockLocal(selectedProduct.id, warehouseAdjustStockType, warehouseAdjustStockQty, warehouseAdjustStockReason)}
                            style={{
                              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                              background: warehouseAdjustStockType === 'increase' ? '#10b981' : '#ef4444'
                            }}
                          >
                            تأیید و اعمال
                          </button>
                          <button
                            onClick={() => {
                              setWarehouseAdjustStockOpen(false);
                              setWarehouseAdjustStockQty('');
                              setWarehouseAdjustStockReason('');
                            }}
                            style={{
                              flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer',
                              background: 'transparent'
                            }}
                          >
                            انصراف
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL: ADD NOTE */}
                {warehouseAddNoteOpen && selectedProduct && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ background: '#0f111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', width: '400px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '950', color: '#fff', marginBottom: '12px' }}>📝 ثبت یادداشت برای کالا</h3>
                      <div style={{ fontSize: '12px', color: '#8b92a5', marginBottom: '12px' }}>کالا: <strong style={{ color: '#fff' }}>{selectedProduct.name}</strong></div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <textarea
                          placeholder="متن یادداشت انبار (مثال: کارتن آسیب دیده، نیاز به شمارش مجدد، منتظر ترخیص...)"
                          rows="4"
                          value={warehouseAddNoteText}
                          onChange={e => setWarehouseAddNoteText(e.target.value)}
                          style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '12px', resize: 'vertical' }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleAddNoteLocal(selectedProduct.id, warehouseAddNoteText)}
                            style={{ flex: 1, padding: '10px', background: '#f87820', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ثبت یادداشت
                          </button>
                          <button
                            onClick={() => {
                              setWarehouseAddNoteOpen(false);
                              setWarehouseAddNoteText('');
                            }}
                            style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            انصراف
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL: WAREHOUSE REPORT */}
                {warehouseReportOpen && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)' }}>
                    <div style={{ background: '#08090d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '30px', width: '850px', maxHeight: '90vh', overflowY: 'auto', color: '#fff' }}>
                      
                      {/* Printable Area Wrapper */}
                      <div id="warehousePrintableReport">
                        
                        {/* Report Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f87820', paddingBottom: '16px', marginBottom: '24px' }}>
                          <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '950', color: '#fff', margin: 0 }}>📊 گزارش جامع وضعیت انبار ایران</h2>
                            <p style={{ fontSize: '12px', color: '#8b92a5', margin: '4px 0 0 0' }}>دبی خرید • سامانه هوشمند مدیریت زنجیره تامین و انبار کالا</p>
                          </div>
                          <div style={{ textAlign: 'left', fontSize: '11px', color: '#8b92a5' }}>
                            <div>تاریخ گزارش: {new Date().toLocaleDateString('fa-IR')}</div>
                            <div>ساعت تهیه: {new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div>کاربر گزارش‌گیرنده: مدیر سایت</div>
                          </div>
                        </div>

                        {/* Key Metrics cards inside report */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#8b92a5', marginBottom: '4px' }}>ارزش کل موجودی انبار</div>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: '#f87820' }}>{totalValue.toLocaleString()} تومان</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#8b92a5', marginBottom: '4px' }}>کل اقلام قابل فروش</div>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: '#10b981' }}>{totalSellable} کالا</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#8b92a5', marginBottom: '4px' }}>اقلام با موجودی بحرانی</div>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: '#f59e0b' }}>{lowStockCount} مورد</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#8b92a5', marginBottom: '4px' }}>تعداد اقلام ناموجود</div>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: '#ef4444' }}>{outOfStockCount} مورد</div>
                          </div>
                        </div>

                        {/* List of Products */}
                        <h4 style={{ fontSize: '14px', color: '#fff', borderRight: '3px solid #f87820', paddingRight: '8px', marginBottom: '12px', fontWeight: 'bold' }}>📋 لیست قلم کالاهای انبار فعال</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'right', marginBottom: '24px' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <th style={{ padding: '8px 10px', color: '#fff' }}>شناسه کالا / SKU</th>
                              <th style={{ padding: '8px 10px', color: '#fff' }}>نام محصول</th>
                              <th style={{ padding: '8px 10px', color: '#fff' }}>دسته‌بندی</th>
                              <th style={{ padding: '8px 10px', color: '#fff', textAlign: 'center' }}>موجودی</th>
                              <th style={{ padding: '8px 10px', color: '#fff', textAlign: 'center' }}>رزرو</th>
                              <th style={{ padding: '8px 10px', color: '#fff', textAlign: 'center' }}>قابل فروش</th>
                              <th style={{ padding: '8px 10px', color: '#fff' }}>قیمت واحد</th>
                              <th style={{ padding: '8px 10px', color: '#fff' }}>محل قرارگیری</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeProds.map(p => (
                              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '8px 10px', color: '#f87820', fontWeight: 'bold' }}>{p.sku}</td>
                                <td style={{ padding: '8px 10px', color: '#fff', fontWeight: 'bold' }}>{p.name}</td>
                                <td style={{ padding: '8px 10px', color: '#c0c8d8' }}>{p.category}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center', color: p.stock === 0 ? '#ef4444' : '#fff' }}>{p.stock}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center', color: '#3b82f6' }}>{p.reserved}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center', color: (p.stock - p.reserved) <= 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{p.stock - p.reserved}</td>
                                <td style={{ padding: '8px 10px' }}>{p.price.toLocaleString()} تومان</td>
                                <td style={{ padding: '8px 10px', color: '#8b92a5' }}>{p.location}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Recent combined history logs */}
                        <h4 style={{ fontSize: '14px', color: '#fff', borderRight: '3px solid #f87820', paddingRight: '8px', marginBottom: '12px', fontWeight: 'bold' }}>🕒 وقایع و تغییرات اخیر انبار (تراکنش‌ها)</h4>
                        {combinedHistory.length > 0 ? (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'right' }}>
                            <thead>
                              <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '6px 10px', color: '#fff' }}>تاریخ و زمان</th>
                                <th style={{ padding: '6px 10px', color: '#fff' }}>کالا</th>
                                <th style={{ padding: '6px 10px', color: '#fff' }}>نوع تراکنش</th>
                                <th style={{ padding: '6px 10px', color: '#fff', textAlign: 'center' }}>تعداد</th>
                                <th style={{ padding: '6px 10px', color: '#fff' }}>ثبت کننده</th>
                                <th style={{ padding: '6px 10px', color: '#fff' }}>شرح علت</th>
                              </tr>
                            </thead>
                            <tbody>
                              {combinedHistory.slice(0, 15).map((log, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                  <td style={{ padding: '6px 10px', color: '#8b92a5' }}>{log.date}</td>
                                  <td style={{ padding: '6px 10px', color: '#fff' }}><strong>{log.productName}</strong> <span style={{ fontSize: '9px', color: '#8b92a5' }}>({log.sku})</span></td>
                                  <td style={{ padding: '6px 10px' }}>
                                    <span style={{
                                      padding: '2px 6px', borderRadius: '4px', fontSize: '9.5px',
                                      background: log.action === 'افزایش موجودی' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                      color: log.action === 'افزایش موجودی' ? '#10b981' : '#ef4444'
                                    }}>
                                      {log.action}
                                    </span>
                                  </td>
                                  <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', color: log.qty.startsWith('+') ? '#10b981' : '#ef4444' }}>{log.qty}</td>
                                  <td style={{ padding: '6px 10px', color: '#c0c8d8' }}>{log.user}</td>
                                  <td style={{ padding: '6px 10px', color: '#8b92a5' }}>{log.reason || 'ثبت دستی'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#8b92a5', textAlign: 'center', padding: '16px' }}>هیچ تراکنش ثبتی اخیراً وجود ندارد.</div>
                        )}

                      </div>

                      {/* Modal Footer actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <button
                          onClick={() => {
                            const printContent = document.getElementById('warehousePrintableReport').innerHTML;
                            const originalContent = document.body.innerHTML;
                            document.body.innerHTML = printContent;
                            window.print();
                            // Reload page to restore react DOM bindings after printing
                            window.location.reload();
                          }}
                          style={{
                            padding: '10px 24px', background: 'linear-gradient(135deg, #f87820 0%, #d4590c 100%)',
                            color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px'
                          }}
                        >
                          🖨 چاپ گزارش
                        </button>
                        <button
                          onClick={() => setWarehouseReportOpen(false)}
                          style={{
                            padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '12px'
                          }}
                        >
                          بستن پنجره
                        </button>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* TAB: SITE PRODUCTS LIST (Foreign Products) */}
          {activeTab === 'site_products' && (() => {
            // Helper getters
            const getProductSourceStore = (product) => {
              if (product.sourceStore) return product.sourceStore;
              if (product.brand === 'Apple') return 'Apple UAE';
              if (product.brand === 'Samsung') return 'Samsung UAE';
              if (product.brand === 'Nike') return 'Nike UAE';
              if (product.brand === 'Adidas') return 'Adidas UAE';
              if (product.id.includes('1001') || product.id.includes('1002')) return 'Noon';
              if (product.id.includes('1003') || product.id.includes('1004')) return 'Amazon.ae';
              return 'Namshi';
            };

            const getProductAedPrice = (product) => {
              if (product.priceAed !== undefined) return product.priceAed;
              const rate = parseFloat(siteCtxSettings?.aedRate) || 19500;
              return Math.round(product.price / rate) || 150;
            };

            const getProductWeight = (product) => {
              if (product.weight) return product.weight;
              if (product.category?.includes('کفش')) return '1.2';
              if (product.category?.includes('کیف')) return '0.8';
              if (product.category?.includes('گوشی') || product.category?.includes('ساعت')) return '0.4';
              return '1.0';
            };

            const getProductForeignStatus = (product) => {
              if (product.foreignStatus) return product.foreignStatus;
              if (product.id.includes('1002')) return 'needs_update';
              if (product.id.includes('1004')) return 'broken_link';
              if (product.id.includes('1006')) return 'hidden';
              return 'active';
            };

            const getProductLastUpdated = (product) => {
              return product.lastUpdated || '۱۴۰۵/۰۳/۳۰';
            };

            const getProductOriginalLink = (product) => {
              if (product.originalLink) return product.originalLink;
              const store = getProductSourceStore(product).toLowerCase().replace(' uae', '').replace('.ae', '');
              return `https://www.${store}.ae/dp/B08${product.id.replace('prod-', '')}`;
            };

            // Simulated Crawler logic
            const saveProductsState = (updatedList) => {
              setAdminProducts(updatedList);
              localStorage.setItem('dubaiKharidAdminProducts', JSON.stringify(updatedList));
              localStorage.setItem('dubaiKharidUploadedProducts', JSON.stringify(updatedList));
            };

            const handleImageUploadLocal = (e, type) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (type === 'add') {
                    setAddProductManualForm(prev => ({ ...prev, image: reader.result }));
                  } else {
                    setEditProductForm(prev => ({ ...prev, image: reader.result }));
                  }
                };
                reader.readAsDataURL(file);
              }
            };

            const handleDeleteProduct = (prodId) => {
              if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) return;
              const filtered = adminProducts.filter(p => p.id !== prodId);
              saveProductsState(filtered);
              alert('محصول با موفقیت حذف گردید.');
            };

            const handleFetchProductFromLink = () => {
              if (!productLinkInput) return;
              
              const isAmazon = productLinkInput.includes('amazon.ae');
              const isNoon = productLinkInput.includes('noon.com') || productLinkInput.includes('noon.ae');
              const isNamshi = productLinkInput.includes('namshi.com');
              
              if (!isAmazon && !isNoon && !isNamshi) {
                alert('لطفاً یک لینک معتبر از سایت‌های آمازون امارات (amazon.ae)، نون (noon.com) یا نمشی (namshi.com) وارد نمایید.');
                return;
              }
              
              setIsFetchingProductLink(true);
              
              setTimeout(() => {
                setIsFetchingProductLink(false);
                
                let crawledProduct = {
                  id: 'prod-' + Date.now(),
                  code: 'DK-' + Math.floor(1000 + Math.random() * 9000),
                  name: '',
                  brand: 'Apple',
                  category: '',
                  gender: '',
                  discountPercent: 0,
                  isBestSeller: false,
                  priceAed: 2999,
                  weight: '0.3',
                  image: '',
                  sourceStore: '',
                  originalLink: productLinkInput,
                  foreignStatus: 'active',
                  lastUpdated: 'امروز'
                };
                
                if (isAmazon) {
                  crawledProduct.name = 'Kindle Paperwhite (16 GB) - Black';
                  crawledProduct.brand = 'Amazon';
                  crawledProduct.priceAed = 579;
                  crawledProduct.weight = '0.25';
                  crawledProduct.image = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&q=80';
                  crawledProduct.sourceStore = 'Amazon.ae';
                } else if (isNoon) {
                  crawledProduct.name = 'Sony PlayStation 5 Slim Console';
                  crawledProduct.brand = 'Sony';
                  crawledProduct.priceAed = 1849;
                  crawledProduct.weight = '3.2';
                  crawledProduct.image = 'https://images.unsplash.com/photo-1606813907291-d86edd9b94db?w=120&q=80';
                  crawledProduct.sourceStore = 'Noon';
                  crawledProduct.isBestSeller = true;
                } else if (isNamshi) {
                  crawledProduct.name = 'Calvin Klein Cotton Stretch Boxer Briefs';
                  crawledProduct.brand = 'Calvin Klein';
                  crawledProduct.priceAed = 145;
                  crawledProduct.weight = '0.15';
                  crawledProduct.image = 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=120&q=80';
                  crawledProduct.sourceStore = 'Namshi';
                  crawledProduct.gender = 'men';
                }
                
                const updated = [crawledProduct, ...adminProducts];
                saveProductsState(updated);
                setSelectedAdminProductId(crawledProduct.id);
                setProductLinkInput('');
                alert('محصول با موفقیت استخراج و اضافه شد.');
              }, 1200);
            };

            // Quick Operations
            const handlePromptUpdatePrice = (prod) => {
              const currentPrice = getProductAedPrice(prod);
              const newPrice = prompt(`قیمت جدید محصول به درهم (AED) را وارد کنید (قیمت فعلی: ${currentPrice} AED):`, currentPrice);
              if (newPrice !== null && !isNaN(newPrice) && parseFloat(newPrice) > 0) {
                const updated = adminProducts.map(p => p.id === prod.id ? { ...p, priceAed: parseFloat(newPrice), lastUpdated: 'امروز' } : p);
                saveProductsState(updated);
                alert('قیمت با موفقیت بروزرسانی شد.');
              }
            };

            const handleToggleHide = (prodId) => {
              const updated = adminProducts.map(p => {
                if (p.id === prodId) {
                  const currStatus = getProductForeignStatus(p);
                  const newStatus = currStatus === 'hidden' ? 'active' : 'hidden';
                  return { ...p, foreignStatus: newStatus };
                }
                return p;
              });
              saveProductsState(updated);
            };

            const handleEditClick = (prod) => {
              setEditProductForm({
                id: prod.id,
                name: prod.name,
                brand: prod.brand,
                priceAed: getProductAedPrice(prod),
                weight: getProductWeight(prod),
                sourceStore: getProductSourceStore(prod),
                originalLink: getProductOriginalLink(prod),
                foreignStatus: getProductForeignStatus(prod),
                image: prod.image || '',
                gender: prod.gender || '',
                category: prod.category || '',
                discountPercent: prod.discountPercent || 0,
                isBestSeller: prod.isBestSeller || false
              });
              setIsEditProductModalOpen(true);
            };

            const handleEditProductSubmitLocal = (e) => {
              e.preventDefault();
              const updated = adminProducts.map(p => p.id === editProductForm.id ? {
                ...p,
                name: editProductForm.name,
                brand: editProductForm.brand,
                priceAed: parseFloat(editProductForm.priceAed),
                weight: parseFloat(editProductForm.weight),
                sourceStore: editProductForm.sourceStore,
                originalLink: editProductForm.originalLink,
                foreignStatus: editProductForm.foreignStatus,
                image: editProductForm.image,
                gender: editProductForm.gender,
                category: editProductForm.category,
                discountPercent: parseFloat(editProductForm.discountPercent) || 0,
                isBestSeller: editProductForm.isBestSeller,
                lastUpdated: 'امروز'
              } : p);
              saveProductsState(updated);
              setIsEditProductModalOpen(false);
              alert('محصول با موفقیت ویرایش شد.');
            };

            const handleManualAddProductSubmit = (e) => {
              e.preventDefault();
              if (!addProductManualForm.name || !addProductManualForm.priceAed) {
                alert('لطفاً نام محصول و قیمت به درهم را وارد کنید.');
                return;
              }
              const newProd = {
                id: 'prod-' + Date.now(),
                code: 'DK-' + Math.floor(1000 + Math.random() * 9000),
                name: addProductManualForm.name,
                brand: addProductManualForm.brand || 'Nike',
                priceAed: parseFloat(addProductManualForm.priceAed),
                weight: parseFloat(addProductManualForm.weight) || 1.0,
                image: addProductManualForm.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=80',
                sourceStore: addProductManualForm.sourceStore || 'Amazon.ae',
                originalLink: addProductManualForm.originalLink || '',
                foreignStatus: 'active',
                gender: addProductManualForm.gender || '',
                category: addProductManualForm.category || '',
                discountPercent: parseFloat(addProductManualForm.discountPercent) || 0,
                isBestSeller: addProductManualForm.isBestSeller || false,
                lastUpdated: 'امروز'
              };
              const updated = [newProd, ...adminProducts];
              saveProductsState(updated);
              setSelectedAdminProductId(newProd.id);
              setIsAddProductManualOpen(false);
              alert('محصول با موفقیت به صورت دستی اضافه شد.');
            };

            // Metrics Calculations
            const totalForeignProducts = adminProducts.length;
            const activeProducts = adminProducts.filter(p => getProductForeignStatus(p) === 'active').length;
            const brokenLinks = adminProducts.filter(p => getProductForeignStatus(p) === 'broken_link').length;
            const needsUpdate = adminProducts.filter(p => getProductForeignStatus(p) === 'needs_update').length;
            const salesCountThisMonth = leads.filter(l => ['purchased', 'noon_dubai', 'warehouse_dubai', 'shipped', 'delivered'].includes(l.status)).length + 42;

            // Search & Filtering
            const filteredProds = adminProducts.filter(p => {
              const q = productSearchQuery.toLowerCase();
              const matchesSearch = productSearchQuery === '' || 
                p.name.toLowerCase().includes(q) ||
                p.brand.toLowerCase().includes(q) ||
                getProductSourceStore(p).toLowerCase().includes(q);

              const statusVal = getProductForeignStatus(p);
              const matchesStatus = productStatusFilter === 'همه' || 
                (productStatusFilter === 'active' && statusVal === 'active') ||
                (productStatusFilter === 'needs_update' && statusVal === 'needs_update') ||
                (productStatusFilter === 'broken_link' && statusVal === 'broken_link') ||
                (productStatusFilter === 'hidden' && statusVal === 'hidden');

              const matchesBrand = productBrandFilter === 'همه' || p.brand === productBrandFilter;

              return matchesSearch && matchesStatus && matchesBrand;
            });

            // Sorting
            const sortedProds = [...filteredProds].sort((a, b) => {
              let valA = a[productSortField];
              let valB = b[productSortField];
              if (productSortField === 'price') {
                valA = getProductAedPrice(a);
                valB = getProductAedPrice(b);
              }
              if (valA < valB) return productSortOrder === 'asc' ? -1 : 1;
              if (valA > valB) return productSortOrder === 'asc' ? 1 : -1;
              return 0;
            });

            const selectedProduct = adminProducts.find(p => p.id === selectedAdminProductId) || sortedProds[0] || null;

            // Price Breakdown Calculations
            const getPriceBreakdown = (prod) => {
              if (!prod) return null;
              const aedRateValue = parseFloat(siteCtxSettings?.aedRate) || 19500;
              const priceAed = getProductAedPrice(prod);
              const weight = parseFloat(getProductWeight(prod)) || 1.0;
              
              const commissionPct = parseFloat(siteCtxSettings?.commissionPercent) || 25;
              const shippingPerKg = parseFloat(siteCtxSettings?.shippingPerKgAed) || 40;
              const minWeight = parseFloat(siteCtxSettings?.minWeightClass) || 1.0;
              const roundMethod = siteCtxSettings?.roundingMethod || 'ceil';
              
              let roundedWeight = weight;
              if (roundMethod === 'ceil') {
                roundedWeight = Math.ceil(weight);
              } else if (roundMethod === 'floor') {
                roundedWeight = Math.floor(weight);
              } else if (roundMethod === 'round') {
                roundedWeight = Math.round(weight);
              }
              
              if (roundedWeight < minWeight) {
                roundedWeight = minWeight;
              }
              
              const shippingCost = roundedWeight * shippingPerKg;
              const commissionCost = priceAed * (commissionPct / 100);
              const finalPriceAed = priceAed + shippingCost + commissionCost;
              const finalPriceToman = Math.round(finalPriceAed * aedRateValue);
              
              return {
                priceAed,
                weight,
                roundedWeight,
                shippingCost,
                commissionCost,
                aedRateValue,
                finalPriceToman,
                commissionPct
              };
            };

            const selectedBreakdown = getPriceBreakdown(selectedProduct);

            return (
              <div style={{ fontFamily: 'var(--font-vazirmatn), sans-serif' }}>
                
                {/* Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🌐 مدیریت محصولات خارجی
                    </h1>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#8b92a5' }}>
                      کنترل و نظارت بر روی محصولات استخراج‌شده از فروشگاه‌های امارات (پشتیبانی، قیمت‌گذاری و سودآوری)
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setAddProductManualForm({
                        name: '', brand: 'Nike', priceAed: '', weight: '1.0', sourceStore: 'Amazon.ae', originalLink: '', image: '', category: 'موبایل و تبلت'
                      });
                      setIsAddProductManualOpen(true);
                    }}
                    style={{ padding: '8px 16px', background: 'linear-gradient(135deg, var(--admin-orange), #ff9d00)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    ➕ افزودن دستی محصول
                  </button>
                </div>

                {/* 5 Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>کل محصولات خارجی</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>{totalForeignProducts} محصول</div>
                    <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '4px' }}>در کل آرشیو کاتالوگ</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>محصولات فعال</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981' }}>{activeProducts} کالا</div>
                    <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '4px' }}>نمایش فعال روی وبسایت</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>لینک‌های خراب</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#ef4444' }}>{brokenLinks} مورد</div>
                    <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '4px' }}>خطای ۴۰۴ مبدا امارات</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>نیاز به بروزرسانی قیمت</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#f59e0b' }}>{needsUpdate} کالا</div>
                    <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '4px' }}>تغییر قیمت در سایت مبدا</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#8b92a5', marginBottom: '6px' }}>تعداد فروش این ماه</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#f87820' }}>{salesCountThisMonth} سفارش</div>
                    <div style={{ fontSize: '10px', color: '#8b92a5', marginTop: '4px' }}>ثبت و نهایی شده در سیستم</div>
                  </div>
                </div>

                {/* Main Split Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1.3fr', gap: '24px', direction: 'rtl' }}>
                  
                  {/* Left Column: Search & Directory Table */}
                  <div>
                    {/* Filters bar */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="جستجو در نام، برند یا فروشگاه..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        style={{ flex: 1, padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12.5px', outline: 'none' }}
                      />
                      
                      <select
                        value={productStatusFilter}
                        onChange={e => setProductStatusFilter(e.target.value)}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="همه" style={{ background: '#1c1d24' }}>همه وضعیت‌ها</option>
                        <option value="active" style={{ background: '#1c1d24' }}>🟢 فعال</option>
                        <option value="needs_update" style={{ background: '#1c1d24' }}>🟡 نیاز به بروزرسانی قیمت</option>
                        <option value="broken_link" style={{ background: '#1c1d24' }}>🔴 لینک خراب</option>
                        <option value="hidden" style={{ background: '#1c1d24' }}>⚫ مخفی</option>
                      </select>

                      <select
                        value={productBrandFilter}
                        onChange={e => setProductBrandFilter(e.target.value)}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="همه" style={{ background: '#1c1d24' }}>همه برندها</option>
                        <option value="Nike" style={{ background: '#1c1d24' }}>Nike</option>
                        <option value="Adidas" style={{ background: '#1c1d24' }}>Adidas</option>
                        <option value="Apple" style={{ background: '#1c1d24' }}>Apple</option>
                        <option value="Samsung" style={{ background: '#1c1d24' }}>Samsung</option>
                        <option value="Michael Kors" style={{ background: '#1c1d24' }}>Michael Kors</option>
                        <option value="Amazon" style={{ background: '#1c1d24' }}>Amazon</option>
                        <option value="Sony" style={{ background: '#1c1d24' }}>Sony</option>
                        <option value="Calvin Klein" style={{ background: '#1c1d24' }}>Calvin Klein</option>
                      </select>
                    </div>

                    {/* Table */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ padding: '12px 16px', color: '#8b92a5' }}>تصویر</th>
                            <th style={{ padding: '12px 16px', color: '#8b92a5' }}>نام محصول</th>
                            <th style={{ padding: '12px 16px', color: '#8b92a5' }}>برند</th>
                            <th style={{ padding: '12px 16px', color: '#8b92a5' }}>فروشگاه مبدا</th>
                            <th style={{ padding: '12px 16px', color: '#8b92a5' }}>قیمت اصلی (AED)</th>
                            <th style={{ padding: '12px 16px', color: '#8b92a5' }}>وزن (KG)</th>
                            <th style={{ padding: '12px 16px', color: '#8b92a5' }}>وضعیت</th>
                            <th style={{ padding: '12px 16px', color: '#8b92a5' }}>آخرین بروزرسانی</th>
                            <th style={{ padding: '12px 16px', color: '#8b92a5' }}>عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedProds.length === 0 ? (
                            <tr>
                              <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#8b92a5' }}>هیچ محصولی با مشخصات جستجو شده یافت نشد.</td>
                            </tr>
                          ) : (
                            sortedProds.map(p => {
                              const store = getProductSourceStore(p);
                              const priceAed = getProductAedPrice(p);
                              const weight = getProductWeight(p);
                              const statusVal = getProductForeignStatus(p);
                              const isSelected = selectedProduct && selectedProduct.id === p.id;
                              
                              return (
                                <tr 
                                  key={p.id}
                                  onClick={() => setSelectedAdminProductId(p.id)}
                                  style={{ 
                                    borderBottom: '1px solid rgba(255,255,255,0.04)', 
                                    cursor: 'pointer', 
                                    background: isSelected ? 'rgba(248,120,32,0.06)' : 'transparent',
                                    transition: 'background 0.15s'
                                  }}
                                  onMouseOver={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                  onMouseOut={e => { if(!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <td style={{ padding: '12px 16px' }}>
                                    <img src={p.image} alt={p.name} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }} />
                                  </td>
                                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#fff', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                                  <td style={{ padding: '12px 16px', color: '#c0c8d8' }}>{p.brand}</td>
                                  <td style={{ padding: '12px 16px', color: '#8b92a5' }}>
                                    <span style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{store}</span>
                                  </td>
                                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 'bold' }}>{priceAed} AED</td>
                                  <td style={{ padding: '12px 16px', color: '#c0c8d8' }}>{weight} kg</td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <span style={{
                                      padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 'bold',
                                      background: statusVal === 'active' ? 'rgba(16,185,129,0.1)' : statusVal === 'needs_update' ? 'rgba(245,158,11,0.1)' : statusVal === 'broken_link' ? 'rgba(239,68,68,0.1)' : 'rgba(156,163,175,0.1)',
                                      color: statusVal === 'active' ? '#10b981' : statusVal === 'needs_update' ? '#f59e0b' : statusVal === 'broken_link' ? '#ef4444' : '#9ca3af'
                                    }}>
                                      {statusVal === 'active' ? 'فعال' : statusVal === 'needs_update' ? 'بروزرسانی قیمت' : statusVal === 'broken_link' ? 'لینک خراب' : 'مخفی'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 16px', color: '#8b92a5' }}>{getProductLastUpdated(p)}</td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                      <button 
                                        onClick={() => handleEditClick(p)} 
                                        style={{ padding: '4px 8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#c0c8d8', cursor: 'pointer', fontSize: '10px' }}
                                        title="ویرایش محصول"
                                      >
                                        ویرایش
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteProduct(p.id)} 
                                        style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '10px' }}
                                        title="حذف"
                                      >
                                        حذف
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Importer Widget & Sidebar details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Importer Card */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(248, 120, 32, 0.15)', borderRadius: '12px', padding: '16px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📥 افزودن محصول از لینک
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input 
                          type="text" 
                          value={productLinkInput}
                          onChange={e => setProductLinkInput(e.target.value)}
                          placeholder="لینک کالا از Amazon.ae یا Noon یا Namshi..." 
                          style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '11px', outline: 'none' }}
                        />
                        <button 
                          onClick={handleFetchProductFromLink}
                          disabled={isFetchingProductLink}
                          style={{ 
                            width: '100%', 
                            padding: '9px', 
                            background: 'linear-gradient(135deg, var(--admin-orange), #e65f00)', 
                            border: 'none', 
                            borderRadius: '8px', 
                            color: '#fff', 
                            fontWeight: 'bold', 
                            cursor: 'pointer', 
                            fontSize: '11.5px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {isFetchingProductLink ? 'در حال استخراج اطلاعات...' : 'دریافت اطلاعات'}
                        </button>
                      </div>
                      
                      <span style={{ display: 'block', fontSize: '9.5px', color: '#8b92a5', marginTop: '6px', textAlign: 'center' }}>
                        سیستم به طور خودکار نام، برند، تصویر و قیمت درهم را استخراج می‌کند.
                      </span>
                    </div>

                    {/* Details Panel Sidebar */}
                    {selectedProduct ? (
                      <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px' }}>
                        <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', margin: '0 0 14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                          📋 جزئیات محصول خارجی
                        </h3>
                        
                        {/* Img and name header */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                          <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', lineHeight: '1.4' }}>{selectedProduct.name}</span>
                            <span style={{ fontSize: '11px', color: '#8b92a5' }}>برند: {selectedProduct.brand}</span>
                          </div>
                        </div>

                        {/* Cost Calculator Grid */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '11.5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#8b92a5' }}>فروشگاه مبدا:</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{getProductSourceStore(selectedProduct)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#8b92a5' }}>قیمت اصلی به درهم:</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedBreakdown?.priceAed} AED</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#8b92a5' }}>وزن محصول:</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedBreakdown?.weight} KG</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                            <span style={{ color: '#8b92a5' }}>هزینه ارسال مبدا تا تهران:</span>
                            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{selectedBreakdown?.shippingCost.toFixed(0)} AED</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#8b92a5' }}>کارمزد خرید ({selectedBreakdown?.commissionPct}%):</span>
                            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{selectedBreakdown?.commissionCost.toFixed(0)} AED</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#8b92a5' }}>نرخ فعلی درهم (تومان):</span>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>{selectedBreakdown?.aedRateValue.toLocaleString()} تومان</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', fontSize: '13px' }}>
                            <span style={{ color: 'var(--admin-orange)', fontWeight: 'bold' }}>قیمت نهایی مصرف‌کننده:</span>
                            <span style={{ color: 'var(--admin-orange)', fontWeight: '900' }}>{selectedBreakdown?.finalPriceToman.toLocaleString()} تومان</span>
                          </div>
                        </div>

                        {/* Order stats */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginBottom: '16px', fontSize: '11px', color: '#8b92a5' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>تعداد سفارش ثبت شده:</span>
                            <span style={{ color: '#fff' }}>{selectedProduct.ordersCount || (selectedProduct.id.charCodeAt(selectedProduct.id.length - 1) % 7 + 1)} سفارش</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>تعداد فروش موفق:</span>
                            <span style={{ color: '#fff' }}>{selectedProduct.salesCount || (selectedProduct.id.charCodeAt(selectedProduct.id.length - 1) % 5 + 1)} عدد</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>آخرین سفارش ثبت‌شده:</span>
                            <span style={{ color: '#fff' }}>{selectedProduct.lastOrderDate || '۱۴۰۵/۰۳/۲۸'}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button 
                              onClick={() => handleEditClick(selectedProduct)}
                              style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              ✏️ ویرایش محصول
                            </button>
                            <button 
                              onClick={() => handlePromptUpdatePrice(selectedProduct)}
                              style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              💰 بروزرسانی قیمت
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => window.open(getProductOriginalLink(selectedProduct), '_blank')}
                            style={{ width: '100%', padding: '8px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', color: '#3b82f6', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            🔗 مشاهده لینک اصلی محصول
                          </button>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button 
                              onClick={() => handleToggleHide(selectedProduct.id)}
                              style={{ padding: '8px', background: getProductForeignStatus(selectedProduct) === 'hidden' ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)', border: getProductForeignStatus(selectedProduct) === 'hidden' ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: getProductForeignStatus(selectedProduct) === 'hidden' ? '#10b981' : '#c0c8d8', fontSize: '11px', cursor: 'pointer' }}
                            >
                              {getProductForeignStatus(selectedProduct) === 'hidden' ? '👁️ نمایش مجدد' : '👁️‍🗨️ مخفی کردن'}
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(selectedProduct.id)}
                              style={{ padding: '8px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                            >
                              ❌ حذف محصول
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#8b92a5', fontSize: '12px' }}>
                        محصولی جهت نمایش انتخاب نشده است.
                      </div>
                    )}
                  </div>
                </div>

                {isEditProductModalOpen && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
                    <div style={{ background: '#0f111a', border: '1px solid rgba(248,120,32,0.2)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', margin: 0 }}>✏️ ویرایش اطلاعات محصول خارجی</h2>
                        <button onClick={() => setIsEditProductModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8b92a5', fontSize: '20px', cursor: 'pointer' }}>×</button>
                      </div>
                      
                      <form onSubmit={handleEditProductSubmitLocal} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '11px', color: '#8b92a5' }}>نام محصول:</label>
                          <input 
                            type="text" 
                            required
                            value={editProductForm.name}
                            onChange={(e) => setEditProductForm({...editProductForm, name: e.target.value})}
                            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '11px', color: '#8b92a5' }}>برند:</label>
                            <input 
                              type="text" 
                              required
                              value={editProductForm.brand}
                              onChange={(e) => setEditProductForm({...editProductForm, brand: e.target.value})}
                              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '11px', color: '#8b92a5' }}>فروشگاه مبدا:</label>
                            <select 
                              value={editProductForm.sourceStore}
                              onChange={(e) => setEditProductForm({...editProductForm, sourceStore: e.target.value})}
                              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                            >
                              <option value="Amazon.ae" style={{ background: '#1c1d24' }}>Amazon.ae</option>
                              <option value="Noon" style={{ background: '#1c1d24' }}>Noon</option>
                              <option value="Namshi" style={{ background: '#1c1d24' }}>Namshi</option>
                              <option value="Adidas UAE" style={{ background: '#1c1d24' }}>Adidas UAE</option>
                              <option value="Nike UAE" style={{ background: '#1c1d24' }}>Nike UAE</option>
                              <option value="Apple UAE" style={{ background: '#1c1d24' }}>Apple UAE</option>
                              <option value="Samsung UAE" style={{ background: '#1c1d24' }}>Samsung UAE</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '11px', color: '#8b92a5' }}>قیمت به درهم (AED):</label>
                            <input 
                              type="number" 
                              required
                              min="0.1"
                              step="any"
                              value={editProductForm.priceAed}
                              onChange={(e) => setEditProductForm({...editProductForm, priceAed: e.target.value})}
                              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '11px', color: '#8b92a5' }}>وزن (کیلوگرم):</label>
                            <input 
                              type="number" 
                              required
                              min="0.01"
                              step="any"
                              value={editProductForm.weight}
                              onChange={(e) => setEditProductForm({...editProductForm, weight: e.target.value})}
                              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '11px', color: '#8b92a5' }}>لینک اصلی محصول:</label>
                          <input 
                            type="text" 
                            required
                            value={editProductForm.originalLink}
                            onChange={(e) => setEditProductForm({...editProductForm, originalLink: e.target.value})}
                            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '11px', color: '#8b92a5' }}>تصویر محصول:</label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleImageUploadLocal(e, 'edit')}
                              style={{ display: 'none' }}
                              id="edit-image-file-input"
                            />
                            <label 
                              htmlFor="edit-image-file-input"
                              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '11px', cursor: 'pointer', textAlign: 'center', flex: 1 }}
                            >
                              📁 انتخاب فایل تصویر (آپلود دستی)
                            </label>
                            {editProductForm.image && (
                              <img src={editProductForm.image} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} />
                            )}
                          </div>
                          <input 
                            type="text" 
                            value={editProductForm.image}
                            onChange={(e) => setEditProductForm({...editProductForm, image: e.target.value})}
                            placeholder="یا آدرس اینترنتی تصویر را وارد کنید"
                            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', marginTop: '6px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '11px', color: '#8b92a5' }}>نمایش در دسته‌بندی‌های سایت:</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={editProductForm.gender === 'men'} 
                                onChange={(e) => setEditProductForm({...editProductForm, gender: e.target.checked ? 'men' : ''})} 
                              />
                              مردانه (Men)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={editProductForm.gender === 'women'} 
                                onChange={(e) => setEditProductForm({...editProductForm, gender: e.target.checked ? 'women' : ''})} 
                              />
                              زنانه (Women)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={editProductForm.gender === 'kids'} 
                                onChange={(e) => setEditProductForm({...editProductForm, gender: e.target.checked ? 'kids' : ''})} 
                              />
                              بچگانه (Kids)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={editProductForm.category === 'bags'} 
                                onChange={(e) => setEditProductForm({...editProductForm, category: e.target.checked ? 'bags' : ''})} 
                              />
                              کیف و اکسسوری
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={editProductForm.discountPercent > 0} 
                                onChange={(e) => setEditProductForm({...editProductForm, discountPercent: e.target.checked ? 20 : 0})} 
                              />
                              تخفیف خورده (Sale)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={editProductForm.isBestSeller === true} 
                                onChange={(e) => setEditProductForm({...editProductForm, isBestSeller: e.target.checked})} 
                              />
                              پرفروش‌ترین‌ها
                            </label>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '11px', color: '#8b92a5' }}>وضعیت محصول:</label>
                          <select 
                            value={editProductForm.foreignStatus}
                            onChange={(e) => setEditProductForm({...editProductForm, foreignStatus: e.target.value})}
                            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="active" style={{ background: '#1c1d24' }}>🟢 فعال</option>
                            <option value="needs_update" style={{ background: '#1c1d24' }}>🟡 نیاز به بروزرسانی قیمت</option>
                            <option value="broken_link" style={{ background: '#1c1d24' }}>🔴 لینک خراب</option>
                            <option value="hidden" style={{ background: '#1c1d24' }}>⚫ مخفی</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => setIsEditProductModalOpen(false)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '11.5px' }}>انصراف</button>
                          <button type="submit" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, var(--admin-orange), #ff9d00)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '11.5px' }}>ذخیره تغییرات</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Add Product Manual Modal */}
                {isAddProductManualOpen && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
                    <div style={{ background: '#0f111a', border: '1px solid rgba(248,120,32,0.2)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', margin: 0 }}>➕ افزودن دستی محصول خارجی</h2>
                        <button onClick={() => setIsAddProductManualOpen(false)} style={{ background: 'none', border: 'none', color: '#8b92a5', fontSize: '20px', cursor: 'pointer' }}>×</button>
                      </div>
                      
                      <form onSubmit={handleManualAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '11px', color: '#8b92a5' }}>نام محصول:</label>
                          <input 
                            type="text" 
                            required
                            value={addProductManualForm.name}
                            onChange={(e) => setAddProductManualForm({...addProductManualForm, name: e.target.value})}
                            placeholder="مثال: Apple Watch Ultra 2"
                            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '11px', color: '#8b92a5' }}>برند:</label>
                            <input 
                              type="text" 
                              required
                              value={addProductManualForm.brand}
                              onChange={(e) => setAddProductManualForm({...addProductManualForm, brand: e.target.value})}
                              placeholder="مثال: Apple"
                              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '11px', color: '#8b92a5' }}>فروشگاه مبدا:</label>
                            <select 
                              value={addProductManualForm.sourceStore}
                              onChange={(e) => setAddProductManualForm({...addProductManualForm, sourceStore: e.target.value})}
                              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                            >
                              <option value="Amazon.ae" style={{ background: '#1c1d24' }}>Amazon.ae</option>
                              <option value="Noon" style={{ background: '#1c1d24' }}>Noon</option>
                              <option value="Namshi" style={{ background: '#1c1d24' }}>Namshi</option>
                              <option value="Adidas UAE" style={{ background: '#1c1d24' }}>Adidas UAE</option>
                              <option value="Nike UAE" style={{ background: '#1c1d24' }}>Nike UAE</option>
                              <option value="Apple UAE" style={{ background: '#1c1d24' }}>Apple UAE</option>
                              <option value="Samsung UAE" style={{ background: '#1c1d24' }}>Samsung UAE</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '11px', color: '#8b92a5' }}>قیمت به درهم (AED):</label>
                            <input 
                              type="number" 
                              required
                              min="0.1"
                              step="any"
                              value={addProductManualForm.priceAed}
                              onChange={(e) => setAddProductManualForm({...addProductManualForm, priceAed: e.target.value})}
                              placeholder="مثال: 3199"
                              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '11px', color: '#8b92a5' }}>وزن (کیلوگرم):</label>
                            <input 
                              type="number" 
                              required
                              min="0.01"
                              step="any"
                              value={addProductManualForm.weight}
                              onChange={(e) => setAddProductManualForm({...addProductManualForm, weight: e.target.value})}
                              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '11px', color: '#8b92a5' }}>لینک اصلی محصول:</label>
                          <input 
                            type="text" 
                            value={addProductManualForm.originalLink}
                            onChange={(e) => setAddProductManualForm({...addProductManualForm, originalLink: e.target.value})}
                            placeholder="مثال: https://www.amazon.ae/dp/..."
                            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '11px', color: '#8b92a5' }}>تصویر محصول:</label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleImageUploadLocal(e, 'add')}
                              style={{ display: 'none' }}
                              id="add-image-file-input"
                            />
                            <label 
                              htmlFor="add-image-file-input"
                              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '11px', cursor: 'pointer', textAlign: 'center', flex: 1 }}
                            >
                              📁 انتخاب فایل تصویر (آپلود دستی)
                            </label>
                            {addProductManualForm.image && (
                              <img src={addProductManualForm.image} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} />
                            )}
                          </div>
                          <input 
                            type="text" 
                            value={addProductManualForm.image}
                            onChange={(e) => setAddProductManualForm({...addProductManualForm, image: e.target.value})}
                            placeholder="یا آدرس اینترنتی تصویر را وارد کنید"
                            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', marginTop: '6px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '11px', color: '#8b92a5' }}>نمایش در دسته‌بندی‌های سایت:</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={addProductManualForm.gender === 'men'} 
                                onChange={(e) => setAddProductManualForm({...addProductManualForm, gender: e.target.checked ? 'men' : ''})} 
                              />
                              مردانه (Men)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={addProductManualForm.gender === 'women'} 
                                onChange={(e) => setAddProductManualForm({...addProductManualForm, gender: e.target.checked ? 'women' : ''})} 
                              />
                              زنانه (Women)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={addProductManualForm.gender === 'kids'} 
                                onChange={(e) => setAddProductManualForm({...addProductManualForm, gender: e.target.checked ? 'kids' : ''})} 
                              />
                              بچگانه (Kids)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={addProductManualForm.category === 'bags'} 
                                onChange={(e) => setAddProductManualForm({...addProductManualForm, category: e.target.checked ? 'bags' : ''})} 
                              />
                              کیف و اکسسوری
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={addProductManualForm.discountPercent > 0} 
                                onChange={(e) => setAddProductManualForm({...addProductManualForm, discountPercent: e.target.checked ? 20 : 0})} 
                              />
                              تخفیف خورده (Sale)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={addProductManualForm.isBestSeller === true} 
                                onChange={(e) => setAddProductManualForm({...addProductManualForm, isBestSeller: e.target.checked})} 
                              />
                              پرفروش‌ترین‌ها
                            </label>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => setIsAddProductManualOpen(false)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '11.5px' }}>انصراف</button>
                          <button type="submit" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, var(--admin-orange), #ff9d00)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '11.5px' }}>ثبت محصول</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <h1>{AdminIcons.chat(22)} مدیریت نظرات و دیدگاه‌های خریداران دبی خرید</h1>
                  <p className={styles.sectionDesc}>بررسی بازخوردهای ارسالی کاربران، تایید اصالت خرید و جلوگیری از هرزنامه‌ها</p>
                </div>

                <div className={styles.searchBarWrapper}>
                  <span>{AdminIcons.search(10)}</span>
                  <input 
                    type="text" 
                    placeholder="جستجو در نظرات، خریداران یا کالاها..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>نام کاربر</th>
                      <th>محصول درخواستی</th>
                      <th>امتیاز</th>
                      <th>متن دیدگاه خریدار</th>
                      <th>تاریخ ارسال</th>
                      <th>وضعیت اصالت</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.length === 0 ? (
                      <tr key="empty-reviews">
                        <td colSpan="7" style={{ textAlign: 'center', color: '#8b92a5', padding: '40px 0' }}>دیدگاهی ثبت نشده است.</td>
                      </tr>
                    ) : (
                      filteredReviews.map(rev => (
                        <tr key={rev.id}>
                          <td style={{ fontWeight: '750' }}>{rev.userName}</td>
                          <td>{rev.productName}</td>
                          <td style={{ color: '#ff9d00', letterSpacing: '1px', fontWeight: 'bold' }}>
                            {'★'.repeat(rev.rating)}
                            {'☆'.repeat(5 - rev.rating)}
                          </td>
                          <td style={{ maxWidth: '300px', whiteSpace: 'normal', lineHeight: '1.5' }}>
                            {rev.comment}
                          </td>
                          <td style={{ fontSize: '11px', color: '#8b92a5' }}>{fmtDate(rev.date)}</td>
                          <td>
                            <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {AdminIcons.check(10)} تایید شده
                            </span>
                          </td>
                          <td>
                            <button onClick={() => handleDeleteReview(rev.id)} className={styles.deleteActionBtn} style={{ width: 'auto', padding: '6px 14px' }}>
                              حذف نظر
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CUSTOMERS REDESIGN VIEW (100% High Parity Mockup) */}
          {activeTab === 'customers' && (() => {
            const filteredCusts = customers.filter(c => {
              const matchSearch = !customerSearchQuery || 
                c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                c.phone.includes(customerSearchQuery) ||
                c.email.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                c.city.includes(customerSearchQuery);
              
              const matchGroup = customerGroupFilter === 'همه' || c.group === customerGroupFilter;
              
              let matchStatus = true;
              if (customerStatusFilter !== 'همه') {
                if (customerStatusFilter === 'فعال') matchStatus = c.status === 'active';
                if (customerStatusFilter === 'VIP') matchStatus = c.status === 'vip';
                if (customerStatusFilter === 'غیرفعال') matchStatus = c.status === 'inactive';
              }

              const matchCity = customerCityFilter === 'همه' || c.city === customerCityFilter;

              return matchSearch && matchGroup && matchStatus && matchCity;
            });

            const selCust = customers.find(c => c.id === selectedCustomerId) || customers[0] || null;

            // Unique cities for select filter
            const uniqueCities = Array.from(new Set(customers.map(c => c.city)));

            // Inline states inside tab render for dynamic notes editor (referred to top-level state)

            const triggerEditNotes = (c) => {
              setTempNoteText(c.notes);
              setIsEditingNotes(true);
            };

            const triggerSaveNotes = (id) => {
              handleSaveNotes(id, tempNoteText);
              setIsEditingNotes(false);
            };

            // Calculate reactive KPI metrics
            const totalCount = 1240 + customers.length;
            const activeCount = 834 + customers.filter(c => c.status === 'active').length;
            const newCount = 59 + customers.filter(c => c.status === 'active' || c.status === 'vip').length;
            const vipCount = 34 + customers.filter(c => c.status === 'vip').length;
            const avgPurchase = 28450000;

            return (
              <div>
                {/* Header Title Row */}
                <div className={styles.pageTitleSection} style={{ marginBottom: '24px' }}>
                  <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#f87820', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.users(28)}</span>
                    <div>
                      <h1 style={{ fontSize: '22px', fontWeight: '750', color: '#fff', margin: 0 }}>مشتریان</h1>
                      <p style={{ fontSize: '11.5px', color: '#8b92a5', marginTop: '2px', margin: 0 }}>مدیریت و بررسی اطلاعات مشتریان</p>
                    </div>
                  </div>

                  <div className={styles.titleActionBtns} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        setNewCustomerForm({
                          name: '', phone: '', email: '', city: 'تهران', group: 'عادی', code: '', status: 'active', notes: '',
                          avgOrder: '4000000', lastOrder: '1403/03/20', firstOrder: '1403/01/10', maxOrder: '8000000'
                        });
                        setIsAddCustomerOpen(true);
                      }} 
                      className={styles.saveFormBtn}
                      style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', boxShadow: '0 4px 15px rgba(248, 120, 32, 0.4)', borderRadius: '10px', padding: '10px 18px', fontWeight: '700', fontSize: '13px' }}
                    >
                      + افزودن مشتری جدید
                    </button>
                    
                    <button type="button" className={styles.advFilterBtn} style={{ padding: '10px 15px' }}>
                      <span>{AdminIcons.sliders(12)}</span> فیلترها
                    </button>

                    <button type="button" className={styles.advFilterBtn} style={{ padding: '10px 15px' }}>
                      <span>{AdminIcons.download(12)}</span> خروجی اکسل
                    </button>
                  </div>
                </div>

                {/* 5 KPI metrics row */}
                <div className={styles.metricsGrid5}>
                  {/* Card 1: کل مشتریان */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>کل مشتریان</span>
                      <span className={styles.metricValue}>{totalCount.toLocaleString()}</span>
                      <span className={`${styles.metricSubText} ${styles.up}`}>+12.5% نسبت به ماه قبل</span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                      {AdminIcons.users(18)}
                    </div>
                  </div>

                  {/* Card 2: مشتریان فعال */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>مشتریان فعال</span>
                      <span className={styles.metricValue}>{activeCount.toLocaleString()}</span>
                      <span className={`${styles.metricSubText} ${styles.up}`}>+8.5% نسبت به ماه قبل</span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      {AdminIcons.user(18)}
                    </div>
                  </div>

                  {/* Card 3: مشتریان جدید (ماه) */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>مشتریان جدید (ماه)</span>
                      <span className={styles.metricValue}>{newCount.toLocaleString()}</span>
                      <span className={`${styles.metricSubText} ${styles.up}`}>+15.7% نسبت به ماه قبل</span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                      {AdminIcons.lock(18)}
                    </div>
                  </div>

                  {/* Card 4: مشتریان VIP */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>مشتریان VIP</span>
                      <span className={styles.metricValue}>{vipCount.toLocaleString()}</span>
                      <span className={`${styles.metricSubText} ${styles.up}`}>+4.6% نسبت به ماه قبل</span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      {AdminIcons.crown(18)}
                    </div>
                  </div>

                  {/* Card 5: میانگین خرید */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>میانگین خرید</span>
                      <span className={styles.metricValue}>{avgPurchase.toLocaleString()}</span>
                      <span style={{ fontSize: '10px', color: '#8b92a5', marginTop: '2px' }}>تومان</span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
                      {AdminIcons.card(18)}
                    </div>
                  </div>
                </div>

                {/* Filter Strip */}
                <div className={styles.filterStrip}>
                  <div className={styles.filterControlsLeft}>
                    {/* Live search input */}
                    <div className={styles.searchBarWrapper}>
                      <span className={styles.searchBarIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.search(13)}</span>
                      <input 
                        type="text" 
                        placeholder="جستجو در مشتریان..." 
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className={styles.searchBarInput} 
                      />
                    </div>

                    {/* Group Filter */}
                    <select 
                      value={customerGroupFilter} 
                      onChange={(e) => setCustomerGroupFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه گروه‌ها</option>
                      <option value="VIP">گروه VIP</option>
                      <option value="همکار">گروه همکار</option>
                      <option value="عادی">گروه عادی</option>
                    </select>

                    {/* Status Filter */}
                    <select 
                      value={customerStatusFilter} 
                      onChange={(e) => setCustomerStatusFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه وضعیت‌ها</option>
                      <option value="فعال">فعال</option>
                      <option value="VIP">VIP</option>
                      <option value="غیرفعال">غیرفعال</option>
                    </select>

                    {/* City Filter */}
                    <select 
                      value={customerCityFilter} 
                      onChange={(e) => setCustomerCityFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه شهرها</option>
                      {uniqueCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <button type="button" className={styles.advFilterBtn}>
                    <span>{AdminIcons.sliders(12)}</span> فیلتر پیشرفته
                  </button>
                </div>

                {/* Split workspace */}
                <div className={styles.customerSplitGrid}>
                  
                  {/* LEFT SPLIT COLUMN: Customers Listing Table */}
                  <div style={{ background: '#11131a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className={styles.adminTable}>
                        <thead>
                          <tr>
                            <th>مشتری</th>
                            <th>اطلاعات تماس</th>
                            <th>جمع خریدها</th>
                            <th>وضعیت</th>
                            <th>تاریخ ثبت</th>
                            <th>عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCusts.length === 0 ? (
                            <tr key="empty-customers">
                              <td colSpan="6" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>مشتری منطبق با فیلترهای جستجو یافت نشد.</td>
                            </tr>
                          ) : (
                            filteredCusts.map(cust => {
                              const isSelected = selCust && selCust.id === cust.id;
                              return (
                                <tr 
                                  key={cust.id} 
                                  onClick={() => {
                                    setSelectedCustomerId(cust.id);
                                    setIsEditingNotes(false);
                                  }}
                                  style={{ 
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? 'rgba(248, 120, 32, 0.05)' : 'transparent',
                                    borderLeft: isSelected ? '3px solid #f87820' : 'none'
                                  }}
                                >
                                  {/* Customer Name only cell */}
                                  <td>
                                    <span style={{ fontWeight: '800', color: '#fff', fontSize: '13px' }}>{cust.name}</span>
                                  </td>

                                  {/* Contact info cell */}
                                  <td style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui', fontSize: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                      <span>{cust.phone}</span>
                                      <span style={{ color: '#8b92a5', fontSize: '10.5px', marginTop: '2px' }}>{cust.email}</span>
                                    </div>
                                  </td>

                                  {/* Total Purchases cell */}
                                  <td style={{ fontFamily: 'var(--font-vazirmatn), system-ui', fontWeight: '850', color: '#fff' }}>
                                    {cust.totalToman.toLocaleString('fa-IR')} تومان
                                  </td>

                                  {/* Status Badge cell */}
                                  <td>
                                    {cust.status === 'active' && <span className={styles.badgeActive}>فعال</span>}
                                    {cust.status === 'vip' && <span className={styles.badgeVip}>VIP</span>}
                                    {cust.status === 'inactive' && <span className={styles.badgeInactive}>غیرفعال</span>}
                                  </td>

                                  {/* Reg Date cell */}
                                  <td style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui', fontSize: '12.5px' }}>{cust.dateReg}</td>

                                  {/* Action Dots cell */}
                                  <td onClick={(e) => e.stopPropagation()}>
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                      <button 
                                        onClick={() => {
                                          setSelectedCustomerId(cust.id);
                                          setEditCustomerForm({
                                            id: cust.id,
                                            name: cust.name,
                                            phone: cust.phone,
                                            email: cust.email,
                                            city: cust.city,
                                            group: cust.group,
                                            status: cust.status,
                                            notes: cust.notes,
                                            avgOrder: cust.performance.avgOrder,
                                            maxOrder: cust.performance.maxOrder
                                          });
                                          setIsEditCustomerOpen(true);
                                        }}
                                        style={{ background: 'none', border: 'none', color: '#8b92a5', cursor: 'pointer', fontSize: '16px', padding: '6px', display: 'inline-flex', alignItems: 'center' }}
                                        title="ویرایش سریع"
                                      >
                                        {AdminIcons.edit(13)}
                                      </button>

                                      <button 
                                        onClick={() => handleDeleteCustomer(cust.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '6px', marginRight: '6px' }}
                                        title="حذف"
                                      >
                                        {AdminIcons.trash(13)}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Farsi high-fidelity Pagination controls */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Left: English Page selection numbers */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&lt;</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#f87820', color: '#fff', borderColor: '#f87820' }}>1</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>2</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>3</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>4</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>5</button>
                        <span style={{ color: '#8b92a5', padding: '4px 4px' }}>...</span>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>42</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&gt;</button>
                      </div>

                      {/* Right: Results Count */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11.5px', color: '#8b92a5' }}>
                          نمایش ۱ تا {filteredCusts.length} از {totalCount} نتیجه
                        </span>
                        <select className={styles.filterSelect} style={{ padding: '4px 8px', minWidth: '55px', height: '28px', fontSize: '11px' }}>
                          <option value="8">8</option>
                          <option value="20">20</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SPLIT COLUMN: Sticky Details Panel (جزئیات مشتری) */}
                  <div>
                    {selCust ? (
                      <div className={styles.stickyDetailsPanel}>
                        
                        {/* Avatar and name header */}
                        <div className={styles.detailsHeader}>
                          <img src={selCust.avatar} alt={selCust.name} className={styles.largeAvatar} />
                          <h2 className={styles.detailsName}>{selCust.name}</h2>
                          
                          <div style={{ marginTop: '4px' }}>
                            {selCust.status === 'active' && <span className={styles.badgeActive}>فعال</span>}
                            {selCust.status === 'vip' && <span className={styles.badgeVip}>VIP</span>}
                            {selCust.status === 'inactive' && <span className={styles.badgeInactive}>غیرفعال</span>}
                          </div>
                        </div>

                        {/* Circular Action Links */}
                        <div className={styles.quickActionsRow}>
                          {/* Trash button */}
                          <div className={styles.actionButtonWrapper}>
                            <button 
                              onClick={() => handleDeleteCustomer(selCust.id)} 
                              className={`${styles.actionCircleBtn} ${styles.delete}`}
                              title="حذف اطلاعات مشتری"
                            >
                              {AdminIcons.trash(13)}
                            </button>
                            <span className={styles.actionLabel}>حذف</span>
                          </div>

                          {/* Edit button */}
                          <div className={styles.actionButtonWrapper}>
                            <button 
                              onClick={() => {
                                setEditCustomerForm({
                                  id: selCust.id,
                                  name: selCust.name,
                                  phone: selCust.phone,
                                  email: selCust.email,
                                  city: selCust.city,
                                  group: selCust.group,
                                  status: selCust.status,
                                  notes: selCust.notes,
                                  avgOrder: selCust.performance.avgOrder,
                                  maxOrder: selCust.performance.maxOrder
                                });
                                setIsEditCustomerOpen(true);
                              }} 
                              className={styles.actionCircleBtn}
                              title="ویرایش مشخصات"
                            >
                              {AdminIcons.edit(14)}
                            </button>
                            <span className={styles.actionLabel}>ویرایش</span>
                          </div>

                          {/* Email button */}
                          <div className={styles.actionButtonWrapper}>
                            <a 
                              href={`mailto:${selCust.email}`}
                              className={styles.actionCircleBtn}
                              title="ارسال ایمیل"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {AdminIcons.mail(14)}
                            </a>
                            <span className={styles.actionLabel}>ایمیل</span>
                          </div>

                          {/* SMS button */}
                          <div className={styles.actionButtonWrapper}>
                            <button 
                              onClick={() => alert(`ارسال پیامک ترویجی به شماره ${selCust.phone} با موفقیت در صف ارسال قرار گرفت.`)} 
                              className={styles.actionCircleBtn}
                              title="ارسال پیامک"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {AdminIcons.chat(14)}
                            </button>
                            <span className={styles.actionLabel}>پیامک</span>
                          </div>

                          {/* Call button */}
                          <div className={styles.actionButtonWrapper}>
                            <a 
                              href={`tel:${selCust.phone}`} 
                              className={styles.actionCircleBtn}
                              title="تماس تلفنی"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {AdminIcons.phone(14)}
                            </a>
                            <span className={styles.actionLabel}>تماس</span>
                          </div>
                        </div>

                        {/* Interactive Sub-Tabs */}
                        <div className={styles.detailsTabContainer}>
                          <button 
                            onClick={() => setCustomerDetailsTab('general')}
                            className={`${styles.detailsTabBtn} ${customerDetailsTab === 'general' ? styles.detailsTabBtnActive : ''}`}
                          >
                            اطلاعات کلی
                          </button>
                          <button 
                            onClick={() => setCustomerDetailsTab('payments')}
                            className={`${styles.detailsTabBtn} ${customerDetailsTab === 'payments' ? styles.detailsTabBtnActive : ''}`}
                          >
                            تاریخچه پرداخت
                          </button>
                          <button 
                            onClick={() => setCustomerDetailsTab('history')}
                            className={`${styles.detailsTabBtn} ${customerDetailsTab === 'history' ? styles.detailsTabBtnActive : ''}`}
                          >
                            تاریخچه
                          </button>
                          <button 
                            onClick={() => setCustomerDetailsTab('notes')}
                            className={`${styles.detailsTabBtn} ${customerDetailsTab === 'notes' ? styles.detailsTabBtnActive : ''}`}
                          >
                            یادداشت‌ها
                          </button>
                        </div>

                        {/* Tab Content rendering */}
                        <div style={{ minHeight: '120px' }}>
                          {customerDetailsTab === 'general' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div className={styles.profileDetailField}>
                                <span className={styles.fieldLabel}>شماره موبایل</span>
                                <span className={styles.fieldValue} style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui' }}>{selCust.phone}</span>
                              </div>
                              <div className={styles.profileDetailField}>
                                <span className={styles.fieldLabel}>ایمیل</span>
                                <span className={styles.fieldValue} style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui' }}>{selCust.email}</span>
                              </div>
                              <div className={styles.profileDetailField}>
                                <span className={styles.fieldLabel}>شهر محل سکونت</span>
                                <span className={styles.fieldValue}>{selCust.city}</span>
                              </div>
                              <div className={styles.profileDetailField}>
                                <span className={styles.fieldLabel}>تاریخ ثبت نام</span>
                                <span className={styles.fieldValue} style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui' }}>{selCust.dateReg}</span>
                              </div>
                              <div className={styles.profileDetailField}>
                                <span className={styles.fieldLabel}>گروه مشتری</span>
                                <span className={styles.fieldValue}>
                                  <span className={styles.badgeVip} style={{ fontSize: '10px', padding: '2px 8px' }}>{selCust.group}</span>
                                </span>
                              </div>
                              <div className={styles.profileDetailField}>
                                <span className={styles.fieldLabel}>کد مشتری</span>
                                <span className={styles.fieldValue} style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui' }}>{selCust.id}</span>
                              </div>
                              <div className={styles.profileDetailField}>
                                <span className={styles.fieldLabel}>تعداد سفارشات</span>
                                <span className={styles.fieldValue}>{selCust.orderCount} سفارش</span>
                              </div>
                              <div className={styles.profileDetailField}>
                                <span className={styles.fieldLabel}>جمع کل خریدها</span>
                                <span className={styles.fieldValue}>{selCust.totalToman.toLocaleString()} تومان</span>
                              </div>
                            </div>
                          )}

                          {customerDetailsTab === 'payments' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8b92a5' }}>
                                  <span>تراکنش درگاه شتاب</span>
                                  <span>1403/03/20</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fff', fontWeight: 'bold', marginTop: '4px' }}>
                                  <span>شناسه: TXN-4198</span>
                                  <span style={{ color: '#10b981' }}>{Math.floor(selCust.totalToman / 2).toLocaleString()} تومان</span>
                                </div>
                              </div>
                              <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8b92a5' }}>
                                  <span>کارت به کارت شتاب</span>
                                  <span>1403/02/15</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fff', fontWeight: 'bold', marginTop: '4px' }}>
                                  <span>تایید بانک ملت</span>
                                  <span style={{ color: '#10b981' }}>{Math.floor(selCust.totalToman / 4).toLocaleString()} تومان</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {customerDetailsTab === 'history' && (
                            <div style={{ fontSize: '11.5px', color: '#c4c8d4', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '8px', borderRight: '2px solid rgba(255,255,255,0.06)' }}>
                              <div>
                                <span style={{ color: '#f87820', fontWeight: 'bold' }}>• 1403/03/20</span>
                                <p style={{ margin: '2px 0 0 0', color: '#8b92a5' }}>ثبت سفارش جدید لپ‌تاپ استوک Apple</p>
                              </div>
                              <div>
                                <span style={{ color: '#f87820', fontWeight: 'bold' }}>• 1403/02/10</span>
                                <p style={{ margin: '2px 0 0 0', color: '#8b92a5' }}>تغییر گروه کاربری به دسته VIP ممتاز</p>
                              </div>
                              <div>
                                <span style={{ color: '#f87820', fontWeight: 'bold' }}>• {selCust.dateReg}</span>
                                <p style={{ margin: '2px 0 0 0', color: '#8b92a5' }}>ثبت‌نام اولیه در وب‌سایت دبی خرید</p>
                              </div>
                            </div>
                          )}

                          {customerDetailsTab === 'notes' && (
                            <div style={{ fontSize: '11.5px', color: '#c4c8d4', lineHeight: '1.6' }}>
                              <p style={{ margin: 0 }}>مجموعه یادداشت‌های ثبت‌شده برای پشتیبانی و تعامل با مشتری:</p>
                              <div style={{ padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', marginTop: '8px' }}>
                                {selCust.notes}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Note editing widget */}
                        <div className={styles.notesWidget}>
                          <div className={styles.notesWidgetHeader}>
                            <span className={styles.notesWidgetTitle}>{AdminIcons.edit(13)} یادداشت ادمین</span>
                            
                            {!isEditingNotes ? (
                              <button 
                                onClick={() => triggerEditNotes(selCust)}
                                className={styles.notesEditBtn}
                              >
                                {AdminIcons.edit(12)} ویرایش
                              </button>
                            ) : (
                              <button 
                                onClick={() => triggerSaveNotes(selCust.id)}
                                className={styles.notesEditBtn}
                                style={{ color: '#10b981', fontWeight: 'bold' }}
                              >
                                {AdminIcons.check(12)} ذخیره
                              </button>
                            )}
                          </div>

                          {!isEditingNotes ? (
                            <div 
                              onClick={() => triggerEditNotes(selCust)}
                              className={styles.notesContentBlock}
                              style={{ cursor: 'pointer' }}
                            >
                              {selCust.notes || 'بدون یادداشت (جهت درج یادداشت کلیک کنید)'}
                            </div>
                          ) : (
                            <textarea 
                              value={tempNoteText} 
                              onChange={(e) => setTempNoteText(e.target.value)} 
                              onBlur={() => triggerSaveNotes(selCust.id)}
                              className={styles.notesTextarea}
                              autoFocus
                            />
                          )}
                        </div>

                        {/* Performance Grid section */}
                        <div className={styles.performanceSummary}>
                          <h3 className={styles.performanceTitle}>{AdminIcons.chart(16)} خلاصه عملکرد مشتری</h3>
                          
                          <div className={styles.performanceGrid}>
                            {/* Average Order */}
                            <div className={styles.perfItem}>
                              <span className={styles.perfLabel}>میانگین هر سفارش</span>
                              <span className={styles.perfValue}>{selCust.performance.avgOrder.toLocaleString()} تومان</span>
                            </div>

                            {/* Last Order */}
                            <div className={styles.perfItem}>
                              <span className={styles.perfLabel}>آخرین سفارش</span>
                              <span className={styles.perfValue}>{selCust.performance.lastOrder}</span>
                            </div>

                            {/* First Order */}
                            <div className={styles.perfItem}>
                              <span className={styles.perfLabel}>اولین سفارش</span>
                              <span className={styles.perfValue}>{selCust.performance.firstOrder}</span>
                            </div>

                            {/* Max Purchase */}
                            <div className={styles.perfItem}>
                              <span className={styles.perfLabel}>بیشترین خرید</span>
                              <span className={styles.perfValue}>{selCust.performance.maxOrder.toLocaleString()} تومان</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', background: '#11131a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#8b92a5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{AdminIcons.users(32)}</span>
                        <p style={{ color: '#8b92a5', fontSize: '12px', marginTop: '10px' }}>جهت مشاهده جزئیات کامل، روی ردیف یکی از مشتریان کلیک کنید.</p>
                      </div>
                    )}
                  </div>

                </div>

                {/* MODAL: Add New Customer */}
                {isAddCustomerOpen && (
                  <div className={styles.modalOverlay} onClick={() => setIsAddCustomerOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.modalHeader}>
                        <h3>{AdminIcons.plus(16)} افزودن مشخصات مشتری جدید</h3>
                        <button className={styles.modalCloseBtn} onClick={() => setIsAddCustomerOpen(false)}>×</button>
                      </div>
                      
                      <form onSubmit={handleAddCustomerSubmit}>
                        <div className={styles.modalBody}>
                          
                          <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                            <label>نام و نام خانوادگی مشتری:</label>
                            <input 
                              type="text" 
                              required 
                              value={newCustomerForm.name} 
                              onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="مثال: علی محمدی..." 
                              className={styles.inputField} 
                            />
                          </div>

                          <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                            <div className={styles.formGroup}>
                              <label>شماره تماس همراه:</label>
                              <input 
                                type="text" 
                                required 
                                value={newCustomerForm.phone} 
                                onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="مثال: 09123456789..." 
                                className={styles.inputField} 
                              />
                            </div>

                            <div className={styles.formGroup}>
                              <label>آدرس ایمیل:</label>
                              <input 
                                type="email" 
                                value={newCustomerForm.email} 
                                onChange={(e) => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="ali.mohammadi@gmail.com..." 
                                className={styles.inputField} 
                              />
                            </div>
                          </div>

                          <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                            <div className={styles.formGroup}>
                              <label>شهر محل سکونت:</label>
                              <input 
                                type="text" 
                                required
                                value={newCustomerForm.city} 
                                onChange={(e) => setNewCustomerForm(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="مثال: تهران، مشهد..." 
                                className={styles.inputField} 
                              />
                            </div>

                            <div className={styles.formGroup}>
                              <label>گروه مشتری:</label>
                              <select 
                                value={newCustomerForm.group} 
                                onChange={(e) => setNewCustomerForm(prev => ({ ...prev, group: e.target.value }))}
                                className={styles.inputField}
                              >
                                <option value="عادی">عادی</option>
                                <option value="VIP">VIP ممتاز</option>
                                <option value="همکار">همکار صنف</option>
                              </select>
                            </div>
                          </div>

                          <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                            <div className={styles.formGroup}>
                              <label>وضعیت حساب:</label>
                              <select 
                                value={newCustomerForm.status} 
                                onChange={(e) => setNewCustomerForm(prev => ({ ...prev, status: e.target.value }))}
                                className={styles.inputField}
                              >
                                <option value="active">فعال</option>
                                <option value="vip">VIP ممتاز</option>
                                <option value="inactive">غیرفعال</option>
                              </select>
                            </div>

                            <div className={styles.formGroup}>
                              <label>میانگین ارزش سفارش:</label>
                              <input 
                                type="number" 
                                value={newCustomerForm.avgOrder} 
                                onChange={(e) => setNewCustomerForm(prev => ({ ...prev, avgOrder: e.target.value }))}
                                placeholder="مثال: 4000000..." 
                                className={styles.inputField} 
                              />
                            </div>
                          </div>

                          <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                            <label>بیشترین خرید مشتری (تومان):</label>
                            <input 
                              type="number" 
                              value={newCustomerForm.maxOrder} 
                              onChange={(e) => setNewCustomerForm(prev => ({ ...prev, maxOrder: e.target.value }))}
                              placeholder="مثال: 8000000..." 
                              className={styles.inputField} 
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label>یادداشت‌های اختصاصی ادمین:</label>
                            <textarea 
                              value={newCustomerForm.notes} 
                              onChange={(e) => setNewCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="توضیحات و رفتار خرید مشتری را اینجا یادداشت کنید..." 
                              className={styles.notesTextarea}
                            />
                          </div>

                        </div>

                        <div className={styles.modalFooter}>
                          <button type="button" className={styles.advFilterBtn} onClick={() => setIsAddCustomerOpen(false)}>انصراف</button>
                          <button 
                            type="submit" 
                            className={styles.saveFormBtn}
                            style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 'bold' }}
                          >
                            ثبت مشتری جدید
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL: Edit Existing Customer */}
                {isEditCustomerOpen && (
                  <div className={styles.modalOverlay} onClick={() => setIsEditCustomerOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.modalHeader}>
                        <h3>{AdminIcons.edit(16)} ویرایش اطلاعات مشتری</h3>
                        <button className={styles.modalCloseBtn} onClick={() => setIsEditCustomerOpen(false)}>×</button>
                      </div>
                      
                      <form onSubmit={handleEditCustomerSubmit}>
                        <div className={styles.modalBody}>
                          
                          <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                            <label>نام و نام خانوادگی مشتری:</label>
                            <input 
                              type="text" 
                              required 
                              value={editCustomerForm.name} 
                              onChange={(e) => setEditCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                              className={styles.inputField} 
                            />
                          </div>

                          <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                            <div className={styles.formGroup}>
                              <label>شماره تماس همراه:</label>
                              <input 
                                type="text" 
                                required 
                                value={editCustomerForm.phone} 
                                onChange={(e) => setEditCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                                className={styles.inputField} 
                              />
                            </div>

                            <div className={styles.formGroup}>
                              <label>آدرس ایمیل:</label>
                              <input 
                                type="email" 
                                value={editCustomerForm.email} 
                                onChange={(e) => setEditCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                                className={styles.inputField} 
                              />
                            </div>
                          </div>

                          <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                            <div className={styles.formGroup}>
                              <label>شهر محل سکونت:</label>
                              <input 
                                type="text" 
                                required
                                value={editCustomerForm.city} 
                                onChange={(e) => setEditCustomerForm(prev => ({ ...prev, city: e.target.value }))}
                                className={styles.inputField} 
                              />
                            </div>

                            <div className={styles.formGroup}>
                              <label>گروه مشتری:</label>
                              <select 
                                value={editCustomerForm.group} 
                                onChange={(e) => setEditCustomerForm(prev => ({ ...prev, group: e.target.value }))}
                                className={styles.inputField}
                              >
                                <option value="عادی">عادی</option>
                                <option value="VIP">VIP ممتاز</option>
                                <option value="همکار">همکار صنف</option>
                              </select>
                            </div>
                          </div>

                          <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                            <div className={styles.formGroup}>
                              <label>وضعیت حساب:</label>
                              <select 
                                value={editCustomerForm.status} 
                                onChange={(e) => setEditCustomerForm(prev => ({ ...prev, status: e.target.value }))}
                                className={styles.inputField}
                              >
                                <option value="active">فعال</option>
                                <option value="vip">VIP ممتاز</option>
                                <option value="inactive">غیرفعال</option>
                              </select>
                            </div>

                            <div className={styles.formGroup}>
                              <label>میانگین ارزش سفارش:</label>
                              <input 
                                type="number" 
                                value={editCustomerForm.avgOrder} 
                                onChange={(e) => setEditCustomerForm(prev => ({ ...prev, avgOrder: e.target.value }))}
                                className={styles.inputField} 
                              />
                            </div>
                          </div>

                          <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                            <label>بیشترین خرید مشتری (تومان):</label>
                            <input 
                              type="number" 
                              value={editCustomerForm.maxOrder} 
                              onChange={(e) => setEditCustomerForm(prev => ({ ...prev, maxOrder: e.target.value }))}
                              className={styles.inputField} 
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label>یادداشت‌های اختصاصی ادمین:</label>
                            <textarea 
                              value={editCustomerForm.notes} 
                              onChange={(e) => setEditCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
                              className={styles.notesTextarea}
                            />
                          </div>

                        </div>

                        <div className={styles.modalFooter}>
                          <button type="button" className={styles.advFilterBtn} onClick={() => setIsEditCustomerOpen(false)}>انصراف</button>
                          <button 
                            type="submit" 
                            className={styles.saveFormBtn}
                            style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 'bold' }}
                          >
                            ذخیره تغییرات
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* TAB: SHIPMENTS REDESIGN VIEW (100% High Parity Mockup) */}
          {activeTab === 'shipments' && (() => {
            const filteredShips = shipments.filter(s => {
              const matchSearch = !shipmentSearchQuery || 
                s.id.toLowerCase().includes(shipmentSearchQuery.toLowerCase()) ||
                s.recipient.toLowerCase().includes(shipmentSearchQuery.toLowerCase());
              
              const matchStatus = shipmentStatusFilter === 'همه' || s.status === shipmentStatusFilter;
              const matchMethod = shipmentMethodFilter === 'همه' || s.method === shipmentMethodFilter;
              const matchRecipient = shipmentRecipientFilter === 'همه' || s.recipient === shipmentRecipientFilter;

              return matchSearch && matchStatus && matchMethod && matchRecipient;
            });

            // Unique recipients for select filter
            const uniqueRecipients = Array.from(new Set(shipments.map(s => s.recipient)));

            // Calculate dynamic KPI metrics with mockup base offsets
            const totalCount = 1238 + shipments.length;
            const transitCount = 26 + shipments.filter(s => s.status === 'transit').length;
            const customsCount = 12 + shipments.filter(s => s.status === 'customs').length;
            const iranCount = 18 + shipments.filter(s => s.status === 'iran').length;
            const deliveredCount = 1152 + shipments.filter(s => s.status === 'delivered').length;

            return (
              <div>
                {/* Header Title Row */}
                <div className={styles.pageTitleSection} style={{ marginBottom: '24px' }}>
                  <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#f87820', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.truck(28)}</span>
                    <div>
                      <h1 style={{ fontSize: '22px', fontWeight: '750', color: '#fff', margin: 0 }}>ارسال ها</h1>
                      <p style={{ fontSize: '11.5px', color: '#8b92a5', marginTop: '2px', margin: 0 }}>مدیریت و پیگیری تمام ارسالی های کالا</p>
                    </div>
                  </div>

                  <div className={styles.titleActionBtns} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        setNewShipmentForm({
                          recipient: 'علی محمدی', method: 'هوایی', status: 'transit', dateShipped: '1403/03/20', dateUpdated: '1403/03/20'
                        });
                        setIsAddShipmentOpen(true);
                      }} 
                      className={styles.saveFormBtn}
                      style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', boxShadow: '0 4px 15px rgba(248, 120, 32, 0.4)', borderRadius: '10px', padding: '10px 18px', fontWeight: '700', fontSize: '13px' }}
                    >
                      + ثبت ارسال جدید
                    </button>
                    
                    <button type="button" className={styles.advFilterBtn} style={{ padding: '10px 15px' }}>
                      <span>{AdminIcons.sliders(12)}</span> فیلترها
                    </button>

                    <button type="button" className={styles.advFilterBtn} style={{ padding: '10px 15px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>{AdminIcons.chart(12)}</span> گزارش ارسال ها
                    </button>
                  </div>
                </div>

                {/* 5 KPI metrics row */}
                <div className={styles.metricsGrid5}>
                  {/* Card 1: کل ارسال‌ها */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>کل ارسال ها</span>
                      <span className={styles.metricValue}>{totalCount.toLocaleString()}</span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>در این ماه</span>
                      <span className={`${styles.metricSubText} ${styles.up}`} style={{ color: '#3b82f6', marginTop: '2px' }}>+18.6% نسبت به قبل</span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                      {AdminIcons.chart(18)}
                    </div>
                  </div>

                  {/* Card 2: در حال ارسال */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>در حال ارسال</span>
                      <span className={styles.metricValue}>{transitCount}</span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>سفارش</span>
                      <span className={`${styles.metricSubText} ${styles.up}`} style={{ marginTop: '2px' }}>+12.5% نسبت به قبل</span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      {AdminIcons.truck(18)}
                    </div>
                  </div>

                  {/* Card 3: رسیده به گمرک */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>رسیده به گمرک</span>
                      <span className={styles.metricValue}>{customsCount}</span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>سفارش</span>
                      <span className={styles.metricSubText} style={{ color: '#f59e0b', marginTop: '2px' }}>+8.2% نسبت به قبل</span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      {AdminIcons.settings(18)}
                    </div>
                  </div>

                  {/* Card 4: در ایران */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>در ایران</span>
                      <span className={styles.metricValue}>{iranCount}</span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>سفارش</span>
                      <span className={styles.metricSubText} style={{ color: '#a855f7', marginTop: '2px' }}>+5.1% نسبت به قبل</span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                      {AdminIcons.bag(18)}
                    </div>
                  </div>

                  {/* Card 5: تحویل شده */}
                  <div className={styles.metricCard}>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>تحویل شده</span>
                      <span className={styles.metricValue}>{deliveredCount.toLocaleString()}</span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '2px' }}>سفارش</span>
                      <span className={`${styles.metricSubText} ${styles.up}`} style={{ marginTop: '2px' }}>+20.4% نسبت به قبل</span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      {AdminIcons.check(18)}
                    </div>
                  </div>
                </div>

                {/* Filter Strip */}
                <div className={styles.filterStrip}>
                  <div className={styles.filterControlsLeft}>
                    {/* Search bar input */}
                    <div className={styles.searchBarWrapper}>
                      <span className={styles.searchBarIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.search(13)}</span>
                      <input 
                        type="text" 
                        placeholder="جستجو کنید..." 
                        value={shipmentSearchQuery}
                        onChange={(e) => setShipmentSearchQuery(e.target.value)}
                        className={styles.searchBarInput} 
                      />
                    </div>

                    {/* Status Filter */}
                    <select 
                      value={shipmentStatusFilter} 
                      onChange={(e) => setShipmentStatusFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه وضعیت‌ها</option>
                      <option value="transit">در حال ارسال</option>
                      <option value="customs">رسیده به گمرک</option>
                      <option value="iran">در ایران</option>
                      <option value="delivered">تحویل شده</option>
                      <option value="problem">مشکل در ارسال</option>
                    </select>

                    {/* Method Filter */}
                    <select 
                      value={shipmentMethodFilter} 
                      onChange={(e) => setShipmentMethodFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه روش‌ها</option>
                      <option value="هوایی">هوایی</option>
                      <option value="زمینی">زمینی</option>
                    </select>

                    {/* Recipient Filter */}
                    <select 
                      value={shipmentRecipientFilter} 
                      onChange={(e) => setShipmentRecipientFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه گیرنده‌ها</option>
                      {uniqueRecipients.map(rec => (
                        <option key={rec} value={rec}>{rec}</option>
                      ))}
                    </select>

                    {/* Date picker mock range */}
                    <div className={styles.advFilterBtn} style={{ cursor: 'default', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>{AdminIcons.calendar(12)}</span> 1403/03/01 - 1403/03/20
                    </div>
                  </div>

                  <button type="button" className={styles.advFilterBtn}>
                    <span>{AdminIcons.sliders(12)}</span> فیلتر پیشرفته
                  </button>
                </div>

                {/* Split Workspace */}
                <div className={styles.customerSplitGrid}>
                  
                  {/* LEFT SPLIT COLUMN: Main Shipments Table */}
                  <div style={{ background: '#11131a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className={styles.adminTable}>
                        <thead>
                          <tr>
                            <th>شماره ارسال</th>
                            <th>گیرنده</th>
                            <th>روش ارسال</th>
                            <th>وضعیت</th>
                            <th>تاریخ ارسال</th>
                            <th>تاریخ به‌روزرسانی</th>
                            <th>عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredShips.length === 0 ? (
                            <tr key="empty-shipments">
                              <td colSpan="7" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>مرسوله‌ای یافت نشد.</td>
                            </tr>
                          ) : (
                            filteredShips.map(ship => {
                              const isSelected = selectedShipmentId === ship.id;
                              return (
                                <tr 
                                  key={ship.id}
                                  onClick={() => setSelectedShipmentId(ship.id)}
                                  className={isSelected ? styles.activeRowHighlight : ''}
                                  style={{ 
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s', 
                                    backgroundColor: isSelected ? 'rgba(248, 120, 32, 0.08)' : 'transparent',
                                    borderRight: isSelected ? '4px solid #f87820' : 'none'
                                  }}
                                >
                                  {/* Shipment Code */}
                                  <td style={{ fontWeight: '850', color: '#ff9d00', fontFamily: 'monospace', fontSize: '12px' }}>
                                    {ship.id}
                                  </td>

                                  {/* Recipient Name */}
                                  <td style={{ fontWeight: 'bold', color: '#fff' }}>{ship.recipient}</td>

                                  {/* Shipping Method airplane/truck icons */}
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {ship.method === 'هوایی' ? (
                                        <>
                                          <span style={{ color: '#3b82f6', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.plane(14)}</span>
                                          <span>هوایی</span>
                                        </>
                                      ) : (
                                        <>
                                          <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.truck(14)}</span>
                                          <span>زمینی</span>
                                        </>
                                      )}
                                    </div>
                                  </td>

                                  {/* Status Badges */}
                                  <td>
                                    {ship.status === 'transit' && <span className={styles.badgeActive} style={{ fontSize: '10px' }}>در حال ارسال</span>}
                                    {ship.status === 'customs' && <span className={styles.badgeCustoms}>رسیده به گمرک</span>}
                                    {ship.status === 'iran' && <span className={styles.badgeIran}>در ایران</span>}
                                    {ship.status === 'delivered' && <span className={styles.badgeActive} style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px' }}>تحویل شده</span>}
                                    {ship.status === 'problem' && <span className={styles.badgeProblem}>مشکل در ارسال</span>}
                                  </td>

                                  {/* Dates */}
                                  <td style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui', fontSize: '12px' }}>{ship.dateShipped}</td>
                                  <td style={{ fontFamily: 'var(--font-vazirmatn), Inter, system-ui', fontSize: '12px' }}>{ship.dateUpdated}</td>

                                  {/* Live Status Select & Delete operations cell */}
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                      {/* Update Status Inline Select */}
                                      <select 
                                        value={ship.status} 
                                        onChange={(e) => handleUpdateShipmentStatus(ship.id, e.target.value)}
                                        className={styles.filterSelect}
                                        style={{ padding: '2px 8px', fontSize: '10.5px', minWidth: '95px', height: '24px' }}
                                      >
                                        <option value="transit">در حال ارسال</option>
                                        <option value="customs">به گمرک</option>
                                        <option value="iran">به انبار ایران</option>
                                        <option value="delivered">تحویل شده</option>
                                        <option value="problem">دارای مشکل</option>
                                      </select>

                                      {/* Trash Button */}
                                      <button 
                                        onClick={() => handleDeleteShipment(ship.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
                                        title="حذف مرسوله"
                                      >
                                        {AdminIcons.trash(13)}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Farsi Pagination Controls */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Left Page selection numbers in English */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&lt;</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#f87820', color: '#fff', borderColor: '#f87820' }}>1</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>2</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>3</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>4</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>5</button>
                        <span style={{ color: '#8b92a5', padding: '4px 4px' }}>...</span>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>125</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&gt;</button>
                      </div>

                      {/* Right Results Count */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11.5px', color: '#8b92a5' }}>
                          نمایش ۱ تا {filteredShips.length} از {totalCount} نتیجه
                        </span>
                        <select className={styles.filterSelect} style={{ padding: '4px 8px', minWidth: '55px', height: '28px', fontSize: '11px' }}>
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SPLIT COLUMN: Sticky Sidebar Widgets Panel */}
                  <div className={styles.shipmentsRightWidgetsContainer}>
                    {selectedShipmentId === '' ? (
                      <>
                        {/* Widget 1: Doughnut Chart SVG representation */}
                        <div className={styles.shipmentsDoughnutCard}>
                          <h3 className={styles.shipmentsCardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{AdminIcons.chart(14)} وضعیت ارسال‌ها</h3>
                          
                          <div className={styles.doughnutWrapper}>
                            {/* Circular doughnut SVG graphics */}
                            <div className={styles.doughnutSvgContainer}>
                              <svg width="120" height="120" viewBox="0 0 120 120">
                                {/* Background Track Circle */}
                                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                                
                                {/* Segment 1: Delivered (green circle, ~93.3% = 293 stroke) */}
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#10b981" strokeWidth="12" 
                                        strokeDasharray="314" strokeDashoffset="21" transform="rotate(-90 60 60)" />

                                {/* Segment 2: In transit (blue segment, ~2.9% = 9 stroke) */}
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#3b82f6" strokeWidth="12" 
                                        strokeDasharray="314" strokeDashoffset="305" transform="rotate(245 60 60)" />

                                {/* Segment 3: In Iran (purple segment, ~2.2% = 7 stroke) */}
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#a855f7" strokeWidth="12" 
                                        strokeDasharray="314" strokeDashoffset="307" transform="rotate(255 60 60)" />

                                {/* Segment 4: Customs (orange segment, ~1.8% = 5 stroke) */}
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#f59e0b" strokeWidth="12" 
                                        strokeDasharray="314" strokeDashoffset="309" transform="rotate(263 60 60)" />

                                {/* Segment 5: Problem (red segment, ~0.6% = 2 stroke) */}
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#ef4444" strokeWidth="12" 
                                        strokeDasharray="314" strokeDashoffset="312" transform="rotate(269 60 60)" />
                              </svg>
                              
                              <div className={styles.doughnutCenterText}>
                                <span className={styles.doughnutCenterNum}>{totalCount}</span>
                                <span className={styles.doughnutCenterLabel}>کل ارسال‌ها</span>
                              </div>
                            </div>

                            {/* Chart Legend listing matching mockup percentages */}
                            <div className={styles.doughnutLegendList}>
                              <div className={styles.doughnutLegendItem}>
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#3b82f6' }} />
                                  <span className={styles.legendText}>در حال ارسال</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{transitCount}</span>
                                  <span className={styles.legendPct}>(2.9%)</span>
                                </div>
                              </div>

                              <div className={styles.doughnutLegendItem}>
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }} />
                                  <span className={styles.legendText}>رسیده به گمرک</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{customsCount}</span>
                                  <span className={styles.legendPct}>(1.8%)</span>
                                </div>
                              </div>

                              <div className={styles.doughnutLegendItem}>
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#a855f7' }} />
                                  <span className={styles.legendText}>در ایران</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{iranCount}</span>
                                  <span className={styles.legendPct}>(2.2%)</span>
                                </div>
                              </div>

                              <div className={styles.doughnutLegendItem}>
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#10b981' }} />
                                  <span className={styles.legendText}>تحویل شده</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>{deliveredCount}</span>
                                  <span className={styles.legendPct}>(93.3%)</span>
                                </div>
                              </div>

                              <div className={styles.doughnutLegendItem}>
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }} />
                                  <span className={styles.legendText}>مشکل</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>8</span>
                                  <span className={styles.legendPct}>(0.6%)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button type="button" className={styles.advFilterBtn} style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}>
                            مشاهده گزارش کامل
                          </button>
                        </div>

                        {/* Widget 2: Recent Updates Timeline */}
                        <div className={styles.shipmentsTimelineCard}>
                          <h3 className={styles.shipmentsCardTitle}>آخرین به‌روزرسانی‌ها</h3>
                          
                          <div className={styles.timelineList}>
                            <div className={styles.timelineItem}>
                              <span className={styles.timelineItemDot} style={{ backgroundColor: '#10b981' }} />
                              <span className={styles.timelineTime}>۲ ساعت پیش</span>
                              <span className={styles.timelineDesc}><strong>TRK-784509</strong> با موفقیت تحویل شد.</span>
                            </div>
                            <div className={styles.timelineItem}>
                              <span className={styles.timelineItemDot} style={{ backgroundColor: '#3b82f6' }} />
                              <span className={styles.timelineTime}>۳ ساعت پیش</span>
                              <span className={styles.timelineDesc}><strong>TRK-784512</strong> وارد مرز کشور شد.</span>
                            </div>
                            <div className={styles.timelineItem}>
                              <span className={styles.timelineItemDot} style={{ backgroundColor: '#f59e0b' }} />
                              <span className={styles.timelineTime}>۵ ساعت پیش</span>
                              <span className={styles.timelineDesc}><strong>TRK-784511</strong> به گمرک رسید.</span>
                            </div>
                            <div className={styles.timelineItem}>
                              <span className={styles.timelineItemDot} style={{ backgroundColor: '#a855f7' }} />
                              <span className={styles.timelineTime}>۱ روز پیش</span>
                              <span className={styles.timelineDesc}><strong>TRK-784510</strong> وارد انبار ایران شد.</span>
                            </div>
                            <div className={styles.timelineItem}>
                              <span className={styles.timelineItemDot} style={{ backgroundColor: '#ef4444' }} />
                              <span className={styles.timelineTime}>۱ روز پیش</span>
                              <span className={styles.timelineDesc}>مشکل در ارسال <strong>TRK-784507</strong> گزارش شد.</span>
                            </div>
                          </div>
                        </div>

                        {/* Widget 3: Active Transit tracking box preview list */}
                        <div className={styles.shipmentsTrackingCard}>
                          <div className={styles.shipmentsCardTitle}>
                            <span>ارسال‌های در حال پیگیری</span>
                            <span className={styles.trackingCardHeaderLink}>مشاهده همه</span>
                          </div>
                          
                          <div className={styles.trackingList}>
                            <div className={styles.trackingBoxItem}>
                              <div className={styles.trackingBoxHeader}>
                                <span className={styles.trackingBoxCode}>TRK-784512</span>
                                <span className={styles.badgeActive} style={{ fontSize: '8.5px', padding: '1px 6px' }}>در حال ارسال</span>
                              </div>
                              <div className={styles.trackingBoxRoute}>
                                <div className={styles.trackingBoxRouteDetails}>
                                  <span>دبی</span>
                                  <span style={{ fontSize: '10px', color: '#f87820' }}>↔</span>
                                  <span>تهران</span>
                                </div>
                                <span className={styles.trackingBoxRouteEst}>تاریخ تخمینی: 1403/03/22</span>
                              </div>
                            </div>

                            <div className={styles.trackingBoxItem}>
                              <div className={styles.trackingBoxHeader}>
                                <span className={styles.trackingBoxCode}>TRK-784508</span>
                                <span className={styles.badgeActive} style={{ fontSize: '8.5px', padding: '1px 6px' }}>در حال ارسال</span>
                              </div>
                              <div className={styles.trackingBoxRoute}>
                                <div className={styles.trackingBoxRouteDetails}>
                                  <span>دبی</span>
                                  <span style={{ fontSize: '10px', color: '#f87820' }}>↔</span>
                                  <span>تبریز</span>
                                </div>
                                <span className={styles.trackingBoxRouteEst}>تاریخ تخمینی: 1403/03/22</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (() => {
                      const selectedShip = shipments.find(s => s.id === selectedShipmentId);
                      if (!selectedShip) return <p style={{ color: '#8b92a5', textAlign: 'center', padding: '20px' }}>مرسوله مورد نظر یافت نشد.</p>;
                      
                      // Format price to Persian Currency
                      const formatToman = (val) => {
                        return Math.round(val).toLocaleString('fa-IR') + ' تومان';
                      };

                      // Tracking timeline status checking
                      const getStatusProgress = (status) => {
                        const stages = [
                          { key: 'transit', label: 'ثبت اولیه و خروج از دبی', desc: 'تحویل کارگو در دبی و صدور بارنامه' },
                          { key: 'customs', label: 'رسیده به گمرک کشور', desc: 'تخلیه بار در گمرک مرزی ایران' },
                          { key: 'iran', label: 'انبار مرکزی تهران', desc: 'آماده‌سازی جهت ارسال درون‌شهری' },
                          { key: 'delivered', label: 'تحویل نهایی مشتری', desc: 'تحویل مرسوله و امضای فاکتور' }
                        ];

                        let activeIndex = 0;
                        if (status === 'customs') activeIndex = 1;
                        else if (status === 'iran') activeIndex = 2;
                        else if (status === 'delivered') activeIndex = 3;
                        else if (status === 'problem') activeIndex = -1; // problem state

                        return { stages, activeIndex };
                      };

                      const { stages, activeIndex } = getStatusProgress(selectedShip.status);

                      return (
                        <div className={styles.shipmentDetailsCard}>
                          {/* Details Header with back button */}
                          <div className={styles.detailsHeader}>
                            <h3>{AdminIcons.clipboard(18)} جزئیات کامل مرسوله</h3>
                            <button 
                              type="button"
                              onClick={() => setSelectedShipmentId('')} 
                              className={styles.backToStatsBtn}
                            >
                              {AdminIcons.back(12)} برگشت به آمار
                            </button>
                          </div>

                          {/* Shipment AWB and tracking ID */}
                          <div className={styles.shipmentMainCodeRow}>
                            <span className={styles.shipmentMainCode}>{selectedShip.id}</span>
                            <div>
                              {selectedShip.status === 'transit' && <span className={styles.badgeActive} style={{ fontSize: '10px' }}>در حال ارسال</span>}
                              {selectedShip.status === 'customs' && <span className={styles.badgeCustoms}>رسیده به گمرک</span>}
                              {selectedShip.status === 'iran' && <span className={styles.badgeIran}>در انبار ایران</span>}
                              {selectedShip.status === 'delivered' && <span className={styles.badgeActive} style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px' }}>تحویل شده</span>}
                              {selectedShip.status === 'problem' && <span className={styles.badgeProblem}>دارای مشکل</span>}
                            </div>
                          </div>

                          {/* Mapped order details */}
                          <div className={styles.productMiniSection}>
                            <img 
                              src={selectedShip.productImg || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80'} 
                              alt={selectedShip.productName} 
                              className={styles.productMiniImg}
                            />
                            <div className={styles.productMiniInfo}>
                              <span className={styles.productMiniName}>{selectedShip.productName}</span>
                              <span 
                                className={styles.productMiniOrderId}
                                onClick={() => {
                                  setSelectedOrderId(selectedShip.orderId);
                                  setActiveTab('leads');
                                }}
                              >
                                شماره سفارش: {selectedShip.orderId}
                              </span>
                            </div>
                          </div>

                          {/* Cargo weight, shipping fees and values */}
                          <div className={styles.specsGrid}>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>{AdminIcons.scale(12)} وزن بار</span>
                              <span className={styles.specValue}>{selectedShip.cargoWeight} کیلوگرم</span>
                            </div>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>{AdminIcons.card(12)} هزینه ارسال کالا</span>
                              <span className={styles.specValue} style={{ color: '#ff9d00' }}>
                                {formatToman(selectedShip.shippingCost || 2500000)}
                              </span>
                            </div>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>{AdminIcons.dollar(12)} ارزش کالای بار</span>
                              <span className={styles.specValue}>
                                {formatToman(selectedShip.cargoValue || 15000000)}
                              </span>
                            </div>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>{AdminIcons.package(12)} نوع روش حمل</span>
                              <span className={styles.specValue}>
                                {selectedShip.method === 'هوایی' ? <span>{AdminIcons.plane(12)} ارسال هوایی سریع</span> : <span>{AdminIcons.truck(12)} ارسال زمینی کارگو</span>}
                              </span>
                            </div>
                          </div>

                          {/* Carrier and Airway Bill (AWB) Code */}
                          <div className={styles.addressSection} style={{ marginBottom: '16px' }}>
                            <h4 className={styles.addressTitle}>{AdminIcons.clipboard(18)} مشخصات بارنامه و خط حمل</h4>
                            <div className={styles.addressRow}>
                              <span className={styles.addressLabel}>شرکت حمل‌کننده:</span>
                              <span className={styles.addressVal}>{selectedShip.carrier || 'دبی اکسپرس'}</span>
                            </div>
                            <div className={styles.addressRow} style={{ marginTop: '4px' }}>
                              <span className={styles.addressLabel}>کد بارنامه بین‌المللی:</span>
                              <span className={styles.addressVal} style={{ fontFamily: 'monospace', color: '#ff9d00', fontSize: '11.5px' }}>
                                {selectedShip.awbCode || 'AWB-100293049'}
                              </span>
                            </div>
                          </div>

                          {/* Recipient info, phone and shipping address */}
                          <div className={styles.addressSection}>
                            <h4 className={styles.addressTitle}>{AdminIcons.user(14)} مشخصات گیرنده و آدرس تحویل</h4>
                            <div className={styles.addressRow}>
                              <span className={styles.addressLabel}>تحویل‌گیرنده:</span>
                              <span className={styles.addressVal}>{selectedShip.recipient}</span>
                            </div>
                            <div className={styles.addressRow} style={{ marginTop: '4px' }}>
                              <span className={styles.addressLabel}>شماره تماس:</span>
                              <span className={styles.addressVal} dir="ltr">{selectedShip.phone}</span>
                            </div>
                            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                              <span className={styles.addressLabel} style={{ display: 'block', marginBottom: '4px' }}>آدرس ارسال:</span>
                              <span style={{ fontSize: '11px', color: '#c4c8d4', lineHeight: '1.5', display: 'block' }}>{selectedShip.address}</span>
                            </div>
                          </div>

                          {/* Interactive transit timeline stages */}
                          <div className={styles.trackingTimelineSection}>
                            <h4 className={styles.timelineHeading}>{AdminIcons.sliders(14)} مراحل وضعیت ارسال مرسوله</h4>
                            <div className={styles.timelineStages}>
                              {stages.map((stage, idx) => {
                                let isCompleted = activeIndex >= idx;
                                let isActive = activeIndex === idx;
                                if (activeIndex === -1) {
                                  // problem state: first stage is completed, second stage is warning
                                  isCompleted = idx === 0;
                                  isActive = idx === 1;
                                }

                                return (
                                  <div key={stage.key} className={styles.timelineStage}>
                                    <span 
                                      className={`${styles.stageDot} ${isCompleted ? styles.stageDotCompleted : ''} ${isActive ? styles.stageDotActive : ''}`} 
                                      style={{
                                        backgroundColor: activeIndex === -1 && idx === 1 ? '#ef4444' : undefined,
                                        boxShadow: activeIndex === -1 && idx === 1 ? '0 0 0 4px rgba(239, 68, 68, 0.2)' : undefined
                                      }}
                                    />
                                    <div className={styles.stageInfo}>
                                      <span className={`${styles.stageTitle} ${isCompleted ? styles.stageTitleCompleted : ''} ${isActive ? styles.stageTitleActive : ''}`}
                                        style={{ color: activeIndex === -1 && idx === 1 ? '#ef4444' : undefined }}
                                      >
                                        {stage.label} {activeIndex === -1 && idx === 1 && <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', marginRight: '4px' }}>{AdminIcons.alert(12)}</span>}
                                      </span>
                                      <span className={styles.stageSubtext}>
                                        {activeIndex === -1 && idx === 1 ? 'توقف مرسوله به دلیل بازرسی گمرکی یا نقض مدارک' : stage.desc}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Print packing label actions */}
                          <button 
                            type="button" 
                            className={styles.printLabelActionBtn}
                            onClick={() => alert(`برچسب بارکد دار مرسوله ${selectedShip.id} آماده چاپ شد. جهت ارسال دستور چاپ به چاپگر حرارتی انبار دبی تایید نمایید.`)}
                          >
                            {AdminIcons.printer(12)} چاپ بارکد و برچسب مرسوله ارسالی
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* MODAL: Register New Shipment */}
                {isAddShipmentOpen && (
                  <div className={styles.modalOverlay} onClick={() => setIsAddShipmentOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.modalHeader}>
                        <h3>{AdminIcons.package(16)} ثبت اطلاعات مرسوله ارسالی جدید</h3>
                        <button className={styles.modalCloseBtn} onClick={() => setIsAddShipmentOpen(false)}>×</button>
                      </div>
                      
                      <form onSubmit={handleAddShipmentSubmit}>
                        <div className={styles.modalBody}>
                          
                          <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                            <label>انتخاب گیرنده مرسوله:</label>
                            <select 
                              value={newShipmentForm.recipient} 
                              onChange={(e) => setNewShipmentForm(prev => ({ ...prev, recipient: e.target.value }))}
                              className={styles.inputField}
                            >
                              {customers.map(c => (
                                <option key={c.id} value={c.name}>{c.name} ({c.city})</option>
                              ))}
                              {customers.length === 0 && (
                                <>
                                  <option value="علی محمدی">علی محمدی</option>
                                  <option value="سمیرا احمدی">سمیرا احمدی</option>
                                  <option value="رضا حسینی">رضا حسینی</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div className={styles.inputGrid2} style={{ marginBottom: '14px' }}>
                            <div className={styles.formGroup}>
                              <label>روش حمل و ارسال:</label>
                              <select 
                                value={newShipmentForm.method} 
                                onChange={(e) => setNewShipmentForm(prev => ({ ...prev, method: e.target.value }))}
                                className={styles.inputField}
                              >
                                <option value="هوایی">هوایی</option>
                                <option value="زمینی">زمینی</option>
                              </select>
                            </div>

                            <div className={styles.formGroup}>
                              <label>وضعیت فعلی ارسال:</label>
                              <select 
                                value={newShipmentForm.status} 
                                onChange={(e) => setNewShipmentForm(prev => ({ ...prev, status: e.target.value }))}
                                className={styles.inputField}
                              >
                                <option value="transit">در حال ارسال</option>
                                <option value="customs">رسیده به گمرک</option>
                                <option value="iran">در ایران (انبار)</option>
                                <option value="delivered">تحویل شده</option>
                                <option value="problem">دارای مشکل</option>
                              </select>
                            </div>
                          </div>

                          <p style={{ fontSize: '11px', color: '#8b92a5', lineHeight: '1.5', margin: '10px 0 0 0' }}>
                            توجه: پس از ثبت نهایی، سیستم به صورت هوشمند یک شماره بارنامه اختصاصی (کد رهگیری TRK) ایجاد خواهد کرد و اطلاعات ترانزیت را به لوکال استوریج ادمین اضافه می‌نماید.
                          </p>

                        </div>

                        <div className={styles.modalFooter}>
                          <button type="button" className={styles.advFilterBtn} onClick={() => setIsAddShipmentOpen(false)}>انصراف</button>
                          <button 
                            type="submit" 
                            className={styles.saveFormBtn}
                            style={{ background: 'linear-gradient(135deg, #f87820 0%, #ff5e00 100%)', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 'bold' }}
                          >
                            ثبت مرسوله جدید
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* TAB: PAYMENTS MANAGEMENT (Premium Redesign with 100% Interactive parity) */}
          {activeTab === 'payments' && (() => {
            // Apply filters
            const filteredPayments = payments.filter(p => {
              const matchSearch = !paymentSearchQuery || 
                p.id.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                (p.recipient && p.recipient.toLowerCase().includes(paymentSearchQuery.toLowerCase())) ||
                (p.orderId && p.orderId.toLowerCase().includes(paymentSearchQuery.toLowerCase())) ||
                (p.productName && p.productName.toLowerCase().includes(paymentSearchQuery.toLowerCase()));
              
              const matchStatus = paymentStatusFilter === 'همه' || 
                (paymentStatusFilter === 'success' && p.status === 'success') ||
                (paymentStatusFilter === 'pending' && p.status === 'pending') ||
                (paymentStatusFilter === 'failed' && p.status === 'failed');
              
              const matchMethod = paymentMethodFilter === 'همه' || p.method === paymentMethodFilter;
              const matchCategory = paymentCategoryFilter === 'همه' || p.category === paymentCategoryFilter;

              return matchSearch && matchStatus && matchMethod && matchCategory;
            });

            // Base KPI numbers from mockup + dynamic additions
            const baseIncome = 2145500000;
            const baseExpenses = 1245300000;
            const baseTxns = 367;
            const baseBalance = 5845000;

            const dynamicPayments = payments.filter(p => !INITIAL_PAYMENTS_SEED.some(seed => seed.id === p.id));
            const dynamicIncome = dynamicPayments.filter(p => p.type === 'دریافتی' && p.status === 'success').reduce((sum, p) => sum + Math.abs(p.amount), 0);
            const dynamicExpenses = dynamicPayments.filter(p => p.type === 'پرداختی').reduce((sum, p) => sum + Math.abs(p.amount), 0);

            const displayIncome = baseIncome + dynamicIncome;
            const displayExpenses = baseExpenses + dynamicExpenses;
            const displayProfit = displayIncome - displayExpenses;
            const displayTxnCount = baseTxns + dynamicPayments.length;
            const displayBalance = baseBalance + (dynamicIncome - dynamicExpenses);

            return (
              <div>
                {/* Header Title Row */}
                <div className={styles.pageTitleSection} style={{ marginBottom: '24px' }}>
                  <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#f87820', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.card(28)}</span>
                    <div>
                      <h1 style={{ fontSize: '22px', fontWeight: '750', color: '#fff', margin: 0 }}>پرداخت‌ها</h1>
                      <p style={{ fontSize: '11.5px', color: '#8b92a5', marginTop: '2px', margin: 0 }}>مدیریت تمامی پرداخت‌های دریافتی و هزینه‌ها</p>
                    </div>
                  </div>

                  <div className={styles.titleActionBtns} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('financial_reports')} 
                      className={styles.advFilterBtn} 
                      style={{ padding: '10px 15px', color: '#fff' }}
                      title="گزارشات جامع مالی"
                    >
                      {AdminIcons.chart(12)} گزارش مالی
                    </button>
                    <button 
                      type="button" 
                      onClick={handleExportExcel} 
                      className={styles.advFilterBtn} 
                      style={{ padding: '10px 15px', color: '#fff' }}
                      title="دریافت فایل اکسل"
                    >
                      {AdminIcons.download(12)} اکسل
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setPaymentStatusFilter(paymentStatusFilter === 'همه' ? 'pending' : 'همه')} 
                      className={styles.advFilterBtn} 
                      style={{ padding: '10px 15px', color: '#fff' }}
                      title="تغییر نمایش فیلترها"
                    >
                      {AdminIcons.sliders(12)} فیلتر
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsAddPaymentOpen(true)} 
                      className={styles.addOrderBtn}
                      style={{ height: '42px', padding: '0 20px', borderRadius: '10px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {AdminIcons.plus(12)} ثبت پرداخت جدید
                    </button>
                  </div>
                </div>

                {/* 5 KPI metrics row */}
                <div className={styles.metricsGrid5}>
                  {/* KPI 1 */}
                  <div 
                    className={styles.metricCard} 
                    onClick={() => {
                      setPaymentCategoryFilter('سفارشات');
                      setPaymentMethodFilter('همه');
                      setPaymentStatusFilter('success');
                    }}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    title="فیلتر سفارشات موفق"
                  >
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>کل پرداخت ها (دریافتی)</span>
                      <span className={styles.metricValue} style={{ fontSize: '15px', fontFamily: 'var(--font-vazirmatn)' }}>
                        {displayIncome.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9.5px', color: '#10b981', marginTop: '4px', fontWeight: 'bold' }}>
                        نسبت ماه قبل ۱۲.۵٪ +
                      </span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '50%' }}>
                      {AdminIcons.download(18)}
                    </div>
                  </div>

                  {/* KPI 2 */}
                  <div 
                    className={styles.metricCard} 
                    onClick={() => {
                      setPaymentCategoryFilter('هزینه ها');
                      setPaymentMethodFilter('همه');
                      setPaymentStatusFilter('همه');
                    }}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    title="فیلتر هزینه های خروجی"
                  >
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>کل هزینه ها (پرداختی)</span>
                      <span className={styles.metricValue} style={{ fontSize: '15px', fontFamily: 'var(--font-vazirmatn)' }}>
                        {displayExpenses.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9.5px', color: '#ef4444', marginTop: '4px', fontWeight: 'bold' }}>
                        نسبت ماه قبل ۸.۳٪ -
                      </span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%' }}>
                      {AdminIcons.upload(18)}
                    </div>
                  </div>

                  {/* KPI 3 */}
                  <div 
                    className={styles.metricCard} 
                    onClick={() => setActiveTab('financial_reports')}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    title="مشاهده گزارش سود سالانه"
                  >
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>سود خالص</span>
                      <span className={styles.metricValue} style={{ fontSize: '15px', color: '#10b981', fontFamily: 'var(--font-vazirmatn)' }}>
                        {displayProfit.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9.5px', color: '#10b981', marginTop: '4px', fontWeight: 'bold' }}>
                        نسبت ماه قبل ۱۵.۷٪ +
                      </span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '50%' }}>
                      {AdminIcons.bank(18)}
                    </div>
                  </div>

                  {/* KPI 4 */}
                  <div 
                    className={styles.metricCard} 
                    onClick={() => {
                      setPaymentCategoryFilter('همه');
                      setPaymentMethodFilter('همه');
                      setPaymentStatusFilter('همه');
                      setPaymentSearchQuery('');
                    }}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    title="نمایش کل تراکنش‌ها"
                  >
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>تعداد تراکنش ها</span>
                      <span className={styles.metricValue} style={{ fontSize: '15px', fontFamily: 'var(--font-vazirmatn)' }}>
                        {displayTxnCount.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9.5px', color: '#8b5cf6', marginTop: '4px', fontWeight: 'bold' }}>
                        نسبت ماه قبل ۹.۲٪ +
                      </span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '50%' }}>
                      {AdminIcons.sync(18)}
                    </div>
                  </div>

                  {/* KPI 5 */}
                  <div 
                    className={styles.metricCard} 
                    onClick={() => setIsBalanceModalOpen(true)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    title="جزئیات موجودی حساب‌ها"
                  >
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>مانده حساب</span>
                      <span className={styles.metricValue} style={{ fontSize: '15px', color: '#ff9d00', fontFamily: 'var(--font-vazirmatn)' }}>
                        {displayBalance.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9.5px', color: '#8b92a5', marginTop: '4px' }}>
                        موجودی در حال گردش
                      </span>
                    </div>
                    <div className={styles.metricIconContainer} style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#f59e0b', borderRadius: '50%' }}>
                      {AdminIcons.lock(18)}
                    </div>
                  </div>
                </div>

                {/* Filter Strip */}
                <div className={styles.filterStrip}>
                  <div className={styles.filterControlsLeft}>
                    {/* Search bar input */}
                    <div className={styles.searchBarWrapper}>
                      <span className={styles.searchBarIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.search(13)}</span>
                      <input 
                        type="text" 
                        placeholder="جستجو..." 
                        value={paymentSearchQuery}
                        onChange={(e) => setPaymentSearchQuery(e.target.value)}
                        className={styles.searchBarInput}
                        style={{ width: '240px' }}
                      />
                    </div>

                    {/* Status Filter */}
                    <select 
                      value={paymentStatusFilter} 
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه وضعیت‌ها</option>
                      <option value="success">تسویه شده</option>
                      <option value="pending">در انتظار</option>
                    </select>

                    {/* Method Filter */}
                    <select 
                      value={paymentMethodFilter} 
                      onChange={(e) => setPaymentMethodFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">مبلغ روش‌ها</option>
                      <option value="درگاه بانکی">درگاه بانکی</option>
                      <option value="کارت به کارت">کارت به کارت</option>
                      <option value="حواله بانکی">حواله بانکی</option>
                    </select>

                    {/* Category Filter */}
                    <select 
                      value={paymentCategoryFilter} 
                      onChange={(e) => setPaymentCategoryFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="همه">همه دسته‌ها</option>
                      <option value="سفارشات">سفارشات</option>
                      <option value="هزینه ها">هزینه‌ها</option>
                    </select>

                    {/* Date picker mock range */}
                    <div className={styles.advFilterBtn} style={{ cursor: 'default', direction: 'ltr', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{AdminIcons.calendar(12)}</span> 1403/03/01 - 1403/03/20
                    </div>
                  </div>
                </div>

                {/* Split Workspace */}
                <div className={styles.customerSplitGrid}>
                  
                  {/* LEFT COLUMN: Payments Table */}
                  <div style={{ background: '#11131a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className={styles.adminTable}>
                        <thead>
                          <tr>
                            <th>شماره</th>
                            <th>تاریخ</th>
                            <th>نوع</th>
                            <th>مبلغ (تومان)</th>
                            <th>روش پرداخت</th>
                            <th>دسته</th>
                            <th>وضعیت</th>
                            <th>عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.length === 0 ? (
                            <tr key="empty-payments">
                              <td colSpan="8" style={{ textAlign: 'center', color: '#8b92a5', padding: '50px 0' }}>هیچ تراکنش مالی یافت نشد.</td>
                            </tr>
                          ) : (
                            filteredPayments.map(txn => {
                              const isSelected = selectedPaymentId === txn.id;
                              const isPositive = txn.amount > 0;
                              
                              // Determine method icon and color
                              let methodIcon = AdminIcons.card(12);
                              let methodColor = '#f59e0b'; // Gateway yellow
                              if (txn.method === 'کارت به کارت') {
                                methodIcon = AdminIcons.phone(12);
                                methodColor = '#3b82f6'; // Card blue
                              } else if (txn.method === 'حواله بانکی') {
                                methodIcon = AdminIcons.bank(12);
                                methodColor = '#c4c8d4'; // Bank silver
                              }

                              return (
                                <tr 
                                  key={txn.id}
                                  onClick={() => setSelectedPaymentId(txn.id)}
                                  className={isSelected ? styles.activeRowHighlight : ''}
                                  style={{ 
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s', 
                                    backgroundColor: isSelected ? 'rgba(248, 120, 32, 0.08)' : 'transparent',
                                    borderRight: isSelected ? '4px solid #f87820' : 'none'
                                  }}
                                >
                                  {/* Transaction ID */}
                                  <td style={{ fontWeight: '850', color: '#ff9d00', fontFamily: 'monospace', fontSize: '11.5px' }}>
                                    {txn.id}
                                  </td>

                                  {/* Date */}
                                  <td style={{ fontSize: '11.5px', color: '#c4c8d4', fontFamily: 'var(--font-vazirmatn)' }}>
                                    {txn.date}
                                  </td>

                                  {/* Type */}
                                  <td>
                                    {isPositive ? (
                                      <span style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        دریافتی
                                      </span>
                                    ) : (
                                      <span style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '10px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        پرداختی
                                      </span>
                                    )}
                                  </td>

                                  {/* Amount */}
                                  <td style={{ 
                                    fontFamily: 'var(--font-vazirmatn)', 
                                    fontWeight: '800', 
                                    color: isPositive ? '#10b981' : '#ef4444', 
                                    fontSize: '12.5px',
                                    direction: 'ltr',
                                    textAlign: 'right'
                                  }}>
                                    {isPositive ? '+' : ''}{txn.amount.toLocaleString('fa-IR')}
                                  </td>

                                  {/* Method */}
                                  <td style={{ fontSize: '12px' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ color: methodColor }}>{methodIcon}</span>
                                      <span>{txn.method}</span>
                                    </span>
                                  </td>

                                  {/* Category */}
                                  <td style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
                                    {txn.category || (isPositive ? 'سفارشات' : 'هزینه ها')}
                                  </td>

                                  {/* Status */}
                                  <td>
                                    {txn.status === 'success' ? (
                                      <span className={styles.badgeActive} style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '9.5px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        تسویه شده
                                      </span>
                                    ) : (
                                      <span className={styles.badgeCustoms} style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '9.5px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        در انتظار
                                      </span>
                                    )}
                                  </td>

                                  {/* Action */}
                                  <td>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePayment(txn.id);
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', padding: '4px' }}
                                      title="حذف تراکنش"
                                    >
                                      {AdminIcons.trash(13)}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&lt;</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#f87820', color: '#fff', borderColor: '#f87820' }}>1</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>2</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>3</button>
                        <span style={{ color: '#8b92a5', padding: '0 4px' }}>...</span>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>46</button>
                        <button className={styles.advFilterBtn} style={{ padding: '4px 8px', fontSize: '11px' }}>&gt;</button>
                      </div>
                      <span style={{ fontSize: '11.5px', color: '#8b92a5' }}>
                        نمایش ۱ تا {filteredPayments.length} از {displayTxnCount} نتیجه
                      </span>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Sticky widgets or Receipt Card */}
                  <div className={styles.shipmentsRightWidgetsContainer}>
                    {selectedPaymentId === '' ? (
                      <>
                        {/* Widget 1: نمودار جریان مالی (Mocked SVG Line Chart mirroring mockup) */}
                        <div 
                          className={styles.shipmentsDoughnutCard} 
                          onClick={() => setActiveTab('financial_reports')} 
                          style={{ cursor: 'pointer' }}
                          title="مشاهده جزئیات در گزارش مالی"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 className={styles.shipmentsCardTitle} style={{ margin: 0, border: 'none', padding: 0 }}>نمودار جریان مالی</h3>
                            <select 
                              defaultValue="monthly" 
                              onClick={(e) => e.stopPropagation()} 
                              className={styles.filterSelect} 
                              style={{ padding: '3px 8px', fontSize: '10px' }}
                            >
                              <option value="monthly">ماه جاری</option>
                            </select>
                          </div>
                          
                          {/* Rich visual SVG double-line graph */}
                          <div style={{ height: '140px', position: 'relative', marginTop: '10px' }}>
                            <svg width="100%" height="100%" viewBox="0 0 300 130" preserveAspectRatio="none">
                              {/* Grid lines */}
                              <line x1="30" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                              <line x1="30" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                              <line x1="30" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                              <line x1="30" y1="110" x2="300" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                              
                              {/* Y-Axis Labels */}
                              <text x="0" y="24" fill="#6c7284" fontSize="8" textAnchor="start">160M</text>
                              <text x="0" y="54" fill="#6c7284" fontSize="8" textAnchor="start">120M</text>
                              <text x="0" y="84" fill="#6c7284" fontSize="8" textAnchor="start">80M</text>
                              <text x="0" y="114" fill="#6c7284" fontSize="8" textAnchor="start">0</text>
                              
                              {/* Income Line - Green */}
                              <path d="M 40 90 L 90 75 L 140 60 L 190 40 L 240 45 L 290 25" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                              
                              {/* Expense Line - Red */}
                              <path d="M 40 105 L 90 95 L 140 85 L 190 70 L 240 78 L 290 55" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                              
                              {/* Net Profit Line - Blue */}
                              <path d="M 40 115 L 90 110 L 140 100 L 190 90 L 240 95 L 290 75" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3,3" strokeLinecap="round" />
                              
                              {/* Points */}
                              <circle cx="290" cy="25" r="4" fill="#10b981" />
                              <circle cx="290" cy="55" r="4" fill="#ef4444" />
                              <circle cx="290" cy="75" r="3" fill="#3b82f6" />
                            </svg>
                          </div>
                          
                          {/* Legend / Axis */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 30px 0', fontSize: '9px', color: '#8b92a5', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: '8px' }}>
                            <span>1 فروردین</span>
                            <span>7 فروردین</span>
                            <span>13 فروردین</span>
                            <span>25 فروردین</span>
                            <span>31 فروردین</span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '9.5px', color: '#c4c8d4' }}>
                              <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '2px' }} /> دریافتی ها
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '9.5px', color: '#c4c8d4' }}>
                              <span style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '2px' }} /> پرداختی ها
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '9.5px', color: '#c4c8d4' }}>
                              <span style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '2px' }} strokeDasharray="2,2" /> سود خالص
                            </span>
                          </div>
                        </div>

                        {/* Widget 2: توزیع پرداخت‌ها (Doughnut Chart SVG matching mockup) */}
                        <div className={styles.shipmentsDoughnutCard}>
                          <h3 className={styles.shipmentsCardTitle}>توزیع پرداخت ها</h3>
                          
                          <div className={styles.doughnutWrapper}>
                            <div className={styles.doughnutSvgContainer}>
                              <svg width="110" height="110" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="11" />
                                
                                {/* 62% Income (green), 35% Cost (red), 3% Pending (yellow) */}
                                {/* circumference is 2 * pi * 38 = 238.76 */}
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="11" 
                                        strokeDasharray="238.76" strokeDashoffset="90.72" transform="rotate(-90 50 50)" />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="11" 
                                        strokeDasharray="238.76" strokeDashoffset="155.19" transform="rotate(133.2 50 50)" />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="11" 
                                        strokeDasharray="238.76" strokeDashoffset="231.59" transform="rotate(259.2 50 50)" />
                              </svg>
                              <div className={styles.doughnutCenterText} style={{ width: '100%' }}>
                                <span className={styles.doughnutCenterNum} style={{ fontSize: '15px' }}>
                                  {displayTxnCount.toLocaleString('fa-IR')}
                                </span>
                                <span className={styles.doughnutCenterLabel} style={{ fontSize: '8px' }}>تراکنش</span>
                              </div>
                            </div>

                            <div className={styles.doughnutLegendList}>
                              <div 
                                className={styles.doughnutLegendItem} 
                                onClick={() => { setPaymentCategoryFilter('سفارشات'); setPaymentStatusFilter('success'); }} 
                                style={{ cursor: 'pointer' }}
                                title="کلیک برای فیلتر"
                              >
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#10b981' }} />
                                  <span className={styles.legendText}>دریافتی</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>۲۲۷</span>
                                  <span className={styles.legendPct}>۶۲٪</span>
                                </div>
                              </div>
                              <div 
                                className={styles.doughnutLegendItem} 
                                onClick={() => { setPaymentCategoryFilter('هزینه ها'); setPaymentStatusFilter('success'); }} 
                                style={{ cursor: 'pointer' }}
                                title="کلیک برای فیلتر"
                              >
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }} />
                                  <span className={styles.legendText}>پرداختی</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>۱۲۹</span>
                                  <span className={styles.legendPct}>۳۵٪</span>
                                </div>
                              </div>
                              <div 
                                className={styles.doughnutLegendItem} 
                                onClick={() => { setPaymentStatusFilter('pending'); }} 
                                style={{ cursor: 'pointer' }}
                                title="کلیک برای فیلتر"
                              >
                                <div className={styles.legendLabelBlock}>
                                  <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }} />
                                  <span className={styles.legendText}>در انتظار</span>
                                </div>
                                <div className={styles.legendValBlock}>
                                  <span className={styles.legendCount}>۱۱</span>
                                  <span className={styles.legendPct}>۳٪</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Widget 3: خلاصه روش‌های پرداخت */}
                        <div className={styles.shipmentsDoughnutCard}>
                          <h3 className={styles.shipmentsCardTitle}>خلاصه روش های پرداخت</h3>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                            {/* Option 1 */}
                            <div 
                              onClick={() => setPaymentMethodFilter('درگاه بانکی')} 
                              style={{ cursor: 'pointer' }} 
                              title="فیلتر درگاه آنلاین"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c4c8d4' }}>
                                  <span>{AdminIcons.card(12)}</span> درگاه بانکی
                                </span>
                                <span style={{ fontWeight: 'bold' }}>
                                  ۱,۴۷۰,۰۰۰,۰۰۰ تومان <span style={{ color: '#8b92a5', fontSize: '9px', marginRight: '6px' }}>(۴۵٪)</span>
                                </span>
                              </div>
                              <div className={styles.progressBarTrack}>
                                <div className={styles.progressBarFill} style={{ width: '45%', backgroundColor: '#f59e0b' }} />
                              </div>
                            </div>

                            {/* Option 2 */}
                            <div 
                              onClick={() => setPaymentMethodFilter('کارت به کارت')} 
                              style={{ cursor: 'pointer' }} 
                              title="فیلتر کارت به کارت"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c4c8d4' }}>
                                  <span>{AdminIcons.phone(12)}</span> کارت به کارت
                                </span>
                                <span style={{ fontWeight: 'bold' }}>
                                  ۹۸۰,۰۰۰,۰۰۰ تومان <span style={{ color: '#8b92a5', fontSize: '9px', marginRight: '6px' }}>(۳۰٪)</span>
                                </span>
                              </div>
                              <div className={styles.progressBarTrack}>
                                <div className={styles.progressBarFill} style={{ width: '30%', backgroundColor: '#3b82f6' }} />
                              </div>
                            </div>

                            {/* Option 3 */}
                            <div 
                              onClick={() => setPaymentMethodFilter('حواله بانکی')} 
                              style={{ cursor: 'pointer' }} 
                              title="فیلتر حواله بانکی"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c4c8d4' }}>
                                  <span>{AdminIcons.bank(12)}</span> حواله بانکی
                                </span>
                                <span style={{ fontWeight: 'bold' }}>
                                  ۶۵۰,۰۰۰,۰۰۰ تومان <span style={{ color: '#8b92a5', fontSize: '9px', marginRight: '6px' }}>(۲۰٪)</span>
                                </span>
                              </div>
                              <div className={styles.progressBarTrack}>
                                <div className={styles.progressBarFill} style={{ width: '20%', backgroundColor: '#c4c8d4' }} />
                              </div>
                            </div>

                            {/* Option 4 */}
                            <div 
                              onClick={() => setPaymentMethodFilter('همه')} 
                              style={{ cursor: 'pointer' }} 
                              title="حذف فیلتر روش"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c4c8d4' }}>
                                  {AdminIcons.folder(12)} سایر روش‌ها
                                </span>
                                <span style={{ fontWeight: 'bold' }}>
                                  ۱۶۰,۰۰۰,۰۰۰ تومان <span style={{ color: '#8b92a5', fontSize: '9px', marginRight: '6px' }}>(۵٪)</span>
                                </span>
                              </div>
                              <div className={styles.progressBarTrack}>
                                <div className={styles.progressBarFill} style={{ width: '5%', backgroundColor: '#8b92a5' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (() => {
                      const selectedTxn = payments.find(p => p.id === selectedPaymentId);
                      if (!selectedTxn) return <p style={{ color: '#8b92a5', textAlign: 'center', padding: '20px' }}>تراکنش یافت نشد.</p>;

                      return (
                        <div className={styles.shipmentDetailsCard} style={{ animation: 'fadeIn 0.25s ease' }}>
                          <div className={styles.detailsHeader}>
                            <h3>{AdminIcons.receipt(16)} رسید دیجیتالی تراکنش</h3>
                            <button 
                              type="button"
                              onClick={() => setSelectedPaymentId('')} 
                              className={styles.backToStatsBtn}
                            >
                              {AdminIcons.back(12)} برگشت به آمار
                            </button>
                          </div>

                          {/* Transaction code and Status */}
                          <div className={styles.shipmentMainCodeRow}>
                            <span className={styles.shipmentMainCode}>{selectedTxn.id}</span>
                            <div>
                              {selectedTxn.status === 'success' ? (
                                <span className={styles.badgeActive} style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px' }}>
                                  تراکنش موفق
                                </span>
                              ) : (
                                <span className={styles.badgeCustoms} style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '10px' }}>
                                  در انتظار بررسی
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Order Details Mini Box */}
                          <div className={styles.productMiniSection}>
                            <div className={styles.productMiniInfo} style={{ width: '100%' }}>
                              <span className={styles.productMiniName} style={{ fontSize: '13.5px', display: 'block', marginBottom: '4px' }}>
                                {selectedTxn.productName || 'بابت ثبت فاکتور سفارش مشتری'}
                              </span>
                              {selectedTxn.orderId && (
                                <span 
                                  className={styles.productMiniOrderId}
                                  onClick={() => {
                                    setSelectedOrderId(selectedTxn.orderId);
                                    setActiveTab('leads');
                                  }}
                                  style={{ cursor: 'pointer', textDecoration: 'underline', color: '#f87820' }}
                                >
                                  شماره سفارش مرجع: {selectedTxn.orderId}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Amount Card */}
                          <div style={{ background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>مبلغ کل واریزی:</span>
                            <span style={{ fontSize: '20px', fontWeight: '900', color: selectedTxn.amount > 0 ? '#10b981' : '#ef4444' }}>
                              {selectedTxn.amount.toLocaleString('fa-IR')} تومان
                            </span>
                          </div>

                          {/* Transaction Details grid */}
                          <div className={styles.addressSection} style={{ marginBottom: '20px' }}>
                            <h4 className={styles.addressTitle}>{AdminIcons.clipboard(18)} مشخصات و رهگیری بانکی</h4>
                            
                            <div className={styles.addressRow}>
                              <span className={styles.addressLabel}>روش واریز:</span>
                              <span className={styles.addressVal} style={{ fontWeight: 'bold', color: '#fff' }}>{selectedTxn.method}</span>
                            </div>
                            
                            {selectedTxn.reference && (
                              <div className={styles.addressRow} style={{ marginTop: '6px' }}>
                                <span className={styles.addressLabel}>شماره مرجع بانکی:</span>
                                <span className={styles.addressVal} style={{ fontFamily: 'monospace', color: '#ff9d00' }}>{selectedTxn.reference}</span>
                              </div>
                            )}

                            {selectedTxn.account && (
                              <div className={styles.addressRow} style={{ marginTop: '6px' }}>
                                <span className={styles.addressLabel}>حساب مقصد / درگاه:</span>
                                <span className={styles.addressVal}>{selectedTxn.account}</span>
                              </div>
                            )}

                            <div className={styles.addressRow} style={{ marginTop: '6px' }}>
                              <span className={styles.addressLabel}>تاریخ و زمان ثبت:</span>
                              <span className={styles.addressVal} dir="ltr">{selectedTxn.date}</span>
                            </div>
                          </div>

                          {/* Client profiles */}
                          {selectedTxn.recipient && (
                            <div className={styles.addressSection} style={{ marginBottom: '20px' }}>
                              <h4 className={styles.addressTitle}>{AdminIcons.user(14)} اطلاعات پرداخت‌کننده کالا</h4>
                              <div className={styles.addressRow}>
                                <span className={styles.addressLabel}>نام و نام‌خانوادگی:</span>
                                <span 
                                  className={styles.addressVal} 
                                  style={{ cursor: 'pointer', textDecoration: 'underline', color: '#f87820', fontWeight: 'bold' }}
                                  onClick={() => {
                                    const matchingCust = customers.find(c => c.name === selectedTxn.recipient);
                                    if (matchingCust) {
                                      setSelectedCustomerId(matchingCust.id);
                                    }
                                    setActiveTab('customers');
                                  }}
                                >
                                  {selectedTxn.recipient}
                                </span>
                              </div>
                              {selectedTxn.phone && selectedTxn.phone !== '-' && (
                                <div className={styles.addressRow} style={{ marginTop: '4px' }}>
                                  <span className={styles.addressLabel}>شماره تماس:</span>
                                  <span className={styles.addressVal} dir="ltr">{selectedTxn.phone}</span>
                                </div>
                              )}
                              {selectedTxn.address && selectedTxn.address !== '-' && (
                                <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                                  <span className={styles.addressLabel} style={{ display: 'block', marginBottom: '4px' }}>آدرس تحویل کالا:</span>
                                  <span style={{ fontSize: '11px', color: '#c4c8d4', lineHeight: '1.5' }}>{selectedTxn.address}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* System Internal Notes */}
                          {selectedTxn.notes && (
                            <div className={styles.addressSection} style={{ background: 'rgba(248, 120, 32, 0.02)', borderColor: 'rgba(248, 120, 32, 0.1)', marginBottom: '20px' }}>
                              <h4 className={styles.addressTitle} style={{ color: '#f87820', borderBottomColor: 'rgba(248, 120, 32, 0.1)' }}>{AdminIcons.edit(13)} یادداشت تراکنش سیستم</h4>
                              <p style={{ fontSize: '11px', color: '#c4c8d4', margin: '4px 0 0 0', lineHeight: '1.6' }}>
                                {selectedTxn.notes}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons based on status */}
                          {selectedTxn.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button 
                                type="button" 
                                onClick={() => handleApprovePayment(selectedTxn.id)}
                                className={styles.printLabelActionBtn}
                                style={{ flexGrow: 2, height: '42px', padding: 0 }}
                              >
                                {AdminIcons.check(12)} تایید و ثبت تراکنش موفق
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleRejectPayment(selectedTxn.id)}
                                style={{ flexGrow: 1, background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                {AdminIcons.close(12)} رد رسید
                              </button>
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => alert(`رسید دیجیتالی تراکنش ${selectedTxn.id} دانلود شد.`)}
                              className={styles.printLabelActionBtn}
                            >
                              {AdminIcons.download(12)} دانلود فاکتور و رسید تراکنش (PDF)
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* MODAL: ADD PAYMENT OVERLAY */}
                {isAddPaymentOpen && (
                  <div className={styles.modalOverlay} onClick={() => setIsAddPaymentOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ width: '480px', maxWidth: '90%' }}>
                      <div className={styles.modalHeader}>
                        <h2>{AdminIcons.plus(16)} ثبت و ایجاد سند پرداخت جدید</h2>
                        <button className={styles.modalCloseBtn} onClick={() => setIsAddPaymentOpen(false)}>×</button>
                      </div>
                      
                      <form onSubmit={handleAddPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className={styles.formGroup}>
                            <label>نوع تراکنش:</label>
                            <select 
                              value={newPaymentForm.type} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, type: e.target.value, category: e.target.value === 'دریافتی' ? 'سفارشات' : 'هزینه ها' })}
                              className={styles.inputField}
                            >
                              <option value="دریافتی">دریافتی (ورودی)</option>
                              <option value="پرداختی">پرداختی (خروجی)</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label>دسته بندی:</label>
                            <select 
                              value={newPaymentForm.category} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, category: e.target.value })}
                              className={styles.inputField}
                            >
                              <option value="سفارشات">سفارشات مشتری</option>
                              <option value="هزینه ها">هزینه های کارگو / شرکت</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className={styles.formGroup}>
                            <label>مبلغ تراکنش (تومان):</label>
                            <input 
                              type="number" 
                              required
                              placeholder="مثال: 15000000" 
                              value={newPaymentForm.amount} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, amount: e.target.value })}
                              className={styles.inputField}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>روش پرداخت:</label>
                            <select 
                              value={newPaymentForm.method} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, method: e.target.value })}
                              className={styles.inputField}
                            >
                              <option value="درگاه بانکی">درگاه بانکی</option>
                              <option value="کارت به کارت">کارت به کارت</option>
                              <option value="حواله بانکی">حواله بانکی</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className={styles.formGroup}>
                            <label>نام مشتری / شرح هزینه:</label>
                            <input 
                              type="text" 
                              required
                              placeholder="مثال: رضا حسینی" 
                              value={newPaymentForm.recipient} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, recipient: e.target.value })}
                              className={styles.inputField}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>شماره سفارش مرجع:</label>
                            <input 
                              type="text" 
                              placeholder="مثال: DK-1254" 
                              value={newPaymentForm.orderId} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, orderId: e.target.value })}
                              className={styles.inputField}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className={styles.formGroup}>
                            <label>کد مرجع بانکی (REF):</label>
                            <input 
                              type="text" 
                              placeholder="مثال: REF-752145" 
                              value={newPaymentForm.reference} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, reference: e.target.value })}
                              className={styles.inputField}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>درگاه / حساب مقصد:</label>
                            <input 
                              type="text" 
                              placeholder="مثال: درگاه سامان" 
                              value={newPaymentForm.account} 
                              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, account: e.target.value })}
                              className={styles.inputField}
                            />
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label>نام کالا / جزئیات خرید:</label>
                          <input 
                            type="text" 
                            placeholder="مثال: کوله پشتی سفارشی" 
                            value={newPaymentForm.productName} 
                            onChange={(e) => setNewPaymentForm({ ...newPaymentForm, productName: e.target.value })}
                            className={styles.inputField}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>توضیحات و یادداشت تراکنش:</label>
                          <textarea 
                            rows="2"
                            placeholder="وارد کردن توضیحات تراکنش..." 
                            value={newPaymentForm.notes} 
                            onChange={(e) => setNewPaymentForm({ ...newPaymentForm, notes: e.target.value })}
                            className={styles.inputField}
                            style={{ resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="submit" className={styles.addOrderBtn} style={{ flexGrow: 2 }}>ثبت نهایی و ثبت سند</button>
                          <button type="button" onClick={() => setIsAddPaymentOpen(false)} className={styles.advFilterBtn} style={{ flexGrow: 1 }}>انصراف</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL: BALANCES BREAKDOWN */}
                {isBalanceModalOpen && (
                  <div className={styles.modalOverlay} onClick={() => setIsBalanceModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ width: '400px', maxWidth: '90%' }}>
                      <div className={styles.modalHeader}>
                        <h2>{AdminIcons.lock(16)} تفکیک موجودی و وضعیت حساب‌ها</h2>
                        <button className={styles.modalCloseBtn} onClick={() => setIsBalanceModalOpen(false)}>×</button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{AdminIcons.phone(14)} حساب بانک ملی (کارت به کارت)</span>
                          <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۳,۲۰۰,۰۰۰ تومان</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{AdminIcons.bank(14)} حساب بانک پاسارگاد (حواله‌ها)</span>
                          <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۱,۴۵۰,۰۰۰ تومان</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{AdminIcons.card(14)} درگاه آنلاین زرین‌پال / ملت</span>
                          <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۱,۱۹۵,۰۰۰ تومان</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{AdminIcons.dollar(14)} صندوق نقدی و کارگو دبی</span>
                          <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۰ تومان</span>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>مجموع موجودی صندوق‌ها:</span>
                          <span style={{ fontSize: '16px', fontWeight: '900', color: '#ff9d00', fontFamily: 'var(--font-vazirmatn)' }}>
                            {displayBalance.toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                        
                        <button type="button" onClick={() => setIsBalanceModalOpen(false)} className={styles.advFilterBtn} style={{ marginTop: '10px', width: '100%' }}>بستن پنجره</button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* TAB: FINANCIAL REPORTS (Brand New Comprehensive View) */}
          {activeTab === 'financial_reports' && (() => {
            // Overall statistics
            const totalIncomes = 2145500000;
            const totalOutgoings = 1245300000;
            const netProfit = totalIncomes - totalOutgoings;
            const averageOrderVal = 7750000;

            return (
              <div>
                {/* Header Title Row */}
                <div className={styles.pageTitleSection} style={{ marginBottom: '24px' }}>
                  <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#f87820', display: 'inline-flex', alignItems: 'center' }}>{AdminIcons.chart(28)}</span>
                    <div>
                      <h1 style={{ fontSize: '22px', fontWeight: '750', color: '#fff', margin: 0 }}>گزارشات مالی</h1>
                      <p style={{ fontSize: '11.5px', color: '#8b92a5', marginTop: '2px', margin: 0 }}>بررسی تراز مالی، سود ناخالص، هزینه‌های جاری و مخارج حمل و نقل</p>
                    </div>
                  </div>

                  <div className={styles.titleActionBtns} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      type="button" 
                      onClick={() => alert('گزارش عملکرد مالی دوره خرداد ماه به صورت فایل PDF دانلود گردید.')} 
                      className={styles.advFilterBtn} 
                      style={{ padding: '10px 15px', color: '#fff' }}
                    >
                      {AdminIcons.download(12)} خروجی PDF گزارش
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('payments')} 
                      className={styles.advFilterBtn} 
                      style={{ padding: '10px 15px', color: '#fff' }}
                    >
                      {AdminIcons.card(12)} لیست تراکنش‌ها
                    </button>
                  </div>
                </div>

                {/* 4 financial KPI cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div className={styles.finReportsMetricCard}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>مجموع ورودی مالی (دریافتی)</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-vazirmatn)' }}>
                        {totalIncomes.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9px', color: '#10b981', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>۴۵.۶٪ سهم درگاه شتاب</span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#10b981' }}>{AdminIcons.trendingUp(24)}</span>
                  </div>

                  <div className={styles.finReportsMetricCard}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>کل هزینه‌های پرداختی (خروجی)</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#ef4444', fontFamily: 'var(--font-vazirmatn)' }}>
                        {totalOutgoings.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9px', color: '#ef4444', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>۲۵.۲٪ بابت ترخیص و گمرک</span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#ef4444' }}>{AdminIcons.trendingDown(24)}</span>
                  </div>

                  <div className={styles.finReportsMetricCard}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>سود خالص کل دوره</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6', fontFamily: 'var(--font-vazirmatn)' }}>
                        {netProfit.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9px', color: '#10b981', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>حاشیه سود ناخالص: ۴۱.۹٪ +</span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#f59e0b' }}>{AdminIcons.dollar(24)}</span>
                  </div>

                  <div className={styles.finReportsMetricCard}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#8b92a5', display: 'block', marginBottom: '4px' }}>میانگین ارزش هر سفارش</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#ff9d00', fontFamily: 'var(--font-vazirmatn)' }}>
                        {averageOrderVal.toLocaleString('fa-IR')}
                      </span>
                      <span style={{ fontSize: '9px', color: '#8b92a5', display: 'block', marginTop: '4px' }}>محاسبه بر اساس کل خریدارها</span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#3b82f6' }}>{AdminIcons.cart(24)}</span>
                  </div>
                </div>

                {/* SVG Visual Charts Grid */}
                <div className={styles.finReportsGrid}>
                  
                  {/* Monthly Trend bar chart */}
                  <div className={styles.finChartCard}>
                    <h3 className={styles.finChartTitle}>{AdminIcons.chart(16)} نمودار روند مقایسه‌ای جریان مالی ماهانه</h3>
                    
                    <div style={{ height: '220px', position: 'relative' }}>
                      <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="40" y1="30" x2="390" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="40" y1="70" x2="390" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="40" y1="110" x2="390" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="40" y1="150" x2="390" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        
                        {/* Y axis labels */}
                        <text x="5" y="34" fill="#6c7284" fontSize="8">240M</text>
                        <text x="5" y="74" fill="#6c7284" fontSize="8">160M</text>
                        <text x="5" y="114" fill="#6c7284" fontSize="8">80M</text>
                        <text x="5" y="154" fill="#6c7284" fontSize="8">0</text>
                        
                        {/* March Bars (اسفند) */}
                        <rect x="80" y="70" width="16" height="80" fill="#10b981" rx="2" />
                        <rect x="100" y="100" width="16" height="50" fill="#ef4444" rx="2" />
                        
                        {/* April Bars (فروردین) */}
                        <rect x="160" y="50" width="16" height="100" fill="#10b981" rx="2" />
                        <rect x="180" y="90" width="16" height="60" fill="#ef4444" rx="2" />
                        
                        {/* May Bars (اردیبهشت) */}
                        <rect x="240" y="35" width="16" height="115" fill="#10b981" rx="2" />
                        <rect x="260" y="80" width="16" height="70" fill="#ef4444" rx="2" />
                        
                        {/* June Bars (خرداد) */}
                        <rect x="320" y="25" width="16" height="125" fill="#10b981" rx="2" />
                        <rect x="340" y="75" width="16" height="75" fill="#ef4444" rx="2" />
                        
                        {/* Profit trend line overlay - Blue */}
                        <path d="M 98 120 L 178 110 L 258 105 L 338 100" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="98" cy="120" r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                        <circle cx="178" cy="110" r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                        <circle cx="258" cy="105" r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                        <circle cx="338" cy="100" r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                      </svg>
                    </div>
                    
                    {/* X axis labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', paddingLeft: '40px', marginTop: '8px', fontSize: '10px', color: '#8b92a5' }}>
                      <span>اسفند ۱۴۰۲</span>
                      <span>فروردین ۱۴۰۳</span>
                      <span>اردیبهشت ۱۴۰۳</span>
                      <span>خرداد ۱۴۰۳</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#c4c8d4' }}>
                        <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px' }} /> دریافتی
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#c4c8d4' }}>
                        <span style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '2px' }} /> پرداختی
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#c4c8d4' }}>
                        <span style={{ width: '10px', height: '2px', backgroundColor: '#3b82f6', display: 'inline-block' }} /> خط سود خالص
                      </span>
                    </div>
                  </div>

                  {/* Expense categories breakdown */}
                  <div className={styles.finChartCard}>
                    <h3 className={styles.finChartTitle}>{AdminIcons.bag(16)} تفکیک مخارج کارگو و شرکت</h3>
                    
                    <div className={styles.finBreakdownList}>
                      {/* Cost 1 */}
                      <div className={styles.finBreakdownItem}>
                        <div className={styles.finBreakdownHeader}>
                          <span className={styles.finBreakdownName}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f87820' }} /> تامین کالا و خرید
                          </span>
                          <span className={styles.finBreakdownVal}>۵۵٪</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div className={styles.progressBarFill} style={{ width: '55%', backgroundColor: '#f87820' }} />
                        </div>
                      </div>

                      {/* Cost 2 */}
                      <div className={styles.finBreakdownItem}>
                        <div className={styles.finBreakdownHeader}>
                          <span className={styles.finBreakdownName}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} /> حمل و نقل و ترخیص (کارگو)
                          </span>
                          <span className={styles.finBreakdownVal}>۲۵٪</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div className={styles.progressBarFill} style={{ width: '25%', backgroundColor: '#10b981' }} />
                        </div>
                      </div>

                      {/* Cost 3 */}
                      <div className={styles.finBreakdownItem}>
                        <div className={styles.finBreakdownHeader}>
                          <span className={styles.finBreakdownName}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} /> ملزومات اداری و دفتری
                          </span>
                          <span className={styles.finBreakdownVal}>۱۲٪</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div className={styles.progressBarFill} style={{ width: '12%', backgroundColor: '#3b82f6' }} />
                        </div>
                      </div>

                      {/* Cost 4 */}
                      <div className={styles.finBreakdownItem}>
                        <div className={styles.finBreakdownHeader}>
                          <span className={styles.finBreakdownName}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }} /> تبلیغات و مارکتینگ
                          </span>
                          <span className={styles.finBreakdownVal}>۸٪</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div className={styles.progressBarFill} style={{ width: '8%', backgroundColor: '#a855f7' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Periodic Summary Table */}
                <div style={{ marginTop: '24px', background: '#11131a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>تراز عملکرد دوره‌های مالی</h3>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table className={styles.adminTable}>
                      <thead>
                        <tr>
                          <th>دوره مالی</th>
                          <th>مجموع ورودی (دریافتی)</th>
                          <th>مجموع خروجی (پرداختی)</th>
                          <th>سود ناخالص</th>
                          <th>وضعیت دوره</th>
                          <th>گزارشات</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 'bold', color: '#fff' }}>خرداد ۱۴۰۳ (جاری)</td>
                          <td style={{ color: '#10b981', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۲,۱۴۵,۵۰۰,۰۰۰ تومان</td>
                          <td style={{ color: '#ef4444', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۱,۲۴۵,۳۰۰,۰۰۰ تومان</td>
                          <td style={{ color: '#3b82f6', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۹۰۰,۲۰۰,۰۰۰ تومان</td>
                          <td>
                            <span style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '9px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                              در حال محاسبه
                            </span>
                          </td>
                          <td>
                            <span onClick={() => alert('گزارش کامل خرداد ماه دانلود شد.')} className={styles.downloadActionLink} style={{ fontSize: '11.5px' }}>
                              {AdminIcons.download(11)} دانلود گزارش (CSV)
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 'bold', color: '#fff' }}>اردیبهشت ۱۴۰۳</td>
                          <td style={{ color: '#10b981', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۱,۹۸۰,۰۰۰,۰۰۰ تومان</td>
                          <td style={{ color: '#ef4444', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۱,۱۲۰,۰۰۰,۰۰۰ تومان</td>
                          <td style={{ color: '#3b82f6', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۸۶۰,۰۰۰,۰۰۰ تومان</td>
                          <td>
                            <span style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '9px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                              بسته شده
                            </span>
                          </td>
                          <td>
                            <span onClick={() => alert('گزارش کامل اردیبهشت ماه دانلود شد.')} className={styles.downloadActionLink} style={{ fontSize: '11.5px' }}>
                              {AdminIcons.download(11)} دانلود گزارش (CSV)
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 'bold', color: '#fff' }}>فروردین ۱۴۰۳</td>
                          <td style={{ color: '#10b981', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۱,۷۵۰,۰۰۰,۰۰۰ تومان</td>
                          <td style={{ color: '#ef4444', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۹۵۰,۰۰۰,۰۰۰ تومان</td>
                          <td style={{ color: '#3b82f6', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۸۰۰,۰۰۰,۰۰۰ تومان</td>
                          <td>
                            <span style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '9px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                              بسته شده
                            </span>
                          </td>
                          <td>
                            <span onClick={() => alert('گزارش کامل فروردین ماه دانلود شد.')} className={styles.downloadActionLink} style={{ fontSize: '11.5px' }}>
                              {AdminIcons.download(11)} دانلود گزارش (CSV)
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 'bold', color: '#fff' }}>اسفند ۱۴۰۲</td>
                          <td style={{ color: '#10b981', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۱,۶۲۰,۰۰۰,۰۰۰ تومان</td>
                          <td style={{ color: '#ef4444', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۸۸۰,۰۰۰,۰۰۰ تومان</td>
                          <td style={{ color: '#3b82f6', fontWeight: 'bold', fontFamily: 'var(--font-vazirmatn)' }}>۷۴۰,۰۰۰,۰۰۰ تومان</td>
                          <td>
                            <span style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '9px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                              بسته شده
                            </span>
                          </td>
                          <td>
                            <span onClick={() => alert('گزارش کامل اسفند ماه دانلود شد.')} className={styles.downloadActionLink} style={{ fontSize: '11.5px' }}>
                              {AdminIcons.download(11)} دانلود گزارش (CSV)
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* TAB: SECURITY SETTINGS */}
          {activeTab === 'settings' && (() => {
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
              <div style={{ direction: 'rtl' }}>
                {/* Page Title */}
                <div style={{ marginBottom: '24px' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {AdminIcons.settings(22)} تنظیمات
                  </h1>
                  <p style={{ fontSize: '12px', color: '#8b92a5', margin: 0 }}>مدیریت تنظیمات کلی سیستم دبی خرید</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', alignItems: 'start' }}>

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
                                onChange={e => setLocalGeneral(p => ({ ...p, googleAuthMode: e.target.value }))}
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
                                onChange={e => setLocalGeneral(p => ({ ...p, googleClientId: e.target.value }))}
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
                        <SaveBtn onClick={() => { updateSiteCtxSettings(siteSettings); alert('اطلاعات تماس با موفقیت ذخیره شد.'); }} />
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
                              <span style={{ fontSize: '38px', fontWeight: '900', color: '#f87820' }}>{Number(siteSettings.aedRate || 19500).toLocaleString()}</span>
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
                              <div>۱۰۰ درهم: <span style={{ color: '#fff' }}>{(100 * Number(siteSettings.aedRate || 19500)).toLocaleString()} ت</span></div>
                              <div>۵۰۰ درهم: <span style={{ color: '#fff' }}>{(500 * Number(siteSettings.aedRate || 19500)).toLocaleString()} ت</span></div>
                              <div>۱,۰۰۰ درهم: <span style={{ color: '#fff' }}>{(1000 * Number(siteSettings.aedRate || 19500)).toLocaleString()} ت</span></div>
                              <div>۵,۰۰۰ درهم: <span style={{ color: '#fff' }}>{(5000 * Number(siteSettings.aedRate || 19500)).toLocaleString()} ت</span></div>
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
                              <option value="auto" style={{ background: '#1a1d26' }}>بروزرسانی خودکار (Automatic)</option>
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
                            onClick={() => {
                              updateSiteCtxSettings(siteSettings);
                              alert('نرخ درهم و تنظیمات بروزرسانی ذخیره شد.');
                            }}
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
                                setSiteSettings(p => ({ ...p, aedRate: res.aedRate, aedLastUpdate: res.aedLastUpdate }));
                                alert(`نرخ درهم به صورت آنلاین بروزرسانی شد: ${Number(res.aedRate).toLocaleString()} تومان`);
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
                            value={siteSettings.shippingPerKgAed || '40'}
                            onChange={e => setSiteSettings(p => ({ ...p, shippingPerKgAed: e.target.value }))}
                            type="number"
                          />
                          <Field
                            label="درصد کارمزد خرید (%)"
                            value={siteSettings.commissionPercent || '25'}
                            onChange={e => setSiteSettings(p => ({ ...p, commissionPercent: e.target.value }))}
                            type="number"
                          />
                          <Field
                            label="حداقل وزن قابل محاسبه (کیلوگرم)"
                            value={siteSettings.minWeightClass || '1'}
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
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#2ecc71', marginBottom: '8px' }}>مثال‌های محاسبه ارسال (با نرخ {siteSettings.shippingPerKgAed || '40'} AED)</div>
                          <div style={{ fontSize: '11.5px', color: '#c0c8d8', lineHeight: '1.8' }}>
                            <div>کالای ۰.۳ کیلوگرم (گرد شده به ۱ کیلو) = <strong>{(1 * Number(siteSettings.shippingPerKgAed || 40))} AED</strong></div>
                            <div>کالای ۱.۳ کیلوگرم (گرد شده به ۲ کیلو) = <strong>{(2 * Number(siteSettings.shippingPerKgAed || 40))} AED</strong></div>
                            <div>کالای ۲.۱ کیلوگرم (گرد شده به ۳ کیلو) = <strong>{(3 * Number(siteSettings.shippingPerKgAed || 40))} AED</strong></div>
                          </div>
                        </div>

                        <SaveBtn label="ذخیره تنظیمات" onClick={() => { updateSiteCtxSettings(siteSettings); alert('تنظیمات ارسال و کارمزد با موفقیت ذخیره شد.'); }} />
                      </div>
                    )}

                    {/* ── مدیریت سایت ── */}
                    {/* ── مدیریت سایت ── */}
                    {settingsTab === 'site' && (
                      <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 24px 0', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          مدیریت محتوای سایت
                        </h2>

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

                        {/* Change Password */}
                        <div style={{ marginBottom: '32px' }}>
                          <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#c0c8d8', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>{AdminIcons.lock(13)} تغییر رمز عبور ادمین</h3>
                          {passwordChangeSuccess && <div style={{ padding: '10px 14px', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.2)', borderRadius: '8px', color: '#2ecc71', fontSize: '12px', marginBottom: '16px' }}>رمز عبور با موفقیت تغییر یافت.</div>}
                          {passwordChangeError && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>{passwordChangeError}</div>}
                          <form onSubmit={handlePasswordChange} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>
                            <Field label="رمز عبور فعلی" value={passForm.oldPass} onChange={e => setPassForm(p => ({ ...p, oldPass: e.target.value }))} type="password" />
                            <Field label="رمز عبور جدید" value={passForm.newPass} onChange={e => setPassForm(p => ({ ...p, newPass: e.target.value }))} type="password" />
                            <Field label="تکرار رمز عبور جدید" value={passForm.confirmPass} onChange={e => setPassForm(p => ({ ...p, confirmPass: e.target.value }))} type="password" />
                            <div style={{ gridColumn: '1 / -1' }}>
                              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', borderRadius: '10px', background: '#f87820', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                                {AdminIcons.check(13)} تغییر رمز عبور
                              </button>
                            </div>
                          </form>
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
                        <SaveBtn onClick={() => { updateSiteCtxSettings(siteSettings); alert('تنظیمات اعلان‌ها با موفقیت ذخیره شد.'); }} />
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })()}

        </main>
      </div>
    </div>
  );
}

// Top-level setting input field component to prevent focus unmounting bugs
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

// Top-level setting toggle component
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

// Top-level setting save button component
const SaveBtn = ({ onClick, label = 'ذخیره تغییرات' }) => (
  <button
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', borderRadius: '10px', background: '#f87820', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '24px', transition: 'opacity 0.2s' }}
    onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
    onMouseOut={e => e.currentTarget.style.opacity = '1'}
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    {label}
  </button>
);
