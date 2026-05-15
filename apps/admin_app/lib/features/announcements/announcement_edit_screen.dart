import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/models/domain.dart';
import '../../core/state/locator.dart';
import '../../core/theme/gem_palette.dart';
import '../../core/widgets/gem_widgets.dart';

/// Editor de anuncios. Sirve para crear o editar:
///   - Si `existing` es null: crea (modo nuevo).
///   - Si `existing` viene cargado: edita.
/// Si `churchId` es null el anuncio es **global** (sólo lo crea ROOT con
/// MANAGE_GLOBAL_ANNOUNCEMENTS). Si trae churchId, es de iglesia (requiere
/// MANAGE_CHURCH_ANNOUNCEMENTS sobre esa iglesia).
class AnnouncementEditScreen extends StatefulWidget {
  final String? churchId; // null = global
  final Announcement? existing;
  const AnnouncementEditScreen({
    super.key,
    required this.churchId,
    required this.existing,
  });

  @override
  State<AnnouncementEditScreen> createState() => _AnnouncementEditScreenState();
}

class _AnnouncementEditScreenState extends State<AnnouncementEditScreen> {
  late final TextEditingController _title;
  late final TextEditingController _description;
  late final TextEditingController _author;

  bool _saving = false;
  String? _error;

  bool get _isEditing => widget.existing != null;
  bool get _isGlobal => widget.churchId == null;

  @override
  void initState() {
    super.initState();
    final ex = widget.existing;
    _title = TextEditingController(text: ex?.title ?? '');
    _description = TextEditingController(text: ex?.description ?? '');
    _author = TextEditingController(text: ex?.author ?? '');
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _author.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving) return;
    final title = _title.text.trim();
    final desc = _description.text.trim();
    final author = _author.text.trim();
    if (title.isEmpty || desc.isEmpty || author.isEmpty) {
      setState(() => _error = 'Título, descripción y autor son obligatorios.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      if (_isEditing) {
        if (_isGlobal) {
          await Locator.announcements.updateGlobal(
            widget.existing!.id,
            title: title,
            description: desc,
            author: author,
          );
        } else {
          await Locator.announcements.updateForChurch(
            churchId: widget.churchId!,
            id: widget.existing!.id,
            title: title,
            description: desc,
            author: author,
          );
        }
      } else {
        if (_isGlobal) {
          await Locator.announcements.createGlobal(
            title: title,
            description: desc,
            author: author,
          );
        } else {
          await Locator.announcements.createForChurch(
            churchId: widget.churchId!,
            title: title,
            description: desc,
            author: author,
          );
        }
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEditing
            ? 'Anuncio actualizado.'
            : 'Anuncio publicado.')),
      );
      context.pop(true);
    } catch (e) {
      setState(() => _error = userMessageFor(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = _isEditing
        ? 'Editar anuncio'
        : _isGlobal
            ? 'Nuevo anuncio global'
            : 'Nuevo anuncio de iglesia';
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: GemCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_isGlobal)
                  const Text(
                    'Este anuncio se publicará a todos los usuarios del '
                    'sitio público.',
                    style:
                        TextStyle(color: GemPalette.textMuted, height: 1.45),
                  )
                else
                  const Text(
                    'Este anuncio se publicará en la página pública de la '
                    'iglesia activa.',
                    style:
                        TextStyle(color: GemPalette.textMuted, height: 1.45),
                  ),
                const SizedBox(height: 14),
                TextField(
                  controller: _title,
                  maxLength: 180,
                  decoration: const InputDecoration(labelText: 'Título'),
                ),
                TextField(
                  controller: _author,
                  maxLength: 100,
                  decoration: const InputDecoration(
                    labelText: 'Autor (pastor / equipo)',
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _description,
                  maxLength: 4000,
                  maxLines: 6,
                  decoration:
                      const InputDecoration(labelText: 'Descripción'),
                ),
                if (!_isEditing) ...[
                  const SizedBox(height: 8),
                  const Text(
                    'Para adjuntar imágenes o PDFs, edita este anuncio '
                    'desde el panel web una vez creado.',
                    style:
                        TextStyle(color: GemPalette.textMuted, fontSize: 12),
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  GemErrorBanner(message: _error!),
                ],
                const SizedBox(height: 16),
                GemPrimaryButton(
                  label: _isEditing ? 'Guardar cambios' : 'Publicar anuncio',
                  loading: _saving,
                  onPressed: _save,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
