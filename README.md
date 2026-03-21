# CIELP Frontend 3.0

Aplicacion web de CIELP para autenticacion, dashboard por roles, analitica institucional, exportes PDF y gestion de bienestar docente.

## Stack

- React 19
- Vite 8
- MUI 7
- Zustand
- React Hook Form + Zod
- Axios

## Estructura

```text
src/
	app/
	features/
		auth/
		dashboard/
		public/
	shared/
		api/
		config/
		lib/
```

## Requisitos

- Node.js 20+

## Variables de entorno

Usa [.env.example](.env.example) como base.

- `VITE_API_URL`: URL base del backend (`https://.../api/cielp/v1`).

Nota: en produccion, si falta `VITE_API_URL`, la app falla de forma explicita para evitar despliegues mal configurados.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

Scripts disponibles:

- `npm run dev`: servidor de desarrollo
- `npm run build`: build de produccion
- `npm run preview`: prueba local del build
- `npm run lint`: analisis estatico

## Flujo recomendado de despliegue

1. Definir `VITE_API_URL` de produccion en tu plataforma.
2. Ejecutar `npm run build`.
3. Publicar carpeta `dist/` en tu hosting estatico.
4. Verificar login, rutas protegidas y exportes PDF.

## Buenas practicas

- No versionar `.env`.
- Mantener consistencia de roles y rutas con backend.
- Ejecutar build antes de cada release para validar integridad.
