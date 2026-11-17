import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/historial.dart';
import '../services/movil_service.dart';
import '../theme/app_theme.dart';

const _mesesLargos = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/// Días con entrada permitida, sin hora (solo fecha local).
Set<DateTime> _diasEntrenados(List<ItemHistorial> items) {
  return items
      .where((i) => i.permitido)
      .map((i) => DateTime(i.fecha.year, i.fecha.month, i.fecha.day))
      .toSet();
}

class CalendarioScreen extends StatefulWidget {
  const CalendarioScreen({super.key});

  @override
  State<CalendarioScreen> createState() => _CalendarioScreenState();
}

class _CalendarioScreenState extends State<CalendarioScreen> {
  late Future<List<ItemHistorial>> _futuro;
  int _anio = DateTime.now().year;

  @override
  void initState() {
    super.initState();
    _futuro = context.read<MovilService>().historial();
  }

  Future<void> _recargar() async {
    final f = context.read<MovilService>().historial();
    setState(() => _futuro = f);
    try {
      await f;
    } catch (_) {
      // El error ya lo muestra el FutureBuilder.
    }
  }

  @override
  Widget build(BuildContext context) {
    final hoy = DateTime.now();

    return Scaffold(
      appBar: AppBar(title: const Text('Mis entrenamientos')),
      body: RefreshIndicator(
        color: AppColors.naranja,
        onRefresh: _recargar,
        child: FutureBuilder<List<ItemHistorial>>(
          future: _futuro,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return ListView(
                children: const [
                  SizedBox(height: 120),
                  Center(
                    child: CircularProgressIndicator(color: AppColors.naranja),
                  ),
                ],
              );
            }
            if (snap.hasError) {
              return ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  const SizedBox(height: 48),
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

            final dias = _diasEntrenados(snap.data!);
            final delAnio = dias.where((d) => d.year == _anio).length;
            final esteMes = dias
                .where((d) => d.year == hoy.year && d.month == hoy.month)
                .length;

            return ListView(
              padding: const EdgeInsets.all(20),
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                // Selector de año
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.chevron_left),
                      onPressed: () => setState(() => _anio--),
                    ),
                    Expanded(
                      child: Text(
                        '$_anio',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.chevron_right),
                      onPressed: _anio < hoy.year
                          ? () => setState(() => _anio++)
                          : null,
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Resumen
                Row(
                  children: [
                    Expanded(
                      child: _Resumen(
                        titulo: 'Este año',
                        valor: '$delAnio',
                        unidad: delAnio == 1 ? 'día' : 'días',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _Resumen(
                        titulo: 'Este mes',
                        valor: '$esteMes',
                        unidad: esteMes == 1 ? 'día' : 'días',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Leyenda
                const Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    _PuntoLeyenda(),
                    SizedBox(width: 6),
                    Text(
                      'Día entrenado',
                      style: TextStyle(color: AppColors.textoSecundario),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Meses del año
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.76,
                  children: [
                    for (var m = 1; m <= 12; m++)
                      _MesMini(anio: _anio, mes: m, entrenados: dias),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _Resumen extends StatelessWidget {
  final String titulo;
  final String valor;
  final String unidad;
  const _Resumen({
    required this.titulo,
    required this.valor,
    required this.unidad,
  });

  @override
  Widget build(BuildContext context) {
    final textos = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.blanco,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(color: Color(0x14000000), blurRadius: 12, offset: Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(titulo,
              style: textos.bodySmall?.copyWith(color: AppColors.textoSecundario)),
          const SizedBox(height: 4),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: valor,
                  style: textos.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
                TextSpan(text: ' $unidad', style: textos.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PuntoLeyenda extends StatelessWidget {
  const _PuntoLeyenda();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 12,
      height: 12,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.naranja,
      ),
    );
  }
}

class _MesMini extends StatelessWidget {
  final int anio;
  final int mes;
  final Set<DateTime> entrenados;
  const _MesMini({
    required this.anio,
    required this.mes,
    required this.entrenados,
  });

  @override
  Widget build(BuildContext context) {
    final primero = DateTime(anio, mes, 1);
    final diasMes = DateTime(anio, mes + 1, 0).day;
    final offset = primero.weekday - 1; // la semana empieza en lunes
    final filas = ((offset + diasMes) / 7).ceil();
    final textos = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.blanco,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [
          BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, 3)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_mesesLargos[mes - 1],
              style: textos.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Row(
            children: [
              for (final l in const ['L', 'M', 'X', 'J', 'V', 'S', 'D'])
                Expanded(
                  child: Center(
                    child: Text(l,
                        style: const TextStyle(
                            fontSize: 10, color: AppColors.textoSecundario)),
                  ),
                ),
            ],
          ),
          for (var f = 0; f < filas; f++)
            Row(
              children: [
                for (var c = 0; c < 7; c++)
                  Expanded(
                    child: _Celda(
                      dia: f * 7 + c - offset + 1,
                      anio: anio,
                      mes: mes,
                      diasMes: diasMes,
                      entrenados: entrenados,
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }
}

class _Celda extends StatelessWidget {
  final int dia;
  final int anio;
  final int mes;
  final int diasMes;
  final Set<DateTime> entrenados;
  const _Celda({
    required this.dia,
    required this.anio,
    required this.mes,
    required this.diasMes,
    required this.entrenados,
  });

  @override
  Widget build(BuildContext context) {
    if (dia < 1 || dia > diasMes) {
      return const SizedBox(height: 24);
    }
    final fecha = DateTime(anio, mes, dia);
    final entreno = entrenados.contains(fecha);
    final hoy = DateTime.now();
    final esHoy = fecha == DateTime(hoy.year, hoy.month, hoy.day);

    return SizedBox(
      height: 24,
      child: Center(
        child: Container(
          width: 20,
          height: 20,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: entreno ? AppColors.naranja : null,
            border: esHoy && !entreno
                ? Border.all(color: AppColors.naranja)
                : null,
          ),
          child: Text(
            '$dia',
            style: TextStyle(
              fontSize: 10,
              color: entreno ? AppColors.blanco : null,
              fontWeight: entreno ? FontWeight.w700 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}