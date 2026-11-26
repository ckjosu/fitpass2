"""
Configuración de las pruebas con Selenium.

Variables de entorno (todas opcionales):
  GYMRED_URL       panel a probar          (por omisión http://localhost:4200)
  GYMRED_EMAIL     dueño de prueba          (por omisión ricardo@ironhouse.mx, del seed de desarrollo)
  GYMRED_PASSWORD  su contraseña            (por omisión Gymred123)
  HEADLESS         0 para ver el navegador  (por omisión 1)
  CHROME_BIN       ruta de Chrome si no es la normal
  CHROMEDRIVER     ruta de chromedriver; si no se pone, Selenium lo descarga solo
"""
import os

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service

URL = os.getenv("GYMRED_URL", "http://localhost:4200").rstrip("/")
EMAIL = os.getenv("GYMRED_EMAIL", "ricardo@ironhouse.mx")
PASSWORD = os.getenv("GYMRED_PASSWORD", "Gymred123")


@pytest.fixture
def navegador():
    opciones = webdriver.ChromeOptions()
    if os.getenv("HEADLESS", "1") != "0":
        opciones.add_argument("--headless=new")
    opciones.add_argument("--window-size=1366,900")
    opciones.add_argument("--no-sandbox")
    opciones.add_argument("--disable-dev-shm-usage")
    if os.getenv("CHROME_BIN"):
        opciones.binary_location = os.getenv("CHROME_BIN")
    servicio = Service(os.getenv("CHROMEDRIVER")) if os.getenv("CHROMEDRIVER") else None
    driver = webdriver.Chrome(options=opciones, service=servicio)
    yield driver
    driver.quit()
