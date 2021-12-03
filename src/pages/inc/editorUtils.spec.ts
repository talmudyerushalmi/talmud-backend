import { createEntityInContent, NosachEntity } from "./editorUtils";

const draftContent = {
        "blocks": [
          {
            "key": "aaaaa",
            "text": "ר' יוסי פתר מתניתה: \"מצות תאכל\" - מצוה. ",
            "type": "unstyled",
            "depth": 0,
            "inlineStyleRanges": [],
            "entityRanges": [
              {
                "offset": 8,
                "length": 3,
                "key": 0
              },
              {
                "offset": 20,
                "length": 11,
                "key": 1
              }
            ],
            "data": {}
          }
        ],
        "entityMap": {
          "0": {
            "type": "ADD",
            "mutability": "IMMUTABLE",
            "data": {
              "editingComment": "2"
            }
          },
          "1": {
            "type": "QUOTE",
            "mutability": "IMMUTABLE",
            "data": {
              "editingComment": "",
              "linkTo": "(ויקרא ו, ט)"
            }
          }
        }
}
const draftContentAfterAddition = {
    "blocks": [
      {
        "key": "aaaaa",
        "text": "ר' יוסי פתר מתניתה: \"מצות תאכל\" - מצוה. ",
        "type": "unstyled",
        "depth": 0,
        "inlineStyleRanges": [],
        "entityRanges": [
          {
            "offset": 8,
            "length": 3,
            "key": 0
          },
          {
            "offset": 12,
            "length": 6,
            "key": 1
          },
          {
            "offset": 20,
            "length": 11,
            "key": 2
          }
        ],
        "data": {}
      }
    ],
    "entityMap": {
      "0": {
        "type": "ADD",
        "mutability": "IMMUTABLE",
        "data": {
          "editingComment": "2"
        }
      },
      "1": {
        "type": "DELETE",
        "mutability": "IMMUTABLE",
        "data": {
          "editingComment": "3"
        }
      },
      "2": {
        "type": "QUOTE",
        "mutability": "IMMUTABLE",
        "data": {
          "editingComment": "",
          "linkTo": "(ויקרא ו, ט)"
        }
      }
    }
  }

describe('Editor Utils', () => {
  it.only('createEntityInContent', () => {
    const test1 = createEntityInContent(draftContent, 12, 6, NosachEntity.DELETE, {editingComment: "3"});
    expect(test1).toBe('ת"ל מצות תאכל מצוה');
  });
});
