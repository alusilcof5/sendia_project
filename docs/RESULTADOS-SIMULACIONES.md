# Simulaciones de SendIA

**Fecha:** 12 de octubre de 2026  
**Tipo:** recorrido cognitivo y pruebas de contrato con escenarios ficticios  
**Participantes reales:** ninguno  
**Respuestas generadas en vivo por Gemini:** ninguna  
**Evaluación independiente de profesionales:** pendiente

Este documento registra simulaciones internas para encontrar riesgos antes de invitar a personas. No representa entrevistas, pruebas de usabilidad, respuestas reales de Gemini ni consenso de docentes o especialistas. No debe presentarse como evidencia de impacto o validación profesional.

## 1. Cinco recorridos cognitivos de personas adultas ficticias

Se recorrieron mentalmente las pantallas y textos de `/comprender` siguiendo cinco objetivos de uso. “Previsión” significa una lectura experta del diseño, no una conducta observada.

| Perfil simulado | Objetivo | Previsión de comprensión | Duda o riesgo detectado |
|---|---|---|---|
| Docente que entra por primera vez | Empezar un caso y distinguir observación de explicación. | La consigna inicial invita a describir algo observable; se entiende que no es una evaluación diagnóstica. | Hay tres entradas distintas (situación propia, demo preparada y caso de Alex con Gemini); podrían competir por atención. |
| Familiar que desconoce la meta escolar | Continuar sin inventar la meta. | El paso de contexto explica que puede dejar campos vacíos y que la meta se aclarará primero. | La persona puede no saber si dejar el campo vacío es una respuesta válida o si debe volver atrás. Hace falta comprobarlo con usuarios. |
| Docente ante rendimiento desigual y posible AACC | Registrar lo que sabe sin convertirlo en etiqueta. | La interfaz permite incluir fortalezas, intereses y apoyos reportados; el prompt prohíbe inferir AACC. | Fortalezas e intereses están dentro de “Añadir más contexto”; pueden pasar desapercibidos aunque sean pedagógicamente relevantes. |
| Profesional de orientación con datos contradictorios | Revisar qué falta y proponer una observación, no una conclusión. | La respuesta estructurada permite presentar hipótesis alternativas, información pendiente y evidencia nueva. | La calidad de esa actualización depende de Gemini; el esquema no comprueba si la interpretación está realmente sostenida por el caso. |
| Docente que quiere coordinarse con la familia | Guardar un siguiente paso y compartirlo. | “Mis planes” permite recuperar la decisión guardada en el mismo navegador. | La colaboración no sincroniza cuentas ni dispositivos. El paso compartido requiere preparación y envío manual; no debe describirse como colaboración integrada. |

### Hallazgo de interfaz verificable

Cuando la voz del estudiante figura como pendiente, la pantalla presenta una pregunta sugerida, pero permite elegir y guardar una estrategia igualmente. El flujo no tiene una condición que obligue a recoger esa voz cuando la propuesta depende de ella. La herramienta debería marcar con más claridad cuándo conviene preguntar primero o permitir guardar ese paso de consulta como la opción recomendada.

## 2. Cinco respuestas pedagógicas de prueba

Se escribieron cinco objetos de respuesta ficticios como fixtures y se pasaron por el parser actual. Sirven para comprobar que el esquema admite los casos pedagógicos descritos y rechaza una opción sin evidencia. **No son salidas de Gemini ni prueban que el modelo vaya a cumplir las instrucciones.**

| Caso | Escenario | Comprobación automatizada | Resultado del fixture |
|---|---|---|---|
| S01 | Falta la meta | Debe ofrecer solo una pregunta para aclararla; no alternativas de adaptación. | Aceptado por el parser. |
| S02 | Solo hay una observación | Puede priorizar recabar datos y no forzar tres opciones DUA. | Aceptado por el parser. |
| S03 | La perspectiva del estudiante sí fue aportada | Puede etiquetarla como conocida, sin presentarla como inferencia. | Aceptado por el parser. |
| S04 | La perspectiva aportada es contradictoria | Permite conservar la discrepancia y plantear una pregunta situada. | Aceptado por el parser. |
| S05 | Coexisten rapidez en tareas rutinarias y necesidad de apoyo en tareas abiertas | Conserva la meta, presenta una ruta con reto y apoyo, y no atribuye la diferencia a un diagnóstico. | Aceptado por el parser. |

Una sexta aserción negativa verificó que el parser rechace una opción sin evidencia explícita. Resultado: rechazada, como se esperaba. Estas comprobaciones son estructurales; no evalúan si una respuesta es viable en un aula concreta o si su evidencia está bien interpretada.

## 3. Comprobaciones ejecutadas

- `npx tsc --noEmit`: pasó.
- `npm test`: pasó, incluidos los cinco fixtures simulados.
- La prueba de endpoint usa una respuesta simulada y no llama a Gemini.
- No se ejecutó `npm run eval:gemini` contra el proveedor en esta simulación.
- No se realizaron sesiones con docentes/familias ni revisión independiente de profesionales.

## 4. Siguiente paso para obtener evidencia real

Invitar a 3–6 personas adultas voluntarias —docentes y familiares— y observar el recorrido sin explicarles los controles. Registrar finalización, necesidad de ayuda, confusión y si pueden explicar la meta, la opción elegida y el siguiente paso. Después, dos profesionales educativos deben valorar respuestas de Gemini por separado usando la rúbrica de [evaluación de IA](EVALUACION-IA.md). Informar cualquier resultado como una prueba pequeña, sin generalizar ni llamarlo impacto.
