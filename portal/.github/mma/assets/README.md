# Assets — M3A Team Minsait Branding

**Purpose:** Shared assets (logos, fonts, icons) for Minsait-branded HTML documentation portals.  
**Visual identity:** Minsait — reference: `templates/html/portal/index.html`

## 📂 Estrutura

```
assets/
├── AF_MINSAIT_LOG_NEG.png      ← Logo horizontal — fundo ESCURO (headers/footers)
├── AF_MINSAIT_LOG_POS.png      ← Logo horizontal — fundo CLARO (+ filter grayscale no footer)
├── AF_MINSAIT_SIM_NEG.png      ← Símbolo M — fundo escuro
├── AF_MINSAIT_SIM_POS.png      ← Símbolo M — fundo claro / favicon
├── cores.pdf                   ← Especificação oficial de cores Minsait
├── fonts/
│   └── Web Fonts/
│       └── WOFF2/
│           ├── ForFutureSans-Light.woff2      (300)
│           ├── ForFutureSans-Regular.woff2    (400)
│           ├── ForFutureSans-Medium.woff2     (500)
│           ├── ForFutureSans-Bold.woff2       (700)
│           └── ForFutureSans-Black.woff2      (800)
└── Icons/                      ← Ícones corporativos Minsait
```

## 🎨 Paleta de Cores Correta

```css
:root {
  --minsait-pruno:          rgb(72, 14, 42);    /* vinho escuro — cor primária */
  --minsait-pruno-oscuro:   rgb(38,  7, 23);    /* vinho profundo — gradiente escuro */
  --minsait-fucsia:         rgb(255, 0, 84);    /* fúcsia — accent / destaques */
  --minsait-gris-ceramica:  rgb(227,226,218);   /* cinza cerâmica */
  --sidebar-width:          280px;
  --header-height:          60px;
}
```

> ⚠️ **A paleta antiga (`--minsait-primary: #00A9E0` azul) estava ERRADA e foi removida.**
> Os arquivos `css/`, `js/` e `images/` planejados anteriormente **não foram criados** — os HTMLs
> do portal usam CSS/JS inline alinhado ao `index.html`.

## 🚀 Como Usar

Nos HTMLs, referenciar diretamente (sem CSS externo):
- Logotipo escuro: `<img src="assets/AF_MINSAIT_LOG_NEG.png" style="height:32px;">`
- Favicon: `<link rel="icon" type="image/png" href="assets/AF_MINSAIT_SIM_POS.png">`
- Fontes: `@font-face` com `url('assets/fonts/Web Fonts/WOFF2/ForFutureSans-Regular.woff2')`

## ✅ Whitelist homologada para geração HTML

Somente estes assets podem ser aceitos pelo gerador de HTML:
- `AF_MINSAIT_LOG_NEG.png`
- `AF_MINSAIT_LOG_POS.png`
- `AF_MINSAIT_SIM_POS.png`
- `AF_MINSAIT_SIM_NEG.png`
- `fonts/Web Fonts/WOFF2/ForFutureSans-Light.woff2`
- `fonts/Web Fonts/WOFF2/ForFutureSans-Regular.woff2`
- `fonts/Web Fonts/WOFF2/ForFutureSans-Medium.woff2`
- `fonts/Web Fonts/WOFF2/ForFutureSans-Bold.woff2`
- `fonts/Web Fonts/WOFF2/ForFutureSans-Black.woff2`

Regras operacionais para o gerador:
- tentar primeiro o caminho canônico do tipo de HTML em geração;
- se falhar, varrer o projeto/workspace em busca de `assets/` com a whitelist completa;
- recalcular o caminho relativo final a partir do HTML gerado;
- se a whitelist homologada não existir, parar e pedir decisão humana;
- nunca improvisar logo textual, nunca usar `assets/logos/...`, nunca usar `assets/fonts/fonts.css`, nunca aceitar imagem arbitrária.

Guia completo: `.github/knowledge/minsait-html-identity.md`

---

**Status:** ✅ Identidade visual consolidada
**Última atualização:** 2 de abril de 2026

