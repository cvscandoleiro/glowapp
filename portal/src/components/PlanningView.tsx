import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { usePlanningStore } from '../store/PlanningStore';
import type { SquadMember } from '../types';
import { getAvatarById } from '../utils/avatarRepository';
import { generateInteractiveHtml } from '../utils/interactiveExport';
import {
  ClipboardText,
  FileText,
  Users as PhosphorUsers,
  Play as PhosphorPlay,
  Rocket as PhosphorRocket,
  Hourglass as PhosphorHourglass,
  Folder as PhosphorFolder,
  Gear as PhosphorGear,
  Plus,
  X,
  ArrowRight
} from '@phosphor-icons/react';
import {
  Box,
  Typography,
  Avatar,
  AvatarGroup,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  TextField,
  Tooltip,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  CalendarMonth,
  ListAlt,
  Code,
  DragIndicator,
  ViewWeek,
  CalendarToday,
  Check,
  ShowChart,
} from '@mui/icons-material';

const toYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface BacklogDbItem {
  id: number;
  projectId: number;
  taskName: string;
  taskDescription: string;
  taskPhase: string;
  taskTechnology: string;
  taskPoints: number;
  resourceId?: number | null;
  initialDate: string;
  endDate: string;
  taskSequence: string;
  kanbanPhase?: string | null;
  linkJira?: string | null;
  linkWiki?: string | null;
}

interface TimelineTask {
  id: string;
  name: string;
  description: string;
  start: Date;
  end: Date;
  progress: number;
  phase: string;
  status: 'doing' | 'done' | 'backlog';
  resources: SquadMember[];
  originalItem: any;
}

interface GridTimelineTask {
  id: string;
  name: string;
  description: string;
  start: Date | null;
  end: Date | null;
  progress: number;
  phase: string;
  status: 'doing' | 'done' | 'backlog';
  resources: SquadMember[];
  originalItem: any;
}

interface GroupedRow {
  resourceName: string;
  resourceRole?: string;
  resourceAvatar?: string | null;
  resourceAvatarImage?: string | null;
  tasks: TimelineTask[];
}

const getGanttInitials = (name: string) => {
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

const JiraIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="jira-grad-a" x1="243.36" y1="14.16" x2="132.76" y2="121.24" gradientUnits="userSpaceOnUse">
        <stop offset="0.18" stopColor="#0052CC" />
        <stop offset="1" stopColor="#2684FF" />
      </linearGradient>
      <linearGradient id="jira-grad-b" x1="12.96" y1="242.08" x2="123.56" y2="135" gradientUnits="userSpaceOnUse">
        <stop offset="0.18" stopColor="#0052CC" />
        <stop offset="1" stopColor="#2684FF" />
      </linearGradient>
    </defs>
    <path d="M244.66 121.58L138.18 15.1L128.08 5L42.34 90.74L5.5 127.58C-0.34 133.42-0.34 143.08 5.5 148.92L85.74 229.16L128.08 271.5L213.82 185.76L216.08 183.5L244.66 154.92C250.5 149.08 250.5 139.42 244.66 133.58V121.58ZM128.08 166.24L89.42 127.58L128.08 88.92L166.74 127.58L128.08 166.24Z" fill="#2684FF" />
    <path d="M128.08 88.92C107.62 68.62 107.48 35.56 127.78 15.1L42.18 90.9L89.42 138.14L128.08 88.92Z" fill="url(#jira-grad-b)" />
    <path d="M166.86 127.42L128.08 166.24C148.38 186.54 148.52 219.6 128.22 240.06L213.98 164.1L166.86 127.42Z" fill="url(#jira-grad-a)" />
  </svg>
);

const ConfluenceIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 246" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="conf-grad-a" x1="226.76" y1="222.24" x2="99.36" y2="169.12" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#0052CC" />
        <stop offset="0.92" stopColor="#2684FF" />
      </linearGradient>
      <linearGradient id="conf-grad-b" x1="29.24" y1="23.76" x2="156.64" y2="76.88" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#0052CC" />
        <stop offset="0.92" stopColor="#2684FF" />
      </linearGradient>
    </defs>
    <path d="M9.26 187.4C6.2 192.52 2.66 198.6 0.34 202.84C-1.82 207.4 0.02 213 4.46 215.5L66.02 249.82C68.18 250.98 70.72 251.24 73.08 250.56C75.44 249.88 77.44 248.3 78.66 246.18C80.58 242.74 83.18 238.1 86.02 233.06C108.26 194.16 130.5 199.18 173.7 218.76L175.34 219.5L234.02 246.16C238.56 248.24 243.94 246.22 246.04 241.68L275.02 178.28C277.1 173.76 275.08 168.42 270.56 166.3C260.34 161.56 239.1 151.56 226.22 145.7C155.66 113.66 95.42 114.34 9.26 187.4Z" fill="url(#conf-grad-a)" />
    <path d="M266.74 58.6C269.8 53.48 273.34 47.4 275.66 43.16C277.82 38.6 275.98 33 271.54 30.5L209.98 -3.82C207.82 -4.98 205.28 -5.24 202.92 -4.56C200.56 -3.88 198.56 -2.3 197.34 -0.18C195.42 3.26 192.82 7.9 189.98 12.94C167.74 51.84 145.5 46.82 102.3 27.24L100.66 26.5L41.98 -0.16C37.44 -2.24 32.06 0.22 29.96 4.32L0.98 67.72C-1.1 72.24 0.92 77.58 5.44 79.7C15.66 84.44 36.9 94.44 49.78 100.3C120.34 132.34 180.58 131.66 266.74 58.6Z" fill="url(#conf-grad-b)" />
  </svg>
);

