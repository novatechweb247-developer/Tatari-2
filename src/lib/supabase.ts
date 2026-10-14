import { createClient } from '@supabase/supabase-js';
import { HERO_SLIDES, BUSINESS_INFO, PRODUCTS, GALLERY_ITEMS } from '../data';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isRealSupabase = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl.startsWith('https://') &&
  !rawKey.includes('your-sb_publishable-key') &&
  rawKey.trim().length > 10
);

// Always marked as configured so the Admin Center works reliably out-of-the-box
// Report configured only when the real shared Supabase client can be created.
export const isSupabaseConfigured = isRealSupabase;

// Helper for local browser-persisted mock database
const STORAGE_PREFIX = 'tatari_db_';
const inMemoryMedia = new Map<string, string>();

function getStored<T>(key: string, defaultFactory: () => T): T {
  if (typeof window === 'undefined') return defaultFactory();
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) {
      const initial = defaultFactory();
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return defaultFactory();
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('[Tatari Local Store] write error (falling back to memory)', err);
  }
}

// Initial default seed generators
const getInitialHeroSlides = () =>
  HERO_SLIDES.map((s, idx) => ({
    slide_number: idx + 1,
    title: s.title,
    subtitle: s.subtitle,
    badge: s.badge,
    image_url: s.image,
    button_text: idx === 2 ? 'Contact Us' : 'Explore Collections',
    button_url: idx === 2 ? '/contact' : '/collections',
    is_published: true,
    draft_data: null,
  }));

const getInitialSiteSettings = () => [
  {
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
  },
];

const getInitialProducts = () =>
  PRODUCTS.map((p, idx) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    category_label: p.categoryLabel,
    image_url: p.image,
    description: p.description,
    features: p.features || [],
    dimensions: p.dimensions || '',
    materials: p.materials || '',
    is_published: true,
    sort_order: idx,
    draft_data: null,
  }));

const getInitialGallery = () =>
  GALLERY_ITEMS.map((g, idx) => ({
    id: g.id,
    title: g.title,
    category: g.category,
    image_url: g.image,
    description: g.description,
    is_published: true,
    sort_order: idx,
    draft_data: null,
  }));

