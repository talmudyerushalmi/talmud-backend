import { IsNotEmpty, IsString } from 'class-validator';


export class Manuscript {
  slug: string;
  imageurl: string;
  thumbnail: string;
}
export class Related {
  @IsNotEmpty()
  @IsString()
  guid: string;
 

  manuscripts?: Manuscript[]

};


