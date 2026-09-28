import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_URL, GimnasioResumen, RespuestaLogin, Usuario } from './api.config';
import { ThemeService } from './theme.service';

const LLAVE_TOKEN = 'gymred_token';
const LLAVE_USUARIO = 'gymred_usuario';
const LLAVE_GIMNASIOS = 'gymred_gimnasios';
const LLAVE_GIMNASIO_ACTUAL = 'gymred_gimnasio_actual';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tema = inject(ThemeService);

  /** Gimnasio que se esta viendo en el panel (el dueno puede tener varios). */
  gimnasioActual$ = new BehaviorSubject<number | null>(this.leerGimnasioActual());
  gimnasios$ = new BehaviorSubject<GimnasioResumen[]>(this.leerGimnasios());
  usuario$ = new BehaviorSubject<Usuario | null>(this.leerUsuario());

  get token(): string | null {
    return localStorage.getItem(LLAVE_TOKEN);
  }

  get autenticado(): boolean {
    return !!this.token;
  }

  get gimnasioId(): number | null {
    return this.gimnasioActual$.value;
  }

  login(email: string, password: string): Observable<RespuestaLogin> {
    return this.http
      .post<RespuestaLogin>(`${API_URL}/auth/login`, { email, password })
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  registrarDueno(datos: Record<string, unknown>): Observable<RespuestaLogin> {
    return this.http
      .post<RespuestaLogin>(`${API_URL}/auth/registro/dueno`, datos)
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  private guardarSesion(r: RespuestaLogin): void {
    localStorage.setItem(LLAVE_TOKEN, r.token);
    localStorage.setItem(LLAVE_USUARIO, JSON.stringify(r.usuario));
    localStorage.setItem(LLAVE_GIMNASIOS, JSON.stringify(r.gimnasios || []));
    this.usuario$.next(r.usuario);
    this.gimnasios$.next(r.gimnasios || []);

    const primero = r.gimnasios && r.gimnasios.length ? r.gimnasios[0].id : null;
    this.cambiarGimnasio(primero);
  }

  cambiarGimnasio(id: number | null): void {
    if (id === null) {
      localStorage.removeItem(LLAVE_GIMNASIO_ACTUAL);
    this.tema.limpiar();
    } else {
      localStorage.setItem(LLAVE_GIMNASIO_ACTUAL, String(id));
    }
    this.gimnasioActual$.next(id);
  }

  /** Actualiza el nombre en el selector cuando se edita en Mantenimiento. */
  renombrarGimnasio(id: number, nombre: string): void {
    const lista = this.gimnasios$.value.map((g) => (g.id === id ? { ...g, nombre } : g));
    localStorage.setItem(LLAVE_GIMNASIOS, JSON.stringify(lista));
    this.gimnasios$.next(lista);
  }

  salir(): void {
    localStorage.removeItem(LLAVE_TOKEN);
    localStorage.removeItem(LLAVE_USUARIO);
    localStorage.removeItem(LLAVE_GIMNASIOS);
    localStorage.removeItem(LLAVE_GIMNASIO_ACTUAL);
    this.tema.limpiar();
    this.usuario$.next(null);
    this.gimnasios$.next([]);
    this.gimnasioActual$.next(null);
    this.router.navigateByUrl('/login');
  }

  private leerUsuario(): Usuario | null {
    const crudo = localStorage.getItem(LLAVE_USUARIO);
    return crudo ? (JSON.parse(crudo) as Usuario) : null;
  }

  private leerGimnasios(): GimnasioResumen[] {
    const crudo = localStorage.getItem(LLAVE_GIMNASIOS);
    return crudo ? (JSON.parse(crudo) as GimnasioResumen[]) : [];
  }

  private leerGimnasioActual(): number | null {
    const crudo = localStorage.getItem(LLAVE_GIMNASIO_ACTUAL);
    return crudo ? Number(crudo) : null;
  }

  /** Iniciales para los avatares del sidebar y el topbar. */
  iniciales(texto: string | null | undefined): string {
    if (!texto) return 'FP';
    return texto
      .split(' ')
      .filter((p) => p.length > 0)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }
}
