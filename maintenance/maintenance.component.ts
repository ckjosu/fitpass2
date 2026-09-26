import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { GymsService } from '../../core/gyms.service';
import { AuthService } from '../../core/auth.service';
import { Foto, GimnasioDetalle } from '../../core/api.config';
import { mensajeDeError } from '../../core/auth.interceptor';

@Component({
  selector: 'fp-maintenance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.scss',
})
export class MaintenanceComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private gyms = inject(GymsService);
  private auth = inject(AuthService);
  private sub?: Subscription;

  // La API usa 1 = lunes ... 7 = domingo, igual que este arreglo.
  days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  categorias = ['gimnasio', 'crossfit', 'yoga', 'box', 'funcional'];

  gymId = 0;
  cargando = true;
  guardando = false;
  error = '';
  exito = '';
  fotos: Foto[] = [];

  generalForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    categoria: ['gimnasio', Validators.required],
    telefono: [''],
    calle: [''],
    colonia: [''],
    ciudad: [''],
    codigoPostal: [''],
    descripcion: [''],
  });

  scheduleForm = this.fb.group({
    days: this.fb.array(
      this.days.map((day) =>
        this.fb.nonNullable.group({
          day,
          open: ['08:00'],
          close: ['22:00'],
          closed: [false],
        }),
      ),
    ),
  });

  get scheduleDays(): FormArray {
    return this.scheduleForm.get('days') as FormArray;
  }

  ngOnInit(): void {
    this.sub = this.auth.gimnasioActual$
      .pipe(switchMap((id) => {
        this.gymId = Number(id);
        this.cargando = true;
        return this.gyms.detalle(this.gymId);
      }))
      .subscribe({
        next: (g) => this.llenar(g),
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudo cargar el gimnasio');
          this.cargando = false;
        },
      });
  }

  private llenar(g: GimnasioDetalle): void {
    this.generalForm.patchValue({
      nombre: g.nombre,
      categoria: g.categoria,
      telefono: g.telefono || '',
      calle: g.calle || '',
      colonia: g.colonia || '',
      ciudad: g.ciudad || '',
      codigoPostal: g.codigoPostal || '',
      descripcion: g.descripcion || '',
    });

    this.days.forEach((_, i) => {
      const horario = g.horarios.find((h) => h.diaSemana === i + 1);
      this.scheduleDays.at(i).patchValue({
        open: horario && horario.horaApertura ? horario.horaApertura.slice(0, 5) : '08:00',
        close: horario && horario.horaCierre ? horario.horaCierre.slice(0, 5) : '22:00',
        closed: horario ? horario.cerrado : false,
      });
    });

    this.fotos = g.fotos;
    this.cargando = false;
  }

  onSave(): void {
    if (this.generalForm.invalid || this.guardando) return;
    this.guardando = true;
    this.error = '';
    this.exito = '';

    const horarios = this.scheduleDays.controls.map((c, i) => {
      const v = c.value as { open: string; close: string; closed: boolean };
      return {
        diaSemana: i + 1,
        horaApertura: v.closed ? null : v.open + ':00',
        horaCierre: v.closed ? null : v.close + ':00',
        cerrado: v.closed,
      };
    });

    this.gyms
      .guardarDatos(this.gymId, this.generalForm.getRawValue())
      .pipe(switchMap(() => this.gyms.guardarHorarios(this.gymId, horarios)))
      .subscribe({
        next: () => {
          this.exito = 'Los cambios se guardaron correctamente.';
          this.auth.renombrarGimnasio(this.gymId, this.generalForm.getRawValue().nombre);
          this.guardando = false;
        },
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudieron guardar los cambios');
          this.guardando = false;
        },
      });
  }

  subirFoto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files && input.files.length ? input.files[0] : null;
    if (!archivo) return;

    this.error = '';
    this.gyms.subirFoto(this.gymId, archivo).subscribe({
      next: (f) => {
        this.fotos.push(f);
        input.value = '';
      },
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo subir la foto')),
    });
  }

  removePhoto(foto: Foto): void {
    this.gyms.borrarFoto(this.gymId, foto.id).subscribe({
      next: () => (this.fotos = this.fotos.filter((f) => f.id !== foto.id)),
      error: (e) => (this.error = mensajeDeError(e, 'No se pudo eliminar la foto')),
    });
  }

  nombreArchivo(url: string): string {
    return url.split('/').pop() || url;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
