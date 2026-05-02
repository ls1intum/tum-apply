/**
 * @param {import('puppeteer').Browser} browser
 */
module.exports = async browser => {
  const targetUrl = process.env.TARGET_URL || 'http://localhost:4200';
  const authPath = '/settings';
  const authUrl = new URL(authPath, targetUrl).toString();
  const appOrigin = new URL(targetUrl).origin;

  // 1. Open a new setup tab in the browser Lighthouse just launched
  const page = await browser.newPage();

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
    throw new Error(`Timed out waiting for the Keycloak login flow at ${page.url()}.`);
  });

  const currentUrl = new URL(page.url());

  if (currentUrl.pathname === '/accessdenied') {
    throw new Error(`Reached /accessdenied instead of Keycloak from ${authUrl}.`);
  }

  if (currentUrl.origin === appOrigin && currentUrl.pathname === authPath) {
    await page.close();
    return;
  }

  await page.waitForSelector('#username', { timeout: 15_000 }).catch(() => {
    throw new Error(`Reached Keycloak but the login form did not render at ${page.url()}.`);
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
