import { CompositeDecorator, ContentState, EditorState } from 'draft-js';

function getFindStrategy(entityKey) {
  return function findEntities(contentBlock, callback, contentState) {
    contentBlock.findEntityRanges((character) => {
      return character.getEntity() === entityKey;
    }, callback);
  };
}

const AddCombined = (props) => {
  return `<${props.children}>`;
};

function convertDraftToCustomFormat(content) {
  // Reconstruct the ContentState from the given structure
  const blockMap = content.blockMap;
  const firstBlock = Object.values(blockMap)[0];
  const text = firstBlock.text;
  const entityKey = firstBlock.characterList[0].entity;

  const contentState = ContentState.createFromText(text);
  contentState.createEntity('ADD', 'MUTABLE', {});

  // Apply the entity to the entire text
  const contentStateWithEntity = contentState.addEntity(entityKey);

  // Create a decorator for the specific entity
  const decorator = {
    strategy: getFindStrategy(entityKey),
    component: AddCombined,
  };

  const compositeDecorator = new CompositeDecorator([decorator]);

  // Create EditorState with the content and decorator
  const editorState = EditorState.createWithContent(
    contentStateWithEntity,
    compositeDecorator,
  );

  // Get the formatted text
  return editorState.getCurrentContent().getPlainText();
}

// Example usage
const content = {
  entityMap: { '0': 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
  blockMap: {
    aaaaa: {
      key: 'aaaaa',
      type: 'unstyled',
      text: ' הקדישה - נאסרה. קרב קומצה - חזרה והותרה.',
      characterList: [
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
        { style: [], entity: 'c0c3d3e5-8b9c-420e-81d2-ed45533789fb' },
      ],
      depth: 0,
      data: {},
    },
  },
  selectionBefore: {
    anchorKey: 'aaaaa',
    anchorOffset: 0,
    focusKey: 'aaaaa',
    focusOffset: 0,
    isBackward: false,
    hasFocus: false,
  },
  selectionAfter: {
    anchorKey: 'aaaaa',
    anchorOffset: 0,
    focusKey: 'aaaaa',
    focusOffset: 0,
    isBackward: false,
    hasFocus: false,
  },
};

const result = convertDraftToCustomFormat(content);
console.log(result); // Should output: "< הקדישה - נאסרה. קרב קומצה - חזרה והותרה.>"
