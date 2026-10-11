# Fast query via CimInstance (< 800ms)
$query = "SELECT DeviceID, Name, Manufacturer, Status, Present FROM Win32_PnPEntity WHERE Present = True AND (PNPClass = 'AndroidUsbDeviceClass' OR PNPClass = 'WPD' OR (PNPClass = 'Ports' AND (Name LIKE '%MediaTek%' OR Name LIKE '%Preloader%' OR Name LIKE '%VCOM%')) OR DeviceID LIKE 'USB\\VID_22B8%' OR DeviceID LIKE 'USB\\VID_22D9%' OR DeviceID LIKE 'USB\\VID_2717%' OR DeviceID LIKE 'USB\\VID_04E8%' OR DeviceID LIKE 'USB\\VID_18D1%' OR DeviceID LIKE 'USB\\VID_0E8D%')"

$rawDevices = Get-CimInstance -Query $query -ErrorAction SilentlyContinue

if (-not $rawDevices) {
    exit 0
}

$activeDevices = @()
$phoneModel = $null
$phoneBrand = $null

foreach ($d in $rawDevices) {
    $id = ($d.DeviceID -as [string])
    $name = ($d.Name -as [string])
    $mfg = ($d.Manufacturer -as [string])

    if ($name -like "*ADB*" -or $name -like "*Bootloader*" -or $name -like "*Fastboot*" -or $name -like "*Preloader*" -or $name -like "*MediaTek*" -or $name -like "*VCOM*" -or $id -match 'VID_0E8D|VID_18D1') {
        $activeDevices += $d
    }

    if ($name -notmatch '(?i)interface|composite|hub|controller|winusb' -and $mfg -notmatch '(?i)standard|microsoft') {
        $phoneModel = $name
        $phoneBrand = $mfg
    }
}

if ($activeDevices.Count -eq 0) {
    $activeDevices = @($rawDevices | Where-Object { $_.DeviceID -match 'VID_22B8|VID_22D9|VID_2717|VID_04E8|VID_18D1|VID_0E8D' -and $_.Name -notlike "*Host Controller*" })
}

if (-not $activeDevices -or $activeDevices.Count -eq 0) {
    exit 0
}

# If phoneModel is still missing, query DEVPKEY_Device_BusReportedDeviceDesc for the first active device
if (-not $phoneModel -and $activeDevices.Count -gt 0) {
    $targetId = $activeDevices[0].DeviceID
    $busDesc = (Get-PnpDeviceProperty -InstanceId $targetId -KeyName "DEVPKEY_Device_BusReportedDeviceDesc" -ErrorAction SilentlyContinue).Data
    if ($busDesc -and $busDesc -notmatch '(?i)interface|composite|android|device') {
        $phoneModel = $busDesc
    }
}

# Fallback to known USB Vendor ID if brand is missing
if (-not $phoneBrand -and $activeDevices.Count -gt 0) {
    $firstId = $activeDevices[0].DeviceID
    if ($firstId -match 'VID_([0-9A-Fa-f]{4})') {
        switch ($matches[1]) {
            "22B8" { $phoneBrand = "Motorola" }
            "22D9" { $phoneBrand = "OnePlus" }
            "2A70" { $phoneBrand = "OnePlus" }
            "2717" { $phoneBrand = "Xiaomi" }
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
    Devices = @($activeDevices | Select-Object @{Name="FriendlyName"; Expression={$_.Name}}, @{Name="InstanceId"; Expression={$_.DeviceID}}, Status)
    Brand   = $phoneBrand
    Model   = $phoneModel
}

$output | ConvertTo-Json -Compress -Depth 2
