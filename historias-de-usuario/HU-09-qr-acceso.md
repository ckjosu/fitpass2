# HU-09: QR de acceso

**Pantalla:** QR de acceso
**Plataforma:** Web (Angular) - Panel del dueño
**Responsable:** Josue
**Prioridad:** Alta
**Estado:** Pendiente

## Historia
Como **dueño de gimnasio**, quiero **mostrar un código QR en la tablet de la entrada** para **que los socios lo escaneen con su celular para entrar**.

## Justificación
Es el lector de acceso que el equipo debe construir. Como no se aprobó el uso de NFC ni tarjetas físicas, el QR lo genera la web y se muestra en una tablet en la entrada, y el socio lo escanea con su celular.

## Criterios de aceptación
- [ ] Muestra un QR grande pensado para pantalla completa en tablet.
  - *Por qué:* Se va a ver en una tablet fija en la entrada y el celular debe leerlo sin problemas.
- [ ] El QR se renueva cada cierto tiempo para que no se pueda usar una captura.
  - *Por qué:* Si fuera fijo, alguien podría tomarle foto y entrar desde su casa o compartirlo.
- [ ] Cuando alguien escanea, la pantalla muestra si el acceso fue permitido (verde) o denegado (rojo).
  - *Por qué:* El personal de la entrada ve el resultado al momento sin revisar nada más.
- [ ] El QR lo genera el servidor, no se guarda como imagen fija.
  - *Por qué:* El servidor es quien valida el acceso, así que también debe ser quien crea el código.

## Captura de pantalla
![HU-09 QR de acceso](capturas/HU-09-qr-acceso.png)
