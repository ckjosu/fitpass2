import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AccessService } from '../../core/access.service';
import { AuthService } from '../../core/auth.service';
import { FilaHistorial } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

@Component({
  selector: 'fp-accesses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accesses.component.html',
  styleUrl: './accesses.component.scss',
})
export class AccessesComponent implements OnInit, OnDestroy {
  private accesos = inject(AccessService);
  private auth = inject(AuthService);
  private sub?: Subscription;

  gymId = 0;
  cargando = true;
  error = '';

  desde = '';
  hasta = '';
  resultado = '';
  buscar = '';

  filas: FilaHistorial[] = [];
  total = 0;
  pagina = 1;
  paginas = 1;

  ngOnInit(): void {
    this.sub = this.auth.gimnasioActual$.subscribe((id) => {
      this.gymId = Number(id);
      this.pagina = 1;
      this.cargar();
    });
  }

  cargar(): void {
    if (!this.gymId) return;
    this.cargando = true;
    this.error = '';

    this.accesos
      .historial(this.gymId, {
        desde: this.desde,
        hasta: this.hasta,
        resultado: this.resultado,
        buscar: this.buscar,
        pagina: this.pagina,
        porPagina: 15,
      })
      .subscribe({
        next: (r) => {
          this.filas = r.filas;
          this.total = r.total;
          this.paginas = r.paginas;
          this.pagina = r.pagina;
          this.cargando = false;
        },
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudo cargar el historial');
          this.cargando = false;
        },
      });
  }

  filtrar(): void {
    this.pagina = 1;
    this.cargar();
  }

  limpiar(): void {
    this.desde = '';
    this.hasta = '';
    this.resultado = '';
    this.buscar = '';
    this.filtrar();
  }

  irA(pagina: number): void {
    if (pagina < 1 || pagina > this.paginas) return;
    this.pagina = pagina;
    this.cargar();
  }

  iniciales(nombre: string | null): string {
    return this.auth.iniciales(nombre || '?');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
