$file = "C:\Users\meski\Desktop\aw139\W&B records.txt"
$content = Get-Content $file -Raw
$lines = $content -split "`r`n|`n"

function Convert-ToStandardDate {
    param([string]$d)
    $parts = $d -split '/'
    if ($parts.Count -eq 3) {
        $y = $parts[2]
        if ($y.Length -gt 4) { $y = $y.Substring(0,4) }
        return "$y-$($parts[1].PadLeft(2,'0'))-$($parts[0].PadLeft(2,'0'))"
    }
    return $d
}

function Parse-Num {
    param([string]$v)
    $v = $v.Trim()
    if ($v -eq '' -or $v -eq '*' -or $v -eq '=' -or $v -eq '/' -or $v -eq '-') { return 0 }
    $v = $v -replace ',', ''
    $n = 0
    if ([double]::TryParse($v, [System.Globalization.NumberStyles]::Any, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$n)) { return $n }
    return 0
}

function Get-Action {
    param([string]$d)
    $u = $d.ToUpper().Trim()
    if ($u -match '^(REMOVED|CARGO HOOK REMOVED|TR BLADES REMOVED)') { return 'OUT' }
    if ($u -match '^(INSTALLED|INSTALED|TR BLADES INSTALLED|INSTALLER)') { return 'IN' }
    return 'IN'
}

$result = @{}
$currentReg = $null
$regPattern = '^(7T-VW[GHEI])'

foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if ($trimmed -eq '') { continue }
    
    $m = [regex]::Match($trimmed, $regPattern)
    if ($m.Success) {
        $currentReg = $m.Groups[1].Value
        if (-not $result.ContainsKey($currentReg)) { $result[$currentReg] = @() }
        continue
    }
    
    if ($currentReg -eq $null) { continue }
    
    if ($trimmed -match '^(\d{1,2}/\d{1,2}/\d{2,4})') {
        $dateStr = $matches[1]
        $stdDate = Convert-ToStandardDate -d $dateStr
        $rest = $line.Substring($matches[0].Length)
        
        # Split by tabs and filter empties
        $parts = $rest -split "`t" | Where-Object { $_ -ne $null -and $_.Trim() -ne '' }
        
        if ($parts.Count -lt 6) { continue }
        
        # Skip first 0-2 parts (V markers), rest is denomination + numbers
        $vSkip = 0
        foreach ($p in $parts) {
            if ($p.Trim() -eq 'V') { $vSkip++ } else { break }
        }
        $parts = $parts[$vSkip..($parts.Count-1)]
        if ($parts.Count -lt 6) { continue }
        
        # Find all numeric values in the joined text
        $fullJoin = $parts -join ' '
        $nums = [regex]::Matches($fullJoin, '-?\d+\.?\d*') | ForEach-Object { $_.Value }
        
        if ($nums.Count -eq 10) {
            # Standard record with 5 change + 5 total fields
            $denomEndIdx = $fullJoin.LastIndexOf($nums[0])
            $denomPart = $fullJoin.Substring(0, $denomEndIdx).Trim()
            $sigStartIdx = $fullJoin.LastIndexOf($nums[-1]) + $nums[-1].Length
            $signature = $fullJoin.Substring($sigStartIdx).Trim()
            
            $rec = @{
                date = $stdDate
                action = Get-Action $denomPart
                denomination = $denomPart
                weightChange_kg = [double]$nums[0]
                staCg_mm = [double]$nums[1]
                longMoment_kgmm = [double]$nums[2]
                blCg_mm = [double]$nums[3]
                latMoment_kgmm = [double]$nums[4]
                totalWeight_kg = [double]$nums[5]
                totalLongMoment_kgmm = [double]$nums[6]
                totalStaCg_mm = [double]$nums[7]
                totalLatMoment_kgmm = [double]$nums[8]
                totalBlCg_mm = [double]$nums[9]
                signature = $signature
            }
            $result[$currentReg] += $rec
        }
        elseif ($nums.Count -eq 5) {
            # Only total fields (empty weight, etc.)
            # Denomination is everything before the first number
            $denomEndIdx = $fullJoin.LastIndexOf($nums[0])
            $denomPart = $fullJoin.Substring(0, $denomEndIdx).Trim()
            $sigStartIdx = $fullJoin.LastIndexOf($nums[-1]) + $nums[-1].Length
            $signature = $fullJoin.Substring($sigStartIdx).Trim()
            
            $rec = @{
                date = $stdDate
                action = 'IN'
                denomination = $denomPart
                weightChange_kg = 0
                staCg_mm = 0
                longMoment_kgmm = 0
                blCg_mm = 0
                latMoment_kgmm = 0
                totalWeight_kg = [double]$nums[0]
                totalLongMoment_kgmm = [double]$nums[1]
                totalStaCg_mm = [double]$nums[2]
                totalLatMoment_kgmm = [double]$nums[3]
                totalBlCg_mm = [double]$nums[4]
                signature = $signature
            }
            $result[$currentReg] += $rec
        }
    }
}

# Sort records by date for each registration
foreach ($reg in $result.Keys) {
    $result[$reg] = $result[$reg] | Sort-Object date
}

# Generate output
$js = "// Paste each section in the browser console on the app page`n`n"
foreach ($reg in $result.Keys) {
    $json = $result[$reg] | ConvertTo-Json -Depth 5
    $key = $reg -replace '-', '_'
    $js += "const RECORDS_$key = $json;`n"
    $js += "localStorage.setItem('aw139_maint_$reg', JSON.stringify(RECORDS_$key));`n"
    $js += "console.log('$reg records stored!');`n`n"
}

$js | Out-File -FilePath "C:\Users\meski\Desktop\aw139\aw139-auth\seed-all-helicopters.js" -Encoding utf8

Write-Host "Done! Generated records for:"
$result.Keys | ForEach-Object { Write-Host "- $_ ($($result[$_].Count) records)" }
