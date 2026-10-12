# Piloto breve de comprensión y uso

## Propósito y límites

Este piloto comprueba si personas adultas entienden y pueden recorrer SendIA. No mide aprendizaje del estudiante, no demuestra que SendIA cause cambios y no valida el cuestionario de Impacto. Se prueba con docentes, familiares u otras personas adultas voluntarias; nunca se piden datos reales de menores.

## Preparación

1. Invita a entre 3 y 6 personas adultas. El grupo pequeño sirve para detectar problemas de uso, no para generalizar resultados.
2. Explica que se evalúa la herramienta, no a la persona, que participar es voluntario y que puede detenerse cuando quiera.
3. Usa la demo preparada de Alex (`/comprender?modo=demo`) o, si se quiere probar Gemini, una de las once situaciones ficticias de `src/lib/evaluation-cases.ts`.
4. No grabes audio, video, pantalla ni nombres salvo consentimiento separado y necesidad justificada. La plantilla no solicita identidad, institución, ubicación ni información de estudiantes.
5. Usa un perfil de navegador temporal. Al terminar, limpia los datos locales desde `/datos`.

## Guion de tareas

Lee las instrucciones una por una, sin explicar los controles. Registra el tiempo desde que se muestra cada tarea hasta que la persona la completa o decide detenerse.

| N.º | Tarea para la persona participante | Señal de finalización |
|---|---|---|
| 1 | Desde la página de inicio, explica con tus palabras para qué sirve SendIA y para qué no sirve. | Distingue reflexión pedagógica de diagnóstico. |
| 2 | Abre la demo preparada de Alex y señala qué se observó y qué todavía no se sabe. | Identifica al menos una observación y una pregunta pendiente. |
| 3 | Elige qué dato averiguar y avanza hasta la nueva evidencia. | Completa la selección sin indicaciones de la persona facilitadora. |
| 4 | Explica qué interpretación se mantiene, se matiza o queda en duda después del dato. | Usa lenguaje de posibilidad y menciona otra explicación o incertidumbre. |
| 5 | Identifica el paso pequeño, quién lo realiza y qué se observaría después. | Puede expresar acción e indicador de revisión. |
| 6 | Indica qué harías si Gemini no responde y si el plan se guarda en la demo preparada. | Encuentra el respaldo simulado y comprende que no se generó en vivo ni se guardó. |

## Registro y datos

La persona facilitadora puede completar una fila por tarea con un código aleatorio de sesión (por ejemplo, `R-01`), perfil amplio opcional (`docente`, `familiar`, `otro`), finalización (`sí`, `con ayuda`, `no`), duración aproximada, punto de confusión y comprensión del siguiente paso (`sí`, `parcial`, `no`). No escribas citas que puedan revelar identidad ni contenido de situaciones personales.

No hay un mecanismo automático de almacenamiento del piloto. Completa la plantilla de abajo en papel o en una copia local de `docs/PLANTILLA-PILOTO.md`; no la subas al repositorio ni la envíes con datos de participantes. Resume solo conteos descriptivos y observaciones recurrentes, indicando siempre el número pequeño de sesiones. Destruye las hojas o elimina el archivo local al cerrar el análisis y, como máximo, 30 días después del fin del hackatón. En una sesión de aplicación, borra los registros locales desde `/datos` y cierra la ventana privada del navegador.

## Plantilla rápida

| Código aleatorio | Perfil amplio opcional | Tarea | ¿Completó? sí / con ayuda / no | Tiempo aprox. | ¿Qué confundió? | ¿Explica el siguiente paso? sí / parcial / no |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

**Comentario final opcional:** ¿Qué parte cambiarías primero? __________________________________

## Cómo informar los hallazgos

- Separa observaciones de opiniones y de resultados de Gemini.
- Indica cuántas sesiones se realizaron, qué tareas se probaron y qué no se probó.
- No llames “impacto” a la tasa de finalización ni a la satisfacción.
- No presentes los resultados del pequeño grupo como representativos.
- No marques entrevistas o pruebas como realizadas hasta que efectivamente ocurran.
