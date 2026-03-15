#!/usr/bin/env node
// generate-brief.js — Entry point. Reads inputs JSON, writes output .docx
// Usage: node scripts/generate-brief.js inputs.json output.docx

const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Footer, AlignmentType, PageNumber } = require('docx');
const C = require('./scripts/brief-constants');
const S = require('./scripts/brief-sections');

function makeFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: C.FONT, size: C.SIZE_BODY })],
    })],
  });
}

async function generateBrief(inputs, outputPath) {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: C.FONT, size: C.SIZE_BODY },
          paragraph: { spacing: C.SPACING_DOUBLE },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: C.PAGE.width, height: C.PAGE.height },
            margin: C.PAGE.margin,
            pageNumbers: { start: 1, formatType: 'lowerRoman' },
          },
        },
        footers: { default: makeFooter() },
        children: [
          ...S.coverPageSection(inputs),
          ...S.tableOfContentsSection(inputs),
          ...S.jurisdictionSection(inputs),
          ...S.indexOfAuthoritiesSection(inputs),
          ...S.questionsInvolvedSection(inputs),
        ],
      },
      {
        properties: {
          page: {
            size: { width: C.PAGE.width, height: C.PAGE.height },
            margin: C.PAGE.margin,
            pageNumbers: { start: 1, formatType: 'decimal' },
          },
        },
        footers: { default: makeFooter() },
        children: [
          ...S.statementOfFactsSection(inputs),
          ...S.argumentSection(inputs),
          ...S.reliefRequestedSection(inputs),
          ...S.reviewSummarySection(inputs),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Brief written to: ${outputPath}`);
}

const { execFileSync } = require('child_process');
const path = require('path');

async function twoPassGenerate(inputPath, outputPath) {
  const inputs = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  // Pass 1: generate with estimated page numbers
  const tempPath = outputPath.replace(/\.docx$/, '-temp.docx');
  await generateBrief(inputs, tempPath);
  console.log('Pass 1 complete. Extracting actual page numbers from Word...');

  // Extract real page numbers via Word COM automation
  const scriptPath = path.join(__dirname, 'scripts', 'extract-page-numbers.ps1');
  const rawJson = execFileSync('powershell', [
    '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-DocPath', tempPath
  ], { encoding: 'utf8' });
  const pageData = JSON.parse(rawJson);
  console.log('Extracted page numbers:', JSON.stringify(pageData, null, 2));

  // Build actual_page_numbers from Word's output
  // Word counts all pages sequentially across sections, but our body section
  // restarts numbering at page 1. Subtract front matter pages.
  const frontMatterPages = (pageData['STATEMENT OF FACTS'] || 1) - 1;
  const apn = {
    facts: (pageData['STATEMENT OF FACTS'] || 1) - frontMatterPages,
    argument: pageData['ARGUMENT'] ? pageData['ARGUMENT'] - frontMatterPages : '',
    relief: pageData['RELIEF REQUESTED'] ? pageData['RELIEF REQUESTED'] - frontMatterPages : '',
    args: (pageData.argument_headings || []).map(h => h.page - frontMatterPages),
  };

  inputs.actual_page_numbers = apn;

  // Pass 2: regenerate with real page numbers
  await generateBrief(inputs, outputPath);

  // Clean up temp file
  try { fs.unlinkSync(tempPath); } catch (e) { /* ignore */ }
  console.log('Two-pass generation complete with actual page numbers.');
}

const args = process.argv.slice(2);
const twoPass = args.includes('--two-pass');
const fileArgs = args.filter(a => !a.startsWith('--'));

if (fileArgs.length < 2) {
  console.error('Usage: node generate-brief.js <inputs.json> <output.docx> [--two-pass]');
  process.exit(1);
}

if (twoPass) {
  twoPassGenerate(fileArgs[0], fileArgs[1]).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
} else {
  const inputs = JSON.parse(fs.readFileSync(fileArgs[0], 'utf8'));
  generateBrief(inputs, fileArgs[1]).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
