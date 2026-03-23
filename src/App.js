import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';

// ============================================
// FIREBASE SETUP
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyAcyNl3C0Kz8X1vNwxqOaXPKCwN6y0KohQ",
  authDomain: "reg-0000.firebaseapp.com",
  projectId: "reg-0000",
  storageBucket: "reg-0000.firebasestorage.app",
  messagingSenderId: "665648288348",
  appId: "1:665648288348:web:3c700b45a3f417b6218c99"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ============================================
// QUOTARY COLOUR PALETTE
// ============================================
// Ink #1B2A3B — primary text, dark surfaces
// Oxford #2C4A6E — primary brand colour, links, accents
// Brass #B5863A — warm accent, author names (dark mode)
// Verdigris #7A9E7E — secondary accent, subtle highlights
// Page #F5F2ED — light mode background
// Binding #141E29 — dark mode background
// Vellum #E8DFD0 — card surfaces, tags
// Border #D8D0C4 — dividers and outlines

const THEMES = {
  light: {
    background: '#F5F2ED',
    surface: '#FFFFFF',
    surfaceHover: '#F0EDE7',
    accent: '#2C4A6E',
    accentLight: '#E8EEF5',
    accentText: '#2C4A6E',
    brass: '#946F2E',
    verdigris: '#7A9E7E',
    verdigrisLight: '#EDF3EE',
    text: '#1B2A3B',
    textMuted: '#5A6A7A',
    textLight: '#8A95A2',
    border: '#D8D0C4',
    borderLight: '#E8E1D7',
    vellum: '#E8DFD0',
    headerBg: '#F5F2ED',
    headerBorder: '#D8D0C4',
    danger: '#B04040',
    dangerBg: '#F5EDED',
  },
  dark: {
    background: '#141E29',
    surface: '#1C2836',
    surfaceHover: '#243244',
    accent: '#5B8ABF',
    accentLight: '#1E2E42',
    accentText: '#7BA3CC',
    brass: '#B5863A',
    verdigris: '#7A9E7E',
    verdigrisLight: '#1E2E28',
    text: '#E0D8CE',
    textMuted: '#8A95A2',
    textLight: '#5A6A7A',
    border: '#2A3A4D',
    borderLight: '#1E2E3E',
    vellum: '#2A3444',
    headerBg: '#141E29',
    headerBorder: '#2A3A4D',
    danger: '#C05050',
    dangerBg: '#2A1E1E',
  }
};

// ============================================
// FONT FAMILIES
// Serif for headings and quote bodies
// Sans-serif for metadata, labels, UI chrome
// ============================================

const FONTS = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

// ============================================
// BIBLE DATA — all 66 books with verse counts
// ============================================

const BIBLE_DATA = {
  "Genesis": [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26],
  "Exodus": [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38],
  "Leviticus": [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],
  "Numbers": [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13],
  "Deuteronomy": [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12],
  "Joshua": [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33],
  "Judges": [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25],
  "Ruth": [22,23,17,22],
  "1 Samuel": [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13],
  "2 Samuel": [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25],
  "1 Kings": [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53],
  "2 Kings": [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30],
  "1 Chronicles": [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30],
  "2 Chronicles": [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23],
  "Ezra": [11,70,13,24,17,22,28,36,15,44],
  "Nehemiah": [11,20,32,23,19,19,73,18,38,39,36,47,31],
  "Esther": [22,23,15,17,14,14,10,17,32,3],
  "Job": [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17],
  "Psalms": [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6],
  "Proverbs": [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31],
  "Ecclesiastes": [18,26,22,16,20,12,29,17,18,20,10,14],
  "Song of Solomon": [17,17,11,16,16,13,13,14],
  "Isaiah": [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],
  "Jeremiah": [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34],
  "Lamentations": [22,22,66,22,22],
  "Ezekiel": [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35],
  "Daniel": [21,49,30,37,31,28,28,27,27,21,45,13],
  "Hosea": [11,23,5,19,15,11,16,14,17,15,12,14,16,9],
  "Joel": [20,32,21],
  "Amos": [15,16,15,13,27,14,17,14,15],
  "Obadiah": [21],
  "Jonah": [17,10,10,11],
  "Micah": [16,13,12,13,15,16,20],
  "Nahum": [15,13,19],
  "Habakkuk": [17,20,19],
  "Zephaniah": [18,15,20],
  "Haggai": [15,23],
  "Zechariah": [21,13,10,14,11,15,14,23,17,12,17,14,9,21],
  "Malachi": [14,17,18,6],
  "Matthew": [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20],
  "Mark": [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20],
  "Luke": [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53],
  "John": [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25],
  "Acts": [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31],
  "Romans": [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27],
  "1 Corinthians": [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24],
  "2 Corinthians": [24,17,18,18,21,18,16,24,15,18,33,21,14],
  "Galatians": [24,21,29,31,26,18],
  "Ephesians": [23,22,21,32,33,24],
  "Philippians": [30,30,21,23],
  "Colossians": [29,23,25,18],
  "1 Thessalonians": [10,20,13,18,28],
  "2 Thessalonians": [12,17,18],
  "1 Timothy": [20,15,16,16,25,21],
  "2 Timothy": [18,26,17,22],
  "Titus": [16,15,15],
  "Philemon": [25],
  "Hebrews": [14,18,19,16,14,20,28,13,28,39,40,29,25],
  "James": [27,26,18,17,20],
  "1 Peter": [25,25,22,19,14],
  "2 Peter": [21,22,18],
  "1 John": [10,29,24,21,21],
  "2 John": [13],
  "3 John": [14],
  "Jude": [25],
  "Revelation": [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21]
};

const BIBLE_BOOKS = Object.keys(BIBLE_DATA);

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Haptic feedback for mobile
const haptic = (style = 'light') => {
  if (navigator.vibrate) {
    navigator.vibrate(style === 'success' ? [10, 50, 20] : 10);
  }
};

// Format a verse object into a readable string like "Romans 8:1"
const formatVerseRef = (verse) => {
  if (!verse.book) return '';
  let ref = verse.book;
  if (verse.chapter) {
    ref += ` ${verse.chapter}`;
    if (verse.verse) {
      ref += `:${verse.verse}`;
    }
  }
  return ref;
};

// Quotary's encouraging messages
const QUOTARY_MESSAGES = {
  emptyState: [
    "Every great library begins with a single quote. What wisdom shall we preserve first?",
    "Ready when you are! Let's start collecting those gems you've discovered in your reading.",
    "Pull up a chair, friend. Let's build your treasury of wisdom together.",
  ],
  noResults: [
    "Hmm, couldn't find that one. Perhaps try different words?",
    "No matches yet — shall we try another search?",
    "That's a tricky one! I've looked high and low but no luck.",
  ],
  surprise: [
    "Ah, I thought you might enjoy this one...",
    "Here's a gem from your collection — remember this?",
    "Let me pull something special off the shelf for you.",
    "I've always been fond of this one.",
    "Sometimes the right words find you at just the right moment.",
  ],
};

const getRandomMessage = (type) => {
  const messages = QUOTARY_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
};

// CSV export — creates and downloads a CSV file from an array of entries
const exportToCSV = (entries, filename) => {
  const escapeCSV = (str) => {
    if (!str) return '""';
    return '"' + String(str).replace(/"/g, '""') + '"';
  };

  const headers = ['Quote', 'Author', 'Source', 'Page', 'Notes', 'Bible References', 'Tags', 'Date Added'];
  const rows = entries.map(entry => {
    const verseRefs = (entry.verses || []).map(formatVerseRef).filter(Boolean).join(' | ');
    const tags = (entry.tags || []).join(' | ');
    const dateAdded = entry.addedAt ? new Date(entry.addedAt).toLocaleDateString('en-GB') : '';
    return [
      escapeCSV(entry.quote),
      escapeCSV(entry.author),
      escapeCSV(entry.source),
      escapeCSV(entry.page),
      escapeCSV(entry.notes),
      escapeCSV(verseRefs),
      escapeCSV(tags),
      escapeCSV(dateAdded),
    ].join(',');
  });

  const csvContent = [headers.map(h => escapeCSV(h)).join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================
// THEME HOOK — handles light, dark, and system
// ============================================

const useTheme = () => {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('reg-theme') || 'system';
  });
  
  const [resolvedTheme, setResolvedTheme] = useState('light');

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (themeMode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(prefersDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(themeMode);
      }
    };

    updateResolvedTheme();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateResolvedTheme);
    
    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('reg-theme', themeMode);
  }, [themeMode]);

  const colors = THEMES[resolvedTheme];
  
  return { themeMode, setThemeMode, resolvedTheme, colors };
};

