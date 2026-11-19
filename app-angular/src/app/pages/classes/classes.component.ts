import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { ClaseForm, ClassesService } from '../../core/classes.service';
import { AuthService } from '../../core/auth.service';
import { Clase, HorarioClase, RespuestaClases, SesionClase, TipoClase } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

interface Bloque {
  idClase: number;
  clase: string;
  hora: string;
  cupo: number;
  activa: boolean;
}

/**
 * Clases del gimnasio.
 * El dueño arma su horario semanal (spinning, yoga, box...) con cupo por
 * sesión. Los socios Gymred apartan su lugar desde la app y aquí se ve
 * cuántos van a cada sesión.
 */
@Component({
  selector: 'fp-classes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.scss',
})
export class ClassesComponent implements OnInit, OnDestroy {
  private servicio = inject(ClassesService);
  private auth = inject(AuthService);
  private sub?: Subscription;

  @ViewChild('formulario') formulario?: ElementRef<HTMLElement>;

  readonly dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  readonly diasCortos = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  gymId = 0;
  cargando = true;
  error = '';
  exito = '';
  datos: RespuestaClases | null = null;
  tipos: TipoClase[] = [];
  semana: Bloque[][] = [];

  // Formulario de alta / edición
  mostrarForm = false;
  editando: Clase | null = null;
  guardando = false;
  form: ClaseForm & { tipo: number | 'otra' | null } = this.vacio();

  // Inscritos de una sesión (se abren al dar clic)
  abierta: string | null = null;
  inscritos: { id: number; cliente: string }[] = [];

