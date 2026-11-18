import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/api_config.dart';
import '../models/gimnasio.dart';
import '../models/gimnasio_detalle.dart';
import '../services/movil_service.dart';
import '../theme/app_theme.dart';
import '../widgets/calificar_gimnasio.dart';
import '../widgets/comunes.dart';
import 'escanear_qr_screen.dart';
import 'inicio_screen.dart' show fechaLarga;
import 'equipo_screen.dart';

class _Datos {
  final GimnasioDetalle detalle;
  final List<GrupoInventario> inventario;
  _Datos(this.detalle, this.inventario);
}

class DetalleGimnasioScreen extends StatefulWidget {
  final GimnasioResumen gimnasio; // viene de la lista (trae el nivel requerido)
  final int? nivelSocio;

  const DetalleGimnasioScreen({
    super.key,
    required this.gimnasio,
    this.nivelSocio,
  });

  @override
  State<DetalleGimnasioScreen> createState() => _DetalleGimnasioScreenState();
}

class _DetalleGimnasioScreenState extends State<DetalleGimnasioScreen> {
  late Future<_Datos> _futuro;

  @override
  void initState() {
    super.initState();
    _futuro = _cargar();
  }

  Future<_Datos> _cargar() async {
    final movil = context.read<MovilService>();
    final id = widget.gimnasio.id;
    final r = await Future.wait([
      movil.detalleGimnasio(id),
      movil.inventario(id),
    ]);
    return _Datos(r[0] as GimnasioDetalle, r[1] as List<GrupoInventario>);
  }

  void _recargar() {
    setState(() {
      _futuro = _cargar();
    });
  }