// ============================================
// NAV BAR ICONS
// ============================================

const HomeIcon = ({ color, size = 24 }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const LibraryIcon = ({ color, size = 24 }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

const SermonsIcon = ({ color, size = 24 }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const SettingsIcon = ({ color, size = 24 }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const PlusIcon = ({ color, size = 28 }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

// ============================================
// SIGN IN SCREEN
// ============================================

const SignInScreen = ({ onSignIn, loading, colors }) => {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: colors.background, fontFamily: FONTS.sans }}
    >
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 
            className="text-3xl mb-2"
            style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400 }}
          >
            Quotary
          </h1>
          <p className="text-sm" style={{ color: colors.textMuted, fontWeight: 400 }}>
            Your personal quote companion
          </p>
        </div>

        <div 
          className="p-6 rounded-xl mb-8"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <p 
            className="text-base leading-relaxed mb-4"
            style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400 }}
          >
            Save quotes from books and commentaries, tag them to Bible verses, 
            and find exactly the right words when preparing your sermons.
          </p>
          <p className="text-sm" style={{ color: colors.textMuted, fontWeight: 400 }}>
            Your quotes are private and sync across all your devices.
          </p>
        </div>

        <button
          onClick={() => { haptic('success'); onSignIn(); }}
          disabled={loading}
          className="w-full py-4 px-6 rounded-xl text-base transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          style={{ backgroundColor: colors.accent, color: '#ffffff', fontWeight: 500 }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ============================================
// USER MENU — sign out only
// ============================================

const UserMenu = ({ user, onSignOut, isOpen, onClose, colors }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-12 z-50 py-2 rounded-xl min-w-52"
        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
          <p className="text-sm" style={{ color: colors.text, fontWeight: 500 }}>{user?.displayName}</p>
          <p className="text-xs" style={{ color: colors.textMuted, fontWeight: 400 }}>{user?.email}</p>
        </div>
        <button onClick={() => { haptic(); onSignOut(); onClose(); }}
          className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors text-sm"
          style={{ color: colors.danger, fontWeight: 400 }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          Sign out
        </button>
      </div>
    </>
  );
};

// ============================================
// HEADER — app name + user avatar
// ============================================

