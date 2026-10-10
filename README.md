# SendIA

Prototipo educativo para que familias y profesionales de la educación ordenen observaciones, exploren posibilidades y acuerden pasos pequeños y revisables. No diagnostica ni atribuye conductas automáticamente a las altas capacidades.

## Desarrollo

Requiere Node.js 20.9 o posterior para la aplicación. Las pruebas y CI usan Node.js 22.

```bash
npm ci
npm run dev
```

## Módulos

- `/`: página pública de bienvenida.
- `/espacio`: inicio de demostración con datos ficticios.
- `/comprender`: recorrido de Alex, un caso ficticio que se usa en la demo principal.
- `/planes/plan-aula`: revisión y seguimiento de propuestas aprobadas.
- `/beta/docentes/acceso` y `/beta/docentes/casos`: área de demostración docente separada, con doce casos ficticios. Las credenciales visibles en la pantalla son solo una simulación de acceso; no constituyen autenticación ni protegen datos reales.
- `/colaboracion`: prototipo de colaboración.
- `/impacto`: cuestionario exploratorio de pilotaje, datos locales y exportaciones CSV.

## IA generativa

Copia `.env.example` a `.env.local` y define `GEMINI_API_KEY` en el servidor. Puedes configurar `GEMINI_MODEL`; el valor por defecto es `gemini-3.5-flash-lite`. Verifica que `GEMINI_MODEL` existe en tu cuenta; si no, el endpoint devolverá un error 404 controlado. No expongas la clave con el prefijo `NEXT_PUBLIC_`.

En `/comprender`, la persona adulta describe una situación, responde preguntas adaptativas y revisa una orientación estructurada. La propuesta distingue hechos, interpretaciones e información pendiente; propone hipótesis prudentes y diversificación según los principios del DUA. La persona revisa y aprueba cualquier plan antes de guardarlo en el almacenamiento local del navegador. El servidor no guarda el texto, pero este sí se transmite al proveedor de IA tras el consentimiento.

La ruta aplica límites de tamaño y frecuencia. `SENDIA_MAX_AI_REQUESTS_PER_HOUR` configura el máximo global por hora (120 por defecto). Los contadores de solicitudes son en memoria: para producción con varias instancias se necesita un almacén externo, como Redis/Upstash, y autenticación. No se implementan aquí.

## Privacidad y uso responsable

El filtro de datos identificativos es heurístico. Detecta algunos correos, teléfonos, DNI/NIE, centros educativos y nombres compuestos, pero no detecta nombres de pila aislados ni todos los datos identificativos. No anonimiza el texto; si detecta un posible identificador, bloquea el envío. Las demostraciones usan exclusivamente situaciones ficticias.

No uses SendIA con datos reales de menores hasta contar con una base legal, un contrato de encargado de tratamiento y una evaluación de impacto en protección de datos. No es un producto clínico ni sustituye al equipo de orientación. Las respuestas generadas requieren revisión humana.

## Pilotaje

En `/impacto`, las respuestas se guardan localmente en el navegador. Cada participante puede exportar sus respuestas anónimas, que contienen perfil, fase, valores, un identificador aleatorio de emparejamiento y solo el mes. Para evaluar un grupo, cada participante exporta su archivo y la persona coordinadora reúne los archivos. Las medias se muestran por perfil, sin combinar docentes, familias y profesionales.

El instrumento es exploratorio y no está validado. Mide percepción de utilidad del marco, no cambios en el alumnado ni efectos causales. No hay resultados ficticios cargados en la herramienta.

## Comprobaciones

```bash
npx tsc --noEmit
npm test
npm run build
```

La integración continua ejecuta estas comprobaciones en cada push y pull request con Node.js 22.

## Licencia

El repositorio aún no declara una licencia. La persona propietaria debe elegirla antes de añadir un archivo `LICENSE`.
