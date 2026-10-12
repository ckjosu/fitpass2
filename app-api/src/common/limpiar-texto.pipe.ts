import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Limpia el texto de toda peticion antes de que llegue a los servicios.
 *
 * Quita espacios al inicio y al final, y junta los espacios repetidos de en
 * medio. Asi "  Prensa   de piernas " y "Prensa de piernas" entran igual a la
 * base, y las restricciones de "no repetido" si pueden hacer su trabajo.
 *
 * Las contrasenas y las llaves solo se recortan a los lados: si alguien eligio
 * una contrasena con dos espacios seguidos, es asunto suyo y no se la movemos.
 */
@Injectable()
export class LimpiarTextoPipe implements PipeTransform {
  private readonly secretos = /password|contrasena|contraseña|apikey|api_key|token|secret/i;

  transform(valor: unknown, meta: ArgumentMetadata): unknown {
    if (meta.type !== 'body' && meta.type !== 'query') return valor;
    return this.limpiar(valor);
  }

  private limpiar(valor: unknown, clave = ''): unknown {
    if (typeof valor === 'string') {
      const recortado = valor.trim();
      return this.secretos.test(clave) ? recortado : recortado.replace(/\s+/g, ' ');
    }
    if (Array.isArray(valor)) return valor.map((v) => this.limpiar(v, clave));
    if (valor && typeof valor === 'object') {
      const salida: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(valor)) salida[k] = this.limpiar(v, k);
      return salida;
    }
    return valor;
  }
}
