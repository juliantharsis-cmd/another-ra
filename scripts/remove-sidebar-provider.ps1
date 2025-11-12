# Script to remove SidebarProvider from all layout files
$layoutFiles = Get-ChildItem -Path "src\app\spaces" -Recurse -Filter "layout.tsx" | Where-Object { $_.FullName -notlike "*\spaces\layout.tsx" }

foreach ($file in $layoutFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Remove SidebarProvider import
    $content = $content -replace "import\s+\{\s*SidebarProvider\s*\}\s+from\s+['\`"]@/components/SidebarContext['\`"]\s*\n", ""
    
    # Remove SidebarProvider wrapper but keep children
    $content = $content -replace "<SidebarProvider>\s*\n\s*", ""
    $content = $content -replace "</SidebarProvider>", ""
    
    # Add comment if SidebarProvider was removed
    if ($content -ne $originalContent) {
        # Add comment after 'use client' or at the start of the function
        if ($content -match "('use client'[\s\S]*?export default function)") {
            $content = $content -replace "('use client'[\s\S]*?export default function)", "`$1`n  // SidebarProvider is now at the spaces/layout.tsx level"
        }
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Done!"

