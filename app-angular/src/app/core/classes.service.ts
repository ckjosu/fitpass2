import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, HorarioClase, RespuestaClases, TipoClase } from './api.config';

export interface ClaseForm {
  idCatalogo?: number | null;
  nombre?: string;
  instructor?: string;
  descripcion?: string;
  duracionMin: number;
  cupo: number;
  activa?: boolean;
  horarios: HorarioClase[];
}

@Injectable({ providedIn: 'root' })
export class ClassesService {
  private http = inject(HttpClient);

  lista(gymId: number): Observable<RespuestaClases> {
    return this.http.get<RespuestaClases>(`${API_URL}/clases/${gymId}`);
  }

  tipos(): Observable<TipoClase[]> {
    return this.http.get<TipoClase[]>(`${API_URL}/clases/tipos`);
  }

  inscritos(gymId: number, idHorario: number, fecha: string): Observable<{ id: number; cliente: string }[]> {
    return this.http.get<{ id: number; cliente: string }[]>(
      `${API_URL}/clases/${gymId}/inscritos/${idHorario}?fecha=${fecha}`,
    );
  }

  crear(gymId: number, datos: ClaseForm): Observable<unknown> {
    return this.http.post(`${API_URL}/clases/${gymId}`, datos);
  }

  actualizar(gymId: number, id: number, datos: ClaseForm): Observable<unknown> {
    return this.http.put(`${API_URL}/clases/${gymId}/${id}`, datos);
  }

  borrar(gymId: number, id: number): Observable<unknown> {
    return this.http.delete(`${API_URL}/clases/${gymId}/${id}`);
  }
}
