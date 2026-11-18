import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/movil_service.dart';
import '../theme/app_theme.dart';

/// Abre la hoja para calificar un gimnasio. Devuelve true si la reseña se envió.
Future<bool> mostrarCalificarGimnasio(
  BuildContext context, {
  required int idGimnasio,
  required String nombre,
}) async {
  final enviado = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.blanco,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => HojaCalificar(idGimnasio: idGimnasio, nombre: nombre),
  );
  return enviado == true;
}

/// Hoja para elegir estrellas y escribir un comentario.
class HojaCalificar extends StatefulWidget {
  final int idGimnasio;
  final String nombre;
  const HojaCalificar({super.key, required this.idGimnasio, required this.nombre});

  @override
  State<HojaCalificar> createState() => _HojaCalificarState();
}

class _HojaCalificarState extends State<HojaCalificar> {
  int _estrellas = 5;
  final _comentario = TextEditingController();
  bool _enviando = false;
  String? _error;

  @override
  void dispose() {
    _comentario.dispose();
    super.dispose();
  }

  Future<void> _enviar() async {
    setState(() {
      _enviando = true;
      _error = null;
    });
    try {
      await context.read<MovilService>().calificarGimnasio(
            idGimnasio: widget.idGimnasio,
            calificacion: _estrellas,
            comentario: _comentario.text,
          );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _enviando = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final textos = Theme.of(context).textTheme;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        20,
        20,
        20 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Califica a ${widget.nombre}', style: textos.titleLarge),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final n = i + 1;
              return IconButton(
                onPressed: _enviando ? null : () => setState(() => _estrellas = n),
                icon: Icon(
                  n <= _estrellas ? Icons.star : Icons.star_border,
                  size: 40,
                  color: AppColors.naranja,
                ),
              );
            }),
          ),
          TextField(
            controller: _comentario,
            maxLines: 3,
            maxLength: 300,
            decoration: const InputDecoration(
              labelText: 'Comentario (opcional)',
              alignLabelWithHint: true,
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: AppColors.rojo)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _enviando ? null : _enviar,
            child: _enviando
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.blanco,
                    ),
                  )
                : const Text('Enviar reseña'),
          ),
        ],
      ),
    );
  }
}