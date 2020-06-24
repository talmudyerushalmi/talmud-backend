import { Column, Entity, ObjectIdColumn, PrimaryColumn } from 'typeorm';
import { PageLine } from './page.model';
import { Page } from './page.entity';

@Entity()
export class Chapter {

  @ObjectIdColumn()
  _id: string;

  // id that represents a chapter
  // 001, 002, 003 etc.
  @PrimaryColumn()
  id: string;

  @Column()
  pages: Page[]

  @Column()
  page_ids: string[];
  // @Column()
  // pages: Pages[]

  // OR
  // @Column()
  // from_page: Page mongoID
  // @Column()
  // to_page: Page mongoID




}
