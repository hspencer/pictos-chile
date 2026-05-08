// vite.config.js
//
// Configuración de Vite para la presentación reveal.js.
// Se utiliza en desarrollo (npm run dev), build (npm run build) y preview
// (npm run preview).
//
// Notas:
// - base '/pictos-chile/': prefijo de URL bajo el cual la app se sirve,
//   tanto en GitHub Pages como en el servidor de desarrollo. Hay que
//   visitar http://localhost:5173/pictos-chile/ y no la raíz.
// - alias '@reveal': permite importar SCSS desde la carpeta de estilos
//   de reveal.js sin escribir la ruta completa a node_modules.
// - css.preprocessorOptions.scss.silenceDeprecations: silencia las
//   advertencias de Sass que provienen del propio reveal.js (no son
//   accionables desde nuestro código). Las advertencias en custom.scss
//   sí se corrigen migrando al API moderno (sass:list, sass:color).

import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/pictos-chile/',
  resolve: {
    alias: {
      '@reveal': path.resolve(__dirname, 'node_modules/reveal.js/src/css')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 'import': @import legacy en reveal.scss y print/*.scss
        // 'global-builtin': floor() en reveal.scss
        silenceDeprecations: ['import', 'global-builtin']
      }
    }
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true
  }
});
