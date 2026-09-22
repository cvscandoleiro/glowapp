import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ProcedureItem {
  id: string;
  title: string;
  subtitle: string;
  modules: string;
  status: 'concluido' | 'em_andamento';
  statusLabel: string;
  colorScheme: 'blue' | 'purple' | 'pink' | 'emerald' | 'amber';
  iconType: 'desktop' | 'mobile' | 'wand';
}

export interface ClientProfile {
  id: string;
  name: string;
  gender: 'female' | 'male';
  avatar: string;
  inscriptionDate: string;
  birthDate: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  location: string;
  phone: string;
  isWhatsapp: boolean;
  email: string;
  instagram: string;
  xTwitter: string;
  facebook: string;
  cardNumber: string;
  planName: string;
  planBenefits: string[];
  procedures: ProcedureItem[];
}

const LOCAL_STORAGE_KEY = 'glowapp_clients';

// Map database row (snake_case) to ClientProfile (camelCase)
function mapFromDb(row: any): ClientProfile {
  return {
    id: row.id,
    name: row.name || '',
    gender: row.gender || 'female',
    avatar: row.avatar || '',
    inscriptionDate: row.inscription_date || '',
    birthDate: row.birth_date || '',
    cep: row.cep || '',
    address: row.address || '',
    number: row.number || '',
    complement: row.complement || '',
    neighborhood: row.neighborhood || '',
    city: row.city || '',
    state: row.state || '',
    location: row.location || '',
    phone: row.phone || '',
    isWhatsapp: row.is_whatsapp ?? true,
    email: row.email || '',
    instagram: row.instagram || '',
    xTwitter: row.x_twitter || '',
    facebook: row.facebook || '',
    cardNumber: row.card_number || '',
    planName: row.plan_name || '',
    planBenefits: row.plan_benefits || [],
    procedures: row.procedures || [],
  };
}

// Map ClientProfile (camelCase) to database row (snake_case)
function mapToDb(client: ClientProfile) {
  return {
    id: client.id,
    name: client.name,
    gender: client.gender,
    avatar: client.avatar,
    inscription_date: client.inscriptionDate,
    birth_date: client.birthDate,
    cep: client.cep,
    address: client.address,
    number: client.number,
    complement: client.complement,
    neighborhood: client.neighborhood,
    city: client.city,
    state: client.state,
    location: client.location,
    phone: client.phone,
    is_whatsapp: client.isWhatsapp,
    email: client.email,
    instagram: client.instagram,
    x_twitter: client.xTwitter,
    facebook: client.facebook,
    card_number: client.cardNumber,
    plan_name: client.planName,
    plan_benefits: client.planBenefits,
    procedures: client.procedures,
    updated_at: new Date().toISOString(),
  };
}

export const clientService = {
  // Fetch all clients (from Supabase or LocalStorage fallback)
  async getClients(fallbackDefaults: ClientProfile[]): Promise<ClientProfile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapFromDb);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }

        // If table is empty in Supabase, seed with default/cached clients
        if (!error && data && data.length === 0 && fallbackDefaults.length > 0) {
          await this.seedClients(fallbackDefaults);
          return fallbackDefaults;
        }
      } catch (err) {
        console.warn('Erro ao carregar clientes do Supabase. Usando armazenamento local.', err);
      }
    }

    // LocalStorage Fallback
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao ler cache local de clientes', e);
    }

    return fallbackDefaults;
  },

  // Save or update a client
  async saveClient(client: ClientProfile): Promise<void> {
    // 1. Update local cache immediately
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      let list: ClientProfile[] = cached ? JSON.parse(cached) : [];
      const index = list.findIndex(c => c.id === client.id);
      if (index >= 0) {
        list[index] = client;
      } else {
        list.push(client);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Erro ao salvar localmente:', e);
    }

    // 2. Sync to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('clients')
          .upsert(mapToDb(client), { onConflict: 'id' });

        if (error) {
          console.error('Erro ao salvar cliente no Supabase:', error);
        }
      } catch (err) {
        console.error('Falha de conexão com o Supabase ao salvar cliente:', err);
      }
    }
  },

  // Delete a client
  async deleteClient(clientId: string): Promise<void> {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const list: ClientProfile[] = JSON.parse(cached);
        const filtered = list.filter(c => c.id !== clientId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (e) {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('clients').delete().eq('id', clientId);
      } catch (err) {
        console.error('Erro ao deletar cliente no Supabase:', err);
      }
    }
  },

  // Initial seed for Supabase database
  async seedClients(clients: ClientProfile[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase || clients.length === 0) return;
    try {
      const rows = clients.map(mapToDb);
      await supabase.from('clients').upsert(rows, { onConflict: 'id' });
    } catch (err) {
      console.warn('Erro ao semear dados iniciais no Supabase:', err);
    }
  }
};
