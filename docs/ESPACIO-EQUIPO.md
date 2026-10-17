# Espacio institucional de SendIA

El espacio de equipo reúne planes aprobados y su seguimiento entre profesionales y familias. Es independiente de:

- **Colaboración**, que conserva la preparación local de acuerdos.
- **Lluvia de ideas**, que conserva sus tableros sincronizados y códigos de invitación propios.

## Activarlo

1. En Supabase, abre **SQL Editor → New query**.
2. Copia y ejecuta el contenido de `supabase/migrations/202610180001_institutional_workspace.sql`.
3. En **Authentication → Providers**, habilita el acceso por correo electrónico.
4. En **Authentication → URL Configuration**, permite la URL de tu aplicación, por ejemplo `http://localhost:3000/colaboracion/equipo`, y la URL equivalente de producción.
5. Usa la URL y la clave pública de Supabase que ya usa SendIA. No añadas una clave `service_role` al navegador.
6. Reinicia la aplicación y abre `/colaboracion/equipo`.

## Recorrido

1. La persona administradora inicia sesión mediante el enlace recibido por correo y crea el espacio de su centro.
2. Desde **Gestión del equipo**, crea un código con el rol previsto y lo comparte directamente con esa persona adulta.
3. La persona invitada inicia sesión con su correo, introduce el código y queda incorporada con el rol asignado.
4. Un perfil profesional selecciona un plan aprobado guardado en ese navegador, revisa el alias y decide si lo comparte con el equipo o también con una persona familiar concreta.
5. Las personas autorizadas añaden perspectivas, observaciones, acciones y revisiones. El seguimiento se sincroniza con Supabase.

## Roles y límites

- **Administración:** gestiona códigos y miembros.
- **Coordinación, docencia y orientación:** consultan y actualizan los planes del equipo.
- **Familia:** solo ve los planes compartidos explícitamente con su cuenta y puede aportar su perspectiva.
- La lluvia de ideas sigue en `/colaboracion/ideas`, separada de este seguimiento institucional.

El código es una credencial portadora: quien lo recibe puede usarlo mientras siga vigente. El correo confirma acceso a una cuenta, pero no verifica por sí mismo la función profesional ni la autorización del centro. El prototipo no acredita cumplimiento legal ni está preparado para alojar datos identificables o informes de menores. Usa alias, minimiza el contenido compartido y valida el modelo de acceso y protección de datos del centro antes de un despliegue real.
