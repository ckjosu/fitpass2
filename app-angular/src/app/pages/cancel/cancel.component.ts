import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { ContractService } from '../../core/contract.service';
import { AccessService } from '../../core/access.service';
import { AuthService } from '../../core/auth.service';
import { RespuestaContrato } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

@Component({
  selector: 'fp-cancel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cancel.component.html',
  styleUrl: './cancel.component.scss',
})
export class CancelComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private contratos = inject(ContractService);
  private accesos = inject(AccessService);
  private auth = inject(AuthService);
  private sub?: Subscription;

  gymId = 0;
  cargando = true;
  enviando = false;
  error = '';
  exito = '';
  datos: RespuestaContrato | null = null;
  sociosDelMes = 0;

  motivos = [
    { valor: 'Cierre del gimnasio', etiqueta: 'Cierre del gimnasio' },
    { valor: 'Cambio de plataforma', etiqueta: 'Cambio de plataforma' },
    { valor: 'Costos', etiqueta: 'Costos' },
    { valor: 'Otro', etiqueta: 'Otro' },
  ];

  form = this.fb.nonNullable.group({
    reason: ['', Validators.required],
    comments: [''],
    confirmed: [false, Validators.requiredTrue],
  });

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
          this.accesos.resumen(this.gymId).subscribe((res) => (this.sociosDelMes = res.clientesMes));
        },
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudo cargar tu contrato');
          this.cargando = false;
        },
      });
  }

  onCancel(): void {
    if (this.form.invalid || this.enviando) return;
    this.enviando = true;
    this.error = '';
    this.exito = '';

    const v = this.form.getRawValue();
    this.contratos.solicitarBaja(this.gymId, v.reason, v.comments).subscribe({
      next: () => {
        this.exito = 'Tu solicitud de baja quedó registrada. Gymred se pondrá en contacto contigo.';
        this.form.reset({ reason: '', comments: '', confirmed: false });
        this.enviando = false;
        this.contratos.ver(this.gymId).subscribe((r) => (this.datos = r));
      },
      error: (e) => {
        this.error = mensajeDeError(e, 'No se pudo enviar la solicitud');
        this.enviando = false;
      },
    });
  }

  cancelarBaja(): void {
    this.contratos.cancelarBaja(this.gymId).subscribe({
      next: () => {
        this.exito = 'Se canceló tu solicitud de baja.';
        this.contratos.ver(this.gymId).subscribe((r) => (this.datos = r));
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo cancelar la solicitud')),
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
