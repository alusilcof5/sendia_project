# Activar la lluvia de ideas en tiempo real

El tablero usa Supabase para guardar salas y notas, sincronizar cambios en tiempo real y limitar cada sala a participantes que se unieron con su código.

## Configuración

1. Crea un proyecto Supabase.
2. En **Authentication → Providers**, habilita **Anonymous Sign-Ins**.
3. Ejecuta `supabase/migrations/202610160001_idea_boards.sql` desde el SQL Editor de Supabase.
4. Copia Project URL y la clave `anon`/publishable al `.env.local` local y al entorno de despliegue:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU-CLAVE-PUBLICA
   ```

5. Reinicia Next.js. Cada persona crea o recupera una sesión anónima desde su navegador. Una persona crea la sala y comparte el código; las demás lo introducen para unirse. Por compatibilidad también se acepta `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

No publiques una clave `service_role` ni uses información identificable de estudiantes. El código de invitación es una credencial de acceso: compártelo únicamente con las personas adultas acordadas.

## Alcance

- Las notas se sincronizan por Supabase Realtime. La persona creadora puede eliminar la sala; al borrarla se eliminan en cascada sus notas, votos y membresías.
- Un participante puede editar y borrar sus propias notas. Las demás personas pueden leerlas y apoyarlas con un voto.
- Las cuentas son anónimas y locales al navegador; no hay recuperación de sesión entre dispositivos, nombres verificados, caducidad/revocación del código ni invitaciones por correo.
- La política RLS restringe lectura y escritura a miembros. Antes de producción se recomienda añadir límites antiabuso, caducidad y revocación de invitaciones, controles de conservación/borrado, CAPTCHA para registro anónimo y pruebas de políticas con roles reales.
- El tablero está pensado para coordinar personas adultas. No incluyan nombres, diagnósticos ni información sensible de estudiantes.
