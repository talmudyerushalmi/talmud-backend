import { SubLine } from '../models/line.model';

export class UpdateLineDto {
  mainLine: any;  
  sublines: SubLine[];
  sugiaName?: string;
}
