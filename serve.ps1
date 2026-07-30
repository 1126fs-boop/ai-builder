# AI Builder — ローカル開発サーバー
# ES Modules を使うため、file:// ではなく HTTP で開いてください。

param(
  [int]$Port = 8080,
  [string]$Root = $PSScriptRoot
)

$prefix = "http://127.0.0.1:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host ""
Write-Host "  AI Builder dev server" -ForegroundColor Cyan
Write-Host "  $prefix" -ForegroundColor Green
Write-Host "  Ctrl+C で停止" -ForegroundColor DarkGray
Write-Host ""

$mimes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".ico"  = "image/x-icon"
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $path = $context.Request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }

    $relative = $path.TrimStart("/").Replace("/", [IO.Path]::DirectorySeparatorChar)
    $file = Join-Path $Root $relative

    if (Test-Path $file -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $context.Response.ContentType = if ($mimes.ContainsKey($ext)) { $mimes[$ext] } else { "application/octet-stream" }
      $bytes = [IO.File]::ReadAllBytes($file)
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $context.Response.StatusCode = 404
      $body = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $context.Response.OutputStream.Write($body, 0, $body.Length)
    }

    $context.Response.Close()
  }
} finally {
  $listener.Stop()
}
