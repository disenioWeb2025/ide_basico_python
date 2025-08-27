// Pyodide se cargará dinámicamente

let pyodide;
let isLoading = true;

// Variables globales para input
let inputResolver = null;

// Bandera para indicar ejecución exitosa
window.pythonExecutionSuccess = false;
window.pythonExecutionError = null;

// --- AVISOS AL PADRE (postMessage) ---
function notifyParent(data) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ source: 'IDE', ...data }, window.location.origin);
    }
  } catch (e) {
    console.warn('postMessage falló:', e);
  }
}

// Funciones para canvas turtle flotante - CORREGIDAS
function showTurtleCanvas() {
  console.log("🐢 Mostrando canvas turtle...");

  // Verificar si ya existe el overlay y container
  let overlay = document.getElementById("turtle-overlay");
  let container = document.getElementById("turtle-container");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "turtle-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.zIndex = "9998";
    overlay.style.display = "none";
    document.body.appendChild(overlay);
  }

  if (!container) {
    container = document.createElement("div");
    container.id = "turtle-container";
    container.style.position = "fixed";
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.transform = "translate(-50%, -50%)";
    container.style.zIndex = "9999";
    container.style.backgroundColor = "white";
    container.style.border = "2px solid #333";
    container.style.borderRadius = "8px";
    container.style.boxShadow = "0px 10px 40px rgba(0, 0, 0, 0.5)";
    container.style.padding = "10px";
    container.style.display = "none";

    // Encabezado con título y botón de cerrar
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "8px";

    const title = document.createElement("span");
    title.textContent = "Canvas Turtle 🐢";
    title.style.fontWeight = "bold";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Cerrar ✖";
    closeBtn.style.padding = "6px 12px";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "4px";
    closeBtn.style.background = "#e74c3c";
    closeBtn.style.color = "white";
    closeBtn.style.cursor = "pointer";
    closeBtn.onclick = () => {
      document.getElementById("turtle-overlay").style.display = "none";
      document.getElementById("turtle-container").style.display = "none";
    };

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Canvas
    const canvas = document.createElement("canvas");
    canvas.id = "turtle-canvas";
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.border = "1px solid #ccc";
    canvas.style.backgroundColor = "white";

    container.appendChild(header);
    container.appendChild(canvas);
    document.body.appendChild(container);
  }

  // Obtener referencias actualizadas
  overlay = document.getElementById("turtle-overlay");
  container = document.getElementById("turtle-container");
  const canvas = document.getElementById("turtle-canvas");

  if (container && overlay && canvas) {
    // Asegurarse de que el canvas esté configurado correctamente
    canvas.width = 800;
    canvas.height = 600;

    // Mostrar el overlay y container
    overlay.style.display = "block";
    container.style.display = "block";

    console.log("✅ Canvas mostrado correctamente");
    console.log("Canvas dimensiones:", canvas.width, "x", canvas.height);

    // Forzar un repintado del canvas
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return true;
  } else {
    console.error("❌ No se encontraron elementos del canvas");
    return false;
  }
}

// Hacer la función disponible globalmente
window.showTurtleCanvas = showTurtleCanvas;

window.closeTurtleCanvas = function () {
  const overlay = document.getElementById("turtle-overlay");
  const container = document.getElementById("turtle-container");
  if (overlay) overlay.style.display = "none";
  if (container) container.style.display = "none";
};

// Funciones para manejo de input
function requestInput(prompt) {
  return new Promise((resolve) => {
    inputResolver = resolve;
    const inputSection = document.getElementById("input-section");
    const inputPrompt = document.getElementById("input-prompt");
    const inputField = document.getElementById("input-field");

    inputPrompt.textContent = prompt;
    inputField.value = "";
    inputSection.classList.remove("input-hidden");
    inputField.focus();
  });
}

function submitInput() {
  const inputSection = document.getElementById("input-section");
  const inputField = document.getElementById("input-field");

  if (inputResolver) {
    inputResolver(inputField.value);
    inputResolver = null;
    inputSection.classList.add("input-hidden");
  }
}

// Vincular el botón de enviar
document.getElementById("submit-input").addEventListener("click", submitInput);

// Permitir Enter para enviar
document.addEventListener("keypress", (e) => {
  if (e.target.id === "input-field" && e.key === "Enter") {
    submitInput();
  }
});

// Funciones auxiliares para la página padre
window.getPythonExecutionStatus = function() {
  return {
    success: window.pythonExecutionSuccess,
    error: window.pythonExecutionError,
    isLoading: isLoading
  };
};

window.resetExecutionStatus = function() {
  window.pythonExecutionSuccess = false;
  window.pythonExecutionError = null;
};

// Parámetros de ejemplo iniciales
const defaultCode = `# Mi primer programa en Python
print("Hola, mundo!")
`;

function cargarCodigoDesdeURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const codigoParam = urlParams.get("codigo");
  const editor = document.getElementById("code-editor");

  if (codigoParam) {
    try {
      // Permitir tanto base64 de URI encoded, como raw URI encoded
      let decoded;
      try {
        decoded = decodeURIComponent(atob(codigoParam));
      } catch (_) {
        decoded = decodeURIComponent(codigoParam);
      }
      editor.value = decoded;
    } catch (e) {
      console.warn("No se pudo decodificar 'codigo':", e);
      editor.value = defaultCode;
    }
  } else {
    editor.value = defaultCode;
  }
}

async function inicializarPyodide() {
  const outputElement = document.getElementById("output");
  const statusElement = document.getElementById("status");

  try {
    statusElement.textContent = "Cargando Python...";
    statusElement.className = "status-top loading";

    // Cargar Pyodide dinámicamente
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
    
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    pyodide = await loadPyodide({
      stdout: (text) => {
        const output = document.getElementById("output");
        output.textContent += text + "\n";
      },
      stderr: (text) => {
        const output = document.getElementById("output");
        output.textContent += "❌ " + text + "\n";
      },
    });

    await pyodide.loadPackage(["micropip"]);

    // Cargar turtle-like minimal en JS → expuesto como módulo en Pyodide (simplificado)
    await pyodide.runPythonAsync(`
import js, math

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
            container = js.document.getElementById("turtle-container")
            if not container or container.style.display == "none":
                # Intentar mostrar el canvas
                ok = js.window.showTurtleCanvas()
                if not ok:
                    print("❌ Error: No se pudo mostrar el canvas")
                    return False

            canvas = js.document.getElementById(self.canvas_id)
            if canvas is not None:
                self._ctx = canvas.getContext("2d")
                return True
            else:
                print("❌ Error: Canvas no encontrado")
                return False
        except Exception as e:
            print(f"❌ Error al mostrar canvas: {e}")
            return False

    def forward(self, distance):
        if not self._ensure_canvas():
            return

        # Calcular nueva posición
        rad_angle = math.radians(self.angle)
        new_x = self.x + distance * math.cos(rad_angle)
        new_y = self.y + distance * math.sin(rad_angle)

        # Dibujar línea si el lápiz está abajo
        if self.pen_down:
            self.ctx.beginPath()
            self.ctx.moveTo(self.x, self.y)
            self.ctx.lineTo(new_x, new_y)
            self.ctx.stroke()

        # Actualizar posición
        self.x = new_x
        self.y = new_y

    def backward(self, distance):
        self.forward(-distance)

    def right(self, angle):
        self.angle += angle

    def left(self, angle):
        self.angle -= angle

    def penup(self):
        self.pen_down = False

    def pendown(self):
        self.pen_down = True

    def color_(self, color):
        self.color = color
        self.ctx.strokeStyle = color

    def width_(self, w):
        self.linewidth = w
        self.ctx.lineWidth = w

def get_turtle():
    return MiniTurtle()

# Exponer en el namespace global
turtle = MiniTurtle()

print("🐢 MiniTurtle listo. Usa turtle.forward(100), turtle.left(90), etc.")
                `);

    // Redefinir input en Python para usar el input del navegador
    await pyodide.runPythonAsync(`
import sys, builtins, js

def input(prompt=""):
    # Mostrar prompt en la interfaz y esperar respuesta asíncrona
    js.document.getElementById("input-section").classList.remove("input-hidden")
    js.document.getElementById("input-prompt").textContent = str(prompt)

    # Esperar a que el usuario envíe el input desde JS
    future = js.Promise.new(lambda resolve, reject: setattr(js.window, "inputResolver", resolve))
    result = await future

    # Ocultar el input
    js.document.getElementById("input-section").classList.add("input-hidden")

    # Mostrar resultado en el output (simulando stdin)
    sys.stdout.write(str(result) + '\\n')
    sys.stdout.flush()

    return str(result)

builtins.input = input
                `);

    statusElement.textContent = "✅ Python listo";
    statusElement.className = "status-top ready";
    isLoading = false;
    notifyParent({ type: 'ide:ready', ready: true, ts: Date.now() });
    
    // Verificar si hay código embebido y mostrar mensaje apropiado
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('codigo')) {
      outputElement.textContent = "🔎 Código embebido cargado. ¡Presiona ▶️ Ejecutar para probarlo!";
    } else {
      outputElement.textContent = "Python 3.10 | Pyodide\nEjecuta tu código para ver la salida...";
    }
      
  } catch (error) {
    outputElement.textContent = `❌ Error al cargar Python: ${error.message}`;
    statusElement.textContent = "❌ Error al cargar";
    statusElement.className = "status-top error";
    notifyParent({ type: 'ide:error', message: error.message, ts: Date.now() });
  }
}

