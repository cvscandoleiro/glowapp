import type { Task, TaskTime, ReleasePlan, SquadMember, Holiday } from './types';
import * as XLSX from 'xlsx';

// Helper to convert Excel date numbers or strings to ISO format (YYYY-MM-DD)
export function excelDateToDateString(val: any): string | null {
  if (val === undefined || val === null || val === '') return null;
  
  if (typeof val === 'number') {
    // Excel date epoch starts on 1900-01-01. 25569 days to 1970-01-01
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    const tzOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + tzOffset);
    return adjustedDate.toISOString().split('T')[0];
  }
  
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Check if it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Check for DD/mmm/YY (like 01/fev/25)
    const monthsPt: { [key: string]: string } = {
      jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
      jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12'
    };
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const monthStr = parts[1].toLowerCase();
      const yearStr = parts[2];
      const month = monthsPt[monthStr] || '01';
      const year = yearStr.length === 2 ? `20${yearStr}` : yearStr;
      return `${year}-${month}-${day}`;
    }
    
    // Fallback: try parsing with standard Date
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  
  return null;
}

// Robust sheet parser that scans rows to find the correct header row
function parseSheetToObjects(sheet: XLSX.WorkSheet, headerKeyIdentifiers: string[]): any[] {
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row && row.length > 0) {
      const normalizedRow = row.map(cell => String(cell || '').trim().toLowerCase());
      const hasHeader = headerKeyIdentifiers.some(id => normalizedRow.includes(id.toLowerCase()));
      if (hasHeader) {
        headerIndex = i;
        break;
      }
    }
  }
  
  if (headerIndex === -1) {
    headerIndex = 0; // Fallback
  }
  
  const headers = (rows[headerIndex] || []).map(cell => String(cell || '').trim());
  const dataRows = rows.slice(headerIndex + 1);
  
  return dataRows.map((row, rIdx) => {
    const obj: any = { _rowNum: headerIndex + 2 + rIdx };
    headers.forEach((header, colIdx) => {
      if (header) {
        obj[header] = row[colIdx] !== undefined ? row[colIdx] : null;
      }
    });
    return obj;
  }).filter(obj => {
    // Check if the object contains any non-null content (excluding _rowNum)
    return Object.keys(obj).some(k => k !== '_rowNum' && obj[k] !== null && obj[k] !== '');
  });
}

