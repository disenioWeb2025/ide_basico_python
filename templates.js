// templates.js
// Plantillas de código para el IDE de Python (Pyodide + input async + turtle)
// Nota: En este IDE, usá await input("...") en lugar de input("...")

window.PLANTILLAS = {
  // ========== 🎯 BÁSICOS ==========
  "hola_mundo": `print("Hola mundo")`,

  "saludo_con_input": `nombre = await input("¿Cómo te llamás? ")
print("Hola", nombre)`,

  "suma_dos_numeros": `a = int(await input("Ingresá un número: "))
b = int(await input("Ingresá otro número: "))
print("La suma es:", a + b)`,

  "promedio_tres": `print("Vamos a calcular el promedio de tres números")
n1 = float(await input("Número 1: "))
n2 = float(await input("Número 2: "))
n3 = float(await input("Número 3: "))
prom = (n1 + n2 + n3) / 3
print("El promedio es:", prom)`,

  // ========== 🔀 CONTROL DE FLUJO ==========
  "condicional_basico": `edad = int(await input("¿Cuántos años tenés? "))
if edad >= 13:
    print("Sos adolescente o mayor.")
else:
    print("Sos menor de 13.")`,

  "adivina_numero": `import random
numero = random.randint(1, 10)
print("Pensé un número entre 1 y 10")
intento = int(await input("Adiviná: "))
if intento == numero:
    print("¡Acertaste!")
else:
    print(f"No, era {numero}")`,

  "bucles_basico": `print("Contemos del 1 al 5")
for i in range(1, 6):
    print(i)`,

  "tabla_multiplicar": `n = int(await input("¿Qué tabla querés? (ej: 7) "))
for i in range(1, 11):
    print(f"{n} x {i} = {n*i}")`,

  "while_acumulador": `print("Sumaremos hasta que ingreses 0")
total = 0
while True:
    x = int(await input("Número (0 para terminar): "))
    if x == 0:
        break
    total += x
print("Total:", total)`,

  // ========== 🐢 GRÁFICOS CON TURTLE ==========
  "turtle_basico": `import turtle
t = turtle.Turtle()
t.speed(0)
t.color("blue")
for i in range(4):
    t.forward(100)
    t.left(90)
turtle.done()`,

  "turtle_flor": `import turtle
t = turtle.Turtle()
t.speed(0)
t.color("purple")
for i in range(36):
    t.circle(60, 60)
    t.left(120)
    t.circle(60, 60)
    t.left(10)
turtle.done()`,

  "turtle_estrella": `import turtle
t = turtle.Turtle()
t.speed(0)
t.color("red")
for i in range(5):
    t.forward(150)
    t.right(144)
turtle.done()`,

  "turtle_petalos_rellenos": `import turtle
t = turtle.Turtle()
t.speed(0)
t.color("darkorange")
t.fillcolor("gold")
for i in range(18):
    t.begin_fill()
    t.circle(70, 70)
    t.left(110)
    t.circle(70, 70)
    t.end_fill()
    t.left(20)
turtle.done()`,

  "turtle_spiro_giro": `import turtle
t = turtle.Turtle()
t.speed(0)
t.color("teal")
for i in range(60):
    t.circle(80, 120)
    t.left(125)
turtle.done()`,

  "turtle_cuadricula": `import turtle
t = turtle.Turtle()
t.speed(0)
t.color("gray")
# Dibujar cuadrícula simple
for x in range(-200, 201, 40):
    t.penup()
    t.goto(x, -200)
    t.pendown()
    t.goto(x, 200)
for y in range(-200, 201, 40):
    t.penup()
    t.goto(-200, y)
    t.pendown()
    t.goto(200, y)
turtle.done()`,

  // ========== 🎮 PROYECTOS Y JUEGOS ==========
  "juego_piedra_papel_tijera": `import random
opciones = ["piedra", "papel", "tijera"]
comp = random.choice(opciones)
jug = (await input("Elegí piedra, papel o tijera: ")).strip().lower()
print("Computadora eligió:", comp)
if jug == comp:
    print("Empate")
elif (jug == "piedra" and comp == "tijera") or (jug == "papel" and comp == "piedra") or (jug == "tijera" and comp == "papel"):
    print("¡Ganaste!")
else:
    print("Perdiste :(")`,

  "funcion_area_circulo": `import math
r = float(await input("Radio del círculo: "))
def area_circulo(r):
    return math.pi * r * r
print("Área:", area_circulo(r))`,

  "fizzbuzz": `n = int(await input("Hasta qué número? "))
for i in range(1, n+1):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)`,

  "random_dados": `import random
print("Tirar dos dados:")
d1 = random.randint(1, 6)
d2 = random.randint(1, 6)
print("Salieron:", d1, "y", d2, "=> Total:", d1 + d2)`,

  "menu_simple": `def menu():
    print("1) Saludar")
    print("2) Sumar 2 números")
    print("3) Salir")

while True:
    menu()
    op = (await input("Opción: ")).strip()
    if op == "1":
        nombre = await input("Tu nombre: ")
        print("Hola", nombre)
    elif op == "2":
        a = int(await input("A: "))
        b = int(await input("B: "))
        print("Suma:", a + b)
    elif op == "3":
        print("Chau!")
        break
    else:
        print("Opción inválida")`,

  "input_y_casting": `texto = await input("Ingresá algo: ")
print("Tipo inicial:", type(texto).__name__)
try:
    n = int(texto)
    print("Lo pude convertir a entero. Doble:", n*2)
except ValueError:
    print("No es entero. Longitud del texto:", len(texto))`,
};