function ArcRing({ size, depth = 0 }: { size: number; depth?: number }) {
  const r_outer = (size / 2) - 1;
  const cx = size / 2;
  const cy = size / 2;
  const r_mid = r_outer - 5;
  const strokeWidthThick = 9;

  const colors: Record<number, [string, string]> = {
    0: ['#64183f', '#ec4899'], // Level 0: Wine to Rose
    1: ['#64183f', '#8B2456'], // Level 1: Same as the Save Button
    2: ['#0f4c5c', '#2dd4bf'], // Level 2: Azul Petróleo to Mint-Teal
  };

  const [c1, c2] = colors[depth] || colors[2];
  const gradId = `arc-grad-planning-${depth}-${size}`;

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

const getRequirementColor = (reqName: string) => {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green/emerald
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
    '#a855f7', // light purple
    '#6366f1', // indigo
    '#ef4444', // red
  ];
  let hash = 0;
  for (let i = 0; i < reqName.length; i++) {
    hash = reqName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const darkenHexColor = (hex: string, percent: number) => {
  let color = hex.replace(/^\s*#|\s*$/g, '');
  if (color.length === 3) {
    color = color.replace(/(.)/g, '$1$1');
  }
  let r = parseInt(color.substr(0, 2), 16);
  let g = parseInt(color.substr(2, 2), 16);
  let b = parseInt(color.substr(4, 2), 16);

  r = Math.max(0, Math.floor(r * (1 - percent)));
  g = Math.max(0, Math.floor(g * (1 - percent)));
  b = Math.max(0, Math.floor(b * (1 - percent)));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
};



const getStep3CardIcon = (idx: number) => {
  const size = 36;
  const props = {
    size,
    weight: "duotone" as const,
    style: {
      position: 'absolute' as const,
      right: '-4px',
      bottom: '-4px',
      color: 'white',
      opacity: 0.22,
      transform: 'rotate(-12deg)',
      pointerEvents: 'none' as const,
      userSelect: 'none' as const,
      zIndex: 0
    }
  };
  switch (idx % 8) {
    case 0: return <ClipboardText {...props} />;
    case 1: return <FileText {...props} />;
    case 2: return <PhosphorUsers {...props} />;
    case 3: return <PhosphorPlay {...props} />;
    case 4: return <PhosphorRocket {...props} />;
    case 5: return <PhosphorHourglass {...props} />;
    case 6: return <PhosphorFolder {...props} />;
    default: return <PhosphorGear {...props} />;
  }
};

const formatKanbanDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
};


export const PlanningView: React.FC = () => {
  const { tasks, viewingProject, squad: rawSquad, updateTask, owners, releases, selectedRelease, canWrite } = usePlanningStore();
  
  const loggedInUsername = useMemo(() => localStorage.getItem('kairos_username') || '', []);
  
  const loggedInMember = useMemo(() => {
    return rawSquad.find(m => {
      if (!m.email) return false;
      const prefix = m.email.split('@')[0].toLowerCase().trim();
      return prefix === loggedInUsername.toLowerCase().trim();
    });
  }, [rawSquad, loggedInUsername]);

  const squad = useMemo(() => {
    return rawSquad.filter(res => {
      if (loggedInMember && loggedInMember.operationId !== null && loggedInMember.operationId !== undefined) {
        return res.operationId === loggedInMember.operationId;
      }
      return true;
    });
  }, [rawSquad, loggedInMember]);
  const squadMaskedNames = useMemo<Record<string, string>>(() => {
    const profileCounts: Record<string, number> = {};
    squad.forEach(member => {
      const perf = member.perfil || 'Profissional';
      profileCounts[perf] = (profileCounts[perf] || 0) + 1;
    });

    const profileIndices: Record<string, number> = {};
    const nameMap: Record<string, string> = {};

    const sortedSquad = [...squad].sort((a, b) => a.nome.localeCompare(b.nome));
    sortedSquad.forEach(member => {
      const perf = member.perfil || 'Profissional';
      if (profileCounts[perf] > 1) {
        profileIndices[perf] = (profileIndices[perf] || 0) + 1;
        nameMap[member.nome] = `${perf} ${profileIndices[perf]}`;
      } else {
        nameMap[member.nome] = perf;
      }
    });
    return nameMap;
  }, [squad]);

  const [holidayDateSet, setHolidayDateSet] = useState<Set<string>>(new Set());
  const [dbBacklog, setDbBacklog] = useState<BacklogDbItem[]>([]);
  const [, setIsRefetching] = useState(false);
  const [viewMode] = useState<'Week' | 'Month' | 'Quarter'>('Week');
  const [searchQuery] = useState('');
  const [statusFilter] = useState<string>('all');
  const [resourceFilter] = useState<string>('all');
  const [zoom] = useState<number>(100); // percentage spacing multiplier
  const [selectedTask, setSelectedTask] = useState<TimelineTask | GridTimelineTask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'gantt' | 'backlog' | 'technologies' | 'kanban' | 'burnup'>('gantt');
  const [resourceOrder, setResourceOrder] = useState<string[]>([]);
  const [draggedResource, setDraggedResource] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [ganttViewGroup, setGanttViewGroup] = useState<'resource' | 'requirement'>('resource');
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);
  const [orderedPhases, setOrderedPhases] = useState<string[][]>([]);
  const [kanbanDateEditorTask, setKanbanDateEditorTask] = useState<BacklogDbItem | null>(null);
  const [kanbanEditStartDate, setKanbanEditStartDate] = useState('');
  const [kanbanEditEndDate, setKanbanEditEndDate] = useState('');
  const [kanbanEditResourceId, setKanbanEditResourceId] = useState<number | null>(null);
  const [kanbanEditLinkJira, setKanbanEditLinkJira] = useState('');
  const [kanbanEditLinkWiki, setKanbanEditLinkWiki] = useState('');
  const [kanbanSelectorOpen, setKanbanSelectorOpen] = useState(false);
  const [kanbanSelectedProfileFilters, setKanbanSelectedProfileFilters] = useState<string[]>([]);
  const [isSavingKanbanDates, setIsSavingKanbanDates] = useState(false);
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentActiveTab, setCommentActiveTab] = useState<'Todos' | 'Comentários' | 'Trabalho' | 'Histórico' | 'Atividade'>('Comentários');


  const colWidth = (viewMode === 'Week' ? 56.25 : viewMode === 'Month' ? 33.75 : 16.875) * (zoom / 100);


  const handleDragStart = (e: React.DragEvent, resourceName: string) => {
    setDraggedResource(resourceName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, resourceName: string) => {
    e.preventDefault();
    if (draggedResource && draggedResource !== resourceName && draggedResource !== 'Sem Responsável' && resourceName !== 'Sem Responsável') {
      const currentOrder = resourceOrder.length > 0
        ? [...resourceOrder]
        : squad.map(s => s.nome);

      const dragIndex = currentOrder.indexOf(draggedResource);
      const hoverIndex = currentOrder.indexOf(resourceName);

      if (dragIndex !== -1 && hoverIndex !== -1) {
        currentOrder.splice(dragIndex, 1);
        currentOrder.splice(hoverIndex, 0, draggedResource);
        setResourceOrder(currentOrder);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedResource(null);
    if (viewingProject && resourceOrder.length > 0) {
      const ganttNames = groupedTasksRows
        .map(r => r.resourceName)
        .filter(name => name !== 'Sem Responsável');

      const orderedGanttNames = [...ganttNames].sort((a, b) => {
        const idxA = resourceOrder.indexOf(a);
        const idxB = resourceOrder.indexOf(b);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });

      fetch(`/api/projects/${viewingProject.id}/resource-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceOrder: orderedGanttNames })
      })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            console.error('Failed to persist resource order:', data.error);
          }
        })
        .catch(err => console.error('Failed to persist resource order:', err));
    }
  };

  useEffect(() => {
    if (viewingProject) {
      fetch(`/api/projects/${viewingProject.id}/allocations`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAllocations(data);
          }
        })
        .catch(err => console.warn('Failed to fetch allocations:', err));

      fetch(`/api/projects/${viewingProject.id}/resource-order`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.resourceOrder)) {
            setResourceOrder(data.resourceOrder);
          } else {
            setResourceOrder([]);
          }
        })
        .catch(err => console.warn('Failed to fetch resource order:', err));

      fetch(`/api/projects/${viewingProject.id}/phases`)
        .then(res => res.json())
        .then(phasesData => {
          if (phasesData && phasesData.length > 0) {
            const sorted = [...phasesData].sort((a, b) => a.sequence - b.sequence);
            const grouped: { [key: number]: string[] } = {};
            sorted.forEach(p => {
              const seq = p.sequence;
              if (!grouped[seq]) grouped[seq] = [];
              grouped[seq].push(p.name);
            });
            const ordered = Object.keys(grouped)
              .map(Number)
              .sort((a, b) => a - b)
              .map(seq => grouped[seq]);
            setOrderedPhases(ordered);
          } else {
            setOrderedPhases([]);
          }
        })
        .catch(err => console.warn('Failed to fetch phases:', err));
    }
  }, [viewingProject]);

  const projectPlanningRange = useMemo(() => {
    if (allocations.length === 0) return null;
    const startDates = allocations.map(a => a.initialDate).filter(Boolean).map(d => new Date(d + 'T12:00:00').getTime());
    const endDates = allocations.map(a => a.endDate).filter(Boolean).map(d => new Date(d + 'T12:00:00').getTime());
    const minTime = startDates.length > 0 ? Math.min(...startDates) : null;
    const maxTime = endDates.length > 0 ? Math.max(...endDates) : null;
    return {
      start: minTime ? new Date(minTime) : null,
      end: maxTime ? new Date(maxTime) : null
    };
  }, [allocations]);

  const isFullscreen = useMemo(() => {
    return typeof window !== 'undefined' && window.location.search.includes('fullscreen-gantt=true');
  }, []);



  // Drag and Drop / Resize State
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOriginalStart, setDragOriginalStart] = useState<Date | null>(null);
  const [dragOriginalEnd, setDragOriginalEnd] = useState<Date | null>(null);

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const ganttBodyContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const handleScrollHeader = useCallback(() => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    if (ganttBodyContainerRef.current && timelineContainerRef.current) {
      ganttBodyContainerRef.current.scrollLeft = timelineContainerRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  }, []);

  const handleScrollBody = useCallback(() => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    if (timelineContainerRef.current && ganttBodyContainerRef.current) {
      timelineContainerRef.current.scrollLeft = ganttBodyContainerRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  }, []);

  // Sync database backlog
  const handleRefresh = useCallback(() => {
    if (viewingProject) {
      setIsRefetching(true);
      fetch(`/api/projects/${viewingProject.id}/backlog?t=${Date.now()}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setDbBacklog(data);
          } else {
            setDbBacklog([]);
          }
        })
        .catch(err => {
          console.warn('Failed to refresh database backlog:', err);
          setDbBacklog([]);
        })
        .finally(() => {
          setTimeout(() => setIsRefetching(false), 500);
        });
    }
  }, [viewingProject]);

  const handleKanbanDragStart = (e: React.DragEvent, taskId: string | number) => {
    e.dataTransfer.setData('text/plain', String(taskId));
  };

  const handleKanbanDrop = async (e: React.DragEvent, newPhase: 'To Do' | 'On Going' | 'Completed') => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr || !viewingProject) return;
    const taskId = Number(taskIdStr);

    // Optimistically update local state
    setDbBacklog(prev => prev.map(item => {
      if (item.id === taskId) {
        return { ...item, kanbanPhase: newPhase };
      }
      return item;
    }));

    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/backlog/${taskId}/kanban-phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kanbanPhase: newPhase })
      });
      if (!response.ok) {
        console.error('Failed to update kanban phase');
        handleRefresh();
      }
    } catch (err) {
      console.error('Failed to update kanban phase:', err);
      handleRefresh();
    }
  };

  const fetchComments = useCallback(async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setTaskComments(data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!newCommentText.trim() || !kanbanDateEditorTask) return;

    try {
      const res = await fetch(`/api/tasks/${kanbanDateEditorTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: loggedInMember?.id || null,
          content: newCommentText.trim()
        })
      });
      if (res.ok) {
        setNewCommentText('');
        fetchComments(kanbanDateEditorTask.id);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  }, [newCommentText, kanbanDateEditorTask, loggedInMember, fetchComments]);


  const handleOpenKanbanDateEditor = useCallback((task: BacklogDbItem) => {
    setKanbanDateEditorTask(task);
    setKanbanEditStartDate((task.initialDate || '').split('T')[0]);
    setKanbanEditEndDate((task.endDate || '').split('T')[0]);
    setKanbanEditResourceId(task.resourceId || null);
    setKanbanEditLinkJira(task.linkJira || '');
    setKanbanEditLinkWiki(task.linkWiki || '');
    fetchComments(task.id);
  }, [fetchComments]);

  const handleCloseKanbanDateEditor = useCallback(() => {
    if (isSavingKanbanDates) return;
    setKanbanDateEditorTask(null);
    setKanbanEditStartDate('');
    setKanbanEditEndDate('');
    setKanbanEditResourceId(null);
    setKanbanEditLinkJira('');
    setKanbanEditLinkWiki('');
    setKanbanSelectorOpen(false);
    setKanbanSelectedProfileFilters([]);
    setTaskComments([]);
    setNewCommentText('');
  }, [isSavingKanbanDates]);

  const handleSaveKanbanDates = useCallback(async () => {
    if (!viewingProject || !kanbanDateEditorTask) return;

    if (!kanbanEditStartDate || !kanbanEditEndDate) {
      window.alert('Preencha data de início e data de fim.');
      return;
    }

    if (kanbanEditEndDate < kanbanEditStartDate) {
      window.alert('A data de fim não pode ser menor que a data de início.');
      return;
    }

    setIsSavingKanbanDates(true);
    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/backlog/${kanbanDateEditorTask.id}/dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialDate: kanbanEditStartDate,
          endDate: kanbanEditEndDate,
          resourceId: kanbanEditResourceId,
          linkJira: kanbanEditLinkJira,
          linkWiki: kanbanEditLinkWiki
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setDbBacklog(prev => prev.map(item => item.id === kanbanDateEditorTask.id
        ? { 
            ...item, 
            initialDate: kanbanEditStartDate, 
            endDate: kanbanEditEndDate, 
            resourceId: kanbanEditResourceId,
            linkJira: kanbanEditLinkJira,
            linkWiki: kanbanEditLinkWiki
          }
        : item
      ));

      handleCloseKanbanDateEditor();
    } catch (err) {
      console.error('Failed to save kanban task dates:', err);
      window.alert('Não foi possível salvar as datas da tarefa.');
      handleRefresh();
    } finally {
      setIsSavingKanbanDates(false);
    }
  }, [viewingProject, kanbanDateEditorTask, kanbanEditStartDate, kanbanEditEndDate, kanbanEditResourceId, kanbanEditLinkJira, kanbanEditLinkWiki, handleCloseKanbanDateEditor, handleRefresh]);

  const profileOptions = useMemo(() => {
    const profiles = new Set<string>();
    squad.forEach(m => {
      if (m.perfil) profiles.add(m.perfil);
    });
    return Array.from(profiles).sort();
  }, [squad]);

  const filteredSquadMembers = useMemo(() => {
    if (kanbanSelectedProfileFilters.length === 0) return squad;
    return squad.filter(member => member.perfil && kanbanSelectedProfileFilters.includes(member.perfil));
  }, [squad, kanbanSelectedProfileFilters]);

  const renderResourceCard = (
    member: SquadMember,
    _compact = false,
    onRemove?: () => void,
    _forceSquare = false
  ) => {
    const avatarObj = member.avatar ? getAvatarById(member.avatar) : null;
    const ringSize = 77;
    const photoSize = 61;

    return (
      <div
        className="flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-[1.05] p-2 rounded-2xl hover:bg-[#64183f]/5 w-full relative text-slate-800"
      >
        {onRemove && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-300 z-20 shadow-sm"
            title="Remover responsável"
          >
            <X size={10} weight="bold" />
          </button>
        )}

        {/* Avatar with arc ring */}
        <div className="relative flex-shrink-0 animate-pulse-slow" style={{ width: ringSize, height: ringSize }}>
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
                {getGanttInitials(member.nome) || <PhosphorUsers size={20} />}
              </div>
            )}
          </div>
          <ArcRing size={ringSize} />
        </div>

        {/* Name + Profile */}
        <div className="mt-2 text-center px-1" style={{ maxWidth: ringSize + 30 }}>
          <div className="text-[10px] font-black text-slate-800 leading-tight line-clamp-2 min-h-[24px]">
            {member.nome}
          </div>
          <div className="text-[8px] font-bold text-[#64183f] uppercase tracking-wider mt-0.5 truncate">
            {member.perfil}
          </div>
        </div>
      </div>
    );
  };

  const renderAvatarOnly = (
    member: { nome: string; perfil: string; avatar?: string | null; avatarImage?: string | null } | null,
    targetLabel: string,
    onClick?: () => void,
    onRemove?: () => void
  ) => {
    const hasMember = !!member && !!member.nome;
    const avatarObj = hasMember && member.avatar ? getAvatarById(member.avatar) : null;
    const ringSize = 77;
    const photoSize = 61;
    const depth = targetLabel === 'Substituto' ? 1 : 0;

    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          width: '120px'
        }}
      >
        {hasMember ? (
          <Box 
            onClick={onClick}
            sx={{ 
              position: 'relative', 
              cursor: onClick ? 'pointer' : 'default',
              mb: 1.5,
              width: ringSize,
              height: ringSize,
              flexShrink: 0,
              '&:hover': onClick ? {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s ease'
              } : {}
            }}
          >
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
                  {getGanttInitials(member.nome) || <PhosphorUsers size={20} />}
                </div>
              )}
            </div>
            
            {/* Decorative arc ring overlay */}
            <ArcRing size={ringSize} depth={depth} />

            {onRemove && (
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove();
                }}
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 20,
                  height: 20,
                  background: '#ef4444',
                  color: 'white',
                  border: '2px solid white',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  zIndex: 20,
                  '&:hover': {
                    background: '#dc2626'
                  }
                }}
                title="Remover"
              >
                <X size={10} weight="bold" />
              </IconButton>
            )}
          </Box>
        ) : (
          <Box
            onClick={onClick}
            sx={{
              width: ringSize,
              height: ringSize,
              borderRadius: '50%',
              border: '2px dashed #C8AFC0',
              background: '#FDF9F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: onClick ? 'pointer' : 'default',
              mb: 1.5,
              color: '#64183f',
              transition: 'all 0.2s ease',
              '&:hover': onClick ? {
                borderColor: '#64183f',
                background: '#FAF4EF',
                transform: 'scale(1.05)',
                boxShadow: '0 6px 14px rgba(100, 24, 63, 0.1)'
              } : {}
            }}
          >
            <Plus size={20} weight="bold" />
          </Box>
        )}

        <Typography
          sx={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: hasMember ? '#1f2937' : '#9ca3af',
            lineHeight: 1.25,
            mb: 0.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            height: '2rem',
            width: '100%'
          }}
        >
          {hasMember ? member.nome : 'Selecionar'}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.62rem',
            fontWeight: 700,
            color: '#64183f',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
            opacity: hasMember ? 1 : 0.5
          }}
        >
          {hasMember ? member.perfil : targetLabel}
        </Typography>
      </Box>
    );
  };



  const handleExportHtml = () => {
    if (!viewingProject) return;
    const activeGanttSquad = squad.filter(member =>
      mappedTasks.some(t => t.resources.some(r => String(r.id) === String(member.id)))
    );

    const htmlContent = generateInteractiveHtml({
      projectName: viewingProject.name || 'Planejamento do Projeto',
      projectCode: viewingProject.projectId || 'N/A',
      manager: 'Gestor do Projeto',
      periodStart: projectPlanningRange?.start ? projectPlanningRange.start.toLocaleDateString('pt-BR') : (metrics.minDate ? metrics.minDate.toLocaleDateString('pt-BR') : 'N/A'),
      periodEnd: projectPlanningRange?.end ? projectPlanningRange.end.toLocaleDateString('pt-BR') : (metrics.maxDate ? metrics.maxDate.toLocaleDateString('pt-BR') : 'N/A'),
      metrics: {
        totalRequirements: metrics.totalRequirements,
        totalTasks: metrics.totalTasks,
        totalPoints: metrics.totalPoints,
        pointsByTech: metrics.pointsByTech,
      },
      squad: activeGanttSquad.map(s => ({
        id: String(s.id),
        nome: squadMaskedNames[s.nome] || s.nome,
        perfil: s.perfil,
        avatar: s.avatar || null,
      })),
      resourceOrder: groupedTasksRows.map(row => squadMaskedNames[row.resourceName] || row.resourceName),
      holidayDates: Array.from(holidayDateSet),
      plannedTasks: mappedTasks.map(t => ({
        ...t,
        resources: t.resources.map(r => ({
          ...r,
          nome: squadMaskedNames[r.nome] || r.nome
        }))
      })),
      unplannedTasks: unplannedTasks.map(t => ({
        ...t,
        resources: t.resources.map(r => ({
          ...r,
          nome: squadMaskedNames[r.nome] || r.nome
        }))
      }))
    });

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planning_${(viewingProject.name || 'projeto').toLowerCase().replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (viewingProject) {
      handleRefresh();
    }
  }, [viewingProject]);

  useEffect(() => {
    let active = true;

    // Holidays are sourced from MANAGER_OSS_HOLIDAY through /api/holidays.
    fetch('/api/holidays')
      .then((res) => res.json())
      .then((data) => {
        if (!active || !Array.isArray(data)) return;
        const holidaySet = new Set(
          data
            .map((item: { date?: string }) => String(item?.date || '').split('T')[0])
            .filter((dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr))
        );
        setHolidayDateSet(holidaySet);
      })
      .catch((err) => {
        console.error('Erro ao buscar feriados para o Gantt:', err);
        if (active) setHolidayDateSet(new Set());
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleRefreshEvent = () => {
      handleRefresh();
    };
    window.addEventListener('refresh-planning-gantt', handleRefreshEvent);
    return () => {
      window.removeEventListener('refresh-planning-gantt', handleRefreshEvent);
    };
  }, [handleRefresh]);

  // Map database and local backlog to unified task structure
  const mappedTasks = useMemo<TimelineTask[]>(() => {
    const items = viewingProject && dbBacklog.length > 0 ? dbBacklog : tasks;
    return items
      .filter((item: any) => {
        const start = 'taskName' in item ? item.initialDate : item.dtInicio;
        const end = 'taskName' in item ? item.endDate : item.dtFim;

        if (!start || !end) return false;

        const startStr = String(start).trim().toLowerCase();
        const endStr = String(end).trim().toLowerCase();

        const hasDates = startStr !== '' && endStr !== '' &&
          startStr !== 'null' && endStr !== 'null' &&
          startStr !== 'undefined' && endStr !== 'undefined';
        if (!hasDates) return false;

        const tech = ('taskTechnology' in item) ? item.taskTechnology : (item.sistema || '');
        const techStr = String(tech || '').trim();
        const projIdStr = String(viewingProject?.projectId || '').trim();
        if (!techStr || techStr.toLowerCase() === projIdStr.toLowerCase()) return false;

        return true;
      })
      .map((item: any, idx) => {
        let name = '';
        let desc = '';
        let startStr = '';
        let endStr = '';
        let progress = 0;
        let phase = '';
        let status: 'doing' | 'done' | 'backlog' = 'backlog';
        let resourcesList: SquadMember[] = [];

        if ('taskName' in item) {
          name = item.taskName;
          desc = item.taskDescription || item.taskName;
          startStr = item.initialDate.split('T')[0];
          endStr = item.endDate.split('T')[0];
          phase = item.taskPhase || 'Build';
          status = 'doing'; // default for db items
          if (item.resourceId) {
            const member = squad.find(s => String(s.id) === String(item.resourceId));
            if (member) resourcesList.push(member);
          }
        } else {
          name = item.idBacklog || 'Tarefa';
          desc = item.task || item.macroRequisito || 'Tarefa';
          startStr = item.dtInicio.split('T')[0];
          endStr = item.dtFim.split('T')[0];
          phase = item.idBacklog || 'Build';
          status = item.status || 'backlog';
          progress = item.status === 'done' ? 100 : item.status === 'doing' ? 50 : 0;
          if (item.nome) {
            const member = squad.find(s => s.nome.trim().toLowerCase() === item.nome.trim().toLowerCase());
            if (member) resourcesList.push(member);
          }
        }

        return {
          id: item.id ? String(item.id) : `task_${idx}`,
          name,
          description: desc,
          start: new Date(startStr + 'T12:00:00'),
          end: new Date(endStr + 'T12:00:00'),
          progress,
          phase,
          status,
          resources: resourcesList,
          originalItem: item,
        };
      });
  }, [dbBacklog, tasks, viewingProject, squad]);

  // All tasks mapped, keeping null dates for unassigned / unplanned ones
  const allBacklogTasksMapped = useMemo<GridTimelineTask[]>(() => {
    const items = viewingProject && dbBacklog.length > 0 ? dbBacklog : tasks;
    return items
      .filter((item: any) => {
        const tech = ('taskTechnology' in item) ? item.taskTechnology : (item.sistema || '');
        const techStr = String(tech || '').trim();
        const projIdStr = String(viewingProject?.projectId || '').trim();
        if (!techStr || techStr.toLowerCase() === projIdStr.toLowerCase()) return false;
        return true;
      })
      .map((item: any, idx) => {
        let name = '';
        let desc = '';
        let startStr = '';
        let endStr = '';
        let progress = 0;
        let phase = '';
        let status: 'doing' | 'done' | 'backlog' = 'backlog';
        let resourcesList: SquadMember[] = [];

        if ('taskName' in item) {
          name = item.taskName;
          desc = item.taskDescription || item.taskName;
          startStr = item.initialDate ? String(item.initialDate).split('T')[0] : '';
          endStr = item.endDate ? String(item.endDate).split('T')[0] : '';
          phase = item.taskPhase || 'Build';
          status = 'doing';
          if (item.resourceId) {
            const member = squad.find(s => String(s.id) === String(item.resourceId));
            if (member) resourcesList.push(member);
          }
        } else {
          name = item.idBacklog || 'Tarefa';
          desc = item.task || item.macroRequisito || 'Tarefa';
          startStr = item.dtInicio ? String(item.dtInicio).split('T')[0] : '';
          endStr = item.dtFim ? String(item.dtFim).split('T')[0] : '';
          phase = item.idBacklog || 'Build';
          status = item.status || 'backlog';
          progress = item.status === 'done' ? 100 : item.status === 'doing' ? 50 : 0;
          if (item.nome) {
            const member = squad.find(s => s.nome.trim().toLowerCase() === item.nome.trim().toLowerCase());
            if (member) resourcesList.push(member);
          }
        }

        const hasStart = startStr && startStr !== 'null' && startStr !== 'undefined' && startStr.trim() !== '';
        const hasEnd = endStr && endStr !== 'null' && endStr !== 'undefined' && endStr.trim() !== '';

        return {
          id: item.id ? String(item.id) : `task_${idx}`,
          name,
          description: desc,
          start: hasStart ? new Date(startStr + 'T12:00:00') : null,
          end: hasEnd ? new Date(endStr + 'T12:00:00') : null,
          progress,
          phase,
          status,
          resources: resourcesList,
          originalItem: item,
        };
      });
  }, [dbBacklog, tasks, viewingProject, squad]);

  const { plannedTasks, unplannedTasks } = useMemo(() => {
    const planned: GridTimelineTask[] = [];
    const unplanned: GridTimelineTask[] = [];

    allBacklogTasksMapped.forEach(task => {
      const isAssigned = task.resources.length > 0;
      const hasDates = task.start !== null && task.end !== null;

      if (isAssigned && hasDates) {
        if (projectPlanningRange) {
          const taskStart = task.start!.getTime();
          const taskEnd = task.end!.getTime();
          const projStart = projectPlanningRange.start ? projectPlanningRange.start.getTime() : null;
          const projEnd = projectPlanningRange.end ? projectPlanningRange.end.getTime() : null;

          const isWithinStart = projStart === null || taskStart >= projStart;
          const isWithinEnd = projEnd === null || taskEnd <= projEnd;

          if (isWithinStart && isWithinEnd) {
            planned.push(task);
          } else {
            unplanned.push(task);
          }
        } else {
          planned.push(task);
        }
      } else {
        unplanned.push(task);
      }
    });

    // Sort planned tasks by date then sequence/id
    planned.sort((a, b) => {
      const timeA = a.start ? a.start.getTime() : 0;
      const timeB = b.start ? b.start.getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      const seqA = a.originalItem?.taskSequence || a.originalItem?.sequencia || '';
      const seqB = b.originalItem?.taskSequence || b.originalItem?.sequencia || '';
      return String(seqA).localeCompare(String(seqB), undefined, { numeric: true, sensitivity: 'base' });
    });

    // Sort unplanned tasks by date then sequence/id
    unplanned.sort((a, b) => {
      const timeA = a.start ? a.start.getTime() : 0;
      const timeB = b.start ? b.start.getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      const seqA = a.originalItem?.taskSequence || a.originalItem?.sequencia || '';
      const seqB = b.originalItem?.taskSequence || b.originalItem?.sequencia || '';
      return String(seqA).localeCompare(String(seqB), undefined, { numeric: true, sensitivity: 'base' });
    });

    return { plannedTasks: planned, unplannedTasks: unplanned };
  }, [allBacklogTasksMapped, projectPlanningRange]);

  const metrics = useMemo(() => {
    const tasksList = mappedTasks;

    // Unique requirements (macroRequisito)
    const uniqueReqs = new Set(
      tasksList.map(t => {
        const orig = t.originalItem || {};
        return orig.macroRequisito || t.name;
      }).filter(Boolean)
    );

    // Start and End dates
    const startDates = tasksList.map(t => t.start.getTime()).filter(Boolean);
    const endDates = tasksList.map(t => t.end.getTime()).filter(Boolean);
    const minDate = startDates.length > 0 ? new Date(Math.min(...startDates)) : null;
    const maxDate = endDates.length > 0 ? new Date(Math.max(...endDates)) : null;

    // Points per technology
    const pointsByTech: { [tech: string]: number } = {};
    let totalPoints = 0;

    tasksList.forEach(t => {
      const orig = t.originalItem || {};
      const tech = orig.taskTechnology || orig.sistema || 'Outros';
      const pts = orig.taskPoints || orig.pontos || 0;
      pointsByTech[tech] = (pointsByTech[tech] || 0) + pts;
      totalPoints += pts;
    });

    return {
      totalRequirements: uniqueReqs.size,
      totalTasks: tasksList.length,
      minDate,
      maxDate,
      pointsByTech,
      totalPoints
    };
  }, [mappedTasks]);

  // Filter squad members to only those who have tasks in the database backlog for the current project
  const activeSquad = useMemo(() => {
    if (!viewingProject || dbBacklog.length === 0) return [];
    const assignedResourceIds = new Set(
      dbBacklog
        .map(item => item.resourceId)
        .filter(id => id !== null && id !== undefined)
        .map(id => String(id))
    );
    return squad.filter(member => assignedResourceIds.has(String(member.id)));
  }, [squad, dbBacklog, viewingProject]);

  // Filters and Grouping application (Grouped by professional name)
  const groupedTasksRows = useMemo<GroupedRow[]>(() => {
    const filtered = mappedTasks.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesResource = resourceFilter === 'all' || t.resources.some(r => r.nome === resourceFilter);
      return matchesSearch && matchesStatus && matchesResource;
    });

    // Grouping by professional/resource name
    const groups: Record<string, TimelineTask[]> = {};
    filtered.forEach(task => {
      if (task.resources && task.resources.length > 0) {
        task.resources.forEach(res => {
          const groupKey = res.nome;
          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }
          groups[groupKey].push(task);
        });
      } else {
        const groupKey = 'Sem Responsável';
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(task);
      }
    });

    // Convert groups to GroupedRow array
    const rows: GroupedRow[] = Object.entries(groups).map(([resourceName, groupTasks]) => {
      const member = squad.find(s => s.nome === resourceName);

      // Sort tasks internally by start date
      groupTasks.sort((a, b) => a.start.getTime() - b.start.getTime());

      return {
        resourceName,
        resourceRole: member?.perfil || (resourceName === 'Sem Responsável' ? '' : 'Recurso'),
        resourceAvatar: member?.avatar || null,
        resourceAvatarImage: member?.avatarImage || null,
        tasks: groupTasks,
      };
    });

    // Sort rows: put 'Sem Responsável' at the bottom, others by custom resourceOrder or earliest task start date
    return rows.sort((a, b) => {
      if (a.resourceName === 'Sem Responsável') return 1;
      if (b.resourceName === 'Sem Responsável') return -1;

      const indexA = resourceOrder.indexOf(a.resourceName);
      const indexB = resourceOrder.indexOf(b.resourceName);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      const startA = a.tasks[0]?.start.getTime() || 0;
      const startB = b.tasks[0]?.start.getTime() || 0;
      return startA - startB;
    });
  }, [mappedTasks, searchQuery, statusFilter, resourceFilter, squad, resourceOrder]);

  const groupedRequirementsRows = useMemo(() => {
    const filtered = mappedTasks.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesResource = resourceFilter === 'all' || t.resources.some(r => r.nome === resourceFilter);
      return matchesSearch && matchesStatus && matchesResource;
    });

    const groups: Record<string, TimelineTask[]> = {};
    filtered.forEach(task => {
      const reqName = task.originalItem?.macroRequisito || task.name || 'Sem Requisito';
      if (!groups[reqName]) {
        groups[reqName] = [];
      }
      groups[reqName].push(task);
    });

    return Object.entries(groups).map(([requirementName, reqTasks]) => {
      const startTimes = reqTasks.map(t => t.start.getTime());
      const endTimes = reqTasks.map(t => t.end.getTime());

      const start = new Date(Math.min(...startTimes));
      const end = new Date(Math.max(...endTimes));

      const resourceMap = new Map<string, SquadMember>();
      reqTasks.forEach(t => {
        t.resources.forEach(r => {
          resourceMap.set(String(r.id), r);
        });
      });
      const resources = Array.from(resourceMap.values());

      return {
        requirementName,
        start,
        end,
        resources,
        tasks: reqTasks
      };
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [mappedTasks, searchQuery, statusFilter, resourceFilter]);

  // Flattened list of filtered tasks for stats and range calculations
  const filteredTasks = useMemo<TimelineTask[]>(() => {
    return groupedTasksRows.flatMap(g => g.tasks);
  }, [groupedTasksRows]);

  // Timeline Scale Dates Calculation
  const timelineRange = useMemo(() => {
    if (filteredTasks.length === 0) {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);
      return { start: today, end: nextMonth, days: 30 };
    }
    const starts = filteredTasks.map(t => t.start.getTime());
    const ends = filteredTasks.map(t => t.end.getTime());
    const minTime = Math.min(...starts);
    const maxTime = Math.max(...ends);

    // Padding timeline by 3 days start/end
    const startDate = new Date(minTime - 3 * 24 * 60 * 60 * 1000);
    const endDate = new Date(maxTime + 3 * 24 * 60 * 60 * 1000);
    const daysCount = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    return { start: startDate, end: endDate, days: daysCount };
  }, [filteredTasks]);



  // Helper: Get X Coordinate from Date
  const getXFromDate = useCallback((date: Date) => {
    const timeDiff = date.getTime() - timelineRange.start.getTime();
    const dayDiff = timeDiff / (24 * 60 * 60 * 1000);
    return dayDiff * colWidth;
  }, [timelineRange, colWidth]);

  // Drag and Drop handlers
  const handleMouseDown = (taskId: string, type: 'move' | 'resize-start' | 'resize-end', e: React.MouseEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    const task = filteredTasks.find(t => t.id === taskId);
    if (!task) return;

    setDraggingTask(taskId);
    setDragType(type);
    setDragStartX(e.clientX);
    setDragOriginalStart(new Date(task.start));
    setDragOriginalEnd(new Date(task.end));
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingTask || !dragType || !dragOriginalStart || !dragOriginalEnd) return;

    const dx = e.clientX - dragStartX;
    const daysShift = Math.round(dx / colWidth);

    if (daysShift === 0) return;

    const updatedTasks = filteredTasks.map(t => {
      if (t.id === draggingTask) {
        let newStart = new Date(t.start);
        let newEnd = new Date(t.end);

        if (dragType === 'move') {
          newStart = new Date(dragOriginalStart.getTime() + daysShift * 24 * 60 * 60 * 1000);
          newEnd = new Date(dragOriginalEnd.getTime() + daysShift * 24 * 60 * 60 * 1000);
        } else if (dragType === 'resize-start') {
          newStart = new Date(dragOriginalStart.getTime() + daysShift * 24 * 60 * 60 * 1000);
          if (newStart >= t.end) {
            newStart = new Date(t.end.getTime() - 24 * 60 * 60 * 1000);
          }
        } else if (dragType === 'resize-end') {
          newEnd = new Date(dragOriginalEnd.getTime() + daysShift * 24 * 60 * 60 * 1000);
          if (newEnd <= t.start) {
            newEnd = new Date(t.start.getTime() + 24 * 60 * 60 * 1000);
          }
        }

        return { ...t, start: newStart, end: newEnd };
      }
      return t;
    });

    // Save/Update locally in store
    const targetTask = updatedTasks.find(t => t.id === draggingTask);
    if (targetTask) {
      const original = targetTask.originalItem;
      const startStr = targetTask.start.toISOString().split('T')[0];
      const endStr = targetTask.end.toISOString().split('T')[0];

      if ('taskName' in original) {
        // DB task update API
        fetch(`/api/backlog/${original.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...original,
            initialDate: startStr,
            endDate: endStr,
          }),
        }).catch(err => console.error('Failed to sync drag & drop with backend:', err));
      } else {
        // Store task
        updateTask({
          ...original,
          dtInicio: startStr,
          dtFim: endStr,
        });
      }
    }
  }, [draggingTask, dragType, dragStartX, dragOriginalStart, dragOriginalEnd, colWidth, filteredTasks, updateTask]);

  const handleMouseUp = useCallback(() => {
    setDraggingTask(null);
    setDragType(null);
    setDragOriginalStart(null);
    setDragOriginalEnd(null);
  }, []);

  useEffect(() => {
    if (draggingTask) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTask, handleMouseMove, handleMouseUp]);

  // Render Days Columns scale
  const daysScale = useMemo(() => {
    const scale = [];
    const currentDate = new Date(timelineRange.start);
    for (let i = 0; i < timelineRange.days; i++) {
      const dateCopy = new Date(currentDate);
      scale.push({
        date: dateCopy,
        label: currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        dayName: currentDate.toLocaleDateString('pt-BR', { weekday: 'short' }),
        left: i * colWidth,
        isHoliday: holidayDateSet.has(toYmd(dateCopy)),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return scale;
  }, [timelineRange, colWidth, holidayDateSet]);

  const todayOffset = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    if (today < timelineRange.start || today > timelineRange.end) return null;
    return getXFromDate(today);
  }, [timelineRange, getXFromDate]);

  return (
    <Box sx={{
      p: isFullscreen ? 2 : 3,
      display: 'flex',
      flexDirection: 'column',
      gap: isFullscreen ? 2 : 3,
      bgcolor: isFullscreen ? 'rgba(100, 24, 63, 0.05)' : '#f8fafc',
      minHeight: '100vh',
      height: isFullscreen ? '100vh' : 'auto',
      width: isFullscreen ? '100vw' : 'auto',
      boxSizing: 'border-box',
      overflow: isFullscreen ? 'auto' : 'visible',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 15px !important;
          }
          .MuiPaper-root {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            overflow: visible !important;
            max-height: none !important;
          }
          div, table, tbody, tr, td {
            overflow: visible !important;
            max-height: none !important;
          }
          /* Hide scrollbars during print */
          ::-webkit-scrollbar {
            display: none !important;
          }
          /* Specific print classes to render entire Gantt chart length */
          .print-expanded {
            overflow: visible !important;
            max-height: none !important;
            max-width: none !important;
            display: flex !important;
          }
          .print-horizontal-scroll {
            overflow-x: visible !important;
            overflow-y: visible !important;
            max-width: none !important;
            width: max-content !important;
            position: relative !important;
          }
        }
      `}</style>

      {/* Cabeçalho da Visão de Tela Cheia */}
      {isFullscreen && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1.5,
            px: 3,
            borderRadius: '16px',
            background: 'linear-gradient(90deg, #64183f 0%, #1a1f44 100%)',
            boxShadow: '0 8px 32px 0 rgba(100, 24, 63, 0.15)',
            mb: 1,
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* Logo Minsait */}
            <Box sx={{ display: 'flex', alignItems: 'center', pr: 3, borderRight: '1px solid rgba(255, 255, 255, 0.2)', height: '28px' }}>
              <img
                src="/minsait_logo.png"
                alt="Minsait Logo"
                style={{ height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
            </Box>

            {/* Dados do Projeto */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
              {viewingProject?.projectId && (
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  CÓDIGO: {viewingProject.projectId}
                </Typography>
              )}
              <Typography variant="h5" sx={{ fontWeight: '800', color: 'white', fontFamily: "'Outfit', sans-serif", letterSpacing: -0.5 }}>
                {viewingProject?.name || 'Planejamento do Projeto'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 0.2 }}>
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Gestor: <span style={{ color: 'white', fontWeight: '800' }}>{viewingProject ? (owners?.find(o => o.id === viewingProject.ownerId)?.name || 'N/A') : 'N/A'}</span>
                </Typography>
                <Box sx={{ width: '1px', height: '12px', bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Período: <span style={{ color: 'white', fontWeight: '800' }}>
                    {projectPlanningRange?.start ? projectPlanningRange.start.toLocaleDateString('pt-BR') : (metrics.minDate ? metrics.minDate.toLocaleDateString('pt-BR') : 'N/A')} a {projectPlanningRange?.end ? projectPlanningRange.end.toLocaleDateString('pt-BR') : (metrics.maxDate ? metrics.maxDate.toLocaleDateString('pt-BR') : 'N/A')}
                  </span>
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box className="no-print" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all shadow-md uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-sm"
            >
              <span>Fechar Tela Cheia</span>
            </button>
            <button
              onClick={handleExportHtml}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 rounded-xl text-xs font-bold transition-all shadow-md uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Exportar Visão Interativa (.html)</span>
            </button>
          </Box>
        </Box>
      )}

      {/* Dashboard de Métricas Complementares (Visão Expandida) */}
      {isFullscreen && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Row 1: Principais Métricas */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
            {/* Card 1: Requisitos */}
            <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #64183f', boxShadow: 'none', background: 'linear-gradient(90deg, rgba(100, 24, 63, 0.2) 0%, rgba(26, 31, 68, 0.2) 100%)', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0.5 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64183f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </Box>
                <Box sx={{ width: '1px', height: '32px', bgcolor: '#64183f' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
                    Requisitos
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: '800', color: 'text.primary', mt: -0.2, lineHeight: 1.1 }}>
                    {metrics.totalRequirements}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Card 2: Tarefas */}
            <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #64183f', boxShadow: 'none', background: 'linear-gradient(90deg, rgba(100, 24, 63, 0.2) 0%, rgba(26, 31, 68, 0.2) 100%)', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0.5 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64183f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                    <line x1="9" y1="17" x2="15" y2="17" />
                  </svg>
                </Box>
                <Box sx={{ width: '1px', height: '32px', bgcolor: '#64183f' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
                    Tarefas
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: '800', color: 'text.primary', mt: -0.2, lineHeight: 1.1 }}>
                    {metrics.totalTasks}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Card 3: Pontos */}
            <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #64183f', boxShadow: 'none', background: 'linear-gradient(90deg, rgba(100, 24, 63, 0.2) 0%, rgba(26, 31, 68, 0.2) 100%)', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0.5 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64183f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
                  </svg>
                </Box>
                <Box sx={{ width: '1px', height: '32px', bgcolor: '#64183f' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
                    Pontos Totais
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: '800', color: 'text.primary', mt: -0.2, lineHeight: 1.1 }}>
                    {metrics.totalPoints}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* 1. Header & Controls */}
      {!isFullscreen && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' } }}>
                {activeSquad.map((member, i) => {
                  const avatarObj = member.avatar ? getAvatarById(member.avatar) : null;
                  return (
                    <Tooltip key={i} title={member.nome}>
                      <Avatar
                        alt={member.nome}
                        sx={{
                          background: member.avatarImage
                            ? 'transparent'
                            : avatarObj 
                              ? avatarObj.gradient 
                              : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
                        }}
                      >
                        {member.avatarImage ? (
                          <img 
                            src={member.avatarImage} 
                            alt={member.nome} 
                            className="w-full h-full object-cover object-top rounded-full" 
                          />
                        ) : avatarObj ? (
                          avatarObj.icon
                        ) : (
                          getGanttInitials(member.nome)
                        )}
                      </Avatar>
                    </Tooltip>
                  );
                })}
              </AvatarGroup>
            </Box>
          </Box>
        </Box>
      )}





      {/* 3. Main Timeline & Gantt Board */}
      {isFullscreen && (
        <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 4, position: 'relative', mb: '-1px', pr: 2 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Box
              onClick={() => setActiveTab('gantt')}
              sx={{
                px: 3,
                py: 1,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: activeTab === 'gantt' ? '#ffffff' : '#f1f5f9',
                color: activeTab === 'gantt' ? '#64183f' : '#64748b',
                border: '1px solid #cbd5e1',
                borderBottom: activeTab === 'gantt' ? '1px solid #ffffff' : '1px solid #cbd5e1',
                borderRadius: '8px 8px 0 0',
                zIndex: activeTab === 'gantt' ? 5 : 2,
                position: 'relative',
                '&:hover': {
                  backgroundColor: activeTab === 'gantt' ? '#ffffff' : '#e2e8f0',
                }
              }}
            >
              <CalendarMonth sx={{ fontSize: '1rem', mr: 1, color: activeTab === 'gantt' ? '#64183f' : '#94a3b8' }} />
              Planning
            </Box>
            <Box
              onClick={() => setActiveTab('kanban')}
              sx={{
                px: 3,
                py: 1,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: activeTab === 'kanban' ? '#ffffff' : '#f1f5f9',
                color: activeTab === 'kanban' ? '#64183f' : '#64748b',
                border: '1px solid #cbd5e1',
                borderBottom: activeTab === 'kanban' ? '1px solid #ffffff' : '1px solid #cbd5e1',
                borderRadius: '8px 8px 0 0',
                zIndex: activeTab === 'kanban' ? 5 : 2,
                position: 'relative',
                '&:hover': {
                  backgroundColor: activeTab === 'kanban' ? '#ffffff' : '#e2e8f0',
                }
              }}
            >
              <ViewWeek sx={{ fontSize: '1rem', mr: 1, color: activeTab === 'kanban' ? '#64183f' : '#94a3b8' }} />
              Kanban
            </Box>
            <Box
              onClick={() => setActiveTab('burnup')}
              sx={{
                px: 3,
                py: 1,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: activeTab === 'burnup' ? '#ffffff' : '#f1f5f9',
                color: activeTab === 'burnup' ? '#64183f' : '#64748b',
                border: '1px solid #cbd5e1',
                borderBottom: activeTab === 'burnup' ? '1px solid #ffffff' : '1px solid #cbd5e1',
                borderRadius: '8px 8px 0 0',
                zIndex: activeTab === 'burnup' ? 5 : 2,
                position: 'relative',
                '&:hover': {
                  backgroundColor: activeTab === 'burnup' ? '#ffffff' : '#e2e8f0',
                }
              }}
            >
              <ShowChart sx={{ fontSize: '1rem', mr: 1, color: activeTab === 'burnup' ? '#64183f' : '#94a3b8' }} />
              Burnup
            </Box>
            <Box
              onClick={() => setActiveTab('backlog')}
              sx={{
                px: 3,
                py: 1,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: activeTab === 'backlog' ? '#ffffff' : '#f1f5f9',
                color: activeTab === 'backlog' ? '#64183f' : '#64748b',
                border: '1px solid #cbd5e1',
                borderBottom: activeTab === 'backlog' ? '1px solid #ffffff' : '1px solid #cbd5e1',
                borderRadius: '8px 8px 0 0',
                zIndex: activeTab === 'backlog' ? 5 : 2,
                position: 'relative',
                '&:hover': {
                  backgroundColor: activeTab === 'backlog' ? '#ffffff' : '#e2e8f0',
                }
              }}
            >
              <ListAlt sx={{ fontSize: '1rem', mr: 1, color: activeTab === 'backlog' ? '#64183f' : '#94a3b8' }} />
              Backlog
            </Box>
            <Box
              onClick={() => setActiveTab('technologies')}
              sx={{
                px: 3,
                py: 1,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: activeTab === 'technologies' ? '#ffffff' : '#f1f5f9',
                color: activeTab === 'technologies' ? '#64183f' : '#64748b',
                border: '1px solid #cbd5e1',
                borderBottom: activeTab === 'technologies' ? '1px solid #ffffff' : '1px solid #cbd5e1',
                borderRadius: '8px 8px 0 0',
                zIndex: activeTab === 'technologies' ? 5 : 2,
                position: 'relative',
                '&:hover': {
                  backgroundColor: activeTab === 'technologies' ? '#ffffff' : '#e2e8f0',
                }
              }}
            >
              <Code sx={{ fontSize: '1rem', mr: 1, color: activeTab === 'technologies' ? '#64183f' : '#94a3b8' }} />
              Tecnologias
            </Box>
          </Box>

        </Box>
      )}

      {(!isFullscreen || activeTab === 'gantt') && (
        <Paper sx={{ border: '1px solid #cbd5e1', borderLeft: '4px solid #64183f', borderRadius: isFullscreen ? '0 16px 16px 16px' : '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', boxShadow: 'none', zIndex: 1 }}>

          {/* Timeline Header Row (Dates) */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #e2e8f0', bgcolor: 'white', position: 'sticky', top: 0, zIndex: 3 }}>
            <Box sx={{ width: 200, minWidth: 200, borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', px: 1, bgcolor: 'rgba(100, 24, 63, 0.05)' }}>
              <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', p: 0.4, borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}>
                <Box
                  onClick={() => setGanttViewGroup('resource')}
                  sx={{
                    flex: 1,
                    py: 0.5,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    bgcolor: ganttViewGroup === 'resource' ? '#64183f' : 'transparent',
                    color: ganttViewGroup === 'resource' ? 'white' : '#64748b',
                    boxShadow: ganttViewGroup === 'resource' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  Profissional
                </Box>
                <Box
                  onClick={() => setGanttViewGroup('requirement')}
                  sx={{
                    flex: 1,
                    py: 0.5,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    bgcolor: ganttViewGroup === 'requirement' ? '#64183f' : 'transparent',
                    color: ganttViewGroup === 'requirement' ? 'white' : '#64748b',
                    boxShadow: ganttViewGroup === 'requirement' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  Requisito
                </Box>
              </Box>
            </Box>

            <Box
              ref={timelineContainerRef}
              onScroll={handleScrollHeader}
              className="print-horizontal-scroll"
              sx={{ flex: 1, overflowX: 'auto', position: 'relative', height: 60, display: 'flex', alignItems: 'center', customScrollbar: { display: 'none' } }}
            >
              {daysScale.map((col, idx) => {
                const isWeekend = col.date.getDay() === 0 || col.date.getDay() === 6;
                const isHoliday = !!col.isHoliday;
                const isNonWorkingDay = isWeekend || isHoliday;
                return (
                  <Box
                    key={idx}
                    sx={{
                      position: 'absolute',
                      left: col.left,
                      width: colWidth,
                      textAlign: 'center',
                      borderRight: '1px solid #f1f5f9',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      bgcolor: isNonWorkingDay ? '#f87171' : 'transparent',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: isNonWorkingDay ? 'white' : 'text.secondary', fontSize: '0.52rem', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1 }}>
                      {col.date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').substring(0, 3).toUpperCase()}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: isNonWorkingDay ? 'white' : 'text.primary', fontSize: '0.72rem', mt: 0.1, lineHeight: 1 }}>
                      {col.date.getDate()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isNonWorkingDay ? 'white' : 'text.secondary', fontWeight: 'bold', fontSize: '0.62rem', textTransform: 'uppercase', lineHeight: 1, mt: 0.1 }}>
                      {col.dayName[0]}
                    </Typography>
                  </Box>
                );
              })}

              {/* Draw Today Indicator line in header */}
              {todayOffset !== null && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: todayOffset,
                    transform: 'translateX(-50%)',
                    width: '2px',
                    bgcolor: '#ff764d',
                    top: 0,
                    bottom: 0,
                    zIndex: 2,
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Timeline Rows Body */}
          <Box className="print-expanded" sx={{ display: 'flex', flex: 1, overflowY: 'auto', maxHeight: '55vh' }}>

            {/* Left Side Professionals Column */}
            <Box sx={{ width: 200, minWidth: 200, borderRight: '1px solid #cbd5e1', bgcolor: 'rgba(100, 24, 63, 0.05)', zIndex: 2 }}>
              {ganttViewGroup === 'resource' ? (
                groupedTasksRows.map((group, rowIdx) => {
                  const isSelected = selectedResource === group.resourceName;
                  return (
                    <Box
                      key={rowIdx}
                      draggable={group.resourceName !== 'Sem Responsável'}
                      onDragStart={(e) => handleDragStart(e, group.resourceName)}
                      onDragOver={(e) => handleDragOver(e, group.resourceName)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedResource(isSelected ? null : group.resourceName)}
                      sx={{
                        height: 42,
                        display: 'flex',
                        alignItems: 'center',
                        px: 1,
                        gap: 0.5,
                        borderBottom: isSelected ? '1px solid #64183f' : '1px solid #cbd5e1',
                        cursor: group.resourceName !== 'Sem Responsável' ? 'grab' : 'pointer',
                        opacity: draggedResource === group.resourceName ? 0.4 : 1,
                        bgcolor: isSelected ? 'rgba(100, 24, 63, 0.15)' : 'transparent',
                        borderLeft: isSelected ? '4px solid #64183f' : '4px solid transparent',
                        boxShadow: isSelected ? 'inset 0 1px 0 rgba(100, 24, 63, 0.2)' : 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: isSelected ? 'rgba(100, 24, 63, 0.20)' : 'rgba(100, 24, 63, 0.08)',
                        },
                        '&:active': {
                          cursor: group.resourceName !== 'Sem Responsável' ? 'grabbing' : 'pointer',
                        }
                      }}
                    >
                      {group.resourceName !== 'Sem Responsável' && (
                        <DragIndicator sx={{ fontSize: '1.1rem', color: '#cbd5e1', cursor: 'grab' }} />
                      )}
                      {group.resourceName !== 'Sem Responsável' ? (() => {
                        const avatarObj = group.resourceAvatar ? getAvatarById(group.resourceAvatar) : null;
                        return (
                          <Avatar
                            alt={group.resourceName}
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: '0.65rem',
                              background: group.resourceAvatarImage
                                ? 'transparent'
                                : avatarObj 
                                  ? avatarObj.gradient 
                                  : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
                            }}
                          >
                            {group.resourceAvatarImage ? (
                              <img 
                                src={group.resourceAvatarImage} 
                                alt={group.resourceName} 
                                className="w-full h-full object-cover object-top rounded-full"
                              />
                            ) : avatarObj ? (
                              avatarObj.icon
                            ) : (
                              getGanttInitials(group.resourceName)
                            )}
                          </Avatar>
                        );
                      })() : (
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: '0.65rem',
                            bgcolor: 'grey.300',
                          }}
                        >
                          👤
                        </Avatar>
                      )}

                      <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.1 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '0.78rem' }}>
                          {group.resourceName}
                        </Typography>
                        {group.resourceRole && (
                          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block', fontSize: '0.62rem' }}>
                            {group.resourceRole}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })
              ) : (
                groupedRequirementsRows.map((group, rowIdx) => {
                  const isSelected = selectedRequirement === group.requirementName;
                  return (
                    <Box
                      key={rowIdx}
                      onClick={() => setSelectedRequirement(isSelected ? null : group.requirementName)}
                      sx={{
                        height: 42,
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        gap: 0.5,
                        borderBottom: isSelected ? '1px solid #64183f' : '1px solid #cbd5e1',
                        cursor: 'pointer',
                        bgcolor: isSelected ? 'rgba(100, 24, 63, 0.15)' : 'transparent',
                        borderLeft: isSelected ? '4px solid #64183f' : '4px solid transparent',
                        boxShadow: isSelected ? 'inset 0 1px 0 rgba(100, 24, 63, 0.2)' : 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: isSelected ? 'rgba(100, 24, 63, 0.20)' : 'rgba(100, 24, 63, 0.08)',
                        }
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.1 }}>
                        <Tooltip title={group.requirementName}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '0.78rem' }}>
                            {group.requirementName}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>

            {/* Right Side Timeline Grid with task bars */}
            <Box
              ref={ganttBodyContainerRef}
              onScroll={handleScrollBody}
              className="print-horizontal-scroll"
              sx={{ flex: 1, position: 'relative', overflowX: 'auto', bgcolor: '#fafcfd' }}
            >

              {/* Draw Vertical Grid lines */}
              {daysScale.map((col, idx) => {
                const isWeekend = col.date.getDay() === 0 || col.date.getDay() === 6;
                const isHoliday = !!col.isHoliday;
                const isNonWorkingDay = isWeekend || isHoliday;
                return (
                  <Box
                    key={idx}
                    sx={{
                      position: 'absolute',
                      left: col.left,
                      width: colWidth,
                      borderRight: '1px dashed #f1f5f9',
                      top: 0,
                      bottom: 0,
                      zIndex: 0,
                      bgcolor: isNonWorkingDay ? 'rgba(248, 113, 113, 0.08)' : 'transparent',
                    }}
                  />
                );
              })}

              {/* Draw Today Indicator line */}
              {todayOffset !== null && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: todayOffset,
                    transform: 'translateX(-50%)',
                    width: '2px',
                    bgcolor: '#ff764d',
                    top: 0,
                    bottom: 0,
                    zIndex: 2,
                  }}
                />
              )}
              {ganttViewGroup === 'resource' ? (
                groupedTasksRows.map((group, rowIdx) => {
                  const rowTasks = group.tasks;
                  const isSelected = selectedResource === group.resourceName;

                  // Build vertical slots for tasks that start on the same day OR when predecessor ends on start day (max 2 visible slots).
                  const tasksByStartDay = new Map<string, TimelineTask[]>();
                  
                  // First pass: group by start date
                  rowTasks.forEach((task) => {
                    const dayKey = task.start.toISOString().split('T')[0];
                    const sameDay = tasksByStartDay.get(dayKey) || [];
                    sameDay.push(task);
                    tasksByStartDay.set(dayKey, sameDay);
                  });

                  // Second pass: also include tasks whose predecessor ends on this task's start date
                  rowTasks.forEach((task) => {
                    const dayKey = task.start.toISOString().split('T')[0];
                    const predTask = rowTasks.find(t => {
                      const predEndDay = t.end.toISOString().split('T')[0];
                      return predEndDay === dayKey && t.id !== task.id;
                    });
                    
                    if (predTask) {
                      const sameDay = tasksByStartDay.get(dayKey) || [];
                      if (!sameDay.find(t => t.id === predTask.id)) {
                        sameDay.push(predTask);
                        tasksByStartDay.set(dayKey, sameDay);
                      }
                    }
                  });

                  const taskSlotById = new Map<string, { slot: number; slots: number }>();
                  tasksByStartDay.forEach((sameDayTasks) => {
                    const slots = Math.min(2, sameDayTasks.length);
                    sameDayTasks.forEach((task, index) => {
                      taskSlotById.set(task.id, {
                        slot: index % slots,
                        slots,
                      });
                    });
                  });

                  return (
                    <Box
                      key={rowIdx}
                      onClick={() => setSelectedResource(isSelected ? null : group.resourceName)}
                      sx={{
                        height: 42,
                        position: 'relative',
                        borderBottom: isSelected ? '1px solid #64183f' : '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        bgcolor: isSelected ? 'rgba(100, 24, 63, 0.08)' : 'transparent',
                        boxShadow: isSelected ? 'inset 0 1px 0 rgba(100, 24, 63, 0.2)' : 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: isSelected ? 'rgba(100, 24, 63, 0.12)' : 'rgba(100, 24, 63, 0.04)',
                        }
                      }}
                    >
                      {rowTasks.map((task) => {
                        const barLeft = getXFromDate(task.start);
                        const barWidth = (getXFromDate(task.end) - barLeft) + colWidth;
                        const slotInfo = taskSlotById.get(task.id);
                        const isSplitDay = (slotInfo?.slots || 1) > 1;
                        const barHeight = isSplitDay ? 18 : 38;
                        const barTop = isSplitDay ? (slotInfo?.slot === 1 ? 22 : 2) : 2;

                        const barBg = getRequirementColor(task.description || task.name);

                        const todayMid = new Date();
                        todayMid.setHours(12, 0, 0, 0);

                        const taskEnd = new Date(task.end.getTime());
                        taskEnd.setHours(23, 59, 59, 999);

                        let taskBg = barBg;
                        let taskOpacity = 1;

                        if (task.start > todayMid) {
                          taskOpacity = 0.5;
                        } else if (taskEnd > todayMid) {
                          const totalMs = taskEnd.getTime() - task.start.getTime();
                          const pastMs = todayMid.getTime() - task.start.getTime();
                          if (totalMs > 0 && pastMs > 0) {
                            const splitPct = (pastMs / totalMs) * 100;
                            const solidColor = barBg;
                            const transparentColor = solidColor.startsWith('#') ? `${solidColor}80` : solidColor;
                            taskBg = `linear-gradient(90deg, ${solidColor} 0%, ${solidColor} ${splitPct}%, ${transparentColor} ${splitPct}%, ${transparentColor} 100%)`;
                          }
                        }

                        return (
                          <Tooltip
                            key={task.id}
                            title={
                              <Box sx={{ p: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>{task.name}</Typography>
                                <Typography variant="caption" sx={{ display: 'block' }}>Fase: {task.phase}</Typography>
                                <Typography variant="caption" sx={{ display: 'block' }}>Início: {task.start.toLocaleDateString()}</Typography>
                                <Typography variant="caption" sx={{ display: 'block' }}>Término: {task.end.toLocaleDateString()}</Typography>
                              </Box>
                            }
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                left: barLeft,
                                top: barTop,
                                width: Math.max(50, barWidth),
                                height: barHeight,
                                background: taskBg,
                                opacity: taskOpacity,
                                borderRadius: '8px',
                                cursor: 'grab',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 2,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                                transition: draggingTask === task.id ? 'none' : 'left 0.1s, width 0.1s',
                                userSelect: 'none',
                                zIndex: 1,
                              }}
                              onMouseDown={(e) => handleMouseDown(task.id, 'move', e)}
                              onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setIsDrawerOpen(true); }}
                            >
                              {/* Left Resize Handle */}
                              <Box
                                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(task.id, 'resize-start', e); }}
                                sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', borderRadius: '8px 0 0 8px', '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } }}
                              />

                              {/* Content inside the bar */}
                              {(() => {
                                const orig = task.originalItem || {};
                                const taskName = ('taskName' in orig) ? orig.taskName : (orig.task || task.name);
                                const taskSequence = ('taskSequence' in orig) ? orig.taskSequence : (orig.sequencia !== undefined ? String(orig.sequencia) : '');
                                const taskPhase = ('taskPhase' in orig) ? orig.taskPhase : (orig.idBacklog || task.phase || '');
                                const taskTechnology = ('taskTechnology' in orig) ? orig.taskTechnology : (orig.sistema || '');

                                const bottomText = [taskSequence, taskPhase, taskTechnology].filter(Boolean).join(' • ');

                                return (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', flex: 1, pr: 1, pl: 0.5, lineHeight: 1.2 }}>
                                    <Typography variant="caption" noWrap sx={{ color: 'white', fontSize: '0.62rem', fontWeight: 'normal' }}>
                                      {taskName}
                                    </Typography>
                                    {!isSplitDay && (
                                      <Typography variant="caption" noWrap sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.52rem', fontWeight: 'medium' }}>
                                        {bottomText}
                                      </Typography>
                                    )}
                                  </Box>
                                );
                              })()}
                              {/* Right Resize Handle */}
                              <Box
                                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(task.id, 'resize-end', e); }}
                                sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', borderRadius: '0 8px 8px 0', '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } }}
                              />
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  );
                })
              ) : (
                groupedRequirementsRows.map((group, rowIdx) => {
                  const isSelected = selectedRequirement === group.requirementName;
                  const barLeft = getXFromDate(group.start);
                  const barWidth = (getXFromDate(group.end) - barLeft) + colWidth;
                  const barBg = getRequirementColor(group.requirementName);

                  const reqTasks = group.tasks;
                  const totalPoints = reqTasks.reduce((acc: number, t: any) => acc + (t.originalItem?.taskPoints || t.originalItem?.pontos || 0), 0);
                  const completedPoints = reqTasks
                    .filter((t: any) => t.originalItem?.kanbanPhase === 'Completed')
                    .reduce((acc: number, t: any) => acc + (t.originalItem?.taskPoints || t.originalItem?.pontos || 0), 0);

                  let completionPercentage = 0;
                  if (totalPoints > 0) {
                    completionPercentage = Math.round((completedPoints / totalPoints) * 100);
                  } else {
                    const completedCount = reqTasks.filter((t: any) => t.originalItem?.kanbanPhase === 'Completed').length;
                    completionPercentage = reqTasks.length > 0 ? Math.round((completedCount / reqTasks.length) * 100) : 0;
                  }

                  const solidColor = barBg;
                  const darkColor = darkenHexColor(solidColor, 0.25);
                  const transparentColor = solidColor.startsWith('#') ? `${solidColor}80` : solidColor;
                  const reqBg = `linear-gradient(90deg, ${darkColor} 0%, ${darkColor} ${completionPercentage}%, ${transparentColor} ${completionPercentage}%, ${transparentColor} 100%)`;
                  const reqOpacity = 1;

                  return (
                    <Box
                      key={rowIdx}
                      onClick={() => setSelectedRequirement(isSelected ? null : group.requirementName)}
                      sx={{
                        height: 42,
                        position: 'relative',
                        borderBottom: isSelected ? '1px solid #64183f' : '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        bgcolor: isSelected ? 'rgba(100, 24, 63, 0.08)' : 'transparent',
                        boxShadow: isSelected ? 'inset 0 1px 0 rgba(100, 24, 63, 0.2)' : 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: isSelected ? 'rgba(100, 24, 63, 0.12)' : 'rgba(100, 24, 63, 0.04)',
                        }
                      }}
                    >
                      <Tooltip
                        title={
                          <Box sx={{ p: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>{group.requirementName}</Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>Início: {group.start.toLocaleDateString()}</Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>Término: {group.end.toLocaleDateString()}</Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>Progresso: {completionPercentage}% concluído</Typography>
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>Profissionais:</Typography>
                            {group.resources.map(r => (
                              <Typography key={r.id} variant="caption" sx={{ display: 'block', pl: 1 }}>- {squadMaskedNames[r.nome] || r.perfil || 'Profissional'}</Typography>
                            ))}
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>Tarefas:</Typography>
                            {group.tasks.map(t => (
                              <Typography key={t.id} variant="caption" sx={{ display: 'block', pl: 1 }}>- {t.name} ({t.start.toLocaleDateString()} a {t.end.toLocaleDateString()})</Typography>
                            ))}
                          </Box>
                        }
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            left: barLeft,
                            width: Math.max(50, barWidth),
                            height: 38,
                            background: reqBg,
                            opacity: reqOpacity,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                            userSelect: 'none',
                            zIndex: 1,
                          }}
                        >
                          {group.resources.length > 0 && (
                            <AvatarGroup max={3} sx={{ mr: 1, '& .MuiAvatar-root': { width: 20, height: 20, fontSize: '0.55rem', border: '1px solid white' } }}>
                              {group.resources.map((res, i) => {
                                const avatarObj = res.avatar ? getAvatarById(res.avatar) : null;
                                return (
                                  <Tooltip key={i} title={squadMaskedNames[res.nome] || res.perfil || 'Profissional'}>
                                    <Avatar
                                      alt={squadMaskedNames[res.nome] || res.nome}
                                      sx={{
                                        background: res.avatarImage
                                          ? 'transparent'
                                          : avatarObj 
                                            ? avatarObj.gradient 
                                            : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
                                      }}
                                    >
                                      {res.avatarImage ? (
                                        <img 
                                          src={res.avatarImage} 
                                          alt={squadMaskedNames[res.nome] || res.nome} 
                                          className="w-full h-full object-cover object-top rounded-full" 
                                        />
                                      ) : avatarObj ? (
                                        avatarObj.icon
                                      ) : (
                                        getGanttInitials(squadMaskedNames[res.nome] || res.nome)
                                      )}
                                    </Avatar>
                                  </Tooltip>
                                );
                              })}
                            </AvatarGroup>
                          )}
                          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', flex: 1, pr: 1, pl: 0.5, lineHeight: 1.2 }}>
                            <Typography variant="caption" noWrap sx={{ color: 'white', fontSize: '0.62rem', fontWeight: 'normal' }}>
                              {group.requirementName}
                            </Typography>
                            <Typography variant="caption" noWrap sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.52rem', fontWeight: 'medium' }}>
                              {group.start.toLocaleDateString('pt-BR')} a {group.end.toLocaleDateString('pt-BR')} • {group.tasks.length} {group.tasks.length === 1 ? 'Tarefa' : 'Tarefas'}
                            </Typography>
                          </Box>

                          {/* Percentage text at the end of the darker part */}
                          {completionPercentage > 0 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: `${completionPercentage}%`,
                                transform: completionPercentage < 15 ? 'translateX(4px)' : 'translateX(-100%)',
                                color: 'white',
                                fontSize: '0.58rem',
                                fontWeight: '900',
                                pointerEvents: 'none',
                                zIndex: 2,
                                pr: completionPercentage >= 15 ? 0.8 : 0,
                                pl: completionPercentage < 15 ? 0.8 : 0,
                              }}
                            >
                              {completionPercentage}%
                            </Box>
                          )}
                        </Box>
                      </Tooltip>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Grelha de Detalhamento das Tarefas (Visão Expandida) */}
      {(isFullscreen && activeTab === 'backlog') && (
        <Box sx={{ mt: 0, zIndex: 1, position: 'relative' }}>
          <Paper sx={{ border: '1px solid rgba(226, 232, 240, 0.5)', borderRadius: '24px', p: 3, boxShadow: 'none', bgcolor: 'rgba(250, 244, 239, 0.5)' }}>
            <Box sx={{ overflowX: 'auto', bgcolor: 'white', border: '1px solid #cbd5e1', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'inherit' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(90deg, #64183f 0%, #1a1f44 100%)' }}>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: '800', color: 'white', letterSpacing: '0.5px', textTransform: 'uppercase', width: '120px' }}>ID TAREFA</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: '800', color: 'white', letterSpacing: '0.5px', textTransform: 'uppercase' }}>TAREFA</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: '800', color: 'white', letterSpacing: '0.5px', textTransform: 'uppercase', width: '220px' }}>RESPONSÁVEL</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: '800', color: 'white', letterSpacing: '0.5px', textTransform: 'uppercase', width: '150px' }}>ETAPA</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: '800', color: 'white', letterSpacing: '0.5px', textTransform: 'uppercase', width: '150px' }}>TECNOLOGIA</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: '800', color: 'white', letterSpacing: '0.5px', textTransform: 'uppercase', width: '100px', textAlign: 'center' }}>PONTOS</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: '800', color: 'white', letterSpacing: '0.5px', textTransform: 'uppercase', width: '200px' }}>PERÍODO</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Grupo 1: Tarefas Planejadas */}
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                    <td colSpan={7} style={{ padding: '10px 16px', fontSize: '0.75rem', fontWeight: 'bold', color: '#64183f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🟢 Tarefas Planejadas ({plannedTasks.length})
                    </td>
                  </tr>
                  {plannedTasks.map((task, index) => {
                    const orig = task.originalItem || {};
                    const taskName = ('taskName' in orig) ? orig.taskName : (orig.task || task.name);
                    const taskSequence = ('taskSequence' in orig) ? orig.taskSequence : (orig.sequencia !== undefined ? String(orig.sequencia) : index + 1);
                    const taskPhase = ('taskPhase' in orig) ? orig.taskPhase : (orig.idBacklog || task.phase || '');
                    const taskTechnology = ('taskTechnology' in orig) ? orig.taskTechnology : (orig.sistema || '');
                    const taskPoints = ('taskPoints' in orig) ? orig.taskPoints : (orig.pontos || 0);

                    const resource = task.resources && task.resources[0];
                    const avatarObj = resource?.avatar ? getAvatarById(resource.avatar) : null;

                    return (
                      <tr
                        key={task.id}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        onClick={() => { setSelectedTask(task); setIsDrawerOpen(true); }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800', backgroundColor: '#fdf2f8', color: '#64183f', border: '1px solid #fbcfe8' }}>
                            #{taskSequence}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#1e293b' }}>
                          <div style={{ fontWeight: 'normal' }}>{taskName}</div>
                          {task.description && task.description !== taskName && (
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 'normal', marginTop: '4px' }}>
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {resource ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.65rem',
                                  fontWeight: 'normal',
                                  color: 'white',
                                  overflow: 'hidden',
                                  background: resource.avatarImage
                                    ? 'transparent'
                                    : avatarObj 
                                      ? avatarObj.gradient 
                                      : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)'
                                }}
                              >
                                {resource.avatarImage ? (
                                  <img 
                                    src={resource.avatarImage} 
                                    alt={squadMaskedNames[resource.nome] || resource.nome} 
                                    className="w-full h-full object-cover object-top rounded-full" 
                                  />
                                ) : avatarObj ? (
                                  avatarObj.icon
                                ) : (
                                  getGanttInitials(squadMaskedNames[resource.nome] || resource.nome)
                                )}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#64183f' }}>
                                  {squadMaskedNames[resource.nome] || resource.perfil || 'Profissional'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic' }}>Não atribuído</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 'normal', background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)', color: 'white' }}>
                            {taskPhase.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {taskTechnology ? (
                            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 'normal', background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)', color: 'white' }}>
                              {taskTechnology.toUpperCase()}
                            </span>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.72rem' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '850', backgroundColor: 'rgba(100, 24, 63, 0.1)', color: '#64183f', border: '1px solid rgba(100, 24, 63, 0.2)' }}>
                            {taskPoints} pts
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#0284c7', fontWeight: 'bold' }}>
                          {task.start && task.end ? `📅 ${task.start.toLocaleDateString('pt-BR')} - ${task.end.toLocaleDateString('pt-BR')}` : ''}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Grupo 2: Tarefas Não Planejadas */}
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}>
                    <td colSpan={7} style={{ padding: '10px 16px', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🟡 Tarefas Não Planejadas ({unplannedTasks.length})
                    </td>
                  </tr>
                  {unplannedTasks.map((task, index) => {
                    const orig = task.originalItem || {};
                    const taskName = ('taskName' in orig) ? orig.taskName : (orig.task || task.name);
                    const taskSequence = ('taskSequence' in orig) ? orig.taskSequence : (orig.sequencia !== undefined ? String(orig.sequencia) : index + 1);
                    const taskPhase = ('taskPhase' in orig) ? orig.taskPhase : (orig.idBacklog || task.phase || '');
                    const taskTechnology = ('taskTechnology' in orig) ? orig.taskTechnology : (orig.sistema || '');
                    const taskPoints = ('taskPoints' in orig) ? orig.taskPoints : (orig.pontos || 0);

                    return (
                      <tr
                        key={task.id}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        onClick={() => { setSelectedTask(task); setIsDrawerOpen(true); }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800', backgroundColor: '#fdf2f8', color: '#64183f', border: '1px solid #fbcfe8' }}>
                            #{taskSequence}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#1e293b' }}>
                          <div style={{ fontWeight: 'normal' }}>{taskName}</div>
                          {task.description && task.description !== taskName && (
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 'normal', marginTop: '4px' }}>
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {/* Empty as requested for Unplanned tasks */}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 'normal', background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)', color: 'white' }}>
                            {taskPhase.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {taskTechnology ? (
                            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 'normal', background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)', color: 'white' }}>
                              {taskTechnology.toUpperCase()}
                            </span>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.72rem' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '850', backgroundColor: 'rgba(100, 24, 63, 0.1)', color: '#64183f', border: '1px solid rgba(100, 24, 63, 0.2)' }}>
                            {taskPoints} pts
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {/* Empty as requested for Unplanned tasks */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Visão de Tecnologias (Visão Expandida) */}
      {(isFullscreen && activeTab === 'technologies') && (
        <Box sx={{ mt: 0, zIndex: 1, position: 'relative' }}>
          <Paper sx={{ border: '1px solid #cbd5e1', borderLeft: '4px solid #64183f', borderRadius: '0 16px 16px 16px', overflow: 'hidden', boxShadow: 'none' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #cbd5e1', bgcolor: '#fafafa' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#64183f' }}>
                💻 Esforço por Tecnologia (Pontos e Porcentagens)
              </Typography>
            </Box>
            <Box sx={{ p: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {Object.entries(metrics.pointsByTech).map(([tech, pts]) => {
                const pct = metrics.totalPoints > 0 ? Math.round((pts / metrics.totalPoints) * 100) : 0;
                return (
                  <Paper
                    key={tech}
                    sx={{
                      py: 1.5,
                      px: 2.5,
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      borderLeft: '4px solid #64183f',
                      boxShadow: 'none',
                      background: 'linear-gradient(90deg, rgba(100, 24, 63, 0.1) 0%, rgba(26, 31, 68, 0.1) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: '160px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64183f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                      </Box>
                      <Box sx={{ width: '1px', height: '24px', bgcolor: '#64183f' }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>
                          {tech}
                        </Typography>
                        <Typography sx={{ fontWeight: '800', color: 'text.primary', fontSize: '0.85rem' }}>
                          {pts} pts ({pct}%)
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Visão Kanban */}
      {(isFullscreen && activeTab === 'kanban') && (() => {
        const kanbanTasks = dbBacklog.filter(item => item.resourceId !== null && item.resourceId !== undefined);
        const todoTasks = kanbanTasks.filter(item => (item.kanbanPhase || 'To Do') === 'To Do');
        const ongoingTasks = kanbanTasks.filter(item => item.kanbanPhase === 'On Going');
        const completedTasks = kanbanTasks.filter(item => item.kanbanPhase === 'Completed');

        // Dynamically compute step3PhaseTechs from dbBacklog so we map them to index / gradients
        const step3PhaseTechs = (() => {
          const list: Array<{ phase: string; tech: string }> = [];
          const seen = new Set<string>();
          dbBacklog.forEach(item => {
            const phase = (item.taskPhase || '').trim();
            const tech = (item.taskTechnology || '').trim();
            if (phase && tech) {
              const key = `${phase}||${tech}`;
              if (!seen.has(key)) {
                seen.add(key);
                list.push({ phase, tech });
              }
            }
          });

          return list.sort((a, b) => {
            const flatPhases = orderedPhases.flat().map(p => p.toUpperCase());
            const idxA = flatPhases.indexOf(a.phase.toUpperCase());
            const idxB = flatPhases.indexOf(b.phase.toUpperCase());
            const diff = (idxA === -1 ? 999999 : idxA) - (idxB === -1 ? 999999 : idxB);
            if (diff !== 0) return diff;
            return a.tech.localeCompare(b.tech);
          });
        })();

        const totalCount = kanbanTasks.length;
        const completedCount = completedTasks.length;
        const ongoingCount = ongoingTasks.length;
        const todoCount = todoTasks.length;

        const totalPoints = kanbanTasks.reduce((acc, t) => acc + (t.taskPoints || 0), 0);
        const completedPoints = completedTasks.reduce((acc, t) => acc + (t.taskPoints || 0), 0);
        const ongoingPoints = ongoingTasks.reduce((acc, t) => acc + (t.taskPoints || 0), 0);
        const todoPoints = todoTasks.reduce((acc, t) => acc + (t.taskPoints || 0), 0);

        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        const circleRadius = 38;
        const strokeWidthVal = 7;
        const circleCircumference = 2 * Math.PI * circleRadius;
        const strokeDashoffsetVal = circleCircumference - (progressPercent / 100) * circleCircumference;

        const pointsProgressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
        const pointsStrokeDashoffsetVal = circleCircumference - (pointsProgressPercent / 100) * circleCircumference;

        return (
          <Box sx={{ mt: 0, zIndex: 1, position: 'relative', display: 'flex', gap: 3, flex: 1, width: '100%' }}>
            {/* Left side: Kanban Columns Board */}
            <Paper sx={{ border: '1px solid #E5D5C8', borderRadius: '16px', display: 'flex', flexDirection: 'column', flex: 3, overflow: 'hidden', boxShadow: 'none', position: 'relative', pl: 1.5, bgcolor: '#FAF4EF' }}>
              {/* Rounded Left Border Capsule Accent */}
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '12px', bgcolor: '#64183f', borderRadius: '16px 0 0 16px' }} />
              <Box sx={{ p: 3, display: 'flex', gap: 3, flex: 1, background: '#FAF4EF', overflowX: 'auto', minHeight: '500px' }}>
                {(['Waiting', 'In Progress', 'Completed'] as const).map(col => {
                  const colTasks = col === 'Waiting' ? todoTasks : col === 'In Progress' ? ongoingTasks : completedTasks;



                  const colColorDark = col === 'Waiting'
                    ? '#c2410c'
                    : col === 'In Progress'
                      ? '#1d4ed8'
                      : '#047857';

                  return (
                    <Box
                      key={col}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const dbPhase = col === 'Waiting' ? 'To Do' : col === 'In Progress' ? 'On Going' : 'Completed';
                        handleKanbanDrop(e, dbPhase);
                      }}
                      sx={{
                        flex: 1,
                        minWidth: '260px',
                        maxWidth: '360px',
                        bgcolor: 'transparent',
                        borderRadius: '0px',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        border: 'none',
                        borderLeft: `5px solid ${colColorDark}`,
                        height: '100%'
                      }}
                    >
                      {/* Column Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
                        <Typography sx={{ fontWeight: '800', color: colColorDark, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {col === 'Waiting' ? 'Waiting 🎯' : col === 'In Progress' ? 'In Progress ⚡' : 'Completed 🎉'}
                        </Typography>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.2,
                          py: 0.2,
                          bgcolor: col === 'Waiting' ? 'rgba(249, 115, 22, 0.15)' : col === 'In Progress' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          borderRadius: '12px',
                          color: colColorDark
                        }}>
                          <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
                            {colTasks.length}
                          </Typography>
                          <Typography component="span" sx={{ fontSize: '0.45rem', fontWeight: '800', opacity: 0.85 }}>
                            ({colTasks.reduce((acc, t) => acc + (t.taskPoints || 0), 0)} pts)
                          </Typography>
                        </Box>
                      </Box>

                       {/* Column Body / Cards List */}
                       <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'visible', display: 'flex', flexDirection: 'column', gap: 2, pl: 1, pr: 2, pt: 1.5, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '4px' } }}>
                        {colTasks.map(task => {
                          const resMember = squad.find(s => String(s.id) === String(task.resourceId));
                          const grad = resMember?.avatar ? getAvatarById(resMember.avatar)?.gradient : 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)';
                          const initials = resMember ? getGanttInitials(resMember.nome) : '';
                          const avatarObj = resMember?.avatar ? getAvatarById(resMember.avatar) : null;

                          // Determine gradient index using step3PhaseTechs
                          const phaseTechIdx = step3PhaseTechs.findIndex(
                            p => p.phase.toUpperCase() === (task.taskPhase || '').trim().toUpperCase() &&
                              p.tech.toUpperCase() === (task.taskTechnology || '').trim().toUpperCase()
                          );
                          const cardIdx = phaseTechIdx >= 0 ? phaseTechIdx : 0;

                          // Determine attention alert condition
                          const isAttentionAlert = (() => {
                            if (!task.initialDate || !task.endDate) return false;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const initial = new Date(task.initialDate + 'T12:00:00');
                            initial.setHours(0, 0, 0, 0);

                            const end = new Date(task.endDate + 'T12:00:00');
                            end.setHours(0, 0, 0, 0);

                            if (col === 'Waiting' && initial.getTime() < today.getTime()) {
                              return true;
                            }
                            if (col === 'In Progress' && today.getTime() > end.getTime()) {
                              return true;
                            }
                            return false;
                          })();

                          return (
                            <Paper
                              key={task.id}
                              draggable
                              onDragStart={(e) => handleKanbanDragStart(e, task.id)}
                              onDoubleClick={() => handleOpenKanbanDateEditor(task)}
                              sx={{
                                p: 1.5,
                                borderRadius: '14px',
                                background: '#ffffff',
                                boxShadow: isAttentionAlert ? '0 0 12px rgba(255, 102, 0, 0.8)' : '0 4px 12px rgba(0,0,0,0.05)',
                                cursor: 'grab',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                position: 'relative',
                                overflow: 'visible',
                                border: isAttentionAlert ? '4px solid #ff6600' : '1px solid #E5D5C8',
                                borderLeft: `8px solid ${isAttentionAlert ? '#ff6600' : (col === 'Completed' ? '#047857' : col === 'In Progress' ? '#1d4ed8' : col === 'Waiting' ? '#c2410c' : '#64183f')}`,
                                height: 'auto',
                                animation: isAttentionAlert ? 'blink-alert 0.8s infinite alternate' : 'none',
                                '@keyframes blink-alert': {
                                  '0%': { 
                                    boxShadow: '0 0 4px rgba(255, 102, 0, 0.3)',
                                    borderColor: 'rgba(255, 102, 0, 0.4)' 
                                  },
                                  '100%': { 
                                    boxShadow: '0 0 16px rgba(255, 102, 0, 0.95)',
                                    borderColor: '#ff6600' 
                                  }
                                },
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: isAttentionAlert ? '0 0 18px rgba(255, 102, 0, 0.95)' : '0 8px 16px rgba(0, 0, 0, 0.15)',
                                },
                                '&:active': {
                                  cursor: 'grabbing'
                                }
                              }}
                            >
                              {/* Green Check Badge for Completed Cards */}
                              {col === 'Completed' && (
                                <Box sx={{
                                  position: 'absolute',
                                  top: '-12px',
                                  right: '-12px',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  bgcolor: '#10b981',
                                  border: '2px solid white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                  zIndex: 30,
                                }}>
                                  <Check sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }} />
                                </Box>
                              )}

                              {/* Curved Wave Layers */}
                              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none', zIndex: 0 }} viewBox="0 0 200 100" preserveAspectRatio="none">
                                <path d="M 0 100 C 60 90, 100 45, 200 15 L 200 100 Z" fill="rgba(100, 24, 63, 0.02)" />
                                <path d="M 0 100 C 80 85, 120 60, 200 38 L 200 100 Z" fill="rgba(100, 24, 63, 0.04)" />
                                <path d="M 0 100 C 110 95, 145 82, 200 68 L 200 100 Z" fill="rgba(100, 24, 63, 0.01)" />
                              </svg>

                              {/* Sparkling Stars (✦) */}
                              <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none', zIndex: 0 }}>
                                <svg style={{ position: 'absolute', left: '15%', top: '15%', width: '10px', height: '10px', color: '#64183f', opacity: 0.15 }} viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                                </svg>
                                <svg style={{ position: 'absolute', right: '25%', bottom: '20%', width: '8px', height: '8px', color: '#64183f', opacity: 0.1 }} viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                                </svg>
                              </Box>

                              {/* Icon illustration in the background */}
                              {React.cloneElement(getStep3CardIcon(cardIdx), {
                                style: {
                                  position: 'absolute',
                                  right: '-4px',
                                  bottom: '-4px',
                                  color: '#64183f',
                                  opacity: 0.06,
                                  transform: 'rotate(-12deg)',
                                  pointerEvents: 'none',
                                  userSelect: 'none',
                                  zIndex: 0
                                }
                              })}

                              {/* Card Content above waves */}
                              <Box sx={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                                {/* Card Top Row: Sequence on the right */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.1 }}>
                                  <Typography sx={{ fontSize: '0.52rem', fontWeight: '900', color: '#64748b' }}>
                                    {task.taskSequence ? `#${task.taskSequence}` : ''}
                                  </Typography>
                                </Box>

                                {/* Header: Task Name (Nome do Requisito) */}
                                <Typography sx={{ fontWeight: 'normal', color: '#1e293b', fontSize: '0.62rem', mb: 0.8, lineHeight: 1.25 }}>
                                  {task.taskName}
                                </Typography>

                                {/* Subheader: Phase - Tech */}
                                <Typography sx={{ fontSize: '8px', textTransform: 'uppercase', tracking: '0.05em', fontWeight: 'normal', color: '#64183f', mb: 0.8 }}>
                                  {task.taskPhase || 'Sem Fase'} - {task.taskTechnology || 'Sem Tecnologia'}
                                </Typography>

                                {/* Calendar Dates: Below Phase - Tech */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                  <CalendarToday sx={{ fontSize: '0.6rem', color: '#64748b' }} />
                                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 'normal', color: '#64748b' }}>
                                    {formatKanbanDate(task.initialDate)} - {formatKanbanDate(task.endDate)}
                                  </Typography>
                                </Box>

                                {/* Card Footer: Avatar & Points/Links */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.6, borderTop: '1px solid #e2e8f0' }}>
                                  {/* Left side: Avatar & First Name */}
                                  {resMember ? (
                                    <Tooltip title={`${resMember.nome} (${resMember.perfil})`}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <Avatar
                                          sx={{
                                            width: 18,
                                            height: 18,
                                            fontSize: '0.45rem',
                                            background: resMember?.avatarImage
                                              ? 'transparent'
                                              : grad,
                                            border: '1px solid #cbd5e1',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                          }}
                                        >
                                          {resMember?.avatarImage ? (
                                            <img 
                                              src={resMember.avatarImage} 
                                              alt={resMember.nome} 
                                              className="w-full h-full object-cover object-top rounded-full" 
                                            />
                                          ) : avatarObj ? (
                                            avatarObj.icon
                                          ) : (
                                            initials
                                          )}
                                        </Avatar>
                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 'normal', color: '#1e293b', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {resMember.nome.split(' ')[0]}
                                        </Typography>
                                      </Box>
                                    </Tooltip>
                                  ) : (
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.55rem', fontStyle: 'italic' }}>
                                      Sem profissional
                                    </Typography>
                                  )}

                                  {/* Right side: Links + Points */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {/* Jira & Confluence link icons */}
                                    {(col === 'In Progress' || col === 'Completed') && (
                                      <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center' }}>
                                        {task.linkJira ? (
                                          <a href={task.linkJira} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', textDecoration: 'none' }}>
                                            <Box
                                              sx={{
                                                width: 16,
                                                height: 16,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                '&:hover': { transform: 'scale(1.2)', transition: 'transform 0.2s' }
                                              }}
                                              title="Abrir Jira"
                                            >
                                              <JiraIcon size={14} />
                                            </Box>
                                          </a>
                                        ) : (
                                          <Box
                                            sx={{
                                              width: 16,
                                              height: 16,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              opacity: 0.5,
                                              filter: 'grayscale(1)',
                                              border: '1px solid #ef4444',
                                              borderRadius: '3px'
                                            }}
                                            title="Link do Jira Pendente ⚠️"
                                          >
                                            <JiraIcon size={11} />
                                          </Box>
                                        )}

                                        {task.linkWiki ? (
                                          <a href={task.linkWiki} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', textDecoration: 'none' }}>
                                            <Box
                                              sx={{
                                                width: 16,
                                                height: 16,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                '&:hover': { transform: 'scale(1.2)', transition: 'transform 0.2s' }
                                              }}
                                              title="Abrir Confluence"
                                            >
                                              <ConfluenceIcon size={14} />
                                            </Box>
                                          </a>
                                        ) : (
                                          <Box
                                            sx={{
                                              width: 16,
                                              height: 16,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              opacity: 0.5,
                                              filter: 'grayscale(1)',
                                              border: '1px solid #ef4444',
                                              borderRadius: '3px'
                                            }}
                                            title="Link da Confluence Pendente ⚠️"
                                          >
                                            <ConfluenceIcon size={11} />
                                          </Box>
                                        )}
                                      </Box>
                                    )}

                                    {/* Points */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', px: 0.6, py: 0.1, bgcolor: 'rgba(100, 24, 63, 0.1)', borderRadius: '4px' }}>
                                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 'normal', color: '#64183f' }}>
                                        {task.taskPoints || 0} pts
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>

            {/* Right side: UX Premium Sidebar */}
            <Box sx={{ flex: 1, minWidth: '300px', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Combined Circular Progress Card */}
              <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #cbd5e1', borderLeft: '4px solid #64183f', boxShadow: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', background: 'linear-gradient(90deg, rgba(100, 24, 63, 0.15) 0%, rgba(26, 31, 68, 0.15) 100%)' }}>
                <Typography sx={{ fontWeight: '800', color: '#1e293b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 3 }}>
                  Progresso Concluído
                </Typography>
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', gap: 1.5 }}>
                  {/* Tasks Circle */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                      <svg width="85" height="85" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r={circleRadius}
                          fill="transparent"
                          stroke="#f1f5f9"
                          strokeWidth={strokeWidthVal}
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r={circleRadius}
                          fill="transparent"
                          stroke="#64183f"
                          strokeWidth={strokeWidthVal}
                          strokeDasharray={circleCircumference}
                          strokeDashoffset={strokeDashoffsetVal}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                        />
                      </svg>
                      <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: '900', color: '#1e293b', fontSize: '1rem' }}>
                          {progressPercent}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.58rem', fontWeight: '800', color: '#64183f', textTransform: 'uppercase', mt: 1, textAlign: 'center', letterSpacing: 0.25 }}>
                      Tarefas
                    </Typography>
                  </Box>

                  {/* Points/Effort Circle */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                      <svg width="85" height="85" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r={circleRadius}
                          fill="transparent"
                          stroke="#f1f5f9"
                          strokeWidth={strokeWidthVal}
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r={circleRadius}
                          fill="transparent"
                          stroke="#64183f"
                          strokeWidth={strokeWidthVal}
                          strokeDasharray={circleCircumference}
                          strokeDashoffset={pointsStrokeDashoffsetVal}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                        />
                      </svg>
                      <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: '900', color: '#1e293b', fontSize: '1rem' }}>
                          {pointsProgressPercent}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.58rem', fontWeight: '800', color: '#64183f', textTransform: 'uppercase', mt: 1, textAlign: 'center', letterSpacing: 0.25 }}>
                      Pontos
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Tasks Counter Grid */}
              <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #cbd5e1', borderLeft: '4px solid #64183f', boxShadow: 'none', background: 'linear-gradient(90deg, rgba(100, 24, 63, 0.2) 0%, rgba(26, 31, 68, 0.2) 100%)' }}>
                <Typography sx={{ fontWeight: '800', color: '#1e293b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 2 }}>
                  Tasks
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  {/* Total */}
                  <Box sx={{ p: 1.5, bgcolor: '#faf5ff', borderRadius: '12px', borderLeft: '4px solid #a855f7', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#a855f7', textTransform: 'uppercase' }}>
                      Total
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                      <Typography sx={{ fontSize: '1.2rem', fontWeight: '900', color: '#581c87' }}>
                        {totalCount}
                      </Typography>
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: '800', color: '#7e22ce', opacity: 0.85 }}>
                        {totalPoints} <span style={{ fontSize: '0.48rem' }}>pts</span>
                      </Typography>
                    </Box>
                  </Box>
                  {/* Waiting */}
                  <Box sx={{ p: 1.5, bgcolor: '#fff7ed', borderRadius: '12px', borderLeft: '4px solid #f97316', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#f97316', textTransform: 'uppercase' }}>
                      Waiting
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                      <Typography sx={{ fontSize: '1.2rem', fontWeight: '900', color: '#7c2d12' }}>
                        {todoCount}
                      </Typography>
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: '800', color: '#ea580c', opacity: 0.85 }}>
                        {todoPoints} <span style={{ fontSize: '0.48rem' }}>pts</span>
                      </Typography>
                    </Box>
                  </Box>
                  {/* In Progress */}
                  <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: '12px', borderLeft: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#3b82f6', textTransform: 'uppercase' }}>
                      In Progress
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                      <Typography sx={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e3a8a' }}>
                        {ongoingCount}
                      </Typography>
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: '800', color: '#2563eb', opacity: 0.85 }}>
                        {ongoingPoints} <span style={{ fontSize: '0.48rem' }}>pts</span>
                      </Typography>
                    </Box>
                  </Box>
                  {/* Completed */}
                  <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: '12px', borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase' }}>
                      Completed
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                      <Typography sx={{ fontSize: '1.2rem', fontWeight: '900', color: '#064e3b' }}>
                        {completedCount}
                      </Typography>
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: '800', color: '#16a34a', opacity: 0.85 }}>
                        {completedPoints} <span style={{ fontSize: '0.48rem' }}>pts</span>
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        );
      })()}

      {/* Visão Burnup do Projeto */}
      {(isFullscreen && activeTab === 'burnup') && (() => {
        // 1. Gather all tasks with dates
        const validDates = dbBacklog
          .flatMap(item => [item.initialDate, item.endDate])
          .filter(Boolean)
          .map(d => d!.split('T')[0]);

        // Helper to generate dates between min and max
        const getDatesInRangeLocal = (startStr: string, endStr: string) => {
          const datesList: string[] = [];
          if (!startStr || !endStr) return datesList;
          let curr = new Date(startStr + 'T12:00:00');
          const end = new Date(endStr + 'T12:00:00');
          let count = 0;
          while (curr <= end && count < 60) {
            datesList.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
            count++;
          }
          return datesList;
        };

        // Determine min/max dates
        let projectDates: string[] = [];
        const activeRelease = releases.find(r => r.periodo === selectedRelease);
        if (validDates.length > 0) {
          validDates.sort();
          projectDates = getDatesInRangeLocal(validDates[0], validDates[validDates.length - 1]);
        } else {
          // Fallback to active release dates if available, or current month
          const startVal = activeRelease ? activeRelease.dataInicial : toYmd(new Date());
          const endVal = activeRelease ? activeRelease.dataFinal : toYmd(new Date(Date.now() + 15 * 86400000));
          projectDates = getDatesInRangeLocal(startVal, endVal);
        }

        const totalPoints = dbBacklog.reduce((acc, item) => acc + (item.taskPoints || 0), 0);
        const completedPoints = dbBacklog
          .filter(item => item.kanbanPhase === 'Completed')
          .reduce((acc, item) => acc + (item.taskPoints || 0), 0);
        const pendingPoints = totalPoints - completedPoints;
        const completionRate = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

        // Scope / Meta series (Flat line at totalPoints representing scope/target)
        const scopePointsSeries = projectDates.map(() => totalPoints);

        // Planned Burnup series: cumulative planned points by task endDate
        let plannedAccumulator = 0;
        const plannedPointsSeries = projectDates.map(dateStr => {
          const pointsPlannedOnDate = dbBacklog.reduce((acc, item) => {
            if (item.endDate) {
              const taskEndDate = item.endDate.split('T')[0];
              if (taskEndDate === dateStr) {
                return acc + (item.taskPoints || 0);
              }
            }
            return acc;
          }, 0);
          plannedAccumulator += pointsPlannedOnDate;
          return plannedAccumulator;
        });

        // Realized (Burnup) series: starts at 0, accumulates points as they are completed
        let completedAccumulator = 0;
        const realizedPointsSeries = projectDates.map(dateStr => {
          const pointsCompletedOnDate = dbBacklog.reduce((acc, item) => {
            if (item.kanbanPhase === 'Completed' && item.endDate) {
              const taskEndDate = item.endDate.split('T')[0];
              if (taskEndDate === dateStr) {
                return acc + (item.taskPoints || 0);
              }
            }
            return acc;
          }, 0);
          completedAccumulator += pointsCompletedOnDate;
          return completedAccumulator;
        });

        // Chart configuration
        const projectBurnupOptions: ApexCharts.ApexOptions = {
          chart: {
            type: 'area',
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'Outfit, Inter, sans-serif',
            zoom: { enabled: false }
          },
          stroke: {
            width: [2, 3, 3],
            curve: 'smooth',
            dashArray: [4, 0, 0]
          },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.3,
              opacityTo: 0.01,
              stops: [0, 90, 100]
            }
          },
          colors: ['#64183f', '#0284c7', '#059669'],
          xaxis: {
            categories: projectDates.map(d => {
              const parts = d.split('-');
              if (parts.length === 3) {
                const day = parts[2];
                const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const monthIdx = parseInt(parts[1], 10) - 1;
                return `${day} ${months[monthIdx]}`;
              }
              return d;
            }),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
              style: { colors: '#94a3b8', fontSize: '10px', fontWeight: 500 }
            }
          },
          yaxis: {
            labels: {
              style: { colors: '#94a3b8', fontSize: '10px', fontWeight: 500 }
            }
          },
          grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } }
          },
          tooltip: {
            theme: 'light',
            shared: true
          },
          legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontWeight: 700,
            labels: { colors: '#475569' }
          }
        };

        const projectBurnupSeries = [
          {
            name: 'Escopo Total (Meta)',
            data: scopePointsSeries
          },
          {
            name: 'Esforço Planejado',
            data: plannedPointsSeries
          },
          {
            name: 'Esforço Concluído',
            data: realizedPointsSeries
          }
        ];

        return (
          <Box sx={{ mt: 0, zIndex: 1, position: 'relative', display: 'flex', flexDirection: 'column', gap: 3, flex: 1, width: '100%' }}>
            {/* KPI Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 3 }}>
              <Paper sx={{ p: 2.5, border: '1px solid #cbd5e1', borderLeft: '5px solid #0284c7', borderRadius: '16px', bgcolor: 'white', boxShadow: 'none' }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Esforço Total do Projeto
                </Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#1E293B', mt: 1 }}>
                  {totalPoints} <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>pts</span>
                </Typography>
              </Paper>
              <Paper sx={{ p: 2.5, border: '1px solid #cbd5e1', borderLeft: '5px solid #059669', borderRadius: '16px', bgcolor: 'white', boxShadow: 'none' }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Esforço Concluído
                </Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', mt: 1 }}>
                  {completedPoints} <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>pts</span>
                </Typography>
              </Paper>
              <Paper sx={{ p: 2.5, border: '1px solid #cbd5e1', borderLeft: '5px solid #ea580c', borderRadius: '16px', bgcolor: 'white', boxShadow: 'none' }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Esforço Restante
                </Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#ea580c', mt: 1 }}>
                  {pendingPoints} <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>pts</span>
                </Typography>
              </Paper>
              <Paper sx={{ p: 2.5, border: '1px solid #cbd5e1', borderLeft: '5px solid #6d28d9', borderRadius: '16px', bgcolor: 'white', boxShadow: 'none' }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Percentual de Conclusão
                </Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#6d28d9', mt: 1 }}>
                  {completionRate}%
                </Typography>
              </Paper>
            </Box>

            {/* Chart Container */}
            <Paper sx={{ p: 3, border: '1px solid #cbd5e1', borderLeft: '6px solid #64183f', borderRadius: '16px', bgcolor: 'white', boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: '900', color: '#1E293B', fontSize: '0.95rem' }}>
                  Gráfico de Burnup do Projeto
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                  Acompanhamento diário da realização de esforço versus o escopo total.
                </Typography>
              </Box>
              <Box sx={{ width: '100%', minHeight: '350px' }}>
                {projectDates.length > 0 ? (
                  <Chart 
                    options={projectBurnupOptions}
                    series={projectBurnupSeries}
                    type="area"
                    height="350"
                  />
                ) : (
                  <Box sx={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', fontStyle: 'italic' }}>
                    Sem dados de cronograma válidos para exibir o burnup.
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        );
      })()}

      {/* 4. Task Detail Side Panel Drawer */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 380, p: 3, borderLeft: '1px solid #e2e8f0' } } }}
      >
        {selectedTask && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>Detalhes da Tarefa</Typography>
              <IconButton onClick={() => setIsDrawerOpen(false)}>
                <Close />
              </IconButton>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Nome</Typography>
                <Typography variant="body1" sx={{ color: 'slate.800', fontWeight: 'bold', mt: 0.5 }}>{selectedTask.name}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Descrição</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{selectedTask.description || 'Nenhuma descrição fornecida.'}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Datas</Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'medium', mt: 0.5 }}>
                  {selectedTask.start && selectedTask.end ? (
                    `📅 ${selectedTask.start.toLocaleDateString('pt-BR')} a ${selectedTask.end.toLocaleDateString('pt-BR')}`
                  ) : (
                    'Período não definido'
                  )}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Fase / Macro Requisito</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" sx={{ px: 2, py: 0.6, bgcolor: 'primary.light', color: 'primary.main', borderRadius: '12px', fontWeight: 'bold' }}>
                    {selectedTask.phase}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      py: 0.6,
                      bgcolor: selectedTask.status === 'done' ? 'success.light' : selectedTask.status === 'doing' ? 'warning.light' : 'grey.200',
                      color: selectedTask.status === 'done' ? 'success.main' : selectedTask.status === 'doing' ? 'warning.main' : 'grey.800',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {selectedTask.status === 'done' ? 'CONCLUÍDO' : selectedTask.status === 'doing' ? 'EM EXECUÇÃO' : 'PENDENTE'}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Alocados</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                  {selectedTask.resources.map((res, i) => {
                    const avatarObj = res.avatar ? getAvatarById(res.avatar) : null;
                    return (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid #e2e8f0', p: 0.5, pr: 1.5, borderRadius: '20px', bgcolor: 'white' }}>
                        <Avatar
                          alt={res.nome}
                          sx={{
                            width: 20,
                            height: 20,
                            background: avatarObj ? avatarObj.gradient : undefined,
                          }}
                        >
                          {avatarObj ? avatarObj.icon : res.nome.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{res.nome}</Typography>
                      </Box>
                    );
                  })}
                  {selectedTask.resources.length === 0 && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Nenhum recurso alocado.</Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Task Logs / Change History */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Histórico de Alterações</Typography>
              <List dense sx={{ overflowY: 'auto', flex: 1, border: '1px solid #f1f5f9', borderRadius: '12px', bgcolor: '#fafbfc' }}>
                <ListItem>
                  <ListItemText
                    primary="Tarefa criada no backlog do projeto"
                    secondary="Sincronização do Oracle DB"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Alinhamento e cálculo de cronograma automático executado"
                    secondary="Solver de agendamento"
                  />
                </ListItem>
              </List>
            </Box>
          </Box>
        )}
      </Drawer>

      <Dialog
        open={Boolean(kanbanDateEditorTask)}
        onClose={handleCloseKanbanDateEditor}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#64183f', background: '#FAF4EF', borderBottom: '2px solid #E5D5C8' }}>
          Editar Tarefa
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, display: 'flex', flexDirection: 'column', gap: 2.5, minHeight: '400px' }}>
          
          {/* Top Section: Responsável & Substituto & Dates */}
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'row', gap: 4, justifyContent: 'center', width: '100%' }}>
              
              {/* Responsável Atual + Data de Início */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '160px', alignItems: 'center' }}>
                <Typography sx={{ alignSelf: 'center', color: '#64183f', fontSize: '0.68rem', fontWeight: 800, mb: 1, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Responsável
                </Typography>
                {(() => {
                  const origId = kanbanDateEditorTask?.resourceId;
                  const resMember = squad.find(s => String(s.id) === String(origId));
                  return renderAvatarOnly(
                    resMember ? {
                      nome: resMember.nome,
                      perfil: resMember.perfil || 'Responsável',
                      avatar: resMember.avatar,
                      avatarImage: resMember.avatarImage
                    } : null,
                    'Responsável'
                  );
                })()}
                <TextField
                  fullWidth
                  label="Data de Início"
                  type="date"
                  size="small"
                  value={kanbanEditStartDate}
                  onChange={(e) => setKanbanEditStartDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={isSavingKanbanDates || !canWrite}
                />
              </Box>

              {/* Substituir / Novo Responsável + Data de Término */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '160px', alignItems: 'center' }}>
                <Typography sx={{ alignSelf: 'center', color: '#64183f', fontSize: '0.68rem', fontWeight: 800, mb: 1, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Substituir
                </Typography>
                {(() => {
                  const origId = kanbanDateEditorTask?.resourceId;
                  const isNewSelected = kanbanEditResourceId !== null && String(kanbanEditResourceId) !== String(origId);
                  const newMember = isNewSelected ? squad.find(s => String(s.id) === String(kanbanEditResourceId)) : null;
                  
                  return renderAvatarOnly(
                    newMember ? {
                      nome: newMember.nome,
                      perfil: newMember.perfil || 'Substituto',
                      avatar: newMember.avatar,
                      avatarImage: newMember.avatarImage
                    } : null,
                    'Substituto',
                    () => canWrite && setKanbanSelectorOpen(true),
                    (isNewSelected && canWrite) ? () => setKanbanEditResourceId(origId || null) : undefined
                  );
                })()}
                <TextField
                  fullWidth
                  label="Data de Término"
                  type="date"
                  size="small"
                  value={kanbanEditEndDate}
                  onChange={(e) => setKanbanEditEndDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={isSavingKanbanDates || !canWrite}
                />
              </Box>
            </Box>

            {/* Jira and Wiki Links */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, width: '100%', px: 1 }}>
              <TextField
                fullWidth
                label="Link do Jira"
                placeholder="https://jira.minsait.com/browse/..."
                size="small"
                value={kanbanEditLinkJira}
                onChange={(e) => setKanbanEditLinkJira(e.target.value)}
                disabled={isSavingKanbanDates || !canWrite}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        {kanbanEditLinkJira ? (
                          <a href={kanbanEditLinkJira} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', textDecoration: 'none' }}>
                            <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { transform: 'scale(1.15)', transition: 'transform 0.2s' } }} title="Abrir Jira">
                              <JiraIcon size={18} />
                            </Box>
                          </a>
                        ) : (
                          <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.25, filter: 'grayscale(1)' }} title="Link do Jira não preenchido">
                            <JiraIcon size={18} />
                          </Box>
                        )}
                      </InputAdornment>
                    )
                  }
                }}
              />
              <TextField
                fullWidth
                label="Link da Wiki"
                placeholder="https://wiki.minsait.com/pages/..."
                size="small"
                value={kanbanEditLinkWiki}
                onChange={(e) => setKanbanEditLinkWiki(e.target.value)}
                disabled={isSavingKanbanDates || !canWrite}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        {kanbanEditLinkWiki ? (
                          <a href={kanbanEditLinkWiki} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', textDecoration: 'none' }}>
                            <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { transform: 'scale(1.15)', transition: 'transform 0.2s' } }} title="Abrir Confluence">
                              <ConfluenceIcon size={18} />
                            </Box>
                          </a>
                        ) : (
                          <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.25, filter: 'grayscale(1)' }} title="Link da Wiki não preenchido">
                            <ConfluenceIcon size={18} />
                          </Box>
                        )}
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          {/* Bottom Section: Comments & History */}
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            {/* Tabs Header */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, selectText: 'none' }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {['Comentários', 'Histórico'].map((tab) => {
                  const isActive = commentActiveTab === tab;
                  return (
                    <Button
                      key={tab}
                      onClick={() => setCommentActiveTab(tab as any)}
                      sx={{
                        px: 1,
                        py: 0.5,
                        minWidth: 0,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: isActive ? '#2563eb' : '#64748b',
                        borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                        borderRadius: 0,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: 'transparent',
                          color: '#2563eb'
                        }
                      }}
                    >
                      {tab}
                    </Button>
                  );
                })}
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                Mais recentes primeiro ↓
              </Typography>
            </Box>

            {/* Comment input: visible in 'Comentários' tab */}
            {commentActiveTab === 'Comentários' && (
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center', width: '100%' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  size="small"
                  placeholder="Adicione um comentário..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.8rem',
                      borderRadius: '24px',
                      px: 2
                    }
                  }}
                />
                {newCommentText.trim() && (
                  <IconButton
                    onClick={handleAddComment}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: '#64183f',
                      color: 'white',
                      flexShrink: 0,
                      '&:hover': {
                        bgcolor: '#4a0f2d',
                      }
                    }}
                  >
                    <ArrowRight size={20} weight="bold" />
                  </IconButton>
                )}
              </Box>
            )}

            {/* Comments List (History) */}
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, maxHeight: commentActiveTab === 'Comentários' ? '180px' : '300px', pr: 0.5 }}>
              {(() => {
                const commentsToRender = commentActiveTab === 'Comentários' 
                  ? taskComments.slice(0, 1) 
                  : taskComments;

                if (commentsToRender.length === 0) {
                  return (
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', py: 4 }}>
                      Nenhum comentário registrado.
                    </Typography>
                  );
                }

                return commentsToRender.map((comment) => {
                  const commentAuthor = comment.author || 'Usuário';
                  const initials = commentAuthor.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                  
                  const formatCommentDate = (dateStr: string) => {
                    try {
                      const [datePart, timePart] = dateStr.split(' ');
                      const [y, m, d] = datePart.split('-');
                      const [h, min] = timePart.split(':');
                      const hour = parseInt(h);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const formattedHour = hour % 12 || 12;
                      return `${d}/${m}/${y} ${formattedHour}:${min} ${ampm}`;
                    } catch {
                      return dateStr;
                    }
                  };

                  const member = squad.find(s => s.nome === commentAuthor) || 
                                 rawSquad.find(s => s.nome === commentAuthor);
                  const hasMember = !!member;
                  const avatarObj = hasMember && member.avatar ? getAvatarById(member.avatar) : null;
                  const ringSize = 32;

                  return (
                    <Box key={comment.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'start' }}>
                      {/* Minsait Professional Avatar style (without borders) */}
                      <Box 
                        sx={{ 
                          position: 'relative', 
                          width: ringSize, 
                          height: ringSize, 
                          flexShrink: 0,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          bgcolor: '#1e1e2e'
                        }}
                      >
                        {member?.avatarImage ? (
                          <img src={member.avatarImage} alt={commentAuthor} className="w-full h-full object-cover object-top" />
                        ) : avatarObj ? (
                          <div className="w-full h-full flex items-center justify-center text-white" style={{ background: avatarObj.gradient }}>
                            <div className="scale-[0.85] flex items-center justify-center w-full h-full">
                              {avatarObj.icon}
                            </div>
                          </div>
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white font-black"
                            style={{
                              background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
                              fontSize: ringSize * 0.28,
                            }}
                          >
                            {initials}
                          </div>
                        )}
                      </Box>
                      
                      {/* Content & Meta */}
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{commentAuthor}</span>
                          {' '}adicionou um comentário - {formatCommentDate(comment.createdAt)}
                        </Typography>
                        
                        <Typography sx={{ fontSize: '0.8rem', color: '#1e293b', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                          {comment.content}
                        </Typography>
                      </Box>
                    </Box>
                  );
                });
              })()}
            </Box>
          </Box>

        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, background: '#FAF4EF', borderTop: '2px solid #E5D5C8' }}>
          <Button onClick={handleCloseKanbanDateEditor} disabled={isSavingKanbanDates} sx={{ color: '#666' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveKanbanDates}
            disabled={isSavingKanbanDates || !canWrite}
            sx={{ background: 'linear-gradient(135deg, #64183f 0%, #8B2456 100%)', color: 'white', fontWeight: 'bold' }}
          >
            {isSavingKanbanDates ? 'Gravando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Selector Dialog for Kanban responsible */}
      <Dialog open={kanbanSelectorOpen} onClose={() => setKanbanSelectorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#64183f', background: '#FAF4EF', borderBottom: '2px solid #E5D5C8' }}>
          Selecionar Responsável
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, pb: 2.5 }}>
          <Typography sx={{ color: '#6b7280', fontSize: '0.78rem', mb: 1.5 }}>
            Selecione o perfil para filtrar e clique no card para confirmar.
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="kanban-profile-filter-label">Filtro de Perfil (Múltipla Seleção)</InputLabel>
            <Select
              labelId="kanban-profile-filter-label"
              multiple
              value={kanbanSelectedProfileFilters}
              onChange={(event) => {
                const value = event.target.value;
                setKanbanSelectedProfileFilters(typeof value === 'string' ? value.split(',') : value);
              }}
              input={<OutlinedInput label="Filtro de Perfil (Múltipla Seleção)" />}
              renderValue={(selected) => {
                if (selected.length === 0) return 'Todos os perfis';
                return selected.join(', ');
              }}
            >
              {profileOptions.map((profile) => (
                <MenuItem key={profile} value={profile}>
                  <Checkbox checked={kanbanSelectedProfileFilters.includes(profile)} size="small" />
                  <ListItemText primary={profile} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {filteredSquadMembers.length === 0 ? (
            <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9ca3af' }}>
              <PhosphorUsers size={42} />
              <Typography sx={{ mt: 1, fontWeight: 700, fontSize: '0.85rem' }}>
                Nenhum profissional encontrado para o filtro selecionado.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 1.5, maxHeight: '55vh', overflowY: 'auto', pr: 0.5 }}>
              {filteredSquadMembers.map((member) => (
                <Box
                  key={member.id}
                  onClick={() => {
                    setKanbanEditResourceId(member.id ?? null);
                    setKanbanSelectorOpen(false);
                  }}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'stretch'
                  }}
                >
                  {renderResourceCard(member, true)}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, background: '#FAF4EF', borderTop: '2px solid #E5D5C8' }}>
          <Button onClick={() => setKanbanSelectorOpen(false)} sx={{ color: '#666' }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
