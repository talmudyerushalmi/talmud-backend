import { generateOriginalText } from 'src/pages/inc/draftjsUtils';
import { createEditorContentFromText } from '../../inc/editorUtils';
import { SubLine } from 'src/pages/models/line.model';

export async function createSublineFromLine(): Promise<void> {
  for (let i = 0; i < this.lines.length; i++) {
    const sublines: SubLine[] = [];
    console.log(
      `${this.tractate} Line ${this.lines[i].lineNumber} subline ${i}`,
    );
    const leidenText = getTextForSynopsis(this.lines[i].mainLine);
    const nosach = createEditorContentFromText(leidenText);
    sublines.push({
      text: leidenText,
      index: i,
      nosach: nosach,
      synopsis: [],
      originalText: generateOriginalText(nosach),
    });
    this.lines[i].sublines = sublines;
  }
  this.markModified('lines');
  await this.save();
}

function getTextForSynopsis(str: string): string {
  const step1 = /(\(שם\)|''|\(.*?,.*?\)|<.*?>|\|.*?\||[.+:!{},])/g;
  const removeQuestionMark = /\?/g;
  const step2 = /[-]/g;
  const step3 = /"(?<![א-ת]"(?=[א-ת]\s+))/g; // כל הגרשיים בין שתי אותיות יש להשאיר
  const step4 = /\s+/g;

  return str
    ? str
        .replace(step1, '')
        .replace(removeQuestionMark, '')
        .replace(step2, ' ')
        .replace(step3, '')
        .replace(step4, ' ')
        .trim()
    : '';
}
