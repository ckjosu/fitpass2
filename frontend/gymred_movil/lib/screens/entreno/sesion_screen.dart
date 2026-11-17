import 'dart:async';

import 'package:flutter/material.dart';

import '../../models/rutina.dart';
import 'resumen_screen.dart';
import 'tema_entreno.dart';

class SesionScreen extends StatefulWidget {
  final Rutina rutina;
  const SesionScreen({super.key, required this.rutina});

  @override
  State<SesionScreen> createState() => _SesionScreenState();
}

class _SesionScreenState extends State<SesionScreen> {
  final DateTime _inicio = DateTime.now();
  Timer? _reloj;
  int _indiceEj = 0;
  int _serie = 1;
  int _segundos = 0; // cronómetro de la serie, o cuenta regresiva del descanso
  bool _enDescanso = false;
  int _seriesHechas = 0;

  EjercicioRutina get _actual => widget.rutina.ejercicios[_indiceEj];

  bool get _esUltimaSerie =>
      _serie >= _actual.series &&
      _indiceEj >= widget.rutina.ejercicios.length - 1;

  @override
  void initState() {
    super.initState();
    _reloj = Timer.periodic(const Duration(seconds: 1), _tick);
  }

  @override
  void dispose() {
    _reloj?.cancel();
    super.dispose();
  }

  void _tick(Timer _) {
    if (!mounted) return;
    setState(() {
      if (!_enDescanso) {
        _segundos++;
      } else if (_segundos > 0) {
        _segundos--;
      } else {
        _enDescanso = false;
      }
    });
  }

  void _iniciarDescanso() {
    setState(() {
      _enDescanso = true;
      _segundos = _actual.descansoSeg;
    });
  }

  void _cancelarDescanso() {
    setState(() {
      _enDescanso = false;
      _segundos = 0;
    });
  }

  void _siguienteSerie() {
    if (_esUltimaSerie) {
      _terminar();
      return;
    }
    final ultimaSerieDelEjercicio = _serie >= _actual.series;
    setState(() {
      _seriesHechas++;
      _enDescanso = false;
      _segundos = 0;
      if (!ultimaSerieDelEjercicio) {
        _serie++;
      } else {
        _indiceEj++;
        _serie = 1;
      }
    });
  }

  void _terminar() {
    _reloj?.cancel();
    final duracion = DateTime.now().difference(_inicio);
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => ResumenScreen(
          titulo: widget.rutina.titulo,
          duracion: duracion,
          ejercicios: widget.rutina.ejercicios.length,
          series: _seriesHechas + 1, // +1 por la última serie
        ),
      ),
    );
  }

  String _formato(int s) {
    final m = (s ~/ 60).toString().padLeft(2, '0');
    final ss = (s % 60).toString().padLeft(2, '0');
    return '$m:$ss';
  }

  @override
  Widget build(BuildContext context) {
    final siguientes = widget.rutina.ejercicios.skip(_indiceEj + 1).toList();

    return Scaffold(
      backgroundColor: TemaEntreno.fondo,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    widget.rutina.titulo,
                    style: const TextStyle(
                      color: TemaEntreno.texto,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: TemaEntreno.texto),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const Row(
              children: [
                Icon(Icons.circle, size: 8, color: TemaEntreno.naranja),
                SizedBox(width: 8),
                Text('Entrenamiento en curso',
                    style: TextStyle(color: TemaEntreno.naranja, fontSize: 13)),
              ],
            ),
            const SizedBox(height: 20),
            TarjetaEntreno(
              child: Column(
                children: [
                  const Text('Ejercicio actual',
                      style: TextStyle(color: TemaEntreno.textoSuave)),
                  const SizedBox(height: 6),
                  Text(
                    _actual.nombre,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: TemaEntreno.texto,
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Serie $_serie de ${_actual.series} · ${_actual.repeticiones} reps',
                    style: const TextStyle(color: TemaEntreno.naranja),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _formato(_segundos),
                    style: const TextStyle(
                      color: TemaEntreno.texto,
                      fontSize: 56,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _enDescanso ? 'Descanso' : 'Tiempo de la serie',
                    style: const TextStyle(color: TemaEntreno.textoSuave),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _enDescanso ? _cancelarDescanso : _iniciarDescanso,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: TemaEntreno.texto,
                      side: const BorderSide(color: TemaEntreno.tarjetaClara),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(_enDescanso ? 'Saltar descanso' : 'Descanso'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: _siguienteSerie,
                    style: FilledButton.styleFrom(
                      backgroundColor: TemaEntreno.naranja,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(_esUltimaSerie ? 'Terminar' : 'Siguiente serie'),
                  ),
                ),
              ],
            ),
            if (siguientes.isNotEmpty) ...[
              const SizedBox(height: 24),
              const Text('A continuación',
                  style: TextStyle(
                      color: TemaEntreno.texto, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              for (final e in siguientes)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: TarjetaEntreno(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(e.nombre,
                              style: const TextStyle(color: TemaEntreno.texto)),
                        ),
                        Text(
                          '${e.series} × ${e.repeticiones} · ${e.descansoSeg} s',
                          style: const TextStyle(
                              color: TemaEntreno.textoSuave, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}