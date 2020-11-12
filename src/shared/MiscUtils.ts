export default class MiscUtils {
    static firstWord(sentence: string): string{
        const words = sentence.trim().split(" ");
        return words[0]
    }
    static lastWord(sentence: string): string{
        const words = sentence.trim().split(" ");
        return words[words.length-1]
    }
}