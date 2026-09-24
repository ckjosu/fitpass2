# HU-01: Inicio de sesión

**Pantalla:** Inicio de sesión
**Plataforma:** Web (Angular) - Panel del dueño
**Responsable:** Josue
**Prioridad:** Alta
**Estado:** Pendiente

## Historia
Como **dueño de gimnasio**, quiero **iniciar sesión con mi correo y contraseña** para **entrar al panel de mi gimnasio**.

## Justificación
Es la puerta de entrada al panel. Cada dueño solo debe ver y modificar la información de su propio gimnasio, así que sin un login no hay forma de proteger los datos ni de saber quién hace cada cambio.

## Criterios de aceptación
- [ ] Tiene campos de correo y contraseña con botón **Iniciar sesión**.
  - *Por qué:* El correo es único por dueño y la contraseña protege la cuenta; son los datos mínimos para identificarlo.
- [ ] Si los datos son incorrectos se muestra un mensaje de error en rojo.
  - *Por qué:* Sin mensaje el usuario no sabe si falló o si la página se trabó. El rojo es el color que definimos para errores en la paleta.
- [ ] Si los datos son correctos me lleva al Dashboard.
  - *Por qué:* El Dashboard es la pantalla principal, desde ahí se llega a todo lo demás.
- [ ] Tiene enlaces a **Registrarse** y **¿Olvidaste tu contraseña?**.
  - *Por qué:* Un dueño nuevo o uno que olvidó su contraseña no debe quedarse atorado en el login.

## Captura de pantalla
![HU-01 Inicio de sesión](capturas/HU-01-login.png)
