$devices = Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | Where-Object { 
    $_.FriendlyName -like "*ADB*" -or 
    $_.FriendlyName -like "*Bootloader*" -or 
    $_.FriendlyName -like "*Fastboot*" -or 
    $_.FriendlyName -like "*Preloader*" -or 
    $_.FriendlyName -like "*MediaTek*" -or 
    $_.FriendlyName -like "*VCOM*" -or
    $_.Class -eq "AndroidUsbDeviceClass" -or
    $_.InstanceId -like "*VID_0E8D*" -or
    $_.InstanceId -like "*VID_18D1*" -or
    $_.InstanceId -like "*VID_2717*" -or
    $_.InstanceId -like "*VID_22D9*" -or
    $_.InstanceId -like "*VID_22B8*" -or
    $_.InstanceId -like "*VID_04E8*"
}

if (-not $devices) {
    exit 0
}

# Collect all connected devices for companion lookup
$allPresent = Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue
$phoneModel = $null
$phoneBrand = $null

foreach ($dev in $devices) {
    # 1. LIVE HARDWARE DESCRIPTOR: Directly query what the phone hardware reported to Windows USB bus!
    $busDesc = (Get-PnpDeviceProperty -InstanceId $dev.InstanceId -KeyName "DEVPKEY_Device_BusReportedDeviceDesc" -ErrorAction SilentlyContinue).Data
    $mfg = (Get-PnpDeviceProperty -InstanceId $dev.InstanceId -KeyName "DEVPKEY_Device_Manufacturer" -ErrorAction SilentlyContinue).Data

    if ($busDesc -and $busDesc -notmatch '(?i)interface|composite|android usb|winusb|host controller') {
        $phoneModel = $busDesc
    }

    if ($mfg -and $mfg -notmatch '(?i)standard|microsoft|generic') {
        $phoneBrand = $mfg
    }

    # 2. Check WPD (Windows Portable Devices) companion if model not found yet
    if (-not $phoneModel -and ($dev.InstanceId -match '(VID_[0-9A-Fa-f]{4})')) {
        $vid = $matches[1]
        $companion = $allPresent | Where-Object { 
            ($_.Class -eq "WPD" -or $_.Class -eq "PortableDevice") -and $_.InstanceId -like "*$vid*" 
        } | Select-Object -First 1

        if ($companion) {
            if (-not $phoneModel -and $companion.FriendlyName -notmatch '(?i)interface|composite') { 
                $phoneModel = $companion.FriendlyName 
            }
            if (-not $phoneBrand -and $companion.Manufacturer -notmatch '(?i)standard|microsoft') { 
                $phoneBrand = $companion.Manufacturer 
            }
        }
    }

    # 3. Fallback to USB Vendor ID database for brand
    if (-not $phoneBrand -and ($dev.InstanceId -match '(VID_[0-9A-Fa-f]{4})')) {
        $vid = $matches[1]
        switch ($vid) {
            "VID_22B8" { $phoneBrand = "Motorola" }
            "VID_22D9" { $phoneBrand = "OnePlus / OPPO" }
            "VID_2A70" { $phoneBrand = "OnePlus" }
            "VID_2717" { $phoneBrand = "Xiaomi / POCO" }
            "VID_04E8" { $phoneBrand = "Samsung" }
            "VID_18D1" { $phoneBrand = "Google" }
            "VID_2B4B" { $phoneBrand = "Vivo / iQOO" }
            "VID_19D2" { $phoneBrand = "RedMagic / ZTE" }
            "VID_2E04" { $phoneBrand = "Tecno / Infinix" }
            "VID_12D1" { $phoneBrand = "Huawei / Honor" }
            "VID_0B05" { $phoneBrand = "ASUS" }
            "VID_0FCE" { $phoneBrand = "Sony" }
            "VID_05C6" { $phoneBrand = "Qualcomm Device" }
            "VID_0E8D" { $phoneBrand = "MediaTek Device" }
            default    { $phoneBrand = "Android" }
        }
    }
}

$output = [PSCustomObject]@{
    Devices = @($devices | Select-Object FriendlyName, InstanceId, Status, Class)
    Brand   = $phoneBrand
    Model   = $phoneModel
}

$output | ConvertTo-Json -Compress -Depth 3