const Header = ({ user, onSignOut, colors }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 px-4 py-3 border-b"
      style={{ backgroundColor: colors.headerBg, borderColor: colors.headerBorder, fontFamily: FONTS.sans }}>
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <h1 className="text-xl" style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400 }}>Quotary</h1>
        <div className="relative">
          <button onClick={() => { haptic(); setMenuOpen(!menuOpen); }} className="p-1 rounded-full" aria-label="User menu">
            <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=2C4A6E&color=ffffff`}
              alt={user?.displayName || 'User'} className="w-9 h-9 rounded-full" style={{ border: `1px solid ${colors.border}` }} />
          </button>
          <UserMenu user={user} onSignOut={onSignOut} isOpen={menuOpen} onClose={() => setMenuOpen(false)} colors={colors} />
        </div>
      </div>
    </header>
  );
};

// ============================================
// FLOATING NAV BAR — bottom pill, icons only
// ============================================

const FloatingNavBar = ({ currentScreen, onNavigate, onAdd, colors }) => {
  const navItems = [
    { id: 'home', label: 'Home', Icon: HomeIcon },
    { id: 'library', label: 'Library', Icon: LibraryIcon },
    { id: 'add', label: 'Add', Icon: PlusIcon },
    { id: 'sermons', label: 'Sermons', Icon: SermonsIcon },
    { id: 'settings', label: 'Settings', Icon: SettingsIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pointer-events-none">
      <nav className="flex items-center gap-1 px-4 py-2.5 rounded-full pointer-events-auto"
        style={{ backgroundColor: colors.surface, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: `1px solid ${colors.border}` }}>
        {navItems.map(({ id, label, Icon }) => {
          const isAdd = id === 'add';
          const isActive = !isAdd && currentScreen === id;
          const iconColor = isAdd ? colors.accent : isActive ? colors.accent : colors.textLight;
          const iconSize = isAdd ? 28 : 22;
          return (
            <button key={id} onClick={() => { haptic(); if (isAdd) onAdd(); else onNavigate(id); }}
              className="flex items-center justify-center transition-all duration-200 active:scale-90"
              style={{ width: isAdd ? 52 : 48, height: 44 }} aria-label={label}>
              <Icon color={iconColor} size={iconSize} />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// ============================================
// SEARCH BAR
// ============================================

const SearchBar = ({ searchQuery, setSearchQuery, colors }) => (
  <div className="px-4 py-3" style={{ backgroundColor: colors.background }}>
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={colors.textLight} strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input type="text" placeholder="Search quotes, verses, authors, tags..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: colors.text, fontFamily: FONTS.sans, fontWeight: 400 }} />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="p-1 rounded-full" style={{ color: colors.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  </div>
);

// ============================================
// EMPTY STATE
// ============================================

const EmptyState = ({ onAddEntry, hasSearch, colors }) => {
  if (hasSearch) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <svg className="w-10 h-10 mb-4" fill="none" stroke={colors.textLight} strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <h3 className="text-lg mb-2" style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400 }}>No matches found</h3>
        <p className="text-sm max-w-xs" style={{ color: colors.textMuted, fontWeight: 400 }}>{getRandomMessage('noResults')}</p>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <h3 className="text-xl mb-2" style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400 }}>Your library awaits</h3>
      <p className="text-sm max-w-sm mb-6 leading-relaxed" style={{ color: colors.textMuted, fontWeight: 400 }}>{getRandomMessage('emptyState')}</p>
      <button onClick={() => { haptic('success'); onAddEntry(); }}
        className="py-3 px-5 rounded-xl text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
        style={{ backgroundColor: colors.accent, color: '#ffffff', fontWeight: 500 }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add your first quote
      </button>
    </div>
  );
};

// ============================================
// ENTRY CARD — a single quote in a list
// ============================================

const EntryCard = ({ entry, onClick, onAddToSermon, colors }) => {
  const verseRefs = entry.verses?.map(formatVerseRef).filter(Boolean).join(', ');
  return (
    <div className="w-full text-left p-5 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <button onClick={() => { haptic(); onClick(); }} className="w-full text-left">
        {/* Quote text — serif */}
        <p className="text-base mb-3 line-clamp-3 leading-relaxed"
          style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400 }}>
          "{entry.quote}"
        </p>
        {/* Author — Oxford in light, Brass in dark */}
        <p className="text-sm mb-3" style={{ fontFamily: FONTS.sans, fontWeight: 500 }}>
          <span style={{ color: colors.accent }}>{entry.author}</span>
          {entry.source && <span style={{ color: colors.textMuted, fontWeight: 400 }}> · {entry.source}</span>}
        </p>
      </button>
      {/* Tags and sermon button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {verseRefs && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs"
              style={{ backgroundColor: colors.verdigrisLight, color: colors.verdigris, fontFamily: FONTS.sans, fontWeight: 500 }}>
              {verseRefs}
            </span>
          )}
          {entry.tags?.map((tag, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full text-xs"
              style={{ backgroundColor: colors.vellum, color: colors.textMuted, fontFamily: FONTS.sans, fontWeight: 500 }}>
              {tag}
            </span>
          ))}
        </div>
        {onAddToSermon && (
          <button onClick={(e) => { e.stopPropagation(); haptic(); onAddToSermon(entry); }}
            className="flex-shrink-0 p-1.5 rounded-lg transition-colors" style={{ color: colors.textLight }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.textLight} aria-label="Add to sermon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// SURPRISE ME — full-screen random quote card
// ============================================

const SurpriseQuote = ({ entry, onAnother, onClose, colors }) => {
  if (!entry) return null;
  const verseRefs = entry.verses?.map(formatVerseRef).filter(Boolean).join(', ');
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: colors.background, fontFamily: FONTS.sans }}>
      <div className="max-w-lg w-full">
        <p className="text-sm text-center mb-6" style={{ color: colors.textMuted, fontStyle: 'italic', fontWeight: 400 }}>
          {getRandomMessage('surprise')}
        </p>
        <div className="p-8 rounded-xl mb-8" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-xl leading-relaxed mb-6"
            style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400, fontStyle: 'italic' }}>
            "{entry.quote}"
          </p>
          <p className="text-base mb-4" style={{ fontWeight: 500 }}>
            <span style={{ color: colors.accent }}>{entry.author}</span>
            {entry.source && <span style={{ color: colors.textMuted, fontWeight: 400 }}> · {entry.source}</span>}
          </p>
          {verseRefs && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm"
              style={{ backgroundColor: colors.verdigrisLight, color: colors.verdigris, fontWeight: 500 }}>
              {verseRefs}
            </span>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { haptic(); onAnother(); }}
            className="py-3 px-6 rounded-xl text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: colors.accent, color: '#ffffff', fontWeight: 500 }}>
            Show me another
          </button>
          <button onClick={() => { haptic(); onClose(); }}
            className="py-3 px-6 rounded-xl text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, fontWeight: 500 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ENTRY LIST — home screen quote feed
// ============================================

const EntryList = ({ entries, onSelectEntry, searchQuery, onAddEntry, onAddToSermon, onSurpriseMe, colors }) => {
  const filteredEntries = entries.filter(entry => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return entry.quote?.toLowerCase().includes(q) || entry.author?.toLowerCase().includes(q) ||
      entry.source?.toLowerCase().includes(q) || entry.notes?.toLowerCase().includes(q) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(q)) ||
      entry.verses?.some(v => formatVerseRef(v).toLowerCase().includes(q));
  });

  if (entries.length === 0) return <EmptyState onAddEntry={onAddEntry} hasSearch={false} colors={colors} />;
  if (filteredEntries.length === 0) return <EmptyState onAddEntry={onAddEntry} hasSearch={true} colors={colors} />;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: '100px' }}>
      <div className="max-w-2xl mx-auto space-y-3">
        {!searchQuery.trim() && entries.length > 0 && (
          <button onClick={() => { haptic(); onSurpriseMe(); }}
            className="w-full p-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
            style={{ backgroundColor: colors.surface, border: `1px dashed ${colors.border}`, color: colors.textMuted, fontFamily: FONTS.sans, fontWeight: 500, fontSize: '0.875rem' }}>
            ✦ Surprise me
          </button>
        )}
        {filteredEntries.map(entry => (
          <EntryCard key={entry.id} entry={entry} onClick={() => onSelectEntry(entry)} onAddToSermon={onAddToSermon} colors={colors} />
        ))}
      </div>
    </div>
  );
};

// ============================================
// VERSE SELECTOR — book / chapter / verse dropdowns
// ============================================

const VerseSelector = ({ verse, onChange, onRemove, canRemove, colors }) => {
  const [chaptersAvailable, setChaptersAvailable] = useState([]);
  const [versesAvailable, setVersesAvailable] = useState([]);

  useEffect(() => {
    if (verse.book && BIBLE_DATA[verse.book]) setChaptersAvailable(Array.from({ length: BIBLE_DATA[verse.book].length }, (_, i) => i + 1));
    else setChaptersAvailable([]);
  }, [verse.book]);

  useEffect(() => {
    if (verse.book && verse.chapter && BIBLE_DATA[verse.book]) setVersesAvailable(Array.from({ length: BIBLE_DATA[verse.book][verse.chapter - 1] }, (_, i) => i + 1));
    else setVersesAvailable([]);
  }, [verse.book, verse.chapter]);

  const selectStyle = { backgroundColor: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontFamily: FONTS.sans, fontWeight: 400 };

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 grid grid-cols-3 gap-2">
        <select value={verse.book || ''} onChange={(e) => onChange({ book: e.target.value || null, chapter: null, verse: null })}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={selectStyle}>
          <option value="">Book</option>
          {BIBLE_BOOKS.map(book => (<option key={book} value={book}>{book}</option>))}
        </select>
        <select value={verse.chapter || ''} onChange={(e) => onChange({ ...verse, chapter: e.target.value ? parseInt(e.target.value) : null, verse: null })}
          disabled={!verse.book} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none disabled:opacity-50" style={selectStyle}>
          <option value="">Ch</option>
          {chaptersAvailable.map(ch => (<option key={ch} value={ch}>{ch}</option>))}
        </select>
        <select value={verse.verse || ''} onChange={(e) => onChange({ ...verse, verse: e.target.value ? parseInt(e.target.value) : null })}
          disabled={!verse.chapter} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none disabled:opacity-50" style={selectStyle}>
          <option value="">Vs</option>
          {versesAvailable.map(v => (<option key={v} value={v}>{v}</option>))}
        </select>
      </div>
      {canRemove && (
        <button type="button" onClick={onRemove} className="p-2 rounded-lg" style={{ color: colors.textMuted }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ============================================
// TAG INPUT
// ============================================

const TagInput = ({ tags, setTags, colors }) => {
  const [inputValue, setInputValue] = useState('');
  const addTag = () => { const tag = inputValue.trim(); if (tag && !tags.includes(tag)) { setTags([...tags, tag]); setInputValue(''); } };
  const removeTag = (t) => setTags(tags.filter(x => x !== t));
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="Type a tag and press Enter" className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontFamily: FONTS.sans, fontWeight: 400 }} />
        <button type="button" onClick={addTag} className="px-4 py-2 rounded-lg text-sm"
          style={{ backgroundColor: colors.accentLight, color: colors.accent, fontWeight: 500 }}>Add</button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
              style={{ backgroundColor: colors.vellum, color: colors.text, fontWeight: 500 }}>
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// PHOTO SCAN MODAL — extract highlighted text from a photo
// ============================================

const compressImage = (dataUrl) => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => {
    const MAX = 1568;
    let { width, height } = img;
    if (width > MAX || height > MAX) {
      if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
      else { width = Math.round(width * MAX / height); height = MAX; }
    }
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    const compressed = canvas.toDataURL('image/jpeg', 0.85);
    const data = compressed.split(',')[1];
    resolve({ data, type: 'image/jpeg' });
  };
  img.src = dataUrl;
});

const PhotoScanModal = ({ onExtracted, onClose, colors }) => {
  const [imageData, setImageData] = useState(null);
  const [imageType, setImageType] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target.result;
      const [header, data] = result.split(',');
      const type = header.match(/:(.*?);/)[1];
      setImageData(data);
      setImageType(type);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imageData) return;
    setScanning(true);
    setScanStatus('Loading text recognition...');
    setError(null);
    try {
      const { data: compressedData, type: compressedType } = await compressImage(`data:${imageType};base64,${imageData}`);
      const worker = await window.Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') setScanStatus('Scanning...');
        },
      });
      const { data: { text } } = await worker.recognize(`data:${compressedType};base64,${compressedData}`);
      await worker.terminate();
      const trimmed = text.trim();
      if (!trimmed) {
        setError('No text detected. Try a clearer photo or better lighting.');
      } else {
        onExtracted(trimmed);
      }
    } catch (err) {
      setError(err.message || 'Failed to scan. Please try again.');
    }
    setScanning(false);
    setScanStatus('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: colors.background, fontFamily: FONTS.sans }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.headerBg, borderColor: colors.headerBorder }}>
        <button onClick={onClose} className="p-2 -ml-2 rounded-lg" style={{ color: colors.text }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400, fontSize: '1.125rem' }}>Scan photo</h2>
        <div className="w-10" />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-5">
          <p className="text-sm" style={{ color: colors.textMuted, fontWeight: 400 }}>Text from your photo will be extracted — crop to just the passage you want for best results.</p>
          {!imageData ? (
            <label className="flex flex-col items-center justify-center w-full p-10 rounded-xl border-2 border-dashed cursor-pointer"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              <svg className="w-10 h-10 mb-3" fill="none" stroke={colors.textLight} strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              <p className="text-sm" style={{ color: colors.text, fontWeight: 500 }}>Take a photo or choose an image</p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted, fontWeight: 400 }}>Tap to open camera</p>
            </label>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
                <img src={`data:${imageType};base64,${imageData}`} alt="Page to scan" className="w-full h-auto max-h-72 object-contain" style={{ backgroundColor: colors.surface }} />
              </div>
              <button type="button" onClick={() => { setImageData(null); setImageType(null); setError(null); }}
                className="text-sm" style={{ color: colors.accent, fontWeight: 500 }}>Use a different photo</button>
            </div>
          )}
          {error && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: colors.dangerBg }}>
              <p className="text-sm" style={{ color: colors.danger, fontWeight: 400 }}>{error}</p>
            </div>
          )}
          {imageData && (
            <button type="button" onClick={handleScan} disabled={scanning}
              className="w-full py-3 rounded-xl text-sm disabled:opacity-50"
              style={{ backgroundColor: colors.accent, color: '#ffffff', fontWeight: 500 }}>
              {scanning ? (scanStatus || 'Scanning...') : 'Extract text from photo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// ENTRY FORM — add or edit a quote
// ============================================

const EntryForm = ({ entry, onSave, onSaveAndContinue, onClose, onDelete, colors }) => {
  const [quote, setQuote] = useState(entry?.quote || '');
  const [author, setAuthor] = useState(entry?.author || '');
  const [source, setSource] = useState(entry?.source || '');
  const [page, setPage] = useState(entry?.page || '');
  const [notes, setNotes] = useState(entry?.notes || '');
  const [verses, setVerses] = useState(entry?.verses?.length ? entry.verses : [{ book: null, chapter: null, verse: null }]);
  const [tags, setTags] = useState(entry?.tags || []);
  const [saving, setSaving] = useState(false);
  const [savingAnother, setSavingAnother] = useState(false);
  const [savedAnother, setSavedAnother] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPhotoScan, setShowPhotoScan] = useState(false);
  const isEditing = !!entry?.id;
  const updateVerse = (index, nv) => { const v = [...verses]; v[index] = nv; setVerses(v); };

  const handleSubmit = async (e) => {
    e.preventDefault(); if (!quote.trim() || !author.trim()) return;
    setSaving(true); haptic('success');
    await onSave({ quote: quote.trim(), author: author.trim(), source: source.trim(), page: page.trim(), notes: notes.trim(), verses: verses.filter(v => v.book), tags });
    setSaving(false);
  };

  const handleSaveAnother = async () => {
    if (!quote.trim() || !author.trim()) return;
    setSavingAnother(true); haptic('success');
    await onSaveAndContinue({ quote: quote.trim(), author: author.trim(), source: source.trim(), page: page.trim(), notes: notes.trim(), verses: verses.filter(v => v.book), tags });
    setSavingAnother(false);
    setSavedAnother(true);
    setQuote('');
    setPage('');
    setNotes('');
    setVerses([{ book: null, chapter: null, verse: null }]);
    setTimeout(() => setSavedAnother(false), 1500);
  };

  const inputStyle = { backgroundColor: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontFamily: FONTS.sans, fontWeight: 400 };
  const labelStyle = { color: colors.text, fontFamily: FONTS.sans, fontWeight: 500, fontSize: '0.875rem' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: colors.background, fontFamily: FONTS.sans }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.headerBg, borderColor: colors.headerBorder }}>
        <button onClick={() => { haptic(); onClose(); }} className="p-2 -ml-2 rounded-lg" style={{ color: colors.text }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400, fontSize: '1.125rem' }}>{isEditing ? 'Edit quote' : 'Add quote'}</h2>
        <button onClick={handleSubmit} disabled={saving || !quote.trim() || !author.trim()}
          className="px-4 py-2 rounded-lg text-sm transition-opacity disabled:opacity-50"
          style={{ backgroundColor: colors.accent, color: '#ffffff', fontWeight: 500 }}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={labelStyle}>Quote *</label>
              <button type="button" onClick={() => { haptic(); setShowPhotoScan(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: colors.accentLight, color: colors.accent, fontWeight: 500 }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                Scan highlights
              </button>
            </div>
            <textarea value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Enter the quote..." rows={4} required className="w-full px-4 py-3 rounded-xl text-base outline-none resize-none" style={inputStyle} />
          </div>
          {showPhotoScan && (
            <PhotoScanModal
              colors={colors}
              onClose={() => setShowPhotoScan(false)}
              onExtracted={(text) => { setQuote(text); setShowPhotoScan(false); }}
            />
          )}
          <div><label className="block mb-2" style={labelStyle}>Author *</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Who said this?" required className="w-full px-4 py-3 rounded-xl text-base outline-none" style={inputStyle} /></div>
          <div><label className="block mb-2" style={labelStyle}>Source</label>
            <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Book or commentary title" className="w-full px-4 py-3 rounded-xl text-base outline-none" style={inputStyle} /></div>
          <div><label className="block mb-2" style={labelStyle}>Page</label>
            <input type="text" value={page} onChange={(e) => setPage(e.target.value)} placeholder="Page number (optional)" className="w-full px-4 py-3 rounded-xl text-base outline-none" style={inputStyle} /></div>
          <div>
            <label className="block mb-2" style={labelStyle}>Bible verses</label>
            <div className="space-y-3">
              {verses.map((verse, index) => (
                <VerseSelector key={index} verse={verse} onChange={(nv) => updateVerse(index, nv)}
                  onRemove={() => { if (verses.length > 1) setVerses(verses.filter((_, i) => i !== index)); }}
                  canRemove={verses.length > 1} colors={colors} />
              ))}
            </div>
            <button type="button" onClick={() => setVerses([...verses, { book: null, chapter: null, verse: null }])}
              className="mt-3 text-sm flex items-center gap-1 hover:opacity-70" style={{ color: colors.accent, fontWeight: 500 }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add another verse
            </button>
          </div>
          <div><label className="block mb-2" style={labelStyle}>Tags</label><TagInput tags={tags} setTags={setTags} colors={colors} /></div>
          <div><label className="block mb-2" style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Your own thoughts on this quote..." rows={3} className="w-full px-4 py-3 rounded-xl text-base outline-none resize-none" style={inputStyle} /></div>
          {!isEditing && (
            <div className="pt-2">
              <button type="button" onClick={handleSaveAnother}
                disabled={savingAnother || savedAnother || !quote.trim() || !author.trim()}
                className="w-full py-3.5 rounded-xl text-sm transition-opacity disabled:opacity-50"
                style={{ backgroundColor: savedAnother ? colors.verdigrisLight : colors.accentLight, color: savedAnother ? colors.verdigris : colors.accent, fontWeight: 500 }}>
                {savedAnother ? 'Saved!' : savingAnother ? 'Saving...' : 'Save & add another'}
              </button>
            </div>
          )}
          {isEditing && (
            <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
              {showDeleteConfirm ? (
                <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: colors.dangerBg }}>
                  <p className="text-sm text-center" style={{ color: colors.danger, fontWeight: 500 }}>Are you sure you want to delete this quote?</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl text-sm"
                      style={{ backgroundColor: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, fontWeight: 500 }}>Cancel</button>
                    <button type="button" onClick={() => { haptic('success'); onDelete(); }} className="flex-1 py-3 rounded-xl text-sm text-white"
                      style={{ backgroundColor: colors.danger, fontWeight: 500 }}>Delete</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 rounded-xl text-sm"
                  style={{ backgroundColor: colors.dangerBg, color: colors.danger, fontWeight: 500 }}>Delete quote</button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// ============================================
// ENTRY DETAIL — full quote view
// ============================================

const EntryDetail = ({ entry, onClose, onEdit, onAddToSermon, colors }) => {
  const verseRefs = entry.verses?.map(formatVerseRef).filter(Boolean);
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: colors.background, fontFamily: FONTS.sans }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.headerBg, borderColor: colors.headerBorder }}>
        <button onClick={() => { haptic(); onClose(); }} className="p-2 -ml-2 rounded-lg" style={{ color: colors.text }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400, fontSize: '1.125rem' }}>Quote</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => { haptic(); onAddToSermon(entry); }} className="p-2 rounded-lg" style={{ color: colors.textMuted }} aria-label="Add to sermon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </button>
          <button onClick={() => { haptic(); onEdit(); }} className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: colors.accent, color: '#ffffff', fontWeight: 500 }}>Edit</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: '100px' }}>
        <div className="max-w-2xl mx-auto">
          <div className="p-6 rounded-xl mb-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-lg leading-relaxed mb-4" style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400 }}>"{entry.quote}"</p>
            <p style={{ color: colors.accent, fontWeight: 500 }}>{entry.author}</p>
          </div>
          <div className="space-y-4">
            {entry.source && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: colors.textLight, fontWeight: 500 }}>Source</p>
                <p style={{ color: colors.text, fontWeight: 400 }}>{entry.source}{entry.page && <span style={{ color: colors.textMuted }}>, p. {entry.page}</span>}</p>
              </div>
            )}
            {verseRefs?.length > 0 && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: colors.textLight, fontWeight: 500 }}>Bible references</p>
                <div className="flex flex-wrap gap-1.5">
                  {verseRefs.map((ref, i) => (<span key={i} className="px-3 py-1.5 rounded-full text-sm" style={{ backgroundColor: colors.verdigrisLight, color: colors.verdigris, fontWeight: 500 }}>{ref}</span>))}
                </div>
              </div>
            )}
            {entry.tags?.length > 0 && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: colors.textLight, fontWeight: 500 }}>Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((tag, i) => (<span key={i} className="px-3 py-1.5 rounded-full text-sm" style={{ backgroundColor: colors.vellum, color: colors.textMuted, fontWeight: 500 }}>{tag}</span>))}
                </div>
              </div>
            )}
            {entry.notes && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: colors.textLight, fontWeight: 500 }}>Your notes</p>
                <p style={{ color: colors.text, fontWeight: 400 }}>{entry.notes}</p>
              </div>
            )}
            <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              <p className="text-sm" style={{ color: colors.textLight, fontWeight: 400 }}>
                Added {new Date(entry.addedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LIBRARY SCREEN — browse by book, author, source
// ============================================

const FilteredEntryList = ({ title, entries, onBack, onSelectEntry, onAddToSermon, colors }) => (
  <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: colors.background, fontFamily: FONTS.sans }}>
    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.headerBg, borderColor: colors.headerBorder }}>
      <button onClick={() => { haptic(); onBack(); }} className="p-2 -ml-2 rounded-lg" style={{ color: colors.text }}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </button>
      <h2 style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400, fontSize: '1.125rem' }}>{title}</h2>
      <div className="w-10" />
    </div>
    <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: '100px' }}>
      <div className="max-w-2xl mx-auto space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-12"><p style={{ color: colors.textMuted, fontWeight: 400 }}>No quotes found here yet.</p></div>
        ) : entries.map(entry => (<EntryCard key={entry.id} entry={entry} onClick={() => onSelectEntry(entry)} onAddToSermon={onAddToSermon} colors={colors} />))}
      </div>
    </div>
  </div>
);

const LibraryScreen = ({ entries, onSelectEntry, onAddToSermon, colors }) => {
  const [drillDown, setDrillDown] = useState(null);
  const bookCounts = {}; BIBLE_BOOKS.forEach(b => { bookCounts[b] = 0; });
  entries.forEach(e => { (e.verses || []).forEach(v => { if (v.book && bookCounts.hasOwnProperty(v.book)) bookCounts[v.book]++; }); });
  const authorCounts = {}; entries.forEach(e => { if (e.author) authorCounts[e.author] = (authorCounts[e.author] || 0) + 1; });
  const sortedAuthors = Object.keys(authorCounts).sort((a, b) => a.localeCompare(b));
  const sourceCounts = {}; entries.forEach(e => { if (e.source) sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1; });
  const sortedSources = Object.keys(sourceCounts).sort((a, b) => a.localeCompare(b));

  if (drillDown) {
    let filtered = [], title = drillDown.value;
    if (drillDown.type === 'book') filtered = entries.filter(e => (e.verses || []).some(v => v.book === drillDown.value));
    else if (drillDown.type === 'author') filtered = entries.filter(e => e.author === drillDown.value);
    else if (drillDown.type === 'source') filtered = entries.filter(e => e.source === drillDown.value);
    return <FilteredEntryList title={title} entries={filtered} onBack={() => setDrillDown(null)} onSelectEntry={onSelectEntry} onAddToSermon={onAddToSermon} colors={colors} />;
  }

  const sectionStyle = { color: colors.textMuted, fontFamily: FONTS.sans, fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: '100px' }}>
      <div className="max-w-2xl mx-auto">
        {/* Bible Books */}
        <div className="mb-8">
          <h3 className="mb-3 px-1" style={sectionStyle}>Bible Books</h3>
          <div className="grid grid-cols-3 gap-2">
            {BIBLE_BOOKS.map(book => { const count = bookCounts[book]; const has = count > 0; return (
              <button key={book} onClick={() => { if (has) { haptic(); setDrillDown({ type: 'book', value: book }); } }}
                className="p-3 rounded-xl text-left" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, opacity: has ? 1 : 0.35, cursor: has ? 'pointer' : 'default' }}>
                <p className="text-sm truncate" style={{ color: colors.text, fontWeight: 500 }}>{book}</p>
                <p className="text-xs mt-0.5" style={{ color: has ? colors.accent : colors.textLight, fontWeight: 400 }}>{count} {count === 1 ? 'quote' : 'quotes'}</p>
              </button>
            ); })}
          </div>
        </div>
        {/* Authors */}
        <div className="mb-8">
          <h3 className="mb-3 px-1" style={sectionStyle}>Authors</h3>
          {sortedAuthors.length === 0 ? (
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              <p className="text-sm" style={{ color: colors.textMuted, fontWeight: 400 }}>Authors will appear here as you add quotes.</p></div>
          ) : (<div className="space-y-2">{sortedAuthors.map(a => (
            <button key={a} onClick={() => { haptic(); setDrillDown({ type: 'author', value: a }); }}
              className="w-full p-4 rounded-xl text-left flex items-center justify-between" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              <p style={{ color: colors.text, fontWeight: 500 }}>{a}</p>
              <span className="text-sm px-2.5 py-0.5 rounded-full" style={{ backgroundColor: colors.accentLight, color: colors.accentText, fontWeight: 500 }}>{authorCounts[a]}</span>
            </button>))}</div>)}
        </div>
        {/* Sources */}
        <div className="mb-8">
          <h3 className="mb-3 px-1" style={sectionStyle}>Sources</h3>
          {sortedSources.length === 0 ? (
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              <p className="text-sm" style={{ color: colors.textMuted, fontWeight: 400 }}>Sources will appear here as you add quotes.</p></div>
          ) : (<div className="space-y-2">{sortedSources.map(s => (
            <button key={s} onClick={() => { haptic(); setDrillDown({ type: 'source', value: s }); }}
              className="w-full p-4 rounded-xl text-left flex items-center justify-between" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              <p style={{ color: colors.text, fontWeight: 500 }}>{s}</p>
              <span className="text-sm px-2.5 py-0.5 rounded-full" style={{ backgroundColor: colors.accentLight, color: colors.accentText, fontWeight: 500 }}>{sourceCounts[s]}</span>
            </button>))}</div>)}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SERMON COMPONENTS
// ============================================

const AddToSermonPicker = ({ entry, sermons, onAddToSermon, onCreateSermon, onClose, colors }) => (
  <>
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40" onClick={onClose} />
    <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[70vh] flex flex-col" style={{ backgroundColor: colors.surface, fontFamily: FONTS.sans }}>
      <div className="flex justify-center py-3"><div className="w-10 h-1 rounded-full" style={{ backgroundColor: colors.border }} /></div>
      <div className="px-4 pb-2">
        <h3 style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400, fontSize: '1.125rem' }}>Add to sermon</h3>
        <p className="text-sm mt-1" style={{ color: colors.textMuted, fontWeight: 400 }}>Choose a sermon or create a new one</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <button onClick={() => { haptic(); onCreateSermon(entry); }} className="w-full p-4 rounded-xl flex items-center gap-3 mb-3"
          style={{ backgroundColor: colors.accentLight, border: `1px dashed ${colors.accent}` }}>
          <svg className="w-5 h-5" fill="none" stroke={colors.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          <span style={{ color: colors.accent, fontWeight: 500 }}>Create new sermon</span>
        </button>
        {sermons.length === 0 ? (<p className="text-sm text-center py-4" style={{ color: colors.textMuted }}>No sermons yet. Create one above!</p>) : (
          <div className="space-y-2">{sermons.map(s => { const added = (s.quoteIds || []).includes(entry.id); return (
            <button key={s.id} onClick={() => { if (!added) { haptic(); onAddToSermon(s.id, entry.id); } }} disabled={added}
              className="w-full p-4 rounded-xl text-left flex items-center justify-between"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, opacity: added ? 0.5 : 1 }}>
              <div><p style={{ color: colors.text, fontWeight: 500 }}>{s.title}</p>{s.passage && <p className="text-sm" style={{ color: colors.textMuted }}>{s.passage}</p>}</div>
              {added && <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: colors.accentLight, color: colors.accentText, fontWeight: 500 }}>Added</span>}
            </button>); })}</div>
        )}
      </div>
    </div>
  </>
);

const QuotePicker = ({ entries, selectedIds, onConfirm, onClose, colors }) => {
  const [selected, setSelected] = useState(new Set(selectedIds));
  const [searchQuery, setSearchQuery] = useState('');
  const filtered = entries.filter(e => { if (!searchQuery.trim()) return true; const q = searchQuery.toLowerCase();
    return e.quote?.toLowerCase().includes(q) || e.author?.toLowerCase().includes(q) || e.source?.toLowerCase().includes(q) || e.tags?.some(t => t.toLowerCase().includes(q)) || e.verses?.some(v => formatVerseRef(v).toLowerCase().includes(q)); });
  const toggle = (id) => { const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); setSelected(n); };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: colors.background, fontFamily: FONTS.sans }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.headerBg, borderColor: colors.headerBorder }}>
        <button onClick={() => { haptic(); onClose(); }} className="p-2 -ml-2 rounded-lg" style={{ color: colors.text }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
        <h2 style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400, fontSize: '1.125rem' }}>Add quotes</h2>
        <button onClick={() => { haptic('success'); onConfirm(Array.from(selected)); }} className="px-4 py-2 rounded-lg text-sm"
          style={{ backgroundColor: colors.accent, color: '#ffffff', fontWeight: 500 }}>Done ({selected.size})</button>
      </div>
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <svg className="w-5 h-5" fill="none" stroke={colors.textLight} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          <input type="text" placeholder="Search your quotes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm" style={{ color: colors.text, fontWeight: 400 }} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {filtered.map(e => { const sel = selected.has(e.id); return (
            <button key={e.id} onClick={() => { haptic(); toggle(e.id); }} className="w-full text-left p-4 rounded-xl flex items-start gap-3"
              style={{ backgroundColor: sel ? colors.accentLight : colors.surface, border: `1px solid ${sel ? colors.accent : colors.border}` }}>
              <div className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center"
                style={{ backgroundColor: sel ? colors.accent : 'transparent', border: `1.5px solid ${sel ? colors.accent : colors.border}` }}>
                {sel && <svg className="w-3 h-3" fill="none" stroke="#ffffff" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2" style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400 }}>"{e.quote}"</p>
                <p className="text-xs mt-1" style={{ color: colors.textMuted, fontWeight: 400 }}>— {e.author}</p>
              </div>
            </button>); })}
        </div>
      </div>
    </div>
  );
};

const SermonForm = ({ sermon, onSave, onClose, onDelete, colors }) => {
  const [title, setTitle] = useState(sermon?.title || '');
  const [date, setDate] = useState(sermon?.date || '');
  const [passage, setPassage] = useState(sermon?.passage || '');
  const [notes, setNotes] = useState(sermon?.notes || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isEditing = !!sermon?.id;
  const handleSubmit = async (e) => { e.preventDefault(); if (!title.trim()) return; setSaving(true); haptic('success');
    await onSave({ title: title.trim(), date: date.trim(), passage: passage.trim(), notes: notes.trim() }); setSaving(false); };
  const inputStyle = { backgroundColor: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontFamily: FONTS.sans, fontWeight: 400 };
  const labelStyle = { color: colors.text, fontFamily: FONTS.sans, fontWeight: 500, fontSize: '0.875rem' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: colors.background, fontFamily: FONTS.sans }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.headerBg, borderColor: colors.headerBorder }}>
        <button onClick={() => { haptic(); onClose(); }} className="p-2 -ml-2 rounded-lg" style={{ color: colors.text }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
        <h2 style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400, fontSize: '1.125rem' }}>{isEditing ? 'Edit sermon' : 'New sermon'}</h2>
        <button onClick={handleSubmit} disabled={saving || !title.trim()} className="px-4 py-2 rounded-lg text-sm transition-opacity disabled:opacity-50"
          style={{ backgroundColor: colors.accent, color: '#ffffff', fontWeight: 500 }}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-5">
          <div><label className="block mb-2" style={labelStyle}>Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sermon title" required className="w-full px-4 py-3 rounded-xl text-base outline-none" style={inputStyle} /></div>
          <div><label className="block mb-2" style={labelStyle}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl text-base outline-none" style={inputStyle} /></div>
          <div><label className="block mb-2" style={labelStyle}>Passage</label>
            <input type="text" value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="e.g. Romans 8:18-30" className="w-full px-4 py-3 rounded-xl text-base outline-none" style={inputStyle} /></div>
          <div><label className="block mb-2" style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Your sermon notes..." rows={4} className="w-full px-4 py-3 rounded-xl text-base outline-none resize-none" style={inputStyle} /></div>
          {isEditing && onDelete && (
            <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
              {showDeleteConfirm ? (
                <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: colors.dangerBg }}>
                  <p className="text-sm text-center" style={{ color: colors.danger, fontWeight: 500 }}>Are you sure? This will delete the sermon and unlink all quotes.</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl text-sm"
                      style={{ backgroundColor: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, fontWeight: 500 }}>Cancel</button>
                    <button type="button" onClick={() => { haptic('success'); onDelete(); }} className="flex-1 py-3 rounded-xl text-sm text-white"
                      style={{ backgroundColor: colors.danger, fontWeight: 500 }}>Delete</button>
                  </div>
                </div>
              ) : (<button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 rounded-xl text-sm"
                style={{ backgroundColor: colors.dangerBg, color: colors.danger, fontWeight: 500 }}>Delete sermon</button>)}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const SermonDetail = ({ sermon, entries, allEntries, onBack, onUpdateSermon, onDeleteSermon, onSelectEntry, onAddToSermon, colors }) => {
  const [showQuotePicker, setShowQuotePicker] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const sermonEntries = (sermon.quoteIds || []).map(id => allEntries.find(e => e.id === id)).filter(Boolean);
  const handleRemoveQuote = async (eid) => { haptic(); await onUpdateSermon(sermon.id, { quoteIds: (sermon.quoteIds || []).filter(id => id !== eid) }); };
  const handleExport = () => { haptic('success'); const safe = sermon.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    exportToCSV(sermonEntries, `reg-sermon-${safe}-${new Date().toISOString().split('T')[0]}.csv`); };

  if (showEditForm) return <SermonForm sermon={sermon} onSave={async (d) => { await onUpdateSermon(sermon.id, d); setShowEditForm(false); }}
    onClose={() => setShowEditForm(false)} onDelete={onDeleteSermon ? () => onDeleteSermon(sermon.id) : null} colors={colors} />;
  if (showQuotePicker) return <QuotePicker entries={allEntries} selectedIds={sermon.quoteIds || []}
    onConfirm={async (ids) => { await onUpdateSermon(sermon.id, { quoteIds: ids }); setShowQuotePicker(false); }} onClose={() => setShowQuotePicker(false)} colors={colors} />;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: colors.background, fontFamily: FONTS.sans }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.headerBg, borderColor: colors.headerBorder }}>
        <button onClick={() => { haptic(); onBack(); }} className="p-2 -ml-2 rounded-lg" style={{ color: colors.text }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
        </button>
        <h2 style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400, fontSize: '1.125rem' }}>Sermon</h2>
        <button onClick={() => { haptic(); setShowEditForm(true); }} className="px-4 py-2 rounded-lg text-sm"
          style={{ backgroundColor: colors.accent, color: '#ffffff', fontWeight: 500 }}>Edit</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: '100px' }}>
        <div className="max-w-2xl mx-auto">
          <div className="p-5 rounded-xl mb-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <h3 className="text-xl mb-2" style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400 }}>{sermon.title}</h3>
            {sermon.date && <p className="text-sm mb-1" style={{ color: colors.textMuted, fontWeight: 400 }}>{new Date(sermon.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
            {sermon.passage && <span className="inline-flex px-2.5 py-1 rounded-full text-xs mt-1" style={{ backgroundColor: colors.verdigrisLight, color: colors.verdigris, fontWeight: 500 }}>{sermon.passage}</span>}
            {sermon.notes && <p className="text-sm mt-3 leading-relaxed" style={{ color: colors.text, fontWeight: 400 }}>{sermon.notes}</p>}
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => { haptic(); setShowQuotePicker(true); }} className="flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: colors.accentLight, color: colors.accent, fontWeight: 500 }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add quotes</button>
            {sermonEntries.length > 0 && (
              <button onClick={handleExport} className="py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, fontWeight: 500 }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Export</button>
            )}
          </div>
          <h4 className="mb-3 px-1" style={{ color: colors.textMuted, fontFamily: FONTS.sans, fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quotes ({sermonEntries.length})</h4>
          {sermonEntries.length === 0 ? (
            <div className="p-6 rounded-xl text-center" style={{ backgroundColor: colors.surface, border: `1px dashed ${colors.border}` }}>
              <p className="text-sm" style={{ color: colors.textMuted, fontWeight: 400 }}>No quotes gathered yet. Tap "Add quotes" to start building your sermon.</p></div>
          ) : (<div className="space-y-3">{sermonEntries.map(e => (
            <div key={e.id} className="relative">
              <EntryCard entry={e} onClick={() => onSelectEntry(e)} onAddToSermon={onAddToSermon} colors={colors} />
              <button onClick={() => handleRemoveQuote(e.id)} className="absolute top-2 right-2 p-1.5 rounded-full"
                style={{ backgroundColor: colors.surface, color: colors.textLight, border: `1px solid ${colors.border}` }} title="Remove from sermon">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>))}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const SermonsScreen = ({ sermons, entries, onCreateSermon, onUpdateSermon, onDeleteSermon, onSelectEntry, onAddToSermon, colors }) => {
  const [selectedSermon, setSelectedSermon] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const currentSermon = selectedSermon ? sermons.find(s => s.id === selectedSermon.id) || selectedSermon : null;

  if (showForm) return <SermonForm sermon={null} onSave={async (d) => { await onCreateSermon(d); setShowForm(false); }} onClose={() => setShowForm(false)} colors={colors} />;
  if (currentSermon) return <SermonDetail sermon={currentSermon} entries={entries} allEntries={entries}
    onBack={() => setSelectedSermon(null)} onUpdateSermon={onUpdateSermon} onDeleteSermon={async (id) => { await onDeleteSermon(id); setSelectedSermon(null); }}
    onSelectEntry={onSelectEntry} onAddToSermon={onAddToSermon} colors={colors} />;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: '100px' }}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => { haptic(); setShowForm(true); }} className="w-full p-4 rounded-xl flex items-center justify-center gap-2 mb-4"
          style={{ backgroundColor: colors.accentLight, border: `1px dashed ${colors.accent}`, color: colors.accent, fontWeight: 500, fontSize: '0.875rem' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New sermon</button>
        {sermons.length === 0 ? (
          <div className="text-center py-12">
            <SermonsIcon color={colors.textLight} size={32} />
            <h3 className="text-lg mt-4 mb-2" style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400 }}>No sermons yet</h3>
            <p className="text-sm max-w-xs mx-auto" style={{ color: colors.textMuted, fontWeight: 400 }}>Create a sermon to start gathering quotes for your next message.</p>
          </div>
        ) : (<div className="space-y-3">{sermons.map(s => { const qc = (s.quoteIds || []).length; return (
          <button key={s.id} onClick={() => { haptic(); setSelectedSermon(s); }} className="w-full text-left p-4 rounded-xl"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="mb-1" style={{ color: colors.text, fontWeight: 500 }}>{s.title}</p>
            <div className="flex items-center gap-3 text-sm" style={{ color: colors.textMuted, fontWeight: 400 }}>
              {s.date && <span>{new Date(s.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              {s.passage && <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: colors.verdigrisLight, color: colors.verdigris, fontWeight: 500 }}>{s.passage}</span>}
              <span>{qc} {qc === 1 ? 'quote' : 'quotes'}</span>
            </div>
          </button>); })}</div>)}
      </div>
    </div>
  );
};

// ============================================
// SETTINGS SCREEN
// ============================================

const SettingsScreen = ({ themeMode, setThemeMode, entries, colors }) => {
  const themeOptions = [{ value: 'light', label: 'Light', icon: '☀️' }, { value: 'dark', label: 'Dark', icon: '🌙' }, { value: 'system', label: 'System', icon: '💻' }];
  const handleExport = () => { haptic('success'); exportToCSV(entries, `reg-export-${new Date().toISOString().split('T')[0]}.csv`); };
  const sectionStyle = { color: colors.textMuted, fontFamily: FONTS.sans, fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '100px' }}>
      <div className="max-w-lg mx-auto p-4">
        <div className="mb-6">
          <h3 className="mb-3 px-1" style={sectionStyle}>Appearance</h3>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            {themeOptions.map((o, i) => (
              <button key={o.value} onClick={() => { haptic(); setThemeMode(o.value); }}
                className="w-full px-4 py-3 flex items-center justify-between transition-colors"
                style={{ borderTop: i > 0 ? `1px solid ${colors.border}` : 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div className="flex items-center gap-3"><span className="text-lg">{o.icon}</span><span style={{ color: colors.text, fontWeight: 400 }}>{o.label}</span></div>
                {themeMode === o.value && <svg className="w-5 h-5" fill={colors.accent} viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
              </button>))}
          </div>
        </div>
        <div className="mb-6">
          <h3 className="mb-3 px-1" style={sectionStyle}>Data</h3>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <button onClick={handleExport} disabled={entries.length === 0} className="w-full px-4 py-3 flex items-center gap-3 disabled:opacity-50"
              onMouseEnter={(e) => { if (entries.length > 0) e.currentTarget.style.backgroundColor = colors.surfaceHover; }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <svg className="w-5 h-5" fill="none" stroke={colors.text} strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              <div className="text-left">
                <p className="text-sm" style={{ color: colors.text, fontWeight: 500 }}>Export all quotes</p>
                <p className="text-xs" style={{ color: colors.textMuted, fontWeight: 400 }}>Download {entries.length} {entries.length === 1 ? 'quote' : 'quotes'} as CSV</p>
              </div>
            </button>
          </div>
        </div>
        <div>
          <h3 className="mb-3 px-1" style={sectionStyle}>About</h3>
          <div className="rounded-xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="mb-1" style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400, fontSize: '1.125rem' }}>Quotary</p>
            <p className="text-sm mb-3" style={{ color: colors.textMuted, fontWeight: 400 }}>Version 2.0.0</p>
            <p className="text-sm leading-relaxed" style={{ color: colors.textMuted, fontWeight: 400 }}>
              A personal quote index for ministers and theology students. Save quotes, tag them to Bible verses, and find the right words when you need them.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================

export default function App() {
  const { themeMode, setThemeMode, colors } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [surpriseEntry, setSurpriseEntry] = useState(null);
  const [sermonPickerEntry, setSermonPickerEntry] = useState(null);
  const [pendingSermonEntry, setPendingSermonEntry] = useState(null);
  const [showNewSermonFromPicker, setShowNewSermonFromPicker] = useState(false);

  useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }); return () => unsub(); }, []);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try { const q = query(collection(db, 'reg-entries'), where('userId', '==', user.uid), orderBy('addedAt', 'desc'));
      setEntries((await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error('Error fetching entries:', e); }
  }, [user]);

  const fetchSermons = useCallback(async () => {
    if (!user) return;
    try { const q = query(collection(db, 'reg-sermons'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      setSermons((await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error('Error fetching sermons:', e); }
  }, [user]);

  useEffect(() => { fetchEntries(); fetchSermons(); }, [fetchEntries, fetchSermons]);

  const handleSignIn = async () => { setAuthLoading(true); try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error('Sign in error:', e); } setAuthLoading(false); };
  const handleSignOut = async () => { try { await signOut(auth); setEntries([]); setSermons([]); setCurrentScreen('home'); } catch (e) { console.error('Sign out error:', e); } };

  const handleSaveEntry = async (data) => {
    if (!user) return;
    try { if (editingEntry?.id) await updateDoc(doc(db, 'reg-entries', editingEntry.id), data);
      else await addDoc(collection(db, 'reg-entries'), { ...data, addedAt: new Date().toISOString(), userId: user.uid });
      await fetchEntries(); setShowForm(false); setEditingEntry(null); setSelectedEntry(null); } catch (e) { console.error('Error saving entry:', e); }
  };

  const handleSaveEntryAndContinue = async (data) => {
    if (!user) return;
    try { await addDoc(collection(db, 'reg-entries'), { ...data, addedAt: new Date().toISOString(), userId: user.uid });
      await fetchEntries(); } catch (e) { console.error('Error saving entry:', e); }
  };

  const handleDeleteEntry = async () => {
    if (!editingEntry?.id) return;
    try { await deleteDoc(doc(db, 'reg-entries', editingEntry.id)); await fetchEntries(); setShowForm(false); setEditingEntry(null); setSelectedEntry(null); } catch (e) { console.error('Error deleting entry:', e); }
  };

  const handleCreateSermon = async (data) => {
    if (!user) return;
    try { const nd = await addDoc(collection(db, 'reg-sermons'), { ...data, quoteIds: [], userId: user.uid, createdAt: new Date().toISOString() });
      await fetchSermons(); return nd.id; } catch (e) { console.error('Error creating sermon:', e); }
  };

  const handleUpdateSermon = async (id, data) => { try { await updateDoc(doc(db, 'reg-sermons', id), data); await fetchSermons(); } catch (e) { console.error('Error updating sermon:', e); } };
  const handleDeleteSermon = async (id) => { try { await deleteDoc(doc(db, 'reg-sermons', id)); await fetchSermons(); } catch (e) { console.error('Error deleting sermon:', e); } };

  const handleAddEntryToSermon = async (sermonId, entryId) => {
    const s = sermons.find(x => x.id === sermonId); if (!s) return;
    const ids = [...(s.quoteIds || [])]; if (!ids.includes(entryId)) { ids.push(entryId); await handleUpdateSermon(sermonId, { quoteIds: ids }); }
    setSermonPickerEntry(null);
  };

  const openSermonPicker = (entry) => setSermonPickerEntry(entry);
  const handleCreateSermonFromPicker = (entry) => { setSermonPickerEntry(null); setPendingSermonEntry(entry); setShowNewSermonFromPicker(true); };
  const handleSaveNewSermonFromPicker = async (data) => {
    const nid = await handleCreateSermon(data); if (nid && pendingSermonEntry) await handleAddEntryToSermon(nid, pendingSermonEntry.id);
    setShowNewSermonFromPicker(false); setPendingSermonEntry(null);
  };

  const openAddForm = () => { setEditingEntry(null); setShowForm(true); };
  const openEditForm = () => { setEditingEntry(selectedEntry); setShowForm(true); };

  const handleSurpriseMe = () => { if (entries.length === 0) return; setSurpriseEntry(entries[Math.floor(Math.random() * entries.length)]); };
  const handleSurpriseAnother = () => { if (entries.length <= 1) return; let i; do { i = Math.floor(Math.random() * entries.length); } while (entries.length > 1 && entries[i].id === surpriseEntry?.id); setSurpriseEntry(entries[i]); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background, fontFamily: FONTS.sans }}>
      <div className="text-center">
        <p className="text-2xl" style={{ color: colors.text, fontFamily: FONTS.serif, fontWeight: 400 }}>Quotary</p>
        <p className="mt-2 text-sm" style={{ color: colors.textMuted, fontWeight: 400 }}>Loading...</p>
      </div>
    </div>
  );

  if (!user) return <SignInScreen onSignIn={handleSignIn} loading={authLoading} colors={colors} />;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.background, fontFamily: FONTS.sans }}>
      <Header user={user} onSignOut={handleSignOut} colors={colors} />

      {currentScreen === 'home' && (<>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} colors={colors} />
        <EntryList entries={entries} searchQuery={searchQuery} onSelectEntry={setSelectedEntry}
          onAddEntry={openAddForm} onAddToSermon={openSermonPicker} onSurpriseMe={handleSurpriseMe} colors={colors} />
      </>)}
      {currentScreen === 'library' && <LibraryScreen entries={entries} onSelectEntry={setSelectedEntry} onAddToSermon={openSermonPicker} colors={colors} />}
      {currentScreen === 'sermons' && <SermonsScreen sermons={sermons} entries={entries} onCreateSermon={handleCreateSermon}
        onUpdateSermon={handleUpdateSermon} onDeleteSermon={handleDeleteSermon} onSelectEntry={setSelectedEntry} onAddToSermon={openSermonPicker} colors={colors} />}
      {currentScreen === 'settings' && <SettingsScreen themeMode={themeMode} setThemeMode={setThemeMode} entries={entries} colors={colors} />}

      <FloatingNavBar currentScreen={currentScreen} onNavigate={setCurrentScreen} onAdd={openAddForm} colors={colors} />

      {selectedEntry && !showForm && <EntryDetail entry={selectedEntry} onClose={() => setSelectedEntry(null)} onEdit={openEditForm} onAddToSermon={openSermonPicker} colors={colors} />}
      {showForm && <EntryForm entry={editingEntry} onSave={handleSaveEntry} onSaveAndContinue={handleSaveEntryAndContinue} onClose={() => { setShowForm(false); setEditingEntry(null); }} onDelete={handleDeleteEntry} colors={colors} />}
      {surpriseEntry && <SurpriseQuote entry={surpriseEntry} onAnother={handleSurpriseAnother} onClose={() => setSurpriseEntry(null)} colors={colors} />}
      {sermonPickerEntry && <AddToSermonPicker entry={sermonPickerEntry} sermons={sermons} onAddToSermon={handleAddEntryToSermon} onCreateSermon={handleCreateSermonFromPicker} onClose={() => setSermonPickerEntry(null)} colors={colors} />}
      {showNewSermonFromPicker && <SermonForm sermon={null} onSave={handleSaveNewSermonFromPicker} onClose={() => { setShowNewSermonFromPicker(false); setPendingSermonEntry(null); }} colors={colors} />}
    </div>
  );
}
