# Prompt para Perplexity — análisis competitivo de Free Me

Copia y pega el bloque siguiente en Perplexity (mejor en modo **Research / Deep Research** si lo tienes).
Debajo hay tres preguntas de seguimiento.

---

## Prompt principal

```
Actúa como analista de producto en fintech. Necesito un análisis competitivo riguroso, con fuentes
y enlaces, sobre si ya existen aplicaciones equivalentes a la que describo. Busca en fuentes en
inglés y en español (Australia, EE. UU., Reino Unido, Europa y Latinoamérica).

EL PRODUCTO (se llama "Free Me"):
Aplicación web (móvil planeada) de educación y orientación financiera personalizada, dirigida
sobre todo a jóvenes: estudiantes universitarios y gente que empieza su carrera. Contexto inicial
Australia. Funciona así:

1. La persona escribe en una frase qué significa "libertad financiera" para ella (viajar, comprar
   casa, dejar un trabajo, sentirse segura) y rellena un perfil corto: ingresos y gastos mensuales,
   ahorros, deudas, objetivos con importe y fecha, nivel de conocimiento financiero y tolerancia
   al riesgo.
2. Un motor de reglas determinista calcula TODAS las cifras (colchón de emergencia objetivo, tasa
   de ahorro, meses hasta cada objetivo, ratio deuda/ingreso, cuánto hace falta ahorrar al mes).
   Un modelo de lenguaje (Claude) NO hace aritmética: recibe esas cifras ya calculadas y genera la
   ESTRUCTURA del plan y las explicaciones.
3. El resultado es un único objeto "plan" que se muestra de dos maneras intercambiables con un
   botón:
   - Modo Explore: un mapa visual del recorrido, con zonas (fundamentos, colchón de seguridad,
     hábito de ahorro, acciones y fondos, propiedad, negocio propio, cripto, y una zona por cada
     objetivo personal) conectadas por "puentes", y una "Freedom City" como destino.
   - Modo Professional: el mismo plan como panel de control sobrio (posición actual, prioridad,
     próximos pasos con barras de progreso, tabla de caminos con relevancia en estrellas).
4. Los "puentes" representan compensaciones reales entre objetivos: por ejemplo "el dinero que
   pones en inversión a largo plazo no está disponible para el viaje dentro de 18 meses".
5. Cada zona, puente y paso lleva un "por qué" en lenguaje llano escrito con las cifras de esa
   persona concreta. Hay un botón "¿Por qué?" para pedir una explicación más profunda.
6. Cada camino (acciones/ETFs, propiedad, negocio, cripto) recibe una puntuación de relevancia de
   1 a 5 ESPECÍFICA para esa persona, con su justificación honesta (por ejemplo, cripto con una
   estrella para alguien con perfil moderado y un objetivo a 18 meses).
7. Catálogo de lecciones cortas que el modelo reescribe para el nivel y los objetivos de la
   persona ("personalizar esta lección para mí").
8. Función "tengo X dinero, ¿qué hago con él?": propone un reparto entre las partes del plan, con
   una razón por cada partida, y la persona puede ajustarlo con deslizadores.
9. Restricción central de diseño: es EDUCACIÓN, NO ASESORAMIENTO. Nunca nombra productos
   concretos, tickers, fondos, brókeres, bancos, exchanges ni criptomonedas específicas, y nunca
   dice "deberías comprar X". Hay un validador automático que bloquea el plan si el modelo lo
   intenta. No conecta cuentas bancarias ni importa transacciones; los datos los introduce la
   persona.

LO QUE NECESITO:

A) Un inventario de productos existentes que se solapen con esto, agrupados por categoría:
   1. Planificadores o "coaches" financieros con IA que generan un plan personalizado.
   2. Apps de educación financiera gamificada (estilo Duolingo para finanzas).
   3. Apps de presupuesto/objetivos que incluyan una hoja de ruta o "journey".
   4. Roboadvisors o plataformas de inversión con capa educativa fuerte.
   5. Herramientas de planificación financiera para jóvenes o estudiantes en concreto.
   Incluye tanto productos vivos como cerrados o adquiridos (indícalo).

B) Para cada producto relevante, una fila de tabla con: nombre, país, año de lanzamiento, estado
   (activo / cerrado / adquirido), público objetivo, modelo de negocio y precio, si usa IA
   generativa para crear un plan personalizado (sí/no/parcial), si muestra el plan como un
   recorrido o mapa visual, si ofrece dos modos de visualización del mismo plan, si conecta
   cuentas bancarias, si se posiciona como educación o como asesoramiento regulado, y financiación
   o tamaño si se conoce.

C) Una respuesta directa y sin rodeos a estas preguntas:
   - ¿Existe hoy algún producto que combine las cinco cosas a la vez: (i) plan generado por IA a
     partir de un perfil, (ii) cifras calculadas de forma determinista y no por el modelo,
     (iii) representación como mapa/recorrido visual, (iv) el mismo plan conmutable a un panel
     profesional, y (v) posicionamiento explícito de educación sin nombrar productos?
   - Si no existe la combinación completa, ¿qué producto se acerca más y en qué se queda corto?
   - ¿Qué partes de nuestra propuesta son claramente "commodity" (ya resueltas por varios) y
     cuáles son inusuales?

D) La dimensión regulatoria: cómo se posicionan estos productos respecto a la frontera entre
   información general y asesoramiento financiero personal, con atención especial a Australia
   (ASIC, licencia AFS, "general advice" frente a "personal advice") y menciones a EE. UU. (SEC/
   FINRA) y Reino Unido/UE si aplica. Cita la fuente normativa cuando afirmes algo.

E) Huecos de mercado: qué NO está cubierto hoy y podría justificar este producto.

REGLAS PARA TU RESPUESTA:
- Cita fuentes con enlace y fecha en cada afirmación relevante. Prefiere fuentes primarias (webs
  de producto, prensa especializada, documentos regulatorios) sobre listas de blogs SEO.
- Si algo no lo puedes verificar, dilo explícitamente en lugar de suponerlo. Distingue claramente
  entre "lo dice la web del producto" y "lo dice un tercero".
- Señala cualquier producto que ya no exista o que haya pivotado, con la fecha.
- Termina con un veredicto de una sola frase sobre el grado de originalidad de la propuesta.
```

---

## Preguntas de seguimiento

1. **Australia y regulación**
   ```
   Céntrate solo en Australia. ¿Qué apps de educación o planificación financiera dirigidas a
   jóvenes operan allí hoy, cómo se describen legalmente (educación, "general advice" o "personal
   advice" bajo licencia AFS) y qué avisos legales muestran? Incluye enlaces a sus términos o
   avisos y a la guía de ASIC aplicable, con fechas.
   ```

2. **Precedentes de la metáfora visual**
   ```
   ¿Qué productos financieros han usado una metáfora de mapa, mundo, camino o árbol para
   representar el progreso de una persona, y qué se sabe de sus resultados (retención, críticas de
   usuarios, si lo abandonaron)? Incluye también intentos fallidos y por qué fallaron.
   ```

3. **Modelo de negocio**
   ```
   Para los productos de la categoría "coach financiero con IA" y "educación financiera
   gamificada": ¿cómo monetizan (suscripción, freemium, afiliación, B2B con bancos o
   universidades), a qué precio, y hay datos públicos de tamaño o financiación? Ordénalos por
   evidencia disponible.
   ```
