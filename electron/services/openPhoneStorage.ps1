param([string]$CustomPath)

try {
    $shell = New-Object -ComObject Shell.Application
    $thisPC = $shell.Namespace(17) # 17 = ssfDRIVES (This PC)
    
    $portableDevice = $thisPC.Items() | Where-Object { 
        $_.Name -notmatch 'Local Disk|New Volume|Kali|CD Drive|DVD Drive|^[A-Z]:' 
    } | Select-Object -First 1

    if ($portableDevice) {
        $targetPath = $portableDevice.Path

        # Check if internal storage sub-folder is accessible
        try {
            $folder = $portableDevice.GetFolder
            if ($folder) {
                $sub = $folder.Items() | Select-Object -First 1
                if ($sub -and $sub.Path) {
                    $targetPath = $sub.Path
                }
            }
        } catch {}

        # 1. Open the specific phone / storage folder
        $shell.Open($targetPath)

        # 2. Also invoke &Open on portable item for maximum Windows compatibility
        try {
            $portableDevice.InvokeVerb("&Open")
        } catch {}

        Start-Sleep -Milliseconds 500
        exit 0
    }
} catch {}

# Fallback: Open This PC directly so user can access their phone
Start-Process explorer.exe "shell:MyComputerFolder"
