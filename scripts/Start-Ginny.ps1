#requires -Version 7.4
[CmdletBinding()]
param([ValidateRange(1024,65535)][int]$Port = 8765)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
Push-Location $repo
try {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        & py -3 -m ginny serve --port $Port
    } else {
        & python -m ginny serve --port $Port
    }
    if ($LASTEXITCODE -ne 0) { throw "Ginny Control dừng với exit code $LASTEXITCODE" }
} finally { Pop-Location }
