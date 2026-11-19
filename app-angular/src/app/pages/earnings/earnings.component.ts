import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { ContractService } from '../../core/contract.service';
import { AuthService } from '../../core/auth.service';
import { RespuestaContrato } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

/**
 * Mis ganancias.
 * El gimnasio está afiliado sin costo. El dueño pone su precio por visita
 * (con tope según su clase, Esencial o Plus) y Gymred se lo paga por cada
 * día que entra un socio.
 */
@Component({
  selector: 'fp-earnings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './earnings.component.html',
  styleUrl: './earnings.component.scss',
})
export class EarningsComponent implements OnInit, OnDestroy {
  private contratos = inject(ContractService);
  private auth = inject(AuthService);
  private sub?: Subscription;

  gymId = 0;
  cargando = true;
  guardando = false;
  error = '';
  exito = '';
  datos: RespuestaContrato | null = null;

  editandoPrecio = false;
  precioNuevo: number | null = null;

  ngOnInit(): void {
    this.sub = this.auth.gimnasioActual$
      .pipe(switchMap((id) => {
        this.gymId = Number(id);
        this.cargando = true;
        this.error = '';
        this.exito = '';
        this.editandoPrecio = false;
        return this.contratos.ver(this.gymId);
      }))
      .subscribe({
        next: (r) => this.cargar(r),
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudieron cargar tus ganancias');
          this.cargando = false;
        },
      });
  }

  private cargar(r: RespuestaContrato): void {
    this.datos = r;
    this.cargando = false;
    // Si todavía no tiene precio, se abre el campo para que lo ponga.
    if (!r.afiliacion.precioPorVisita) {
      this.editandoPrecio = true;
      this.precioNuevo = null;
    }
  }

  editarPrecio(): void {
    this.precioNuevo = this.datos?.afiliacion.precioPorVisita ?? null;
    this.editandoPrecio = true;
    this.exito = '';
    this.error = '';
  }

  cancelarPrecio(): void {
    this.editandoPrecio = !this.datos?.afiliacion.precioPorVisita;
    this.error = '';
  }

  get precioValido(): boolean {
    const tope = this.datos?.clasificacion.tope ?? 0;
    return !!this.precioNuevo && this.precioNuevo > 0 && this.precioNuevo <= tope;
  }

  guardarPrecio(): void {
    if (!this.precioValido || this.guardando) return;
    this.guardando = true;
    this.error = '';
    this.contratos.guardarPrecio(this.gymId, Number(this.precioNuevo)).subscribe({
      next: (r) => {
        this.datos = r;
        this.editandoPrecio = false;
        this.guardando = false;
        this.exito = 'Tu precio quedó guardado. Se aplica a las visitas desde hoy.';
      },
      error: (e) => {
        this.error = mensajeDeError(e, 'No se pudo guardar tu precio');
        this.guardando = false;
      },
    });
  }

  dinero(n: number | null | undefined): string {
    return '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  nombreMes(mes: number): string {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return meses[mes - 1] || String(mes);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
