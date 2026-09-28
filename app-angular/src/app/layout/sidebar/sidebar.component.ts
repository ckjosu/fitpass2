import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ContractService } from '../../core/contract.service';
import { SOLO_SPRINT_1, enSprint } from '../../core/sprint.config';

interface NavItem {
  path: string;
  label: string;
  icono: string;
}

interface NavGroup {
  titulo: string;
  items: NavItem[];
}

@Component({
  selector: 'fp-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="logo-block">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <path d="M4 9v6M8 6v12M16 6v12M20 9v6M8 12h8" />
          </svg>
        </div>
        <div>
          <p class="logo-title">Gymred</p>
          <p class="logo-sub">Panel de gimnasio</p>
        </div>
      </div>

      <div class="gym-block">
        <div class="gym-avatar">{{ iniciales }}</div>
        <div class="gym-text">
          <p class="gym-name">{{ nombreGimnasio }}</p>
          <p class="gym-plan">{{ plan }}</p>
        </div>
      </div>

      <nav>
        <ng-container *ngFor="let grupo of grupos">
          <p class="nav-group">{{ grupo.titulo }}</p>
          <a
            *ngFor="let item of grupo.items"
            [routerLink]="item.path"
            routerLinkActive="active"
            class="nav-item"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path [attr.d]="item.icono" />
            </svg>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </ng-container>
      </nav>
    </aside>
  `,
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private contratos = inject(ContractService);
  private subs: Subscription[] = [];

  nombreGimnasio = 'Mi gimnasio';
  plan = 'Cargando...';
  iniciales = 'FP';

  // Separados por lo que hace el dueno a diario y lo que toca de vez en cuando.
  private todosLosGrupos: NavGroup[] = [
    {
      titulo: 'Operación',
      items: [
        { path: '/dashboard', label: 'Resumen', icono: 'M4 13h5v7H4zM10 4h5v16h-5zM16 9h4v11h-4z' },
        { path: '/kiosk', label: 'Pantalla de acceso', icono: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z' },
        { path: '/accesses', label: 'Accesos', icono: 'M9 4H5v16h4M13 12h8M18 8l4 4-4 4' },
        { path: '/reports', label: 'Reportes', icono: 'M4 19h16M7 16V9M12 16V5M17 16v-4' },
        { path: '/incidents', label: 'Mantenimiento', icono: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
      ],
    },
    {
      titulo: 'Tu gimnasio',
      items: [
        { path: '/maintenance', label: 'Datos del gimnasio', icono: 'M3 21h18M5 21V8l7-4 7 4v13M10 21v-6h4v6' },
        { path: '/inventory', label: 'Inventario', icono: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10' },
        { path: '/pricing', label: 'Planes y precios', icono: 'M3 9h18M3 9l2-4h14l2 4M3 9v10h18V9M9 14h6' },
      ],
    },
    {
      titulo: 'Cuenta',
      items: [
        { path: '/plan', label: 'Plan Gymred', icono: 'M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.2l5.9-.9z' },
        { path: '/settings', label: 'Configuración', icono: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 007.9 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003 13.9H3a2 2 0 110-4h.1A1.6 1.6 0 004.6 7.9l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 0010 4.6V3a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z' },
      ],
    },
  ];

  // Durante el Sprint 1 el menú solo lista las pantallas del sprint y se
  // ocultan los grupos que quedan vacíos. Ver core/sprint.config.ts.
  grupos: NavGroup[] = SOLO_SPRINT_1
    ? this.todosLosGrupos
        .map((g) => ({ ...g, items: g.items.filter((i) => enSprint(i.path)) }))
        .filter((g) => g.items.length > 0)
    : this.todosLosGrupos;

  ngOnInit(): void {
    // Cada vez que cambia el gimnasio del selector se refresca el bloque de arriba.
    this.subs.push(
      this.auth.gimnasioActual$.subscribe((id) => {
        const gimnasio = this.auth.gimnasios$.value.find((g) => g.id === id);
        this.nombreGimnasio = gimnasio ? gimnasio.nombre : 'Mi gimnasio';
        this.iniciales = this.auth.iniciales(this.nombreGimnasio);
        this.plan = 'Cargando...';
      }),
    );

    this.subs.push(
      this.auth.gimnasioActual$
        .pipe(switchMap((id) => this.contratos.ver(Number(id))))
        .subscribe({
          next: (r) => (this.plan = 'Plan ' + r.contrato.nombre),
          error: () => (this.plan = 'Sin contrato'),
        }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
