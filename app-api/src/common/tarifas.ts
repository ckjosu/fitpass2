import { EntityManager } from 'typeorm';

/**
 * Modelo de pago de FITNEX / Gymred (tipo Wellhub, con los planes del Canvas:
 * Esencial $400 y Plus $500; 30% para FITNEX y 70% para gimnasios).
 *
 * 1. El gimnasio no paga nada.
 * 2. Cada gimnasio es Esencial o Completo; la categoria sale sola de su
 *    inventario. Cada categoria tiene un tope por visita.
 * 3. Por cada visita se le paga al gimnasio su precio por visita, sin pasar
 *    el tope de su categoria. Se guarda en accesos.pago_gimnasio.
 * 4. Cada socio tiene un fondo al mes = porcentaje_fondo (70%) de su plan.
 *    Es el tope de lo que FITNEX paga por el. Si sus visitas suman mas,
 *    se pagan en proporcion (factor = fondo / total). Lo que no usa del
 *    fondo se queda en FITNEX.
 *
 * Asi FITNEX nunca paga mas del 70% de lo que cobro.
 */

/** Areas del inventario que se muestran en la ficha del gimnasio. */
export const AREAS = ['peso_libre', 'maquinas', 'cardio', 'funcional', 'clases'] as const;
export const NOMBRE_AREA: Record<string, string> = {
  peso_libre: 'Peso libre',
  maquinas: 'Maquinas',
  cardio: 'Cardio',
  funcional: 'Funcional',
  clases: 'Clases',
};

/** Lo que necesita un gimnasio para ser Completo: todos los grupos musculares. */
export const AREAS_COMPLETO = ['peso_libre', 'maquinas', 'cardio'] as const;

export interface Clasificacion {
  nivel: number;
  clase: string;
  /** Lo maximo que se le paga por visita en su categoria. */
  tope: number;
  areas: string[];
  /** Que le falta para ser Completo (vacio si ya lo es). */
  faltaParaCompleto: string[];
}

export interface Tope {
  nivel: number;
  nombre: string;
  tope: number;
  descripcion: string | null;
}

export async function topes(m: EntityManager): Promise<Tope[]> {
  const filas = await m.query(
    'SELECT nivel, nombre, descripcion, tope_por_visita AS tope FROM categorias_gimnasio ORDER BY nivel',
  );
  return filas.map((f: any) => ({
    nivel: Number(f.nivel),
    nombre: f.nombre,
    tope: Number(f.tope),
    descripcion: f.descripcion,
  }));
}

export async function clasificar(m: EntityManager, idGimnasio: number): Promise<Clasificacion> {
  const areas: string[] = (
    await m.query(
      `SELECT DISTINCT categoria FROM inventario_gimnasio
       WHERE id_gimnasio = ? AND situacion = 'disponible' AND cantidad > 0`,
      [idGimnasio],
    )
  )
    .map((f: any) => f.categoria)
    .filter((c: string) => (AREAS as readonly string[]).includes(c));

  // Las clases armadas en el modulo de Clases tambien cuentan como area.
  if (!areas.includes('clases')) {
    const [conClases] = await m.query(
      `SELECT COUNT(*) AS total FROM clases_gimnasio c
       WHERE c.id_gimnasio = ? AND c.activa = 1
         AND EXISTS (SELECT 1 FROM clases_horario h WHERE h.id_clase = c.id)`,
      [idGimnasio],
    );
    if (Number(conClases.total) > 0) areas.push('clases');
  }

  const faltan = AREAS_COMPLETO.filter((a) => !areas.includes(a)).map((a) => NOMBRE_AREA[a]);
  const nivel = faltan.length === 0 ? 2 : 1;
  const lista = await topes(m);
  const t = lista.find((x) => x.nivel === nivel) || { nombre: nivel === 2 ? 'Completo' : 'Esencial', tope: 0 };

  return {
    nivel,
    clase: t.nombre,
    tope: t.tope,
    areas: areas.map((a) => NOMBRE_AREA[a]),
    faltaParaCompleto: faltan.length ? [`Agregar a tu inventario: ${faltan.join(', ')}`] : [],
  };
}

