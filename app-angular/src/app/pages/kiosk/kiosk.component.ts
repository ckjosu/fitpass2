import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as QRCode from 'qrcode';
import { KioskService } from '../../core/kiosk.service';
import { AuthService } from '../../core/auth.service';
import { CodigoPantalla, Pantalla } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

@Component({
  selector: 'fp-kiosk',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kiosk.component.html',
  styleUrl: './kiosk.component.scss',
})
export class KioskComponent implements OnInit, OnDestroy {
  @ViewChild('lienzo') lienzo?: ElementRef<HTMLCanvasElement>;

  private kiosco = inject(KioskService);
  private auth = inject(AuthService);
  private sub?: Subscription;
  private reloj?: number;

  gymId = 0;
  cargando = true;
  error = '';

  pantallas: Pantalla[] = [];
  serie = '';
  duracion = 30;
  actual: CodigoPantalla | null = null;
  segundosRestantes = 0;
  pantallaCompleta = false;

  ngOnInit(): void {
    this.sub = this.auth.gimnasioActual$.subscribe((id) => {
      this.gymId = Number(id);
      this.cargando = true;
      this.detenerReloj();

      this.kiosco.pantallas(this.gymId).subscribe({
        next: (p) => {
          this.pantallas = p.filter((x) => x.activo);
          this.serie = this.pantallas.length ? this.pantallas[0].numeroSerie : '';
          this.cargando = false;
          if (this.serie) this.renovar();
        },
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudieron cargar las pantallas');
          this.cargando = false;
        },
      });
    });
  }

  /** Pide un código nuevo y lo dibuja. Se repite solo antes de que venza. */
  renovar(): void {
    if (!this.serie) return;
    this.error = '';

    this.kiosco.codigo(this.gymId, this.serie, this.duracion).subscribe({
      next: (c) => {
        this.actual = c;
        this.segundosRestantes = c.segundos;
        this.dibujar(c.codigo);
        this.arrancarReloj();
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo generar el código')),
    });
  }

  private dibujar(texto: string): void {
    // El canvas existe apenas Angular pinta la vista.
    setTimeout(() => {
      const canvas = this.lienzo?.nativeElement;
      if (!canvas) return;
      QRCode.toCanvas(canvas, texto, {
        width: this.pantallaCompleta ? 460 : 280,
        margin: 1,
        color: { dark: '#111111', light: '#FFFFFF' },
      }).catch(() => (this.error = 'No se pudo dibujar el código QR'));
    });
  }

  private arrancarReloj(): void {
    this.detenerReloj();
    this.reloj = window.setInterval(() => {
      this.segundosRestantes--;
      if (this.segundosRestantes <= 0) this.renovar();
    }, 1000);
  }

  private detenerReloj(): void {
    if (this.reloj) window.clearInterval(this.reloj);
    this.reloj = undefined;
  }

  cambiarPantalla(): void {
    this.renovar();
  }

  alternarPantallaCompleta(): void {
    this.pantallaCompleta = !this.pantallaCompleta;
    if (this.actual) this.dibujar(this.actual.codigo);
  }

  ngOnDestroy(): void {
    this.detenerReloj();
    this.sub?.unsubscribe();
  }
}
