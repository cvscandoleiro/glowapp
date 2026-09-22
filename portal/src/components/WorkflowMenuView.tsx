import React, { useState, useMemo, useCallback } from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import type { Workflow, Step } from '../types';
import { 
  Plus, 
  Trash, 
  PencilSimple, 
  X, 
  GitFork, 
  GearSix,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
} from '@phosphor-icons/react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  Position,
  Handle,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

/* ────────────────────────────────────────────
   Custom Node Component
   ──────────────────────────────────────────── */

const STEP_COLORS: Record<number, { bg: string; border: string; text: string; glow: string }> = {
  1: { bg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: '#818cf8', text: '#ffffff', glow: 'rgba(99,102,241,0.35)' },
  2: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', border: '#a78bfa', text: '#ffffff', glow: 'rgba(139,92,246,0.35)' },
  3: { bg: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', border: '#38bdf8', text: '#ffffff', glow: 'rgba(14,165,233,0.35)' },
  4: { bg: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', border: '#2dd4bf', text: '#ffffff', glow: 'rgba(20,184,166,0.35)' },
  5: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: '#fbbf24', text: '#ffffff', glow: 'rgba(245,158,11,0.35)' },
  6: { bg: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', border: '#fb7185', text: '#ffffff', glow: 'rgba(244,63,94,0.35)' },
  7: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: '#34d399', text: '#ffffff', glow: 'rgba(16,185,129,0.35)' },
  8: { bg: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', border: '#f472b6', text: '#ffffff', glow: 'rgba(236,72,153,0.35)' },
};

function getStepColor(id: number) {
  return STEP_COLORS[id] || STEP_COLORS[((id - 1) % Object.keys(STEP_COLORS).length) + 1];
}

function StepNode({ data }: NodeProps) {
  const color = getStepColor(data.stepId as number);
  const outCount = (data.outCount as number) || 0;
  const inCount = (data.inCount as number) || 0;

  return (
    <div
      style={{
        background: color.bg as string,
        borderColor: color.border as string,
        boxShadow: `0 8px 32px ${color.glow as string}, 0 2px 8px rgba(0,0,0,0.12)`,
        color: color.text as string,
      }}
      className="px-6 py-4 rounded-2xl border-2 min-w-[170px] text-center select-none transition-all duration-300 relative cursor-pointer hover:scale-105 hover:shadow-glow active:scale-95"
    >
      {/* Target handle — left (default for forward incoming edges) */}
      <Handle
        type="target"
        position={Position.Left}
        id="t-left"
        style={{ 
          width: 10, height: 10, 
          background: color.border as string, 
          border: '2px solid #fff', 
          boxShadow: '0 0 6px rgba(0,0,0,0.2)',
          top: '50%'
        }}
      />

      {/* Source handle — left (for outgoing rejections) */}
      <Handle
        type="source"
        position={Position.Left}
        id="s-left"
        style={{ 
          width: 8, height: 8, 
          background: color.border as string, 
          border: '2px solid #fff', 
          boxShadow: '0 0 4px rgba(0,0,0,0.15)',
          top: '30%'
        }}
      />

      {/* Target handle — bottom (for same-row rejection incoming) */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="t-bottom"
        style={{ 
          width: 8, height: 8, 
          background: color.border as string, 
          border: '2px solid #fff', 
          boxShadow: '0 0 4px rgba(0,0,0,0.15)',
          left: '35%'
        }}
      />

      {/* Source handle — bottom (for same-row rejection outgoing) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="s-bottom"
        style={{ 
          width: 8, height: 8, 
          background: color.border as string, 
          border: '2px solid #fff', 
          boxShadow: '0 0 4px rgba(0,0,0,0.15)',
          left: '65%'
        }}
      />

      {/* ID badge */}
      <span 
        className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg"
        style={{ background: '#fff', color: color.border as string, border: `2px solid ${color.border as string}` }}
      >
        {String(data.stepId)}
      </span>

      {/* Step name */}
      <p className="text-sm font-extrabold tracking-wide leading-tight drop-shadow-sm">
        {String(data.label)}
      </p>

      {/* Stats row */}
      <div className="flex items-center justify-center gap-3 mt-2 text-[10px] font-bold opacity-80">
        <span>▶ {outCount} saída{outCount !== 1 ? 's' : ''}</span>
        <span className="w-px h-3 bg-white/30" />
        <span>◀ {inCount} entrada{inCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Source handle — right (default for forward outgoing edges) */}
      <Handle
        type="source"
        position={Position.Right}
        id="s-right"
        style={{ 
          width: 10, height: 10, 
          background: color.border as string, 
          border: '2px solid #fff',
          boxShadow: '0 0 6px rgba(0,0,0,0.2)',
          top: '50%'
        }}
      />
    </div>
  );
}

const nodeTypes = { stepNode: StepNode };

/* ────────────────────────────────────────────
   Edge color map (by status)
   ──────────────────────────────────────────── */
const STATUS_EDGE_COLORS: Record<number, string> = {
  1: '#6366f1',
  2: '#0ea5e9',
  3: '#14b8a6',
  4: '#f59e0b',
  5: '#f43f5e',
  6: '#ec4899',
};

function getEdgeColor(statusId: number) {
  return STATUS_EDGE_COLORS[statusId] || STATUS_EDGE_COLORS[((statusId - 1) % Object.keys(STATUS_EDGE_COLORS).length) + 1];
}

/* ────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────── */

export const WorkflowMenuView: React.FC = () => {
  const {
    workflows, addWorkflow, updateWorkflow, deleteWorkflow,
    steps, statuses, projects, setViewingProject, owners, saving
  } = usePlanningStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'concluido' | 'rejeitado'>('concluido');
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

  // Form State
  const [workflowForm, setWorkflowForm] = useState<Omit<Workflow, 'id'> & { id?: number }>({ currentStep: 1, nextStep: 2, statusId: 1 });

  // Get name by ID helpers
  const getStepName = (id: number) => steps.find(s => s.id === id)?.name || `Etapa #${id}`;
  const getStatusName = (id: number) => statuses.find(s => s.id === id)?.name || `Status #${id}`;
  const getOwnerName = (id: number) => owners.find(o => o.id === id)?.name || `Gestor #${id}`;

  const handleOpenModal = (entity?: any) => {
    if (entity) {
      setEditingId(entity.id);
      setWorkflowForm({
        currentStep: entity.currentStep || (steps[0]?.id || 1),
        nextStep: entity.nextStep || (steps[1]?.id || 2),
        statusId: entity.statusId || (statuses[0]?.id || 1)
      });
    } else {
      setEditingId(null);
      setWorkflowForm({
        currentStep: steps[0]?.id || 1,
        nextStep: steps[1]?.id || 2,
        statusId: statuses[0]?.id || 1
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const wfData = {
      currentStep: Number(workflowForm.currentStep),
      nextStep: Number(workflowForm.nextStep),
      statusId: Number(workflowForm.statusId)
    };
    if (editingId !== null) {
      await updateWorkflow({ id: editingId, ...wfData });
    } else {
      await addWorkflow(wfData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number, label: string) => {
    const confirm = window.confirm(`Deseja realmente excluir a transição "${label}"?`);
    if (!confirm) return;
    await deleteWorkflow(id);
  };

  /* ── React Flow Nodes & Edges ── */
  const { nodes, edges } = useMemo(() => {
    // Count in/out per step
    const outMap = new Map<number, number>();
    const inMap = new Map<number, number>();
    workflows.forEach(w => {
      outMap.set(w.currentStep, (outMap.get(w.currentStep) || 0) + 1);
      inMap.set(w.nextStep, (inMap.get(w.nextStep) || 0) + 1);
    });

    // Layout steps: exactly 2 tasks per line
    const xGap = 480; // Node width is ~170px, leaving ~310px of empty horizontal space (> card width)
    const yGap = 200; // Node height is ~80px, leaving ~120px of empty vertical space (> card height)

    const flowNodes: Node[] = steps.map((step, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      
      const x = 60 + col * xGap;
      const y = 60 + row * yGap;

      return {
        id: String(step.id),
        type: 'stepNode',
        position: { x, y },
        data: {
          label: step.name,
          stepId: step.id,
          outCount: outMap.get(step.id) || 0,
          inCount: inMap.get(step.id) || 0,
        },
      };
    });

    // Helper to determine if a workflow represents a rejection/backward step
    const isRejectionWf = (w: Workflow) => {
      const statusName = getStatusName(w.statusId).toUpperCase();
      return statusName.includes('REJEITADO') || (w.currentStep > w.nextStep);
    };

    // Filter workflows based on selected view mode
    const filteredWorkflows = workflows.filter(w => {
      const isRej = isRejectionWf(w);
      return viewMode === 'concluido' ? !isRej : isRej;
    });

    // Track edge counts per source-target pair for offset/curvature
    const pairCount = new Map<string, number>();
    // Precompute total edges between each pair to check for parallel lines
    const pairTotal = new Map<string, number>();
    filteredWorkflows.forEach(w => {
      const pairKey = `${w.currentStep}-${w.nextStep}`;
      pairTotal.set(pairKey, (pairTotal.get(pairKey) || 0) + 1);
    });

    const flowEdges: Edge[] = filteredWorkflows.map((wf) => {
      const pairKey = `${wf.currentStep}-${wf.nextStep}`;
      const count = pairCount.get(pairKey) || 0;
      pairCount.set(pairKey, count + 1);

      const total = pairTotal.get(pairKey) || 1;
      const edgeColor = getEdgeColor(wf.statusId);
      const isRej = isRejectionWf(wf);

      // Determine edge type and options based on parallel edges to avoid overlap
      let edgeType = 'smoothstep';
      let pathOptions: any = undefined;
      let sourceHandle: string | undefined = undefined;
      let targetHandle: string | undefined = undefined;

      if (isRej) {
        // Reroute rejections to avoid crossing
        edgeType = 'smoothstep';
        
        const srcIdx = steps.findIndex(s => s.id === wf.currentStep);
        const tgtIdx = steps.findIndex(s => s.id === wf.nextStep);
        
        if (srcIdx !== -1 && tgtIdx !== -1) {
          const srcRow = Math.floor(srcIdx / 2);
          const tgtRow = Math.floor(tgtIdx / 2);

          if (srcRow === tgtRow) {
            // Same row rejection (e.g. 2 -> 1)
            sourceHandle = 's-bottom';
            targetHandle = 't-bottom';
          } else {
            // Different row rejection (e.g. 5 -> 2)
            sourceHandle = 's-left';
            targetHandle = 't-left';
          }
        } else {
          sourceHandle = 's-bottom';
          targetHandle = 't-bottom';
        }
      } else {
        // Forward edge
        sourceHandle = 's-right';
        targetHandle = 't-left';

        if (total > 1) {
          // If there are multiple forward edges, use bezier type and vary the curvature 
          // to separate the lines and make status text readable
          edgeType = 'default';
          const index = count;
          // Distribute curvatures: e.g. for 2 edges: -0.2 and 0.2
          const offsetVal = index - (total - 1) / 2;
          const curvature = 0.25 + offsetVal * 0.15;
          pathOptions = { curvature };
        }
      }

      return {
        id: `e-${wf.id}`,
        source: String(wf.currentStep),
        target: String(wf.nextStep),
        sourceHandle,
        targetHandle,
        label: getStatusName(wf.statusId),
        type: edgeType,
        pathOptions,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 18,
          height: 18,
        },
        style: {
          stroke: edgeColor,
          strokeWidth: isRej ? 2 : 2.5,
          strokeDasharray: isRej ? '5 5' : undefined, // dashed line for rejections
          filter: `drop-shadow(0 1px 3px ${edgeColor}55)`,
        },
        labelStyle: {
          fontSize: 11,
          fontWeight: 800,
          fill: edgeColor,
          letterSpacing: '0.05em',
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.95,
          stroke: edgeColor,
          strokeWidth: 1.5,
          rx: 8,
          ry: 8,
        },
        labelBgPadding: [8, 5] as [number, number],
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [steps, workflows, statuses, viewMode]);

  const onNodesChange = useCallback(() => {}, []);
  const onEdgesChange = useCallback(() => {}, []);

  return (
    <div className="h-full flex flex-col animate-fade-in relative text-slate-800">

      {(() => {
        const lastViewingProjectId = (window as any).lastViewingProjectId;
        const lastProject = projects.find(p => p.id === lastViewingProjectId);
        if (!lastProject) return null;
        return (
          <div className="mb-4 flex items-center">
            <button
              onClick={() => {
                setViewingProject(lastProject);
                if ((window as any).setActiveTab) {
                  (window as any).setActiveTab('projetos-menu');
                }
                (window as any).lastViewingProjectId = null;
              }}
              className="flex items-center gap-1.5 text-[#64183f] hover:text-[#4a0f2d] font-bold text-xs uppercase transition-all tracking-wider hover:underline"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Voltar para {lastProject.name}</span>
            </button>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════
          HERO — React Flow Diagram (full height)
          ═══════════════════════════════════════ */}
      <div
        className="bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden relative flex-1"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        {/* Floating header bar inside the diagram */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-white/95 via-white/80 to-transparent pointer-events-none">
          {/* Segmented Control (Left side) */}
          <div className="flex items-center pointer-events-auto">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner border border-slate-200/50">
              <button
                onClick={() => setViewMode('concluido')}
                className={`px-4 py-1.5 rounded-lg font-extrabold text-xs uppercase flex items-center space-x-1.5 transition-all duration-200 ${
                  viewMode === 'concluido'
                    ? 'bg-[#6358dc] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ThumbsUp size={15} weight={viewMode === 'concluido' ? 'fill' : 'bold'} />
                <span>Concluído</span>
              </button>
              <button
                onClick={() => setViewMode('rejeitado')}
                className={`px-4 py-1.5 rounded-lg font-extrabold text-xs uppercase flex items-center space-x-1.5 transition-all duration-200 ${
                  viewMode === 'rejeitado'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ThumbsDown size={15} weight={viewMode === 'rejeitado' ? 'fill' : 'bold'} />
                <span>Rejeitado</span>
              </button>
            </div>
          </div>

          {/* "Gerenciar" button (Right side) */}
          <div className="flex items-center pointer-events-auto">
            <button
              onClick={() => setIsPanelOpen(true)}
              className="px-5 py-2.5 bg-[#6358dc] text-white hover:bg-[#5248c4] rounded-xl font-bold text-xs shadow-lg flex items-center space-x-2 transition-all uppercase hover:scale-[1.02] active:scale-[0.98]"
            >
              <GearSix size={16} weight="bold" />
              <span>Gerenciar</span>
            </button>
          </div>
        </div>

        {/* React Flow canvas */}
        <style>{`
          .react-flow__panel { border-radius: 12px !important; }
          .react-flow__controls { border-radius: 12px !important; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; border: 1px solid #e2e8f0 !important; }
          .react-flow__controls-button { background: #fff !important; border-bottom: 1px solid #f1f5f9 !important; color: #475569 !important; }
          .react-flow__controls-button:hover { background: #f8fafc !important; color: #6358dc !important; }
          .react-flow__attribution { display: none !important; }
        `}</style>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_event, node) => {
            const stepId = Number(node.id);
            const step = steps.find(s => s.id === stepId);
            if (step) setSelectedStep(step);
          }}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={2}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background color="#e2e8f0" gap={20} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>

        {/* Bottom Legend (Centered) */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-slate-500 font-bold text-xs shadow-sm flex items-center space-x-2">
          <GitFork size={16} className="text-[#6358dc]" weight="duotone" />
          <span>{steps.length} etapas · {workflows.length} transições configuradas</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          CENTERED MODAL PANEL — Gerenciar Transições
          ═══════════════════════════════════════ */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white shadow-2xl border border-slate-100 flex flex-col rounded-[2rem] w-full max-w-[640px] h-[550px] overflow-hidden relative text-slate-800 font-sans"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800 leading-tight">Gerenciar Transições</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {workflows.length} regra{workflows.length !== 1 ? 's' : ''} cadastrada{workflows.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 bg-[#6358dc] text-white hover:bg-[#5248c4] rounded-xl font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all uppercase hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus size={14} weight="bold" />
                  <span>Nova Regra</span>
                </button>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all shadow-sm"
                  title="Fechar"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* Panel Body — table */}
            <div className="flex-1 overflow-y-auto">
              {workflows.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50/95 backdrop-blur-sm border-b border-slate-100">
                      <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                    {workflows.map(wf => (
                      <tr key={wf.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-3.5 text-slate-400 font-medium text-xs">#{wf.id}</td>
                        <td className="px-5 py-3.5 text-slate-800 text-xs">{getStepName(wf.currentStep)}</td>
                        <td className="px-5 py-3.5 text-slate-800 text-xs">{getStepName(wf.nextStep)}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 font-black">
                            {getStatusName(wf.statusId)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleOpenModal(wf)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 transition-colors"
                              title="Editar Regra"
                            >
                              <PencilSimple size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(wf.id, `${getStepName(wf.currentStep)} ➜ ${getStepName(wf.nextStep)}`)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors"
                              title="Excluir Regra"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                  <GitFork size={48} className="mb-3 opacity-20" />
                  <p className="text-sm font-bold mb-1">Nenhuma transição cadastrada</p>
                  <p className="text-xs text-slate-355 text-center">Clique em "Nova Regra" para adicionar a primeira regra.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MODAL — Criar / Editar Transição
          ═══════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 w-[440px] border border-slate-100 shadow-2xl rounded-[2rem] relative text-slate-800 font-sans">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-colors"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-xl font-black text-slate-800 mb-6">
              {editingId !== null ? 'Editar Transição' : 'Nova Transição'}
              <span className="text-slate-400 font-medium text-xs block mt-1 uppercase tracking-widest">Regra de Workflow</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Etapa Origem (De)</label>
                <select 
                  value={workflowForm.currentStep}
                  onChange={e => setWorkflowForm({...workflowForm, currentStep: Number(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:border-primary/50 transition-all cursor-pointer font-bold"
                >
                  {steps.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Etapa Destino (Para)</label>
                <select 
                  value={workflowForm.nextStep}
                  onChange={e => setWorkflowForm({...workflowForm, nextStep: Number(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:border-primary/50 transition-all cursor-pointer font-bold"
                >
                  {steps.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Status Exigido</label>
                <select 
                  value={workflowForm.statusId}
                  onChange={e => setWorkflowForm({...workflowForm, statusId: Number(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:border-primary/50 transition-all cursor-pointer font-bold"
                >
                  {statuses.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button 
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button 
                disabled={saving}
                onClick={handleSave}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-[#6358dc] text-white hover:bg-[#6358dc]/95 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
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

      {/* ═══════════════════════════════════════
          MODAL — Detalhes da Etapa (Step Card Expandido)
          ═══════════════════════════════════════ */}
      {selectedStep && (() => {
        const color = getStepColor(selectedStep.id);
        const incomingWfs = workflows.filter(w => w.nextStep === selectedStep.id);
        const outgoingWfs = workflows.filter(w => w.currentStep === selectedStep.id);
        const stepProjects = projects.filter(p => p.stepId === selectedStep.id);

        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div 
              style={{
                background: color.bg as string,
                borderColor: color.border as string,
                boxShadow: `0 20px 50px ${color.glow as string}, 0 4px 20px rgba(0,0,0,0.2)`,
              }}
              className="p-8 w-[500px] max-w-[95%] border-2 rounded-[2.5rem] relative flex flex-col items-center text-white"
            >
              {/* Step indicator centered above */}
              <div 
                className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-4 py-1.5 rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2"
                style={{ 
                  background: '#fff', 
                  color: color.border as string, 
                  borderColor: color.border as string 
                }}
              >
                STEP {selectedStep.id}
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setSelectedStep(null)}
                className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors"
                title="Fechar"
              >
                <X size={24} weight="bold" />
              </button>

              {/* Step Title */}
              <h3 className="text-2xl font-black tracking-wide text-center mt-4 mb-6">
                {selectedStep.name}
              </h3>

              {/* Central Area styled with card color theme / glassmorphism */}
              <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white space-y-5 overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                
                {/* Incoming Transitions */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">
                    Transições de Entrada (De)
                  </h4>
                  {incomingWfs.length > 0 ? (
                    <div className="space-y-1.5">
                      {incomingWfs.map(w => (
                        <div key={w.id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg p-2 border border-white/5">
                          <span className="font-semibold">{getStepName(w.currentStep)}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/20 border border-indigo-400 text-indigo-100">
                            {getStatusName(w.statusId)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/50 italic text-center py-2">Nenhuma transição de entrada configurada.</p>
                  )}
                </div>

                {/* Outgoing Transitions */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">
                    Transições de Saída (Para)
                  </h4>
                  {outgoingWfs.length > 0 ? (
                    <div className="space-y-1.5">
                      {outgoingWfs.map(w => (
                        <div key={w.id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg p-2 border border-white/5">
                          <span className="font-semibold">{getStepName(w.nextStep)}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 border border-emerald-400 text-emerald-100">
                            {getStatusName(w.statusId)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/50 italic text-center py-2">Nenhuma transição de saída configurada.</p>
                  )}
                </div>

                {/* Active Projects */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">
                    Projetos Atuais Nesta Etapa
                  </h4>
                  {stepProjects.length > 0 ? (
                    <div className="space-y-1.5">
                      {stepProjects.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg p-2 border border-white/5">
                          <span className="font-bold">{p.projectId} - {p.name}</span>
                          <span className="text-[10px] opacity-80">{getOwnerName(p.ownerId)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/50 italic text-center py-2">Nenhum projeto ativo nesta etapa.</p>
                  )}
                </div>

              </div>

              {/* Action Buttons inside step node card */}
              <div className="w-full mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedStep(null)}
                  className="px-6 py-2 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 transition-all uppercase shadow-md animate-fade-in"
                  style={{ color: color.border }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
