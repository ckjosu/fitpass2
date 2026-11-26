"""
Servidor de documentaciÃ³n de Gymred (Flask).

Publica los archivos Markdown de ../docs como pÃ¡ginas web y ademÃ¡s:
  /api            lista las rutas de la API leyendo su contrato OpenAPI en vivo
  /base-de-datos  muestra las tablas leyendo los scripts SQL del repo
  /estado         revisa si la API responde (tambiÃ©n en JSON: /estado.json)

Variables de entorno:
  API_URL     direcciÃ³n de la API (por omisiÃ³n https://gymred-api.onrender.com/api)
  DOCS_DIR    carpeta con los .md     (por omisiÃ³n ../docs)
  SQL_DIR     carpeta con los .sql    (por omisiÃ³n ../docker/prod/mysql)
"""
import json
from html import escape
import os
import re
import time
import urllib.request
from pathlib import Path

import markdown
from flask import Flask, abort, jsonify, render_template
from markupsafe import Markup

BASE = Path(__file__).resolve().parent
DOCS_DIR = Path(os.getenv("DOCS_DIR", BASE.parent / "docs"))
SQL_DIR = Path(os.getenv("SQL_DIR", BASE.parent / "docker" / "prod" / "mysql"))
API_URL = os.getenv("API_URL", "https://gymred-api.onrender.com/api").rstrip("/")

# MenÃº: (ruta, archivo .md, tÃ­tulo). Solo se sirven estos archivos.
PAGINAS = [
    ("", "index", "Inicio"),
    ("modelo-de-negocio", "modelo-de-negocio", "Modelo de negocio"),
    ("arquitectura", "arquitectura", "Arquitectura"),
    ("estructura", "estructura", "Estructura del repo"),
    ("api", None, "API"),
    ("apidocs", None, "Probar la API"),
    ("base-de-datos", "base-de-datos", "Base de datos"),
    ("servidor", "servidor", "Servidor"),
    ("seguridad", "seguridad", "Seguridad"),
    ("pruebas", "pruebas", "Pruebas"),
    ("historias", "historias", "Historias de usuario"),
    ("estado", None, "Estado"),
]
MD_POR_RUTA = {ruta: archivo for ruta, archivo, _ in PAGINAS if archivo}
METODOS = ("get", "post", "put", "patch", "delete")

app = Flask(__name__)


@app.context_processor
def menu():
    return {"menu": [(ruta, titulo) for ruta, _, titulo in PAGINAS]}


def leer_markdown(nombre: str) -> Markup:
    texto = (DOCS_DIR / f"{nombre}.md").read_text(encoding="utf-8")
    # Los bloques ```mermaid se apartan antes de convertir el Markdown y luego se
    # ponen como <pre class="mermaid"> para que el navegador dibuje el diagrama.
    diagramas = []

    def apartar(m):
        diagramas.append(m.group(1))
        return f"\n\nDIAGRAMA{len(diagramas) - 1}\n\n"

    texto = re.sub(r"```mermaid\n(.*?)```", apartar, texto, flags=re.S)
    html = markdown.markdown(texto, extensions=["tables", "fenced_code", "toc"])
    for i, codigo in enumerate(diagramas):
        html = html.replace(f"<p>DIAGRAMA{i}</p>", f'<pre class="mermaid">{escape(codigo, quote=False)}</pre>')
    return Markup(html)


def pedir_json(url: str, segundos: float = 6):
    with urllib.request.urlopen(url, timeout=segundos) as r:
        return json.loads(r.read().decode("utf-8"))


# ---------------------------------------------------------------------------
# PÃ¡ginas
# ---------------------------------------------------------------------------

@app.route("/")
@app.route("/<ruta>")
def pagina(ruta: str = ""):
    if ruta not in MD_POR_RUTA:
        abort(404)
    if ruta == "base-de-datos":
        return render_template("base_datos.html", contenido=leer_markdown("base-de-datos"),
                               tablas=tablas_sql(), activa=ruta)
    return render_template("pagina.html", contenido=leer_markdown(MD_POR_RUTA[ruta]), activa=ruta)


