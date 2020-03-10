import { Readable } from "stream";
import { TarEntry } from "../types/tar-entry";
import * as streamUtil from "../util/stream-to";
import * as headersUtil from "../util/tar-entry-headers";

const KEY_READABLE_STREAM = Symbol("readableStream");
const KEY_ON_ENTRY = Symbol("onEntry");
const KEY_ON_END = Symbol("onEnd");

export type OnEntry<T> = (
  this: TarEntryTransformer<T>,
  entry: TarEntry,
) => unknown | Promise<unknown>;

export type OnEnd<T> = (
  this: TarEntryTransformer<T>,
) => unknown | Promise<unknown>;

export interface TransformerOptions<T> {
  onEntry?: OnEntry<T>;
  initCtx?: T;
  onEnd?: OnEnd<T>;
}

export class TarEntryTransformer<T = never> {
  private [KEY_READABLE_STREAM]: Readable | undefined = undefined;
  private [KEY_ON_ENTRY]: OnEntry<T> | undefined;
  private [KEY_ON_END]: OnEnd<T> | undefined;

  public ctx: T;

  public constructor(opts: TransformerOptions<T> = {}) {
    this[KEY_ON_ENTRY] = opts.onEntry;
    this[KEY_ON_END] = opts.onEnd;
    this.ctx = opts.initCtx as T;
  }

  public get readableStream(): Readable {
    const v = this[KEY_READABLE_STREAM];
    if (!v)
      throw new Error(
        "readableStream of instance of TarEntryTransformer not set",
      );
    return v;
  }

  public set readableStream(v: Readable) {
    if (this[KEY_READABLE_STREAM])
      throw new Error(
        "readableStream of instance of TarEntryTransformer already set",
      );
    this[KEY_READABLE_STREAM] = v;
  }

  protected get onEntryImpl(): OnEntry<T> {
    const f = this[KEY_ON_ENTRY];
    if (!f)
      throw new Error("TarEntryTransformer.prototype.onEntry not implemented");
    return f;
  }

  public onEntry(entry: TarEntry) {
    return this.onEntryImpl.call(this, entry);
  }

  public onEnd() {
    const end = this[KEY_ON_END];
    if (typeof end === "function") {
      return end.call(this);
    }
  }

  public push(entry: TarEntry) {
    this.readableStream.push(entry);
  }

  // #region utils
  public headersWithNewName(
    ...args: Parameters<typeof headersUtil.headersWithNewName>
  ) {
    return headersUtil.headersWithNewName(...args);
  }
  public streamToBuffer(...args: Parameters<typeof streamUtil.streamToBuffer>) {
    return streamUtil.streamToBuffer(...args);
  }
  public streamToString(...args: Parameters<typeof streamUtil.streamToString>) {
    return streamUtil.streamToString(...args);
  }
  // #endregion
}
