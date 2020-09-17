import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import * as numeral from 'numeral';



@Injectable()
export class DraftJsService {
  //constructor() {}
  createEditorFromLines(lines:string[]): any{
      return {
          lines:lines.join(),
          
      }
          
  }


}
