/**
 * DEPRECATED - Planning 2.0 v2.0+
 * 
 * Este arquivo foi desativado. Planning 2.0 agora usa arquitetura client-server
 * pura com banco de dados compartilhado em rede (Oracle). Não há dependência
 * de arquivos locais .xlsm.
 * 
 * Todos os dados são consumidos via API REST endpoints.
 * 
 * Mantido apenas para referência histórica.
 */

console.warn('[DEPRECATED] read_excel.js is no longer used. Use API endpoints from server.js instead.');
  
  // 1. Aba Padrão - D7
  const padrao = workbook.Sheets['Padrão'] || workbook.Sheets['Padrao'];
  if (padrao) {
    console.log('Padrão cell D7:', padrao['D7'] ? padrao['D7'].v : 'Not found');
  } else {
    console.log('Padrão sheet not found');
  }

  // 2. Aba Parâmetros
  const parametros = workbook.Sheets['Parâmetros'] || workbook.Sheets['Parametros'];
  if (parametros) {
    // Print non-empty values in N2:N102
    console.log('--- Parâmetros N2:N102 (Macro Requisitos) ---');
    const macros = [];
    for (let r = 2; r <= 102; r++) {
      const cell = parametros['N' + r];
      if (cell && cell.v !== undefined) {
        macros.push(`N${r}: ${cell.v}`);
      }
    }
    console.log(`Found ${macros.length} items. First 5:`, macros.slice(0, 5));

    // Print non-empty values in L2:L21 (or L2:NL21?)
    console.log('--- Parâmetros L2:L21 / L2:NL21 ---');
    const lCol = [];
    for (let r = 2; r <= 21; r++) {
      const cell = parametros['L' + r];
      if (cell && cell.v !== undefined) {
        lCol.push(`L${r}: ${cell.v}`);
      }
    }
    console.log(`L2:L21 - Found ${lCol.length} items. First 5:`, lCol.slice(0, 5));

    // Let's also check if there are columns like M, N, O, etc.
    // Let's print row 2 from column L onwards
    console.log('--- Row 2 starting from column L ---');
    const row2 = [];
    for (let c = 11; c < 20; c++) { // L is 11, M is 12, N is 13...
      const colLetter = String.fromCharCode(65 + c);
      const cell = parametros[colLetter + '2'];
      if (cell) {
        row2.push(`${colLetter}2: ${cell.v}`);
      }
    }
    console.log('Row 2 values:', row2);
  } else {
    console.log('Parâmetros sheet not found');
  }

  // 3. Aba Resumo
  const resumo = workbook.Sheets['Resumo'];
  if (resumo) {
    console.log('Resumo keys search:');
    for (const key in resumo) {
      if (resumo[key] && typeof resumo[key].v === 'string' && resumo[key].v.toLowerCase().includes('funcional')) {
        console.log(`Found "funcional" at ${key}:`, resumo[key].v);
        // print neighboring cells
        const match = key.match(/^([A-Z]+)(\d+)$/);
        if (match) {
          const col = match[1];
          const row = match[2];
          console.log(`Cell next to ${key}:`, resumo[String.fromCharCode(col.charCodeAt(0) + 1) + row]?.v);
        }
      }
    }
  } else {
    console.log('Resumo sheet not found');
  }

} catch (err) {
  console.error('Error:', err);
}
