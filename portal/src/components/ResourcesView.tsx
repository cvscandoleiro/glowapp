import React, { useState, useEffect, useRef } from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import type { SquadMember } from '../types';
import { Trash, X, Users, UploadSimple, ThumbsUp, ThumbsDown, Eye, Plus } from '@phosphor-icons/react';
import { AVATAR_LIST, getAvatarById } from '../utils/avatarRepository';

interface Locality {
  id: number;
  state: string;
  city: string;
}

interface ResourcesViewProps {
  addTrigger?: number;
}

function ArcRing({ size }: { size: number }) {
  const r_outer = (size / 2) - 1;
  const cx = size / 2;
  const cy = size / 2;
  const r_mid = r_outer - 5;
  const strokeWidthThick = 9;

  const c1 = '#64183f';
  const c2 = '#ec4899';
  const gradId = `arc-grad-manager-${size}`;

  return (
    <svg
      width={size}
      height={size}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      
      <circle
        cx={cx}
        cy={cy}
        r={r_outer - 1}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.5"
      />

      <path
        d={`M ${cx - r_mid} ${cy} A ${r_mid} ${r_mid} 0 0 0 ${cx + r_mid} ${cy}`}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidthThick}
        strokeLinecap="butt"
      />
    </svg>
  );
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ addTrigger }) => {
  const { squad, addSquadMember, updateSquadMember, deleteSquadMember, filters, saving, setViewingSquadMember, canWrite } = usePlanningStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'predefined' | 'upload'>('predefined');
  const [avatarUploadPreview, setAvatarUploadPreview] = useState<string>('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [flippingMember, setFlippingMember] = useState<string | null>(null);
  const lastEditedNameRef = useRef<string | null>(null);
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
    city: '',
    operationId: '',
    managerId: ''
  });

  const [profiles, setProfiles] = useState<string[]>(['Funcional', 'Arquiteto', 'Dev', 'Banco de Dados', 'QA']);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<SquadMember | null>(null);
  const [isManagerSelectorOpen, setIsManagerSelectorOpen] = useState(false);
  const [managerProfileFilters, setManagerProfileFilters] = useState<string[]>([]);

  const formatNumericMask = (value: string, size: number) => value.replace(/\D/g, '').slice(0, size);
  const digitsOnly = (value: string) => value.replace(/\D/g, '');
  const formatTelephoneMask = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
    return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const selectedLocality = localities.find(loc =>
    (formData.state && formData.city && loc.state === formData.state && loc.city === formData.city) ||
    (formData.localityId && String(loc.id) === formData.localityId)
  );
  const stateOptions = Array.from(new Set(localities.map(loc => loc.state).filter(Boolean))).sort();
  const filteredLocalitiesByState = formData.state
    ? localities.filter(loc => loc.state === formData.state)
    : [];
  const cityOptions = Array.from(new Set(filteredLocalitiesByState.map(loc => loc.city).filter(Boolean))).sort();

  const handleCardClick = (member: SquadMember) => {
    setFlippingMember(member.nome);
    setTimeout(() => {
      handleOpenModal(member);
      setFlippingMember(null);
    }, 300);
  };

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


  useEffect(() => {
    if (addTrigger && addTrigger > 0) {
      handleOpenModal();
    }
  }, [addTrigger]);

  useEffect(() => {
    const handleEditConnected = () => {
      const loggedInUsername = localStorage.getItem('kairos_username') || '';
      const loggedInMember = squad.find(m => {
        if (!m.email) return false;
        const prefix = m.email.split('@')[0].toLowerCase().trim();
        return prefix === loggedInUsername.toLowerCase().trim();
      });
      if (loggedInMember) {
        handleOpenModal(loggedInMember);
      }
    };
    window.addEventListener('edit-connected-professional', handleEditConnected);
    return () => {
      window.removeEventListener('edit-connected-professional', handleEditConnected);
    };
  }, [squad]);
  const handleOpenModal = (member?: SquadMember) => {
    if (!canWrite) return;
    if (member) {
      setEditingName(member.nome);
      setFormData({
        nome: member.nome,
        perfil: member.perfil,
        status: member.status || 'ATIVO',
        avatar: member.avatar || '',
        avatarImage: member.avatarImage || '',
        email: member.email || '',
        telephoneContact: formatTelephoneMask(String(member.telephoneContact || '')),
        matricula: formatNumericMask(String(member.matricula || ''), 6),
        clientId: formatNumericMask(String(member.clientId || ''), 8),
        localityId: member.localityId ? String(member.localityId) : '',
        state: member.state || '',
        city: member.city || '',
        operationId: member.operationId !== undefined && member.operationId !== null
          ? String(member.operationId)
          : ((member as any).operation_id ? String((member as any).operation_id) : ''),
        managerId: member.managerId !== undefined && member.managerId !== null ? String(member.managerId) : ''
      });
      setAvatarUploadPreview(member.avatarImage || '');
    } else {
      setEditingName(null);
      setFormData({
        nome: '',
        perfil: profiles[0] || 'Funcional',
        status: 'ATIVO',
        avatar: '',
        avatarImage: '',
        email: '',
        telephoneContact: '',
        matricula: '',
        clientId: '',
        localityId: '',
        state: '',
        city: '',
        operationId: '',
        managerId: ''
      });
      setAvatarUploadPreview('');
    }
    setAvatarTab('predefined');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome.trim()) return;

    const normalizedTelephoneContact = digitsOnly(formData.telephoneContact).slice(0, 12);
    const normalizedMatricula = formatNumericMask(formData.matricula, 6);
    const normalizedClientId = formatNumericMask(formData.clientId, 8);

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      alert('Informe um e-mail válido.');
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

    const newMember: SquadMember = {
      nome: formData.nome.trim(),
      perfil: formData.perfil,
      status: formData.status,
      avatar: formData.avatarImage ? null : (formData.avatar || null),
      avatarImage: formData.avatarImage || null,
      email: formData.email.trim() || null,
      telephoneContact: normalizedTelephoneContact || null,
      matricula: normalizedMatricula || null,
      clientId: normalizedClientId || null,
      localityId: selectedLocality?.id ?? null,
      state: formData.state || null,
      city: formData.city || null,
      operationId: formData.operationId ? Number(formData.operationId) : null,
      managerId: formData.managerId ? Number(formData.managerId) : null
    };

    lastEditedNameRef.current = formData.nome.trim();
    if (editingName) {
      updateSquadMember(newMember, editingName);
    } else {
      addSquadMember(newMember);
    }
    setIsModalOpen(false);
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
    if (lastEditedNameRef.current && !isModalOpen) {
      const nameToFind = lastEditedNameRef.current;
      lastEditedNameRef.current = null; // Reset
      setTimeout(() => {
        const element = document.getElementById(`resource-card-${nameToFind.replace(/\s+/g, '-')}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-[#64183f]/40', 'scale-[1.01]');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-[#64183f]/40', 'scale-[1.01]');
          }, 2000);
        }
      }, 350);
    }
  }, [squad, isModalOpen]);

  return (
    <div className="flex-1 space-y-4 animate-fade-in relative pb-10">
      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start pb-6">
        {squad
          .filter(res => {
            // Filter by connected user's OPERATION_ID if they are in the squad and have one
            const loggedInUsername = localStorage.getItem('kairos_username') || '';
            const loggedInMember = squad.find(m => {
              if (!m.email) return false;
              const prefix = m.email.split('@')[0].toLowerCase().trim();
              return prefix === loggedInUsername.toLowerCase().trim();
            });

            if (loggedInMember) {
              const loggedInOps = [
                ...(Array.isArray(loggedInMember.operationIds) ? loggedInMember.operationIds : []),
                ...(loggedInMember.operationId !== undefined && loggedInMember.operationId !== null ? [Number(loggedInMember.operationId)] : [])
              ].filter(Boolean);

              if (loggedInOps.length > 0) {
                const resOps = [
                  ...(Array.isArray(res.operationIds) ? res.operationIds : []),
                  ...(res.operationId !== undefined && res.operationId !== null ? [Number(res.operationId)] : [])
                ].filter(Boolean);

                const hasSharedOperation = loggedInOps.some(opId => resOps.includes(opId));
                if (!hasSharedOperation) {
                  return false;
                }
              }
            }

            // Case-insensitive name search (LIKE %query%)
            if (filters.searchQuery.trim()) {
              const query = filters.searchQuery.toLowerCase();
              if (!res.nome.toLowerCase().includes(query)) {
                return false;
              }
            }

            if ((filters.resourceEmail || '').trim()) {
              const query = (filters.resourceEmail || '').toLowerCase();
              if (!(res.email || '').toLowerCase().includes(query)) {
                return false;
              }
            }

            if ((filters.resourceMatricula || '').trim()) {
              const query = filters.resourceMatricula || '';
              if (!(res.matricula || '').includes(query)) {
                return false;
              }
            }

            if ((filters.resourceClientId || '').trim()) {
              const query = filters.resourceClientId || '';
              if (!(res.clientId || '').includes(query)) {
                return false;
              }
            }

            // Multi-selected profiles filter
            if (filters.perfil) {
              const selectedProfiles = filters.perfil.split(',');
              if (selectedProfiles.length > 0 && !selectedProfiles.includes(res.perfil)) {
                return false;
              }
            }

            // Multi-selected status filter
            if (filters.status) {
              const selectedStatuses = filters.status.split(',');
              const currentStatus = res.status || 'ATIVO';
              if (selectedStatuses.length > 0 && !selectedStatuses.includes(currentStatus)) {
                return false;
              }
            }

            if (filters.resourceStates) {
              const selectedStates = filters.resourceStates.split(',').filter(Boolean);
              const currentState = res.state || '';
              if (selectedStates.length > 0 && !selectedStates.includes(currentState)) {
                return false;
              }
            }

            if (filters.resourceCities) {
              const selectedCities = filters.resourceCities.split(',').filter(Boolean);
              const currentCity = res.city || '';
              if (selectedCities.length > 0 && !selectedCities.includes(currentCity)) {
                return false;
              }
            }

            if (filters.resourceOperations) {
              const selectedOps = filters.resourceOperations.split(',').filter(Boolean).map(Number);
              if (selectedOps.length > 0) {
                const resOps = [
                  ...(Array.isArray(res.operationIds) ? res.operationIds : []),
                  ...(res.operationId !== undefined && res.operationId !== null ? [Number(res.operationId)] : [])
                ].map(Number).filter(Boolean);
                
                const matchesAnySelected = selectedOps.some(opId => resOps.includes(opId));
                if (!matchesAnySelected) {
                  return false;
                }
              }
            }

            return true;
          })
          .map(res => (
            <div 
              key={res.nome} 
              id={`resource-card-${res.nome.replace(/\s+/g, '-')}`}
              onClick={() => handleCardClick(res)}
              className={`glass-resource-card rounded-[1.5rem] overflow-hidden flex flex-col relative group cursor-pointer w-full transition-all duration-300 ${
                flippingMember === res.nome ? 'animate-flip-3d' : ''
              }`}
              style={{ minHeight: '270px', maxWidth: '240px' }}
            >
              {/* Top gradient cover section matching template image */}
              <div 
                className="h-20 w-full relative flex items-center justify-center animate-pulse-slow shrink-0"
                style={{ background: "linear-gradient(180deg, #64183f 0%, #1a1f44 100%)" }}
              >
                {/* Minsait Logo on top left */}
                <img 
                  src="/minsait_logo.png" 
                  alt="Minsait Logo" 
                  className="absolute top-2.5 left-4 h-3 object-contain brightness-0 invert opacity-80" 
                />
                
                {/* View Profile button on top right (left of delete button) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingSquadMember(res);
                  }}
                  className="absolute top-2 right-9 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-[2]"
                  title="Visualizar Perfil"
                >
                  <Eye size={12} />
                </button>
  
                {/* Delete button styled as visual card options on top right */}
                {canWrite && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmMember(res);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-[2]"
                    title="Excluir Profissional"
                  >
                    <Trash size={12} />
                  </button>
                )}
  
                {/* Curve divider effect with high-contrast gradient transitioning from header colors to solid white */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none translate-y-[1px] pointer-events-none select-none z-[1]">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-5 relative block">
                    <defs>
                      <linearGradient id={`divider-gradient-${res.nome.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1a1f44" stopOpacity="1" />
                        <stop offset="50%" stopColor="#64183f" stopOpacity="1" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z" 
                      fill={`url(#divider-gradient-${res.nome.replace(/\s+/g, '-')})`}
                    />
                  </svg>
                </div>
              </div>
  
              {/* Avatar positioned half on top (purple cover) and half on bottom (white card body), size 84px */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ top: '80px' }}
              >
                <div 
                  className="rounded-full flex items-center justify-center shadow-md overflow-hidden border-2 border-white bg-white"
                  style={{ 
                    width: '84px',
                    height: '84px',
                    background: res.avatarImage
                      ? 'transparent'
                      : res.avatar 
                        ? getAvatarById(res.avatar)?.gradient 
                        : "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" 
                  }}
                >
                  {res.avatarImage ? (
                    <img src={res.avatarImage} alt={res.nome} className="w-full h-full object-cover object-top" />
                  ) : res.avatar ? (
                    <div
                      className="w-full h-full flex items-center justify-center text-2xl font-black text-white"
                      style={{ background: getAvatarById(res.avatar)?.gradient }}
                    >
                      <div className="scale-150 flex items-center justify-center w-full h-full">
                        {getAvatarById(res.avatar)?.icon}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-2xl font-black text-white"
                      style={{ background: "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" }}
                    >
                      {getInitials(res.nome)}
                    </div>
                  )}
                </div>
              </div>
  
              {/* Bottom details area - solid white bg */}
              <div className="flex flex-col items-center px-4 pb-4 pt-12 flex-grow relative bg-white justify-between border-x border-b border-slate-100 rounded-b-[1.5rem]">
                <div className="text-center mb-0.5">
                  <h3 className="text-sm font-extrabold text-slate-800 transition-colors mb-0.5 line-clamp-2 px-1">
                    {res.nome}
                  </h3>
                  <p className="text-[10px] font-bold tracking-wider text-[#64183f] uppercase mb-0.5">
                    {res.perfil}
                  </p>
                  {res.email && (
                    <a
                      href={`mailto:${res.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-slate-500 hover:text-[#64183f] underline underline-offset-2 break-all line-clamp-1"
                      title={res.email}
                    >
                      {res.email}
                    </a>
                  )}
                </div>
  
                {/* Status pill button matching the gradient template - identical to header style */}
                <div className="mt-2 w-full px-2 flex justify-center">
                  <div 
                    className="flex items-center pl-3 pr-1 py-0.5 rounded-full shadow-sm text-white font-bold select-none text-[8px] w-full max-w-[95px]"
                    style={{
                      background: res.status === 'INATIVO' 
                        ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' 
                        : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)'
                    }}
                  >
                    <span className="tracking-wide uppercase flex-1 text-center pl-2">
                      {res.status === 'INATIVO' ? 'Inativo' : 'Ativo'}
                    </span>
                    
                    {/* White circle with status icon (Like/Dislike) */}
                    <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm ml-1 shrink-0">
                      {res.status === 'INATIVO' ? (
                        <ThumbsDown 
                          size={9} 
                          weight="fill" 
                          className="text-red-500"
                        />
                      ) : (
                        <ThumbsUp 
                          size={9} 
                          weight="fill" 
                          className="text-[#06b6d4]"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        
        {squad.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={52} className="mb-4 opacity-40" />
            <p className="text-sm font-semibold">Nenhum profissional cadastrado.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in text-slate-800">
          <div 
            className="bg-white w-[540px] rounded-[1.5rem] shadow-2xl border border-slate-100 relative animate-zoom-in flex flex-col justify-between overflow-hidden max-h-[90vh]"
          >
            {/* Modal Title */}
            <div className="bg-[#faf2ee] px-5 py-3 border-b border-[#e5d5cf]/60 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-extrabold text-[#64183f]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {editingName ? 'Editar Profissional' : 'Novo Profissional'}
              </h3>
              <button 
                onClick={() => {
                  if (editingName) lastEditedNameRef.current = editingName;
                  setIsModalOpen(false);
                }}
                className="text-slate-400 hover:text-[#64183f] transition-colors"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
            
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
              
              {/* Top row: Avatar (left) and Name, Email, Perfil (right) */}
              <div className="flex items-start gap-4">
                {/* Left side: Avatar and Status Switch */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div 
                    onClick={() => canWrite && setIsAvatarModalOpen(true)}
                    className={`w-[82px] h-[82px] rounded-full p-[3px] bg-gradient-to-tr from-[#64183f]/30 via-pink-500/20 to-[#06b6d4]/30 hover:from-[#64183f] hover:to-[#06b6d4] transition-all duration-300 shadow-md hover:shadow-[0_0_12px_rgba(100,24,63,0.3)] group ${
                      canWrite ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
                    }`}
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
                        <div className="flex flex-col items-center justify-center text-[#64183f]/60 group-hover:text-[#64183f]">
                          <Plus size={16} weight="bold" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[7px] font-black uppercase tracking-wider text-white">
                        Mudar
                      </div>
                    </div>
                  </div>

                  {/* Sliding toggle switch below the profile picture */}
                  <div className="flex flex-col items-center mt-2.5 select-none">
                    <div 
                      onClick={() => canWrite && setFormData(prev => ({ ...prev, status: prev.status === 'ATIVO' ? 'INATIVO' : 'ATIVO' }))}
                      className={`w-[50px] h-6 rounded-full p-0.5 transition-all duration-300 relative flex items-center shadow-inner ${
                        canWrite ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
                      }`}
                      style={{
                        background: formData.status === 'INATIVO' 
                          ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' 
                          : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)'
                      }}
                    >
                      {/* Sliding Thumb */}
                      <div 
                        className={`w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md transform transition-transform duration-300 ${
                          formData.status === 'ATIVO' ? 'translate-x-[26px]' : 'translate-x-0'
                        }`}
                      >
                        {formData.status === 'INATIVO' ? (
                          <ThumbsDown 
                            size={10} 
                            weight="fill" 
                            className="text-red-500 animate-fade-in"
                          />
                        ) : (
                          <ThumbsUp 
                            size={10} 
                            weight="fill" 
                            className="text-[#06b6d4] animate-fade-in"
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-[7px] font-black text-[#64183f] mt-1 uppercase tracking-wider">
                      {formData.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                    </span>
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
                        onChange={e => {
                          const nome = e.target.value;
                          const cleanUser = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
                          setFormData(prev => ({
                            ...prev,
                            nome,
                            email: !editingName && (!prev.email || prev.email.endsWith('@minsait.com')) 
                              ? (cleanUser ? `${cleanUser}@minsait.com` : '') 
                              : prev.email
                          }));
                        }}
                        disabled={!canWrite}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
                        disabled={!canWrite}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
                        disabled={!canWrite}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all cursor-pointer font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {profiles.map(prof => (
                          <option key={prof} value={prof} className="bg-white text-slate-800 font-bold">{prof}</option>
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
                        disabled={!canWrite}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="(99)99999-99999"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100/60 mt-1">
                    <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-1">Gestor Direto</label>
                    <div className="flex items-center gap-3">
                      {formData.managerId && squad.find(m => String(m.id) === formData.managerId) ? (() => {
                        const managerMember = squad.find(m => String(m.id) === formData.managerId)!;
                        return (
                          <div className="flex-grow flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm overflow-hidden"
                                style={{ 
                                  background: managerMember.avatarImage 
                                    ? 'transparent' 
                                    : managerMember.avatar 
                                      ? getAvatarById(managerMember.avatar)?.gradient 
                                      : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' 
                                }}
                              >
                                {managerMember.avatarImage ? (
                                  <img src={managerMember.avatarImage} alt={managerMember.nome} className="w-full h-full object-cover" />
                                ) : managerMember.avatar ? (
                                  getAvatarById(managerMember.avatar)?.icon
                                ) : (
                                  getInitials(managerMember.nome)
                                )}
                              </div>
                              <div>
                                <span className="block text-[10px] font-black text-slate-800 leading-tight">{managerMember.nome}</span>
                                <span className="text-[7.5px] font-bold text-[#64183f] uppercase tracking-wide leading-none">{managerMember.perfil}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button 
                                type="button"
                                onClick={() => canWrite && setIsManagerSelectorOpen(true)}
                                className="text-[8px] font-black uppercase text-slate-500 hover:text-[#64183f] px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                Alterar
                              </button>
                              <button 
                                type="button"
                                onClick={() => canWrite && setFormData(prev => ({ ...prev, managerId: '' }))}
                                className="text-[8px] font-black uppercase text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                              >
                                Limpar
                              </button>
                            </div>
                          </div>
                        );
                      })() : (
                        <button
                          type="button"
                          onClick={() => canWrite && setIsManagerSelectorOpen(true)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#64183f] text-slate-400 hover:text-[#64183f] transition-all bg-slate-50/50 hover:bg-slate-50 text-[9px] font-black uppercase tracking-wider"
                        >
                          <Plus size={10} weight="bold" />
                          Selecionar Gestor Direto
                        </button>
                      )}
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
                      disabled={!canWrite}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={!canWrite}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={!canWrite}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 outline-none focus:border-[#64183f]/50 transition-all cursor-pointer font-bold disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={!formData.state || !canWrite}
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
                onClick={() => {
                  if (editingName) lastEditedNameRef.current = editingName;
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#5c5856] hover:text-[#64183f] transition-colors"
              >
                Cancelar
              </button>
              <button 
                disabled={saving || !canWrite}
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
        </div>
      )}

      {/* Sub-modal para Seleção de Avatar */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in text-slate-800 font-sans">
          <div className="glass-resource-card p-6 w-[460px] rounded-[2rem] border border-slate-100 shadow-2xl relative bg-white">
            <button 
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} weight="bold" />
            </button>
            
            <h3 className="text-lg font-black text-slate-800 mb-1">Selecionar Avatar</h3>
            <p className="text-xs text-slate-500 mb-4">Escolha um avatar pré-definido ou faça upload de uma imagem local.</p>

            {/* Tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
              <button
                onClick={() => setAvatarTab('predefined')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all duration-200 ${
                  avatarTab === 'predefined'
                    ? 'bg-white text-[#64183f] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pré-definidos
              </button>
              <button
                onClick={() => setAvatarTab('upload')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all duration-200 ${
                  avatarTab === 'upload'
                    ? 'bg-white text-[#64183f] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Upload de Imagem
              </button>
            </div>

            {/* Tab Content: Predefined */}
            {avatarTab === 'predefined' && (
              <div className="grid grid-cols-4 gap-3.5 max-h-[260px] overflow-y-auto pr-1">
                {AVATAR_LIST.map(avatar => {
                  const isSelected = formData.avatar === avatar.id;
                  return (
                    <div 
                      key={avatar.id}
                      onClick={() => {
                        setAvatarUploadPreview('');
                        setFormData(prev => ({ ...prev, avatar: avatar.id, avatarImage: '' }));
                        setIsAvatarModalOpen(false);
                      }}
                      className={`aspect-square rounded-2xl p-[2px] cursor-pointer transition-all duration-300 hover:scale-105 ${
                        isSelected ? 'ring-4 ring-[#64183f]' : 'hover:shadow-md'
                      }`}
                      style={{ background: avatar.gradient }}
                      title={avatar.name}
                    >
                      <div className="w-full h-full rounded-2xl bg-white p-[1px]">
                        <div 
                          className="w-full h-full rounded-2xl flex items-center justify-center overflow-hidden"
                          style={{ background: avatar.gradient }}
                        >
                          {avatar.icon}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab Content: Upload */}
            {avatarTab === 'upload' && (
              <div className="flex flex-col items-center gap-5 py-4">
                {/* Preview area */}
                <div
                  className="w-28 h-28 rounded-full overflow-hidden border-4 shadow-lg flex items-center justify-center"
                  style={{
                    borderColor: '#64183f',
                    background: avatarUploadPreview ? 'transparent' : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)'
                  }}
                >
                  {avatarUploadPreview ? (
                    <img src={avatarUploadPreview} alt="preview" className="w-full h-full object-cover object-top" />
                  ) : (
                    <UploadSimple size={36} className="text-white/60" weight="bold" />
                  )}
                </div>

                {/* Upload button */}
                <label
                  htmlFor="avatar-upload-input"
                  className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-black shadow-md hover:opacity-90 transition-all uppercase tracking-wider"
                  style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}
                >
                  <UploadSimple size={14} weight="bold" />
                  {avatarUploadPreview ? 'Trocar imagem' : 'Escolher imagem'}
                </label>
                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const img = new Image();
                    const objectUrl = URL.createObjectURL(file);
                    img.onload = () => {
                      // Resize to 256×256 square using canvas (cover crop)
                      const SIZE = 256;
                      const canvas = document.createElement('canvas');
                      canvas.width = SIZE;
                      canvas.height = SIZE;
                      const ctx = canvas.getContext('2d')!;
                      const scale = Math.max(SIZE / img.width, SIZE / img.height);
                      const scaledW = img.width * scale;
                      const scaledH = img.height * scale;
                      // Anchor crop at the top so faces/heads are not cut off
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
                    // reset input so same file can be re-selected
                    e.target.value = '';
                  }}
                />
                <p className="text-[10px] text-slate-400 text-center">Formatos suportados: JPG, PNG, GIF, WebP<br/>Tamanho máximo recomendado: 2 MB</p>
              </div>
            )}
            
            <div className="mt-5 flex justify-between items-center border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, avatar: '', avatarImage: '' }));
                  setAvatarUploadPreview('');
                  setIsAvatarModalOpen(false);
                }}
                className="text-xs font-black text-rose-500 hover:underline uppercase tracking-wide"
              >
                Remover Avatar
              </button>
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-6 py-2 rounded-xl text-xs font-black text-white shadow-md hover:opacity-90 transition-all uppercase tracking-wider"
                style={{ background: "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in text-slate-800 font-sans">
          <div className="bg-white w-[420px] rounded-[2rem] border border-slate-100 shadow-2xl p-6 relative animate-zoom-in flex flex-col items-center text-center">
            
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
              <Trash size={24} weight="bold" />
            </div>

            <h3 className="text-base font-black text-slate-800 mb-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Confirmar Exclusão
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-6">
              Deseja realmente excluir o profissional <span className="font-extrabold text-[#64183f]">"{deleteConfirmMember.nome}"</span>? Esta ação não poderá ser desfeita.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteConfirmMember(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-[#5c5856] hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteSquadMember(deleteConfirmMember.nome);
                    setDeleteConfirmMember(null);
                  } catch (err: any) {
                    alert(err.message || 'Não foi possível excluir o profissional.');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Manager Selector Modal */}
      {isManagerSelectorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in text-slate-800 font-sans">
          <div className="bg-white p-6 w-[560px] max-w-[95vw] rounded-[2rem] border border-slate-100 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setIsManagerSelectorOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} weight="bold" />
            </button>

            <h3 className="text-base font-black text-[#64183f] mb-1">Selecionar Gestor Direto</h3>
            <p className="text-[10px] text-slate-400 mb-4 uppercase font-black tracking-wider">Clique no profissional para defini-lo como Gestor</p>

            {/* Profile filters checkboxes */}
            <div className="mb-4">
              <label className="block text-[8px] font-black text-[#64183f] uppercase tracking-wider mb-2">Filtrar por Perfil / Papel</label>
              <div className="flex flex-wrap gap-1.5 max-h-[75px] overflow-y-auto pr-1">
                {profiles.map(profile => {
                  const isChecked = managerProfileFilters.includes(profile);
                  return (
                    <button
                      key={profile}
                      type="button"
                      onClick={() => {
                        setManagerProfileFilters(prev => 
                          isChecked ? prev.filter(p => p !== profile) : [...prev, profile]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${
                        isChecked 
                          ? 'bg-[#64183f] text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {profile}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector list grid */}
            <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[40vh] p-2 pr-1 grid grid-cols-4 gap-4 scrollbar-thin scrollbar-thumb-slate-200">
              {squad
                .filter(member => {
                  // Don't show current edited member to avoid self-loop
                  if (editingName && member.nome === editingName) return false;
                  // Only active managers/professionals
                  if ((member.status || 'ATIVO') !== 'ATIVO') return false;
                  // Profile filters
                  if (managerProfileFilters.length > 0 && !managerProfileFilters.includes(member.perfil)) return false;
                  return true;
                })
                .map(member => {
                  const avatarObj = member.avatar ? getAvatarById(member.avatar) : null;
                  const ringSize = 77;
                  const photoSize = 61;

                  return (
                    <div
                      key={member.nome}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, managerId: String(member.id) }));
                        setIsManagerSelectorOpen(false);
                      }}
                      className="flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-[1.05] p-2 rounded-2xl hover:bg-[#64183f]/5"
                    >
                      {/* Avatar with arc ring */}
                      <div className="relative flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
                        {/* Photo circle */}
                        <div
                          className="rounded-full overflow-hidden bg-[#1e1e2e] absolute"
                          style={{
                            width: photoSize,
                            height: photoSize,
                            top: (ringSize - photoSize) / 2,
                            left: (ringSize - photoSize) / 2,
                          }}
                        >
                          {member.avatarImage ? (
                            <img src={member.avatarImage} alt={member.nome} className="w-full h-full object-cover object-top" />
                          ) : avatarObj ? (
                            <div className="w-full h-full flex items-center justify-center text-white" style={{ background: avatarObj.gradient }}>
                              <div className="scale-150 flex items-center justify-center w-full h-full">
                                {avatarObj.icon}
                              </div>
                            </div>
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-white font-black"
                              style={{
                                  background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
                                fontSize: photoSize * 0.28,
                              }}
                            >
                              {getInitials(member.nome) || <Users size={20} />}
                            </div>
                          )}
                        </div>
                        <ArcRing size={ringSize} />
                      </div>

                      {/* Name + Profile */}
                      <div className="mt-2 text-center px-1" style={{ maxWidth: ringSize + 25 }}>
                        <div className="text-[10px] font-black text-slate-800 leading-tight line-clamp-2 min-h-[24px]">
                          {member.nome}
                        </div>
                        <div className="text-[8px] font-bold text-[#64183f] uppercase tracking-wider mt-0.5 truncate">
                          {member.perfil}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
              <button 
                type="button"
                onClick={() => setIsManagerSelectorOpen(false)}
                className="px-6 py-2 rounded-xl text-xs font-black text-[#5c5856] hover:bg-slate-50 transition-all uppercase tracking-wider"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
