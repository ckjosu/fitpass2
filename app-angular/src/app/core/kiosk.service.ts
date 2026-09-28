import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, CodigoPantalla, Pantalla } from './api.config';

@Injectable({ providedIn: 'root' })
export class KioskService {
  private http = inject(HttpClient);

  pantallas(gymId: number): Observable<Pantalla[]> {
    return this.http.get<Pantalla[]>(`${API_URL}/pantalla/${gymId}/pantallas`);
  }

  /** Pide el siguiente código. La pantalla lo renueva sola antes de que venza. */
  codigo(gymId: number, serie: string, segundos: number): Observable<CodigoPantalla> {
    const q = `?serie=${encodeURIComponent(serie)}&segundos=${segundos}`;
    return this.http.post<CodigoPantalla>(`${API_URL}/pantalla/${gymId}/codigo${q}`, {});
  }
}
