# HU-13: Configuración

**Pantalla:** Configuración
**Plataforma:** Web (Angular) - Panel del dueño
**Responsable:** Josue
**Prioridad:** Baja
**Estado:** Pendiente

## Historia
Como **dueño de gimnasio**, quiero **modificar los datos de mi cuenta** para **mantener mi información actualizada y segura**.

## Justificación
Aquí se separan los datos de la cuenta del dueño (correo, contraseña) de los datos del gimnasio, que están en Mantenimiento del gimnasio. También es donde se cierra sesión.

## Criterios de aceptación
- [ ] Puedo cambiar mi nombre, correo y teléfono.
  - *Por qué:* Los datos de contacto del dueño pueden cambiar.
- [ ] Puedo cambiar mi contraseña escribiendo primero la actual.
  - *Por qué:* Así, si alguien encuentra la sesión abierta, no puede cambiarla sin saber la contraseña.
- [ ] Tiene el botón **Cerrar sesión**.
  - *Por qué:* Es importante si el dueño usa una computadora compartida.
- [ ] Al guardar se muestra un mensaje de confirmación.
  - *Por qué:* El dueño sabe que el cambio se aplicó.

## Captura de pantalla
![HU-13 Configuración](capturas/HU-13-configuracion.png)
