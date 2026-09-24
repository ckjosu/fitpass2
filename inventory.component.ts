import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { InventoryService } from '../../core/inventory.service';
import { AuthService } from '../../core/auth.service';
import { Equipo, RespuestaInventario } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

@Component({
  selector: 'fp-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private inventario = inject(InventoryService);
  private auth = inject(AuthService);
  private sub?: Subscription;

  categorias = [
    { valor: 'peso_libre', etiqueta: 'Peso libre' },
    { valor: 'maquinas', etiqueta: 'Máquinas' },
    { valor: 'cardio', etiqueta: 'Cardio' },
    { valor: 'funcional', etiqueta: 'Funcional' },
    { valor: 'clases', etiqueta: 'Clases' },
    { valor: 'otro', etiqueta: 'Otro' },
  ];

  gymId = 0;
  cargando = true;
  error = '';
  exito = '';
  datos: RespuestaInventario | null = null;
  mostrandoForm = false;

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    categoria: ['maquinas', Validators.required],
    descripcion: [''],
    cantidad: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.sub = this.auth.gimnasioActual$.subscribe((id) => {
      this.gymId = Number(id);
      this.cargar();
    });
  }

  cargar(): void {
    if (!this.gymId) return;
    this.cargando = true;
    this.inventario.lista(this.gymId).subscribe({
      next: (d) => {
        this.datos = d;
        this.cargando = false;
      },
      error: (e) => {
        this.error = mensajeDeError(e, 'No se pudo cargar el inventario');
        this.cargando = false;
      },
    });
  }

  abrirForm(): void {
    this.mostrandoForm = true;
    this.error = '';
    this.exito = '';
  }

  cerrarForm(): void {
    this.mostrandoForm = false;
    this.form.reset({ nombre: '', categoria: 'maquinas', descripcion: '', cantidad: 1 });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.inventario.crear(this.gymId, this.form.getRawValue()).subscribe({
      next: (d) => {
        this.datos = d;
        this.exito = 'Equipo agregado al inventario.';
        this.cerrarForm();
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo agregar el equipo')),
    });
  }

  /** Marcar fuera de servicio lo oculta en la app del socio. */
  alternar(eq: Equipo): void {
    const situacion = eq.situacion === 'disponible' ? 'fuera_de_servicio' : 'disponible';
    this.inventario.actualizar(this.gymId, eq.id, { situacion }).subscribe({
      next: (d) => {
        this.datos = d;
        this.exito =
          situacion === 'fuera_de_servicio'
            ? `${eq.nombre} ya no le aparece al socio en la app.`
            : `${eq.nombre} vuelve a aparecer en la app.`;
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo actualizar el equipo')),
    });
  }

  borrar(eq: Equipo): void {
    this.inventario.borrar(this.gymId, eq.id).subscribe({
      next: (d) => {
        this.datos = d;
        this.exito = 'Equipo eliminado.';
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo eliminar el equipo')),
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
