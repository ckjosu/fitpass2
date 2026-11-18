import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/api_config.dart';
import '../models/gimnasio.dart';
import '../models/suscripcion.dart';
import '../services/movil_service.dart';
import '../services/ubicacion_service.dart';
import '../theme/app_theme.dart';
import '../widgets/comunes.dart';
import 'detalle_gimnasio_screen.dart';

/// Lo que necesita la pantalla: los gimnasios y el nivel del plan del socio.
class _Datos {
  final List<GimnasioResumen> gimnasios;
  final int? nivelSocio; // null = sin suscripción activa
  _Datos(this.gimnasios, this.nivelSocio);
}

class GimnasiosScreen extends StatefulWidget {
  const GimnasiosScreen({super.key});

  @override
  State<GimnasiosScreen> createState() => _GimnasiosScreenState();
}

class _GimnasiosScreenState extends State<GimnasiosScreen> {
  late Future<_Datos> _futuro;
  String _busqueda = '';
  String? _categoria; // null = todas

  @override
  void initState() {
    super.initState();
    _futuro = _cargar();
  }

  /// Pide la ubicación, la lista de gimnasios y el plan del socio al mismo tiempo.
  /// Si no hay permiso de ubicación, la lista sale igual pero sin distancias.
  Future<_Datos> _cargar() async {
    final movil = context.read<MovilService>();
    final posicion = await UbicacionService().posicionActual();

    final resultados = await Future.wait([
      movil.gimnasios(lat: posicion?.latitude, lng: posicion?.longitude),
      movil.miSuscripcion(),
    ]);
    final gimnasios = resultados[0] as List<GimnasioResumen>;
    final estado = resultados[1] as EstadoSuscripcion;
    return _Datos(gimnasios, estado.activa ? estado.suscripcion?.plan.nivel : null);
  }

  Future<void> _recargar() async {
    final f = _cargar();
    setState(() {
      _futuro = f;
    });
    try {
      await f;
    } catch (_) {}
  }

  List<GimnasioResumen> _filtrar(List<GimnasioResumen> todos) {
    final q = _busqueda.trim().toLowerCase();
    return todos.where((g) {
      final coincideTexto = q.isEmpty ||
          g.nombre.toLowerCase().contains(q) ||
          (g.colonia ?? '').toLowerCase().contains(q) ||
          g.ciudad.toLowerCase().contains(q);
      final coincideCategoria = _categoria == null || g.categoria == _categoria;
      return coincideTexto && coincideCategoria;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final textos = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Text(
                'Gimnasios',
                style: textos.headlineMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 2, 20, 0),
              child: Text(
                'Tu próximo espacio para entrenar',
                style: TextStyle(color: AppColors.textoSecundario),
              ),
            ),

            // Buscador
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Buscar por nombre, colonia o ciudad',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: AppColors.blanco,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                ),
                onChanged: (texto) {
                  setState(() {
                    _busqueda = texto;
                  });
                },
              ),
            ),

            // Filtros por categoría
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  _chip('Todos', null),
                  for (final c in categorias.entries) _chip(c.value, c.key),
                ],
              ),
            ),

            // Lista
            Expanded(
              child: RefreshIndicator(
                color: AppColors.naranja,
                onRefresh: _recargar,
                child: FutureBuilder<_Datos>(
                  future: _futuro,
                  builder: (context, snap) {
                    if (snap.connectionState == ConnectionState.waiting) {
                      return const Center(
                        child: CircularProgressIndicator(color: AppColors.naranja),
                      );
                    }
                    if (snap.hasError) {
                      return ListView(
                        padding: const EdgeInsets.all(32),
                        children: [
                          Text(snap.error.toString(), textAlign: TextAlign.center),
                          const SizedBox(height: 12),
                          Center(
                            child: OutlinedButton(
                              onPressed: _recargar,
                              child: const Text('Reintentar'),
                            ),
                          ),
                        ],
                      );
                    }

                    final datos = snap.data!;
                    final lista = _filtrar(datos.gimnasios);

                    if (lista.isEmpty) {
                      return ListView(
                        padding: const EdgeInsets.all(32),
                        children: const [
                          Icon(Icons.search_off,
                              size: 48, color: AppColors.textoSecundario),
                          SizedBox(height: 12),
                          Text(
                            'No encontramos gimnasios con ese filtro.',
                            textAlign: TextAlign.center,
                          ),
                        ],
                      );
                    }

                    return ListView(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                      children: [
                        Text(
                          '${lista.length} ${lista.length == 1 ? 'gimnasio' : 'gimnasios'} en tu zona',
                          style: const TextStyle(color: AppColors.textoSecundario),
                        ),
                        const SizedBox(height: 12),
                        for (final g in lista)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _TarjetaGimnasio(
                              g: g,
                              nivelSocio: datos.nivelSocio,
                              onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => DetalleGimnasioScreen(
                                    gimnasio: g,
                                    nivelSocio: datos.nivelSocio,
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String texto, String? valor) {
    final activo = _categoria == valor;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(texto),
        selected: activo,
        showCheckmark: false,
        selectedColor: AppColors.naranjaClaro,
        backgroundColor: AppColors.blanco,
        side: BorderSide.none,
        labelStyle: TextStyle(
          color: activo ? AppColors.naranjaOscuro : AppColors.texto,
          fontWeight: FontWeight.w600,
        ),
        onSelected: (_) {
          setState(() {
            _categoria = valor;
          });
        },
      ),
    );
  }
}

class _TarjetaGimnasio extends StatelessWidget {
  final GimnasioResumen g;
  final int? nivelSocio;
  final VoidCallback onTap;

  const _TarjetaGimnasio({
    required this.g,
    required this.nivelSocio,
    required this.onTap,
  });

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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 96,
                  height: 96,
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
                    const SizedBox(height: 2),
                    Text(
                      [g.direccion, g.ciudad].where((t) => t.isNotEmpty).join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: textos.bodySmall?.copyWith(color: AppColors.textoSecundario),
                    ),
                    const SizedBox(height: 6),
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
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        Etiqueta(
                          texto: g.categoriaTexto,
                          fondo: AppColors.azulClaro,
                          color: AppColors.azul,
                        ),
                        etiquetaNivel(g.nivelRequerido, nivelSocio),
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