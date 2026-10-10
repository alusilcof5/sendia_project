# SendIA

Prototipo educativo para explorar situaciones, organizar observaciones y proponer pasos educativos revisables.

## Desarrollo

Requiere Node.js 20.9 o posterior.

```bash
npm install
npm run dev
```

La aplicación usa Next.js App Router, TypeScript y Tailwind CSS. El caso Alex y sus ramas siguen siendo ficticios y predefinidos. El recorrido de situación propia puede usar IA generativa mediante la API `generateContent` de Gemini; la clave solo se lee en el servidor y la persona adulta confirma antes de enviar texto. No escribas nombres ni datos identificativos de menores. El cuestionario de pilotaje guarda respuestas anónimas solo en el navegador y exporta medias agregadas. SendIA no diagnostica ni atribuye conductas automáticamente a las altas capacidades.

## Módulos

- `/`: bienvenida editorial de SendIA.
- `/espacio`: Inicio con planes, tareas y accesos rápidos.
- `/comprender`: la demo principal del caso ficticio de Alex; se reserva para Alex y el recorrido propio del espacio principal.
- `/planes/plan-aula`: plan editable y seguimiento.
- /beta/docentes/acceso y /beta/docentes/casos: beta docente independiente con diez ejemplos ficticios. Credenciales: docente@sendia.demo / sendia-demo. Es un prototipo local y no protege datos reales.
- `/colaboracion` y `/impacto`: experiencias demostrativas sin datos reales.

## Probar el caso

En `/comprender`, selecciona **Explorar el caso de Alex**. Recorre las observaciones iniciales, compara hipótesis, elige una pregunta y prueba las tres ramas:

1. Dominio diferente según la tarea.
2. Aún faltan datos.
3. Un dato cuestiona la hipótesis de falta de reto.

Cada rama actualiza los estados de las hipótesis y propone un siguiente paso con responsable, indicador y momento de revisión. La decisión final es provisional y se acepta solo en la sesión de demostración.

## IA generativa

Copia `.env.example` a `.env.local` y define `GEMINI_API_KEY` en el servidor. Opcionalmente define `GEMINI_MODEL`; por defecto se usa `gemini-3.5-flash-lite`, un modelo de baja latencia adecuado para preguntas y propuestas breves. No expongas la clave con el prefijo `NEXT_PUBLIC_`. Si antes usabas OpenAI, configura Gemini en el entorno y elimina la variable antigua cuando confirmes que ya no la necesitas. Sin clave, la demo de Alex sigue disponible y el modo propio informa que la generación no está configurada.

En el recorrido propio, la IA genera hasta tres preguntas adaptativas según las respuestas previas y después organiza observaciones, información pendiente, hipótesis abiertas y un paso revisable. La persona adulta puede editar los campos, aprobar la propuesta y abrirla en Mis planes. El endpoint de Gemini aplica límites de longitud y frecuencia, solicita salida JSON estructurada, la valida con esquemas tipados y no persiste el texto en SendIA. El texto sí se transmite al proveedor al confirmar el aviso; esta integración no debe usarse con datos identificativos de menores.

## Instrumento de pilotaje

En `/impacto`, una persona adulta puede registrar una línea inicial, explorar SendIA y completar un seguimiento. El navegador guarda respuestas numéricas sin nombres ni datos de estudiantes y muestra medias solo para pares completos. La exportación CSV contiene exclusivamente medias y número de respuestas emparejadas. El instrumento es exploratorio, no está validado, y no prueba que SendIA cause cambios. Los resultados solo existen después de realizar un pilotaje real; no se incluyen métricas ficticias.

La compilación de producción se comprueba con:

```bash
npm run build
```
# sendia_project
