export class History {
  private entries: string[] = [];
  private cursor = 0;

  constructor(private readonly limit = 50) {}

  push(entry: string): void {
    const isBlank = entry.trim() === '';
    const isRepeat = entry === this.entries[this.entries.length - 1];
    if (!isBlank && !isRepeat) {
      this.entries.push(entry);
      if (this.entries.length > this.limit) this.entries.shift();
    }
    this.cursor = this.entries.length;
  }

  // undefined only when the history is empty
  prev(): string | undefined {
    if (this.entries.length === 0) return undefined;
    this.cursor = Math.max(0, this.cursor - 1);
    return this.entries[this.cursor];
  }

  // '' when moving past the newest entry
  next(): string | undefined {
    this.cursor = Math.min(this.entries.length, this.cursor + 1);
    return this.entries[this.cursor] ?? '';
  }
}
