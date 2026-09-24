import React, { useState, useEffect, useMemo } from 'react';
import {
  UsersThree,
  UserPlus,
  MagnifyingGlass,
  CheckCircle,
  X,
  Trash,
  ShieldCheck,
  Warning,
  Sparkle,
  LockKey,
  Clock,
  UserGear,
  EnvelopeSimple,
  User
} from '@phosphor-icons/react';
import { userService, type AuthorizedUser } from '../services/userService';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'profissional' | 'recepcao'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all');

  // Modal State for New User
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'profissional' | 'recepcao'>('profissional');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AuthorizedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const loaded = await userService.getAuthorizedUsers();
      setUsers(loaded || []);
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const email = u.email.toLowerCase();
        const name = (u.name || '').toLowerCase();
        return email.includes(q) || name.includes(q);
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const activeCount = users.filter(u => u.status === 'ativo').length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    return { total, activeCount, adminCount };
  }, [users]);

  // Handle Add New User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('@googlemail.com')) {
      setFormError('Apenas contas Google / Gmail terminadas em @gmail.com são permitidas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await userService.addAuthorizedUser(cleanEmail, newName.trim(), newRole);
      if (res.error) {
        setFormError(res.error);
      } else if (res.user) {
        setUsers(prev => [...prev, res.user!]);
        showToast(`Usuário ${cleanEmail} autorizado com sucesso!`, 'success');
        setIsNewUserModalOpen(false);
        setNewEmail('');
        setNewName('');
        setNewRole('profissional');
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro ao autorizar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (user: AuthorizedUser) => {
    const newStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
    try {
      await userService.updateAuthorizedUser(user.id, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      showToast(`Acesso de ${user.email} alterado para ${newStatus}.`, 'info');
    } catch (e) {
      showToast('Erro ao atualizar status do usuário.', 'error');
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    setIsDeleting(true);
    try {
      await userService.removeAuthorizedUser(deleteConfirmUser.id);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
      showToast(`Acesso do usuário ${deleteConfirmUser.email} removido.`, 'info');
      setDeleteConfirmUser(null);
    } catch (e) {
      showToast('Erro ao remover usuário.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isEmailValidGmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    return clean.endsWith('@gmail.com') || clean.endsWith('@googlemail.com');
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden px-4 sm:px-8 pt-4 pb-4 max-w-7xl mx-auto text-stone-800 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center space-x-3 bg-white/98 backdrop-blur-xl text-[#3D3028] border-2 border-[#c5922a]/50 px-5 py-3 rounded-2xl shadow-[0_15px_45px_-10px_rgba(197,146,42,0.35)] animate-fade-in transition-all max-w-md">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 shadow-xs text-[#c5922a]">
            {notification.type === 'success' ? (
              <CheckCircle size={20} weight="fill" className="text-emerald-600" />
            ) : (
              <Warning size={20} weight="fill" className="text-amber-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-[#3D3028] leading-tight">{notification.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="w-6 h-6 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TOP HERO HEADER                                           */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#c5922a] to-[#966b1a] text-amber-50 border border-amber-200/90 flex items-center justify-center shadow-md shadow-amber-900/15 shrink-0">
            <UserGear size={22} weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3D3028] tracking-tight">
              Gestão de Usuários
            </h1>
            <p className="text-xs text-[#8C7A6B] font-semibold mt-0.5">
              Controle e permissões exclusivas de acesso via contas Google / Gmail
            </p>
          </div>
        </div>

        {/* Add User Button */}
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setIsNewUserModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 rounded-2xl text-xs font-black shadow-md shadow-amber-900/15 hover:shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <UserPlus size={16} weight="bold" />
          <span>Adicionar Usuário Gmail</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* METRICS CARDS                                             */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 shrink-0">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-[#E2D8CA] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8C7A6B]">Total Autorizados</span>
            <h3 className="text-xl font-black text-[#3D3028] mt-0.5">{metrics.total}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#966b1a]">
            <UsersThree size={18} weight="fill" />
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-[#E2D8CA] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Acessos Ativos</span>
            <h3 className="text-xl font-black text-emerald-800 mt-0.5">{metrics.activeCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle size={18} weight="fill" />
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-[#E2D8CA] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#966b1a]">Administradores</span>
            <h3 className="text-xl font-black text-[#3D3028] mt-0.5">{metrics.adminCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#c5922a]">
            <ShieldCheck size={18} weight="fill" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTER & SEARCH BAR                                       */}
      {/* ========================================================= */}
      <div className="bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-2xl p-3 mb-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs shrink-0">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou @gmail.com..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs font-bold bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X size={12} weight="bold" />
            </button>
          )}
        </div>

        {/* Role & Status Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="all">Todos os Perfis</option>
            <option value="admin">Administrador</option>
            <option value="profissional">Profissional Esteta</option>
            <option value="recepcao">Recepção</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Apenas Ativos</option>
            <option value="inativo">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* USERS TABLE LIST                                          */}
      {/* ========================================================= */}
      <div className="flex-1 min-h-0 bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-3xl p-4 shadow-sm flex flex-col overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#c5922a]/30 border-t-[#c5922a] rounded-full animate-spin" />
            <span className="text-xs font-bold text-stone-500">Carregando lista de acessos...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-stone-400 flex flex-col items-center justify-center space-y-2">
            <UsersThree size={36} weight="duotone" className="text-stone-300" />
            <p className="text-sm font-bold text-[#6A5A4D]">Nenhum usuário encontrado.</p>
            <p className="text-xs text-[#A6978A]">Adicione contas Gmail autorizadas para liberar o acesso ao sistema.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#E2D8CA]/60 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EBE4D8] text-[10px] font-black uppercase text-[#8C7A6B] tracking-wider">
                  <th className="py-2.5 px-3">Usuário / Gmail</th>
                  <th className="py-2.5 px-3">Perfil de Acesso</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Último Acesso</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE4D8]/60 text-xs">
                {filteredUsers.map(user => {
                  return (
                    <tr key={user.id} className="hover:bg-[#FAF8F5] transition-colors group">
                      {/* Name & Google Email */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-2xl bg-[#FAF6F0] border border-[#E2D8CA] flex items-center justify-center text-[#966b1a] shrink-0 font-black text-xs shadow-2xs">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              <span>{(user.name || user.email)[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-[#3D3028] truncate">{user.name || 'Sem nome informado'}</p>
                            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-[#8C7A6B] mt-0.5">
                              {/* Google G Icon */}
                              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        {user.role === 'admin' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#966b1a] text-[10px] font-black uppercase tracking-wider">
                            <ShieldCheck size={12} weight="fill" className="text-[#c5922a]" />
                            <span>Administrador</span>
                          </span>
                        )}
                        {user.role === 'profissional' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                            <Sparkle size={12} weight="fill" className="text-purple-600" />
                            <span>Profissional</span>
                          </span>
                        )}
                        {user.role === 'recepcao' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                            <span>Recepção</span>
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                            user.status === 'ativo'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                          }`}
                          title="Clique para alternar o status de acesso"
                        >
                          <span className={`w-2 h-2 rounded-full ${user.status === 'ativo' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                          <span className="capitalize">{user.status}</span>
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-3 text-[11px] text-stone-500 font-medium">
                        {user.lastLoginAt ? (
                          <span className="flex items-center space-x-1">
                            <Clock size={12} className="text-[#c5922a]" />
                            <span>{new Date(user.lastLoginAt).toLocaleDateString('pt-BR')} às {new Date(user.lastLoginAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">Pendente de login</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmUser(user)}
                          className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-[#E2D8CA] hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                          title="Remover autorização de acesso"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Security Alert Note at bottom */}
        <div className="mt-3 pt-3 border-t border-[#E2D8CA]/80 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center space-x-2">
            <LockKey size={14} className="text-[#c5922a]" weight="fill" />
            <span>Apenas as contas listadas acima conseguirão efetuar login via Google OAuth no portal.</span>
          </div>
          <span className="font-bold text-[#8C7A6B]">Hemillyn Costa Home SPA • Segurança Ativa</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADICIONAR NOVO USUÁRIO GMAIL                       */}
      {/* ========================================================= */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-stone-950/45 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF6F0] rounded-[28px] border border-[#E2D8CA] p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E2D8CA] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-[#966b1a]">
                  <UserPlus size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#3D3028]">Autorizar Conta Gmail</h3>
                  <p className="text-xs text-[#8C7A6B] font-medium">Libere o acesso ao portal para um profissional</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center text-stone-500 border border-[#E2D8CA] transition-colors cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center space-x-2">
                <Warning size={16} weight="fill" className="text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-black uppercase text-[#8C6D46] mb-1">
                  Email da Conta Google / Gmail *
                </label>
                <div className="relative">
                  <EnvelopeSimple size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => {
                      setNewEmail(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="exemplo@gmail.com"
                    required
                    className="w-full bg-white border border-[#E2D8CA] focus:border-[#c5922a] rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-[#3D3028] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-all"
                  />
                  {newEmail && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isEmailValidGmail(newEmail) ? (
                        <span title="Conta Gmail válida">
                          <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                        </span>
                      ) : (
                        <span title="O email deve terminar em @gmail.com">
                          <Warning size={16} weight="fill" className="text-amber-500" />
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  O usuário fará login utilizando este mesmo endereço no botão "Entrar com Conta Google".
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-[#8C6D46] mb-1">
                  Nome Completo do Usuário
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ex: Dra. Larissa Rocha"
                    className="w-full bg-white border border-[#E2D8CA] focus:border-[#c5922a] rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-[#3D3028] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-[#8C6D46] mb-1">
                  Perfil de Permissão
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className="w-full bg-white border border-[#E2D8CA] focus:border-[#c5922a] rounded-xl px-3 py-2 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-all"
                >
                  <option value="profissional">Profissional Esteta (Acesso a Clientes, Serviços e Agenda)</option>
                  <option value="admin">Administrador (Acesso Total + Gestão de Usuários)</option>
                  <option value="recepcao">Recepção (Agendamentos e Lembretes)</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#E2D8CA]">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-600 border border-[#E2D8CA] text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isEmailValidGmail(newEmail)}
                  className={`px-5 py-2 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 text-xs font-black shadow-md shadow-amber-900/15 transition-all active:scale-95 cursor-pointer ${
                    isSubmitting || !isEmailValidGmail(newEmail) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Autorizando...' : 'Autorizar Acesso'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE USUÁRIO                 */}
      {/* ========================================================= */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-[10000] bg-stone-950/45 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF6F0] rounded-[24px] border border-[#E2D8CA] p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash size={20} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#3D3028]">Remover Acesso</h3>
                <p className="text-xs text-[#8C7A6B] font-medium">Deseja revogar o acesso deste usuário?</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E2D8CA] text-xs space-y-1">
              <p className="font-bold text-[#3D3028]">Email: <span className="font-medium text-[#6A5A4D]">{deleteConfirmUser.email}</span></p>
              <p className="font-bold text-[#3D3028]">Nome: <span className="font-medium text-[#6A5A4D]">{deleteConfirmUser.name}</span></p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[#E2D8CA] bg-white text-stone-700 font-extrabold text-xs hover:bg-stone-50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isDeleting ? 'Removendo...' : 'Sim, Revogar Acesso'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
