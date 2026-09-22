export function generateInteractiveHtml(data: {
  projectName: string;
  projectCode: string;
  manager: string;
  periodStart: string;
  periodEnd: string;
  metrics: {
    totalRequirements: number;
    totalTasks: number;
    totalPoints: number;
    pointsByTech: Record<string, number>;
  };
  squad: Array<{
    id: string | number;
    nome: string;
    perfil: string;
    avatar: string | null;
  }>;
  resourceOrder?: string[];
  holidayDates?: string[];
  plannedTasks: any[];
  unplannedTasks: any[];
}): string {
  // Inline getAvatarGradient equivalent
  const getGradient = (avatarId: string | null) => {
    // Default gradient mapping
    const gradients: Record<string, string> = {
      chicken: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
      dolphin: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
      turtle: 'linear-gradient(135deg, #22c55e 0%, #166534 100%)',
      hamster: 'linear-gradient(135deg, #fdba74 0%, #ea580c 100%)',
      deer: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
      seal: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)',
      alien: 'linear-gradient(135deg, #22c55e 0%, #064e3b 100%)',
      ghost: 'linear-gradient(135deg, #a78bfa 0%, #581c87 100%)',
      dragon: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
      vampire: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
      'cute-monster': 'linear-gradient(135deg, #a3e635 0%, #4d7c0f 100%)',
      unicorn: 'linear-gradient(135deg, #f0abfc 0%, #a855f7 100%)',
      zombie: 'linear-gradient(135deg, #6b7280 0%, #1f2937 100%)',
      cyborg: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
      fairy: 'linear-gradient(135deg, #f0abfc 0%, #c026d3 100%)',
      genie: 'linear-gradient(135deg, #6366f1 0%, #312e81 100%)',
      doctor: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
      chef: 'linear-gradient(135deg, #f97316 0%, #9a3412 100%)',
      firefighter: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
      artist: 'linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)',
      scientist: 'linear-gradient(135deg, #14b8a6 0%, #134e4a 100%)',
      pilot: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
      builder: 'linear-gradient(135deg, #eab308 0%, #a16207 100%)',
      diver: 'linear-gradient(135deg, #0284c7 0%, #075985 100%)',
      king: 'linear-gradient(135deg, #fbbf24 0%, #92400e 100%)',
      queen: 'linear-gradient(135deg, #e879f9 0%, #86198f 100%)',
      viking: 'linear-gradient(135deg, #78716c 0%, #44403c 100%)',
      cowboy: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
      elf: 'linear-gradient(135deg, #22c55e 0%, #14532d 100%)',
      mystic: 'linear-gradient(135deg, #8b5cf6 0%, #3b0764 100%)',
      clown: 'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)',
      cactus: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
      sunflower: 'linear-gradient(135deg, #84cc16 0%, #3f6212 100%)',
      pizza: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
      taco: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      rocket: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      saturn: 'linear-gradient(135deg, #6366f1 0%, #1e1b4b 100%)',
      gamepad: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
      coffee: 'linear-gradient(135deg, #92400e 0%, #451a03 100%)',
      diamond: 'linear-gradient(135deg, #06b6d4 0%, #155e75 100%)',
      hourglass: 'linear-gradient(135deg, #d946ef 0%, #701a75 100%)',
    };
    return gradients[avatarId || ''] || 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)';
  };

  const formattedSquad = data.squad.map(member => ({
    ...member,
    gradient: getGradient(member.avatar)
  }));

  const jsonPayload = JSON.stringify({
    projectName: data.projectName,
    projectCode: data.projectCode,
    manager: data.manager,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    metrics: data.metrics,
    squad: formattedSquad,
    resourceOrder: Array.isArray(data.resourceOrder) ? data.resourceOrder : [],
    holidayDates: Array.isArray(data.holidayDates) ? data.holidayDates : [],
    plannedTasks: data.plannedTasks,
    unplannedTasks: data.unplannedTasks
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gantt & Backlog Interativo - ${data.projectName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            outfit: ['Outfit', 'sans-serif'],
          },
          colors: {
            wine: {
              50: '#fdf2f8',
              100: '#fbcfe8',
              500: '#64183f',
              600: '#521333',
              800: '#30081d',
            }
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #fafbfc;
    }
    .custom-scrollbar::-webkit-scrollbar {
      height: 6px;
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  </style>
</head>
<body class="flex flex-col min-h-screen text-slate-800 antialiased p-4 sm:p-6 md:p-8">

  <div class="max-w-[1600px] w-full mx-auto flex flex-col flex-1 gap-6">
    
    <!-- Header principal -->
    <header class="bg-gradient-to-r from-wine-500 to-indigo-950 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-6">
        <div class="flex flex-col gap-1">
          <span class="text-xs font-bold text-pink-300 uppercase tracking-widest">Código: ${data.projectCode}</span>
          <h1 class="text-2xl font-extrabold font-outfit tracking-tight">${data.projectName}</h1>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-pink-100/90 font-medium">
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-pink-300" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
              Gestor: <strong>${data.manager}</strong>
            </span>
            <span class="text-pink-300/60">•</span>
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-pink-300" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/></svg>
              Período: <strong>${data.periodStart} a ${data.periodEnd}</strong>
            </span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold uppercase tracking-wider backdrop-blur-sm">Visão Offline Interativa</span>
      </div>
    </header>

    <!-- Métricas -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-4 bg-gradient-to-r from-wine-500/10 to-indigo-950/10 border border-wine-500/20 rounded-2xl flex items-center gap-4">
        <div class="p-2.5 bg-wine-500/10 rounded-xl">
          <svg class="w-6 h-6 text-wine-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z"/></svg>
        </div>
        <div class="w-px h-8 bg-wine-500/30"></div>
        <div>
          <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Requisitos</p>
          <p class="text-2xl font-extrabold text-slate-800">${data.metrics.totalRequirements}</p>
        </div>
      </div>

      <div class="p-4 bg-gradient-to-r from-wine-500/10 to-indigo-950/10 border border-wine-500/20 rounded-2xl flex items-center gap-4">
        <div class="p-2.5 bg-wine-500/10 rounded-xl">
          <svg class="w-6 h-6 text-wine-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0 1 12 3c1.2 0 2.392.044 3.578.13M3 18.75V7.5A2.25 2.25 0 0 1 5.25 5.25H7.5m-3 13.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75m-15 0v-7.5A2.25 2.25 0 0 1 5.25 9h3.75M9 15h3.75M9 18h3.75m3.75-6H18"/></svg>
        </div>
        <div class="w-px h-8 bg-wine-500/30"></div>
        <div>
          <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tarefas</p>
          <p class="text-2xl font-extrabold text-slate-800">${data.metrics.totalTasks}</p>
        </div>
      </div>

      <div class="p-4 bg-gradient-to-r from-wine-500/10 to-indigo-950/10 border border-wine-500/20 rounded-2xl flex items-center gap-4">
        <div class="p-2.5 bg-wine-500/10 rounded-xl">
          <svg class="w-6 h-6 text-wine-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-1.958-.5c-1.172-.879-1.172-2.303 0-3.182 1.171-.879 3.07-.879 4.242 0l.89.667M9.75 3h4.5c.097 0 .189.011.278.032M9.75 3c-.097 0-.189.011-.278.032m0 0A2.249 2.249 0 0 0 7.5 5.25v13.5A2.249 2.249 0 0 0 9.75 21m4.5 0c.097 0 .189-.011.278-.032m0 0a2.249 2.249 0 0 0 2.25-2.25V5.25a2.249 2.249 0 0 0-2.25-2.22M9.75 21H14.25"/></svg>
        </div>
        <div class="w-px h-8 bg-wine-500/30"></div>
        <div>
          <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Pontos Totais</p>
          <p class="text-2xl font-extrabold text-slate-800">${data.metrics.totalPoints}</p>
        </div>
      </div>
    </section>

    <!-- Barra de Filtros e Busca -->
    <section class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
      <div class="relative w-full sm:w-80">
        <input 
          type="text" 
          id="taskSearch"
          placeholder="Buscar tarefas..." 
          class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-wine-500 transition-all"
        />
        <svg class="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637z"/></svg>
      </div>
      <div class="w-full sm:w-64">
        <select 
          id="professionalFilter"
          class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-wine-500 transition-all bg-white"
        >
          <option value="all">Todos os profissionais</option>
        </select>
      </div>
    </section>

    <!-- Folder Tabs -->
    <section class="flex flex-col flex-1">
      <div class="flex gap-1 border-b border-slate-300 relative z-10 pl-2">
        <button 
          id="tab-gantt"
          onclick="switchTab('gantt')"
          class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border border-slate-300 border-b-white -mb-px bg-white text-wine-500 flex items-center gap-2 z-20"
        >
          <svg class="w-4 h-4 text-wine-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/></svg>
          Planning
        </button>
        <button 
          id="tab-backlog"
          onclick="switchTab('backlog')"
          class="px-5 py-2.5 font-semibold text-sm rounded-t-xl transition-all border border-transparent border-b-slate-300 bg-slate-100 text-slate-500 flex items-center gap-2"
        >
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z"/></svg>
          Backlog
        </button>
        <button 
          id="tab-technologies"
          onclick="switchTab('technologies')"
          class="px-5 py-2.5 font-semibold text-sm rounded-t-xl transition-all border border-transparent border-b-slate-300 bg-slate-100 text-slate-500 flex items-center gap-2"
        >
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"/></svg>
          Tecnologias
        </button>
      </div>

      <!-- Container de Conteúdo Geral -->
      <div id="content-container" class="bg-white border border-slate-300 rounded-b-2xl rounded-tr-2xl shadow-sm flex flex-col flex-1 overflow-hidden relative min-h-[500px]">
        
        <!-- DIVISÃO PLANNING (GANTT) -->
        <div id="view-gantt" class="flex flex-col flex-1 overflow-hidden">
          <div class="flex flex-1 overflow-hidden">
            <!-- Coluna de Profissionais -->
            <div id="gantt-resources" class="w-[200px] min-w-[200px] border-r border-wine-500/20 bg-wine-500/[0.04] z-10 flex flex-col shrink-0">
              <div class="h-[60px] border-b border-slate-200 bg-wine-500/[0.06] flex items-center px-3 shrink-0">
                <div class="flex bg-slate-100 p-0.5 rounded-lg border border-slate-300 w-full">
                  <button 
                    id="toggle-group-resource"
                    onclick="setGanttViewGroup('resource')"
                    class="flex-1 py-1 rounded-md text-[10px] font-bold text-center transition-all bg-wine-500 text-white shadow-sm"
                  >
                    Profissional
                  </button>
                  <button 
                    id="toggle-group-requirement"
                    onclick="setGanttViewGroup('requirement')"
                    class="flex-1 py-1 rounded-md text-[10px] font-bold text-center transition-all text-slate-500 hover:text-slate-800"
                  >
                    Requisito
                  </button>
                </div>
              </div>
              <div id="resources-body" class="flex-1 flex flex-col">
                <!-- Inserido dinamicamente via JS -->
              </div>
            </div>

            <!-- Area da Timeline -->
            <div class="flex-1 flex flex-col overflow-hidden relative">
              
              <!-- Header dos Dias -->
              <div id="timeline-header" class="h-[60px] border-b border-slate-200 bg-white overflow-hidden relative shrink-0">
                <div id="days-header-row" class="absolute inset-y-0 flex items-center">
                  <!-- Dias inseridos dinamicamente -->
                </div>
              </div>

              <!-- Grid e Barras do Gantt -->
              <div id="gantt-body" class="flex-1 overflow-auto relative custom-scrollbar bg-slate-50/30" onscroll="syncHeaderScroll(this)">
                <!-- Grid de Linhas de Fundo -->
                <div id="gantt-grid" class="absolute inset-y-0 pointer-events-none">
                  <!-- Linhas verticais desenhadas dinamicamente -->
                </div>

                <!-- Linhas das tarefas -->
                <div id="gantt-rows" class="relative z-10">
                  <!-- Linhas e barras inseridas dinamicamente -->
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- DIVISÃO BACKLOG -->
        <div id="view-backlog" class="hidden flex-col flex-1 p-6 overflow-auto">
          <div class="flex flex-col gap-6">
            
            <!-- Tabela de Planejados -->
            <div>
              <h3 class="text-sm font-bold text-wine-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Tarefas Planejadas (<span id="planned-count">0</span>)
              </h3>
              <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table class="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr class="bg-gradient-to-r from-wine-500 to-indigo-950 text-white font-bold text-xs uppercase tracking-wider">
                      <th class="p-3.5 w-24">ID</th>
                      <th class="p-3.5">Tarefa</th>
                      <th class="p-3.5 w-60">Responsável</th>
                      <th class="p-3.5 w-40">Fase</th>
                      <th class="p-3.5 w-48 text-right">Período</th>
                    </tr>
                  </thead>
                  <tbody id="planned-tasks-table">
                    <!-- Dinâmico -->
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Tabela de Não Planejados -->
            <div>
              <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Tarefas Não Planejadas (<span id="unplanned-count">0</span>)
              </h3>
              <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table class="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr class="bg-gradient-to-r from-wine-500 to-indigo-950 text-white font-bold text-xs uppercase tracking-wider">
                      <th class="p-3.5 w-24">ID</th>
                      <th class="p-3.5">Tarefa</th>
                      <th class="p-3.5 w-40">Fase</th>
                    </tr>
                  </thead>
                  <tbody id="unplanned-tasks-table">
                    <!-- Dinâmico -->
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        <!-- DIVISÃO TECNOLOGIAS -->
        <div id="view-technologies" class="hidden flex-col flex-1 p-6 overflow-auto">
          <div id="tech-cards-container" class="flex flex-wrap gap-4">
            <!-- Dinâmico -->
          </div>
        </div>

      </div>
    </section>
  </div>

  <!-- Modal / Gaveta de Detalhe da Tarefa -->
  <div id="task-drawer-overlay" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm hidden z-50 transition-opacity duration-300" onclick="closeDrawer()"></div>
  <div id="task-drawer" class="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white border-l border-slate-200 shadow-2xl z-50 transform translate-x-full transition-transform duration-300 flex flex-col p-6 gap-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-slate-900">Detalhes da Tarefa</h2>
      <button onclick="closeDrawer()" class="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <hr class="border-slate-200">
    <div class="flex flex-col gap-4 overflow-y-auto pr-1 flex-1 custom-scrollbar">
      <div>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome</span>
        <h3 id="drawer-task-name" class="text-md font-bold text-slate-800 mt-0.5"></h3>
      </div>
      <div>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</span>
        <p id="drawer-task-desc" class="text-sm text-slate-600 mt-0.5"></p>
      </div>
      <div>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Período</span>
        <p id="drawer-task-period" class="text-sm font-semibold text-slate-800 mt-0.5"></p>
      </div>
      <div>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Fase</span>
        <div class="mt-1">
          <span id="drawer-task-phase" class="px-2.5 py-1 bg-wine-500/10 text-wine-500 text-xs font-bold rounded-lg uppercase tracking-wider"></span>
        </div>
      </div>
      <div>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Responsável</span>
        <div id="drawer-task-resources" class="flex flex-wrap gap-2 mt-1.5"></div>
      </div>
    </div>
  </div>

  <!-- Gantt Tooltip Hover -->
  <div id="gantt-tooltip" class="absolute bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-xl pointer-events-none hidden z-40 max-w-[280px]"></div>

  <!-- Payload de Dados do Projeto -->
  <script id="project-payload" type="application/json">
    ${jsonPayload}
  </script>

  <script>
    // Carregar e processar o payload
    const DATA = JSON.parse(document.getElementById('project-payload').textContent);
    
    let activeTab = 'gantt';
    let currentSearch = '';
    let currentResourceFilter = 'all';
    let ganttViewGroup = 'resource';

    function setGanttViewGroup(mode) {
      ganttViewGroup = mode;
      
      const btnResource = document.getElementById('toggle-group-resource');
      const btnRequirement = document.getElementById('toggle-group-requirement');
      
      if (mode === 'resource') {
        btnResource.className = "flex-1 py-1 rounded-md text-[10px] font-bold text-center transition-all bg-wine-500 text-white shadow-sm";
        btnRequirement.className = "flex-1 py-1 rounded-md text-[10px] font-bold text-center transition-all text-slate-500 hover:text-slate-800";
      } else {
        btnResource.className = "flex-1 py-1 rounded-md text-[10px] font-bold text-center transition-all text-slate-500 hover:text-slate-800";
        btnRequirement.className = "flex-1 py-1 rounded-md text-[10px] font-bold text-center transition-all bg-wine-500 text-white shadow-sm";
      }
      
      renderAll();
    }

    // Utilitário para formatar datas ISO em objetos Date
    const parseDate = (str) => str ? new Date(str) : null;
    
    // Obter data mínima e máxima para escala da timeline
    const tasksWithDates = DATA.plannedTasks.filter(t => t.start && t.end);
    let minTime = null;
    let maxTime = null;
    
    if (tasksWithDates.length > 0) {
      minTime = Math.min(...tasksWithDates.map(t => new Date(t.start).getTime()));
      maxTime = Math.max(...tasksWithDates.map(t => new Date(t.end).getTime()));
    } else {
      minTime = new Date().getTime();
      maxTime = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
    }

    const timelineStart = new Date(minTime - 2 * 24 * 60 * 60 * 1000); // 2 dias de folga antes
    const timelineEnd = new Date(maxTime + 5 * 24 * 60 * 60 * 1000); // 5 dias de folga depois
    
    // Gerar escala de dias
    const daysScale = [];
    let currentIter = new Date(timelineStart);
    while (currentIter <= timelineEnd) {
      daysScale.push(new Date(currentIter));
      currentIter.setDate(currentIter.getDate() + 1);
    }

    const columnWidth = 40; // Largura em pixels de cada dia na timeline

    function toDateKey(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    const holidaySet = new Set(Array.isArray(DATA.holidayDates) ? DATA.holidayDates : []);

    function buildResourceProfileDisplayMap() {
      const members = Array.isArray(DATA.squad) ? DATA.squad : [];
      const profileCount = {};
      const profileIndex = {};
      const labelByName = {};

      members.forEach((m) => {
        const profile = String(m.perfil || '').trim();
        if (!profile) return;
        profileCount[profile] = (profileCount[profile] || 0) + 1;
      });

      members.forEach((m) => {
        const name = String(m.nome || '').trim();
        if (!name) return;

        const profile = String(m.perfil || '').trim();
        if (!profile) {
          labelByName[name] = name;
          return;
        }

        if ((profileCount[profile] || 0) <= 1) {
          labelByName[name] = profile;
          return;
        }

        profileIndex[profile] = (profileIndex[profile] || 0) + 1;
        labelByName[name] = profile + ' ' + profileIndex[profile];
      });

      return labelByName;
    }

    const resourceDisplayByName = buildResourceProfileDisplayMap();

    // Inicializar filtros
    function initFilters() {
      const select = document.getElementById('professionalFilter');
      DATA.squad.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.nome;
        opt.textContent = resourceDisplayByName[m.nome] || m.nome;
        select.appendChild(opt);
      });

      document.getElementById('taskSearch').addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        renderAll();
      });

      select.addEventListener('change', (e) => {
        currentResourceFilter = e.target.value;
        renderAll();
      });
    }

    // Scroll sincronizado entre header da timeline e corpo do Gantt
    function syncHeaderScroll(bodyEl) {
      document.getElementById('timeline-header').scrollLeft = bodyEl.scrollLeft;
    }

    // Gerar iniciais do nome
    function getInitials(name) {
      if (!name) return '';
      const parts = name.trim().split(' ').filter(Boolean);
      if (parts.length === 0) return '';
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    // Renderizar aba ativa
    function switchTab(tab) {
      activeTab = tab;
      
      const tabGantt = document.getElementById('tab-gantt');
      const tabBacklog = document.getElementById('tab-backlog');
      const tabTech = document.getElementById('tab-technologies');
      const container = document.getElementById('content-container');
      
      const views = {
        gantt: document.getElementById('view-gantt'),
        backlog: document.getElementById('view-backlog'),
        technologies: document.getElementById('view-technologies'),
      };

      // Reset styles
      [tabGantt, tabBacklog, tabTech].forEach(btn => {
        btn.className = "px-5 py-2.5 font-semibold text-sm rounded-t-xl transition-all border border-transparent border-b-slate-300 bg-slate-100 text-slate-500 flex items-center gap-2";
      });
      Object.values(views).forEach(view => view.classList.add('hidden'));
      Object.values(views).forEach(view => view.classList.remove('flex'));

      // Set active styles
      if (tab === 'gantt') {
        tabGantt.className = "px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border border-slate-300 border-b-white -mb-px bg-white text-wine-500 flex items-center gap-2 z-20";
        views.gantt.classList.remove('hidden');
        views.gantt.classList.add('flex');
        container.style.borderRadius = "0 16px 16px 16px";
      } else if (tab === 'backlog') {
        tabBacklog.className = "px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border border-slate-300 border-b-white -mb-px bg-white text-wine-500 flex items-center gap-2 z-20";
        views.backlog.classList.remove('hidden');
        views.backlog.classList.add('flex');
        container.style.borderRadius = "0 16px 16px 16px";
      } else if (tab === 'technologies') {
        tabTech.className = "px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border border-slate-300 border-b-white -mb-px bg-white text-wine-500 flex items-center gap-2 z-20";
        views.technologies.classList.remove('hidden');
        views.technologies.classList.add('flex');
        container.style.borderRadius = "0 16px 16px 16px";
      }
    }

    // Renderizar Gantt e Dados
    function renderAll() {
      // Filtrar tarefas baseadas na busca e profissional selecionado
      const filterTask = (t) => {
        const matchesSearch = t.name.toLowerCase().includes(currentSearch) || t.description.toLowerCase().includes(currentSearch);
        const matchesResource = currentResourceFilter === 'all' || t.resources.some(r => r.nome === currentResourceFilter);
        return matchesSearch && matchesResource;
      };

      const filteredPlanned = DATA.plannedTasks.filter(filterTask);
      const filteredUnplanned = DATA.unplannedTasks.filter(filterTask);

      renderGantt(filteredPlanned);
      renderBacklog(filteredPlanned, filteredUnplanned);
      renderTechnologies();
    }

    // Renderizar Gantt
    function renderGantt(tasks) {
      const resourcesBody = document.getElementById('resources-body');
      const daysHeaderRow = document.getElementById('days-header-row');
      const ganttGrid = document.getElementById('gantt-grid');
      const ganttRows = document.getElementById('gantt-rows');

      resourcesBody.innerHTML = '';
      daysHeaderRow.innerHTML = '';
      ganttGrid.innerHTML = '';
      ganttRows.innerHTML = '';

      // Set widths based on scale
      const totalTimelineWidth = daysScale.length * columnWidth;
      daysHeaderRow.style.width = totalTimelineWidth + 'px';
      ganttGrid.style.width = totalTimelineWidth + 'px';
      ganttRows.style.width = totalTimelineWidth + 'px';

      // 1. Render days header columns
      daysScale.forEach((day, idx) => {
        const dayEl = document.createElement('div');
        dayEl.className = "absolute text-center flex flex-col justify-center border-r border-slate-100 h-full select-none shrink-0";
        dayEl.style.width = columnWidth + 'px';
        dayEl.style.left = (idx * columnWidth) + 'px';
        
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const isHoliday = holidaySet.has(toDateKey(day));
        const isNonWorkingDay = isWeekend || isHoliday;
        if (isNonWorkingDay) {
          dayEl.classList.add('bg-red-50');
        }

        const monthName = day.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').substring(0, 3).toUpperCase();
        dayEl.innerHTML = \`
          <span class="\${isNonWorkingDay ? 'text-red-500' : 'text-slate-400'} text-[8px] font-bold uppercase">\${monthName}</span>
          <span class="\${isNonWorkingDay ? 'text-red-600' : 'text-slate-700'} text-xs font-bold mt-0.5">\${day.getDate()}</span>
        \`;
        daysHeaderRow.appendChild(dayEl);

        // Grid lines background
        const gridCol = document.createElement('div');
        gridCol.className = \`absolute top-0 bottom-0 border-r border-dashed border-slate-200/60 \${isNonWorkingDay ? 'bg-red-500/[0.03]' : ''}\`;
        gridCol.style.width = columnWidth + 'px';
        gridCol.style.left = (idx * columnWidth) + 'px';
        ganttGrid.appendChild(gridCol);
      });

      // Organiza tarefas em "lanes" para evitar sobreposição visual no mesmo período.
      function assignLanes(resourceTasks) {
        const sorted = [...resourceTasks].sort((a, b) => {
          const aStart = new Date(a.start).getTime();
          const bStart = new Date(b.start).getTime();
          if (aStart !== bStart) return aStart - bStart;
          return new Date(a.end).getTime() - new Date(b.end).getTime();
        });

        const laneEndTimes = [];
        const positioned = [];

        sorted.forEach((task) => {
          const startMs = new Date(task.start).setHours(0, 0, 0, 0);
          const endMs = new Date(task.end).setHours(0, 0, 0, 0);

          let lane = laneEndTimes.findIndex((laneEnd) => startMs > laneEnd);
          if (lane === -1) {
            lane = laneEndTimes.length;
            laneEndTimes.push(endMs);
          } else {
            laneEndTimes[lane] = endMs;
          }

          positioned.push({ task, lane });
        });

        return {
          positioned,
          lanesCount: Math.max(1, laneEndTimes.length),
        };
      }

      if (ganttViewGroup === 'resource') {
        // Group filtered tasks by resource
        const groups = {};
        const resourceOrder = Array.isArray(DATA.resourceOrder) ? DATA.resourceOrder : [];
        tasks.forEach(task => {
          if (task.resources && task.resources.length > 0) {
            task.resources.forEach(res => {
              if (!groups[res.nome]) groups[res.nome] = [];
              groups[res.nome].push(task);
            });
          } else {
            if (!groups['Sem Responsável']) groups['Sem Responsável'] = [];
            groups['Sem Responsável'].push(task);
          }
        });

        const groupedEntries = Object.entries(groups).sort(([nameA, tasksA], [nameB, tasksB]) => {
          if (nameA === 'Sem Responsável') return 1;
          if (nameB === 'Sem Responsável') return -1;

          const idxA = resourceOrder.indexOf(nameA);
          const idxB = resourceOrder.indexOf(nameB);

          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;

          const startA = Math.min(...tasksA.map(t => new Date(t.start).getTime()));
          const startB = Math.min(...tasksB.map(t => new Date(t.start).getTime()));
          return startA - startB;
        });

        // Build rows
        let rowIdx = 0;
        groupedEntries.forEach(([resName, resTasks]) => {
          const laneLayout = assignLanes(resTasks);
          const rowHeight = Math.max(42, laneLayout.lanesCount * 22 + 8);

          const member = DATA.squad.find(s => s.nome === resName);
          const gradient = member ? member.gradient : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';
          const role = member ? member.perfil : (resName === 'Sem Responsável' ? '' : 'Recurso');
          const displayLabel = resName === 'Sem Responsável'
            ? resName
            : (resourceDisplayByName[resName] || role || resName);

          // Professional left column item
          const resourceEl = document.createElement('div');
          resourceEl.className = "border-b border-slate-100 flex items-center px-4 gap-2.5 shrink-0";
          resourceEl.style.height = rowHeight + 'px';
          
          let avatarContent = '';
          if (resName !== 'Sem Responsável') {
            avatarContent = \`<div class="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 shadow-sm" style="background: \${gradient}">\${getInitials(displayLabel)}</div>\`;
          } else {
            avatarContent = \`<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-slate-300 text-slate-600 shrink-0">👤</div>\`;
          }

          resourceEl.innerHTML = \`
            \${avatarContent}
            <div class="min-w-0 flex-1 leading-tight">
              <h4 class="text-xs font-bold text-slate-800 truncate">\${displayLabel}</h4>
            </div>
          \`;
          resourcesBody.appendChild(resourceEl);

          // Timeline Right row item
          const rowEl = document.createElement('div');
          rowEl.className = "border-b border-slate-100 relative w-full";
          rowEl.style.height = rowHeight + 'px';
          rowEl.style.width = totalTimelineWidth + 'px';
          
          laneLayout.positioned.forEach(({ task, lane }) => {
            const taskStart = new Date(task.start);
            const taskEnd = new Date(task.end);
            
            // Calculate coordinates
            const offsetDaysStart = (taskStart.getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000);
            const offsetDaysEnd = (taskEnd.getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000);
            
            const barLeft = offsetDaysStart * columnWidth;
            // Inclusivo: tarefa no mesmo dia ocupa 1 coluna inteira.
            const barWidth = Math.max(12, (offsetDaysEnd - offsetDaysStart + 1) * columnWidth);
            const barTop = 4 + (lane * 22);

            const barEl = document.createElement('div');
            barEl.className = "absolute rounded-lg flex items-center px-2 text-[10px] font-bold text-white shadow-sm cursor-pointer select-none overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all";
            barEl.style.left = barLeft + 'px';
            barEl.style.width = barWidth + 'px';
            barEl.style.top = barTop + 'px';
            barEl.style.height = '18px';
            
            // Color based on requirement name hash
            const barBg = getRequirementColor(task.phase || task.name);
            barEl.style.backgroundColor = barBg;

            barEl.innerHTML = \`<span class="truncate">\${task.name}</span>\`;
            
            // Interactive tooltips & click
            barEl.addEventListener('mouseenter', (e) => showGanttTooltip(e, task));
            barEl.addEventListener('mouseleave', hideGanttTooltip);
            barEl.addEventListener('click', () => openTaskDetails(task));

            rowEl.appendChild(barEl);
          });

          ganttRows.appendChild(rowEl);
          rowIdx++;
        });
      } else {
        // Group by Requirement
        const groups = {};
        tasks.forEach(task => {
          const reqName = task.originalItem?.macroRequisito || task.name || 'Sem Requisito';
          if (!groups[reqName]) {
            groups[reqName] = [];
          }
          groups[reqName].push(task);
        });

        // Convert to requirement objects
        const reqRows = Object.entries(groups).map(([requirementName, reqTasks]) => {
          const startTimes = reqTasks.map(t => new Date(t.start).getTime());
          const endTimes = reqTasks.map(t => new Date(t.end).getTime());
          const start = new Date(Math.min(...startTimes));
          const end = new Date(Math.max(...endTimes));

          const resourceMap = new Map();
          reqTasks.forEach(t => {
            if (t.resources) {
              t.resources.forEach(r => {
                resourceMap.set(String(r.id), r);
              });
            }
          });
          const resources = Array.from(resourceMap.values());

          return {
            requirementName,
            start,
            end,
            resources,
            tasks: reqTasks
          };
        });

        // Sort by start date
        reqRows.sort((a, b) => a.start.getTime() - b.start.getTime());

        reqRows.forEach((group) => {
          // Left side column item (Requirement Name)
          const requirementEl = document.createElement('div');
          requirementEl.className = "h-[42px] border-b border-slate-100 flex items-center px-4 shrink-0";
          requirementEl.innerHTML = \`
            <div class="min-w-0 flex-1 leading-tight">
              <h4 class="text-xs font-bold text-slate-800 truncate" title="\${group.requirementName}">\${group.requirementName}</h4>
            </div>
          \`;
          resourcesBody.appendChild(requirementEl);

          // Timeline Right row item (Consolidated Bar)
          const rowEl = document.createElement('div');
          rowEl.className = "h-[42px] border-b border-slate-100 relative w-full flex items-center";
          rowEl.style.width = totalTimelineWidth + 'px';

          // Calculate coordinates for consolidated requirement bar
          const offsetDaysStart = (group.start.getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000);
          const offsetDaysEnd = (group.end.getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000);
          
          const barLeft = offsetDaysStart * columnWidth;
          const barWidth = Math.max(50, (offsetDaysEnd - offsetDaysStart + 1) * columnWidth);

          const barEl = document.createElement('div');
          barEl.className = "absolute h-[34px] rounded-lg flex items-center px-2 text-[10px] font-bold text-white shadow-sm cursor-pointer select-none overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all";
          barEl.style.left = barLeft + 'px';
          barEl.style.width = barWidth + 'px';
          
          const barBg = getRequirementColor(group.requirementName);
          barEl.style.backgroundColor = barBg;

          // Render avatars group inside the requirement bar
          let avatarsHtml = '';
          if (group.resources.length > 0) {
            avatarsHtml = '<div class="flex -space-x-1.5 mr-2 shrink-0">';
            group.resources.slice(0, 3).forEach(res => {
              const member = DATA.squad.find(s => String(s.id) === String(res.id));
              const grad = member ? member.gradient : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';
              avatarsHtml += \`<div class="w-4.5 h-4.5 rounded-full border border-white flex items-center justify-center text-[7px] font-bold text-white shadow-sm shrink-0" style="background: \${grad}" title="\${res.nome}">\${getInitials(res.nome)}</div>\`;
            });
            if (group.resources.length > 3) {
              avatarsHtml += \`<div class="w-4.5 h-4.5 rounded-full border border-white bg-slate-600 flex items-center justify-center text-[7px] font-bold text-white shadow-sm shrink-0" title="e mais \${group.resources.length - 3}">+\&nbsp;\${group.resources.length - 3}</div>\`;
            }
            avatarsHtml += '</div>';
          }

          // Content of the consolidated bar: avatars + name + date range
          const dateRangeStr = \`\${group.start.toLocaleDateString('pt-BR')} a \${group.end.toLocaleDateString('pt-BR')}\`;
          barEl.innerHTML = \`
            \${avatarsHtml}
            <div class="flex flex-col min-w-0 leading-tight">
              <span class="truncate">\${group.requirementName}</span>
              <span class="text-[8px] opacity-95 font-medium">\${dateRangeStr} • \${group.tasks.length} \${group.tasks.length === 1 ? 'Tarefa' : 'Tarefas'}</span>
            </div>
          \`;

          // Interactive tooltips & click
          barEl.addEventListener('mouseenter', (e) => showRequirementTooltip(e, group));
          barEl.addEventListener('mouseleave', hideGanttTooltip);
          barEl.addEventListener('click', () => {
            if (group.tasks.length > 0) {
              openTaskDetails(group.tasks[0]);
            }
          });

          rowEl.appendChild(barEl);
          ganttRows.appendChild(rowEl);
        });
      }
    }

    function showRequirementTooltip(e, group) {
      const tooltip = document.getElementById('gantt-tooltip');
      const startStr = group.start.toLocaleDateString('pt-BR');
      const endStr = group.end.toLocaleDateString('pt-BR');
      
      let resourcesList = group.resources.map(r => \`<li>• \${r.nome}</li>\`).join('');
      let tasksList = group.tasks.map(t => \`<li>• \${t.name} (\${new Date(t.start).toLocaleDateString('pt-BR')} a \${new Date(t.end).toLocaleDateString('pt-BR')})</li>\`).join('');

      tooltip.innerHTML = \`
        <div class="font-bold border-b border-white/20 pb-1 mb-1 truncate">\${group.requirementName}</div>
        <div class="opacity-95 mb-1">Início: <strong>\${startStr}</strong></div>
        <div class="opacity-95 mb-1">Término: <strong>\${endStr}</strong></div>
        <div class="opacity-95 mb-1 mt-1.5 font-bold">Profissionais:</div>
        <ul class="pl-1 text-[10px] opacity-90 leading-tight">\${resourcesList || '<li>Nenhum</li>'}</ul>
        <div class="opacity-95 mb-1 mt-1.5 font-bold">Tarefas (\${group.tasks.length}):</div>
        <ul class="pl-1 text-[10px] opacity-90 leading-tight">\${tasksList}</ul>
      \`;
      
      tooltip.classList.remove('hidden');
      
      const updatePosition = (event) => {
        tooltip.style.left = (event.pageX + 12) + 'px';
        tooltip.style.top = (event.pageY + 12) + 'px';
      };
      
      updatePosition(e);
      e.target.addEventListener('mousemove', updatePosition);
      e.target.addEventListener('mouseleave', () => {
        e.target.removeEventListener('mousemove', updatePosition);
      });
    }

    // Dynamic requirement color
    function getRequirementColor(reqName) {
      const colors = [
        '#64183f', '#1a1f44', '#15803d', '#b45309', '#0891b2', 
        '#701a75', '#c2410c', '#0369a1', '#4d7c0f', '#475569'
      ];
      let hash = 0;
      for (let i = 0; i < reqName.length; i++) {
        hash = reqName.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % colors.length;
      return colors[index];
    }

    // Tooltip Gantt
    function showGanttTooltip(e, task) {
      const tooltip = document.getElementById('gantt-tooltip');
      const startStr = new Date(task.start).toLocaleDateString('pt-BR');
      const endStr = new Date(task.end).toLocaleDateString('pt-BR');
      
      tooltip.innerHTML = \`
        <div class="font-bold border-b border-white/20 pb-1 mb-1 truncate">\${task.name}</div>
        <div class="opacity-90">Fase: <strong>\${task.phase}</strong></div>
        <div class="opacity-90">Início: <strong>\${startStr}</strong></div>
        <div class="opacity-90">Término: <strong>\${endStr}</strong></div>
      \`;
      
      tooltip.classList.remove('hidden');
      
      // Position tooltip near cursor
      const updatePosition = (event) => {
        tooltip.style.left = (event.pageX + 12) + 'px';
        tooltip.style.top = (event.pageY + 12) + 'px';
      };
      
      updatePosition(e);
      e.target.addEventListener('mousemove', updatePosition);
      e.target.addEventListener('mouseleave', () => {
        e.target.removeEventListener('mousemove', updatePosition);
      });
    }

    function hideGanttTooltip() {
      document.getElementById('gantt-tooltip').classList.add('hidden');
    }

    // Open Drawer details
    function openTaskDetails(task) {
      document.getElementById('drawer-task-name').textContent = task.name;
      document.getElementById('drawer-task-desc').textContent = task.description || 'Nenhuma descrição fornecida.';
      
      const startStr = task.start ? new Date(task.start).toLocaleDateString('pt-BR') : '';
      const endStr = task.end ? new Date(task.end).toLocaleDateString('pt-BR') : '';
      document.getElementById('drawer-task-period').textContent = startStr && endStr ? \`📅 \${startStr} a \${endStr}\` : 'Período não definido';
      
      document.getElementById('drawer-task-phase').textContent = task.phase;
      
      const resContainer = document.getElementById('drawer-task-resources');
      resContainer.innerHTML = '';
      
      if (task.resources && task.resources.length > 0) {
        task.resources.forEach(res => {
          const member = DATA.squad.find(s => s.nome === res.nome);
          const grad = member ? member.gradient : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';
          
          const card = document.createElement('div');
          card.className = "flex items-center gap-1.5 border border-slate-200 p-1.5 pr-3.5 rounded-full bg-white shadow-sm";
          card.innerHTML = \`
            <div class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0" style="background: \${grad}">
              \${getInitials(res.nome)}
            </div>
            <span class="text-xs font-bold text-slate-800">\${res.nome}</span>
          \`;
          resContainer.appendChild(card);
        });
      } else {
        resContainer.innerHTML = '<span class="text-xs italic text-slate-400">Nenhum recurso alocado</span>';
      }

      document.getElementById('task-drawer-overlay').classList.remove('hidden');
      document.getElementById('task-drawer').classList.remove('translate-x-full');
    }

    function closeDrawer() {
      document.getElementById('task-drawer-overlay').classList.add('hidden');
      document.getElementById('task-drawer').classList.add('translate-x-full');
    }

    // Renderizar Backlog
    function renderBacklog(planned, unplanned) {
      document.getElementById('planned-count').textContent = planned.length;
      document.getElementById('unplanned-count').textContent = unplanned.length;

      const plannedTable = document.getElementById('planned-tasks-table');
      const unplannedTable = document.getElementById('unplanned-tasks-table');

      plannedTable.innerHTML = '';
      unplannedTable.innerHTML = '';

      // Render Planned Table
      if (planned.length === 0) {
        plannedTable.innerHTML = \`<tr><td colspan="5" class="p-6 text-center text-slate-400 italic bg-white">Nenhuma tarefa correspondente aos filtros</td></tr>\`;
      } else {
        planned.forEach((task, idx) => {
          const row = document.createElement('tr');
          row.className = "border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors";
          row.onclick = () => openTaskDetails(task);

          const orig = task.originalItem || {};
          const seq = orig.taskSequence || idx + 1;
          const tech = orig.taskTechnology || orig.sistema || '';
          const pts = orig.taskPoints || orig.pontos || 0;
          
          const res = task.resources && task.resources[0];
          let avatarCol = '<span class="text-slate-400 italic text-xs">Não atribuído</span>';
          if (res) {
            const member = DATA.squad.find(s => s.nome === res.nome);
            const grad = member ? member.gradient : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';
            avatarCol = \`
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style="background: \${grad}">
                  \${getInitials(res.nome)}
                </div>
                <div>
                  <div class="font-bold text-slate-800 text-xs">\${res.nome}</div>
                  \${res.perfil ? \`<div class="text-[9px] text-slate-400 font-semibold">\${res.perfil}</div>\` : ''}
                </div>
              </div>
            \`;
          }

          const startStr = new Date(task.start).toLocaleDateString('pt-BR');
          const endStr = new Date(task.end).toLocaleDateString('pt-BR');

          row.innerHTML = \`
            <td class="p-3.5">
              <span class="inline-block px-2.5 py-1 text-[10px] font-extrabold bg-pink-50 text-wine-500 border border-pink-100 rounded-lg">#\${seq}</span>
            </td>
            <td class="p-3.5 text-xs">
              <div class="font-bold text-slate-800">\${task.name}</div>
              <div class="flex items-center gap-2 mt-1">
                \${tech ? \`<span class="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600">\${tech}</span>\` : ''}
                <span class="text-[9px] text-slate-500 font-semibold">\${pts} pts</span>
              </div>
            </td>
            <td class="p-3.5">\${avatarCol}</td>
            <td class="p-3.5">
              <span class="inline-block px-2.5 py-0.5 bg-indigo-950 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">\${task.phase}</span>
            </td>
            <td class="p-3.5 text-right font-bold text-cyan-600 text-xs">\${startStr} - \${endStr}</td>
          \`;
          plannedTable.appendChild(row);
        });
      }

      // Render Unplanned Table
      if (unplanned.length === 0) {
        unplannedTable.innerHTML = \`<tr><td colspan="3" class="p-6 text-center text-slate-400 italic bg-white">Nenhuma tarefa correspondente aos filtros</td></tr>\`;
      } else {
        unplanned.forEach((task, idx) => {
          const row = document.createElement('tr');
          row.className = "border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors";
          row.onclick = () => openTaskDetails(task);

          const orig = task.originalItem || {};
          const seq = orig.taskSequence || idx + 1;
          const tech = orig.taskTechnology || orig.sistema || '';
          const pts = orig.taskPoints || orig.pontos || 0;

          row.innerHTML = \`
            <td class="p-3.5">
              <span class="inline-block px-2.5 py-1 text-[10px] font-extrabold bg-pink-50 text-wine-500 border border-pink-100 rounded-lg">#\${seq}</span>
            </td>
            <td class="p-3.5 text-xs">
              <div class="font-bold text-slate-800">\${task.name}</div>
              <div class="flex items-center gap-2 mt-1">
                \${tech ? \`<span class="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600">\${tech}</span>\` : ''}
                <span class="text-[9px] text-slate-500 font-semibold">\${pts} pts</span>
              </div>
            </td>
            <td class="p-3.5">
              <span class="inline-block px-2.5 py-0.5 bg-indigo-950 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">\${task.phase}</span>
            </td>
          \`;
          unplannedTable.appendChild(row);
        });
      }
    }

    // Renderizar Tecnologias
    function renderTechnologies() {
      const container = document.getElementById('tech-cards-container');
      container.innerHTML = '';

      Object.entries(DATA.metrics.pointsByTech).forEach(([tech, pts]) => {
        const pct = DATA.metrics.totalPoints > 0 ? Math.round((pts / DATA.metrics.totalPoints) * 100) : 0;
        
        const card = document.createElement('div');
        card.className = "p-4 rounded-xl border border-slate-200 border-l-4 border-l-wine-500 flex items-center min-w-[180px] bg-gradient-to-r from-wine-500/[0.04] to-indigo-950/[0.04] shadow-sm";
        card.innerHTML = \`
          <div class="flex items-center gap-3.5">
            <div class="p-1.5 bg-wine-500/10 rounded-lg">
              <svg class="w-4 h-4 text-wine-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"/></svg>
            </div>
            <div class="w-px h-6 bg-wine-500/30"></div>
            <div class="leading-tight">
              <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">\${tech}</h4>
              <p class="text-sm font-extrabold text-slate-800 mt-0.5">\${pts} pts (\${pct}%)</p>
            </div>
          </div>
        \`;
        container.appendChild(card);
      });
    }

    // Inicialização ao carregar a página
    window.addEventListener('DOMContentLoaded', () => {
      initFilters();
      renderAll();
    });
  </script>
</body>
</html>`;
}
