import { RawDraftContentState } from "draft-js";



export function getTextFromEditorContent(content: RawDraftContentState): string{
    const t = content.blocks.reduce((carrier,b)=> carrier + " " + b.text,"").trim();

    return t
}


export function createEditorContentFromText(text: string): RawDraftContentState {
    return {
    blocks:[
        {
          depth:0,
          data:{},
          entityRanges: [],
          inlineStyleRanges:[],
          key: "aaaaa",
          text: text,
          type: 'unstyled'
        }
      ],
      entityMap: {}
    }
}