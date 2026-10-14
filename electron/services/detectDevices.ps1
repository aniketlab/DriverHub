# Fast query via CimInstance (< 800ms)
$query = "SELECT DeviceID, Name, Manufacturer, Status, Present, PNPClass, ConfigManagerErrorCode, Description FROM Win32_PnPEntity WHERE Present = True AND (PNPClass = 'AndroidUsbDeviceClass' OR PNPClass = 'WPD' OR (PNPClass = 'Ports' AND (Name LIKE '%MediaTek%' OR Name LIKE '%Preloader%' OR Name LIKE '%VCOM%')) OR DeviceID LIKE 'USB\\VID_22B8%' OR DeviceID LIKE 'USB\\VID_22D9%' OR DeviceID LIKE 'USB\\VID_2717%' OR DeviceID LIKE 'USB\\VID_04E8%' OR DeviceID LIKE 'USB\\VID_18D1%' OR DeviceID LIKE 'USB\\VID_0E8D%' OR DeviceID LIKE 'USB\\VID_2A70%' OR DeviceID LIKE 'USB\\VID_2B4B%' OR DeviceID LIKE 'USB\\VID_19D2%' OR DeviceID LIKE 'USB\\VID_2E04%' OR DeviceID LIKE 'USB\\VID_12D1%' OR DeviceID LIKE 'USB\\VID_0B05%' OR DeviceID LIKE 'USB\\VID_0FCE%' OR DeviceID LIKE 'USB\\VID_1004%' OR DeviceID LIKE 'USB\\VID_0BB4%')"

$rawDevices = Get-CimInstance -Query $query -ErrorAction SilentlyContinue

if (-not $rawDevices) {
    exit 0
}

$activeDevices = @()
$phoneModel = $null
$phoneBrand = $null

foreach ($d in $rawDevices) {
    $id = ($d.DeviceID -as [string]).ToUpper()
    $name = ($d.Name -as [string])
    $mfg = ($d.Manufacturer -as [string])

    $isAndroidClass = ($d.PNPClass -eq 'AndroidUsbDeviceClass') -or ($d.PNPClass -eq 'WPD')
    $hasAndroidName = ($name -like "*ADB*") -or ($name -like "*Bootloader*") -or ($name -like "*Fastboot*") -or ($name -like "*Preloader*") -or ($name -like "*MediaTek*") -or ($name -like "*VCOM*")
    $matchesKnownVid = ($id -match 'VID_0E8D|VID_18D1|VID_2717|VID_22B8|VID_22D9|VID_04E8|VID_2A70|VID_2B4B|VID_19D2|VID_2E04|VID_12D1|VID_0B05|VID_0FCE|VID_1004|VID_0BB4')

    # Capture any device matching Android class, names, or OEM Vendor IDs
    if ($isAndroidClass -or $hasAndroidName -or $matchesKnownVid) {
        if ($name -notlike "*Host Controller*") {
            $activeDevices += $d
        }
    }

    # Extract friendly device names (ignoring generic USB protocol/network adapter names)
    if (-not $phoneModel -and $name -notmatch '(?i)interface|composite|hub|controller|winusb|rndis|cdc|ncm|ethernet|modem|generic' -and $mfg -notmatch '(?i)standard|microsoft') {
        $phoneModel = $name
        $phoneBrand = $mfg
    }
}

if (-not $activeDevices -or $activeDevices.Count -eq 0) {
    exit 0
}

# Only query DEVPKEY_Device_BusReportedDeviceDesc if phoneModel is still missing
if (-not $phoneModel -and $activeDevices.Count -gt 0) {
    try {
        $targetId = $activeDevices[0].DeviceID
        $busDesc = (Get-PnpDeviceProperty -InstanceId $targetId -KeyName "DEVPKEY_Device_BusReportedDeviceDesc" -ErrorAction SilentlyContinue).Data
        
        if (-not $busDesc -or $busDesc -match '(?i)rndis|interface|composite') {
            $parentInstId = (Get-PnpDeviceProperty -InstanceId $targetId -KeyName "DEVPKEY_Device_Parent" -ErrorAction SilentlyContinue).Data
            if ($parentInstId) {
                $parentDesc = (Get-PnpDeviceProperty -InstanceId $parentInstId -KeyName "DEVPKEY_Device_BusReportedDeviceDesc" -ErrorAction SilentlyContinue).Data
                if ($parentDesc) { $busDesc = $parentDesc }
            }
        }

        if ($busDesc -and $busDesc -notmatch '(?i)interface|composite|android|device|rndis|cdc|ncm|ethernet|modem') {
            $phoneModel = $busDesc
        }
    } catch {}
}

