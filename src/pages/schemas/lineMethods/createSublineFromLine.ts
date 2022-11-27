import { createEditorContentFromText } from "src/pages/inc/editorUtils";
import { EditedText, SubLine, Synopsis } from "src/pages/models/line.model";


function createSynopsis(text: string): Synopsis {

    const editedText: EditedText = {
        simpleText: text,
        content: createEditorContentFromText(text)   

    }
    return {
        text: editedText,
        type: "direct_sources",
        name: "כתב יד ליידן",
        id: "leiden",
        code: "leiden",
        button_code: "leiden",
    }

}
export async function createSublineFromLine(): Promise<void> {
    
    for (let i = 0; i < this.lines.length; i++) {
      const sublines: SubLine[] = []
      console.log(`${this.tractate} Line ${this.lines[i].lineNumber} subline ${i}`);
      const leidenText = getTextForSynopsis(this.lines[i].mainLine)
      const synopsis: Synopsis = createSynopsis(leidenText)
      sublines.push({
        text: leidenText,
        index: i,
        nosach: createEditorContentFromText(leidenText),
        synopsis: [synopsis]
      })
      this.lines[i].sublines = sublines
    }
     this.markModified('lines');
     await this.save();
  };


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