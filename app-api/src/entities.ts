import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

// MySQL devuelve DECIMAL como string; este transformer lo convierte a number.
const numT = {
  to: (v: number) => v,
  from: (v: string | null) => (v === null || v === undefined ? null : Number(v)),
};

export type Rol = 'admin' | 'dueno' | 'cliente';
export type TipoContrato = 'basico' | 'premium' | 'elite';
export type Concepto = 'visita' | 'semana' | 'quincena' | 'mes' | 'anual';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column() nombre: string;
  @Column() email: string;
  @Column({ name: 'password_hash' }) passwordHash: string;
  @Column({ nullable: true }) telefono: string;
  @Column({ type: 'enum', enum: ['admin', 'dueno', 'cliente'] }) rol: Rol;
  @Column() activo: boolean;
  @Column({ name: 'creado_en' }) creadoEn: Date;
}

@Entity('gimnasios')
export class Gimnasio {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_dueno' }) idDueno: number;
  @Column() nombre: string;
  @Column({ nullable: true }) descripcion: string;
  @Column({ nullable: true }) calle: string;
  @Column({ nullable: true }) colonia: string;
  @Column() ciudad: string;
  @Column() estado: string;
  @Column({ name: 'codigo_postal', nullable: true }) codigoPostal: string;
  @Column({ nullable: true }) telefono: string;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: numT }) latitud: number;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: numT }) longitud: number;
  @Column({ name: 'capacidad_maxima', nullable: true }) capacidadMaxima: number;
  @Column() categoria: string;
  @Column() situacion: string;

  @ManyToOne(() => Usuario) @JoinColumn({ name: 'id_dueno' }) dueno: Usuario;
  @OneToMany(() => HorarioGimnasio, (h) => h.gimnasio) horarios: HorarioGimnasio[];
  @OneToMany(() => FotoGimnasio, (f) => f.gimnasio) fotos: FotoGimnasio[];
  @OneToMany(() => ServicioGimnasio, (s) => s.gimnasio) servicios: ServicioGimnasio[];
  @OneToMany(() => AmenidadGimnasio, (a) => a.gimnasio) amenidades: AmenidadGimnasio[];
}

@Entity('horarios_gimnasio')
export class HorarioGimnasio {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column({ name: 'dia_semana' }) diaSemana: number;
  @Column({ name: 'hora_apertura', type: 'time', nullable: true }) horaApertura: string;
  @Column({ name: 'hora_cierre', type: 'time', nullable: true }) horaCierre: string;
  @Column() cerrado: boolean;
  @ManyToOne(() => Gimnasio) @JoinColumn({ name: 'id_gimnasio' }) gimnasio: Gimnasio;
}

@Entity('fotos_gimnasio')
export class FotoGimnasio {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column() url: string;
  @Column({ nullable: true }) descripcion: string;
  @Column() portada: boolean;
  @Column() orden: number;
  @ManyToOne(() => Gimnasio) @JoinColumn({ name: 'id_gimnasio' }) gimnasio: Gimnasio;
}

@Entity('servicios_gimnasio')
export class ServicioGimnasio {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column() nombre: string;
  @Column({ nullable: true }) descripcion: string;
  @Column() activo: boolean;
  @ManyToOne(() => Gimnasio) @JoinColumn({ name: 'id_gimnasio' }) gimnasio: Gimnasio;
}

@Entity('amenidades_gimnasio')
export class AmenidadGimnasio {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column() nombre: string;
  @Column({ nullable: true }) icono: string;
  @ManyToOne(() => Gimnasio) @JoinColumn({ name: 'id_gimnasio' }) gimnasio: Gimnasio;
}

@Entity('precios_gimnasio')
export class PrecioGimnasio {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column() concepto: Concepto;
  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: numT }) monto: number;
  @Column() activo: boolean;
  @Column({ name: 'actualizado_en' }) actualizadoEn: Date;
}

