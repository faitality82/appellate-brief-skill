// brief-sections.js — One function per brief section
const { Paragraph, TextRun, AlignmentType, UnderlineType } = require('docx');
const C = require('./brief-constants');
const P = require('./brief-paragraphs');

function coverPageSection(inputs) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: C.SPACING_DOUBLE,
      children: [new TextRun({ text: `STATE OF ${inputs.state.toUpperCase()}`, font: C.FONT, size: C.SIZE_BODY })],
    }),
    P.emptyLine(),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: C.SPACING_DOUBLE,
      children: [new TextRun({ text: `IN THE ${inputs.court.toUpperCase()}`, font: C.FONT, size: C.SIZE_BODY })],
    }),
    P.emptyLine(),
    P.emptyLine(),
    P.captionLine(`IN RE ${inputs.case_name.toUpperCase()}, MINOR`, `Court of Appeals No.: ${inputs.court_of_appeals_no}`),
    P.captionLine('', `Lower Court No.: ${inputs.lower_court_no}`),
    new Paragraph({
      spacing: C.SPACING_SINGLE,
      children: [new TextRun({ text: '_'.repeat(72), font: C.FONT, size: C.SIZE_BODY })],
    }),
    P.emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: C.SPACING_DOUBLE,
      children: [new TextRun({
        text: `${inputs.appellant_role.toUpperCase()}\u2019S BRIEF ON APPEAL`,
        font: C.FONT,
        size: C.SIZE_HEADING,
        bold: true,
        underline: { type: UnderlineType.SINGLE },
      })],
    }),
  ];

  if (inputs.oral_argument) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: C.SPACING_DOUBLE,
      children: [new TextRun({ text: 'ORAL ARGUMENT REQUESTED', font: C.FONT, size: C.SIZE_BODY, bold: true })],
    }));
  }

  children.push(
    P.emptyLine(), P.emptyLine(),
    P.bodyPara('Respectfully submitted,', { right: true, noIndent: true }),
    P.emptyLine(),
    P.bodyPara(`${inputs.attorney.name} (${inputs.attorney.bar_number})`, { right: true, noIndent: true, bold: true, single: true }),
    P.bodyPara(`Attorney for ${inputs.appellant_role}`, { right: true, noIndent: true, single: true }),
    P.bodyPara(inputs.attorney.address_line1, { right: true, noIndent: true, single: true }),
    P.bodyPara(inputs.attorney.address_line2, { right: true, noIndent: true, single: true }),
    P.bodyPara(inputs.attorney.phone, { right: true, noIndent: true, single: true }),
    P.pageBreak(),
  );
  return children;
}

function toRoman(num) {
  const vals = [10,9,5,4,1];
  const syms = ['X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
  }
  return result;
}

function estimatePageNumbers(inputs) {
  // If actual page numbers were provided (from two-pass generation), use those
  if (inputs.actual_page_numbers) {
    const apn = inputs.actual_page_numbers;
    return {
      facts: apn.facts || 1,
      argument: apn.argument || '',
      args: apn.args || inputs.arguments.map(() => ''),
      relief: apn.relief || '',
    };
  }

  const CHARS_PER_PAGE = 1500;
  const pages = {};
  let currentPage = 1;

  // Statement of Facts starts at page 1
  pages.facts = currentPage;
  const factsChars = inputs.facts_paragraphs.reduce((sum, p) => sum + p.length, 0);
  currentPage += Math.max(1, Math.ceil(factsChars / CHARS_PER_PAGE));

  // Argument section
  pages.argument = currentPage;
  pages.args = [];
  inputs.arguments.forEach((arg) => {
    pages.args.push(currentPage);
    const argChars = arg.heading.length + arg.body_paragraphs.reduce((sum, p) => sum + p.length, 0);
    currentPage += Math.max(1, Math.ceil(argChars / CHARS_PER_PAGE));
  });

  // Relief Requested
  pages.relief = currentPage;
  return pages;
}

function tableOfContentsSection(inputs) {
  const pg = estimatePageNumbers(inputs);
  const children = [
    P.sectionHeading('TABLE OF CONTENTS'),
    P.emptyLine(),
    P.tocEntry('STATEMENT OF JURISDICTION', 'iii'),
    P.tocEntry('INDEX OF AUTHORITIES', 'iv'),
    P.tocEntry('STATEMENT OF QUESTIONS INVOLVED', 'v'),
    P.tocEntry('STATEMENT OF FACTS', String(pg.facts)),
    P.tocEntry('ARGUMENT', String(pg.argument)),
  ];
  inputs.arguments.forEach((a, i) => {
    children.push(P.tocEntry(
      `${toRoman(i + 1)}.     ${a.heading}`,
      String(pg.args[i]),
      { indent: 720 }
    ));
  });
  children.push(P.tocEntry('RELIEF REQUESTED', String(pg.relief)));
  children.push(P.pageBreak());
  return children;
}

function jurisdictionSection(inputs) {
  return [
    P.sectionHeading('STATEMENT OF JURISDICTION'),
    P.emptyLine(),
    ...inputs.jurisdiction_paragraphs.map(t => P.bodyPara(t)),
    P.pageBreak(),
  ];
}

