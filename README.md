# Appellate Brief Generator

A Claude Code skill that generates Michigan Court of Appeals appellate briefs as properly formatted `.docx` files matching [MCR 7.212](https://courts.michigan.gov/siteassets/rules-instructions-administrative-orders/michigan-court-rules/court-rules-book-ch-7-702-7213.pdf) requirements.

## What It Does

Give Claude your case documents and legal strategy. Four specialized AI subagents collaborate to produce a complete appellate brief draft:

1. **Case Analyst** — Reads uploaded court orders, transcripts, and pleadings to extract facts, parties, dates, and potential appealable issues
2. **Legal Researcher** — Researches applicable Michigan law, finds case precedent, verifies citations via web search
3. **Brief Writer** — Drafts all substantive sections with proper legal argumentation and Bluebook citations
4. **Assembler** — Compiles everything into the generator's JSON schema and produces the `.docx`

The generated brief includes all required sections in the correct order with proper formatting.

## Output Format

| Property | Value |
|---|---|
| Font | Arial 12pt |
| Line spacing | Double |
| Margins | 1 inch all sides |
| Body alignment | Justified |
| First-line indent | 0.5 inch |
| Section headings | Bold, underlined, 16pt, centered, ALL CAPS |
| Front matter pages | Roman numerals (i, ii, iii...) |
| Body pages | Arabic numerals starting at 1 |
| Page size | US Letter (8.5 x 11 in) |

## Brief Sections (in order)

1. Cover Page — state, court, case caption, brief title, attorney info
2. Table of Contents — with dot leaders and page numbers
3. Statement of Jurisdiction
4. Index of Authorities — Cases / Statutes / Court Rules with page references
5. Statement of Questions Involved — with appellant's Yes/No answers
6. Statement of Facts
7. Argument — one section per issue with ALL CAPS heading
8. Relief Requested
9. Attorney Review Notes *(only if unverified citations or missing info exist)*

## Requirements

- **Node.js** (v18+)
- **Claude Code** with the skill installed
- **Microsoft Word** *(optional, for accurate TOC page numbers via `--two-pass` mode)*

## Installation

### 1. Clone the repo

```bash
git clone https://github.com/faitality82/appellate-brief-skill.git
cd appellate-brief-skill
npm install
```

### 2. Install the Claude Code skill

Copy the skill files to your Claude Code skills directory:

```bash
# Windows
xcopy /E /I skills\appellate-brief %USERPROFILE%\.claude\skills\appellate-brief

# macOS/Linux
cp -r skills/appellate-brief ~/.claude/skills/appellate-brief
```

Then update the file paths in `SKILL.md` and `agents/assembler.md` to point to your local clone of the repo (the path to `generate-brief.js`).

### 3. (Optional) Set up citation verification

For automated case law citation verification, get a free API token from [CourtListener](https://www.courtlistener.com/) and add to your Claude Code MCP config:

```json
{
  "courtlistener": {
    "command": "npx",
    "args": ["-y", "courtlistener-mcp@latest"],
    "env": {
      "COURTLISTENER_API_KEY": "YOUR_TOKEN_HERE"
    }
  }
}
```

## Usage

### With Claude Code (recommended)

Just tell Claude to write a brief:

```
/appellate-brief
```

Or describe your case naturally:

> "I need to write an appellate brief for a Michigan Court of Appeals case.
> The trial court terminated my client's parental rights without providing
> reasonable reunification efforts..."

Claude will guide you through providing case details, research the law, draft the brief, and generate the `.docx`.

### Standalone Generator

If you already have your brief content prepared as JSON, you can run the generator directly:

```bash
# Single-pass (estimated page numbers)
node generate-brief.js inputs.json output.docx

# Two-pass (opens Word to get actual page numbers for TOC)
node generate-brief.js inputs.json output.docx --two-pass
```

See `scripts/sample-inputs.json` for the complete input schema.

## Input JSON Schema

```json
{
  "state": "Michigan",
  "court": "Michigan Court of Appeals",
  "case_name": "C Walters",
  "court_of_appeals_no": "369318",
  "lower_court_no": "2023-002237-NA",
  "appellant_role": "Respondent Mother",
  "oral_argument": true,
  "attorney": {
    "name": "JANE A. SMITH",
    "bar_number": "P12345",
    "address_line1": "100 Main Street, Suite 200",
    "address_line2": "Battle Creek, MI 49017",
    "phone": "(269) 555-1234"
  },
  "questions": [
    { "question": "DID THE TRIAL COURT ERR BY...", "answer": "Yes" }
  ],
  "jurisdiction_paragraphs": ["..."],
  "authorities": {
    "cases": [{ "citation": "In re Sours, 459 Mich 624; 593 NW2d 520 (1999)", "pages": "6, 7" }],
    "statutes": [{ "citation": "MCL 712A.19b(3)(a)(ii)", "pages": "3, 4" }],
    "rules": [{ "citation": "MCR 7.203(A)(3)", "pages": "iii" }]
  },
  "facts_paragraphs": ["..."],
  "arguments": [
    { "heading": "THE TRIAL COURT ERRED BY...", "body_paragraphs": ["..."] }
  ],
  "relief_paragraphs": ["..."]
}
```

## Two-Pass Page Numbers

By default, the generator estimates TOC page numbers based on content length (~1,500 characters per page). For exact page numbers, use `--two-pass`:

1. **Pass 1** — Generates the brief with estimated page numbers
2. **Extraction** — Opens the doc in Word (hidden via PowerShell COM automation), iterates through paragraphs to find each section heading, reads Word's actual page number for each
3. **Pass 2** — Regenerates with the real page numbers

This requires Microsoft Word to be installed. If Word is not available, the generator falls back to estimates.

## Citation Verification

The skill marks citations with verification status:

- **VERIFIED** — Citation confirmed via web search or CourtListener
- **UNVERIFIED** — Could not confirm; marked with `[VERIFY]` in the document (rendered as yellow-highlighted bold text)
- **`[NEEDS: ...]`** — Placeholder for missing information the attorney must provide

The generated brief includes an **Attorney Review Notes** section at the end listing all items requiring review.

## Citation Format

All citations follow [Bluebook](https://www.legalbluebook.com/) format adapted for Michigan practice:

- **Cases**: `In re Sours, 459 Mich 624, 630; 593 NW2d 520 (1999)`
- **Statutes**: `MCL 712A.19b(3)(a)(ii)`
- **Court Rules**: `MCR 7.203(A)(3)`
- Parallel citations required (Mich + NW2d)
- Pinpoint cites for all quotations and specific propositions

See `skills/appellate-brief/agents/bluebook-reference.md` for the complete citation guide.

## Project Structure

```
appellate-brief-skill/
├── generate-brief.js              # Entry point — reads JSON, produces .docx
├── package.json
├── scripts/
│   ├── brief-constants.js         # Formatting values (fonts, sizes, margins)
│   ├── brief-paragraphs.js        # Factory functions for paragraph types
│   ├── brief-sections.js          # One function per brief section
│   ├── extract-page-numbers.ps1   # PowerShell script for Word COM page extraction
│   └── sample-inputs.json         # Example input JSON
└── skills/
    └── appellate-brief/
        ├── SKILL.md                # Claude Code skill orchestrator
        └── agents/
            ├── assembler.md        # Agent 4: compiles JSON + generates .docx
            ├── bluebook-reference.md  # Shared Bluebook citation format guide
            ├── brief-writer.md     # Agent 3: drafts all brief sections
            ├── case-analyst.md     # Agent 1: extracts facts from documents
            └── legal-researcher.md # Agent 2: researches Michigan law
```

## Disclaimer

This tool generates **draft** documents for attorney review. It does not provide legal advice. All generated content, citations, and legal arguments must be reviewed and verified by a licensed attorney before filing. Unverified citations are clearly marked in the output.

## License

ISC
