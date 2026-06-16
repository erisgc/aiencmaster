import 'package:flutter/material.dart';

/// Paleta de gemas usada en todo el panel AIENC (web + app).
///
/// Mantén estos colores sincronizados con
/// `apps/web/app/globals.css` para que la web y la app se sientan
/// como un mismo producto.
class GemPalette {
  GemPalette._();

  static const Color sapphire = Color(0xFF0F4C81);
  static const Color emerald = Color(0xFF0F7B6C);
  static const Color topaz = Color(0xFFD4A437);
  // Sincronizados con globals.css (--gem-amethyst / --gem-ruby, light) para
  // que la app y la web se vean como el mismo producto.
  static const Color amethyst = Color(0xFF7B3F99);
  static const Color ruby = Color(0xFFB0274D);

  // Tonos suaves para fondos / chips (weak variants).
  static const Color sapphireWeak = Color(0x290F4C81); // 16% alpha
  static const Color emeraldWeak = Color(0x290F7B6C);
  static const Color topazWeak = Color(0x29D4A437);
  static const Color amethystWeak = Color(0x297B3F99);
  static const Color rubyWeak = Color(0x29B0274D);

  // Surface / background neutros (dark mode primero).
  static const Color background = Color(0xFF0B1220);
  static const Color surface = Color(0xFF111B2E);
  static const Color surfaceElevated = Color(0xFF18253D);
  static const Color borderSoft = Color(0x33FFFFFF); // rgba(255,255,255,0.2)
  static const Color chip = Color(0x14FFFFFF);

  static const Color textPrimary = Color(0xFFEFF4FB);
  static const Color textMuted = Color(0xFFB7C2D0);
  static const Color danger = Color(0xFFE05656);

  /// Gradiente principal usado en botones primarios y headers.
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [sapphire, emerald, topaz],
    stops: [0.0, 0.55, 1.0],
  );

  static const LinearGradient sapphireEmeraldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [sapphire, emerald],
  );

  static const LinearGradient surfaceGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF13203A), Color(0xFF0E1729)],
  );
}
