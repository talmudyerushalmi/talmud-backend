import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { PagesService } from '../pages/pages.service';
import * as fs from 'fs';
import * as numeral from 'numeral';
import { TractateRepository } from 'src/pages/tractate.repository';
import { Tractate } from 'src/pages/schemas/tractate.schema';
import { LineMarkDto } from 'src/pages/dto/line-mark.dto';
import { MishnaRepository } from 'src/pages/mishna.repository';
import { CsvParser } from 'nest-csv-parser';
import ImportedExcerpt from './cls/ImportedExcerpt';
import { SettingsService } from 'src/settings/settings.service';
import { Mishna } from 'src/pages/schemas/mishna.schema';
import MiscUtils from 'src/shared/MiscUtils';
import { SublineService } from 'src/pages/subline.service';
import { Synopsis } from 'src/pages/models/line.model';
import { getTextForSynopsis } from 'src/pages/inc/synopsisUtils';
@Console()
@Injectable()
export class ImportService {
  readonly tractateMetadata = /\{מסכת (.*)\,(.*)\}/;
  readonly metadata = /^(\d{12}) (\d{2})@ (.*)/;
  readonly structureRegex = /^(\d{2})(\d{4})(\d{3})(\d{3})/;
  readonly pageRegex = /\|([א-ת]),([א-ת])\|/;
  currentTractate = null;
  tractateOrder = 0;
  lineOrder = 1;
  currentTractateDoc: Tractate;
  currentChapterIndex = 0;
  currentMishnaIndex = 0;
  currentLineIndex = 0;
  lineMark: LineMarkDto;
  linesBuffer: any[] = [];
  sublineIndex = 1;

  private data: string[];
  constructor(
    private readonly csvParser: CsvParser,
    private pageService: PagesService,
    private tractateRepo: TractateRepository,
    private mishnaRepo: MishnaRepository,
    private settingsService: SettingsService,
    private sublineService: SublineService,
  ) {}

  readFile(filename: string): void {
    this.data = fs.readFileSync(filename, { encoding: 'utf8' }).split('\n');
  }
  reverseString(str: string): string {
    return str
      .split('')
      .reverse()
      .join('');
  }
  matchRegex(line: string): any {
    let metaData;

    metaData = line.match(this.metadata);
    if (metaData) {
      const matchStructure = metaData[1].match(this.structureRegex);
      const [, line_no, piska, mishna, chapter] = matchStructure;
      const text = metaData[3];
      return {
        type: 'line',
        meta: {
          line_no,
          piska,
          mishna,
          chapter,
        },
        text,
      };
    }
    metaData = line.match(this.tractateMetadata);
    if (metaData) {
      const [, title_heb, title_eng] = metaData;
      return {
        type: 'tractate',
        title_heb,
        title_eng: title_eng.toLowerCase(),
      };
    }

    return null;
  }
  async processSubLine(subline: string): Promise<void> {
    const lineRegex = /^\/\/\/(.*)/;
    let sublineText = subline;

    const metadata = subline.match(lineRegex);
    if (metadata) {
      try {
        // save buffer
        await this.pageService.updateMishnaLine(
          this.lineMark.tractate,
          this.lineMark.line,
          {
            sublines: this.linesBuffer,
          },
        );
      } catch (e) {
        console.log('ERROR ', e);
      }
      console.log('save buffer ', this.lineMark.line);
      this.linesBuffer = [];
      // new line
      sublineText = metadata[1];
      // this.lineMark = await this.tractateRepo.getNextLine(this.lineMark);
      this.lineMark = await this.mishnaRepo.getNextLine(this.lineMark);
      if (parseInt(this.lineMark.mishna) !== this.currentMishnaIndex) {
        this.currentMishnaIndex = parseInt(this.lineMark.mishna);
        this.sublineIndex = 1;
      }
      console.log('line mark', this.lineMark, this.sublineIndex);
    }

    const sublineData = {
      text: sublineText,
      index: this.sublineIndex++,
    };
    this.linesBuffer.push(sublineData);
  }

