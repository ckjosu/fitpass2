# HU-08: Reportes de mantenimiento

**Pantalla:** Reportes de mantenimiento
**Plataforma:** Web (Angular) - Panel del dueño
**Responsable:** Josue
**Prioridad:** Media
**Estado:** Pendiente

## Historia
Como **dueño de gimnasio**, quiero **registrar las averías del equipo** para **llevar el control de qué está descompuesto y cuándo se arregló**.

## Justificación
El equipo se descompone y el dueño necesita un registro de las fallas. Además, un socio no debe ver como disponible un ejercicio cuyo equipo está roto.

## Criterios de aceptación
- [ ] Puedo crear un reporte eligiendo el equipo del inventario y describiendo la falla.
  - *Por qué:* Al ligarlo al inventario se sabe exactamente qué equipo falla, sin escribirlo a mano.
- [ ] Cada reporte tiene estado: Pendiente, En reparación o Resuelto.
  - *Por qué:* Permite dar seguimiento a la avería desde que se detecta hasta que se arregla.
- [ ] Puedo filtrar los reportes por estado.
  - *Por qué:* El dueño casi siempre quiere ver solo lo que falta por arreglar.
- [ ] El equipo con reporte pendiente aparece como no disponible en la app.
  - *Por qué:* Evita que el socio planee su rutina con equipo que no sirve.

## Captura de pantalla
![HU-08 Reportes de mantenimiento](capturas/HU-08-reportes-mantenimiento.png)
