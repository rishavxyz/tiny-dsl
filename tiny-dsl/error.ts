export default class ParseError extends Error {
  constructor(message: string, col?: number) {
    if (typeof col != 'undefined') {
      super(`col ${col}: ${message}`);
    } else {
      super(message);
    }
  }
}
