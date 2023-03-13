import { Scope } from '@sentry/node';
// eslint-disable-next-line import/no-unresolved
import type { ServerLoad } from '@sveltejs/kit';
// eslint-disable-next-line import/no-unresolved
import { error } from '@sveltejs/kit';
import { vi } from 'vitest';

import { wrapLoadWithSentry } from '../../src/server/load';

const mockCaptureException = vi.fn();
let mockScope = new Scope();

vi.mock('@sentry/node', async () => {
  const original = (await vi.importActual('@sentry/node')) as any;
  return {
    ...original,
    captureException: (err: unknown, cb: (arg0: unknown) => unknown) => {
      cb(mockScope);
      mockCaptureException(err, cb);
      return original.captureException(err, cb);
    },
  };
});

const mockAddExceptionMechanism = vi.fn();

vi.mock('@sentry/utils', async () => {
  const original = (await vi.importActual('@sentry/utils')) as any;
  return {
    ...original,
    addExceptionMechanism: (...args: unknown[]) => mockAddExceptionMechanism(...args),
  };
});

function getById(_id?: string) {
  throw new Error('error');
}

async function erroringLoad({ params }: Parameters<ServerLoad>[0]): Promise<ReturnType<ServerLoad>> {
  throw error(500, 'error');
  return {
    post: getById(params.id),
  };
}

describe('wrapLoadWithSentry', () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
    mockAddExceptionMechanism.mockClear();
    mockScope = new Scope();
  });

  it('calls captureException', async () => {
    const wrappedLoad = wrapLoadWithSentry(erroringLoad);
    const res = wrappedLoad({ params: { id: '1' } } as any);
    await expect(res).rejects.toThrow();

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
  });

  // it('calls captureException on 500 error', async () => {

  // });

  it('adds an exception mechanism', async () => {
    const addEventProcessorSpy = vi.spyOn(mockScope, 'addEventProcessor').mockImplementationOnce(callback => {
      void callback({}, { event_id: 'fake-event-id' });
      return mockScope;
    });

    const wrappedLoad = wrapLoadWithSentry(erroringLoad);
    const res = wrappedLoad({ params: { id: '1' } } as any);
    await expect(res).rejects.toThrow();

    expect(addEventProcessorSpy).toBeCalledTimes(1);
    expect(mockAddExceptionMechanism).toBeCalledTimes(1);
    expect(mockAddExceptionMechanism).toBeCalledWith(
      {},
      { handled: false, type: 'instrument', data: { function: 'load' } },
    );
  });
});
