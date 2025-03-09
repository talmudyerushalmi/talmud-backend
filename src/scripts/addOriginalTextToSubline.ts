import {
  convertFromRaw,
  ContentState,
  ContentBlock,
  DraftEntityMutability,
  RawDraftContentState,
} from 'draft-js';
import mongoose from 'mongoose';

// Run with: npx tsx src/scripts/addoriginalTextToSubline.ts from root

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

const main = async () => {
  let failedUpdates = [];
  let successCount = 0;

  try {
    await mongoose.connect(
      'mongodb://mongoadmin:secret@localhost:27017/talmud?authSource=admin',
    );
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }

  const mishnas = await mongoose.connection.db
    .collection('mishnas')
    .find()
    .toArray();

  console.log(`Found ${mishnas.length} mishnas`);

  for (const mishna of mishnas) {
    for (const [lineIndex, line] of mishna.lines.entries()) {
      if (line.sublines && Array.isArray(line.sublines)) {
        for (const [sublineIndex, subline] of line.sublines.entries()) {
          try {
            if (!subline.nosach) {
              console.log(
                `Subline ${sublineIndex} in line ${line.lineNumber} of mishna ${mishna._id} has no nosach`,
              );
              continue;
            }

            // Generate the originalText text
            const contentState = convertFromRaw(subline.nosach);
            const blocks = contentState.getBlocksAsArray();

            // Process each block with original decorators
            let originalText = '';
            for (const block of blocks) {
              const textWithOriginalDecorators = applyCompositeDecorator(
                contentState,
                block,
                compoundOriginalDecorators,
              );
              originalText += textWithOriginalDecorators + '\n';
            }
            originalText = originalText.trim();

            // Update the subline with the originalText field
            await mongoose.connection.db
              .collection('mishnas')
              .updateOne(
                {
                  _id: mishna._id,
                  [`lines.${lineIndex}.sublines.${sublineIndex}.index`]:
                    subline.index,
                },
                {
                  $set: {
                    [`lines.${lineIndex}.sublines.${sublineIndex}.originalText`]:
                      originalText,
                  },
                },
              )
              .then((result) => {
                if (result.modifiedCount === 0) {
                  failedUpdates.push(
                    `Mishna: ${mishna._id}, Line: ${line.lineNumber}, Subline: ${sublineIndex} - No changes made`,
                  );
                } else {
                  successCount++;
                  if (successCount % 100 === 0) {
                    console.log(`Updated ${successCount} sublines so far`);
                  }
                }
              })
              .catch((error) => {
                failedUpdates.push(
                  `Mishna: ${mishna._id}, Line: ${line.lineNumber}, Subline: ${sublineIndex} - Error: ${error.message}`,
                );
              });
          } catch (error) {
            failedUpdates.push(
              `Mishna: ${mishna._id}, Line: ${line.lineNumber}, Subline: ${sublineIndex} - Error: ${error.message}`,
            );
          }
        }
      } else {
        console.log(
          `Line ${line.lineNumber} in mishna ${mishna._id} has no sublines`,
        );
      }
    }
  }

  console.log(`Successfully updated ${successCount} sublines`);
  console.log(`Failed updates: ${failedUpdates.length}`);
  if (failedUpdates.length > 0) {
    console.log('First 10 failed updates:');
    console.log(failedUpdates.slice(0, 10));
  }

  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
};
