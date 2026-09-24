# HU-02: Registro de gimnasio

**Pantalla:** Registro de gimnasio
**Plataforma:** Web (Angular) - Panel del dueño
**Responsable:** Josue
**Prioridad:** Alta
**Estado:** Pendiente

## Historia
Como **dueño de gimnasio**, quiero **registrar mi cuenta y los datos básicos de mi gimnasio** para **afiliarlo a la plataforma**.

## Justificación
Sin gimnasios registrados la plataforma no tiene nada que ofrecer a los socios. Esta pantalla es la forma en que un gimnasio de la región se une a FitPass y queda ligado a un dueño y a un plan de contrato.

## Criterios de aceptación
- [ ] Pide nombre del dueño, correo, contraseña, nombre del gimnasio y dirección.
  - *Por qué:* Son los datos mínimos para crear la cuenta y ubicar el gimnasio; lo demás se completa después en Mantenimiento del gimnasio.
- [ ] Valida que el correo no esté registrado y que la contraseña tenga mínimo 8 caracteres.
  - *Por qué:* Evita cuentas duplicadas y contraseñas fáciles de adivinar.
- [ ] Permite elegir el plan de contrato (básico o premium).
  - *Por qué:* El panel funciona según el contrato de cada gimnasio, así que el plan se necesita desde el inicio.
- [ ] Al terminar muestra un mensaje de éxito y regresa al login.
  - *Por qué:* Confirma que el registro sí se guardó y lleva al dueño al siguiente paso natural, que es entrar.

## Captura de pantalla
![HU-02 Registro de gimnasio](capturas/HU-02-registro-gimnasio.png)
