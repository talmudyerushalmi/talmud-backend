import { ExcerptUtils } from "./excerptUtils";
import * as _ from 'lodash';
import { line1, line2 } from "./lines.export.spec";

const excerpt1 = 
  {
    "key": 1638519099786,
    "type": "EXPLANATORY",
    "editorStateShortQuote": {
      "blocks":[],
      "entityMap":{}
    },
    "source": null,
    "editorStateComments": {
      "blocks":[],
      "entityMap":{}
    },
    "editorStateFullQuote": {
      "blocks": [],
      "entityMap": {}
    },
    "synopsis":"",
    "sourceLocation": "\"מצות תאכל\"",
    "seeReference": false,
    "selection": {
      "fromLine": 2,
      "fromWord": "\"מצות",
      "fromOffset": 13,
      "toLine": 2,
      "toWord": "תאכל\"",
      "toOffset": 24,
      "firstWords": "\"מצות תאכל\"",
      "fromSubline": 10,
      "toSubline": 10
    }
  }
 
const excerpt2 = 
  {
    "key": 1638523047436,
    "type": "EXPLANATORY",
    "source": null,
    "editorStateComments": {
      "blocks":[],
      "entityMap":{}
    },
    "editorStateFullQuote": {
      "blocks": [],
      "entityMap": {}
    },
    "editorStateShortQuote": {
      "blocks": [],
      "entityMap": {}
    },
    "synopsis":"",
    "sourceLocation": "\"מצות תאכל\"",
    "seeReference": false,
    "selection": {
      "fromLine": 2,
      "fromWord": "מצוה",
      "fromOffset": 27,
      "toLine": 2,
      "toWord": "מצוה",
      "toOffset": 31,
      "firstWords": "מצוה",
      "fromSubline": 10,
      "toSubline": 10
    }
  }
const excerpt3 = 
  {
    "key": 1638523047436,
    "type": "EXPLANATORY",
    "source": null,
    "editorStateComments": {
      "blocks":[],
      "entityMap":{}
    },
    "editorStateFullQuote": {
      "blocks": [],
      "entityMap": {}
    },
    "editorStateShortQuote": {
      "blocks": [],
      "entityMap": {}
    },
    "synopsis":"",
    "sourceLocation": "\"מצות תאכל\"",
    "seeReference": false,
    "selection": {
      "fromLine": 2,
      "fromWord": "מצוה",
      "fromOffset": 27,
      "toLine": 3,
      "toWord": "מצוה",
      "toOffset": 31,
      "firstWords": "מצוה",
      "fromSubline": 10,
      "toSubline": 10
    }
  }



describe('Excerpt Utils', () => {
  let excerptForTest;
  let excerptForTest2;
  let excerptForTest3;
  beforeEach(()=>{
    excerptForTest = _.cloneDeep( excerpt1 )
    excerptForTest2 = _.cloneDeep( excerpt2 )
    excerptForTest3 = _.cloneDeep( excerpt3 )
  });
  it('getSublineAddition', () => {
    const nosachText = 
    [
      "13 characters", //13
      "second line contains 23", //36
      "third line contains 27  abc" //63
    ];
    const e = new ExcerptUtils(excerptForTest);  // from 13 to 24
    e.updateExcerptSubline(10,nosachText);
    expect(excerptForTest.selection.fromSubline).toBe(10);
    expect(excerptForTest.selection.toSubline).toBe(11);

    new ExcerptUtils(excerptForTest2).updateExcerptSubline(10,nosachText); 
    expect(excerptForTest2.selection.fromSubline).toBe(11);
    expect(excerptForTest2.selection.toSubline).toBe(11);

  });
  it('calculateSublineOffset one line selection', () => {
    const e = new ExcerptUtils(excerptForTest); 
    e.calculateSublineOffset(line1, line1);
   expect(excerptForTest.selection.fromSublineOffset).toBe(0);
   expect(excerptForTest.selection.fromSubline).toBe(8);
   expect(excerptForTest.selection.toSublineOffset).toBe(11);
   expect(excerptForTest.selection.toSubline).toBe(8);
  });
  it.only('calculateSublineOffset two lines selection', () => {
    const e = new ExcerptUtils(excerptForTest3); 
    e.calculateSublineOffset(line1, line2);
    expect(excerptForTest3.selection.fromSubline).toBe(8);
    expect(excerptForTest3.selection.fromSublineOffset).toBe(14);
    expect(excerptForTest3.selection.toSubline).toBe(12);
    expect(excerptForTest3.selection.toSublineOffset).toBe(4);
  });

  it('getSubline offset', () => {
    const oldNosach = 
    [
      "13 characters", //13
      "second line contains 23", //13+46=59
      "third line contains 27  abc" //63
    ];
    const nosachText = 
    [
      "13 characters", //13
      "second line <added here> contains 23", //13+46=59
      "third line contains 27  abc" //63
    ];
    const e = new ExcerptUtils(excerptForTest); 
    e.updateExcerptOffset(10, oldNosach, nosachText);
//    expect(excerptForTest.selection.fromSubline).toBe(10);
 //   expect(excerptForTest.selection.toSubline).toBe(11);


  });
});
