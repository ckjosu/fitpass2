# Documentación de Gymred (Flask)

Servidor web que publica la carpeta `docs/` del repositorio.

```bash
cd docs-flask
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py            # http://localhost:5000
```

Con Docker, desde la raíz del repo: `docker compose -f docker-compose.dev.yml up -d docs`.

Para que lea la API local en lugar de la de Render: `API_URL=http://localhost:8000/api python app.py`.
