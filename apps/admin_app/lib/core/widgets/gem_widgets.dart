import 'package:flutter/material.dart';

import '../theme/gem_palette.dart';

/// Tarjeta con borde gradient + fondo surface. Equivale al `.formCard` /
/// `.listCard` de la web.
class GemCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool gradientBorder;
  final VoidCallback? onTap;
  final Gradient? borderGradient;

  const GemCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.gradientBorder = true,
    this.onTap,
    this.borderGradient,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      decoration: BoxDecoration(
        gradient: GemPalette.surfaceGradient,
        borderRadius: BorderRadius.circular(22),
        border: gradientBorder
            ? null
            : Border.all(color: GemPalette.borderSoft, width: 1),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      padding: padding,
      child: child,
    );

    if (!gradientBorder) {
      return _wrapTap(card);
    }

    final stroke = ShaderMask(
      shaderCallback: (rect) =>
          (borderGradient ?? GemPalette.primaryGradient).createShader(rect),
      blendMode: BlendMode.srcIn,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          border: Border.all(width: 1, color: Colors.white.withValues(alpha: 0.6)),
        ),
      ),
    );

    return _wrapTap(
      Stack(
        children: [
          card,
          Positioned.fill(child: IgnorePointer(child: stroke)),
        ],
      ),
    );
  }

  Widget _wrapTap(Widget child) {
    if (onTap == null) return child;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: child,
      ),
    );
  }
}

/// Botón principal con gradient gemas.
class GemPrimaryButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool loading;

  const GemPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;
    return Opacity(
      opacity: disabled ? 0.6 : 1,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          decoration: BoxDecoration(
            gradient: GemPalette.primaryGradient,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: GemPalette.sapphire.withValues(alpha: 0.35),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: disabled ? null : onPressed,
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (loading)
                    const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.4,
                        valueColor: AlwaysStoppedAnimation(Colors.white),
                      ),
                    )
                  else if (icon != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Icon(icon, color: Colors.white, size: 18),
                    ),
                  if (!loading)
                    Text(
                      label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        letterSpacing: 0.2,
                      ),
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

/// Chip / badge para estados (status REQUEST, role ROOT, etc.).
class GemBadge extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;

  const GemBadge({
    super.key,
    required this.label,
    required this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: color.withValues(alpha: 0.35), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 11.5,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}

/// KPI grande para el dashboard.
class KpiTile extends StatelessWidget {
  final String label;
  final String value;
  final String? subtitle;
  final Gradient borderGradient;
  final IconData? icon;

  const KpiTile({
    super.key,
    required this.label,
    required this.value,
    required this.borderGradient,
    this.subtitle,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return GemCard(
      borderGradient: borderGradient,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    color: GemPalette.textMuted,
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                    letterSpacing: 0.7,
                  ),
                ),
              ),
              if (icon != null) Icon(icon, color: GemPalette.textMuted, size: 16),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.4,
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: Theme.of(context).textTheme.bodySmall),
          ],
        ],
      ),
    );
  }
}

/// Banner inline para errores no fatales (ej. fallo de un fetch).
class GemErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback? onDismiss;

  const GemErrorBanner({super.key, required this.message, this.onDismiss});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
      decoration: BoxDecoration(
        color: GemPalette.danger.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: GemPalette.danger.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: GemPalette.danger, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: GemPalette.danger,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
          if (onDismiss != null)
            IconButton(
              icon: const Icon(Icons.close, size: 18, color: GemPalette.danger),
              onPressed: onDismiss,
              splashRadius: 18,
            ),
        ],
      ),
    );
  }
}

/// "Pill" pequeña para opciones tipo toggle (template Pastor/Tesorero...).
class GemPill extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const GemPill({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(100),
      child: InkWell(
        borderRadius: BorderRadius.circular(100),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(100),
            gradient: selected ? GemPalette.sapphireEmeraldGradient : null,
            color: selected ? null : GemPalette.chip,
            border: Border.all(
              color: selected
                  ? Colors.transparent
                  : GemPalette.borderSoft.withValues(alpha: 0.6),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : GemPalette.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 12.5,
              letterSpacing: 0.2,
            ),
          ),
        ),
      ),
    );
  }
}
