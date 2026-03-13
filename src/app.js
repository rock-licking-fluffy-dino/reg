import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcyNl3C0Kz8X1vNwxqOaXPKCwN6y0KohQ",
  authDomain: "reg-0000.firebaseapp.com",
  projectId: "reg-0000",
  storageBucket: "reg-0000.firebasestorage.app",
  messagingSenderId: "665648288348",
  appId: "1:665648288348:web:3c700b45a3f417b6218c99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Complete Bible data with exact verse counts for all 66 books
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

// Haptic feedback utility
const haptic = (style = 'light') => {
  if (navigator.vibrate) {
    navigator.vibrate(style === 'success' ? [10, 50, 20] : 10);
  }
};

// Format verse reference for display
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

// ============================================
// COMPONENTS
// ============================================

// Sign In Screen
const SignInScreen = ({ onSignIn, loading }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#faf7f2' }}>
      <div className="max-w-md w-full text-center">
        {/* Logo/Title */}
        <div className="mb-8">
          <div 
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: '#1a3a2a' }}
          >
            <span className="text-4xl" style={{ color: '#c9a84c' }}>R</span>
          </div>
          <h1 
            className="text-4xl font-serif mb-2"
            style={{ color: '#1a3a2a', fontFamily: 'Georgia, serif' }}
          >
            Reg
          </h1>
          <p 
            className="text-lg italic"
            style={{ color: '#1a3a2a', opacity: 0.8 }}
          >
            Your personal quote companion
          </p>
        </div>

        {/* Welcome message */}
        <div 
          className="p-6 rounded-xl mb-8 shadow-md"
          style={{ backgroundColor: '#fff', border: '1px solid #e8e0d5' }}
        >
          <p 
            className="text-lg mb-4 leading-relaxed"
            style={{ color: '#1c1917', fontFamily: 'Georgia, serif' }}
          >
            "Ah, welcome! I'm Reginald — though my friends call me Reg. 
            I've spent years collecting the finest words from the wisest minds, 
            and I'd be delighted to help you build your own treasury of quotes."
          </p>
          <p 
            className="text-base"
            style={{ color: '#1c1917', opacity: 0.7 }}
          >
            Save quotes from books and commentaries, tag them to Bible verses, 
            and find exactly the right words when you need them most.
          </p>
        </div>

        {/* Sign in button */}
        <button
          onClick={() => {
            haptic('success');
            onSignIn();
          }}
          disabled={loading}
          className="w-full py-4 px-6 rounded-xl font-medium text-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          style={{ 
            backgroundColor: '#1a3a2a', 
            color: '#faf7f2',
          }}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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

