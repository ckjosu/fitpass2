import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AuthService } from '../../core/auth.service';
import { SettingsService } from '../../core/settings.service';
import { ThemeService } from '../../core/theme.service';

// Shell compartido por todas las pantallas del panel excepto login/register:
// sidebar fijo + topbar + <router-outlet> para el contenido de cada página.
@Component({
  selector: 'fp-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="fp-shell">
      <fp-sidebar></fp-sidebar>
      <div class="fp-content">
        <fp-topbar></fp-topbar>
        <main class="fp-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private settings = inject(SettingsService);
  private tema = inject(ThemeService);
  private sub?: Subscription;

  ngOnInit(): void {
    // Cada gimnasio guarda su propio tema y color: al entrar o al cambiar
    // de sucursal se aplica el que corresponde.
    this.tema.restaurar();

    this.sub = this.auth.gimnasioActual$
      .pipe(switchMap((id) => this.settings.ver(Number(id))))
      .subscribe({
        next: (c) => this.tema.aplicar(c.tema, c.colorAcento),
        error: () => this.tema.restaurar(),
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
