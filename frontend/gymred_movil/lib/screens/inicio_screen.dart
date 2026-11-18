import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/api_config.dart';
import '../models/gimnasio.dart';
import '../models/suscripcion.dart';
import '../providers/auth_provider.dart';
import '../services/movil_service.dart';
import '../services/notificaciones_service.dart';
import '../services/ubicacion_service.dart';
import '../theme/app_theme.dart';
import '../widgets/comunes.dart';
import 'planes_screen.dart';
import 'escanear_qr_screen.dart';
import 'guia_screen.dart';
import 'gimnasios_screen.dart';
import 'detalle_gimnasio_screen.dart';
import 'entreno/sesion_screen.dart';
import '../data/rutina_demo.dart';

const _meses = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/// "18 de octubre"
String fechaLarga(DateTime f) => '${f.day} de ${_meses[f.month - 1]}';

class InicioScreen extends StatefulWidget {
  const InicioScreen({super.key});

  @override
  State<InicioScreen> createState() => _InicioScreenState();
}

class _InicioScreenState extends State<InicioScreen> {
  late Future<EstadoSuscripcion> _futuro;
  late Future<List<GimnasioResumen>> _cercanos;

  @override
  void initState() {
    super.initState();
    _futuro = context.read<MovilService>().miSuscripcion();
    _cercanos = _cargarCercanos();
    _revisarVencimiento(_futuro);
  }

  /// Los tres gimnasios más cercanos (con distancia si hay permiso de ubicación).
  Future<List<GimnasioResumen>> _cargarCercanos() async {
    final movil = context.read<MovilService>();
    final pos = await UbicacionService().posicionActual();
    final lista = await movil.gimnasios(lat: pos?.latitude, lng: pos?.longitude);
    return lista.take(3).toList();
  }

  /// Programa el aviso según la fecha de vencimiento, o lo cancela si no hay suscripción.
  Future<void> _revisarVencimiento(Future<EstadoSuscripcion> f) async {
    try {
      final estado = await f;
      final s = estado.suscripcion;
      if (estado.activa && s != null) {
        await NotificacionesService.programarVencimiento(s.fechaFin);
      } else {
        await NotificacionesService.cancelar();
      }
    } catch (_) {
      // Si la carga falla, el FutureBuilder ya muestra el error.
    }
  }

  /// Vuelve a pedir los datos (al jalar hacia abajo, en "Reintentar" o al contratar).
  Future<void> _recargar() async {
    final f = context.read<MovilService>().miSuscripcion();
    setState(() {
      _futuro = f;
      _cercanos = _cargarCercanos();
    });
    _revisarVencimiento(f);
    try {
      await f;
    } catch (_) {
      // El error ya lo muestra el FutureBuilder.
    }
  }

  /// Abre la pantalla de planes. Si el socio contrata, recarga el inicio.
  Future<void> _abrirPlanes({int? idPlanActual}) async {
    final contrato = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => PlanesScreen(idPlanActual: idPlanActual),
      ),
    );
    if (contrato == true) _recargar();
  }

  /// Abre el escáner. Al volver, recarga para actualizar las visitas del día.
  Future<void> _escanear() async {
    await Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => const EscanearQrScreen()));
    if (mounted) _recargar();
  }

  @override
  Widget build(BuildContext context) {
    final usuario = context.watch<AuthProvider>().usuario;
    final nombre = (usuario?.nombre ?? '').trim().split(' ').first;
    final primerNombre = nombre.isEmpty
        ? ''
        : nombre[0].toUpperCase() + nombre.substring(1);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Gymred'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Cerrar sesión',
            onPressed: () {
              NotificacionesService.cancelar();
              context.read<AuthProvider>().cerrarSesion();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.naranja,
        onRefresh: _recargar,
        child: FutureBuilder<EstadoSuscripcion>(
          future: _futuro,
          builder: (context, snap) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                Text(
                  'Hola, $primerNombre 👋',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 16),
                if (snap.connectionState == ConnectionState.waiting)
                  const _Cargando()
                else if (snap.hasError)
                  _ErrorCarga(
                    mensaje: snap.error.toString(),
                    onReintentar: _recargar,
                  )
                else
                  ..._contenido(snap.data!),
              ],
            );
          },
        ),
      ),
    );
  }

  List<Widget> _contenido(EstadoSuscripcion estado) {
    final s = estado.suscripcion;
    final nivelSocio = estado.activa ? s?.plan.nivel : null;

    final cercanos = _Cercanos(
      futuro: _cercanos,
      nivelSocio: nivelSocio,
      onVerTodos: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const GimnasiosScreen()),
      ),
    );

    // Sin suscripción (nunca contrató o ya venció)
    if (!estado.activa || s == null) {
      return [
        _SinSuscripcion(onVerPlanes: () => _abrirPlanes()),
        const SizedBox(height: 16),
        const _BotonQr(
          habilitado: false,
          motivo: 'Necesitas una suscripción activa para entrar a un gimnasio.',
          onEscanear: null,
        ),
        const SizedBox(height: 28),
        cercanos,
      ];
    }

    // Con suscripción
    return [
      _TarjetaSuscripcion(
        s: s,
        onVerPlanes: () => _abrirPlanes(idPlanActual: s.plan.id),
      ),
      if (s.porVencer) ...[
        const SizedBox(height: 12),
        _AvisoVencimiento(
          dias: s.diasRestantes,
          onRenovar: () => _abrirPlanes(idPlanActual: s.plan.id),
        ),
      ],
      const SizedBox(height: 16),
      _BotonQr(
        habilitado: s.visitasRestantesHoy > 0,
        motivo: 'Ya usaste tus visitas de hoy. Vuelve mañana.',
        onEscanear: _escanear,
      ),
      const SizedBox(height: 28),
      cercanos,
      const SizedBox(height: 28),
      OutlinedButton.icon(
        onPressed: () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => const GuiaScreen())),
        icon: const Icon(Icons.fitness_center),
        label: const Text('Guía de ejercicios (beta)'),
      ),
      const SizedBox(height: 12),
      FilledButton.icon(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => const SesionScreen(rutina: rutinaPechoTriceps),
          ),
        ),
        icon: const Icon(Icons.play_arrow_rounded),
        label: const Text('Entrenar: Pecho + Tríceps'),
      ),
    ];
  }
}

