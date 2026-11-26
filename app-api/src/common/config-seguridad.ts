/**
 * Valores de seguridad que dependen del ambiente.
 *
 * En produccion (Render pone RENDER=true, o NODE_ENV=production) la API se
 * niega a arrancar sin JWT_SECRET propio: con el valor por omision cualquiera
 * que vea el repositorio podria fabricar tokens validos.
 */
const SECRETO_DEV = 'gymred-secreto-solo-para-desarrollo';

export const EN_PRODUCCION = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

export function secretoJwt(): string {
  const secreto = process.env.JWT_SECRET;
  if (EN_PRODUCCION && (!secreto || secreto.length < 32)) {
    throw new Error(
      'Falta JWT_SECRET (minimo 32 caracteres) en las variables de entorno de produccion. ' +
        'La API no arranca sin el para no firmar tokens con un secreto publico.',
    );
  }
  return secreto || SECRETO_DEV;
}

/** Cuanto dura una sesion antes de pedir login otra vez. */
export const DURACION_SESION = process.env.JWT_EXPIRA || '12h';

/** Intentos fallidos seguidos antes de bloquear la cuenta, y por cuanto. */
export const MAX_INTENTOS_LOGIN = 5;
export const MINUTOS_BLOQUEO = 15;

/** Codigo de recuperacion de contrasena. */
export const MINUTOS_CODIGO = 15;
export const MAX_INTENTOS_CODIGO = 5;
export const MAX_CODIGOS_POR_HORA = 3;
