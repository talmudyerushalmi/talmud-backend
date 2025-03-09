import { RawDraftContentState } from 'draft-js';

import { convertFromRaw, ContentState, ContentBlock } from 'draft-js';

export const generateOriginalText = (nosach: RawDraftContentState) => {
  const contentState = convertFromRaw(nosach);
  const blocks = contentState.getBlocksAsArray();
  let originalText = '';
  for (const block of blocks) {
    const textWithOriginalDecorators = applyCompositeDecorator(
      contentState,
      block,
      compoundOriginalDecorators,
    );
    originalText += textWithOriginalDecorators + '\n';
  }
  return originalText.trim();
};

export const getFindStrategy = (type) => {
  return function findEntities(contentBlock, callback, contentState) {
    contentBlock.findEntityRanges((character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === type
      );
    }, callback);
  };
};

// Helper function to apply decorators manually to text
export const applyDecoratorsToText = (
  contentState: ContentState,
  block: ContentBlock,
  decorator: any,
) => {
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
};

// Apply all decorators in a composite decorator
export const applyCompositeDecorator = (
  contentState: ContentState,
  block: ContentBlock,
  decorators: any[],
) => {
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
};

export const Quote = (props) => {
  return `"${props.children}"`;
};

// Add decorators for original text
export const AddOriginal = () => {
  // For original text, we don't show the added text
  return '';
};

export const DeleteOriginal = (props) => {
  // For original text, we show the deleted text
  return props.children;
};

export const CorrectionOriginal = (props) => {
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