@Entity('precios_historial')
export class PrecioHistorial {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column() concepto: Concepto;
  @Column({ name: 'monto_anterior', type: 'decimal', precision: 10, scale: 2, transformer: numT }) montoAnterior: number;
  @Column({ name: 'monto_nuevo', type: 'decimal', precision: 10, scale: 2, transformer: numT }) montoNuevo: number;
  @Column({ name: 'cambiado_en' }) cambiadoEn: Date;
}

@Entity('planes_plataforma')
export class PlanPlataforma {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column() nombre: string;
  @Column({ nullable: true }) descripcion: string;
  @Column({ name: 'precio_mensual', type: 'decimal', precision: 10, scale: 2, transformer: numT }) precioMensual: number;
  @Column() nivel: number;
  @Column({ name: 'visitas_por_dia' }) visitasPorDia: number;
  @Column({ name: 'visitas_por_mes', nullable: true }) visitasPorMes: number;
  @Column() activo: boolean;
}

@Entity('suscripciones')
export class Suscripcion {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_cliente' }) idCliente: number;
  @Column({ name: 'id_plan' }) idPlan: number;
  @Column({ name: 'fecha_inicio', type: 'date' }) fechaInicio: string;
  @Column({ name: 'fecha_fin', type: 'date' }) fechaFin: string;
  @Column() situacion: string;
  @Column({ name: 'renovacion_automatica' }) renovacionAutomatica: boolean;
  @ManyToOne(() => PlanPlataforma) @JoinColumn({ name: 'id_plan' }) plan: PlanPlataforma;
}

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_suscripcion' }) idSuscripcion: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: numT }) monto: number;
  @Column() metodo: string;
  @Column({ nullable: true }) referencia: string;
  @Column() situacion: string;
  @Column({ name: 'pagado_en' }) pagadoEn: Date;
}

@Entity('credenciales')
export class Credencial {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_cliente' }) idCliente: number;
  @Column() identificador: string;
  @Column({ name: 'vence_en' }) venceEn: Date;
  @Column() activa: boolean;
}

@Entity('lectores')
export class Lector {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column({ name: 'numero_serie' }) numeroSerie: string;
  @Column({ nullable: true }) ubicacion: string;
  @Column({ name: 'api_key_hash' }) apiKeyHash: string;
  @Column() activo: boolean;
  @Column({ name: 'codigo_actual', nullable: true }) codigoActual: string;
  @Column({ name: 'codigo_vence_en', nullable: true }) codigoVenceEn: Date;
  @Column({ name: 'ultima_conexion', nullable: true }) ultimaConexion: Date;
}

@Entity('accesos')
export class Acceso {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column({ name: 'id_lector', nullable: true }) idLector: number;
  @Column({ name: 'id_cliente', nullable: true }) idCliente: number;
  @Column({ name: 'id_credencial', nullable: true }) idCredencial: number;
  @Column({ name: 'codigo_leido' }) codigoLeido: string;
  @Column() resultado: 'permitido' | 'denegado';
  @Column({ nullable: true }) motivo: string;
  @Column({ name: 'registrado_en' }) registradoEn: Date;
  @ManyToOne(() => Usuario) @JoinColumn({ name: 'id_cliente' }) cliente: Usuario;
  @ManyToOne(() => Credencial) @JoinColumn({ name: 'id_credencial' }) credencial: Credencial;
}

@Entity('contratos_gimnasio')
export class ContratoGimnasio {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column() tipo: TipoContrato;
  @Column() nivel: number;
  @Column({ name: 'tarifa_por_visita', type: 'decimal', precision: 10, scale: 2, transformer: numT }) tarifaPorVisita: number;
  @Column({ name: 'cuota_fija_mensual', type: 'decimal', precision: 10, scale: 2, transformer: numT }) cuotaFijaMensual: number;
  @Column({ name: 'comision_plataforma', type: 'decimal', precision: 5, scale: 2, transformer: numT }) comisionPlataforma: number;
  @Column({ name: 'fecha_inicio', type: 'date' }) fechaInicio: string;
  @Column({ name: 'fecha_fin', type: 'date', nullable: true }) fechaFin: string;
  @Column() situacion: string;
}

