import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import 'entreno/tema_entreno.dart';
import 'registro_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formulario = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _ocultarPassword = true;
  bool _recordar = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _entrar() async {
    FocusScope.of(context).unfocus(); // esconde el teclado
    if (!_formulario.currentState!.validate()) return;
    // Si sale bien, main.dart cambia solo a la pantalla de inicio.
    await context.read<AuthProvider>().login(_email.text, _password.text);
  }

  void _proximamente(String que) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$que estará disponible pronto.')),
    );
  }

  OutlineInputBorder _borde([Color color = Colors.transparent]) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: color, width: 1.5),
    );
  }

  InputDecoration _decoracion({
    required String label,
    required String hint,
    required IconData icono,
    Widget? sufijo,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: const TextStyle(color: TemaEntreno.textoSuave),
      hintStyle: const TextStyle(color: TemaEntreno.textoSuave),
      floatingLabelStyle: const TextStyle(color: TemaEntreno.naranja),
      prefixIcon: Icon(icono, color: TemaEntreno.textoSuave),
      suffixIcon: sufijo,
      filled: true,
      fillColor: TemaEntreno.tarjeta,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: _borde(),
      enabledBorder: _borde(TemaEntreno.tarjetaClara),
      focusedBorder: _borde(TemaEntreno.naranja),
      errorBorder: _borde(AppColors.rojo),
      focusedErrorBorder: _borde(AppColors.rojo),
      errorStyle: const TextStyle(color: AppColors.rojo),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    

    return Scaffold(
      backgroundColor: TemaEntreno.fondo,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formulario,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo
                  Center(
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: TemaEntreno.tarjeta,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: const Icon(
                        Icons.fitness_center,
                        color: TemaEntreno.naranja,
                        size: 32,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Center(
                    child: Text.rich(
                      TextSpan(
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.5,
                        ),
                        children: [
                          TextSpan(
                            text: 'GYM',
                            style: TextStyle(color: TemaEntreno.texto),
                          ),
                          TextSpan(
                            text: 'RED',
                            style: TextStyle(color: TemaEntreno.naranja),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Encabezado
                  const Text(
                    'Bienvenido de nuevo',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: TemaEntreno.texto,
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Ingresa tus credenciales para acceder a tus gimnasios y pase activo',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: TemaEntreno.textoSuave),
                  ),
                  const SizedBox(height: 28),

                  // Correo (la API valida correo)
                  TextFormField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    textInputAction: TextInputAction.next,
                    style: const TextStyle(color: TemaEntreno.texto),
                    decoration: _decoracion(
                      label: 'Correo electrónico',
                      hint: 'ejemplo@correo.com',
                      icono: Icons.alternate_email,
                    ),
                    validator: (valor) {
                      final texto = valor?.trim() ?? '';
                      if (texto.isEmpty) return 'Escribe tu correo';
                      if (!texto.contains('@') || !texto.contains('.')) {
                        return 'Escribe un correo válido';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Contraseña
                  TextFormField(
                    controller: _password,
                    obscureText: _ocultarPassword,
                    textInputAction: TextInputAction.done,
                    style: const TextStyle(color: TemaEntreno.texto),
                    onFieldSubmitted: (_) => auth.cargando ? null : _entrar(),
                    decoration: _decoracion(
                      label: 'Contraseña',
                      hint: '••••••••••••',
                      icono: Icons.lock_outline,
                      sufijo: IconButton(
                        icon: Icon(
                          _ocultarPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          color: TemaEntreno.textoSuave,
                        ),
                        onPressed: () =>
                            setState(() => _ocultarPassword = !_ocultarPassword),
                      ),
                    ),
                    validator: (valor) => (valor == null || valor.length < 6)
                        ? 'La contraseña debe tener al menos 6 caracteres'
                        : null,
                  ),
                  const SizedBox(height: 8),

                  // Recordar sesión y recuperación
                  Row(
                    children: [
                      Checkbox(
                        value: _recordar,
                        activeColor: TemaEntreno.naranja,
                        onChanged: (v) => setState(() => _recordar = v ?? false),
                      ),
                      const Text(
                        'Recordar sesión',
                        style: TextStyle(color: TemaEntreno.textoSuave, fontSize: 13),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () => _proximamente('La recuperación de contraseña'),
                        child: const Text(
                          '¿Olvidaste tu contraseña?',
                          style: TextStyle(color: TemaEntreno.naranja, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Mensaje de error de la API
                  if (auth.error != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0x1FDC2626),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        auth.error!,
                        style: const TextStyle(color: AppColors.rojo),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Botón principal
                  SizedBox(
                    height: 54,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: TemaEntreno.naranja,
                        disabledBackgroundColor: TemaEntreno.tarjetaClara,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: auth.cargando ? null : _entrar,
                      child: auth.cargando
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Iniciar Sesión',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                SizedBox(width: 6),
                                Icon(Icons.bolt, size: 20),
                              ],
                            ),
                    ),
                  ),
                  if (auth.cargando) ...[
                    const SizedBox(height: 12),
                    const Text(
                      'Conectando con el servidor… la primera vez puede tardar hasta un minuto.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: TemaEntreno.textoSuave, fontSize: 12),
                    ),
                  ],

                  // Separador
                  const SizedBox(height: 24),
                  const Row(
                    children: [
                      Expanded(child: Divider(color: TemaEntreno.tarjetaClara)),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'O CONTINÚA CON',
                          style: TextStyle(
                            color: TemaEntreno.textoSuave,
                            fontSize: 11,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      Expanded(child: Divider(color: TemaEntreno.tarjetaClara)),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Google y Apple (pendientes de configurar en el backend)
                  Row(
                    children: [
                      Expanded(
                        child: _BotonSocial(
                          texto: 'Google',
                          icono: Icons.g_mobiledata,
                          onPressed: () => _proximamente('El inicio con Google'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _BotonSocial(
                          texto: 'Apple',
                          icono: Icons.phone_iphone,
                          onPressed: () => _proximamente('El inicio con Apple'),
                        ),
                      ),
                    ],
                  ),

                  // Enlace para crear cuenta
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        '¿No tienes cuenta?',
                        style: TextStyle(color: TemaEntreno.textoSuave),
                      ),
                      TextButton(
                        onPressed: auth.cargando
                            ? null
                            : () {
                                context.read<AuthProvider>().limpiarError();
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => const RegistroScreen()),
                                );
                              },
                        child: const Text(
                          'Regístrate aquí',
                          style: TextStyle(
                            color: TemaEntreno.naranja,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BotonSocial extends StatelessWidget {
  final String texto;
  final IconData icono;
  final VoidCallback onPressed;
  const _BotonSocial({
    required this.texto,
    required this.icono,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: TemaEntreno.texto,
        side: const BorderSide(color: TemaEntreno.tarjetaClara),
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      icon: Icon(icono, size: 20),
      label: Text(texto),
    );
  }
}