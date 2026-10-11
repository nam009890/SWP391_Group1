$files = Get-ChildItem -Path src\main\java\com\example\demo\*\controller\*.java -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    $modified = $false

    if ($content -match "@com.example.demo.common.security.CurrentUser") {
        $content = $content -replace "@com.example.demo.common.security.CurrentUser", "@CurrentUser"
        $modified = $true
    }

    if ($content -match "com.example.demo.common.security.UserPrincipal\b") {
        $content = $content -replace "com.example.demo.common.security.UserPrincipal\b", "UserPrincipal"
        $modified = $true
    }
    
    if ($content -match "com.example.demo.flashcard.dto.DeckResponse\b") {
        $content = $content -replace "com.example.demo.flashcard.dto.DeckResponse\b", "DeckResponse"
        $modified = $true
    }

    if ($modified) {
        # Check if imports are missing
        if ($content -notmatch "import com.example.demo.common.security.CurrentUser;") {
            $content = $content -replace "(package .+;`r?`n)", "$1`r`nimport com.example.demo.common.security.CurrentUser;"
        }
        if ($content -notmatch "import com.example.demo.common.security.UserPrincipal;") {
            $content = $content -replace "(package .+;`r?`n)", "$1`r`nimport com.example.demo.common.security.UserPrincipal;"
        }
        if ($content -match "\bDeckResponse\b" -and $content -notmatch "import com.example.demo.flashcard.dto.DeckResponse;") {
            $content = $content -replace "(package .+;`r?`n)", "$1`r`nimport com.example.demo.flashcard.dto.DeckResponse;"
        }
        
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated $($file.Name)"
    }
}
