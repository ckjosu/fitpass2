import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy,
  Output, SimpleChanges, ViewChild, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

export interface Punto {
  latitud: number;
  longitud: number;
}

/** Centro por omisión: Calkiní, Campeche (mercado inicial de Gymred). */
const CENTRO_INICIAL: L.LatLngExpression = [20.3713, -90.0517];

/**
 * Mapa para fijar la ubicación exacta del gimnasio.
 * Usa Leaflet con mapas de OpenStreetMap: es gratis y no pide clave.
 *
 * El dueño puede:
 *  - hacer clic en el mapa para poner el punto,
 *  - arrastrar el pin para afinarlo,
 *  - buscar su dirección,
 *  - o usar la ubicación de su dispositivo si está en el gimnasio.
 */
@Component({
  selector: 'fp-map-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-picker.component.html',
  styleUrl: './map-picker.component.scss',
})
export class MapPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() latitud: number | null = null;
  @Input() longitud: number | null = null;
  /** Texto con la dirección capturada, para el botón "Buscar mi dirección". */
  @Input() direccion = '';
  @Output() cambio = new EventEmitter<Punto>();

  @ViewChild('mapa', { static: true }) contenedor!: ElementRef<HTMLDivElement>;

  private zona = inject(NgZone);
  private mapa?: L.Map;
  private pin?: L.Marker;

  buscando = false;
  aviso = '';

  // Pin propio con los colores del panel (evita los íconos por defecto de
  // Leaflet, que no cargan bien cuando Angular empaqueta el proyecto).
  private icono = L.divIcon({
    className: 'fp-pin',
    html: '<span class="fp-pin-cuerpo"></span><span class="fp-pin-sombra"></span>',
    iconSize: [30, 42],
    iconAnchor: [15, 40],
  });

  ngAfterViewInit(): void {
    // Leaflet escucha muchos eventos del mouse; fuera de la zona de Angular
    // no dispara detección de cambios en cada movimiento.
    this.zona.runOutsideAngular(() => {
      const tienePunto = this.latitud !== null && this.longitud !== null;
      this.mapa = L.map(this.contenedor.nativeElement, {
        center: tienePunto ? [this.latitud!, this.longitud!] : CENTRO_INICIAL,
        zoom: tienePunto ? 17 : 14,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; colaboradores de OpenStreetMap',
      }).addTo(this.mapa);

      if (tienePunto) this.ponerPin(this.latitud!, this.longitud!, false);

      this.mapa.on('click', (e: L.LeafletMouseEvent) => this.ponerPin(e.latlng.lat, e.latlng.lng, true));

      // El mapa vive dentro de una tarjeta; si se pinta antes de que la
      // tarjeta tenga su tamaño final, se ven cuadros grises.
      setTimeout(() => this.mapa?.invalidateSize(), 150);
    });
  }

  ngOnChanges(c: SimpleChanges): void {
    // Cuando cambias de gimnasio en el selector, el mapa se mueve al nuevo.
    if ((c['latitud'] || c['longitud']) && this.mapa) {
      if (this.latitud !== null && this.longitud !== null) {
        this.ponerPin(this.latitud, this.longitud, false);
        this.mapa.setView([this.latitud, this.longitud], 17);
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
      this.pin = L.marker([lat, lng], { icon: this.icono, draggable: true }).addTo(this.mapa);
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

  /** Busca la dirección capturada en OpenStreetMap (Nominatim). */
  async buscarDireccion(): Promise<void> {
    const texto = this.direccion.trim();
    if (!texto || this.buscando) return;
    this.buscando = true;
    this.aviso = '';
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=mx&q=' +
        encodeURIComponent(texto);
      const r = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      const datos: { lat: string; lon: string }[] = await r.json();
      if (!datos.length) {
        this.aviso = 'No encontramos esa dirección. Mueve el mapa y haz clic en tu entrada.';
        return;
      }
      const lat = Number(datos[0].lat);
      const lng = Number(datos[0].lon);
      this.mapa?.setView([lat, lng], 17);
      this.ponerPin(lat, lng, true);
      this.aviso = 'Revisa que el pin quede justo en tu entrada; puedes arrastrarlo.';
    } catch {
      this.aviso = 'No se pudo buscar la dirección. Haz clic en el mapa para poner el punto.';
    } finally {
      this.buscando = false;
    }
  }

  /** Usa el GPS del dispositivo (sirve si el dueño está en el gimnasio). */
  usarMiUbicacion(): void {
    if (!navigator.geolocation) {
      this.aviso = 'Tu navegador no permite obtener la ubicación.';
      return;
    }
    this.buscando = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.buscando = false;
        const { latitude, longitude } = pos.coords;
        this.mapa?.setView([latitude, longitude], 18);
        this.ponerPin(latitude, longitude, true);
      },
      () => {
        this.zona.run(() => {
          this.buscando = false;
          this.aviso = 'No diste permiso de ubicación. Puedes hacer clic en el mapa.';
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }
}
