import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { userService } from './userService';
import type { User, Session } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  provider: 'google' | 'demo';
}

const LOCAL_USER_KEY = 'glowapp_authenticated_user';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '213739772-dqruet4d7eal2r3563p0j9in5kf7ivm6.apps.googleusercontent.com';

type AuthListener = (user: AppUser | null) => void;
const listeners: Set<AuthListener> = new Set();

function notifyListeners(user: AppUser | null) {
  listeners.forEach(fn => {
    try {
      fn(user);
    } catch (e) {
      console.error('[Auth] Erro no listener:', e);
    }
  });
}

export const authService = {
  // 1. Sign In exclusively via Google OAuth 2.0 (Direct GIS + Fallback)
  async signInWithGoogle(): Promise<{ user?: AppUser; error: Error | null; url?: string }> {
    return new Promise((resolve) => {
      // Check if Google Identity Services script is available
      const google = (window as any).google;

      if (google?.accounts?.oauth2) {
        try {
          const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'email profile openid',
            prompt: 'select_account',
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                console.error('[Google GIS] Erro no consentimento:', tokenResponse);
                resolve({ error: new Error(tokenResponse.error_description || tokenResponse.error || 'Acesso cancelado pelo usuário.') });
                return;
              }

              try {
                // Fetch verified profile from Google's official userinfo API
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`
                  }
                });

                if (!res.ok) {
                  throw new Error('Falha ao obter perfil autenticado do Google.');
                }

                const profile = await res.json();
                const userEmail = profile.email || '';

                // Enforce Gmail whitelist verification
                const isAllowed = await userService.isEmailAuthorized(userEmail);
                if (!isAllowed) {
                  resolve({
                    error: new Error(
                      `Acesso Negado: O email ${userEmail} não possui autorização de acesso ao portal. Solicite a inclusão do seu Gmail na Gestão de Usuários.`
                    )
                  });
                  return;
                }

                await userService.recordUserLogin(userEmail);

                const appUser: AppUser = {
                  id: profile.sub || `google-${Date.now()}`,
                  email: userEmail,
                  name: profile.name || 'Hemillyn Costa',
                  avatarUrl: profile.picture || '/default_avatar_female.png',
                  provider: 'google'
                };

                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
                notifyListeners(appUser);
                resolve({ user: appUser, error: null });
              } catch (err: any) {
                console.error('[Google GIS] Erro ao carregar perfil:', err);
                resolve({ error: err });
              }
            },
            error_callback: (nonOAuthErr: any) => {
              console.error('[Google GIS] Erro popup:', nonOAuthErr);
              resolve({ error: new Error('Não foi possível abrir a janela do Google. Verifique se popups estão habilitados.') });
            }
          });

          tokenClient.requestAccessToken();
          return;
        } catch (err: any) {
          console.warn('[Google GIS] Falha ao iniciar token client direto:', err);
        }
      }

      // Fallback: Supabase OAuth if GIS not loaded yet
      if (isSupabaseConfigured && supabase) {
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: { access_type: 'offline', prompt: 'select_account' }
          }
        }).then(({ data, error }) => {
          if (error) {
            resolve({ error: new Error('O provedor Google precisa ser ativado no painel do Supabase ou aguarde o script Google carregar.') });
          } else {
            resolve({ error: null, url: data.url });
          }
        }).catch(err => {
          resolve({ error: err });
        });
        return;
      }

      // Offline demo fallback
      const demoUser: AppUser = {
        id: 'google-demo-user',
        email: 'hemillyncosta@gmail.com',
        name: 'Hemillyn Costa',
        avatarUrl: '/default_avatar_female.png',
        provider: 'google'
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
      notifyListeners(demoUser);
      resolve({ user: demoUser, error: null });
    });
  },

  // 2. Sign Out
  async signOut(): Promise<void> {
    localStorage.removeItem(LOCAL_USER_KEY);
    notifyListeners(null);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Auth] Erro ao encerrar sessão no Supabase:', err);
      }
    }
  },

  // 3. Get Current User (Verifies Local Storage or Supabase)
  async getCurrentUser(): Promise<AppUser | null> {
    // 1. Check local storage
    try {
      const cached = localStorage.getItem(LOCAL_USER_KEY);
      if (cached) {
        const user = JSON.parse(cached);
        if (user && user.id) return user;
      }
    } catch (e) {}

    // 2. Check Supabase session
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          const appUser = this.mapSupabaseUser(sessionData.session.user);
          if (appUser) {
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
            return appUser;
          }
        }
      } catch (err) {
        console.warn('[Auth] Erro ao validar sessão:', err);
      }
    }

    return null;
  },

  // 4. Subscribe to Auth State Changes
  onAuthStateChange(callback: (user: AppUser | null) => void): () => void {
    listeners.add(callback);

    // Also listen to Supabase auth events if present
    let unsubscribeSb = () => {};
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event: string, session: Session | null) => {
          if (event === 'SIGNED_OUT' || !session?.user) {
            // Keep local user if logged in via Google Identity Services
            const localUser = localStorage.getItem(LOCAL_USER_KEY);
            if (!localUser) {
              callback(null);
            }
            return;
          }

          const appUser = this.mapSupabaseUser(session.user);
          if (appUser) {
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
            callback(appUser);
          }
        }
      );
      unsubscribeSb = () => authListener.subscription.unsubscribe();
    }

    return () => {
      listeners.delete(callback);
      unsubscribeSb();
    };
  },

  // Helper to safely parse user profile from Google OAuth metadata
  mapSupabaseUser(sbUser: User | null): AppUser | null {
    if (!sbUser) return null;
    const meta = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      email: sbUser.email || meta.email,
      name: meta.full_name || meta.name || meta.user_name || sbUser.email?.split('@')[0] || 'Hemillyn Costa',
      avatarUrl: meta.avatar_url || meta.picture || '/default_avatar_female.png',
      provider: 'google'
    };
  }
};
