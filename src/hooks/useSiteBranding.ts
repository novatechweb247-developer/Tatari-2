import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useSiteBranding = () => {
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadLogo = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('site_settings')
        .select('logo_url')
        .eq('id', 'main')
        .eq('is_published', true)
        .maybeSingle();

      if (!cancelled && !error && typeof data?.logo_url === 'string') {
        setLogoUrl(data.logo_url);
      }
    };

    const refreshLogo = () => { void loadLogo(); };
    refreshLogo();
    const refreshTimer = window.setInterval(refreshLogo, 15000);
    window.addEventListener('focus', refreshLogo);
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') refreshLogo(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', refreshLogo);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return { logoUrl };
};
