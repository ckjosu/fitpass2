import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { IncidentsService } from '../../core/incidents.service';
import { InventoryService } from '../../core/inventory.service';
import { AuthService } from '../../core/auth.service';
import { Incidencia, RespuestaIncidencias } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

@Component({
  selector: 'fp-incidents',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './incidents.component.html',
  styleUrl: './incidents.component.scss',
})
export class IncidentsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private incidencias = inject(IncidentsService);
  private inventario = inject(InventoryService);
  private auth = inject(AuthService);
  private sub?: Subscription;

  gymId = 0;
  cargando = true;
  error = '';
  exito = '';
  datos: RespuestaIncidencias | null = null;

  filtroSituacion = '';
  filtroPrioridad = '';
  mostrandoForm = false;

  // El equipo se elige del inventario del gimnasio, no se escribe. Así el
  // mismo aparato no queda reportado con tres nombres distintos.
  equiposDelGimnasio: string[] = [];

  get equipoLibre(): boolean {
    return this.form.value.equipo === 'otro';
  }

  form = this.fb.nonNullable.group({
    equipo: ['', Validators.required],
    equipoOtro: [''],
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    descripcion: [''],
    prioridad: ['media'],
  });

  ngOnInit(): void {
    this.sub = this.auth.gimnasioActual$.subscribe((id) => {
      this.gymId = Number(id);
      this.cargar();

      this.inventario.lista(this.gymId).subscribe({
        next: (d) => (this.equiposDelGimnasio = d.equipos.map((e) => e.nombre)),
        error: () => (this.equiposDelGimnasio = []),
      });
    });
  }

  cargar(): void {
    if (!this.gymId) return;
    this.cargando = true;
    this.incidencias.lista(this.gymId, this.filtroSituacion, this.filtroPrioridad).subscribe({
      next: (d) => {
        this.datos = d;
        this.cargando = false;
      },
      error: (e) => {
        this.error = mensajeDeError(e, 'No se pudieron cargar los reportes');
        this.cargando = false;
      },
    });
  }

  abrirForm(): void {
    this.mostrandoForm = true;
    this.exito = '';
    this.error = '';
  }

  cerrarForm(): void {
    this.mostrandoForm = false;
    this.form.reset({ equipo: '', equipoOtro: '', titulo: '', descripcion: '', prioridad: 'media' });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.error = '';

    const v = this.form.getRawValue();
    const equipo = this.equipoLibre ? (v.equipoOtro || '').trim() : v.equipo;

    if (equipo.length < 2) {
      this.error = 'Escribe qué equipo o zona falló';
      return;
    }

    this.incidencias.crear(this.gymId, {
      equipo,
      titulo: v.titulo,
      descripcion: v.descripcion,
      prioridad: v.prioridad,
    }).subscribe({
      next: (d) => {
        this.datos = d;
        this.exito = 'Reporte levantado.';
        this.cerrarForm();
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo levantar el reporte')),
    });
  }

  cambiarSituacion(inc: Incidencia, situacion: string): void {
    this.error = '';
    this.incidencias.actualizar(this.gymId, inc.id, { situacion }).subscribe({
      next: (d) => {
        this.datos = d;
        this.exito = situacion === 'resuelto' ? 'Reporte marcado como resuelto.' : 'Reporte actualizado.';
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo actualizar el reporte')),
    });
  }

  borrar(inc: Incidencia): void {
    this.incidencias.borrar(this.gymId, inc.id).subscribe({
      next: (d) => {
        this.datos = d;
        this.exito = 'Reporte eliminado.';
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo eliminar el reporte')),
    });
  }

  etiquetaSituacion(s: string): string {
    if (s === 'pendiente') return 'Pendiente';
    if (s === 'en_progreso') return 'En progreso';
    return 'Resuelto';
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