/** Precio por visita sin pasar el tope de la categoria. */
export function pagoPorVisita(precio: number | null | undefined, tope: number): number {
  if (!precio || precio <= 0) return 0;
  return Math.min(Number(precio), Number(tope));
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export interface PagoGimnasio {
  idGimnasio: number;
  /** Visitas de socios Esencial y Plus. */
  visitas: number;
  socios: number;
  /** Visitas x precio (con tope de categoria). */
  montoBruto: number;
  /** Descuento porque algun socio paso su fondo. */
  recorte: number;
  /** Lo que se le deposita. */
  montoNeto: number;
}

export interface CalculoMes {
  anio: number;
  mes: number;
  gimnasios: Map<number, PagoGimnasio>;
  totales: {
    socios: number;
    cobrado: number;
    fondos: number;
    pagadoGimnasios: number;
    sobranteFondos: number;
    ingresoFitnex: number;
  };
}

/**
 * Calcula lo que se le paga a cada gimnasio en un mes, socio por socio.
 * Sirve para el estimado del mes en curso y para el cierre de mes.
 */
export async function calcularMes(m: EntityManager, anio: number, mes: number): Promise<CalculoMes> {
  const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const fin = new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);

  // Plan de cada socio en ese mes: la suscripcion mas reciente que lo cubre.
  const planes = await m.query(
    `SELECT s.id_cliente AS idCliente,
            p.precio_mensual AS precio, p.porcentaje_fondo AS porcentaje
     FROM suscripciones s JOIN planes_plataforma p ON p.id = s.id_plan
     WHERE s.situacion IN ('activa', 'vencida') AND s.fecha_inicio <= ? AND s.fecha_fin >= ?
       AND s.id = (SELECT s2.id FROM suscripciones s2
                   WHERE s2.id_cliente = s.id_cliente AND s2.situacion IN ('activa', 'vencida')
                     AND s2.fecha_inicio <= ? AND s2.fecha_fin >= ?
                   ORDER BY s2.fecha_inicio DESC, s2.id DESC LIMIT 1)`,
    [fin, inicio, fin, inicio],
  );

  const visitas = await m.query(
    `SELECT id_cliente AS idCliente, id_gimnasio AS idGimnasio,
            COUNT(*) AS visitas, COALESCE(SUM(pago_gimnasio), 0) AS bruto
     FROM accesos
     WHERE resultado = 'permitido' AND id_cliente IS NOT NULL
       AND registrado_en >= ? AND registrado_en < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY id_cliente, id_gimnasio`,
    [inicio, fin],
  );

  const gimnasios = new Map<number, PagoGimnasio & { _socios: Set<number> }>();
  const gym = (id: number) => {
    if (!gimnasios.has(id)) {
      gimnasios.set(id, {
        idGimnasio: id, visitas: 0, socios: 0, montoBruto: 0, recorte: 0, montoNeto: 0, _socios: new Set(),
      });
    }
    return gimnasios.get(id)!;
  };

  const porSocio = new Map<number, { idGimnasio: number; visitas: number; bruto: number }[]>();
  for (const v of visitas) {
    const lista = porSocio.get(Number(v.idCliente)) || [];
    lista.push({ idGimnasio: Number(v.idGimnasio), visitas: Number(v.visitas), bruto: Number(v.bruto) });
    porSocio.set(Number(v.idCliente), lista);
  }

  let cobrado = 0;
  let fondos = 0;
  let pagado = 0;

  for (const p of planes) {
    const idCliente = Number(p.idCliente);
    const fondo = (Number(p.precio) * Number(p.porcentaje)) / 100;
    cobrado += Number(p.precio);
    fondos += fondo;

    // Precio por visita, con tope total = fondo del socio.
    const suyas = porSocio.get(idCliente) || [];
    const total = suyas.reduce((t, x) => t + x.bruto, 0);
    const factor = total > fondo && total > 0 ? fondo / total : 1;
    for (const x of suyas) {
      const g = gym(x.idGimnasio);
      g.visitas += x.visitas;
      g._socios.add(idCliente);
      g.montoBruto += x.bruto;
      g.recorte += x.bruto * (1 - factor);
      pagado += x.bruto * factor;
    }
  }

  const salida = new Map<number, PagoGimnasio>();
  for (const [id, g] of gimnasios) {
    const { _socios, ...resto } = g;
    salida.set(id, {
      ...resto,
      socios: _socios.size,
      montoBruto: r2(g.montoBruto),
      recorte: r2(g.recorte),
      montoNeto: r2(g.montoBruto - g.recorte),
    });
  }

  return {
    anio,
    mes,
    gimnasios: salida,
    totales: {
      socios: planes.length,
      cobrado: r2(cobrado),
      fondos: r2(fondos),
      pagadoGimnasios: r2(pagado),
      sobranteFondos: r2(fondos - pagado),
      ingresoFitnex: r2(cobrado - pagado),
    },
  };
}

/** Lo de un gimnasio en un mes (ceros si no tuvo movimiento). */
export async function pagoDelGimnasio(m: EntityManager, idGimnasio: number, anio: number, mes: number) {
  const calculo = await calcularMes(m, anio, mes);
  const g = calculo.gimnasios.get(idGimnasio) || {
    idGimnasio, visitas: 0, socios: 0, montoBruto: 0, recorte: 0, montoNeto: 0,
  };

  // Socio nuevo: su primera visita a este gimnasio cae en este mes.
  const [nuevos] = await m.query(
    `SELECT COUNT(*) AS total FROM (
       SELECT id_cliente, MIN(registrado_en) AS primera FROM accesos
       WHERE id_gimnasio = ? AND resultado = 'permitido' AND id_cliente IS NOT NULL
       GROUP BY id_cliente) t
     WHERE YEAR(t.primera) = ? AND MONTH(t.primera) = ?`,
    [idGimnasio, anio, mes],
  );

  return { anio, mes, ...g, sociosNuevos: Number(nuevos.total || 0) };
}
