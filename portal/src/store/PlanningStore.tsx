import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Task, TaskTime, ReleasePlan, SquadMember, Holiday, Owner, Step, Status, Project, Workflow, Transition } from '../types';

interface PlanningFilters {
  sistema: string;
  perfil: string;
  searchQuery: string;
  status: string; // Comma-separated selected statuses (e.g. "ATIVO,INATIVO")
  resourceEmail?: string;
  resourceMatricula?: string;
  resourceClientId?: string;
  resourceStates?: string;
  resourceCities?: string;
  resourceSubView?: string;
  resourceOperations?: string;
  projectCode?: string;
  projectName?: string;
  projectSteps?: string;
  projectStatuses?: string;
  projectOwners?: string;
  backlogMacroRequisito?: string;
  backlogTarefa?: string;
  backlogBuildTechs?: string;
  backlogArqTechs?: string;
  backlogComplexidades?: string;
  backlogProject?: string;
  backlogPhase?: string;
  backlogTech?: string;
  backlogRole?: string;
  backlogResource?: string;
  userSearchQuery?: string;
  userRoleQuery?: string;
  userOperationsQuery?: string;
  hierarchyOperationId?: string;
  hierarchyShowReportsCount?: string;
  hierarchyShowOnlyDirect?: string;
}

interface RecalculationLog {
  timestamp: string;
  action: string;
  details: string;
}

interface PlanningContextType {
  tasks: Task[];
  timeLogs: TaskTime[];
  releases: ReleasePlan[];
  squad: SquadMember[];
  holidays: Holiday[];
  owners: Owner[];
  steps: Step[];
  statuses: Status[];
  projects: Project[];
  workflows: Workflow[];
  transitions: Transition[];
  viewingProject: Project | null;
  viewingAllBacklog: boolean;
  viewingSquadMember: SquadMember | null;
  filters: PlanningFilters;
  selectedRelease: string;
  recalculationHistory: RecalculationLog[];
  loading: boolean;
  saving: boolean;
  canWrite: boolean;
  backlogTasks: any[];
  setBacklogTasks: (tasks: any[]) => void;
  notification: { message: string; type: 'success' | 'error' | 'warning' | 'info' } | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  clearNotification: () => void;
  