async function ejecutarCodigo() {
  if (isLoading) {
    alert("Python aún se está cargando. Por favor espera...");
    return;
  }

  const codigo = document.getElementById("code-editor").value;
  const outputElement = document.getElementById("output");
  const runBtn = document.getElementById("run-btn");

  runBtn.disabled = true;
  runBtn.textContent = "⏳ Ejecutando...";

  outputElement.textContent = "Ejecutando código...\n\n";
  notifyParent({ type: 'run:start', ts: Date.now() });
  document.getElementById("input-section").classList.add("input-hidden");

  // Resetear banderas
  window.pythonExecutionSuccess = false;
  window.pythonExecutionError = null;

  try {
    // Cargar el canvas turtle si el código lo pide (heurística simple)
    if (/turtle\./.test(codigo)) {
      showTurtleCanvas();
    }

    // Redirigir stdout/stderr
    await pyodide.runPythonAsync(`
import sys

class JSWriter:
    def __init__(self, is_err=False):
        self.is_err = is_err
    def write(self, s):
        if self.is_err:
            js.console.error(s)
            js.document.getElementById("output").textContent += "❌ " + s
        else:
            js.console.log(s)
            js.document.getElementById("output").textContent += s
    def flush(self):
        pass

sys.stdout = JSWriter(False)
sys.stderr = JSWriter(True)
    `);

    // Ejecutar el código del editor
    await pyodide.runPythonAsync(codigo);

    // Capturar salida (ya se volcó en el DOM, pero podemos marcar éxito)
    let output = document.getElementById("output").textContent;
    const stdout = output; // ya lo tenemos
    const stderr = "";     // si hubo error, lo atrapamos en catch

    // Si no hubo stderr, marcamos éxito
    if (stdout) {
      // noop
    }

    // En esta implementación, si llegamos aquí sin lanzar excepción → éxito
    if (!/❌/.test(output)) {
      window.pythonExecutionSuccess = true;
    }

    // Mostrar salida si está vacía
    document.getElementById("output").textContent =
      output || "✅ Código ejecutado sin salida en consola.";
      
  } catch (error) {
    document.getElementById("output").textContent = `❌ Error: ${error.message}`;
    console.error("Error completo:", error);
    window.pythonExecutionError = error.message;
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = "▶️ Ejecutar";
    
    // Disparar evento personalizado para notificar a la página padre
    window.dispatchEvent(new CustomEvent('pythonExecutionComplete', {
      detail: {
        success: window.pythonExecutionSuccess,
        error: window.pythonExecutionError
      }
    }));
    notifyParent({ type: 'run:complete', success: window.pythonExecutionSuccess, error: window.pythonExecutionError, ts: Date.now() });
  }
}

// Funciones varias de UI
function limpiarEditor() {
  document.getElementById("code-editor").value = "";
  document.getElementById("output").textContent =
    "Python 3.10 | Pyodide\nEjecuta tu código para ver la salida...";
  closeTurtleCanvas();
}

// Función auxiliar para mostrar URL cuando clipboard API no funciona
function mostrarURLEnPrompt(url) {
  const ok = prompt("No se pudo copiar automáticamente. Copia manualmente la URL:", url);
  if (ok !== null) {
    console.log("Usuario vio la URL de embebido.");
  }
}

function copiarURLEmbebido() {
  try {
    const editor = document.getElementById("code-editor");
    const codigo = editor.value;

    // Generar URL embebida: base64 sobre URI encoded → más seguro
    const codigoCodificado = btoa(encodeURIComponent(codigo));
    const urlBase = window.location.origin + window.location.pathname;
    const urlEmbebida = `${urlBase}?codigo=${codigoCodificado}`;

    if (urlEmbebida.length > 2000) {
      alert("⚠️ El código es demasiado largo para embeber en URL (≈>2000 caracteres). Considera acortarlo o publicar el código en un gist/paste.");
      return;
    }

    // Intentar copiar
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(urlEmbebida)
        .then(() => alert("🔗 URL copiada al portapapeles:\n\n" + urlEmbebida))
        .catch((e) => {
          console.warn("Fallo clipboard API:", e);
          mostrarURLEnPrompt(urlEmbebida);
        });
    } else {
      mostrarURLEnPrompt(urlEmbebida);
    }
  } catch (e) {
    console.error("Error generando/copiando URL:", e);
    alert("Hubo un error generando la URL. Revisa la consola.");
  }
}

// Listeners
document.getElementById("run-btn").addEventListener("click", ejecutarCodigo);
document.getElementById("copy-url-btn").addEventListener("click", copiarURLEmbebido);
document.getElementById("clear-btn").addEventListener("click", limpiarEditor);

// Cargar código embebido (si existe en ?codigo=)
document.addEventListener("DOMContentLoaded", () => {
  cargarCodigoDesdeURL();
  inicializarPyodide();
});

// Fallback para navegadores que no soportan DOMContentLoaded correctamente
window.addEventListener("load", () => {
  console.log("🔄 Evento load disparado como fallback...");
  
  // Solo ejecutar si no se ejecutó antes
  const editor = document.getElementById("code-editor");
  if (editor && editor.value.includes("# Mi primer programa en Python")) {
    console.log("🔄 Ejecutando carga de código embebido como fallback...");
    cargarCodigoDesdeURL();
  }
});

