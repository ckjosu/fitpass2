import { Controller, Get, Query, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../common/security';

interface Lugar {
  titulo: string;
  detalle: string;
  lat: number;
  lng: number;
}

/**
 * Buscador del mapa (Datos del gimnasio). Pasa la busqueda a TomTom con la
 * clave guardada en el servidor (TOMTOM_KEY), asi la clave no queda en la web.
 * TomTom tiene una cuota gratis al mes y no pide tarjeta.
 */
@ApiTags('mapa')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('mapa')
export class MapaController {
  @Get('buscar')
  @ApiOperation({ summary: 'Busca negocios, calles y colonias (TomTom), como en Google Maps' })
  async buscar(
    @Query('q') q: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ): Promise<Lugar[]> {
    const clave = process.env.TOMTOM_KEY;
    if (!clave) throw new ServiceUnavailableException('Falta TOMTOM_KEY en el servidor');

    const texto = (q || '').trim().slice(0, 120);
    if (texto.length < 2) return [];

    const params = new URLSearchParams({
      key: clave,
      typeahead: 'true',
      limit: '8',
      countrySet: 'MX',
      language: 'es-419',
    });
    // Da prioridad a lo cercano a donde se esta viendo el mapa.
    if (lat && lng && !isNaN(+lat) && !isNaN(+lng)) {
      params.set('lat', String(+lat));
      params.set('lon', String(+lng));
    }

    const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(texto)}.json?${params}`;
    const r = await fetch(url);
    if (!r.ok) throw new ServiceUnavailableException('El buscador del mapa no respondio');
    const datos: any = await r.json();

    return (datos.results || []).map((x: any) => {
      const dir = x.address || {};
      const titulo = x.poi?.name || dir.streetName
        ? (x.poi?.name || [dir.streetName, dir.streetNumber].filter(Boolean).join(' '))
        : (dir.municipalitySubdivision || dir.municipality || dir.freeformAddress);
      const detalle = [
        x.poi?.name ? [dir.streetName, dir.streetNumber].filter(Boolean).join(' ') : '',
        dir.municipalitySubdivision,
        dir.municipality,
        dir.countrySubdivision,
      ].filter((p: string) => !!p && p !== titulo).join(', ');
      return { titulo, detalle, lat: x.position?.lat, lng: x.position?.lon };
    }).filter((l: Lugar) => l.titulo && l.lat != null && l.lng != null);
  }
}
