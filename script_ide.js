// Pyodide se cargará dinámicamente

let pyodide;
let isLoading = true;

// Variables globales para input
let inputResolver = null;

// Bandera para indicar ejecución exitosa
window.pythonExecutionSuccess = false;
window.pythonExecutionError = null;

// Funciones para canvas turtle flotante - CORREGIDAS
function showTurtleCanvas() {
  console.log("🐢 Mostrando canvas turtle...");
  const container = document.getElementById("turtle-container");
  const overlay = document.getElementById("canvas-overlay");
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
  console.log("🐢 Cerrando canvas turtle...");
  const container = document.getElementById("turtle-container");
  const overlay = document.getElementById("canvas-overlay");

  if (container && overlay) {
    container.style.display = "none";
    overlay.style.display = "none";
    console.log("✅ Canvas cerrado");
  }
};

// Función para mostrar input integrado
function showInputSection(promptText) {
  const inputSection = document.getElementById("input-section");
  const inputPrompt = document.getElementById("input-prompt");
  const inputField = document.getElementById("input-field");

  inputPrompt.textContent = promptText || "Introduce un valor:";
  inputField.value = "";
  inputSection.classList.remove("input-hidden");
  inputField.focus();
}

// Función para enviar input
function submitInput() {
  const inputField = document.getElementById("input-field");
  const inputSection = document.getElementById("input-section");
  const outputElement = document.getElementById("output");

  const value = inputField.value;

  if (outputElement && value) {
    const currentText = outputElement.textContent;
    if (currentText && !currentText.endsWith("\n")) {
      outputElement.textContent += " " + value + "\n";
    } else {
      outputElement.textContent += value + "\n";
    }
  }

  inputSection.classList.add("input-hidden");

  if (inputResolver) {
    inputResolver(value);
    inputResolver = null;
  }
}

// Función para ajustar anchos de las secciones
function adjustWidth(section, value) {
  const mainContent = document.querySelector(".main-content");
  if (section === "examples") {
    mainContent.style.setProperty("--examples-width", value + "px");
  } else if (section === "editor") {
    mainContent.style.setProperty("--editor-width", value + "fr");
  } else if (section === "output") {
    mainContent.style.setProperty("--output-width", value + "fr");
  }
}

// Ejemplos removidos para versión embebible

// Turtle graphics implementation para Pyodide - CORREGIDA
function setupTurtleModule() {
  const turtleModule = `
import math
import js

class Turtle:
    def __init__(self):
        self.x = 400  # Centro del canvas
        self.y = 300
        self.angle = 0
        self.pen_down = True
        self.canvas = None
        self.ctx = None
        self.current_color = 'black'

    def _ensure_canvas(self):
        # SIEMPRE mostrar el canvas cuando se use turtle
        try:
            # Llamar directamente a la función JavaScript
            js.eval("showTurtleCanvas()")

            # Obtener referencias al canvas
            self.canvas = js.document.getElementById('turtle-canvas')
            if self.canvas:
                self.ctx = self.canvas.getContext('2d')

                # Configurar canvas con fondo blanco
                self.ctx.fillStyle = 'white'
                self.ctx.fillRect(0, 0, 800, 600)

                # Configurar estilo de dibujo
                self.ctx.strokeStyle = self.current_color
                self.ctx.lineWidth = 2
                self.ctx.lineCap = 'round'
                self.ctx.lineJoin = 'round'

                print("✅ Canvas turtle inicializado")
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

    def goto(self, x, y):
        if not self._ensure_canvas():
            return

        # Convertir coordenadas (centro del canvas como origen)
        canvas_x = x + 400
        canvas_y = 300 - y

        if self.pen_down:
            self.ctx.beginPath()
            self.ctx.moveTo(self.x, self.y)
            self.ctx.lineTo(canvas_x, canvas_y)
            self.ctx.stroke()

        self.x = canvas_x
        self.y = canvas_y

    def circle(self, radius):
        if not self._ensure_canvas():
            return

        self.ctx.beginPath()
        self.ctx.arc(self.x, self.y, abs(radius), 0, 2 * math.pi)
        if self.pen_down:
            self.ctx.stroke()

    def color(self, color_name):
        if not self._ensure_canvas():
            return

        self.current_color = str(color_name)
        self.ctx.strokeStyle = self.current_color
        self.ctx.fillStyle = self.current_color
        print(f"🎨 Color cambiado a: {color_name}")

    def clear(self):
        if not self._ensure_canvas():
            return

        # Limpiar todo el canvas
        self.ctx.fillStyle = 'white'
        self.ctx.fillRect(0, 0, 800, 600)

        # Resetear turtle
        self.x = 400
        self.y = 300
        self.angle = 0
        self.pen_down = True
        self.current_color = 'black'
        self.ctx.strokeStyle = self.current_color
        self.ctx.lineWidth = 2

        print("🧹 Canvas limpiado")

# Instancia global de turtle
_turtle = Turtle()

# Funciones del módulo turtle
def forward(distance):
    _turtle.forward(distance)

def backward(distance):
    _turtle.backward(distance)

def right(angle):
    _turtle.right(angle)

def left(angle):
    _turtle.left(angle)

def penup():
    _turtle.penup()

def pendown():
    _turtle.pendown()

def goto(x, y):
    _turtle.goto(x, y)

def circle(radius):
    _turtle.circle(radius)

def color(color_name):
    _turtle.color(color_name)

def clear():
    _turtle.clear()

def reset():
    _turtle.clear()

# Aliases comunes
fd = forward
bk = backward
rt = right
lt = left
pu = penup
pd = pendown
`;
  return turtleModule;
}

