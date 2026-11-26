# Pruebas

Las pruebas automáticas están en `tests-selenium/`. Usan **Selenium** para abrir el panel
en Chrome y hacer lo mismo que haría un dueño, y **pytest** para correrlas.

| Prueba | Qué revisa |
|---|---|
| `test_login_correcto` | Con datos válidos entra al panel y llega al inicio |
| `test_login_incorrecto` | Con un correo que no existe muestra el mensaje de error |
| `test_ruta_protegida` | Sin sesión, una página interna regresa al login |
| `test_mis_ganancias` | Después de entrar, abre Mis ganancias y muestra la categoría y el tope |

## Cómo correrlas

Con el ambiente de desarrollo levantado (`docker compose -f docker-compose.dev.yml up -d`):

```bash
cd tests-selenium
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest -v
```

Para ver el navegador mientras corre: `HEADLESS=0 pytest -v`.
Se corren contra el ambiente local, no contra producción.
