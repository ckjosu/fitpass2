import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { SettingsService } from '../../core/settings.service';
import { ThemeService } from '../../core/theme.service';
import { AuthService } from '../../core/auth.service';
import { Configuracion } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

@Component({
  selector: 'fp-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private settings = inject(SettingsService);
  private auth = inject(AuthService);
  private tema = inject(ThemeService);
  private sub?: Subscription;

  gymId = 0;
  cargando = true;
  guardando = false;
  error = '';
  exito = '';

  acentos = [
    { valor: 'naranja', etiqueta: 'Naranja', color: '#EA580C' },
    { valor: 'azul', etiqueta: 'Azul', color: '#2563EB' },
    { valor: 'verde', etiqueta: 'Verde', color: '#16A34A' },
    { valor: 'morado', etiqueta: 'Morado', color: '#7C3AED' },
  ];

  form = this.fb.nonNullable.group({
    tema: ['claro'],
    colorAcento: ['naranja'],
    modoValidacion: ['en_linea'],
    toleranciaSegundos: [300],
    avisarPorCorreo: [true],
    avisarAccesosDenegados: [true],
    avisarIncidencias: [true],
  });

  ngOnInit(): void {
    this.sub = this.auth.gimnasioActual$
      .pipe(switchMap((id) => {
        this.gymId = Number(id);
        this.cargando = true;
        return this.settings.ver(this.gymId);
      }))
      .subscribe({
        next: (c) => {
          this.form.patchValue(c as Partial<Configuracion>);
          this.tema.aplicar(c.tema, c.colorAcento);
          this.cargando = false;
        },
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudo cargar la configuración');
          this.cargando = false;
        },
      });
  }

  elegirAcento(valor: string): void {
    this.form.patchValue({ colorAcento: valor });
    // Se ve el cambio al momento, aunque todavia no le des Guardar.
    this.tema.aplicar(null, valor);
  }

  cambiarTema(valor: string): void {
    this.form.patchValue({ tema: valor });
    this.tema.aplicar(valor, null);
  }

  guardar(): void {
    if (this.guardando) return;
    this.guardando = true;
    this.error = '';
    this.exito = '';

    this.settings.guardar(this.gymId, this.form.getRawValue() as Partial<Configuracion>).subscribe({
      next: (c) => {
        this.tema.aplicar(c.tema, c.colorAcento);
        this.exito = 'Configuración guardada.';
        this.guardando = false;
      },
      error: (e) => {
        this.error = mensajeDeError(e, 'No se pudo guardar la configuración');
        this.guardando = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
