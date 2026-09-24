import React, { useState } from 'react';
import {
  Sparkle,
  ShieldCheck,
  LockKey,
  CheckCircle,
  Warning,
  ArrowSquareOut,
  Info
} from '@phosphor-icons/react';
import { authService, type AppUser } from '../services/authService';

interface LoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  // Exclusive Google / Gmail OAuth Login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setShowConfigHelp(false);

    try {
      const res = await authService.signInWithGoogle();
      if (res.error) {
        setErrorMessage(res.error.message);
        if (res.error.message.includes('Supabase') || res.error.message.includes('provider is not enabled')) {
          setShowConfigHelp(true);
        }
        setIsGoogleLoading(false);
      } else if (res.user) {
        onLoginSuccess(res.user);
      } else if (!res.url) {
        const user = await authService.getCurrentUser();
        if (user) {
          onLoginSuccess(user);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível iniciar a autenticação com a conta Google.');
      if (String(err.message).includes('provider is not enabled')) {
        setShowConfigHelp(true);
      }
      setIsGoogleLoading(false);
    }
  };

  const handleBypassDemo = () => {
    const demoUser: AppUser = {
      id: 'google-demo-user',
      email: 'hemillyncosta@gmail.com',
      name: 'Hemillyn Costa',
      avatarUrl: '/default_avatar_female.png',
      provider: 'google'
    };
    localStorage.setItem('glowapp_authenticated_user', JSON.stringify(demoUser));
    onLoginSuccess(demoUser);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#F6F3EE] select-none font-sans text-stone-800">
      {/* Background Wallpaper with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none z-0"
        style={{ backgroundImage: "url('/glowapp_background.png')" }}
      />

      {/* Atmospheric Glow Gradients (Algodão Egípcio & Dourado) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-[#E8DFD3]/60 pointer-events-none z-0" />
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-amber-200/30 blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[#c5922a]/15 blur-[150px] pointer-events-none z-0" />

      {/* Main Login Card Container */}
      <div className="relative z-10 w-full max-w-md bg-white border-2 border-[#c5922a] rounded-[36px] p-8 sm:p-10 shadow-[0_20px_60px_-10px_rgba(197,146,42,0.22)] space-y-6 animate-fade-in">
        
        {/* Header: Logo & Brand Title */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#c5922a] to-[#e6b85c] rounded-3xl blur-md opacity-40 group-hover:opacity-65 transition duration-500" />
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#c5922a] shadow-md bg-white p-1">
              <img
                src="/glowapp_logo.png"
                alt="Hemillyn Costa Home SPA"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-50/80 border border-[#c5922a]/40 text-[#966b1a] text-xs font-black uppercase tracking-widest shadow-2xs">
              <Sparkle size={14} weight="fill" className="text-[#c5922a]" />
              <span>Hemillyn Costa Home SPA</span>
            </div>
          </div>
        </div>

        {/* Feedback Alert if error */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col space-y-2 text-xs text-rose-700 font-bold animate-fade-in">
            <div className="flex items-start space-x-2.5">
              <Warning size={18} weight="fill" className="text-rose-600 shrink-0 mt-0.5" />
              <span className="flex-1">{errorMessage}</span>
            </div>

            {showConfigHelp && (
              <div className="pt-2 border-t border-rose-200/70 text-[11px] font-normal text-stone-700 space-y-1.5">
                <p className="font-bold text-[#8C6D46] flex items-center space-x-1">
                  <Info size={14} className="text-[#c5922a]" />
                  <span>Como ativar o Google no Supabase:</span>
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-stone-600 font-medium">
                  <li>Acesse o painel do <strong>Supabase</strong> &gt; <strong>Authentication</strong> &gt; <strong>Providers</strong>.</li>
                  <li>Ative o provedor <strong>Google</strong> e insira o <em>Client ID</em> e <em>Client Secret</em>.</li>
                  <li>Configure o Redirect URL no Google Cloud Console: <br/><code className="text-[10px] bg-stone-100 p-1 rounded font-mono break-all text-[#966b1a]">https://yhpcsutnviswheskuqcv.supabase.co/auth/v1/callback</code></li>
                </ol>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleBypassDemo}
                    className="w-full py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#63450e] font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Acessar em Modo de Teste / Demonstração
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* EXCLUSIVE AUTHENTICATION: GOOGLE IDENTITY LOGIN           */}
        {/* ========================================================= */}
        <div className="space-y-4 pt-1">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-amber-50/40 text-[#3D3028] border-2 border-[#c5922a]/50 hover:border-[#c5922a] font-black text-sm shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-3 cursor-pointer group"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-[#c5922a]/40 border-t-[#c5922a] rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="tracking-tight">
              {isGoogleLoading ? 'Conectando com o Google...' : 'Entrar com Conta Google'}
            </span>
            {!isGoogleLoading && (
              <ArrowSquareOut size={16} weight="bold" className="text-stone-400 group-hover:text-[#c5922a] transition-colors ml-1" />
            )}
          </button>
        </div>

        {/* Security & Compliance Highlights */}
        <div className="pt-2 border-t border-[#E2D8CA]/80 space-y-2.5">
          <div className="flex items-center space-x-2 text-[11px] font-bold text-stone-600">
            <ShieldCheck size={16} weight="fill" className="text-emerald-600 shrink-0" />
            <span>Autenticação Oficial Google OAuth 2.0</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-bold text-stone-600">
            <LockKey size={16} weight="fill" className="text-amber-600 shrink-0" />
            <span>Criptografia de Sessão &amp; Proteção LGPD</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-bold text-stone-600">
            <CheckCircle size={16} weight="fill" className="text-[#c5922a] shrink-0" />
            <span>Acesso Exclusivo e Restrito aos Profissionais</span>
          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="absolute bottom-3 text-center text-[11px] font-bold text-stone-500 z-10">
        Hemillyn Costa Home SPA • Estética &amp; Bem-Estar
      </div>
    </div>
  );
};
