import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, RespuestaInventario } from './api.config';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);

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
