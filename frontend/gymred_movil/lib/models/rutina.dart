/// Un ejercicio dentro de una rutina.
class EjercicioRutina {
  final String nombre;
  final int series;
  final int repeticiones;
  final int descansoSeg;

  const EjercicioRutina({
    required this.nombre,
    required this.series,
    required this.repeticiones,
    required this.descansoSeg,
  });
}

/// Rutina completa (por ejemplo, "Pecho + Tríceps").
class Rutina {
  final String titulo;
  final List<EjercicioRutina> ejercicios;

  const Rutina({required this.titulo, required this.ejercicios});
}