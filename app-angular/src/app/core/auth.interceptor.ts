import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Le pega el token a cada peticion y, si el backend responde 401,
 * cierra la sesion y manda al login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;

  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.autenticado) auth.salir();
      return throwError(() => error);
    }),
  );
};

/** Saca el mensaje que manda el backend para mostrarlo en pantalla. */
export function mensajeDeError(error: unknown, respaldo: string): string {
  const e = error as HttpErrorResponse;
  if (e?.status === 0) return 'No se pudo conectar con el servidor. Revisa que la API este corriendo.';
  const mensaje = e?.error?.message;
  if (Array.isArray(mensaje)) return mensaje[0];
  if (typeof mensaje === 'string') return mensaje;
  return respaldo;
}
