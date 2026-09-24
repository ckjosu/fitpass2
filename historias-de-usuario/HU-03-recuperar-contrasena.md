# HU-03: Recuperar contraseña

**Pantalla:** Recuperar contraseña
**Plataforma:** Web (Angular) - Panel del dueño
**Responsable:** Josue
**Prioridad:** Media
**Estado:** Pendiente

## Historia
Como **dueño de gimnasio**, quiero **recuperar el acceso a mi cuenta** para **no perder la administración de mi gimnasio si olvido la contraseña**.

## Justificación
Si un dueño pierde el acceso, su gimnasio se queda sin administrar: no puede generar el QR, cambiar precios ni revisar accesos. Esta pantalla evita que tenga que pedir ayuda a mano para recuperar su cuenta.

## Criterios de aceptación
- [ ] Pide el correo registrado.
  - *Por qué:* El correo es el dato con el que se identifica la cuenta.
- [ ] Envía un enlace o código para crear una nueva contraseña.
  - *Por qué:* Así se comprueba que quien lo pide es el dueño real del correo.
- [ ] Si el correo no existe muestra un aviso.
  - *Por qué:* El usuario sabe que se equivocó al escribirlo en lugar de esperar un correo que nunca llegará.
- [ ] Después de cambiarla puedo iniciar sesión con la nueva contraseña.
  - *Por qué:* Es la prueba de que el proceso funcionó completo.

## Captura de pantalla
![HU-03 Recuperar contraseña](capturas/HU-03-recuperar-contrasena.png)
