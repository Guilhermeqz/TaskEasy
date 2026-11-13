param(
    [string]$ProjectRef = 'azkbtwgsqbpjucduolft',
    [string]$PoolerHost = 'aws-0-sa-east-1.pooler.supabase.com'
)

$ErrorActionPreference = 'Stop'
$cloudFile = Join-Path (Split-Path -Parent $PSScriptRoot) '.env.cloud'
if (Test-Path -LiteralPath $cloudFile) {
    throw 'api/.env.cloud ja existe. Preserve esse arquivo e edite-o localmente se precisar atualizar a conexao.'
}
if ($ProjectRef -notmatch '^[a-z0-9]{20}$' -or $PoolerHost -notmatch '^[a-z0-9.-]+\.pooler\.supabase\.com$') {
    throw 'Confira a referencia do projeto e o host do Session pooler.'
}

Write-Host 'Digite a senha atual do banco Supabase, somente neste terminal.'
$cloudPassword = Read-Host 'Senha do banco (entrada oculta)' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($cloudPassword)
try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    if ([string]::IsNullOrWhiteSpace($plainPassword)) { throw 'A senha nao pode estar vazia.' }
    $encodedPassword = [Uri]::EscapeDataString($plainPassword)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    $plainPassword = $null
    $cloudPassword.Dispose()
}

$secretBytes = New-Object byte[] 48
$secretGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $secretGenerator.GetBytes($secretBytes) } finally { $secretGenerator.Dispose() }
$jwtSecret = [Convert]::ToBase64String($secretBytes)
$connection = 'postgresql://postgres.{0}:{1}@{2}:5432/postgres' -f $ProjectRef, $encodedPassword, $PoolerHost
$cloudContent = @(
    'HOST=127.0.0.1',
    'PORT=3001',
    "JWT_SECRET=$jwtSecret",
    "DATABASE_URL=$connection",
    'SEED_DEMO=false'
) -join "`n"
[IO.File]::WriteAllText($cloudFile, "$cloudContent`n", (New-Object Text.UTF8Encoding($false)))
$cloudContent = $null
$connection = $null
$encodedPassword = $null
$jwtSecret = $null
Write-Host 'Conexao salva em api/.env.cloud, ignorado pelo Git. Nenhuma conexao ao banco foi executada.'
Write-Host 'O arquivo da API local (api/.env) permanece preservado. Nao compartilhe o arquivo privado.'
