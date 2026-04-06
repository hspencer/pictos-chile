# De la palabra a la imagen accesible

Presentacion reveal.js sobre PICTOS, un sistema pictografico generativo para accesibilidad cognitiva.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173/p-i/ en el navegador.

## Build para produccion

```bash
npm run build
```

Genera la carpeta `docs/` lista para GitHub Pages.

## Preview del build

```bash
npm run preview
```

## Estructura

```
index.html          Diapositivas (reveal.js)
main.js             Inicializacion de Reveal + plugins + ciclo p5
css/custom.scss     Estilos (Lexend + EB Garamond, paleta purpura/naranja/salvia)
public/
  images/           Imagenes recicladas de /cc + pictograma generado
  svg/              SVGs reciclados de /cc + diagramas de razonamiento escalonado
  p5/sketches.js    Visualizacion interactiva del pipeline (5 fases)
```

## Controles de la presentacion

- Flechas: navegar entre diapositivas
- `S`: abrir notas del presentador
- `O`: vista general (overview)
- `F`: pantalla completa
- `ESC`: salir de overview o pantalla completa

## Autor

Herbert Spencer Gonzalez (hspencer@ead.cl)
