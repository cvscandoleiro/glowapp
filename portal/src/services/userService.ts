import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthorizedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'profissional' | 'recepcao';
  status: 'ativo' | 'inativo';
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

const STORAGE_KEY = 'glowapp_authorized_gmail_users';

const DEFAULT_AUTHORIZED_USERS: AuthorizedUser[] = [
  {
    id: 'user-admin-scandoleiro',
    email: 'scandoleiro@gmail.com',
    name: 'Claudio Vieira (Scandoleiro)',
    role: 'admin',
    status: 'ativo',
    avatarUrl: '/default_avatar_male.png',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-admin-hemillyn',
    email: 'hemillyncosta@gmail.com',
    name: 'Hemillyn Costa',
    role: 'admin',
    status: 'ativo',
    avatarUrl: '/default_avatar_female.png',
    createdAt: new Date().toISOString(),
  }
];

export const userService = {
  // 1. Get all authorized users
  async getAuthorizedUsers(): Promise<AuthorizedUser[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('authorized_users')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            email: row.email,
            name: row.name || row.email.split('@')[0],
            role: row.role || 'profissional',
            status: row.status || 'ativo',
            avatarUrl: row.avatar_url || '/default_avatar_female.png',
            createdAt: row.created_at || new Date().toISOString(),
            lastLoginAt: row.last_login_at
          }));
        }
      } catch (err) {
        console.warn('[UserService] Falha ao consultar Supabase, usando storage local:', err);
      }
    }

    // Local Storage fallback with default seed merge
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed: AuthorizedUser[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure default admins (e.g. scandoleiro@gmail.com) are always present
          let hasNewDefaults = false;
          const merged = [...parsed];
          for (const defUser of DEFAULT_AUTHORIZED_USERS) {
            if (!merged.some(u => u.email.toLowerCase() === defUser.email.toLowerCase())) {
              merged.push(defUser);
              hasNewDefaults = true;
            }
          }
          if (hasNewDefaults) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
          return merged;
        }
      }
    } catch (e) {}

    // Initialize with default
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_AUTHORIZED_USERS));
    return DEFAULT_AUTHORIZED_USERS;
  },

  // 2. Add new authorized Gmail account
  async addAuthorizedUser(
    email: string,
    name: string,
    role: 'admin' | 'profissional' | 'recepcao' = 'profissional'
  ): Promise<{ user?: AuthorizedUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // Strict validation: must be a valid @gmail.com or google email
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: 'Por favor, informe um endereço de email válido.' };
    }

    if (!cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('@googlemail.com')) {
      return { error: 'Apenas contas Google / Gmail (@gmail.com) podem ser adicionadas para acesso.' };
    }

    const currentUsers = await this.getAuthorizedUsers();
    if (currentUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { error: `O email ${cleanEmail} já está cadastrado na lista de autorizados.` };
    }

    const newUser: AuthorizedUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: name.trim() || cleanEmail.split('@')[0],
      role,
      status: 'ativo',
      avatarUrl: '/default_avatar_female.png',
      createdAt: new Date().toISOString()
    };

    // Save to Supabase if available
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('authorized_users').upsert({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status,
          avatar_url: newUser.avatarUrl,
          created_at: newUser.createdAt
        });
      } catch (e) {
        console.warn('[UserService] Erro ao gravar usuário no Supabase:', e);
      }
    }

    // Save to LocalStorage
    const updated = [...currentUsers, newUser];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { user: newUser };
  },

  // 3. Update user status or role
  async updateAuthorizedUser(id: string, updates: Partial<AuthorizedUser>): Promise<void> {
    const currentUsers = await this.getAuthorizedUsers();
    const updated = currentUsers.map(u => u.id === id ? { ...u, ...updates } : u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('authorized_users').update({
          name: updates.name,
          role: updates.role,
          status: updates.status,
          avatar_url: updates.avatarUrl,
          last_login_at: updates.lastLoginAt
        }).eq('id', id);
      } catch (e) {
        console.warn('[UserService] Erro ao atualizar no Supabase:', e);
      }
    }
  },

  // 4. Remove authorized user
  async removeAuthorizedUser(id: string): Promise<void> {
    const currentUsers = await this.getAuthorizedUsers();
    const updated = currentUsers.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('authorized_users').delete().eq('id', id);
      } catch (e) {
        console.warn('[UserService] Erro ao remover do Supabase:', e);
      }
    }
  },

  // 5. Check if email is authorized to access
  async isEmailAuthorized(email: string): Promise<boolean> {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const users = await this.getAuthorizedUsers();
    
    // If no users registered yet, allow the initial user to bootstrap
    if (users.length === 0) return true;

    return users.some(u => u.email.toLowerCase() === cleanEmail && u.status === 'ativo');
  },

  // 6. Record login timestamp
  async recordUserLogin(email: string): Promise<void> {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    const users = await this.getAuthorizedUsers();
    const matched = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (matched) {
      await this.updateAuthorizedUser(matched.id, { lastLoginAt: new Date().toISOString() });
    }
  }
};
