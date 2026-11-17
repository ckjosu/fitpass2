/// Ejercicio de la guía, tomado de wger (exerciseinfo).
/// Fuente: https://wger.de — licencia por ejercicio y por medio (CC-BY-SA, etc.).
class Ejercicio {
  final int id;
  final String nombre;
  final String categoria;
  final List<String> musculos;
  final List<String> equipo;
  final List<String> pasos;
  final String? imagen; // miniatura o imagen principal (puede ser null)
  final bool imagenIA; // true si la imagen fue generada por IA
  final String? videoUrl; // video de wger (puede ser null)
  final String licencia; // ej. "CC-BY-SA 4"
  final String licenciaUrl;
  final String autor;
  final bool enEspanol; // false si no hay traducción en español

  const Ejercicio({
    required this.id,
    required this.nombre,
    required this.categoria,
    required this.musculos,
    required this.equipo,
    required this.pasos,
    required this.imagen,
    required this.imagenIA,
    required this.videoUrl,
    required this.licencia,
    required this.licenciaUrl,
    required this.autor,
    required this.enEspanol,
  });

  /// Convierte un resultado de /exerciseinfo/ de wger.
  factory Ejercicio.desdeWger(Map<String, dynamic> j) {
    final traducciones = (j['translations'] as List).cast<Map<String, dynamic>>();
    // Preferimos la traducción en español (id de idioma 4); si no hay, usamos la primera.
    final esp = traducciones.where((t) => t['language'] == 4).toList();
    final trad = esp.isNotEmpty
        ? esp.first
        : (traducciones.isNotEmpty ? traducciones.first : null);

    final nombreTrad = (trad?['name'] as String?)?.trim() ?? '';

    final imagenes = (j['images'] as List).cast<Map<String, dynamic>>();
    final principal = imagenes.where((i) => i['is_main'] == true).toList();
    final img = principal.isNotEmpty
        ? principal.first
        : (imagenes.isNotEmpty ? imagenes.first : null);
    final miniatura = img?['thumbnails']?['medium'] as String? ?? img?['image'] as String?;

    final videos = (j['videos'] as List).cast<Map<String, dynamic>>();
    final video = videos.where((v) => v['is_main'] == true).toList();
    final videoUrl = video.isNotEmpty
        ? video.first['video'] as String?
        : (videos.isNotEmpty ? videos.first['video'] as String? : null);

    final lic = j['license'] as Map<String, dynamic>?;

    return Ejercicio(
      id: j['id'] as int,
      nombre: nombreTrad.isEmpty ? 'Ejercicio ${j['id']}' : nombreTrad,
      categoria: (j['category'] as Map?)?['name'] as String? ?? 'Sin categoría',
      musculos: _nombres(j['muscles'] as List),
      equipo: _nombres(j['equipment'] as List),
      pasos: _pasosDesdeHtml(trad?['description'] as String? ?? ''),
      imagen: miniatura,
      imagenIA: img?['is_ai_generated'] == true,
      videoUrl: videoUrl,
      licencia: lic?['short_name'] as String? ?? '',
      licenciaUrl: lic?['url'] as String? ?? '',
      autor: j['license_author'] as String? ?? '',
      enEspanol: esp.isNotEmpty,
    );
  }

  /// Usa el nombre en inglés si existe, porque el nombre local a veces viene vacío.
  static List<String> _nombres(List lista) => lista
      .cast<Map<String, dynamic>>()
      .map((m) {
        final en = (m['name_en'] as String?)?.trim() ?? '';
        return en.isNotEmpty ? en : (m['name'] as String? ?? '').trim();
      })
      .where((s) => s.isNotEmpty)
      .toList();

  static List<String> _pasosDesdeHtml(String html) {
    final items = RegExp(r'<li>(.*?)</li>', dotAll: true)
        .allMatches(html)
        .map((m) => _limpiar(m.group(1)!))
        .where((s) => s.isNotEmpty)
        .toList();
    if (items.isNotEmpty) return items;
    final texto = _limpiar(html);
    return texto.isEmpty ? [] : [texto];
  }

  static String _limpiar(String s) => s
      .replaceAll(RegExp(r'<[^>]+>'), '')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}