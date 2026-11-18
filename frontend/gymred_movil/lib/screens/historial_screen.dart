import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/historial.dart';
import '../services/movil_service.dart';
import '../theme/app_theme.dart';
import '../widgets/calificar_gimnasio.dart';
import 'calendario_screen.dart';
import 'entreno/tema_entreno.dart';

const _mesesLargos = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

class HistorialScreen extends StatefulWidget {
  const HistorialScreen({super.key});

  @override
  State<HistorialScreen> createState() => _HistorialScreenState();
}

class _HistorialScreenState extends State<HistorialScreen> {
  late Future<List<ItemHistorial>> _futuro;
  late DateTime _mes; // primer día del mes que se muestra

  @override
  void initState() {
    super.initState();
    final hoy = DateTime.now();
    _mes = DateTime(hoy.year, hoy.month, 1);
    _futuro = context.read<MovilService>().historial();
  }

  bool get _esMesActual {
    final hoy = DateTime.now();
    return _mes.year == hoy.year && _mes.month == hoy.month;
  }

  void _cambiarMes(int delta) {
    setState(() => _mes = DateTime(_mes.year, _mes.month + delta, 1));
  }

  Future<void> _recargar() async {
    final f = context.read<MovilService>().historial();
    setState(() {
      _futuro = f;
    });
    try {
      await f;
    } catch (_) {
      // El error ya lo muestra el FutureBuilder.
    }
  }

  void _mensaje(String texto) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(texto)));
  }

  /// Busca el id del gimnasio por nombre y abre la hoja para calificarlo.
  Future<void> _calificar(ItemHistorial item) async {
    final movil = context.read<MovilService>();
    int? idGimnasio;
    try {
      final gimnasios = await movil.gimnasios();
      for (final g in gimnasios) {
        if (g.nombre == item.gimnasio) idGimnasio = g.id;
      }
    } catch (e) {
      _mensaje(e.toString());
      return;
    }

    final id = idGimnasio;
    if (id == null) {
      _mensaje('No encontramos ese gimnasio.');
      return;
    }
    if (!mounted) return;

    final enviado = await mostrarCalificarGimnasio(
      context,
      idGimnasio: id,
      nombre: item.gimnasio,
    );

    if (enviado) _mensaje('¡Gracias por tu reseña!');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TemaEntreno.fondo,
      appBar: AppBar(
        backgroundColor: TemaEntreno.fondo,
        foregroundColor: TemaEntreno.texto,
        elevation: 0,
        title: const Text('Historial'),
        actions: [
          IconButton(
            tooltip: 'Calendario',
            icon: const Icon(Icons.calendar_month),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const CalendarioScreen()),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.naranja,
        backgroundColor: TemaEntreno.tarjeta,
        onRefresh: _recargar,
        child: FutureBuilder<List<ItemHistorial>>(
          future: _futuro,
          builder: (context, snap) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              physics: const AlwaysScrollableScrollPhysics(),
              children: _contenido(snap),
            );
          },
        ),
      ),
    );
  }

  List<Widget> _contenido(AsyncSnapshot<List<ItemHistorial>> snap) {
    final cabecera = <Widget>[
      const Text(
        'Tu constancia cuenta',
        style: TextStyle(
          color: TemaEntreno.texto,
          fontSize: 26,
          fontWeight: FontWeight.w800,
        ),
      ),
      const SizedBox(height: 4),
      const Text(
        'Historial de visitas',
        style: TextStyle(color: TemaEntreno.textoSuave),
      ),
      const SizedBox(height: 20),
    ];

    if (snap.connectionState == ConnectionState.waiting) {
      return [
        ...cabecera,
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 48),
          child: Center(
            child: CircularProgressIndicator(color: AppColors.naranja),
          ),
        ),
      ];
    }

    if (snap.hasError) {
      return [
        ...cabecera,
        Text(
          snap.error.toString(),
          textAlign: TextAlign.center,
          style: const TextStyle(color: TemaEntreno.textoSuave),
        ),
        const SizedBox(height: 12),
        Center(
          child: OutlinedButton(
            onPressed: _recargar,
            child: const Text('Reintentar'),
          ),
        ),
      ];
    }

    final todos = snap.data!;
    final delMes = todos
        .where((i) => i.fecha.year == _mes.year && i.fecha.month == _mes.month)
        .toList()
      ..sort((a, b) => b.fecha.compareTo(a.fecha));
    final entradas = delMes.where((i) => i.permitido).toList();
    final gimnasios = entradas.map((i) => i.gimnasio).toSet().length;
    final nombreMes = _mesesLargos[_mes.month - 1];

    return [
      ...cabecera,
      _Resumen(
        visitas: entradas.length,
        gimnasios: gimnasios,
        nombreMes: nombreMes.toLowerCase(),
      ),
      const SizedBox(height: 20),
      _SelectorMes(
        texto: '$nombreMes ${_mes.year}',
        onAnterior: () => _cambiarMes(-1),
        onSiguiente: _esMesActual ? null : () => _cambiarMes(1),
      ),
      const SizedBox(height: 16),
      if (delMes.isEmpty)
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Text(
            'No hay visitas en este mes.',
            textAlign: TextAlign.center,
            style: TextStyle(color: TemaEntreno.textoSuave),
          ),
        )
      else
        ..._porDia(delMes),
    ];
  }

  /// Agrupa las visitas por día, con un encabezado para cada fecha.
  List<Widget> _porDia(List<ItemHistorial> items) {
    final widgets = <Widget>[];
    DateTime? diaActual;
    for (final item in items) {
      final dia = DateTime(item.fecha.year, item.fecha.month, item.fecha.day);
      if (diaActual == null || dia != diaActual) {
        diaActual = dia;
        if (widgets.isNotEmpty) widgets.add(const SizedBox(height: 12));
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              '${dia.day} DE ${_mesesLargos[dia.month - 1].toUpperCase()}',
              style: const TextStyle(
                color: TemaEntreno.textoSuave,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ),
        );
      }
      widgets.add(
        _TarjetaVisita(item: item, onCalificar: () => _calificar(item)),
      );
    }
    return widgets;
  }
}

