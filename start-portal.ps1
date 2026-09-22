param(
  [string]$ProjectDir = (Join-Path $PSScriptRoot "portal"),
  [string]$PortalUrl = "http://localhost:5173",
  [int]$DevPort = 5173,
  [int]$StartupTimeoutSeconds = 90
)

function Test-PortListening {
  param([int]$Port)

  try {
    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    return ($listeners.Count -gt 0)
  }
  catch {
    return $false
  }
}

function Find-NodeProcessPorts {
  param([string]$ProjectPath)

  $ports = @()
  try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    foreach ($proc in $nodeProcesses) {
      try {
        $connections = Get-NetTCPConnection -OwningProcess $proc.Id -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
          if ($conn.LocalAddress -match "127|localhost|::" -and $conn.LocalPort -gt 3000 -and $conn.LocalPort -lt 9000) {
            $ports += $conn.LocalPort
          }
        }
      }
      catch {
        # Ignorar erros ao tentar obter conexoes
      }
    }
  }
  catch {
    # Ignorar erros ao listar processos
  }
  return $ports | Sort-Object -Unique
}

function Test-PortConnectivity {
  param([int]$Port)

  try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.ConnectAsync("127.0.0.1", $Port).Wait(2000) | Out-Null
    $result = $tcpClient.Connected
    $tcpClient.Close()
    return $result
  }
  catch {
    return $false
  }
}

function Start-NpmScriptWindow {
  param(
    [string]$WorkingDir,
    [string]$ScriptName,
    [string]$Title
  )

  $escapedPath = $WorkingDir.Replace("'", "''")
  $command = "Set-Location -LiteralPath '$escapedPath'; npm run $ScriptName"

  Start-Process -FilePath "powershell.exe" -WindowStyle Hidden -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $command
  ) | Out-Null
}

if (-not (Test-Path -LiteralPath $ProjectDir)) {
  Write-Error "Diretorio do portal nao encontrado: $ProjectDir"
  exit 1
}

# Verificar se a pasta node_modules existe; se nao, instalar dependencias automaticamente de forma oculta
if (-not (Test-Path (Join-Path $ProjectDir "node_modules"))) {
  Write-Host "Pasta node_modules nao encontrada. Instalando dependencias..." -ForegroundColor Cyan
  Start-Process -FilePath "cmd.exe" -WindowStyle Hidden -ArgumentList "/c", "npm install" -WorkingDirectory $ProjectDir -Wait
}

# Tentar conectar a porta padrao (dev) primeiro
$portalPort = $DevPort
if (Test-PortConnectivity -Port $DevPort) {
  Write-Host "Aplicacao ja está ativa em localhost:$DevPort" -ForegroundColor Green
  Start-Process "http://localhost:$DevPort" | Out-Null
  exit 0
}

# Se porta padrao nao funcionar, procurar por portas de processos node em uso
$activePorts = Find-NodeProcessPorts -ProjectPath $ProjectDir
if ($activePorts.Count -gt 0) {
  foreach ($port in $activePorts) {
    if (Test-PortConnectivity -Port $port) {
      Write-Host "Aplicacao já está ativa em localhost:$port (porta alternativa)" -ForegroundColor Green
      Start-Process "http://localhost:$port" | Out-Null
      exit 0
    }
  }
}

# Se nenhuma aplicacao estiver rodando, iniciar o servico dev
$devRunning = Test-PortListening -Port $DevPort

if (-not $devRunning) {
  Write-Host "Iniciando frontend (npm run dev)..." -ForegroundColor Cyan
  Start-NpmScriptWindow -WorkingDir $ProjectDir -ScriptName "dev" -Title "Portal Vite (npm run dev)"
}

if (-not $devRunning) {
  Write-Host "Aguardando inicializacao do portal..." -ForegroundColor Yellow
  $timeoutAt = (Get-Date).AddSeconds($StartupTimeoutSeconds)

  do {
    Start-Sleep -Milliseconds 600
    $devRunning = Test-PortListening -Port $DevPort
  } while ((Get-Date) -lt $timeoutAt -and -not $devRunning)
}

if (Test-PortConnectivity -Port $DevPort) {
  Write-Host "Abrindo portal em http://localhost:$DevPort" -ForegroundColor Green
  Start-Process "http://localhost:$DevPort" | Out-Null
} else {
  Write-Warning "Nao foi possível conectar a porta $DevPort. Verifique se o portal iniciou corretamente."
  exit 1
}
