import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ContratoGimnasio, Gimnasio, RecuperacionPassword, Usuario } from '../entities';
import {
  ActualizarPerfilDto,
  CambiarPasswordDto,
  LoginDto,
  RecuperarDto,
  RegistroClienteDto,
  RegistroDuenoDto,
  RestablecerDto,
} from './auth.dto';
import { CorreoService } from '../common/correo.service';
import {
  MAX_CODIGOS_POR_HORA,
  MAX_INTENTOS_CODIGO,
  MAX_INTENTOS_LOGIN,
  MINUTOS_BLOQUEO,
  MINUTOS_CODIGO,
} from '../common/config-seguridad';

// Hash de relleno: si el correo no existe se compara contra este, para que
// la respuesta tarde lo mismo y no se pueda adivinar que correos existen.
const HASH_RELLENO = bcrypt.hashSync('relleno-que-nunca-coincide', 10);

const sha256 = (texto: string) => createHash('sha256').update(texto).digest('hex');
import { UsuarioToken } from '../common/security';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private usuarios: Repository<Usuario>,
    @InjectRepository(Gimnasio) private gimnasios: Repository<Gimnasio>,
    @InjectRepository(RecuperacionPassword) private recuperaciones: Repository<RecuperacionPassword>,
    private jwt: JwtService,
    private dataSource: DataSource,
    private correo: CorreoService,
  ) {}

  private firmar(u: Usuario) {
    const payload: UsuarioToken = { sub: u.id, email: u.email, rol: u.rol, nombre: u.nombre };
    return this.jwt.sign(payload);
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuarios.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (!usuario) {
      bcrypt.compareSync(dto.password, HASH_RELLENO);
      throw new UnauthorizedException('Correo o contrasena incorrectos');
    }

    // Cuenta bloqueada por intentos fallidos
    const ahora = new Date();
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > ahora) {
      const minutos = Math.ceil((usuario.bloqueadoHasta.getTime() - ahora.getTime()) / 60000);
      throw new HttpException(
        `Demasiados intentos fallidos. Intenta de nuevo en ${minutos} min o recupera tu contrasena.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!bcrypt.compareSync(dto.password, usuario.passwordHash)) {
      const intentos = (usuario.intentosFallidos || 0) + 1;
      if (intentos >= MAX_INTENTOS_LOGIN) {
        await this.usuarios.update(usuario.id, {
          intentosFallidos: 0,
          bloqueadoHasta: new Date(ahora.getTime() + MINUTOS_BLOQUEO * 60000),
        });
        throw new HttpException(
          `Demasiados intentos fallidos. Tu cuenta queda bloqueada ${MINUTOS_BLOQUEO} min.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      await this.usuarios.update(usuario.id, { intentosFallidos: intentos });
      throw new UnauthorizedException('Correo o contrasena incorrectos');
    }
    if (!usuario.activo) throw new UnauthorizedException('Tu cuenta esta desactivada');

    if (usuario.intentosFallidos || usuario.bloqueadoHasta) {
      await this.usuarios.update(usuario.id, { intentosFallidos: 0, bloqueadoHasta: null });
    }

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

  /** Alta de un dueno: crea el usuario, su gimnasio, sus horarios y su afiliacion (sin costo). */
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
          // Arranca sin precio: el dueno lo pone en "Mis ganancias".
          precioPorVisita: null,
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

  
  /** Actualiza nombre, telefono y/o correo del usuario autenticado. */
  async actualizarPerfil(id: number, dto: ActualizarPerfilDto) {
    const usuario = await this.usuarios.findOne({ where: { id } });
    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (dto.nombre !== undefined) {
      const nombre = dto.nombre.trim();
      if (!nombre) throw new BadRequestException('El nombre no puede quedar vacio');
      usuario.nombre = nombre;
    }

    if (dto.telefono !== undefined) {
      usuario.telefono = dto.telefono?.trim() || null;
    }

    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase().trim();
      if (email !== usuario.email) {
        if (!dto.passwordActual) {
          throw new BadRequestException('Para cambiar el correo escribe tu contrasena actual');
        }
        if (!bcrypt.compareSync(dto.passwordActual, usuario.passwordHash)) {
          throw new BadRequestException('Tu contrasena actual no coincide');
        }
        const existe = await this.usuarios.findOne({ where: { email } });
        if (existe && existe.id !== id) {
          throw new BadRequestException('Ese correo ya esta registrado');
        }
        usuario.email = email;
      }
    }

    await this.usuarios.save(usuario);
    return this.perfil(id);
  }

  async cambiarPassword(id: number, dto: CambiarPasswordDto) {
    const usuario = await this.usuarios.findOne({ where: { id } });
    if (!bcrypt.compareSync(dto.actual, usuario.passwordHash)) {
      throw new BadRequestException('Tu contrasena actual no coincide');
    }
    usuario.passwordHash = bcrypt.hashSync(dto.nueva, 10);
    // Cierra las sesiones abiertas en otros dispositivos
    usuario.sesionesDesde = this.ahoraSinMilisegundos();
    await this.usuarios.save(usuario);
    return { mensaje: 'Contrasena actualizada', token: this.firmar(usuario) };
  }

  // ------------------------------------------------------------------
  // Recuperacion de contrasena con codigo de 6 digitos por correo
  // ------------------------------------------------------------------

  private readonly respuestaRecuperar = {
    mensaje: 'Si el correo esta registrado, te enviamos un codigo para cambiar tu contrasena.',
  };

  /** POST /auth/recuperar. Responde siempre lo mismo, exista o no el correo. */
  async recuperar(dto: RecuperarDto) {
    const email = dto.email.toLowerCase().trim();
    const usuario = await this.usuarios.findOne({ where: { email } });
    if (!usuario || !usuario.activo) return this.respuestaRecuperar;

    const haceUnaHora = new Date(Date.now() - 60 * 60000);
    const recientes = await this.recuperaciones.count({
      where: { idUsuario: usuario.id, creadoEn: MoreThan(haceUnaHora) },
    });
    if (recientes >= MAX_CODIGOS_POR_HORA) return this.respuestaRecuperar;

    // Solo sirve el codigo mas nuevo
    await this.recuperaciones.update({ idUsuario: usuario.id, usado: false }, { usado: true });

    const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.recuperaciones.save(
      this.recuperaciones.create({
        idUsuario: usuario.id,
        codigoHash: sha256(`${usuario.id}:${codigo}`),
        venceEn: new Date(Date.now() + MINUTOS_CODIGO * 60000),
      }),
    );

    await this.correo.enviar(
      usuario.email,
      'Tu codigo para cambiar la contrasena de Gymred',
      `<p>Hola ${this.escapar(usuario.nombre)}:</p>
       <p>Tu codigo para cambiar la contrasena es:</p>
       <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${codigo}</p>
       <p>Vence en ${MINUTOS_CODIGO} minutos. Si tu no lo pediste, ignora este correo.</p>`,
    );
    return this.respuestaRecuperar;
  }

  /** POST /auth/restablecer. Cambia la contrasena con el codigo del correo. */
  async restablecer(dto: RestablecerDto) {
    const error = new BadRequestException('El codigo no es valido o ya vencio');
    const usuario = await this.usuarios.findOne({ where: { email: dto.email.toLowerCase().trim() } });
    if (!usuario || !usuario.activo) throw error;

    const solicitud = await this.recuperaciones.findOne({
      where: { idUsuario: usuario.id, usado: false, venceEn: MoreThan(new Date()) },
      order: { id: 'DESC' },
    });
    if (!solicitud || solicitud.intentos >= MAX_INTENTOS_CODIGO) throw error;

    const esperado = Buffer.from(solicitud.codigoHash, 'hex');
    const recibido = Buffer.from(sha256(`${usuario.id}:${dto.codigo}`), 'hex');
    if (!timingSafeEqual(esperado, recibido)) {
      solicitud.intentos += 1;
      if (solicitud.intentos >= MAX_INTENTOS_CODIGO) solicitud.usado = true;
      await this.recuperaciones.save(solicitud);
      throw error;
    }

    solicitud.usado = true;
    await this.recuperaciones.save(solicitud);

    usuario.passwordHash = bcrypt.hashSync(dto.nueva, 10);
    usuario.sesionesDesde = this.ahoraSinMilisegundos();
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    await this.usuarios.save(usuario);
    return { mensaje: 'Listo, ya puedes entrar con tu nueva contrasena' };
  }

  /** La columna DATETIME no guarda milisegundos; asi coincide con el iat del token. */
  private ahoraSinMilisegundos() {
    return new Date(Math.floor(Date.now() / 1000) * 1000);
  }

  private escapar(texto: string) {
    return texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
  }
}
