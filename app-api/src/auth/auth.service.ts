import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ContratoGimnasio, Gimnasio, Usuario } from '../entities';
import { CambiarPasswordDto, LoginDto, RegistroClienteDto, RegistroDuenoDto } from './auth.dto';
import { UsuarioToken } from '../common/security';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private usuarios: Repository<Usuario>,
    @InjectRepository(Gimnasio) private gimnasios: Repository<Gimnasio>,
    private jwt: JwtService,
    private dataSource: DataSource,
  ) {}

  private firmar(u: Usuario) {
    const payload: UsuarioToken = { sub: u.id, email: u.email, rol: u.rol, nombre: u.nombre };
    return this.jwt.sign(payload);
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuarios.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (!usuario || !bcrypt.compareSync(dto.password, usuario.passwordHash)) {
      throw new UnauthorizedException('Correo o contrasena incorrectos');
    }
    if (!usuario.activo) throw new UnauthorizedException('Tu cuenta esta desactivada');

    const gimnasios =
      usuario.rol === 'dueno'
        ? await this.gimnasios.find({ where: { idDueno: usuario.id }, order: { nombre: 'ASC' } })
        : [];

    return {
      token: this.firmar(usuario),
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      gimnasios: gimnasios.map((g) => ({ id: g.id, nombre: g.nombre, situacion: g.situacion })),
    };
  }

  /** Alta de un dueno: crea el usuario, su gimnasio, sus horarios y el contrato basico. */
  async registrarDueno(dto: RegistroDuenoDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.usuarios.findOne({ where: { email } })) {
      throw new BadRequestException('Ese correo ya esta registrado');
    }

    return this.dataSource.transaction(async (m) => {
      const usuario = await m.save(
        m.create(Usuario, {
          nombre: dto.nombre,
          email,
          passwordHash: bcrypt.hashSync(dto.password, 10),
          telefono: dto.telefono,
          rol: 'dueno' as const,
          activo: true,
        }),
      );

      const gimnasio = await m.save(
        m.create(Gimnasio, {
          idDueno: usuario.id,
          nombre: dto.nombreGimnasio,
          calle: dto.calle,
          colonia: dto.colonia,
          ciudad: dto.ciudad || 'Merida',
          estado: 'Yucatan',
          categoria: dto.categoria || 'gimnasio',
          situacion: 'pendiente',
        }),
      );

      // Horario de lunes a sabado por omision, domingo cerrado.
      await m.query(
        `INSERT INTO horarios_gimnasio (id_gimnasio, dia_semana, hora_apertura, hora_cierre, cerrado)
         VALUES (?,1,'06:00:00','22:00:00',0),(?,2,'06:00:00','22:00:00',0),(?,3,'06:00:00','22:00:00',0),
                (?,4,'06:00:00','22:00:00',0),(?,5,'06:00:00','21:00:00',0),(?,6,'08:00:00','14:00:00',0),
                (?,7,NULL,NULL,1)`,
        Array(7).fill(gimnasio.id),
      );

      await m.save(
        m.create(ContratoGimnasio, {
          idGimnasio: gimnasio.id,
          tipo: 'basico' as const,
          nivel: 1,
          tarifaPorVisita: 35,
          cuotaFijaMensual: 0,
          comisionPlataforma: 10,
          fechaInicio: new Date().toISOString().slice(0, 10),
          situacion: 'vigente',
        }),
      );

      return {
        token: this.firmar(usuario),
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
        gimnasios: [{ id: gimnasio.id, nombre: gimnasio.nombre, situacion: gimnasio.situacion }],
      };
    });
  }

  /** Alta de cliente (la usa la app movil). */
  async registrarCliente(dto: RegistroClienteDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.usuarios.findOne({ where: { email } })) {
      throw new BadRequestException('Ese correo ya esta registrado');
    }
    const usuario = await this.usuarios.save(
      this.usuarios.create({
        nombre: dto.nombre,
        email,
        passwordHash: bcrypt.hashSync(dto.password, 10),
        telefono: dto.telefono,
        rol: 'cliente' as const,
        activo: true,
      }),
    );
    return {
      token: this.firmar(usuario),
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    };
  }

  async perfil(id: number) {
    const usuario = await this.usuarios.findOne({ where: { id } });
    const gimnasios =
      usuario.rol === 'dueno'
        ? await this.gimnasios.find({ where: { idDueno: usuario.id }, order: { nombre: 'ASC' } })
        : [];
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono,
      rol: usuario.rol,
      gimnasios: gimnasios.map((g) => ({ id: g.id, nombre: g.nombre, situacion: g.situacion })),
    };
  }

  async cambiarPassword(id: number, dto: CambiarPasswordDto) {
    const usuario = await this.usuarios.findOne({ where: { id } });
    if (!bcrypt.compareSync(dto.actual, usuario.passwordHash)) {
      throw new BadRequestException('Tu contrasena actual no coincide');
    }
    usuario.passwordHash = bcrypt.hashSync(dto.nueva, 10);
    await this.usuarios.save(usuario);
    return { mensaje: 'Contrasena actualizada' };
  }
}
