# PICTOS.net: De la intención comunicativa al pictograma accesible

Presentación reveal.js sobre PICTOS.net, un sistema pictográfico generativo para accesibilidad cognitiva. Orientada a fonoaudiólogos interesados en autismo y enfoque de derechos. Duración: 20 minutos, 26 diapositivas.

Herbert Spencer González (hspencer@ead.cl)
Pontificia Universidad Católica de Valparaíso / AUT University


## Ver en línea

[herbertspencer.net/pictos-chile](https://herbertspencer.net/pictos-chile)


## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173/pictos-chile/ en el navegador.


## Build para GitHub Pages

```bash
npm run build
```

Genera la carpeta `docs/`.


## Estructura del repositorio

```
index.html              Diapositivas reveal.js
main.js                 Inicialización Reveal + plugins + p5
presentacion.md         Guión completo con notas y distribución temporal
css/custom.scss         Estilos (Lexend + EB Garamond, paleta púrpura/naranja/salvia)
vite.config.js          Configuración Vite (base path, output a docs/)
public/
  images/               Fotografías y bitmaps (8 archivos)
  svg/                  Diagramas vectoriales (17 archivos)
  p5/sketches.js        Visualización interactiva del pipeline
  svg-sync.js           Sincronización código SVG ↔ pictograma renderizado
docs/                   Build de producción (GitHub Pages)
```


## Stack

Vite 7 + reveal.js 5.2 + SCSS (sass 1.91) + p5.js 2.0.4. Tipografía: Lexend (sans) + EB Garamond (serif).


## Controles de la presentación

| Tecla | Acción |
|-------|--------|
| Flechas | Navegar |
| `S` | Notas del presentador |
| `O` | Vista general |
| `F` | Pantalla completa |


## Proyectos relacionados

| Repositorio | Descripción |
|---|---|
| [pictos-net](https://github.com/hspencer/pictos-net) | Motor generativo texto → SVG |
| [ICAP](https://github.com/mediafranca/ICAP) | Evaluación de pictogramas ([demo](https://mediafranca.github.io/ICAP/)) |
| [mf-svg-schema](https://github.com/mediafranca/mf-svg-schema) | Esquema SVG accesible |
| [nlu-schema](https://github.com/mediafranca/nlu-schema) | Esquema de análisis semántico |
| [manifesto](https://github.com/mediafranca/manifesto) | Principios de diseño MediaFranca |


## Licencia

Contenido: CC BY 4.0. Código: MIT.
