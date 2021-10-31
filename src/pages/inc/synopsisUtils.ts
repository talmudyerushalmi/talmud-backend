
export function getTextForSynopsis(str: string): string {
    const step1 = /(\(שם\)|''|\(.*?,.*?\)|<.*?>|\|.*?\||[.+:?!{},])/g;
    const step2 = /[-]/g;
    const step3 = /"(?<!ת"(?=ל))/g // כל הגרשיים חוץ מ-ת״ל
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
  