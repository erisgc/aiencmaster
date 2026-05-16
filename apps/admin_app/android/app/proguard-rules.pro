# Reglas R8/Proguard para release de AIENC Admin.
#
# Flutter ya inyecta sus reglas internas en flutter_proguard_rules.pro
# (clases del engine, embedding, plugins registry). Aquí añadimos lo que
# los plugins terceros usan vía reflection y que el shrinker podría
# eliminar por accidente.

# ── Google Play Core (Flutter referencia estas clases para "deferred
# components" / "split installs" cuando publicas en Play Store). Nosotros
# distribuimos APK directo via GitHub Releases — NUNCA usamos esas
# features, pero las referencias quedan en el código del engine y R8
# falla al no encontrarlas. Las marcamos como "don't warn" para que el
# minify pase. ──
-dontwarn com.google.android.play.core.**
-dontwarn com.google.android.play.core.splitcompat.**
-dontwarn com.google.android.play.core.splitinstall.**
-dontwarn com.google.android.play.core.tasks.**
# Y mantenemos las clases del engine que las referencian (por si Flutter
# las llama vía reflection):
-keep class io.flutter.embedding.android.FlutterPlayStoreSplitApplication { *; }
-keep class io.flutter.embedding.engine.deferredcomponents.** { *; }

# ── Plugins Flutter ──
-keep class io.flutter.embedding.** { *; }
-keep class io.flutter.plugin.** { *; }

# image_picker / file_picker — usan reflection del FileProvider
-keep class androidx.core.content.FileProvider { *; }

# geolocator — registra listeners nativos
-keep class com.baseflow.geolocator.** { *; }

# flutter_secure_storage retira EncryptedSharedPreferences pero por si
# se reactivara, las API de seguridad de Jetpack viven en androidx.security:
-keep class androidx.security.crypto.** { *; }

# dio + cookie_jar usan dart:io HttpClient — sin reglas Java necesarias
# normalmente, pero por si los plugins de OkHttp se cuelan en transitivos:
-dontwarn okhttp3.**
-dontwarn okio.**

# Mantener los modelos serializables de Kotlin para que las anotaciones
# @Serializable no se rompan (por si más adelante adoptamos kotlinx-serialization).
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

# fl_chart usa reflection mínima — incluido en sus reglas internas.

# Stack traces legibles en release: conservamos los nombres de archivo y
# las líneas. Reduce un poco la reducción pero hace que un crash report
# desde un teléfono real sea diagnosticable.
-keepattributes SourceFile, LineNumberTable
-renamesourcefileattribute SourceFile
