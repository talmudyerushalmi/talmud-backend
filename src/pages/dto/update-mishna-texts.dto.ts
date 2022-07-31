import { IsNotEmpty } from 'class-validator';
import { RawDraftContentBlock } from 'draft-js';

export class UpdateMishnaRichTextsDto {
  @IsNotEmpty()
  guid: string;
  @IsNotEmpty()
  richTextBavli: RawDraftContentBlock  
  @IsNotEmpty()
  richTextMishna: RawDraftContentBlock  
  @IsNotEmpty()
  richTextTosefta: RawDraftContentBlock
}
