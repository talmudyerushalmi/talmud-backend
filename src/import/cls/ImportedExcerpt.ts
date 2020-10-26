import { Injectable } from "@nestjs/common";
import { MishnaRepository } from "src/pages/mishna.repository";
import * as numeral from 'numeral';


@Injectable()
export default class ImportedExcerpt {
    fromLine:string;
    toLine:string;
    toWord: string;
    toWordIndex: string;
    fromWord: string;
    fromWordIndex: string;
    excerpt: string;
    constructor(
        private mishnaRepo: MishnaRepository,
    ){

    }
    fromLineFormatted():string{
        if (this.fromLine === '0') return null;
        // 1 line offset in importing
        return numeral(parseInt(this.fromLine)-1).format('00000')
    }
    toLineFormatted():string{
        if (!this.toLine) {
            return this.fromLineFormatted();
        }
        // 1 line offset in importing
        return numeral(parseInt(this.toLine)-1).format('00000')
    }
    fromWordComputed(fullLine:string):string{
        if (this.fromWordIndex === '*') {
            const words = fullLine.trim().split(' ');
            console.log('from computered', words[0])
            return words[0];
        }
        return this.fromWord;
    }
    toWordComputed(fullLine:string):string{
        if (this.toWordIndex === '*') {
            const words = fullLine.trim().split(' ');
            console.log('words ',words);
            console.log('to word computed',words[words.length-1])

            return words[words.length-1];
        }
        if (!this.toWord || this.toWord === '0') {
            return this.fromWord;
        }
        return this.toWord;
    }

    formatContent(text:string): any{
        return {
            blocks:[{
                key: 'imprt',
                text,
                type:'unstyled',
                depth:0,
                inlineStyleRanges:[],
                entityRanges:[],
                data:{}
            }],
            entityMap:{}
        }
    }

  }