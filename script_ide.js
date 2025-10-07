/* script_ide.js - IDE Pyodide + input async + turtle canvas (versión corregida final, Opción A: NO repoblar select) */

let pyodide = null;
let editor = null;
let isRunning = false;

/* Utilidades DOM */
const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const outputEl = $("output");
const inputSection = $("input-section");
const inputPromptEl = $("input-prompt");
const inputField = $("input-field");
const submitInputBtn = $("submit-input");
const selectPlantillas = $("plantillas-select");
const runBtn = $("run-btn");
const clearBtn = $("clear-btn");
const embedBtn = $("embed-btn");

/* Consola de salida: siempre agrega un salto de línea */
function printToOutput(text) {
  if (text == null) return;
  outputEl.textContent += String(text) + "\n";
  outputEl.scrollTop = outputEl.scrollHeight;
}

function clearOutput() {
  outputEl.textContent = "";
}

/* Editor: CodeMirror o textarea */
function initEditor() {
  const textarea = $("code-editor");
  if (window.CodeMirror) {
    editor = CodeMirror.fromTextArea(textarea, {
      mode: "python",
      theme: "monokai",
      lineNumbers: true,
      indentUnit: 4,
      tabSize: 4,
      lineWrapping: true,
    });
    editor.setSize("100%", "420px");
  } else {
    editor = null;
  }
}

function getUserCode() {
  if (editor) return editor.getValue();
  return $("code-editor").value;
}

function setUserCode(code) {
  if (editor) editor.setValue(code);
  else $("code-editor").value = code;
}

/* Plantillas */
function sanitizePlantillas() {
  if (!window.PLANTILLAS) return;
  const keys = ["Corazón", "corazon", "corazon_heart", "heart", "corazon_turtle"];
  for (const k of keys) {
    if (k in window.PLANTILLAS) delete window.PLANTILLAS[k];
  }
}

/* Opción A: NO repoblar el select para mantener los optgroups del HTML */
function repoblarSelectPlantillas() {
  // Intencionalmente vacío: usamos el <select> con <optgroup> definido en index_plantillas.html
}

function cargarPlantilla() {
  const key = selectPlantillas ? selectPlantillas.value : "";
  if (!key) return;
  const plantillas = window.PLANTILLAS || {};
  const code = plantillas[key];
  if (code) setUserCode(code);
}

/* Input async bridged al panel */
let pendingInputResolve = null;

function showInputPrompt(promptText) {
  inputPromptEl.textContent = promptText || "Introduce un valor:";
  inputField.value = "";
  inputSection.classList.remove("input-hidden");
  inputField.focus();
}

function hideInputPrompt() {
  inputSection.classList.add("input-hidden");
}

if (submitInputBtn) {
  submitInputBtn.addEventListener("click", () => {
    if (pendingInputResolve) {
      const value = inputField.value;
      const resolve = pendingInputResolve;
      pendingInputResolve = null;
      hideInputPrompt();
      resolve(value);
    }
  });
}

if (inputField) {
  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitInputBtn.click();
  });
}

/* Turtle Canvas: overlay */
let turtleOverlay = null;
let turtleCanvas = null;
let turtleCtx = null;

function ensureTurtleCanvas() {
  if (turtleOverlay) return;

  turtleOverlay = document.createElement("div");
  Object.assign(turtleOverlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "9999",
  });

  const panel = document.createElement("div");
  Object.assign(panel.style, {
    background: "#111",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "8px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
  });

  turtleCanvas = document.createElement("canvas");
  turtleCanvas.width = 640;
  turtleCanvas.height = 480;
  turtleCanvas.style.background = "#ffff";
  panel.appendChild(turtleCanvas);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Cerrar";
  Object.assign(closeBtn.style, {
    marginLeft: "8px",
    padding: "6px 10px",
    background: "#444",
    color: "#fff",
    border: "1px solid #666",
    borderRadius: "6px",
    cursor: "pointer",
  });
  closeBtn.addEventListener("click", () => {
    if (turtleOverlay) {
      document.body.removeChild(turtleOverlay);
      turtleOverlay = null;
      turtleCanvas = null;
      turtleCtx = null;
    }
  });

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.marginBottom = "6px";

  const title = document.createElement("span");
  title.textContent = "Canvas Turtle";
  title.style.color = "#ddd";
  title.style.fontFamily = "system-ui, sans-serif";
  header.appendChild(title);
  header.appendChild(closeBtn);

  const wrap = document.createElement("div");
  wrap.appendChild(header);
  wrap.appendChild(panel);

  turtleOverlay.appendChild(wrap);
  document.body.appendChild(turtleOverlay);
  turtleCtx = turtleCanvas.getContext("2d");
}

