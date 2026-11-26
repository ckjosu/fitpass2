"""Acciones que se repiten en varias pruebas (patrón Page Object, versión sencilla)."""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from conftest import EMAIL, PASSWORD, URL

ESPERA = 15  # segundos


def esperar(driver):
    return WebDriverWait(driver, ESPERA)


def iniciar_sesion(driver, email=EMAIL, password=PASSWORD):
    driver.get(f"{URL}/login")
    esperar(driver).until(EC.visibility_of_element_located((By.ID, "email"))).send_keys(email)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()


def abrir_menu(driver, texto):
    """Da clic en una opción del menú lateral por su texto."""
    enlace = esperar(driver).until(
        EC.element_to_be_clickable((By.XPATH, f"//aside//a[contains(normalize-space(.), '{texto}')]"))
    )
    enlace.click()
