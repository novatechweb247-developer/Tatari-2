import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  PanelsTopLeft,
  Sofa,
  Images,
  Inbox,
  Settings,
  LogOut,
  Save,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { HERO_SLIDES, BUSINESS_INFO } from '../data';

type Section =
  | 'Overview'
  | 'Homepage'
  | 'Collections'
  | 'Gallery'
  | 'Enquiries'
  | 'Business details';

type HeroSlide = {
  slide_number: number;
  title: string;
  subtitle: string;
  badge: string;
  image_url: string;
  button_text: string;
  button_url: string;
  is_published: boolean;
  draft_data?: Record<string, any> | null;
};

type SiteSettings = {
  id: string;
  business_name: string;
  tagline: string;
  address: string;
  phone: string;
  phone_international: string;
  whatsapp_url: string;
  map_url: string;
  description: string;
  editorial_image_url: string;
  is_published: boolean;
  draft_data?: Record<string, any> | null;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  category_label: string;
  image_url: string;
  description: string;
  features: string[];
  dimensions: string;
  materials: string;
  is_published: boolean;
  sort_order: number;
  draft_data?: Record<string, any> | null;
};

type GalleryRow = {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description: string;
  is_published: boolean;
  sort_order: number;
  draft_data?: Record<string, any> | null;
};

type Enquiry = {
  id: string;
  full_name: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
  preferred_contact: string;
  status: string;
  created_at: string;
};

const sections: { label: Section; icon: React.ReactNode; description: string }[] = [
  {
    label: 'Overview',
    icon: <LayoutDashboard size={18} />,
    description: 'A quick view of your website content and status.',
  },
  {
    label: 'Homepage',
    icon: <PanelsTopLeft size={18} />,
    description: 'Edit the three hero slides and homepage editorial image.',
  },
  {
    label: 'Collections',
    icon: <Sofa size={18} />,
    description: 'Furniture products, descriptions, dimensions, and categories.',
  },
  {
    label: 'Gallery',
    icon: <Images size={18} />,
    description: 'Showroom and project photographs.',
  },
  {
    label: 'Enquiries',
    icon: <Inbox size={18} />,
    description: 'Customer messages saved from the public contact form.',
  },
  {
    label: 'Business details',
    icon: <Settings size={18} />,
    description: 'Contact details, address, and showroom information.',
  },
];

const inputClass =
  'w-full rounded-xl border border-[#D8CEC0] bg-[#F6F1E8]/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C9A45C] text-[#1C1511] transition-all';
const labelClass =
  'mb-2 block text-xs font-semibold uppercase tracking-wider text-[#5A3E2B]';
const panel = 'rounded-2xl border border-[#D8CEC0] bg-white p-5 shadow-sm sm:p-7';