  void _mensaje(String texto) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(texto)));
  }

  /// Abre el marcador con el teléfono del gimnasio.
  Future<void> _llamar(String telefono) async {
    final limpio = telefono.replaceAll(RegExp(r'[^0-9+]'), '');
    try {
      final ok = await launchUrl(Uri(scheme: 'tel', path: limpio));
      if (!ok) _mensaje('No se pudo abrir el marcador.');
    } catch (_) {
      _mensaje('No se pudo abrir el marcador.');
    }
  }

  /// Abre Google Maps con la ruta al gimnasio (por coordenadas o por dirección).
  Future<void> _comoLlegar(GimnasioDetalle d) async {
    final destino = d.latitud != null && d.longitud != null
        ? '${d.latitud},${d.longitud}'
        : Uri.encodeComponent(d.direccionCompleta);
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$destino',
    );
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok) _mensaje('No se pudo abrir el mapa.');
    } catch (_) {
      _mensaje('No se pudo abrir el mapa.');
    }
  }

  /// Abre la hoja de calificar. Si se envía, muestra aviso y recarga la ficha.
  Future<void> _calificar(String nombre) async {
    final enviado = await mostrarCalificarGimnasio(
      context,
      idGimnasio: widget.gimnasio.id,
      nombre: nombre,
    );
    if (!mounted) return;
    if (enviado) {
      _mensaje('¡Gracias por tu reseña!');
      _recargar();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.gimnasio.nombre)),
      body: FutureBuilder<_Datos>(
        future: _futuro,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.naranja),
            );
          }
          if (snap.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(snap.error.toString(), textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _recargar,
                      child: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            );
          }

          final d = snap.data!.detalle;
          final inventario = snap.data!.inventario;
          final textos = Theme.of(context).textTheme;
          final horarioHoy = d.horarioHoy;
          final resenasWidgets =
              d.resenas.map((r) => _TarjetaResena(r: r)).toList();
          final telefono = d.telefono?.trim();

          return ListView(
            children: [
              _Fotos(fotos: d.fotos),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ---- Encabezado ----
                    Text(
                      d.nombre,
                      style: textos.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded,
                            color: Color(0xFFF59E0B), size: 20),
                        const SizedBox(width: 4),
                        Text(
                          d.totalResenas == 0
                              ? 'Sin reseñas todavía'
                              : '${d.calificacion.toStringAsFixed(1)} · ${d.totalResenas} ${d.totalResenas == 1 ? 'reseña' : 'reseñas'}',
                          style: textos.bodyMedium,
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      d.direccionCompleta,
                      style: textos.bodySmall?.copyWith(color: AppColors.textoSecundario),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(
                          Icons.circle,
                          size: 8,
                          color: d.abiertoAhora ? AppColors.verde : AppColors.rojo,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          d.abiertoAhora
                              ? 'Abierto · Hoy ${horarioHoy?.rango ?? ''}'
                              : 'Cerrado ahora · Hoy ${horarioHoy?.rango ?? 'sin horario'}',
                          style: textos.bodySmall,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        Etiqueta(
                          texto: widget.gimnasio.categoriaTexto,
                          fondo: AppColors.azulClaro,
                          color: AppColors.azul,
                        ),
                        etiquetaNivel(
                          widget.gimnasio.nivelRequerido,
                          widget.nivelSocio,
                        ),
                      ],
                    ),

                    // ---- Acciones ----
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: _AccionBoton(
                            icono: Icons.near_me_outlined,
                            texto: 'Cómo llegar',
                            onTap: () {
                              _comoLlegar(d);
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _AccionBoton(
                            icono: Icons.call_outlined,
                            texto: 'Llamar',
                            onTap: () {
                              if (telefono == null || telefono.isEmpty) {
                                _mensaje('Este gimnasio no tiene teléfono registrado.');
                              } else {
                                _llamar(telefono);
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _AccionBoton(
                            icono: Icons.qr_code_scanner,
                            texto: 'Escanear QR',
                            principal: true,
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => const EscanearQrScreen(),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    // ---- Descripción ----
                    if (d.descripcion != null && d.descripcion!.isNotEmpty)
                      _Seccion(
                        titulo: 'Descripción',
                        child: _Descripcion(texto: d.descripcion!),
                      ),

                    // ---- Equipo (resumen) ----
                    _Seccion(
                      titulo: 'Equipo',
                      child: _ResumenEquipo(
                        grupos: inventario,
                        nombreGimnasio: d.nombre,
                      ),
                    ),

                    // ---- Reseñas ----
                    _Seccion(
                      titulo: 'Reseñas',
                      extra: d.totalResenas > 0
                          ? Text(
                              'Ver las ${d.totalResenas}',
                              style: const TextStyle(
                                color: AppColors.naranja,
                                fontWeight: FontWeight.w600,
                              ),
                            )
                          : null,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (d.resenas.isEmpty)
                            const Text('Aún no hay reseñas de este gimnasio.'),
                          ...resenasWidgets,
                          const SizedBox(height: 4),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: TextButton.icon(
                              onPressed: () => _calificar(d.nombre),
                              icon: const Icon(Icons.star_outline_rounded,
                                  color: AppColors.naranja),
                              label: const Text(
                                'Calificar gimnasio →',
                                style: TextStyle(
                                  color: AppColors.naranja,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // ---- Información ----
                    _Seccion(
                      titulo: 'Información',
                      child: Column(
                        children: [
                          _Fila(
                            icono: Icons.location_on_outlined,
                            texto: d.direccionCompleta,
                          ),
                          if (d.telefono != null)
                            _Fila(icono: Icons.phone_outlined, texto: d.telefono!),
                          if (d.capacidadMaxima != null)
                            _Fila(
                              icono: Icons.groups_outlined,
                              texto: 'Capacidad para ${d.capacidadMaxima} personas',
                            ),
                        ],
                      ),
                    ),

                    // ---- Horarios ----
                    _Seccion(
                      titulo: 'Horarios',
                      child: Column(
                        children: [
                          for (final h in d.horarios)
                            _FilaHorario(
                              h: h,
                              esHoy: h.diaSemana == DateTime.now().weekday,
                            ),
                        ],
                      ),
                    ),

                    // ---- Servicios ----
                    if (d.servicios.isNotEmpty)
                      _Seccion(
                        titulo: 'Servicios',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            for (final s in d.servicios)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(Icons.check_circle,
                                        size: 20, color: AppColors.verde),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            s.nombre,
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w600),
                                          ),
                                          if (s.descripcion != null)
                                            Text(
                                              s.descripcion!,
                                              style: textos.bodySmall?.copyWith(
                                                color: AppColors.textoSecundario,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),

                    // ---- Amenidades ----
                    if (d.amenidades.isNotEmpty)
                      _Seccion(
                        titulo: 'Amenidades',
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (final a in d.amenidades)
                              Chip(
                                avatar: Icon(
                                  _iconoAmenidad(a.icono),
                                  size: 18,
                                  color: AppColors.naranja,
                                ),
                                label: Text(a.nombre),
                                backgroundColor: AppColors.naranjaClaro,
                                side: BorderSide.none,
                              ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  IconData _iconoAmenidad(String? icono) {
    switch (icono) {
      case 'shower':
        return Icons.shower_outlined;
      case 'parking':
        return Icons.local_parking;
      case 'lock':
        return Icons.lock_outline;
      case 'wifi':
        return Icons.wifi;
      case 'water':
        return Icons.water_drop_outlined;
      case 'ac':
        return Icons.ac_unit;
      default:
        return Icons.check;
    }
  }
}

// ------------------------------------------------------------------
// Piezas
// ------------------------------------------------------------------

class _Fotos extends StatelessWidget {
  final List<FotoGimnasio> fotos;
  const _Fotos({required this.fotos});

  @override
  Widget build(BuildContext context) {
    if (fotos.isEmpty) {
      return const SizedBox(height: 200, child: SinFoto());
    }
    return SizedBox(
      height: 220,
      child: PageView.builder(
        itemCount: fotos.length,
        itemBuilder: (context, i) {
          final url = ApiConfig.urlImagen(fotos[i].url);
          return url == null
              ? const SinFoto()
              : Image.network(
                  url,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => const SinFoto(),
                );
        },
      ),
    );
  }
}

/// Botón cuadrado de acción (Cómo llegar, Llamar, Escanear QR).
class _AccionBoton extends StatelessWidget {
  final IconData icono;
  final String texto;
  final VoidCallback onTap;
  final bool principal;
  const _AccionBoton({
    required this.icono,
    required this.texto,
    required this.onTap,
    this.principal = false,
  });

  @override
  Widget build(BuildContext context) {
    final fondo = principal ? AppColors.naranja : AppColors.blanco;
    final color = principal ? AppColors.blanco : AppColors.texto;

    return Material(
      color: fondo,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: principal
              ? null
              : BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE6E6EB)),
                ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icono, color: color, size: 22),
              const SizedBox(height: 4),
              Text(
                texto,
                style: TextStyle(
                  color: color,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Seccion extends StatelessWidget {
  final String titulo;
  final Widget child;
  final Widget? extra;
  const _Seccion({required this.titulo, required this.child, this.extra});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  titulo,
                  style: Theme.of(context).textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              ?extra,
            ],
          ),
          const SizedBox(height: 10),
          Tarjeta(child: child),
        ],
      ),
    );
  }
}

/// Descripción con "Ver más" / "Ver menos".
class _Descripcion extends StatefulWidget {
  final String texto;
  const _Descripcion({required this.texto});

  @override
  State<_Descripcion> createState() => _DescripcionState();
}

class _DescripcionState extends State<_Descripcion> {
  bool _expandida = false;

  @override
  Widget build(BuildContext context) {
    final largo = widget.texto.length > 140;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.texto,
          maxLines: _expandida ? null : 3,
          overflow: _expandida ? TextOverflow.visible : TextOverflow.ellipsis,
          style: const TextStyle(color: AppColors.textoSecundario),
        ),
        if (largo)
          TextButton(
            style: TextButton.styleFrom(padding: EdgeInsets.zero),
            onPressed: () => setState(() => _expandida = !_expandida),
            child: Text(_expandida ? 'Ver menos' : 'Ver más'),
          ),
      ],
    );
  }
}

class _Fila extends StatelessWidget {
  final IconData icono;
  final String texto;
  const _Fila({required this.icono, required this.texto});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icono, size: 20, color: AppColors.naranja),
          const SizedBox(width: 10),
          Expanded(child: Text(texto)),
        ],
      ),
    );
  }
}

class _FilaHorario extends StatelessWidget {
  final Horario h;
  final bool esHoy;
  const _FilaHorario({required this.h, required this.esHoy});

  @override
  Widget build(BuildContext context) {
    final estilo = TextStyle(
      fontWeight: esHoy ? FontWeight.w700 : FontWeight.normal,
      color: h.cerrado ? AppColors.textoSecundario : AppColors.texto,
    );
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
      decoration: esHoy
          ? BoxDecoration(
              color: AppColors.naranjaClaro,
              borderRadius: BorderRadius.circular(8),
            )
          : null,
      child: Row(
        children: [
          Expanded(
            child: Text(
              esHoy ? '${h.nombreDia} (hoy)' : h.nombreDia,
              style: estilo,
            ),
          ),
          Text(h.rango, style: estilo),
        ],
      ),
    );
  }
}

