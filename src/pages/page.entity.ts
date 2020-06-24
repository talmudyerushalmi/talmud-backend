import { Column, Entity, ObjectIdColumn, PrimaryColumn } from 'typeorm';
import { PageLine } from './page.model';

@Entity()
export class Page {

  @ObjectIdColumn()
  _id: string;

  // id that represents a page
  // 001_1 , 001_2, 002_2, etc.
  @PrimaryColumn()
  id: string;

  @Column()
  lines: PageLine[];



}
