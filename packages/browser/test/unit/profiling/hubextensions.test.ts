import { TextDecoder, TextEncoder } from 'util';
// @ts-ignore patch the encoder on the window, else importing JSDOM fails (deleted in afterAll)
const patchedEncoder = (!global.window.TextEncoder && (global.window.TextEncoder = TextEncoder)) || true;
// @ts-ignore patch the encoder on the window, else importing JSDOM fails (deleted in afterAll)
const patchedDecoder = (!global.window.TextDecoder && (global.window.TextDecoder = TextDecoder)) || true;

import { getCurrentHub } from '@sentry/core';
import type { Transaction } from '@sentry/types';
import { JSDOM } from 'jsdom';

import { onProfilingStartRouteTransaction } from '../../../src';

// @ts-ignore store a reference so we can reset it later
const globalDocument = global.document;
// @ts-ignore store a reference so we can reset it later
const globalWindow = global.window;
// @ts-ignore store a reference so we can reset it later
const globalLocation = global.location;

describe('BrowserProfilingIntegration', () => {
  beforeEach(() => {
    const dom = new JSDOM();
    // @ts-ignore need to override global document
    global.document = dom.window.document;
    // @ts-ignore need to override global document
    global.window = dom.window;
    // @ts-ignore need to override global document
    global.location = dom.window.location;

    const hub = getCurrentHub();
    const client: any = {
      getDsn() {
        return {};
      },
      getTransport() {
        return {
          send() {},
        };
      },
      getOptions() {
        return {
          profilesSampleRate: 1,
        };
      },
    };

    hub.bindClient(client);
  });

  // Reset back to previous values
  afterEach(() => {
    // @ts-ignore need to override global document
    global.document = globalDocument;
    // @ts-ignore need to override global document
    global.window = globalWindow;
    // @ts-ignore need to override global document
    global.location = globalLocation;
  });
  afterAll(() => {
    // @ts-ignore patch the encoder on the window, else importing JSDOM fails
    patchedEncoder && delete global.window.TextEncoder;
    // @ts-ignore patch the encoder on the window, else importing JSDOM fails
    patchedDecoder && delete global.window.TextDecoder;
  });

  it('does not throw if Profiler is not available', () => {
    // @ts-ignore force api to be undefined
    global.window.Profiler = undefined;
    // set sampled to true so that profiling does not early return
    const mockTransaction = { sampled: true } as Transaction;
    expect(() => onProfilingStartRouteTransaction(mockTransaction)).not.toThrow();
  });
  it('does not throw if constructor throws', () => {
    const spy = jest.fn();

    class Profiler {
      constructor() {
        spy();
        throw new Error('Profiler constructor error');
      }
    }

    // set sampled to true so that profiling does not early return
    const mockTransaction = { sampled: true } as Transaction;

    // @ts-ignore override with our own constructor
    global.window.Profiler = Profiler;
    expect(() => onProfilingStartRouteTransaction(mockTransaction)).not.toThrow();
    expect(spy).toHaveBeenCalled();
  });
});
