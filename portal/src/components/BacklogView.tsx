import React, { useMemo, useState, useEffect } from 'react';
import { usePlanningStore } from '../store/PlanningStore';
import type { Project } from '../types';
import { MagnifyingGlass, FileArrowUp, FileX, CheckCircle, Briefcase, ArrowRight, Confetti, CaretDown, Check } from '@phosphor-icons/react';
import { parseRequirementsFile } from '../utils/requirementsParser';
import type { ParsedProjectData } from '../utils/requirementsParser';
import { RequirementsDataTable } from './RequirementsDataTable';

export const BacklogView: React.FC = () => {
  const { tasks, projects, addTasks, filters, setFilters, fetchProjectsFromDb, canWrite } = usePlanningStore();
  const [activeTab] = useState<'tasks' | 'requirements'>('requirements');

  // Wizard stepper state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  // Requirements importer state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProjectData | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filterByParams] = useState(true);
  const [replaceBacklog] = useState(false);



  // Importer file handlers
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
    if (!selectedFile) return;
    setLoadingFile(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const data = await parseRequirementsFile(selectedFile, { filterByParameters: filterByParams });
      setParsedData(data);
      setFilters(prev => ({
        ...prev,
        backlogMacroRequisito: '', 
        backlogTarefa: '', 
        backlogBuildTechs: '', 
        backlogArqTechs: '', 
        backlogComplexidades: '',
        searchQuery: ''
      }));
      // Auto-advance to step 3 after successful parsing
      setTimeout(() => setWizardStep(3), 400);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocorreu um erro ao processar a planilha.');
      setParsedData(null);
    } finally {
      setLoadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedData(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleImportToBacklog = async () => {
    if (!parsedData || parsedData.rows.length === 0 || !selectedProject) return;

    setLoadingFile(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Find next JIRA number
    let maxNum = 0;
    tasks.forEach(t => {
      const match = t.idJira.match(/^JIR_(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextJiraBase = maxNum + 1;

    // 2. Map macro requirements to JIRA IDs
    const uniqueMacros = Array.from(new Set(parsedData.rows.map(r => r.macroRequisito)));
    const macroToJiraMap: { [key: string]: string } = {};
    uniqueMacros.forEach((macro, idx) => {
      const numStr = String(nextJiraBase + idx).padStart(2, '0');
      macroToJiraMap[macro] = `JIR_${numStr}`;
    });

    // 3. Build new tasks and backlog items for DB
    const newTasks: any[] = [];
    const backlogItems: any[] = [];

    // Add documentation row if it exists
    if (parsedData.escritaFuncionalDoc) {
      const docComplexity = parsedData.escritaFuncionalDoc;
      const valUpper = docComplexity.toUpperCase().trim();
      const parsedPoints = parseFloat(valUpper);
      let docPoints = 2;
      if (!isNaN(parsedPoints)) {
        docPoints = parsedPoints;
      } else if (parsedData.arqComplexityPoints && parsedData.arqComplexityPoints[valUpper] !== undefined) {
        docPoints = parsedData.arqComplexityPoints[valUpper];
      } else {
        switch (valUpper) {
          case 'MS': docPoints = 2; break;
          case 'S': docPoints = 4; break;
          case 'M': docPoints = 8; break;
          case 'C': docPoints = 12; break;
        }
      }

      newTasks.push({
        idJira: 'EF_ESCRITA_FUNCIONAL',
        sistema: 'Documentação',
        perfil: 'Arquiteto',
        idBacklog: 'Escrita Funcional',
        task: 'EF - Escrita Funcional - Documentação (Escrita Funcional)',
        abreviacao: 'ITS',
        tarefaPai: null,
        status: 'backlog' as const,
        nome: '',
        sequencia: 1,
        pontos: docPoints,
        dtInicio: null,
        dtFim: null
      });

      backlogItems.push({
        taskName: 'EF - Escrita Funcional',
        taskDescription: 'Funcional (Documentação)',
        taskPhase: '',
        taskTechnology: 'Documentação',
        taskPoints: docPoints
      });
    }

    parsedData.rows.forEach(row => {
      const jiraId = macroToJiraMap[row.macroRequisito] || 'JIR_NEW';
      const isBuild = row.tipo.toLowerCase().includes('build');
      
      // Determine points based on complexity
      let points = 2;
      const valUpper = row.valor.toUpperCase();
      if (isBuild && parsedData.buildComplexityPoints && parsedData.buildComplexityPoints[valUpper] !== undefined) {
        points = parsedData.buildComplexityPoints[valUpper];
      } else if (!isBuild && parsedData.arqComplexityPoints && parsedData.arqComplexityPoints[valUpper] !== undefined) {
        points = parsedData.arqComplexityPoints[valUpper];
      } else {
        switch (valUpper) {
          case 'MS': points = 2; break;
          case 'S': points = 4; break;
          case 'M': points = 8; break;
          case 'C': points = 12; break;
        }
      }

      newTasks.push({
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

      let phase = '';
      if (row.tipo.toLowerCase().includes('build')) {
        phase = 'BUILD';
      } else if (row.tipo.toLowerCase().includes('arq') || row.tipo.toLowerCase().includes('design')) {
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

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/approve-backlog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldStepId: 2,
          backlog: backlogItems
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao registrar a transição e gravar o backlog no banco de dados.');
      }

      addTasks(newTasks, replaceBacklog);
      await fetchProjectsFromDb();
      setSuccessMsg(`${newTasks.length} tarefas geradas e gravadas no banco de dados com sucesso!`);
      
      // Reset state after 2.5 seconds
      setTimeout(() => {
        setSuccessMsg(null);
        setWizardStep(1);
        setSelectedFile(null);
        setParsedData(null);
        setSelectedProject(null);
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao aprovar o backlog.');
    } finally {
      setLoadingFile(false);
    }
  };

  // Matrix Pivot Data transformation
  const pivotData = useMemo(() => {
    if (!parsedData) return { rows: [], techColumns: [], buildTechs: [], arqTechs: [] };

    // Get the list of systems from Parâmetros (Column L)
    const matchedItems = parsedData.metadataSummary.find(
      item => item.planilha === 'Parâmetros' && item.grupo === 'Nome do Sistema (Coluna L)'
    );
    let systemsList = matchedItems && matchedItems.macroRequisito
      ? matchedItems.macroRequisito.split(', ').map(s => s.trim()).filter(Boolean)
      : [];

    // Fallback if empty
    if (systemsList.length === 0) {
      const s = new Set<string>();
      parsedData.rows.forEach(r => {
        s.add(r.tecnologia);
      });
      systemsList = Array.from(s).sort();
    }

    // Identify all system columns from Padrão sheet via metadataSummary
    const techColumns: { name: string; colLetter: string; type: string }[] = [];
    parsedData.metadataSummary.forEach(item => {
      if (item.planilha === 'Padrão' && item.grupo.startsWith('Sistemas / Tecnologias (Linha 9')) {
        const isBuild = item.grupo.includes('Build');
        const techName = item.macroRequisito;
        const colLetter = item.tarefa; // We saved colLetter here!
        if (colLetter) {
          techColumns.push({
            name: techName,
            colLetter,
            type: isBuild ? 'Build' : 'Arquitetura & Design'
          });
        }
      }
    });

    const hasFilter = systemsList.length > 0;
    let filteredTechColumns = techColumns;
    if (hasFilter) {
      filteredTechColumns = techColumns.filter(tc => systemsList.includes(tc.name));
    }

    // Get unique combinations of macroRequisito and tarefa from metadataSummary
    const reqs: { macroRequisito: string; tarefa: string }[] = [];
    parsedData.metadataSummary.forEach(item => {
      if (item.macroRequisito && item.tarefa && item.planilha === 'Padrão' && item.grupo === 'Macro Requisitos (Coluna C)') {
        const exists = reqs.some(r => r.macroRequisito === item.macroRequisito && r.tarefa === item.tarefa);
        if (!exists) {
          reqs.push({ macroRequisito: item.macroRequisito, tarefa: item.tarefa });
        }
      }
    });

    let rows = reqs.map(req => {
      const rowData: { [key: string]: any } = {
        macroRequisito: req.macroRequisito,
        tarefa: req.tarefa,
        documentacao: parsedData.documentacaoFuncional
      };

      filteredTechColumns.forEach(tech => {
        const match = parsedData.rows.find(
          r => r.macroRequisito === req.macroRequisito && 
               r.tarefa === req.tarefa && 
               r.colLetter === tech.colLetter
        );
        rowData[tech.colLetter] = match ? match.valor : '';
      });

      return rowData;
    });

    // Insert additional row at the first position
    const docValue = (parsedData as any)?.escritaFuncionalDoc || '';
    if (docValue) {
      const valUpper = docValue.toUpperCase().trim();
      const parsedPoints = parseFloat(valUpper);
      let docPoints = 2;
      if (!isNaN(parsedPoints)) {
        docPoints = parsedPoints;
      } else if (parsedData.arqComplexityPoints && parsedData.arqComplexityPoints[valUpper] !== undefined) {
        docPoints = parsedData.arqComplexityPoints[valUpper];
      } else {
        switch (valUpper) {
          case 'MS': docPoints = 2; break;
          case 'S': docPoints = 4; break;
          case 'M': docPoints = 8; break;
          case 'C': docPoints = 12; break;
        }
      }

      const extraRow: { [key: string]: any } = {
        macroRequisito: 'EF - Escrita Funcional',
        tarefa: 'Funcional (Documentação)',
        documentacao: `(${docPoints} pts)`
      };
      filteredTechColumns.forEach(tech => {
        extraRow[tech.colLetter] = '';
      });
      rows = [extraRow, ...rows];
    }

    // Only load columns that have at least one non-empty value in the rows
    const usedColLetters = new Set<string>();
    rows.forEach(row => {
      filteredTechColumns.forEach(tech => {
        if (row[tech.colLetter]) {
          usedColLetters.add(tech.colLetter);
        }
      });
    });

    const finalTechColumns = filteredTechColumns.filter(tech => usedColLetters.has(tech.colLetter));
    const buildTechs = finalTechColumns.filter(t => t.type === 'Build');
    const arqTechs = finalTechColumns.filter(t => t.type === 'Arquitetura & Design');

    return { 
      rows, 
      techColumns: finalTechColumns, 
      buildTechs, 
      arqTechs 
    };
  }, [parsedData]);

  // Add useEffect to sync window state for drawer filters
  useEffect(() => {
    if (wizardStep === 3 && parsedData) {
      (window as any).isViewingBacklogEstimado = true;
      (window as any).backlogBuildTechs = pivotData.buildTechs.map(t => t.name);
      (window as any).backlogArqTechs = pivotData.arqTechs.map(t => t.name);
      (window as any).backlogMacroRequirements = Array.from(new Set(pivotData.rows.map(r => r.macroRequisito).filter(Boolean)));
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
  }, [wizardStep, parsedData, pivotData, handleProcessFile]);

  // Filter pivot rows locally using drawer filters
  const filteredPivotRows = useMemo(() => {
    let list = pivotData.rows;

    // Filter by MacroRequisito (Requisitos)
    if (filters.backlogMacroRequisito) {
      const q = filters.backlogMacroRequisito.toLowerCase();
      list = list.filter(row => (row.macroRequisito || '').toLowerCase().includes(q));
    }

    // Filter by Tarefa (Descrição)
    if (filters.backlogTarefa) {
      const q = filters.backlogTarefa.toLowerCase();
      list = list.filter(row => (row.tarefa || '').toLowerCase().includes(q));
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
      list = list.filter(row => {
        // Handle doc row separately
        if (row.macroRequisito === 'EF - Escrita Funcional') {
          if (hasCompFilter) {
            const docVal = ((parsedData as any)?.escritaFuncionalDoc || '').toUpperCase().trim();
            return selectedComps.includes(docVal);
          }
          // No complexity filter active but tech filter is — keep doc row visible
          return !hasTechFilter;
        }

        // Check each tech column for a match
        return pivotData.techColumns.some(tech => {
          const isBuild = tech.type === 'Build';

          // Check technology filter
          if (hasTechFilter) {
            if (isBuild && hasBuildFilter) {
              if (!selectedBuildTechs.includes(tech.name)) return false;
            } else if (!isBuild && hasArqFilter) {
              if (!selectedArqTechs.includes(tech.name)) return false;
            } else if (isBuild && !hasBuildFilter) {
              // Build column but we only have Arq filter — skip
              return false;
            } else if (!isBuild && !hasArqFilter) {
              // Arq column but we only have Build filter — skip
              return false;
            }
          }

          const val = (row[tech.colLetter] || '').toUpperCase().trim();
          if (!val) return false;

          // Check complexity filter
          if (hasCompFilter) {
            return selectedComps.includes(val);
          }

          return true;
        });
      });
    }

    // Keep the local text search too
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(row => {
        const matchReq = (row.macroRequisito || '').toLowerCase().includes(q);
        const matchTar = (row.tarefa || '').toLowerCase().includes(q);
        const matchDoc = (row.documentacao || '').toLowerCase().includes(q);
        const matchVal = pivotData.techColumns.some(tech => {
          const val = row[tech.colLetter];
          return val && val.toLowerCase().includes(q);
        });
        return matchReq || matchTar || matchDoc || matchVal;
      });
    }

    return list;
  }, [
    pivotData, 
    parsedData,
    filters.searchQuery, 
    filters.backlogMacroRequisito, 
    filters.backlogTarefa, 
    filters.backlogBuildTechs, 
    filters.backlogArqTechs, 
    filters.backlogComplexidades
  ]);


  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in relative">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-1">Backlog de Planejamento</h2>
          <p className="text-slate-500">Processe e extraia dados estruturados de arquivos de requisitos.</p>
        </div>
      </div>

      {/* TAB 2: Requirements Importer with Wizard Stepper */}
      {activeTab === 'requirements' && (
        <div className="flex flex-col space-y-6">

          {/* ═══════════ WIZARD STEPPER HEADER ═══════════ */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between px-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center min-w-[140px] cursor-pointer" onClick={() => setWizardStep(1)}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 shadow-sm ${
                  wizardStep === 1
                    ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6358dc] text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] scale-110'
                    : selectedProject
                      ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-300'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                }`}>
                  {selectedProject && wizardStep !== 1 ? (
                    <CheckCircle size={20} weight="fill" />
                  ) : (
                    <Briefcase size={18} weight={wizardStep === 1 ? 'fill' : 'regular'} />
                  )}
                </div>
                <span className={`mt-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                  wizardStep === 1 ? 'text-[#8b5cf6]' : selectedProject ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  Projeto
                </span>
                {selectedProject && (
                  <span className="text-[9px] font-semibold text-slate-500 mt-0.5 max-w-[120px] truncate">
                    {selectedProject.name}
                  </span>
                )}
              </div>

              {/* Connector 1→2 */}
              <div className={`stepper-connector mx-4 ${selectedProject ? 'done' : wizardStep >= 1 ? '' : ''}`} />

              {/* Step 2 */}
              <div className={`flex flex-col items-center min-w-[140px] transition-opacity duration-500 ${
                !selectedProject ? 'opacity-40 pointer-events-none' : 'cursor-pointer'
              }`} onClick={() => selectedProject && setWizardStep(2)}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 shadow-sm ${
                  wizardStep === 2
                    ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6358dc] text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] scale-110'
                    : parsedData
                      ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-300'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                }`}>
                  {parsedData && wizardStep !== 2 ? (
                    <CheckCircle size={20} weight="fill" />
                  ) : (
                    <FileArrowUp size={18} weight={wizardStep === 2 ? 'fill' : 'regular'} />
                  )}
                </div>
                <span className={`mt-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                  wizardStep === 2 ? 'text-[#8b5cf6]' : parsedData ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  Importar
                </span>
              </div>

              {/* Connector 2→3 */}
              <div className={`stepper-connector mx-4 ${parsedData ? 'done' : wizardStep === 2 && selectedFile ? 'active' : ''}`} />

              {/* Step 3 */}
              <div className={`flex flex-col items-center min-w-[140px] transition-opacity duration-500 ${
                !parsedData ? 'opacity-40 pointer-events-none' : 'cursor-pointer'
              }`} onClick={() => parsedData && setWizardStep(3)}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 shadow-sm ${
                  wizardStep === 3
                    ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6358dc] text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] scale-110'
                    : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                }`}>
                  <Confetti size={18} weight={wizardStep === 3 ? 'fill' : 'regular'} />
                </div>
                <span className={`mt-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                  wizardStep === 3 ? 'text-[#8b5cf6]' : 'text-slate-400'
                }`}>
                  Finalizar
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════ STEP 1: SELECT PROJECT ═══════════ */}
          {wizardStep === 1 && (
            <div className="animate-slide-down">
              <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6]/10 to-[#6358dc]/10 flex items-center justify-center">
                    <Briefcase size={20} className="text-[#8b5cf6]" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Selecionar Projeto</h3>
                    <p className="text-xs text-slate-500">Escolha o projeto para o qual deseja importar o backlog de requisitos.</p>
                  </div>
                </div>

                {/* Custom Project Dropdown */}
                <div className="relative max-w-lg">
                  <button
                    onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      projectDropdownOpen
                        ? 'border-[#8b5cf6] bg-[#8b5cf6]/5 shadow-[0_0_0_3px_rgba(139,92,246,0.1)]'
                        : selectedProject
                          ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {selectedProject ? (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle size={16} className="text-emerald-600" weight="fill" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{selectedProject.name}</p>
                            <p className="text-[10px] text-slate-500 font-semibold">ID: {selectedProject.projectId}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Briefcase size={16} className="text-slate-400" />
                          </div>
                          <span className="text-sm font-semibold text-slate-400">Selecione um projeto...</span>
                        </>
                      )}
                    </div>
                    <CaretDown size={16} className={`text-slate-400 transition-transform duration-300 ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown list */}
                  {projectDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-[280px] overflow-y-auto animate-slide-down">
                      {projects.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <Briefcase size={32} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-400">Nenhum projeto cadastrado</p>
                          <p className="text-xs text-slate-400 mt-1">Cadastre projetos na tela de Projetos.</p>
                        </div>
                      ) : (
                        projects.map((proj) => (
                          <button
                            key={proj.id}
                            onClick={() => {
                              setSelectedProject(proj);
                              setProjectDropdownOpen(false);
                              setWizardStep(2);
                            }}
                            className={`w-full flex items-center space-x-3 px-5 py-3.5 text-left transition-all duration-200 border-b border-slate-100 last:border-b-0 ${
                              selectedProject?.id === proj.id
                                ? 'bg-[#8b5cf6]/5 border-l-2 border-l-[#8b5cf6]'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                              selectedProject?.id === proj.id
                                ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {proj.projectId?.substring(0, 2) || '#'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{proj.name}</p>
                              <p className="text-[10px] text-slate-500 font-semibold">ID: {proj.projectId}</p>
                            </div>
                            {selectedProject?.id === proj.id && (
                              <CheckCircle size={18} className="text-[#8b5cf6] shrink-0" weight="fill" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Next Step Button */}
                {selectedProject && (
                  <div className="mt-6 flex justify-end animate-fade-in-fast">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#6358dc] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center space-x-2"
                    >
                      <span>Próximo Passo</span>
                      <ArrowRight size={16} weight="bold" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ STEP 2: IMPORT BACKLOG ═══════════ */}
          {wizardStep === 2 && selectedProject && (
            <div className="animate-slide-down">
              {/* Project context chip */}
              <div className="mb-4 flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/15">
                  <Briefcase size={12} className="mr-1.5" weight="fill" />
                  {selectedProject.name}
                </span>
              </div>

              {/* File Upload card */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-center md:space-x-8 space-y-6 md:space-y-0">
                {/* Drag & Drop area */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex-1 w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : selectedFile 
                        ? 'border-emerald-250 bg-emerald-50/10' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-300'
                  }`}
                >
                  <input 
                    type="file" 
                    id="req-file-input" 
                    accept=".xlsx,.xlsm,.xls" 
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  {selectedFile ? (
                    <>
                      <CheckCircle size={44} className="text-emerald-500 mb-3" weight="fill" />
                      <p className="text-sm font-bold text-slate-800 mb-1">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </>
                  ) : (
                    <>
                      <FileArrowUp size={44} className="text-slate-400 mb-3" />
                      <p className="text-sm font-bold text-slate-700 mb-1">Arraste e solte o arquivo aqui</p>
                      <p className="text-xs text-slate-400 mb-4">Formatos suportados: .xlsx, .xlsm, .xls</p>
                      <label 
                        htmlFor="req-file-input" 
                        className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl font-bold text-xs shadow-sm cursor-pointer transition-all"
                      >
                        SELECIONAR ARQUIVO
                      </label>
                    </>
                  )}
                </div>

                {/* Importer Controls */}
                <div className="flex flex-col space-y-4 w-full md:w-80 justify-center bg-slate-50/50 p-4 border border-slate-200/50 rounded-2xl">
                  <button
                    onClick={handleProcessFile}
                    disabled={!selectedFile || loadingFile}
                    className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
                      !selectedFile || loadingFile
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-primary text-white hover:bg-primary/95 hover:scale-[1.01]'
                    }`}
                  >
                    {loadingFile ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Carregar Backlog</span>
                    )}
                  </button>
                  {selectedFile && (
                    <button
                      onClick={handleRemoveFile}
                      className="w-full py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1"
                    >
                      <FileX size={14} />
                      <span>Limpar Arquivo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mt-4 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Success: auto-advance notification */}
              {successMsg && (
                <div className="mt-4 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2">
                  <CheckCircle size={18} className="text-emerald-500 mr-1" weight="fill" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Next Step Button if data parsed */}
              {parsedData && (
                <div className="mt-4 flex justify-end animate-fade-in-fast">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#6358dc] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center space-x-2"
                  >
                    <span>Visualizar Resultado</span>
                    <ArrowRight size={16} weight="bold" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ STEP 3: FINAL ═══════════ */}
          {wizardStep === 3 && parsedData && (
            <div className="animate-slide-down">
              {/* Project context chip */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/15">
                    <Briefcase size={12} className="mr-1.5" weight="fill" />
                    {selectedProject?.name}
                  </span>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CheckCircle size={12} className="mr-1.5" weight="fill" />
                    Arquivo processado
                  </span>
                </div>
                {canWrite && (
                  <button
                    onClick={handleImportToBacklog}
                    className="px-5 py-2.5 text-white rounded-xl font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all hover:scale-[1.01] mr-12 md:mr-16"
                    style={{ background: 'linear-gradient(135deg, #1e40af 0%, #172554 100%)' }}
                  >
                    <Check size={14} weight="bold" />
                    <span>Aprovar Backlog</span>
                  </button>
                )}
              </div>

              <div className="bg-[#FAF4EF]/50 border border-slate-200/50 rounded-[2rem] p-6 shadow-sm flex flex-col space-y-6">

                {/* Local search filter */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:bg-white focus-within:border-primary/50 transition-all w-full md:w-96">
                      <MagnifyingGlass size={18} className="text-slate-400 mr-2" />
                      <input 
                        type="text" 
                        placeholder="Filtrar requisitos ou tecnologias..." 
                        value={filters.searchQuery || ''}
                        onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                        className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 w-full font-semibold"
                      />
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
                        className="text-xs font-bold text-pink-500 hover:text-pink-600 hover:underline transition-colors shrink-0"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {filteredPivotRows.length} de {pivotData.rows.length} requisitos encontrados
                  </span>
                </div>

                {/* Responsive Virtualized Grid Table */}
                {filteredPivotRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30 gap-3">
                    <MagnifyingGlass size={32} className="text-slate-300" weight="duotone" />
                    <span className="text-slate-400 text-sm font-semibold">Nenhum requisito estimado encontrado.</span>
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
                        className="text-xs font-bold underline text-pink-500 hover:text-pink-600 transition-colors"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                ) : (
                  <RequirementsDataTable 
                    data={filteredPivotRows} 
                    techColumns={pivotData.techColumns} 
                    canWrite={canWrite}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

