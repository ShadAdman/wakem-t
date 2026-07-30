# Wakem-t Local Installation Script (Windows)

$AppName = "wakem-t"
$InstallDir = Join-Path $HOME ".wakem\bin"
$ProjectRoot = Get-Location
$BinarySource = Join-Path $ProjectRoot "bin\wakem-t-win.exe"

Write-Host "Installing $AppName..." -ForegroundColor Cyan

# 1. Check if built
if (-not (Test-Path $BinarySource)) {
    Write-Host "Error: Binary not found at $BinarySource" -ForegroundColor Red
    Write-Host "Please run: npm run build && npx pkg . --targets node18-win --out-path bin first."
    exit 1
}

# 2. Prepare Install Directory
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# 3. Copy
Copy-Item -Path $BinarySource -Destination (Join-Path $InstallDir "$AppName.exe") -Force

Write-Host "Success! $AppName has been installed to $InstallDir" -ForegroundColor Green

# 4. PATH Verification
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$InstallDir*") {
    Write-Host ""
    Write-Host "Adding $InstallDir to your User PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$UserPath;$InstallDir", "User")
    $env:Path = "$env:Path;$InstallDir"
    Write-Host "Done. Please restart your terminal for changes to take effect." -ForegroundColor Cyan
}

Write-Host "You can now run '$AppName --version' from anywhere."