@app.route("/api")
def api():
    """Lee el contrato OpenAPI de la API. Si no responde, usa la copia de docs/openapi.json."""
    fuente = f"{API_URL}/openapi.json"
    try:
        contrato = pedir_json(fuente)
        en_vivo = True
    except Exception:
        contrato = json.loads((DOCS_DIR / "openapi.json").read_text(encoding="utf-8"))
        en_vivo = False

    grupos = {t["name"]: {"descripcion": t.get("description", ""), "rutas": []}
              for t in contrato.get("tags", [])}
    total = 0
    for ruta, metodos in contrato.get("paths", {}).items():
        for metodo, info in metodos.items():
            if metodo not in METODOS:
                continue
            etiqueta = (info.get("tags") or ["otros"])[0]
            grupos.setdefault(etiqueta, {"descripcion": "", "rutas": []})["rutas"].append({
                "metodo": metodo.upper(),
                "ruta": ruta,
                "resumen": info.get("summary", ""),
                "protegida": bool(info.get("security")),
            })
            total += 1
    grupos = {k: v for k, v in grupos.items() if v["rutas"]}
    return render_template("api.html", grupos=grupos, total=total, en_vivo=en_vivo,
                           fuente=fuente, activa="api")


@app.route("/apidocs")
def apidocs():
    """Swagger UI: deja probar cada ruta de la API desde el navegador."""
    return render_template("apidocs.html", api=API_URL, activa="apidocs")


@app.route("/apidocs/openapi.json")
def apidocs_contrato():
    """Contrato de la API con la direccion del servidor puesta, para que
    Swagger mande las peticiones a la API (Render o local) y no a Flask."""
    try:
        contrato = pedir_json(f"{API_URL}/openapi.json")
    except Exception:
        contrato = json.loads((DOCS_DIR / "openapi.json").read_text(encoding="utf-8"))
    raiz = API_URL[: -len("/api")] if API_URL.endswith("/api") else API_URL
    contrato["servers"] = [{"url": raiz, "description": "API de Gymred"}]
    return jsonify(contrato)


def revisar_api():
    inicio = time.perf_counter()
    try:
        planes = pedir_json(f"{API_URL}/movil/planes")
        ms = round((time.perf_counter() - inicio) * 1000)
        return {"api": API_URL, "responde": True, "milisegundos": ms,
                "planes": [p.get("nombre") for p in planes] if isinstance(planes, list) else None}
    except Exception as e:
        return {"api": API_URL, "responde": False, "error": type(e).__name__}


@app.route("/estado")
def estado():
    return render_template("estado.html", estado=revisar_api(), activa="estado")


@app.route("/estado.json")
def estado_json():
    datos = revisar_api()
    return jsonify(datos), (200 if datos["responde"] else 503)


# ---------------------------------------------------------------------------
# Tablas: se leen de los CREATE TABLE de los scripts SQL
# ---------------------------------------------------------------------------

def tablas_sql():
    tablas = {}
    if not SQL_DIR.exists():
        return tablas
    patron = re.compile(r"CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?\s*\((.*?)\)\s*(?:ENGINE|;)", re.S | re.I)
    for archivo in sorted(SQL_DIR.glob("*.sql")):
        texto = archivo.read_text(encoding="utf-8", errors="ignore")
        for nombre, cuerpo in patron.findall(texto):
            columnas = []
            for linea in cuerpo.splitlines():
                linea = linea.strip().rstrip(",")
                m = re.match(r"`?(\w+)`?\s+([A-Za-z]+(?:\([^)]*\))?)", linea)
                if m and m.group(1).upper() not in ("PRIMARY", "KEY", "UNIQUE", "CONSTRAINT", "INDEX", "FOREIGN"):
                    columnas.append({"nombre": m.group(1), "tipo": m.group(2)})
            tablas[nombre] = {"archivo": archivo.name, "columnas": columnas}
    return dict(sorted(tablas.items()))


@app.errorhandler(404)
def no_existe(_):
    return render_template("pagina.html", contenido=Markup("<h1>No existe esa pÃ¡gina</h1>"), activa=None), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_DEBUG") == "1")