export const Admin: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [active, setActive] = useState<Section>('Overview');
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('admin@tatari.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [galleryRows, setGalleryRows] = useState<GalleryRow[]>([]);
  const [counts, setCounts] = useState({ products: 0, gallery: 0, enquiries: 0 });

  const verifyAdmin = useCallback(async (userId: string) => {
    if (!supabase) return false;
    const { data, error: membershipError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (membershipError) throw membershipError;
    return Boolean(data);
  }, []);

  const loadData = useCallback(async () => {
    if (!supabase) return;
    setError('');
    const [hero, site, inbox, products, gallery, productRowsResult, galleryRowsResult] =
      await Promise.all([
        supabase.from('hero_slides').select('*').order('slide_number'),
        supabase.from('site_settings').select('*').eq('id', 'main').maybeSingle(),
        supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('gallery_items').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('*').order('sort_order'),
        supabase.from('gallery_items').select('*').order('sort_order'),
      ]);

    const firstError =
      hero.error ||
      site.error ||
      inbox.error ||
      products.error ||
      gallery.error ||
      productRowsResult.error ||
      galleryRowsResult.error;

    if (firstError) throw firstError;

    // Always guarantee exactly 3 hero slides exist
    const rawSlides = (hero.data || []) as HeroSlide[];
    const mergedSlides: HeroSlide[] = [1, 2, 3].map((num) => {
      const existing = rawSlides.find((s) => s.slide_number === num);
      if (existing) {
        return {
          ...existing,
          ...(existing.draft_data || {}),
        };
      }
      const defaultSlide = HERO_SLIDES[num - 1] || HERO_SLIDES[0];
      return {
        slide_number: num,
        title: defaultSlide.title,
        subtitle: defaultSlide.subtitle,
        badge: defaultSlide.badge,
        image_url: defaultSlide.image,
        button_text: num === 2 ? 'Contact Us' : 'Explore Collections',
        button_url: num === 2 ? '/contact' : '/collections',
        is_published: true,
        draft_data: null,
      };
    });
    setSlides(mergedSlides);

    const siteRow = site.data as SiteSettings | null;
    if (siteRow) {
      setSettings({ ...siteRow, ...(siteRow.draft_data || {}) } as SiteSettings);
    } else {
      setSettings({
        id: 'main',
        business_name: BUSINESS_INFO.name,
        tagline: BUSINESS_INFO.tagline,
        address: BUSINESS_INFO.address,
        phone: BUSINESS_INFO.phone,
        phone_international: BUSINESS_INFO.phoneInternational,
        whatsapp_url: BUSINESS_INFO.whatsappUrl,
        map_url: BUSINESS_INFO.mapUrl,
        description: BUSINESS_INFO.description,
        editorial_image_url:
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85',
        is_published: true,
        draft_data: null,
      });
    }

    setEnquiries((inbox.data || []) as Enquiry[]);
    setProductRows(
      ((productRowsResult.data || []) as ProductRow[]).map((row) => ({
        ...row,
        ...(row.draft_data || {}),
      }))
    );
    setGalleryRows(
      ((galleryRowsResult.data || []) as GalleryRow[]).map((row) => ({
        ...row,
        ...(row.draft_data || {}),
      }))
    );
    setCounts({
      products: products.count || (productRowsResult.data?.length || 0),
      gallery: gallery.count || (galleryRowsResult.data?.length || 0),
      enquiries: inbox.data?.length || 0,
    });
  }, []);

  useEffect(() => {
    let activeEffect = true;
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }: any) => {
      if (!activeEffect || !data?.session) {
        setLoading(false);
        return;
      }
      try {
        if (await verifyAdmin(data.session.user.id)) {
          if (activeEffect) {
            setSession(data.session);
            await loadData();
          }
        } else {
          await supabase.auth.signOut();
          if (activeEffect) setError('This account is not authorized to manage Tatari.');
        }
      } catch (e) {
        if (activeEffect)
          setError(e instanceof Error ? e.message : 'Could not verify administrator access.');
      } finally {
        if (activeEffect) setLoading(false);
      }
    });
    return () => {
      activeEffect = false;
    };
  }, [verifyAdmin, loadData]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      if (!data?.user || !(await verifyAdmin(data.user.id))) {
        await supabase.auth.signOut();
        throw new Error('This account is not authorized. Add its user ID to public.admin_users first.');
      }
      setSession(data.session);
      setPassword('');
      await loadData();
      setNotice('Signed in successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
      setLoading(false);
    }
  };

  const runSave = async (task: () => Promise<void>, message: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await task();
      setNotice(message);
    } catch (e: any) {
      console.error('[Operation Failed]', e);
      setError(e instanceof Error ? e.message : 'The operation failed. Your changes were not confirmed as saved.');
    } finally {
      setBusy(false);
    }
  };

  // Upload image handler supporting Android phone storage directly
  const uploadImage = async (
    file: File | undefined,
    target:
      | { kind: 'editorial' }
      | { kind: 'hero'; slideNumber: number }
      | { kind: 'product'; index: number }
      | { kind: 'gallery'; index: number }
  ) => {
    if (!file) return;
    if (!supabase) {
      setError('Storage service is unavailable.');
      return;
    }

    const targetKey =
      target.kind === 'editorial'
        ? 'editorial'
        : target.kind === 'hero'
        ? `hero-${target.slideNumber}`
        : target.kind === 'product'
        ? `product-${target.index}`
        : `gallery-${target.index}`;

    // Validate image format - permissive for Android phone camera / storage MIME types
    const isImageMime = file.type && file.type.startsWith('image/');
    const isImageExt = /\.(jpe?g|png|webp|gif|svg|avif|heic|heif|bmp)$/i.test(file.name);
    if (!isImageMime && !isImageExt) {
      setError('Please choose a valid image file (JPG, PNG, WebP, etc.).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Image file is larger than 15 MB. Please choose a smaller image.');
      return;
    }

    setUploadingTarget(targetKey);
    setError('');
    setNotice('');

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');
      const uniquePath = `admin/${Date.now()}-${cleanName}.${ext}`;
      const contentType = file.type || (ext === 'png' ? 'image/png' : 'image/jpeg');

      const { error: uploadError } = await supabase.storage
        .from('site-media')
        .upload(uniquePath, file, { upsert: true, contentType });

      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message || 'Storage upload failed'}`);
      }

      const { data } = supabase.storage.from('site-media').getPublicUrl(uniquePath);
      const publicUrl = data?.publicUrl;

      if (!publicUrl) {
        throw new Error('Could not retrieve public URL for uploaded image.');
      }

      // Apply to state and persist draft immediately
      if (target.kind === 'editorial') {
        if (settings) {
          const updated = { ...settings, editorial_image_url: publicUrl };
          setSettings(updated);
          await saveSettings(false, updated);
        }
      } else if (target.kind === 'hero') {
        const slide = slides.find((s) => s.slide_number === target.slideNumber);
        if (slide) {
          const updated = { ...slide, image_url: publicUrl };
          setSlides((prev) =>
            prev.map((s) => (s.slide_number === target.slideNumber ? updated : s))
          );
          await saveSlide(updated, false);
        }
      } else if (target.kind === 'product') {
        const product = productRows[target.index];
        if (product) {
          const updated = { ...product, image_url: publicUrl };
          setProductRows((prev) =>
            prev.map((r, i) => (i === target.index ? updated : r))
          );
          await saveProduct(updated, false);
        }
      } else if (target.kind === 'gallery') {
        const gallery = galleryRows[target.index];
        if (gallery) {
          const updated = { ...gallery, image_url: publicUrl };
          setGalleryRows((prev) =>
            prev.map((r, i) => (i === target.index ? updated : r))
          );
          await saveGalleryItem(updated, false);
        }
      }

      setNotice('Image successfully uploaded from your phone and saved to draft.');
    } catch (err: any) {
      console.error('[Upload Failed]', err);
      setError(err instanceof Error ? err.message : 'Image upload failed. Please try again.');
    } finally {
      setUploadingTarget(null);
    }
  };

  const saveSlide = async (slide: HeroSlide, publish: boolean) => {
    if (!supabase) throw new Error('Database client not available');
    if (!slide.title?.trim()) throw new Error(`Slide ${slide.slide_number} requires a title.`);
    if (!slide.image_url?.trim()) throw new Error(`Slide ${slide.slide_number} requires an image.`);

    const values = {
      title: slide.title,
      subtitle: slide.subtitle || '',
      badge: slide.badge || '',
      image_url: slide.image_url,
      button_text: slide.button_text || '',
      button_url: slide.button_url || '',
    };

    const payload: any = {
      slide_number: slide.slide_number,
      draft_data: values,
      updated_at: new Date().toISOString(),
    };

    if (publish) {
      Object.assign(payload, values);
      payload.is_published = true;
    }

    const { error: saveError } = await supabase
      .from('hero_slides')
      .upsert(payload, { onConflict: 'slide_number' });

    if (saveError) throw new Error(`Failed to save slide: ${saveError.message || saveError}`);

    await loadData();
  };

  const saveSettings = async (publish: boolean, overrideSettings?: SiteSettings) => {
    if (!supabase) throw new Error('Database client not available');
    const target = overrideSettings || settings;
    if (!target) throw new Error('No settings loaded');

    const values = {
      business_name: target.business_name || '',
      tagline: target.tagline || '',
      address: target.address || '',
      phone: target.phone || '',
      phone_international: target.phone_international || '',
      whatsapp_url: target.whatsapp_url || '',
      map_url: target.map_url || '',
      description: target.description || '',
      editorial_image_url: target.editorial_image_url || '',
    };

    const payload: any = {
      id: 'main',
      draft_data: values,
      updated_at: new Date().toISOString(),
    };

    if (publish) {
      Object.assign(payload, values);
      payload.is_published = true;
    }

    const { error: saveError } = await supabase
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' });

    if (saveError) throw new Error(`Failed to save settings: ${saveError.message || saveError}`);

    await loadData();
  };

  const saveProduct = async (item: ProductRow, publish: boolean) => {
    if (!supabase) throw new Error('Database client not available');
    if (!item.name?.trim()) throw new Error('Product name is required.');

    const values = {
      name: item.name,
      category: item.category,
      category_label: item.category_label || item.category,
      image_url: item.image_url || '',
      description: item.description || '',
      features: item.features || [],
      dimensions: item.dimensions || '',
      materials: item.materials || '',
    };

    const isNew = !item.id;
    const productId = item.id || `prod-${Date.now()}`;

    const payload: any = {
      id: productId,
      draft_data: values,
      sort_order: item.sort_order ?? productRows.length,
      updated_at: new Date().toISOString(),
    };

    if (publish) {
      Object.assign(payload, values);
      payload.is_published = true;
    } else if (isNew) {
      payload.is_published = false;
      Object.assign(payload, values);
    }

    const query = isNew
      ? supabase.from('products').insert(payload)
      : supabase.from('products').update(payload).eq('id', productId);

    const { error: saveError } = await query;
    if (saveError) throw new Error(`Failed to save product: ${saveError.message || saveError}`);

    await loadData();
  };

  const saveGalleryItem = async (item: GalleryRow, publish: boolean) => {
    if (!supabase) throw new Error('Database client not available');
    if (!item.title?.trim()) throw new Error('Gallery title is required.');

    const values = {
      title: item.title,
      category: item.category,
      image_url: item.image_url || '',
      description: item.description || '',
    };

    const isNew = !item.id;
    const galleryId = item.id || `gal-${Date.now()}`;

    const payload: any = {
      id: galleryId,
      draft_data: values,
      sort_order: item.sort_order ?? galleryRows.length,
      updated_at: new Date().toISOString(),
    };

    if (publish) {
      Object.assign(payload, values);
      payload.is_published = true;
    } else if (isNew) {
      payload.is_published = false;
      Object.assign(payload, values);
    }

    const query = isNew
      ? supabase.from('gallery_items').insert(payload)
      : supabase.from('gallery_items').update(payload).eq('id', galleryId);

    const { error: saveError } = await query;
    if (saveError) throw new Error(`Failed to save gallery item: ${saveError.message || saveError}`);

    await loadData();
  };

  const deleteProduct = async (item: ProductRow) => {
    if (!supabase || !item.id) return;
    const { error: deleteError } = await supabase.from('products').delete().eq('id', item.id);
    if (deleteError) throw deleteError;
    await loadData();
  };

  const deleteGalleryItem = async (item: GalleryRow) => {
    if (!supabase || !item.id) return;
    const { error: deleteError } = await supabase.from('gallery_items').delete().eq('id', item.id);
    if (deleteError) throw deleteError;
    await loadData();
  };

  const updateEnquiry = async (item: Enquiry, status: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from('enquiries')
      .update({ status })
      .eq('id', item.id);
    if (updateError) throw updateError;
    setEnquiries((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, status } : row))
    );
  };

  // Reusable Image Upload & Preview Component
  const renderImageUpload = (
    label: string,
    currentUrl: string,
    targetKey: string,
    onFileSelected: (file: File) => void,
    onUrlChange: (url: string) => void,
    inputId: string
  ) => {
    const isUploading = uploadingTarget === targetKey;

    return (
      <div className="space-y-3">
        <span className={labelClass}>{label}</span>

        {/* Current Image Preview */}
        <div className="relative overflow-hidden rounded-xl border border-[#D8CEC0] bg-[#1C1511]/5 p-2">
          {currentUrl ? (
            <div className="relative flex flex-col items-center">
              <img
                src={currentUrl}
                alt={label}
                className="max-h-48 w-full rounded-lg object-cover shadow-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute top-3 right-3 rounded-full bg-[#1C1511]/80 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#DFC27A] backdrop-blur-sm">
                Current Image
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-[#6B5546]">
              <ImageIcon className="mb-2 h-8 w-8 text-[#C9A45C]" />
              <p className="text-xs">No image selected</p>
            </div>
          )}

          {/* Uploading Status Overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1C1511]/70 backdrop-blur-sm text-white">
              <RefreshCw className="h-6 w-6 animate-spin text-[#C9A45C]" />
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-[#F6F1E8]">
                Uploading from phone...
              </p>
            </div>
          )}
        </div>

        {/* File Picker Control */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={isUploading || busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFileSelected(file);
              }
              // Reset file value so re-selecting same photo works
              e.target.value = '';
            }}
          />

          <label
            htmlFor={inputId}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider shadow-sm transition-all cursor-pointer ${
              isUploading
                ? 'bg-neutral-400 text-white cursor-not-allowed'
                : 'bg-[#1C1511] text-[#F6F1E8] hover:bg-[#3A271C] active:scale-95'
            }`}
          >
            {isUploading ? (
              <>
                <RefreshCw size={14} className="animate-spin text-[#C9A45C]" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={14} className="text-[#C9A45C]" />
                {currentUrl ? 'Replace image from phone' : 'Choose image from phone'}
              </>
            )}
          </label>
        </div>

        {/* Manual URL Input */}
        <div className="pt-1">
          <label className="text-[11px] text-[#6B5546] block mb-1">
            Or paste permanent image URL:
          </label>
          <input
            className={inputClass}
            type="text"
            value={currentUrl || ''}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
    );
  };

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="min-h-screen bg-[#F6F1E8] p-8 text-[#1C1511]">
        <h1 className="font-serif text-3xl">Tatari Admin</h1>
        <p className="mt-4">
          Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the deployment environment.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F1E8] p-8 text-[#1C1511] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[#C9A45C] mx-auto mb-4" />
          <p className="font-serif text-xl">Loading Admin Center…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F1E8] px-4 text-[#1C1511]">
        <form
          onSubmit={signIn}
          className="w-full max-w-md rounded-3xl border border-[#D8CEC0] bg-white p-8 shadow-xl"
        >
          <p className="font-serif text-2xl tracking-[0.18em]">TATARI</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[#8B6A37]">
            Website Admin
          </p>
          <h1 className="mt-8 font-serif text-3xl">Administrator sign in</h1>
          <p className="mt-3 text-sm leading-6 text-[#6B5546]">
            Sign in to manage your storefront content, images, and enquiries.
          </p>
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <label className={labelClass + ' mt-6'}>Email address</label>
          <input
            className={inputClass}
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className={labelClass + ' mt-4'}>Password</label>
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            disabled={busy}
            className="mt-6 w-full rounded-full bg-[#1C1511] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#3A271C] disabled:opacity-60 transition-colors shadow-md"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="mt-3 w-full rounded-full border border-[#D8CEC0] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#3A271C] hover:bg-[#F6F1E8] transition-colors"
          >
            Return to website
          </button>
        </form>
      </div>
    );
  }

  const field = (
    label: string,
    value: string,
    update: (v: string) => void,
    type = 'text'
  ) => (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        className={inputClass}
        type={type}
        value={value || ''}
        onChange={(e) => update(e.target.value)}
      />
    </label>
  );

  return (
    <div className="min-h-screen bg-[#F6F1E8] text-[#1C1511]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#D8CEC0] bg-[#F6F1E8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="font-serif text-xl tracking-[0.18em]">TATARI</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[#8B6A37]">
              Website Admin Center
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => runSave(loadData, 'Data refreshed from database.')}
              className="inline-flex items-center gap-2 rounded-full border border-[#D8CEC0] px-3.5 py-2 text-xs font-medium hover:bg-white transition-colors"
            >
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={async () => {
                await supabase!.auth.signOut();
                setSession(null);
                onExit();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#D8CEC0] px-3.5 py-2 text-xs font-medium hover:bg-white transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8 lg:py-12">
        {/* Navigation Sidebar */}
        <aside className="h-fit rounded-2xl border border-[#D8CEC0] bg-white p-3 shadow-sm">
          <p className="px-3 pb-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8B6A37]">
            Manage website
          </p>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {sections.map((s) => (
              <button
                key={s.label}
                onClick={() => setActive(s.label)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${
                  active === s.label
                    ? 'bg-[#1C1511] text-[#F6F1E8] shadow-sm'
                    : 'text-[#3A271C] hover:bg-[#F6F1E8]'
                }`}
              >
                {s.icon}
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0">
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8B6A37]">
              Tatari Furniture
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl">
              {active === 'Overview' ? 'Welcome to your Admin Center.' : active}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B5546]">
              {sections.find((s) => s.label === active)?.description}
            </p>
          </div>

          {/* Feedback Notices */}
          {notice && (
            <div
              role="status"
              className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              <CheckCircle2 size={18} className="shrink-0 text-green-600" />
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* OVERVIEW SECTION */}
          {active === 'Overview' && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Hero slides', value: slides.length },
                { label: 'Products', value: counts.products },
                { label: 'Gallery images', value: counts.gallery },
                { label: 'Recent enquiries', value: counts.enquiries },
              ].map((x) => (
                <div key={x.label} className={panel}>
                  <p className="text-sm text-[#6B5546]">{x.label}</p>
                  <p className="mt-2 font-serif text-3xl text-[#1C1511]">{x.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* HOMEPAGE SECTION (3 Hero Slides & Editorial Image) */}
          {active === 'Homepage' && (
            <div className="space-y-8">
              {/* Exactly 3 Hero Slides */}
              <section className={panel}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl">Hero slides (exactly 3)</h2>
                    <p className="text-xs text-[#6B5546] mt-1">
                      Each slide is independently editable and can be saved as draft or published.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#F6F1E8] px-3 py-1 text-xs font-semibold text-[#8B6A37]">
                    3/3 fixed slides
                  </span>
                </div>

                <div className="space-y-8">
                  {slides.slice(0, 3).map((slide) => (
                    <div
                      key={slide.slide_number}
                      className="rounded-2xl border border-[#D8CEC0] p-6 bg-[#F6F1E8]/20"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-serif text-xl font-medium">
                          Slide {slide.slide_number}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                            slide.is_published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {slide.is_published ? 'Published' : 'Draft only'}
                        </span>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        {field('Slide Title', slide.title, (v) =>
                          setSlides((prev) =>
                            prev.map((s) =>
                              s.slide_number === slide.slide_number ? { ...s, title: v } : s
                            )
                          )
                        )}

                        {field('Badge', slide.badge, (v) =>
                          setSlides((prev) =>
                            prev.map((s) =>
                              s.slide_number === slide.slide_number ? { ...s, badge: v } : s
                            )
                          )
                        )}

                        <div className="sm:col-span-2">
                          {field('Subtitle', slide.subtitle, (v) =>
                            setSlides((prev) =>
                              prev.map((s) =>
                                s.slide_number === slide.slide_number ? { ...s, subtitle: v } : s
                              )
                            )
                          )}
                        </div>

                        {/* Slide Image with Phone Upload and Preview */}
                        <div className="sm:col-span-2">
                          {renderImageUpload(
                            `Slide ${slide.slide_number} Image`,
                            slide.image_url,
                            `hero-${slide.slide_number}`,
                            (file) =>
                              uploadImage(file, {
                                kind: 'hero',
                                slideNumber: slide.slide_number,
                              }),
                            (v) =>
                              setSlides((prev) =>
                                prev.map((s) =>
                                  s.slide_number === slide.slide_number
                                    ? { ...s, image_url: v }
                                    : s
                                )
                              ),
                            `hero-upload-input-${slide.slide_number}`
                          )}
                        </div>

                        {field('Button text', slide.button_text, (v) =>
                          setSlides((prev) =>
                            prev.map((s) =>
                              s.slide_number === slide.slide_number
                                ? { ...s, button_text: v }
                                : s
                            )
                          )
                        )}

                        {field('Button link', slide.button_url, (v) =>
                          setSlides((prev) =>
                            prev.map((s) =>
                              s.slide_number === slide.slide_number
                                ? { ...s, button_url: v }
                                : s
                            )
                          )
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3 border-t border-[#D8CEC0] pt-4">
                        <button
                          disabled={busy || uploadingTarget !== null}
                          onClick={() =>
                            runSave(
                              () => saveSlide(slide, false),
                              `Slide ${slide.slide_number} saved as draft.`
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-[#D8CEC0] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#F6F1E8] transition-colors shadow-sm disabled:opacity-50"
                        >
                          <Save size={14} /> Save draft
                        </button>
                        <button
                          disabled={busy || uploadingTarget !== null}
                          onClick={() =>
                            runSave(
                              () => saveSlide(slide, true),
                              `Slide ${slide.slide_number} published to website.`
                            )
                          }
                          className="rounded-full bg-[#1C1511] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#3A271C] transition-colors shadow-md disabled:opacity-50"
                        >
                          Publish slide
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Homepage Editorial Image */}
              {settings && (
                <section className={panel}>
                  <div className="mb-6">
                    <h2 className="font-serif text-2xl">Homepage Editorial Image</h2>
                    <p className="text-xs text-[#6B5546] mt-1">
                      Displayed on the homepage below the editorial showcase intro.
                    </p>
                  </div>

                  {renderImageUpload(
                    'Editorial Showcase Image',
                    settings.editorial_image_url,
                    'editorial',
                    (file) => uploadImage(file, { kind: 'editorial' }),
                    (v) => setSettings({ ...settings, editorial_image_url: v }),
                    'editorial-upload-input'
                  )}

                  <div className="mt-6 flex gap-3 border-t border-[#D8CEC0] pt-4">
                    <button
                      disabled={busy || uploadingTarget !== null}
                      onClick={() =>
                        runSave(
                          () => saveSettings(false),
                          'Editorial image saved as draft.'
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-[#D8CEC0] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#F6F1E8] transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Save size={14} /> Save draft
                    </button>
                    <button
                      disabled={busy || uploadingTarget !== null}
                      onClick={() =>
                        runSave(
                          () => saveSettings(true),
                          'Editorial image published to website.'
                        )
                      }
                      className="rounded-full bg-[#1C1511] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#3A271C] transition-colors shadow-md disabled:opacity-50"
                    >
                      Publish image
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* BUSINESS DETAILS SECTION */}
          {active === 'Business details' && settings && (
            <section className={panel}>
              <div className="mb-6">
                <h2 className="font-serif text-2xl">Business Details</h2>
                <p className="text-xs text-[#6B5546] mt-1">
                  Contact numbers, showroom address, and business summary.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {field('Business name', settings.business_name, (v) =>
                  setSettings({ ...settings, business_name: v })
                )}
                {field('Tagline', settings.tagline, (v) =>
                  setSettings({ ...settings, tagline: v })
                )}
                {field('Showroom address', settings.address, (v) =>
                  setSettings({ ...settings, address: v })
                )}
                {field('Phone display', settings.phone, (v) =>
                  setSettings({ ...settings, phone: v })
                )}
                {field('Phone international link', settings.phone_international, (v) =>
                  setSettings({ ...settings, phone_international: v })
                )}
                {field('WhatsApp URL', settings.whatsapp_url, (v) =>
                  setSettings({ ...settings, whatsapp_url: v })
                )}
                {field('Map URL', settings.map_url, (v) =>
                  setSettings({ ...settings, map_url: v })
                )}
                <div className="sm:col-span-2">
                  {field('Description', settings.description, (v) =>
                    setSettings({ ...settings, description: v })
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3 border-t border-[#D8CEC0] pt-4">
                <button
                  disabled={busy}
                  onClick={() =>
                    runSave(
                      () => saveSettings(false),
                      'Business details saved as draft.'
                    )
                  }
                  className="rounded-full border border-[#D8CEC0] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#F6F1E8] transition-colors shadow-sm disabled:opacity-50"
                >
                  Save draft
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    runSave(
                      () => saveSettings(true),
                      'Business details published to website.'
                    )
                  }
                  className="rounded-full bg-[#1C1511] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#3A271C] transition-colors shadow-md disabled:opacity-50"
                >
                  Publish changes
                </button>
              </div>
            </section>
          )}

          {/* ENQUIRIES SECTION */}
          {active === 'Enquiries' && (
            <section className={panel}>
              <h2 className="mb-5 font-serif text-2xl">Customer enquiries</h2>
              {enquiries.length === 0 ? (
                <p className="text-sm text-[#6B5546]">No enquiries have been received yet.</p>
              ) : (
                <div className="space-y-4">
                  {enquiries.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-[#D8CEC0] p-5 bg-[#F6F1E8]/20"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-serif text-lg font-medium">{item.full_name}</h3>
                          <p className="mt-1 text-sm text-[#3A271C]">
                            {item.phone} · Preferred contact: {item.preferred_contact}
                          </p>
                          <p className="mt-1 text-xs text-[#6B5546]">
                            {new Date(item.created_at).toLocaleString()} · Category:{' '}
                            {item.category}
                          </p>
                        </div>
                        <select
                          aria-label={'Status for ' + item.full_name}
                          className="rounded-xl border border-[#D8CEC0] bg-white p-2.5 text-xs font-medium focus:ring-2 focus:ring-[#C9A45C] outline-none"
                          value={item.status}
                          onChange={(e) =>
                            runSave(
                              () => updateEnquiry(item, e.target.value),
                              'Enquiry status updated.'
                            )
                          }
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      {item.subject && (
                        <p className="mt-3 font-medium text-sm text-[#1C1511]">
                          Subject: {item.subject}
                        </p>
                      )}
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#3A271C]">
                        {item.message}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* COLLECTIONS / PRODUCTS SECTION */}
          {active === 'Collections' && (
            <section className={panel}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl">Furniture Collections</h2>
                  <p className="text-xs text-[#6B5546] mt-1">
                    Manage catalogue products, materials, dimensions, and images.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setProductRows((prev) => [
                      {
                        id: '',
                        name: '',
                        category: 'living-room',
                        category_label: 'Living Room',
                        image_url:
                          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85',
                        description: '',
                        features: [],
                        dimensions: '',
                        materials: '',
                        is_published: false,
                        sort_order: prev.length,
                      },
                      ...prev,
                    ])
                  }
                  className="rounded-full bg-[#1C1511] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#3A271C] transition-colors shadow-sm"
                >
                  + Add Product
                </button>
              </div>

              <div className="space-y-6">
                {productRows.map((item, index) => (
                  <article
                    key={item.id || 'new-' + index}
                    className="rounded-2xl border border-[#D8CEC0] p-6 bg-[#F6F1E8]/20"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8B6A37]">
                        {item.name ? item.name : 'New Product'}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                          item.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.is_published ? 'Published' : 'Draft only'}
                      </span>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      {field('Product name', item.name, (v) =>
                        setProductRows((prev) =>
                          prev.map((r, i) => (i === index ? { ...r, name: v } : r))
                        )
                      )}

                      <label>
                        <span className={labelClass}>Category</span>
                        <select
                          className={inputClass}
                          value={item.category}
                          onChange={(e) =>
                            setProductRows((prev) =>
                              prev.map((r, i) =>
                                i === index
                                  ? {
                                      ...r,
                                      category: e.target.value,
                                      category_label:
                                        ({
                                          'living-room': 'Living Room',
                                          bedroom: 'Bedroom',
                                          custom: 'Custom Furniture',
                                          other: 'Other Furniture',
                                        } as Record<string, string>)[e.target.value] ||
                                        'Furniture',
                                    }
                                  : r
                              )
                            )
                          }
                        >
                          <option value="living-room">Living Room</option>
                          <option value="bedroom">Bedroom</option>
                          <option value="custom">Custom Furniture</option>
                          <option value="other">Other Furniture</option>
                        </select>
                      </label>

                      {field('Category label', item.category_label, (v) =>
                        setProductRows((prev) =>
                          prev.map((r, i) => (i === index ? { ...r, category_label: v } : r))
                        )
                      )}

                      {field('Materials', item.materials, (v) =>
                        setProductRows((prev) =>
                          prev.map((r, i) => (i === index ? { ...r, materials: v } : r))
                        )
                      )}

                      {field('Dimensions', item.dimensions, (v) =>
                        setProductRows((prev) =>
                          prev.map((r, i) => (i === index ? { ...r, dimensions: v } : r))
                        )
                      )}

                      {field(
                        'Features (comma separated)',
                        (item.features || []).join(', '),
                        (v) =>
                          setProductRows((prev) =>
                            prev.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    features: v
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  }
                                : r
                            )
                          )
                      )}

                      <div className="sm:col-span-2">
                        {field('Description', item.description, (v) =>
                          setProductRows((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, description: v } : r))
                          )
                        )}
                      </div>

                      {/* Product Image Control with Phone Upload */}
                      <div className="sm:col-span-2">
                        {renderImageUpload(
                          'Product Photo',
                          item.image_url,
                          `product-${index}`,
                          (file) => uploadImage(file, { kind: 'product', index }),
                          (v) =>
                            setProductRows((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, image_url: v } : r))
                            ),
                          `product-upload-input-${index}`
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-[#D8CEC0] pt-4">
                      <button
                        disabled={busy || uploadingTarget !== null}
                        onClick={() =>
                          runSave(
                            () => saveProduct(item, false),
                            `Product "${item.name || 'item'}" saved as draft.`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-[#D8CEC0] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#F6F1E8] transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Save size={14} /> Save draft
                      </button>
                      <button
                        disabled={busy || uploadingTarget !== null}
                        onClick={() =>
                          runSave(
                            () => saveProduct(item, true),
                            `Product "${item.name || 'item'}" published to catalogue.`
                          )
                        }
                        className="rounded-full bg-[#1C1511] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#3A271C] transition-colors shadow-md disabled:opacity-50"
                      >
                        Publish
                      </button>
                      {item.id && (
                        <button
                          disabled={busy || uploadingTarget !== null}
                          onClick={() =>
                            runSave(
                              () => deleteProduct(item),
                              `Product "${item.name}" deleted.`
                            )
                          }
                          className="rounded-full border border-red-200 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* GALLERY SECTION */}
          {active === 'Gallery' && (
            <section className={panel}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl">Gallery Images</h2>
                  <p className="text-xs text-[#6B5546] mt-1">
                    Showroom photography, interior designs, and completed client works.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setGalleryRows((prev) => [
                      {
                        id: '',
                        title: '',
                        category: 'Showroom',
                        image_url:
                          'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
                        description: '',
                        is_published: false,
                        sort_order: prev.length,
                      },
                      ...prev,
                    ])
                  }
                  className="rounded-full bg-[#1C1511] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#3A271C] transition-colors shadow-sm"
                >
                  + Add Gallery Image
                </button>
              </div>

              <div className="space-y-6">
                {galleryRows.map((item, index) => (
                  <article
                    key={item.id || 'new-' + index}
                    className="rounded-2xl border border-[#D8CEC0] p-6 bg-[#F6F1E8]/20"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8B6A37]">
                        {item.title ? item.title : 'New Gallery Photo'}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                          item.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.is_published ? 'Published' : 'Draft only'}
                      </span>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      {field('Title', item.title, (v) =>
                        setGalleryRows((prev) =>
                          prev.map((r, i) => (i === index ? { ...r, title: v } : r))
                        )
                      )}

                      <label>
                        <span className={labelClass}>Category</span>
                        <select
                          className={inputClass}
                          value={item.category}
                          onChange={(e) =>
                            setGalleryRows((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, category: e.target.value } : r
                              )
                            )
                          }
                        >
                          <option value="Living Room">Living Room</option>
                          <option value="Bedroom">Bedroom</option>
                          <option value="Furniture">Furniture</option>
                          <option value="Showroom">Showroom</option>
                          <option value="Interiors">Interiors</option>
                        </select>
                      </label>

                      <div className="sm:col-span-2">
                        {field('Description', item.description, (v) =>
                          setGalleryRows((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, description: v } : r))
                          )
                        )}
                      </div>

                      {/* Gallery Image Control with Phone Upload */}
                      <div className="sm:col-span-2">
                        {renderImageUpload(
                          'Gallery Photo',
                          item.image_url,
                          `gallery-${index}`,
                          (file) => uploadImage(file, { kind: 'gallery', index }),
                          (v) =>
                            setGalleryRows((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, image_url: v } : r))
                            ),
                          `gallery-upload-input-${index}`
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-[#D8CEC0] pt-4">
                      <button
                        disabled={busy || uploadingTarget !== null}
                        onClick={() =>
                          runSave(
                            () => saveGalleryItem(item, false),
                            `Gallery item "${item.title || 'item'}" saved as draft.`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-[#D8CEC0] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#F6F1E8] transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Save size={14} /> Save draft
                      </button>
                      <button
                        disabled={busy || uploadingTarget !== null}
                        onClick={() =>
                          runSave(
                            () => saveGalleryItem(item, true),
                            `Gallery item "${item.title || 'item'}" published to website.`
                          )
                        }
                        className="rounded-full bg-[#1C1511] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#3A271C] transition-colors shadow-md disabled:opacity-50"
                      >
                        Publish
                      </button>
                      {item.id && (
                        <button
                          disabled={busy || uploadingTarget !== null}
                          onClick={() =>
                            runSave(
                              () => deleteGalleryItem(item),
                              `Gallery item "${item.title}" deleted.`
                            )
                          }
                          className="rounded-full border border-red-200 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
