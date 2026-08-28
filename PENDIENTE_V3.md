# Estado actual · RUTI V3 PC/móvil

Actualizado el 27/08/2026. La versión V3 está terminada y verificada; este archivo queda como punto de continuación si se amplía más adelante.

## Terminado

- Una sola interfaz responsive para PC, móvil en retrato y móvil en horizontal.
- PWA instalable, `viewport-fit=cover`, safe areas, iconos y funcionamiento sin conexión con caché V7.
- Navegación Hoy, Plan, Progreso y Perfil adaptada a teclado y controles táctiles.
- Modo enfoque, temporizador persistente, rondas, códigos de mapa y registro de tiempo real.
- Plan semanal, metas, recomendaciones, torneos, revisiones y analíticas.
- Perfil, recordatorios, respaldo completo y plantillas compartibles entre dispositivos.
- Migración automática V1/V2 → V3 con respaldo de la versión anterior.
- Onboarding V3, instalación desde Perfil/menú y cierre accesible de menús/confirmaciones.

## Verificación final

- `tests/smoke_test.py`: PASS.
- `tests/v2_features_test.py`: PASS sobre esquema V3.
- `tests/v3_features_test.py`: PASS, incluida carga offline y vista móvil.
- Auditoría visual PC 1440×1000 y 1024×768: PASS.
- Auditoría móvil 390×844 y 844×390: PASS, sin overflow ni solapes entre timer y navegación.
- Sin `pageerror` ni errores de consola en los recorridos auditados.

## Posibles ampliaciones futuras

- Sincronización automática entre dispositivos requeriría un backend y cuentas; actualmente se usa Exportar/Importar respaldo.
- Las notificaciones fiables con la aplicación cerrada requieren push/backend o calendario; los recordatorios actuales funcionan dentro de RUTI.
- Conviene comprobar el teclado virtual y las safe areas en un iPhone/Android físico antes de una publicación pública.

Para iniciar en PC: doble clic en `iniciar-ruti.bat` o ejecuta `python -m http.server 4173`.
