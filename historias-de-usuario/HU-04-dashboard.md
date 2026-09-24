# HU-04: Dashboard

**Pantalla:** Dashboard
**Plataforma:** Web (Angular) - Panel del dueño
**Responsable:** Josue
**Prioridad:** Alta
**Estado:** Pendiente

## Historia
Como **dueño de gimnasio**, quiero **ver un resumen de mi gimnasio al entrar** para **saber rápido cómo va el día**.

## Justificación
El dueño necesita ver de un vistazo lo más importante sin entrar a cada sección. También sirve como menú central del panel.

## Criterios de aceptación
- [ ] Muestra los accesos del día, socios que han venido en el mes y reportes de mantenimiento abiertos.
  - *Por qué:* Son los tres datos que más le interesan al dueño: cuánta gente viene, qué tan activo está su gimnasio y qué equipo está fallando.
- [ ] Tiene un menú lateral para ir a las demás secciones.
  - *Por qué:* Todas las pantallas del panel deben estar a un clic de distancia.
- [ ] Los datos se cargan desde la API, no son fijos.
  - *Por qué:* El proyecto debe ser funcional y no simulado; el frontend solo consume JSON del backend.
- [ ] Muestra el nombre del gimnasio y del dueño en la parte superior.
  - *Por qué:* Confirma con qué cuenta se inició sesión.

## Captura de pantalla
![HU-04 Dashboard](capturas/HU-04-dashboard.png)
