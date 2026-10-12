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
