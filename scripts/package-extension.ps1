param(
    [string]$DevKit = "$PSScriptRoot/../.workspace/tools/moneydance-devkit-5.1",
    [string]$Java = 'C:/Program Files/Moneydance/jre/bin/java.exe',
    [switch]$GenerateKeys
)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Security
$repo = [IO.Path]::GetFullPath("$PSScriptRoot/..")
$output = Join-Path $repo 'dist'
$private = Join-Path $repo '.workspace/tools/snapshot-signing'
New-Item -ItemType Directory -Force $output,$private | Out-Null
$owner=[Security.Principal.WindowsIdentity]::GetCurrent().User
$acl=New-Object Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true,$false)
$acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($owner,'FullControl','ContainerInherit,ObjectInherit','None','Allow')))
# Set only the DACL. Reapplying owner/audit descriptors can request privileges
# unnecessary for a user-owned signing directory on subsequent builds.
[IO.FileSystemAclExtensions]::SetAccessControl([IO.DirectoryInfo]::new($private),$acl)
$priv=Join-Path $private 'priv_key'
$pub=Join-Path $private 'pub_key'
$passFile=Join-Path $private 'passphrase.dpapi'
$libs = [IO.Path]::GetFullPath((Join-Path $DevKit 'lib'))
if (!(Test-Path -LiteralPath "$libs/extadmin.jar")) { throw 'Official DevKit extadmin.jar is required.' }
function Invoke-KeyAdmin([string[]]$ToolArgs,[string]$Phrase) {
    $start=New-Object Diagnostics.ProcessStartInfo
    $start.FileName=$Java
    # Non-secret paths only; reject quotes rather than build an ambiguous command.
    $arguments=@('-cp', "$libs/*", 'com.moneydance.admin.KeyAdmin')+$ToolArgs
    if ($arguments | Where-Object { $_.Contains('"') }) { throw 'Unsupported quote in path' }
    $start.Arguments=($arguments | ForEach-Object { '"'+$_+'"' }) -join ' '
    $start.WorkingDirectory=$private
    $start.UseShellExecute=$false
    $start.CreateNoWindow=$true
    $start.RedirectStandardInput=$true
    $start.RedirectStandardOutput=$true
    $start.RedirectStandardError=$true
    $process=[Diagnostics.Process]::Start($start)
    try {
        $stdout=$process.StandardOutput.ReadToEndAsync()
        $stderr=$process.StandardError.ReadToEndAsync()
        $process.StandardInput.WriteLine($Phrase)
        $process.StandardInput.WriteLine($Phrase)
        $process.StandardInput.Close()
        if (!$process.WaitForExit(60000)) { $process.Kill(); throw 'KeyAdmin timed out' }
        if ($process.ExitCode -ne 0) { throw 'KeyAdmin failed; no package accepted' }
        # Do not print tool output: signing material must never enter routine logs.
        $null=$stdout.Result; $null=$stderr.Result
    } finally { $process.Dispose() }
}
if ($GenerateKeys) {
    if ((Test-Path $priv) -or (Test-Path $pub) -or (Test-Path $passFile)) { throw 'Signing material already exists; refusing to overwrite.' }
    $random=New-Object byte[] 32
    $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($random); $rng.Dispose()
    $phrase=[Convert]::ToBase64String($random)
    [IO.File]::WriteAllBytes($passFile,[Security.Cryptography.ProtectedData]::Protect([Text.Encoding]::UTF8.GetBytes($phrase),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))
    Invoke-KeyAdmin @('genkey',$priv,$pub) $phrase
    $phrase=$null
}
if (!(Test-Path $priv) -or !(Test-Path $pub) -or !(Test-Path $passFile)) { throw 'Run once with -GenerateKeys to generate genuine signing material.' }
$phrase=[Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($passFile),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))
$archive=Join-Path $private ('unsigned-'+[Guid]::NewGuid().ToString('N')+'.mxt')
$zip=[IO.Compression.ZipFile]::Open($archive,'Create')
$mapping=@{
    'script_info.dict'='extension/script_info.dict';
    'snapshot_extension.py'='extension/snapshot_extension.py';
    'configuration.py'='extension/configuration.py';
    'encryption.py'='extension/encryption.py';
    'azure_upload.py'='extension/azure_upload.py';
    'delivery.py'='extension/delivery.py';
    'protect-secrets.ps1'='extension/protect-secrets.ps1';
    'export_json.py'='export_json.py';
    'com/moneydance/modules/features/snapshot_delivery/meta_info.dict'='extension/meta_info.dict'
}
try {
    foreach($entry in $mapping.Keys) {
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $repo $mapping[$entry]),$entry) | Out-Null
    }
} finally { $zip.Dispose() }
try {
    $signed=Join-Path $private 's-snapshot_delivery.mxt'
    # Refuse old output so a failed command cannot be mistaken for a new signature.
    if(Test-Path $signed){ throw 'Unexpected leftover signed staging file; inspect it before retrying.' }
    Invoke-KeyAdmin @('signextjar',$priv,'99','snapshot_delivery',$archive) $phrase
    if(!(Test-Path $signed)){throw 'KeyAdmin did not produce signed output'}
    $zip=[IO.Compression.ZipFile]::OpenRead($signed)
    try {
        foreach($entry in $mapping.Keys){if(!$zip.GetEntry($entry)){throw 'Signed package is missing a required resource'}}
        if($zip.Entries.Count -le $mapping.Count){throw 'Signing metadata missing'}
    } finally {$zip.Dispose()}
    $target=Join-Path $output 'snapshot_delivery.mxt'
    Move-Item -LiteralPath $signed -Destination $target -Force
    Get-FileHash -LiteralPath $target -Algorithm SHA256 | Select-Object Algorithm,Hash,Path
} finally {
    $phrase=$null
    # Exact file created above, within verified fixed private staging directory.
    if(Test-Path -LiteralPath $archive){Remove-Item -LiteralPath $archive}
}
