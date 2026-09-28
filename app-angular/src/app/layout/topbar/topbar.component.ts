import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { GimnasioResumen, Usuario } from '../../core/api.config';

@Component({
  selector: 'fp-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="topbar">
      <!-- El dueno puede tener varias sucursales: aqui elige cual esta viendo. -->
      <div class="gym-picker" *ngIf="gimnasios.length > 1">
        <label for="gymPicker">Gimnasio</label>
        <select id="gymPicker" [(ngModel)]="gimnasioId" (ngModelChange)="cambiar($event)">
          <option *ngFor="let g of gimnasios" [value]="g.id">{{ g.nombre }}</option>
        </select>
      </div>

      <div class="owner">
        <div class="owner-avatar">{{ iniciales }}</div>
        <div>
          <p class="owner-name">{{ usuario?.nombre }}</p>
          <p class="owner-role">{{ usuario?.rol === 'admin' ? 'Administrador' : 'Propietario' }}</p>
        </div>
        <button type="button" class="logout" (click)="salir()">Salir</button>
      </div>
    </header>
  `,
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private subs: Subscription[] = [];

  usuario: Usuario | null = null;
  gimnasios: GimnasioResumen[] = [];
  gimnasioId: number | null = null;
  iniciales = 'FP';

  ngOnInit(): void {
    this.subs.push(
      this.auth.usuario$.subscribe((u) => {
        this.usuario = u;
        this.iniciales = this.auth.iniciales(u?.nombre);
      }),
    );
    this.subs.push(this.auth.gimnasios$.subscribe((g) => (this.gimnasios = g)));
    this.subs.push(this.auth.gimnasioActual$.subscribe((id) => (this.gimnasioId = id)));
  }

  cambiar(id: number | string): void {
    this.auth.cambiarGimnasio(Number(id));
  }

  salir(): void {
    this.auth.salir();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
