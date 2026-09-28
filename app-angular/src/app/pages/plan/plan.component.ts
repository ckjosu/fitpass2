import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, switchMap } from 'rxjs';
import { ContractService } from '../../core/contract.service';
import { AuthService } from '../../core/auth.service';
import { PlanPlataforma, RespuestaContrato } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

@Component({
  selector: 'fp-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan.component.html',
  styleUrl: './plan.component.scss',
})
export class PlanComponent implements OnInit, OnDestroy {
  private contratos = inject(ContractService);
  private auth = inject(AuthService);
  private sub?: Subscription;

  // Plan que el GIMNASIO contrata con la plataforma Gymred. No confundir con
  // la pantalla de precios, que son los precios que el gimnasio cobra a sus socios.
  gymId = 0;
  cargando = true;
  error = '';
  exito = '';
  datos: RespuestaContrato | null = null;

  ngOnInit(): void {
    this.sub = this.auth.gimnasioActual$
      .pipe(switchMap((id) => {
        this.gymId = Number(id);
        this.cargando = true;
        return this.contratos.ver(this.gymId);
      }))
      .subscribe({
        next: (r) => {
          this.datos = r;
          this.cargando = false;
        },
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudo cargar tu contrato');
          this.cargando = false;
        },
      });
  }

  requestChange(plan: PlanPlataforma): void {
    this.error = '';
    this.exito = '';

    this.contratos.solicitarCambio(this.gymId, plan.tipo).subscribe({
      next: () => {
        this.exito = 'Solicitud enviada. El equipo de Gymred la revisará.';
        this.contratos.ver(this.gymId).subscribe((r) => (this.datos = r));
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo enviar la solicitud')),
    });
  }

  nombreMes(mes: number): string {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return meses[mes - 1] || String(mes);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
