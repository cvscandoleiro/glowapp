export interface Task {
  id: string; // RowNumber or auto-generated unique ID
  idJira: string; // Jira identifier (e.g. JIR_01)
  sistema: string; // e.g. OSS
  perfil: string; // e.g. Funcional, Arquiteto, Dev
  idBacklog: string; // Activity type / phase (e.g. Escrita Funcional, ITS, Build)
  task: string; // Task details
  abreviacao: string; // e.g. EF, ITS, Dev
  tarefaPai: string | null; // Hierarchy link - links to parent idJira or parent task id
  status: 'backlog' | 'doing' | 'done';
  nome: string; // Assigned resource name
  sequencia: number;
  pontos: number; // Allocated effort points (1 point = half period = 0.5 days)
  dtInicio: string | null; // ISO Date String or YYYY-MM-DD
  dtFim: string | null; // ISO Date String or YYYY-MM-DD
  allocationPerc?: number;
  percProductivity?: number;
  devDone?: number;
  done?: number;
}

export interface TaskTime {
  id: string; // Unique log ID
  taskId: string; // Associated Task's unique ID
  date: string; // ISO date string (YYYY-MM-DD)
  points: number; // Effort logged (typically 1 or 2 points)
  nome: string; // Squad member name
}

export interface ReleasePlan {
  periodo: string; // e.g., Sprint 1, Sprint 2
  dataInicial: string; // ISO date string
  dataFinal: string; // ISO date string
  duracao: number; // Duration in days
  color?: string; // Hex color code
}

export interface SquadMember {
  id?: number;
  nome: string;
  perfil: string;
  status?: 'ATIVO' | 'INATIVO';
  avatar?: string | null;
  avatarImage?: string | null;
  email?: string | null;
  telephoneContact?: string | null;
  matricula?: string | null;
  clientId?: string | null;
  localityId?: number | null;
  state?: string | null;
  city?: string | null;
  operationId?: number | null;
  operationIds?: number[] | null;
  managerId?: number | null;
}

export interface Owner {
  id: number;
  name: string;
  status: 'ATIVO' | 'INATIVO';
  avatar?: string | null;
}

export interface Step {
  id: number;
  name: string;
}

export interface Status {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  projectId: string; // PROJECT_ID
  name: string;
  stepId: number; // STEP_ID
  statusId: number; // STATUS_ID
  ownerId: number; // OWNER_ID
  totalTaskPoints?: number;
  completedTaskPoints?: number;
  teamResourceIds?: string;
  startDate?: string | null;
  endDate?: string | null;
  operationId?: number | null;
  comments?: string | null;
}

export interface Workflow {
  id: number;
  currentStep: number; // CURRENT_STEP
  nextStep: number; // NEXT_STEP
  statusId: number; // STATUS_ID
}

export interface Holiday {
  name: string;
  date: string; // ISO date string (YYYY-MM-DD)
  dayOfWeek?: string;
}

export interface Transition {
  id: number;
  projectId: number;
  stepId: number;
  statusId: number;
  oldStepId?: number;
  newStepId?: number;
  oldStatusId?: number;
  newStatusId?: number;
  userId?: string;
  transactionDate?: string;
}
