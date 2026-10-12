import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, GrupoCatalogo, RespuestaInventario } from './api.config';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);

  /** Lista de equipo estandar, para que el dueno elija en vez de escribir. */
  catalogo(): Observable<GrupoCatalogo[]> {
    return this.http.get<GrupoCatalogo[]>(`${API_URL}/catalogo`);
  }

  lista(gymId: number): Observable<RespuestaInventario> {
    return this.http.get<RespuestaInventario>(`${API_URL}/inventario/${gymId}`);
  }

  crear(gymId: number, datos: Record<string, unknown>): Observable<RespuestaInventario> {
    return this.http.post<RespuestaInventario>(`${API_URL}/inventario/${gymId}`, datos);
  }

  actualizar(gymId: number, id: number, datos: Record<string, unknown>): Observable<RespuestaInventario> {
    return this.http.put<RespuestaInventario>(`${API_URL}/inventario/${gymId}/${id}`, datos);
  }

  borrar(gymId: number, id: number): Observable<RespuestaInventario> {
    return this.http.delete<RespuestaInventario>(`${API_URL}/inventario/${gymId}/${id}`);
  }
}
