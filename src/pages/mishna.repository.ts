import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Mishna } from "./schemas/mishna.schema";
import { Model, DocumentQuery } from "mongoose";
import { LineMarkDto } from "./dto/line-mark.dto";
import * as numeral from 'numeral';


@Injectable()
export class MishnaRepository {
    constructor(
        @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>
    ) {

    }

    getID(tractate: string, chapter: string, mishna:string):string {
        return `${tractate}_${chapter}_${mishna}`;
      }

    find(
        tractate:string,
        chapter: string,
        mishna: string
    ): DocumentQuery<Mishna,any>{
        const id = this.getID(tractate, chapter, mishna);
        return this.mishnaModel.findOne({id});

    }
    
    // for import
    getAll(): DocumentQuery<Mishna[],any> {
        return this.mishnaModel.find({});
    }
   

    async getNextLine(lineMark: LineMarkDto): Promise<LineMarkDto>{
        const nextLine = numeral(parseInt(lineMark.line) + 1).format('00000');
        const mishnaDoc = await this.mishnaModel.findOne({
            tractate: lineMark.tractate,
            "lines.lineNumber":  nextLine
        });
        if (mishnaDoc) {
            return {
                tractate: lineMark.tractate,
                chapter: mishnaDoc.chapter,
                mishna: mishnaDoc.mishna,
                line: nextLine
            };
        } else {
            console.log('NO NEXT LINE');
            
        }

 


    }

}