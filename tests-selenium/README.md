# Pruebas con Selenium

Pruebas automáticas del panel web: login correcto, login incorrecto, ruta protegida y
la pantalla Mis ganancias.

```bash
cd tests-selenium
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest -v                 # sin ventana
HEADLESS=0 pytest -v      # viendo el navegador
```

Necesita el ambiente de desarrollo levantado (`docker compose -f docker-compose.dev.yml up -d`)
y Google Chrome instalado. Selenium descarga solo el chromedriver que corresponde.
No se corren contra producción.
