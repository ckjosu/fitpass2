import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../models/ejercicio.dart';
import '../services/wger_service.dart';
import '../theme/app_theme.dart';

/// RF-19: guía de ejercicios con datos de wger (videos, imágenes y pasos).
class GuiaScreen extends StatefulWidget {
  const GuiaScreen({super.key});

  @override
  State<GuiaScreen> createState() => _GuiaScreenState();
}

class _GuiaScreenState extends State<GuiaScreen> {
  final _wger = WgerService();
  // Se guardan a nivel de clase para que el orden no cambie al volver a entrar.
  static final List<Ejercicio> _lista = [];
  static bool _hayMas = true;
  static int _offset = 0;
  bool _cargando = false;
  String? _error;
  String _buscar = '';

  @override
  void initState() {
    super.initState();
    _cargarMas();
  }

  Future<void> _cargarMas() async {
    if (_cargando || !_hayMas) return;
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final p = await _wger.pagina(_offset);
      if (!mounted) return;
      setState(() {
        _lista.addAll(p.items);
        _offset += WgerService.tamanoPagina;
        _hayMas = p.hayMas;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'No se pudo cargar la guía. Revisa tu conexión.');
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = _buscar.trim().toLowerCase();
    final lista = q.isEmpty
        ? _lista
        : _lista
            .where((e) =>
                e.nombre.toLowerCase().contains(q) ||
                e.categoria.toLowerCase().contains(q) ||
                e.musculos.any((m) => m.toLowerCase().contains(q)))
            .toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Guía de ejercicios')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Buscar por nombre o músculo',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (v) => setState(() => _buscar = v),
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              itemCount: lista.length + 1,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, i) {
                if (i < lista.length) {
                  return _TarjetaEjercicio(ejercicio: lista[i]);
                }
                return _Pie(
                  cargando: _cargando,
                  error: _error,
                  hayMas: _hayMas,
                  onCargarMas: _cargarMas,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _Pie extends StatelessWidget {
  final bool cargando;
  final String? error;
  final bool hayMas;
  final VoidCallback onCargarMas;
  const _Pie({
    required this.cargando,
    required this.error,
    required this.hayMas,
    required this.onCargarMas,
  });

  @override
  Widget build(BuildContext context) {
    if (cargando) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(child: CircularProgressIndicator(color: AppColors.naranja)),
      );
    }
    return Column(
      children: [
        if (error != null) Text(error!, textAlign: TextAlign.center),
        if (hayMas)
          OutlinedButton(onPressed: onCargarMas, child: const Text('Cargar más')),
      ],
    );
  }
}

class _Miniatura extends StatelessWidget {
  final String? url;
  final double tam;
  const _Miniatura({required this.url, required this.tam});

  @override
  Widget build(BuildContext context) {
    if (url == null) {
      return Container(
        width: tam,
        height: tam,
        color: AppColors.naranjaClaro,
        child: const Icon(Icons.fitness_center, color: AppColors.naranjaOscuro),
      );
    }
    return CachedNetworkImage(
      imageUrl: url!,
      width: tam,
      height: tam,
      fit: BoxFit.cover,
      placeholder: (_, _) => Container(width: tam, height: tam, color: AppColors.naranjaClaro),
      errorWidget: (_, _, _) => Container(
        width: tam,
        height: tam,
        color: AppColors.naranjaClaro,
        child: const Icon(Icons.broken_image_outlined),
      ),
    );
  }
}

class _TarjetaEjercicio extends StatelessWidget {
  final Ejercicio ejercicio;
  const _TarjetaEjercicio({required this.ejercicio});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.blanco,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => DetalleEjercicioScreen(ejercicio: ejercicio)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: _Miniatura(url: ejercicio.imagen, tam: 72),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ejercicio.nombre, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      ejercicio.musculos.isEmpty
                          ? ejercicio.categoria
                          : ejercicio.musculos.join(', '),
                      style: const TextStyle(color: AppColors.textoSecundario),
                    ),
                    if (ejercicio.videoUrl != null)
                      const Text('Con video',
                          style: TextStyle(color: AppColors.naranjaOscuro, fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textoSecundario),
            ],
          ),
        ),
      ),
    );
  }
}

