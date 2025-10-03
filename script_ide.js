// ========= Estado global =========
let pyodide;
let isLoading = true;
let editor; // Editor CodeMirror

// Estado de ejecución (expuesto globalmente)
window.pythonExecutionSuccess = false;
window.pythonExecutionError = null;

// ========= Utilidad: avisos al padre =========
function notifyParent(data) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ source: 'IDE', ...data }, window.location.origin);
    }
  } catch (e) {
    console.warn('postMessage falló:', e);
  }
}

// ========= UI mínima =========
function setStatus(text, cls) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = text;
  el.className = `status-top ${cls || ''}`.trim();
}

function appendOutput(text, isErr = false) {
  const out = document.getElementById("output");
  if (!out) return;
  out.textContent += (isErr ? "❌ " : "") + text;
  out.scrollTop = out.scrollHeight;
}

function clearOutputToDefault() {
  const out = document.getElementById("output");
  if (!out) return;
  out.textContent = "Python 3.10 | Pyodide\nEjecuta tu código para ver la salida...";
}

// ========= Canvas Turtle opcional (no bloqueante) =========
function showTurtleCanvas() {
  try {
    let overlay = document.getElementById("turtle-overlay");
    let container = document.getElementById("turtle-container");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "turtle-overlay";
      Object.assign(overlay.style, {
        position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
        backgroundColor: "rgba(0,0,0,.5)", zIndex: "9998", display: "none"
      });
      document.body.appendChild(overlay);
    }

    if (!container) {
      container = document.createElement("div");
      container.id = "turtle-container";
      Object.assign(container.style, {
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: "9999", background: "#fff", border: "2px solid #333",
        borderRadius: "8px", boxShadow: "0 10px 40px rgba(0,0,0,.5)", padding: "10px",
        display: "none"
      });

      const header = document.createElement("div");
      Object.assign(header.style, { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" });
      const title = document.createElement("span");
      title.textContent = "Canvas Turtle 🐢";
      title.style.fontWeight = "bold";
      const btn = document.createElement("button");
      btn.textContent = "Cerrar ✖";
      Object.assign(btn.style, { padding: "6px 12px", border: "none", borderRadius: "4px", background: "#e74c3c", color: "#fff", cursor: "pointer" });
      btn.onclick = () => { overlay.style.display = "none"; container.style.display = "none"; };

      const canvas = document.createElement("canvas");
      canvas.id = "turtle-canvas";
      canvas.width = 800; canvas.height = 600;
      canvas.style.border = "1px solid #ccc";
      canvas.style.background = "#fff";

      header.appendChild(title); header.appendChild(btn);
      container.appendChild(header); container.appendChild(canvas);
      document.body.appendChild(container);
    }

    const canvas = document.getElementById("turtle-canvas");
    if (canvas) {
      overlay.style.display = "block";
      container.style.display = "block";
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      return true;
    }
  } catch (e) {
    console.warn("Turtle overlay falló:", e);
  }
  return false;
}
window.showTurtleCanvas = showTurtleCanvas;
window.closeTurtleCanvas = function () {
  const o = document.getElementById("turtle-overlay");
  const c = document.getElementById("turtle-container");
  if (o) o.style.display = "none";
  if (c) c.style.display = "none";
};

// ========= Input =========
let inputResolver = null;

function requestInput(promptText) {
  const section = document.getElementById("input-section");
  const promptEl = document.getElementById("input-prompt");
  const field = document.getElementById("input-field");
  if (section && promptEl && field) {
    return new Promise((resolve) => {
      inputResolver = resolve;
      promptEl.textContent = promptText || "";
      field.value = "";
      section.classList.remove("input-hidden");
      field.focus();
    });
  }
  return Promise.resolve(window.prompt(promptText || "") ?? "");
}

function submitInput() {
  const section = document.getElementById("input-section");
  const field = document.getElementById("input-field");
  if (inputResolver) {
    const val = field ? field.value : "";
    inputResolver(val);
    inputResolver = null;
    if (section) section.classList.add("input-hidden");
  }
}
{
  const btn = document.getElementById("submit-input");
  if (btn) btn.addEventListener("click", submitInput);
  document.addEventListener("keypress", (e) => {
    if (e.target && e.target.id === "input-field" && e.key === "Enter") submitInput();
  });
}

// ========= Exponer estado a otros =========
window.getPythonExecutionStatus = function () {
  return { success: window.pythonExecutionSuccess, error: window.pythonExecutionError, isLoading };
};
window.resetExecutionStatus = function () {
  window.pythonExecutionSuccess = false;
  window.pythonExecutionError = null;
};

// Código por defecto y carga desde URL
// const DEFAULT_CODE = `# Mi primer programa en Python\nprint("Hola, mundo!")`; // Eliminar esta línea

function cargarCodigoDesdeURL() {
  const textarea = document.getElementById("code-editor");
  if (!textarea) return;

  const p = new URLSearchParams(window.location.search);
  const codigoParam = p.get("codigo");
  
  // Usa el contenido del HTML como valor de respaldo (textarea.value)
  const codigoDefault = textarea.value.trim(); 

  const smartDecode = (s) => {
    // ... (mantiene la lógica de decodificación) ...
    return s;
  };

  // Si hay parámetro, usa el decodificado; si no, usa el valor que está en el HTML
  const codigo = codigoParam ? (smartDecode(codigoParam) || codigoDefault) : codigoDefault; 
  
  textarea.value = codigo;
  
  // Si CodeMirror ya está inicializado, actualizar su valor
  if (editor) {
    editor.setValue(codigo);
  }
}
// ========= Inicializar CodeMirror =========
function inicializarEditor() {
  const textarea = document.getElementById("code-editor");
  if (!textarea || typeof CodeMirror === 'undefined') return;

  try {
    editor = CodeMirror.fromTextArea(textarea, {
      mode: "python",
      theme: "monokai",
      lineNumbers: true,
      indentUnit: 4,
      indentWithTabs: false,
      lineWrapping: true,
      autoCloseBrackets: true,
      matchBrackets: true
    });

    // Sincronizar con el textarea original
    editor.on('change', function() {
      textarea.value = editor.getValue();
    });

    // Cargar código desde URL si existe
    const codigo = textarea.value;
    if (codigo) {
      editor.setValue(codigo);
    }
  } catch (e) {
    console.warn('CodeMirror no se pudo inicializar:', e);
  }
}

// ========= Inicialización de Pyodide =========
async function inicializarPyodide() {
  const output = document.getElementById("output");
  try {
    setStatus("Cargando Python...", "loading");

    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
    s.crossOrigin = "anonymous";
    await new Promise((res, rej) => { s.onload = res; s.onerror = rej; document.head.appendChild(s); });

// CÓDIGO CORREGIDO DENTRO DE inicializarPyodide (Salto de línea garantizado)
pyodide = await loadPyodide({
  stdout: (text) => {
    const out = document.getElementById("output");
    if (out) {
      // Normaliza los saltos de línea de Windows (\r\n) a Unix (\n)
      const cleanText = text.replace(/\r\n/g, "\n");
      
      // Anexa el texto. Si el texto no termina con un salto de línea, Pyodide 
      // lo pone en la misma línea, pero si el texto ya contiene varios \n
      // el 'pre-wrap' CSS debería manejarlo.
      out.textContent += cleanText; 
      out.scrollTop = out.scrollHeight;
    }
  },
  stderr: (text) => {
    const out = document.getElementById("output");
    if (out) {
      const cleanText = text.replace(/\r\n/g, "\n");
      // Muestra el error y asegura el salto de línea al final
      out.textContent += "❌ " + cleanText;
      out.scrollTop = out.scrollHeight;
    }
  }
});

    // Input simple
    await pyodide.runPythonAsync(`
import builtins
def input(prompt=""):
    from js import window
    resp = window.prompt(str(prompt))
    return "" if resp is None else str(resp)
builtins.input = input
    `);

    // Mini turtle
    await pyodide.runPythonAsync(`
import math

class MiniTurtle:
    def __init__(self, canvas_id="turtle-canvas"):
        self.canvas_id = canvas_id
        self.pen_down = True
        self.angle = 0.0
        self.x = 400
        self.y = 300
        self.color = "#000000"
        self.linewidth = 2
        self._ctx = None

    @property
    def ctx(self):
        if self._ctx is None:
            if not self._ensure_canvas():
                raise RuntimeError("Canvas no disponible")
        return self._ctx

    def _ensure_canvas(self):
        try:
            from js import document, window
            container = document.getElementById("turtle-container")
            if not container or container.style.display == "none":
                ok = window.showTurtleCanvas()
                if not ok:
                    return False
            canvas = document.getElementById(self.canvas_id)
            if canvas is not None:
                self._ctx = canvas.getContext("2d")
                return True
            else:
                return False
        except Exception:
            return False

    def forward(self, distance):
        if not self._ensure_canvas():
            return
        rad = math.radians(self.angle)
        nx = self.x + distance * math.cos(rad)
        ny = self.y + distance * math.sin(rad)
        if self.pen_down:
            self.ctx.beginPath()
            self.ctx.moveTo(self.x, self.y)
            self.ctx.lineTo(nx, ny)
            self.ctx.stroke()
        self.x, self.y = nx, ny

    def backward(self, distance): self.forward(-distance)
    def right(self, angle): self.angle += angle
    def left(self, angle): self.angle -= angle
    def penup(self): self.pen_down = False
    def pendown(self): self.pen_down = True
    def color_(self, color): self.color = color; self.ctx.strokeStyle = color
    def width_(self, w): self.linewidth = w; self.ctx.lineWidth = w

turtle = MiniTurtle()
    `);

    setStatus("✅ Python listo", "ready");
    isLoading = false;
    notifyParent({ type: "ide:ready", ready: true, ts: Date.now() });

    const p = new URLSearchParams(location.search);
    if (p.get("codigo")) {
      if (output) output.textContent = "🔎 Código embebido cargado. ¡Presiona ▶️ Ejecutar!";
    } else {
      clearOutputToDefault();
    }
  } catch (err) {
    if (output) output.textContent = `❌ Error al cargar Python: ${err && err.message ? err.message : err}`;
    setStatus("❌ Error al cargar", "error");
    notifyParent({ type: "ide:error", message: String(err), ts: Date.now() });
  }
}

// ========= Ejecución =========
async function ejecutarCodigo() {
  if (isLoading) { alert("Python aún se está cargando. Espera…"); return; }

  const runBtn = document.getElementById("run-btn");
  // Obtener código desde CodeMirror si existe, sino del textarea
  const code = editor ? editor.getValue() : document.getElementById("code-editor").value;

  notifyParent({ type: "run:start", ts: Date.now() });
  window.pythonExecutionSuccess = false;
  window.pythonExecutionError = null;

  if (runBtn) { runBtn.disabled = true; runBtn.textContent = "⏳ Ejecutando..."; }
  const out = document.getElementById("output");
  if (out) out.textContent = "";

  try {
    if (/turtle\./.test(code)) showTurtleCanvas();

    // NO reconfigurar stdout - ya está configurado
    await pyodide.runPythonAsync(code);

    window.pythonExecutionSuccess = true;

    const txt = out ? out.textContent.trim() : "";
    if (!txt) {
      if (out) out.textContent = "✅ Código ejecutado sin salida en consola.\n";
    }

  } catch (err) {
    window.pythonExecutionError = err && err.message ? err.message : String(err);
    const msg = `\n❌ Error: ${window.pythonExecutionError}\n`;
    if (out) out.textContent += msg;
    console.error("Error completo:", err);
  } finally {
    if (runBtn) { runBtn.disabled = false; runBtn.textContent = "▶️ Ejecutar"; }
    window.dispatchEvent(new CustomEvent("pythonExecutionComplete", {
      detail: { success: window.pythonExecutionSuccess, error: window.pythonExecutionError }
    }));
    notifyParent({
      type: "run:complete",
      success: window.pythonExecutionSuccess,
      error: window.pythonExecutionError,
      ts: Date.now()
    });
  }
}

// ========= Acciones de UI =========
function limpiarEditor() {
  if (editor) {
    editor.setValue("");
  } else {
    const ed = document.getElementById("code-editor");
    if (ed) ed.value = "";
  }
  clearOutputToDefault();
  window.closeTurtleCanvas();
}

function copiarURLEmbebido() {
  try {
    const codigo = editor ? editor.getValue() : document.getElementById("code-editor").value;
    const cod = btoa(encodeURIComponent(codigo));
    const base = window.location.origin + window.location.pathname;
    const url = `${base}?codigo=${cod}`;

    if (url.length > 2000) {
      alert("⚠️ URL muy larga (≈>2000 chars). Considera un gist/paste.");
      return;
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => alert("🔗 URL copiada:\n\n" + url))
      .catch((e) => { console.warn("Clipboard falló:", e); prompt("Copiá la URL:", url); });
    } else {
      prompt("Copiá la URL:", url);
    }
  } catch (e) {
    console.error("Error generando URL:", e);
    alert("Error generando URL. Ver consola.");
  }
}

window.ejecutarCodigo = ejecutarCodigo;

// ========= Listeners =========
{
  const run = document.getElementById("run-btn");
  if (run) run.addEventListener("click", ejecutarCodigo);

  const copy = document.getElementById("copy-url-btn");
  if (copy) copy.addEventListener("click", copiarURLEmbebido);

  const clear = document.getElementById("clear-btn");
  if (clear) clear.addEventListener("click", limpiarEditor);
}

// ========= Bootstrap =========
document.addEventListener("DOMContentLoaded", () => {
  try {
    cargarCodigoDesdeURL();
    // Esperar un poco para que CodeMirror cargue antes de inicializarlo
    setTimeout(inicializarEditor, 100);
  } catch (e) {
    console.warn("cargarCodigoDesdeURL falló:", e);
    const ed = document.getElementById("code-editor");
    if (ed) ed.value = DEFAULT_CODE;
  }
  inicializarPyodide();
});
