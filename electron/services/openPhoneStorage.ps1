param([string]$CustomPath)

$opened = $false

try {
    $shell = New-Object -ComObject Shell.Application
    $thisPC = $shell.Namespace(17) # 17 = ssfDRIVES (This PC)
    
    # Locate connected portable device (exclude local physical drives C:, D:, E:, etc.)
    $portableDevice = $thisPC.Items() | Where-Object { 
        $_.Name -notmatch 'Local Disk|New Volume|Kali|CD Drive|DVD Drive|^[A-Z]:' 
    } | Select-Object -First 1

    if ($portableDevice) {
        # 1. Primary: Try opening the internal shared storage sub-folder directly
        try {
            $folder = $portableDevice.GetFolder
            if ($folder) {
                $sub = $folder.Items() | Select-Object -First 1
                if ($sub) {
                    $subFolder = $sub.GetFolder
                    if ($subFolder) {
                        $shell.Explore($subFolder)
                        $opened = $true
                    } else {
                        $sub.InvokeVerb("open")
                        $opened = $true
                    }
                }
            }
        } catch {}

        # 2. Secondary: If subfolder didn't open, open the device folder directly
        if (-not $opened) {
            try {
                $shell.Explore($portableDevice.GetFolder)
                $opened = $true
            } catch {
                try {
                    $portableDevice.InvokeVerb("open")
                    $opened = $true
                } catch {}
            }
        }

        Start-Sleep -Milliseconds 600
    }
} catch {}

# Fallback: Open "This PC" directly
# NOTE: Must include "shell:::" prefix. Passing bare "::{GUID}" causes Windows Explorer
# to treat it as an invalid path and fall back to the user's default folder (Documents).
if (-not $opened) {
    try {
        Start-Process "explorer.exe" -ArgumentList "shell:::{20D04FE0-3AEA-1069-A2D8-08002B30309D}"
    } catch {
        Start-Process "explorer.exe" -ArgumentList "shell:MyComputerFolder"
    }
}

exit 0