class _ResumenEquipo extends StatelessWidget {
  final List<GrupoInventario> grupos;
  final String nombreGimnasio;
  const _ResumenEquipo({required this.grupos, required this.nombreGimnasio});

  @override
  Widget build(BuildContext context) {
    if (grupos.isEmpty) {
      return const Text('Este gimnasio aún no ha registrado su equipo.');
    }

    final total = grupos.fold<int>(
        0, (suma, g) => suma + g.equipos.fold<int>(0, (s, e) => s + e.cantidad));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$total aparatos · ${grupos.length} categorías',
            style: const TextStyle(color: AppColors.textoSecundario)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final g in grupos)
              Etiqueta(
                texto: g.etiqueta,
                fondo: AppColors.naranjaClaro,
                color: AppColors.naranja,
              ),
          ],
        ),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            icon: const Icon(Icons.fitness_center),
            label: const Text('Ver equipo completo'),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => EquipoScreen(
                    nombreGimnasio: nombreGimnasio,
                    grupos: grupos,
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _TarjetaResena extends StatelessWidget {
  final Resena r;
  const _TarjetaResena({required this.r});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: AppColors.naranjaClaro,
                child: Text(
                  r.cliente.isNotEmpty ? r.cliente[0].toUpperCase() : '?',
                  style: const TextStyle(color: AppColors.naranja, fontSize: 13),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  r.cliente,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              Text(
                fechaLarga(r.creadoEn),
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textoSecundario,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              for (var i = 1; i <= 5; i++)
                Icon(
                  i <= r.calificacion
                      ? Icons.star_rounded
                      : Icons.star_outline_rounded,
                  size: 18,
                  color: const Color(0xFFF59E0B),
                ),
            ],
          ),
          if (r.comentario != null && r.comentario!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(r.comentario!),
          ],
        ],
      ),
    );
  }
}