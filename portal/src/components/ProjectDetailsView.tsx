import React, { useEffect, useState, useMemo } from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import { parseRequirementsFile } from '../utils/requirementsParser';
import { CaretLeft, CaretDown, CaretUp, CaretRight, CheckCircle, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, X, MagnifyingGlass, FileText, Calendar, ClipboardText, Play, Flask, Rocket, Check, Gear, Hourglass, FileArrowUp, FileX, FileXls, User, Info, Users, Folder, ArrowsCounterClockwise, ArrowsOut, Trash, WarningCircle, Paperclip } from '@phosphor-icons/react';
import { getAvatarById } from '../utils/avatarRepository';
import type { SquadMember } from '../types';
import { PlanningView } from './PlanningView';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Collapse, Box, IconButton,
  Autocomplete, TextField
} from '@mui/material';


const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)',
  'linear-gradient(135deg, #1a1f44 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
  'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)',
];

const getAvatarGradient = (id: number) => AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const STEP_THEMES = [
  {
    gradient: 'linear-gradient(135deg, #64183f 0%, #3a0d24 100%)',
    primaryColor: '#64183f',
    percentage: 15,
    icon: <MagnifyingGlass size={26} weight="duotone" />
  },
  {
    gradient: 'linear-gradient(135deg, #7c1c53 0%, #290a3b 100%)',
    primaryColor: '#7c1c53',
    percentage: 30,
    icon: <FileText size={26} weight="duotone" />
  },
  {
    gradient: 'linear-gradient(135deg, #511674 0%, #171644 100%)',
    primaryColor: '#511674',
    percentage: 45,
    icon: <Calendar size={26} weight="duotone" />
  },
  {
    gradient: 'linear-gradient(135deg, #3d168a 0%, #121035 100%)',
    primaryColor: '#3d168a',
    percentage: 60,
    icon: <ClipboardText size={26} weight="duotone" />
  },
  {
    gradient: 'linear-gradient(135deg, #25209a 0%, #15143d 100%)',
    primaryColor: '#25209a',
    percentage: 75,
    icon: <Play size={26} weight="duotone" />
  },
  {
    gradient: 'linear-gradient(135deg, #162780 0%, #0b0d25 100%)',
    primaryColor: '#162780',
    percentage: 90,
    icon: <Flask size={26} weight="duotone" />
  },
  {
    gradient: 'linear-gradient(135deg, #8c1640 0%, #1a1f44 100%)',
    primaryColor: '#8c1640',
    percentage: 100,
    icon: <Rocket size={26} weight="duotone" />
  }
];

