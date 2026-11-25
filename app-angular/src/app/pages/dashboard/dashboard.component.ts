import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { AccessService } from '../../core/access.service';
import { AuthService } from '../../core/auth.service';
import { IncidentsService } from '../../core/incidents.service';
import { Resumen } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';
import { enSprint } from '../../core/sprint.config';

interface StatCard {
  label: string;
  value: string;
  nota: string;
  tono: 'naranja' | 'azul' | 'neutro';
}

interface BarraHora {
  hora: number;
  visitas: number;
  altura: number;
  etiqueta: string;
  actual: boolean;
}

@Component({
  selector: 'fp-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private accesos = inject(AccessService);
  private auth = inject(AuthService);
  private incidencias = inject(IncidentsService);
  private subs: Subscription[] = [];

  // Avisos de la parte de arriba
  reportesPendientes = 0;
  equiposConFalla = '';

  // El aviso lleva a Mantenimiento; si esa pantalla no está publicada en
  // este sprint, no se muestra para no dejar botones muertos.
  // (Ya no hay aviso de renovación: el gimnasio no paga ningún plan.)
  mostrarAvisoMantenimiento = enSprint('incidents');

  cargando = true;
  error = '';
  resumen: Resumen | null = null;
  stats: StatCard[] = [];
  barras: BarraHora[] = [];

  ngOnInit(): void {
    // Se vuelve a pedir el resumen cada vez que cambias de sucursal en el topbar.
    this.subs.push(
      this.auth.gimnasioActual$
        .pipe(switchMap((id) => this.incidencias.lista(Number(id), 'pendiente')))
        .subscribe({
          next: (d) => {
            this.reportesPendientes = d.resumen.pendientes;
            this.equiposConFalla = d.incidencias.slice(0, 3).map((i) => i.equipo).join(', ');
          },
          error: () => (this.reportesPendientes = 0),
        }),
    );

    this.subs.push(this.auth.gimnasioActual$
      .pipe(switchMap((id) => {
        this.cargando = true;
        return this.accesos.resumen(Number(id));
      }))
      .subscribe({
        next: (r) => {
          this.resumen = r;
          this.stats = this.armarStats(r);
          this.barras = this.armarBarras(r);
          this.cargando = false;
        },
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudo cargar el resumen');
          this.cargando = false;
        },
      }));
  }

  private armarStats(r: Resumen): StatCard[] {
    return [
      {
        label: 'Accesos del mes',
        value: String(r.accesosMes),
        nota: r.clientesMes + ' socios distintos · ' + r.sociosNuevosMes + ' nuevos',
        tono: 'azul',
      },
      {
        label: 'Ganancia estimada del mes',
        value: '$' + r.ingresoEstimadoMes.toLocaleString('es-MX'),
        nota: r.precioPorVisita
          ? 'A $' + r.pagoPorVisita.toLocaleString('es-MX') + ' por visita · gimnasio ' + r.clase
          : 'Pon tu precio por visita en Mis ganancias',
        tono: 'naranja',
      },
      {
        label: 'Accesos denegados hoy',
        value: String(r.denegadosHoy),
        nota: r.denegadosHoy > 0 ? 'Revisa los motivos en Accesos' : 'Ninguno por ahora',
        tono: 'neutro',
      },
    ];
  }

  /** Distribucion de entradas por hora, de 5 a 22, para la grafica del panel. */
  private armarBarras(r: Resumen): BarraHora[] {
    const maximo = Math.max(1, ...r.porHora.map((h) => h.visitas));
    const ahora = new Date().getHours();
    const barras: BarraHora[] = [];

    for (let hora = 5; hora <= 22; hora++) {
      const dato = r.porHora.find((h) => h.hora === hora);
      const visitas = dato ? dato.visitas : 0;
      barras.push({
        hora,
        visitas,
        altura: visitas === 0 ? 3 : Math.max(8, Math.round((visitas / maximo) * 100)),
        etiqueta: hora % 3 === 0 ? String(hora) : '',
        actual: hora === ahora,
      });
    }
    return barras;
  }

  /** Fecha de hoy para el encabezado, p. ej. "martes 24 de noviembre". */
  hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  iniciales(nombre: string | null): string {
    return this.auth.iniciales(nombre || '?');
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
