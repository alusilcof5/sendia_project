# Decisiones del prototipo

- Se conserva Next.js App Router, TypeScript y Tailwind CSS existente; no se añadieron dependencias.
- El clic «Guardar este paso» es la aprobación explícita de la persona adulta. No se pide una segunda aprobación antes de guardar; después se puede editar o descartar en «Mis planes».
- Los casos ficticios de Alex y de la beta recorren el mismo componente. Los planes creados desde datos ficticios se marcan como `demo` y no se mezclan con información real de menores.
- El país es opcional y solo orienta el vocabulario general. La IA no debe citar leyes, cifras ni políticas locales.
- Los borradores para docente, familia y escuela se envían a Gemini solo después de aprobar el plan y aceptar expresamente el envío de sus campos. Se editan en memoria de la página, no se guardan ni se comparten automáticamente.
- Colaboración permite preparar y retomar en el mismo navegador un acuerdo de equipo con voz del estudiante, mirada familiar y escolar, responsable, indicador y fecha de revisión. No representa invitaciones, permisos efectivos ni sincronización entre usuarios; requiere autenticación y almacenamiento compartido antes de convertirse en colaboración multiusuario.
- Las cinco ilustraciones solicitadas son decorativas, no tienen texto alternativo y se muestran al 30 % de opacidad (70 % de transparencia). En pantallas pequeñas se oculta la franja del espacio personal para priorizar el contenido.
- El rate limit de la API vive en memoria local por instancia. No protege una instalación distribuida; producción requiere un almacén compartido y autenticación.
- El filtro de datos personales bloquea coincidencias directas y muestra una señal aproximada para nombres propios. Ninguna de las dos acciones demuestra que un texto esté anonimizado.

- La generación de comprensión se divide en funciones secuenciales de Gemini: pregunta adaptativa, síntesis trazable y planificación basada en esa síntesis. No son agentes autónomos; la interfaz dirige el flujo y el servidor valida cada salida.
- La acción de orientación cuesta dos llamadas a Gemini; cada pregunta adaptativa añade una llamada. El consentimiento explica el envío por fases.
- Las referencias de campos se validan en servidor y se muestran como procedencia en hipótesis y opciones. No constituyen verificación independiente de la veracidad o pertinencia de la salida.
- La evaluación profesional de la nueva versión queda pendiente: resultados técnicos anteriores no se reutilizan como prueba de calidad pedagógica.
- «Crear» permite generar, adaptar y modificar actividades desde una meta explícita; conserva el objetivo y propone rutas opcionales de representación, expresión y profundización sin asignarlas por diagnóstico o etiqueta. Una propuesta se edita antes de guardarse.
- Las actividades de «Crear» se guardan localmente bajo `sendia-created-activities-v1` en el navegador. No se sincronizan ni comparten y se eliminan con la opción general de borrar datos de SendIA.
- «Crear» acepta un único PDF (máximo 8 MB) o archivo TXT/Markdown (máximo 100 KB); el PDF se adjunta íntegro a Gemini y no hay extracción ni anonimización automática. La propuesta solo se puede descargar tras confirmar revisión docente; se exporta como HTML local y puede imprimirse/guardarse como PDF desde el navegador.
