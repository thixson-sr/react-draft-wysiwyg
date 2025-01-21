import {
  EditorState,
  Modifier,
} from 'draft-js';
import { getSelectedBlock } from 'draftjs-utils';

export default function addMention(
  editorState: EditorState,
  onChange: Function,
  separator: string,
  trigger: string,
  suggestion: Object,
  mentionIndex: number,
  initialOffset: Number,
): void {
  const { value, url } = suggestion;
  const entityKey = editorState
    .getCurrentContent()
    .createEntity('MENTION', 'IMMUTABLE', { text: `${trigger}${value}`, value, url })
    .getLastCreatedEntityKey();
  const selectedBlock = getSelectedBlock(editorState);
  const selectedBlockText = selectedBlock.getText();
  const beginningIndex = (selectedBlockText.lastIndexOf(separator + trigger, initialOffset) || 0) + 1
  const focusOffset = mentionIndex + 1;

  let spaceAlreadyPresent = false;
  if (selectedBlockText[focusOffset] === ' ') {
    spaceAlreadyPresent = true;
  }
  let updatedSelection = editorState.getSelection().merge({
    anchorOffset: beginningIndex,
    focusOffset,
  });
  let newEditorState = EditorState.acceptSelection(editorState, updatedSelection);
  let contentState = Modifier.replaceText(
    newEditorState.getCurrentContent(),
    updatedSelection,
    `${trigger}${value}`,
    newEditorState.getCurrentInlineStyle(),
    entityKey,
  );
  newEditorState = EditorState.push(newEditorState, contentState, 'insert-characters');

  if (!spaceAlreadyPresent) {
    // insert a blank space after mention
    updatedSelection = newEditorState.getSelection().merge({
      anchorOffset: mentionIndex + value.length + trigger.length,
      focusOffset: mentionIndex + value.length + trigger.length,
    });
    newEditorState = EditorState.acceptSelection(newEditorState, updatedSelection);
    contentState = Modifier.insertText(
      newEditorState.getCurrentContent(),
      updatedSelection,
      ' ',
      newEditorState.getCurrentInlineStyle(),
      undefined,
    );
  }
  newEditorState = EditorState.push(newEditorState, contentState, 'insert-characters')
  // Make sure the cursor is moved to the end
  newEditorState = moveFocusToEnd(newEditorState);
  onChange(newEditorState);
}

function moveFocusToEnd(editorState) {
  editorState = EditorState.moveSelectionToEnd(editorState);
  return EditorState.forceSelection(editorState, editorState.getSelection());
}
