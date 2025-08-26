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
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
    
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
    window.dispatchEvent(new CustomEvent('pythonExecutionComplete', {
      detail: {
        success: window.pythonExecutionSuccess,
        error: window.pythonExecutionError
      }
    }));
  }
}

function limpiarEditor() {
  document.getElementById("code-editor").value = "";
  document.getElementById("output").textContent =
    "Python 3.10 | Pyodide\nEjecuta tu código para ver la salida...";
  closeTurtleCanvas();
}

// Función auxiliar para mostrar URL cuando clipboard API no funciona
function mostrarURLEnPrompt(url) {
  // Crear textarea temporal para copiar
  const textarea = document.createElement('textarea');
  textarea.value = url;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (successful) {
      alert("🔗 ¡URL copiada al portapapeles!\n\n📏 Longitud: " + url.length + " caracteres");
    } else {
      throw new Error("execCommand failed");
    }
  } catch (error) {
    document.body.removeChild(textarea);
    // Como último recurso, mostrar en prompt para copia manual
    prompt("Copia esta URL para compartir el código embebido:", url);
  }
}

// FUNCIÓN CORREGIDA para generar URL de embebido
function generarURLEmbebido() {
  const codigo = document.getElementById("code-editor").value;
  
  if (!codigo.trim()) {
    alert("⚠️ No hay código para embeber. Escribe algo primero.");
    return;
  }
  
  try {
    // Mejor encoding para manejar caracteres especiales
    const codigoCodificado = btoa(encodeURIComponent(codigo));
    const urlBase = window.location.origin + window.location.pathname;
    const urlEmbebida = `${urlBase}?codigo=${codigoCodificado}`;
    
    // Verificar si la URL no es demasiado larga (límite de navegadores ~2000 caracteres)
    if (urlEmbebida.length > 2000) {
      alert("⚠️ El código es demasiado largo para embeber en URL.\nIntenta con código más corto o usa un servicio como pastebin.");
      return;
    }
    
    console.log("🔗 URL generada:", urlEmbebida);
    
    // Copiar al portapapeles con mejor manejo de errores
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(urlEmbebida)
        .then(() => {
          alert("🔗 ¡URL de embebido copiada al portapapeles!\n\nComparte este enlace para que otros vean tu código precargado.\n\n📏 Longitud: " + urlEmbebida.length + " caracteres");
        })
        .catch((error) => {
          console.error("Error al copiar con clipboard API:", error);
          mostrarURLEnPrompt(urlEmbebida);
        });
    } else {
      // Fallback para navegadores sin clipboard API o contextos no seguros
      mostrarURLEnPrompt(urlEmbebida);
    }
  } catch (error) {
    console.error("Error al generar URL embebida:", error);
    alert("❌ Error al generar URL embebida.\nEl código puede contener caracteres que no se pueden codificar.");
  }
}

// FUNCIÓN CORREGIDA para cargar código desde parámetros URL
function cargarCodigoDesdeURL() {
  console.log("🔄 Verificando código embebido en URL...");
  
  const urlParams = new URLSearchParams(window.location.search);
  const codigoEmbebido = urlParams.get('codigo');
  
  if (codigoEmbebido) {
    console.log("📥 Parámetro 'codigo' encontrado, decodificando...");
    
    try {
      // Decodificación mejorada que maneja caracteres especiales
      const codigoDecodificado = decodeURIComponent(atob(codigoEmbebido));
      const editor = document.getElementById("code-editor");
      
      if (editor) {
        // IMPORTANTE: Limpiar el contenido actual antes de cargar el nuevo
        editor.value = '';
        
        // Cargar el código embebido
        editor.value = codigoDecodificado;
        
        console.log("✅ Código embebido cargado correctamente");
        console.log("📄 Líneas cargadas:", codigoDecodificado.split('\n').length);
        console.log("📏 Caracteres totales:", codigoDecodificado.length);
        
        // Mostrar preview del contenido (primeras líneas)
        const preview = codigoDecodificado.split('\n').slice(0, 3).join('\n');
        console.log("👀 Preview del código:", preview);
        
        // Trigger evento para que otros componentes sepan que se cargó código
        editor.dispatchEvent(new Event('input'));
        
        return true; // Código cargado exitosamente
      } else {
        console.error("❌ Editor no encontrado en el DOM");
        return false;
      }
    } catch (error) {
      console.error("❌ Error al decodificar código embebido:", error);
      alert("⚠️ Error al cargar el código embebido.\nEl enlace puede estar corrupto o malformado.");
      
      // Mostrar el parámetro crudo para debugging
      console.log("🔍 Parámetro crudo recibido:", codigoEmbebido.substring(0, 100) + "...");
      return false;
    }
  } else {
    console.log("ℹ️ No hay código embebido en la URL");
    return false;
  }
}

// FUNCIÓN DE PRUEBA - para debugging
function probarEmbebido() {
  console.log("🧪 Probando función embeber...");
  
  // Verificar elementos del DOM
  const editor = document.getElementById("code-editor");
  const boton = document.querySelector(".btn-embeber");
  
  console.log("Editor encontrado:", !!editor);
  console.log("Botón encontrado:", !!boton);
  console.log("Contenido del editor:", editor ? editor.value.length + " caracteres" : "N/A");
  
  // Probar la función
  if (editor && editor.value.trim()) {
    generarURLEmbebido();
  } else {
    console.log("❌ No hay código para embeber");
  }
}

// Permitir Enter en el input field
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

// Para debugging en consola - puedes escribir: probarEmbebido()
window.probarEmbebido = probarEmbebido;

// INICIALIZACIÓN CORREGIDA
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM cargado, iniciando IDE Python...");
  
  // PASO 1: Cargar código embebido ANTES de inicializar todo lo demás
  const codigoCargado = cargarCodigoDesdeURL();
  
  if (codigoCargado) {
    console.log("✅ Código embebido cargado, continuando inicialización...");
  } else {
    console.log("ℹ️ No hay código embebido, usando código por defecto...");
  }
  
  // PASO 2: Inicializar Pyodide
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
