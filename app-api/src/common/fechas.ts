/**
 * Fechas en la hora de los gimnasios. El servidor puede correr en UTC
 * (Docker), pero "hoy" y "a las 7:00" son de la zona del gimnasio.
 */
export const ZONA = process.env.ZONA_HORARIA || 'America/Merida';

/** Fecha y hora local como { fecha: 'YYYY-MM-DD', hora: 'HH:MM:SS' }. */
export function ahoraLocal(d = new Date()): { fecha: string; hora: string } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(d);
  const v = (t: string) => partes.find((p) => p.type === t)?.value || '00';
  const hora = v('hour') === '24' ? '00' : v('hour');
  return { fecha: `${v('year')}-${v('month')}-${v('day')}`, hora: `${hora}:${v('minute')}:${v('second')}` };
}

/** Suma dias a una fecha 'YYYY-MM-DD'. */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

/** Dia de la semana de una fecha 'YYYY-MM-DD': 1 = lunes ... 7 = domingo. */
export function diaSemana(fecha: string): number {
  const [a, m, d] = fecha.split('-').map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return dia === 0 ? 7 : dia;
}
