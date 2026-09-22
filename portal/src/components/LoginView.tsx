import React, { useState, useEffect, useRef } from 'react';
import { getAvatarById } from '../utils/avatarRepository';

// Inline Windows Logo SVG component – professional 4-pane style
const WindowsLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 88 88"
    width={size}
    height={size}
    className={className}
  >
    <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203z" fill="#F25022" />
    <path d="M39.996 6.984L87.318 0v41.651l-47.318.376z" fill="#7FBA00" />
    <path d="M0 45.037l35.687-.277.052 34.428-35.739 4.978z" fill="#00A4EF" />
    <path d="M39.996 44.823l47.318-.376v41.652L39.993 91z" fill="#FFB900" />
  </svg>
);

// Renders an avatar circle: real photo > avatar SVG > initials fallback
const MemberAvatar: React.FC<{
  nome: string;
  avatar?: string | null;
  avatarImage?: string | null;
  size?: 'sm' | 'md' | 'lg';
}> = ({ nome, avatar, avatarImage, size = 'sm' }) => {
  const sizeClass =
    size === 'lg'
      ? 'w-12 h-12 sm:w-14 sm:h-14 text-base'
      : size === 'md'
      ? 'w-8 h-8 text-xs'
      : 'w-6 h-6 sm:w-7 sm:h-7 text-[10px]';

  const avatarObj = avatar ? getAvatarById(avatar) : null;
  const gradient = avatarObj?.gradient ?? 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)';
  const initial = (nome || '?')[0].toUpperCase();

  if (avatarImage) {
    return (
      <div className={`${sizeClass} rounded-full flex-shrink-0 overflow-hidden border border-white/20`}>
        <img src={avatarImage} alt={nome} className="w-full h-full object-cover" />
      </div>
    );
  }

  if (avatarObj) {
    return (
      <div
        className={`${sizeClass} rounded-full flex-shrink-0 flex items-center justify-center border border-white/10`}
        style={{ background: gradient }}
      >
        <span className="w-[55%] h-[55%] flex items-center justify-center text-white">
          {avatarObj.icon}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white border border-white/10`}
      style={{ background: gradient }}
    >
      {initial}
    </div>
  );
};

interface LoginViewProps {
  onLoginSuccess: (username: string, fullName: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [squad, setSquad] = useState<any[]>([]);
  const [detectedUser, setDetectedUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [loadingWindowsUser, setLoadingWindowsUser] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const normalizeUsername = (user: string): string => {
    let normalized = user.trim().toLowerCase();
    if (normalized.includes('\\')) normalized = normalized.split('\\')[1];
    if (normalized.includes('/')) normalized = normalized.split('/').pop() || normalized;
    return normalized;
  };

  const resolveMember = (username: string, squadList: any[]): any | null =>
    squadList.find((member: any) => {
      if (!member.email) return false;
      const emailPart = member.email.split('@')[0].trim().toLowerCase();
      return emailPart === username.trim().toLowerCase();
    }) || null;

  const detectUser = async () => {
    setLoadingWindowsUser(true);
    setError('');
    try {
      const [statusRes, squadRes] = await Promise.all([
        fetch('/api/connection-status'),
        fetch('/api/squad'),
      ]);

      if (!statusRes.ok) {
        setError('Erro de comunicação com o servidor.');
        return;
      }

      const data = await statusRes.json();
      let squadList: any[] = [];

      if (squadRes.ok) {
        squadList = await squadRes.json();
        setSquad(squadList);
      }

      if (data.osUser) {
        const normalized = normalizeUsername(data.osUser);
        setDetectedUser(normalized);
        setSelectedUser(normalized);
        const matched = resolveMember(normalized, squadList);
        if (matched) {
          setSelectedMember(matched);
          setUserFullName(matched.nome);
        } else {
          setSelectedMember(null);
          setUserFullName(normalized);
        }
      } else {
        setError('Usuário Windows não detectado.');
      }
    } catch {
      setError('Erro ao conectar ao servidor.');
    } finally {
      setLoadingWindowsUser(false);
    }
  };

  useEffect(() => { detectUser(); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showDropdown) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearchQuery('');
  }, [showDropdown]);

  const handleSelectUser = (member: any) => {
    const emailPrefix = member.email ? member.email.split('@')[0].toLowerCase() : '';
    setSelectedUser(emailPrefix);
    setSelectedMember(member);
    setUserFullName(member.nome);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(selectedUser, userFullName || selectedUser);
    }, 800);
  };

  const filteredSquad = [...squad]
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
    .filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (m.nome || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
    });

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center p-3 sm:p-4 lg:p-6 font-sans select-none relative overflow-auto"
      style={{ background: 'linear-gradient(180deg, #64183f 0%, #1a1f44 100%)' }}
    >
      {/* Background ambient lights */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#64E0F0]/5 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#724176]/10 blur-[150px] pointer-events-none z-0" />

      {/* Minsait Logo */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 z-20">
        <img
          src="/minsait_logo.png"
          alt="Minsait Logo"
          className="h-5 sm:h-6 w-auto object-contain brightness-0 invert opacity-90"
        />
      </div>

      {/* Main Container – two panels side-by-side on md+, single column on mobile */}
      <div className="w-full max-w-5xl xl:max-w-[1300px] flex gap-3 relative z-10 my-10 sm:my-0">

        {/* LEFT PANEL – hidden on small screens */}
        <div className="hidden md:flex md:w-1/2 rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden relative group border border-white/5 shadow-2xl min-h-[520px] lg:min-h-[600px]">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: "url('/bg-portal.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#64183f]/60 to-[#1a1f44]/90 mix-blend-multiply" />
          <div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-end z-10 text-white">
            <p className="text-slate-200/80 text-sm leading-relaxed max-w-xs">
              Gerencie cronogramas, acompanhe recursos e otimize a entrega de seus projetos de forma integrada e ágil.
            </p>
          </div>
        </div>

        {/* CENTRAL CIRCLE DIVIDER */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 lg:w-16 lg:h-16 bg-[#0a0a0f] rounded-full z-20 items-center justify-center shadow-lg border border-white/5">
          <div className="flex space-x-1">
            <span className="w-3 h-1.5 lg:w-4 lg:h-2 rounded-full bg-white" />
            <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-white/30" />
          </div>
        </div>

        {/* RIGHT PANEL – full width on mobile, half on md+ */}
        <div
          className="w-full md:w-1/2 rounded-[2rem] lg:rounded-[2.5rem] flex flex-col justify-between
                     p-5 sm:p-6 lg:p-8
                     relative overflow-visible
                     border border-white/5 shadow-2xl text-white backdrop-blur-md"
          style={{ background: 'linear-gradient(180deg, rgba(100, 24, 63, 0.5) 0%, rgba(26, 31, 68, 0.5) 100%)' }}
        >
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#64E0F0]/5 blur-[100px] pointer-events-none z-0" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#724176]/10 blur-[100px] pointer-events-none z-0" />

          {/* Form Content */}
          <div className="w-full max-w-[380px] mx-auto flex flex-col gap-4 sm:gap-5 z-10 py-2 sm:py-4">

            {/* Logo */}
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="GlowApp Logo"
                className="h-20 sm:h-24 lg:h-28 w-auto object-contain brightness-0 invert"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs px-4 py-2.5 rounded-xl text-center font-bold">
                {error}
              </div>
            )}

            {/* Loading / Form / Retry */}
            {loadingWindowsUser ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-t-transparent border-white/50 rounded-full animate-spin" />
                <span className="text-slate-300 font-semibold text-[10px] sm:text-xs tracking-wider uppercase">
                  Detectando usuário Windows...
                </span>
              </div>
            ) : detectedUser ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">

                {/* Greeting with avatar */}
                <div className="text-center space-y-2">
                  <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">Bem-vindo ao portal</p>
                  <div className="flex justify-center">
                    <div className="relative">
                      <MemberAvatar
                        nome={userFullName || selectedUser}
                        avatar={selectedMember?.avatar}
                        avatarImage={selectedMember?.avatarImage}
                        size="lg"
                      />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full border-2 border-[#1a1f44]" />
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                    Olá, {userFullName || selectedUser}!
                  </h2>
                </div>

                {/* User selector with search */}
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">
                    Usuário identificado
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowDropdown((prev) => !prev)}
                      className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5
                                 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl
                                 text-sm text-white transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MemberAvatar
                          nome={userFullName || selectedUser}
                          avatar={selectedMember?.avatar}
                          avatarImage={selectedMember?.avatarImage}
                          size="sm"
                        />
                        <div className="text-left min-w-0">
                          <div className="font-semibold text-xs text-white truncate">{userFullName || selectedUser}</div>
                          <div className="text-[10px] text-slate-400 truncate">{selectedUser}@minsait.com</div>
                        </div>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    {showDropdown && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-[#1a1030] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {/* Search */}
                        <div className="px-3 pt-2 pb-1.5 border-b border-white/5">
                          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                              ref={searchRef}
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              placeholder="Buscar por nome..."
                              className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full select-text"
                            />
                            {searchQuery && (
                              <button type="button" onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* List */}
                        <div className="max-h-36 sm:max-h-44 overflow-y-auto">
                          {filteredSquad.length === 0 ? (
                            <div className="text-center text-slate-500 text-xs py-4">Nenhum usuário encontrado</div>
                          ) : (
                            filteredSquad.map((member: any) => {
                              const emailPrefix = member.email ? member.email.split('@')[0].toLowerCase() : '';
                              const isSelected = emailPrefix === selectedUser;
                              return (
                                <button
                                  key={emailPrefix}
                                  type="button"
                                  onClick={() => handleSelectUser(member)}
                                  className={`w-full flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-white/5 transition-all text-left ${isSelected ? 'bg-white/10' : ''}`}
                                >
                                  <MemberAvatar nome={member.nome || emailPrefix} avatar={member.avatar} avatarImage={member.avatarImage} size="sm" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold text-white truncate">{member.nome}</div>
                                    <div className="text-[10px] text-slate-400 truncate">{emailPrefix}@minsait.com</div>
                                  </div>
                                  {isSelected && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 pl-1">
                    Não é você? Selecione seu nome na lista acima.
                  </p>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading || !selectedUser}
                  className="group w-full py-3 sm:py-3.5 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl
                             transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]
                             flex items-center justify-center gap-2.5 cursor-pointer
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <WindowsLogo size={15} />
                      <span className="font-extrabold text-sm">Entrar com Windows</span>
                      <span className="font-light text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <button
                  onClick={detectUser}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl
                             shadow-md uppercase tracking-wider transition-all cursor-pointer border border-white/10"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center w-full text-[10px] text-slate-400 border-t border-white/10 pt-2 mt-4 z-10">
            <span>© 2026 GlowApp</span>
            <div className="flex space-x-3 sm:space-x-4">
              <a href="#privacy" className="hover:text-white">Termos</a>
              <a href="#support" className="hover:text-white">Privacidade</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
