import * as XLSX from 'xlsx';

export interface ParsedRequirementRow {
  macroRequisito: string;
  tarefa: string;
  tecnologia: string;
  tipo: string; // Build or Arquitetura & Design
  valor: string; // MS, S, M, C
  documentacao: string; // From the Resumo sheet
  colLetter?: string;
}

export interface ParsedMetadataItem {
  planilha: string;
  grupo: string;
  macroRequisito: string;
  tarefa: string;
}

export interface ParsedProjectData {
  projectName: string;
  documentacaoFuncional: string;
  escritaFuncionalDoc?: string;
  rows: ParsedRequirementRow[];
  metadataSummary: ParsedMetadataItem[];
  buildComplexityPoints?: { [key: string]: number };
  arqComplexityPoints?: { [key: string]: number };
}

// Convert 0-based column index to Excel column letters (0 -> A, 25 -> Z, 26 -> AA, etc.)
export function getExcelColName(colIdx: number): string {
  let temp = colIdx;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// Parse column letters to 0-based column index
export function parseExcelColName(colName: string): number {
  let colIdx = 0;
  for (let i = 0; i < colName.length; i++) {
    colIdx = colIdx * 26 + (colName.charCodeAt(i) - 64);
  }
  return colIdx - 1;
}

export async function parseRequirementsFile(
  file: File,
  options: { filterByParameters?: boolean } = { filterByParameters: true }
): Promise<ParsedProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Não foi possível ler os dados do arquivo.');
        }

        const workbook = XLSX.read(data, { type: 'array' });

        // 1. Read Project Name from D7 in 'Padrão' sheet (Must be done first)
        const padraoSheet = workbook.Sheets['Padrão'] || workbook.Sheets['Padrao'];
        if (!padraoSheet) {
          throw new Error('Aba "Padrão" não encontrada no arquivo.');
        }

        const projectCell = padraoSheet['D7'];
        const projectName = projectCell ? String(projectCell.v || '').trim() : '';

        // 2. Read Parameters from 'Parâmetros' sheet
        const parametrosSheet = workbook.Sheets['Parâmetros'] || workbook.Sheets['Parametros'] || workbook.Sheets['Parameters'];
        if (!parametrosSheet) {
          throw new Error('Aba "Parâmetros" não encontrada no arquivo.');
        }

        // Extract Macro Requisitos from Column N dynamically (previously N2:N102)
        const macroRequisitos = new Set<string>();
        let emptyCountN = 0;
        let rN = 2;
        while (emptyCountN < 100 && rN < 1000) {
          const cell = parametrosSheet['N' + rN];
          if (cell && cell.v !== undefined && cell.v !== null) {
            const val = String(cell.v).trim();
            if (val) {
              macroRequisitos.add(val);
              emptyCountN = 0;
            } else {
              emptyCountN++;
            }
          } else {
            emptyCountN++;
          }
          rN++;
        }

        // Extract Nome do Sistema from L2:L21
        const nomesSistema = new Set<string>();
        for (let r = 2; r <= 21; r++) {
          const cell = parametrosSheet['L' + r];
          if (cell && cell.v !== undefined && cell.v !== null) {
            const val = String(cell.v).trim();
            if (val) nomesSistema.add(val);
          }
        }

        // Read points parameters for complexity
        const getParamVal = (cellRef: string, defaultVal: number): number => {
          const cell = parametrosSheet[cellRef];
          if (cell && cell.v !== undefined && cell.v !== null) {
            const val = parseFloat(String(cell.v).trim());
            return isNaN(val) ? defaultVal : val;
          }
          return defaultVal;
        };

        // Build averages (B and C)
        const msBuildAvg = (getParamVal('B3', 2) + getParamVal('C3', 2)) / 2;
        const sBuildAvg = (getParamVal('B4', 4) + getParamVal('C4', 4)) / 2;
        const mBuildAvg = (getParamVal('B5', 8) + getParamVal('C5', 8)) / 2;
        const cBuildAvg = (getParamVal('B6', 12) + getParamVal('C6', 12)) / 2;

        const buildComplexityPoints = {
          'MS': Math.round(msBuildAvg * 1.2),
          'S': Math.round(sBuildAvg * 1.2),
          'M': Math.round(mBuildAvg * 1.2),
          'C': Math.round(cBuildAvg * 1.2)
        };

        // Arq & Design averages (D and E)
        const msArqAvg = (getParamVal('D3', 2) + getParamVal('E3', 2)) / 2;
        const sArqAvg = (getParamVal('D4', 4) + getParamVal('E4', 4)) / 2;
        const mArqAvg = (getParamVal('D5', 8) + getParamVal('E5', 8)) / 2;
        const cArqAvg = (getParamVal('D6', 12) + getParamVal('E6', 12)) / 2;

        const arqComplexityPoints = {
          'MS': Math.round(msArqAvg),
          'S': Math.round(sArqAvg),
          'M': Math.round(mArqAvg),
          'C': Math.round(cArqAvg)
        };

        // 3. Extract Documentation from 'Resumo' sheet
        const resumoSheet = workbook.Sheets['Resumo'] || workbook.Sheets['Summary'] || workbook.Sheets['resumo'];
        let docFuncional = 'Não localizada';
        let escritaFuncionalDoc = ''; // For Column D === 'Funcional (Documentação)', get Column F
        if (resumoSheet) {
          // Search for "Funcional" cell in all sheet keys
          for (const key in resumoSheet) {
            if (Object.prototype.hasOwnProperty.call(resumoSheet, key)) {
              const cell = resumoSheet[key];
              if (cell && cell.v && String(cell.v).trim().toLowerCase() === 'funcional') {
                // Find column and row of the found cell
                const match = key.match(/^([A-Z]+)(\d+)$/);
                if (match) {
                  const colName = match[1];
                  const rowNum = parseInt(match[2], 10);
                  const startColIdx = parseExcelColName(colName);
                  
                  // Scan cells to the right in the same row for a value
                  for (let c = startColIdx + 1; c < startColIdx + 5; c++) {
                    const nextKey = getExcelColName(c) + rowNum;
                    const nextCell = resumoSheet[nextKey];
                    if (nextCell && nextCell.v !== undefined && nextCell.v !== null) {
                      const val = String(nextCell.v).trim();
                      if (val) {
                        docFuncional = val;
                        break;
                      }
                    }
                  }
                }
                break;
              }
            }
          }

          // Search Resumo sheet for Column D (key 'D' + row) having value "Funcional (Documentação)" and take Column F (key 'F' + row)
          for (let r = 1; r <= 200; r++) {
            const cellD = resumoSheet['D' + r];
            if (cellD && cellD.v !== undefined && cellD.v !== null) {
              const valD = String(cellD.v).trim();
              if (valD === 'Funcional (Documentação)') {
                const cellF = resumoSheet['F' + r];
                if (cellF && cellF.v !== undefined && cellF.v !== null) {
                  escritaFuncionalDoc = String(cellF.v).trim();
                }
                break;
              }
            }
          }
        }

        // 4. Map Requisitos vs. Sistemas in 'Padrão' sheet
        const validValues = new Set(['MS', 'S', 'M', 'C']);
        const parsedRows: ParsedRequirementRow[] = [];

        // Identify technology columns in Row 8
        const techColumns: { colIdx: number; colName: string; techName: string; groupType: string }[] = [];
        


        // Scan specifically from Column H (index 7) to Column AS (index 44) in Row 9
        const filterByParam = options.filterByParameters ?? true;
        for (let c = 7; c <= 44; c++) {
          const colName = getExcelColName(c);
          const cell = padraoSheet[colName + '9'];
          if (cell && cell.v !== undefined && cell.v !== null) {
            const techName = String(cell.v).trim();
            if (techName) {
              let includeColumn = true;
              
              if (filterByParam && nomesSistema.size > 0) {
                includeColumn = nomesSistema.has(techName);
              }

              if (includeColumn) {
                const groupType = c <= 25 ? 'Build' : 'Arquitetura & Design';
                techColumns.push({ colIdx: c, colName, techName, groupType });
              }
            }
          }
        }

        // Scan rows starting from Row 10 downwards until 20 consecutive empty rows are found in Column C
        let emptyRowCount = 0;
        let rowNum = 10;
        let hasStarted = false;
        let currentParentMacro = '';
        const metadataSummary: ParsedMetadataItem[] = [];

        // Project Name
        metadataSummary.push({
          planilha: 'Padrão',
          grupo: 'Nome do Projeto (Célula D7)',
          macroRequisito: projectName || 'Não identificado',
          tarefa: ''
        });

        // Functional Doc
        metadataSummary.push({
          planilha: 'Resumo',
          grupo: 'Documentação Funcional',
          macroRequisito: docFuncional || 'Não identificada',
          tarefa: ''
        });

        while (emptyRowCount < 20 && rowNum < 500) {
          const reqCell = padraoSheet['C' + rowNum];
          const reqVal = reqCell && reqCell.v !== undefined ? String(reqCell.v).trim() : '';

          if (reqVal && reqVal.toUpperCase().includes('SPRINT 0')) {
            break;
          }

          if (!reqVal) {
            emptyRowCount++;
          } else {
            emptyRowCount = 0; // Reset
            
            const isMacro = macroRequisitos.has(reqVal) || macroRequisitos.size === 0;
            if (!hasStarted) {
              if (isMacro) {
                hasStarted = true;
              } else {
                rowNum++;
                continue;
              }
            }

            if (isMacro) {
              currentParentMacro = reqVal;
            } else {
              // Push to metadataSummary for Padrão Column C only if it has a task (isMacro is false)
              metadataSummary.push({
                planilha: 'Padrão',
                grupo: 'Macro Requisitos (Coluna C)',
                macroRequisito: currentParentMacro,
                tarefa: reqVal
              });

              // Scan intersections for mapped columns only if it has a task
              techColumns.forEach((col) => {
                const valCell = padraoSheet[col.colName + rowNum];
                if (valCell && valCell.v !== undefined && valCell.v !== null) {
                  const val = String(valCell.v).trim().toUpperCase();
                  if (validValues.has(val)) {
                    parsedRows.push({
                      macroRequisito: currentParentMacro,
                      tarefa: reqVal,
                      tecnologia: col.techName,
                      tipo: col.groupType,
                      valor: val,
                      documentacao: docFuncional,
                      colLetter: col.colName
                    });
                  }
                }
              });
            }
          }
          rowNum++;
        }

        // Collect unfiltered systems/tecnologies from Row 9 of Padrão specifically from Column H (7) to AS (44)
        const allPadraoTechs: { name: string; label: string; colLetter: string }[] = [];
        for (let c = 7; c <= 44; c++) {
          const colName = getExcelColName(c);
          const cell = padraoSheet[colName + '9'];
          if (cell && cell.v !== undefined && cell.v !== null) {
            const techName = String(cell.v).trim();
            if (techName) {
              const group = c <= 25 ? 'Build' : 'Arquitetura & Design';
              allPadraoTechs.push({
                name: techName,
                label: `Sistemas / Tecnologias (Linha 9 - ${group})`,
                colLetter: colName
              });
            }
          }
        }

        allPadraoTechs.forEach(tech => {
          metadataSummary.push({
            planilha: 'Padrão',
            grupo: tech.label,
            macroRequisito: tech.name,
            tarefa: tech.colLetter
          });
        });

        // Parameters - Macro Requisitos (Coluna N)
        if (macroRequisitos.size > 0) {
          metadataSummary.push({
            planilha: 'Parâmetros',
            grupo: 'Macro Requisitos (Coluna N)',
            macroRequisito: Array.from(macroRequisitos).join(', '),
            tarefa: ''
          });
        }

        // Parameters - Nome do Sistema (Coluna L)
        if (nomesSistema.size > 0) {
          metadataSummary.push({
            planilha: 'Parâmetros',
            grupo: 'Nome do Sistema (Coluna L)',
            macroRequisito: Array.from(nomesSistema).join(', '),
            tarefa: ''
          });
        }

        resolve({
          projectName: projectName || 'Projeto Não Nomeado',
          documentacaoFuncional: docFuncional,
          escritaFuncionalDoc,
          rows: parsedRows,
          metadataSummary,
          buildComplexityPoints,
          arqComplexityPoints
        });

      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro na leitura do arquivo.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