@Entity('liquidaciones')
export class Liquidacion {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column() anio: number;
  @Column() mes: number;
  @Column() visitas: number;
  @Column({ name: 'monto_bruto', type: 'decimal', precision: 12, scale: 2, transformer: numT }) montoBruto: number;
  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: numT }) comision: number;
  @Column({ name: 'monto_neto', type: 'decimal', precision: 12, scale: 2, transformer: numT }) montoNeto: number;
  @Column() situacion: string;
}

@Entity('resenas')
export class Resena {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column({ name: 'id_cliente' }) idCliente: number;
  @Column() calificacion: number;
  @Column({ nullable: true }) comentario: string;
  @Column({ name: 'creado_en' }) creadoEn: Date;
}

@Entity('solicitudes_plan')
export class SolicitudPlan {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column({ name: 'tipo_actual' }) tipoActual: TipoContrato;
  @Column({ name: 'tipo_solicitado' }) tipoSolicitado: TipoContrato;
  @Column({ nullable: true }) mensaje: string;
  @Column() situacion: string;
  @Column({ name: 'creado_en' }) creadoEn: Date;
  @Column({ name: 'resuelto_en', nullable: true }) resueltoEn: Date;
}

@Entity('solicitudes_baja')
export class SolicitudBaja {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column() motivo: string;
  @Column({ nullable: true }) comentario: string;
  @Column() situacion: string;
  @Column({ name: 'creado_en' }) creadoEn: Date;
  @Column({ name: 'resuelto_en', nullable: true }) resueltoEn: Date;
}

export type Prioridad = 'baja' | 'media' | 'alta';
export type SituacionIncidencia = 'pendiente' | 'en_progreso' | 'resuelto';

@Entity('incidencias')
export class Incidencia {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column() equipo: string;
  @Column() titulo: string;
  @Column({ nullable: true }) descripcion: string;
  @Column() prioridad: Prioridad;
  @Column() situacion: SituacionIncidencia;
  @Column({ name: 'reportado_por', nullable: true }) reportadoPor: number;
  @Column({ name: 'creado_en' }) creadoEn: Date;
  @Column({ name: 'actualizado_en' }) actualizadoEn: Date;
  @Column({ name: 'resuelto_en', nullable: true }) resueltoEn: Date;
}

@Entity('configuracion_gimnasio')
export class ConfiguracionGimnasio {
  @PrimaryColumn({ name: 'id_gimnasio', unsigned: true }) idGimnasio: number;
  @Column() tema: 'claro' | 'oscuro';
  @Column({ name: 'color_acento' }) colorAcento: 'naranja' | 'azul' | 'verde' | 'morado';
  @Column({ name: 'modo_validacion' }) modoValidacion: 'en_linea' | 'tolerancia_sin_conexion';
  @Column({ name: 'tolerancia_segundos' }) toleranciaSegundos: number;
  @Column({ name: 'avisar_por_correo' }) avisarPorCorreo: boolean;
  @Column({ name: 'avisar_accesos_denegados' }) avisarAccesosDenegados: boolean;
  @Column({ name: 'avisar_incidencias' }) avisarIncidencias: boolean;
  @Column({ name: 'actualizado_en' }) actualizadoEn: Date;
}

export type CategoriaInventario =
  | 'peso_libre' | 'maquinas' | 'cardio' | 'funcional' | 'clases' | 'otro';

@Entity('inventario_gimnasio')
export class InventarioGimnasio {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ name: 'id_gimnasio' }) idGimnasio: number;
  @Column() categoria: CategoriaInventario;
  @Column() nombre: string;
  @Column({ nullable: true }) descripcion: string;
  @Column() cantidad: number;
  @Column() situacion: 'disponible' | 'fuera_de_servicio';
  @Column({ name: 'creado_en' }) creadoEn: Date;
}
