Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | Where-Object { 
    $_.FriendlyName -like "*ADB*" -or 
    $_.FriendlyName -like "*Bootloader*" -or 
    $_.FriendlyName -like "*Fastboot*" -or 
    $_.FriendlyName -like "*Preloader*" -or 
    $_.FriendlyName -like "*MediaTek*" -or 
    $_.FriendlyName -like "*VCOM*" -or
    $_.InstanceId -like "*VID_0E8D*" -or
    $_.InstanceId -like "*VID_18D1*"
} | Select-Object FriendlyName, InstanceId, Status, Class | ConvertTo-Json -Compress
