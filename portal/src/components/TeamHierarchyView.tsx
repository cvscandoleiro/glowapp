import React, { useState, useRef, useMemo } from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import { getAvatarById } from '../utils/avatarRepository';
import {
  MagnifyingGlass,
  Plus,
  Minus,
  ArrowCounterClockwise,
  User,
  Briefcase,
  Envelope,
  Phone,
  MapPin,
  X,
  Target,
} from '@phosphor-icons/react';

interface SquadMember {
  id: number;
  nome: string;
  perfil: string;
  status: string;
  avatar: string | null;
  email: string | null;
  telephoneContact: string | null;
  matricula: string | null;
  clientId: string | null;
  localityId: number | null;
  state: string | null;
  city: string | null;
  avatarImage: string | null;
  operationId: number | null;
  operationIds: number[];
  managerId: number | null;
}

interface TreeNode extends SquadMember {
  children: TreeNode[];
}

const LEVEL_COLORS: Record<number, [string, string]> = {
  0: ['#64183f', '#ec4899'], // Level 0: Wine to Rose (Top leaders)
  1: ['#1e3a8a', '#3b82f6'], // Level 1: Royal Blue to Sky Blue
  2: ['#0f766e', '#2dd4bf'], // Level 2: Teal to Mint
  3: ['#b45309', '#fbbf24'], // Level 3: Amber to Golden Yellow
  4: ['#6b21a8', '#c084fc'], // Level 4: Purple to Orchid
  5: ['#374151', '#9ca3af'], // Level 5+: Slate to Light Gray
};

const getLevelGradientColors = (depth: number): [string, string] => {
  if (depth <= 0) return LEVEL_COLORS[0];
  if (depth === 1) return LEVEL_COLORS[1];
  if (depth === 2) return LEVEL_COLORS[2];
  if (depth === 3) return LEVEL_COLORS[3];
  if (depth === 4) return LEVEL_COLORS[4];
  return LEVEL_COLORS[5];
};

