import * as Diff from 'diff';
import * as StringSimilarity from 'string-similarity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tractate } from './schemas/tractate.schema';
import { Mishna } from './schemas/mishna.schema';
import * as _ from 'lodash';
import { TractateRepository } from './tractate.repository';
import { MishnaRepository } from './mishna.repository';
import { InternalLink, Line, SourceType, SubLine } from './models/line.model';
import { NavigationService } from './navigation.service';


const synopsisMap = new Map([
  [
    'leiden',
    {
      title: 'ל',
    },
  ],
  [
    'dfus_rishon',
    {
      title: 'ד',
    },
  ],
  [
    'kricha_2',
    {
      title: 'כ2',
    },
  ],
]);

interface matchedSynopsis {
  text1: {
    text: string;
    lineIndex: number;
  };
  text2: {
    text: string;
    lineIndex: number;
  };
}

@Injectable()
export class SynopsisService {
  constructor(
    private navigationService: NavigationService,
    private tractateRepository: TractateRepository,
    private mishnaRepository: MishnaRepository,
    @InjectModel(Tractate.name) private tractateModel: Model<Tractate>,
    @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>,
  ) {}


  getSynopsisText(
    subline: SubLine,
    synopsisName: string,
  ): string | undefined {
    return subline.synopsis.find(s => s.button_code === synopsisName)?.text
      ?.simpleText;
  }
  findMatchingSynopsis(
    line1: Line,
    line2: Line,
  ): matchedSynopsis | undefined {
    let highest = 0;
    let highestMatch = undefined;
    const MINIMUM_MATCH = 0.3;
    for (let i = 0; i < line1.sublines.length - 1; i++) {
      const subline = line1.sublines[i];
      const text1 = this.getSynopsisText(subline, 'leiden');
      for (let j = 0; j < line2.sublines.length - 1; j++) {
        const sublineParallel = line2.sublines[j];
        const text2 = this.getSynopsisText(sublineParallel, 'leiden');
        if (text2 === undefined) {
          console.log('Error: No leiden text', line2.lineNumber);
        }
        const similarity = StringSimilarity.compareTwoStrings(text1, text2);
        if (similarity > MINIMUM_MATCH) {
          highest = similarity;
          return {
            text1: {
              text: text1,
              lineIndex: i,
            },
            text2: {
              text: text2,
              lineIndex: j,
            },
          };
        }
      }
    }
    return undefined;
  }

  copyParallelSynopsis(
  line: Line,
  parallelLine: Line,
  link: InternalLink,
) {
  let match = this.findMatchingSynopsis(line, parallelLine);
  let copyIndex = match.text2.lineIndex;
  for (let i = match.text1.lineIndex; i < line.sublines.length; i++) {
    if (copyIndex <= parallelLine.sublines.length - 1) {
      let directSources = parallelLine.sublines[copyIndex++].synopsis.filter(
        s => s.type == SourceType.DIRECT_SOURCES,
      );
      directSources.forEach(synopsis => {
        const similarity = StringSimilarity.compareTwoStrings(this.getSynopsisText(line.sublines[i],"leiden"), synopsis.text.simpleText);
        if (similarity > 0.3) {
            const name = `${this.navigationService.getLinkText(link)} ${synopsisMap.get(synopsis.button_code).title}`;
            line.sublines[i].synopsis.push({
                text: synopsis.text,
                type: SourceType.PARALLEL_SOURCE,
                name: name,
                id: link.linkText,
                code: link.linkText,
                button_code: link.linkText,
              });
        }
   
      });
    }
  }
}


}