import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, RespuestaResenas } from './api.config';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private http = inject(HttpClient);

  lista(gymId: number, filtro = 'todas', estrellas?: number | null): Observable<RespuestaResenas> {
    let params = new HttpParams().set('filtro', filtro);
    if (estrellas) params = params.set('estrellas', String(estrellas));
    return this.http.get<RespuestaResenas>(`${API_URL}/resenas/${gymId}`, { params });
  }

  responder(gymId: number, id: number, respuesta: string): Observable<unknown> {
    return this.http.put(`${API_URL}/resenas/${gymId}/${id}/respuesta`, { respuesta });
  }

  borrarRespuesta(gymId: number, id: number): Observable<unknown> {
    return this.http.delete(`${API_URL}/resenas/${gymId}/${id}/respuesta`);
  }
}
