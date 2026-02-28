$path = "C:\Users\PRINTER SERVICE\.gemini\antigravity\scratch\antidark"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Output "Listening on http://localhost:8080/"
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $requestUrl = $context.Request.Url.LocalPath
        if ($requestUrl -eq "/") { $requestUrl = "/index.html" }
        $filePath = Join-Path $path $requestUrl
        
        # Super basic MIME types
        $mime = "text/plain"
        if ($filePath.EndsWith(".html")) { $mime = "text/html" }
        elseif ($filePath.EndsWith(".css")) { $mime = "text/css" }
        elseif ($filePath.EndsWith(".js")) { $mime = "application/javascript" }
        
        $context.Response.ContentType = $mime
        
        if (Test-Path $filePath -PathType Leaf) {
            $buffer = [System.IO.File]::ReadAllBytes($filePath)
            $context.Response.ContentLength64 = $buffer.Length
            try {
                $context.Response.OutputStream.Write($buffer, 0, $buffer.Length)
            } catch {
                # Ignore closed connection errors
            }
            $context.Response.StatusCode = 200
            Write-Output "Served 200 OK: $requestUrl"
        } else {
            $context.Response.StatusCode = 404
            Write-Output "Not Found 404: $requestUrl"
        }
        $context.Response.Close()
    }
} finally {
    $listener.Stop()
}
