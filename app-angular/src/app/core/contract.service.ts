import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, RespuestaContrato } from './api.config';

@Injectable({ providedIn: 'root' })
/** Afiliacion del gimnasio: precio por visita, ganancias y baja. */
export class ContractService {
  private http = inject(HttpClient);

  ver(gymId: number): Observable<RespuestaContrato> {
    return this.http.get<RespuestaContrato>(`${API_URL}/contrato/${gymId}`);
  }

  guardarPrecio(gymId: number, precio: number): Observable<RespuestaContrato> {
    return this.http.put<RespuestaContrato>(`${API_URL}/contrato/${gymId}/precio`, { precio });
  }

  solicitarBaja(gymId: number, motivo: string, comentario?: string): Observable<unknown> {
    return this.http.post(`${API_URL}/contrato/${gymId}/baja`, { motivo, comentario });
  }

  cancelarBaja(gymId: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${API_URL}/contrato/${gymId}/baja`);
  }
}
