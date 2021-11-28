import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { SaveMishnaExcerptDto } from '../dto/save-mishna-excerpt.dto';
import { ExcerptSelection } from './excerptSelection.model';

export class MishnaExcerpt {
  constructor(m: SaveMishnaExcerptDto){
    this.key = m.key;
    this.type = m.type;
    this.seeReference = m.seeReference;
    this.source = m.source;
    this.sourceLocation = m.sourceLocation;
    this.editorStateFullQuote = m.editorStateFullQuote;
    this.editorStateShortQuote = m.editorStateShortQuote;
    this.synopsis = m.synopsis;
    this.editorStateComments = m.editorStateComments;
    this.selection = new ExcerptSelection(m.selection);
    this.automaticImport = m.automaticImport;
  }
  key: number;
  type: string;
  @IsBoolean()
  seeReference: boolean;
  @IsNotEmpty()
  @IsString()
  source: Record<string, unknown>;;
  @IsString()
  sourceLocation: string;
  editorStateFullQuote: Record<string, unknown>;
  editorStateShortQuote : Record<string, unknown>;
  @IsString()
  synopsis: string;
  editorStateComments:Record<string, unknown>;
  selection: ExcerptSelection;
  automaticImport?: boolean;

};


