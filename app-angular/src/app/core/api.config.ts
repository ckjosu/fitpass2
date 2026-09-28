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
  contrato: { tipo: string; tarifaPorVisita: number; comision: number } | null;
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

export interface PlanPlataforma {
  tipo: 'basico' | 'premium' | 'elite';
  nombre: string;
  precio: string;
  nivel: number;
  beneficios: string[];
  actual: boolean;
}

export interface Liquidacion {
  id: number;
  anio: number;
  mes: number;
  visitas: number;
  montoBruto: number;
  comision: number;
  montoNeto: number;
  situacion: string;
}

export interface RespuestaContrato {
  contrato: {
    id: number;
    tipo: string;
    nombre: string;
    nivel: number;
    tarifaPorVisita: number;
    cuotaFijaMensual: number;
    comisionPlataforma: number;
    fechaInicio: string;
    fechaFin: string | null;
    situacion: string;
  };
  planes: PlanPlataforma[];
  facturacion: {
    proximoVencimiento: string;
    ciclo: string;
    comision: string;
    tarifaPorVisita: number;
  };
  liquidaciones: Liquidacion[];
  solicitudPendiente: { tipoSolicitado: string; situacion: string } | null;
  solicitudBaja: { id: number; motivo: string; situacion: string; creadoEn: string } | null;
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
