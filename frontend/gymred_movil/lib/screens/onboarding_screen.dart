import 'package:flutter/material.dart';

import 'entreno/tema_entreno.dart';

class OnboardingScreen extends StatefulWidget {
  final VoidCallback onCrearCuenta;
  final VoidCallback onYaTengoCuenta;

  const OnboardingScreen({
    super.key,
    required this.onCrearCuenta,
    required this.onYaTengoCuenta,
  });

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _Slide {
  final IconData icono;
  final String titulo;
  final String texto;
  const _Slide(this.icono, this.titulo, this.texto);
}

const _slides = [
  _Slide(Icons.fitness_center, 'Entrena de forma inteligente',
      'Entrenamientos adaptados a tus objetivos, a tu nivel y a tu ritmo.'),
  _Slide(Icons.show_chart, 'Sigue tu progreso',
      'Registra tus avances y construye constancia. Cada entrenamiento cuenta.'),
  _Slide(Icons.groups_rounded, 'Únete a Gymred',
      'Tus rutinas, tus avances y tus objetivos, en un mismo lugar.'),
];

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controlador = PageController();
  int _pagina = 0;

  @override
  void dispose() {
    _controlador.dispose();
    super.dispose();
  }

  void _siguiente() {
    if (_pagina < _slides.length - 1) {
      _controlador.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } else {
      widget.onCrearCuenta();
    }
  }

  @override
  Widget build(BuildContext context) {
    final ultima = _pagina == _slides.length - 1;

    return Scaffold(
      backgroundColor: TemaEntreno.fondo,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Gymred',
                  style: TextStyle(
                    color: TemaEntreno.naranja,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _controlador,
                  itemCount: _slides.length,
                  onPageChanged: (i) => setState(() => _pagina = i),
                  itemBuilder: (_, i) => _VistaSlide(slide: _slides[i]),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < _slides.length; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: i == _pagina ? 24 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: i == _pagina
                            ? TemaEntreno.naranja
                            : TemaEntreno.tarjetaClara,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: TemaEntreno.naranja,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  onPressed: _siguiente,
                  child: Text(ultima ? 'Crear cuenta' : 'Siguiente'),
                ),
              ),
              TextButton(
                onPressed: widget.onYaTengoCuenta,
                child: const Text('Ya tengo cuenta',
                    style: TextStyle(color: TemaEntreno.textoSuave)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _VistaSlide extends StatelessWidget {
  final _Slide slide;
  const _VistaSlide({required this.slide});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 180,
          height: 180,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: TemaEntreno.tarjeta,
            border: Border.all(
                color: TemaEntreno.naranja.withValues(alpha: 0.4), width: 2),
          ),
          child: Icon(slide.icono, size: 72, color: TemaEntreno.naranja),
        ),
        const SizedBox(height: 40),
        Text(
          slide.titulo,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: TemaEntreno.texto,
            fontSize: 24,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          slide.texto,
          textAlign: TextAlign.center,
          style: const TextStyle(color: TemaEntreno.textoSuave, fontSize: 15),
        ),
      ],
    );
  }
}