  ngOnInit(): void {
    this.servicio.tipos().subscribe((t) => (this.tipos = t));
    this.sub = this.auth.gimnasioActual$
      .pipe(switchMap((id) => {
        this.gymId = Number(id);
        this.cargando = true;
        this.cerrarForm();
        return this.servicio.lista(this.gymId);
      }))
      .subscribe({
        next: (r) => this.cargar(r),
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudieron cargar las clases');
          this.cargando = false;
        },
      });
  }

  private cargar(r: RespuestaClases): void {
    this.datos = r;
    this.cargando = false;
    // Horario semanal: un renglón por día con sus clases ordenadas por hora.
    this.semana = this.dias.map((_, i) =>
      r.clases
        .flatMap((c) =>
          c.horarios
            .filter((h) => h.diaSemana === i + 1)
            .map((h) => ({ idClase: c.id, clase: c.nombre, hora: h.horaInicio.slice(0, 5), cupo: c.cupo, activa: c.activa })),
        )
        .sort((a, b) => a.hora.localeCompare(b.hora)),
    );
  }

  private recargar(): void {
    this.servicio.lista(this.gymId).subscribe({
      next: (r) => this.cargar(r),
      error: (e) => (this.error = mensajeDeError(e, 'No se pudieron cargar las clases')),
    });
  }

  // ----- Formulario -----

  private vacio(): ClaseForm & { tipo: number | 'otra' | null } {
    return {
      tipo: null,
      nombre: '',
      instructor: '',
      descripcion: '',
      duracionMin: 60,
      cupo: 15,
      activa: true,
      horarios: [{ diaSemana: 1, horaInicio: '07:00' }],
    };
  }

  nueva(): void {
    this.editando = null;
    this.form = this.vacio();
    this.abrirForm();
  }

  editar(c: Clase): void {
    this.editando = c;
    this.form = {
      tipo: c.idCatalogo ?? 'otra',
      nombre: c.idCatalogo ? '' : c.nombre,
      instructor: c.instructor || '',
      descripcion: c.descripcion || '',
      duracionMin: c.duracionMin,
      cupo: c.cupo,
      activa: c.activa,
      horarios: c.horarios.map((h) => ({ diaSemana: h.diaSemana, horaInicio: h.horaInicio.slice(0, 5) })),
    };
    this.abrirForm();
  }

  editarPorId(idClase: number): void {
    const c = this.datos?.clases.find((x) => x.id === idClase);
    if (c) this.editar(c);
  }

  private abrirForm(): void {
    this.mostrarForm = true;
    this.error = '';
    this.exito = '';
    setTimeout(() => this.formulario?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  cerrarForm(): void {
    this.mostrarForm = false;
    this.editando = null;
  }

  agregarHorario(): void {
    const ultimo = this.form.horarios[this.form.horarios.length - 1];
    this.form.horarios.push({
      diaSemana: ultimo ? Math.min(7, ultimo.diaSemana + 1) : 1,
      horaInicio: ultimo ? ultimo.horaInicio : '07:00',
    });
  }

  quitarHorario(i: number): void {
    this.form.horarios.splice(i, 1);
  }

  get formValido(): boolean {
    const f = this.form;
    const tieneTipo = typeof f.tipo === 'number' || (f.tipo === 'otra' && (f.nombre || '').trim().length >= 3);
    return (
      tieneTipo &&
      f.duracionMin >= 15 &&
      f.cupo >= 1 &&
      f.horarios.length > 0 &&
      f.horarios.every((h) => !!h.horaInicio)
    );
  }

  guardar(): void {
    if (!this.formValido || this.guardando) return;
    const f = this.form;
    const datos: ClaseForm = {
      idCatalogo: typeof f.tipo === 'number' ? f.tipo : null,
      nombre: f.tipo === 'otra' ? (f.nombre || '').trim() : undefined,
      instructor: (f.instructor || '').trim() || undefined,
      descripcion: (f.descripcion || '').trim() || undefined,
      duracionMin: Number(f.duracionMin),
      cupo: Number(f.cupo),
      activa: f.activa,
      horarios: f.horarios.map((h) => ({ diaSemana: Number(h.diaSemana), horaInicio: h.horaInicio })),
    };
    if (datos.idCatalogo === null) delete datos.idCatalogo;

    this.guardando = true;
    this.error = '';
    const peticion = this.editando
      ? this.servicio.actualizar(this.gymId, this.editando.id, datos)
      : this.servicio.crear(this.gymId, datos);

    peticion.subscribe({
      next: () => {
        this.exito = this.editando ? 'Clase actualizada.' : 'Clase creada. Ya la pueden reservar en la app.';
        this.guardando = false;
        this.cerrarForm();
        this.recargar();
      },
      error: (e) => {
        this.error = mensajeDeError(e, 'No se pudo guardar la clase');
        this.guardando = false;
      },
    });
  }

  cambiarEstado(c: Clase): void {
    const datos: ClaseForm = {
      ...(c.idCatalogo ? { idCatalogo: c.idCatalogo } : { nombre: c.nombre }),
      instructor: c.instructor || undefined,
      descripcion: c.descripcion || undefined,
      duracionMin: c.duracionMin,
      cupo: c.cupo,
      activa: !c.activa,
      horarios: c.horarios.map((h) => ({ diaSemana: h.diaSemana, horaInicio: h.horaInicio.slice(0, 5) })),
    };
    this.servicio.actualizar(this.gymId, c.id, datos).subscribe({
      next: () => {
        this.exito = c.activa ? `${c.nombre} ya no se puede reservar.` : `${c.nombre} está activa otra vez.`;
        this.recargar();
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo cambiar la clase')),
    });
  }

  borrar(c: Clase): void {
    this.servicio.borrar(this.gymId, c.id).subscribe({
      next: () => {
        this.exito = 'Clase eliminada.';
        if (this.editando?.id === c.id) this.cerrarForm();
        this.recargar();
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo eliminar la clase')),
    });
  }

  // ----- Sesiones -----

  clave(s: SesionClase): string {
    return `${s.idHorario}|${s.fecha}`;
  }

  verInscritos(s: SesionClase): void {
    const k = this.clave(s);
    if (this.abierta === k) {
      this.abierta = null;
      return;
    }
    this.abierta = k;
    this.inscritos = [];
    this.servicio.inscritos(this.gymId, s.idHorario, s.fecha).subscribe((r) => (this.inscritos = r));
  }

  porcentaje(s: SesionClase): number {
    return Math.min(100, Math.round((s.inscritos / s.cupo) * 100));
  }

  esHoy(fecha: string): boolean {
    const d = new Date();
    const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return fecha === hoy;
  }

  textoHorarios(horarios: HorarioClase[]): string {
    return horarios.map((h) => `${this.diasCortos[h.diaSemana - 1]} ${h.horaInicio.slice(0, 5)}`).join(' · ');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
