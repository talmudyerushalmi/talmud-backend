import {
  CompositeDecorator,
  convertFromRaw,
  convertToRaw,
  EditorState,
} from 'draft-js';
import mongoose from 'mongoose';

// Run with: npx tsx src/scripts/addCombineLineToDocuments.tsx from root

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

const AddCombined = (props) => {
  return `<${props.children}>`;
};

const DeleteCombined = (props) => {
  return `{${props.children}}`;
};

const Quote = (props) => {
  return `"${props.children}"`;
};

const CorrectionCombined = (props) => {
  const { oldWord } = props.contentState.getEntity(props.entityKey).getData();
  const { editingComment } = props.contentState
    .getEntity(props.entityKey)
    .getData();

  return `{${oldWord}}<${editingComment}>`;
};

export const quoteDecorator = {
  strategy: getFindStrategy('QUOTE'),
  component: Quote,
};

export const addCombinedDecorator = {
  strategy: getFindStrategy('ADD'),
  component: AddCombined,
};

export const deleteCombinedDecorator = {
  strategy: getFindStrategy('DELETE'),
  component: DeleteCombined,
};

export const correctionCombinedDecorator = {
  strategy: getFindStrategy('CORRECTION'),
  component: CorrectionCombined,
};

export const compoundCombinedDecorators = new CompositeDecorator([
  addCombinedDecorator,
  deleteCombinedDecorator,
  quoteDecorator,
  correctionCombinedDecorator,
]);

const main = async () => {
  let failedUpdates = [];

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
    if (mishna._id.toString() === '5facfe0b103ed8f611161d42') {
      for (const [lineIndex, line] of mishna.lines.entries()) {
        if (line.sublines && Array.isArray(line.sublines)) {
          for (const [sublineIndex, subline] of line.sublines.entries()) {
            let combinedText = '';
            const contentState = convertFromRaw(subline.nosach);
            const newEditorState = EditorState.createWithContent(
              contentState,
              compoundCombinedDecorators,
            );

            console.log(JSON.stringify(newEditorState.getCurrentContent()));

            const { blocks } = convertToRaw(newEditorState.getCurrentContent());
            const mappedBlocks = blocks.map(
              (block) => (!block.text.trim() && '\n') || block.text,
            );

            combinedText = mappedBlocks.reduce((acc, block) => {
              let returned = acc;
              if (block === '\n') returned += block;
              else returned += `${block}\n`;
              return returned;
            }, '');

            // console.log(combinedText);
            // save the subline to the database
            // await mongoose.connection.db
            //   .collection('mishnas')
            //   .updateOne(
            //     {
            //       _id: mishna._id,
            //       [`lines.lineNumber`]: line.lineNumber,
            //     },
            //     {
            //       $set: {
            //         [`lines.${lineIndex}.sublines.${sublineIndex}`]: subline,
            //       },
            //     },
            //   )
            //   .then((result) => {
            //     if (result.modifiedCount === 0) {
            //       failedUpdates.push(
            //         `Mishna: ${mishna._id}, Line: ${line.lineNumber}, Subline: ${sublineIndex} - No changes made`,
            //       );
            //     }
            //   })
            //   .catch((error) => {
            //     failedUpdates.push(
            //       `Mishna: ${mishna._id}, Line: ${line.lineNumber}, Subline: ${sublineIndex} - Error: ${error.message}`,
            //     );
            //   });
          }
        } else {
          console.log(`Mishna ${mishna._id} has no sublines`);
        }
      }
    }
  }
  console.log('failedUpdates', failedUpdates);
  process.exit(0);
};

main();
