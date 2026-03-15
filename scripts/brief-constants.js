// brief-constants.js — All formatting values from real Michigan brief
const { AlignmentType, TabStopType, TabStopPosition, UnderlineType } = require('docx');

const FONT = 'Arial';
const SIZE_BODY = 24;       // 12pt in half-points
const SIZE_HEADING = 32;    // 16pt
const SIZE_SUBHEAD = 28;    // 14pt

const PAGE = {
  width: 12240,
  height: 15840,
  margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
};

const SPACING_DOUBLE = { line: 480, lineRule: 'auto' };
const SPACING_SINGLE = { line: 240, lineRule: 'auto' };

const INDENT_FIRSTLINE = { firstLine: 720 };
const INDENT_BLOCKQUOTE = { left: 1080 };

const rPr_BODY = { font: FONT, size: SIZE_BODY };
const rPr_HEADING = { font: FONT, size: SIZE_HEADING, bold: true, underline: { type: UnderlineType.SINGLE } };
const rPr_SUBHEAD = { font: FONT, size: SIZE_SUBHEAD, bold: true, underline: { type: UnderlineType.SINGLE } };

module.exports = {
  FONT, SIZE_BODY, SIZE_HEADING, SIZE_SUBHEAD,
  PAGE, SPACING_DOUBLE, SPACING_SINGLE,
  INDENT_FIRSTLINE, INDENT_BLOCKQUOTE,
  rPr_BODY, rPr_HEADING, rPr_SUBHEAD,
};
