import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'gem_palette.dart';

/// Tema base de la app — dark-only intencionalmente porque toda la marca
/// AIENC funciona sobre fondos oscuros con acentos de gemas.
class AppTheme {
  AppTheme._();

  static ThemeData build() {
    final base = ThemeData(brightness: Brightness.dark);

    final colorScheme = const ColorScheme.dark(
      primary: GemPalette.sapphire,
      onPrimary: Colors.white,
      secondary: GemPalette.emerald,
      onSecondary: Colors.white,
      tertiary: GemPalette.topaz,
      onTertiary: Colors.black,
      surface: GemPalette.surface,
      onSurface: GemPalette.textPrimary,
      error: GemPalette.danger,
      onError: Colors.white,
    );

    return base.copyWith(
      colorScheme: colorScheme,
      scaffoldBackgroundColor: GemPalette.background,
      canvasColor: GemPalette.background,
      cardColor: GemPalette.surface,
      dividerColor: GemPalette.borderSoft,
      splashFactory: InkRipple.splashFactory,
      visualDensity: VisualDensity.adaptivePlatformDensity,
      textTheme: _buildTextTheme(base.textTheme),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
        ),
        titleTextStyle: TextStyle(
          color: GemPalette.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.2,
        ),
        iconTheme: IconThemeData(color: GemPalette.textPrimary),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: GemPalette.surface,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        labelStyle: const TextStyle(
          color: GemPalette.textMuted,
          fontWeight: FontWeight.w600,
        ),
        hintStyle: const TextStyle(color: GemPalette.textMuted),
        floatingLabelStyle:
            const TextStyle(color: GemPalette.sapphire, fontWeight: FontWeight.w700),
        border: _outline(GemPalette.borderSoft),
        enabledBorder: _outline(GemPalette.borderSoft),
        focusedBorder: _outline(GemPalette.sapphire, width: 2),
        errorBorder: _outline(GemPalette.danger),
        focusedErrorBorder: _outline(GemPalette.danger, width: 2),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: GemPalette.sapphire,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 48),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle:
              const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: GemPalette.textPrimary,
          side: const BorderSide(color: GemPalette.borderSoft),
          minimumSize: const Size(0, 48),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle:
              const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: GemPalette.emerald,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: GemPalette.surfaceElevated,
        contentTextStyle: const TextStyle(color: GemPalette.textPrimary),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      cardTheme: const CardThemeData(
        color: GemPalette.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: GemPalette.surfaceElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  static OutlineInputBorder _outline(Color color, {double width = 1}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: color, width: width),
    );
  }

  static TextTheme _buildTextTheme(TextTheme base) {
    return base.apply(
      bodyColor: GemPalette.textPrimary,
      displayColor: GemPalette.textPrimary,
    ).copyWith(
      displayLarge: const TextStyle(
        fontSize: 38,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.8,
        height: 1.02,
      ),
      headlineMedium: const TextStyle(
        fontSize: 27,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.4,
      ),
      headlineSmall: const TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
      ),
      titleLarge: const TextStyle(
        fontSize: 19,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
      ),
      titleMedium: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
      ),
      bodyMedium: const TextStyle(fontSize: 14, height: 1.45),
      bodySmall: TextStyle(
        fontSize: 12.5,
        color: GemPalette.textMuted,
        height: 1.4,
      ),
      labelMedium: const TextStyle(
        fontSize: 12.5,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
      ),
    );
  }
}
