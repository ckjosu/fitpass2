import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  API_URL, Amenidad, Foto, GimnasioDetalle, GimnasioResumen,
  Horario, RespuestaPrecios, Servicio,
} from './api.config';

@Injectable({ providedIn: 'root' })
export class GymsService {
  private http = inject(HttpClient);

  mios(): Observable<GimnasioResumen[]> {
    return this.http.get<GimnasioResumen[]>(`${API_URL}/gimnasios/mios`);
  }

  detalle(gymId: number): Observable<GimnasioDetalle> {
    return this.http.get<GimnasioDetalle>(`${API_URL}/gimnasios/${gymId}`);
  }

  guardarDatos(gymId: number, datos: Record<string, unknown>): Observable<GimnasioDetalle> {
    return this.http.put<GimnasioDetalle>(`${API_URL}/gimnasios/${gymId}`, datos);
  }

  guardarHorarios(gymId: number, horarios: Partial<Horario>[]): Observable<Horario[]> {
    return this.http.put<Horario[]>(`${API_URL}/gimnasios/${gymId}/horarios`, { horarios });
  }

  agregarFoto(gymId: number, url: string, descripcion?: string): Observable<Foto> {
    return this.http.post<Foto>(`${API_URL}/gimnasios/${gymId}/fotos`, { url, descripcion });
  }

  subirFoto(gymId: number, archivo: File): Observable<Foto> {
    const datos = new FormData();
    datos.append('archivo', archivo);
    return this.http.post<Foto>(`${API_URL}/gimnasios/${gymId}/fotos/subir`, datos);
  }

  borrarFoto(gymId: number, idFoto: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${API_URL}/gimnasios/${gymId}/fotos/${idFoto}`);
  }

  agregarServicio(gymId: number, nombre: string, descripcion?: string): Observable<Servicio> {
    return this.http.post<Servicio>(`${API_URL}/gimnasios/${gymId}/servicios`, { nombre, descripcion });
  }

  borrarServicio(gymId: number, id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${API_URL}/gimnasios/${gymId}/servicios/${id}`);
  }

  agregarAmenidad(gymId: number, nombre: string): Observable<Amenidad> {
    return this.http.post<Amenidad>(`${API_URL}/gimnasios/${gymId}/amenidades`, { nombre });
  }

  borrarAmenidad(gymId: number, id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${API_URL}/gimnasios/${gymId}/amenidades/${id}`);
  }

  precios(gymId: number): Observable<RespuestaPrecios> {
    return this.http.get<RespuestaPrecios>(`${API_URL}/precios/${gymId}`);
  }

  guardarPrecio(gymId: number, concepto: string, monto: number): Observable<RespuestaPrecios> {
    return this.http.put<RespuestaPrecios>(`${API_URL}/precios/${gymId}`, { concepto, monto });
  }

  borrarPrecio(gymId: number, idPrecio: number): Observable<RespuestaPrecios> {
    return this.http.delete<RespuestaPrecios>(`${API_URL}/precios/${gymId}/${idPrecio}`);
  }
}
