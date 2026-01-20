# Design News - Design System Base

Este projeto entrega apenas a base do Design System:

- `styles/tokens.css`: cores, tipografia, spacing, radius, shadow e focus ring
- `styles/atoms.css`: Button, Input, Card, Badge, IconButton e Text/Heading

## Como usar

1) Inclua os tokens antes dos atomos:

```
<link rel="stylesheet" href="./styles/tokens.css" />
<link rel="stylesheet" href="./styles/atoms.css" />
```

2) Use as classes base:

- Texto: `text`, `text-sm`, `text-xs`
- Titulos: `heading-1`, `heading-2`, `heading-3`, `heading-4`
- Botao: `btn primary` ou `btn ghost`
- Input: `input` envolvendo `input` ou `textarea`
- Card: `card`
- Badge: `badge`
- IconButton: `icon-btn`
- Link: `link`

## Acessibilidade minima

- Focus visivel em botoes, inputs, icon buttons e links
- Estados hover e disabled definidos
- Contraste adequado entre texto e fundo nos componentes base
