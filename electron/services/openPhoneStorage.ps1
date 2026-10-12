param([string]$CustomPath)

$opened = $false

# 1. If explicit CustomPath was provided, try opening it directly in Explorer
if ($CustomPath) {
    try {
        Start-Process "explorer.exe" -ArgumentList "`"$CustomPath`""
        $opened = $true
    } catch {}
}

# 2. Query Windows Shell COM for connected Portable Device (MTP)
if (-not $opened) {
    try {
        $shell = New-Object -ComObject Shell.Application
        $thisPC = $shell.Namespace(17) # ssfDRIVES (This PC)
        
        $portableDevice = $thisPC.Items() | Where-Object { 
            $_.Name -notmatch 'Local Disk|New Volume|Kali|CD Drive|DVD Drive|^[A-Z]:' 
        } | Select-Object -First 1

        if ($portableDevice) {
            $targetPath = $portableDevice.Path

            # Check if internal shared storage subfolder is accessible
            try {
                $folder = $portableDevice.GetFolder
                if ($folder) {
                    $sub = $folder.Items() | Select-Object -First 1
                    if ($sub -and $sub.Path) {
                        $targetPath = $sub.Path
                    }
                }
            } catch {}

            # Launch Windows File Explorer directly with device path
            Start-Process "explorer.exe" -ArgumentList "`"$targetPath`""
            
            # Also invoke shell Explore and Open verbs
            try { $shell.Explore($targetPath) } catch {}
            try { $portableDevice.InvokeVerb("open") } catch {}
            
            $opened = $true
        }
    } catch {}
}

# 3. Guaranteed Fallback: If virtual device path didn't open, open "This PC" directly
if (-not $opened) {
    Start-Process "explorer.exe" -ArgumentList "shell:MyComputerFolder"
}

Start-Sleep -Milliseconds 400
exit 0
