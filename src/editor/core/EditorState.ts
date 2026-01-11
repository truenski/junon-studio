import type { Position, Selection } from './types';

export class EditorState {
  private value: string = '';
  private position: Position = { line: 0, column: 0 };
  private selection: Selection = {
    start: { line: 0, column: 0 },
    end: { line: 0, column: 0 },
    isEmpty: true,
  };
  private focused: boolean = false;

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
  }

  getPosition(): Position {
    return { ...this.position };
  }

  setPosition(position: Position): void {
    this.position = { ...position };
  }

  getSelection(): Selection {
    return {
      start: { ...this.selection.start },
      end: { ...this.selection.end },
      isEmpty: this.selection.isEmpty,
    };
  }

  setSelection(selection: Selection): void {
    this.selection = {
      start: { ...selection.start },
      end: { ...selection.end },
      isEmpty: selection.isEmpty,
    };
  }

  isFocused(): boolean {
    return this.focused;
  }

  setFocused(focused: boolean): void {
    this.focused = focused;
  }

  getLineCount(): number {
    return this.value.split('\n').length;
  }

  getLine(line: number): string {
    const lines = this.value.split('\n');
    return lines[line] || '';
  }

  getLines(): string[] {
    return this.value.split('\n');
  }

  getOffset(position: Position): number {
    const lines = this.value.split('\n');
    let offset = 0;
    for (let i = 0; i < position.line && i < lines.length; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    offset += position.column;
    return offset;
  }

  getPositionFromOffset(offset: number): Position {
    const lines = this.value.split('\n');
    let currentOffset = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for newline
      if (currentOffset + lineLength > offset) {
        return {
          line: i,
          column: offset - currentOffset,
        };
      }
      currentOffset += lineLength;
    }
    return {
      line: lines.length - 1,
      column: lines[lines.length - 1]?.length || 0,
    };
  }
}