# Fallback to known USB Vendor ID if brand is missing
if (-not $phoneBrand -and $activeDevices.Count -gt 0) {
    $firstId = ($activeDevices[0].DeviceID -as [string]).ToUpper()
    if ($firstId -match 'VID_([0-9A-F]{4})') {
        switch ($matches[1]) {
            "2717" { $phoneBrand = "Xiaomi" }
            "22B8" { $phoneBrand = "Motorola" }
            "22D9" { $phoneBrand = "OnePlus / OPPO" }
            "2A70" { $phoneBrand = "OnePlus" }
            "2B4B" { $phoneBrand = "Vivo" }
            "04E8" { $phoneBrand = "Samsung" }
            "18D1" { 
                if ($activeDevices[0].Name -like "*Bootloader*" -or $activeDevices[0].Name -like "*Fastboot*") {
                    $phoneBrand = "Android (Bootloader)"
                } else {
                    $phoneBrand = "Google"
                }
            }
            "19D2" { $phoneBrand = "RedMagic / ZTE" }
            "2E04" { $phoneBrand = "Tecno / Infinix" }
            "12D1" { $phoneBrand = "Huawei" }
            "0B05" { $phoneBrand = "ASUS" }
            "0FCE" { $phoneBrand = "Sony" }
            "1004" { $phoneBrand = "LG" }
            "0BB4" { $phoneBrand = "HTC" }
            "0E8D" { $phoneBrand = "MediaTek" }
            default { $phoneBrand = "Android" }
        }
    }
}

$usbSpeed = "USB 2.0"
$matchedDriver = "Android USB Driver"

if ($activeDevices.Count -gt 0) {
    $primary = $activeDevices[0]
    if ($primary.Description) { 
        $matchedDriver = $primary.Description 
    } elseif ($primary.Name) { 
        $matchedDriver = $primary.Name 
    }
    
    $primaryId = ($primary.DeviceID -as [string]).ToUpper()
    if ($primaryId -like "*USBHUB3*" -or $primaryId -like "*ROOT_HUB30*" -or $primaryId -like "*3.0*" -or $primaryId -like "*3.1*") {
        $usbSpeed = "USB 3.0"
    } else {
        try {
            $parentInstId = (Get-PnpDeviceProperty -InstanceId $primary.DeviceID -KeyName "DEVPKEY_Device_Parent" -ErrorAction SilentlyContinue).Data
            if ($parentInstId -and (($parentInstId -like "*USBHUB3*") -or ($parentInstId -like "*ROOT_HUB30*") -or ($parentInstId -like "*3.0*") -or ($parentInstId -like "*3.1*"))) {
                $usbSpeed = "USB 3.0"
            }
        } catch {}
    }
}

# Probe MTP Storage info (Name, Total, Free, Path) and Portable Device Friendly Name
$storageData = $null
try {
    $shell = New-Object -ComObject Shell.Application
    $thisPC = $shell.Namespace(17)
    $portableDevice = $thisPC.Items() | Where-Object { 
        $_.Name -notmatch 'Local Disk|New Volume|Kali|CD Drive|DVD Drive|^[A-Z]:' 
    } | Select-Object -First 1

    if ($portableDevice) {
        if (-not $phoneModel -and $portableDevice.Name) {
            $phoneModel = $portableDevice.Name
        }
        $folder = $portableDevice.GetFolder
        $firstSub = $folder.Items() | Select-Object -First 1
        if ($firstSub) {
            $totalSize = $folder.GetDetailsOf($firstSub, 2)
            $freeSpace = $folder.GetDetailsOf($firstSub, 3)
            $pctFull = $folder.GetDetailsOf($firstSub, 4)
            $storageData = [PSCustomObject]@{
                Name    = $firstSub.Name
                Total   = $totalSize
                Free    = $freeSpace
                Percent = $pctFull
                Path    = $firstSub.Path
            }
        }
    }
} catch {}

$output = [PSCustomObject]@{
    Devices    = @($activeDevices | Select-Object @{Name="FriendlyName"; Expression={$_.Name}}, @{Name="InstanceId"; Expression={$_.DeviceID}}, @{Name="PNPClass"; Expression={$_.PNPClass}}, Status, ConfigManagerErrorCode)
    Brand      = $phoneBrand
    Model      = $phoneModel
    UsbSpeed   = $usbSpeed
    DriverName = $matchedDriver
    Storage    = $storageData
}

$output | ConvertTo-Json -Compress -Depth 3
