# Plan de Modularizacion Frontend (MBI, Profile, Home)

## Objetivo

Reducir complejidad de paginas grandes, mejorar mantenibilidad y disminuir riesgo de regresiones funcionales.

## Alcance Inicial

- DashboardMbiPage
- DashboardProfilePage
- DashboardHomePage

## Principios

- Mantener comportamiento y contratos API existentes.
- Separar UI de logica de negocio.
- Extraer secciones con una sola responsabilidad.
- Introducir pruebas de comportamiento en flujos criticos.

## Fase 1 - MBI

Archivo actual: `src/features/dashboard/pages/DashboardMbiPage.jsx`.

### Modulos objetivo

- `src/features/dashboard/mbi/components/MbiIntroCard.jsx`
- `src/features/dashboard/mbi/components/MbiQuestionStep.jsx`
- `src/features/dashboard/mbi/components/MbiReviewStep.jsx`
- `src/features/dashboard/mbi/components/MbiHistoryList.jsx`
- `src/features/dashboard/mbi/hooks/useMbiQuestionFlow.js`
- `src/features/dashboard/mbi/lib/mbiChartMapper.js`
- `src/features/dashboard/mbi/lib/mbiPdfExporter.js`

### Resultado esperado

- Pagina contenedora <= 300 lineas.
- Flujo guiado y exportacion PDF desacoplados.

## Fase 2 - Profile

Archivo actual: `src/features/dashboard/pages/DashboardProfilePage.jsx`.

### Modulos objetivo

- `src/features/dashboard/profile/components/ProfileSidebarMenu.jsx`
- `src/features/dashboard/profile/components/ProfileAccountSection.jsx`
- `src/features/dashboard/profile/components/ProfileSecuritySection.jsx`
- `src/features/dashboard/profile/components/ProfilePreferencesSection.jsx`
- `src/features/dashboard/profile/components/ProfileSessionSection.jsx`
- `src/features/dashboard/profile/hooks/useProfileSettingsState.js`

### Resultado esperado

- Secciones de configuracion independientes y reutilizables.
- Menor acoplamiento entre formularios y panel de navegacion lateral.

## Fase 3 - Home

Archivo actual: `src/features/dashboard/pages/DashboardHomePage.jsx`.

### Modulos objetivo

- `src/features/dashboard/home/components/HomeKpiCards.jsx`
- `src/features/dashboard/home/components/HomeCriticalAlertsPanel.jsx`
- `src/features/dashboard/home/components/HomeRecentActivityPanel.jsx`
- `src/features/dashboard/home/components/HomeQuickActions.jsx`
- `src/features/dashboard/home/hooks/useHomeDashboardData.js`

### Resultado esperado

- Panel principal armado por bloques reutilizables.
- Carga de datos aislada en hook de orquestacion.

## Criterios de Aceptacion

- Lint y build en verde.
- Sin cambios en rutas ni en respuestas API.
- Misma UX funcional para usuario final.
- Cobertura minima de pruebas para flujos criticos:
  - inicio de evaluacion MBI
  - envio de evaluacion MBI
  - carga de informacion adicional en perfil
  - render de alertas criticas en home

## Orden de Ejecucion Recomendado

1. MBI (mayor complejidad y mayor impacto de cambios recientes).
2. Profile (alto acoplamiento de UI + estados).
3. Home (consolidacion final de widgets y alertas).
