import { RawDraftContentState } from "draft-js";

export class UpdateNosachDto {
  sublineIndex: number;
  nosach: RawDraftContentState[];
  nosachText: string[];
}