  async processLine(line: string, index: number): Promise<void> {
    //  if (index===0) {return;}
    console.log('processing ', index, '>\n');
    // read metadata
    const metaData = this.matchRegex(line);
    // console.log('meta ', metaData);
    if (metaData?.type === 'tractate') {
      this.currentTractate = {
        title_heb: metaData.title_heb,
        title_eng: metaData.title_eng,
      };
      this.tractateOrder++;
      this.lineOrder = 1;
      return;
    }
    // fix problem with hebrew rtl
    if (metaData?.type !== 'line') {
      return;
    }

    const { mishna, chapter } = metaData.meta;
    const { line_no, piska } = metaData.meta;
    let text = metaData.text;
    const pageMatch = text.match(this.pageRegex);
    if (pageMatch) {
      const [, daf, amud] = pageMatch;
      console.log(`PAGE daf: ${daf} amud:${amud}, `);
      text = text.replace(pageMatch[0], '');
    }
    console.log(
      `chapter ${chapter}, mishna: ${mishna}, line: ${piska}_${line_no}:`,
      this.reverseString(text),
    );

    await this.pageService.setLine(this.currentTractate, chapter, mishna, {
      originalLineNumber: `${piska}_${line_no}`,
      line: numeral(this.lineOrder++).format('00000'),
      text,
    });
    await this.tractateRepo.upsert(this.currentTractate.title_eng, {
      title_heb: this.currentTractate.title_heb,
      order: this.tractateOrder,
    });
  }

  @Command({
    command: 'import:tractates <filename>',
    description: 'Import tractate',
  })
  async importTractates(filename: string): Promise<void> {
    this.readFile(filename);

    for (let i = 0; i < this.data.length; i++) {
      await this.processLine(this.data[i], i);
    }
    // now when the data is complete update the next/previous links
    await this.setNextPreviousLinks();
  }

  @Command({
    command: 'import:setNextPrevious',
    description: 'Set next/previous mishna links',
  })
  async setNextPreviousLinks(): Promise<void> {
    console.log('setting mishna next/previous links...');
    // now when the data is complete update the next/previous links
    const all = await this.mishnaRepo.getAll();
    for await (const mishna of all) {
      console.log(mishna);

      const previous = await this.pageService.getPreviousMishna(
        mishna.tractate,
        mishna.chapter,
        mishna.mishna,
      );
      mishna.previous = previous;
      const next = await this.pageService.getNextMishna(
        mishna.tractate,
        mishna.chapter,
        mishna.mishna,
      );
      mishna.next = next;
      await mishna.save();
    }
  }

  @Command({
    command: 'import:sublines <filename>',
    description: 'Import sublines',
  })
  // todo make general  - now it's specifically for Yevamot
  async importSublines(filename: string): Promise<void> {
    this.readFile(filename);
    this.lineMark = {
      tractate: 'yevamot',
      chapter: '001',
      mishna: '001',
      line: '00001',
    };
    this.currentTractateDoc = await this.tractateRepo.get('yevamot', true);
    this.currentMishnaIndex = 1;

    for (let i = 0; i < this.data.length; i++) {
      await this.processSubLine(this.data[i]);
    }
    console.log(this.currentTractateDoc);
  }

