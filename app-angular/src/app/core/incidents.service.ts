import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, RespuestaIncidencias } from './api.config';

@Injectable({ providedIn: 'root' })
export class IncidentsService {
  private http = inject(HttpClient);

  lista(gymId: number, situacion?: string, prioridad?: string): Observable<RespuestaIncidencias> {
    let params = new HttpParams();
    if (situacion) params = params.set('situacion', situacion);
    if (prioridad) params = params.set('prioridad', prioridad);
    return this.http.get<RespuestaIncidencias>(`${API_URL}/incidencias/${gymId}`, { params });
  }

  crear(gymId: number, datos: Record<string, unknown>): Observable<RespuestaIncidencias> {
    return this.http.post<RespuestaIncidencias>(`${API_URL}/incidencias/${gymId}`, datos);
  }

  actualizar(gymId: number, id: number, datos: Record<string, unknown>): Observable<RespuestaIncidencias> {
    return this.http.put<RespuestaIncidencias>(`${API_URL}/incidencias/${gymId}/${id}`, datos);
  }

  borrar(gymId: number, id: number): Observable<RespuestaIncidencias> {
    return this.http.delete<RespuestaIncidencias>(`${API_URL}/incidencias/${gymId}/${id}`);
  }
}
