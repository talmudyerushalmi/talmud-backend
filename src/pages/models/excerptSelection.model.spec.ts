import { ExcerptSelection, getSublineSelection, getWordOccurenceOffsets } from './excerptSelection.model';

const line5 = {
  sugiaName: '',
  mainLine: '',
  sublines: [
    {
      index: 10,
      synopsis: [],
      text: 'this dog is the first, this dog is the second',
    },
    {
      index: 11,
      synopsis: [],
      text: 'this dog is the third',
    },
    {
      index: 12,
      synopsis: [],
      text: 'this dog is the fourth, cat is the first',
    },
    {
      index: 13,
      synopsis: [],
      text: 'this cat is the second',
    },
  ],
};

const line7 = {
  sugiaName: '',
  mainLine: '',
  sublines: [
    {
      index: 17,
      synopsis: [],
      text: 'another dog, another cat',
    },
    {
      index: 18,
      synopsis: [],
      text: 'and cat',
    },
  ],
};
describe('Excerpt Selection', () => {
  it('selection', () => {
    const selection = new ExcerptSelection({
      fromLine: 5,
      fromOffset: 4,
      fromWord: 'dog',
      fromWordOccurence: 3,
      fromWordTotal: 4,
      toLine: 7,
      toWord: 'cat',
      toWordOccurence: 2,
      toWordTotal: 2,
      toOffset: 10,
    });

    selection.updateSublines(line5, line7);
    expect(selection.fromSubline).toBe(11);
    expect(selection.toSubline).toBe(18);
  });
  it('selection2', () => {
    const line = {
      mainLine: "Ff",
      lineNumber: "00074",
      sublines: [
          {
              text: "ר' ירמיה בעי: ותהא צרה מן השוק? ",
              index: 8,
              synopsis:[]
          },
          {
              text: "אמ' ר' יוסה: \r",
              index: 9,
              synopsis:[]
          },
          {
              text: "לא שמיע ר' ירמיה הדא דתני ר' חייה. \r",
              index: 10,
              synopsis:[]
          },
          {
              text: "לא שמיע למתניתין: מפני שהן נשואות לאחרים צרותיהן מותרות. \r",
              index: 11,
              synopsis:[]
          },
          {
              text: "חזר ומר: אין דשמיע, אלא כאינש דשמיע מילה ומקשי עלה. \r",
              index: 12,
              synopsis:[]
          }
      ],
      sugiaName: null
  }
    const selection = new ExcerptSelection({
      fromLine: 2,
      fromWord: "לא",
      fromWordOccurence: 1,
      fromWordTotal: null,
      fromOffset: 80,
      toLine: 2,
      toWord: "מותרות",
      toWordOccurence: 1,
      toWordTotal: null,
      toOffset: 139,      
    });

    selection.updateSublines(line, line);
    expect(selection.fromSubline).toBe(10);
    expect(selection.toSubline).toBe(11);
  });
  it('getWordOccurenceOffsets', ()=>{
    expect(getWordOccurenceOffsets("Looking for dog and dog","dog")).toEqual([12,20])
  })
  it('getSubline', ()=>{
    expect(getSublineSelection(line5,"dog",1)).toEqual([10,1])
    expect(getSublineSelection(line5,"dog",2)).toEqual([10,2])
    expect(getSublineSelection(line5,"dog",3)).toEqual([11,1])
    expect(getSublineSelection(line5,"dog",4)).toEqual([12,1])
  })
});