/* Carga Pyodide y configura entorno */
async function loadPython() {
  statusEl.textContent = "Cargando Python...";

  if (!window.loadPyodide) {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
    document.head.appendChild(s);
    await new Promise((res, rej) => {
      s.onload = res;
      s.onerror = () => rej(new Error("No se pudo cargar pyodide.js"));
    });
  }

  pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" });

  // Captura stdout/stderr directamente
  pyodide.setStdout({ batched: (s) => printToOutput(s) });
  pyodide.setStderr({ batched: (s) => printToOutput(s) });

  // Módulo puente JS
  const jsModule = {
    js_show_input: (promptText) => { showInputPrompt(promptText || "Introduce un valor:"); },
    js_wait_input: () => new Promise((resolve) => { pendingInputResolve = resolve; }),
    js_ensure_turtle_canvas: () => { ensureTurtleCanvas(); return true; },
    js_turtle_draw: (ops) => {
      if (!turtleCanvas || !turtleCtx) return;
      const ctx = turtleCtx;
      for (const op of ops) {
        const [cmd, ...args] = op;
        switch (cmd) {
          case "bg": {
            ctx.save();
            ctx.fillStyle = args[0] || "#ffff";
            ctx.fillRect(0, 0, turtleCanvas.width, turtleCanvas.height);
            ctx.restore();
            break;
          }
          case "line": {
            const [x1, y1, x2, y2, color, width] = args;
            ctx.save();
            ctx.strokeStyle = color || "#000";
            ctx.lineWidth = width || 1;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
            break;
          }
          case "dot": {
            const [x, y, r, color] = args;
            ctx.save();
            ctx.fillStyle = color || "#000";
            ctx.beginPath();
            ctx.arc(x, y, r || 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
          }
          case "fillpath": {
            const [points, color, strokeColor, width] = args;
            ctx.save();
            ctx.fillStyle = color || "#000";
            if (strokeColor) {
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = width || 1;
            }
            ctx.beginPath();
            for (let i = 0; i < points.length; i++) {
              const [x, y, move] = points[i];
              if (i === 0 || move) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            if (strokeColor) ctx.stroke();
            ctx.restore();
            break;
          }
          case "clear": {
            ctx.clearRect(0, 0, turtleCanvas.width, turtleCanvas.height);
            break;
          }
        }
      }
    },
  };

  pyodide.registerJsModule("ide_bridge", jsModule);

  // Bootstrap Python
  const bootstrapPy = `
from ide_bridge import js_show_input, js_wait_input, js_ensure_turtle_canvas, js_turtle_draw
import math, sys, asyncio

# input asíncrono
async def input(prompt=""):
    js_show_input(str(prompt))
    s = await js_wait_input()
    return str(s)

class _TurtleCanvas:
    def __init__(self, w=640, h=480):
        self.w = w
        self.h = h
        self.x = w / 2
        self.y = h / 2
        self.heading = 0.0
        self._pen_down = True
        self._visible = True
        self._speed = 0
        self._bg = "#ffff"
        self._pencolor = "#d33"
        self._fillcolor = "#f9a"
        self._linewidth = 2
        self._filling = False
        self._fill_points = []
        self._ops = []
        js_ensure_turtle_canvas()
        self._ops.append(["bg", self._bg])
        self._commit_ops()

    def _commit_ops(self):
        if self._ops:
            js_turtle_draw(self._ops)
            self._ops.clear()

    def _record_fill_point(self, move=False):
        if self._filling:
            self._fill_points.append([self.x, self.y, bool(move)])

    def speed(self, n=None):
        if n is None:
            return self._speed
        try:
            self._speed = int(n)
        except:
            self._speed = 0

    def title(self, *args, **kwargs): return
    def shape(self, *args, **kwargs): return

    def color(self, *args):
        if len(args) == 1:
            self.pencolor(args[0])
        elif len(args) >= 2:
            self.pencolor(args[0]); self.fillcolor(args[1])

    def pencolor(self, c=None):
        if c is None: return self._pencolor
        self._pencolor = str(c)

    def fillcolor(self, c=None):
        if c is None: return self._fillcolor
        self._fillcolor = str(c)

    def width(self, w): self._linewidth = max(1, int(w))
    def pensize(self, w): self.width(w)

    def bgcolor(self, c="#ffff"):
        self._bg = str(c)
        self._ops.append(["bg", self._bg])
        self._commit_ops()

    def penup(self): self._pen_down = False
    def pendown(self): self._pen_down = True
    def isdown(self): return self._pen_down
    def hideturtle(self): self._visible = False
    def showturtle(self): self._visible = True
    ht = hideturtle; st = showturtle

    def setheading(self, ang): self.heading = float(ang) % 360.0
    def left(self, ang):  self.heading = (self.heading + float(ang)) % 360.0
    def right(self, ang): self.heading = (self.heading - float(ang)) % 360.0

    def setx(self, x): self.goto(float(x), self.y)
    def sety(self, y): self.goto(self.x, float(y))
    def setpos(self, x, y=None):
        if y is None and hasattr(x, "__iter__"): x, y = x
        self.goto(float(x), float(y))
    setposition = setpos

    def home(self):
        self.goto(self.w/2, self.h/2)
        self.setheading(0)

    def goto(self, x, y):
        x1, y1 = self.x, self.y
        self.x, self.y = float(x), float(y)
        if self._pen_down:
            self._ops.append(["line", x1, y1, self.x, self.y, self._pencolor, self._linewidth])
        self._record_fill_point(move=False)
        self._commit_ops()

    def forward(self, d):
        rad = math.radians(self.heading)
        nx = self.x + math.cos(rad) * float(d)
        ny = self.y - math.sin(rad) * float(d)
        self.goto(nx, ny)
    fd = forward

    def backward(self, d):
        self.forward(-float(d))
    bk = back = backward

    def dot(self, size=3, color=None):
        col = self._pencolor if color is None else str(color)
        self._ops.append(["dot", self.x, self.y, float(size), col])
        self._record_fill_point(move=False)
        self._commit_ops()

    def begin_fill(self):
        self._filling = True
        self._fill_points = [[self.x, self.y, True]]

    def end_fill(self):
        if self._filling:
            pts = self._fill_points[:]
            if len(pts) >= 3:
                self._ops.append(["fillpath", pts, self._fillcolor, self._pencolor, self._linewidth])
                self._commit_ops()
        self._filling = False
        self._fill_points = []

    def circle(self, radius, extent=None, steps=None):
        r = float(radius)
        total = 360.0 if extent is None else float(extent)
        if steps is None:
            steps = max(12, int(abs(total) / 2))
        steps = min(360, steps)
        step_deg = total / steps
        chord = 2.0 * abs(r) * math.sin(math.radians(abs(step_deg) / 2.0))
        turn = step_deg
        if r < 0:
            turn = -turn
        for _ in range(steps):
            self.forward(chord)
            self.left(turn)

    beginfill = begin_fill
    endfill = end_fill

class _TurtleModule:
    def __init__(self):
        self._default = None

    def _get_default(self):
        if self._default is None:
            self._default = _TurtleCanvas()
        return self._default

    def reset(self):
        self._default = None

    def Turtle(self):
        return _TurtleCanvas()

    # API módulo
    def bgcolor(self, c): self._get_default().bgcolor(c)
    def color(self, *args): self._get_default().color(*args)
    def pensize(self, w): self._get_default().pensize(w)
    def penup(self): self._get_default().penup()
    def pendown(self): self._get_default().pendown()
    def forward(self, d): self._get_default().forward(d)
    def left(self, a): self._get_default().left(a)
    def right(self, a): self._get_default().right(a)
    def circle(self, r, extent=None, steps=None): self._get_default().circle(r, extent, steps)
    def begin_fill(self): self._get_default().begin_fill()
    def end_fill(self): self._get_default().end_fill()
    def dot(self, size=3, color=None): self._get_default().dot(size, color)
    def setheading(self, a): self._get_default().setheading(a)
    def goto(self, x, y): self._get_default().goto(x, y)
    def done(self): return
    fd = forward
    rt = right
    lt = left

turtle = _TurtleModule()
sys.modules['turtle'] = turtle
`;

  await pyodide.runPythonAsync(bootstrapPy);

  statusEl.textContent = "Python 3.11 | Pyodide listo";
}

/* Ejecutar código del usuario */
async function ejecutarCodigo() {
  if (!pyodide || isRunning) return;
  isRunning = true;
  clearOutput();
  const code = getUserCode();

  try {
    // 1) Limpiar canvas JS
    if (turtleCtx && turtleCanvas) {
      turtleCtx.clearRect(0, 0, turtleCanvas.width, turtleCanvas.height);
    }

    // 2) Reinyectar y resetear módulo turtle ANTES de ejecutar usuario
    await pyodide.runPythonAsync(`
import sys
# Asegurar que nuestro turtle esté registrado
if 'turtle' not in sys.modules:
    try:
        sys.modules['turtle'] = turtle
    except NameError:
        pass
# Resetear estado
try:
    import turtle
    turtle.reset()
except Exception:
    pass
`);

    // 3) Hint si usan input sin await
    if (/\binput\s*\(/.test(code) && !/\bawait\s+input\s*\(/.test(code)) {
      printToOutput('⚠️ Recordá usar: await input("...")');
    }

    // 4) Envolver código en async
    const wrapped =
      "async def __user_main__():\n" +
      code.split("\n").map((line) => "    " + line).join("\n") +
      "\nawait __user_main__()\n";

    await pyodide.runPythonAsync(wrapped);
  } catch (err) {
    printToOutput("❌ Error: " + (err && err.message ? err.message : String(err)));
    console.error(err);
  } finally {
    isRunning = false;
  }
}

/* Limpiar salida */
function limpiarSalida() {
  clearOutput();
}

/* Generar iframe embebible con el código del usuario */
function generarEmbed() {
  const code = getUserCode();
  const compressed = LZString.compressToEncodedURIComponent(code);
  const url = `https://disenioweb2025.github.io/ide_basico_python/?code=${compressed}`;
  
  // Generar snippet de iframe
  const iframeSnippet = `<iframe
  src="${url}"
  title="Programa Python embebido"
  width="100%"
  height="600"
  frameborder="0"
  loading="lazy"
  allowfullscreen
  sandbox="allow-scripts allow-same-origin"
></iframe>`;

  // Copiar al portapapeles
  navigator.clipboard
    .writeText(iframeSnippet)
    .then(() => {
      printToOutput("✅ Código iframe copiado al portapapeles.");
      printToOutput("Pégalo en tu HTML para embeber este programa:");
      printToOutput(iframeSnippet);
    })
    .catch(() => {
      printToOutput("📋 Copia este código iframe:");
      printToOutput(iframeSnippet);
    });
}

/* Cargar código desde query ?code= */
function maybeLoadFromQuery() {
  const params = new URLSearchParams(location.search);
  const c = params.get("code");
  if (c) {
    try {
      const code = LZString.decompressFromEncodedURIComponent(c);
      if (code) setUserCode(code);
    } catch (_) {}
  }
}

/* Eventos UI */
function initUI() {
  if (selectPlantillas) selectPlantillas.addEventListener("change", cargarPlantilla);
  if (runBtn) runBtn.addEventListener("click", ejecutarCodigo);
  if (clearBtn) clearBtn.addEventListener("click", limpiarSalida);
  if (embedBtn) embedBtn.addEventListener("click", generarEmbed);
}

/* Init */
window.addEventListener("DOMContentLoaded", async () => {
  try {
    initEditor();
    initUI();
    // Mantenemos PLANTILLAS "limpia", pero NO repoblamos el select para preservar los optgroups del HTML
    sanitizePlantillas();
    // repoblarSelectPlantillas(); // <- Omitido intencionalmente (Opción A)
    maybeLoadFromQuery();
    await loadPython();
    // Si hay una plantilla seleccionada por defecto en el select, cargarla
    cargarPlantilla();
    console.log("✅ IDE listo");
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Error cargando Python";
  }
});