// Header Component
const Header = ({ user, onSignOut, onAddEntry }) => {
  return (
    <header 
      className="sticky top-0 z-40 px-4 py-3 shadow-md"
      style={{ backgroundColor: '#1a3a2a' }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#c9a84c' }}
          >
            <span className="text-lg font-bold" style={{ color: '#1a3a2a' }}>R</span>
          </div>
          <h1 
            className="text-xl font-serif"
            style={{ color: '#faf7f2', fontFamily: 'Georgia, serif' }}
          >
            Reg
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptic('success');
              onAddEntry();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ backgroundColor: '#c9a84c' }}
            aria-label="Add new entry"
          >
            <svg className="w-6 h-6" fill="none" stroke="#1a3a2a" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          
          <button
            onClick={() => {
              haptic();
              onSignOut();
            }}
            className="p-2 rounded-full transition-opacity hover:opacity-80"
            aria-label="Sign out"
          >
            <img 
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=c9a84c&color=1a3a2a`} 
              alt={user?.displayName || 'User'}
              className="w-8 h-8 rounded-full"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

// Search Bar Component
const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="px-4 py-3" style={{ backgroundColor: '#faf7f2' }}>
      <div className="max-w-2xl mx-auto">
        <div 
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: '#fff', border: '1px solid #e8e0d5' }}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#1a3a2a" strokeWidth="2" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search quotes, verses, authors, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: '#1c1917' }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="#1c1917" strokeWidth="2" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ onAddEntry, hasSearch }) => {
  if (hasSearch) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: '#e8e0d5' }}
        >
          <svg className="w-10 h-10" fill="none" stroke="#1a3a2a" strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <h3 
          className="text-xl font-serif mb-2"
          style={{ color: '#1a3a2a', fontFamily: 'Georgia, serif' }}
        >
          No matches found
        </h3>
        <p style={{ color: '#1c1917', opacity: 0.7 }}>
          Try adjusting your search terms
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div 
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg"
        style={{ backgroundColor: '#1a3a2a' }}
      >
        <span className="text-4xl" style={{ color: '#c9a84c' }}>R</span>
      </div>
      
      <h3 
        className="text-2xl font-serif mb-4"
        style={{ color: '#1a3a2a', fontFamily: 'Georgia, serif' }}
      >
        Your library awaits
      </h3>
      
      <div 
        className="max-w-sm p-5 rounded-xl mb-6"
        style={{ backgroundColor: '#fff', border: '1px solid #e8e0d5' }}
      >
        <p 
          className="text-base italic leading-relaxed"
          style={{ color: '#1c1917', fontFamily: 'Georgia, serif' }}
        >
          "Every great sermon begins with words that moved you first. 
          Let's start collecting the quotes that will one day move others."
        </p>
        <p 
          className="text-sm mt-3"
          style={{ color: '#1a3a2a', opacity: 0.7 }}
        >
          — Reg
        </p>
      </div>
      
      <button
        onClick={() => {
          haptic('success');
          onAddEntry();
        }}
        className="py-3 px-6 rounded-xl font-medium shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
        style={{ backgroundColor: '#c9a84c', color: '#1a3a2a' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add your first quote
      </button>
    </div>
  );
};

// Entry Card Component
const EntryCard = ({ entry, onClick }) => {
  const verseRefs = entry.verses?.map(formatVerseRef).filter(Boolean).join(', ');
  
  return (
    <button
      onClick={() => {
        haptic();
        onClick();
      }}
      className="w-full text-left p-5 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
      style={{ backgroundColor: '#fff', border: '1px solid #e8e0d5' }}
    >
      {/* Quote preview */}
      <p 
        className="text-base mb-3 line-clamp-3"
        style={{ color: '#1c1917', fontFamily: 'Georgia, serif' }}
      >
        "{entry.quote}"
      </p>
      
      {/* Author and source */}
      <p 
        className="text-sm mb-3"
        style={{ color: '#1a3a2a' }}
      >
        — {entry.author}
        {entry.source && <span style={{ opacity: 0.7 }}>, {entry.source}</span>}
      </p>
      
      {/* Verse references */}
      {verseRefs && (
        <div className="flex flex-wrap gap-2 mb-2">
          <span 
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: '#1a3a2a', color: '#faf7f2' }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            {verseRefs}
          </span>
        </div>
      )}
      
      {/* Tags */}
      {entry.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map((tag, i) => (
            <span 
              key={i}
              className="px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: '#c9a84c', color: '#1a3a2a', opacity: 0.9 }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
};

// Entry List Component
const EntryList = ({ entries, onSelectEntry, searchQuery, onAddEntry }) => {
  // Filter entries based on search query
  const filteredEntries = entries.filter(entry => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search in quote
    if (entry.quote?.toLowerCase().includes(query)) return true;
    
    // Search in author
    if (entry.author?.toLowerCase().includes(query)) return true;
    
    // Search in source
    if (entry.source?.toLowerCase().includes(query)) return true;
    
    // Search in notes
    if (entry.notes?.toLowerCase().includes(query)) return true;
    
    // Search in tags
    if (entry.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
    
    // Search in verse references
    if (entry.verses?.some(v => {
      const ref = formatVerseRef(v).toLowerCase();
      return ref.includes(query);
    })) return true;
    
    return false;
  });

  if (entries.length === 0) {
    return <EmptyState onAddEntry={onAddEntry} hasSearch={false} />;
  }

  if (filteredEntries.length === 0) {
    return <EmptyState onAddEntry={onAddEntry} hasSearch={true} />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {filteredEntries.map(entry => (
          <EntryCard 
            key={entry.id} 
            entry={entry} 
            onClick={() => onSelectEntry(entry)}
          />
        ))}
      </div>
    </div>
  );
};

// Verse Selector Component
const VerseSelector = ({ verse, onChange, onRemove, canRemove }) => {
  const [chaptersAvailable, setChaptersAvailable] = useState([]);
  const [versesAvailable, setVersesAvailable] = useState([]);

  useEffect(() => {
    if (verse.book && BIBLE_DATA[verse.book]) {
      const chapters = BIBLE_DATA[verse.book].length;
      setChaptersAvailable(Array.from({ length: chapters }, (_, i) => i + 1));
    } else {
      setChaptersAvailable([]);
    }
  }, [verse.book]);

  useEffect(() => {
    if (verse.book && verse.chapter && BIBLE_DATA[verse.book]) {
      const verses = BIBLE_DATA[verse.book][verse.chapter - 1];
      setVersesAvailable(Array.from({ length: verses }, (_, i) => i + 1));
    } else {
      setVersesAvailable([]);
    }
  }, [verse.book, verse.chapter]);

  const selectStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e8e0d5',
    color: '#1c1917',
  };

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 grid grid-cols-3 gap-2">
        {/* Book dropdown */}
        <select
          value={verse.book || ''}
          onChange={(e) => onChange({ book: e.target.value || null, chapter: null, verse: null })}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2"
          style={{ ...selectStyle, '--tw-ring-color': '#c9a84c' }}
        >
          <option value="">Book</option>
          {BIBLE_BOOKS.map(book => (
            <option key={book} value={book}>{book}</option>
          ))}
        </select>

        {/* Chapter dropdown */}
        <select
          value={verse.chapter || ''}
          onChange={(e) => onChange({ ...verse, chapter: e.target.value ? parseInt(e.target.value) : null, verse: null })}
          disabled={!verse.book}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 disabled:opacity-50"
          style={{ ...selectStyle, '--tw-ring-color': '#c9a84c' }}
        >
          <option value="">Ch</option>
          {chaptersAvailable.map(ch => (
            <option key={ch} value={ch}>{ch}</option>
          ))}
        </select>

        {/* Verse dropdown */}
        <select
          value={verse.verse || ''}
          onChange={(e) => onChange({ ...verse, verse: e.target.value ? parseInt(e.target.value) : null })}
          disabled={!verse.chapter}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 disabled:opacity-50"
          style={{ ...selectStyle, '--tw-ring-color': '#c9a84c' }}
        >
          <option value="">Vs</option>
          {versesAvailable.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Remove verse"
        >
          <svg className="w-5 h-5" fill="none" stroke="#1c1917" strokeWidth="2" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Tag Input Component
const TagInput = ({ tags, setTags }) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const tag = inputValue.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a tag and press Enter"
          className="flex-1 px-4 py-2 rounded-lg text-base outline-none focus:ring-2"
          style={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e8e0d5',
            color: '#1c1917',
            '--tw-ring-color': '#c9a84c'
          }}
        />
        <button
          type="button"
          onClick={addTag}
          className="px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: '#e8e0d5', color: '#1a3a2a' }}
        >
          Add
        </button>
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span 
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
              style={{ backgroundColor: '#c9a84c', color: '#1a3a2a' }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:opacity-70"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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

// Entry Form Modal
const EntryForm = ({ entry, onSave, onClose, onDelete }) => {
  const [quote, setQuote] = useState(entry?.quote || '');
  const [author, setAuthor] = useState(entry?.author || '');
  const [source, setSource] = useState(entry?.source || '');
  const [page, setPage] = useState(entry?.page || '');
  const [notes, setNotes] = useState(entry?.notes || '');
  const [verses, setVerses] = useState(entry?.verses?.length ? entry.verses : [{ book: null, chapter: null, verse: null }]);
  const [tags, setTags] = useState(entry?.tags || []);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!entry?.id;

  const updateVerse = (index, newVerse) => {
    const newVerses = [...verses];
    newVerses[index] = newVerse;
    setVerses(newVerses);
  };

  const addVerse = () => {
    setVerses([...verses, { book: null, chapter: null, verse: null }]);
  };

  const removeVerse = (index) => {
    if (verses.length > 1) {
      setVerses(verses.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!quote.trim() || !author.trim()) {
      return;
    }

    setSaving(true);
    haptic('success');

    // Filter out empty verse references
    const cleanVerses = verses.filter(v => v.book);

    await onSave({
      quote: quote.trim(),
      author: author.trim(),
      source: source.trim(),
      page: page.trim(),
      notes: notes.trim(),
      verses: cleanVerses,
      tags,
    });

    setSaving(false);
  };

  const handleDelete = async () => {
    haptic('success');
    await onDelete();
  };

  const inputStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e8e0d5',
    color: '#1c1917',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#faf7f2' }}
    >
      {/* Modal header */}
      <div 
        className="flex items-center justify-between px-4 py-3 shadow-md"
        style={{ backgroundColor: '#1a3a2a' }}
      >
        <button
          onClick={() => {
            haptic();
            onClose();
          }}
          className="p-2 -ml-2 rounded-lg"
          style={{ color: '#faf7f2' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 
          className="text-lg font-serif"
          style={{ color: '#faf7f2', fontFamily: 'Georgia, serif' }}
        >
          {isEditing ? 'Edit Quote' : 'Add Quote'}
        </h2>
        
        <button
          onClick={handleSubmit}
          disabled={saving || !quote.trim() || !author.trim()}
          className="px-4 py-2 rounded-lg font-medium transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#c9a84c', color: '#1a3a2a' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-5">
          {/* Quote */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: '#1a3a2a' }}
            >
              Quote *
            </label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Enter the quote..."
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl text-base outline-none focus:ring-2 resize-none"
              style={{ ...inputStyle, fontFamily: 'Georgia, serif', '--tw-ring-color': '#c9a84c' }}
            />
          </div>

          {/* Author */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: '#1a3a2a' }}
            >
              Author *
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Who said this?"
              required
              className="w-full px-4 py-3 rounded-xl text-base outline-none focus:ring-2"
              style={{ ...inputStyle, '--tw-ring-color': '#c9a84c' }}
            />
          </div>

          {/* Source */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: '#1a3a2a' }}
            >
              Source
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Book or commentary title"
              className="w-full px-4 py-3 rounded-xl text-base outline-none focus:ring-2"
              style={{ ...inputStyle, '--tw-ring-color': '#c9a84c' }}
            />
          </div>

          {/* Page */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: '#1a3a2a' }}
            >
              Page
            </label>
            <input
              type="text"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="Page number (optional)"
              className="w-full px-4 py-3 rounded-xl text-base outline-none focus:ring-2"
              style={{ ...inputStyle, '--tw-ring-color': '#c9a84c' }}
            />
          </div>

          {/* Bible verses */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: '#1a3a2a' }}
            >
              Bible Verses
            </label>
            <div className="space-y-3">
              {verses.map((verse, index) => (
                <VerseSelector
                  key={index}
                  verse={verse}
                  onChange={(newVerse) => updateVerse(index, newVerse)}
                  onRemove={() => removeVerse(index)}
                  canRemove={verses.length > 1}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addVerse}
              className="mt-3 text-sm font-medium flex items-center gap-1 transition-opacity hover:opacity-80"
              style={{ color: '#1a3a2a' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add another verse
            </button>
          </div>

          {/* Tags */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: '#1a3a2a' }}
            >
              Tags
            </label>
            <TagInput tags={tags} setTags={setTags} />
          </div>

          {/* Notes */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: '#1a3a2a' }}
            >
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Your own thoughts on this quote..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-base outline-none focus:ring-2 resize-none"
              style={{ ...inputStyle, '--tw-ring-color': '#c9a84c' }}
            />
          </div>

          {/* Delete button for existing entries */}
          {isEditing && (
            <div className="pt-4 border-t" style={{ borderColor: '#e8e0d5' }}>
              {showDeleteConfirm ? (
                <div className="space-y-3">
                  <p className="text-sm text-center" style={{ color: '#1c1917' }}>
                    Are you sure you want to delete this quote?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 rounded-xl font-medium"
                      style={{ backgroundColor: '#e8e0d5', color: '#1a3a2a' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex-1 py-3 rounded-xl font-medium text-white"
                      style={{ backgroundColor: '#dc2626' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 rounded-xl font-medium transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                >
                  Delete Quote
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// Entry Detail Modal
const EntryDetail = ({ entry, onClose, onEdit }) => {
  const verseRefs = entry.verses?.map(formatVerseRef).filter(Boolean);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#faf7f2' }}
    >
      {/* Modal header */}
      <div 
        className="flex items-center justify-between px-4 py-3 shadow-md"
        style={{ backgroundColor: '#1a3a2a' }}
      >
        <button
          onClick={() => {
            haptic();
            onClose();
          }}
          className="p-2 -ml-2 rounded-lg"
          style={{ color: '#faf7f2' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        
        <h2 
          className="text-lg font-serif"
          style={{ color: '#faf7f2', fontFamily: 'Georgia, serif' }}
        >
          Quote
        </h2>
        
        <button
          onClick={() => {
            haptic();
            onEdit();
          }}
          className="px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: '#c9a84c', color: '#1a3a2a' }}
        >
          Edit
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          {/* Quote card */}
          <div 
            className="p-6 rounded-xl shadow-lg mb-6"
            style={{ backgroundColor: '#fff', border: '1px solid #e8e0d5' }}
          >
            <p 
              className="text-xl leading-relaxed mb-4"
              style={{ color: '#1c1917', fontFamily: 'Georgia, serif' }}
            >
              "{entry.quote}"
            </p>
            
            <p 
              className="text-base"
              style={{ color: '#1a3a2a' }}
            >
              — {entry.author}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Source */}
            {entry.source && (
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#fff', border: '1px solid #e8e0d5' }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: '#1a3a2a', opacity: 0.7 }}>
                  Source
                </p>
                <p style={{ color: '#1c1917' }}>
                  {entry.source}
                  {entry.page && <span style={{ opacity: 0.7 }}>, p. {entry.page}</span>}
                </p>
              </div>
            )}

            {/* Bible verses */}
            {verseRefs?.length > 0 && (
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#fff', border: '1px solid #e8e0d5' }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: '#1a3a2a', opacity: 0.7 }}>
                  Bible References
                </p>
                <div className="flex flex-wrap gap-2">
                  {verseRefs.map((ref, i) => (
                    <span 
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: '#1a3a2a', color: '#faf7f2' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                      </svg>
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {entry.tags?.length > 0 && (
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#fff', border: '1px solid #e8e0d5' }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: '#1a3a2a', opacity: 0.7 }}>
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: '#c9a84c', color: '#1a3a2a' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {entry.notes && (
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#fff', border: '1px solid #e8e0d5' }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: '#1a3a2a', opacity: 0.7 }}>
                  Your Notes
                </p>
                <p style={{ color: '#1c1917' }}>
                  {entry.notes}
                </p>
              </div>
            )}

            {/* Date added */}
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: '#fff', border: '1px solid #e8e0d5' }}
            >
              <p className="text-sm" style={{ color: '#1c1917', opacity: 0.5 }}>
                Added {new Date(entry.addedAt).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch entries when user logs in
  const fetchEntries = useCallback(async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'reg-entries'),
        where('userId', '==', user.uid),
        orderBy('addedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const fetchedEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntries(fetchedEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Sign in handler
  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
    setAuthLoading(false);
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setEntries([]);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Save entry handler
  const handleSaveEntry = async (entryData) => {
    if (!user) return;

    try {
      if (editingEntry?.id) {
        // Update existing entry
        await updateDoc(doc(db, 'reg-entries', editingEntry.id), entryData);
      } else {
        // Create new entry
        await addDoc(collection(db, 'reg-entries'), {
          ...entryData,
          addedAt: new Date().toISOString(),
          userId: user.uid,
        });
      }
      
      await fetchEntries();
      setShowForm(false);
      setEditingEntry(null);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  // Delete entry handler
  const handleDeleteEntry = async () => {
    if (!editingEntry?.id) return;

    try {
      await deleteDoc(doc(db, 'reg-entries', editingEntry.id));
      await fetchEntries();
      setShowForm(false);
      setEditingEntry(null);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  // Open add form
  const openAddForm = () => {
    setEditingEntry(null);
    setShowForm(true);
  };

  // Open edit form
  const openEditForm = () => {
    setEditingEntry(selectedEntry);
    setShowForm(true);
  };

  // Loading screen
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#faf7f2' }}
      >
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
          style={{ backgroundColor: '#1a3a2a' }}
        >
          <span className="text-2xl" style={{ color: '#c9a84c' }}>R</span>
        </div>
      </div>
    );
  }

  // Sign in screen
  if (!user) {
    return <SignInScreen onSignIn={handleSignIn} loading={authLoading} />;
  }

  // Main app
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#faf7f2' }}
    >
      <Header 
        user={user} 
        onSignOut={handleSignOut} 
        onAddEntry={openAddForm}
      />
      
      <SearchBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />
      
      <EntryList 
        entries={entries}
        searchQuery={searchQuery}
        onSelectEntry={setSelectedEntry}
        onAddEntry={openAddForm}
      />

      {/* Entry detail modal */}
      {selectedEntry && !showForm && (
        <EntryDetail
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEdit={openEditForm}
        />
      )}

      {/* Entry form modal */}
      {showForm && (
        <EntryForm
          entry={editingEntry}
          onSave={handleSaveEntry}
          onClose={() => {
            setShowForm(false);
            setEditingEntry(null);
          }}
          onDelete={handleDeleteEntry}
        />
      )}
    </div>
  );
}
