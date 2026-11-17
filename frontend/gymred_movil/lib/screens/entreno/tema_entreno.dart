import 'package:flutter/material.dart';

/// Colores del modo entrenamiento (oscuro). El naranja es el de la marca Gymred.
class TemaEntreno {
  static const fondo = Color(0xFF0B1220);
  static const tarjeta = Color(0xFF162032);
  static const tarjetaClara = Color(0xFF1E2A40);
  static const naranja = Color(0xFFEA580C);
  static const texto = Color(0xFFF1F5F9);
  static const textoSuave = Color(0xFF94A3B8);
}

/// Tarjeta oscura con bordes redondeados, reutilizable en las pantallas de entrenamiento.
class TarjetaEntreno extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;
  const TarjetaEntreno({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: TemaEntreno.tarjeta,
        borderRadius: BorderRadius.circular(16),
      ),
      child: child,
    );
  }
}