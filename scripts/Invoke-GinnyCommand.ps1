#requires -Version 7.4
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('system.info', 'workspace.list', 'git.status')]
    [string]$CommandId,
    [Parameter(Mandatory)][ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
    [string]$Workspace
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
try {
    switch ($CommandId) {
        'system.info' {
            [ordered]@{
                PowerShell = $PSVersionTable.PSVersion.ToString()
                OS = [System.Runtime.InteropServices.RuntimeInformation]::OSDescription
                Architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
                Workspace = (Resolve-Path -LiteralPath $Workspace).Path
            } | ConvertTo-Json
        }
        'workspace.list' {
            @(Get-ChildItem -LiteralPath $Workspace | Select-Object -First 100 Name, Mode, Length) |
                ConvertTo-Json -Depth 3
        }
        'git.status' {
            & git --no-optional-locks -c core.fsmonitor=false -C $Workspace status --short --branch
            if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        }
    }
} catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
}
