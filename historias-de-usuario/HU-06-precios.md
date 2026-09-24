# HU-06: Precios del gimnasio

**Pantalla:** Precios del gimnasio
**Plataforma:** Web (Angular) - Panel del dueño
**Responsable:** Josue
**Prioridad:** Alta
**Estado:** Pendiente

## Historia
Como **dueño de gimnasio**, quiero **definir mis propios precios por día, semana y mes** para **cobrar lo que mi gimnasio necesita**.

## Justificación
Cada gimnasio maneja precios distintos. Si la plataforma pusiera un precio único, un gimnasio podría recibir menos de lo que necesita para operar, por eso cada dueño define los suyos.

## Criterios de aceptación
- [ ] Tiene campos para precio por día (invitado), por semana y por mes.
  - *Por qué:* Son las tres formas de cobro que manejan los gimnasios de la región.
- [ ] No permite guardar precios vacíos, en cero o negativos.
  - *Por qué:* Un precio así provocaría errores al calcular pagos.
- [ ] Muestra la fecha de la última actualización.
  - *Por qué:* El dueño sabe si sus precios están al día.
- [ ] Los precios aparecen en el detalle del gimnasio en la app.
  - *Por qué:* El socio debe conocer el precio antes de ir.

## Captura de pantalla
![HU-06 Precios del gimnasio](capturas/HU-06-precios.png)
