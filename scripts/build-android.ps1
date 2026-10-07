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
& node node_modules/expo/bin/cli prebuild --platform android --no-install
if ($LASTEXITCODE -ne 0) { throw 'Expo prebuild failed.' }
New-Item -ItemType Directory -Path (Join-Path $projectRoot 'artifacts') -Force | Out-Null
Push-Location -LiteralPath (Join-Path $projectRoot 'android')
try { & .\gradlew.bat assembleRelease --no-daemon '-Dorg.gradle.workers.max=2' | Tee-Object -FilePath (Join-Path $projectRoot 'artifacts/android-build.log') }
finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { throw 'Gradle Android build failed. See artifacts/android-build.log and .tools/gradle/daemon logs.' }
Copy-Item -LiteralPath (Join-Path $projectRoot 'android/app/build/outputs/apk/release/app-release.apk') -Destination (Join-Path $projectRoot 'artifacts/stride-ai-release.apk')
Write-Output 'APK: artifacts/stride-ai-release.apk (testing-only debug signing)'