  // Setters & Actions
  setSelectedRelease: (release: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<PlanningFilters>>;
  setViewingProject: (project: Project | null) => void;
  setViewingAllBacklog: (val: boolean) => void;
  setViewingSquadMember: (member: SquadMember | null) => void;
  fetchTransitions: (projectId: number) => Promise<void>;
  fetchProjectsFromDb: () => Promise<boolean>;
  fetchSquadFromDb: () => Promise<boolean>;
  
  // Task CRUD
  addTask: (task: Omit<Task, 'id'>) => void;
  addTasks: (tasks: Omit<Task, 'id'>[], replaceExisting?: boolean) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  
  // Time Logs CRUD
  addTimeLog: (log: Omit<TaskTime, 'id'>) => void;
  updateTimeLog: (log: TaskTime) => void;
  deleteTimeLog: (id: string) => void;
  
  // Squad CRUD
  addSquadMember: (member: SquadMember) => void;
  updateSquadMember: (member: SquadMember, oldName?: string) => void;
  deleteSquadMember: (nome: string) => void;

  // Owners CRUD
  addOwner: (owner: Omit<Owner, 'id'>) => Promise<void>;
  updateOwner: (owner: Owner) => Promise<void>;
  deleteOwner: (id: number) => Promise<void>;

  // Steps CRUD
  addStep: (step: Step) => Promise<void>;
  updateStep: (step: Step) => Promise<void>;
  deleteStep: (id: number) => Promise<void>;

  // Status CRUD
  addStatus: (status: Status) => Promise<void>;
  updateStatus: (status: Status) => Promise<void>;
  deleteStatus: (id: number) => Promise<void>;

  // Projects CRUD
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;

  // Workflows CRUD
  addWorkflow: (workflow: Omit<Workflow, 'id'>) => Promise<void>;
  updateWorkflow: (workflow: Workflow) => Promise<void>;
  deleteWorkflow: (id: number) => Promise<void>;
  
  // Custom Release Planning Solver
  runRecalculation: (overrideStartDate?: string) => void;
  resetToExcel: () => Promise<void>;
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

// Core Scheduling Helpers
export function isWorkingDay(dateStr: string, holidays: Holiday[]): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  if (day === 0 || day === 6) return false; // Sunday or Saturday
  
  // Format check YYYY-MM-DD
  return !holidays.some(h => h.date === dateStr);
}

export function getNextWorkingDay(dateStr: string, holidays: Holiday[]): string {
  let currentStr = dateStr;
  let currentDate = new Date(dateStr + 'T12:00:00');
  while (!isWorkingDay(currentStr, holidays)) {
    currentDate.setDate(currentDate.getDate() + 1);
    currentStr = currentDate.toISOString().split('T')[0];
  }
  return currentStr;
}

export function addWorkingDays(startDateStr: string, daysToAdd: number, holidays: Holiday[]): string {
  let currentDate = new Date(startDateStr + 'T12:00:00');
  let daysRemaining = daysToAdd;
  
  while (daysRemaining > 0) {
    currentDate.setDate(currentDate.getDate() + 1);
    const currentStr = currentDate.toISOString().split('T')[0];
    if (isWorkingDay(currentStr, holidays)) {
      daysRemaining--;
    }
  }
  
  return currentDate.toISOString().split('T')[0];
}

export function calculateEndDate(
  startDateStr: string,
  points: number,
  holidays: Holiday[],
  allocationPerc: number = 1
): string {
  const normalizedAllocation = Number.isFinite(allocationPerc) && allocationPerc > 0 ? allocationPerc : 1;
  const days = Math.ceil((points * 0.5) / normalizedAllocation); // 1 point = 0.5 day; allocation scales duration
  if (days <= 1) return getNextWorkingDay(startDateStr, holidays);
  const startWorking = getNextWorkingDay(startDateStr, holidays);
  return addWorkingDays(startWorking, days - 1, holidays);
}

const DEFAULT_STEPS: Step[] = [
  { id: 1, name: 'EM ESTIMATIVA' },
  { id: 2, name: 'ESTIMATIVA EM APROVACAO' },
  { id: 3, name: 'PLANEJAMENTO' },
  { id: 4, name: 'PLANEJAMENTO EM APROVACAO' },
  { id: 5, name: 'EM EXECUCAO' },
  { id: 6, name: 'EM TESTE' },
  { id: 7, name: 'IMPLANTACAO' }
];

const DEFAULT_STATUSES: Status[] = [
  { id: 1, name: 'PENDENTE' },
  { id: 2, name: 'EXECUCAO' },
  { id: 3, name: 'CONCLUIDO' },
  { id: 4, name: 'REJEITADO' }
];

export const PlanningStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TaskTime[]>([]);
  const [releases, setReleases] = useState<ReleasePlan[]>([]);
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [statuses, setStatuses] = useState<Status[]>(DEFAULT_STATUSES);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [viewingAllBacklog, setViewingAllBacklog] = useState<boolean>(false);
  const [viewingSquadMember, setViewingSquadMember] = useState<SquadMember | null>(null);
  const [backlogTasks, setBacklogTasks] = useState<any[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<string>('Sprint 1');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'error') => {
    setNotification({ message, type });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);
  const [filters, setFilters] = useState<PlanningFilters>({
    sistema: '',
    perfil: '',
    searchQuery: '',
    status: 'ATIVO',
    resourceEmail: '',
    resourceMatricula: '',
    resourceClientId: '',
    resourceStates: '',
    resourceCities: '',
    resourceSubView: 'menu',
    resourceOperations: '',
    projectCode: '',
    projectName: '',
    projectSteps: '',
    projectStatuses: '',
    projectOwners: '',
    backlogMacroRequisito: '',
    backlogTarefa: '',
    backlogBuildTechs: '',
    backlogArqTechs: '',
    backlogComplexidades: '',
    backlogProject: '',
    backlogPhase: '',
    backlogTech: '',
    backlogRole: '',
    backlogResource: '',
    userSearchQuery: '',
    userRoleQuery: '',
    userOperationsQuery: '',
    hierarchyOperationId: '',
    hierarchyShowReportsCount: 'false',
    hierarchyShowOnlyDirect: 'false'
  });
  const [recalculationHistory, setRecalculationHistory] = useState<RecalculationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canWrite, setCanWrite] = useState<boolean>(true);

  const updateWritePermission = useCallback(() => {
    try {
      const permsStr = localStorage.getItem('kairos_permissions');
      if (permsStr) {
        const perms = JSON.parse(permsStr);
        setCanWrite(perms.can_save !== false);
      } else {
        setCanWrite(true);
      }
    } catch (e) {
      setCanWrite(true);
    }
  }, []);

  useEffect(() => {
    updateWritePermission();
    const handleStorageChange = () => {
      updateWritePermission();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateWritePermission]);

  const withSaving = useCallback(async (action: () => any) => {
    setSaving(true);
    try {
      await action();
      // Keep loading indicator visible for a consistent, premium user feel
      await new Promise(resolve => setTimeout(resolve, 800));
    } finally {
      setSaving(false);
    }
  }, []);

  const fetchTransitions = async (projectId: number) => {
    try {
      const res = await fetch(`/api/transitions/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setTransitions(data);
      }
    } catch (err) {
      console.error('Failed to fetch transitions:', err);
      setTransitions([]);
    }
  };

  // Central Scheduling Engine: recalculates task dates dynamically
  const runRecalculation = useCallback((overrideStartDate?: string) => {
    if (tasks.length === 0) return;

    // Get reference release start date
    const currentReleasePlan = releases.find(r => r.periodo === selectedRelease);
    const releaseStart = overrideStartDate || currentReleasePlan?.dataInicial || '2025-01-29';

    // Log the recalculation event
    const newLog: RecalculationLog = {
      timestamp: new Date().toLocaleTimeString(),
      action: 'Recalculação de Cronograma',
      details: `Recompilação executada com data inicial ${releaseStart}.`
    };
    setRecalculationHistory(prev => [newLog, ...prev].slice(0, 20));

    setTasks(prevTasks => {
      // 1. Group tasks by assignee
      const tasksByAssignee: { [name: string]: Task[] } = {};
      prevTasks.forEach(t => {
        const name = t.nome || 'Unassigned';
        if (!tasksByAssignee[name]) tasksByAssignee[name] = [];
        tasksByAssignee[name].push(t);
      });

      // Sort assignee tasks by sequence
      Object.keys(tasksByAssignee).forEach(name => {
        tasksByAssignee[name].sort((a, b) => a.sequencia - b.sequencia);
      });

      // 2. Iterative Relaxation Scheduling Solver to handle cross-task and cross-Jira dependencies
      const scheduled = prevTasks.map(t => ({ ...t }));
      const taskMap = new Map<string, Task>();
      scheduled.forEach(t => taskMap.set(t.id, t));

      let changed = true;
      let iterations = 0;
      const maxIterations = 20;

      while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        // Track resource next available start dates
        const resourceNextAvailable: { [name: string]: string } = {};

        // Track when a high level Jira ID finishes (latest end date of its subtasks)
        const jiraFinishDate: { [jiraId: string]: string } = {};

        // We process tasks in order of resource queues or global sequence
        // For simplicity, we can evaluate each task and update its start/end dates
        for (let i = 0; i < scheduled.length; i++) {
          const t = scheduled[i];
          const resourceName = t.nome || 'Unassigned';
          
          // Determine the base start date for this resource
          const resourceBaseStart = releaseStart;

          // Earliest start date constraints
          let earliestStart = resourceBaseStart;

          // Constraint A: Resource Queue (cannot start before the resource's next available slot)
          if (resourceNextAvailable[resourceName]) {
            const nextSlot = getNextWorkingDay(resourceNextAvailable[resourceName], holidays);
            if (nextSlot > earliestStart) {
              earliestStart = nextSlot;
            }
          }

          // Constraint B: Predecessor Task/Jira Dependency (idJiraPendente / tarefaPai)
          if (t.tarefaPai) {
            // Find predecessor task(s)
            const predecessorJiras = scheduled.filter(pt => pt.idJira === t.tarefaPai);
            let predLatestFinish = '';
            predecessorJiras.forEach(pt => {
              if (pt.dtFim && (!predLatestFinish || pt.dtFim > predLatestFinish)) {
                predLatestFinish = pt.dtFim;
              }
            });

            if (predLatestFinish) {
              const nextDay = getNextWorkingDay(addWorkingDays(predLatestFinish, 1, holidays), holidays);
              if (nextDay > earliestStart) {
                earliestStart = nextDay;
              }
            }
          }

          // Constraint C: Intra-Jira sequence (e.g. EF (Seq 1) -> ITS (Seq 2) -> Dev (Seq 3))
          if (t.sequencia > 1) {
            const prevJiraTask = scheduled.find(pt => pt.idJira === t.idJira && pt.sequencia === t.sequencia - 1);
            if (prevJiraTask && prevJiraTask.dtFim) {
              // Start on the same day as previous finished or next working day?
              // Standard Excel: If Seq 1 finishes, Seq 2 can start. If Seq 1 ends Jan 29, Seq 2 starts Jan 29 (same day)
              // Let's assume start on same day (if points fit) or next working day.
              // To match Excel: Seq 2 starts on the same day as Seq 1 finishes or next working day.
              // Let's set start date to the predecessor's dtFim or next day. Let's use the predecessor's dtFim.
              if (prevJiraTask.dtFim > earliestStart) {
                earliestStart = prevJiraTask.dtFim;
              }
            }
          }

          // Make sure start date falls on a working day
          earliestStart = getNextWorkingDay(earliestStart, holidays);

          // Calculate end date based on points
          const allocationPerc = typeof (t as any).allocationPerc === 'number' ? (t as any).allocationPerc : 1;
          const calculatedEnd = calculateEndDate(earliestStart, t.pontos, holidays, allocationPerc);

          // Check if date changed
          if (t.dtInicio !== earliestStart || t.dtFim !== calculatedEnd) {
            t.dtInicio = earliestStart;
            t.dtFim = calculatedEnd;
            changed = true;
          }

          // Update resource availability
          resourceNextAvailable[resourceName] = calculatedEnd;
          
          // Update Jira finish date
          if (!jiraFinishDate[t.idJira] || calculatedEnd > jiraFinishDate[t.idJira]) {
            jiraFinishDate[t.idJira] = calculatedEnd;
          }
        }
      }

      // 3. Roll up progress to parent fields (devDone, done)
      // For each Jira ID, summarize points and progress
      const jiraPoints: { [jira: string]: number } = {};
      const jiraDone: { [jira: string]: number } = {};
      const jiraDevDone: { [jira: string]: number } = {};

      scheduled.forEach(t => {
        if (!jiraPoints[t.idJira]) jiraPoints[t.idJira] = 0;
        if (!jiraDone[t.idJira]) jiraDone[t.idJira] = 0;
        if (!jiraDevDone[t.idJira]) jiraDevDone[t.idJira] = 0;

        jiraPoints[t.idJira] += t.pontos;
        if (t.status === 'done') {
          jiraDone[t.idJira] += t.pontos;
          jiraDevDone[t.idJira] += t.pontos;
        } else if (t.status === 'doing') {
          // Estimate devDone as half points or log-based
          jiraDevDone[t.idJira] += t.pontos * 0.5;
        }
      });

      scheduled.forEach(t => {
        t.devDone = jiraDevDone[t.idJira];
        t.done = jiraDone[t.idJira];
      });

      // Save to localStorage
      localStorage.setItem('planning_tasks', JSON.stringify(scheduled));
      return scheduled;
    });
  }, [releases, selectedRelease, squad, holidays, tasks.length]);

  // DB Fetching Helpers
  const fetchOwnersFromDb = useCallback(async () => {
    try {
      const res = await fetch('/api/owners');
      if (res.ok) {
        const data = await res.json();
        setOwners(data);
        localStorage.setItem('planning_owners', JSON.stringify(data));
        return true;
      }
    } catch (e) {
      console.warn('Error fetching owners from DB:', e);
    }
    return false;
  }, []);

  const fetchStepsFromDb = useCallback(async () => {
    try {
      const res = await fetch('/api/steps');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setSteps(data);
          localStorage.setItem('planning_steps', JSON.stringify(data));
          return true;
        }
      }
    } catch (e) {
      console.warn('Error fetching steps from DB:', e);
    }
    return false;
  }, []);

  const fetchStatusesFromDb = useCallback(async () => {
    try {
      const res = await fetch('/api/statuses');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setStatuses(data);
          localStorage.setItem('planning_statuses', JSON.stringify(data));
          return true;
        }
      }
    } catch (e) {
      console.warn('Error fetching statuses from DB:', e);
    }
    return false;
  }, []);

  const fetchProjectsFromDb = useCallback(async () => {
    try {
      const username = localStorage.getItem('kairos_username') || '';
      const res = await fetch(`/api/projects?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        
        setProjects(data);
        localStorage.setItem('planning_projects', JSON.stringify(data));
        return true;
      }
    } catch (e) {
      console.warn('Error fetching projects from DB:', e);
    }
    return false;
  }, [squad]);

  const fetchWorkflowsFromDb = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows');
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
        localStorage.setItem('planning_workflows', JSON.stringify(data));
        return true;
      }
    } catch (e) {
      console.warn('Error fetching workflows from DB:', e);
    }
    return false;
  }, []);

  // Helper to fetch squad from database and update state/local storage
  const fetchSquadFromDb = useCallback(async () => {
    try {
      const squadRes = await fetch('/api/squad');
      if (squadRes.ok) {
        const dbSquadRaw = await squadRes.json();
        const mappedSquad: SquadMember[] = dbSquadRaw.map((member: any) => ({
          id: member.id,
          nome: member.nome,
          perfil: member.perfil,
          status: member.status || 'ATIVO',
          avatar: member.avatar || null,
          avatarImage: member.avatarImage || null,
          email: member.email || null,
          telephoneContact: member.telephoneContact || null,
          matricula: member.matricula || null,
          clientId: member.clientId || null,
          localityId: member.localityId ?? null,
          state: member.state || null,
          city: member.city || null,
          operationId: member.operationId !== undefined ? member.operationId : (member.operation_id ?? null),
          operationIds: member.operationIds || [],
          managerId: member.managerId !== undefined ? member.managerId : (member.manager_id ?? null)
        }));
        setSquad(mappedSquad);
        localStorage.setItem('planning_squad', JSON.stringify(mappedSquad));
        setTimeout(() => runRecalculation(), 100);
        return true;
      }
    } catch (err) {
      console.warn('Could not fetch squad from database:', err);
    }
    return false;
  }, [runRecalculation]);

  // Load Initial Data
  // Load Initial Data (Local & Standalone)
  const loadInitialData = async (forceReset = false) => {
    try {
      const cachedTasks = forceReset ? null : localStorage.getItem('planning_tasks');
      const cachedLogs = forceReset ? null : localStorage.getItem('planning_timeLogs');
      const cachedSquad = forceReset ? null : localStorage.getItem('planning_squad');
      const cachedReleases = forceReset ? null : localStorage.getItem('planning_releases');
      const cachedHolidays = forceReset ? null : localStorage.getItem('planning_holidays');
      const cachedOwners = forceReset ? null : localStorage.getItem('planning_owners');
      const cachedSteps = forceReset ? null : localStorage.getItem('planning_steps');
      const cachedStatuses = forceReset ? null : localStorage.getItem('planning_statuses');
      const cachedProjects = forceReset ? null : localStorage.getItem('planning_projects');
      const cachedWorkflows = forceReset ? null : localStorage.getItem('planning_workflows');

      if (cachedTasks && cachedLogs && cachedReleases && cachedHolidays) {
        setTasks(JSON.parse(cachedTasks));
        setTimeLogs(JSON.parse(cachedLogs));
        setReleases(JSON.parse(cachedReleases));
        setHolidays(JSON.parse(cachedHolidays));
      }

      if (cachedSquad) {
        setSquad(JSON.parse(cachedSquad));
      }
      if (cachedOwners) {
        setOwners(JSON.parse(cachedOwners));
      }
      if (cachedSteps) {
        setSteps(JSON.parse(cachedSteps));
      }
      if (cachedStatuses) {
        setStatuses(JSON.parse(cachedStatuses));
      }
      if (cachedProjects) {
        setProjects(JSON.parse(cachedProjects));
      }
      if (cachedWorkflows) {
        setWorkflows(JSON.parse(cachedWorkflows));
      }
    } catch (e) {
      console.warn('Error loading local data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const checkWritePermission = (): boolean => {
    try {
      const permsStr = localStorage.getItem('kairos_permissions');
      if (permsStr) {
        const perms = JSON.parse(permsStr);
        if (perms.can_save === false) {
          showNotification("Operação não permitida: Seu usuário possui permissão apenas de visualização.", "error");
          return false;
        }
      }
    } catch (e) {}
    return true;
  };

  // 1. Task Actions
  const addTask = (newTaskData: Omit<Task, 'id'>) => {
    if (!checkWritePermission()) return;
    const id = `${newTaskData.idJira}_${newTaskData.perfil}_${newTaskData.idBacklog}`.replace(/\s+/g, '_');
    const newTask: Task = {
      ...newTaskData,
      id,
      devDone: 0,
      done: 0
    };
    
    setTasks(prev => {
      const updated = [...prev, newTask];
      localStorage.setItem('planning_tasks', JSON.stringify(updated));
      return updated;
    });
    
    setTimeout(() => runRecalculation(), 100);
  };
 
  const addTasks = (newTasksData: Omit<Task, 'id'>[], replaceExisting?: boolean) => {
    if (!checkWritePermission()) return;
    setTasks(prev => {
      const newTasks: Task[] = newTasksData.map(t => {
        const id = `${t.idJira}_${t.perfil}_${t.idBacklog}`.replace(/\s+/g, '_');
        return {
          ...t,
          id,
          devDone: 0,
          done: 0
        };
      });
      const updated = replaceExisting ? newTasks : [...prev, ...newTasks];
      localStorage.setItem('planning_tasks', JSON.stringify(updated));
      return updated;
    });
    
    setTimeout(() => runRecalculation(), 100);
  };

  const updateTask = (updatedTask: Task) => {
    if (!checkWritePermission()) return;
    setTasks(prev => {
      // Tree Hierarchy Rule: If status or system is changed, propagate to child tasks!
      const original = prev.find(t => t.id === updatedTask.id);
      let updated = prev.map(t => t.id === updatedTask.id ? updatedTask : t);

      if (original && (original.status !== updatedTask.status || original.sistema !== updatedTask.sistema)) {
        // Child tasks are tasks that have tarefaPai === original.idJira OR tarefaPai === original.id
        updated = updated.map(t => {
          if (t.tarefaPai === original.idJira || t.tarefaPai === original.id) {
            return {
              ...t,
              status: updatedTask.status,
              sistema: updatedTask.sistema
            };
          }
          return t;
        });
      }

      localStorage.setItem('planning_tasks', JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => runRecalculation(), 100);
  };

  const deleteTask = (id: string) => {
    if (!checkWritePermission()) return;
    setTasks(prev => {
      // Find the task we are deleting
      const target = prev.find(t => t.id === id);
      if (!target) return prev;

      // Tree Hierarchy Rule: If parent is deleted, recursively delete children!
      const deleteRecursive = (parentIdJira: string, list: Task[]): Task[] => {
        let result = [...list];
        const children = result.filter(t => t.tarefaPai === parentIdJira);
        children.forEach(child => {
          result = result.filter(t => t.id !== child.id);
          result = deleteRecursive(child.idJira, result);
        });
        return result;
      };

      let updated = prev.filter(t => t.id !== id);
      updated = deleteRecursive(target.idJira, updated);

      localStorage.setItem('planning_tasks', JSON.stringify(updated));
      return updated;
    });

    // Clean up related time logs
    setTimeLogs(prev => {
      const updated = prev.filter(log => log.taskId !== id);
      localStorage.setItem('planning_timeLogs', JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => runRecalculation(), 100);
  };

  // 2. Time Logs Actions
  const addTimeLog = (newLogData: Omit<TaskTime, 'id'>) => {
    const newLog: TaskTime = {
      ...newLogData,
      id: `log_${Date.now()}`
    };

    setTimeLogs(prev => {
      const updated = [...prev, newLog];
      localStorage.setItem('planning_timeLogs', JSON.stringify(updated));
      return updated;
    });

    // Reactive Recomputation: update points, DtInicio / DtFim, and status of associated task
    setTasks(prevTasks => {
      const updated = prevTasks.map(t => {
        if (t.id === newLog.taskId) {
          // If a log is added, the task is in progress (doing)
          const newStatus = t.status === 'backlog' ? 'doing' : t.status;
          return { ...t, status: newStatus };
        }
        return t;
      });
      localStorage.setItem('planning_tasks', JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => runRecalculation(), 100);
  };

  const updateTimeLog = (updatedLog: TaskTime) => {
    setTimeLogs(prev => {
      const updated = prev.map(l => l.id === updatedLog.id ? updatedLog : l);
      localStorage.setItem('planning_timeLogs', JSON.stringify(updated));
      return updated;
    });
    setTimeout(() => runRecalculation(), 100);
  };

  const deleteTimeLog = (id: string) => {
    setTimeLogs(prev => {
      const updated = prev.filter(l => l.id !== id);
      localStorage.setItem('planning_timeLogs', JSON.stringify(updated));
      return updated;
    });
    setTimeout(() => runRecalculation(), 100);
  };

  // 3. Squad Actions
  // 3. Squad Actions
  const addSquadMember = async (member: SquadMember) => {
    if (!checkWritePermission()) return;
    const res = await fetch('/api/squad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: member.nome,
        perfil: member.perfil,
        status: member.status || 'ATIVO',
        avatar: member.avatar || null,
        avatarImage: member.avatarImage || null,
        email: member.email || null,
        telephoneContact: member.telephoneContact || null,
        matricula: member.matricula || null,
        clientId: member.clientId || null,
        localityId: member.localityId ?? null,
        operationId: member.operationId ?? null,
        managerId: member.managerId ?? null
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao adicionar recurso no banco de dados');
    }
    await fetchSquadFromDb();
  };

  const updateSquadMember = async (updatedMember: SquadMember, oldName?: string) => {
    if (!checkWritePermission()) return;
    const matchName = oldName || updatedMember.nome;
    const res = await fetch(`/api/squad/${encodeURIComponent(matchName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: updatedMember.nome,
        perfil: updatedMember.perfil,
        status: updatedMember.status || 'ATIVO',
        avatar: updatedMember.avatar || null,
        avatarImage: updatedMember.avatarImage || null,
        email: updatedMember.email || null,
        telephoneContact: updatedMember.telephoneContact || null,
        matricula: updatedMember.matricula || null,
        clientId: updatedMember.clientId || null,
        localityId: updatedMember.localityId ?? null,
        operationId: updatedMember.operationId ?? null,
        managerId: updatedMember.managerId ?? null
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar recurso no banco de dados');
    }

    // Rename assignments in tasks and time logs if the resource was renamed
    if (matchName !== updatedMember.nome) {
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(t => t.nome === matchName ? { ...t, nome: updatedMember.nome } : t);
        localStorage.setItem('planning_tasks', JSON.stringify(updatedTasks));
        return updatedTasks;
      });
      setTimeLogs(prevLogs => {
        const updatedLogs = prevLogs.map(log => log.nome === matchName ? { ...log, nome: updatedMember.nome } : log);
        localStorage.setItem('planning_timeLogs', JSON.stringify(updatedLogs));
        return updatedLogs;
      });
    }
    await fetchSquadFromDb();
  };

  const deleteSquadMember = async (nome: string) => {
    if (!checkWritePermission()) return;
    const res = await fetch(`/api/squad/${encodeURIComponent(nome)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir recurso no banco de dados');
    }

    // Clean up assignments in tasks and time logs for the deleted resource
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(t => t.nome === nome ? { ...t, nome: '' } : t);
      localStorage.setItem('planning_tasks', JSON.stringify(updatedTasks));
      return updatedTasks;
    });
    setTimeLogs(prevLogs => {
      const updatedLogs = prevLogs.map(log => log.nome === nome ? { ...log, nome: '' } : log);
      localStorage.setItem('planning_timeLogs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
    await fetchSquadFromDb();
  };

  // 4. Owners CRUD Actions
  const addOwner = async (owner: Omit<Owner, 'id'>) => {
    if (!checkWritePermission()) return;
    const res = await fetch('/api/owners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(owner)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao adicionar gestor no banco de dados');
    }
    await fetchOwnersFromDb();
  };

  const updateOwner = async (owner: Owner) => {
    if (!checkWritePermission()) return;
    const res = await fetch(`/api/owners/${owner.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(owner)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar gestor no banco de dados');
    }
    await fetchOwnersFromDb();
  };

  const deleteOwner = async (id: number) => {
    if (!checkWritePermission()) return;
    const res = await fetch(`/api/owners/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir gestor no banco de dados');
    }
    await fetchOwnersFromDb();
  };

  // 5. Steps CRUD Actions
  const addStep = async (step: Step) => {
    const res = await fetch('/api/steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(step)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao adicionar etapa no banco de dados');
    }
    await fetchStepsFromDb();
  };

  const updateStep = async (step: Step) => {
    const res = await fetch(`/api/steps/${step.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(step)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar etapa no banco de dados');
    }
    await fetchStepsFromDb();
  };

  const deleteStep = async (id: number) => {
    const res = await fetch(`/api/steps/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir etapa no banco de dados');
    }
    await fetchStepsFromDb();
  };

  // 6. Status CRUD Actions
  const addStatus = async (status: Status) => {
    const res = await fetch('/api/statuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao adicionar status no banco de dados');
    }
    await fetchStatusesFromDb();
  };

  const updateStatus = async (status: Status) => {
    const res = await fetch(`/api/statuses/${status.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar status no banco de dados');
    }
    await fetchStatusesFromDb();
  };

  const deleteStatus = async (id: number) => {
    const res = await fetch(`/api/statuses/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir status no banco de dados');
    }
    await fetchStatusesFromDb();
  };

  // 7. Projects CRUD Actions
  const addProject = async (project: Omit<Project, 'id'>) => {
    if (!checkWritePermission()) return;
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao adicionar projeto no banco de dados');
    }
    await fetchProjectsFromDb();
  };

  const updateProject = async (project: Project) => {
    if (!checkWritePermission()) return;
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar projeto no banco de dados');
    }
    await fetchProjectsFromDb();
  };

  const deleteProject = async (id: number) => {
    if (!checkWritePermission()) return;
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir projeto no banco de dados');
    }
    if (viewingProject?.id === id) {
      setViewingProject(null);
    }
    await fetchProjectsFromDb();
  };

  // 8. Workflows CRUD Actions
  const addWorkflow = async (workflow: Omit<Workflow, 'id'>) => {
    const res = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao adicionar workflow no banco de dados');
    }
    await fetchWorkflowsFromDb();
  };

  const updateWorkflow = async (workflow: Workflow) => {
    const res = await fetch(`/api/workflows/${workflow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar workflow no banco de dados');
    }
    await fetchWorkflowsFromDb();
  };

  const deleteWorkflow = async (id: number) => {
    const res = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir workflow no banco de dados');
    }
    await fetchWorkflowsFromDb();
  };

  // Reset to Excel File defaults
  const resetToExcel = async () => {
    localStorage.removeItem('planning_tasks');
    localStorage.removeItem('planning_timeLogs');
    localStorage.removeItem('planning_squad');
    localStorage.removeItem('planning_releases');
    localStorage.removeItem('planning_holidays');
    setFilters({ sistema: '', perfil: '', searchQuery: '', status: 'ATIVO' });
    await loadInitialData(true);
    
    const newLog: RecalculationLog = {
      timestamp: new Date().toLocaleTimeString(),
      action: 'Resetar Dados',
      details: 'Tabelas em cache resetadas para as definições do Excel original.'
    };
    setRecalculationHistory(prev => [newLog, ...prev]);
  };

  return (
    <PlanningContext.Provider value={{
      tasks,
      timeLogs,
      releases,
      squad,
      holidays,
      owners,
      steps,
      statuses,
      projects,
      workflows,
      transitions,
      viewingProject,
      viewingAllBacklog,
      viewingSquadMember,
      filters,
      selectedRelease,
      recalculationHistory,
      loading,
      saving,
      canWrite,
      backlogTasks,
      setBacklogTasks,
      notification,
      showNotification,
      clearNotification,
      
      setSelectedRelease,
      setFilters,
      setViewingProject,
      setViewingAllBacklog,
      setViewingSquadMember,
      fetchTransitions,
      fetchProjectsFromDb,
      fetchSquadFromDb,
      
      addTask: (task) => withSaving(() => addTask(task)),
      addTasks: (tasksList, replaceExisting) => withSaving(() => addTasks(tasksList, replaceExisting)),
      updateTask: (task) => withSaving(() => updateTask(task)),
      deleteTask: (id) => withSaving(() => deleteTask(id)),
      
      addTimeLog: (log) => withSaving(() => addTimeLog(log)),
      updateTimeLog: (log) => withSaving(() => updateTimeLog(log)),
      deleteTimeLog: (id) => withSaving(() => deleteTimeLog(id)),
      
      addSquadMember: (member) => withSaving(() => addSquadMember(member)),
      updateSquadMember: (member, oldName) => withSaving(() => updateSquadMember(member, oldName)),
      deleteSquadMember: (nome) => withSaving(() => deleteSquadMember(nome)),

      addOwner: (owner) => withSaving(() => addOwner(owner)),
      updateOwner: (owner) => withSaving(() => updateOwner(owner)),
      deleteOwner: (id) => withSaving(() => deleteOwner(id)),

      addStep: (step) => withSaving(() => addStep(step)),
      updateStep: (step) => withSaving(() => updateStep(step)),
      deleteStep: (id) => withSaving(() => deleteStep(id)),

      addStatus: (status) => withSaving(() => addStatus(status)),
      updateStatus: (status) => withSaving(() => updateStatus(status)),
      deleteStatus: (id) => withSaving(() => deleteStatus(id)),

      addProject: (project) => withSaving(() => addProject(project)),
      updateProject: (project) => withSaving(() => updateProject(project)),
      deleteProject: (id) => withSaving(() => deleteProject(id)),

      addWorkflow: (workflow) => withSaving(() => addWorkflow(workflow)),
      updateWorkflow: (workflow) => withSaving(() => updateWorkflow(workflow)),
      deleteWorkflow: (id) => withSaving(() => deleteWorkflow(id)),
      
      runRecalculation,
      resetToExcel: () => withSaving(() => resetToExcel())
    }}>
      {children}
    </PlanningContext.Provider>
  );
};

export const usePlanningStore = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanningStore must be used within a PlanningStoreProvider');
  }
  return context;
};
