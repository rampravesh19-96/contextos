export class Queue {
  add = jest.fn();
  close = jest.fn();
  constructor(..._args: unknown[]) {}
}
export class Worker {
  on = jest.fn();
  close = jest.fn();
  constructor(..._args: unknown[]) {}
}