export const loadData = async () => {
  try {
    const response = await fetch('/Planning 2.0.xlsm');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // 1. Parse Holidays
    const feriadosSheet = workbook.Sheets['Feriados'];
    const rawFeriados = parseSheetToObjects(feriadosSheet, ['Feriado', 'Data']);
    const holidays: Holiday[] = rawFeriados.map(f => ({
      name: f['Feriado'] || 'Feriado',
      date: excelDateToDateString(f['Data']) || '',
      dayOfWeek: f['Dia Semana'] || ''
    })).filter(h => h.date);
    
    // 2. Parse Release Plan
    const releaseSheet = workbook.Sheets['CalendarioRelease'];
    const rawRelease = parseSheetToObjects(releaseSheet, ['Periodo', 'DataInicial']);
    const releases: ReleasePlan[] = rawRelease.map(r => ({
      periodo: r['Periodo'] || '',
      dataInicial: excelDateToDateString(r['DataInicial']) || '',
      dataFinal: excelDateToDateString(r['DataFinal']) || '',
      duracao: Number(r['Duracao']) || 0,
      color: r['Color'] || '#6358dc'
    })).filter(r => r.periodo);

    // 3. Parse Squad Members
    const squadSheet = workbook.Sheets['Squad'];
    const rawSquad = parseSheetToObjects(squadSheet, ['Squad', 'Perfil', 'Nome']);
    const squad: SquadMember[] = rawSquad.map(s => ({
      perfil: s['Perfil'] || '',
      nome: s['Nome'] || ''
    })).filter(s => s.nome);

    // 4. Parse Tasks (DataTarefas)
    const dataTarefasSheet = workbook.Sheets['DataTarefas'];
    const rawDataTarefas = parseSheetToObjects(dataTarefasSheet, ['idJira', 'idBacklog', 'Perfil']);
    const tasks: Task[] = rawDataTarefas.map(t => {
      const idJira = t['idJira'] || '';
      const perfil = t['Perfil'] || '';
      const idBacklog = t['idBacklog'] || '';
      
      // Auto-generate a unique key if row number is not enough
      const id = `${idJira}_${perfil}_${idBacklog}`.replace(/\s+/g, '_');
      
      // Determine status based on dates / completion
      let status: 'backlog' | 'doing' | 'done' = 'backlog';
      const devDone = Number(t['DevDone']) || 0;
      const done = Number(t['Done']) || 0;
      const pontos = Number(t['Pontos']) || 0;
      
      if (done >= pontos && pontos > 0) {
        status = 'done';
      } else if (t['DtInicio'] !== null || devDone > 0) {
        status = 'doing';
      }

      // Map abbreviation from idBacklog or Perfil
      let abreviacao = 'Task';
      if (idBacklog.toLowerCase().includes('funcional')) abreviacao = 'EF';
      else if (idBacklog.toLowerCase().includes('its') || perfil.toLowerCase().includes('arquiteto')) abreviacao = 'ITS';
      else if (idBacklog.toLowerCase().includes('build') || perfil.toLowerCase().includes('dev')) abreviacao = 'Dev';
      else if (idBacklog.toLowerCase().includes('banco')) abreviacao = 'BD';

      return {
        id,
        idJira,
        sistema: t['Sistema'] || '',
        perfil,
        idBacklog,
        task: t['Task'] || idBacklog || '',
        abreviacao,
        tarefaPai: t['idJiraPendente'] || null, // Map predecessor dependency as parent
        status,
        nome: t['Nome'] || '',
        sequencia: Number(t['Sequencia']) || 1,
        pontos,
        dtInicio: excelDateToDateString(t['DtInicio']),
        dtFim: excelDateToDateString(t['DtFim']),
        devDone,
        done
      };
    }).filter(t => t.idJira);

    // 5. Parse Time Logs (PreviaPlanning)
    const previaPlanningSheet = workbook.Sheets['PreviaPlanning'];
    const rawPrevia = parseSheetToObjects(previaPlanningSheet, ['idJira', 'Data', 'Pts']);
    const timeLogs: TaskTime[] = rawPrevia.map((p, idx) => {
      const idJira = p['idJira'] || '';
      const perfil = p['Perfil'] || '';
      const idBacklog = p['idBacklog'] || '';
      
      // Match with the task ID format: `${idJira}_${perfil}_${idBacklog}`
      const taskId = `${idJira}_${perfil}_${idBacklog}`.replace(/\s+/g, '_');
      
      return {
        id: `pp_${idx}`,
        taskId,
        date: excelDateToDateString(p['Data']) || '',
        points: Number(p['Pts']) || 1,
        nome: p['Nome'] || ''
      };
    }).filter(p => p.date && p.taskId);

    // 6. Parse High level Planning Sheet for Gantt-like displays if needed
    const planningSheet = workbook.Sheets['Planning'];
    let planningData: any[] = [];
    if (planningSheet) {
      const rawPlanning = XLSX.utils.sheet_to_json(planningSheet, { header: 1 });
      const dateHeaders = rawPlanning[2] as any[]; // Row 3 contains the date values
      
      for (let i = 4; i < rawPlanning.length; i++) {
        const row = rawPlanning[i] as any[];
        if (row && (row[0] || row[2])) {
          const schedule: any[] = [];
          for (let colIdx = 4; colIdx < row.length; colIdx++) {
            const taskVal = row[colIdx];
            if (taskVal) {
              const rawDate = dateHeaders[colIdx];
              const normalizedDate = excelDateToDateString(rawDate);
              if (normalizedDate) {
                schedule.push({ date: normalizedDate, task: taskVal });
              }
            }
          }
          planningData.push({
            time: row[0] || '',
            perfil: row[1] || '',
            nome: row[2] || '',
            periodo: row[3] || '',
            schedule
          });
        }
      }
    }

    return { tasks, releases, squad, holidays, timeLogs, planningData };
  } catch (error) {
    console.error('Error loading Excel data:', error);
    return { tasks: [], releases: [], squad: [], holidays: [], timeLogs: [], planningData: [] };
  }
};
