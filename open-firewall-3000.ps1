# Doctor360 — one-time Windows Firewall fix.
# Opens inbound TCP 3000 (backend API) for ALL network profiles (Private + Public
# + Domain) so a phone on the same Wi-Fi can always reach the dev backend — on any
# Wi-Fi, including those Windows marks as "Public".
#
# HOW TO RUN (one time only):
#   1. Right-click this file -> "Run with PowerShell"  (accept the admin prompt)
#      OR open "Windows Terminal (Admin)" / "PowerShell (Admin)" and run:
#         powershell -ExecutionPolicy Bypass -File d:\healthProduct\open-firewall-3000.ps1
#
# Safe to run more than once — it removes any old copy of the rule first.

$ruleName = 'Doctor360 Backend (TCP 3000)'

# Must be Administrator to change the firewall.
$id = [Security.Principal.WindowsIdentity]::GetCurrent()
if (-not (New-Object Security.Principal.WindowsPrincipal($id)).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host 'ERROR: Please run this in an ADMIN PowerShell (right-click -> Run as administrator).' -ForegroundColor Red
    exit 1
}

# Remove a previous version of the rule if present, then (re)create it.
Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule

New-NetFirewallRule `
    -DisplayName $ruleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 3000 `
    -Profile Any | Out-Null

Write-Host "DONE. Inbound TCP 3000 is now allowed on all network profiles." -ForegroundColor Green
Write-Host "Your phone can now reach the backend on any Wi-Fi (after 'npx expo start --clear')."
