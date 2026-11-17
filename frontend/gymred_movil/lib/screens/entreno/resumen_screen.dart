import 'package:flutter/material.dart';

import 'tema_entreno.dart';

class ResumenScreen extends StatelessWidget {
  final String titulo;
  final Duration duracion;
  final int ejercicios;
  final int series;

  const ResumenScreen({
    super.key,
    required this.titulo,
    required this.duracion,
    required this.ejercicios,
    required this.series,
  });

  @override
  Widget build(BuildContext context) {
    final minutos = duracion.inMinutes;
    final calorias = minutos * 6; // estimación simple, se ajusta con datos reales

    return Scaffold(
      backgroundColor: TemaEntreno.fondo,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: TemaEntreno.naranja.withValues(alpha: 0.15),
                ),
                child: const Icon(Icons.check_rounded,
                    size: 52, color: TemaEntreno.naranja),
              ),
              const SizedBox(height: 24),
              const Text(
                '¡Entrenamiento completado!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: TemaEntreno.texto,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(titulo, style: const TextStyle(color: TemaEntreno.textoSuave)),
              const SizedBox(height: 24),
              TarjetaEntreno(
                child: Column(
                  children: [
                    _Fila('Tiempo total', '$minutos min'),
                    _Fila('Ejercicios', '$ejercicios'),
                    _Fila('Series', '$series'),
                    _Fila('Calorías (estimadas)', '$calorias kcal'),
                  ],
                ),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: TemaEntreno.naranja,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  // Aquí se guardará la sesión cuando la API lo tenga.
                  onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
                  child: const Text('Volver al inicio'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: null,
                  style: OutlinedButton.styleFrom(
                    disabledForegroundColor: TemaEntreno.textoSuave,
                    side: const BorderSide(color: TemaEntreno.tarjetaClara),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Compartir (próximamente)'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Fila extends StatelessWidget {
  final String etiqueta;
  final String valor;
  const _Fila(this.etiqueta, this.valor);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Text(etiqueta, style: const TextStyle(color: TemaEntreno.textoSuave)),
          const Spacer(),
          Text(valor,
              style: const TextStyle(
                  color: TemaEntreno.texto, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}