// ─── Avatar Ring SVG ──────────────────────────────────────────────────────────
// Draws the specific infographic ring:
// - A thin outer circular line all the way around
// - A thick filled semicircle band from the horizontal midline downwards
function ArcRing({ depth, size }: { depth: number; size: number }) {
  const r_outer = (size / 2) - 1;
  const cx = size / 2;
  const cy = size / 2;
  const r_mid = r_outer - 5; // center radius of the bottom band
  const strokeWidthThick = 9;

  const [c1, c2] = getLevelGradientColors(depth);
  const gradId = `arc-grad-${depth}-${size}`;

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
      
      {/* 1. Thin outer circle all the way around */}
      <circle
        cx={cx}
        cy={cy}
        r={r_outer - 1}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.5"
      />

      {/* 2. Thick filled bottom semicircle band */}
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

// Helper to calculate direct and indirect descendants in the tree
const getReportsCounts = (node: TreeNode) => {
  const countDescendants = (n: TreeNode): number => {
    let count = 0;
    if (n.children) {
      n.children.forEach(child => {
        count += 1 + countDescendants(child);
      });
    }
    return count;
  };
  const total = countDescendants(node);
  const direct = node.children ? node.children.length : 0;
  const indirect = total - direct;
  return { direct, indirect, total };
};

// ─── OrgNode ──────────────────────────────────────────────────────────────────
function OrgNode({
  node,
  depth,
  searchTerm,
  showReportsCount,
  showOnlyDirectSubordinates,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  searchTerm: string;
  showReportsCount: boolean;
  showOnlyDirectSubordinates: boolean;
  onSelect: (m: SquadMember) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isHighlighted = searchTerm.trim()
    ? node.nome.toLowerCase().includes(searchTerm.toLowerCase())
    : false;

  const avatarObj = node.avatar ? getAvatarById(node.avatar) : null;
  const initials = node.nome
    .split(' ')
    .filter(p => !['de', 'da', 'do', 'das', 'dos', 'e'].includes(p.toLowerCase()))
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isRoot = depth === 0;
  const ringSize = isRoot ? 77 : 63; // 30% reduction (110 * 0.7 = 77, 90 * 0.7 = 63)
  const photoSize = isRoot ? 61 : 47; // Aligns perfectly inside the thick arc
  const [bgStart, bgEnd] = getLevelGradientColors(depth);

  return (
    <li className="orgc-li">
      <div
        className={`orgc-node interactive-card ${isHighlighted ? 'orgc-node--hl' : ''}`}
        onClick={() => onSelect(node)}
      >
        {/* Avatar with arc ring */}
        <div className="relative flex-shrink-0 mx-auto" style={{ width: ringSize, height: ringSize }}>
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
            {node.avatarImage ? (
              <img src={node.avatarImage} alt={node.nome} className="w-full h-full object-cover object-top" />
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
                  background: `linear-gradient(135deg, ${bgStart}, ${bgEnd})`,
                  fontSize: photoSize * 0.28,
                }}
              >
                {initials || <User weight="bold" />}
              </div>
            )}
          </div>
          {/* Decorative arc ring overlay */}
          <ArcRing depth={depth} size={ringSize} />
          {/* Floating count circle on Top-Right of the Avatar */}
          {showReportsCount && hasChildren && (() => {
            const { direct, indirect, total } = getReportsCounts(node);
            const [c1, c2] = getLevelGradientColors(depth);
            return (
              <div 
                className="absolute z-20 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${c1}, ${c2})`,
                  width: '18px',
                  height: '18px',
                  top: '14.6%',
                  right: '14.6%',
                  transform: 'translate(50%, -50%)',
                }}
                title={`${total} liderados (${direct} diretos / ${indirect} indiretos)`}
              >
                {total}
              </div>
            );
          })()}
        </div>

        {/* Name + Position — directly below, no card */}
        <div className="mt-2 text-center px-1" style={{ maxWidth: ringSize + 25 }}>
          <p
            className="font-extrabold text-slate-800 leading-tight line-clamp-2"
            style={{ fontSize: isRoot ? 10 : 8.5, fontFamily: 'Outfit, sans-serif' }}
          >
            {node.nome}
          </p>
          <p
            className="font-semibold uppercase tracking-widest text-slate-500 mt-0.5 line-clamp-1"
            style={{ fontSize: 6.5 }}
          >
            {node.perfil}
          </p>
        </div>
      </div>

      {/* Children */}
      {hasChildren && (!showOnlyDirectSubordinates || depth < 1) && (
        <ul className="orgc-ul">
          {node.children.map(child => (
            <OrgNode key={child.id} node={child} depth={depth + 1} searchTerm={searchTerm} showReportsCount={showReportsCount} showOnlyDirectSubordinates={showOnlyDirectSubordinates} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TeamHierarchyView() {
  const { squad, filters } = usePlanningStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedMember, setSelectedMember] = useState<SquadMember | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.3));
  const handleReset = () => { setZoom(1); setPanOffset({ x: 0, y: 0 }); };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-card') || target.closest('.control-btn')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  // ── Build filtered tree ─────────────────────────────────────────────────────
  const treeData = useMemo(() => {
    if (!squad || squad.length === 0) return [];

    const filteredSquad = squad.filter(res => {
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
          if (!loggedInOps.some(opId => resOps.includes(opId))) return false;
        }
      }

      // Operation Filter from global store filters
      const operationIdFilter = filters.hierarchyOperationId ? Number(filters.hierarchyOperationId) : null;
      if (operationIdFilter !== null) {
        const resOps = [
          ...(Array.isArray(res.operationIds) ? res.operationIds : []),
          ...(res.operationId !== undefined && res.operationId !== null ? [Number(res.operationId)] : [])
        ].filter(Boolean);
        if (!resOps.includes(operationIdFilter)) return false;
      }

      if (filters.searchQuery.trim()) {
        if (!res.nome.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      }
      if ((filters.resourceEmail || '').trim()) {
        if (!(res.email || '').toLowerCase().includes((filters.resourceEmail || '').toLowerCase())) return false;
      }
      if ((filters.resourceMatricula || '').trim()) {
        if (!(res.matricula || '').includes(filters.resourceMatricula || '')) return false;
      }
      if ((filters.resourceClientId || '').trim()) {
        if (!(res.clientId || '').includes(filters.resourceClientId || '')) return false;
      }
      if (filters.perfil) {
        const selectedProfiles = filters.perfil.split(',');
        if (!selectedProfiles.includes(res.perfil)) return false;
      }
      if (filters.status) {
        const selectedStatuses = filters.status.split(',');
        if (!selectedStatuses.includes(res.status || 'ATIVO')) return false;
      }
      if (filters.resourceStates) {
        const states = filters.resourceStates.split(',').filter(Boolean);
        if (states.length > 0 && !states.includes(res.state || '')) return false;
      }
      if (filters.resourceCities) {
        const cities = filters.resourceCities.split(',').filter(Boolean);
        if (cities.length > 0 && !cities.includes(res.city || '')) return false;
      }

      return true;
    });

    let finalSquad = filteredSquad;
    const activeSearch = searchTerm.trim().toLowerCase();
    if (activeSearch) {
      const matchedNodeIds = new Set<number>();
      filteredSquad.forEach(member => {
        if (member.id !== undefined && member.nome.toLowerCase().includes(activeSearch)) {
          matchedNodeIds.add(member.id);
        }
      });

      const ancestorIds = new Set<number>();
      matchedNodeIds.forEach(id => {
        let current = filteredSquad.find(m => m.id === id);
        while (current && current.managerId) {
          const nextManagerId = current.managerId;
          ancestorIds.add(nextManagerId);
          current = filteredSquad.find(m => m.id === nextManagerId);
        }
      });

      const descendantIds = new Set<number>();
      const addDescendants = (parentId: number) => {
        filteredSquad.forEach(m => {
          if (m.managerId === parentId && m.id !== undefined && !descendantIds.has(m.id)) {
            descendantIds.add(m.id);
            addDescendants(m.id);
          }
        });
      };
      matchedNodeIds.forEach(id => {
        addDescendants(id);
      });

      const allowedIds = new Set([
        ...matchedNodeIds,
        ...ancestorIds,
        ...descendantIds
      ]);

      finalSquad = filteredSquad.filter(m => m.id !== undefined && allowedIds.has(m.id));
    }

    const memberMap = new Map<number, TreeNode>();
    finalSquad.forEach(member => {
      if (member.id !== undefined) {
        memberMap.set(member.id, { ...member, children: [] } as unknown as TreeNode);
      }
    });

    const roots: TreeNode[] = [];
    finalSquad.forEach(member => {
      if (member.id !== undefined) {
        const node = memberMap.get(member.id);
        if (node) {
          if (member.managerId && memberMap.has(member.managerId)) {
            memberMap.get(member.managerId)!.children.push(node);
          } else {
            roots.push(node);
          }
        }
      }
    });

    return roots;
  }, [squad, filters, searchTerm]);

  // ── Drawer avatar ──────────────────────────────────────────────────────────
  const renderDrawerAvatar = () => {
    if (!selectedMember) return null;
    const avatarObj = selectedMember.avatar ? getAvatarById(selectedMember.avatar) : null;
    const initials = selectedMember.nome.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
    if (selectedMember.avatarImage) {
      return <img src={selectedMember.avatarImage} alt={selectedMember.nome} className="w-full h-full object-cover object-top rounded-full" />;
    }
    if (avatarObj) {
      return <div className="w-full h-full rounded-full flex items-center justify-center text-2xl text-white" style={{ background: avatarObj.gradient }}>{avatarObj.icon}</div>;
    }
    return <div className="w-full h-full rounded-full flex items-center justify-center text-2xl font-black text-white" style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>{initials}</div>;
  };

  return (
    <div className="h-full flex flex-col animate-fade-in relative text-slate-800 bg-transparent overflow-hidden">

      {/* ── Inline CSS for org-chart tree layout ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');

        /* ── Tree structure ── */
        .orgc-tree {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .orgc-ul {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 0;
          position: relative;
          list-style: none;
          margin: 0;
          padding-left: 0;
        }

        /* ── Each node li ── */
        .orgc-li {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 22px 11px 0 11px;
          list-style: none;
        }

        /* Horizontal connector bars */
        .orgc-li::before, .orgc-li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          border-top: 2px solid rgba(148,163,184,0.35);
          width: 50%;
          height: 22px;
        }
        .orgc-li::after {
          right: auto;
          left: 50%;
          border-left: 2px solid rgba(148,163,184,0.35);
        }
        .orgc-li:only-child::before,
        .orgc-li:only-child::after { display: none; }
        .orgc-li:only-child { padding-top: 0; }

        .orgc-li:first-child::before,
        .orgc-li:last-child::after { border: none; }

        .orgc-li:last-child::before {
          border-right: 2px solid rgba(148,163,184,0.35);
          border-radius: 0 8px 0 0;
        }
        .orgc-li:first-child::after {
          border-radius: 8px 0 0 0;
        }

        /* Vertical stem above each nested ul */
        .orgc-ul::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 2px solid rgba(148,163,184,0.35);
          width: 0;
          height: 22px;
        }
        /* The outermost ul has no stem above it */
        .orgc-ul:first-child::before { display: none; }

        /* ── Node card (no visible card — transparent) ── */
        .orgc-node {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px;
          border-radius: 16px;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .orgc-node:hover {
          transform: translateY(-4px) scale(1.04);
          background: rgba(255,255,255,0.04);
        }
        .orgc-node--hl {
          background: rgba(236,72,153,0.12) !important;
          box-shadow: 0 0 0 3px rgba(236,72,153,0.3);
          border-radius: 16px;
          animation: orgc-pulse 1.6s ease-in-out infinite;
        }

        @keyframes orgc-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(236,72,153,0.3); }
          50%       { box-shadow: 0 0 0 8px rgba(236,72,153,0.08); }
        }

        /* Drawer slide-in */
        @keyframes orgcSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .orgc-drawer { animation: orgcSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ── Header (CalendarView pattern) ── */}
      <div className="px-8 border-b border-slate-200 bg-white flex justify-between items-center z-10 select-none py-5">
        <div>
          <h2 className="font-extrabold text-[#64183f] text-2xl">Organograma do Time</h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Estrutura hierárquica com base nos dados de coordenação.
          </p>
        </div>
      </div>

      {/* ── Canvas — using the same light color pattern as CalendarView ── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-auto relative p-8 lg:p-12 flex items-start justify-center bg-white/85 backdrop-blur-md ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* Floating Filter Panel on Top-Left of the Body */}
        {/* Floating Search Input on Top-Left of the Body */}
        <div className="absolute top-3 left-3 z-[60] w-64 shadow-md bg-white p-1 rounded-xl border border-slate-200">
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar profissional..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-transparent rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-700 font-semibold placeholder-slate-400 focus:bg-white focus:border-[#64183f]/30 transition-all outline-none"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Floating Zoom controls on Top-Right of the Body */}
        <div className="absolute top-3 right-3 z-[60] flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-md shrink-0">
          <button onClick={handleZoomOut} title="Afastar" className="control-btn p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#64183f] transition-all">
            <Minus size={13} weight="bold" />
          </button>
          <span className="text-[10px] font-black text-slate-500 min-w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} title="Aproximar" className="control-btn p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#64183f] transition-all">
            <Plus size={13} weight="bold" />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          <button onClick={handleReset} title="Resetar" className="control-btn p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#64183f] transition-all">
            <ArrowCounterClockwise size={13} weight="bold" />
          </button>
        </div>
        <div
          className="orgc-tree"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'transform 0.075s ease',
          }}
        >
          {treeData.length > 0 ? (
            <ul className="orgc-ul" style={{ paddingTop: 0 }}>
              {treeData.map(root => (
                <OrgNode
                  key={root.id}
                  node={root}
                  depth={0}
                  searchTerm={searchTerm}
                  showReportsCount={filters.hierarchyShowReportsCount === 'true'}
                  showOnlyDirectSubordinates={filters.hierarchyShowOnlyDirect === 'true'}
                  onSelect={setSelectedMember}
                />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(0,0,0,0.05)' }}>
                <User size={36} className="text-slate-500" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Nenhum profissional encontrado</p>
              <p className="text-[10px] text-slate-600 font-semibold mt-1">Verifique os filtros ou a operação vinculada</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Side Drawer ── */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-[100] flex justify-end"
          onClick={e => { if (e.target === e.currentTarget) setSelectedMember(null); }}
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        >
          <div className="orgc-drawer fixed inset-y-0 right-0 w-[360px] bg-white shadow-2xl flex flex-col overflow-hidden">

            {/* Banner */}
            <div
              className="relative flex flex-col items-center pt-8 pb-6 px-6 shrink-0"
              style={{ background: 'linear-gradient(180deg, #64183f 0%, #1a1f44 100%)' }}
            >
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors"
              >
                <X size={14} weight="bold" />
              </button>

              {/* Avatar */}
              <div className="relative w-20 h-20 mb-4">
                <div className="w-full h-full rounded-full overflow-hidden shadow-xl" style={{ padding: 3, border: '2px solid rgba(255,255,255,0.3)' }}>
                  {renderDrawerAvatar()}
                </div>
                <ArcRing depth={0} size={80} />
              </div>

              <h4 className="text-base font-black text-white leading-snug text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {selectedMember.nome}
              </h4>
              <span
                className="mt-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/25 text-white/80"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                {selectedMember.perfil}
              </span>
              <span
                className={`mt-2 px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                  (selectedMember.status || 'ATIVO') === 'ATIVO'
                    ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-red-400/20 text-red-300 border-red-400/30'
                }`}
              >
                {selectedMember.status || 'ATIVO'}
              </span>
            </div>

            {/* Info rows */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {[
                { 
                  icon: <User size={15} className="text-amber-500 shrink-0 mt-0.5" />, 
                  label: 'Gestor Responsável', 
                  value: selectedMember.managerId 
                    ? (squad.find(m => m.id === selectedMember.managerId)?.nome || 'Não identificado') 
                    : 'Não possui' 
                },
                { icon: <Envelope size={15} className="text-purple-400 shrink-0 mt-0.5" />, label: 'E-mail', value: selectedMember.email || 'Não cadastrado' },
                { icon: <Phone size={15} className="text-pink-400 shrink-0 mt-0.5" />, label: 'Telefone', value: selectedMember.telephoneContact || 'Não cadastrado' },
                { icon: <MapPin size={15} className="text-indigo-400 shrink-0 mt-0.5" />, label: 'Localidade', value: selectedMember.city ? `${selectedMember.city} — ${selectedMember.state}` : 'Não cadastrada' },
                { icon: <Target size={15} className="text-rose-400 shrink-0 mt-0.5" />, label: 'Matrícula', value: selectedMember.matricula || 'Não cadastrada' },
                { icon: <Briefcase size={15} className="text-cyan-500 shrink-0 mt-0.5" />, label: 'SAP ID', value: selectedMember.clientId || 'Não cadastrado' },
              ].map(row => (
                <div key={row.label} className="flex items-start gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  {row.icon}
                  <div>
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{row.label}</span>
                    <span className="text-xs font-bold text-slate-700 break-all select-all">{row.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
