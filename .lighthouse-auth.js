/**
 * @param {import('puppeteer').Browser} browser
 */
module.exports = async browser => {
  // 1. Open a new setup tab in the browser Lighthouse just launched
  const page = await browser.newPage();

  // 2. Navigate to a protected URL to trigger the Keycloak redirect
  await page.goto('http://localhost:4200/my-positions');

  // 3. Wait for the Keycloak login form to fully render
  await page.waitForSelector('#username');

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
