# Script to fix broken layout files
$brokenFiles = @(
    "src\app\spaces\admin\application-list\layout.tsx",
    "src\app\spaces\emission-management\application-list\layout.tsx",
    "src\app\spaces\emission-management\ef-detailed-g\layout.tsx",
    "src\app\spaces\emission-management\emission-factor-version\layout.tsx",
    "src\app\spaces\emission-management\emission-factors\layout.tsx",
    "src\app\spaces\emission-management\ghg-types\layout.tsx",
    "src\app\spaces\emission-management\industry-classification\layout.tsx",
    "src\app\spaces\emission-management\normalized-activities\layout.tsx",
    "src\app\spaces\emission-management\standard-ecm-catalog\layout.tsx",
    "src\app\spaces\emission-management\standard-ecm-classification\layout.tsx",
    "src\app\spaces\emission-management\standard-emission-factors\layout.tsx",
    "src\app\spaces\emission-management\unit\layout.tsx",
    "src\app\spaces\emission-management\unit-conversion\layout.tsx",
    "src\app\spaces\system-config\geography\layout.tsx",
    "src\app\spaces\system-config\integration-marketplace\layout.tsx",
    "src\app\spaces\system-config\user-roles\layout.tsx"
)

foreach ($filePath in $brokenFiles) {
    $fullPath = Join-Path $PSScriptRoot ".." $filePath
    $fullPath = Resolve-Path $fullPath -ErrorAction SilentlyContinue
    if (-not $fullPath) {
        $fullPath = Join-Path (Get-Location) $filePath
    }
    
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Fix the broken function declaration pattern: "export default function\n  // SidebarProvider... LayoutName({"
        if ($content -match "export default function\s*\n\s*// SidebarProvider is now at the spaces/layout\.tsx level\s+(\w+)Layout\(") {
            $layoutName = $matches[1]
            $content = $content -replace "export default function\s*\n\s*// SidebarProvider is now at the spaces/layout\.tsx level\s+${layoutName}Layout\(", "export default function ${layoutName}Layout("
            $content = $content -replace "(\n\s*children:)", "`n  // SidebarProvider is now at the spaces/layout.tsx level`$1"
        }
        
        # Fix return statements that are broken
        $content = $content -replace "return\s*\(\s*\n\s*\{children\}", "return (`n    <div style={{ margin: 0, padding: 0, position: 'relative' }}>`n      {children}`n    </div>`n  )"
        $content = $content -replace "return\s*\(\s*\n\s*\{children\}\s*\n\s*\)", "return (`n    <div style={{ margin: 0, padding: 0, position: 'relative' }}>`n      {children}`n    </div>`n  )"
        
        Set-Content -Path $fullPath -Value $content -NoNewline
        Write-Host "Fixed: $filePath"
    }
}

Write-Host "Done!"

