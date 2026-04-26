$content = Get-Content 'resources/js/Pages/Pos/Index.tsx' -Raw -Encoding UTF8
$start = '<div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#121212] text-slate-200 font-sans">'
$end = '      {/* Payment Modal */}'

$parts = $content -split [regex]::Escape($start)
if ($parts.Length -eq 2) {
    $afterParts = $parts[1] -split [regex]::Escape($end)
    if ($afterParts.Length -eq 2) {
        $newBlock = Get-Content 'new_block.txt' -Raw -Encoding UTF8
        # Ensure we maintain the exact whitespace padding for the end marker if it had any
        $final = $parts[0] + $newBlock + "`r`n      {/* Payment Modal */}" + $afterParts[1]
        Set-Content 'resources/js/Pages/Pos/Index.tsx' -Value $final -NoNewline -Encoding UTF8
        Write-Host "Success"
    } else {
        Write-Host "End marker not found exactly once. Found: " $afterParts.Length
    }
} else {
    Write-Host "Start marker not found exactly once. Found: " $parts.Length
}