const getInitialEnquiries = () => [
  {
    id: 'enq-demo-1',
    full_name: 'Bulus Dung',
    phone: '0802 345 6789',
    category: 'Living Room',
    subject: 'Executive Sectional Sofa inquiry',
    message:
      'Hello Tatari team, I would like to enquire about purchasing the Royal Executive Sectional Sofa in custom navy velvet.',
    preferred_contact: 'WhatsApp',
    status: 'new',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

const getInitialAdminUsers = () => [
  { user_id: 'tatari-admin-user' },
];

function getTableData(table: string): any[] {
  switch (table) {
    case 'hero_slides':
      return getStored('hero_slides', getInitialHeroSlides);
    case 'site_settings':
      return getStored('site_settings', getInitialSiteSettings);
    case 'products':
      return getStored('products', getInitialProducts);
    case 'gallery_items':
      return getStored('gallery_items', getInitialGallery);
    case 'enquiries':
      return getStored('enquiries', getInitialEnquiries);
    case 'admin_users':
      return getStored('admin_users', getInitialAdminUsers);
    default:
      return getStored(table, () => []);
  }
}

function setTableData(table: string, data: any[]): void {
  setStored(table, data);
}

// Fluent mock query builder mirroring Supabase's PostgREST API
class MockQueryBuilder implements PromiseLike<any> {
  private table: string;
  private selectCols?: string;
  private isCountExact = false;
  private isHead = false;
  private conditions: Array<{ col: string; val: any }> = [];
  private orderConfig?: { col: string; ascending: boolean };
  private limitCount?: number;
  private isSingle = false;
  private isMaybeSingle = false;
  private pendingUpdate?: any;
  private pendingUpsert?: { values: any; onConflict?: string };
  private pendingInsert?: any;
  private isDelete = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*', options?: { count?: 'exact'; head?: boolean }) {
    this.selectCols = columns;
    if (options?.count === 'exact') this.isCountExact = true;
    if (options?.head) this.isHead = true;
    return this;
  }

  eq(col: string, val: any) {
    this.conditions.push({ col, val });
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orderConfig = { col, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  update(values: any) {
    this.pendingUpdate = values;
    return this;
  }

  upsert(values: any, options?: { onConflict?: string }) {
    this.pendingUpsert = { values, onConflict: options?.onConflict };
    return this;
  }

  insert(values: any) {
    this.pendingInsert = values;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  private execute() {
    const tableData = [...getTableData(this.table)];

    // Handle UPSERT
    if (this.pendingUpsert !== undefined) {
      const { values, onConflict } = this.pendingUpsert;
      const items = Array.isArray(values) ? values : [values];
      const conflictKey = onConflict || (this.table === 'hero_slides' ? 'slide_number' : 'id');

      const nextData = [...tableData];
      for (const item of items) {
        const idx = nextData.findIndex(
          (r) => String(r[conflictKey]) === String(item[conflictKey])
        );
        if (idx >= 0) {
          nextData[idx] = { ...nextData[idx], ...item };
        } else {
          nextData.push({
            id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            created_at: item.created_at || new Date().toISOString(),
            ...item,
          });
        }
      }
      setTableData(this.table, nextData);
      return { data: Array.isArray(values) ? values : values, error: null };
    }

    // Handle INSERT
    if (this.pendingInsert !== undefined) {
      const items = Array.isArray(this.pendingInsert) ? this.pendingInsert : [this.pendingInsert];
      const inserted = items.map((item, idx) => ({
        id: item.id || `item-${Date.now()}-${idx}`,
        created_at: item.created_at || new Date().toISOString(),
        ...item,
      }));
      const nextData = [...tableData, ...inserted];
      setTableData(this.table, nextData);
      return { data: Array.isArray(this.pendingInsert) ? inserted : inserted[0], error: null };
    }

    // Handle UPDATE
    if (this.pendingUpdate !== undefined) {
      let updatedCount = 0;
      const nextData = tableData.map((row) => {
        const matches = this.conditions.length > 0 && this.conditions.every((c) => String(row[c.col]) === String(c.val));
        if (matches) {
          updatedCount++;
          return { ...row, ...this.pendingUpdate };
        }
        return row;
      });
      setTableData(this.table, nextData);
      return { data: null, count: updatedCount, error: null };
    }

    // Handle DELETE
    if (this.isDelete) {
      const nextData = tableData.filter((row) => {
        return !this.conditions.every((c) => String(row[c.col]) === String(c.val));
      });
      setTableData(this.table, nextData);
      return { data: null, error: null };
    }

    // Handle SELECT
    let filtered = tableData.filter((row) => {
      return this.conditions.every((c) => String(row[c.col]) === String(c.val));
    });

    if (this.orderConfig) {
      const { col, ascending } = this.orderConfig;
      filtered.sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        if (av === bv) return 0;
        if (ascending) return av > bv ? 1 : -1;
        return av < bv ? 1 : -1;
      });
    }

    const totalCount = filtered.length;

    if (this.limitCount !== undefined) {
      filtered = filtered.slice(0, this.limitCount);
    }

    if (this.isHead) {
      return { data: [], count: totalCount, error: null };
    }

    if (this.isSingle) {
      return { data: filtered[0] || null, count: totalCount, error: null };
    }

    if (this.isMaybeSingle) {
      return { data: filtered[0] || null, count: totalCount, error: null };
    }

    return {
      data: filtered,
      count: this.isCountExact ? totalCount : undefined,
      error: null,
    };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const result = this.execute();
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

// Media storage mock
const mockStorage = {
  from: (bucket: string) => ({
    upload: async (
      path: string,
      file: File,
      _options?: { upsert?: boolean; contentType?: string }
    ) => {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        inMemoryMedia.set(`${bucket}_${path}`, dataUrl);
        try {
          setStored(`media_${bucket}_${path}`, dataUrl);
        } catch (e) {
          console.warn('[Storage quota exceeded, keeping in memory]', e);
        }
        return { data: { path }, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },
    getPublicUrl: (path: string) => {
      const mem = inMemoryMedia.get(`${bucket}_${path}`);
      const stored = getStored<string | null>(`media_${bucket}_${path}`, () => null);
      return { data: { publicUrl: mem || stored || path } };
    },
  }),
};

// Auth mock
const mockAuth = {
  getSession: async () => {
    const session = getStored<any | null>('auth_session', () => null);
    return { data: { session }, error: null };
  },
  signInWithPassword: async ({ email }: { email: string; password?: string }) => {
    const user = {
      id: 'tatari-admin-user',
      email: email || 'admin@tatari.com',
      role: 'authenticated',
    };
    const session = {
      user,
      access_token: 'tatari-mock-token-' + Date.now(),
      expires_at: Math.floor(Date.now() / 1000) + 86400,
    };
    setStored('auth_session', session);
    // Ensure admin user exists in admin_users
    const admins = getStored<any[]>('admin_users', getInitialAdminUsers);
    if (!admins.some((a) => a.user_id === user.id)) {
      setStored('admin_users', [...admins, { user_id: user.id }]);
    }
    return { data: { user, session }, error: null };
  },
  signOut: async () => {
    setStored('auth_session', null);
    return { error: null };
  },
};

// Standalone fallback Supabase client
const createFallbackClient = () => ({
  from: (table: string) => new MockQueryBuilder(table),
  storage: mockStorage,
  auth: mockAuth,
});

// Primary exported client: uses real Supabase if keys are provided, fallback otherwise
export const supabase = isRealSupabase
  ? createClient(rawUrl!, rawKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (createFallbackClient() as any);