function indexOfAuthoritiesSection(inputs) {
  const auth = inputs.authorities || {};
  const cases = auth.cases || [];
  const statutes = auth.statutes || [];
  const rules = auth.rules || [];
  const children = [P.sectionHeading('INDEX OF AUTHORITIES'), P.emptyLine()];

  if (cases.length) {
    children.push(new Paragraph({
      spacing: C.SPACING_DOUBLE,
      children: [new TextRun({ text: 'CASES', font: C.FONT, size: C.SIZE_BODY, bold: true, underline: { type: UnderlineType.SINGLE } })],
    }));
    cases.forEach(c => children.push(P.tocEntry(c.citation, c.pages)));
    children.push(P.emptyLine());
  }
  if (statutes.length) {
    children.push(new Paragraph({
      spacing: C.SPACING_DOUBLE,
      children: [new TextRun({ text: 'STATUTES', font: C.FONT, size: C.SIZE_BODY, bold: true, underline: { type: UnderlineType.SINGLE } })],
    }));
    statutes.forEach(s => children.push(P.tocEntry(s.citation, s.pages)));
    children.push(P.emptyLine());
  }
  if (rules.length) {
    children.push(new Paragraph({
      spacing: C.SPACING_DOUBLE,
      children: [new TextRun({ text: 'COURT RULES', font: C.FONT, size: C.SIZE_BODY, bold: true, underline: { type: UnderlineType.SINGLE } })],
    }));
    rules.forEach(r => children.push(P.tocEntry(r.citation, r.pages)));
  }
  children.push(P.pageBreak());
  return children;
}

function questionsInvolvedSection(inputs) {
  return [
    P.sectionHeading('STATEMENT OF QUESTIONS INVOLVED'),
    P.emptyLine(),
    ...inputs.questions.flatMap(q =>
      P.questionInvolved(q.question, inputs.appellant_role, q.answer)
    ),
    P.pageBreak(),
  ];
}

function statementOfFactsSection(inputs) {
  return [
    P.sectionHeading('STATEMENT OF FACTS'),
    P.emptyLine(),
    ...inputs.facts_paragraphs.map(t => P.bodyPara(t)),
    P.pageBreak(),
  ];
}

function argumentSection(inputs) {
  const children = [P.sectionHeading('ARGUMENT'), P.emptyLine()];
  inputs.arguments.forEach((arg, i) => {
    children.push(P.argumentHeading(arg.heading));
    children.push(P.emptyLine());
    arg.body_paragraphs.forEach(t => children.push(P.bodyPara(t)));
    if (i < inputs.arguments.length - 1) children.push(P.emptyLine());
  });
  children.push(P.pageBreak());
  return children;
}

function reliefRequestedSection(inputs) {
  return [
    P.sectionHeading('RELIEF REQUESTED'),
    P.emptyLine(),
    ...inputs.relief_paragraphs.map(t => P.bodyPara(t)),
    P.emptyLine(),
    P.bodyPara('Respectfully submitted,', { right: true, noIndent: true }),
    P.emptyLine(),
    P.bodyPara(`${inputs.attorney.name} (${inputs.attorney.bar_number})`, { right: true, noIndent: true, bold: true, single: true }),
    P.bodyPara(`Attorney for ${inputs.appellant_role}`, { right: true, noIndent: true, single: true }),
  ];
}

function collectReviewItems(inputs) {
  const verifyItems = [];
  const needsItems = [];
  const allText = [
    ...inputs.jurisdiction_paragraphs,
    ...inputs.facts_paragraphs,
    ...inputs.arguments.flatMap(a => [a.heading, ...a.body_paragraphs]),
    ...inputs.relief_paragraphs,
  ];
  allText.forEach((text, i) => {
    if (text.includes('[VERIFY]')) {
      const match = text.match(/[A-Z][a-z].*?\[VERIFY\]/g) || [text.substring(0, 80)];
      match.forEach(m => verifyItems.push(m));
    }
    const needsMatches = text.match(/\[NEEDS:\s*[^\]]+\]/g);
    if (needsMatches) needsMatches.forEach(m => needsItems.push(m));
  });
  return { verifyItems, needsItems };
}

function reviewSummarySection(inputs) {
  const { verifyItems, needsItems } = collectReviewItems(inputs);
  if (verifyItems.length === 0 && needsItems.length === 0) return [];

  const children = [
    P.pageBreak(),
    P.sectionHeading('ATTORNEY REVIEW NOTES'),
    P.emptyLine(),
    P.bodyPara('The following items require attorney review before filing.', { noIndent: true }),
    P.emptyLine(),
  ];

  if (verifyItems.length > 0) {
    children.push(P.bodyPara('UNVERIFIED CITATIONS:', { bold: true, noIndent: true }));
    children.push(P.emptyLine());
    verifyItems.forEach((item, i) => {
      children.push(P.bodyPara(`${i + 1}. ${item}`, { noIndent: true }));
    });
    children.push(P.emptyLine());
  }

  if (needsItems.length > 0) {
    children.push(P.bodyPara('MISSING INFORMATION:', { bold: true, noIndent: true }));
    children.push(P.emptyLine());
    needsItems.forEach((item, i) => {
      children.push(P.bodyPara(`${i + 1}. ${item}`, { noIndent: true }));
    });
  }

  return children;
}

module.exports = {
  coverPageSection, tableOfContentsSection, jurisdictionSection,
  indexOfAuthoritiesSection, questionsInvolvedSection,
  statementOfFactsSection, argumentSection, reliefRequestedSection,
  reviewSummarySection,
};
