import { Injectable } from '@angular/core';

const LLAVE_TEMA = 'gymred_tema';
const LLAVE_ACENTO = 'gymred_acento';

/**
 * Pone el tema y el color de acento en el <html>. El CSS de styles.scss
 * reacciona a los atributos data-tema y data-acento.
 * Se guarda en localStorage para que al recargar no parpadee antes de que
 * llegue la configuracion del servidor.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  aplicar(tema: string | null, acento: string | null): void {
    const raiz = document.documentElement;

    if (tema) {
      raiz.setAttribute('data-tema', tema);
      localStorage.setItem(LLAVE_TEMA, tema);
    }
    if (acento) {
      raiz.setAttribute('data-acento', acento);
      localStorage.setItem(LLAVE_ACENTO, acento);
    }
  }

  /** Se llama al arrancar la app, antes de pedir nada al servidor. */
  restaurar(): void {
    this.aplicar(
      localStorage.getItem(LLAVE_TEMA) || 'claro',
      localStorage.getItem(LLAVE_ACENTO) || 'naranja',
    );
  }

  limpiar(): void {
    localStorage.removeItem(LLAVE_TEMA);
    localStorage.removeItem(LLAVE_ACENTO);
    document.documentElement.setAttribute('data-tema', 'claro');
    document.documentElement.setAttribute('data-acento', 'naranja');
  }
}
