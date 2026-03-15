// brief-paragraphs.js — Factory functions for each paragraph type
const { Paragraph, TextRun, AlignmentType, TabStopType, TabStopPosition,
        PageBreak, UnderlineType, LeaderType } = require('docx');
const C = require('./brief-constants');

function emptyLine() {
  return new Paragraph({
    children: [new TextRun({ text: '', font: C.FONT, size: C.SIZE_BODY })],
    spacing: C.SPACING_DOUBLE,
  });
}

function parseVerifyMarkers(text, baseRunProps) {
  const parts = text.split(/(\[VERIFY\])/g);
  if (parts.length === 1) {
    return [new TextRun({ text, ...baseRunProps })];
  }
  return parts.filter(p => p.length > 0).map(part => {
    if (part === '[VERIFY]') {
      return new TextRun({
        text: '[VERIFY]',
        ...baseRunProps,
        bold: true,
        highlight: 'yellow',
      });
    }
    return new TextRun({ text: part, ...baseRunProps });
  });
}

function bodyPara(text, opts = {}) {
  const baseRunProps = {
    font: C.FONT,
    size: C.SIZE_BODY,
    bold: opts.bold || false,
  };
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : (opts.right ? AlignmentType.RIGHT : AlignmentType.BOTH),
    indent: opts.blockquote ? C.INDENT_BLOCKQUOTE : (opts.noIndent ? undefined : C.INDENT_FIRSTLINE),
    spacing: opts.single ? C.SPACING_SINGLE : C.SPACING_DOUBLE,
    children: parseVerifyMarkers(text, baseRunProps),
  });
}

function sectionHeading(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: C.SPACING_DOUBLE,
    children: [new TextRun({
      text: text.toUpperCase(),
      font: C.FONT,
      size: C.SIZE_HEADING,
      bold: true,
      underline: { type: UnderlineType.SINGLE },
    })],
  });
}

function argumentHeading(text) {
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: C.SPACING_DOUBLE,
    children: [new TextRun({
      text: text.toUpperCase(),
      font: C.FONT,
      size: C.SIZE_SUBHEAD,
      bold: true,
      underline: { type: UnderlineType.SINGLE },
    })],
  });
}

function captionLine(left, right) {
  const children = [new TextRun({ text: left, font: C.FONT, size: C.SIZE_BODY })];
  if (right) {
    children.push(new TextRun({ text: '\t', font: C.FONT, size: C.SIZE_BODY }));
    children.push(new TextRun({ text: right, font: C.FONT, size: C.SIZE_BODY }));
  }
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    spacing: C.SPACING_DOUBLE,
    children,
  });
}

function tocEntry(label, pageRef, opts = {}) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX, leader: LeaderType.DOT }],
    spacing: C.SPACING_DOUBLE,
    indent: opts.indent ? { left: opts.indent } : undefined,
    children: [
      new TextRun({ text: label, font: C.FONT, size: C.SIZE_BODY }),
      new TextRun({ text: '\t' + (pageRef || ''), font: C.FONT, size: C.SIZE_BODY }),
    ],
  });
}

function questionInvolved(question, party, answer) {
  return [
    new Paragraph({
      alignment: AlignmentType.BOTH,
      indent: C.INDENT_FIRSTLINE,
      spacing: C.SPACING_DOUBLE,
      children: [new TextRun({ text: question, font: C.FONT, size: C.SIZE_BODY, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.BOTH,
      indent: C.INDENT_FIRSTLINE,
      spacing: C.SPACING_DOUBLE,
      children: [new TextRun({ text: `The ${party} answers \u201C${answer}\u201D to the question.`, font: C.FONT, size: C.SIZE_BODY })],
    }),
    emptyLine(),
  ];
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

module.exports = {
  emptyLine, bodyPara, sectionHeading, argumentHeading,
  captionLine, tocEntry, questionInvolved, pageBreak,
};
