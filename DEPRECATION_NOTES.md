# Planning 2.0 v2.0+ — Notas de Deprecação

## Arquivos Deprecados

A partir da versão 2.0, Planning 2.0 foi refatorado para uma arquitetura **client-server pura** com banco de dados compartilhado em rede (Oracle). Arquivos locais `.xlsm` não são mais necessários.

### Arquivos a Serem Removidos

Os seguintes arquivos podem ser deletados com segurança:

1. **`Planning 2.0.xlsm`** (raiz do projeto)
   - Arquivo local não mais lido pela aplicação
   - Recomendação: Remover via `git rm Planning\ 2.0.xlsm`

2. **`portal/public/Planning 2.0.xlsm`** (pasta public)
   - Arquivo local não mais servido pela aplicação
   - Recomendação: Remover via `git rm portal/public/Planning\ 2.0.xlsm`

### Scripts Deprecados (Mantidos para Referência)

Os seguintes scripts foram desativados, mas são mantidos como referência histórica:

1. **`portal/read_excel.js`**
   - Lê diretamente do arquivo .xlsm
   - Desativado: todos os dados agora vêm via API REST

2. **`portal/read_excel_params.js`**
   - Extrai parâmetros do arquivo .xlsm
   - Desativado: todos os dados agora vêm via API REST

### Dependências Removidas

- **`xlsx`** (v0.18.5)
  - Removida de `package.json`
  - Biblioteca não mais necessária
  - Execute `npm install` para atualizar `package-lock.json`

### Referências Atualizadas

- **`src/api.ts`**: Removida importação `import * as XLSX from 'xlsx'`
  - Helper `excelDateToDateString()` mantido para compatibilidade com datas retornadas pelo banco
  
- **`portal/docs/html/instalacao-planning-outra-maquina.html`**: Atualizado
  - Removida menção a permissão de leitura do arquivo .xlsm
  - Agora menciona que todos os dados vêm da base compartilhada
  - Mantido como documentação de referência

- **`INSTALACAO.html`** (novo): Criado
  - Documentação completa em HTML para instalação em nova máquina
  - Explica arquitetura client-server
  - Localizado na raiz do projeto

## Arquitetura Nova

### Componentes Ativos

- **Frontend**: React 19 + Vite em `localhost:5173`
- **Backend API**: Express 5 em `localhost:5000`
- **Banco de Dados**: Oracle compartilhado em `10.129.181.131:1521`
- **Autenticação**: Credenciais padrão em `server.js` (ORACLE_CONFIG)
- **Conectividade**: Detecção automática de VPN na faixa 10.108.110.x

### Nenhuma Dependência Local

- ❌ Não há arquivo .xlsm
- ❌ Não há arquivo de configuração JSON local
- ✅ Tudo vem via API REST do backend
- ✅ Backend conecta ao Oracle compartilhado

## Próximos Passos

1. Executar `npm install` para remover xlsx do `node_modules`
2. (Opcional) Remover arquivos .xlsm via git:
   ```
   git rm "Planning 2.0.xlsm"
   git rm "portal/public/Planning 2.0.xlsm"
   git commit -m "Remove local .xlsm files - migrate to shared Oracle database"
   ```
3. Validar que `npm run server` conecta ao Oracle
4. Testar `npm run dev` e verificar carregamento de dados via API

## Compatibilidade

- Node.js 22 LTS (recomendado)
- npm 10+
- Oracle 11g+ (compatível)

---
**Data de Atualização**: 2026-06-17  
**Versão**: 2.0+  
**Status**: Refatoração Completa
