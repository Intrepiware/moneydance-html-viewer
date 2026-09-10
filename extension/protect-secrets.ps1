$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try {
    Add-Type -AssemblyName System.Security
    $raw = [Console]::In.ReadLine()
    if ($null -eq $raw -or $raw.Length -gt 65536) { throw 'INVALID_REQUEST' }
    $request = $raw | ConvertFrom-Json
    if ($request.operation -notin @('protect','unprotect')) { throw 'INVALID_OPERATION' }
    $bytes = [Convert]::FromBase64String($request.dataBase64)
    if ($bytes.Length -gt 32768) { throw 'INVALID_SIZE' }
    $scope = [Security.Cryptography.DataProtectionScope]::CurrentUser
    if ($request.operation -eq 'protect') {
        $result = [Security.Cryptography.ProtectedData]::Protect($bytes, $null, $scope)
    } else {
        $result = [Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, $scope)
    }
    [Console]::Out.WriteLine((@{status='OK';dataBase64=[Convert]::ToBase64String($result)} | ConvertTo-Json -Compress))
    [Array]::Clear($bytes,0,$bytes.Length)
    [Array]::Clear($result,0,$result.Length)
} catch {
    [Console]::Out.WriteLine('{"status":"ERROR","code":"SECRET_PROTECTION_FAILED"}')
    exit 1
}
