import { Column, Entity, ObjectIdColumn, PrimaryColumn } from 'typeorm';
import { PageLine } from './page.model';

@Entity()
export class Page {

  @ObjectIdColumn()
  _id: string;

  @PrimaryColumn()
  id: string;

  @Column()
  lines: PageLine[]


}
