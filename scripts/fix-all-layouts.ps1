# Fix all broken layout files
$files = @(
    @{Path="src\app\spaces\admin\application-list\layout.tsx"; Name="ApplicationList"},
    @{Path="src\app\spaces\emission-management\application-list\layout.tsx"; Name="ApplicationList"},
    @{Path="src\app\spaces\emission-management\emission-factor-version\layout.tsx"; Name="EmissionFactorVersion"},
    @{Path="src\app\spaces\emission-management\emission-factors\layout.tsx"; Name="EmissionFactors"},
    @{Path="src\app\spaces\emission-management\ghg-types\layout.tsx"; Name="GHGTypes"},
    @{Path="src\app\spaces\emission-management\industry-classification\layout.tsx"; Name="IndustryClassification"},
    @{Path="src\app\spaces\emission-management\standard-ecm-catalog\layout.tsx"; Name="StandardECMCatalog"},
    @{Path="src\app\spaces\emission-management\standard-ecm-classification\layout.tsx"; Name="StandardECMClassification"},
    @{Path="src\app\spaces\emission-management\standard-emission-factors\layout.tsx"; Name="StandardEmissionFactors"},
    @{Path="src\app\spaces\emission-management\unit\layout.tsx"; Name="Unit"},
    @{Path="src\app\spaces\emission-management\unit-conversion\layout.tsx"; Name="UnitConversion"},
    @{Path="src\app\spaces\system-config\integration-marketplace\layout.tsx"; Name="IntegrationMarketplace"},
    @{Path="src\app\spaces\system-config\user-roles\layout.tsx"; Name="UserRoles"}
)

foreach ($fileInfo in $files) {
    $filePath = Join-Path (Get-Location) $fileInfo.Path
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        $layoutName = $fileInfo.Name
        
        # Fix broken function declaration
        $content = $content -replace "export default function\s*\n\s*// SidebarProvider is now at the spaces/layout\.tsx level\s+${layoutName}Layout\(", "export default function ${layoutName}Layout("
        
        # Add comment after function declaration if not present
        if ($content -notmatch "// SidebarProvider is now at the spaces/layout\.tsx level") {
            $content = $content -replace "(export default function ${layoutName}Layout\(\{)", "`$1`n  // SidebarProvider is now at the spaces/layout.tsx level"
        }
        
        # Fix broken return statements
        if ($content -match "return\s*\(\s*\n\s*\{children\}\s*\n\s*\)") {
            $content = $content -replace "return\s*\(\s*\n\s*\{children\}\s*\n\s*\)", "return (`n    <div style={{ margin: 0, padding: 0, position: 'relative' }}>`n      {children}`n    </div>`n  )"
        }
        
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "Fixed: $($fileInfo.Path)"
    }
}

Write-Host "Done!"

