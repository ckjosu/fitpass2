import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { GymsService } from '../../core/gyms.service';
import { AuthService } from '../../core/auth.service';
import { MovimientoPrecio, Precio } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

@Component({
  selector: 'fp-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
})
export class PricingComponent implements OnInit, OnDestroy {
  private gyms = inject(GymsService);
  private auth = inject(AuthService);
  private sub?: Subscription;

  // Estos son los precios que el gimnasio le cobra a SUS socios.
  // Gymred no los cobra: sirven para que el usuario los vea en la app.
  conceptos = [
    { clave: 'visita', etiqueta: 'Pase por día / invitado' },
    { clave: 'semana', etiqueta: 'Pase semanal' },
    { clave: 'quincena', etiqueta: 'Quincena' },
    { clave: 'mes', etiqueta: 'Mensualidad' },
    { clave: 'anual', etiqueta: 'Anualidad' },
  ];

  gymId = 0;
  cargando = true;
  error = '';
  exito = '';
  precios: Precio[] = [];
  historial: MovimientoPrecio[] = [];

  editando: string | null = null;
  montoEditado = 0;

  ngOnInit(): void {
    this.sub = this.auth.gimnasioActual$
      .pipe(switchMap((id) => {
        this.gymId = Number(id);
        this.cargando = true;
        return this.gyms.precios(this.gymId);
      }))
      .subscribe({
        next: (r) => {
          this.precios = r.precios;
          this.historial = r.historial;
          this.cargando = false;
        },
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudieron cargar los precios');
          this.cargando = false;
        },
      });
  }

  etiqueta(concepto: string): string {
    const encontrado = this.conceptos.find((c) => c.clave === concepto);
    return encontrado ? encontrado.etiqueta : concepto;
  }

  precioDe(concepto: string): Precio | undefined {
    return this.precios.find((p) => p.concepto === concepto);
  }

  editar(concepto: string): void {
    const actual = this.precioDe(concepto);
    this.editando = concepto;
    this.montoEditado = actual ? actual.monto : 0;
    this.exito = '';
  }

  cancelar(): void {
    this.editando = null;
  }

  guardar(concepto: string): void {
    if (this.montoEditado <= 0) {
      this.error = 'El monto debe ser mayor a cero';
      return;
    }
    this.error = '';

    this.gyms.guardarPrecio(this.gymId, concepto, Number(this.montoEditado)).subscribe({
      next: (r) => {
        this.precios = r.precios;
        this.historial = r.historial;
        this.editando = null;
        this.exito = 'Precio actualizado. El cambio quedó en el historial.';
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo guardar el precio')),
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
