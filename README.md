# IDE Básico de Python (Pyodide) — README

> “Si compila, navegamos. Si corre, ¡abordamos!” 🏴‍☠️

Este proyecto provee un IDE mínimo de **Python en el navegador** usando **Pyodide**.  
Incluye:
- Consola de salida y estado.
- Carga de código por `?codigo=...` (para embeber ejemplos).
- Señales al “padre” (la página que embebe) vía `postMessage` para saber si el IDE está listo, si empezó a ejecutar y si terminó OK o con error.
- (Opcional) Turtle minimal con un `<canvas>` emergente.
- Plantilla de “página padre” para **varios** ejemplos con **Resumen + Watchdog + Auto-resize**.

---

## 📁 Estructura mínima

```
ide_basico_python/
├─ index.html          # El IDE (o tu archivo principal del IDE)
├─ script.js           # Lógica del IDE (Pyodide + consola + postMessage)
├─ PadreAuto.html      # (opcional) Página "padre" con múltiples iframes
└─ ... (estilos/recursos opcionales)
```

> Si el **padre** que embebe está en la **misma carpeta/sitio** que el IDE, podés usar rutas relativas `./?codigo=...` y evitar problemas de seguridad (mismo origen).

---

## 🧩 Requisitos del DOM del IDE

Para que `script.js` funcione correctamente, tu HTML del IDE debe incluir:

- `#code-editor` → `<textarea>` (o contenedor editable) con el código.
- `#output` → `<pre>` o `<div>` donde se imprime la salida.
- `#status` → `<div>` para “Cargando / Listo / Error”.
- (opcionales) Botones con IDs: `run-btn`, `copy-url-btn`, `clear-btn`.
- (opcionales) UI de input con: `#input-section`, `#input-prompt`, `#input-field`, `#submit-input`.

El IDE envía eventos al padre con `postMessage`:
- `ide:ready`
- `run:start`
- `run:complete` `{ success: Boolean, error: String|null }`
- `ide:error`

---

## 🚀 Probar el IDE solo

Abrí `index.html` (o el que uses como IDE) mediante GitHub Pages o un servidor local en HTTPS.  
Deberías ver en `#status`: **“✅ Python listo”** al finalizar la carga de Pyodide.

---

## 🔗 Embebido simple (un ejemplo)

En una página **en la misma carpeta** del IDE:

```html
<iframe
  class="frame"
  src="./?codigo=CODIGO_ENCODEADO_AQUI"
  allow="clipboard-read; clipboard-write; fullscreen"
  loading="lazy"
  style="width:100%; height:560px; border:0; border-radius:10px;"
></iframe>
```

### ¿De dónde saco `?codigo=`?

1. **Desde el propio IDE**: usa el botón **“Copiar URL embebida”** y toma el valor posterior a `?codigo=`.
2. **Manual (en tu página)**:
   ```html
   <script>
     // Igual que el IDE: base64 de encodeURIComponent
     const encodeCode = (txt) => btoa(encodeURIComponent(txt));
     const url = `./?codigo=${encodeCode('print("Hola, IDE!")')}`;
   </script>
   ```

> El IDE acepta `codigo` **URI-encoded** o **base64 de URI-encoded** (decodificación robusta).

---

## 🧰 Página padre con múltiples ejemplos  
**Resumen + Watchdog + Auto-resize** (sin scroll vertical del iframe)

Usá la plantilla `PadreAuto.html` (incluida). Solo editás un **array** `EJEMPLOS` con objetos `{ title, code }`.  
La página genera **N iframes** que:
- muestran **estado** (listo/ejecutando/OK/error),
- calculan un **resumen de salida**,
- incluyen **watchdog** (timeout por ejecución),
- **ajustan** automáticamente su **altura** (sin scroll del iframe).

### Extracto clave (cómo configurar)

```html
<script>
  // Tiempo máx. antes de marcar timeout
  const TIMEOUT_MS = 15000;

  // 1) Tus ejemplos aquí:
  const EJEMPLOS = [
    { title: 'Hola mundo', code: `print("Hola, mundo!")` },
    { title: 'Error intencional', code: `1/0` },
    // ...
  ];

  // 2) Codificador compatible con el IDE:
  const encodeCode = (txt) => btoa(encodeURIComponent(txt));

  // 3) Construcción automática
  EJEMPLOS.forEach((ej, idx) => {
    const id  = `ej${idx+1}`;
    const src = `./?codigo=${encodeCode(ej.code)}&id=${encodeURIComponent(id)}`;
    createEmbed({ title: ej.title, src });   // función ya definida en la plantilla
  });
</script>
```

> **Para cambiar los códigos**: editá el array `EJEMPLOS`, guardá y listo.  
> **Para agregar más**: sumá nuevos objetos `{ title, code }` en el array.

---

## ▶️ Autorun (opcional)

Si querés que un iframe **se ejecute solo** al recibir `ide:ready`, podés, por ejemplo, hacerlo **solo para el primero**:

