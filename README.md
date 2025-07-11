# TUMApply

**TUMApply** is a modern, inclusive, and efficient application portal for doctoral programs at the Technical University
of Munich. It streamlines application management, improves usability for applicants and faculty, and supports scalable,
secure, and transparent recruitment processes

## Project Structure

Node is required for generation and recommended for development. `package.json` is always generated for a better
development experience with prettier, commit hooks, scripts and so on.

In the project root, JHipster generates configuration files for tools like git, prettier, eslint, husky, and others that
are well known and you can find references in the web.

`/src/*` structure follows default Java structure.

- `.yo-rc.json` - Yeoman configuration file
  JHipster configuration is stored in this file at `generator-jhipster` key. You may find `generator-jhipster-*` for
  specific blueprints configuration.
- `.yo-resolve` (optional) - Yeoman conflict resolver
  Allows to use a specific action when conflicts are found skipping prompts for files that matches a pattern. Each line
  should match `[pattern] [action]` with pattern been a [Minimatch](https://github.com/isaacs/minimatch#minimatch)
  pattern and action been one of skip (default if omitted) or force. Lines starting with `#` are considered comments and
  are ignored.
- `.jhipster/*.json` - JHipster entity configuration files

- `npmw` - wrapper to use locally installed npm.
  JHipster installs Node and npm locally using the build tool by default. This wrapper makes sure npm is installed
  locally and uses it avoiding some differences different versions can cause. By using `./npmw` instead of the
  traditional `npm` you can configure a Node-less environment to develop or test your application.
- `/src/main/docker` - Docker configurations for the application and services that the application depends on

## Development

### 🛠️ Setting up the Database & Importing Test Data

This project uses MySQL as a relational database. Follow the steps below to get started with the local setup:

#### Requirements

- Docker & Docker Compose:
  - [macOS Installation Guide](https://docs.docker.com/desktop/install/mac-install/)
  - [Windows Installation Guide](https://docs.docker.com/desktop/install/windows-install/)
- MySQL Client (`mysql` CLI) installed and available in `PATH`:
  - **macOS**:
    ```bash
    brew install mysql-client
    echo 'export PATH="/opt/homebrew/opt/mysql-client/bin:$PATH"' >> ~/.zprofile
    source ~/.zprofile
    ```
  - **Windows**: Download via MySQL Installer and ensure the `bin` directory is added to your PATH.

#### Step 1: Start MySQL via Docker

```bash
docker compose -f src/main/docker/mysql.yml up -d
```

This starts a local MySQL instance with the database `tumapply`.

#### Step 2: Apply Liquibase Migrations

```bash
./gradlew liquibaseUpdate
```

> If you encounter errors, ensure the MySQL container is running and reachable.

#### Step 3: Import Example/Test Data

This script automatically imports all SQL files from the `src/main/resources/testdata/` folder, sorted alphabetically.

```bash
bash ./src/main/resources/testdata/import-testdata.sh
```

💡 **Platform Notes:**

- **macOS**: Requires MySQL CLI to be installed via Homebrew (`brew install mysql-client`) and
  available in your `PATH`.
- **Linux**: Requires `mysql` CLI to be installed (`sudo apt install mysql-client` or equivalent).
- **Windows**: Use **Git Bash** to run this script. Make sure the MySQL CLI is installed (via MySQL Installer) and the
  `bin` folder is added to your `PATH`.

---

### 🔁 When Modifying the Schema

- Update Liquibase changelog files under `config/liquibase/changelog`
- Add new files to `master.xml`
- Re-run the update with `./gradlew liquibaseUpdate`

---

### 🔎 Troubleshooting

- ❌ `mysql CLI not found`: Make sure MySQL client is installed and available in your PATH.
- ❌ `Public Key Retrieval is not allowed`: Add `allowPublicKeyRetrieval=true` to the JDBC URL.
- ❌ `Access denied`: Use `root` with an empty password (`""`) unless configured otherwise.

### Doing API-First development using openapi-generator-cli

[OpenAPI-Generator]() is configured for this application. You can generate API code from the
`openapi/openapi.yml` definition file by running:

```bash
./gradlew openApiGenerate
```

Then implements the generated delegate classes with `@Service` classes.

To generate the `openapi.yml` definition file, you can use the following command:

```bash
./gradlew generateApiDocs -x webapp
```

The build system will install automatically the recommended version of Node and npm.

We provide a wrapper to launch npm.
You will only need to run this command when dependencies change in [package.json](package.json).

```
./npmw install
```

We use npm scripts and [Angular CLI][] with [Webpack][] as our build system.

Run the following commands in two separate terminals to create a blissful development experience where your browser
auto-refreshes when files change on your hard drive.

```
./gradlew -x webapp
./npmw start
```

Npm is also used to manage CSS and JavaScript dependencies used in this application. You can upgrade dependencies by
specifying a newer version in [package.json](package.json). You can also run `./npmw update` and `./npmw install` to
manage dependencies.
Add the `help` flag on any command to see how you can use it. For example, `./npmw help update`.

The `./npmw run` command will list all the scripts available to run for this project.

### 🎨 Color System & Theming

TUMApply uses a scalable and customizable theming system that's built on PrimeNG Themes and Tailwind CSS. It supports
both light and dark mode through a centralized theme management.

#### 🧱 Structure

The theming system is structured as follows:

- `src/main/webapp/content/theming/tumapplypreset.ts`: defines the custom PrimeNG theme with TUMApply-specific colors
- CSS variables are provided by PrimeNG's theming system and are available globally
- Tailwind CSS is used for additional styling options and is aligned with the PrimeNG theme

#### 🌞 Light and 🌚 Dark Mode

Theme switching is controlled through the `toggleTheme()` method in the NavbarComponent:

- The selected theme preference is stored in `sessionStorage`
- The theme is toggled by adding/removing the `dark-theme` class to the `<html>` element
- PrimeNG components automatically respond to theme changes

#### 🎨 Using Colors

For consistent designs:

```scss
/* Using PrimeNG variables */
color:
var

(
--text-color

)
;
background-color:
var

(
--surface-ground

)
;

/* Using Tailwind classes */
<
div class

=
"text-primary bg-surface-200 dark:bg-surface-700"
> ...<

/
div >
```

Avoid hard-coded hex values. Instead, use the CSS variables provided by PrimeNG or Tailwind classes.

#### ⚠️ Theme Customization

To customize the theme, edit the color definitions in `src/main/webapp/content/theming/tumapplypreset.ts`

### PWA Support

JHipster ships with PWA (Progressive Web App) support, and it's turned off by default. One of the main components of a
PWA is a service worker.

The service worker initialization code is disabled by default. To enable it, uncomment the following code in
`src/main/webapp/app/app.config.ts`:

```typescript
ServiceWorkerModule.register('ngsw-worker.js', {enabled: false}),
```

### Managing dependencies

For example, to add [Leaflet][] library as a runtime dependency of your application, you would run following command:

```
./npmw install --save --save-exact leaflet
```

To benefit from TypeScript type definitions from [DefinitelyTyped][] repository in development, you would run following
command:

```
./npmw install --save-dev --save-exact @types/leaflet
```

Then you would import the JS and CSS files specified in library's installation instructions so that [Webpack][] knows
about them:
Edit [src/main/webapp/app/app.config.ts](src/main/webapp/app/app.config.ts) file:

```
import 'leaflet/dist/leaflet.js';
```

Edit [src/main/webapp/content/scss/vendor.scss](src/main/webapp/content/scss/vendor.scss) file:

```
@import 'leaflet/dist/leaflet.css';
```

Note: There are still a few other things remaining to do for Leaflet that we won't detail here.

For further instructions on how to develop with JHipster, have a look at [Using JHipster in development][].

### Using Angular CLI

You can also use [Angular CLI][] to generate some custom client code.

For example, the following command:

```
ng generate component my-component
```

will generate few files:

```
create src/main/webapp/app/my-component/my-component.component.html
create src/main/webapp/app/my-component/my-component.component.ts
update src/main/webapp/app/app.config.ts
```

## Building for production

### Packaging as jar

To build the final jar and optimize the TUMApply application for production, run:

```
./gradlew -Pprod clean bootJar
```

This will concatenate and minify the client CSS and JavaScript files. It will also modify `index.html` so it references
these new files.
To ensure everything worked, run:

```
java -jar build/libs/*.jar
```

Then navigate to [http://localhost:8080](http://localhost:8080) in your browser.

Refer to [Using JHipster in production][] for more details.

### Packaging as war

To package your application as a war in order to deploy it to an application server, run:

```
./gradlew -Pprod -Pwar clean bootWar
```

### JHipster Control Center

JHipster Control Center can help you manage and control your application(s). You can start a local control center
server (accessible on http://localhost:7419) with:

```
docker compose -f src/main/docker/jhipster-control-center.yml up
```

## Testing

### Spring Boot tests

To launch your application's tests, run:

```
./gradlew test integrationTest jacocoTestReport
```

### Client tests

Unit tests are run by [Jest][]. They're located near components and can be run with:

```
./npmw test
```

## Others

### Code quality using Sonar

Sonar is used to analyse code quality. You can start a local Sonar server (accessible on http://localhost:9001) with:

```
docker compose -f src/main/docker/sonar.yml up -d
```

Note: we have turned off forced authentication redirect for UI in [src/main/docker/sonar.yml](src/main/docker/sonar.yml)
for out of the box experience while trying out SonarQube, for real use cases turn it back on.

You can run a Sonar analysis with using
the [sonar-scanner](https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner) or by using the gradle
plugin.

Then, run a Sonar analysis:

```
./gradlew -Pprod clean check jacocoTestReport sonarqube -Dsonar.login=admin -Dsonar.password=admin
```

Additionally, Instead of passing `sonar.password` and `sonar.login` as CLI arguments, these parameters can be configured
from [sonar-project.properties](sonar-project.properties) as shown below:

```
sonar.login=admin
sonar.password=admin
```

For more information, refer to the [Code quality page][].

### Docker Compose support

JHipster generates a number of Docker Compose configuration files in the [src/main/docker/](src/main/docker/) folder to
launch required third party services.

For example, to start required services in Docker containers, run:

```
docker compose -f src/main/docker/services.yml up -d
```

- If you encounter a "Public Key Retrieval is not allowed" error when connecting to MySQL, you can fix it by either:
  - Adding `allowPublicKeyRetrieval=true` to your JDBC URL (e.g.,
    `jdbc:mysql://localhost:3306/dbname?allowPublicKeyRetrieval=true&useSSL=false`)
  - Or, if you're using IntelliJ, open the Database tool window, navigate to your MySQL data source, open the driver
    properties, and set `allowPublicKeyRetrieval` to `true` manually.

To stop and remove the containers, run:

```
docker compose -f src/main/docker/services.yml down
```

[Spring Docker Compose Integration](https://docs.spring.io/spring-boot/reference/features/dev-services.html) is enabled
by default. It's possible to disable it in application.yml:

```yaml
spring:
  ...
  docker:
    compose:
      enabled: false
```

You can also fully dockerize your application and all the services that it depends on.
To achieve this, first build a Docker image of your app by running:

```sh
npm run java:docker
```

Or build a arm64 Docker image when using an arm64 processor os like MacOS with M1 processor family running:

```sh
npm run java:docker:arm64
```

Then run:

```sh
docker compose -f src/main/docker/app.yml up -d
```

For more information refer to [Using Docker and Docker-Compose][], this page also contains information on the Docker
Compose sub-generator (`jhipster docker-compose`), which is able to generate Docker configurations for one or several
JHipster applications.

## Continuous Integration (optional)

To configure CI for your project, run the ci-cd sub-generator (`jhipster ci-cd`), this will let you generate
configuration files for a number of Continuous Integration systems. Consult the [Setting up Continuous Integration][]
page for more information.

[JHipster Homepage and latest documentation]: https://www.jhipster.tech
[JHipster 8.9.0 archive]: https://www.jhipster.tech/documentation-archive/v8.9.0
[Using JHipster in development]: https://www.jhipster.tech/documentation-archive/v8.9.0/development/
[Using Docker and Docker-Compose]: https://www.jhipster.tech/documentation-archive/v8.9.0/docker-compose
[Using JHipster in production]: https://www.jhipster.tech/documentation-archive/v8.9.0/production/
[Running tests page]: https://www.jhipster.tech/documentation-archive/v8.9.0/running-tests/
[Code quality page]: https://www.jhipster.tech/documentation-archive/v8.9.0/code-quality/
[Setting up Continuous Integration]: https://www.jhipster.tech/documentation-archive/v8.9.0/setting-up-ci/
[Node.js]: https://nodejs.org/
[NPM]: https://www.npmjs.com/
[OpenAPI-Generator]: https://openapi-generator.tech
[Swagger-Editor]: https://editor.swagger.io
[Doing API-First development]: https://www.jhipster.tech/documentation-archive/v8.9.0/doing-api-first-development/
[Webpack]: https://webpack.github.io/
[BrowserSync]: https://www.browsersync.io/
[Jest]: https://jestjs.io
[Leaflet]: https://leafletjs.com/
[DefinitelyTyped]: https://definitelytyped.org/
[Angular CLI]: https://cli.angular.io/
