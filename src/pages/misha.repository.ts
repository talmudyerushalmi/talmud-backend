import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Mishna } from "./schemas/mishna.schema";
import { Model } from "mongoose";


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
    ){
        const id = this.getID(tractate, chapter, mishna);
        return this.mishnaModel.findOne({id});

    }

}