  async saveExcerpt(
    index: number,
    mishna: Mishna,
    fromLine: number,
    fromWord: string,
    fromOffset: number,
    toLine: number,
    toWord: string,
    toOffset: number,
    excerpt: ImportedExcerpt,
  ): Promise<any> {
    const compositions = await this.settingsService.getSettings('compositions');
    const source = compositions.find(c => c.title === excerpt.composition);
    if (!source) {
      console.log(index, ',', excerpt['#'], 'Fix composition');
    }

    return this.mishnaRepo.saveExcerpt(
      mishna.tractate,
      mishna.chapter,
      mishna.mishna,
      {
        key: null,
        automaticImport: true,
        editorStateFullQuote: excerpt.formatContent(excerpt.excerpt),
        editorStateComments: excerpt.formatContent(''),
        editorStateShortQuote: excerpt.formatContent(''),
        synopsis: '',
        selection: {
          fromLine,
          fromWord,
          fromOffset,
          toLine,
          toWord,
          toOffset,
        },
        type: 'MUVAA',
        seeReference: false,
        source: {
          ...source,
        },
        sourceLocation: excerpt.compositionLocation,
      },
    );
  }

  @Command({
    command: 'import:excerpts <filename>',
    description: 'Import excerpts',
  })
  async importExcerpts(filename: string): Promise<void> {
    await this.mishnaRepo.deleteImportedExcerpts('yevamot');
    let total = 0;
    let index = 1;
    let quotes = 0;

    // Create stream from file (or get it from S3)
    const stream = fs.createReadStream(filename);
    const excerpts = await this.csvParser.parse(
      stream,
      ImportedExcerpt,
      null,
      null,
      { strict: true, separator: ',' },
    );

    for await (const excerpt of excerpts.list) {
      index++;
      excerpt.tractate = 'yevamot';
      // console.log('excerpt', index)

      if (
        excerpt.toWord.trim().split(' ').length > 1 ||
        excerpt.fromWord.trim().split(' ').length > 1
      ) {
        quotes++;
        console.log(index, ',', excerpt['#'], 'Fix quote');
        // console.log("word!", index, excerpt, excerpt['#'])
      }
      let fromLineText,
        fromLineIndex,
        toLineText,
        toLineIndex,
        fromOffset,
        toOffset;

      const range = await this.mishnaRepo.getRangeLines(
        excerpt.tractate,
        excerpt.fromLineFormatted(),
        excerpt.toLineFormatted(),
      );
      if (range.length > 2) {
        console.log('range ', range.length);
        console.log('excerpts', excerpt);
      }
      let fromMishna = await this.mishnaRepo.findByLine(
        excerpt.tractate,
        excerpt.fromLineFormatted(),
      );
      let toMishna = await this.mishnaRepo.findByLine(
        excerpt.tractate,
        excerpt.toLineFormatted(),
      );
      if (range.length === 1) {
        fromMishna = range[0];
        toMishna = range[0];
        fromLineText = fromMishna.lines.find(
          line => line.lineNumber.trim() === excerpt.fromLineFormatted(),
        ).mainLine;
        fromLineIndex = fromMishna.lines.findIndex(
          line => line.lineNumber === excerpt.fromLineFormatted(),
        );
        toLineText = fromMishna.lines.find(
          line => line.lineNumber === excerpt.toLineFormatted(),
        ).mainLine;
        toLineIndex = fromMishna.lines.findIndex(
          line => line.lineNumber === excerpt.toLineFormatted(),
        );
        fromOffset = fromLineText.indexOf(
          excerpt.fromWordComputed(fromLineText),
        );
        const t = excerpt.toWordComputed(fromLineText);
        toOffset =
          toLineText.indexOf(excerpt.toWordComputed(fromLineText)) +
          excerpt.toWordComputed(fromLineText).length;
        await this.saveExcerpt(
          index,
          fromMishna,
          fromLineIndex,
          excerpt.fromWordComputed(fromLineText),
          fromOffset,
          toLineIndex,
          excerpt.toWordComputed(fromLineText),
          toOffset,
          excerpt,
        );
        total++;
        // console.log('imported excerpt ',excerpt)
      } else {
        if (range.length > 1) {
          fromMishna = range[0];
          toMishna = range[range.length - 1];
          // first part
          fromLineIndex = fromMishna.lines.findIndex(
            line => line.lineNumber === excerpt.fromLineFormatted(),
          );
          fromLineText = fromMishna.lines[fromLineIndex].mainLine;
          toLineIndex = fromMishna.lines.length - 1;
          toLineText = fromMishna.lines[toLineIndex].mainLine;
          fromOffset = fromLineText.indexOf(
            excerpt.fromWordComputed(fromLineText),
          );
          toOffset = toLineText.length;
          await this.saveExcerpt(
            index,
            fromMishna,
            fromLineIndex,
            excerpt.fromWordComputed(fromLineText),
            fromOffset,
            toLineIndex,
            MiscUtils.lastWord(toLineText),
            toOffset,
            excerpt,
          );
          // middle part
          for (let i = 1; i < range.length - 1; i++) {
            const middleMisha = range[i];
            fromLineIndex = 0;
            fromLineText = middleMisha.lines[fromLineIndex].mainLine;
            toLineIndex = middleMisha.lines.length - 1;
            toLineText = middleMisha.lines[toLineIndex].mainLine;
            fromOffset = 0;
            toOffset = toLineText.length;
            await this.saveExcerpt(
              index,
              middleMisha,
              fromLineIndex,
              MiscUtils.firstWord(fromLineText),
              fromOffset,
              toLineIndex,
              MiscUtils.lastWord(toLineText),
              toLineText.length,
              excerpt,
            );
          }

          // second part
          fromLineIndex = 0;
          fromLineText = fromMishna.lines[fromLineIndex].mainLine;
          toLineIndex = toMishna.lines.findIndex(
            line => line.lineNumber === excerpt.toLineFormatted(),
          );
          toLineText = toMishna.lines[toLineIndex].mainLine;
          fromOffset = 0;
          toOffset =
            toLineText.indexOf(excerpt.toWordComputed(fromLineText)) +
            excerpt.toWordComputed(fromLineText).length;
          await this.saveExcerpt(
            index,
            toMishna,
            fromLineIndex,
            MiscUtils.firstWord(fromLineText),
            fromOffset,
            toLineIndex,
            excerpt.toWordComputed(toLineText),
            toOffset,
            excerpt,
          );

          total++;
        } else {
          console.log(index, ',', excerpt['#']);
        }
      }
    }
    console.log('fix quotes ', quotes);
    console.log('imported ', total);
  }

