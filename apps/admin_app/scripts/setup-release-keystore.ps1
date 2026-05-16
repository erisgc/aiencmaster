# Genera el keystore release para firmar el APK de AIENC Admin.
#
# Es interactivo: pregunta contraseñas y datos del certificado, y al
# terminar deja dos archivos LOCALES (nunca commiteados al repo):
#
#   apps/admin_app/android/aienc-admin-release.jks  ← keystore en sí
#   apps/admin_app/android/key.properties           ← configuración para Gradle
#
# Pierde el keystore = pierdes la capacidad de publicar updates de la app
# que reemplacen a la versión instalada. Guárdalo (cifrado) en al menos
# dos lugares: tu disco principal + un manager de secretos (1Password,
# Bitwarden, etc.). Si lo subes a la nube, cífralo antes con `age`,
# `openssl enc`, o un zip con contraseña.
#
# Uso (desde la raíz del repo o cualquier subdirectorio):
#
#   pwsh apps/admin_app/scripts/setup-release-keystore.ps1
#
# Si ya existe un keystore en la ruta target, el script aborta sin tocarlo.

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

function Resolve-Keytool {
  # Probamos varias ubicaciones comunes en Windows / WSL / Linux.
  $candidates = @(
    'keytool',
    'C:\Program Files\Java\jdk-21\bin\keytool.exe',
    'C:\Program Files\Java\jdk-17\bin\keytool.exe',
    'C:\Program Files\Eclipse Adoptium\jdk-21.0.4.7-hotspot\bin\keytool.exe',
    'C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot\bin\keytool.exe'
  )
  foreach ($c in $candidates) {
    try {
      $null = & $c -help 2>&1 | Select-Object -First 1
      if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) { return $c }
    } catch { }
  }
  throw "No se encontró 'keytool'. Instala un JDK 17 o superior y vuelve a intentar."
}

$keytool = Resolve-Keytool
Write-Host "→ keytool detectado: $keytool" -ForegroundColor DarkGray

# Resolvemos rutas relativas a la ubicación del script.
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$androidDir = Resolve-Path (Join-Path $scriptDir '..\android')
$keystorePath = Join-Path $androidDir 'aienc-admin-release.jks'
$propsPath = Join-Path $androidDir 'key.properties'

if (Test-Path $keystorePath) {
  throw "Ya existe un keystore en $keystorePath. Si quieres regenerarlo, " +
        "muévelo a un backup primero. NO lo sobreescribas si ya publicaste " +
        "una versión con él."
}

Write-Host ""
Write-Host "Vamos a generar el keystore de AIENC Admin." -ForegroundColor Cyan
Write-Host "Pierde estas contraseñas = pierdes la capacidad de actualizar la app." -ForegroundColor Yellow
Write-Host ""

# Pedimos contraseñas con confirmación.
function Read-PasswordWithConfirm([string]$prompt) {
  while ($true) {
    $a = Read-Host -Prompt $prompt -AsSecureString
    $b = Read-Host -Prompt "  Confirmar $prompt" -AsSecureString
    $aPlain = [System.Net.NetworkCredential]::new('', $a).Password
    $bPlain = [System.Net.NetworkCredential]::new('', $b).Password
    if ($aPlain.Length -lt 8) {
      Write-Host "  ⚠ Mínimo 8 caracteres. Reintenta." -ForegroundColor Yellow
      continue
    }
    if ($aPlain -ne $bPlain) {
      Write-Host "  ⚠ Las contraseñas no coinciden. Reintenta." -ForegroundColor Yellow
      continue
    }
    return $aPlain
  }
}

$storePass = Read-PasswordWithConfirm 'Contraseña del keystore'
$keyPass = Read-PasswordWithConfirm 'Contraseña de la key (puede ser la misma)'

Write-Host ""
Write-Host "Datos del certificado (estos quedan visibles en cada APK firmado)." -ForegroundColor Cyan
$cnDefault = 'AIENC Admin'
$cn = Read-Host "  Nombre común (CN) [$cnDefault]"
if ([string]::IsNullOrWhiteSpace($cn)) { $cn = $cnDefault }
$orgDefault = 'Asociacion de Iglesias Evangelicas del Norte de Colombia'
$org = Read-Host "  Organización (O) [$orgDefault]"
if ([string]::IsNullOrWhiteSpace($org)) { $org = $orgDefault }
$ouDefault = 'Tecnologia'
$ou = Read-Host "  Unidad organizacional (OU) [$ouDefault]"
if ([string]::IsNullOrWhiteSpace($ou)) { $ou = $ouDefault }
$cityDefault = 'Barranquilla'
$city = Read-Host "  Ciudad (L) [$cityDefault]"
if ([string]::IsNullOrWhiteSpace($city)) { $city = $cityDefault }
$stateDefault = 'Atlantico'
$state = Read-Host "  Departamento (ST) [$stateDefault]"
if ([string]::IsNullOrWhiteSpace($state)) { $state = $stateDefault }
$countryDefault = 'CO'
$country = Read-Host "  País (C, 2 letras) [$countryDefault]"
if ([string]::IsNullOrWhiteSpace($country)) { $country = $countryDefault }

$dname = "CN=$cn, OU=$ou, O=$org, L=$city, ST=$state, C=$country"
$alias = 'aienc-admin'

Write-Host ""
Write-Host "Generando keystore (válido por 27 años)..." -ForegroundColor DarkGray

& $keytool -genkeypair -v `
  -keystore $keystorePath `
  -alias $alias `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -storepass $storePass -keypass $keyPass `
  -dname $dname

if ($LASTEXITCODE -ne 0) {
  throw "keytool falló al generar el keystore."
}

# Escribimos key.properties que build.gradle.kts ya sabe leer.
$relStorePath = '..\aienc-admin-release.jks'
$content = @"
# Generado por scripts/setup-release-keystore.ps1
# NO commitear este archivo. Ya está en .gitignore.
storePassword=$storePass
keyPassword=$keyPass
keyAlias=$alias
storeFile=$relStorePath
"@
Set-Content -Path $propsPath -Value $content -Encoding utf8

Write-Host ""
Write-Host "✔ Keystore creado en: $keystorePath" -ForegroundColor Green
Write-Host "✔ Properties creado en: $propsPath" -ForegroundColor Green
Write-Host ""
Write-Host "Siguientes pasos:" -ForegroundColor Cyan
Write-Host "  1) Guarda ambos archivos en un lugar seguro (no en este disco)." -ForegroundColor White
Write-Host "  2) Para construir el APK firmado:" -ForegroundColor White
Write-Host "       cd apps/admin_app" -ForegroundColor DarkGray
Write-Host "       flutter build apk --release \\" -ForegroundColor DarkGray
Write-Host "         --dart-define=AIENC_API_BASE_URL=https://tu-backend.railway.app \\" -ForegroundColor DarkGray
Write-Host "         --dart-define=AIENC_MOBILE_ORIGIN=aiencadmin://app" -ForegroundColor DarkGray
Write-Host "  3) Sube el APK como asset de un GitHub Release." -ForegroundColor White
Write-Host "  4) Configura NEXT_PUBLIC_AIENC_APK_URL en Vercel apuntando a ese asset." -ForegroundColor White
