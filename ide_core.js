/* ide_core.js - IDE Pyodide básico con CodeMirror, soporte input y eventos postMessage */

/* =========================
   Utilidades generales
========================= */
function $(id) {
  return document.getElementById(id);
}

function appendOutput(text) {
  const out = $("output");
  if (!out) return;
  const pre = document.createElement("pre");
  pre.textContent = text;
  out.appendChild(pre);
  out.scrollTop = out.scrollHeight;
}

function clearOutput() {
  const out = $("output");
  if (out) out.innerHTML = "";
}

function setStatus(msg, cls) {
  const s = $("status");
  if (!s) return;
  s.textContent = msg;
  s.classList.remove("loading", "ready", "error");
  if (cls) s.classList.add(cls);
}

/* =========================
   postMessage al padre
========================= */
function sendParent(eventType, payload = {}) {
  try {
    window.parent?.postMessage(
      { source: "py-ide", type: eventType, ...payload },
      "*"
    );
  } catch (_) {}
}

// Identificador opcional del ejercicio embebido (si viene en la URL)
const urlParams = new URLSearchParams(location.search);
const EMBED_EXERCISE_ID = urlParams.get("exerciseId") || null;

/* =========================
   Editor (CodeMirror fallback a textarea)
========================= */
let editor = null;

function initEditor() {
  const textarea = $("code-editor");
  if (!textarea) return;

  // Si CodeMirror está disponible, lo usamos
  if (window.CodeMirror) {
    editor = CodeMirror.fromTextArea(textarea, {
      mode: "python",
      theme: "default",
      lineNumbers: true,
      indentUnit: 4,
      tabSize: 4,
      lineWrapping: true,
      viewportMargin: Infinity,
    });
  } else {
    // Fallback: usamos el textarea directamente
    editor = {
      getValue: () => textarea.value,
      setValue: (v) => (textarea.value = v),
      focus: () => textarea.focus(),
    };
  }
}

/* =========================
   Entrada interactiva (input)
========================= */
let waitingForInput = null;

function setupInputBridge(pyodide) {
  // Implementamos input() redirigido a UI de la página
  pyodide.registerJsModule("jsbridge", {
    input: async (promptText) => {
      return await getUserInput(promptText || "");
    },
    print: (text) => {
      appendOutput(String(text ?? ""));
    },
  });

  const pyInputShim = `
import sys
from jsbridge import input as __js_input, print as __js_print

def __py_input(prompt=""):
    return __js_input(prompt)

# Reemplazar builtins.input por nuestro puente
__builtins__.input = __py_input
`;
  return pyInputShim;
}

function getUserInput(promptText) {
  return new Promise((resolve) => {
    const inputSection = $("input-section");
    const promptEl = $("input-prompt");
    const field = $("input-field");
    const btn = $("submit-input");

    if (!inputSection || !promptEl || !field || !btn) {
      // Si no hay UI de input, pedimos con prompt() nativo
      const val = window.prompt(promptText || "Entrada:");
      resolve(val ?? "");
      return;
    }

    promptEl.textContent = promptText || "Entrada:";
    field.value = "";
    inputSection.style.display = "flex";
    field.focus();

    const submit = () => {
      const v = field.value;
      cleanup();
      resolve(v);
    };
    const onKey = (e) => {
      if (e.key === "Enter") submit();
    };
    const cleanup = () => {
      inputSection.style.display = "none";
      btn.removeEventListener("click", submit);
      field.removeEventListener("keydown", onKey);
      waitingForInput = null;
    };

    waitingForInput = { submit };
    btn.addEventListener("click", submit);
    field.addEventListener("keydown", onKey);
  });
}

/* =========================
   Carga de Pyodide
========================= */
let pyodide = null;

async function loadPython() {
  try {
    setStatus("Cargando Python...", "loading");

    // Cargar script de Pyodide dinámicamente
    await new Promise((resolve, reject) => {
      if (window.loadPyodide) return resolve();
      const s = document.createElement("script");
      // Podés cambiar CDN si tu red bloquea alguno:
      // jsDelivr:
      // s.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
      // CDN alternativo oficial:
      s.src = "https://pyodide-cdn2.iodide.io/v0.24.1/full/pyodide.js";
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("No se pudo cargar pyodide.js"));
      document.head.appendChild(s);
    });

    pyodide = await loadPyodide({
      indexURL: "https://pyodide-cdn2.iodide.io/v0.24.1/full/",
    });

    // Puente de input/print
    const shim = setupInputBridge(pyodide);
    await pyodide.runPythonAsync(shim);

    setStatus("Python 3.11 | Pyodide listo", "ready");
    sendParent("ide_ready", { exerciseId: EMBED_EXERCISE_ID });
  } catch (err) {
    console.error(err);
    setStatus("Error cargando Pyodide", "error");
    appendOutput(String(err));
  }
}

/* =========================
   Ejecución de código
========================= */
async function ejecutarCodigo() {
  clearOutput();
  sendParent("run_started", { exerciseId: EMBED_EXERCISE_ID });

  const code = editor ? editor.getValue() : ($("code-editor")?.value || "");
  if (!code) {
    appendOutput("No hay código para ejecutar.");
    return;
  }

  try {
    // Redirigir stdout y stderr hacia appendOutput
    const wrapper = `
import sys, io
from jsbridge import print as __js_print

__stdout = io.StringIO()
__stderr = io.StringIO()

class _W:
    def write(self, s):
        __js_print(s)

sys.stdout = _W()
sys.stderr = _W()

# === Código del usuario ===
${code}
`;
    await pyodide.runPythonAsync(wrapper);

    sendParent("run_success", { exerciseId: EMBED_EXERCISE_ID });
  } catch (err) {
    appendOutput(String(err));
    sendParent("run_error", {
      exerciseId: EMBED_EXERCISE_ID,
      message: err && err.message ? err.message : String(err),
    });
  } finally {
    // Restaurar UI input si quedó abierta
    if (waitingForInput && typeof waitingForInput.submit === "function") {
      // no forzamos submit; solo nos aseguramos de que no quede colgada
    }
  }
}

/* =========================
   Embebido: generar URL con código
========================= */
function getEmbedURL() {
  // Compactar el código con LZString si está disponible
  const base = location.origin + location.pathname; // URL de esta página
  const code = editor ? editor.getValue() : ($("code-editor")?.value || "");
  let query = "";

  if (typeof LZString !== "undefined" && code) {
    const compressed = LZString.compressToEncodedURIComponent(code);
    query = `?code=${compressed}`;
  } else if (code) {
    // Fallback (sin comprimir; largo)
    query = `?code_raw=${encodeURIComponent(code)}`;
  }

  // Preservar exerciseId si lo hay
  const extra = EMBED_EXERCISE_ID
    ? (query ? "&" : "?") + `exerciseId=${encodeURIComponent(EMBED_EXERCISE_ID)}`
    : "";

  return base + query + extra;
}

function copiarEmbed() {
  const url = getEmbedURL();
  navigator.clipboard
    .writeText(url)
    .then(() => alert("URL copiada al portapapeles"))
    .catch(() => alert("No se pudo copiar. Copia manualmente:\n" + url));
}

/* =========================
   Botones y arranque
========================= */
function wireUI() {
  $("run-btn")?.addEventListener("click", ejecutarCodigo);
  $("clear-btn")?.addEventListener("click", clearOutput);
  $("embed-btn")?.addEventListener("click", copiarEmbed);
}

document.addEventListener("DOMContentLoaded", () => {
  initEditor();
  wireUI();
  loadPython().then(() => {
    console.log("✅ IDE listo");
  });
});
