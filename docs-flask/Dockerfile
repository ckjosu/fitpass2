FROM python:3.12-slim
WORKDIR /app
COPY docs-flask/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY docs-flask/ /app/docs-flask/
COPY docs/ /app/docs/
COPY docker/prod/mysql/ /app/docker/prod/mysql/
WORKDIR /app/docs-flask
ENV PORT=5000
EXPOSE 5000
CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${PORT} -w 2 app:app"]
