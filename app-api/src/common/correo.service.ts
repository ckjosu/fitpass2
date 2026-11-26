import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { EN_PRODUCCION } from './config-seguridad';

/**
 * Envia correos por la API HTTP de Brevo (https://api.brevo.com).
 *
 * Se usa HTTP y no SMTP porque los servicios gratis de Render bloquean los
 * puertos SMTP (25, 465 y 587).
 *
 * Variables de entorno:
 *   BREVO_API_KEY   llave de la API de Brevo
 *   CORREO_DESDE    correo remitente verificado en Brevo
 *   CORREO_NOMBRE   nombre que ve el usuario (por omision "Gymred")
 *
 * En desarrollo, si no hay llave, el correo no se manda y solo se avisa que
 * no esta configurado. Nunca se escribe el codigo en los logs.
 */
@Injectable()
export class CorreoService {
  private readonly log = new Logger('Correo');

  configurado(): boolean {
    return Boolean(process.env.BREVO_API_KEY && process.env.CORREO_DESDE);
  }

  async enviar(para: string, asunto: string, html: string): Promise<void> {
    if (!this.configurado()) {
      if (EN_PRODUCCION) throw new ServiceUnavailableException('El envio de correos no esta configurado');
      this.log.warn('Correo no configurado (BREVO_API_KEY / CORREO_DESDE): no se envio nada');
      return;
    }

    const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY as string,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: process.env.CORREO_NOMBRE || 'Gymred', email: process.env.CORREO_DESDE },
        to: [{ email: para }],
        subject: asunto,
        htmlContent: html,
      }),
    });

    if (!respuesta.ok) {
      // Solo el estado HTTP: ni el destinatario ni el contenido van al log.
      this.log.error(`Brevo respondio ${respuesta.status}`);
      throw new ServiceUnavailableException('No se pudo enviar el correo, intenta mas tarde');
    }
  }
}
