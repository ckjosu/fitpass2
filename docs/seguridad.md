# Seguridad

| Punto | Cómo está |
|---|---|
| Contraseñas | Se guardan con bcrypt, nunca en texto plano |
| Intentos de login | 5 fallidos bloquean la cuenta 15 min; máximo 10 logins por minuto por IP |
| Sesión | Token JWT de 12 h; al cambiar la contraseña se cierran las otras sesiones |
| Permisos | El socio solo ve lo suyo (sale del token); el dueño solo sus gimnasios |
| QR | Código aleatorio que vence en 30 s y se valida en el servidor |
| Recuperar contraseña | Código de 6 dígitos por correo, vence en 15 min |
| HTTPS | En producción se rechaza HTTP y se manda HSTS |
| Logs | No se escriben contraseñas, tokens ni códigos |
| Fotos | Solo JPG, PNG o WebP de máximo 5 MB |
