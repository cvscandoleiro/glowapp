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

console.warn('[DEPRECATED] read_excel_params.js is no longer used. Use API endpoints from server.js instead.');
  
  if (sheet) {
    console.log('Cells in Parametros sheet:');
    const cells = Object.keys(sheet).filter(k => k[0] !== '!');
    cells.forEach(k => {
      console.log(`${k}: ${sheet[k].v}`);
    });
  } else {
    console.log('Parametros sheet not found');
  }
} catch (err) {
  console.error('Error:', err);
}
