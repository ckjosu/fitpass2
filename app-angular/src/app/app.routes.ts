import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard } from './core/auth.guard';
import { SOLO_SPRINT_1, enSprint } from './core/sprint.config';

// Estas rutas reflejan 1:1 las pantallas definidas para el panel web de Gymred:
// login, register (sin sidebar/topbar) y el resto dentro del "shell" (sidebar + topbar).
const pantallas: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'maintenance',
    loadComponent: () =>
      import('./pages/maintenance/maintenance.component').then((m) => m.MaintenanceComponent),
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./pages/inventory/inventory.component').then((m) => m.InventoryComponent),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./pages/pricing/pricing.component').then((m) => m.PricingComponent),
  },
  {
    path: 'plan',
    loadComponent: () => import('./pages/plan/plan.component').then((m) => m.PlanComponent),
  },
  {
    path: 'accesses',
    loadComponent: () =>
      import('./pages/accesses/accesses.component').then((m) => m.AccessesComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports/reports.component').then((m) => m.ReportsComponent),
  },
  {
    path: 'kiosk',
    loadComponent: () => import('./pages/kiosk/kiosk.component').then((m) => m.KioskComponent),
  },
  {
    path: 'incidents',
    loadComponent: () =>
      import('./pages/incidents/incidents.component').then((m) => m.IncidentsComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'cancel',
    loadComponent: () => import('./pages/cancel/cancel.component').then((m) => m.CancelComponent),
  },
];

// Durante el Sprint 1 solo se publican las pantallas del sprint. Las demás
// siguen en el proyecto; ver core/sprint.config.ts.
const publicadas: Routes = SOLO_SPRINT_1
  ? pantallas.filter((r) => enSprint(r.path as string))
  : pantallas;

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      ...publicadas,
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // Si alguien escribe la dirección de una pantalla que no está publicada
      // en este sprint, regresa al Resumen en vez de sacarlo de la sesión.
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
