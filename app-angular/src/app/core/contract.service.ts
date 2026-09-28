import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, RespuestaContrato } from './api.config';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private http = inject(HttpClient);

  ver(gymId: number): Observable<RespuestaContrato> {
    return this.http.get<RespuestaContrato>(`${API_URL}/contrato/${gymId}`);
  }

  solicitarCambio(gymId: number, tipoSolicitado: string, mensaje?: string): Observable<unknown> {
    return this.http.post(`${API_URL}/contrato/${gymId}/solicitud-plan`, { tipoSolicitado, mensaje });
  }

  solicitarBaja(gymId: number, motivo: string, comentario?: string): Observable<unknown> {
    return this.http.post(`${API_URL}/contrato/${gymId}/baja`, { motivo, comentario });
  }

  cancelarBaja(gymId: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${API_URL}/contrato/${gymId}/baja`);
  }
}
