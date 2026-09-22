import React from 'react';
import {
  BookOpen,
  Compass,
  Database,
  Gear,
  Kanban,
  Calendar,
  Rocket,
  ShieldCheck,
  ArrowsClockwise
} from '@phosphor-icons/react';

export const ManualView: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-4 lg:p-8 bg-white/85 backdrop-blur-md text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#64183f] to-[#1a1f44] text-white flex items-center justify-center">
              <BookOpen size={20} weight="bold" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#64183f]">Manual da Aplicacao</h1>
              <p className="text-sm text-slate-500 font-semibold">Guia completo de uso do Planning 2.0</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            Este manual descreve os fluxos principais da aplicacao, desde o cadastro inicial ate o planejamento,
            sincronizacao, acompanhamento em Gantt/Kanban e exportacoes. Use este documento como referencia
            operacional para usuarios de negocio e time tecnico.
          </p>
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-[#1a1f44] mb-4">Sumario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <a href="#manual-secao-1" className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">1. Visao Geral e Navegacao</a>
            <a href="#manual-secao-2" className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">2. Dados e Estrutura</a>
            <a href="#manual-secao-3" className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">3. Sincronizacao e Regras</a>
            <a href="#manual-secao-4" className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">4. Gantt e Kanban</a>
            <a href="#manual-secao-5" className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">5. Calendario e Capacidade</a>
            <a href="#manual-secao-6" className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">6. Exportacao e Compartilhamento</a>
            <a href="#manual-secao-7" className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">7. Boas Praticas</a>
            <a href="#manual-secao-8" className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">8. Solucao de Problemas</a>
          </div>
        </section>

        <section id="manual-secao-1" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-6">
          <h2 className="text-lg font-extrabold text-[#1a1f44] mb-4 flex items-center gap-2">
            <Compass size={18} weight="bold" />
            1. Visao Geral e Navegacao
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            <li>Dashboard: indicadores gerais de progresso, carga e distribuicao.</li>
            <li>Projetos: cadastro, edicao, visualizacao e controle de ciclo de vida.</li>
            <li>Recursos: gestao de profissionais, perfis, alocacoes e disponibilidade.</li>
            <li>Calendario: manutencao de feriados e dias nao uteis para o planejamento.</li>
            <li>Status de Conexao: validacao de VPN/Oracle e sessao ativa.</li>
          </ul>
        </section>

        <section id="manual-secao-2" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-6">
          <h2 className="text-lg font-extrabold text-[#1a1f44] mb-4 flex items-center gap-2">
            <Database size={18} weight="bold" />
            2. Dados e Estrutura
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <p className="font-bold text-slate-800 mb-1">Fontes principais</p>
              <p>Excel (entrada inicial), banco Oracle (persistencia), APIs internas (sincronizacao).</p>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <p className="font-bold text-slate-800 mb-1">Entidades principais</p>
              <p>Projeto, Backlog, Recurso, Alocacao por fase/tecnologia, Feriado, Workflow.</p>
            </div>
          </div>
        </section>

        <section id="manual-secao-3" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-6">
          <h2 className="text-lg font-extrabold text-[#1a1f44] mb-4 flex items-center gap-2">
            <ArrowsClockwise size={18} weight="bold" />
            3. Sincronizacao e Regras de Planejamento
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            <li>Sincronizacao calcula datas no backlog com base em pontos, alocacao e produtividade.</li>
            <li>Formula de carga: <strong>((pontos * 0,5) / allocation_perc)</strong>.</li>
            <li>Feriados e finais de semana sao ignorados no calculo de dias uteis.</li>
            <li>Quando houver saldo no dia para o mesmo profissional, a tarefa seguinte pode iniciar no mesmo dia.</li>
            <li>Alocacoes e produtividade semanal sao respeitadas para evitar superalocacao.</li>
          </ul>
        </section>

        <section id="manual-secao-4" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-6">
          <h2 className="text-lg font-extrabold text-[#1a1f44] mb-4 flex items-center gap-2">
            <Kanban size={18} weight="bold" />
            4. Gantt e Kanban
          </h2>
          <div className="space-y-3 text-sm text-slate-700">
            <p><strong>Gantt:</strong> acompanha cronograma por recurso/requisito, com arraste e ajuste visual.</p>
            <p><strong>Kanban:</strong> organiza tarefas por fases (Waiting, In Progress, Completed).</p>
            <p><strong>Edicao rapida:</strong> no fullscreen/kanban, duplo clique no card permite editar inicio/fim.</p>
            <p>As alteracoes sao persistidas no backlog para manter rastreabilidade e consistencia dos dados.</p>
          </div>
        </section>

        <section id="manual-secao-5" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-6">
          <h2 className="text-lg font-extrabold text-[#1a1f44] mb-4 flex items-center gap-2">
            <Calendar size={18} weight="bold" />
            5. Calendario e Capacidade
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            <li>Cadastre feriados para refletir capacidade real de execucao.</li>
            <li>Revise periodicamente alocacao (%) e produtividade (%) por profissional.</li>
            <li>Use a visao de planejamento para validar conflitos e antecipar gargalos.</li>
          </ul>
        </section>

        <section id="manual-secao-6" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-6">
          <h2 className="text-lg font-extrabold text-[#1a1f44] mb-4 flex items-center gap-2">
            <Rocket size={18} weight="bold" />
            6. Exportacao e Compartilhamento
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            <li>Exportacao interativa (.html) gera um snapshot navegavel para compartilhamento.</li>
            <li>A exportacao inclui visoes de planejamento, backlog e tecnologias.</li>
            <li>Use a exportacao para apresentacoes e alinhamentos com stakeholders.</li>
          </ul>
        </section>

        <section id="manual-secao-7" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-6">
          <h2 className="text-lg font-extrabold text-[#1a1f44] mb-4 flex items-center gap-2">
            <ShieldCheck size={18} weight="bold" />
            7. Boas Praticas Operacionais
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            <li>Mantenha cadastros de projeto, etapas e workflows atualizados.</li>
            <li>Confirme conexao antes de operacoes de sincronizacao e gravacao massiva.</li>
            <li>Padronize nomenclaturas de fase e tecnologia para evitar inconsistencias.</li>
            <li>Valide datas apos ajustes manuais de planejamento.</li>
          </ul>
        </section>

        <section id="manual-secao-8" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-6">
          <h2 className="text-lg font-extrabold text-[#1a1f44] mb-4 flex items-center gap-2">
            <Gear size={18} weight="bold" />
            8. Solucao de Problemas Rapida
          </h2>
          <div className="space-y-2 text-sm text-slate-700">
            <p><strong>Sem conexao Oracle:</strong> verificar VPN, rede e status de sessao no rodape.</p>
            <p><strong>Datas inesperadas:</strong> revisar feriados, allocation_perc e perc_productivity.</p>
            <p><strong>Tarefa sem responsavel:</strong> revisar mapeamento fase/tecnologia e alocacoes.</p>
            <p><strong>Inconsistencia visual:</strong> forcar nova sincronizacao e atualizar a tela.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
