import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/ejercicio.dart';

class PaginaEjercicios {
  final List<Ejercicio> items;
  final bool hayMas;
  const PaginaEjercicios(this.items, this.hayMas);
}

/// Consulta la API pública de wger. NO usa el ApiClient de Gymred,
/// para no mandar el token del socio a un servicio externo.
class WgerService {
  static const _base = 'https://wger.de/api/v2';
  static const idiomaEspanol = 4;
  static const tamanoPagina = 20;

  final Dio _dio = Dio(BaseOptions(
    baseUrl: _base,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
    headers: {'Accept': 'application/json'},
  ));

  /// Caché de videos: se guardan al verlos. Límite por cantidad (≈ 5 videos de ~60 MB).
  static final CacheManager _cacheVideos = CacheManager(Config(
    'gymredVideos',
    stalePeriod: const Duration(days: 60),
    maxNrOfCacheObjects: 5,
  ));

  /// Página de ejercicios. Si no hay internet, usa la última copia guardada.
  Future<PaginaEjercicios> pagina(int offset) async {
    final prefs = await SharedPreferences.getInstance();
    final clave = 'wger_pagina_$offset';
    try {
      final r = await _dio.get('/exerciseinfo/', queryParameters: {
        'language': idiomaEspanol,
        'limit': tamanoPagina,
        'offset': offset,
        'ordering': 'id',
      });
      final datos = r.data as Map<String, dynamic>;
      await prefs.setString(clave, jsonEncode(datos));
      return _parsear(datos);
    } catch (_) {
      final guardado = prefs.getString(clave);
      if (guardado != null) {
        return _parsear(jsonDecode(guardado) as Map<String, dynamic>);
      }
      rethrow;
    }
  }

  PaginaEjercicios _parsear(Map<String, dynamic> datos) {
    final lista = (datos['results'] as List)
        .cast<Map<String, dynamic>>()
        .map(Ejercicio.desdeWger)
        .toList()
      ..sort((a, b) => a.id.compareTo(b.id));
    return PaginaEjercicios(lista, datos['next'] != null);
  }
  /// Descarga el video la primera vez y después lo toma de la caché.
  Future<File> video(String url) => _cacheVideos.getSingleFile(url);
}
