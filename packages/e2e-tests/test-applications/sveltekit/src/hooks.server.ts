import { env } from '$env/dynamic/private';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  environment: 'qa', // dynamic sampling bias to keep transactions
  dsn: env.E2E_TEST_DSN,
  debug: true,
  tunnel: `http://localhost:${Number(env.BASE_PORT) + Number(env.PORT_MODULO) + Number(env.PORT_GAP)}/`, // proxy server
  tracesSampleRate: 1.0,
});

const myErrorHandler = ({ error, event }: any) => {
  console.error('An error occurred on the server side:', error, event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);

export const handle = Sentry.sentryHandle();