class DetalleEjercicioScreen extends StatefulWidget {
  final Ejercicio ejercicio;
  const DetalleEjercicioScreen({super.key, required this.ejercicio});

  @override
  State<DetalleEjercicioScreen> createState() => _DetalleEjercicioState();
}

class _DetalleEjercicioState extends State<DetalleEjercicioScreen> {
  final _wger = WgerService();
  VideoPlayerController? _video;
  bool _cargandoVideo = false;
  String? _errorVideo;

  @override
  void initState() {
    super.initState();
    final url = widget.ejercicio.videoUrl;
    if (url != null) _cargarVideo(url);
  }

  Future<void> _cargarVideo(String url) async {
    setState(() {
      _cargandoVideo = true;
      _errorVideo = null;
    });
    try {
      final archivo = await _wger.video(url);
      final c = VideoPlayerController.file(archivo);
      await c.initialize();
      await c.setLooping(true);
      if (!mounted) {
        c.dispose();
        return;
      }
      setState(() {
        _video = c;
        _cargandoVideo = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _errorVideo = 'No se pudo cargar el video. Revisa tu conexión.';
          _cargandoVideo = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _video?.dispose();
    super.dispose();
  }

  void _alternarPlay() {
    final c = _video;
    if (c == null) return;
    if (c.value.isPlaying) {
      c.pause();
    } else {
      c.play();
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final e = widget.ejercicio;
    final textos = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: Text(e.nombre)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _Bloque(ejercicio: e, video: _video, cargando: _cargandoVideo,
              error: _errorVideo, onPlay: _alternarPlay),
          const SizedBox(height: 16),
          if (e.imagenIA)
            const Text('Imagen generada por IA',
                style: TextStyle(color: AppColors.textoSecundario, fontSize: 12)),
          if (e.musculos.isNotEmpty) Text('Músculos: ${e.musculos.join(', ')}'),
          if (e.equipo.isNotEmpty) Text('Equipo: ${e.equipo.join(', ')}'),
          if (!e.enEspanol)
            const Text('Instrucciones en inglés (no hay traducción al español).',
                style: TextStyle(color: AppColors.textoSecundario, fontSize: 12)),
          const Divider(height: 32),
          Text('Cómo hacerlo', style: textos.titleMedium),
          const SizedBox(height: 8),
          if (e.pasos.isEmpty)
            const Text('Este ejercicio aún no tiene pasos.')
          else
            for (var i = 0; i < e.pasos.length; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text('${i + 1}. ${e.pasos[i]}'),
              ),
          const SizedBox(height: 24),
          Text(
            'Fuente: wger (https://wger.de). Autor: ${e.autor.isEmpty ? 'desconocido' : e.autor}. '
            'Licencia: ${e.licencia}.',
            style: textos.bodySmall?.copyWith(color: AppColors.textoSecundario),
          ),
        ],
      ),
    );
  }
}

class _Bloque extends StatelessWidget {
  final Ejercicio ejercicio;
  final VideoPlayerController? video;
  final bool cargando;
  final String? error;
  final VoidCallback onPlay;
  const _Bloque({
    required this.ejercicio,
    required this.video,
    required this.cargando,
    required this.error,
    required this.onPlay,
  });

  @override
  Widget build(BuildContext context) {
    if (ejercicio.videoUrl == null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: _Miniatura(url: ejercicio.imagen, tam: 240),
      );
    }
    if (error != null) {
      return Text(error!, textAlign: TextAlign.center);
    }
    if (cargando || video == null) {
      return const SizedBox(
        height: 240,
        child: Center(child: CircularProgressIndicator(color: AppColors.naranja)),
      );
    }
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: AspectRatio(
            aspectRatio: video!.value.aspectRatio,
            child: VideoPlayer(video!),
          ),
        ),
        IconButton(
          iconSize: 40,
          icon: Icon(video!.value.isPlaying ? Icons.pause_circle : Icons.play_circle,
              color: AppColors.naranja),
          onPressed: onPlay,
        ),
      ],
    );
  }
}