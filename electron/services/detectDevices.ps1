# Fast query via CimInstance (< 800ms)
$query = "SELECT DeviceID, Name, Manufacturer, Status, Present, PNPClass FROM Win32_PnPEntity WHERE Present = True AND (PNPClass = 'AndroidUsbDeviceClass' OR PNPClass = 'WPD' OR (PNPClass = 'Ports' AND (Name LIKE '%MediaTek%' OR Name LIKE '%Preloader%' OR Name LIKE '%VCOM%')) OR DeviceID LIKE 'USB\\VID_22B8%' OR DeviceID LIKE 'USB\\VID_22D9%' OR DeviceID LIKE 'USB\\VID_2717%' OR DeviceID LIKE 'USB\\VID_04E8%' OR DeviceID LIKE 'USB\\VID_18D1%' OR DeviceID LIKE 'USB\\VID_0E8D%' OR DeviceID LIKE 'USB\\VID_2A70%' OR DeviceID LIKE 'USB\\VID_2B4B%')"

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

    # Capture any device with ADB, Bootloader, Fastboot, Preloader, or any Android OEM Vendor ID
    if ($name -like "*ADB*" -or $name -like "*Bootloader*" -or $name -like "*Fastboot*" -or $name -like "*Preloader*" -or $name -like "*MediaTek*" -or $name -like "*VCOM*" -or $id -match 'VID_0E8D|VID_18D1|VID_2717|VID_22B8|VID_22D9|VID_04E8') {
        if ($name -notlike "*Host Controller*") {
            $activeDevices += $d
        }
    }

    # Extract friendly device names (ignoring generic USB protocol/network adapter names)
    if ($name -notmatch '(?i)interface|composite|hub|controller|winusb|rndis|cdc|ncm|ethernet|modem' -and $mfg -notmatch '(?i)standard|microsoft') {
        $phoneModel = $name
        $phoneBrand = $mfg
    }
}

if (-not $activeDevices -or $activeDevices.Count -eq 0) {
    exit 0
}

# If phoneModel is still missing, query DEVPKEY_Device_BusReportedDeviceDesc for the active device or parent composite
if (-not $phoneModel -and $activeDevices.Count -gt 0) {
    $targetId = $activeDevices[0].DeviceID
    $busDesc = (Get-PnpDeviceProperty -InstanceId $targetId -KeyName "DEVPKEY_Device_BusReportedDeviceDesc" -ErrorAction SilentlyContinue).Data
    
    if (-not $busDesc -or $busDesc -match '(?i)rndis|interface|composite') {
        $parentId = (Get-PnpDeviceProperty -InstanceId $targetId -KeyName "DEVPKEY_Device_Parent" -ErrorAction SilentlyContinue).Data
        if ($parentId) {
            $parentDesc = (Get-PnpDeviceProperty -InstanceId $parentId -KeyName "DEVPKEY_Device_BusReportedDeviceDesc" -ErrorAction SilentlyContinue).Data
            if ($parentDesc) { $busDesc = $parentDesc }
        }
    }

    if ($busDesc -and $busDesc -notmatch '(?i)interface|composite|android|device|rndis|cdc|ncm|ethernet|modem') {
        $phoneModel = $busDesc
    }
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
            "04E8" { $phoneBrand = "Samsung" }
            "18D1" { $phoneBrand = "Google" }
            "2B4B" { $phoneBrand = "Vivo" }
            "19D2" { $phoneBrand = "RedMagic" }
            "2E04" { $phoneBrand = "Tecno" }
            "12D1" { $phoneBrand = "Huawei" }
            "0E8D" { $phoneBrand = "MediaTek" }
            default { $phoneBrand = "Android" }
        }
    }
}

$output = [PSCustomObject]@{
    Devices = @($activeDevices | Select-Object @{Name="FriendlyName"; Expression={$_.Name}}, @{Name="InstanceId"; Expression={$_.DeviceID}}, @{Name="PNPClass"; Expression={$_.PNPClass}}, Status)
    Brand   = $phoneBrand
    Model   = $phoneModel
}

$output | ConvertTo-Json -Compress -Depth 2