function ArcRing({ size }: { size: number }) {
  const r_outer = (size / 2) - 1;
  const cx = size / 2;
  const cy = size / 2;
  const r_mid = r_outer - 5;
  const strokeWidthThick = 9;

  const c1 = '#64183f';
  const c2 = '#ec4899';
  const gradId = `arc-grad-project-team-${size}`;

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

export const ProjectDetailsView: React.FC = () => {
  const { 
    viewingProject, 
    setViewingProject, 
    steps, 
    transitions, 
    fetchTransitions,
    fetchProjectsFromDb,
    statuses,
    owners,
    tasks,
    addTasks,
    filters,
    setFilters,
    squad,
    holidays,
    canWrite
  } = usePlanningStore();

  const ownerName = viewingProject ? (owners.find(o => o.id === viewingProject.ownerId)?.name || 'N/A') : 'N/A';

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [selectedStepId] = useState<number | null>(null);
  
  const loggedInUsername = localStorage.getItem('kairos_username') || '';
  const loggedInMember = squad.find(m => {
    if (!m.email) return false;
    const prefix = m.email.split('@')[0].toLowerCase().trim();
    return prefix === loggedInUsername.toLowerCase().trim();
  });

  const availableProfessionals = squad.filter(res => {
    if (loggedInMember && loggedInMember.operationId !== null && loggedInMember.operationId !== undefined) {
      return res.operationId === loggedInMember.operationId;
    }
    return true;
  });
  
  // Custom states for 360 spin and file upload pop-up
  const [rotatingStepId, setRotatingStepId] = useState<number | null>(null);
  const [buildPointsMap, setBuildPointsMap] = useState<{ [key: string]: number }>({ 'MS': 2, 'S': 4, 'M': 8, 'C': 12 });
  const [arqPointsMap, setArqPointsMap] = useState<{ [key: string]: number }>({ 'MS': 2, 'S': 4, 'M': 8, 'C': 12 });
  const [uploadModalStepId, setUploadModalStepId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [previewTasks, setPreviewTasks] = useState<any[]>([]);
  const [isStep2Flipped, setIsStep2Flipped] = useState(false);
  const [isStep4Flipped, setIsStep4Flipped] = useState(false);
  const [isStep5Flipped, setIsStep5Flipped] = useState(false);
  const [isStep6Flipped, setIsStep6Flipped] = useState(false);
  const [isViewingPlanningPhases, setIsViewingPlanningPhases] = useState(false);
  const [activePlanningStep, setActivePlanningStep] = useState<1 | 2 | 3 | 4 | null>(null);
  const [projectBacklog, setProjectBacklog] = useState<any[]>([]);
  const [loadingBacklog, setLoadingBacklog] = useState(false);
  const [orderedPhases, setOrderedPhases] = useState<string[][]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [orderedRequirements, setOrderedRequirements] = useState<string[][]>([]);
  const [customSequences, setCustomSequences] = useState<Record<string, number>>({});
  const [maxTextHeight, setMaxTextHeight] = useState<number>(40);
  const [expandedReqs, setExpandedReqs] = useState<Set<string>>(new Set());
  const [activePhaseCard, setActivePhaseCard] = useState<string | null>(null);
  const [customPhaseSequences, setCustomPhaseSequences] = useState<Record<string, number>>({});
  const [expandedDescs, setExpandedDescs] = useState<Set<string>>(new Set());
  const [taskOrders, setTaskOrders] = useState<Record<string, string[]>>({});
  const [isStep3SidebarExpanded, setIsStep3SidebarExpanded] = useState(true);
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  const [allocations, setAllocations] = useState<Record<string, string[]>>({});
  const [profDetails, setProfDetails] = useState<Record<string, { 
    productivity: number; 
    isPartTime: boolean; 
    startDates: Record<string, string>; 
    endDates?: Record<string, string>;
  }>>({});
  const [editingProfessional, setEditingProfessional] = useState<SquadMember | null>(null);
  const [productivityPct, setProductivityPct] = useState<number>(100);
  const [isPartTime, setIsPartTime] = useState<boolean>(false);
  const [activityStartDates, setActivityStartDates] = useState<Record<string, string>>({});
  const [activityEndDates, setActivityEndDates] = useState<Record<string, string>>({});
  const [isSavingAllocations, setIsSavingAllocations] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPlanningHeaderCollapsed, setIsPlanningHeaderCollapsed] = useState(false);
  const [isProjectHeaderCollapsed, setIsProjectHeaderCollapsed] = useState(false);
  const [isCreatingPlanning, setIsCreatingPlanning] = useState(false);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [profsWithPendingChanges, setProfsWithPendingChanges] = useState<Set<string>>(new Set());

  // Step 7 Changes state
  const [viewingProjectChanges, setViewingProjectChanges] = useState(false);
  const [loadingChanges, setLoadingChanges] = useState(false);
  const [isHeaderCollapsedChanges, setIsHeaderCollapsedChanges] = useState(false);

  // Dependencies drawer states
  const [dependencyDrawerOpen, setDependencyDrawerOpen] = useState(false);
  const [selectedDependencyTarget, setSelectedDependencyTarget] = useState<{
    type: 'requirement' | 'description' | 'subtask';
    id: string;
    name: string;
    requirementName?: string;
    descGroupText?: string;
  } | null>(null);
  const [requirementDependencies, setRequirementDependencies] = useState<Record<string, string[]>>({});
  const [descriptionDependencies, setDescriptionDependencies] = useState<Record<string, string[]>>({});
  const [subtaskDependencies, setSubtaskDependencies] = useState<Record<string, string[]>>({});
  const [savingChanges, setSavingChanges] = useState(false);
  const [showConclusionModal, setShowConclusionModal] = useState(false);
  const [changesList, setChangesList] = useState<Array<{
    id: string;
    chgNumber: string;
    description: string;
    predictedDate: string;
    predictedTime: string;
    responsibleId: number | '';
    statusId?: number;
    scale: Array<{
      id: string;
      analystId: number | '';
      startDate: string;
      startTime: string;
      endDate: string;
      endTime: string;
      observations: string;
    }>;
  }>>(() => [
    {
      id: String(Date.now()),
      chgNumber: '',
      description: '',
      predictedDate: '',
      predictedTime: '00:00',
      responsibleId: '',
      scale: []
    }
  ]);
  const [activeChangeIndex, setActiveChangeIndex] = useState<number>(0);

  // Step 8 Incidents state
  const [viewingPostImplantation, setViewingPostImplantation] = useState(false);
  const [incidentsList, setIncidentsList] = useState<Array<{ id: string; incidentNumber: string; incidentDate: string; changeId: number | ''; comments: string; }>>([]);
  const [, setLoadingIncidents] = useState(false);
  const [savingIncidents, setSavingIncidents] = useState(false);

  const loadProjectIncidents = async () => {
    if (!viewingProject) return;
    setLoadingIncidents(true);
    try {
      const res = await fetch(`/api/projects/${viewingProject.id}/incidents`);
      if (res.ok) {
        const data = await res.json();
        setIncidentsList(data.map((item: any) => ({
          id: String(item.id),
          incidentNumber: item.incidentNumber || '',
          incidentDate: item.incidentDate || '',
          changeId: item.changeId || '',
          comments: item.comments || ''
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIncidents(false);
    }
  };
 
  const loadProjectChanges = async () => {
    if (!viewingProject) return;
    setLoadingChanges(true);
    try {
      const res = await fetch(`/api/projects/${viewingProject.id}/change`);
      if (!res.ok) throw new Error('Erro ao buscar dados da mudança.');
      const data = await res.json();
      const defaultChg = {
        id: String(Date.now()),
        chgNumber: '',
        description: '',
        predictedDate: '',
        predictedTime: '00:00',
        responsibleId: '' as number | '',
        statusId: undefined as number | undefined,
        scale: [] as Array<{
          id: string;
          analystId: number | '';
          startDate: string;
          startTime: string;
          endDate: string;
          endTime: string;
          observations: string;
        }>
      };

      if (data) {
        const rawList = Array.isArray(data) ? data : [data];
        const parsedList = rawList.map((item: any, idx: number) => ({
          id: item.id || String(Date.now() + idx),
          chgNumber: item.chgNumber || '',
          description: item.description || '',
          predictedDate: item.predictedDate || '',
          predictedTime: item.predictedTime || '00:00',
          responsibleId: item.responsibleId || '',
          statusId: item.statusId,
          scale: Array.isArray(item.scale) ? item.scale.map((sItem: any, sIdx: number) => ({
            id: sItem.id || String(Date.now() + idx * 1000 + sIdx),
            analystId: sItem.analystId || '',
            startDate: sItem.startDate || '',
            startTime: sItem.startTime || '00:00',
            endDate: sItem.endDate || '',
            endTime: sItem.endTime || '00:00',
            observations: sItem.observations || ''
          })) : []
        }));
        setChangesList(parsedList.length > 0 ? parsedList : [defaultChg]);
      } else {
        setChangesList([defaultChg]);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados de mudanças.');
    } finally {
      setLoadingChanges(false);
    }
  };

  useEffect(() => {
    if (viewingProject) {
      loadProjectChanges();
      loadProjectIncidents();
    }
  }, [viewingProject]);

  const handleSaveChangeData = async () => {
    if (!viewingProject) return;
    
    for (let idx = 0; idx < changesList.length; idx++) {
      const chg = changesList[idx];
      const chgLabel = chg.chgNumber.trim() ? `CHG ${chg.chgNumber}` : `Aba ${idx + 1}`;

      if (!chg.chgNumber.trim()) {
        alert(`O Número CHG é obrigatório (${chgLabel}).`);
        return;
      }
      if (chg.chgNumber.length > 30) {
        alert(`O Número CHG deve ter no máximo 30 caracteres (${chgLabel}).`);
        return;
      }
      if (!chg.description.trim()) {
        alert(`A Descrição é obrigatória (${chgLabel}).`);
        return;
      }
      if (chg.description.length > 100) {
        alert(`A Descrição deve ter no máximo 100 caracteres (${chgLabel}).`);
        return;
      }
      if (!chg.predictedDate) {
        alert(`A Data Prevista é obrigatória (${chgLabel}).`);
        return;
      }
      if (!chg.responsibleId) {
        alert(`O Responsável é obrigatório (${chgLabel}).`);
        return;
      }
      
      for (let i = 0; i < chg.scale.length; i++) {
        const item = chg.scale[i];
        if (!item.analystId) {
          alert(`Selecione o analista na linha ${i + 1} da escala (${chgLabel}).`);
          return;
        }
        if (!item.startDate) {
          alert(`Selecione a data de início na linha ${i + 1} da escala (${chgLabel}).`);
          return;
        }
        if (!item.endDate) {
          alert(`Selecione a data de fim na linha ${i + 1} da escala (${chgLabel}).`);
          return;
        }
      }
    }

    setSavingChanges(true);
    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changesList)
      });
      if (!response.ok) {
        throw new Error('Erro ao salvar os dados da mudança.');
      }
      showToast('Dados da mudança salvos com sucesso!', 'success');
      loadProjectChanges();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao salvar os dados da mudança.', 'error');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleConcludeChange = async (newStatusId: number) => {
    if (!viewingProject) return;
    const chg = changesList[activeChangeIndex];
    if (!chg) return;

    setShowConclusionModal(false);
    setSavingChanges(true);

    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/change/${chg.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: newStatusId })
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar o status da mudança.');
      }
      const patchData = await response.json();
      showToast('Status da mudança atualizado com sucesso!', 'success');

      // Update local state temporarily to calculate conclusion
      const updatedChangesList = changesList.map((item, idx) => 
        idx === activeChangeIndex ? { ...item, statusId: newStatusId } : item
      );
      setChangesList(updatedChangesList);

      if (patchData.projectUpdated && patchData.newProjectStatusId) {
        await fetchProjectsFromDb();
        setViewingProject({
          ...viewingProject,
          stepId: patchData.newProjectStepId || viewingProject.stepId,
          statusId: patchData.newProjectStatusId
        });
      }

      const allConcluded = updatedChangesList.every(item => {
        const originalStatusName = statuses.find(s => s.id === item.statusId)?.name || '';
        const statusName = originalStatusName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return statusName.includes('CONCLUIDO') || statusName.includes('CONCLUÍDO');
      });

      if (allConcluded) {
        const approveResponse = await fetch(`/api/projects/${viewingProject.id}/approve-backlog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldStepId: 7 })
        });
        if (approveResponse.ok) {
          const resData = await approveResponse.json();
          await fetchProjectsFromDb();
          await fetchTransitions(viewingProject.id);
          
          setViewingProject({
            ...viewingProject,
            stepId: resData.newStepId,
            statusId: resData.newStatusId
          });
          showToast('Mudança salva. Todas as mudanças concluídas: Step 07 atualizado para CONCLUÍDO!', 'success');
        }
      } else {
        setViewingProject({
          ...viewingProject,
          stepId: 7,
          statusId: 1
        });
      }

      loadProjectChanges();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao atualizar o status da mudança.', 'error');
    } finally {
      setSavingChanges(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    if (isViewingPlanningPhases && orderedPhases.length > 0) {
      const timer = setTimeout(() => {
        const elements = document.querySelectorAll('.phase-title-text');
        let maxH = 40;
        elements.forEach((el) => {
          const h = el.clientHeight;
          if (h > maxH) maxH = h;
        });
        setMaxTextHeight(maxH);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [orderedPhases, isViewingPlanningPhases]);


  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'xlsx' || extension === 'xlsm' || extension === 'xls') {
      setSelectedFile(file);
    } else {
      setErrorMsg('Formato de arquivo inválido. Por favor, envie apenas arquivos .xlsx, .xlsm ou .xls.');
      setSelectedFile(null);
    }
  };

  const handleCloseModal = () => {
    setUploadModalStepId(null);
    setSelectedFile(null);
    setPreviewTasks([]);
    setWizardStep(1);
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingFile(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile || !uploadModalStepId) return;
    setLoadingFile(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const data = await parseRequirementsFile(selectedFile, { filterByParameters: true });
      if (data.buildComplexityPoints) {
        setBuildPointsMap(data.buildComplexityPoints);
      }
      if (data.arqComplexityPoints) {
        setArqPointsMap(data.arqComplexityPoints);
      }

      // Calculate next JIRA base number
      let maxNum = 0;
      tasks.forEach(t => {
        const match = t.idJira.match(/^JIR_(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextJiraBase = maxNum + 1;
      const uniqueMacros = Array.from(new Set(data.rows.map(r => r.macroRequisito)));
      const macroToJiraMap: { [key: string]: string } = {};
      uniqueMacros.forEach((macro, idx) => {
        const numStr = String(nextJiraBase + idx).padStart(2, '0');
        macroToJiraMap[macro] = `JIR_${numStr}`;
      });

      // Group data.rows by macroRequisito + tarefa
      const groups: { [key: string]: typeof data.rows } = {};
      data.rows.forEach(row => {
        const key = `${row.macroRequisito}||${row.tarefa}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      });

      const parsedTasks = Object.keys(groups).map(key => {
        const [macroRequisito, tarefa] = key.split('||');
        const rowsInGroup = groups[key];
        
        let totalPoints = 0;
        const complexities: string[] = [];
        const systems: string[] = [];
        
        rowsInGroup.forEach(r => {
          let points = 2;
          const valUpper = r.valor.toUpperCase();
          const isBuild = r.tipo.toLowerCase().includes('build');
          if (isBuild && data.buildComplexityPoints && data.buildComplexityPoints[valUpper] !== undefined) {
            points = data.buildComplexityPoints[valUpper];
          } else if (!isBuild && data.arqComplexityPoints && data.arqComplexityPoints[valUpper] !== undefined) {
            points = data.arqComplexityPoints[valUpper];
          } else {
            switch (valUpper) {
              case 'MS': points = 2; break;
              case 'S': points = 4; break;
              case 'M': points = 8; break;
              case 'C': points = 12; break;
            }
          }
          totalPoints += points;
          complexities.push(r.valor);
          systems.push(r.tecnologia);
        });

        const jiraId = macroToJiraMap[macroRequisito] || 'JIR_NEW';

        return {
          idJira: jiraId,
          sistema: Array.from(new Set(systems)).join(', '),
          perfil: 'Ambos',
          idBacklog: 'Build e Arq & Design',
          task: `${macroRequisito} - ${Array.from(new Set(systems)).join(', ')}`,
          abreviacao: 'Ambos',
          tarefaPai: null,
          status: 'backlog' as const,
          nome: '',
          sequencia: 2,
          pontos: totalPoints,
          dtInicio: null,
          dtFim: null,
          macroRequisito,
          tarefa,
          complexidade: Array.from(new Set(complexities)).join(', '),
          rows: rowsInGroup
        };
      });

      const newTasks: any[] = [];
      if (data.escritaFuncionalDoc) {
        const valUpper = data.escritaFuncionalDoc.toUpperCase().trim();
        const parsedPoints = parseFloat(valUpper);
        let points = 2;
        if (!isNaN(parsedPoints)) {
          points = parsedPoints;
        } else if (data.arqComplexityPoints && data.arqComplexityPoints[valUpper] !== undefined) {
          points = data.arqComplexityPoints[valUpper];
        } else {
          switch (valUpper) {
            case 'MS': points = 2; break;
            case 'S': points = 4; break;
            case 'M': points = 8; break;
            case 'C': points = 12; break;
          }
        }

        const docRow = {
          macroRequisito: 'EF - Escrita Funcional',
          tarefa: 'Funcional (Documentação)',
          tecnologia: 'Documentação',
          tipo: 'Escrita Funcional',
          valor: data.escritaFuncionalDoc,
          documentacao: data.escritaFuncionalDoc
        };

        newTasks.push({
          idJira: 'EF_ESCRITA_FUNCIONAL',
          sistema: 'Documentação',
          perfil: 'Arquiteto',
          idBacklog: 'Escrita Funcional',
          task: 'EF - Escrita Funcional',
          abreviacao: 'ITS',
          tarefaPai: null,
          status: 'backlog' as const,
          nome: '',
          sequencia: 1,
          pontos: points,
          dtInicio: null,
          dtFim: null,
          macroRequisito: 'EF - Escrita Funcional',
          tarefa: 'Funcional (Documentação)',
          complexidade: data.escritaFuncionalDoc,
          rows: [docRow],
          isDocRow: true
        });
      }

      newTasks.push(...parsedTasks);
      setPreviewTasks(newTasks);
      setFilters(prev => ({
        ...prev,
        backlogMacroRequisito: '', 
        backlogTarefa: '', 
        backlogBuildTechs: '', 
        backlogArqTechs: '', 
        backlogComplexidades: '',
        searchQuery: ''
      }));
      setWizardStep(2);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao processar a planilha de estimativa.');
      setPreviewTasks([]);
    } finally {
      setLoadingFile(false);
    }
  };

  const handleImportToBacklog = async () => {
    if (previewTasks.length === 0 || !uploadModalStepId || !viewingProject) return;

    setLoadingFile(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Map previewTasks to DB backlog structure
    const backlogItems: any[] = [];
    previewTasks.forEach(pt => {
      pt.rows.forEach((row: any) => {
        const isBuild = (row.tipo || '').toLowerCase().includes('build');
        const valUpper = (row.valor || '').toUpperCase();
        let points = pt.pontos;
        if (!pt.isDocRow) {
          if (isBuild && buildPointsMap[valUpper] !== undefined) {
            points = buildPointsMap[valUpper];
          } else if (!isBuild && arqPointsMap[valUpper] !== undefined) {
            points = arqPointsMap[valUpper];
          } else {
            switch (valUpper) {
              case 'MS': points = 2; break;
              case 'S': points = 4; break;
              case 'M': points = 8; break;
              case 'C': points = 12; break;
            }
          }
        }

        let phase = '';
        if ((row.tipo || '').toLowerCase().includes('build')) {
          phase = 'BUILD';
        } else if ((row.tipo || '').toLowerCase().includes('arq') || (row.tipo || '').toLowerCase().includes('design')) {
          phase = 'ARQ & DESIGN';
        }

        backlogItems.push({
          taskName: row.macroRequisito || '',
          taskDescription: row.tarefa || '',
          taskPhase: phase,
          taskTechnology: row.tecnologia || '',
          taskPoints: points
        });
      });
    });

    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/approve-backlog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldStepId: uploadModalStepId,
          backlog: backlogItems
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao registrar a transição no banco de dados.');
      }

      const resData = await response.json();

      const finalTasks: any[] = [];
      previewTasks.forEach(pt => {
        const jiraId = pt.idJira;
        
        pt.rows.forEach((row: any) => {
          const isBuild = (row.tipo || '').toLowerCase().includes('build');
          const valUpper = (row.valor || '').toUpperCase();
          let points = 2;
          if (isBuild && buildPointsMap[valUpper] !== undefined) {
            points = buildPointsMap[valUpper];
          } else if (!isBuild && arqPointsMap[valUpper] !== undefined) {
            points = arqPointsMap[valUpper];
          } else {
            switch (valUpper) {
              case 'MS': points = 2; break;
              case 'S': points = 4; break;
              case 'M': points = 8; break;
              case 'C': points = 12; break;
            }
          }

          finalTasks.push({
            idJira: jiraId,
            sistema: row.tecnologia,
            perfil: isBuild ? 'Dev' : 'Arquiteto',
            idBacklog: row.tipo,
            task: `${row.macroRequisito} - ${row.tecnologia} (${row.tipo})`,
            abreviacao: isBuild ? 'Dev' : 'ITS',
            tarefaPai: null,
            status: 'backlog' as const,
            nome: '',
            sequencia: isBuild ? 2 : 1,
            pontos: points,
            dtInicio: null,
            dtFim: null
          });
        });
      });

      addTasks(finalTasks, false);
      
      // Recarrega os projetos a partir do banco de dados
      await fetchProjectsFromDb();
      
      // Atualiza o projeto sendo visualizado para atualizar a barra de progresso e informações da etapa
      if (viewingProject) {
        setViewingProject({
          ...viewingProject,
          stepId: resData.newStepId,
          statusId: resData.newStatusId
        });
      }

      handleCloseModal();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao aprovar o backlog.');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleApproveStep2 = async () => {
    if (!viewingProject) return;
    setLoadingFile(true);
    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/approve-backlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldStepId: 2 })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao aprovar o step 2 no banco de dados.');
      }

      const resData = await response.json();
      
      // Recarrega os projetos e transições
      await fetchProjectsFromDb();
      await fetchTransitions(viewingProject.id);

      // Atualiza o projeto ativo no estado local
      if (viewingProject) {
        setViewingProject({
          ...viewingProject,
          stepId: resData.newStepId,
          statusId: resData.newStatusId
        });
      }

      setIsStep2Flipped(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao aprovar o step 2.');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleRejectStep2 = async () => {
    if (!viewingProject) return;
    setLoadingFile(true);
    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/reject-backlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldStepId: 2 })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao reprovar no banco de dados.');
      }

      const resData = await response.json();

      // Recarrega os projetos e transições
      await fetchProjectsFromDb();
      await fetchTransitions(viewingProject.id);

      // Atualiza o projeto ativo no estado local
      if (viewingProject) {
        setViewingProject({
          ...viewingProject,
          stepId: resData.newStepId,
          statusId: resData.newStatusId
        });
      }

      setIsStep2Flipped(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao reprovar.');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleApproveStep4 = async () => {
    if (!viewingProject) return;
    setLoadingFile(true);
    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/approve-backlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldStepId: 4 })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao aprovar o step 4 no banco de dados.');
      }

      const resData = await response.json();
      
      await fetchProjectsFromDb();
      await fetchTransitions(viewingProject.id);

      if (viewingProject) {
        setViewingProject({
          ...viewingProject,
          stepId: resData.newStepId,
          statusId: resData.newStatusId
        });
      }

      setIsStep4Flipped(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao aprovar o step 4.');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleRejectStep4 = async () => {
    if (!viewingProject) return;
    setLoadingFile(true);
    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/reject-backlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldStepId: 4 })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao reprovar no banco de dados.');
      }

      const resData = await response.json();

      await fetchProjectsFromDb();
      await fetchTransitions(viewingProject.id);

      if (viewingProject) {
        setViewingProject({
          ...viewingProject,
          stepId: resData.newStepId,
          statusId: resData.newStatusId
        });
      }

      setIsStep4Flipped(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao reprovar.');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleApproveStep5 = async () => {
    if (!viewingProject) return;
    setLoadingFile(true);
    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/approve-backlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldStepId: 5 })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao aprovar o step 5 no banco de dados.');
      }

      const resData = await response.json();
      
      await fetchProjectsFromDb();
      await fetchTransitions(viewingProject.id);

      if (viewingProject) {
        setViewingProject({
          ...viewingProject,
          stepId: resData.newStepId,
          statusId: resData.newStatusId
        });
      }

      setIsStep5Flipped(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao aprovar o step 5.');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleApproveStep6 = async () => {
    if (!viewingProject) return;
    setLoadingFile(true);
    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/approve-backlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldStepId: 6 })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao concluir o step 6.');
      }

      const resData = await response.json();
      
      await fetchProjectsFromDb();
      await fetchTransitions(viewingProject.id);

      if (viewingProject) {
        setViewingProject({
          ...viewingProject,
          stepId: resData.newStepId,
          statusId: resData.newStatusId
        });
      }

      setIsStep6Flipped(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao concluir.');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleRejectStep6 = async () => {
    if (!viewingProject) return;
    setLoadingFile(true);
    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/reject-backlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldStepId: 6 })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao cancelar o step 6.');
      }

      const resData = await response.json();

      await fetchProjectsFromDb();
      await fetchTransitions(viewingProject.id);

      if (viewingProject) {
        setViewingProject({
          ...viewingProject,
          stepId: resData.newStepId,
          statusId: resData.newStatusId
        });
      }

      setIsStep6Flipped(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao cancelar.');
    } finally {
      setLoadingFile(false);
    }
  };



  const fetchProjectBacklog = async (projectId: number) => {
    setLoadingBacklog(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/backlog`);
      if (response.ok) {
        const data = await response.json();
        setProjectBacklog(data);

        // Map database backlog to the PlanningStore Task format
        const mappedTasks = data.map((item: any) => {
          const resource = squad.find(s => s.id === item.resourceId);
          const resourceName = resource ? resource.nome : '';

          const isBuild = (item.taskPhase || '').toLowerCase().includes('build');
          const perfil = isBuild ? 'Dev' : 'Arquiteto';
          let abreviacao = 'Task';
          if ((item.taskPhase || '').toLowerCase().includes('funcional')) {
            abreviacao = 'EF';
          } else if ((item.taskPhase || '').toLowerCase().includes('its') || perfil.toLowerCase().includes('arquiteto')) {
            abreviacao = 'ITS';
          } else if (isBuild || perfil.toLowerCase().includes('dev')) {
            abreviacao = 'Dev';
          } else if ((item.taskPhase || '').toLowerCase().includes('banco')) {
            abreviacao = 'BD';
          }

          return {
            idJira: item.taskName || 'JIR_NEW',
            sistema: viewingProject?.projectId || '',
            perfil,
            idBacklog: item.taskPhase || '',
            task: `${item.taskName || ''} - ${item.taskTechnology || ''} (${item.taskPhase || ''})`,
            abreviacao,
            tarefaPai: null,
            status: 'backlog' as const,
            nome: resourceName,
            sequencia: Number(item.taskSequence) || 1,
            pontos: item.taskPoints || 0,
            dtInicio: item.initialDate || null,
            dtFim: item.endDate || null
          };
        });

        addTasks(mappedTasks, true);
      }

      // Fetch saved phase sequence from the database
      const phasesRes = await fetch(`/api/projects/${projectId}/phases`);
      if (phasesRes.ok) {
        const phasesData = await phasesRes.json();
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
      }

      // Fetch saved allocations from the database
      const allocsRes = await fetch(`/api/projects/${projectId}/allocations`);
      if (allocsRes.ok) {
        const allocsData = await allocsRes.json();
        const newAllocations: Record<string, string[]> = {};
        const newProfDetails: Record<string, { 
          productivity: number; 
          isPartTime: boolean; 
          startDates: Record<string, string>; 
          endDates?: Record<string, string>;
        }> = {};

        allocsData.forEach((item: any) => {
          const prof = squad.find(s => s.id === item.resourceId);
          if (prof) {
            const profName = prof.nome;
            const key = `${item.phaseName}-${item.taskTechnology}`;
            
            if (!newAllocations[key]) {
              newAllocations[key] = [];
            }
            if (!newAllocations[key].includes(profName)) {
              newAllocations[key].push(profName);
            }

            if (!newProfDetails[profName]) {
              newProfDetails[profName] = {
                productivity: item.percProductivity,
                isPartTime: item.allocationPerc === 0.5,
                startDates: {},
                endDates: {}
              };
            }
            newProfDetails[profName].startDates[key] = item.initialDate;
            if (item.endDate) {
              if (!newProfDetails[profName].endDates) {
                newProfDetails[profName].endDates = {};
              }
              newProfDetails[profName].endDates[key] = item.endDate;
            }
          }
        });

        setAllocations(newAllocations);
        setProfDetails(newProfDetails);
      } else {
        setAllocations({});
        setProfDetails({});
      }
    } catch (e) {
      console.error('Failed to fetch backlog/allocations:', e);
    } finally {
      setLoadingBacklog(false);
    }
  };

  const handleSaveAllocations = async () => {
    if (!viewingProject) return;
    setIsSavingAllocations(true);
    
    const allocationsPayload: any[] = [];
    
    Object.keys(allocations).forEach(key => {
      const parts = key.split('-');
      if (parts.length < 2) return;
      const phaseName = parts[0];
      const taskTechnology = parts.slice(1).join('-');
      
      const allocatedNames = allocations[key] || [];
      allocatedNames.forEach(profName => {
        const member = squad.find(s => s.nome === profName);
        if (!member) return;
        
        const details = profDetails[profName] || { productivity: 100, isPartTime: false, startDates: {}, endDates: {} };
        const initialDate = details.startDates[key] || new Date().toISOString().split('T')[0];
        const endDate = details.endDates?.[key] || null;
        
        allocationsPayload.push({
          projectId: viewingProject.id,
          resourceId: member.id,
          phaseName,
          taskTechnology,
          initialDate,
          endDate,
          percProductivity: details.productivity,
          allocationPerc: details.isPartTime ? 0.5 : 1.0
        });
      });
    });
    
    try {
      const response = await fetch(`/api/projects/${viewingProject.id}/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ allocations: allocationsPayload })
      });
      
      if (response.ok) {
        showToast('Alocações salvas com sucesso!', 'success');
        setHasPendingSync(true);
        setProfsWithPendingChanges(new Set());
      } else {
        const errData = await response.json();
        showToast(`Erro ao salvar alocações: ${errData.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Erro de rede ao salvar alocações: ${err.message}`, 'error');
    } finally {
      setIsSavingAllocations(false);
    }
  };

  const handleCreatePlanning = async () => {
    if (!viewingProject) return;
    setIsCreatingPlanning(true);
    try {
      const formattedHolidays = holidays.map(h => h.date);
      const response = await fetch(`/api/projects/${viewingProject.id}/create-planning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ holidays: formattedHolidays })
      });

      if (response.ok) {
        if (viewingProject.stepId === 3) {
          // Transition step 3 (Planning) to step 4 (Planning in Approval)
          const approveResponse = await fetch(`/api/projects/${viewingProject.id}/approve-backlog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldStepId: 3 })
          });
          
          if (approveResponse.ok) {
            const resData = await approveResponse.json();
            await fetchProjectsFromDb();
            await fetchTransitions(viewingProject.id);
            
            if (viewingProject) {
              setViewingProject({
                ...viewingProject,
                stepId: resData.newStepId,
                statusId: resData.newStatusId
              });
            }
            showToast('Planejamento sincronizado e enviado para aprovação!', 'success');
            // Keep user in Planning screen after sync.
          } else {
            await fetchProjectBacklog(viewingProject.id);
            showToast('Planejamento criado, mas erro ao enviar para aprovação.', 'error');
          }
        } else {
          // Already in step 4 or other, just refresh and keep Planning screen open.
          await fetchProjectsFromDb();
          await fetchTransitions(viewingProject.id);
          showToast('Planejamento sincronizado com sucesso!', 'success');
        }
        
        setHasPendingSync(false);
        window.dispatchEvent(new CustomEvent('refresh-planning-gantt'));
      } else {
        const errData = await response.json();
        showToast(`Erro ao criar planejamento: ${errData.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Erro de rede ao criar planejamento: ${err.message}`, 'error');
    } finally {
      setIsCreatingPlanning(false);
    }
  };

  const distinctPhases = useMemo(() => {
    const phases = projectBacklog
      .map(item => item.taskPhase && item.taskPhase.trim() ? item.taskPhase.trim().toUpperCase() : '')
      .filter(Boolean);
    return Array.from(new Set(phases)).sort();
  }, [projectBacklog]);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | 'center' | null>(null);

  useEffect(() => {
    if (distinctPhases.length > 0) {
      setOrderedPhases(prev => {
        if (prev.length > 0) {
          const tracked = prev.flat();
          const newPhases = distinctPhases.filter(p => !tracked.includes(p));
          const updatedPrev = prev
            .map(group => group.filter(p => distinctPhases.includes(p)))
            .filter(group => group.length > 0);
          return [...updatedPrev, ...newPhases.map(p => [p])];
        } else {
          // Priority ordering fallback: Documentação, ARQ & DESIGN, BUILD
          const priorityOrder = ['DOCUMENTACAO', 'DOCUMENTAÇÃO', 'ARQ & DESIGN', 'BUILD'];
          const sorted = [...distinctPhases].sort((a, b) => {
            const uA = a.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const uB = b.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const idxA = priorityOrder.findIndex(p => {
              const normP = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              return uA.includes(normP) || normP.includes(uA);
            });
            const idxB = priorityOrder.findIndex(p => {
              const normP = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              return uB.includes(normP) || normP.includes(uB);
            });
            const valA = idxA === -1 ? 999 : idxA;
            const valB = idxB === -1 ? 999 : idxB;
            return valA - valB;
          });
          return sorted.map(p => [p]);
        }
      });
    } else {
      setOrderedPhases([]);
    }
  }, [distinctPhases]);

  const savePhaseSequence = async (phasesList: string[][], customPhaseSeqs: Record<string, number>) => {
    if (!viewingProject) return;

    // Calculate display sequences exactly like the card layout rendering
    const phaseDisplaySeqs: Record<string, number> = {};
    let lastSeq = 1;
    let lastRaw = 1;
    phasesList.forEach((group, idx) => {
      const name = group[0];
      const raw = customPhaseSeqs[name] ?? (idx + 1);
      if (idx === 0) {
        phaseDisplaySeqs[name] = raw;
        lastSeq = raw;
        lastRaw = raw;
      } else {
        if (raw === lastRaw) {
          phaseDisplaySeqs[name] = lastSeq;
        } else {
          phaseDisplaySeqs[name] = lastSeq + 1;
          lastSeq = lastSeq + 1;
        }
        lastRaw = raw;
      }
    });

    const payloadPhases: Array<{ name: string; sequence: number }> = [];
    phasesList.forEach((group) => {
      const primaryPhase = group[0];
      const seq = phaseDisplaySeqs[primaryPhase] ?? 1;
      group.forEach(phase => {
        payloadPhases.push({
          name: phase,
          sequence: seq
        });
      });
    });

    try {
      await fetch(`/api/projects/${viewingProject.id}/phases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phases: payloadPhases })
      });
    } catch (e) {
      console.error('Failed to save phases sequence:', e);
    }
  };

  const saveBacklogSequences = async (
    backlogList: any[],
    reqsList: string[][],
    tasksOrderList: Record<string, string[]>,
    phasesList: string[][]
  ) => {
    if (!viewingProject || backlogList.length === 0) return;

    const flatReqs = reqsList.flat();
    const flatPhases = phasesList.flat().map(p => p.toUpperCase());
    const payloadSequences: Array<{ id: number; sequence: string }> = [];

    flatReqs.forEach((reqName, reqIdx) => {
      const reqItems = backlogList.filter(item => (item.taskName || item.macroRequisito || '') === reqName);
      
      const descGroups: { [desc: string]: { minId: number; desc: string; items: any[] } } = {};
      reqItems.forEach((t: any) => {
        const desc = t.taskDescription || t.task_description || t.task || t.tarefa || 'Sem descrição';
        if (!descGroups[desc]) {
          descGroups[desc] = { minId: t.id || 999999, desc, items: [] };
        } else {
          if (t.id && t.id < descGroups[desc].minId) {
            descGroups[desc].minId = t.id;
          }
        }
        descGroups[desc].items.push(t);
      });

      const defaultDescOrder = Object.values(descGroups).sort((a, b) => a.minId - b.minId).map(x => x.desc);
      const currentDescOrder = tasksOrderList[reqName] ?? defaultDescOrder;
      const finalDescOrder = [
        ...currentDescOrder.filter(d => defaultDescOrder.includes(d)),
        ...defaultDescOrder.filter(d => !currentDescOrder.includes(d))
      ];

      const sortedDescList = Object.values(descGroups).sort((a, b) => {
        return finalDescOrder.indexOf(a.desc) - finalDescOrder.indexOf(b.desc);
      });

      sortedDescList.forEach((descGroup, descIdx) => {
        const sortedSubItems = descGroup.items.map((t: any) => {
          return {
            id: t.id,
            phase: t.taskPhase || t.fase || 'Sem Fase',
            technology: t.taskTechnology || t.tecnologia || ''
          };
        }).sort((a, b) => {
          const idxA = flatPhases.indexOf(a.phase.toUpperCase());
          const idxB = flatPhases.indexOf(b.phase.toUpperCase());
          const diff = (idxA === -1 ? 999999 : idxA) - (idxB === -1 ? 999999 : idxB);
          if (diff !== 0) return diff;
          const techDiff = a.technology.localeCompare(b.technology);
          if (techDiff !== 0) return techDiff;
          return (a.id || 0) - (b.id || 0);
        });

        sortedSubItems.forEach((sub, sIdx) => {
          payloadSequences.push({
            id: sub.id,
            sequence: `${reqIdx + 1}.${descIdx + 1}.${sIdx + 1}`
          });
        });
      });
    });

    try {
      await fetch(`/api/projects/${viewingProject.id}/backlog-sequence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sequences: payloadSequences })
      });
    } catch (e) {
      console.error('Failed to save backlog sequences:', e);
    }
  };

  const orderedPhasesRef = React.useRef(orderedPhases);
  const customPhaseSequencesRef = React.useRef(customPhaseSequences);
  const projectBacklogRef = React.useRef(projectBacklog);
  const orderedRequirementsRef = React.useRef(orderedRequirements);
  const taskOrdersRef = React.useRef(taskOrders);

  useEffect(() => { orderedPhasesRef.current = orderedPhases; }, [orderedPhases]);
  useEffect(() => { customPhaseSequencesRef.current = customPhaseSequences; }, [customPhaseSequences]);
  useEffect(() => { projectBacklogRef.current = projectBacklog; }, [projectBacklog]);
  useEffect(() => { orderedRequirementsRef.current = orderedRequirements; }, [orderedRequirements]);
  useEffect(() => { taskOrdersRef.current = taskOrders; }, [taskOrders]);

  useEffect(() => {
    return () => {
      if (orderedPhasesRef.current.length > 0) {
        savePhaseSequence(orderedPhasesRef.current, customPhaseSequencesRef.current);
      }
      if (projectBacklogRef.current.length > 0) {
        saveBacklogSequences(
          projectBacklogRef.current,
          orderedRequirementsRef.current,
          taskOrdersRef.current,
          orderedPhasesRef.current
        );
      }
    };
  }, [activePlanningStep, isViewingPlanningPhases]);

  useEffect(() => {
    const handleBlur = () => {
      if (orderedPhasesRef.current.length > 0) {
        savePhaseSequence(orderedPhasesRef.current, customPhaseSequencesRef.current);
      }
      if (projectBacklogRef.current.length > 0) {
        saveBacklogSequences(
          projectBacklogRef.current,
          orderedRequirementsRef.current,
          taskOrdersRef.current,
          orderedPhasesRef.current
        );
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleDragOverCard = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width * 0.5) {
      setHoveredSide('left');
    } else {
      setHoveredSide('right');
    }
    setHoveredIdx(index);
  };

  const handleDragLeaveCard = () => {
    setHoveredIdx(null);
    setHoveredSide(null);
  };

  const handleDropCard = (e: React.DragEvent, destIdx: number) => {
    e.preventDefault();
    const srcIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(srcIdx) || srcIdx === destIdx) {
      handleDragLeaveCard();
      return;
    }
    
    const nextList = [...orderedPhases];
    const draggedGroup = nextList[srcIdx];
    
    nextList.splice(srcIdx, 1);
    let targetIdx = destIdx;
    if (srcIdx < destIdx) {
      targetIdx = hoveredSide === 'left' ? destIdx - 1 : destIdx;
    } else {
      targetIdx = hoveredSide === 'left' ? destIdx : destIdx + 1;
    }
    nextList.splice(targetIdx, 0, draggedGroup);
    
    setOrderedPhases(nextList);
    handleDragLeaveCard();
  };

  const handleSplitGroup = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const group = orderedPhases[index];
    if (group.length <= 1) return;
    
    const nextList = [...orderedPhases];
    nextList.splice(index, 1);
    
    group.forEach((phase, subIdx) => {
      nextList.splice(index + subIdx, 0, [phase]);
    });
    
    setOrderedPhases(nextList);
  };

  const distinctRequirements = useMemo(() => {
    const groups: { [key: string]: number } = {};
    projectBacklog.forEach(item => {
      const name = item.taskName || item.macroRequisito || '';
      if (!name) return;
      if (groups[name] === undefined) {
        groups[name] = item.id || 999999;
      } else {
        if (item.id && item.id < groups[name]) {
          groups[name] = item.id;
        }
      }
    });
    return Object.keys(groups).sort((a, b) => groups[a] - groups[b]);
  }, [projectBacklog]);

  useEffect(() => {
    if (distinctRequirements.length > 0) {
      setOrderedRequirements(prev => {
        const tracked = prev.flat();
        const newReqs = distinctRequirements.filter(p => !tracked.includes(p));
        const updatedPrev = prev
          .map(group => group.filter(p => distinctRequirements.includes(p)))
          .filter(group => group.length > 0);
        return [...updatedPrev, ...newReqs.map(p => [p])];
      });
    } else {
      setOrderedRequirements([]);
    }
  }, [distinctRequirements]);

  const handleMoveDesc = (reqName: string, descIdx: number, direction: 'up' | 'down', sortedDescList: any[]) => {
    const defaultOrder = sortedDescList.map(x => x.desc);
    const currentOrder = taskOrders[reqName] ?? defaultOrder;
    const finalOrder = [
      ...currentOrder.filter(d => defaultOrder.includes(d)),
      ...defaultOrder.filter(d => !currentOrder.includes(d))
    ];
    
    const targetIdx = direction === 'up' ? descIdx - 1 : descIdx + 1;
    if (targetIdx < 0 || targetIdx >= finalOrder.length) return;
    
    const newOrder = [...finalOrder];
    const temp = newOrder[descIdx];
    newOrder[descIdx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    
    const newTaskOrders = {
      ...taskOrders,
      [reqName]: newOrder
    };
    
    setTaskOrders(newTaskOrders);

    saveBacklogSequences(
      projectBacklog,
      orderedRequirements,
      newTaskOrders,
      orderedPhases
    );
  };

  const handleSaveDependencies = async () => {
    if (!selectedDependencyTarget || !viewingProject) return;

    let reqName = '';
    let taskDesc: string | undefined = undefined;
    let taskId: string | undefined = undefined;
    let dependenciesStr = '';

    if (selectedDependencyTarget.type === 'requirement') {
      reqName = selectedDependencyTarget.id;
      const selectedReqNames = requirementDependencies[selectedDependencyTarget.id] || [];
      const taskIds: string[] = [];
      projectBacklog.forEach((t: any) => {
        const tReq = t.taskName || t.macroRequisito || '';
        if (selectedReqNames.includes(tReq)) {
          taskIds.push(String(t.id));
        }
      });
      dependenciesStr = taskIds.join(';');
    } else if (selectedDependencyTarget.type === 'description') {
      reqName = selectedDependencyTarget.requirementName || '';
      taskDesc = selectedDependencyTarget.id;
      const selectedDescs = descriptionDependencies[selectedDependencyTarget.id] || [];
      const taskIds: string[] = [];
      projectBacklog.forEach((t: any) => {
        const tReq = t.taskName || t.macroRequisito || '';
        const tDesc = t.taskDescription || t.task_description || t.task || t.tarefa || 'Sem descrição';
        if (tReq === reqName && selectedDescs.includes(tDesc)) {
          taskIds.push(String(t.id));
        }
      });
      dependenciesStr = taskIds.join(';');
    } else if (selectedDependencyTarget.type === 'subtask') {
      reqName = selectedDependencyTarget.requirementName || '';
      taskId = selectedDependencyTarget.id;
      const selectedSubtaskIds = subtaskDependencies[selectedDependencyTarget.id] || [];
      dependenciesStr = selectedSubtaskIds.join(';');
    }

    try {
      setSavingChanges(true);
      const res = await fetch(`/api/projects/${viewingProject.id}/backlog/dependencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reqName,
          taskDesc,
          taskId,
          dependencies: dependenciesStr || null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar dependências');
      }

      setProjectBacklog((prev: any[]) => {
        return prev.map(item => {
          const tReq = item.taskName || item.macroRequisito || '';
          const tDesc = item.taskDescription || item.task_description || item.task || item.tarefa || 'Sem descrição';
          
          if (selectedDependencyTarget.type === 'requirement') {
            if (tReq === reqName) {
              return { ...item, dependencies: dependenciesStr || null };
            }
          } else if (selectedDependencyTarget.type === 'description') {
            if (tReq === reqName && tDesc === taskDesc) {
              return { ...item, dependencies: dependenciesStr || null };
            }
          } else if (selectedDependencyTarget.type === 'subtask') {
            if (String(item.id) === taskId) {
              return { ...item, dependencies: dependenciesStr || null };
            }
          }
          return item;
        });
      });

      showToast('Dependências salvas com sucesso!', 'success');
      setDependencyDrawerOpen(false);
    } catch (e: any) {
      console.error('Failed to save dependencies:', e);
      showToast(e.message || 'Erro ao salvar dependências', 'error');
    } finally {
      setSavingChanges(false);
    }
  };

  const filteredTasks = useMemo(() => {
    let list = previewTasks;

    // Filter by MacroRequisito (Requisitos)
    if (filters.backlogMacroRequisito) {
      const q = filters.backlogMacroRequisito.toLowerCase();
      list = list.filter(t => (t.macroRequisito || '').toLowerCase().includes(q));
    }

    // Filter by Tarefa (Descrição)
    if (filters.backlogTarefa) {
      const q = filters.backlogTarefa.toLowerCase();
      list = list.filter(t => (t.tarefa || '').toLowerCase().includes(q));
    }

    // Filter by Build Techs, Arq Techs and Complexidade combined
    const selectedBuildTechs = filters.backlogBuildTechs ? filters.backlogBuildTechs.split(',').filter(Boolean) : [];
    const selectedArqTechs = filters.backlogArqTechs ? filters.backlogArqTechs.split(',').filter(Boolean) : [];
    const selectedComps = filters.backlogComplexidades ? filters.backlogComplexidades.split(',').filter(Boolean) : [];

    const hasBuildFilter = selectedBuildTechs.length > 0;
    const hasArqFilter = selectedArqTechs.length > 0;
    const hasTechFilter = hasBuildFilter || hasArqFilter;
    const hasCompFilter = selectedComps.length > 0;

    if (hasTechFilter || hasCompFilter) {
      list = list.filter(t => {
        if (t.isDocRow) {
          // Doc row: only show if complexity matches (when complexity filter is active)
          if (hasCompFilter) {
            const docComp = (t.complexidade || '').toUpperCase().trim();
            return selectedComps.includes(docComp);
          }
          // No complexity filter active but tech filter is — keep doc row visible
          return !hasTechFilter;
        }

        if (!t.rows || t.rows.length === 0) return false;

        return t.rows.some((r: any) => {
          const tipo = (r.tipo || '').toLowerCase();
          const tecnologia = r.tecnologia || '';
          const valor = (r.valor || '').toUpperCase().trim();
          const isBuild = tipo.includes('build');

          // Check technology filter
          if (hasTechFilter) {
            if (isBuild && hasBuildFilter) {
              // This is a Build row and we have Build filter — must match
              if (!selectedBuildTechs.includes(tecnologia)) return false;
            } else if (!isBuild && hasArqFilter) {
              // This is an Arq row and we have Arq filter — must match
              if (!selectedArqTechs.includes(tecnologia)) return false;
            } else if (isBuild && !hasBuildFilter) {
              // This is a Build row but we only have Arq filter — skip this row entry
              return false;
            } else if (!isBuild && !hasArqFilter) {
              // This is an Arq row but we only have Build filter — skip this row entry
              return false;
            }
          }

          // Check complexity filter
          if (hasCompFilter) {
            if (!valor || !selectedComps.includes(valor)) return false;
          }

          // Must have a non-empty value
          if (!valor) return false;

          return true;
        });
      });
    }

    return list;
  }, [
    previewTasks, 
    filters.backlogMacroRequisito, 
    filters.backlogTarefa, 
    filters.backlogBuildTechs, 
    filters.backlogArqTechs, 
    filters.backlogComplexidades
  ]);

  const techColumns = useMemo(() => {
    const buildTechs = new Set<string>();
    const arqTechs = new Set<string>();

    previewTasks.forEach(pt => {
      pt.rows.forEach((row: any) => {
        if (row.tecnologia && row.tecnologia !== 'Documentação') {
          const isBuild = (row.tipo || '').toLowerCase().includes('build');
          if (isBuild) {
            buildTechs.add(row.tecnologia);
          } else {
            arqTechs.add(row.tecnologia);
          }
        }
      });
    });

    return {
      build: Array.from(buildTechs).sort(),
      arq: Array.from(arqTechs).sort()
    };
  }, [previewTasks]);

  useEffect(() => {
    if (viewingProject) {
      fetchTransitions(viewingProject.id);
    }
  }, [viewingProject]);

  useEffect(() => {
    if (uploadModalStepId !== null && wizardStep === 2) {
      (window as any).isViewingBacklogEstimado = true;
      (window as any).backlogBuildTechs = techColumns.build;
      (window as any).backlogArqTechs = techColumns.arq;
      (window as any).backlogMacroRequirements = Array.from(new Set(previewTasks.map(t => t.macroRequisito).filter(Boolean)));
      (window as any).reloadBacklogFile = handleProcessFile;
    } else {
      (window as any).isViewingBacklogEstimado = false;
      (window as any).backlogBuildTechs = [];
      (window as any).backlogArqTechs = [];
      (window as any).backlogMacroRequirements = [];
      delete (window as any).reloadBacklogFile;
    }
    return () => {
      (window as any).isViewingBacklogEstimado = false;
      (window as any).backlogBuildTechs = [];
      (window as any).backlogArqTechs = [];
      (window as any).backlogMacroRequirements = [];
      delete (window as any).reloadBacklogFile;
    };
  }, [uploadModalStepId, wizardStep, techColumns, previewTasks, handleProcessFile]);

  if (!viewingProject) return null;
  
  // Sort steps sequentially
  const sortedSteps = [...steps].sort((a, b) => a.id - b.id);
  const currentStepIndex = sortedSteps.findIndex(s => s.id === viewingProject.stepId);
  const allChangesConcluded = changesList.length > 0 && changesList.every(chg => {
    const originalStatusName = statuses.find(s => s.id === chg.statusId)?.name || '';
    const statusName = originalStatusName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return statusName.includes('CONCLUIDO') || statusName.includes('CONCLUÍDO');
  });
  const showMainContent = !(uploadModalStepId !== null && wizardStep === 2) && !isViewingPlanningPhases;
  const projectTasks = tasks.filter(t => t.sistema === viewingProject.projectId);
  const totalPoints = projectTasks.reduce((sum, t) => sum + (t.pontos || 0), 0);

  return (
    <div className={`h-full flex relative overflow-hidden transition-all duration-300 ${
      (uploadModalStepId !== null && wizardStep === 2) ? 'bg-transparent' : 'bg-white/85 backdrop-blur-md'
    }`}>
      {showMainContent && (
        <>
          {/* Workflow Sidebar */}
      <div 
        className="bg-[#f8f9fa] border-r border-slate-200 transition-all duration-300 flex flex-col shadow-sm z-20 w-12"
        style={{ width: isSidebarExpanded ? 'max-content' : '3rem', minWidth: isSidebarExpanded ? 'max-content' : '3rem' }}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              (window as any).lastViewingProjectId = viewingProject.id;
              setViewingProject(null);
              if ((window as any).setActiveTab) {
                (window as any).setActiveTab('workflow-menu');
              }
            }}
            className={`font-extrabold text-[#64183f] text-sm whitespace-nowrap overflow-hidden transition-all hover:underline hover:opacity-85 flex items-center gap-1 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}
            title="Acessar Workflow no Menu"
          >
            Workflow do Projeto
          </button>
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors mx-auto"
          >
            {isSidebarExpanded ? <CaretLeft weight="bold" size={16} /> : <ArrowRight weight="bold" size={16} />}
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col transition-all duration-300 ${isSidebarExpanded ? 'p-6' : 'px-1 py-6'}`}>
          <div className="relative flex-1 flex flex-col justify-between min-h-[400px]">
            {/* Vertical Line */}
            <div className={`absolute top-5 bottom-5 border-l-[3.5px] border-dotted border-[#64183f] ${isSidebarExpanded ? 'left-[24px]' : 'left-1/2 -translate-x-1/2'}`} />

            <div className="flex flex-col justify-between flex-1 relative">
              {sortedSteps.map((step, index) => {
                // Find if there's a transition for this step
                const transition = transitions.find(t => t.stepId === step.id);
                // Also check if this is the current active step in the project object
                const isCurrentActiveStep = viewingProject.stepId === step.id && !(step.id === 7 && viewingProject.statusId === 3 && allChangesConcluded);
                
                const isAnterior = currentStepIndex !== -1 ? index < currentStepIndex : false;

                // Busca a última transição do projeto para esta etapa específica (PROJECT_ID + OLD_STEP_ID)
                const latestStepTx = transitions.find(t => t.oldStepId === step.id);
                const stepUser = latestStepTx?.userId || 'N/A';
                const stepDate = latestStepTx?.transactionDate || 'N/A';

                const isRejectedTx = !isCurrentActiveStep && latestStepTx && (() => {
                  const statusName = (statuses.find(s => s.id === latestStepTx.oldStatusId)?.name || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  return statusName.includes('REJEITADO') || statusName.includes('REPROVADO') || latestStepTx.oldStatusId === 4;
                })();

                let hasPassed = (!isCurrentActiveStep && (isAnterior || !!transition) && !isRejectedTx) || (step.id === 7 && viewingProject.stepId === 7 && viewingProject.statusId === 3 && allChangesConcluded);

                const outerBorderColor = isCurrentActiveStep ? '#3b82f6' : (isRejectedTx ? 'rgba(239, 68, 68, 0.5)' : (hasPassed ? '#64183f' : '#cbd5e1'));

                return (
                  <div key={step.id} className="flex gap-4 group items-center py-2">
                    {/* Icon / Dot Indicator with Outer Circular Outline - Scaled proportionally */}
                    <div 
                      className={`relative z-10 flex items-center justify-center rounded-full border-2 transition-all shrink-0 bg-[#f8f9fa] ${isSidebarExpanded ? 'w-12 h-12' : 'w-9 h-9 mx-auto'}`}
                      style={{ borderColor: outerBorderColor }}
                    >
                      {isRejectedTx ? (
                        <div 
                          className={`rounded-full flex items-center justify-center font-bold text-white shadow-sm transition-all ${isSidebarExpanded ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-[10px]'}`}
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.5)' }}
                        >
                          <X weight="bold" size={isSidebarExpanded ? 16 : 12} />
                        </div>
                      ) : hasPassed ? (
                        <CheckCircle weight="fill" size={isSidebarExpanded ? 28 : 20} style={{ color: '#64183f' }} />
                      ) : (
                        <div 
                          className={`rounded-full flex items-center justify-center font-bold text-white shadow-sm transition-all ${isSidebarExpanded ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-[10px]'}`}
                          style={isCurrentActiveStep ? { background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' } : { backgroundColor: '#cbd5e1' }}
                        >
                          {index + 1}
                        </div>
                      )}
                    </div>

                    {/* Step Details */}
                    {isSidebarExpanded && (
                      <div className={`flex flex-col min-w-0 ${isRejectedTx ? 'opacity-50 select-none' : ''}`}>
                        {isCurrentActiveStep ? (
                          <span 
                            className="text-[11px] font-bold text-white bg-[#64183f] px-2 py-0.5 rounded-md shadow-sm w-fit whitespace-nowrap"
                          >
                            {step.name}
                          </span>
                        ) : (
                          <span 
                            className={`text-[8px] font-bold whitespace-nowrap ${hasPassed ? 'text-[#64183f]' : isRejectedTx ? 'text-red-500' : 'text-[#64183f]/40'}`}
                          >
                            {step.name}
                          </span>
                        )}
                        {isCurrentActiveStep && (
                          <div className="mt-1.5 flex flex-col gap-1.5">
                            {(() => {
                              const originalStatusName = statuses.find(s => s.id === viewingProject.statusId)?.name || '';
                              const statusName = originalStatusName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                              let dotColor = '#9ca3af'; // cinza
                              if (statusName.includes('PENDENTE')) dotColor = '#eab308';
                              else if (statusName.includes('EXECUCAO') || statusName.includes('EXECUÇÃO') || statusName.includes('EXECU')) dotColor = '#3b82f6';
                              else if (statusName.includes('CONCLUIDO') || statusName.includes('CONCLUÍDO')) dotColor = '#22c55e';
                              else if (statusName.includes('REJEITADO')) dotColor = '#ef4444';
                              return (
                                <div className="flex items-center gap-1.5 w-fit bg-white/60 px-2 py-0.5 rounded-md border border-slate-200/40 shadow-sm">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0 shadow-sm block"
                                    style={{ background: dotColor }}
                                  />
                                  <span className="text-[8px] font-black uppercase tracking-wide" style={{ color: dotColor }}>
                                    {originalStatusName}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Informações de transição abaixo do status no Workflow */}
                        {latestStepTx && (
                          <div className="mt-1.5 flex flex-col gap-0.5 text-[10px] text-slate-500 font-semibold border-t border-slate-200/50 pt-1">
                            <div className="flex items-center gap-1">
                              <User size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[140px]" title={stepUser}>{stepUser}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400 shrink-0" />
                              <span>{stepDate}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        {viewingProjectChanges ? (
          <div className="h-full flex flex-col animate-fade-in relative text-slate-800 bg-transparent overflow-hidden">
            {/* ── HEADER ── */}
            <div className={`px-8 border-b border-slate-200 bg-white flex justify-between items-center z-10 select-none transition-all duration-300 ${isHeaderCollapsedChanges ? 'py-2' : 'py-5'}`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewingProjectChanges(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0 animate-pulse-subtle"
                  title="Voltar para Detalhes do Projeto"
                >
                  <ArrowLeft size={20} weight="bold" />
                </button>
                <div>
                  <h2 className={`font-extrabold text-[#64183f] transition-all duration-300 ${isHeaderCollapsedChanges ? 'text-lg' : 'text-2xl'}`}>Cadastro de Mudanças (CHG)</h2>
                  {!isHeaderCollapsedChanges && (
                    <p className="text-xs font-semibold text-slate-500 mt-1 transition-all duration-300">
                      Projeto: {viewingProject.name}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  disabled={savingChanges || loadingChanges || !canWrite}
                  onClick={handleSaveChangeData}
                  className="px-6 py-2 bg-gradient-to-r from-[#64183f] to-[#1a1f44] text-white font-extrabold text-xs rounded-xl shadow-md uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingChanges ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={16} weight="bold" />
                      Salvar Mudança
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsHeaderCollapsedChanges(!isHeaderCollapsedChanges)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#64183f] hover:border-[#64183f] hover:bg-pink-50 transition-all shrink-0"
                  title={isHeaderCollapsedChanges ? 'Expandir cabeçalho' : 'Contrair cabeçalho'}
                >
                  {isHeaderCollapsedChanges ? <CaretDown size={14} weight="bold" /> : <CaretUp size={14} weight="bold" />}
                </button>
              </div>
            </div>

            {/* ── CONTENT AREA ── */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white/85 backdrop-blur-md">

            {loadingChanges ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-4 border-t-transparent border-[#64183f] rounded-full animate-spin" />
                <span className="text-slate-500 font-semibold text-sm">Carregando dados da mudança...</span>
              </div>
            ) : (() => {
              const activeChg = changesList[activeChangeIndex] || {
                id: 'fallback-temp-id',
                chgNumber: '',
                description: '',
                predictedDate: '',
                predictedTime: '00:00',
                responsibleId: '' as number | '',
                scale: [] as Array<{
                  id: string;
                  analystId: number | '';
                  startDate: string;
                  startTime: string;
                  endDate: string;
                  endTime: string;
                  observations: string;
                }>
              };

              const updateActiveChg = (updater: (prev: typeof activeChg) => typeof activeChg) => {
                setChangesList(prev => prev.map((item, idx) => idx === activeChangeIndex ? updater(item) : item));
              };

              return (
                <div className="flex flex-col gap-6">
                  {/* Tabs headers */}
                  <div className="flex items-center gap-1 border-b border-slate-200/80 pb-px">
                    {changesList.map((chg, idx) => {
                      const isActive = activeChangeIndex === idx;
                      const tabLabel = chg.chgNumber.trim() ? chg.chgNumber : `CHG (Nova)`;
                      
                      const originalStatusName = statuses.find(s => s.id === chg.statusId)?.name || 'Pendente';
                      const statusName = originalStatusName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      
                      let statusIcon = <span title="Pendente"><Hourglass size={10} weight="fill" className="text-yellow-500 shrink-0" /></span>;
                      if (statusName.includes('CONCLUIDO') || statusName.includes('CONCLUÍDO')) {
                        statusIcon = <span title="Concluído"><CheckCircle size={10} weight="fill" className="text-green-500 shrink-0" /></span>;
                      } else if (statusName.includes('REJEITADO') || statusName.includes('REPROVADO')) {
                        statusIcon = <span title="Rejeitado"><X size={10} weight="bold" className="text-red-500 shrink-0" /></span>;
                      }

                      return (
                        <div key={chg.id} className="relative group flex items-center">
                          <button
                            onClick={() => setActiveChangeIndex(idx)}
                            className={`relative px-5 py-2 font-black text-xs rounded-t-xl transition-all border flex items-center gap-2 z-10 -mb-px cursor-pointer ${
                              isActive
                                ? 'border-slate-200 border-b-white bg-white text-[#64183f]'
                                : 'border-transparent bg-slate-50/50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            } ${changesList.length > 1 ? 'pr-8' : ''}`}
                          >
                            {!isNaN(Number(chg.id)) && Number(chg.id) < 1e12 && (
                              <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-20 flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm border border-slate-200/80">
                                {statusIcon}
                              </span>
                            )}
                            {tabLabel}
                          </button>
                          {changesList.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const listWithoutDeleted = changesList.filter((_, i) => i !== idx);
                                setChangesList(listWithoutDeleted);
                                if (activeChangeIndex >= listWithoutDeleted.length) {
                                  setActiveChangeIndex(listWithoutDeleted.length - 1);
                                }
                              }}
                              className="absolute right-2 top-[50%] -translate-y-[50%] z-20 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                              title="Excluir Mudança"
                            >
                              <X size={10} weight="bold" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    <button
                      onClick={() => {
                        const newChg = {
                          id: String(Date.now()),
                          chgNumber: '',
                          description: '',
                          predictedDate: '',
                          predictedTime: '00:00',
                          responsibleId: '' as number | '',
                          statusId: undefined,
                          scale: [] as Array<{
                            id: string;
                            analystId: number | '';
                            startDate: string;
                            startTime: string;
                            endDate: string;
                            endTime: string;
                            observations: string;
                          }>
                        };
                        setChangesList(prev => [...prev, newChg]);
                        setActiveChangeIndex(changesList.length);
                      }}
                      className="ml-3 px-3 py-1 bg-[#64183f]/10 hover:bg-[#64183f]/20 text-[#64183f] font-black text-[9px] rounded-lg uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Users size={12} weight="bold" />
                      Inserir CHG
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Basic Info Card */}
                    <div className="rounded-2xl border border-slate-200/60 border-l-4 border-l-[#64183f] p-6 shadow-sm" style={{ backgroundColor: 'rgba(234, 227, 213, 0.5)' }}>
                      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <h3 className="text-sm font-black text-[#64183f] uppercase tracking-wider flex items-center gap-2">
                          <ClipboardText size={18} weight="bold" /> Informações Gerais da CHG
                        </h3>
                        {activeChg && !isNaN(Number(activeChg.id)) && Number(activeChg.id) < 1e12 && (
                          <button
                            onClick={() => setShowConclusionModal(true)}
                            className="px-4 py-2 text-white font-extrabold text-xs rounded-xl shadow-md uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
                            style={{ background: 'linear-gradient(to right, rgb(26, 31, 68), rgb(30, 58, 138))' }}
                          >
                            <CheckCircle size={14} weight="bold" />
                            Concluir Mudança
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Numero CHG */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Número CHG *</label>
                          <input
                            type="text"
                            maxLength={30}
                            placeholder="Ex: CHG0123456"
                            value={activeChg.chgNumber}
                            onChange={(e) => updateActiveChg(prev => ({ ...prev, chgNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-semibold text-sm focus:outline-none focus:border-[#64183f] transition-colors"
                          />
                          <span className="text-[9px] text-slate-400 text-right">{activeChg.chgNumber.length}/30</span>
                        </div>

                        {/* Descrição */}
                        <div className="flex flex-col gap-1.5 lg:col-span-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Descrição *</label>
                          <input
                            type="text"
                            maxLength={100}
                            placeholder="Descreva brevemente a mudança"
                            value={activeChg.description}
                            onChange={(e) => updateActiveChg(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-semibold text-sm focus:outline-none focus:border-[#64183f] transition-colors"
                          />
                          <span className="text-[9px] text-slate-400 text-right">{activeChg.description.length}/100</span>
                        </div>

                        {/* Data Prevista */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Data Prevista *</label>
                          <input
                            type="date"
                            value={activeChg.predictedDate}
                            onChange={(e) => updateActiveChg(prev => ({ ...prev, predictedDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-semibold text-sm focus:outline-none focus:border-[#64183f] transition-colors"
                          />
                        </div>

                        {/* Horário */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Horário *</label>
                          <select
                            value={activeChg.predictedTime}
                            onChange={(e) => updateActiveChg(prev => ({ ...prev, predictedTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-semibold text-sm focus:outline-none focus:border-[#64183f] bg-white transition-colors"
                          >
                            {Array.from({ length: 24 }).map((_, i) => {
                              const hour = String(i).padStart(2, '0') + ':00';
                              return <option key={hour} value={hour}>{hour}</option>;
                            })}
                          </select>
                        </div>

                        {/* Responsável (Minsait) */}
                        <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Responsável (Minsait) *</label>
                          <div className="flex items-center gap-3">
                            {activeChg.responsibleId ? (
                              (() => {
                                const resp = squad.find(s => s.id === activeChg.responsibleId);
                                if (!resp) return null;
                                const initials = getInitials(resp.nome);
                                return (
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden shrink-0"
                                    style={{ 
                                      background: resp.avatarImage 
                                        ? 'transparent' 
                                        : resp.avatar 
                                          ? getAvatarById(String(resp.avatar))?.gradient 
                                          : getAvatarGradient(resp.id || 0) 
                                    }}
                                  >
                                    {resp.avatarImage ? (
                                      <img 
                                        src={resp.avatarImage} 
                                        alt={resp.nome} 
                                        className="w-full h-full object-cover object-top"
                                      />
                                    ) : resp.avatar ? (
                                      getAvatarById(String(resp.avatar))?.icon
                                    ) : (
                                      <span className="text-white font-black text-xs">{initials}</span>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 bg-slate-100 border border-dashed border-slate-300 shrink-0">
                                <User size={18} />
                              </div>
                            )}
                            <Autocomplete
                              options={availableProfessionals}
                              getOptionLabel={(option) => `${option.nome} (${option.perfil})`}
                              value={availableProfessionals.find(s => s.id === activeChg.responsibleId) || null}
                              onChange={(_, newValue) => {
                                updateActiveChg(prev => ({ ...prev, responsibleId: newValue ? (newValue.id ?? '') : '' }));
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Selecione um profissional..."
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '12px',
                                      fontSize: '0.875rem',
                                      fontWeight: '600',
                                      color: '#1e293b',
                                      backgroundColor: 'white',
                                      '& fieldset': { borderColor: '#e2e8f0' },
                                      '&:hover fieldset': { borderColor: '#e2e8f0' },
                                      '&.Mui-focused fieldset': { borderColor: '#64183f' },
                                    }
                                  }}
                                />
                              )}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Escala Card */}
                    <div className="rounded-2xl border border-slate-200/60 border-l-4 border-l-[#64183f] p-6 shadow-sm" style={{ backgroundColor: 'rgba(234, 227, 213, 0.5)' }}>
                      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <h3 className="text-sm font-black text-[#64183f] uppercase tracking-wider flex items-center gap-2">
                          <Users size={18} weight="bold" /> Escala (Analistas de Plantão)
                        </h3>
                        <button
                          onClick={() => updateActiveChg(prev => ({
                            ...prev,
                            scale: [
                              ...prev.scale,
                              {
                                id: String(Date.now()),
                                analystId: '',
                                startDate: '',
                                startTime: '00:00',
                                endDate: '',
                                endTime: '00:00',
                                observations: ''
                              }
                            ]
                          }))}
                          className="px-6 py-2 text-white font-extrabold text-xs rounded-xl shadow-md uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
                          style={{ background: 'linear-gradient(to right, rgb(26, 31, 68), rgb(30, 58, 138))' }}
                        >
                          <Users size={16} weight="bold" />
                          Adicionar Analista
                        </button>
                      </div>

                      {activeChg.scale.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2">
                          <Users size={32} className="text-slate-300" />
                          <span className="font-semibold text-xs">Nenhum analista adicionado na escala de plantão.</span>
                          <span className="text-[10px] text-slate-400">Clique em "Adicionar Analista" acima para começar.</span>
                        </div>
                      ) : (
                        <TableContainer component={Paper} elevation={0} className="border border-slate-200/60 rounded-xl overflow-hidden">
                          <Table size="small">
                            <TableHead className="bg-gradient-to-r from-[#64183f] to-[#1a1f44]">
                              <TableRow>
                                <TableCell className="font-black text-white text-[8px] uppercase tracking-widest w-[30%]" sx={{ color: 'white !important' }}>Analista *</TableCell>
                                <TableCell className="font-black text-white text-[8px] uppercase tracking-widest w-[15%]" sx={{ color: 'white !important' }}>Data Início *</TableCell>
                                <TableCell className="font-black text-white text-[8px] uppercase tracking-widest w-[12%]" sx={{ color: 'white !important' }}>Horário Início</TableCell>
                                <TableCell className="font-black text-white text-[8px] uppercase tracking-widest w-[15%]" sx={{ color: 'white !important' }}>Data Fim *</TableCell>
                                <TableCell className="font-black text-white text-[8px] uppercase tracking-widest w-[12%]" sx={{ color: 'white !important' }}>Horário Fim</TableCell>
                                <TableCell className="font-black text-white text-[8px] uppercase tracking-widest" sx={{ color: 'white !important' }}>Observações</TableCell>
                                <TableCell className="font-black text-white text-[8px] uppercase tracking-widest w-[60px] text-center" sx={{ color: 'white !important' }}>Ações</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {activeChg.scale.map((item, index) => {
                                const analyst = squad.find(s => s.id === item.analystId);
                                return (
                                  <TableRow key={item.id} className="hover:bg-slate-50/50">
                                    {/* Analista Selector + Avatar */}
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {analyst ? (
                                          <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm overflow-hidden shrink-0"
                                            style={{ 
                                              background: analyst.avatarImage 
                                                ? 'transparent' 
                                                : analyst.avatar 
                                                  ? getAvatarById(String(analyst.avatar))?.gradient 
                                                  : getAvatarGradient(analyst.id || 0) 
                                            }}
                                          >
                                            {analyst.avatarImage ? (
                                              <img 
                                                src={analyst.avatarImage} 
                                                alt={analyst.nome} 
                                                className="w-full h-full object-cover object-top"
                                              />
                                            ) : analyst.avatar ? (
                                              <div className="scale-75 flex items-center justify-center">
                                                {getAvatarById(String(analyst.avatar))?.icon}
                                              </div>
                                            ) : (
                                              <span className="text-white font-black text-[9px]">{getInitials(analyst.nome)}</span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 bg-slate-100 border border-dashed border-slate-300 shrink-0">
                                            <User size={12} />
                                          </div>
                                        )}
                                        <Autocomplete
                                          options={availableProfessionals}
                                          getOptionLabel={(option) => option.nome}
                                          value={availableProfessionals.find(s => s.id === item.analystId) || null}
                                          onChange={(_, newValue) => {
                                            const val = newValue ? (newValue.id ?? '') : '';
                                            updateActiveChg(prev => ({
                                              ...prev,
                                              scale: prev.scale.map((s, i) => i === index ? { ...s, analystId: val } : s)
                                            }));
                                          }}
                                          renderInput={(params) => (
                                            <TextField
                                              {...params}
                                              placeholder="Selecione..."
                                              variant="outlined"
                                              size="small"
                                              sx={{
                                                '& .MuiOutlinedInput-root': {
                                                  borderRadius: '8px',
                                                  fontSize: '0.75rem',
                                                  fontWeight: '600',
                                                  color: '#1e293b',
                                                  backgroundColor: 'white',
                                                  '& fieldset': { borderColor: '#e2e8f0' },
                                                  '&:hover fieldset': { borderColor: '#e2e8f0' },
                                                  '&.Mui-focused fieldset': { borderColor: '#64183f' },
                                                }
                                              }}
                                            />
                                          )}
                                          className="flex-1 min-w-[180px]"
                                        />
                                      </div>
                                    </TableCell>
                                    
                                    {/* Data Início */}
                                    <TableCell>
                                      <input
                                        type="date"
                                        value={item.startDate}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          updateActiveChg(prev => ({
                                            ...prev,
                                            scale: prev.scale.map((s, i) => i === index ? { ...s, startDate: val } : s)
                                          }));
                                        }}
                                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-semibold text-xs focus:outline-none focus:border-[#64183f] transition-colors"
                                      />
                                    </TableCell>

                                    {/* Horário Início */}
                                    <TableCell>
                                      <select
                                        value={item.startTime}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          updateActiveChg(prev => ({
                                            ...prev,
                                            scale: prev.scale.map((s, i) => i === index ? { ...s, startTime: val } : s)
                                          }));
                                        }}
                                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-semibold text-xs focus:outline-none focus:border-[#64183f] bg-white transition-colors"
                                      >
                                        {Array.from({ length: 24 }).map((_, i) => {
                                          const hour = String(i).padStart(2, '0') + ':00';
                                          return <option key={hour} value={hour}>{hour}</option>;
                                        })}
                                      </select>
                                    </TableCell>

                                    {/* Data Fim */}
                                    <TableCell>
                                      <input
                                        type="date"
                                        value={item.endDate}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          updateActiveChg(prev => ({
                                            ...prev,
                                            scale: prev.scale.map((s, i) => i === index ? { ...s, endDate: val } : s)
                                          }));
                                        }}
                                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-semibold text-xs focus:outline-none focus:border-[#64183f] transition-colors"
                                      />
                                    </TableCell>

                                    {/* Horário Fim */}
                                    <TableCell>
                                      <select
                                        value={item.endTime}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          updateActiveChg(prev => ({
                                            ...prev,
                                            scale: prev.scale.map((s, i) => i === index ? { ...s, endTime: val } : s)
                                          }));
                                        }}
                                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-semibold text-xs focus:outline-none focus:border-[#64183f] bg-white transition-colors"
                                      >
                                        {Array.from({ length: 24 }).map((_, i) => {
                                          const hour = String(i).padStart(2, '0') + ':00';
                                          return <option key={hour} value={hour}>{hour}</option>;
                                        })}
                                      </select>
                                    </TableCell>

                                    {/* Observações */}
                                    <TableCell>
                                      <input
                                        type="text"
                                        placeholder="Obs..."
                                        value={item.observations}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          updateActiveChg(prev => ({
                                            ...prev,
                                            scale: prev.scale.map((s, i) => i === index ? { ...s, observations: val } : s)
                                          }));
                                        }}
                                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-semibold text-xs focus:outline-none focus:border-[#64183f] transition-colors"
                                      />
                                    </TableCell>

                                    {/* Delete Row Action */}
                                    <TableCell className="text-center">
                                      <button
                                        onClick={() => updateActiveChg(prev => ({
                                          ...prev,
                                          scale: prev.scale.filter((_, i) => i !== index)
                                        }))}
                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Remover Analista"
                                      >
                                        <Trash size={16} weight="bold" />
                                      </button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}



            {showConclusionModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 scale-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Concluir Mudança
                    </h3>
                    <button
                      onClick={() => setShowConclusionModal(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </div>
                  
                  <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                    Escolha o desfecho da mudança para aplicar o status correspondente e salvar os dados:
                  </p>
                  
                  <div className="flex gap-3 mt-2">
                    {canWrite && (
                      <button
                        onClick={() => handleConcludeChange(3)} // 3 = CONCLUIDO
                        className="flex-grow flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-xs rounded-xl shadow-md uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle size={16} weight="fill" />
                        Sucesso
                      </button>
                    )}
                    
                    {canWrite && (
                      <button
                        onClick={() => handleConcludeChange(4)} // 4 = REJEITADO
                        className="flex-grow flex-1 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-xs rounded-xl shadow-md uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X size={16} weight="bold" />
                        Rollback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        ) : viewingPostImplantation ? (
          <div className="h-full flex flex-col animate-fade-in relative text-slate-800 bg-transparent overflow-hidden">
            {/* ── HEADER ── */}
            <div className="px-8 border-b border-slate-200 bg-white py-5 flex justify-between items-center z-10 select-none transition-all duration-300">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewingPostImplantation(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0 animate-pulse-subtle"
                  title="Voltar para Detalhes do Projeto"
                >
                  <ArrowLeft size={20} weight="bold" />
                </button>
                <div>
                  <h2 className="font-extrabold text-[#64183f] text-2xl">Pós-Implantação</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Projeto: {viewingProject.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setSavingIncidents(true);
                    try {
                      const response = await fetch(`/api/projects/${viewingProject.id}/incidents`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(incidentsList)
                      });
                      if (!response.ok) {
                        throw new Error('Erro ao salvar os incidentes.');
                      }
                      showToast('Dados de pós-implantação salvos com sucesso!', 'success');
                      loadProjectIncidents();
                    } catch (err: any) {
                      console.error(err);
                      showToast(err.message || 'Erro ao salvar os dados da pós-implantação.', 'error');
                    } finally {
                      setSavingIncidents(false);
                    }
                  }}
                  disabled={savingIncidents || !canWrite}
                  className="px-6 py-2 bg-gradient-to-r from-[#64183f] to-[#1a1f44] text-white font-extrabold text-xs rounded-xl shadow-md uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingIncidents ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={16} weight="bold" />
                      Salvar Incidente
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── CONTENT AREA ── */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white/85 backdrop-blur-md">
              <div className="space-y-6 pb-10">
                {/* Lista de Incidentes (Grid) */}
                <div className="bg-[#FAF4EF]/50 border border-slate-200/50 border-l-[6px] border-l-[#64183f] rounded-[2rem] p-6 shadow-sm space-y-6">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h3 className="text-sm font-black text-[#64183f] uppercase tracking-wider flex items-center gap-2">
                      <WarningCircle size={18} weight="bold" /> Lista de Incidentes
                    </h3>
                    <button
                      onClick={() => {
                        setIncidentsList(prev => [
                          ...prev,
                          {
                            id: String(Date.now()),
                            incidentNumber: '',
                            incidentDate: '',
                            changeId: '',
                            comments: ''
                          }
                        ]);
                      }}
                      className="px-6 py-2 text-white font-extrabold text-xs rounded-xl shadow-md uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
                      style={{ background: 'linear-gradient(to right, rgb(26, 31, 68), rgb(30, 58, 138))' }}
                    >
                      <WarningCircle size={16} weight="bold" />
                      Adicionar Incidente
                    </button>
                  </div>

                  {incidentsList.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 bg-white">
                      <WarningCircle size={32} className="text-slate-300" />
                      <span className="font-semibold text-xs">Nenhum incidente adicionado na lista.</span>
                      <span className="text-[10px] text-slate-400">Clique em "Adicionar Incidente" acima para começar.</span>
                    </div>
                  ) : (
                    <TableContainer component={Paper} elevation={0} className="border border-slate-200/60 rounded-xl overflow-hidden shadow-sm bg-white">
                      <Table size="small">
                        <TableHead className="bg-gradient-to-r from-[#64183f] to-[#1a1f44]">
                          <TableRow>
                            <TableCell className="font-black text-white text-[8px] uppercase tracking-widest w-[20%]" sx={{ color: 'white !important' }}>Número do Incidente</TableCell>
                            <TableCell className="font-black text-white text-[8px] uppercase tracking-widest w-[20%]" sx={{ color: 'white !important' }}>Data de Abertura</TableCell>
                            <TableCell className="font-black text-white text-[8px] uppercase tracking-widest w-[25%]" sx={{ color: 'white !important' }}>CHG Relacionada</TableCell>
                            <TableCell className="font-black text-white text-[8px] uppercase tracking-widest w-[30%]" sx={{ color: 'white !important' }}>Observações</TableCell>
                            <TableCell className="font-black text-white text-[8px] uppercase tracking-widest w-[60px] text-center" sx={{ color: 'white !important' }}>Ações</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {incidentsList.map((item) => {
                            const completedCHGs = changesList.filter(chg => {
                              const originalStatusName = statuses.find(s => s.id === chg.statusId)?.name || '';
                              const statusName = originalStatusName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                              return statusName.includes('CONCLUIDO') || statusName.includes('CONCLUÍDO');
                            });

                            return (
                              <TableRow key={item.id} className="hover:bg-slate-50/50">
                                {/* Número do Incidente */}
                                <TableCell>
                                  <input
                                    type="text"
                                    value={item.incidentNumber}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setIncidentsList(prev => prev.map(row => 
                                        row.id === item.id ? { ...row, incidentNumber: val } : row
                                      ));
                                    }}
                                    placeholder="Ex: INC123456"
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#64183f]/50 focus:bg-white transition-all shadow-inner"
                                  />
                                </TableCell>

                                {/* Data de Abertura */}
                                <TableCell>
                                  <input
                                    type="date"
                                    value={item.incidentDate ? item.incidentDate.substring(0, 10) : ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setIncidentsList(prev => prev.map(row => 
                                        row.id === item.id ? { ...row, incidentDate: val } : row
                                      ));
                                    }}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#64183f]/50 focus:bg-white transition-all shadow-inner"
                                  />
                                </TableCell>

                                {/* CHG Relacionada */}
                                <TableCell>
                                  <select
                                    value={item.changeId || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setIncidentsList(prev => prev.map(row => 
                                        row.id === item.id ? { ...row, changeId: val ? Number(val) : '' } : row
                                      ));
                                    }}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-[#64183f]/50 focus:bg-white transition-all cursor-pointer shadow-inner"
                                  >
                                    <option value="">Selecione uma CHG concluída</option>
                                    {completedCHGs.map(chg => (
                                      <option key={chg.id} value={chg.id}>{chg.chgNumber} - {chg.description}</option>
                                    ))}
                                  </select>
                                </TableCell>

                                {/* Observações */}
                                <TableCell>
                                  <input
                                    type="text"
                                    value={item.comments}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setIncidentsList(prev => prev.map(row => 
                                        row.id === item.id ? { ...row, comments: val } : row
                                      ));
                                    }}
                                    placeholder="Observações do incidente"
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#64183f]/50 focus:bg-white transition-all shadow-inner"
                                  />
                                </TableCell>

                                {/* Ações */}
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setIncidentsList(prev => prev.filter(row => row.id !== item.id));
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors p-1"
                                  >
                                    <Trash size={14} />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={`px-8 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between transition-all duration-300 ${isProjectHeaderCollapsed ? 'py-1.5' : 'py-3'}`}>
              <div className="flex items-center gap-3.5 min-w-0">
                <button 
                  onClick={() => setViewingProject(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
                  title="Voltar para a lista"
                >
                  <ArrowLeft size={16} weight="bold" />
                </button>

                {/* Avatar Circle with initials (highlighted) */}
                {!isProjectHeaderCollapsed && (
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm border-2 border-slate-100 transition-all duration-300"
                    style={{ background: getAvatarGradient(viewingProject.id) }}
                  >
                    {getInitials(viewingProject.name)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider border truncate text-[#64183f] bg-[#fdf2f8] border-[#fbcfe8] leading-none">
                      {viewingProject.projectId}
                    </span>
                    <h2 className={`font-extrabold truncate transition-all duration-300 ${isProjectHeaderCollapsed ? 'text-sm' : 'text-lg'}`} style={{ color: '#64183f' }}>
                      {viewingProject.name}
                    </h2>
                  </div>
                  {!isProjectHeaderCollapsed && (
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1 transition-all duration-300 leading-none">
                      Gestor: <span className="text-slate-600 font-bold">{ownerName}</span>
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => setIsProjectHeaderCollapsed(!isProjectHeaderCollapsed)}
                  className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#64183f] hover:border-[#64183f] hover:bg-pink-50 transition-all"
                  title={isProjectHeaderCollapsed ? "Expandir cabeçalho" : "Contrair cabeçalho"}
                >
                  {isProjectHeaderCollapsed ? <CaretDown size={12} weight="bold" /> : <CaretUp size={12} weight="bold" />}
                </button>
                <button 
                  onClick={() => setViewingProject(null)}
                  className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all"
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            </div>

            {/* Project Details Content */}
            <div className="p-8">
              {/* Steps Grid Model (New Model matching requested design with progressive gradients) */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                {sortedSteps.map((step, index) => {
                  const theme = STEP_THEMES[index % STEP_THEMES.length];
                  
                  const allChangesConcluded = changesList.length > 0 && changesList.every(chg => {
                    const originalStatusName = statuses.find(s => s.id === chg.statusId)?.name || '';
                    const statusName = originalStatusName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    return statusName.includes('CONCLUIDO') || statusName.includes('CONCLUÍDO');
                  });

                  // Verify active / transition status for this step
                  const transition = transitions.find(t => t.stepId === step.id);
                  const isCurrentActiveStep = viewingProject.stepId === step.id && !(step.id === 7 && viewingProject.statusId === 3 && allChangesConcluded);
                  const isAnterior = currentStepIndex !== -1 ? index < currentStepIndex : false;

                  // Busca a última transição do projeto para esta etapa específica (PROJECT_ID + OLD_STEP_ID)
                  const latestStepTx = transitions.find(t => t.oldStepId === step.id);
                  
                  const isRejectedTx = !isCurrentActiveStep && latestStepTx && (() => {
                    const statusName = (statuses.find(s => s.id === latestStepTx.oldStatusId)?.name || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    return statusName.includes('REJEITADO') || statusName.includes('REPROVADO') || latestStepTx.oldStatusId === 4;
                  })();

                  let hasPassed = (!isCurrentActiveStep && (isAnterior || !!transition) && !isRejectedTx) || (step.id === 7 && viewingProject.stepId === 7 && viewingProject.statusId === 3 && allChangesConcluded);

                  let statusText = 'Não Iniciado';
                  let badgeText = 'Pendente';
                  let badgeBg = 'bg-slate-100 text-slate-500';
                  let infoText = '0 tarefas';

                  if (isCurrentActiveStep) {
                    const originalStatusName = statuses.find(s => s.id === viewingProject.statusId)?.name || 'EXECUÇÃO';
                    statusText = `Ativo`;
                    badgeText = originalStatusName;
                    badgeBg = 'bg-amber-100 text-amber-700 font-bold';
                    infoText = `${projectTasks.length} tar. (${totalPoints} pts)`;
                  } else if (hasPassed) {
                    statusText = 'Concluído';
                    badgeText = 'Finalizado';
                    badgeBg = 'bg-emerald-100 text-emerald-700 font-bold';
                    infoText = 'Etapa concluída';
                  } else if (isRejectedTx) {
                    statusText = 'Rejeitado';
                    badgeText = 'Reprovado';
                    badgeBg = 'bg-rose-100 text-rose-700 font-bold';
                    infoText = 'Etapa reprovada';
                  }

                  let isPending = !isCurrentActiveStep && !hasPassed;

                  if (step.id === 8) {
                    const hasConcludedChg = changesList.some(chg => {
                      const originalStatusName = statuses.find(s => s.id === chg.statusId)?.name || '';
                      const statusName = originalStatusName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      return statusName.includes('CONCLUIDO') || statusName.includes('CONCLUÍDO');
                    });
                    if (hasConcludedChg) {
                      isPending = false;
                    }
                  }

                  return (
                    <div 
                      key={step.id}
                      onClick={() => {
                        if (isPending) return;
                        if (step.id === 2) {
                          setRotatingStepId(step.id);
                          setTimeout(() => {
                            setRotatingStepId(null);
                            setIsStep2Flipped(prev => !prev);
                          }, 300);
                          return;
                        }
                        if (step.id === 4) {
                          setRotatingStepId(step.id);
                          setTimeout(() => {
                            setRotatingStepId(null);
                            setIsStep4Flipped(prev => !prev);
                          }, 300);
                          return;
                        }
                        if (step.id === 5) {
                          setRotatingStepId(step.id);
                          setTimeout(() => {
                            setRotatingStepId(null);
                            setIsStep5Flipped(prev => !prev);
                          }, 300);
                          return;
                        }
                        if (step.id === 6) {
                          setRotatingStepId(step.id);
                          setTimeout(() => {
                            setRotatingStepId(null);
                            setIsStep6Flipped(prev => !prev);
                          }, 300);
                          return;
                        }
                        if (step.id === 7) {
                          setRotatingStepId(step.id);
                          setTimeout(() => {
                            setRotatingStepId(null);
                            setViewingProjectChanges(true);
                          }, 300);
                          return;
                        }
                        if (step.id === 3) {
                          setRotatingStepId(step.id);
                          setTimeout(() => {
                            setRotatingStepId(null);
                            fetchProjectBacklog(viewingProject.id);
                            setIsViewingPlanningPhases(true);
                          }, 300);
                          return;
                        }
                        if (step.id === 8) {
                          setRotatingStepId(step.id);
                          setTimeout(() => {
                            setRotatingStepId(null);
                            setViewingPostImplantation(true);
                          }, 300);
                          return;
                        }
                        setRotatingStepId(step.id);
                        setTimeout(() => {
                          setRotatingStepId(null);
                          setUploadModalStepId(step.id);
                        }, 300);
                      }}
                      className={`relative rounded-2xl overflow-hidden shadow-md p-2.5 flex flex-col justify-between transition-all duration-300 ease-out select-none perspective-1000 transform-style-3d
                        ${isPending
                          ? 'opacity-40 blur-[0.8px] pointer-events-none' 
                          : 'hover:scale-[1.06] hover:shadow-xl cursor-pointer'
                        }
                        ${rotatingStepId === step.id ? 'animate-flip-3d' : ''}
                        ${selectedStepId === step.id
                          ? 'scale-[1.30] z-50 border-4 border-white shadow-[0_0_35px_rgba(255,255,255,0.9)]'
                          : isCurrentActiveStep
                            ? 'border-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.75)] scale-[1.02] z-10'
                            : 'border border-transparent'
                        }`}
                      style={{ background: theme.gradient, minHeight: '190px' }}
                    >
                      {(step.id === 2 && isStep2Flipped) || (step.id === 4 && isStep4Flipped) || (step.id === 5 && isStep5Flipped) || (step.id === 6 && isStep6Flipped) ? (
                        <>
                          {/* Top Header Back Side */}
                          <div className="flex justify-between items-center px-1.5 pt-0.5 pb-2 text-white w-full gap-2 animate-fade-in">
                            <span className="font-extrabold tracking-wider text-[9px] uppercase">STEP 0{step.id}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setRotatingStepId(step.id);
                                setTimeout(() => {
                                  setRotatingStepId(null);
                                  if (step.id === 2) setIsStep2Flipped(false);
                                  if (step.id === 4) setIsStep4Flipped(false);
                                  if (step.id === 5) setIsStep5Flipped(false);
                                  if (step.id === 6) setIsStep6Flipped(false);
                                }, 300);
                              }}
                              className="relative w-5 h-5 flex items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm shrink-0 text-white hover:bg-white/25 cursor-pointer"
                            >
                              <X size={10} weight="bold" />
                            </button>
                          </div>
                          
                          {/* White Inner Card Back Side */}
                          <div className="bg-white rounded-xl p-3 flex-1 flex flex-col justify-between shadow-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col items-center justify-center my-auto py-1">
                              <div className="w-9 h-9 rounded-full bg-[#f8f9fa] border border-[#64183f]/20 flex items-center justify-center text-[#64183f] mb-1.5 shadow-sm">
                                <User size={18} weight="bold" />
                              </div>
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">Gestor</span>
                              <span className="text-[10px] font-black text-slate-800 text-center truncate max-w-[130px] mt-0.5" title={ownerName}>
                                {ownerName}
                              </span>
                            </div>
                            
                            <div className="flex flex-col gap-1.5 mt-1">
                              {step.id === 5 ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`${window.location.origin}${window.location.pathname}?fullscreen-gantt=true&projectId=${viewingProject?.id}`, '_blank');
                                    }}
                                    className="w-full py-1.5 text-white font-extrabold text-[9px] rounded-lg shadow-md uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-95"
                                    style={{ background: 'linear-gradient(135deg, #172554 0%, #0a0f24 100%)' }}
                                  >
                                    Planning
                                  </button>
                                  <button
                                    disabled={loadingFile || hasPassed || !canWrite}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handleApproveStep5();
                                    }}
                                    className={`w-full py-1.5 text-white font-extrabold text-[9px] rounded-lg shadow-md uppercase tracking-wider transition-all flex items-center justify-center ${
                                      (loadingFile || hasPassed || !canWrite) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 cursor-pointer'
                                    }`}
                                    style={{ background: 'linear-gradient(135deg, #3a0d24 0%, #1c0511 100%)' }}
                                  >
                                    {loadingFile ? (
                                      <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Salvando...
                                      </span>
                                    ) : (
                                      'Concluir'
                                    )}
                                  </button>
                                </>
                              ) : step.id === 6 ? (
                                <>
                                  <button
                                    disabled={loadingFile || hasPassed || !canWrite}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handleApproveStep6();
                                    }}
                                    className={`w-full py-1.5 text-white font-extrabold text-[9px] rounded-lg shadow-md uppercase tracking-wider transition-all flex items-center justify-center ${
                                      (loadingFile || hasPassed || !canWrite) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 cursor-pointer'
                                    }`}
                                    style={{ background: 'linear-gradient(135deg, #172554 0%, #0a0f24 100%)' }}
                                  >
                                    {loadingFile ? (
                                      <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando...
                                      </span>
                                    ) : (
                                      'Concluído'
                                    )}
                                  </button>
                                  <button
                                    disabled={loadingFile || hasPassed || !canWrite}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handleRejectStep6();
                                    }}
                                    className={`w-full py-1.5 text-white font-extrabold text-[9px] rounded-lg shadow-md uppercase tracking-wider transition-all flex items-center justify-center ${
                                      (loadingFile || hasPassed || !canWrite) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 cursor-pointer'
                                    }`}
                                    style={{ background: 'linear-gradient(135deg, #3a0d24 0%, #1c0511 100%)' }}
                                  >
                                    {loadingFile ? (
                                      <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando...
                                      </span>
                                    ) : (
                                      'Cancelado'
                                    )}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    disabled={loadingFile || hasPassed || !canWrite}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (step.id === 2) await handleApproveStep2();
                                      if (step.id === 4) await handleApproveStep4();
                                    }}
                                    className={`w-full py-1.5 text-white font-extrabold text-[9px] rounded-lg shadow-md uppercase tracking-wider transition-all flex items-center justify-center ${
                                      (loadingFile || hasPassed || !canWrite) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 cursor-pointer'
                                    }`}
                                    style={{ background: 'linear-gradient(135deg, #172554 0%, #0a0f24 100%)' }}
                                  >
                                    {loadingFile ? (
                                      <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Salvando...
                                      </span>
                                    ) : (
                                      'Aprovar'
                                    )}
                                  </button>
                                  <button
                                    disabled={loadingFile || hasPassed || !canWrite}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (step.id === 2) await handleRejectStep2();
                                      if (step.id === 4) await handleRejectStep4();
                                    }}
                                    className={`w-full py-1.5 text-white font-extrabold text-[9px] rounded-lg shadow-md uppercase tracking-wider transition-all flex items-center justify-center ${
                                      (loadingFile || hasPassed || !canWrite) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 cursor-pointer'
                                    }`}
                                    style={{ background: 'linear-gradient(135deg, #3a0d24 0%, #1c0511 100%)' }}
                                  >
                                    {loadingFile ? (
                                      <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Salvando...
                                      </span>
                                    ) : (
                                      'Reprovar'
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Top Header */}
                          <div className="flex justify-between items-center px-1.5 pt-0.5 pb-2 text-white w-full gap-2">
                            <span className="font-extrabold tracking-wider text-[9px] uppercase">STEP 0{index + 1}</span>
                            <div className="relative w-5 h-5 flex items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm shrink-0">
                              {isRejectedTx ? (
                                <X size={10} weight="bold" className="text-rose-300" />
                              ) : (!isPending && !isCurrentActiveStep) ? (
                                <Check size={10} weight="bold" className="text-emerald-300" />
                              ) : isCurrentActiveStep ? (
                                <Gear size={10} className="animate-spin text-amber-300" />
                              ) : (
                                <Hourglass size={10} className="text-white/60" />
                              )}
                            </div>
                          </div>
                          
                          {/* White Inner Card */}
                          <div className="bg-white rounded-xl p-3 flex-1 flex flex-col justify-between shadow-sm">
                            {/* Centered Icon */}
                            <div className="flex justify-center my-1" style={{ color: theme.primaryColor }}>
                              {theme.icon}
                            </div>
                            
                            {/* Step Title */}
                            <div className="text-center flex-1 flex flex-col justify-center">
                              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-tight line-clamp-2 leading-snug min-h-[28px] flex items-center justify-center">
                                {step.name}
                              </h4>
                              <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">
                                {statusText}
                              </p>
                            </div>
                            
                            {/* Bottom Info Row */}
                            <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-500 font-bold">
                              <span className="truncate max-w-[50%]">{infoText}</span>
                              <span className={`px-1.5 py-0.5 rounded-full text-[7px] truncate max-w-[50%] ${badgeBg}`}>
                                {badgeText}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
        </>
      )}
      {/* Upload Macro Estimativa Modal */}
      {uploadModalStepId !== null && (() => {
        const modalStepIndex = sortedSteps.findIndex(s => s.id === uploadModalStepId);
        const modalTheme = modalStepIndex !== -1 
          ? STEP_THEMES[modalStepIndex % STEP_THEMES.length] 
          : { 
              gradient: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)', 
              primaryColor: '#64183f',
              percentage: 0,
              icon: <MagnifyingGlass size={26} weight="duotone" />
            };
        const isUploadStep = wizardStep === 1;

        return (
          <div className={`absolute inset-0 z-50 flex flex-col animate-fade-in ${
            wizardStep === 2 
              ? 'p-0 bg-transparent' 
              : 'items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
          }`}>
            <div 
              style={{ 
                background: wizardStep === 2 ? 'transparent' : modalTheme.gradient,
                borderColor: modalTheme.primaryColor,
                boxShadow: wizardStep === 2 ? 'none' : `0 20px 50px rgba(0,0,0,0.3), 0 0 40px ${modalTheme.primaryColor}30`,
                ...(wizardStep === 2 ? {} : { maxWidth: '520px', maxHeight: '95vh' })
              }}
              className={`w-full relative flex flex-col overflow-hidden transition-all duration-300 ${
                wizardStep === 2 ? 'h-full border-0 rounded-none p-0 text-slate-800' : 'border-2 rounded-[2.5rem] p-6 text-white'
              }`}
            >
              {isUploadStep ? (
                <>
                  {/* Header styled like the card top — same pattern for all steps */}
                  <div className="flex justify-between items-center px-2 pt-1 pb-4 text-white w-full gap-2 border-b border-white/10">
                    <span className="font-extrabold tracking-widest text-sm uppercase">STEP 0{modalStepIndex + 1}</span>
                    <button 
                      onClick={handleCloseModal}
                      className="w-8 h-8 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shadow-sm"
                      title="Fechar"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </div>

                  {/* Step 1: Upload File - Styled as White Card inside Gradient wrapper */}
                  <div className="bg-white rounded-[2rem] p-6 flex-1 flex flex-col justify-between shadow-lg text-slate-800 mt-3">
                  
                  {/* Centered Spreadsheet Icon */}
                  <div className="flex justify-center my-3" style={{ color: modalTheme.primaryColor }}>
                    <FileXls size={44} weight="duotone" />
                  </div>
                  
                  {/* Step Title */}
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-snug">
                      Upload Macro Estimativa
                    </h4>
                  </div>

                  {/* Drag and drop input */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[140px]"
                    style={{
                      borderColor: isDragging 
                        ? modalTheme.primaryColor 
                        : selectedFile 
                          ? '#10b981' 
                          : '#e2e8f0',
                      backgroundColor: isDragging 
                        ? modalTheme.primaryColor + '05' 
                        : selectedFile 
                          ? '#f0fdf4' 
                          : '#fafaf9'
                    }}
                  >
                    <input 
                      type="file" 
                      id="macro-file-input" 
                      accept=".xlsx,.xlsm,.xls" 
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                    {selectedFile ? (
                      <>
                        <CheckCircle size={36} className="text-emerald-500 mb-2" weight="fill" />
                        <p className="text-xs font-bold text-slate-800 mb-1 truncate max-w-[280px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </>
                    ) : (
                      <>
                        <FileArrowUp size={36} style={{ color: modalTheme.primaryColor }} className="mb-2" />
                        <p className="text-xs font-bold text-slate-600 mb-1">Arraste e solte o arquivo aqui</p>
                        <p className="text-[10px] text-slate-400 mb-3">Planilha de estimativas (.xlsx, .xlsm, .xls)</p>
                        {!canWrite ? (
                          <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Visualização: Sem permissão de gravação</p>
                        ) : (
                          <label 
                            htmlFor="macro-file-input" 
                            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-[10px] shadow-sm cursor-pointer transition-all uppercase tracking-wider"
                            style={{ color: modalTheme.primaryColor }}
                          >
                            SELECIONAR ARQUIVO
                          </label>
                        )}
                      </>
                    )}
                  </div>

                  {/* Feedback Messages */}
                  {errorMsg && (
                    <div className="mt-3 bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-[11px] font-semibold">
                      {errorMsg}
                    </div>
                  )}



                  {/* Submit / Process Button */}
                  <div className="flex space-x-3 mt-5">
                    {selectedFile && !loadingFile && (
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="px-3 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl font-bold transition-all flex items-center justify-center"
                        title="Remover arquivo"
                      >
                        <FileX size={16} />
                      </button>
                    )}
                    <button
                      onClick={handleProcessFile}
                      disabled={!selectedFile || loadingFile || !canWrite}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 ${
                        !selectedFile || loadingFile || !canWrite
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200/50'
                          : 'text-white hover:opacity-95 hover:scale-[1.01]'
                      }`}
                      style={selectedFile && !loadingFile && canWrite ? { background: modalTheme.gradient } : {}}
                    >
                      {loadingFile ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="uppercase tracking-wider">Carregar e Mapear Planilha</span>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (() => {


                const getBadgeStyle = (comp: string) => {
                  switch (comp.toUpperCase()) {
                    case 'MS':
                      return 'bg-purple-50 text-purple-700 border-purple-200/50';
                    case 'S':
                      return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
                    case 'M':
                      return 'bg-amber-50 text-amber-700 border-amber-200/50';
                    case 'C':
                      return 'bg-blue-50 text-blue-700 border-blue-200/50';
                    default:
                      return 'bg-slate-50 text-slate-600 border-slate-200/50';
                  }
                };

                const renderTechCell = (t: any, tech: string, isBuildGroup: boolean, bottomBorderStyle: any) => {
                  if (t.isDocRow) {
                    return (
                      <td key={`${isBuildGroup ? 'build' : 'arq'}-${tech}`} className="px-3 py-2.5 text-center border-r border-[#64183f]/20" style={bottomBorderStyle}>
                        <span className="text-slate-300">—</span>
                      </td>
                    );
                  }

                  const matches = t.rows.filter((r: any) => {
                    const isBuild = (r.tipo || '').toLowerCase().includes('build');
                    return r.tecnologia === tech && isBuild === isBuildGroup;
                  });

                  if (matches.length === 0) {
                    return (
                      <td key={`${isBuildGroup ? 'build' : 'arq'}-${tech}`} className="px-3 py-2.5 text-center border-r border-[#64183f]/20" style={bottomBorderStyle}>
                        <span className="text-slate-350">—</span>
                      </td>
                    );
                  }

                  let techPoints = 0;
                  const complexities: string[] = [];
                  matches.forEach((match: any) => {
                    const valUpper = (match.valor || '').toUpperCase();
                    const isBuild = (match.tipo || '').toLowerCase().includes('build');
                    let points = 2;
                    if (isBuild && buildPointsMap[valUpper] !== undefined) {
                      points = buildPointsMap[valUpper];
                    } else if (!isBuild && arqPointsMap[valUpper] !== undefined) {
                      points = arqPointsMap[valUpper];
                    } else {
                      switch (valUpper) {
                        case 'MS': points = 2; break;
                        case 'S': points = 4; break;
                        case 'M': points = 8; break;
                        case 'C': points = 12; break;
                      }
                    }
                    techPoints += points;
                    complexities.push(match.valor);
                  });

                  const uniqueComplexities = Array.from(new Set(complexities));

                  return (
                    <td key={`${isBuildGroup ? 'build' : 'arq'}-${tech}`} className="px-3 py-2.5 text-center border-r border-[#64183f]/20" style={bottomBorderStyle}>
                      <div className="flex flex-col items-center justify-center gap-0.5 animate-fade-in">
                        <div className="flex flex-row gap-1 items-center justify-center">
                          {uniqueComplexities.map((c, i) => (
                            <span key={i} className={`px-1.5 py-0.5 text-[8px] font-black rounded-md border tracking-wider uppercase ${getBadgeStyle(c)}`}>
                              {c}
                            </span>
                          ))}
                        </div>
                        <span className="text-[9px] font-extrabold text-slate-700">
                          {techPoints} pts
                        </span>
                      </div>
                    </td>
                  );
                };

                /* Compute summary KPIs */
                const totalReqs = new Set(
                  filteredTasks
                    .filter(t => !t.isDocRow && t.macroRequisito?.trim().toUpperCase() !== 'EF - ESCRITA FUNCIONAL')
                    .map(t => t.macroRequisito)
                ).size;
                const totalTarefas = new Set(
                  filteredTasks
                    .filter(t => !t.isDocRow && t.tarefa?.trim().toUpperCase() !== 'FUNCIONAL (DOCUMENTAÇÃO)' && t.macroRequisito?.trim().toUpperCase() !== 'EF - ESCRITA FUNCIONAL')
                    .map(t => t.tarefa)
                ).size;
                const totalDocs = filteredTasks.filter(t => t.isDocRow).length;
                const totalPontos = filteredTasks.reduce((acc, t) => {
                  if (t.isDocRow) return acc + (t.pontos || 0);
                  let rowPts = 0;
                  t.rows?.forEach((r: any) => {
                    const v = r.valor?.toUpperCase();
                    const isBuild = r.tipo?.toLowerCase().includes('build');
                    if (isBuild && buildPointsMap[v] !== undefined) rowPts += buildPointsMap[v];
                    else if (!isBuild && arqPointsMap[v] !== undefined) rowPts += arqPointsMap[v];
                    else {
                      switch (v) { case 'MS': rowPts += 2; break; case 'S': rowPts += 4; break; case 'M': rowPts += 8; break; case 'C': rowPts += 12; break; }
                    }
                  });
                  return acc + rowPts;
                }, 0);

                return (
                  <>
                    {/* ── HEADER ── */}
                    <div className="px-8 py-4 border-b border-slate-200 bg-white flex flex-col gap-4 z-10 select-none shrink-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 min-w-0">
                          <button 
                            onClick={() => setWizardStep(1)}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0 animate-pulse-subtle"
                            title="Voltar"
                          >
                            <ArrowLeft size={20} weight="bold" />
                          </button>
                          <div>
                            <h2 className="text-2xl font-extrabold text-[#64183f]">Visualizar Backlog Estimado</h2>
                            <p className="text-xs font-semibold text-slate-500 mt-1">Revise os requisitos mapeados e suas estimativas por tecnologia antes de integrar ao backlog do projeto.</p>
                          </div>
                        </div>

                        {/* Action buttons on the right */}
                        <div className="flex items-center gap-3 shrink-0 mr-12 md:mr-16">
                          <button
                            onClick={handleImportToBacklog}
                            disabled={loadingFile || !canWrite}
                            className="px-5 py-2.5 text-white font-extrabold text-xs rounded-full shadow-lg flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            style={{ background: 'linear-gradient(135deg, #1e40af 0%, #172554 100%)' }}
                          >
                            {loadingFile ? (
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Check size={14} weight="bold" />
                                <span className="uppercase tracking-wider">Aprovar Backlog</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* ── Summary KPI Strip ── */}
                      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}>
                          <ClipboardText size={13} weight="duotone" className="text-white/90" />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">{totalReqs} Requisitos</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}>
                          <Gear size={13} weight="duotone" className="text-white/90" />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">{totalTarefas} Tarefas</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}>
                          <FileText size={13} weight="duotone" className="text-white/90" />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">{totalDocs} Documentações</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}>
                          <Rocket size={13} weight="duotone" className="text-white/90" />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">{techColumns.build.length + techColumns.arq.length} Tecnologias</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}>
                          <Flask size={13} weight="duotone" className="text-white/90" />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">{totalPontos} pts Total</span>
                        </div>
                        {(filters.backlogMacroRequisito || filters.backlogTarefa || filters.backlogBuildTechs || filters.backlogArqTechs || filters.backlogComplexidades || filters.searchQuery) && (
                          <button
                            onClick={() => {
                              setFilters(prev => ({
                                ...prev,
                                backlogMacroRequisito: '',
                                backlogTarefa: '',
                                backlogBuildTechs: '',
                                backlogArqTechs: '',
                                backlogComplexidades: '',
                                searchQuery: ''
                              }));
                              handleProcessFile();
                            }}
                            className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-xl border border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors shadow-sm cursor-pointer"
                          >
                            Limpar filtros
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── CONTENT AREA ── */}
                    <div className="flex-1 overflow-y-auto p-2 lg:px-4 lg:py-3 bg-white/85 backdrop-blur-md flex flex-col min-h-0">
                      {/* The Main Table Grid Card */}
                      <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden flex-1 flex flex-col min-h-0 text-slate-800">
                        {/* ── Requirements Table ── */}
                        <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar" style={{ background: 'linear-gradient(180deg, #fafbfc 0%, #ffffff 100%)' }}>
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead className="sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                              {/* Row 1: Group Headers */}
                              <tr className="text-[8px] uppercase tracking-wider font-extrabold text-center text-white"
                                  style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}>
                                {/* Requisito */}
                                <th rowSpan={2} className="px-4 py-2.5 border-r border-white/10 text-white text-center align-middle font-black min-w-[200px] bg-transparent">
                                  Requisito
                                </th>
                                
                                {/* Descrição */}
                                <th rowSpan={2} className="px-4 py-2.5 border-r border-white/10 text-white text-center align-middle font-black min-w-[220px] bg-transparent">
                                  Descrição
                                </th>
                                
                                {/* Technology Group Header - BUILD */}
                                {techColumns.build.length > 0 && (
                                  <th colSpan={techColumns.build.length} className="px-4 py-1.5 border-r border-white/10 text-center text-white font-black bg-transparent border-b border-white/10">
                                    BUILD
                                  </th>
                                )}

                                {/* Technology Group Header - ARQ & DESIGN */}
                                {techColumns.arq.length > 0 && (
                                  <th colSpan={techColumns.arq.length} className="px-4 py-1.5 border-r border-white/10 text-center text-white font-black bg-transparent border-b border-white/10">
                                    ARQ & DESIGN
                                  </th>
                                )}
                                
                                {/* Documentação */}
                                <th rowSpan={2} className="px-4 py-2.5 text-white text-center align-middle font-black w-28 bg-transparent">
                                  Documentação
                                </th>
                              </tr>
                              
                              {/* Row 2: Sub-headers for technologies */}
                              <tr className="text-[7px] uppercase tracking-wider font-extrabold text-center text-white"
                                  style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}>
                                {techColumns.build.map(tech => (
                                  <th key={`build-${tech}`} className="px-3 py-1.5 border-r border-white/10 font-bold text-white bg-transparent min-w-[95px] text-center">
                                    {tech}
                                  </th>
                                ))}
                                {techColumns.arq.map(tech => (
                                  <th key={`arq-${tech}`} className="px-3 py-1.5 border-r border-white/10 font-bold text-white bg-transparent min-w-[95px] text-center">
                                    {tech}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredTasks.map((t, idx) => {
                                // Calculate rowBgClass for alternating macro groups
                                const uniqueMacrosOnPage = Array.from(new Set(filteredTasks.map(x => x.macroRequisito)));
                                const macroIndex = uniqueMacrosOnPage.indexOf(t.macroRequisito);
                                const rowBgClass = macroIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';

                                const prevTask = idx > 0 ? filteredTasks[idx - 1] : null;
                                const isFirstInMacroGroup = !prevTask || prevTask.macroRequisito !== t.macroRequisito;

                                let macroSpanCount = 1;
                                if (isFirstInMacroGroup) {
                                  for (let k = idx + 1; k < filteredTasks.length; k++) {
                                    if (filteredTasks[k].macroRequisito === t.macroRequisito) {
                                      macroSpanCount++;
                                    } else {
                                      break;
                                    }
                                  }
                                }

                                const isFirstInTarefaGroup = !prevTask || prevTask.macroRequisito !== t.macroRequisito || prevTask.tarefa !== t.tarefa;
                                let tarefaSpanCount = 1;
                                if (isFirstInTarefaGroup) {
                                  for (let k = idx + 1; k < filteredTasks.length; k++) {
                                    if (filteredTasks[k].macroRequisito === t.macroRequisito && filteredTasks[k].tarefa === t.tarefa) {
                                      tarefaSpanCount++;
                                    } else {
                                      break;
                                    }
                                  }
                                }

                                const nextTask = idx < filteredTasks.length - 1 ? filteredTasks[idx + 1] : null;
                                const isLastInTarefaGroup = !nextTask || nextTask.macroRequisito !== t.macroRequisito || nextTask.tarefa !== t.tarefa;
                                
                                // Visual border separation
                                const bottomBorderStyle = isLastInTarefaGroup
                                  ? { borderBottom: `2px solid ${modalTheme.primaryColor}20` } 
                                  : undefined;

                                return (
                                  <tr key={t.idJira} className={`${rowBgClass} hover:bg-slate-100/40 transition-colors`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    {/* Requisito Column */}
                                    <td className="px-4 py-2.5 align-top border-r border-slate-200 text-center" style={bottomBorderStyle}>
                                      <div className="flex flex-col items-center justify-center gap-1.5">
                                        <p className="text-slate-800 text-[8px] font-extrabold whitespace-normal break-words leading-snug text-center" title={t.macroRequisito}>
                                          {t.macroRequisito}
                                        </p>
                                      </div>
                                    </td>

                                    {/* Descrição Column */}
                                    <td className="px-4 py-2.5 align-top border-r border-slate-200" style={bottomBorderStyle}>
                                      <p className="text-slate-700 text-[8px] font-semibold whitespace-normal break-words leading-relaxed" title={t.tarefa}>
                                        {t.tarefa}
                                      </p>
                                    </td>

                                    {/* Technologies Columns - BUILD */}
                                    {techColumns.build.map(tech => renderTechCell(t, tech, true, bottomBorderStyle))}
                                    
                                    {/* Technologies Columns - ARQ & DESIGN */}
                                    {techColumns.arq.map(tech => renderTechCell(t, tech, false, bottomBorderStyle))}

                                    {/* Documentação Column */}
                                    <td className="px-3 py-2.5 text-center" style={bottomBorderStyle}>
                                      {t.isDocRow ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide border bg-sky-50 border-sky-200/50 text-sky-700 font-extrabold">
                                          {t.pontos} pts
                                        </span>
                                      ) : (
                                        <span className="text-slate-350">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}

                              {filteredTasks.length === 0 && (
                                <tr>
                                  <td colSpan={techColumns.build.length + techColumns.arq.length + 3} className="px-4 py-12 text-center bg-white">
                                    <div className="flex flex-col items-center gap-2">
                                      <MagnifyingGlass size={28} weight="duotone" className="text-slate-300" />
                                      <span className="text-slate-400 text-xs font-semibold">Nenhum requisito estimado encontrado.</span>
                                      {(filters.backlogMacroRequisito || filters.backlogTarefa || filters.backlogBuildTechs || filters.backlogArqTechs || filters.backlogComplexidades || filters.searchQuery) && (
                                        <button 
                                          onClick={() => { 
                                            setFilters(prev => ({
                                              ...prev,
                                              backlogMacroRequisito: '', 
                                              backlogTarefa: '', 
                                              backlogBuildTechs: '', 
                                              backlogArqTechs: '', 
                                              backlogComplexidades: '',
                                              searchQuery: ''
                                            }));
                                            handleProcessFile();
                                          }} 
                                          className="text-[10px] font-bold underline text-pink-500 hover:text-pink-600"
                                        >
                                          Limpar filtros
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* ── Feedback messages ── */}
                        {errorMsg && (
                          <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-[11px] font-semibold flex items-center gap-2 shrink-0">
                            <X size={14} weight="bold" className="text-red-400 shrink-0" />
                            <span>{errorMsg}</span>
                          </div>
                        )}

                        {successMsg && (
                          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl text-[11px] font-semibold flex items-center gap-2 shrink-0">
                            <CheckCircle size={16} className="text-emerald-500 shrink-0" weight="fill" />
                            <span>{successMsg}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {isViewingPlanningPhases && (
        <div className="absolute inset-0 z-50 flex flex-col bg-white animate-fade-in text-slate-800">
          {/* Header - collapsible */}
          <div className={`px-8 border-b border-slate-200 bg-white sticky top-0 z-10 flex flex-col transition-all duration-300 ${isPlanningHeaderCollapsed ? 'py-1.5' : 'py-2.5 space-y-1.5'}`}>
            {/* Title row - always visible */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-3">
                <h1 className={`font-extrabold text-slate-800 transition-all duration-300 ${isPlanningHeaderCollapsed ? 'text-sm' : 'text-2xl'}`} style={{ color: '#64183f' }}>
                  Planejamento da Entrega
                </h1>

                {/* Collapsed inline project info */}
                {isPlanningHeaderCollapsed && (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <div className="w-1 h-4 bg-slate-200 rounded-full" />
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white font-black text-[8px] shrink-0 shadow-sm"
                      style={{ background: getAvatarGradient(viewingProject.id) }}
                    >
                      {getInitials(viewingProject.name)}
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wider border text-[#64183f] bg-[#fdf2f8] border-[#fbcfe8]">
                      {viewingProject.projectId}
                    </span>
                    <span className="text-xs font-bold text-[#64183f] truncate max-w-[200px]">
                      {viewingProject.name}
                    </span>
                    {activePlanningStep !== null && (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black text-white uppercase tracking-wider" style={{ background: [
                        'linear-gradient(135deg, #881337 0%, #3b0717 100%)',
                        'linear-gradient(135deg, #6d28d9 0%, #2e1065 100%)',
                        'linear-gradient(135deg, #1e40af 0%, #172554 100%)',
                        'linear-gradient(135deg, #0e7490 0%, #083344 100%)'
                      ][activePlanningStep - 1] }}>
                        Passo {activePlanningStep}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Salvar Alocações - available when collapsed and step 3 active */}
                {isPlanningHeaderCollapsed && activePlanningStep === 3 && canWrite && (
                  <button
                    disabled={isSavingAllocations}
                    onClick={handleSaveAllocations}
                    className="px-3 py-1 rounded-xl text-[10px] font-black text-white bg-gradient-to-br from-[#64183f] to-[#1a1f44] hover:opacity-95 transition-all shadow-md uppercase tracking-wider flex items-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingAllocations ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={12} weight="bold" />
                        <span>Salvar Alocações</span>
                      </>
                    )}
                  </button>
                )}

                {/* Criar Planejamento - available when collapsed and step 4 active */}
                {isPlanningHeaderCollapsed && activePlanningStep === 4 && canWrite && (
                  <button
                    disabled={isCreatingPlanning}
                    onClick={handleCreatePlanning}
                    className="relative px-3 py-1 rounded-xl text-[10px] font-black text-white bg-gradient-to-br from-[#64183f] to-[#1a1f44] hover:opacity-95 transition-all shadow-md uppercase tracking-wider flex items-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {hasPendingSync && (
                      <span className="absolute top-[-3px] right-[-3px] flex h-2.5 w-2.5 z-[100]">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-yellow-300 to-lime-400 animate-pulse"></span>
                      </span>
                    )}
                    {isCreatingPlanning ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Sincronizando...</span>
                      </>
                    ) : (
                      <>
                        <ArrowsCounterClockwise size={12} weight="bold" />
                        <span>Sincronizar</span>
                      </>
                    )}
                  </button>
                )}

                {/* Collapse/Expand toggle */}
                <button 
                  onClick={() => setIsPlanningHeaderCollapsed(!isPlanningHeaderCollapsed)}
                  className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#64183f] hover:border-[#fbcfe8] hover:bg-[#fdf2f8] transition-all shrink-0"
                  title={isPlanningHeaderCollapsed ? 'Expandir cabeçalho' : 'Contrair cabeçalho'}
                >
                  {isPlanningHeaderCollapsed ? <CaretDown size={12} weight="bold" /> : <CaretUp size={12} weight="bold" />}
                </button>

                <button 
                  onClick={() => setIsViewingPlanningPhases(false)}
                  className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shrink-0"
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            </div>

            {/* Project info row - hidden when collapsed */}
            {!isPlanningHeaderCollapsed && (
            <div className="flex justify-between items-center gap-2 min-w-0 pt-0.5 animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <button 
                  onClick={() => setIsViewingPlanningPhases(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
                  title="Voltar para o projeto"
                >
                  <ArrowLeft size={14} weight="bold" />
                </button>

                {/* Avatar Circle with initials - shrunken to 50% */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-sm border border-slate-100"
                  style={{ background: getAvatarGradient(viewingProject.id) }}
                >
                  {getInitials(viewingProject.name)}
                </div>

                <div className="min-w-0 flex flex-col justify-center text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider border truncate text-[#64183f] bg-[#fdf2f8] border-[#fbcfe8]">
                      {viewingProject.projectId}
                    </span>
                    <h2 className="text-sm font-extrabold truncate text-[#64183f]">
                      {viewingProject.name}
                    </h2>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                    Gestor: <span className="text-slate-700 font-bold">{ownerName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Information legend explaining overlaps */}
                {orderedPhases.some(group => group.length > 1) && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/50 text-amber-800 text-[9px] font-bold shadow-sm select-none shrink-0">
                    <Info size={11} weight="fill" className="text-amber-500" />
                    <span>Sobreposição indica que as tarefas iniciam em paralelo</span>
                  </div>
                )}


                {activePlanningStep === 4 && canWrite && (
                  <button
                    disabled={isCreatingPlanning}
                    onClick={handleCreatePlanning}
                    className="relative px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-br from-[#64183f] to-[#1a1f44] hover:opacity-95 transition-all shadow-md uppercase tracking-wider flex items-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {hasPendingSync && (
                      <span className="absolute top-[-3px] right-[-3px] flex h-2.5 w-2.5 z-[100]">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-yellow-300 to-lime-400 animate-pulse"></span>
                      </span>
                    )}
                    {isCreatingPlanning ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Sincronizando...</span>
                      </>
                    ) : (
                      <>
                        <ArrowsCounterClockwise size={14} weight="bold" />
                        <span>Sincronizar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            )}    
          </div>

          {/* Body styled with soft background matching step grid background */}
          <div className={`flex-1 bg-[#f8f9fa] overflow-y-auto custom-scrollbar transition-all duration-300 ${activePlanningStep !== null ? 'p-0' : 'pt-2 pb-6 px-8'}`}>
            {(() => {
              const stepsConfig = [
                {
                  id: 1 as const,
                  letter: '1',
                  title: 'Fases da construção',
                  subtitle: 'Distribua sequencia das fases de execução dos requisitos',
                  icon: <Gear size={32} className="text-slate-400" />,
                  color: '#881337',
                  gradient: 'linear-gradient(135deg, #881337 0%, #3b0717 100%)',
                  stepText: 'PASSO A',
                  stepTitle: 'ESTRUTURAR',
                },
                {
                  id: 2 as const,
                  letter: '2',
                  title: 'Prioridade do Backlog',
                  subtitle: 'Mapeie e ordene a relevância dos requisitos',
                  icon: <ClipboardText size={32} className="text-slate-400" />,
                  color: '#6d28d9',
                  gradient: 'linear-gradient(135deg, #6d28d9 0%, #2e1065 100%)',
                  stepText: 'PASSO B',
                  stepTitle: 'PRIORIZAR',
                },
                {
                  id: 3 as const,
                  letter: '3',
                  title: 'Seleção do time',
                  subtitle: 'Defina os integrantes e capacidade da squad',
                  icon: <Users size={32} className="text-slate-400" />,
                  color: '#1e40af',
                  gradient: 'linear-gradient(135deg, #1e40af 0%, #172554 100%)',
                  stepText: 'PASSO C',
                  stepTitle: 'ALOCAR',
                },
                {
                  id: 4 as const,
                  letter: '4',
                  title: 'Planning',
                  subtitle: 'Sincronize o cronograma e agenda de capacidade da squad',
                  icon: <ArrowsCounterClockwise size={32} className="text-slate-400" />,
                  color: '#0e7490',
                  gradient: 'linear-gradient(135deg, #0e7490 0%, #083344 100%)',
                  stepText: 'PASSO D',
                  stepTitle: 'PLANNING',
                }
              ];

              if (activePlanningStep === null) {
                return (
                  <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto h-[400px] mt-2 select-none animate-fade-in">
                    {stepsConfig.map((step) => (
                      <div 
                        key={step.id}
                        onClick={() => setActivePlanningStep(step.id)}
                        className="flex-1 flex flex-col justify-between rounded-3xl overflow-hidden shadow-lg border border-white/10 cursor-pointer group transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl relative p-8 select-none"
                        style={{ background: step.gradient, minHeight: '340px' }}
                      >
                        {/* Curved Wave Layers */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-0" viewBox="0 0 200 100" preserveAspectRatio="none">
                          <path d="M 0 100 C 60 90, 100 45, 200 15 L 200 100 Z" fill="rgba(255, 255, 255, 0.08)" />
                          <path d="M 0 100 C 80 85, 120 60, 200 38 L 200 100 Z" fill="rgba(255, 255, 255, 0.12)" />
                          <path d="M 0 100 C 110 95, 145 82, 200 68 L 200 100 Z" fill="rgba(255, 255, 255, 0.06)" />
                        </svg>

                        {/* Sparkling Stars (✦) */}
                        <div className="absolute inset-0 pointer-events-none select-none z-0">
                          <svg className="absolute left-[12%] top-[25%] w-4 h-4 text-white opacity-40 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                          </svg>
                          <svg className="absolute left-[24%] bottom-[30%] w-2.5 h-2.5 text-white opacity-30" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                          </svg>
                          <svg className="absolute right-[35%] top-[20%] w-3 h-3 text-white opacity-35" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                          </svg>
                        </div>

                        {/* Themed Icon Illustration rotated on the right */}
                        {React.cloneElement(step.icon as React.ReactElement<any>, {
                          size: 130,
                          weight: "duotone" as const,
                          className: "absolute right-[-15px] bottom-[-15px] text-white opacity-[0.22] transform rotate-[-15deg] pointer-events-none select-none z-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]"
                        } as any)}

                        {/* Step Number Indicator */}
                        <div className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white text-base font-black z-10 shadow-sm">
                          0{step.id}
                          {step.id === 4 && hasPendingSync && (
                            <span className="absolute top-[-3px] right-[-3px] flex h-3 w-3 z-20">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                            </span>
                          )}
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col justify-start items-start text-left z-10">
                          <h4 className="text-2xl font-black text-white uppercase tracking-wider leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                            {step.title}
                          </h4>
                          <p className="text-xs text-white/95 mt-3.5 leading-relaxed font-semibold max-w-[200px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                            {step.subtitle}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              // Render a single contracted vertical handle for a step
              const renderHandle = (stepId: 1 | 2 | 3 | 4) => {
                const step = stepsConfig.find(s => s.id === stepId)!;
                const isActive = activePlanningStep === stepId;
                
                let roundedClass = "rounded-none";
                if (stepId === 1) {
                  roundedClass = "rounded-l-3xl";
                } else if (stepId === 4) {
                  roundedClass = "rounded-r-3xl";
                }
                
                return (
                  <div
                    key={`handle-${stepId}`}
                    onClick={() => setActivePlanningStep(isActive ? null : stepId)}
                    className={`w-8 h-full flex flex-col items-stretch cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all duration-350 select-none border-y border-slate-200 shrink-0 ${roundedClass} overflow-hidden shadow-sm relative ${isActive ? 'ring-2 ring-emerald-500 ring-inset z-20' : ''}`}
                    title={isActive ? "Voltar ao visual completo" : `Ir para ${step.title}`}
                  >
                    {/* Active phase visual indicator */}
                    {isActive ? (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2 z-30">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    ) : (stepId === 4 && hasPendingSync && (
                      <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 z-30">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                      </span>
                    ))}

                    {/* Top White Part */}
                    <div className={`flex-[3.5] bg-white flex flex-col items-center justify-around py-4 px-0.5 text-center relative border-r border-slate-100 ${isActive ? 'bg-emerald-50/10' : ''}`}>
                      <span 
                        className="text-2xl font-black tracking-tight"
                        style={{
                          background: step.gradient,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        {step.letter}
                      </span>
                      
                      <div className="text-slate-400 mt-1 scale-75">
                        {step.icon}
                      </div>

                      {/* Small point down arrow */}
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-slate-200/60 z-10" />
                    </div>

                    {/* Bottom Colored Part */}
                    <div 
                      className="flex-[2] flex flex-col items-center justify-center py-4 px-0.5 text-white relative"
                      style={{ background: step.gradient }}
                    >
                      <span 
                        className="text-[8px] font-black uppercase tracking-wider whitespace-nowrap select-none font-sans" 
                        style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                      >
                        {step.title}
                      </span>
                    </div>
                  </div>
                );
              };

              return (
                <div className={`flex gap-0 w-full select-none min-h-0 items-stretch transition-all duration-300 ${isPlanningHeaderCollapsed ? 'h-[calc(100vh-80px)]' : 'h-[460px]'}`}>
                  {/* Step 1 Handle */}
                  {!isPlanningHeaderCollapsed && renderHandle(1)}

                  {/* Step 1 Content */}
                  {activePlanningStep === 1 && (
                    <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden animate-fade-in bg-white border-y border-slate-200 p-6 flex flex-col gap-6 custom-scrollbar">
                      {loadingBacklog ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white h-full">
                          <div className="w-10 h-10 border-4 border-[#64183f]/30 border-t-[#64183f] rounded-full animate-spin mb-4" />
                          <span className="text-slate-500 font-semibold">Carregando fases...</span>
                        </div>
                      ) : distinctPhases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center select-none bg-white p-6 h-full">
                          <ClipboardText size={48} weight="duotone" className="text-slate-350 mb-3" />
                          <h3 className="text-lg font-bold text-slate-775 mb-1">Nenhum planejamento encontrado</h3>
                          <p className="text-sm text-slate-400 max-w-sm">
                            Não existem itens de backlog importados e aprovados para este projeto ainda.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Top Part: Drag and Drop Phase Sequencing */}
                          <div className="pb-5 shrink-0 flex-1 flex flex-col justify-center items-center w-full min-h-full">
                            <h4 className="text-[12px] font-black uppercase text-[#64183f] tracking-widest mb-8 w-full text-center">
                              CLIQUE EM CIMA DA FASE DESEJADA E INDIQUE A SEQUENCIA
                            </h4>
                            <div className="flex flex-row flex-wrap justify-center items-center gap-8 animate-fade-in bg-white p-4 w-full" onClick={() => setActivePhaseCard(null)}>
                              {(() => {
                                const phaseDisplaySeqs: Record<string, number> = {};
                                let lastSeq = 1;
                                let lastRaw = 1;
                                orderedPhases.forEach((group, idx) => {
                                  const name = group[0];
                                  const raw = customPhaseSequences[name] ?? (idx + 1);
                                  if (idx === 0) {
                                    phaseDisplaySeqs[name] = raw;
                                    lastSeq = raw;
                                    lastRaw = raw;
                                  } else {
                                    if (raw === lastRaw) {
                                      phaseDisplaySeqs[name] = lastSeq;
                                    } else {
                                      phaseDisplaySeqs[name] = lastSeq + 1;
                                      lastSeq = lastSeq + 1;
                                    }
                                    lastRaw = raw;
                                  }
                                });

                                return orderedPhases.map((phaseGroup, idx) => {
                                const primaryPhase = phaseGroup[0];
                                let phaseTaskCount = 0;
                                let phasePoints = 0;
                                phaseGroup.forEach(phase => {
                                  const phaseTasks = projectBacklog.filter(item => {
                                    const itemPhase = item.taskPhase && item.taskPhase.trim() ? item.taskPhase.trim().toUpperCase() : '';
                                    return itemPhase === phase;
                                  });
                                  phaseTaskCount += phaseTasks.length;
                                  phasePoints += phaseTasks.reduce((sum, t) => sum + (t.taskPoints || 0), 0);
                                });
                                
                                const GRADIENTS = [
                                  'linear-gradient(135deg, #4f46e5 0%, #3b82f6 50%, #06b6d4 100%)', // indigo-blue-cyan
                                  'linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #f97316 100%)', // rose-pink-orange
                                  'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)', // violet-purple-pink
                                ];
                                const finalCardHeight = Math.max(58, maxTextHeight + 28) * 1.6;
                
                                const isCurrentlyHovered = hoveredIdx === idx;
                                let borderStyle = 'border border-white/20';
                                if (isCurrentlyHovered) {
                                  if (hoveredSide === 'left') borderStyle = 'border-l-4 border-l-white border-y-white/20 border-r-white/20';
                                  else if (hoveredSide === 'right') borderStyle = 'border-r-4 border-r-white border-y-white/20 border-l-white/20';
                                  else if (hoveredSide === 'center') borderStyle = 'ring-2 ring-white ring-opacity-80 scale-105';
                                }
                
                                return (
                                  <div 
                                    key={primaryPhase}
                                    className={`relative pt-6 flex flex-col w-[205px] transition-all duration-300 ${
                                      activePhaseCard === primaryPhase 
                                        ? 'scale-[1.1] z-30' 
                                        : activePhaseCard !== null 
                                          ? 'scale-[0.8] blur-[2px] opacity-60 z-10 pointer-events-none' 
                                          : 'z-20'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActivePhaseCard(prev => prev === primaryPhase ? null : primaryPhase);
                                    }}
                                  >
                                    {activePhaseCard === primaryPhase && idx > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const prevPhase = orderedPhases[idx - 1][0];
                                          const currPhase = primaryPhase;
                                          const prevSeq = phaseDisplaySeqs[prevPhase];
                                          const currSeq = phaseDisplaySeqs[currPhase];

                                          if (currSeq > prevSeq) {
                                            // First click: assume sequence of previous
                                            setCustomPhaseSequences(prev => ({
                                              ...prev,
                                              [currPhase]: prevSeq
                                            }));
                                          } else {
                                            // Second click: swap
                                            const nextList = [...orderedPhases];
                                            [nextList[idx], nextList[idx - 1]] = [nextList[idx - 1], nextList[idx]];
                                            setCustomPhaseSequences(prev => {
                                              const next = { ...prev };
                                              delete next[prevPhase];
                                              delete next[currPhase];
                                              return next;
                                            });
                                            setOrderedPhases(nextList);
                                          }
                                        }}
                                        className="absolute left-[-20px] top-1/2 transform -translate-y-1/2 z-50 w-7 h-7 rounded-full bg-[#172554] text-white flex items-center justify-center shadow-md hover:scale-110 hover:bg-opacity-95 transition-all cursor-pointer border border-white/20"
                                        title="Recuar fase"
                                      >
                                        <CaretLeft size={14} weight="bold" />
                                      </button>
                                    )}
                                    {activePhaseCard === primaryPhase && idx < orderedPhases.length - 1 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const nextPhase = orderedPhases[idx + 1][0];
                                          const currPhase = primaryPhase;
                                          const nextSeq = phaseDisplaySeqs[nextPhase];
                                          const currSeq = phaseDisplaySeqs[currPhase];

                                          if (currSeq < nextSeq) {
                                            // First click: assume sequence of next
                                            setCustomPhaseSequences(prev => ({
                                              ...prev,
                                              [currPhase]: nextSeq
                                            }));
                                          } else {
                                            // Second click: swap
                                            const nextList = [...orderedPhases];
                                            [nextList[idx], nextList[idx + 1]] = [nextList[idx + 1], nextList[idx]];
                                            setCustomPhaseSequences(prev => {
                                              const next = { ...prev };
                                              delete next[nextPhase];
                                              delete next[currPhase];
                                              return next;
                                            });
                                            setOrderedPhases(nextList);
                                          }
                                        }}
                                        className="absolute right-[-20px] top-1/2 transform -translate-y-1/2 z-50 w-7 h-7 rounded-full bg-[#172554] text-white flex items-center justify-center shadow-md hover:scale-110 hover:bg-opacity-95 transition-all cursor-pointer border border-white/20"
                                        title="Avançar fase"
                                      >
                                        <CaretRight size={14} weight="bold" />
                                      </button>
                                    )}
                                    <div 
                                      className="absolute top-2 h-[2px] border-t-2 border-dashed border-[#64183f]/25 z-10"
                                      style={{
                                        left: idx === 0 ? '50%' : '0',
                                        right: idx === orderedPhases.length - 1 ? '50%' : '0'
                                      }}
                                    />
                                    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center">
                                      <div className="w-5 h-5 rounded-full bg-[#f8f9fa] border-2 border-[#64183f] flex items-center justify-center text-[#64183f] text-[10px] font-black shadow-sm">
                                        {phaseDisplaySeqs[primaryPhase]}
                                      </div>
                                    </div>

                                    <div className="relative flex-1" style={{ minHeight: `${finalCardHeight * (1 + (phaseGroup.length - 1) * 0.2)}px` }}>
                                      {phaseGroup.map((phase, pIdx) => {
                                        const scale = 1;
                                        const opacity = 1 - pIdx * 0.1;
                                        const zIndex = 5 + pIdx;
                                        const globalPhaseIdx = distinctPhases.indexOf(phase);
                                        const originalGradient = GRADIENTS[globalPhaseIdx % GRADIENTS.length] || GRADIENTS[0];
                                        const isTopCard = pIdx === phaseGroup.length - 1;

                                        return (
                                          <div 
                                            key={phase}
                                            draggable={isTopCard}
                                            onDragStart={isTopCard ? (e) => {
                                              e.dataTransfer.setData('text/plain', idx.toString());
                                              setDraggedIdx(idx);
                                            } : undefined}
                                            onDragOver={isTopCard ? (e) => handleDragOverCard(e, idx) : undefined}
                                            onDragLeave={isTopCard ? handleDragLeaveCard : undefined}
                                            onDrop={isTopCard ? (e) => handleDropCard(e, idx) : undefined}
                                            onDragEnd={isTopCard ? () => {
                                              setDraggedIdx(null);
                                              handleDragLeaveCard();
                                            } : undefined}
                                            className={`${pIdx === 0 ? 'relative' : 'absolute top-0 left-0'} w-full rounded-[0.9rem] overflow-hidden shadow-sm p-2 flex flex-col justify-between select-none ${isTopCard ? `cursor-grab active:cursor-grabbing hover:scale-[1.03] hover:shadow-md ${borderStyle}` : 'pointer-events-none'} ${
                                              isTopCard && draggedIdx === idx ? 'opacity-40 scale-95 border border-dashed border-white/50' : ''
                                            }`}
                                            style={{ 
                                              background: originalGradient, 
                                              height: `${finalCardHeight}px`, 
                                              zIndex: zIndex,
                                              transform: `translate(${pIdx * 25}%, ${pIdx * 20}%) scale(${scale})`,
                                              opacity: opacity,
                                              transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease, z-index 0.3s ease'
                                            }}
                                          >
                                            {/* Curved Wave Layers */}
                                            <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-0" viewBox="0 0 200 100" preserveAspectRatio="none">
                                              <path d="M 0 100 C 60 90, 100 45, 200 15 L 200 100 Z" fill="rgba(255, 255, 255, 0.08)" />
                                              <path d="M 0 100 C 80 85, 120 60, 200 38 L 200 100 Z" fill="rgba(255, 255, 255, 0.12)" />
                                              <path d="M 0 100 C 110 95, 145 82, 200 68 L 200 100 Z" fill="rgba(255, 255, 255, 0.06)" />
                                            </svg>

                                            {/* Sparkling Stars (✦) */}
                                            <div className="absolute inset-0 pointer-events-none select-none z-0">
                                              <svg className="absolute left-[15%] top-[15%] w-3 h-3 text-white opacity-40 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                                              </svg>
                                              <svg className="absolute left-[24%] bottom-[22%] w-2 h-2 text-white opacity-30" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                                              </svg>
                                              <svg className="absolute right-[32%] top-[16%] w-2.5 h-2.5 text-white opacity-35" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                                              </svg>
                                            </div>

                                            {/* Themed Icon Illustration */}
                                            {(() => {
                                              const name = phase.toUpperCase();
                                              const iconProps = {
                                                size: 80,
                                                weight: "duotone" as const,
                                                className: "absolute right-[-10px] bottom-[-12px] text-white opacity-[0.18] transform rotate-[-12deg] pointer-events-none select-none z-0"
                                              };
                                              if (name.includes('DOC')) return <ClipboardText {...iconProps} />;
                                              if (name.includes('ARQ') || name.includes('DESIGN')) return <Flask {...iconProps} />;
                                              return <Rocket {...iconProps} />;
                                            })()}

                                            {isTopCard ? (
                                              <div className="flex-grow flex flex-col justify-between z-10 w-full h-full pt-1.5 pb-0.5">
                                                <div className="flex-grow flex items-start justify-center px-1 text-center">
                                                  <h4 className="phase-title-text text-[13px] font-black text-white uppercase tracking-wider leading-tight break-words w-full" title={phase}>
                                                    {phase}
                                                  </h4>
                                                </div>
                                                <div className="flex justify-end items-end w-full px-1">
                                                  <span className="text-[12px] font-black text-white/80 bg-black/25 px-2 py-0.5 rounded-sm uppercase tracking-wide">
                                                    {(() => {
                                                      const pTasks = projectBacklog.filter(item => {
                                                        const itemPhase = item.taskPhase && item.taskPhase.trim() ? item.taskPhase.trim().toUpperCase() : '';
                                                        return itemPhase === phase.toUpperCase();
                                                      });
                                                      const pPts = pTasks.reduce((sum, t) => sum + (t.taskPoints || t.pontos || 0), 0);
                                                      return `${pPts} pts`;
                                                    })()}
                                                  </span>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="absolute left-1.5 top-0 bottom-0 flex items-center justify-center z-10 pointer-events-none" style={{ width: '14px' }}>
                                                <h4 
                                                  className="phase-title-text text-[12px] font-black text-white uppercase tracking-wider select-none whitespace-nowrap" 
                                                  style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                                                  title={phase}
                                                >
                                                  {phase}
                                                </h4>
                                              </div>
                                            )}

                                            {isTopCard && phaseGroup.length > 1 && (
                                              <div className="flex justify-center items-center w-full z-10 pt-1 pb-0.5">
                                                <button
                                                  onClick={(e) => handleSplitGroup(e, idx)}
                                                  className="px-2.5 py-1 bg-white/20 hover:bg-white/40 text-white rounded-md text-[10px] font-black uppercase transition-all shadow-sm flex items-center gap-1 border border-white/10 cursor-pointer pointer-events-auto"
                                                  title="Separar fases sobrepostas"
                                                >
                                                  <X size={5} weight="bold" />
                                                  Desmembrar ({phaseGroup.length})
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  );
                                  });
                                })() }
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Step 2 Handle */}
                  {!isPlanningHeaderCollapsed && renderHandle(2)}

                  {/* Step 2 Content */}
                  {activePlanningStep === 2 && (() => {
                      return (
                        <div 
                          className="flex-1 min-w-0 h-full flex flex-col overflow-hidden animate-fade-in"
                        >
                          <div className="bg-white border-y border-slate-200 p-6 flex flex-col flex-1 min-h-0 w-full animate-fade-in items-start gap-6">
                          <TableContainer component={Paper} className="w-full flex-1 overflow-auto custom-scrollbar" sx={{ borderRadius: '24px', boxShadow: '0 4px 20px -2px rgba(100, 24, 63, 0.05)', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                            <Table stickyHeader size="small">
                              {/* Table Header */}
                              <TableHead>
                                <TableRow>
                                  <TableCell width="60px" sx={{ bgcolor: '#64183f', borderBottom: '2px solid #64183f', fontFamily: "'Outfit', sans-serif", borderTopLeftRadius: '24px' }} />
                                  <TableCell width="125px" align="center" sx={{ bgcolor: '#64183f', color: 'white', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '2px solid #64183f', letterSpacing: '0.08em', fontFamily: "'Outfit', sans-serif" }}>Seq</TableCell>
                                  <TableCell sx={{ bgcolor: '#64183f', color: 'white', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '2px solid #64183f', letterSpacing: '0.08em', fontFamily: "'Outfit', sans-serif" }}>Requisito</TableCell>
                                  <TableCell width="140px" align="center" sx={{ bgcolor: '#64183f', color: 'white', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '2px solid #64183f', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif" }}>Pontos</TableCell>
                                  <TableCell width="110px" align="center" sx={{ bgcolor: '#64183f', color: 'white', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '2px solid #64183f', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif" }}>Itens</TableCell>
                                  <TableCell width="120px" align="center" sx={{ bgcolor: '#64183f', color: 'white', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '2px solid #64183f', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif", borderTopRightRadius: '24px' }}>Dependência</TableCell>
                                </TableRow>
                              </TableHead>
                              
                              {/* Table Body */}
                              <TableBody>
                                {(() => { const flatReqs = orderedRequirements.flat(); return flatReqs.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 10, color: 'text.secondary', fontWeight: 'bold', fontSize: '12px', fontFamily: "'Outfit', sans-serif" }}>
                                      Nenhum requisito disponível no backlog.
                                    </TableCell>
                                  </TableRow>
                                ) : null; })()}
                                {(() => {
                                  const flatReqs = orderedRequirements.flat();
                                  const totalReqs = flatReqs.length;
                                  
                                  const displaySequences: Record<string, number> = {};
                                  let lastSeq = 1;
                                  let lastRaw = 1;
                                  flatReqs.forEach((name, idx) => {
                                    const raw = customSequences[name] ?? (idx + 1);
                                    if (idx === 0) {
                                      displaySequences[name] = raw;
                                      lastSeq = raw;
                                      lastRaw = raw;
                                    } else {
                                      if (raw === lastRaw) {
                                        displaySequences[name] = lastSeq;
                                      } else {
                                        displaySequences[name] = lastSeq + 1;
                                        lastSeq = lastSeq + 1;
                                      }
                                      lastRaw = raw;
                                    }
                                  });

                                  return flatReqs.map((reqName, reqIdx) => {
                                    const isExpanded = expandedReqs.has(reqName);
                                    const reqItems = projectBacklog.filter(item => (item.taskName || item.macroRequisito || '') === reqName);
                                    const totalPoints = reqItems.reduce((sum: number, item: any) => sum + (item.taskPoints || item.pontos || 0), 0);
                                    
                                    return (
                                      <React.Fragment key={reqName}>
                                        {/* Requirement Row (Parent) */}
                                        <TableRow 
                                          hover
                                          onClick={() => {
                                            setExpandedReqs(prev => {
                                              const next = new Set(prev);
                                              if (next.has(reqName)) next.delete(reqName);
                                              else next.add(reqName);
                                              return next;
                                            });
                                          }}
                                          sx={{ 
                                            cursor: 'pointer',
                                            bgcolor: isExpanded ? 'rgba(26, 31, 68, 0.02)' : 'white',
                                            transition: 'all 0.2s',
                                            '&:hover': { bgcolor: 'rgba(26, 31, 68, 0.04) !important' }
                                          }}
                                        >
                                          {/* Expand/Collapse icon */}
                                          <TableCell 
                                            align="center" 
                                            sx={{ 
                                              borderBottom: '1px solid #e2e8f0', 
                                              p: 1, 
                                              fontFamily: "'Outfit', sans-serif",
                                              position: 'relative',
                                              '&::before': isExpanded ? {
                                                content: '""',
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '4px',
                                                bgcolor: '#64183f',
                                                borderRadius: '0 4px 4px 0'
                                              } : {}
                                            }}
                                          >
                                            <IconButton 
                                              size="small" 
                                              sx={{ 
                                                p: 0.5, 
                                                bgcolor: isExpanded ? 'rgba(100, 24, 63, 0.1)' : '#f1f5f9', 
                                                color: isExpanded ? '#64183f' : '#64748b', 
                                                '&:hover': { bgcolor: isExpanded ? 'rgba(100, 24, 63, 0.18)' : '#e2e8f0' },
                                                transition: 'all 0.2s'
                                              }}
                                            >
                                              {isExpanded ? <CaretDown size={12} weight="bold" /> : <CaretRight size={12} weight="bold" />}
                                            </IconButton>
                                          </TableCell>

                                          {/* Sequence number with up/down arrows */}
                                          <TableCell align="center" sx={{ borderBottom: '1px solid #e2e8f0', p: 1, fontFamily: "'Outfit', sans-serif" }}>
                                            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                              <button
                                                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 shadow-sm ${
                                                  reqIdx > 0 
                                                    ? 'bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-600 hover:text-white hover:border-violet-600 cursor-pointer' 
                                                    : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed shadow-none'
                                                }`}
                                                disabled={reqIdx === 0}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (reqIdx > 0) {
                                                    const prevReqName = flatReqs[reqIdx - 1];
                                                    const currReqName = flatReqs[reqIdx];
                                                    const prevSeq = displaySequences[prevReqName];
                                                    const currSeq = displaySequences[currReqName];

                                                    if (currSeq > prevSeq) {
                                                      setCustomSequences(prev => ({
                                                        ...prev,
                                                        [currReqName]: prevSeq
                                                      }));
                                                    } else {
                                                      const newFlat = [...flatReqs];
                                                      [newFlat[reqIdx - 1], newFlat[reqIdx]] = [newFlat[reqIdx], newFlat[reqIdx - 1]];
                                                      
                                                      setCustomSequences(prev => {
                                                        const next = { ...prev };
                                                        delete next[prevReqName];
                                                        delete next[currReqName];
                                                        return next;
                                                      });
                                                      
                                                      const newOrderedReqs = newFlat.map(r => [r]);
                                                      setOrderedRequirements(newOrderedReqs);
                                                      saveBacklogSequences(
                                                        projectBacklog,
                                                        newOrderedReqs,
                                                        taskOrders,
                                                        orderedPhases
                                                      );
                                                    }
                                                  }
                                                }}
                                                title="Mover para cima"
                                              >
                                                <ArrowUp size={11} weight="bold" />
                                              </button>
                                              <span className="text-[11px] font-black text-white px-2.5 py-0.5 rounded-full min-w-[28px] text-center shadow-sm" style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}>
                                                {displaySequences[reqName]}
                                              </span>
                                              <button
                                                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 shadow-sm ${
                                                  reqIdx < totalReqs - 1 
                                                    ? 'bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-600 hover:text-white hover:border-violet-600 cursor-pointer' 
                                                    : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed shadow-none'
                                                }`}
                                                disabled={reqIdx === totalReqs - 1}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (reqIdx < totalReqs - 1) {
                                                    const nextReqName = flatReqs[reqIdx + 1];
                                                    const currReqName = flatReqs[reqIdx];
                                                    const nextSeq = displaySequences[nextReqName];
                                                    const currSeq = displaySequences[currReqName];

                                                    if (currSeq < nextSeq) {
                                                      setCustomSequences(prev => ({
                                                        ...prev,
                                                        [currReqName]: nextSeq
                                                      }));
                                                    } else {
                                                      const newFlat = [...flatReqs];
                                                      [newFlat[reqIdx], newFlat[reqIdx + 1]] = [newFlat[reqIdx + 1], newFlat[reqIdx]];
                                                      
                                                      setCustomSequences(prev => {
                                                        const next = { ...prev };
                                                        delete next[nextReqName];
                                                        delete next[currReqName];
                                                        return next;
                                                      });
                                                      
                                                      const newOrderedReqs = newFlat.map(r => [r]);
                                                      setOrderedRequirements(newOrderedReqs);
                                                      saveBacklogSequences(
                                                        projectBacklog,
                                                        newOrderedReqs,
                                                        taskOrders,
                                                        orderedPhases
                                                      );
                                                    }
                                                  }
                                                }}
                                                title="Mover para baixo"
                                              >
                                                <ArrowDown size={11} weight="bold" />
                                              </button>
                                            </div>
                                          </TableCell>

                                          {/* Req name with parent task icon */}
                                          <TableCell sx={{ borderBottom: '1px solid #e2e8f0', p: 1, fontFamily: "'Outfit', sans-serif" }}>
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #1a1f44 0%, #3b82f6 100%)' }}>
                                                <Folder size={13} weight="fill" />
                                              </div>
                                              <span className="text-[13px] font-bold text-slate-800 truncate" title={reqName}>
                                                {reqIdx + 1} - {reqName}
                                              </span>
                                            </div>
                                          </TableCell>

                                          {/* Total Points */}
                                          <TableCell align="center" sx={{ borderBottom: '1px solid #e2e8f0', p: 1, fontFamily: "'Outfit', sans-serif" }}>
                                            <span className="text-[11px] font-extrabold text-white px-2.5 py-0.5 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}>
                                              {totalPoints} pts
                                            </span>
                                          </TableCell>

                                          {/* Item count */}
                                          <TableCell align="center" sx={{ borderBottom: '1px solid #e2e8f0', p: 1, fontFamily: "'Outfit', sans-serif" }}>
                                            <span className="text-[11px] font-semibold text-white px-2.5 py-0.5 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)' }}>
                                              {new Set(reqItems.map((item: any) => item.taskDescription || item.task_description || item.task || item.tarefa || 'Sem descrição')).size} itens
                                            </span>
                                          </TableCell>

                                          {/* Dependência column with attachment icon */}
                                           <TableCell align="center" sx={{ borderBottom: '1px solid #e2e8f0', p: 1, fontFamily: "'Outfit', sans-serif", position: 'relative' }}>
                                             <div className="flex items-center justify-center">
                                               <IconButton 
                                                 size="small" 
                                                 title="Dependências/Anexos" 
                                                 sx={{ color: '#64748b', '&:hover': { color: '#64183f', bgcolor: 'rgba(100, 24, 63, 0.05)' } }}
                                                 onClick={(e) => {
                                                   e.stopPropagation();
                                                   
                                                   const reqItemsForDep = projectBacklog.filter(t => (t.taskName || t.macroRequisito || '') === reqName);
                                                   const firstTask = reqItemsForDep[0];
                                                   const depIds = firstTask && firstTask.dependencies ? String(firstTask.dependencies).split(';').filter(Boolean) : [];
                                                   const depReqNames: string[] = [];
                                                   depIds.forEach(idStr => {
                                                     const depTask = projectBacklog.find(t => String(t.id) === idStr);
                                                     if (depTask) {
                                                       const depReq = depTask.taskName || depTask.macroRequisito || '';
                                                       if (depReq && !depReqNames.includes(depReq)) {
                                                         depReqNames.push(depReq);
                                                       }
                                                     }
                                                   });
                                                   setRequirementDependencies(prev => ({
                                                     ...prev,
                                                     [reqName]: depReqNames
                                                   }));

                                                   setSelectedDependencyTarget({
                                                     type: 'requirement',
                                                     id: reqName,
                                                     name: reqName
                                                   });
                                                   setDependencyDrawerOpen(true);
                                                 }}
                                               >
                                                 <Paperclip size={16} weight="bold" />
                                               </IconButton>
                                               {(() => {
                                                 const reqTasks = projectBacklog.filter(t => (t.taskName || t.macroRequisito || '') === reqName);
                                                 const uniqueDepReqs = new Set<string>();
                                                 reqTasks.forEach(task => {
                                                   if (task.dependencies) {
                                                     const depIds = String(task.dependencies).split(';').filter(Boolean);
                                                     depIds.forEach(idStr => {
                                                       const depTask = projectBacklog.find(t => String(t.id) === idStr);
                                                       if (depTask) {
                                                         const depReqName = depTask.taskName || depTask.macroRequisito || '';
                                                         if (depReqName && depReqName !== reqName) {
                                                           uniqueDepReqs.add(depReqName);
                                                         }
                                                       }
                                                     });
                                                   }
                                                 });
                                                 const count = uniqueDepReqs.size;
                                                 if (count === 0) return null;
                                                 return (
                                                    <span 
                                                     className="text-[11px] font-black text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md shrink-0 select-none absolute right-2.5 top-1/2 -translate-y-1/2"
                                                      style={{ background: 'linear-gradient(135deg, #1A365D 0%, #0A192F 100%)' }}
                                                      title={`Depende de ${count} requisito(s)`}
                                                    >
                                                      {count}
                                                    </span>
                                                 );
                                               })()}
                                             </div>
                                           </TableCell>
                                        </TableRow>

                                        {/* Expanded Sub-items Row */}
                                        {isExpanded && (
                                          <TableRow sx={{ bgcolor: 'rgba(109, 40, 217, 0.01)' }}>
                                            <TableCell colSpan={6} sx={{ p: 0, borderBottom: '1px solid #e2e8f0' }}>
                                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                <Box sx={{ py: 2.5, px: 4, bgcolor: '#faf9fc' }}>
                                                  {(() => {
                                                    // 1. Group by task description (Level 2)
                                                    const descGroups: { [desc: string]: { minId: number; desc: string; sumPoints: number; items: any[] } } = {};
                                                    reqItems.forEach((t: any) => {
                                                      const desc = t.taskDescription || t.task_description || t.task || t.tarefa || 'Sem descrição';
                                                      if (!descGroups[desc]) {
                                                        descGroups[desc] = { minId: t.id || 999999, desc, sumPoints: 0, items: [] };
                                                      } else {
                                                        if (t.id && t.id < descGroups[desc].minId) {
                                                          descGroups[desc].minId = t.id;
                                                        }
                                                      }
                                                      descGroups[desc].sumPoints += (t.taskPoints || t.pontos || 0);
                                                      descGroups[desc].items.push(t);
                                                    });
                                                    
                                                    const defaultDescOrder = Object.values(descGroups).sort((a, b) => a.minId - b.minId).map(x => x.desc);
                                                    const currentDescOrder = taskOrders[reqName] ?? defaultDescOrder;
                                                    const finalDescOrder = [
                                                      ...currentDescOrder.filter(d => defaultDescOrder.includes(d)),
                                                      ...defaultDescOrder.filter(d => !currentDescOrder.includes(d))
                                                    ];
                                                    
                                                    const sortedDescList = Object.values(descGroups).sort((a, b) => {
                                                      return finalDescOrder.indexOf(a.desc) - finalDescOrder.indexOf(b.desc);
                                                    });
                                                    const flatPhases = orderedPhases.flat().map(p => p.toUpperCase());

                                                    return (
                                                      <Table size="small" sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', bgcolor: 'white', boxShadow: '0 4px 12px rgba(26,31,68,0.03)' }}>
                                                        <TableHead>
                                                          <TableRow>
                                                            <TableCell width="40px" sx={{ background: 'rgba(100, 24, 63, 0.5)', borderBottom: '1.5px solid rgba(100, 24, 63, 0.6)', fontFamily: "'Outfit', sans-serif", borderTopLeftRadius: '12px' }} />
                                                            <TableCell width="120px" align="center" sx={{ background: 'rgba(100, 24, 63, 0.5)', color: 'white', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1.5px solid rgba(100, 24, 63, 0.6)', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif" }}>Seq</TableCell>
                                                            <TableCell sx={{ background: 'rgba(100, 24, 63, 0.5)', color: 'white', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1.5px solid rgba(100, 24, 63, 0.6)', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif" }}>Tarefa / Descrição</TableCell>
                                                            <TableCell width="140px" align="center" sx={{ background: 'rgba(100, 24, 63, 0.5)', color: 'white', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1.5px solid rgba(100, 24, 63, 0.6)', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif" }}>Pontos</TableCell>
                                                            <TableCell width="100px" sx={{ background: 'rgba(100, 24, 63, 0.5)', borderBottom: '1.5px solid rgba(100, 24, 63, 0.6)', fontFamily: "'Outfit', sans-serif" }} />
                                                            <TableCell width="120px" align="center" sx={{ background: 'rgba(100, 24, 63, 0.5)', color: 'white', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1.5px solid rgba(100, 24, 63, 0.6)', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif", borderTopRightRadius: '12px' }}>Dependência</TableCell>
                                                          </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                          {sortedDescList.map((descGroup, descIdx) => {
                                                            const isDescExpanded = expandedDescs.has(`${reqName}-${descGroup.desc}`);
                                                            
                                                            const sortedSubItems = descGroup.items.map((t: any) => {
                                                              return {
                                                                id: t.id,
                                                                phase: t.taskPhase || t.fase || 'Sem Fase',
                                                                technology: t.taskTechnology || t.tecnologia || '',
                                                                points: t.taskPoints || t.pontos || 0
                                                              };
                                                            }).sort((a, b) => {
                                                              const idxA = flatPhases.indexOf(a.phase.toUpperCase());
                                                              const idxB = flatPhases.indexOf(b.phase.toUpperCase());
                                                              const diff = (idxA === -1 ? 999999 : idxA) - (idxB === -1 ? 999999 : idxB);
                                                              if (diff !== 0) return diff;
                                                              const techDiff = a.technology.localeCompare(b.technology);
                                                              if (techDiff !== 0) return techDiff;
                                                              return (a.id || 0) - (b.id || 0);
                                                            });

                                                            return (
                                                              <React.Fragment key={descGroup.desc || descIdx}>
                                                                {/* Level 2 Row - Description */}
                                                                <TableRow 
                                                                  hover
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedDescs(prev => {
                                                                      const next = new Set(prev);
                                                                      const key = `${reqName}-${descGroup.desc}`;
                                                                      if (next.has(key)) next.delete(key);
                                                                      else next.add(key);
                                                                      return next;
                                                                    });
                                                                  }}
                                                                  sx={{ 
                                                                    cursor: 'pointer',
                                                                    bgcolor: isDescExpanded ? 'rgba(26, 31, 68, 0.03)' : 'transparent',
                                                                    transition: 'all 0.2s',
                                                                  }}
                                                                >
                                                                  <TableCell 
                                                                    align="center" 
                                                                    sx={{ 
                                                                      borderBottom: '1px solid #e2e8f0', 
                                                                      p: 0.8, 
                                                                      fontFamily: "'Outfit', sans-serif",
                                                                      position: 'relative',
                                                                      '&::before': isDescExpanded ? {
                                                                        content: '""',
                                                                        position: 'absolute',
                                                                        left: 0,
                                                                        top: 0,
                                                                        bottom: 0,
                                                                        width: '4px',
                                                                        bgcolor: '#64183f',
                                                                        borderRadius: '0 4px 4px 0'
                                                                      } : {}
                                                                    }}
                                                                  >
                                                                    <IconButton 
                                                                      size="small" 
                                                                      onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedDescs(prev => {
                                                                          const next = new Set(prev);
                                                                          const key = `${reqName}-${descGroup.desc}`;
                                                                          if (next.has(key)) next.delete(key);
                                                                          else next.add(key);
                                                                          return next;
                                                                        });
                                                                      }}
                                                                      sx={{ 
                                                                        p: 0.4, 
                                                                        bgcolor: isDescExpanded ? 'rgba(100, 24, 63, 0.1)' : '#f1f5f9', 
                                                                        color: isDescExpanded ? '#64183f' : '#64748b',
                                                                        '&:hover': { bgcolor: isDescExpanded ? 'rgba(100, 24, 63, 0.18)' : '#e2e8f0' } 
                                                                      }}
                                                                    >
                                                                      {isDescExpanded ? <CaretDown size={10} weight="bold" /> : <CaretRight size={10} weight="bold" />}
                                                                    </IconButton>
                                                                  </TableCell>

                                                                  {/* Up/Down Arrow Sequence sorting */}
                                                                  <TableCell align="center" sx={{ borderBottom: '1px solid #e2e8f0', p: 0.8, fontFamily: "'Outfit', sans-serif" }}>
                                                                    <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                                      <button
                                                                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-200 shadow-sm ${
                                                                          descIdx > 0 
                                                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 cursor-pointer' 
                                                                            : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed shadow-none'
                                                                        }`}
                                                                        disabled={descIdx === 0}
                                                                        onClick={(e) => {
                                                                          e.stopPropagation();
                                                                          handleMoveDesc(reqName, descIdx, 'up', sortedDescList);
                                                                        }}
                                                                        title="Mover para cima"
                                                                      >
                                                                        <ArrowUp size={9} weight="bold" />
                                                                      </button>
                                                                      <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full min-w-[24px] text-center shadow-sm" style={{ background: 'rgba(100, 24, 63, 0.3)', border: '1px solid rgba(100, 24, 63, 0.2)' }}>
                                                                        {reqIdx + 1}.{descIdx + 1}
                                                                      </span>
                                                                      <button
                                                                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-200 shadow-sm ${
                                                                          descIdx < sortedDescList.length - 1 
                                                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 cursor-pointer' 
                                                                            : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed shadow-none'
                                                                        }`}
                                                                        disabled={descIdx === sortedDescList.length - 1}
                                                                        onClick={(e) => {
                                                                          e.stopPropagation();
                                                                          handleMoveDesc(reqName, descIdx, 'down', sortedDescList);
                                                                        }}
                                                                        title="Mover para baixo"
                                                                      >
                                                                        <ArrowDown size={9} weight="bold" />
                                                                      </button>
                                                                    </div>
                                                                  </TableCell>

                                                                  {/* Task description */}
                                                                  <TableCell sx={{ borderBottom: '1px solid #e2e8f0', p: 0.8, fontFamily: "'Outfit', sans-serif" }}>
                                                                    <span className="text-slate-800 leading-normal text-[12px]" title={descGroup.desc}>
                                                                      {descGroup.desc}
                                                                    </span>
                                                                  </TableCell>

                                                                  {/* Total points for this description */}
                                                                  <TableCell align="center" sx={{ borderBottom: '1px solid #e2e8f0', p: 0.8, fontFamily: "'Outfit', sans-serif" }}>
                                                                    <span className="text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full shadow-sm" style={{ background: 'rgba(100, 24, 63, 0.3)', border: '1px solid rgba(100, 24, 63, 0.2)' }}>
                                                                      {descGroup.sumPoints} pts
                                                                    </span>
                                                                  </TableCell>
                                                                  
                                                                  <TableCell sx={{ borderBottom: '1px solid #e2e8f0', p: 0.8, fontFamily: "'Outfit', sans-serif" }} />
                                                                  
                                                                  {/* Dependência column with attachment icon */}
                                                                   <TableCell align="center" sx={{ borderBottom: '1px solid #e2e8f0', p: 0.8, fontFamily: "'Outfit', sans-serif", position: 'relative' }}>
                                                                     <div className="flex items-center justify-center">
                                                                       <IconButton 
                                                                         size="small" 
                                                                         title="Dependências/Anexos" 
                                                                         sx={{ color: '#64748b', '&:hover': { color: '#64183f', bgcolor: 'rgba(100, 24, 63, 0.05)' } }}
                                                                           onClick={(e) => {
                                                                             e.stopPropagation();
                                                                             
                                                                             const depSet = new Set<string>();
                                                                             descGroup.items.forEach(t => {
                                                                               const deps = t.dependencies ? String(t.dependencies).split(';').filter(Boolean) : [];
                                                                               deps.forEach(d => {
                                                                                 const depTask = projectBacklog.find(x => String(x.id) === d);
                                                                                 if (depTask) {
                                                                                   const depDesc = depTask.taskDescription || depTask.task_description || depTask.task || depTask.tarefa || 'Sem descrição';
                                                                                   depSet.add(depDesc);
                                                                                 }
                                                                               });
                                                                             });
                                                                             setDescriptionDependencies(prev => ({
                                                                               ...prev,
                                                                               [descGroup.desc]: Array.from(depSet)
                                                                             }));
                                                                             setSelectedDependencyTarget({
                                                                               type: 'description',
                                                                               id: descGroup.desc,
                                                                               name: `${reqIdx + 1}.${descIdx + 1} - ${descGroup.desc}`,
                                                                               requirementName: reqName
                                                                             });
                                                                             setDependencyDrawerOpen(true);
                                                                           }}
                                                                       >
                                                                         <Paperclip size={14} weight="bold" />
                                                                       </IconButton>
                                                                        {(() => {
                                                                          const groupTasks = projectBacklog.filter(t => {
                                                                            const tReq = t.taskName || t.macroRequisito || '';
                                                                            const tDesc = t.taskDescription || t.task_description || t.task || t.tarefa || 'Sem descrição';
                                                                            return tReq === reqName && tDesc === descGroup.desc;
                                                                          });
                                                                          const uniqueDepDescs = new Set<string>();
                                                                          groupTasks.forEach(task => {
                                                                            if (task.dependencies) {
                                                                              const depIds = String(task.dependencies).split(';').filter(Boolean);
                                                                              depIds.forEach(idStr => {
                                                                                const depTask = projectBacklog.find(t => String(t.id) === idStr);
                                                                                if (depTask) {
                                                                                  const depDesc = depTask.taskDescription || depTask.task_description || depTask.task || depTask.tarefa || 'Sem descrição';
                                                                                  if (depDesc && depDesc !== descGroup.desc) {
                                                                                    uniqueDepDescs.add(depDesc);
                                                                                  }
                                                                                }
                                                                              });
                                                                            }
                                                                          });
                                                                          const count = uniqueDepDescs.size;
                                                                          if (count === 0) return null;
                                                                          return (
                                                                            <span 
                                                                             className="text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-sm shrink-0 select-none absolute right-2.5 top-1/2 -translate-y-1/2"
                                                                              style={{ background: 'rgba(100, 24, 63, 0.3)', border: '1px solid rgba(100, 24, 63, 0.2)', color: '#64183f' }}
                                                                              title={`Depende de ${count} tarefa(s)`}
                                                                            >
                                                                              {count}
                                                                            </span>
                                                                          );
                                                                        })()}
                                                                     </div>
                                                                   </TableCell>
                                                                </TableRow>

                                                                {/* Level 3 Rows - Sub-tasks */}
                                                                {isDescExpanded && (
                                                                  <TableRow>
                                                                    <TableCell colSpan={6} sx={{ p: 0, bgcolor: 'white', fontFamily: "'Outfit', sans-serif" }}>
                                                                      <Collapse in={isDescExpanded} timeout="auto" unmountOnExit>
                                                                        <Box sx={{ pl: 6, pr: 2, py: 1.5, bgcolor: '#faf9fc' }}>
                                                                          <Table size="small" sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', bgcolor: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.01)' }}>
                                                                            <TableBody>
                                                                              {sortedSubItems.map((sub, sIdx) => (
                                                                                <TableRow key={sub.id || sIdx} hover>
                                                                                  <TableCell width="40px" sx={{ borderBottom: '1px solid #f1f5f9', p: 0.8, fontFamily: "'Outfit', sans-serif" }} />
                                                                                  <TableCell width="120px" align="center" sx={{ borderBottom: '1px solid #f1f5f9', p: 0.8, fontFamily: "'Outfit', sans-serif" }}>
                                                                                    <span className="text-[9px] font-semibold text-white px-2 py-0.5 rounded-full text-center" style={{ background: 'rgba(100, 24, 63, 0.3)', border: '1px solid rgba(100, 24, 63, 0.2)' }}>
                                                                                      {reqIdx + 1}.{descIdx + 1}.{sIdx + 1}
                                                                                    </span>
                                                                                  </TableCell>
                                                                                  <TableCell sx={{ borderBottom: '1px solid #f1f5f9', p: 0.8, fontFamily: "'Outfit', sans-serif" }}>
                                                                                    <div className="flex items-center gap-1.5">
                                                                                      <span className="text-slate-300 select-none">↳</span>
                                                                                      <span className="font-extrabold text-[#64183f] uppercase tracking-wide text-[9px] bg-[#fdf2f8] border border-[#fbcfe8] px-2 py-0.5 rounded-full">{sub.phase}</span>
                                                                                      <span className="text-slate-300 font-medium">|</span>
                                                                                      <span className="text-slate-700 font-bold text-[11px] bg-[#f8fafc] border border-[#e2e8f0] px-2 py-0.5 rounded-full">{sub.technology || 'Sem tecnologia'}</span>
                                                                                    </div>
                                                                                  </TableCell>
                                                                                  <TableCell width="140px" align="center" sx={{ borderBottom: '1px solid #f1f5f9', p: 0.8, fontFamily: "'Outfit', sans-serif" }}>
                                                                                    <span className="text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full shadow-sm" style={{ background: 'rgba(100, 24, 63, 0.3)', border: '1px solid rgba(100, 24, 63, 0.2)' }}>{sub.points} pts</span>
                                                                                  </TableCell>
                                                                                  <TableCell width="100px" sx={{ borderBottom: '1px solid #f1f5f9', p: 0.8, fontFamily: "'Outfit', sans-serif" }} />
                                                                                  <TableCell width="120px" align="center" sx={{ borderBottom: '1px solid #f1f5f9', p: 0.8, fontFamily: "'Outfit', sans-serif" }}>
                                                                                    <IconButton 
                                                                                      size="small" 
                                                                                      title="Dependências/Anexos" 
                                                                                      sx={{ color: '#64748b', '&:hover': { color: '#64183f', bgcolor: 'rgba(100, 24, 63, 0.05)' } }}
                                                                                        onClick={(e) => {
                                                                                          e.stopPropagation();
                                                                                          
                                                                                          const clickedTask = projectBacklog.find(t => String(t.id) === String(sub.id));
                                                                                          const depIds = clickedTask && clickedTask.dependencies ? String(clickedTask.dependencies).split(';').filter(Boolean) : [];
                                                                                          setSubtaskDependencies(prev => ({
                                                                                            ...prev,
                                                                                            [String(sub.id)]: depIds
                                                                                          }));
                                                                                          setSelectedDependencyTarget({
                                                                                            type: 'subtask',
                                                                                            id: String(sub.id),
                                                                                            name: `${reqIdx + 1}.${descIdx + 1}.${sIdx + 1} - ${sub.phase} | ${sub.technology}`,
                                                                                            requirementName: reqName,
                                                                                            descGroupText: descGroup.desc
                                                                                          });
                                                                                          setDependencyDrawerOpen(true);
                                                                                        }}
                                                                                    >
                                                                                      <Paperclip size={12} weight="bold" />
                                                                                    </IconButton>
                                                                                  </TableCell>
                                                                                </TableRow>
                                                                              ))}
                                                                            </TableBody>
                                                                          </Table>
                                                                        </Box>
                                                                      </Collapse>
                                                                    </TableCell>
                                                                  </TableRow>
                                                                )}
                                                              </React.Fragment>
                                                            );
                                                          })}
                                                        </TableBody>
                                                      </Table>
                                                    );
                                                  })()}
                                                </Box>
                                              </Collapse>
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </React.Fragment>
                                    );
                                  });
                                })()}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Step 3 Handle */}
                  {!isPlanningHeaderCollapsed && renderHandle(3)}

                  {/* Step 3 Content */}
                  {activePlanningStep === 3 && (() => {
                    const step3PhaseTechs = (() => {
                      const list: Array<{ phase: string; tech: string }> = [];
                      const seen = new Set<string>();
                      projectBacklog.forEach(item => {
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

                    const squadByProfile = (() => {
                      const groups: Record<string, typeof squad> = {};
                      const activeSquad = availableProfessionals.filter(member => (member.status || 'ATIVO') === 'ATIVO');
                      activeSquad.forEach(member => {
                        const profile = member.perfil || 'Outros';
                        if (!groups[profile]) {
                          groups[profile] = [];
                        }
                        groups[profile].push(member);
                      });
                      return groups;
                    })();

                    const STEP3_CARD_GRADIENTS = [
                      'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)', // Purple/Pink
                      'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Green
                      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
                      'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', // Orange
                      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // Cyan
                      'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', // Red
                      'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', // Light Blue
                      'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', // Pink
                    ];

                    const getStep3CardIcon = (idx: number) => {
                      const size = 36;
                      const props = { size, weight: "duotone" as const, className: "absolute right-[-4px] bottom-[-4px] text-white opacity-[0.22] transform rotate-[-12deg] pointer-events-none select-none z-0" };
                      switch (idx % 8) {
                        case 0: return <ClipboardText {...props} />;
                        case 1: return <FileText {...props} />;
                        case 2: return <Users {...props} />;
                        case 3: return <Play {...props} />;
                        case 4: return <Rocket {...props} />;
                        case 5: return <Hourglass {...props} />;
                        case 6: return <Folder {...props} />;
                        default: return <Gear {...props} />;
                      }
                    };

                    const getProfessionalAllocations = (nome: string) => {
                      const result: { phase: string; tech: string; gradient: string }[] = [];
                      step3PhaseTechs.forEach((pair, idx) => {
                        const key = `${pair.phase}-${pair.tech}`;
                        const allocatedProfs = allocations[key] || [];
                        if (allocatedProfs.includes(nome)) {
                          const gradient = STEP3_CARD_GRADIENTS[idx % STEP3_CARD_GRADIENTS.length];
                          result.push({ phase: pair.phase, tech: pair.tech, gradient });
                        }
                      });
                      return result;
                    };

                    return (
                      <div className="flex-grow flex h-full overflow-hidden animate-fade-in text-slate-800">
                         {/* Main step 3 workspace (Minsait Professionals Grouped by Profile) */}
                         <div className="flex-1 bg-white p-6 flex flex-col overflow-y-auto h-full custom-scrollbar">
                            <div className="border-b border-slate-100 pb-4 mb-6 shrink-0 text-left select-none">
                              <div>
                                <h3 className="text-sm font-black text-[#64183f] uppercase tracking-wider">Alocação de Profissionais</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Arraste os profissionais para os cards de Fases & Tecnologias na barra lateral</p>
                              </div>
                            </div>

                           <div className="space-y-8">
                             {Object.entries(squadByProfile).map(([profileName, members]) => {
                               const isProfileExpanded = expandedProfiles.has(profileName);
                               return (
                                 <div key={profileName} className="space-y-3.5">
                                   <div 
                                     onClick={() => {
                                       setExpandedProfiles(prev => {
                                         const next = new Set(prev);
                                         if (next.has(profileName)) {
                                           next.delete(profileName);
                                         } else {
                                           next.add(profileName);
                                         }
                                         return next;
                                      });
                                    }}
                                    className="border-b border-slate-200/80 pb-2 flex items-center justify-between cursor-pointer select-none hover:text-[#64183f] group"
                                  >
                                    <h4 className="text-xs font-black text-[#64183f] uppercase tracking-wider flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#64183f]" />
                                      <span>{profileName} ({members.length})</span>
                                      {members.some(m => profsWithPendingChanges.has(m.nome)) && (
                                        <span className="flex h-2.5 w-2.5 relative ml-1">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-yellow-300 to-lime-400 animate-pulse"></span>
                                        </span>
                                      )}
                                    </h4>
                                    <span className="text-slate-400 group-hover:text-[#64183f] transition-colors">
                                      {isProfileExpanded ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
                                    </span>
                                  </div>

                                  {isProfileExpanded && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-fade-in">
                                      {members.map((member) => {
                                        const avatarObj = member.avatar ? getAvatarById(member.avatar) : null;
                                        const initials = getInitials(member.nome);
                                        const ringSize = 77;
                                        const photoSize = 61;

                                        return (
                                          <div 
                                            key={member.nome}
                                            draggable={true}
                                            onDragStart={(e) => {
                                              e.dataTransfer.setData("text/plain", member.nome);
                                            }}
                                            onClick={() => {
                                              setEditingProfessional(member);
                                              const details = profDetails[member.nome] || { productivity: 100, isPartTime: false, startDates: {}, endDates: {} };
                                              setProductivityPct(details.productivity);
                                              setIsPartTime(details.isPartTime);
                                              setActivityStartDates(details.startDates);
                                              setActivityEndDates(details.endDates || {});
                                            }}
                                            className="flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-[1.05] p-2 rounded-2xl hover:bg-[#64183f]/5 relative select-none w-full active:cursor-grabbing"
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
                                                    {initials || <Users size={20} />}
                                                  </div>
                                                )}
                                              </div>
                                              <ArcRing size={ringSize} />
                                              
                                              {/* Blinking dot for pending changes on the top right of avatar */}
                                              {profsWithPendingChanges.has(member.nome) && (
                                                <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5 z-30">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-yellow-300 to-lime-400 animate-pulse"></span>
                                                </span>
                                              )}
                                            </div>

                                            {/* Name + Profile + Indicators */}
                                            <div className="mt-2 text-center px-1 flex flex-col items-center" style={{ maxWidth: ringSize + 30 }}>
                                              {/* Allocated Phase/Tech Indicators */}
                                              {(() => {
                                                const allocs = getProfessionalAllocations(member.nome);
                                                if (allocs.length === 0) return null;
                                                return (
                                                  <div className="flex flex-wrap gap-1 items-center justify-center mb-1.5 max-w-full">
                                                    {allocs.map((alloc, aIdx) => (
                                                      <div 
                                                        key={aIdx}
                                                        title={`${alloc.phase} - ${alloc.tech}`}
                                                        className="w-3.5 h-3.5 rounded-full border border-slate-105 shadow-sm cursor-help relative z-20 pointer-events-auto"
                                                        style={{ background: alloc.gradient }}
                                                      />
                                                    ))}
                                                  </div>
                                                );
                                              })()}
                                              <h4 className="text-[10px] font-black text-slate-800 line-clamp-2 leading-snug min-h-[26px]" title={member.nome}>
                                                {member.nome}
                                              </h4>

                                              {/* Period & Productivity Indicators below the name */}
                                              {(() => {
                                                const details = profDetails[member.nome] || { productivity: 100, isPartTime: false };
                                                return (
                                                  <div className="flex gap-1 items-center justify-center mt-1 select-none pointer-events-none">
                                                    <span className={`px-1 py-0.5 rounded text-[7px] font-black tracking-wider border leading-none ${
                                                      details.isPartTime
                                                        ? 'bg-[#64183f]/10 text-[#64183f] border-[#64183f]/20'
                                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                                    }`}>
                                                      {details.isPartTime ? 'PT' : 'FT'}
                                                    </span>
                                                    <span className={`px-1 py-0.5 rounded text-[7px] font-black tracking-wider border leading-none ${
                                                      details.productivity === 100
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                                        : details.productivity >= 50
                                                          ? 'bg-amber-50 text-amber-700 border-amber-250'
                                                          : 'bg-rose-50 text-rose-700 border-rose-250'
                                                    }`}>
                                                      {details.productivity}%
                                                    </span>
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {squad.length === 0 && (
                              <div className="text-center py-12 text-slate-400 font-bold">Nenhum profissional cadastrado na Minsait.</div>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Right Sidebar */}
                        <div 
                          className="bg-[#f8f9fa] border-l border-slate-200 transition-all duration-300 flex flex-col shadow-sm shrink-0 h-full relative"
                          style={{ width: isStep3SidebarExpanded ? '320px' : '3.5rem' }}
                        >
                          {/* Sidebar Header / Toggle Button */}
                          <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                            {isStep3SidebarExpanded ? (
                              <span className="font-extrabold text-[#64183f] text-sm truncate uppercase tracking-wider">
                                Fases & Tecnologias ({step3PhaseTechs.length})
                              </span>
                            ) : (
                              <span className="w-full text-center text-[10px] font-black text-[#64183f]/60 uppercase tracking-tight block">
                                FAS
                              </span>
                            )}
                            <button 
                              onClick={() => setIsStep3SidebarExpanded(!isStep3SidebarExpanded)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors ml-auto flex items-center justify-center"
                              title={isStep3SidebarExpanded ? "Recolher menu" : "Expandir menu"}
                            >
                              {isStep3SidebarExpanded ? <CaretRight weight="bold" size={14} /> : <ArrowLeft weight="bold" size={14} />}
                            </button>
                          </div>

                          {/* Sidebar Scrollable Sections */}
                          {isStep3SidebarExpanded ? (
                            <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-6">
                              {/* Section: Phases + Tecnologia */}
                                <div className="space-y-1.5 pt-1 animate-fade-in pr-1">
                                  {step3PhaseTechs.map((pair, idx) => {
                                    const gradient = STEP3_CARD_GRADIENTS[idx % STEP3_CARD_GRADIENTS.length];
                                    return (
                                      <div 
                                        key={`${pair.phase}-${pair.tech}`}
                                        className="relative rounded-xl p-3 overflow-hidden shadow-sm flex items-center justify-between text-white select-none transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer border border-white/10"
                                        style={{ background: gradient }}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          const profName = e.dataTransfer.getData("text/plain");
                                          if (profName) {
                                            const key = `${pair.phase}-${pair.tech}`;
                                            setAllocations(prev => {
                                              const current = prev[key] || [];
                                              if (!current.includes(profName)) {
                                                setProfsWithPendingChanges(prevPending => {
                                                  const next = new Set(prevPending);
                                                  next.add(profName);
                                                  return next;
                                                });
                                                return {
                                                  ...prev,
                                                  [key]: [...current, profName]
                                                };
                                              }
                                              return prev;
                                            });
                                          }
                                        }}
                                      >
                                        {/* Curved Wave Layers */}
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-0" viewBox="0 0 200 100" preserveAspectRatio="none">
                                          <path d="M 0 100 C 60 90, 100 45, 200 15 L 200 100 Z" fill="rgba(255, 255, 255, 0.08)" />
                                          <path d="M 0 100 C 80 85, 120 60, 200 38 L 200 100 Z" fill="rgba(255, 255, 255, 0.12)" />
                                          <path d="M 0 100 C 110 95, 145 82, 200 68 L 200 100 Z" fill="rgba(255, 255, 255, 0.06)" />
                                        </svg>

                                        {/* Sparkling Stars (✦) */}
                                        <div className="absolute inset-0 pointer-events-none select-none z-0">
                                          <svg className="absolute left-[15%] top-[15%] w-3 h-3 text-white opacity-40 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                                          </svg>
                                          <svg className="absolute right-[25%] bottom-[20%] w-2 h-2 text-white opacity-30" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
                                          </svg>
                                        </div>

                                        {/* Icon illustration */}
                                        {getStep3CardIcon(idx)}

                                        {/* Card Text Content */}
                                        <div className="z-10 flex flex-col justify-center text-left min-w-0 flex-grow pr-2">
                                          <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-75 truncate">{pair.phase}</span>
                                          <span className="text-xs font-black mt-0.5 leading-tight break-words truncate" title={pair.tech}>{pair.tech}</span>
                                        </div>

                                        {/* Allocated Professional Avatars */}
                                        {(() => {
                                          const key = `${pair.phase}-${pair.tech}`;
                                          const allocatedNames = allocations[key] || [];
                                          if (allocatedNames.length === 0) return null;
                                          return (
                                            <div className="flex -space-x-4 hover:space-x-[-8px] transition-all duration-300 overflow-hidden ml-auto z-10 shrink-0 pr-1 py-0.5">
                                              {allocatedNames.map((profName) => {
                                                const prof = squad.find(s => s.nome === profName);
                                                if (!prof) return null;
                                                return (
                                                  <div
                                                    key={profName}
                                                    title={profName}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      // Remove allocation on click
                                                      setProfsWithPendingChanges(prevPending => {
                                                        const next = new Set(prevPending);
                                                        next.add(profName);
                                                        return next;
                                                      });
                                                      setAllocations(prev => {
                                                        const current = prev[key] || [];
                                                        return {
                                                          ...prev,
                                                          [key]: current.filter(n => n !== profName)
                                                        };
                                                      });
                                                    }}
                                                    className="relative cursor-pointer transition-transform duration-200 hover:scale-110 hover:z-20 shrink-0"
                                                  >
                                                    <div 
                                                      className="rounded-full p-[1px] flex items-center justify-center shadow-md"
                                                      style={{ 
                                                        width: '36px',
                                                        height: '36px',
                                                        background: prof.avatarImage
                                                          ? 'transparent'
                                                          : prof.avatar 
                                                            ? getAvatarById(prof.avatar)?.gradient 
                                                            : "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" 
                                                      }}
                                                    >
                                                      <div className="w-full h-full rounded-full bg-white p-[1px]">
                                                        {prof.avatarImage ? (
                                                          <img 
                                                            src={prof.avatarImage} 
                                                            alt={profName} 
                                                            className="w-full h-full object-cover object-top rounded-full" 
                                                          />
                                                        ) : (
                                                          <div 
                                                            className="w-full h-full rounded-full flex items-center justify-center text-[10px] font-black text-white overflow-hidden"
                                                            style={{ 
                                                              background: (prof.avatar && profName !== 'Marcio de Lima Conceição') 
                                                                ? getAvatarById(prof.avatar)?.gradient 
                                                                : "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" 
                                                            }}
                                                          >
                                                            {(prof.avatar && profName !== 'Marcio de Lima Conceição') ? (
                                                              <div className="scale-[1.1] flex items-center justify-center w-full h-full">
                                                                {getAvatarById(prof.avatar)?.icon}
                                                              </div>
                                                            ) : (
                                                              getInitials(profName)
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    );
                                  })}
                                  {step3PhaseTechs.length === 0 && (
                                    <p className="text-center text-[10px] text-slate-400 font-bold py-4">Nenhuma fase ou tecnologia registrada.</p>
                                  )}
                                </div>
                            </div>
                          ) : (
                            // Contracted handle display
                            <div className="flex-grow flex flex-col items-center py-6 gap-6 overflow-y-auto">
                              <div className="text-slate-400 hover:text-[#64183f] cursor-pointer transition-colors" onClick={() => setIsStep3SidebarExpanded(true)}>
                                <ClipboardText size={18} weight="duotone" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Edit modal render inside IIFE so variables are in scope */}
                        {editingProfessional && (
                          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in text-slate-800">
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-6 w-[580px] max-w-full relative animate-scale-up flex flex-col max-h-[90vh]">
                              <button 
                                onClick={() => setEditingProfessional(null)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <X size={18} weight="bold" />
                              </button>

                              <div className="flex items-center gap-4 mb-6">
                                <div 
                                  className="w-14 h-14 rounded-full p-[2px] flex items-center justify-center shadow-md shrink-0"
                                  style={{ 
                                    background: editingProfessional.avatarImage
                                      ? 'transparent'
                                      : editingProfessional.avatar 
                                        ? getAvatarById(editingProfessional.avatar)?.gradient 
                                        : "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" 
                                  }}
                                >
                                  <div className="w-full h-full rounded-full bg-white p-[1px]">
                                    {editingProfessional.avatarImage ? (
                                      <img 
                                        src={editingProfessional.avatarImage} 
                                        alt={editingProfessional.nome} 
                                        className="w-full h-full object-cover object-top rounded-full" 
                                      />
                                    ) : (
                                      <div 
                                        className="w-full h-full rounded-full flex items-center justify-center text-lg font-black text-white overflow-hidden"
                                        style={{ 
                                          background: editingProfessional.avatar 
                                            ? getAvatarById(editingProfessional.avatar)?.gradient 
                                            : "linear-gradient(135deg, #64183f 0%, #1a1f44 100%)" 
                                        }}
                                      >
                                        {editingProfessional.avatar ? (
                                          <div className="scale-[1.1] flex items-center justify-center w-full h-full">
                                            {getAvatarById(editingProfessional.avatar)?.icon}
                                          </div>
                                        ) : (
                                          getInitials(editingProfessional.nome)
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-left">
                                  <h3 className="text-lg font-black text-slate-800 leading-tight">{editingProfessional.nome}</h3>
                                  <p className="text-xs font-bold text-[#64183f] uppercase tracking-wider mt-0.5">{editingProfessional.perfil}</p>
                                </div>
                              </div>

                              <div className="flex-grow overflow-y-auto pr-1 space-y-5 custom-scrollbar">

                                {/* Associated Phase & Tech & Planned Start/End Dates */}
                                <div className="space-y-3">
                                  {(() => {
                                    const cardGradients = [
                                      'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)',
                                      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                      'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                                      'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'
                                    ];
                                    
                                    const result: { phase: string; tech: string; gradient: string }[] = [];
                                    step3PhaseTechs.forEach((pair, idx) => {
                                      const key = `${pair.phase}-${pair.tech}`;
                                      const allocatedProfs = allocations[key] || [];
                                      if (allocatedProfs.includes(editingProfessional.nome)) {
                                        const gradient = cardGradients[idx % cardGradients.length];
                                        result.push({ phase: pair.phase, tech: pair.tech, gradient });
                                      }
                                    });

                                    const replicateDate = (dateVal: string, type: 'start' | 'end') => {
                                      if (!dateVal) return;
                                      if (type === 'start') {
                                        const newStarts = { ...activityStartDates };
                                        result.forEach(alloc => {
                                          const actKey = `${alloc.phase}-${alloc.tech}`;
                                          newStarts[actKey] = dateVal;
                                        });
                                        setActivityStartDates(newStarts);
                                      } else {
                                        const newEnds = { ...activityEndDates };
                                        result.forEach(alloc => {
                                          const actKey = `${alloc.phase}-${alloc.tech}`;
                                          newEnds[actKey] = dateVal;
                                        });
                                        setActivityEndDates(newEnds);
                                      }
                                    };

                                    return (
                                      <>
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-left">
                                            Atividades Associadas e Datas Previstas
                                          </h4>
                                        </div>

                                        {result.length === 0 ? (
                                          <p className="text-xs text-slate-400 font-bold py-2 text-center">
                                            Nenhuma atividade (Fase & Tecnologia) associada a este profissional.
                                          </p>
                                        ) : (
                                          <div className="space-y-2 pt-1 text-left">
                                            {result.map((alloc, aIdx) => {
                                              const actKey = `${alloc.phase}-${alloc.tech}`;
                                              const hasStart = !!activityStartDates[actKey];
                                              const hasEnd = !!activityEndDates[actKey];
                                              return (
                                                <div key={aIdx} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                  {/* Phase & Tech info */}
                                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: alloc.gradient }} />
                                                    <span className="text-xs font-black text-slate-800 truncate" title={`${alloc.phase} - ${alloc.tech}`}>
                                                      {alloc.phase} - {alloc.tech}
                                                    </span>
                                                  </div>
                                                  
                                                  {/* Dates inputs aligned horizontally */}
                                                  <div className="flex items-center gap-3 shrink-0">
                                                    {/* Start Date */}
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Início</span>
                                                      <input 
                                                        type="date"
                                                        value={activityStartDates[actKey] || ""}
                                                        onChange={(e) => setActivityStartDates(prev => ({
                                                          ...prev,
                                                          [actKey]: e.target.value
                                                        }))}
                                                        className="px-1.5 py-0.5 border border-slate-200 rounded-md text-[10px] font-bold focus:outline-none focus:border-[#64183f] w-[105px] h-6 bg-white text-slate-800"
                                                      />
                                                      <button 
                                                        type="button"
                                                        disabled={!hasStart}
                                                        onClick={() => replicateDate(activityStartDates[actKey], 'start')}
                                                        className={`text-[9px] font-black uppercase tracking-wider transition-colors ${
                                                          hasStart 
                                                            ? 'text-[#64183f] hover:underline cursor-pointer' 
                                                            : 'text-slate-300 cursor-not-allowed'
                                                        }`}
                                                        title="Replicar esta data de início para todas as atividades"
                                                      >
                                                        Repl.
                                                      </button>
                                                    </div>

                                                    {/* End Date */}
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Fim</span>
                                                      <input 
                                                        type="date"
                                                        value={activityEndDates[actKey] || ""}
                                                        onChange={(e) => setActivityEndDates(prev => ({
                                                          ...prev,
                                                          [actKey]: e.target.value
                                                        }))}
                                                        className="px-1.5 py-0.5 border border-slate-200 rounded-md text-[10px] font-bold focus:outline-none focus:border-[#64183f] w-[105px] h-6 bg-white text-slate-800"
                                                      />
                                                      <button 
                                                        type="button"
                                                        disabled={!hasEnd}
                                                        onClick={() => replicateDate(activityEndDates[actKey], 'end')}
                                                        className={`text-[9px] font-black uppercase tracking-wider transition-colors ${
                                                          hasEnd 
                                                            ? 'text-[#64183f] hover:underline cursor-pointer' 
                                                            : 'text-slate-300 cursor-not-allowed'
                                                        }`}
                                                        title="Replicar esta data de fim para todas as atividades"
                                                      >
                                                        Repl.
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                {/* Productive field & Part time */}

                                <div className="pt-3 border-t border-slate-100">
                                  <div className="flex items-start justify-center gap-8">
                                    {/* Productivity Circular Dial */}
                                    <div className="flex flex-col items-center w-[120px]">
                                      <label className="h-8 flex items-center justify-center text-center text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                        Produtividade Semanal (%)
                                      </label>
                                      <div className="relative w-[68px] h-[68px] flex items-center justify-center">
                                        <svg
                                          width="68"
                                          height="68"
                                          viewBox="0 0 88 88"
                                          className="cursor-pointer select-none overflow-visible hover:scale-105 transition-transform duration-200"
                                          onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = e.clientX - rect.left - rect.width / 2;
                                            const y = e.clientY - rect.top - rect.height / 2;
                                            let angle = Math.atan2(y, x) + Math.PI / 2;
                                            if (angle < 0) angle += 2 * Math.PI;
                                            const pct = Math.round((angle / (2 * Math.PI)) * 100);
                                            setProductivityPct(Math.min(100, Math.max(0, pct)));
                                          }}
                                        >
                                          <defs>
                                            <linearGradient id="circleDialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                              <stop offset="0%" stopColor="#0d9488" />
                                              <stop offset="100%" stopColor="#1e3a5f" />
                                            </linearGradient>
                                          </defs>
                                          {/* Background track */}
                                          <circle cx="44" cy="44" r="35" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                                          {/* Progress track */}
                                          <circle
                                            cx="44"
                                            cy="44"
                                            r="35"
                                            fill="none"
                                            stroke="url(#circleDialGradient)"
                                            strokeWidth="6"
                                            strokeDasharray={2 * Math.PI * 35}
                                            strokeDashoffset={2 * Math.PI * 35 * (1 - productivityPct / 100)}
                                            strokeLinecap="round"
                                            transform="rotate(-90 44 44)"
                                            className="transition-all duration-300"
                                          />
                                        </svg>
                                        {/* Editable input centered inside the circle */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={productivityPct}
                                            onFocus={(e) => e.target.select()}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                              setProductivityPct(Math.min(100, Math.max(0, val)));
                                            }}
                                            className="w-8 bg-transparent border-none p-0 text-center text-sm font-black text-slate-800 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                          <span className="text-[10px] font-black text-slate-500 -ml-0.5 select-none pointer-events-none">%</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Part-Time Sun/Moon Toggle */}
                                    <div className="flex flex-col items-center w-[120px] text-center">
                                      <label className="h-8 flex items-center justify-center text-center text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                        Período
                                      </label>
                                      <div className="flex flex-col items-center justify-center h-[68px]">
                                        <div
                                          className={`relative w-[56px] h-[56px] rounded-full cursor-pointer transition-all duration-500 hover:scale-105 ${
                                            isPartTime ? 'shadow-lg shadow-teal-500/30' : 'shadow-md shadow-orange-500/30'
                                          }`}
                                          onClick={() => setIsPartTime(!isPartTime)}
                                        >
                                          <svg width="56" height="56" viewBox="0 0 68 68" className="overflow-visible">
                                            <defs>
                                              <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#fb923c" />
                                                <stop offset="100%" stopColor="#ea580c" />
                                              </linearGradient>
                                              <linearGradient id="moonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#1e3a5f" />
                                                <stop offset="100%" stopColor="#1e293b" />
                                              </linearGradient>
                                              <clipPath id="leftHalf">
                                                <rect x="0" y="0" width="34" height="68" />
                                              </clipPath>
                                              <clipPath id="rightHalf">
                                                <rect x="34" y="0" width="34" height="68" />
                                              </clipPath>
                                              <clipPath id="circleClip">
                                                <circle cx="34" cy="34" r="33" />
                                              </clipPath>
                                            </defs>

                                            {!isPartTime ? (
                                              /* Full Sun (Day) - Full Time */
                                              <g>
                                                <circle cx="34" cy="34" r="33" fill="url(#sunGrad)" />
                                                {/* Sun rays */}
                                                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                                                  <line
                                                    key={i}
                                                    x1={34 + Math.cos((angle * Math.PI) / 180) * 22}
                                                    y1={34 + Math.sin((angle * Math.PI) / 180) * 22}
                                                    x2={34 + Math.cos((angle * Math.PI) / 180) * 30}
                                                    y2={34 + Math.sin((angle * Math.PI) / 180) * 30}
                                                    stroke="#fbbf24"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    opacity="0.9"
                                                  />
                                                ))}
                                                {/* Inner sun circle */}
                                                <circle cx="34" cy="34" r="17" fill="#fbbf24" opacity="0.3" />
                                                <circle cx="34" cy="34" r="12" fill="#fbbf24" opacity="0.2" />
                                                {/* Outer ring */}
                                                <circle cx="34" cy="34" r="33" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
                                              </g>
                                            ) : (
                                              /* Split Day/Night - Part Time */
                                              <g clipPath="url(#circleClip)">
                                                {/* Day side */}
                                                <g clipPath="url(#leftHalf)">
                                                  <rect x="0" y="0" width="34" height="68" fill="url(#sunGrad)" />
                                                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                                                    <line
                                                      key={i}
                                                      x1={34 + Math.cos((angle * Math.PI) / 180) * 20}
                                                      y1={34 + Math.sin((angle * Math.PI) / 180) * 20}
                                                      x2={34 + Math.cos((angle * Math.PI) / 180) * 28}
                                                      y2={34 + Math.sin((angle * Math.PI) / 180) * 28}
                                                      stroke="#fbbf24"
                                                      strokeWidth="2.5"
                                                      strokeLinecap="round"
                                                      opacity="0.9"
                                                    />
                                                  ))}
                                                  <circle cx="34" cy="34" r="16" fill="#fb923c" stroke="#fbbf24" strokeWidth="1.5" />
                                                  {[0, 30, 60, 90, 120, 150].map((angle, i) => (
                                                    <line
                                                      key={`sm${i}`}
                                                      x1={34 + Math.cos(((angle - 90) * Math.PI) / 180) * 11}
                                                      y1={34 + Math.sin(((angle - 90) * Math.PI) / 180) * 11}
                                                      x2={34 + Math.cos(((angle - 90) * Math.PI) / 180) * 13}
                                                      y2={34 + Math.sin(((angle - 90) * Math.PI) / 180) * 13}
                                                      stroke="white"
                                                      strokeWidth="1.5"
                                                      strokeLinecap="round"
                                                      opacity="0.8"
                                                    />
                                                  ))}
                                                </g>

                                                {/* Night side */}
                                                <g clipPath="url(#rightHalf)">
                                                  <rect x="34" y="0" width="34" height="68" fill="url(#moonGrad)" />
                                                  <circle cx="45" cy="12" r="1" fill="white" opacity="0.7" />
                                                  <circle cx="55" cy="20" r="0.8" fill="white" opacity="0.5" />
                                                  <circle cx="48" cy="55" r="1" fill="white" opacity="0.6" />
                                                  <circle cx="60" cy="45" r="0.7" fill="white" opacity="0.4" />
                                                  <circle cx="58" cy="30" r="0.9" fill="white" opacity="0.5" />
                                                  <circle cx="34" cy="34" r="16" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                                                  <circle cx="42" cy="28" r="3" fill="#cbd5e1" opacity="0.6" />
                                                  <circle cx="45" cy="40" r="2" fill="#cbd5e1" opacity="0.5" />
                                                  <circle cx="39" cy="43" r="1.5" fill="#cbd5e1" opacity="0.4" />
                                                  {[0, 30, 60, 90, 120, 150].map((angle, i) => (
                                                    <line
                                                      key={`mm${i}`}
                                                      x1={34 + Math.cos(((angle - 90) * Math.PI) / 180) * 11}
                                                      y1={34 + Math.sin(((angle - 90) * Math.PI) / 180) * 11}
                                                      x2={34 + Math.cos(((angle - 90) * Math.PI) / 180) * 13}
                                                      y2={34 + Math.sin(((angle - 90) * Math.PI) / 180) * 13}
                                                      stroke="#475569"
                                                      strokeWidth="1.5"
                                                      strokeLinecap="round"
                                                    />
                                                  ))}
                                                </g>

                                                {/* Clock hands */}
                                                <line x1="34" y1="34" x2="34" y2="22" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                                                <line x1="34" y1="34" x2="42" y2="30" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
                                                <circle cx="34" cy="34" r="2" fill="#64183f" />

                                                {/* Outer ring */}
                                                <circle cx="34" cy="34" r="33" fill="none" stroke="#14b8a6" strokeWidth="2" />
                                              </g>
                                            )}
                                          </svg>

                                          {/* Checkbox overlay centered */}
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                                              isPartTime ? 'bg-teal-500 shadow-md shadow-teal-500/40' : 'bg-white/70 border-2 border-amber-400/60'
                                            }`}>
                                              {isPartTime && (
                                                <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                                                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <span className={`mt-2 whitespace-nowrap text-[9px] font-black uppercase tracking-wider transition-colors duration-300 ${
                                        isPartTime ? 'text-teal-600' : 'text-orange-600'
                                      }`}>
                                        {isPartTime ? 'PART-TIME' : 'FULL-TIME'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button
                                  onClick={() => setEditingProfessional(null)}
                                  className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all uppercase tracking-wider"
                                >
                                  Cancelar
                                </button>
                                <button
                                  disabled={isSavingAllocations || !canWrite}
                                  onClick={async () => {
                                    setIsSavingAllocations(true);
                                    const updatedDetails = {
                                      productivity: productivityPct,
                                      isPartTime: isPartTime,
                                      startDates: activityStartDates,
                                      endDates: activityEndDates
                                    };

                                    setProfDetails(prev => ({
                                      ...prev,
                                      [editingProfessional.nome]: updatedDetails
                                    }));

                                    setProfsWithPendingChanges(prevPending => {
                                      const next = new Set(prevPending);
                                      next.delete(editingProfessional.nome);
                                      return next;
                                    });

                                    // Gather and sync all allocations to database in real-time
                                    const allocationsPayload: any[] = [];
                                    Object.keys(allocations).forEach(key => {
                                      const parts = key.split('-');
                                      if (parts.length < 2) return;
                                      const phaseName = parts[0];
                                      const taskTechnology = parts.slice(1).join('-');
                                      
                                      const allocatedNames = allocations[key] || [];
                                      allocatedNames.forEach(profName => {
                                        const member = squad.find(s => s.nome === profName);
                                        if (!member) return;
                                        
                                        const details = profName === editingProfessional.nome
                                          ? updatedDetails
                                          : (profDetails[profName] || { productivity: 100, isPartTime: false, startDates: {}, endDates: {} });
                                        
                                        const initialDate = details.startDates[key] || new Date().toISOString().split('T')[0];
                                        const endDate = details.endDates?.[key] || null;
                                        
                                        allocationsPayload.push({
                                          projectId: viewingProject.id,
                                          resourceId: member.id,
                                          phaseName,
                                          taskTechnology,
                                          initialDate,
                                          endDate,
                                          percProductivity: details.productivity,
                                          allocationPerc: details.isPartTime ? 0.5 : 1.0
                                        });
                                      });
                                    });

                                    try {
                                      const response = await fetch(`/api/projects/${viewingProject.id}/allocations`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({ allocations: allocationsPayload })
                                      });
                                      
                                      if (response.ok) {
                                        showToast('Alocações salvas com sucesso!', 'success');
                                        setHasPendingSync(true);
                                      } else {
                                        const errData = await response.json();
                                        showToast(`Erro ao salvar alocações: ${errData.error || 'Erro desconhecido'}`, 'error');
                                      }
                                    } catch (err: any) {
                                      showToast(`Erro de rede ao salvar alocações: ${err.message}`, 'error');
                                      console.error('Erro de rede ao salvar alocações no modal:', err);
                                    } finally {
                                      setIsSavingAllocations(false);
                                      setEditingProfessional(null);
                                    }
                                  }}
                                  className="flex-grow flex-1 py-2 rounded-xl text-xs font-black text-white bg-[#64183f] hover:bg-[#64183f]/90 transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {isSavingAllocations ? (
                                    <>
                                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
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
                      </div>
                    );
                  })()}

                  {/* Step 4 Handle */}
                  {!isPlanningHeaderCollapsed && renderHandle(4)}

                  {/* Step 4 Content */}
                  {activePlanningStep === 4 && (
                    <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden animate-fade-in bg-white border-y border-slate-200 p-6 flex flex-col gap-6 custom-scrollbar text-slate-800 relative">
                      <button
                        onClick={() => {
                          window.open(`${window.location.origin}${window.location.pathname}?fullscreen-gantt=true&projectId=${viewingProject?.id}`, '_blank');
                        }}
                        className="absolute top-4 right-4 z-10 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 p-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 font-bold text-xs"
                        title="Expandir Gráfico de Gantt"
                      >
                        <ArrowsOut size={16} weight="bold" />
                        <span>Expandir</span>
                      </button>
                      <PlanningView />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {dependencyDrawerOpen && selectedDependencyTarget && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex justify-end animate-fade-in"
          onClick={() => setDependencyDrawerOpen(false)}
        >
          <div 
            className="bg-white w-[400px] h-full shadow-2xl flex flex-col border-l border-[#E5D5C8] animate-slide-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b-2 border-[#E5D5C8] bg-[#FAF4EF] shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#64183f] uppercase tracking-wider">
                  Opções de Dependências
                </span>
                <h3 className="text-lg font-black text-[#64183f] tracking-tight font-outfit truncate max-w-[280px]">
                  {selectedDependencyTarget.name}
                </h3>
              </div>
              <button
                onClick={() => setDependencyDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#64183f] hover:bg-[#64183f]/5 transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4 bg-white">
              {selectedDependencyTarget.type === 'requirement' ? (
                <>
                  <p className="text-slate-500 text-xs font-semibold">
                    Selecione os requisitos dos quais este requisito depende:
                  </p>
                  <div className="flex flex-col gap-2">
                    {orderedRequirements.flat()
                      .filter(reqName => reqName !== selectedDependencyTarget.id)
                      .map(reqName => {
                        const isChecked = (requirementDependencies[selectedDependencyTarget.id] || []).includes(reqName);
                        return (
                          <label 
                            key={reqName}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              isChecked 
                                ? 'border-[#64183f] bg-pink-50/10' 
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setRequirementDependencies(prev => {
                                  const current = prev[selectedDependencyTarget.id] || [];
                                  const next = current.includes(reqName)
                                    ? current.filter(x => x !== reqName)
                                    : [...current, reqName];
                                  return { ...prev, [selectedDependencyTarget.id]: next };
                                });
                              }}
                              className="accent-[#64183f] h-4 w-4 rounded cursor-pointer"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {reqName}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    {orderedRequirements.flat().filter(reqName => reqName !== selectedDependencyTarget.id).length === 0 && (
                      <span className="text-xs text-slate-400 font-bold text-center py-8">
                        Nenhum outro requisito disponível.
                      </span>
                    )}
                  </div>
                </>
              ) : selectedDependencyTarget.type === 'description' ? (
                <>
                  <p className="text-slate-500 text-xs font-semibold">
                    Selecione as tarefas das quais esta tarefa depende:
                  </p>
                  <div className="flex flex-col gap-2">
                    {(() => {
                      const parentReqName = selectedDependencyTarget.requirementName || '';
                      const reqIdx = orderedRequirements.flat().indexOf(parentReqName);
                      const reqItems = projectBacklog.filter((t: any) => {
                        const tReq = t.taskName || t.macroRequisito || '';
                        return tReq === parentReqName;
                      });

                      const descGroups: { [desc: string]: { minId: number; desc: string; sumPoints: number; items: any[] } } = {};
                      reqItems.forEach((t: any) => {
                        const desc = t.taskDescription || t.task_description || t.task || t.tarefa || 'Sem descrição';
                        if (!descGroups[desc]) {
                          descGroups[desc] = { minId: t.id || Date.now(), desc, sumPoints: 0, items: [] };
                        }
                        descGroups[desc].sumPoints += Number(t.points || t.pontos || 0);
                        descGroups[desc].items.push(t);
                      });
                      const defaultDescOrder = Object.keys(descGroups);
                      const currentDescOrder = taskOrders[parentReqName] ?? defaultDescOrder;
                      const finalDescOrder = [
                        ...currentDescOrder.filter((d: string) => defaultDescOrder.includes(d)),
                        ...defaultDescOrder.filter((d: string) => !currentDescOrder.includes(d))
                      ];
                      
                      const sortedDescList = Object.values(descGroups).sort((a: any, b: any) => {
                        return finalDescOrder.indexOf(a.desc) - finalDescOrder.indexOf(b.desc);
                      });

                      return sortedDescList
                        .filter((item: any) => item.desc !== selectedDependencyTarget.id)
                        .map((item: any) => {
                          const descName = item.desc;
                          const descIdx = sortedDescList.findIndex((x: any) => x.desc === descName);
                          const seqLabel = reqIdx !== -1 ? `${reqIdx + 1}.${descIdx + 1}` : '';
                          const isChecked = (descriptionDependencies[selectedDependencyTarget.id] || []).includes(descName);
                          return (
                            <label 
                              key={descName}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                isChecked 
                                  ? 'border-[#64183f] bg-pink-50/10' 
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setDescriptionDependencies(prev => {
                                    const current = prev[selectedDependencyTarget.id] || [];
                                    const next = current.includes(descName)
                                      ? current.filter(x => x !== descName)
                                      : [...current, descName];
                                    return { ...prev, [selectedDependencyTarget.id]: next };
                                  });
                                }}
                                className="accent-[#64183f] h-4 w-4 rounded cursor-pointer"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-800 leading-normal">
                                  {seqLabel ? `${seqLabel} - ` : ''}{descName}
                                </span>
                              </div>
                            </label>
                          );
                        });
                    })()}
                    {(() => {
                      const parentReqName = selectedDependencyTarget.requirementName || '';
                      const reqItems = projectBacklog.filter((t: any) => {
                        const tReq = t.taskName || t.macroRequisito || '';
                        return tReq === parentReqName;
                      });

                      const descGroups: { [desc: string]: { minId: number; desc: string; sumPoints: number; items: any[] } } = {};
                      reqItems.forEach((t: any) => {
                        const desc = t.taskDescription || t.task_description || t.task || t.tarefa || 'Sem descrição';
                        if (!descGroups[desc]) {
                          descGroups[desc] = { minId: t.id || Date.now(), desc, sumPoints: 0, items: [] };
                        }
                        descGroups[desc].items.push(t);
                      });

                      const otherDescsCount = Object.keys(descGroups).filter(desc => desc !== selectedDependencyTarget.id).length;
                      return otherDescsCount === 0;
                    })() && (
                      <span className="text-xs text-slate-400 font-bold text-center py-8">
                        Nenhuma outra tarefa disponível para este requisito.
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-500 text-xs font-semibold">
                    Selecione as sub-tarefas das quais esta sub-tarefa depende:
                  </p>
                  <div className="flex flex-col gap-2">
                    {projectBacklog
                      .filter(t => {
                        const tReq = t.taskName || t.macroRequisito || '';
                        const tDesc = t.taskDescription || t.task_description || t.task || t.tarefa || 'Sem descrição';
                        return tReq === selectedDependencyTarget.requirementName && 
                               tDesc === selectedDependencyTarget.descGroupText &&
                               String(t.id) !== selectedDependencyTarget.id;
                      })
                      .map(t => {
                        const tIdStr = String(t.id);
                        const isChecked = (subtaskDependencies[selectedDependencyTarget.id] || []).includes(tIdStr);
                        return (
                          <label 
                            key={tIdStr}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              isChecked 
                                ? 'border-[#64183f] bg-pink-50/10' 
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSubtaskDependencies(prev => {
                                  const current = prev[selectedDependencyTarget.id] || [];
                                  const next = current.includes(tIdStr)
                                    ? current.filter(x => x !== tIdStr)
                                    : [...current, tIdStr];
                                  return { ...prev, [selectedDependencyTarget.id]: next };
                                });
                              }}
                              className="accent-[#64183f] h-4 w-4 rounded cursor-pointer"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {t.taskDescription || t.task || 'Tarefa'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold truncate">
                                {t.taskPhase || 'Fase'} | {t.taskTechnology || 'Sem Tecnologia'}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    {projectBacklog.filter(t => {
                      const tReq = t.taskName || t.macroRequisito || '';
                      const tDesc = t.taskDescription || t.task_description || t.task || t.tarefa || 'Sem descrição';
                      return tReq === selectedDependencyTarget.requirementName && 
                             tDesc === selectedDependencyTarget.descGroupText &&
                             String(t.id) !== selectedDependencyTarget.id;
                    }).length === 0 && (
                      <span className="text-xs text-slate-400 font-bold text-center py-8">
                        Nenhuma outra sub-tarefa disponível neste grupo.
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4 p-6 border-t-2 border-[#E5D5C8] bg-[#FAF4EF] shrink-0">
              <button
                onClick={() => setDependencyDrawerOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#ef4444] hover:bg-red-50/50 border border-[#ef4444] transition-all uppercase tracking-wider flex items-center justify-center cursor-pointer bg-transparent"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDependencies}
                disabled={savingChanges || !canWrite}
                className={`flex-grow flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#64183f] to-[#8B2456] hover:opacity-95 transition-all shadow-md uppercase tracking-wider flex items-center justify-center cursor-pointer ${
                  savingChanges ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {savingChanges ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
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
