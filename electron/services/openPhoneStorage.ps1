param([string]$CustomPath)

try {
    $shell = New-Object -ComObject Shell.Application
    $thisPC = $shell.Namespace(17) # 17 = ssfDRIVES (This PC)
    
    $portableDevice = $thisPC.Items() | Where-Object { 
        $_.Name -notmatch 'Local Disk|New Volume|Kali|CD Drive|DVD Drive|^[A-Z]:' 
    } | Select-Object -First 1

    if ($portableDevice) {
        $folder = $portableDevice.GetFolder
        $sub = $folder.Items() | Select-Object -First 1
        if ($sub) {
            $sub.InvokeVerb("open")
            exit 0
        } else {
            $portableDevice.InvokeVerb("open")
            exit 0
        }
    }
} catch {}

# Fallback: Open This PC in Explorer
Start-Process explorer.exe "shell:MyComputerFolder"
