"""
Pruebas de punta a punta del panel web de Gymred con Selenium.

Correr con el ambiente de desarrollo levantado:
    pytest -v
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from conftest import URL
from paginas import abrir_menu, esperar, iniciar_sesion


def test_login_correcto(navegador):
    """Con un dueño válido entra al panel y ve el resumen de su gimnasio."""
    iniciar_sesion(navegador)
    esperar(navegador).until(EC.url_contains("/dashboard"))
    titulo = esperar(navegador).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "h1.fp-heading")))
    assert "Resumen" in titulo.text


def test_login_incorrecto(navegador):
    """Con un correo que no existe se queda en el login y muestra el error.
    Se usa un correo inexistente para no bloquear cuentas reales por intentos fallidos."""
    iniciar_sesion(navegador, email="no-existe@gymred.test", password="ClaveFalsa123")
    error = esperar(navegador).until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".fp-error")))
    assert "incorrectos" in error.text.lower()
    assert "/login" in navegador.current_url


def test_ruta_protegida(navegador):
    """Sin sesión, una página interna regresa al login."""
    navegador.get(f"{URL}/dashboard")
    esperar(navegador).until(EC.url_contains("/login"))
    assert navegador.find_element(By.ID, "email").is_displayed()


def test_mis_ganancias(navegador):
    """Después de entrar, Mis ganancias muestra la categoría y el tope por visita."""
    iniciar_sesion(navegador)
    esperar(navegador).until(EC.url_contains("/dashboard"))
    abrir_menu(navegador, "Mis ganancias")
    esperar(navegador).until(
        EC.text_to_be_present_in_element((By.CSS_SELECTOR, "h1.fp-heading"), "Mis ganancias")
    )
    # Espera a que terminen de cargar los datos de la API
    esperar(navegador).until(EC.text_to_be_present_in_element((By.TAG_NAME, "main"), "tope"))
    cuerpo = navegador.find_element(By.TAG_NAME, "main").text
    assert "por visita" in cuerpo
    assert "tope" in cuerpo.lower()