  @Command({
    command: 'set:excerptSelectionSublines <tractate>',
    description: 'Set excerpt for sublines <tractate>',
  })
  async setExcerptSelectionForSublines(tractate: string): Promise<void> {
    console.log('setting excerpt for sublines...', tractate);
    // now when the data is complete update the next/previous links
    const all = await this.mishnaRepo.getAllForTractate(tractate);
    for await (const mishna of all) {
      await this.mishnaRepo.updateExcerptsWithSublineSelect(
        mishna.tractate,
        mishna.chapter,
        mishna.mishna,
      );
    }
  }

  @Command({
    command: 'import:synopsis <tractate>',
    description: 'Create synopsis <tractate>',
  })
  async importSynopsis(tractate: string): Promise<void> {
    const range = (num: number, x: number, y: number) => {
      return num >= x && num <= y;
    };

    console.log('setting excerpt for sublines...', tractate);
    // now when the data is complete update the next/previous links
    const all = await this.mishnaRepo.getAllForTractate(tractate);
    for await (const mishna of all) {
      console.log(mishna.id);
      for (const line of mishna.lines) {
        console.log(line.lineNumber);
        // for (const subline of line.sublines) {
        //   console.log(subline.text)
        //   console.log(subline.synopsis)
        // }
        const newSublines = line.sublines;
        newSublines.forEach(subline => {
          // export class Synopsis {
          //   text: string;
          //   type: string;
          //   name: string;
          //   id: string;
          //   code: string;
          //   button_code: string;
          //   manuscript: string;
          // }
          const content = {
            blocks: [
              {
                data: {},
                entityRanges: [],
                inlineStyleRanges: [],
                key: 'aaaaa',
                text: getTextForSynopsis(subline.text),
                type: 'unstyled',
              },
            ],
            entityMap: [],
          };
          const synopsisLeiden: Synopsis = {
            id: 'leiden',
            type: 'direct_sources',
            text: { content },
            code: 'leiden',
            name: 'כתב יד ליידן',
            button_code: 'leiden',
          };

          const synopsisDfus: Synopsis = {
            id: 'dfus_rishon',
            type: 'direct_sources',
            text: { content },
            code: 'dfus_rishon',
            name: 'דפוס ראשון',
            button_code: 'dfus_rishon',
          };
          if (!subline.synopsis) {
            subline.synopsis = [];
          }
          const lineNumber = parseInt(line.lineNumber);
          if (range(lineNumber, 0, 441) || range(lineNumber, 454, 1087)) {
            subline.synopsis.push(synopsisLeiden);
          }
          if (range(lineNumber, 1088, 1149)) {
            subline.synopsis.push(synopsisDfus);
          }
        });
        const lineNumber = parseInt(line.lineNumber);
        if (range(lineNumber, 0, 441) || range(lineNumber, 454, 1087)) {
          await this.sublineService.updateSubline(
            tractate,
            mishna.chapter,
            mishna.mishna,
            line.lineNumber,
            {
              mainLine: line.mainLine,
              sublines: line.sublines,
            },
          );
        }
        if (range(lineNumber, 1088, 1149)) {
          await this.sublineService.updateSubline(
            tractate,
            mishna.chapter,
            mishna.mishna,
            line.lineNumber,
            {
              mainLine: line.mainLine,
              sublines: line.sublines,
            },
          );
        }
      }
    }
  }

