// URL del backend. En Docker se puede sobrescribir desde index.html con
// window.__GYMRED_API__ sin tener que recompilar.
export const API_URL: string =
  (window as unknown as { __GYMRED_API__?: string }).__GYMRED_API__ ||
  'http://localhost:8000/api';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'dueno' | 'cliente';
}

export interface GimnasioResumen {
  id: number;
  nombre: string;
  situacion: string;
}

export interface RespuestaLogin {
  token: string;
  usuario: Usuario;
  gimnasios: GimnasioResumen[];
}

export interface Horario {
  id?: number;
  diaSemana: number;
  dia?: string;
  horaApertura: string | null;
  horaCierre: string | null;
  cerrado: boolean;
}

export interface Foto {
  id: number;
  url: string;
  descripcion: string | null;
  portada: boolean;
  orden: number;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Amenidad {
  id: number;
  nombre: string;
  icono: string | null;
}

export interface GimnasioDetalle {
  id: number;
  nombre: string;
  descripcion: string | null;
  calle: string | null;
  colonia: string | null;
  ciudad: string;
  estado: string;
  codigoPostal: string | null;
  telefono: string | null;
  latitud: number | null;
  longitud: number | null;
  capacidadMaxima: number | null;
  categoria: string;
  situacion: string;
  horarios: Horario[];
  fotos: Foto[];
  servicios: Servicio[];
  amenidades: Amenidad[];
}

export interface Precio {
  id: number;
  concepto: string;
  monto: number;
  activo: boolean;
}

export interface MovimientoPrecio {
  id: number;
  concepto: string;
  montoAnterior: number;
  montoNuevo: number;
  cambiadoEn: string;
}

export interface RespuestaPrecios {
  precios: Precio[];
  historial: MovimientoPrecio[];
}

export interface AccesoReciente {
  id: number;
  registrado_en: string;
  resultado: 'permitido' | 'denegado';
  motivo: string | null;
  codigo_leido: string;
  cliente: string | null;
  lector: string | null;
}

export interface LectorResumen {
  numeroSerie: string;
  ubicacion: string | null;
  activo: boolean;
  ultimaConexion: string | null;
}

export interface Resumen {
  gimnasio: GimnasioResumen;
  accesosHoy: number;
  denegadosHoy: number;
  accesosMes: number;
  clientesMes: number;
  ingresoEstimadoMes: number;
  pagoPorVisita: number;
  precioPorVisita: number | null;
  clase: string;
  sociosNuevosMes: number;
  porHora: { hora: number; visitas: number }[];
  ultimosAccesos: AccesoReciente[];
  lectores: LectorResumen[];
}

export interface FilaHistorial {
  id: number;
  registradoEn: string;
  resultado: 'permitido' | 'denegado';
  motivo: string | null;
  codigoLeido: string;
  cliente: string | null;
}

export interface RespuestaHistorial {
  total: number;
  pagina: number;
  porPagina: number;
  paginas: number;
  filas: FilaHistorial[];
}

export interface Reportes {
  porMes: { periodo: string; permitidos: number; denegados: number }[];
  porDiaSemana: { dia: string; visitas: number }[];
  topClientes: { cliente: string; visitas: number }[];
  motivosDenegacion: { motivo: string; veces: number }[];
}

export interface Liquidacion {
  id: number;
  anio: number;
  mes: number;
  visitas: number;
  montoBruto: number;
  /** Ajuste por socios que pasaron su fondo. */
  comision: number;
  montoNeto: number;
  situacion: string;
}

/** Lo que se le paga al gimnasio en un mes. Ver app-api/src/common/tarifas.ts */
export interface GananciaMes {
  anio: number;
  mes: number;
  visitas: number;
  socios: number;
  sociosNuevos: number;
  /** Visitas x su precio (con tope de categoria). */
  montoBruto: number;
  /** Ajuste cuando un socio paso su fondo del mes. */
  recorte: number;
  montoNeto: number;
}

/** Categoria del gimnasio: Esencial o Completo. */
export interface Clasificacion {
  nivel: number;
  clase: string;
  tope: number;
  areas: string[];
  faltaParaCompleto: string[];
}

/** El gimnasio no paga nada: pone su precio por visita y Gymred se lo paga. */
export interface RespuestaContrato {
  afiliacion: {
    id: number;
    fechaInicio: string;
    fechaFin: string | null;
    situacion: string;
    costo: number;
    precioPorVisita: number | null;
    pagoPorVisita: number;
  };
  clasificacion: Clasificacion;
  topes: { nivel: number; nombre: string; tope: number; descripcion: string | null }[];
  mesActual: GananciaMes;
  proximoCorte: string;
  fechaPago: string;
  liquidaciones: Liquidacion[];
  solicitudBaja: { id: number; motivo: string; situacion: string; creadoEn: string } | null;
}

// ----- Resenas -----
export interface Resena {
  id: number;
  calificacion: number;
  comentario: string | null;
  respuesta: string | null;
  respondidoEn: string | null;
  creadoEn: string;
  cliente: string;
  visitas: number;
}

export interface RespuestaResenas {
  resumen: {
    total: number;
    promedio: number;
    promedioUltimos30: number;
    sinResponder: number;
    distribucion: { estrellas: number; cantidad: number; porcentaje: number }[];
  };
  resenas: Resena[];
}

// ----- Clases -----
export interface HorarioClase {
  id?: number;
  diaSemana: number;
  horaInicio: string;
}

export interface Clase {
  id: number;
  idCatalogo: number | null;
  nombre: string;
  instructor: string | null;
  descripcion: string | null;
  duracionMin: number;
  cupo: number;
  activa: boolean;
  horarios: HorarioClase[];
}

export interface SesionClase {
  idHorario: number;
  idClase: number;
  clase: string;
  instructor: string | null;
  fecha: string;
  dia: string;
  horaInicio: string;
  duracionMin: number;
  cupo: number;
  inscritos: number;
  lugares: number;
}

export interface RespuestaClases {
  resumen: {
    clasesActivas: number;
    sesionesSemana: number;
    reservasSemana: number;
    sesionesHoy: number;
    ocupacionPromedio: number;
  };
  clases: Clase[];
  sesiones: SesionClase[];
}

export interface TipoClase {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export type Prioridad = 'baja' | 'media' | 'alta';
export type SituacionIncidencia = 'pendiente' | 'en_progreso' | 'resuelto';

export interface Incidencia {
  id: number;
  idGimnasio: number;
  equipo: string;
  titulo: string;
  descripcion: string | null;
  prioridad: Prioridad;
  situacion: SituacionIncidencia;
  creadoEn: string;
  resueltoEn: string | null;
}

export interface RespuestaIncidencias {
  resumen: { pendientes: number; enProgreso: number; resueltos: number };
  incidencias: Incidencia[];
}

export interface Configuracion {
  idGimnasio: number;
  tema: 'claro' | 'oscuro';
  colorAcento: 'naranja' | 'azul' | 'verde' | 'morado';
  modoValidacion: 'en_linea' | 'tolerancia_sin_conexion';
  toleranciaSegundos: number;
  avisarPorCorreo: boolean;
  avisarAccesosDenegados: boolean;
  avisarIncidencias: boolean;
}

export type CategoriaInventario =
  | 'peso_libre' | 'maquinas' | 'cardio' | 'funcional' | 'clases' | 'otro';

export interface Equipo {
  id: number;
  idCatalogo: number | null;
  categoria: CategoriaInventario;
  nombre: string;
  descripcion: string | null;
  cantidad: number;
  situacion: 'disponible' | 'fuera_de_servicio';
}

export interface GrupoInventario {
  categoria: CategoriaInventario;
  etiqueta: string;
  equipos: Equipo[];
}

export interface RespuestaInventario {
  resumen: { total: number; disponibles: number; fueraDeServicio: number };
  grupos: GrupoInventario[];
  equipos: Equipo[];
}

export interface Pantalla {
  id: number;
  numeroSerie: string;
  ubicacion: string | null;
  activo: boolean;
}

export interface CodigoPantalla {
  pantalla: { numeroSerie: string; ubicacion: string | null };
  codigo: string;
  venceEn: string;
  segundos: number;
}

export interface EquipoCatalogo {
  id: number;
  categoria: CategoriaInventario;
  nombre: string;
  descripcion: string | null;
}

export interface GrupoCatalogo {
  categoria: CategoriaInventario;
  etiqueta: string;
  equipos: EquipoCatalogo[];
}
