/**
 * @param {import('puppeteer').Browser} browser
 */
module.exports = async browser => {
  const targetUrl = process.env.TARGET_URL || 'http://localhost:4200';
  const authPath = '/settings';
  const authUrl = new URL(authPath, targetUrl).toString();
  const appOrigin = new URL(targetUrl).origin;
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];
  const navigationEvents = [];

  const remember = (entries, value) => {
    entries.push(value);
    if (entries.length > 20) {
      entries.shift();
    }
  };

  const formatEntries = (label, entries) => {
    if (entries.length === 0) {
      return `${label}: none`;
    }

    return `${label}:\n- ${entries.join('\n- ')}`;
  };

  const buildDiagnostics = async page => {
    const title = await page.title().catch(() => '(unavailable)');
    const bodyText = await page
      .evaluate(() => document.body?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 1000) || '(empty body)')
      .catch(() => '(failed to read body text)');

    return [
      `Current URL: ${page.url()}`,
      `Page title: ${title}`,
      `Body text: ${bodyText}`,
      formatEntries('Recent navigations', navigationEvents),
      formatEntries('Console messages', consoleMessages),
      formatEntries('Page errors', pageErrors),
      formatEntries('Failed requests', failedRequests),
      formatEntries('HTTP error responses', badResponses),
    ].join('\n');
  };

  // 1. Open a new setup tab in the browser Lighthouse just launched
  const page = await browser.newPage();

  page.on('console', msg => {
    const location = msg.location();
    const suffix = location?.url ? ` (${location.url}${location.lineNumber ? `:${location.lineNumber}` : ''})` : '';
    remember(consoleMessages, `[${msg.type()}] ${msg.text()}${suffix}`);
  });

  page.on('pageerror', error => {
    remember(pageErrors, error?.stack || error?.message || String(error));
  });

  page.on('requestfailed', request => {
    const failure = request.failure();
    remember(failedRequests, `${request.method()} ${request.url()}${failure?.errorText ? ` -> ${failure.errorText}` : ''}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      remember(badResponses, `${response.status()} ${response.url()}`);
    }
  });

  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      remember(navigationEvents, frame.url());
    }
  });

  // 2. Navigate to a protected URL to trigger the Keycloak redirect
  await page.goto(authUrl, { waitUntil: 'domcontentloaded' });

  // 3. Wait until the page either reaches Keycloak or clearly fails elsewhere.
  await page.waitForFunction(
    (expectedAppOrigin, expectedPath) => {
      const url = window.location.href;
      return (
        document.querySelector('#username') != null ||
        document.querySelector('#kc-form-login') != null ||
        url.includes('/protocol/openid-connect/auth') ||
        window.location.pathname === '/accessdenied' ||
        (window.location.origin === expectedAppOrigin &&
          window.location.pathname === expectedPath &&
          (document.body?.innerText?.trim().length ?? 0) > 0)
      );
    },
    {
      timeout: 30_000,
    },
    appOrigin,
    authPath,
  ).catch(async () => {
    throw new Error(`Timed out waiting for the Keycloak login flow.\n${await buildDiagnostics(page)}`);
  });

  const currentUrl = new URL(page.url());

  if (currentUrl.pathname === '/accessdenied') {
    throw new Error(`Reached /accessdenied instead of Keycloak.\n${await buildDiagnostics(page)}`);
  }

  if (currentUrl.origin === appOrigin && currentUrl.pathname === authPath) {
    await page.close();
    return;
  }

  await page.waitForSelector('#username', { timeout: 15_000 }).catch(async () => {
    throw new Error(`Reached Keycloak but the login form did not render.\n${await buildDiagnostics(page)}`);
  });

  // 4. Read credentials from the GitHub Actions environment variables
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;

  if (!username || !password) {
    throw new Error('TEST_USERNAME or TEST_PASSWORD environment variables are missing!');
  }

  // 5. Type the credentials into Keycloak
  await page.type('#username', username);
  await page.type('#password', password);

  // 6. Click login and wait for the redirect back to Angular to finish completely
  await Promise.all([page.click('#kc-login'), page.waitForNavigation({ waitUntil: 'networkidle0' })]);

  // 7. Close this setup tab. Lighthouse takes over the authenticated session.
  await page.close();
};