async function inicializarPyodide() {
  const outputElement = document.getElementById("output");
  const statusElement = document.getElementById("status");

  try {
    statusElement.textContent = "Cargando Python...";
    statusElement.className = "status-top loading";

    // Cargar Pyodide dinámicamente
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    pyodide = await loadPyodide();

    statusElement.textContent = "Instalando librerías...";
    await pyodide.loadPackage(["matplotlib", "numpy"]);

    statusElement.textContent = "Configurando módulos...";

    // Configurar turtle module personalizado
    pyodide.runPython(`
import sys
import types

# Crear módulo turtle personalizado
${setupTurtleModule()}

# Crear módulo turtle que se puede importar
turtle_module = types.ModuleType('turtle')

# Agregar todas las funciones al módulo
turtle_functions = [
    'Turtle', 'forward', 'backward', 'right', 'left', 'penup', 'pendown', 
    'goto', 'circle', 'color', 'clear', 'reset', 'fd', 'bk', 'rt', 'lt', 'pu', 'pd'
]

for func_name in turtle_functions:
    if func_name in globals():
        setattr(turtle_module, func_name, globals()[func_name])

# Registrar módulo en sys.modules
sys.modules['turtle'] = turtle_module

print("🐢 Módulo turtle registrado correctamente")
                `);

    // Configurar input
    pyodide.runPython(`
import builtins

def input(prompt=''):
    import js
    import sys

    # Mostrar prompt en stdout
    sys.stdout.write(str(prompt))
    sys.stdout.flush()

    # Usar prompt del navegador
    result = js.window.prompt(str(prompt)) or ""

    # Mostrar resultado
    sys.stdout.write(str(result) + '\\n')
    sys.stdout.flush()

    return str(result)

builtins.input = input
                `);

    statusElement.textContent = "✅ Python listo";
    statusElement.className = "status-top ready";
    isLoading = false;
    outputElement.textContent =
      "Python 3.10 | Pyodide\nEjecuta tu código para ver la salida...";
  } catch (error) {
    outputElement.textContent = `❌ Error al cargar Python: ${error.message}`;
    statusElement.textContent = "❌ Error al cargar";
    statusElement.className = "status-top error";
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
  document.getElementById("input-section").classList.add("input-hidden");

  // Resetear banderas
  window.pythonExecutionSuccess = false;
  window.pythonExecutionError = null;

  try {
    // Configurar captura de salida
    pyodide.runPython(`
import sys
from io import StringIO

stdout_buffer = StringIO()
stderr_buffer = StringIO()
original_stdout = sys.stdout
original_stderr = sys.stderr
sys.stdout = stdout_buffer
sys.stderr = stderr_buffer
                `);

    // Ejecutar código del usuario
    pyodide.runPython(codigo);

    // Obtener salidas
    const stdout = pyodide.runPython("stdout_buffer.getvalue()");
    const stderr = pyodide.runPython("stderr_buffer.getvalue()");

    // Restaurar stdout/stderr
    pyodide.runPython(`
sys.stdout = original_stdout
sys.stderr = original_stderr
                `);

    // Mostrar resultados
    let output = "";
    if (stdout) output += stdout;
    if (stderr) {
      output += "\n❌ Error: " + stderr;
      window.pythonExecutionError = stderr;
    } else {
      // Ejecución exitosa
      window.pythonExecutionSuccess = true;
    }

    outputElement.textContent =
      output || "✅ Código ejecutado sin salida en consola.";
  } catch (error) {
    outputElement.textContent = `❌ Error: ${error.message}`;
    console.error("Error completo:", error);
    window.pythonExecutionError = error.message;
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = "▶️ Ejecutar";

    // Disparar evento personalizado para notificar a la página padre
    window.dispatchEvent(
      new CustomEvent("pythonExecutionComplete", {
        detail: {
          success: window.pythonExecutionSuccess,
          error: window.pythonExecutionError,
        },
      })
    );
  }
}

function limpiarEditor() {
  document.getElementById("code-editor").value = "";
  document.getElementById("output").textContent =
    "Python 3.10 | Pyodide\nEjecuta tu código para ver la salida...";
  closeTurtleCanvas();
}

// Funciones de descarga y compartir removidas para versión embebible

// Permitir Enter en el input field
document.addEventListener("keypress", (e) => {
  if (e.target.id === "input-field" && e.key === "Enter") {
    submitInput();
  }
});

// Funciones auxiliares para la página padre
window.getPythonExecutionStatus = function () {
  return {
    success: window.pythonExecutionSuccess,
    error: window.pythonExecutionError,
    isLoading: isLoading,
  };
};

window.resetExecutionStatus = function () {
  window.pythonExecutionSuccess = false;
  window.pythonExecutionError = null;
};

// Inicializar cuando la página se carga
window.addEventListener("load", () => {
  console.log("🚀 Inicializando IDE Python...");
  inicializarPyodide();
});
