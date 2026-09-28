import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, Reportes, RespuestaHistorial, Resumen } from './api.config';

export interface FiltroHistorial {
  desde?: string;
  hasta?: string;
  resultado?: string;
  buscar?: string;
  pagina?: number;
  porPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class AccessService {
  private http = inject(HttpClient);

  resumen(gymId: number): Observable<Resumen> {
    return this.http.get<Resumen>(`${API_URL}/accesos/${gymId}/resumen`);
  }

  historial(gymId: number, filtro: FiltroHistorial): Observable<RespuestaHistorial> {
    let params = new HttpParams();
    Object.entries(filtro).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, String(valor));
      }
    });
    return this.http.get<RespuestaHistorial>(`${API_URL}/accesos/${gymId}/historial`, { params });
  }

  reportes(gymId: number, meses = 6): Observable<Reportes> {
    return this.http.get<Reportes>(`${API_URL}/accesos/${gymId}/reportes?meses=${meses}`);
  }
}
