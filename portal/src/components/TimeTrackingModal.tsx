import React, { useState, useMemo } from 'react';
import type { Task } from '../types';
import { usePlanningStore, isWorkingDay } from '../store/PlanningStore';
import { X, Plus, Trash, Warning } from '@phosphor-icons/react';

interface TimeTrackingModalProps {
  task: Task;
  onClose: () => void;
}

export const TimeTrackingModal: React.FC<TimeTrackingModalProps> = ({ task, onClose }) => {
  const { timeLogs, squad, holidays, addTimeLog, deleteTimeLog } = usePlanningStore();
  
  // Local Form state
  const [logDate, setLogDate] = useState(() => {
    // Default to task start date or today
    return task.dtInicio || new Date().toISOString().split('T')[0];
  });
  const [logName, setLogName] = useState(task.nome || squad[0]?.nome || '');
  const [logPoints, setLogPoints] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter logs associated with this specific task
  const taskLogs = useMemo(() => {
    return timeLogs.filter(log => log.taskId === task.id);
  }, [timeLogs, task.id]);

  // Points rollup
  const totalLoggedPoints = useMemo(() => {
    return taskLogs.reduce((acc, log) => acc + log.points, 0);
  }, [taskLogs]);

  const remainingPoints = Math.max(0, task.pontos - totalLoggedPoints);
  const progressPercentage = task.pontos > 0 ? Math.min(100, Math.round((totalLoggedPoints / task.pontos) * 100)) : 0;

  // Form submission with validations
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation 1: Log date must be a working day (VBA calendar rule)
    if (!isWorkingDay(logDate, holidays)) {
      setErrorMsg('A data selecionada coincide com um fim de semana ou feriado nacional cadastrado.');
      return;
    }

    // Validation 2: Cannot log more points than the task's total capacity
    if (logPoints > remainingPoints) {
      setErrorMsg(`O esforço lançado (${logPoints} pts) excede o saldo restante da tarefa (${remainingPoints} pts).`);
      return;
    }

    // Validation 3: Resource daily capacity check
    // Sum points already booked for this resource on this specific date
    const dailyLimit = 2; // Default daily limit of 2 points (1 working day)

    const resourceBookingsOnDate = timeLogs.filter(log => log.nome === logName && log.date === logDate);
    const alreadyBookedPoints = resourceBookingsOnDate.reduce((sum, log) => sum + log.points, 0);

    if (alreadyBookedPoints + logPoints > dailyLimit) {
      setErrorMsg(
        `Capacidade Diária Excedida! ${logName} já possui ${alreadyBookedPoints} pts agendados para ${new Date(logDate + 'T12:00:00').toLocaleDateString('pt-BR')}. ` +
        `O limite diário deste recurso é de ${dailyLimit} pt(s).`
      );
      return;
    }

    // Save Log
    addTimeLog({
      taskId: task.id,
      date: logDate,
      points: logPoints,
      nome: logName
    });

    // Reset default form points if remaining permits
    setLogPoints(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white p-6 w-full max-w-lg border border-slate-100 shadow-2xl rounded-[2rem] relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={20} weight="bold" />
        </button>
        
        {/* Modal Header */}
        <div className="mb-5 pr-8">
          <span className="text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
            {task.idJira}
          </span>
          <h3 className="text-xl font-extrabold text-slate-800 mt-2 line-clamp-1">{task.task}</h3>
          <p className="text-xs text-slate-400 mt-1">
            Fase: <span className="font-semibold text-slate-500">{task.idBacklog}</span> • 
            Perfil: <span className="font-semibold text-slate-500">{task.perfil}</span>
          </p>
        </div>

        {/* Progress Rollup bar */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Pontos Lançados: {totalLoggedPoints} / {task.pontos} pts</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
            <span>Disponível para lançamento: {remainingPoints} pts</span>
            {remainingPoints === 0 && (
              <span className="text-emerald-600 font-bold uppercase tracking-wider">Esforço Total Concluído</span>
            )}
          </div>
        </div>

        {/* Form and List Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          
          {/* New booking form */}
          {remainingPoints > 0 ? (
            <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Lançar Novo Ponto de Esforço</h4>
              
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs text-red-650 flex items-start space-x-2">
                  <Warning size={18} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Data de Lançamento</label>
                  <input 
                    type="date"
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary/50 transition-all cursor-pointer"
                    required
                  />
                </div>

                {/* Resource */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Profissional</label>
                  <select 
                    value={logName}
                    onChange={e => setLogName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary/50 transition-all cursor-pointer"
                    required
                  >
                    {squad.map(m => (
                      <option key={m.nome} value={m.nome}>{m.nome} ({m.perfil})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-end justify-between pt-2">
                {/* Points */}
                <div className="w-1/2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Pontos (Períodos)</label>
                  <select 
                    value={logPoints}
                    onChange={e => setLogPoints(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary/50 transition-all cursor-pointer"
                  >
                    <option value={1}>1 Ponto (Meio Período)</option>
                    <option value={2} disabled={remainingPoints < 2}>2 Pontos (Período Integral)</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl flex items-center space-x-1.5 transition-all shadow shadow-primary/20"
                >
                  <Plus size={16} weight="bold" />
                  <span>LANÇAR</span>
                </button>
              </div>
            </form>
          ) : null}

          {/* Log List */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Histórico de Lançamentos ({taskLogs.length})</h4>
            <div className="space-y-2.5">
              {taskLogs.length > 0 ? (
                taskLogs.map(log => {
                  const dateFormatted = new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR');
                  return (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/40 transition-all group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-750">{log.nome}</span>
                        <span className="text-[10px] text-slate-450 font-mono mt-0.5">{dateFormatted}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-bold font-mono">
                          {log.points} pt{log.points > 1 ? 's' : ''}
                        </span>
                        <button 
                          onClick={() => deleteTimeLog(log.id)}
                          className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-all"
                          title="Remover Lançamento"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50/20 border border-dashed border-slate-150 rounded-2xl">
                  Nenhum apontamento registrado para esta tarefa.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