// ------------------------------------------------------------------
// Piezas de la pantalla
// ------------------------------------------------------------------

class _Cargando extends StatelessWidget {
  const _Cargando();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          CircularProgressIndicator(color: AppColors.naranja),
          SizedBox(height: 16),
          Text(
            'Cargando tu suscripción…\nSi el servidor estaba dormido puede tardar hasta un minuto.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textoSecundario),
          ),
        ],
      ),
    );
  }
}

class _ErrorCarga extends StatelessWidget {
  final String mensaje;
  final VoidCallback onReintentar;
  const _ErrorCarga({required this.mensaje, required this.onReintentar});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          const Icon(Icons.cloud_off, size: 48, color: AppColors.textoSecundario),
          const SizedBox(height: 12),
          Text(mensaje, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: onReintentar,
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }
}

/// Tarjeta blanca con sombra suave.
class _Tarjeta extends StatelessWidget {
  final Widget child;
  const _Tarjeta({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.blanco,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(color: Color(0x14000000), blurRadius: 12, offset: Offset(0, 4)),
        ],
      ),
      child: child,
    );
  }
}

class _TarjetaSuscripcion extends StatelessWidget {
  final Suscripcion s;
  final VoidCallback onVerPlanes;
  const _TarjetaSuscripcion({required this.s, required this.onVerPlanes});

  @override
  Widget build(BuildContext context) {
    final textos = Theme.of(context).textTheme;
    final dias = s.diasRestantes;
    final textoDias = dias <= 0
        ? 'Vence hoy'
        : (dias == 1 ? 'Queda 1 día' : 'Quedan $dias días');

    return _Tarjeta(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'TU SUSCRIPCIÓN',
                  style: TextStyle(
                    color: AppColors.textoSecundario,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
              if (s.porVencer)
                const Etiqueta(
                  texto: 'Por vencer',
                  fondo: Color(0x14DC2626),
                  color: AppColors.rojo,
                )
              else
                const Etiqueta(
                  texto: '● Activa',
                  fondo: Color(0x1F16A34A),
                  color: AppColors.verde,
                ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Plan ${s.plan.nombre}',
                  style: textos.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                ),
              ),
              TextButton(
                onPressed: onVerPlanes,
                child: const Text('Ver planes →'),
              ),
            ],
          ),
          Text(
            'Vence el ${fechaLarga(s.fechaFin)} · $textoDias',
            style: textos.bodySmall?.copyWith(color: AppColors.textoSecundario),
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: s.progreso,
              minHeight: 8,
              color: s.porVencer ? AppColors.rojo : AppColors.naranja,
              backgroundColor: AppColors.naranjaClaro,
            ),
          ),
          const Divider(height: 28),
          Row(
            children: [
              Expanded(
                child: _Dato(
                  titulo: 'Hoy',
                  valor: '${s.visitasHoy}/${s.plan.visitasPorDia}',
                  unidad: 'visitas',
                ),
              ),
              Container(width: 1, height: 40, color: const Color(0xFFE4E4E7)),
              const SizedBox(width: 16),
              Expanded(
                child: _Dato(
                  titulo: 'Este mes',
                  valor: '${s.visitasMes}',
                  unidad: s.plan.visitasPorMes == null
                      ? 'visitas (ilimitadas)'
                      : 'de ${s.plan.visitasPorMes} visitas',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Dato extends StatelessWidget {
  final String titulo;
  final String valor;
  final String unidad;
  const _Dato({
    required this.titulo,
    required this.valor,
    required this.unidad,
  });

  @override
  Widget build(BuildContext context) {
    final textos = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          titulo,
          style: textos.bodySmall?.copyWith(color: AppColors.textoSecundario),
        ),
        const SizedBox(height: 4),
        Text.rich(
          TextSpan(
            children: [
              TextSpan(
                text: valor,
                style: textos.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
              TextSpan(text: ' $unidad', style: textos.bodySmall),
            ],
          ),
        ),
      ],
    );
  }
}

class _AvisoVencimiento extends StatelessWidget {
  final int dias;
  final VoidCallback onRenovar;
  const _AvisoVencimiento({required this.dias, required this.onRenovar});

  @override
  Widget build(BuildContext context) {
    final texto = dias <= 0
        ? 'Tu suscripción vence hoy. Renuévala para no perder el acceso.'
        : 'Tu suscripción vence en $dias ${dias == 1 ? 'día' : 'días'}. Renuévala para no perder el acceso.';

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 8, 10),
      decoration: BoxDecoration(
        color: AppColors.naranjaClaro,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.naranja),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: AppColors.naranjaOscuro),
          const SizedBox(width: 10),
          Expanded(child: Text(texto)),
          TextButton(onPressed: onRenovar, child: const Text('Renovar')),
        ],
      ),
    );
  }
}

