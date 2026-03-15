# extract-page-numbers.ps1
# Opens a .docx in Word (hidden), finds section headings by iterating paragraphs,
# returns actual page numbers as JSON.
# Usage: powershell -File extract-page-numbers.ps1 -DocPath "C:\path\to\brief.docx"

param(
    [Parameter(Mandatory=$true)]
    [string]$DocPath
)

$ErrorActionPreference = "Stop"

$word = $null
$doc = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0  # wdAlertsNone

    $doc = $word.Documents.Open([System.IO.Path]::GetFullPath($DocPath), $false, $true)

    $result = @{}
    $argHeadings = [System.Collections.ArrayList]@()
    $inArgumentSection = $false
    $pastTOC = $false

    foreach ($para in $doc.Paragraphs) {
        $text = $para.Range.Text.Trim()
        $isBold = ($para.Range.Font.Bold -eq -1)
        $isUnderline = ($para.Range.Font.Underline -ne 0)

        # Skip until we're past the Table of Contents
        if ($text -eq "TABLE OF CONTENTS" -and $isBold -and $isUnderline) {
            $pastTOC = $true
            continue
        }
        if (-not $pastTOC) { continue }

        # Only look at bold+underlined headings (section headings and argument headings)
        if (-not ($isBold -and $isUnderline)) { continue }

        $pageNum = $para.Range.Information(3)  # wdActiveEndPageNumber

        switch ($text) {
            "STATEMENT OF JURISDICTION" { $result["STATEMENT OF JURISDICTION"] = $pageNum }
            "INDEX OF AUTHORITIES"      { $result["INDEX OF AUTHORITIES"] = $pageNum }
            "STATEMENT OF QUESTIONS INVOLVED" { $result["STATEMENT OF QUESTIONS INVOLVED"] = $pageNum }
            "STATEMENT OF FACTS"        { $result["STATEMENT OF FACTS"] = $pageNum }
            "ARGUMENT"                  { $result["ARGUMENT"] = $pageNum; $inArgumentSection = $true }
            "RELIEF REQUESTED"          { $result["RELIEF REQUESTED"] = $pageNum; $inArgumentSection = $false }
            default {
                # If we're in the argument section, this is an argument sub-heading
                if ($inArgumentSection -and $text.Length -gt 20) {
                    $null = $argHeadings.Add(@{ text = $text; page = $pageNum })
                }
            }
        }
    }

    $result["argument_headings"] = $argHeadings.ToArray()

    # Output as JSON
    $result | ConvertTo-Json -Depth 3

} finally {
    if ($doc) {
        $doc.Close($false)
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
    }
    if ($word) {
        $word.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
