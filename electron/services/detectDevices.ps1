$devices = Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | Where-Object { 
    $_.FriendlyName -like "*ADB*" -or 
    $_.FriendlyName -like "*Bootloader*" -or 
    $_.FriendlyName -like "*Fastboot*" -or 
    $_.FriendlyName -like "*Preloader*" -or 
    $_.FriendlyName -like "*MediaTek*" -or 
    $_.FriendlyName -like "*VCOM*" -or
    $_.InstanceId -like "*VID_0E8D*" -or
    $_.InstanceId -like "*VID_18D1*"
}

if (-not $devices) {
    exit 0
}

# Find phone brand & model info from WPD or companion USB interfaces
$allPresent = Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue
$phoneModel = $null
$phoneBrand = $null

foreach ($dev in $devices) {
    if ($dev.InstanceId -match '(VID_[0-9A-Fa-f]{4})(&PID_[0-9A-Fa-f]{4})?') {
        $vid = $matches[1]
        
        # Check matching siblings in WPD (Windows Portable Devices)
        $companion = $allPresent | Where-Object { 
            ($_.Class -eq "WPD" -or $_.Class -eq "PortableDevice") -and $_.InstanceId -like "*$vid*" 
        } | Select-Object -First 1

        if ($companion) {
            $phoneModel = $companion.FriendlyName
            $phoneBrand = $companion.Manufacturer
        }

        # Fallback to known VID database
        if (-not $phoneBrand -or $phoneBrand -eq "(Standard USB Host Controller)") {
            switch ($vid) {
                "VID_22D9" { $phoneBrand = "OnePlus" }
                "VID_2717" { $phoneBrand = "Xiaomi" }
                "VID_04E8" { $phoneBrand = "Samsung" }
                "VID_18D1" { $phoneBrand = "Google" }
                "VID_2A70" { $phoneBrand = "OnePlus" }
                "VID_22B8" { $phoneBrand = "Motorola" }
                "VID_05C6" { $phoneBrand = "Qualcomm" }
                "VID_2B4B" { $phoneBrand = "Vivo" }
                "VID_0E8D" { $phoneBrand = "MediaTek" }
                default    { $phoneBrand = "Android" }
            }
        }
    }
}

$output = [PSCustomObject]@{
    Devices = @($devices | Select-Object FriendlyName, InstanceId, Status, Class)
    Brand   = $phoneBrand
    Model   = $phoneModel
}

$output | ConvertTo-Json -Compress -Depth 3
