import { IsArray, IsNumber } from "class-validator";
import { RawDraftContentState } from "draft-js";

export class UpdateNosachDto {
  @IsNumber()
  sublineIndex: number;
  @IsArray()
  nosach: RawDraftContentState[];
  @IsArray()
  nosachText: string[];
}