  @Command({
    command: 'fix:synopsis <tractate>',
    description: 'fix synopsis <tractate>',
  })
  async fixSynopsis(tractate: string): Promise<void> {
    console.log('fixing excerpt for sublines...',tractate);
    // now when the data is complete update the next/previous links
    const all = await this.mishnaRepo.getAllForTractate(tractate);
    for await (const mishna of all) {
      console.log(mishna.id)
      for (const line of mishna.lines) {
        console.log(line.lineNumber)
        // for (const subline of line.sublines) {
        //   console.log(subline.text)
        //   console.log(subline.synopsis)
        // }
        const newSublines = line.sublines;
        newSublines.forEach(subline => {
          // export class Synopsis {
          //   text: string;
          //   type: string;
          //   name: string;
          //   id: string;
          //   code: string;
          //   button_code: string;
          //   manuscript: string;
          // }

       
          // if (!subline.synopsis) {subline.synopsis = []}
          // subline.synopsis.push(synopsisNew);
          const newsynopsis = subline.synopsis?.map(old => {
            if (typeof old.text === "string") {
              console.log('need to convert' , old)
              const content = {
                blocks:[
                  {
                    data:{},
                    entityRanges: [],
                    inlineStyleRanges:[],
                    key: "aaaaa",
                    text: getTextForSynopsis(old.text),
                    type: 'unstyled'
                  }
                ],
                entityMap: []
              }
              old.text = { content }
            }
            return old;
          })

          subline.synopsis = newsynopsis;
          console.log('new ', subline.synopsis)
        })
        await this.sublineService.updateSubline(tractate, mishna.chapter, mishna.mishna, line.lineNumber, {
              mainLine: line.mainLine,
              sublines: line.sublines
            })
        // if (parseInt(line.lineNumber) < 442 || parseInt(line.lineNumber) > 455) {
        //   await this.sublineService.updateSubline(tractate, mishna.chapter, mishna.mishna, line.lineNumber, {
        //     mainLine: line.mainLine + " testing ",
        //     sublines: line.sublines
        //   })
        // }

      }


    }

  }
}
