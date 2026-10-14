/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Collections } from './pages/Collections';
import { Gallery } from './pages/Gallery';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';

const COLLECTION_ALIASES = ['/living-room', '/bedroom', '/custom-furniture'];

const getCanonicalPath = (path: string) => {
  const trimmed = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  if (trimmed === '/admin') return '/admin';
  return COLLECTION_ALIASES.includes(trimmed) ? '/collections' : trimmed;
};

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const rawPath = window.location.pathname || '/';
    const path = getCanonicalPath(rawPath);
    if (path !== rawPath) {
      window.history.replaceState({}, '', path);
    }
    return path;
  });
  const [loadingComplete, setLoadingComplete] = useState<boolean>(false);

  useEffect(() => {
    const handlePopState = () => {
      const rawPath = window.location.pathname || '/';
      const path = getCanonicalPath(rawPath);
      if (path !== rawPath) {
        window.history.replaceState({}, '', path);
      }
      setCurrentPath(path);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Every route change starts at the top, including browser Back/Forward navigation.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentPath]);

  const handleNavigate = (path: string) => {
    const canonicalPath = getCanonicalPath(path);
    window.history.pushState({}, '', canonicalPath);
    setCurrentPath(canonicalPath);
  };

  const exitAdmin = () => {
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
    setLoadingComplete(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  if (currentPath === '/admin') {
    return <Admin onExit={exitAdmin} />;
  }

  const renderPage = () => {
    switch (currentPath) {
      case '/':
        return <Home onNavigate={handleNavigate} />;
      case '/about':
        return <About onNavigate={handleNavigate} />;
      case '/collections':
        return <Collections onNavigate={handleNavigate} />;
      case '/gallery':
        return <Gallery />;
      case '/contact':
        return <Contact />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F1E8] text-[#1C1511] font-sans selection:bg-[#C9A45C] selection:text-white">
      <LoadingScreen onComplete={() => setLoadingComplete(true)} />

      {loadingComplete && (
        <>
          <Navbar currentPath={currentPath} onNavigate={handleNavigate} />
          <main className="flex-grow">
            {renderPage()}
          </main>
          <Footer onNavigate={handleNavigate} />
          <WhatsAppButton />
        </>
      )}
    </div>
  );
}
