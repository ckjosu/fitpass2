import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, Configuracion } from './api.config';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);

  ver(gymId: number): Observable<Configuracion> {
    return this.http.get<Configuracion>(`${API_URL}/configuracion/${gymId}`);
  }

  guardar(gymId: number, datos: Partial<Configuracion>): Observable<Configuracion> {
    return this.http.put<Configuracion>(`${API_URL}/configuracion/${gymId}`, datos);
  }
}
