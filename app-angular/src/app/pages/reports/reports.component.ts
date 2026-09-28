import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, switchMap } from 'rxjs';
import { AccessService } from '../../core/access.service';
import { AuthService } from '../../core/auth.service';
import { Reportes } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

@Component({
  selector: 'fp-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit, OnDestroy {
  private accesos = inject(AccessService);
  private auth = inject(AuthService);
  private sub?: Subscription;

  cargando = true;
  error = '';
  datos: Reportes | null = null;

  visitasPorMes: { etiqueta: string; valor: number }[] = [];
  visitasPorDia: { etiqueta: string; valor: number }[] = [];
  maxMes = 1;
  maxDia = 1;
  diaTop = '—';
  mesTop = '—';

  private meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  ngOnInit(): void {
    this.sub = this.auth.gimnasioActual$
      .pipe(switchMap((id) => {
        this.cargando = true;
        return this.accesos.reportes(Number(id), 6);
      }))
      .subscribe({
        next: (r) => this.procesar(r),
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudieron cargar los reportes');
          this.cargando = false;
        },
      });
  }

  private procesar(r: Reportes): void {
    this.datos = r;

    this.visitasPorMes = r.porMes.map((m) => {
      const partes = m.periodo.split('-');
      return {
        etiqueta: this.meses[Number(partes[1]) - 1] + ' ' + partes[0].slice(2),
        valor: m.permitidos,
      };
    });
    this.visitasPorDia = r.porDiaSemana.map((d) => ({ etiqueta: d.dia.slice(0, 3), valor: d.visitas }));

    this.maxMes = Math.max(1, ...this.visitasPorMes.map((m) => m.valor));
    this.maxDia = Math.max(1, ...this.visitasPorDia.map((d) => d.valor));

    const mejorDia = [...r.porDiaSemana].sort((a, b) => b.visitas - a.visitas)[0];
    this.diaTop = mejorDia ? mejorDia.dia : '—';

    const mejorMes = [...this.visitasPorMes].sort((a, b) => b.valor - a.valor)[0];
    this.mesTop = mejorMes ? mejorMes.etiqueta : '—';

    this.cargando = false;
  }

  altura(valor: number, maximo: number): number {
    return Math.round((valor / maximo) * 100);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
