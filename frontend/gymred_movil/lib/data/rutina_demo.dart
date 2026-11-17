import '../models/rutina.dart';

/// Datos de prueba. Cuando la API tenga las rutinas, esto se reemplaza.
const rutinaPechoTriceps = Rutina(
  titulo: 'Pecho + Tríceps',
  ejercicios: [
    EjercicioRutina(nombre: 'Press de banca', series: 4, repeticiones: 12, descansoSeg: 90),
    EjercicioRutina(nombre: 'Press inclinado con mancuernas', series: 3, repeticiones: 12, descansoSeg: 75),
    EjercicioRutina(nombre: 'Aperturas con mancuernas', series: 3, repeticiones: 12, descansoSeg: 60),
    EjercicioRutina(nombre: 'Extensión de tríceps en polea', series: 3, repeticiones: 12, descansoSeg: 60),
    EjercicioRutina(nombre: 'Press francés', series: 3, repeticiones: 10, descansoSeg: 60),
  ],
);