```html
<script>
  window.addEventListener('message', (ev) => {
    if (ev.origin !== location.origin) return;
    const d = ev.data || {};
    if (d.source !== 'IDE') return;

    if (d.type === 'ide:ready') {
      const frame0 = document.querySelectorAll('iframe.frame')[0];
      if (frame0 && ev.source === frame0.contentWindow) {
        frame0.contentWindow.ejecutarCodigo(); // dispara ▶️
      }
    }
  });
</script>
```

También podés marcar ejemplos con `autorun: true` en el array y decidirlo por índice/propiedad.

---

## 🛰️ API de eventos (padre ↔️ iframe)

El **iframe del IDE** envía eventos al **padre** con `postMessage`:

```js
window.addEventListener('message', (ev) => {
  if (ev.origin !== location.origin) return;  // seguridad: mismo origen
  const data = ev.data || {};
  if (data.source !== 'IDE') return;

  if (data.type === 'ide:ready')   { /* IDE listo */ }
  if (data.type === 'run:start')   { /* empezó ejecución */ }
  if (data.type === 'run:complete') {
    // data.success (bool), data.error (string|null)
  }
  if (data.type === 'ide:error')   { /* error inicializando Pyodide */ }
});
```

> Recomendación: mantené el chequeo `ev.origin === location.origin` para seguridad.

---

## 📏 Auto-resize del iframe

La plantilla del padre incluye un `autoResizeIframe(...)` que:
- Mide el contenido interno del iframe (mismo origen).
- Ajusta dinámicamente `style.height` para **evitar scroll del iframe**.
- Reacciona a cambios de contenido (con `ResizeObserver` / fallback).

Si alguna vez embebés **desde otro dominio**, no se podrá medir. En ese caso, se puede implementar un `postMessage('ide:resize', {height:...})` desde el hijo (no incluido por defecto).

---

## 🧯 Troubleshooting

- **Iframe en blanco**  
  Usá **mismo origen** (`./?codigo=...`). Asegurate de que **el IDE carga por HTTPS**.  
  Revisá consola del navegador por errores de red o CORS.

- **No ejecuta solo**  
  El padre solo detecta `run:start`/`run:complete` **cuando apretás ▶️** en el IDE (o si activás **autorun**).

- **Pyodide no carga**  
  Puede ser red/CDN o extensiones del navegador. Probá en incógnito.  
  `script.js` usa `https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js` con logs.

- **La altura no alcanza / aparece scroll**  
  El **auto-resize** ya está en la plantilla. Si igual no alcanza:
  - subí `max` (p. ej. `max: 3000`) o
  - agregá `pad: 20` para margen.

- **URL con `?codigo=` demasiado larga**  
  Navegadores limitan el tamaño de URL (≈2k–8k). Para **snippets largos**:
  - Guardá el `.py` en el repo y (si te interesa) agregamos soporte `?file=ruta/ej.py` para que el IDE lo cargue por `fetch` (mismo origen).
  - O pegá el código dentro del IDE al abrir, sin usar `?codigo=`.

- **Cache en GitHub Pages**  
  Si cambiás `script.js` y no lo ves, agregá versión: `script.js?v=2`.

---

## 🧠 Notas técnicas

- `input()` está redefinido usando `window.prompt` (simple y compatible).  
  Si preferís una UI propia de input, ya hay helpers en `script.js` (`requestInput(...)`) y elementos opcionales en el DOM.
- Salida redirigida: `sys.stdout` / `sys.stderr` a `#output` y a `console.log/error` (útil para debug).
- **Turtle minimal**: si el código detecta `turtle.`, intenta mostrar un `<canvas>` emergente con botones (no bloquea si no existe).

---

## 📝 Licencia / Créditos

**IDE-BASICO-PYTHON** © 2025 por [Prof. Elizabeth Izquierdo](https://creativecommons.org) está licenciado bajo [Creative Commons Atribución-NoComercial-CompartirIgual 4.0 Internacional](https://creativecommons.org/licenses/by-nc-sa/4.0/).  
[![CC](https://mirrors.creativecommons.org/presskit/icons/cc.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![BY](https://mirrors.creativecommons.org/presskit/icons/by.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![NC](https://mirrors.creativecommons.org/presskit/icons/nc.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![SA](https://mirrors.creativecommons.org/presskit/icons/sa.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## 📎 Snippets útiles

**Codificar código a `?codigo=...`:**
```js
const encodeCode = (txt) => btoa(encodeURIComponent(txt));
const src = `./?codigo=${encodeCode('print("Hola!")')}`;
```

**Resumen de salida del iframe (mismo origen):**
```js
function snapshotSalida(iframe, lines = 12) {
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  const out = doc && doc.getElementById('output');
  return out ? (out.textContent || '').split('\n').slice(-lines).join('\n') : '';
}
```

**Watchdog simple por ejecución:**
```js
let timer = null;
window.addEventListener('message', (ev) => {
  if (ev.origin !== location.origin) return;
  const d = ev.data || {};
  if (d.source !== 'IDE') return;

  if (d.type === 'run:start') {
    clearTimeout(timer);
    timer = setTimeout(() => alert('⏱️ Se pasó de tiempo (¿bucle infinito?)'), 15000);
  }
  if (d.type === 'run:complete' || d.type === 'ide:error') {
    clearTimeout(timer);
  }
});
```
