import * as Diff from 'diff';
import 'colors';
import { Line, SubLine } from '../models/line.model';

export function getTextForSynopsis(str: string): string {
  const step1 = /(\(שם\)|''|\(.*?,.*?\)|<.*?>|\|.*?\||[.+:?!{},])/g;
  const step2 = /[-]/g;
  const step3 = /"(?<!ת"(?=ל))/g; // כל הגרשיים חוץ מ-ת״ל
  const step4 = /\s+/g;
  return str
    ? str
        .replace(step1, '')
        .replace(step2, ' ')
        .replace(step3, '')
        .replace(step4, ' ')
        .trim()
    : '';
}

export function tranformTextToLeiden(str: string): string {
  const step1 = /(\(שם\)|''|\(.*?,.*?\)|<.*?>|\|.*?\||[.+:!{},])/g;
  const removeQuestionMark = /\?/g;
  const step2 = /[-]/g;
  // const step3 = /"(?<![א-ת]"(?=[א-ת]\s+))/g; // כל הגרשיים בין שתי אותיות יש להשאיר
  const step4 = /\s+/g;

  return str
    ? str
        .replace(step1, '')
        .replace(removeQuestionMark, '')
        .replace(step2, ' ')
        //   .replace(step3, '')
        .replace(step4, ' ')
        .trim()
    : '';
}

export function getSynopsisText(
  subline: SubLine,
  synopsisName: string,
): string | undefined {
  return subline.synopsis.find(s => s.button_code === synopsisName)?.text
    ?.simpleText;
}

function reverse(str: string) {
  return str
    .split('')
    .reverse()
    .join('');
}

export function filterParallelSynopsis(line: Line) {
  for (const subline of line.sublines) {
    subline.synopsis = subline.synopsis.filter(
      s => s.type != 'parallel_source',
    );
  }
}



export function compareSynopsis(text1, text2: string) {
  const diff = Diff.diffChars(text1, text2);
  //   for (let i = diff.length; i<diff.length; i--) {
  //     const part = diff[i]
  //     const color = part.added ? 'green' : part.removed ? 'red' : 'grey';
  //     // console.log(reverse(part.value))
  //      process.stderr.write(reverse(part.value)[color]);
  //   }
  process.stderr.write('\n\n');

  diff.forEach(part => {
    // green for additions, red for deletions
    // grey for common parts
    const color = part.added ? 'green' : part.removed ? 'red' : 'grey';
    // console.log(reverse(part.value))
    process.stderr.write(reverse(part.value)[color]);
  });
  process.stderr.write('\n\n');

  console.log(diff);
}
