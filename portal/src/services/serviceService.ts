import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes?: number;
  status: 'ativo' | 'inativo';
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

const LOCAL_STORAGE_KEY = 'glowapp_services';

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    name: 'Limpeza de Pele Profunda',
    description: 'Higienização, extração de cravos e fototerapia LED',
    price: 180.00,
    durationMinutes: 60,
    status: 'ativo',
    category: 'Facial'
  },
  {
    id: 'srv-2',
    name: 'Harmonização Facial & Botox',
    description: 'Aplicação de toxina botulínica e contorno facial',
    price: 850.00,
    durationMinutes: 90,
    status: 'ativo',
    category: 'Injetáveis'
  },
  {
    id: 'srv-3',
    name: 'Drenagem Linfática Corporal',
    description: 'Massagem manual para redução de retenção hídrica',
    price: 150.00,
    durationMinutes: 50,
    status: 'ativo',
    category: 'Corporal'
  },
  {
    id: 'srv-4',
    name: 'Micropigmentação Shadow Line',
    description: 'Design e micropigmentação de sobrancelhas fio a fio',
    price: 420.00,
    durationMinutes: 120,
    status: 'ativo',
    category: 'Sobrancelhas'
  },
  {
    id: 'srv-5',
    name: 'Peeling Químico Iluminador',
    description: 'Renovação celular e clareamento uniforme com ácidos',
    price: 260.00,
    durationMinutes: 45,
    status: 'inativo',
    category: 'Facial'
  }
];

function mapFromDb(row: any): ServiceItem {
  return {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    price: Number(row.price) || 0,
    durationMinutes: row.duration_minutes || 60,
    status: row.status === 'inativo' ? 'inativo' : 'ativo',
    category: row.category || 'Geral',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapToDb(srv: ServiceItem) {
  return {
    id: srv.id,
    name: srv.name,
    description: srv.description || '',
    price: srv.price,
    duration_minutes: srv.durationMinutes || 60,
    status: srv.status,
    category: srv.category || 'Geral',
    updated_at: new Date().toISOString()
  };
}

export const serviceService = {
  async getServices(): Promise<ServiceItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapFromDb);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch services failed, fallback to local storage:', err);
      }
    }

    // LocalStorage Fallback
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // use default
      }
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES));
    return DEFAULT_SERVICES;
  },

  async saveService(service: ServiceItem): Promise<ServiceItem> {
    // 1. Update local storage
    const current = await this.getServices();
    const idx = current.findIndex(s => s.id === service.id);
    let updated: ServiceItem[];
    if (idx >= 0) {
      updated = current.map(s => (s.id === service.id ? service : s));
    } else {
      updated = [service, ...current];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // 2. Persist in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRow = mapToDb(service);
        await supabase
          .from('services')
          .upsert(dbRow, { onConflict: 'id' });
      } catch (err) {
        console.error('Supabase upsert service error:', err);
      }
    }

    return service;
  },

  async deleteService(serviceId: string): Promise<boolean> {
    const current = await this.getServices();
    const filtered = current.filter(s => s.id !== serviceId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('services').delete().eq('id', serviceId);
      } catch (err) {
        console.error('Supabase delete service error:', err);
      }
    }
    return true;
  }
};
