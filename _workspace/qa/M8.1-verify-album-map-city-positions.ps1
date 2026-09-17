param(
  [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
)

# Validates the visual coordinate catalog against the rendered map asset. The
# SVG is illustrative, so a marker must land on its region-coloured pixels;
# latitude/longitude checks cannot prove that.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$asset = Join-Path $ProjectRoot 'frontend/src/assets/album-map-korea-six-regions.png'
$catalogFile = Join-Path $ProjectRoot 'frontend/src/features/photo-record/lib/albumMapCityPositions.ts'
$regionsFile = Join-Path $ProjectRoot 'frontend/src/features/photo-record/lib/koreaRegions.ts'

$referenceColors = @{
  CAPITAL = @(196, 216, 196)
  GANGWON = @(193, 216, 216)
  CHUNGCHEONG = @(228, 222, 183)
  JEOLLA = @(193, 216, 216)
  GYEONGSANG = @(194, 209, 186)
  JEJU = @(196, 211, 182)
}

$cityRegions = @{}
$regionSource = Get-Content $regionsFile -Raw
foreach ($region in [regex]::Matches($regionSource, "(?s)code: '([A-Z]+)'.*?cities: \[(.*?)\],\s*\r?\n\s*\},")) {
  $regionCode = $region.Groups[1].Value
  foreach ($city in [regex]::Matches($region.Groups[2].Value, "city\('([A-Z_]+)'")) {
    $cityRegions[$city.Groups[1].Value] = $regionCode
  }
}

$catalog = [regex]::Matches((Get-Content $catalogFile -Raw), '(?<code>[A-Z_]+): point\((?<left>\d+), (?<top>\d+)\)')
$catalogEntries = @{}
$catalog | ForEach-Object { $catalogEntries[$_.Groups['code'].Value] = $_ }
$bitmap = [System.Drawing.Bitmap]::new([string]$asset)
$failures = @()

function Test-GyeongsangPixel([int]$x, [int]$y) {
  if ($x -lt 0 -or $y -lt 0 -or $x -ge $bitmap.Width -or $y -ge $bitmap.Height) { return $false }
  $pixel = $bitmap.GetPixel($x, $y)
  $color = $referenceColors['GYEONGSANG']
  $distance = [math]::Sqrt([math]::Pow($pixel.R - $color[0], 2) + [math]::Pow($pixel.G - $color[1], 2) + [math]::Pow($pixel.B - $color[2], 2))
  return $distance -le 40
}

function Get-GyeongsangComponent([string]$code) {
  $entry = $catalogEntries[$code]
  $startX = [int]([double]$entry.Groups['left'].Value * $bitmap.Width / 100)
  $startY = [int]([double]$entry.Groups['top'].Value * $bitmap.Height / 100)
  if (-not (Test-GyeongsangPixel $startX $startY)) { throw "$code is not on a Gyeongsang map pixel" }

  $visited = [bool[]]::new($bitmap.Width * $bitmap.Height)
  $queue = [System.Collections.Generic.Queue[int]]::new()
  $startIndex = $startY * $bitmap.Width + $startX
  $visited[$startIndex] = $true
  $queue.Enqueue($startIndex)
  $count = 0

  while ($queue.Count) {
    $index = $queue.Dequeue()
    $count++
    $x = $index % $bitmap.Width
    $y = [math]::Floor($index / $bitmap.Width)
    foreach ($offset in @(@(-1, 0), @(1, 0), @(0, -1), @(0, 1))) {
      $nextX = $x + $offset[0]
      $nextY = $y + $offset[1]
      if ($nextX -lt 0 -or $nextY -lt 0 -or $nextX -ge $bitmap.Width -or $nextY -ge $bitmap.Height) { continue }
      $nextIndex = $nextY * $bitmap.Width + $nextX
      if ($visited[$nextIndex] -or -not (Test-GyeongsangPixel $nextX $nextY)) { continue }
      $visited[$nextIndex] = $true
      $queue.Enqueue($nextIndex)
    }
  }
  return [pscustomobject]@{ Visited = $visited; PixelCount = $count }
}

function Get-CatalogPixelIndex([string]$code) {
  $entry = $catalogEntries[$code]
  $x = [int]([double]$entry.Groups['left'].Value * $bitmap.Width / 100)
  $y = [int]([double]$entry.Groups['top'].Value * $bitmap.Height / 100)
  return $y * $bitmap.Width + $x
}
try {
  foreach ($entry in $catalog) {
    $code = $entry.Groups['code'].Value
    $regionCode = $cityRegions[$code]
    if (-not $regionCode) { $failures += "$code has no selectable region"; continue }
    $x = [int]([double]$entry.Groups['left'].Value * $bitmap.Width / 100)
    $y = [int]([double]$entry.Groups['top'].Value * $bitmap.Height / 100)
    $pixel = $bitmap.GetPixel($x, $y)
    $color = $referenceColors[$regionCode]
    $distance = [math]::Sqrt([math]::Pow($pixel.R - $color[0], 2) + [math]::Pow($pixel.G - $color[1], 2) + [math]::Pow($pixel.B - $color[2], 2))
    if ($distance -gt 40) { $failures += "$code ($regionCode) is outside its map colour at $x,$y" }
  }
  $busanComponent = Get-GyeongsangComponent 'BUSAN'
  if (-not $busanComponent.Visited[(Get-CatalogPixelIndex 'YANGSAN')]) { $failures += 'BUSAN and YANGSAN must resolve to the same Gyeongsang mainland component' }
  if ($busanComponent.Visited[(Get-CatalogPixelIndex 'GEOJE')]) { $failures += 'GEOJE must resolve to a separate Gyeongsang island component' }
} finally {
  $bitmap.Dispose()
}

if ($catalog.Count -ne $cityRegions.Count) { $failures += "catalog=$($catalog.Count), selectableCities=$($cityRegions.Count)" }
if ($failures.Count) { throw ($failures -join [Environment]::NewLine) }
Write-Output "Album map city positions passed: $($catalog.Count)/$($cityRegions.Count)"
