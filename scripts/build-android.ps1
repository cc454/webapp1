param([switch]$SkipPrebuild, [string]$Architectures = 'arm64-v8a,armeabi-v7a')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if (-not $env:JAVA_HOME) {
  $jdk = Get-ChildItem -LiteralPath (Join-Path $projectRoot '.tools') -Directory -Filter 'jdk*' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($jdk) { $env:JAVA_HOME = $jdk.FullName }
}
if (-not $env:ANDROID_HOME -and (Test-Path -LiteralPath (Join-Path $projectRoot '.tools/android-sdk'))) { $env:ANDROID_HOME = Join-Path $projectRoot '.tools/android-sdk' }
if (-not $env:JAVA_HOME -or -not $env:ANDROID_HOME) { throw 'Install JDK 17 and Android SDK; set JAVA_HOME and ANDROID_HOME. See README.' }
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:GRADLE_USER_HOME = Join-Path $projectRoot '.tools/gradle'
$env:NODE_ENV = 'production'
# CMake's DOS short-name fallback hides the ++ in clang++.exe when the SDK
# path contains spaces. Keep the project at its real path for autolinking.
$sdkDrive = $null
$sdkOriginal = $env:ANDROID_HOME
if ($sdkOriginal.Contains(' ')) {
  $occupied = @(Get-PSDrive -PSProvider FileSystem | ForEach-Object { $_.Name })
  $sdkDrive = @('Z', 'Y', 'X', 'W', 'V', 'U', 'T', 'S', 'R') | Where-Object { $_ -notin $occupied } | Select-Object -First 1
  if (-not $sdkDrive) { throw 'No free drive letter for a space-free SDK path. Set ANDROID_HOME to a path without spaces.' }
  & subst.exe "${sdkDrive}:" $sdkOriginal
  if ($LASTEXITCODE -ne 0) { throw 'Could not create temporary SDK drive mapping.' }
  $env:ANDROID_HOME = "${sdkDrive}:\"
  $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
}
$env:STRIDE_NATIVE_CACHE = Join-Path $env:ANDROID_HOME 'stride-native-cache'
$gradleDrive = $null
$gradleOriginal = $env:GRADLE_USER_HOME
try {
if ($gradleOriginal.Contains(' ')) {
  $occupied = @(Get-PSDrive -PSProvider FileSystem | ForEach-Object { $_.Name })
  $gradleDrive = @('Y', 'X', 'W', 'V', 'U', 'T', 'S', 'R') | Where-Object { $_ -notin $occupied } | Select-Object -First 1
  if (-not $gradleDrive) { throw 'No free drive letter for the Gradle cache.' }
  & subst.exe "${gradleDrive}:" $gradleOriginal
  if ($LASTEXITCODE -ne 0) { throw 'Could not map the Gradle cache.' }
  $env:GRADLE_USER_HOME = "${gradleDrive}:\"
}
if (-not $SkipPrebuild) {
& node node_modules/expo/bin/cli prebuild --platform android --no-install
if ($LASTEXITCODE -ne 0) { throw 'Expo prebuild failed.' }
}
New-Item -ItemType Directory -Path (Join-Path $projectRoot 'artifacts') -Force | Out-Null
Push-Location -LiteralPath (Join-Path $projectRoot 'android')
try { & .\gradlew.bat :app:assembleRelease --no-daemon '-Dorg.gradle.workers.max=2' "-PreactNativeArchitectures=$Architectures" --init-script (Join-Path $PSScriptRoot 'native-cache.gradle') | Tee-Object -FilePath (Join-Path $projectRoot 'artifacts/android-build.log') }
finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { throw 'Gradle Android build failed. See artifacts/android-build.log and .tools/gradle/daemon logs.' }
Copy-Item -LiteralPath (Join-Path $projectRoot 'android/app/build/outputs/apk/release/app-release.apk') -Destination (Join-Path $projectRoot 'artifacts/adaptai-release.apk')
Write-Output 'APK: artifacts/adaptai-release.apk (testing-only debug signing)'
} finally {
  if ($gradleDrive) {
    if (@(& subst.exe) -contains "${gradleDrive}:\: => $gradleOriginal") { & subst.exe "${gradleDrive}:" /D }
    $env:GRADLE_USER_HOME = $gradleOriginal
  }
  if ($sdkDrive) {
    # Remove only the mapping this invocation created, and only if it still
    # points to the SDK we supplied. Never remove an existing/user mapping.
    $expectedMapping = "${sdkDrive}:\: => $sdkOriginal"
    if (@(& subst.exe) -contains $expectedMapping) { & subst.exe "${sdkDrive}:" /D }
    $env:ANDROID_HOME = $sdkOriginal
    $env:ANDROID_SDK_ROOT = $sdkOriginal
  }
}
