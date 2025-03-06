import {
  CompositeDecorator,
  convertFromRaw,
  convertToRaw,
  EditorState,
  DraftEntityMutability,
  ContentState,
  ContentBlock,
} from 'draft-js';

const testSubline1 = {
  text: "כת' מצות תאכל - מצוה.",
  index: 2,
  nosach: {
    blocks: [
      {
        key: 'aaaaa',
        text: "כת' מצות תאכל - מצוה.",
        type: 'unstyled',
        depth: 0,
        inlineStyleRanges: [],
        entityRanges: [
          {
            offset: 4,
            length: 9,
            key: 0,
          },
          {
            offset: 16,
            length: 4,
            key: 1,
          },
        ],
        data: {},
      },
    ],
    entityMap: {
      '0': {
        type: 'QUOTE',
        mutability: 'IMMUTABLE' as DraftEntityMutability,
        data: {
          editingComment: '',
          linkTo: 'ויקרא ו, ט',
        },
      },
      '1': {
        type: 'ADD',
        mutability: 'IMMUTABLE' as DraftEntityMutability,
        data: {
          editingComment: 'ראו סינופסיס ובהמשך',
        },
      },
    },
  },
};

const testSubline2 = {
  text: 'מה "עליה" שנ\' להלן ביבמה אף "עליה" שנאמ\' כאן אפילו יבמתו. ',
  index: 70,
  nosach: {
    blocks: [
      {
        key: 'aaaaa',
        text: 'מה "עליה" שנ\' להלן ביבמה אף "עליה" שנאמ\' כאן אפילו יבמתו. ',
        type: 'unstyled',
        depth: 0,
        inlineStyleRanges: [],
        entityRanges: [
          {
            offset: 19,
            length: 5,
            key: 0,
          },
        ],
        data: {},
      },
    ],
    entityMap: {
      '0': {
        type: 'CORRECTION',
        mutability: 'IMMUTABLE',
        data: {
          editingComment: "ראו א' שמעא, מכילתא דעריות, עמ' 204 הע' 82. כפ\"מ.",
          oldWord: 'בשאינה יבמה',
        },
      },
    },
  },
  synopsis: [
    {
      id: 'leiden',
      type: 'direct_sources',
      text: {
        content: {
          blocks: [
            {
              data: {},
              entityRanges: [],
              inlineStyleRanges: [],
              key: 'aaaaa',
              text: "מה עליה שנ' להלן בשאינה יבמה אף עליה שנאמ' כאן אפילו יבמתו",
              type: 'unstyled',
            },
          ],
          entityMap: [],
        },
        simpleText:
          "מה עליה שנ' להלן בשאינה יבמה אף עליה שנאמ' כאן אפילו יבמתו",
      },
      code: 'leiden',
      name: 'כתב יד ליידן',
      button_code: 'leiden',
    },
    {
      id: 1648465109794,
      type: 'indirect_sources',
      name: 'שו"ת הרשב"א ח"ו (ורשא)',
      location: 'סימן יט',
      composition: {
        composition: {
          title: 'שו"ת הרשב"א ח"ו (ורשא)',
          secondary_title: '',
          date: '1275',
          type: 'excerpt',
          region: '',
          author: '',
          edition: '',
        },
        compositionLocation: 'סימן יט',
      },
      text: {
        simpleText: '',
        content: {
          blocks: [
            {
              key: '37sc1',
              text: '',
              type: 'unstyled',
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {},
            },
          ],
          entityMap: {},
        },
      },
    },
    {
      id: 'translation',
      type: 'translation',
      code: 'translation',
      button_code: 'translation',
      name: 'תרגום',
      text: {
        simpleText: '',
      },
    },
  ],
};

function getFindStrategy(type) {
  return function findEntities(contentBlock, callback, contentState) {
    contentBlock.findEntityRanges((character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === type
      );
    }, callback);
  };
}

// Helper function to apply decorators manually to text
function applyDecoratorsToText(
  contentState: ContentState,
  block: ContentBlock,
  decorator: any,
) {
  const { strategy, component } = decorator;
  const text = block.getText();
  const ranges: {
    start: number;
    end: number;
    decoratedText: string;
    replacement: string;
  }[] = [];

  // Find ranges where decorator applies
  strategy(
    block,
    (start, end) => {
      const entityKey = block.getEntityAt(start);
      const decoratedText = text.substring(start, end);

      // Create props similar to what Draft.js would pass to the decorator component
      const props = {
        children: decoratedText,
        contentState,
        entityKey,
        blockKey: block.getKey(),
        decoratedText,
      };

      // Call the decorator component to get the replacement text
      const replacement = component(props);

      ranges.push({ start, end, decoratedText, replacement });
    },
    contentState,
  );

  // Sort ranges in reverse order to avoid offset issues when replacing
  ranges.sort((a, b) => b.start - a.start);

  // Apply replacements
  let result = text;
  for (const range of ranges) {
    result =
      result.substring(0, range.start) +
      range.replacement +
      result.substring(range.end);
  }

  return result;
}

// Apply all decorators in a composite decorator
function applyCompositeDecorator(
  contentState: ContentState,
  block: ContentBlock,
  decorators: any[],
) {
  let result = block.getText();

  for (const decorator of decorators) {
    const blockWithDecorations = new ContentBlock({
      key: block.getKey(),
      type: block.getType(),
      text: result,
      characterList: block.getCharacterList(),
      depth: block.getDepth(),
      data: block.getData(),
    });

    result = applyDecoratorsToText(
      contentState,
      blockWithDecorations,
      decorator,
    );
  }

  return result;
}

const Quote = (props) => {
  return `"${props.children}"`;
};

// Add decorators for original text
const AddOriginal = (props) => {
  // For original text, we don't show the added text
  return '';
};

const DeleteOriginal = (props) => {
  // For original text, we show the deleted text
  return props.children;
};

const CorrectionOriginal = (props) => {
  // For original text, we show the old word instead of the correction
  const { oldWord } = props.contentState.getEntity(props.entityKey).getData();
  return oldWord;
};

export const quoteDecorator = {
  strategy: getFindStrategy('QUOTE'),
  component: Quote,
};

// Add original decorators
export const addOriginalDecorator = {
  strategy: getFindStrategy('ADD'),
  component: AddOriginal,
};

export const deleteOriginalDecorator = {
  strategy: getFindStrategy('DELETE'),
  component: DeleteOriginal,
};

export const correctionOriginalDecorator = {
  strategy: getFindStrategy('CORRECTION'),
  component: CorrectionOriginal,
};

export const compoundOriginalDecorators = [
  addOriginalDecorator,
  deleteOriginalDecorator,
  quoteDecorator,
  correctionOriginalDecorator,
];

// Function to test a specific subline
function testSubline() {
  // Convert the raw content to ContentState
  const contentState = convertFromRaw(testSubline2.nosach as any);

  // Get the blocks
  const blocks = contentState.getBlocksAsArray();

  for (const block of blocks) {
    const textWithOriginalDecorators = applyCompositeDecorator(
      contentState,
      block,
      compoundOriginalDecorators,
    );
    console.log(textWithOriginalDecorators);
  }
}

// Run the test
testSubline();
