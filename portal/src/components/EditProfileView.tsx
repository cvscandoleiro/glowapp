import React, { useState, useEffect } from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import type { SquadMember } from '../types';
import { X, UploadSimple } from '@phosphor-icons/react';
import { AVATAR_LIST, getAvatarById } from '../utils/avatarRepository';

interface Locality {
  id: number;
  state: string;
  city: string;
}

export const EditProfileView: React.FC = () => {
  const { squad, updateSquadMember, saving } = usePlanningStore();
  
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'predefined' | 'upload'>('predefined');
  const [avatarUploadPreview, setAvatarUploadPreview] = useState<string>('');
  const [myMember, setMyMember] = useState<SquadMember | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [profiles, setProfiles] = useState<string[]>(['Funcional', 'Arquiteto', 'Dev', 'Banco de Dados', 'QA']);

  // Clear toast automatically after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch profiles from database
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await fetch('/api/profiles');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setProfiles(data);
          }
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      }
    };
    fetchProfiles();
  }, []);

  const [formData, setFormData] = useState({
    nome: '',
    perfil: 'Funcional',
    status: 'ATIVO' as 'ATIVO' | 'INATIVO',
    avatar: '',
    avatarImage: '',
    email: '',
    telephoneContact: '',
    matricula: '',
    clientId: '',
    localityId: '',
    state: '',
    city: ''
  });

  const formatNumericMask = (value: string, size: number) => value.replace(/\D/g, '').slice(0, size);
  const formatTelephoneMask = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
    return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(part => {
      const lower = part.toLowerCase();
      return !['de', 'da', 'do', 'das', 'dos', 'e'].includes(lower);
    });
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return '';
  };

  useEffect(() => {
    // Only load initial data once to prevent overwriting user's active edits
    if (myMember) return;

    const loggedInUsername = localStorage.getItem('kairos_username') || '';
    const loggedIn = squad.find(m => {
      if (!m.email) return false;
      const prefix = m.email.split('@')[0].toLowerCase().trim();
      return prefix === loggedInUsername.toLowerCase().trim();
    });

    if (loggedIn) {
      setMyMember(loggedIn);
      setFormData({
        nome: loggedIn.nome,
        perfil: loggedIn.perfil,
        status: loggedIn.status || 'ATIVO',
        avatar: loggedIn.avatar || '',
        avatarImage: loggedIn.avatarImage || '',
        email: loggedIn.email || '',
        telephoneContact: formatTelephoneMask(String(loggedIn.telephoneContact || '')),
        matricula: formatNumericMask(String(loggedIn.matricula || ''), 6),
        clientId: formatNumericMask(String(loggedIn.clientId || ''), 8),
        localityId: loggedIn.localityId ? String(loggedIn.localityId) : '',
        state: loggedIn.state || '',
        city: loggedIn.city || ''
      });
      setAvatarUploadPreview(loggedIn.avatarImage || '');
    }
  }, [squad, myMember]);

  useEffect(() => {
    const fetchLocalities = async () => {
      try {
        const res = await fetch('/api/localities');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setLocalities(data);
          }
        }
      } catch (err) {
        console.error('Error fetching localities:', err);
      }
    };
    fetchLocalities();
  }, []);

  const selectedLocality = localities.find(loc =>
    (formData.state && formData.city && loc.state === formData.state && loc.city === formData.city) ||
    (formData.localityId && String(loc.id) === formData.localityId)
  );
  const stateOptions = Array.from(new Set(localities.map(loc => loc.state).filter(Boolean))).sort();
  const filteredLocalitiesByState = formData.state
    ? localities.filter(loc => loc.state === formData.state)
    : [];
  const cityOptions = Array.from(new Set(filteredLocalitiesByState.map(loc => loc.city).filter(Boolean))).sort();

  const handleAvatarSelect = (avatarId: string) => {
    setAvatarUploadPreview('');
    setFormData(prev => ({
      ...prev,
      avatar: avatarId,
      avatarImage: ''
    }));
    setIsAvatarModalOpen(false);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório.');
      return;
    }
    if (!myMember) return;

    const normalizedTelephoneContact = formData.telephoneContact.replace(/\D/g, '');
    const normalizedMatricula = formData.matricula.replace(/\D/g, '');
    const normalizedClientId = formData.clientId.replace(/\D/g, '');

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      alert('E-mail inválido.');
      return;
    }

    if (normalizedMatricula && normalizedMatricula.length !== 6) {
      alert('Matrícula deve conter 6 números.');
      return;
    }

    if (normalizedClientId && normalizedClientId.length !== 8) {
      alert('ID SAP (Vivo) deve conter 8 números.');
      return;
    }

    const updatedMember: SquadMember = {
      ...myMember,
      nome: formData.nome.trim(),
      perfil: formData.perfil,
      status: formData.status,
      avatar: formData.avatar ? formData.avatar : null,
      avatarImage: formData.avatarImage ? formData.avatarImage : null,
      email: formData.email.trim() || null,
      telephoneContact: normalizedTelephoneContact || null,
      matricula: normalizedMatricula || null,
      clientId: normalizedClientId || null,
      localityId: selectedLocality?.id ?? null,
      state: formData.state || null,
      city: formData.city || null
    };

    try {
      await updateSquadMember(updatedMember, myMember.nome);
      
      // Show custom toast notification
      setToast({ message: 'Perfil atualizado com sucesso!', type: 'success' });
      
      // Auto close/redirect to dashboard after 2 seconds
      setTimeout(() => {
        if (typeof (window as any).setActiveTab === 'function') {
          (window as any).setActiveTab('dashboard');
        }
      }, 2000);
    } catch (err: any) {
      setToast({ message: err.message || 'Erro ao salvar alterações do perfil.', type: 'error' });
    }
  };

  const handleCancel = () => {
    if (typeof (window as any).setActiveTab === 'function') {
      (window as any).setActiveTab('dashboard');
    }
  };

  if (!myMember) {
    return (
      <div className="flex-1 p-8 text-center text-slate-500 font-bold bg-white/80 rounded-[2rem] border border-slate-200">
        Nenhum profissional associado ao usuário logado foi localizado no sistema.
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-white/85 backdrop-blur-md overflow-y-auto select-none">
      <div className="glass-resource-card w-[520px] rounded-[2rem] border border-slate-100/60 shadow-2xl flex flex-col overflow-hidden bg-white text-slate-800 font-sans">
        
        {/* Modal Header */}
        <div className="bg-[#faf2ee] px-5 py-3 border-b border-[#e5d5cf]/60 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-extrabold text-[#64183f]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Editar Perfil
          </h3>
          <button 
            onClick={handleCancel}
            className="text-slate-400 hover:text-[#64183f] transition-colors"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
        
        {/* Form Body */}
        <div className="flex-1 px-5 py-3.5 space-y-3">
          
          {/* Top row: Avatar (left) and Name, Email, Perfil (right) */}
          <div className="flex items-start gap-4">
            {/* Left side: Avatar */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div 
                onClick={() => setIsAvatarModalOpen(true)}
                className="w-[82px] h-[82px] rounded-full p-[3px] bg-gradient-to-tr from-[#64183f]/30 via-pink-500/20 to-[#06b6d4]/30 hover:from-[#64183f] hover:to-[#06b6d4] transition-all duration-300 shadow-md hover:shadow-[0_0_12px_rgba(100,24,63,0.3)] group cursor-pointer"
              >
                <div className="w-full h-full rounded-full bg-white overflow-hidden relative flex items-center justify-center">
                  {formData.avatarImage ? (
                    <img src={formData.avatarImage} alt="avatar" className="w-full h-full object-cover object-top" />
                  ) : formData.avatar ? (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-xl font-black text-white overflow-hidden"
                      style={{ background: getAvatarById(formData.avatar)?.gradient }}
                    >
                      {getAvatarById(formData.avatar)?.icon}
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center text-xl font-black text-white"
                      style={{ background: "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" }}
                    >
                      {getInitials(formData.nome)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[7px] font-black uppercase tracking-wider text-white">
                    Mudar
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Name, Email and Perfil */}
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400"
                    placeholder="ex. João da Silva"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Email (Opcional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400"
                    placeholder="ex. nome.sobrenome@empresa.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Perfil / Papel</label>
                  <select 
                    value={formData.perfil}
                    onChange={e => setFormData({...formData, perfil: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all cursor-pointer font-bold"
                  >
                    {profiles.map(prof => (
                      <option key={prof} value={prof}>{prof}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Contato (Telefone) (Opcional)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.telephoneContact}
                    onChange={e => setFormData({ ...formData, telephoneContact: formatTelephoneMask(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400"
                    placeholder="(99)99999-99999"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom rows: Matricula, SAP ID, Locality */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Matrícula (6 dígitos)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.matricula}
                  onChange={e => setFormData({ ...formData, matricula: formatNumericMask(e.target.value, 6) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400"
                  placeholder="999999"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">ID SAP (Vivo) (8 dígitos)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.clientId}
                  onChange={e => setFormData({ ...formData, clientId: formatNumericMask(e.target.value, 8) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400"
                  placeholder="99999999"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Estado</label>
                <select
                  value={formData.state}
                  onChange={e => {
                    const state = e.target.value;
                    setFormData({
                      ...formData,
                      state,
                      city: '',
                      localityId: ''
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all cursor-pointer font-bold"
                >
                  <option value="" className="bg-white text-slate-800 font-bold">Selecione um estado</option>
                  {stateOptions.map((state) => (
                    <option key={state} value={state} className="bg-white text-slate-800 font-bold">{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Cidade</label>
                <select
                  value={formData.city}
                  onChange={e => {
                    const city = e.target.value;
                    const locality = filteredLocalitiesByState.find(loc => loc.city === city) || null;
                    setFormData({
                      ...formData,
                      city,
                      localityId: locality ? String(locality.id) : ''
                    });
                  }}
                  disabled={!formData.state}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all cursor-pointer font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" className="bg-white text-slate-800 font-bold">Selecione uma cidade</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city} className="bg-white text-slate-800 font-bold">{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="bg-[#faf2ee] px-5 py-3 border-t border-[#e5d5cf]/60 flex justify-end space-x-2 shrink-0">
          <button 
            disabled={saving}
            onClick={handleCancel}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#5c5856] hover:text-[#64183f] transition-colors"
          >
            Cancelar
          </button>
          <button 
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#64183f" }}
          >
            {saving ? (
              <>
                <span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>Salvar</span>
            )}
          </button>
        </div>
      </div>

      {/* Avatar Sub-modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in text-slate-800 font-sans">
          <div className="p-6 w-[460px] rounded-[2rem] border border-slate-100 shadow-2xl relative bg-white">
            <button 
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} weight="bold" />
            </button>
            
            <h3 className="text-lg font-black text-slate-800 mb-1">Selecionar Avatar</h3>
            <p className="text-xs text-slate-500 mb-4">Escolha um avatar ou faça upload de imagem.</p>

            <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
              <button
                onClick={() => setAvatarTab('predefined')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all duration-200 ${
                  avatarTab === 'predefined' ? 'bg-white text-[#64183f] shadow-sm' : 'text-slate-500'
                }`}
              >
                Pré-definidos
              </button>
              <button
                onClick={() => setAvatarTab('upload')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all duration-200 ${
                  avatarTab === 'upload' ? 'bg-white text-[#64183f] shadow-sm' : 'text-slate-500'
                }`}
              >
                Upload Foto
              </button>
            </div>

            {avatarTab === 'predefined' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 max-h-52 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {AVATAR_LIST.map((av) => (
                    <button
                      key={av.id}
                      onClick={() => handleAvatarSelect(av.id)}
                      className="aspect-square rounded-2xl flex items-center justify-center text-xl text-white hover:scale-105 active:scale-95 shadow-sm transition-transform border border-slate-100"
                      style={{ background: av.gradient }}
                    >
                      {av.icon}
                    </button>
                  ))}
                </div>
                {(formData.avatar || formData.avatarImage) && (
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, avatar: '', avatarImage: '' }));
                      setAvatarUploadPreview('');
                      setIsAvatarModalOpen(false);
                    }}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black uppercase tracking-wider rounded-xl border border-rose-200/50 transition-colors shadow-sm"
                  >
                    Remover Avatar / Foto
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:border-[#64183f]/40 transition-colors relative cursor-pointer group min-h-[160px]">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const img = new Image();
                      const objectUrl = URL.createObjectURL(file);
                      img.onload = () => {
                        const SIZE = 256;
                        const canvas = document.createElement('canvas');
                        canvas.width = SIZE;
                        canvas.height = SIZE;
                        const ctx = canvas.getContext('2d')!;
                        const scale = Math.max(SIZE / img.width, SIZE / img.height);
                        const scaledW = img.width * scale;
                        const scaledH = img.height * scale;
                        const offsetX = (SIZE - scaledW) / 2;
                        const offsetY = 0;
                        ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
                        URL.revokeObjectURL(objectUrl);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
                        setAvatarUploadPreview(dataUrl);
                        setFormData(prev => ({ ...prev, avatar: '', avatarImage: dataUrl }));
                        setIsAvatarModalOpen(false);
                      };
                      img.src = objectUrl;
                      e.target.value = '';
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {avatarUploadPreview ? (
                    <img 
                      src={avatarUploadPreview} 
                      alt="Upload Preview" 
                      className="w-20 h-20 rounded-full object-cover border border-slate-100 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <>
                      <UploadSimple size={28} className="text-slate-400 mb-2 group-hover:text-[#64183f] transition-colors" />
                      <span className="text-xs font-black text-slate-700">Clique para selecionar imagem</span>
                      <span className="text-[9px] text-slate-400 mt-1">PNG, JPG de até 2MB</span>
                    </>
                  )}
                </div>
                {(formData.avatar || formData.avatarImage) && (
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, avatar: '', avatarImage: '' }));
                      setAvatarUploadPreview('');
                      setIsAvatarModalOpen(false);
                    }}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black uppercase tracking-wider rounded-xl border border-rose-200/50 transition-colors shadow-sm"
                  >
                    Remover Avatar / Foto
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[99999] animate-fade-in select-none pointer-events-none">
          <div className={`px-5 py-3 rounded-2xl shadow-2xl border text-xs font-black uppercase tracking-wider flex items-center gap-3 backdrop-blur-md pointer-events-auto ${
            toast.type === 'success' 
              ? 'bg-emerald-500/90 border-emerald-450 text-white shadow-emerald-500/20' 
              : 'bg-rose-500/90 border-rose-450 text-white shadow-rose-500/20'
          }`}>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
