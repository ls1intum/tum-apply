# ⚙️ Environment Configuration

## JHipster Environment Files

Node is required for generation and recommended for development. `package.json` is always generated for a better
development experience with prettier, commit hooks, scripts, etc.

In the project root, JHipster generates configuration files for tools like git, prettier, eslint, husky, and others.

## Configuration File Structure

- `.yo-rc.json` - Yeoman configuration file
  JHipster configuration is stored in this file at `generator-jhipster` key. You may find `generator-jhipster-*` for
  specific blueprints configuration.
- `.yo-resolve` (optional) - Yeoman conflict resolver
  Allows to use a specific action when conflicts are found skipping prompts for files that matches a pattern. Each line
  should match `[pattern] [action]` with pattern been a [Minimatch](https://github.com/isaacs/minimatch#minimatch)
  pattern and action been one of skip (default if omitted) or force. Lines starting with `#` are considered comments and
  are ignored.
- `.jhipster/*.json` - JHipster entity configuration files

## NPM Wrapper

`npmw` is a wrapper to use the locally installed npm (as installed by the build tool). Always use `./npmw` instead of
global `npm`.

## Docker Directory

`/src/main/docker` contains Docker configs for the application and its dependencies.
