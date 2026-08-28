# RUTI v3 · Fortnite Training Planner

Aplicación instalable y adaptable para PC y móvil, creada para entrenar con intención, preparar torneos y medir el progreso real.

## Funciones

- Rutinas semanales, cambios por fecha, plantillas rápidas y copia de días/semanas.
- Navegación separada para Hoy, Plan, Progreso y Perfil.
- Modo enfoque a pantalla completa con temporizador persistente, rondas y código de mapa.
- Corrección del tiempo real, rondas y valoración al terminar cada tarea.
- Objetivos, rondas, códigos de mapas y enlaces para cada práctica.
- Objetivos semanales de minutos, días activos y categoría prioritaria.
- Recomendaciones explicables según torneos, tiempo disponible y revisiones anteriores.
- Torneos con cuenta regresiva, check-in, región, compañero, checklist, reglas y resultados.
- Revisión posterior, historial, racha, concentración, errores repetidos y tiempo por categoría.
- Perfil, ajuste automático al tiempo disponible y recordatorios dentro de la aplicación.
- Exportación a calendario, respaldo JSON y plantillas compartibles entre dispositivos.
- Diseño responsive con navegación táctil, modo horizontal y funcionamiento sin conexión.

## Usar en PC

En Windows, haz doble clic en `iniciar-ruti.bat`. Después puedes usar **Instalar RUTI** desde el menú superior o desde Perfil para abrirla como una aplicación independiente.

También puedes iniciar el servidor manualmente dentro de esta carpeta:

```powershell
python -m http.server 4173
```

Después abre `http://localhost:4173`.

## Usar en móvil

Publica esta carpeta en un alojamiento estático con HTTPS y abre la dirección desde el teléfono. En Android/Chrome usa **Instalar RUTI**; en iPhone/Safari usa **Compartir → Añadir a pantalla de inicio**. La interfaz cambia automáticamente para retrato y horizontal.

Para una prueba rápida dentro de la misma red puedes servirla con `python -m http.server 4173 --bind 0.0.0.0` y abrir la IP del PC desde el móvil. La instalación y el modo offline requieren HTTPS fuera de `localhost`.

Si ya usabas la versión anterior, RUTI migra automáticamente tus rutinas, progreso, notas y torneos al nuevo formato y conserva una copia de seguridad interna.

## Datos

Todo se guarda en `localStorage` dentro de cada navegador. Los datos no se sincronizan automáticamente: usa **Exportar/Compartir respaldo** e **Importar respaldo** para moverlos entre PC y móvil.

Los recordatorios del navegador funcionan mientras RUTI está abierta. Para un aviso fiable con la app cerrada, exporta el torneo a tu calendario desde su formulario.

## Pruebas

Las pruebas automatizadas usan Playwright y Microsoft Edge:

```powershell
python tests\smoke_test.py
python tests\v2_features_test.py
python tests\v3_features_test.py
```