class _SinSuscripcion extends StatelessWidget {
  final VoidCallback onVerPlanes;
  const _SinSuscripcion({required this.onVerPlanes});

  @override
  Widget build(BuildContext context) {
    final textos = Theme.of(context).textTheme;
    return _Tarjeta(
      child: Column(
        children: [
          const Icon(Icons.card_membership, size: 48, color: AppColors.naranja),
          const SizedBox(height: 12),
          Text(
            'No tienes una suscripción activa',
            textAlign: TextAlign.center,
            style: textos.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Contrata un plan para entrar a cualquier gimnasio afiliado de la región.',
            textAlign: TextAlign.center,
            style: textos.bodyMedium?.copyWith(color: AppColors.textoSecundario),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: onVerPlanes, child: const Text('Ver planes')),
        ],
      ),
    );
  }
}

class _BotonQr extends StatelessWidget {
  final bool habilitado;
  final String motivo;
  final VoidCallback? onEscanear;
  const _BotonQr({
    required this.habilitado,
    required this.motivo,
    required this.onEscanear,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 56,
          child: FilledButton.icon(
            onPressed: habilitado ? onEscanear : null,
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text(
              'Escanear QR',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ),
        if (!habilitado) ...[
          const SizedBox(height: 8),
          Text(
            motivo,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textoSecundario),
          ),
        ],
      ],
    );
  }
}

/// Encabezado y lista de los gimnasios más cercanos.
class _Cercanos extends StatelessWidget {
  final Future<List<GimnasioResumen>> futuro;
  final int? nivelSocio;
  final VoidCallback onVerTodos;
  const _Cercanos({
    required this.futuro,
    required this.nivelSocio,
    required this.onVerTodos,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Gimnasios cercanos',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
            TextButton(onPressed: onVerTodos, child: const Text('Ver todos')),
          ],
        ),
        const SizedBox(height: 4),
        FutureBuilder<List<GimnasioResumen>>(
          future: futuro,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.naranja),
                ),
              );
            }
            if (snap.hasError) {
              return const Text(
                'No pudimos cargar los gimnasios cercanos.',
                style: TextStyle(color: AppColors.textoSecundario),
              );
            }
            final lista = snap.data!;
            if (lista.isEmpty) {
              return const Text(
                'Todavía no hay gimnasios afiliados.',
                style: TextStyle(color: AppColors.textoSecundario),
              );
            }
            return Column(
              children: [
                for (final g in lista)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _TarjetaCercano(
                      g: g,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => DetalleGimnasioScreen(
                            gimnasio: g,
                            nivelSocio: nivelSocio,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _TarjetaCercano extends StatelessWidget {
  final GimnasioResumen g;
  final VoidCallback onTap;
  const _TarjetaCercano({required this.g, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final textos = Theme.of(context).textTheme;
    final urlFoto = ApiConfig.urlImagen(g.foto);

    return Material(
      color: AppColors.blanco,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 72,
                  height: 72,
                  child: urlFoto == null
                      ? const SinFoto()
                      : Image.network(
                          urlFoto,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const SinFoto(),
                        ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      g.nombre,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: textos.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, size: 16, color: Color(0xFFF59E0B)),
                        const SizedBox(width: 2),
                        Text(g.calificacion > 0
                            ? g.calificacion.toStringAsFixed(1)
                            : 'Nuevo'),
                        const Spacer(),
                        if (g.distanciaKm != null)
                          Text(
                            '${g.distanciaKm!.toStringAsFixed(1)} km',
                            style: const TextStyle(
                              color: AppColors.naranja,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        Etiqueta(
                          texto: g.categoriaTexto,
                          fondo: AppColors.azulClaro,
                          color: AppColors.azul,
                        ),
                        etiquetaNivel(g.nivelRequerido, null),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}