// Log para verificar que se cargó correctamente
console.log("✅ PLANTILLAS cargadas:", Object.keys(window.PLANTILLAS));

"manual_turtle_md": `# Manual rápido de Turtle (IDE)
Este IDE usa un canvas de 640×480. Origen (0,0) en la esquina superior izquierda. Centro en (320, 240). Eje Y crece hacia abajo.

## Crear tortuga y básico
- \`t = turtle.Turtle()\`
- \`t.speed(n)\`  (guarda el valor; no anima)
- \`t.showturtle()\` / \`t.st()\`
- \`t.hideturtle()\` / \`t.ht()\`
- \`turtle.done()\` (no bloquea)

## Posición y movimiento
- \`t.goto(x, y)\`
- \`t.setpos(x, y)\` / \`t.setposition(x, y)\`
- \`t.setx(x)\`, \`t.sety(y)\`
- \`t.home()\`  (centro y heading 0)
- \`t.forward(d)\` / \`t.fd(d)\`
- \`t.backward(d)\` / \`t.back(d)\` / \`t.bk(d)\`
- \`t.setheading(ang)\`, \`t.left(ang)\` / \`t.lt(ang)\`, \`t.right(ang)\` / \`t.rt(ang)\`

Notas de coordenadas:
- Origen (0,0) arriba-izquierda. Centro (320, 240). Y positivo hacia abajo.

## Pluma y colores
- \`t.penup()\`, \`t.pendown()\`, \`t.isdown()\`
- \`t.width(w)\` / \`t.pensize(w)\`
- \`t.pencolor(color)\`, \`t.fillcolor(color)\`
- \`t.color(linea)\` o \`t.color(linea, relleno)\`
- \`turtle.bgcolor(color)\` (fondo del canvas)

Colores aceptan nombres CSS (p. ej. "red", "teal", "gold") o hex (p. ej. "#ff0000").

## Figuras y rellenos
- \`t.dot(size=3, color=None)\`
- \`t.circle(radius, extent=None, steps=None)\`
  - radius > 0: gira a la izquierda; radius < 0: a la derecha
  - extent: arco en grados (por defecto 360)
  - steps: cantidad de segmentos (opcional)
- \`t.begin_fill()\`, \`t.end_fill()\`

## Atajos del módulo (sin crear 't')
- \`turtle.bgcolor(c)\`, \`turtle.color(...)\`, \`turtle.pensize(w)\`
- \`turtle.penup()\`, \`turtle.pendown()\`
- \`turtle.forward(d)\`, \`turtle.left(a)\`, \`turtle.right(a)\`
- \`turtle.circle(r, extent=None, steps=None)\`
- \`turtle.begin_fill()\`, \`turtle.end_fill()\`, \`turtle.dot(...)\`
- \`turtle.setheading(a)\`, \`turtle.goto(x, y)\`
- \`turtle.Turtle()\` (nueva tortuga)
- \`turtle.reset()\` (resetea la tortuga por defecto)

## Ejemplos
Cuadrado:
\`\`\`python
import turtle
t = turtle.Turtle()
t.color("blue")
for _ in range(4):
    t.forward(100)
    t.left(90)
\`\`\`

Estrella:
\`\`\`python
import turtle
t = turtle.Turtle()
t.color("red")
for _ in range(5):
    t.forward(150)
    t.right(144)
\`\`\`

Relleno:
\`\`\`python
import turtle
t = turtle.Turtle()
t.color("black", "gold")
t.begin_fill()
for _ in range(4):
    t.forward(120)
    t.left(90)
t.end_fill()
\`\`\`

Arcos:
\`\`\`python
import turtle
t = turtle.Turtle()
t.circle(60)        # círculo
t.circle(80, 180)   # medio círculo
\`\`\`

## Coordenadas centradas (opcional)
\`\`\`python
import turtle
t = turtle.Turtle()
W, H = 640, 480

def goto_centered(x, y):
    t.goto(W/2 + x, H/2 - y)

t.penup(); goto_centered(0, 0); t.pendown()
goto_centered(100, 0)
goto_centered(100, 100)
goto_centered(0, 100)
goto_centered(0, 0)
\`\`\`

## Diferencias vs turtle estándar
- Origen arriba-izquierda y Y positiva hacia abajo.
- \`speed()\` no anima; \`done()\` no bloquea.
- Subconjunto de funciones usado en el IDE.
`,
