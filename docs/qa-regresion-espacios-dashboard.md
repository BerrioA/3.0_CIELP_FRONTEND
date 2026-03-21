# QA Manual Guiada - Modulo Espacios (Dashboard)

## Objetivo

Validar regresion funcional del flujo docente de sesiones en Espacios y verificar acceso/comportamiento rapido por rol.

## Alcance

- Flujo docente: iniciar -> refrescar pagina -> finalizar sesion.
- Integridad visual: chips, alertas, historial y grafico semanal.
- Control de acceso por rol en /dashboard/espacios.

## Precondiciones

- Backend y frontend levantados en entorno local o QA.
- Usuario con rol DOCENTE activo y autenticado.
- Al menos 2 espacios digitales activos en catalogo.
- Navegador con DevTools habilitado (pestanas Network y Application).

## Datos sugeridos

- Docente: correo valido y verificado.
- Admin y Super Admin: usuarios activos para validacion de acceso lectura.
- Psicologo (si existe): usuario activo para validar restriccion de ruta.

## Flujo guiado principal (Docente)

1. Ingresar con usuario DOCENTE.
   Resultado esperado:
   - Navega a dashboard correctamente.
   - Ruta /dashboard/espacios disponible.

2. Ir a /dashboard/espacios.
   Resultado esperado:
   - Catalogo renderiza sin errores.
   - Se muestran filtros "Buscar por nombre" y "Tipo".
   - Chip "Sesion activa" inicia en "No" si no hay sesion previa.

3. Iniciar sesion en un espacio.
   Resultado esperado:
   - Boton cambia a "Finalizar sesion" en la tarjeta activa.
   - Alerta superior indica sesion activa y muestra contador en aumento.
   - Resto de tarjetas quedan bloqueadas para iniciar nueva sesion.
   - Request esperado: POST /api/spaces/start con 201.

4. Refrescar navegador (F5 / hard refresh).
   Resultado esperado:
   - Se recupera la sesion activa automaticamente.
   - Se conserva alerta de sesion activa y contador.
   - Chip "Sesion activa" permanece en "Si".
   - Request esperado: GET /api/spaces/active-session con 200.

5. Presionar boton Actualizar.
   Resultado esperado:
   - Refresca catalogo, estadisticas y sesion activa.
   - Sin errores de estado inconsistente en UI.
   - Requests esperados: GET /api/spaces, GET /api/spaces/stats, GET /api/spaces/active-session.

6. Finalizar sesion.
   Resultado esperado:
   - Desaparece alerta de sesion activa.
   - Aparece alerta de ultima sesion finalizada con duracion valida.
   - Chip "Sesion activa" cambia a "No".
   - Request esperado: PUT /api/spaces/end/:session_id con 200.

7. Validar historial y grafico semanal.
   Resultado esperado:
   - Historial reciente incluye la sesion cerrada.
   - Grafico semanal muestra barra(s) o mensaje informativo si no hay datos suficientes.

## Validaciones de filtros

1. Buscar por nombre parcial (ej: "resp").
   Resultado esperado:
   - Solo aparecen tarjetas que contienen el texto.

2. Filtrar por tipo especifico.
   Resultado esperado:
   - Solo aparecen tarjetas del tipo seleccionado.

3. Combinar busqueda + tipo sin coincidencias.
   Resultado esperado:
   - Se muestra estado vacio: "No hay resultados con los filtros aplicados".

## Checklist rapido por rol

### SUPER_ADMIN

- Puede entrar a /dashboard/espacios.
- Ve catalogo y filtros.
- No ve flujo de inicio/finalizacion de sesion docente.

### ADMIN

- Puede entrar a /dashboard/espacios.
- Ve catalogo y filtros.
- No ve flujo de inicio/finalizacion de sesion docente.

### DOCENTE

- Puede entrar a /dashboard/espacios.
- Puede iniciar sesion.
- Puede refrescar y recuperar sesion activa.
- Puede finalizar sesion.
- Ve historial y grafico semanal.

### DEVELOPER

- Puede entrar a /dashboard/espacios.
- Ve catalogo y filtros.
- No ejecuta flujo de inicio/finalizacion si no aplica por politica.

### PSYCHOLOGIST

- Debe quedar fuera de /dashboard/espacios segun reglas de ruta actuales.
- Si intenta acceso directo, redirecciona o bloquea por control de rol.

## Criterios de aprobacion

- No errores JS en consola durante el flujo.
- Requests de espacios responden con codigos esperados.
- Estado de sesion activa consistente antes y despues de refresco.
- No regresiones visuales evidentes en desktop y mobile.

## Registro sugerido de ejecucion

- Fecha:
- Entorno:
- Build frontend:
- Commit o version:
- Tester:
- Resultado global: OK / FAIL
- Hallazgos:
