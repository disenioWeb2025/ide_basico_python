# Instrucciones de uso del IDE Python (versión Pyodide + Turtle + Embed)

Este IDE corre Python en el navegador con Pyodide. Incluye:

- Ejecución de código Python sin instalar nada.
- Entrada de usuario asíncrona con `await input()`.
- Soporte de "turtle" adaptado a canvas (ventana flotante).
- Botón "Embeber" que genera un iframe con tu código pre-cargado.

**URL del IDE:** https://disenioweb2025.github.io/ide_basico_python/

---

## Tabla de contenidos


1. [Interfaz y botones principales](#1-interfaz-y-botones-principales)
2. [Escribir y ejecutar código](#2-escribir-y-ejecutar-código)
3. [Turtle en este IDE](#3-turtle-en-este-ide)
4. [Entrada de usuario (await input)](#4-entrada-de-usuario-await-input)
5. [Embeber tu programa](#5-embeber-tu-programa)
6. [Cargar código por URL (?code=)](#6-cargar-código-por-url-code)
7. [Plantillas](#7-plantillas)
8. [Errores comunes y soluciones](#8-errores-comunes-y-soluciones)
9. [Diferencias clave vs. Python de escritorio](#9-diferencias-clave-vs-python-de-escritorio)
10. [Ejemplos listos para copiar](#10-ejemplos-listos-para-copiar)
11. [Accesibilidad y rendimiento](#11-accesibilidad-y-rendimiento)
12. [Soporte y Contribuciones](#12-soporte-y-contribuciones)
13. [Licencia / Créditos](#13-licencia--créditos)

---

## 1) Interfaz y botones principales

- **Ejecutar ▶️**: corre el código del editor.
- **Limpiar 🗑️**: limpia el panel de salida.
- **Embeber 🔗**: abre un modal con el snippet de iframe para insertar tu programa en otra página.
- **Estado** (barra superior): "Cargando Python…" al inicio; luego muestra la versión de Python.

---

## 2) Escribir y ejecutar código

- Escribe en el editor (CodeMirror). Si no carga CodeMirror, verás un textarea; funciona igual.
- Haz clic en **Ejecutar**. La salida aparece a la derecha.
- Si tu programa usa `input()`, en este IDE debes usar `await input("mensaje: ")`.

**Ejemplo:**

```python
nombre = await input("¿Cómo te llamas? ")
print("Hola", nombre)
```

**Nota:**

- `input()` tradicional bloqueante no funciona en el navegador. Siempre usa `await input()`.

---

## 3) Turtle en este IDE

El IDE emula "turtle" dibujando en un canvas dentro de una ventana flotante.

- **Coordenadas**: el origen está en la esquina superior izquierda del canvas.
- **Posición inicial del "Turtle"**: centro del canvas (por defecto 640x480).
- **Sentido**: `heading 0` hacia la derecha; `left(90)` gira hacia arriba.
- **Métodos soportados** (principales):
  - `forward(d)`, `backward(d)`, `left(ang)`, `right(ang)`, `setheading(ang)`
  - `goto(x, y)`, `setpos(x, y)`, `home()`
  - `pencolor(c)`, `fillcolor(c)`, `pensize(w)`, `color(pen, fill)`
  - `begin_fill()`, `end_fill()`, `dot(size, color)`
  - `circle(r, extent=None, steps=None)`
  - `bgcolor(c)`
  - **Modo objeto**: `t = turtle.Turtle()` también funciona.

### Ejemplo simple:

```python
import turtle

turtle.bgcolor("#fff")
turtle.pencolor("red")
turtle.pensize(3)

turtle.forward(120)
turtle.left(90)
turtle.forward(80)
turtle.dot(8, "blue")
```

### Rellenos:

```python
import turtle

turtle.color("black", "gold")
turtle.begin_fill()
for _ in range(4):
    turtle.forward(120)
    turtle.left(90)
turtle.end_fill()
```

### Círculo y arco:

```python
import turtle

turtle.pencolor("#0a7")
turtle.circle(60)         # círculo completo
turtle.right(90)
turtle.circle(60, 180)    # arco de 180°
```

### Consejos:

- La ventana Turtle se crea automáticamente al dibujar.
- Se cierra con el botón "Cerrar", clic fuera del cuadro o tecla **Esc**.
- Para limpiar, vuelve a ejecutar tu programa (Turtle se resetea al inicio).

### Limitaciones frente a Turtle estándar:

- No hay animación "paso a paso" en tiempo real.
- No están disponibles eventos de teclado/ratón.
- El eje Y crece hacia abajo (propio de canvas HTML).

---

## 4) Entrada de usuario (await input)

- Usa `await input("texto: ")` para pedir datos.
- El prompt aparece debajo del panel de salida. Escribe y presiona "Enviar".
- Si usas `input()` sin `await`, el IDE te avisará en la salida.

**Ejemplo:**

```python
a = int(await input("Ingresa un número: "))
b = int(await input("Otro número: "))
print("Suma:", a + b)
```

---

## 5) Embeber tu programa

El botón "Embeber" genera un iframe para copiar y pegar en tu sitio.

- **Qué hace**: comprime tu código y arma una URL con `?code=...` para que el IDE lo cargue automáticamente.
- **Pasos**:
  1. Escribe tu programa.
  2. Clic en "🔗 Embeber".
  3. En el modal gris, presiona "Copiar" y pega el snippet en tu HTML.

**Ejemplo de iframe:**

```html
<iframe
  src="https://disenioweb2025.github.io/ide_basico_python/?code=...COMPRIMIDO..."
  title="Programa Python embebido"
  width="100%"
  height="600"
  frameborder="0"
  loading="lazy"
  allowfullscreen
  sandbox="allow-scripts allow-same-origin"
></iframe>
```

### Consejos:

- Ajusta `height` según tu layout (por ejemplo, 480–800).
- Si tu sitio usa Content Security Policy (CSP) estricta, habilita `scripts` y `same-origin` para el dominio de GitHub Pages del proyecto.

---

## 6) Cargar código por URL (?code=)

- El IDE detecta el parámetro `?code=` y descomprime el contenido para llenar el editor.
- Compartiendo un enlace con `?code=...`, quien lo abra verá el editor con ese programa cargado.
- El botón **Embeber** automatiza este proceso.

---

## 7) Plantillas

- Si el select de plantillas está visible, permite cargar ejemplos rápidos.
- Selecciona una plantilla para llenar el editor y luego **Ejecutar**.
- Podés ver y ejecutar todas las plantillas disponibles en: https://disenioweb2025.github.io/ide_basico_python/index_plantillas.html

---

## 8) Errores comunes y soluciones

### No aparece "Turtle"

- Ejecuta algún comando de turtle (por ejemplo, `turtle.dot(5)`).
- Revisa la consola del navegador (F12) si no aparece.

### Aviso "Recordá usar: await input(...)"

- Cambia `input()` por `await input("...")`.

### El botón Embeber no hace nada

- Verifica que se cargue LZString:

```html
<script src="https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js"></script>
```

- Revisa la consola; el modal se inyecta automáticamente aunque no esté en el HTML.

### Cerrar modal

- Puedes cerrar con el botón **Cerrar**, clic fuera del cuadro o tecla **Esc**.

---

## 9) Diferencias clave vs. Python de escritorio

- Corre en el navegador con Pyodide: sin acceso a archivos locales ni instalación de librerías nativas.
- `turtle` es una emulación sobre canvas: cubre la API principal de dibujo, no todos los eventos/funciones del módulo oficial.
- `input` tradicional bloqueante no existe; usa `await input()`.

---

## 10) Ejemplos listos para copiar

### Escalera:

```python
import turtle
turtle.pencolor("#444")
turtle.pensize(4)
for _ in range(6):
    turtle.forward(60)
    turtle.left(90)
    turtle.forward(30)
    turtle.right(90)
```

### Flor simple:

```python
import turtle
turtle.color("#b00", "#f88")
turtle.begin_fill()
for _ in range(36):
    turtle.circle(60, 60)
    turtle.left(120)
    turtle.circle(60, 60)
    turtle.left(10)
turtle.end_fill()
```

### Interacción con entrada:

```python
import turtle
lado = int(await input("Tamaño del lado: "))
turtle.color("black", "#9cf")
turtle.begin_fill()
for _ in range(4):
    turtle.forward(lado)
    turtle.left(90)
turtle.end_fill()
```

---

## 11) Accesibilidad y rendimiento

- En dispositivos modestos, muchos trazos pueden tardar más.
- Mantén tamaño del canvas razonable (por defecto 640x480).
- Evita bucles gigantes sin necesidad; disminuye `steps` en `circle()` si hace falta.xx

---

## 12) Soporte y Contribuciones

**IDE**: https://disenioweb2025.github.io/ide_basico_python/
Para reportar problemas, sugerir mejoras o contribuir al proyecto:
- Revisar la documentación técnica en los comentarios del código
- Testear en múltiples navegadores antes de reportar bugs
- Si algo falla, abre la consola del navegador y comparte el error.
- Proponer mejoras pedagógicas, etc. pueden escribir a profe.eliza17@gmail.com
- **Contacto de la plataforma**: Creado con la ayuda de abacus.ai
---

## 13) Licencia / Créditos

**IDE-BASICO-PYTHON** © 2025 por [Prof. Elizabeth Izquierdo](https://creativecommons.org) 
está licenciado bajo [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).  
[![Licencia CC BY-NC-SA 4.0](https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
**Última actualización**: 2025-10-07
