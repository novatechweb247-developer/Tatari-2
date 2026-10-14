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

    void loadLogo();
    return () => {
      cancelled = true;
    };
  }, []);

  return { logoUrl };
};
