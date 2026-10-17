# Espacio privado: configuración y límites

La página `/espacio-seguro` añade acceso por enlace de correo y almacenamiento persistente de notas personales. Es una base técnica de cuenta individual; no es todavía un sistema institucional de expedientes ni una declaración de cumplimiento legal.

## Activación en Supabase

1. Aplica `supabase/migrations/202610170001_private_adult_records.sql` en el SQL Editor del proyecto Supabase de producción. La migración crea la tabla de registros y políticas RLS que limitan lectura, escritura, edición y borrado a la cuenta autenticada propietaria.
2. En **Authentication → Sign In / Providers**, habilita **Email** y el acceso mediante enlace de un solo uso (OTP/magic link).
3. En **Authentication → URL Configuration**, agrega como URL de redirección permitida `https://TU-DOMINIO/espacio-seguro`. En desarrollo agrega también `http://localhost:3000/espacio-seguro`.
4. Para uso real, configura un proveedor SMTP propio en Supabase y revisa límites y protección contra abuso del envío de correos.
5. En las variables de entorno de Vercel configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o la clave `NEXT_PUBLIC_SUPABASE_ANON_KEY` que ya use el proyecto). No pongas una clave `service_role` en variables `NEXT_PUBLIC_*` ni en el navegador.
6. Despliega de nuevo y prueba el acceso desde el dominio final. El enlace debe volver al mismo dominio en que se inició la solicitud.

## Qué hace esta versión

- Verifica que la persona puede abrir el correo y se autentica con una sesión individual de Supabase.
- Almacena alias, contexto, título, siguiente paso y una fecha opcional en Supabase.
- Aplica políticas de seguridad por fila (RLS) para que cada cuenta solo opere sobre sus propios registros.
- Permite exportar los registros de la cuenta como JSON y eliminarlos desde la interfaz.
- No envía el contenido de estos registros a Gemini.

## Límites importantes

- El enlace comprueba acceso al correo, no edad, identidad civil, profesión, pertenencia a un centro ni autorización institucional. La casilla de persona adulta es una declaración de la propia persona, no una verificación.
- Los registros son privados por cuenta. Todavía no hay cuentas de centro, roles, gestión de altas/bajas, administradores institucionales ni permisos para compartir expedientes entre docentes y familias.
- RLS es un control de autorización en la base de datos; no es cifrado de extremo a extremo. Revisa con el proveedor ubicación, cifrado de infraestructura, copias de seguridad, retención, subencargados y condiciones del servicio.
- El filtro de nombres/datos identificativos es una ayuda heurística que puede no detectar información personal. No debe considerarse una barrera de seguridad.
- El borrado desde la página elimina la fila activa. No garantiza purga inmediata de copias de seguridad ni de registros técnicos del proveedor.
- Esta área separada no cambia el envío a Gemini ni el almacenamiento local de otras secciones existentes.

## Antes de usar datos identificables de menores

La institución responsable debe decidir y documentar, según su contexto y normativa aplicable, quién es responsable del tratamiento, la base jurídica, la información a familias y estudiantes, los permisos necesarios, los plazos de conservación y borrado, el procedimiento para ejercer derechos, la gestión de incidentes y los contratos con proveedores. Debe valorar con su responsable de privacidad si corresponde una evaluación de impacto y revisar específicamente el flujo de datos de cada proveedor de IA.

Hasta completar esa revisión, utiliza casos ficticios o información verdaderamente anonimizada y no introduzcas datos identificables de estudiantes. La implementación técnica no constituye aprobación jurídica ni habilitación para ese uso.
