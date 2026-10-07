param([switch]$DownloadOnly, [switch]$AcceptLicenses)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsRoot = Join-Path $projectRoot '.tools'
New-Item -ItemType Directory -Path $toolsRoot -Force | Out-Null
$jdkZip = Join-Path $toolsRoot 'jdk.zip'
if (-not (Get-ChildItem -LiteralPath $toolsRoot -Directory -Filter 'jdk*')) {
  $metadata = Invoke-RestMethod 'https://api.adoptium.net/v3/assets/latest/17/hotspot?architecture=x64&image_type=jdk&os=windows&vendor=eclipse'
  $package = $metadata[0].binary.package
  & curl.exe -f -L --max-time 300 --output $jdkZip $package.link
  if ($LASTEXITCODE -ne 0) { throw 'JDK download failed.' }
  if ((Get-FileHash -LiteralPath $jdkZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $package.checksum) { throw 'JDK checksum mismatch.' }
  Expand-Archive -LiteralPath $jdkZip -DestinationPath $toolsRoot -Force
}
$env:JAVA_HOME = (Get-ChildItem -LiteralPath $toolsRoot -Directory -Filter 'jdk*' | Select-Object -First 1).FullName
$env:ANDROID_HOME = Join-Path $toolsRoot 'android-sdk'
$manager = Join-Path $env:ANDROID_HOME 'cmdline-tools/latest/bin/sdkmanager.bat'
if (-not (Test-Path -LiteralPath $manager)) {
  $zip = Join-Path $toolsRoot 'android-commandline.zip'
  & curl.exe -f -L --max-time 300 --output $zip 'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip'
  if ($LASTEXITCODE -ne 0) { throw 'Android tool download failed.' }
  Expand-Archive -LiteralPath $zip -DestinationPath (Join-Path $toolsRoot 'android-commandline') -Force
  New-Item -ItemType Directory -Path (Join-Path $env:ANDROID_HOME 'cmdline-tools/latest') -Force | Out-Null
  Copy-Item -Path (Join-Path $toolsRoot 'android-commandline/cmdline-tools/*') -Destination (Join-Path $env:ANDROID_HOME 'cmdline-tools/latest') -Recurse -Force
}
if ($DownloadOnly) { Write-Output 'Build tools downloaded. Run this script without -DownloadOnly to review SDK licenses and install packages.'; exit 0 }
Write-Output 'Review and accept the Android SDK licenses to continue.'
if ($AcceptLicenses) {
  1..100 | ForEach-Object { 'y' } | & $manager "--sdk_root=$env:ANDROID_HOME" --licenses
} else { & $manager "--sdk_root=$env:ANDROID_HOME" --licenses }
if ($LASTEXITCODE -ne 0) { throw 'SDK license review did not complete.' }
& $manager "--sdk_root=$env:ANDROID_HOME" 'platform-tools' 'platforms;android-36' 'build-tools;36.0.0'
if ($LASTEXITCODE -ne 0) { throw 'SDK installation failed.' }
Write-Output 'Android toolchain installed under .tools. Run scripts/build-android.ps1.'
