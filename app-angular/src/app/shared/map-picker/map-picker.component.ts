import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy,
  Output, SimpleChanges, ViewChild, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

export interface Punto {
  latitud: number;
  longitud: number;
}

interface Sugerencia {
  titulo: string;
  detalle: string;
  lat: number;
  lng: number;
}

/** Centro por omisión: Calkiní, Campeche (mercado inicial). */
const CENTRO_INICIAL: L.LatLngExpression = [20.3713, -90.0517];

/**
 * Mapa para fijar la ubicación exacta del gimnasio, parecido a Google Maps:
 *  - buscador con sugerencias mientras escribes,
 *  - zoom con la rueda del mouse o con dos dedos, y arrastrar para moverse,
 *  - clic en el mapa o arrastrar el pin para fijar el punto,
 *  - vista de calles o satélite, mi ubicación y pantalla completa.
 *
 * Usa Leaflet con mapas de OpenStreetMap y la vista satelital de Esri;
 * las dos son gratis y no piden clave.
 */
@Component({
  selector: 'fp-map-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-picker.component.html',
  styleUrl: './map-picker.component.scss',
})
export class MapPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() latitud: number | null = null;
  @Input() longitud: number | null = null;
  /** Dirección capturada en el formulario, para buscarla con un clic. */
  @Input() direccion = '';
  @Output() cambio = new EventEmitter<Punto>();

  @ViewChild('mapa', { static: true }) contenedor!: ElementRef<HTMLDivElement>;
  @ViewChild('marco', { static: true }) marco!: ElementRef<HTMLDivElement>;

  private zona = inject(NgZone);
  private mapa?: L.Map;
  private pin?: L.Marker;
  private calles?: L.TileLayer;
  private satelite?: L.TileLayer;
  private observador?: ResizeObserver;
  private espera?: ReturnType<typeof setTimeout>;
  private peticion?: AbortController;

  // Buscador
  texto = '';
  sugerencias: Sugerencia[] = [];
  abierto = false;
  buscando = false;
  marcada = -1;

  vista: 'calles' | 'satelite' = 'calles';
  completa = false;
  aviso = '';

  // Pin propio con los colores del panel (los íconos por defecto de Leaflet
  // no cargan bien cuando Angular empaqueta el proyecto).
  private icono = L.divIcon({
    className: 'fp-pin',
    html: '<span class="fp-pin-cuerpo"></span><span class="fp-pin-sombra"></span>',
    iconSize: [30, 42],
    iconAnchor: [15, 40],
  });

  ngAfterViewInit(): void {
    // Leaflet escucha muchos eventos del mouse; fuera de la zona de Angular
    // no se dispara la detección de cambios en cada movimiento.
    this.zona.runOutsideAngular(() => {
      const tienePunto = this.latitud !== null && this.longitud !== null;
      this.mapa = L.map(this.contenedor.nativeElement, {
        center: tienePunto ? [this.latitud!, this.longitud!] : CENTRO_INICIAL,
        zoom: tienePunto ? 17 : 14,
        zoomControl: false,
        scrollWheelZoom: true,
        wheelPxPerZoomLevel: 90,
        zoomSnap: 0.5,
        tapTolerance: 15,
      });

      L.control.zoom({ position: 'bottomright', zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(this.mapa);
      L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(this.mapa);

      this.calles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      });
      this.satelite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Imágenes &copy; Esri' },
      );
      this.calles.addTo(this.mapa);

      if (tienePunto) this.ponerPin(this.latitud!, this.longitud!, false);

      // Un clic (no un arrastre) pone o mueve el pin.
      this.mapa.on('click', (e: L.LeafletMouseEvent) => this.ponerPin(e.latlng.lat, e.latlng.lng, true));

      // Si el mapa cambia de tamaño (pantalla completa, menú, ventana), se
      // vuelve a acomodar para que no salgan cuadros grises.
      this.observador = new ResizeObserver(() => this.mapa?.invalidateSize());
      this.observador.observe(this.contenedor.nativeElement);
      setTimeout(() => this.mapa?.invalidateSize(), 200);
    });
  }

  ngOnChanges(c: SimpleChanges): void {
    // Cuando cambias de gimnasio en el selector, el mapa se mueve al nuevo.
    if ((c['latitud'] || c['longitud']) && this.mapa) {
      if (this.latitud !== null && this.longitud !== null) {
        this.ponerPin(this.latitud, this.longitud, false);
        this.mapa.setView([this.latitud, this.longitud], Math.max(this.mapa.getZoom(), 16));
      } else if (this.pin) {
        this.pin.remove();
        this.pin = undefined;
        this.mapa.setView(CENTRO_INICIAL, 14);
      }
    }
  }

  private ponerPin(lat: number, lng: number, avisar: boolean): void {
    if (!this.mapa) return;
    if (!this.pin) {
      this.pin = L.marker([lat, lng], { icon: this.icono, draggable: true, autoPan: true }).addTo(this.mapa);
      this.pin.on('dragend', () => {
        const p = this.pin!.getLatLng();
        this.emitir(p.lat, p.lng);
      });
    } else {
      this.pin.setLatLng([lat, lng]);
    }
    if (avisar) this.emitir(lat, lng);
  }

  private emitir(lat: number, lng: number): void {
    // 7 decimales, igual que la columna de la base (DECIMAL 10,7).
    const punto = { latitud: Number(lat.toFixed(7)), longitud: Number(lng.toFixed(7)) };
    this.zona.run(() => {
      this.aviso = '';
      this.cambio.emit(punto);
    });
  }

  // ------------------------------------------------------------------
  // Buscador con sugerencias (OpenStreetMap / Nominatim)
  // ------------------------------------------------------------------

  alEscribir(): void {
    clearTimeout(this.espera);
    this.marcada = -1;
    const q = this.texto.trim();
    if (q.length < 3) {
      this.sugerencias = [];
      this.abierto = false;
      return;
    }
    // Espera a que dejes de escribir para no pedir en cada tecla.
    this.espera = setTimeout(() => this.buscar(q), 450);
  }

  private async buscar(q: string): Promise<void> {
    this.peticion?.abort();
    this.peticion = new AbortController();
    this.buscando = true;
    try {
      // Da prioridad a lo que se ve en el mapa, sin limitarse a eso.
      const b = this.mapa?.getBounds();
      const caja = b ? `&viewbox=${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}` : '';
      const url =
        'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=mx' +
        caja + '&q=' + encodeURIComponent(q);
      const r = await fetch(url, { signal: this.peticion.signal, headers: { 'Accept-Language': 'es' } });
      const datos: any[] = await r.json();
      this.sugerencias = datos.map((d) => {
        const partes = String(d.display_name).split(',').map((p: string) => p.trim());
        return {
          titulo: d.name || partes[0],
          detalle: partes.slice(1, 4).join(', '),
          lat: Number(d.lat),
          lng: Number(d.lon),
        };
      });
      this.abierto = true;
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        this.sugerencias = [];
        this.aviso = 'No se pudo buscar. Revisa tu internet o haz clic en el mapa.';
      }
    } finally {
      this.buscando = false;
    }
  }

  elegir(s: Sugerencia): void {
    this.texto = s.titulo;
    this.abierto = false;
    this.sugerencias = [];
    this.mapa?.flyTo([s.lat, s.lng], 18, { duration: 0.8 });
    this.ponerPin(s.lat, s.lng, true);
    this.aviso = 'Revisa que el pin quede justo en tu entrada; puedes arrastrarlo.';
  }

  teclas(e: KeyboardEvent): void {
    if (!this.abierto || this.sugerencias.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(this.espera);
        if (this.texto.trim().length >= 3) this.buscar(this.texto.trim());
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.marcada = (this.marcada + 1) % this.sugerencias.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.marcada = (this.marcada - 1 + this.sugerencias.length) % this.sugerencias.length;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.elegir(this.sugerencias[Math.max(0, this.marcada)]);
    } else if (e.key === 'Escape') {
      this.abierto = false;
    }
  }

  limpiar(): void {
    this.texto = '';
    this.sugerencias = [];
    this.abierto = false;
  }

  cerrarLuego(): void {
    // Deja tiempo para que el clic en una sugerencia se registre.
    setTimeout(() => (this.abierto = false), 150);
  }

  /** Busca la dirección escrita en el formulario. */
  usarDireccion(): void {
    if (!this.direccion.trim()) return;
    this.texto = this.direccion;
    clearTimeout(this.espera);
    this.buscar(this.direccion.trim());
  }

  // ------------------------------------------------------------------
  // Controles
  // ------------------------------------------------------------------

  cambiarVista(): void {
    if (!this.mapa || !this.calles || !this.satelite) return;
    if (this.vista === 'calles') {
      this.mapa.removeLayer(this.calles);
      this.satelite.addTo(this.mapa);
      this.vista = 'satelite';
    } else {
      this.mapa.removeLayer(this.satelite);
      this.calles.addTo(this.mapa);
      this.vista = 'calles';
    }
  }

  /** Usa el GPS del dispositivo (sirve si el dueño está en el gimnasio). */
  miUbicacion(): void {
    if (!navigator.geolocation) {
      this.aviso = 'Tu navegador no permite obtener la ubicación.';
      return;
    }
    this.buscando = true;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        this.zona.run(() => {
          this.buscando = false;
          const { latitude, longitude } = pos.coords;
          this.mapa?.flyTo([latitude, longitude], 18, { duration: 0.8 });
          this.ponerPin(latitude, longitude, true);
        }),
      () =>
        this.zona.run(() => {
          this.buscando = false;
          this.aviso = 'No diste permiso de ubicación. Busca tu dirección o haz clic en el mapa.';
        }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  centrarEnPin(): void {
    if (this.pin && this.mapa) this.mapa.flyTo(this.pin.getLatLng(), 18, { duration: 0.6 });
  }

  pantallaCompleta(): void {
    this.completa = !this.completa;
    document.body.style.overflow = this.completa ? 'hidden' : '';
    setTimeout(() => this.mapa?.invalidateSize(), 50);
  }

  ngOnDestroy(): void {
    clearTimeout(this.espera);
    this.peticion?.abort();
    this.observador?.disconnect();
    document.body.style.overflow = '';
    this.mapa?.remove();
  }
}
