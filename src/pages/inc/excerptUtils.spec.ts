import { ExcerptUtils } from "./excerptUtils";

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




describe('Excerpt Utils', () => {
  it('getSublineAddition', () => {
    const nosachText = 
    [
      "13 characters", //13
      "second line contains 23", //36
      "third line contains 27  abc" //63
    ];
    const e = new ExcerptUtils(excerpt1); 
    e.updateExcerpt(10,nosachText);
    expect(excerpt1.selection.fromSubline).toBe(10);
    expect(excerpt1.selection.toSubline).toBe(11);

    new ExcerptUtils(excerpt2).updateExcerpt(10,nosachText); 
    expect(excerpt2.selection.fromSubline).toBe(11);
    expect(excerpt2.selection.toSubline).toBe(11);

  });
});
