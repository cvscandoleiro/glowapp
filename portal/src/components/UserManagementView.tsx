import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  CheckSquare, 
  Square, 
  UserPlus, 
  Trash, 
  MagnifyingGlass,
  ArrowClockwise,
  Crown,
  Briefcase,
  User,
  Eye,
  SquaresFour,
  TreeStructure,
  Calendar,
  Suitcase,
  Key,
  FloppyDisk
} from '@phosphor-icons/react';
import { Avatar } from '@mui/material';
import { getAvatarById } from '../utils/avatarRepository';
import { usePlanningStore } from '../store/PlanningStore';

interface Role {
  id: string;
  name: string;
  permissions: {
    dashboard: boolean;
    "projetos-menu": boolean;
    resources: boolean;
    hierarchy: boolean;
    calendar: boolean;
    ferries: boolean;
    administration: boolean;
    can_save: boolean;
  };
}

interface UserMgmtConfig {
  roles: Role[];
  userRoles: Record<string, string>;
  userOperations?: Record<string, number[]>;
}

interface SquadMember {
  id: number;
  nome: string;
  email: string | null;
  avatar?: string | null;
  avatarImage?: string | null;
  operationIds?: number[];
}

const OperationSelector: React.FC<{
  selectedOps: number[];
  operations: Array<{ id: number; name: string }>;
  onChange: (ops: number[]) => void;
  disabled?: boolean;
  openUpward?: boolean;
}> = ({ selectedOps, operations, onChange, disabled, openUpward }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOp = (opId: number) => {
    if (selectedOps.includes(opId)) {
      onChange(selectedOps.filter(id => id !== opId));
    } else {
      onChange([...selectedOps, opId]);
    }
  };

  const displayText = selectedOps.length === 0
    ? 'Nenhuma'
    : operations
        .filter(op => selectedOps.includes(op.id))
        .map(op => op.name)
        .join(', ');

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-700 outline-none text-left flex justify-between items-center cursor-pointer select-none hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed min-w-[120px] max-w-[160px] truncate"
      >
        <span className="truncate pr-2">{displayText}</span>
        <span className="text-[8px] text-slate-400 shrink-0">▼</span>
      </button>

      {isOpen && (
        <div className={`absolute left-0 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 max-h-48 overflow-y-auto ${openUpward ? 'bottom-full mb-2' : 'mt-1'}`}>
          {operations.map(op => {
            const isChecked = selectedOps.includes(op.id);
            return (
              <label
                key={op.id}
                className="flex items-center px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-[10px] font-bold text-slate-700 select-none space-x-2"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleOp(op.id)}
                  disabled={disabled}
                  className="rounded border-slate-300 text-[#64183f] focus:ring-[#64183f] h-3.5 w-3.5"
                />
                <span className="truncate">{op.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const UserManagementView: React.FC = () => {
  const { filters, fetchSquadFromDb, canWrite } = usePlanningStore();
  const [config, setConfig] = useState<UserMgmtConfig | null>(null);
  const originalConfig = useRef<UserMgmtConfig | null>(null);
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [operations, setOperations] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };
  
  // State for adding new user manually
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState('visualizador');
  const [newUserMsg, setNewUserMsg] = useState('');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<{ username: string; fullName: string } | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [rbacRes, squadRes] = await Promise.all([
        fetch('/api/user-management'),
        fetch('/api/squad')
      ]);

      if (rbacRes.ok && squadRes.ok) {
        const rbacData = await rbacRes.json();
        const squadData = await squadRes.json();
        
        // Sync userOperations from database squad operations on load
        if (!rbacData.userOperations) {
          rbacData.userOperations = {};
        }
        squadData.forEach((member: any) => {
          if (member.email) {
            const username = member.email.split('@')[0].trim().toLowerCase();
            if (member.operationIds && member.operationIds.length > 0) {
              rbacData.userOperations[username] = member.operationIds;
            }
          }
        });

        setConfig(rbacData);
        originalConfig.current = JSON.parse(JSON.stringify(rbacData));
        setSquad(squadData);
      }

      // Fetch operations separately — don't block loading if it fails
      try {
        const opsRes = await fetch('/api/operations');
        if (opsRes.ok) {
          const opsData = await opsRes.json();
          if (Array.isArray(opsData)) {
            setOperations(opsData);
          }
        }
      } catch (opsErr) {
        console.warn('Operações não carregadas:', opsErr);
      }
    } catch (err) {
      console.error('Erro ao buscar dados de gestão de usuários:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (config) {
      // Only save if config is different from the original config
      if (originalConfig.current && JSON.stringify(config) === JSON.stringify(originalConfig.current)) {
        return;
      }

      const saveAutomatically = async () => {
        setSaving(true);
        try {
          const res = await fetch('/api/user-management', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
          });
          // Always update originalConfig to prevent infinite save loop.
          // The JSON file is written server-side before any DB operations, so
          // even a partial DB failure still persists the config file changes.
          originalConfig.current = config;
          if (res.ok) {
            showToast('Salvo automaticamente', 'success');
            // Refresh squad after a brief delay to ensure database commits are fully ready
            setTimeout(async () => {
              fetchSquadFromDb();
              try {
                const squadRes = await fetch('/api/squad');
                if (squadRes.ok) {
                  const squadData = await squadRes.json();
                  setSquad(squadData);
                }
              } catch (err) {
                console.error('Erro ao atualizar squad local:', err);
              }
            }, 400);

            // Update local storage permissions if it's the current user
            const currentUsername = localStorage.getItem('kairos_username');
            if (currentUsername) {
              const userRole = config.userRoles[currentUsername.toLowerCase().trim()] || 'visualizador';
              const matchedRole = config.roles.find(r => r.id === userRole);
              if (matchedRole) {
                localStorage.setItem('kairos_permissions', JSON.stringify(matchedRole.permissions));
                window.dispatchEvent(new Event('storage'));
              }
            }
          }
        } catch (err) {
          console.error('Erro ao salvar automaticamente:', err);
          originalConfig.current = config;
        } finally {
          setSaving(false);
        }
      };

      const timer = setTimeout(saveAutomatically, 400);
      return () => clearTimeout(timer);
    }
  }, [config]);


  const handlePermissionToggle = (roleId: string, permissionKey: keyof Role['permissions']) => {
    if (!config) return;

    const updatedRoles = config.roles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [permissionKey]: !role.permissions[permissionKey]
          }
        };
      }
      return role;
    });

    setConfig({
      ...config,
      roles: updatedRoles
    });
  };

  const getRoleLevel = (roleId: string): number => {
    const levels: Record<string, number> = {
      admin: 4,
      gestor: 3,
      colaborador: 2,
      visualizador: 1
    };
    return levels[roleId] || 1;
  };

  const handleUserRoleChange = (username: string, roleId: string) => {
    if (!config) return;

    const currentUserUsername = (localStorage.getItem('kairos_username') || '').toLowerCase().trim();
    const currentUserRole = config.userRoles[currentUserUsername] || 'visualizador';
    const currentUserLevel = getRoleLevel(currentUserRole);

    const targetUserCurrentRole = config.userRoles[username.toLowerCase().trim()] || 'visualizador';

    if (getRoleLevel(targetUserCurrentRole) > currentUserLevel) {
      showToast('Você não pode alterar a permissão de um usuário com nível de acesso superior ao seu.', 'error');
      return;
    }

    if (getRoleLevel(roleId) > currentUserLevel) {
      showToast('Você não pode conceder um nível de acesso superior ao seu.', 'error');
      return;
    }

    setConfig({
      ...config,
      userRoles: {
        ...config.userRoles,
        [username.toLowerCase().trim()]: roleId
      }
    });
  };

  const handleUserOperationsChange = (username: string, opIds: number[]) => {
    if (!config) return;

    setConfig({
      ...config,
      userOperations: {
        ...(config.userOperations || {}),
        [username.toLowerCase().trim()]: opIds
      }
    });
  };

  const handleAddManualUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !newUserUsername.trim()) return;

    const currentUserUsername = (localStorage.getItem('kairos_username') || '').toLowerCase().trim();
    const currentUserRole = config.userRoles[currentUserUsername] || 'visualizador';
    const currentUserLevel = getRoleLevel(currentUserRole);

    if (getRoleLevel(newUserRole) > currentUserLevel) {
      setNewUserMsg('Você não pode conceder um nível de acesso superior ao seu.');
      return;
    }

    // Extract only the username part in case the user typed their email address
    const usernameLower = newUserUsername.trim().toLowerCase().split('@')[0];

    // Check if already mapped and exists in the squad database list
    const isRegisteredInSquad = squad.some(member => 
      member.email && member.email.split('@')[0].trim().toLowerCase() === usernameLower
    );

    if (config.userRoles[usernameLower] && isRegisteredInSquad) {
      setNewUserMsg('Este usuário já possui uma permissão associada.');
      return;
    }

    // Preserve existing operations when adding a new user role mapping
    const matchedSquadMember = squad.find(member =>
      member.email && member.email.split('@')[0].trim().toLowerCase() === usernameLower
    );
    const existingOps = matchedSquadMember?.operationIds || [];

    setConfig({
      ...config,
      userRoles: {
        ...config.userRoles,
        [usernameLower]: newUserRole
      },
      userOperations: {
        ...(config.userOperations || {}),
        [usernameLower]: existingOps
      }
    });

    setNewUserUsername('');
    setNewUserMsg('Usuário adicionado com sucesso!');
    setTimeout(() => setNewUserMsg(''), 3000);
  };

  if (loading || !config) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500">
        <ArrowClockwise size={32} className="animate-spin mb-2 text-[#64183f]" />
        <p className="text-xs font-bold uppercase tracking-wider">Carregando Módulo de Gestão de Usuários...</p>
      </div>
    );
  }

  const currentUserUsername = (localStorage.getItem('kairos_username') || '').toLowerCase().trim();
  const currentUserRole = config.userRoles[currentUserUsername] || 'visualizador';
  const currentUserLevel = getRoleLevel(currentUserRole);

  // Get list of all unique users:
  // 1. From squad members (extracted username from email, or using names)
  // 2. From manually added userRoles keys
  const squadUsersMap = new Map<string, { fullName: string; email: string | null }>();
  squad.forEach(member => {
    if (member.email) {
      const username = member.email.split('@')[0].trim().toLowerCase();
      squadUsersMap.set(username, { fullName: member.nome, email: member.email });
    }
  });

  const allDisplayUsers: { username: string; fullName: string; email: string | null; role: string; isSquad: boolean }[] = [];
  const processedUsernames = new Set<string>();

  // 1. Populate squad users
  squad.forEach(member => {
    if (member.email) {
      const username = member.email.split('@')[0].trim().toLowerCase();
      processedUsernames.add(username);
      const rbacRole = config.userRoles[username] || 'visualizador';
      allDisplayUsers.push({
        username,
        fullName: member.nome,
        email: member.email,
        role: rbacRole,
        isSquad: true
      });
    }
  });

  // 2. Add users from config.userRoles that are not in the squad list, checking for correct name from squad matches
  Object.keys(config.userRoles).forEach(username => {
    const normalizedUsername = username.toLowerCase().trim();
    if (!processedUsernames.has(normalizedUsername)) {
      const rbacRole = config.userRoles[normalizedUsername];
      const matchedMember = squad.find(m => {
        if (m.email) {
          return m.email.split('@')[0].trim().toLowerCase() === normalizedUsername;
        }
        return false;
      });

      allDisplayUsers.push({
        username: normalizedUsername,
        fullName: matchedMember ? matchedMember.nome : (normalizedUsername.charAt(0).toUpperCase() + normalizedUsername.slice(1)),
        email: matchedMember ? matchedMember.email : `${normalizedUsername}@minsait.com`,
        role: rbacRole,
        isSquad: !!matchedMember
      });
    }
  });

  // Filter users by search term, role query and operation query
  const userSearch = filters.userSearchQuery || '';
  const userRolesStr = filters.userRoleQuery || '';
  const selectedRoles = userRolesStr ? userRolesStr.split(',') : [];

  const userOpsStr = filters.userOperationsQuery || '';
  const selectedOps = userOpsStr ? userOpsStr.split(',').map(Number) : [];

  const filteredUsers = allDisplayUsers.filter(user => {
    // 1. Filter by global search query
    if (userSearch) {
      const matchSearch = 
        user.username.toLowerCase().includes(userSearch.toLowerCase()) || 
        user.fullName.toLowerCase().includes(userSearch.toLowerCase()) || 
        (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()));
      if (!matchSearch) return false;
    }

    // 2. Filter by global role query
    if (selectedRoles.length > 0) {
      if (!selectedRoles.includes(user.role)) return false;
    }

    // 3. Filter by operations multi-select query
    if (selectedOps.length > 0) {
      const userOps = config.userOperations?.[user.username] || [];
      const hasOp = userOps.some(opId => selectedOps.includes(opId));
      if (!hasOp) return false;
    }

    // 4. Filter by local search term
    if (searchTerm) {
      const matchLocal = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchLocal) return false;
    }

    return true;
  });

  const permissionLabels: Record<keyof Role['permissions'], string> = {
    dashboard: 'Acesso à Tela Dashboard',
    "projetos-menu": 'Acesso à Tela Projetos',
    resources: 'Acesso à Tela Recursos/Profissionais',
    hierarchy: 'Acesso à Tela Organograma do Time',
    calendar: 'Acesso à Tela Calendário',
    ferries: 'Acesso à Tela Férias',
    administration: 'Acesso à Tela Gestão de Usuários',
    can_save: 'Permissão para Salvar/Criar/Editar (Gravação)'
  };

  const getPermissionIcon = (key: keyof Role['permissions']) => {
    switch (key) {
      case 'dashboard':
        return <SquaresFour size={16} className="text-slate-500" />;
      case 'projetos-menu':
        return <Briefcase size={16} className="text-slate-500" />;
      case 'resources':
        return <Users size={16} className="text-slate-500" />;
      case 'hierarchy':
        return <TreeStructure size={16} className="text-slate-500" />;
      case 'calendar':
        return <Calendar size={16} className="text-slate-500" />;
      case 'ferries':
        return <Suitcase size={16} className="text-slate-500" />;
      case 'administration':
        return <Key size={16} className="text-slate-500" />;
      case 'can_save':
        return <FloppyDisk size={16} className="text-slate-500" />;
      default:
        return null;
    }
  };




  return (
    <div className="h-full flex flex-col animate-fade-in relative text-slate-800 bg-transparent overflow-hidden">
      
      {/* ── HEADER ── */}
      <div className="px-8 border-b border-slate-200 bg-white py-5 flex justify-between items-center z-10 select-none transition-all duration-300">
        <div>
          <h2 className="font-extrabold text-[#64183f] text-2xl">Gestão de Usuários</h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">Associação de perfis e controle de acessos do sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <ArrowClockwise size={14} className="animate-spin text-[#64183f]" />
              Salvando...
            </span>
          )}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white/85 backdrop-blur-md">
        <div className="space-y-6 pb-10">

          {/* Tabs Menu in Content Area */}
          <div className="flex border-b border-slate-200 shrink-0 mb-4 bg-transparent">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-4 font-black uppercase tracking-wider text-xs border-b-2 transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'users' 
                  ? 'border-[#64183f] text-[#64183f]' 
                  : 'border-transparent text-slate-400 hover:text-slate-605'
              }`}
            >
              <Users size={16} weight="bold" />
              Usuários e Papéis ({allDisplayUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`pb-3 px-4 font-black uppercase tracking-wider text-xs border-b-2 transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'permissions' 
                  ? 'border-[#64183f] text-[#64183f]' 
                  : 'border-transparent text-slate-400 hover:text-slate-605'
              }`}
            >
              <CheckSquare size={16} weight="bold" />
              Configuração de Acessos
            </button>
          </div>

          {activeTab === 'permissions' && (
            <div className="bg-[#FAF4EF]/50 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-[2rem] p-6 shadow-sm space-y-6">
              <div className="bg-[#EAE5EA]/70 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-2xl p-4 text-xs font-semibold">
                <span className="font-extrabold uppercase tracking-wide block mb-1">ℹ️ Configuração de Perfis</span>
                Defina os níveis de acesso de cada um dos quatro perfis do sistema. As alterações feitas aqui serão aplicadas a todos os usuários pertencentes a cada perfil correspondente de forma automática.
              </div>

              {/* Roles Permissions Grid Table */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse min-w-full text-xs">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#64183f] to-[#1a1f44] text-[10px] font-black text-white uppercase tracking-widest border-b border-slate-200">
                      <th className="py-3 px-4 w-[40%]">Recurso / Permissão</th>
                      {config.roles.map(role => (
                        <th key={role.id} className="py-3 px-4 text-center">{role.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                    {(Object.keys(permissionLabels) as Array<keyof Role['permissions']>).map(permissionKey => (
                      <tr key={permissionKey} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 flex items-center space-x-3">
                          <span className="flex shrink-0 items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
                            {getPermissionIcon(permissionKey)}
                          </span>
                          <div>
                            <span className="block font-black text-slate-800">{permissionLabels[permissionKey]}</span>
                            <span className="text-[9px] text-slate-400 font-semibold block uppercase mt-0.5">Chave: {permissionKey}</span>
                          </div>
                        </td>
                        {config.roles.map(role => {
                          const hasPerm = role.permissions[permissionKey];
                          const isSystemAdminLock = role.id === 'admin' && (permissionKey === 'administration' || permissionKey === 'can_save');
                          
                          return (
                          <td key={role.id} className="p-4 text-center">
                            <button
                              disabled={isSystemAdminLock || !canWrite} // Can't remove admin lock permissions
                              onClick={() => handlePermissionToggle(role.id, permissionKey)}
                              className={`mx-auto p-1.5 rounded-lg border transition-all ${
                                hasPerm 
                                  ? 'bg-[#64183f]/10 border-[#64183f]/30 text-[#64183f]' 
                                  : 'bg-slate-50 border-slate-200 text-slate-300'
                              } ${(isSystemAdminLock || !canWrite) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                            >
                              {hasPerm ? (
                                <CheckSquare size={18} weight="fill" />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-[#FAF4EF]/50 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-[2rem] p-6 shadow-sm space-y-6">
            
            {/* Search Bar (Full Width) */}
            <div className="relative w-full">
              <MagnifyingGlass size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar usuários por nome, username ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#64183f]/50 transition-all placeholder-slate-400 shadow-sm"
              />
            </div>

            {/* Add User Form (Below Search Bar) */}
            {canWrite && (
              <form 
                onSubmit={handleAddManualUser} 
                className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row gap-2.5 items-center w-full lg:w-fit"
              >
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Usuário Windows (AD) - Ex: cvieira"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value.replace(/\s/g, ''))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#64183f]/50"
                  />
                </div>
                
                <div className="w-full sm:w-40">
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-[#64183f]/50"
                  >
                    {config.roles.filter(r => getRoleLevel(r.id) <= currentUserLevel).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="pl-4 pr-1.5 py-1 rounded-full text-white font-extrabold text-[11px] shadow-sm flex items-center justify-between select-none transition-all hover:scale-[1.02] active:scale-95 w-40 shrink-0"
                  style={{ background: "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" }}
                >
                  <div className="flex items-center space-x-1.5">
                    <UserPlus size={12} className="text-white" weight="bold" />
                    <span className="tracking-wide">Incluir Usuário</span>
                  </div>
                  
                  <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center bg-white/10 shadow-sm ml-2">
                    <UserPlus size={10} weight="bold" />
                  </div>
                </button>
              </form>
            )}

            {newUserMsg && (
              <div className={`text-[10px] font-black uppercase tracking-wider ${newUserMsg.includes('sucesso') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {newUserMsg}
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse min-w-full text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-[#64183f] to-[#1a1f44] text-[10px] font-black text-white uppercase tracking-widest border-b border-slate-200">
                    <th className="py-2.5 px-3">Nome / Usuário</th>
                    <th className="py-2.5 px-3">E-mail</th>
                    <th className="py-2.5 px-3">Papel / Nível de Acesso</th>
                    <th className="py-2.5 px-3">Operação/Time</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                  {filteredUsers.map((user, index) => {
                    const squadMember = squad.find(m => m.email && m.email.split('@')[0].trim().toLowerCase() === user.username);
                    const avatarObj = squadMember && squadMember.avatar ? getAvatarById(squadMember.avatar) : null;
                    const avatarImage = squadMember ? squadMember.avatarImage : null;

                    const openUpward = index >= filteredUsers.length - 2 || filteredUsers.length < 3;

                    return (
                      <tr key={user.username} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                background: avatarImage
                                  ? 'transparent'
                                  : avatarObj 
                                    ? avatarObj.gradient 
                                    : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)'
                              }}
                            >
                              {avatarImage ? (
                                <img 
                                  src={avatarImage} 
                                  alt={user.fullName} 
                                  className="w-full h-full object-cover object-top rounded-full" 
                                />
                              ) : avatarObj ? (
                                avatarObj.icon
                              ) : (
                                user.fullName.slice(0, 2).toUpperCase()
                              )}
                            </Avatar>
                            <div className="min-w-0">
                              <span className="block font-black text-slate-800">{user.fullName}</span>
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5 block">Username: {user.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">
                          {user.email || <span className="italic text-slate-300 font-semibold">Sem e-mail</span>}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <span className="flex shrink-0 items-center justify-center w-6 h-6 rounded-lg bg-slate-100/85 text-[#64183f]">
                              {user.role === 'admin' && <Crown size={14} weight="fill" className="text-amber-500" />}
                              {user.role === 'gestor' && <Briefcase size={14} weight="fill" />}
                              {user.role === 'colaborador' && <User size={14} weight="fill" />}
                              {user.role === 'visualizador' && <Eye size={14} weight="fill" className="text-slate-400" />}
                            </span>
                            {canWrite && getRoleLevel(user.role) <= currentUserLevel ? (
                              <select
                                value={user.role}
                                onChange={(e) => handleUserRoleChange(user.username, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 outline-none focus:border-[#64183f]/50 transition-all font-bold cursor-pointer"
                              >
                                {config.roles.filter(r => getRoleLevel(r.id) <= currentUserLevel).map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs font-bold text-slate-600">
                                {config.roles.find(r => r.id === user.role)?.name || user.role}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <OperationSelector
                            selectedOps={config.userOperations?.[user.username] || []}
                            operations={operations}
                            onChange={(ops) => handleUserOperationsChange(user.username, ops)}
                            disabled={!canWrite || getRoleLevel(user.role) > currentUserLevel}
                            openUpward={openUpward}
                          />
                        </td>

                        <td className="p-3 text-center">
                          {canWrite && getRoleLevel(user.role) <= currentUserLevel && (
                            <button
                              onClick={() => setDeleteConfirmUser({ username: user.username, fullName: user.fullName })}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                              title="Excluir profissional da base"
                            >
                              <Trash size={16} weight="bold" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                        Nenhum usuário correspondente à pesquisa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        </div>
      </div>

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
      
      {/* Custom User Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in text-slate-800 font-sans">
          <div className="bg-white w-[420px] rounded-[2rem] border border-slate-100 shadow-2xl p-6 relative animate-zoom-in flex flex-col items-center text-center">
            
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
              <Trash size={24} weight="bold" />
            </div>

            <h3 className="text-base font-black text-slate-800 mb-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Confirmar Remoção
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-6">
              Deseja realmente remover o usuário <span className="font-extrabold text-[#64183f]">"{deleteConfirmUser.fullName}"</span> da Gestão de Acessos?
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-[#5c5856] hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!config) return;
                  const usernameKey = deleteConfirmUser.username.toLowerCase().trim();
                  
                  setSaving(true);
                  try {
                    const newUserRoles = { ...config.userRoles };
                    delete newUserRoles[usernameKey];
                    
                    const newUserOps = { ...(config.userOperations || {}) };
                    delete newUserOps[usernameKey];

                    const targetConfig = {
                      ...config,
                      userRoles: newUserRoles,
                      userOperations: newUserOps,
                      deletedUser: usernameKey
                    };

                    const res = await fetch('/api/user-management', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(targetConfig)
                    });

                    let resData: any = {};
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                      resData = await res.json();
                    } else {
                      const errorText = await res.text();
                      throw new Error(errorText || `Erro no servidor (${res.status})`);
                    }

                    if (!res.ok) {
                      throw new Error(resData.error || 'Erro ao remover mapeamento do usuário.');
                    }

                    // Apply updated config state only on success
                    setConfig(targetConfig);
                    originalConfig.current = targetConfig;
                    setDeleteConfirmUser(null);
                    showToast('Usuário removido com sucesso.', 'success');
                    
                    // Add a brief delay so Oracle transaction finishes commit before we query again
                    setTimeout(async () => {
                      await fetchSquadFromDb();
                      try {
                        const squadRes = await fetch('/api/squad');
                        if (squadRes.ok) {
                          const squadData = await squadRes.json();
                          setSquad(squadData);
                        }
                      } catch (err) {
                        console.error('Erro ao atualizar squad local após remoção:', err);
                      }
                    }, 400);
                  } catch (err: any) {
                    alert(err.message || 'Não foi possível excluir o profissional.');
                  } finally {
                    setSaving(false);
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
    </div>
  );
};
