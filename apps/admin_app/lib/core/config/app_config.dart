/// Configuración inyectada en tiempo de compilación con --dart-define.
///
///   flutter build apk --dart-define=AIENC_API_BASE_URL=https://api.aienc.co
///                     --dart-define=AIENC_MOBILE_ORIGIN=aiencadmin://app
class AppConfig {
  AppConfig._();

  /// URL base del backend NestJS.
  /// En dev (sin --dart-define) cae a localhost:3001 que es el default del API.
  static const String apiBaseUrl = String.fromEnvironment(
    'AIENC_API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3001',
  );

  /// Valor que enviamos como header `Origin` en las requests. El backend lo
  /// valida con `AdminOriginGuard` contra la lista WEB_ORIGIN +
  /// MOBILE_APP_ORIGIN. Debe coincidir exactamente con MOBILE_APP_ORIGIN del
  /// servidor.
  static const String mobileOrigin = String.fromEnvironment(
    'AIENC_MOBILE_ORIGIN',
    defaultValue: 'aiencadmin://app',
  );

  /// Identificador local que enviamos como user-agent visible para que el
  /// backend pueda diferenciar la app vs un navegador.
  static const String userAgentTag = 'AIENCAdmin/0.1 (Android; Flutter)';
}
