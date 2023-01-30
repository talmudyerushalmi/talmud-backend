export default class MiscUtils {
    static firstWord(sentence: string): string{
        const words = sentence.trim().split(" ");
        return words[0]
    }
    static lastWord(sentence: string): string{
        const words = sentence.trim().split(" ");
        return words[words.length-1]
    }

    static hebrewMap = new Map([
        [0, 'כל הפרק'],
        [1, 'א'],
        [2, 'ב'],
        [3, 'ג'],
        [4, 'ד'],
        [5, 'ה'],
        [6, 'ו'],
        [7, 'ז'],
        [8, 'ח'],
        [9, 'ט'],
        [10, 'י'],
        [11, 'יא'],
        [12, 'יב'],
        [13, 'יג'],
        [14, 'יד'],
        [15, 'טו'],
        [16, 'טז'],
        [17, 'יז'],
        [18, 'יח'],
        [19, 'יט'],
        [20, 'כ'],
        [21, 'כא'],
        [22, 'כב'],
        [23, 'כג'],
      ]); 
}