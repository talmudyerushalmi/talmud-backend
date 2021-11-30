import { RawDraftContentBlock, RawDraftContentState, RawDraftEntity } from "draft-js";
import * as _ from 'lodash';


export function getTextFromEditorContent(content: RawDraftContentState): string{
    if (content===null) {return ""}
    const t = content.blocks.reduce((carrier,b)=> carrier + " " + b.text,"").trim();

    return t
}

export function addBlockToContentState(
  rawDraftContent: RawDraftContentState,
  block: RawDraftContentBlock,
  entityMap: { [key: string]: RawDraftEntity }): RawDraftContentState {

  const lastBlock = rawDraftContent.blocks[rawDraftContent.blocks.length-1]
  const size = Object.keys(lastBlock.entityRanges).length;

  const newEntityRanges = block.entityRanges.map(e => {
    const mapped = {
    offset: e.offset+lastBlock.text.length+1,
    length: e.length,
    key: e.key + size
    }
    return mapped;
  });
  lastBlock.text+= ' ' +block.text.replace(/[\n\r]+/g, '');
  lastBlock.entityRanges.push(...newEntityRanges);

  const newEntityMap = _.mapKeys(entityMap, (_, key) => {
    return parseInt(key) + size;
  });

 return {
   blocks: [lastBlock],
   entityMap: Object.assign(rawDraftContent.entityMap, newEntityMap)
 }
}

export function createContentFromBlock(block: RawDraftContentBlock,
   entityMap: { [key: string]: RawDraftEntity }): RawDraftContentState {
  return {
    blocks: [block],
    entityMap
  }
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