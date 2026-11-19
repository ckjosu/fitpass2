import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { ReviewsService } from '../../core/reviews.service';
import { AuthService } from '../../core/auth.service';
import { Resena, RespuestaResenas } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

type Filtro = 'todas' | 'sin_responder' | 'respondidas';

/**
 * Reseñas.
 * El dueño ve su calificación, lo que opinan los socios y les contesta.
 * La respuesta sale en la app debajo de cada reseña.
 */
@Component({
  selector: 'fp-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
})
export class ReviewsComponent implements OnInit, OnDestroy {
  private resenas = inject(ReviewsService);
  private auth = inject(AuthService);
  private sub?: Subscription;

  gymId = 0;
  cargando = true;
  error = '';
  exito = '';
  datos: RespuestaResenas | null = null;

  filtro: Filtro = 'todas';
  estrellas: number | null = null;

  // Reseña que se está contestando y su texto.
  respondiendo: number | null = null;
  texto = '';
  enviando = false;
  readonly maximo = 500;

  readonly filtros: { valor: Filtro; etiqueta: string }[] = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'sin_responder', etiqueta: 'Sin responder' },
    { valor: 'respondidas', etiqueta: 'Respondidas' },
  ];

  ngOnInit(): void {
    this.sub = this.auth.gimnasioActual$
      .pipe(switchMap((id) => {
        this.gymId = Number(id);
        this.cargando = true;
        this.respondiendo = null;
        return this.resenas.lista(this.gymId, this.filtro, this.estrellas);
      }))
      .subscribe({
        next: (r) => {
          this.datos = r;
          this.cargando = false;
        },
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudieron cargar las reseñas');
          this.cargando = false;
        },
      });
  }

  recargar(): void {
    this.resenas.lista(this.gymId, this.filtro, this.estrellas).subscribe({
      next: (r) => (this.datos = r),
      error: (e) => (this.error = mensajeDeError(e, 'No se pudieron cargar las reseñas')),
    });
  }

  cambiarFiltro(f: Filtro): void {
    this.filtro = f;
    this.recargar();
  }

  filtrarEstrellas(e: number): void {
    this.estrellas = this.estrellas === e ? null : e;
    this.recargar();
  }

  responder(r: Resena): void {
    this.respondiendo = r.id;
    this.texto = r.respuesta || '';
    this.exito = '';
    this.error = '';
  }

  cancelar(): void {
    this.respondiendo = null;
    this.texto = '';
  }

  publicar(r: Resena): void {
    const texto = this.texto.trim();
    if (texto.length < 2 || texto.length > this.maximo || this.enviando) return;
    this.enviando = true;
    this.resenas.responder(this.gymId, r.id, texto).subscribe({
      next: () => {
        this.enviando = false;
        this.respondiendo = null;
        this.exito = 'Tu respuesta ya aparece en la app.';
        this.recargar();
      },
      error: (e) => {
        this.error = mensajeDeError(e, 'No se pudo publicar la respuesta');
        this.enviando = false;
      },
    });
  }

  quitarRespuesta(r: Resena): void {
    this.resenas.borrarRespuesta(this.gymId, r.id).subscribe({
      next: () => {
        this.exito = 'Respuesta eliminada.';
        this.recargar();
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo eliminar la respuesta')),
    });
  }

  /** Cinco estrellas: llenas, media o vacías según la calificación. */
  estrellasDe(valor: number): ('llena' | 'media' | 'vacia')[] {
    return [1, 2, 3, 4, 5].map((i) => (valor >= i ? 'llena' : valor >= i - 0.5 ? 'media' : 'vacia'));
  }

  iniciales(nombre: string): string {
    return this.auth.iniciales(nombre || '?');
  }

  /** Texto para cuando no hay reseñas con el filtro elegido. */
  get vacio(): string {
    if (this.estrellas) return `No hay reseñas de ${this.estrellas} ${this.estrellas === 1 ? 'estrella' : 'estrellas'}.`;
    if (this.filtro === 'sin_responder') return 'Contestaste todas tus reseñas. 👏';
    if (this.filtro === 'respondidas') return 'Todavía no respondes ninguna reseña.';
    return 'Todavía no tienes reseñas. Aparecen cuando los socios califican tu gimnasio en la app.';
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
