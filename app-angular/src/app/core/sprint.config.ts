/**
 * Interruptor de la demostración del Sprint 1.
 *
 * Con SOLO_SPRINT_1 en true el panel solo publica las pantallas listadas en
 * RUTAS_SPRINT_1. Las demás siguen completas en el proyecto: sus carpetas,
 * sus servicios y sus endpoints no se tocaron, solo no se registran en las
 * rutas ni aparecen en el menú.
 *
 * Para volver al panel completo, cambia true por false. Nada más.
 */
export const SOLO_SPRINT_1 = true;

/** Pantallas que se muestran durante el Sprint 1. */
export const RUTAS_SPRINT_1 = ['dashboard', 'maintenance', 'inventory'];

/** true si esa ruta se debe mostrar ahora. */
export function enSprint(ruta: string): boolean {
  if (!SOLO_SPRINT_1) return true;
  return RUTAS_SPRINT_1.includes(ruta.replace(/^\//, ''));
}