class _Resumen extends StatelessWidget {
  final int visitas;
  final int gimnasios;
  final String nombreMes;
  const _Resumen({
    required this.visitas,
    required this.gimnasios,
    required this.nombreMes,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: TemaEntreno.tarjeta,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$visitas',
                  style: const TextStyle(
                    color: TemaEntreno.naranja,
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  'visitas en $nombreMes',
                  style: const TextStyle(
                    color: TemaEntreno.textoSuave,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(width: 1, height: 44, color: TemaEntreno.tarjetaClara),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$gimnasios',
                  style: const TextStyle(
                    color: TemaEntreno.texto,
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const Text(
                  'gimnasios visitados',
                  style: TextStyle(color: TemaEntreno.textoSuave, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SelectorMes extends StatelessWidget {
  final String texto;
  final VoidCallback onAnterior;
  final VoidCallback? onSiguiente;
  const _SelectorMes({
    required this.texto,
    required this.onAnterior,
    required this.onSiguiente,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          color: TemaEntreno.textoSuave,
          onPressed: onAnterior,
        ),
        Expanded(
          child: Text(
            texto,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: TemaEntreno.texto,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          color: onSiguiente == null
              ? TemaEntreno.tarjetaClara
              : TemaEntreno.textoSuave,
          onPressed: onSiguiente,
        ),
      ],
    );
  }
}

class _TarjetaVisita extends StatelessWidget {
  final ItemHistorial item;
  final VoidCallback onCalificar;
  const _TarjetaVisita({required this.item, required this.onCalificar});

  String get _hora {
    final h = item.fecha.hour.toString().padLeft(2, '0');
    final m = item.fecha.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  @override
  Widget build(BuildContext context) {
    final permitido = item.permitido;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: TemaEntreno.tarjeta,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: TemaEntreno.tarjetaClara,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              permitido ? Icons.qr_code_scanner : Icons.block,
              color: permitido ? TemaEntreno.naranja : AppColors.rojo,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.gimnasio,
                  style: const TextStyle(
                    color: TemaEntreno.texto,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  permitido
                      ? '$_hora · Entrada con QR'
                      : (item.motivo ?? 'Acceso denegado'),
                  style: TextStyle(
                    color: permitido ? TemaEntreno.textoSuave : AppColors.rojo,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (permitido)
            TextButton(
              onPressed: onCalificar,
              style: TextButton.styleFrom(
                foregroundColor: TemaEntreno.naranja,
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Calificar',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
        ],
      ),
    );
  }
}