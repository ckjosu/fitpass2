import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/auth.interceptor';

@Component({
  selector: 'fp-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  cargando = false;
  error = '';

  form = this.fb.nonNullable.group({
    gymName: ['', Validators.required],
    ownerName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    address: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid || this.cargando) return;
    const v = this.form.getRawValue();

    if (v.password !== v.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.cargando = true;
    this.error = '';

    // El backend da de alta al dueño y su gimnasio en un solo paso.
    this.auth
      .registrarDueno({
        nombre: v.ownerName,
        email: v.email,
        password: v.password,
        telefono: v.phone,
        nombreGimnasio: v.gymName,
        calle: v.address,
      })
      .subscribe({
        next: () => this.router.navigateByUrl('/dashboard'),
        error: (e) => {
          this.error = mensajeDeError(e, 'No se pudo crear la cuenta');
          this.cargando = false;
        },
      });
  }
}
