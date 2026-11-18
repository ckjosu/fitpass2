import 'package:flutter/material.dart';

/// Colores del tema de la app. Alineados con la web de Gymred (panel del gimnasio).
class TemaEntreno {
  static const fondo = Color(0xFFF6F6F8);
  static const tarjeta = Color(0xFFFFFFFF);
  static const tarjetaClara = Color(0xFFE6E6EB);
  static const naranja = Color(0xFFEA580C);
  static const naranjaOscuro = Color(0xFFC2410C);
  static const texto = Color(0xFF141416);
  static const textoSuave = Color(0xFF6B6B76);
  static const rojo = Color(0xFFDC2626);
  static const verde = Color(0xFF16A34A);
}

/// Tarjeta blanca con sombra suave, reutilizable en las pantallas de entrenamiento.
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
        boxShadow: const [
          BoxShadow(color: Color(0x14000000), blurRadius: 12, offset: Offset(0, 4)),
        ],
      ),
      child: child,
    );
  }
}