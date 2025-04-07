<!-- Thanks for contributing to Artemis! Before you submit your pull request, please make sure to check all tasks by putting an x in the [ ] (don't: [x ], [ x], do: [x]). Remove not applicable tasks and do not leave them unchecked -->
<!-- If your pull request is not ready for review yet, create a draft pull request! -->

### Checklist

#### General

<!-- Remove tasks that are not applicable for your PR. Please only put the PR into ready for review, if all relevant tasks are checked! -->
<!-- You only need to choose one of the first two check items: Generally, test on the test servers. -->
<!-- If it's only a small change, testing it locally is acceptable, and you may remove the first checkmark. If you are unsure, please test on the test servers. -->

- [ ] I tested **all** changes and their related features with **all** corresponding user types.
- [ ] This is a small issue that I tested locally and was confirmed by another developer.
- [ ] Language: I followed the [guidelines for inclusive, diversity-sensitive, and appreciative language](https://docs.artemis.cit.tum.de/dev/guidelines/language-guidelines/).
- [ ] I chose a title conforming to the [naming conventions for pull requests](https://docs.artemis.cit.tum.de/dev/development-process/development-process.html#naming-conventions-for-github-pull-requests).

#### Server

- [ ] **Important**: I implemented the changes with a [very good performance](https://docs.artemis.cit.tum.de/dev/guidelines/performance/) and prevented too many (unnecessary) and too complex database calls.
- [ ] I **strictly** followed the principle of **data economy** for all database calls.
- [ ] I **strictly** followed the [server coding and design guidelines](https://docs.artemis.cit.tum.de/dev/guidelines/server/).
- [ ] I added multiple integration tests (Spring) related to the features (with a high test coverage).
- [ ] I added pre-authorization annotations according to the [guidelines](https://docs.artemis.cit.tum.de/dev/guidelines/server/#rest-endpoint-best-practices-for-authorization) and checked the course groups for all new REST Calls (security).
- [ ] I documented the Java code using JavaDoc style.

#### Client

- [ ] **Important**: I implemented the changes with a very good performance, prevented too many (unnecessary) REST calls and made sure the UI is responsive, even with large data (e.g. using paging).
- [ ] I **strictly** followed the principle of **data economy** for all client-server REST calls.
- [ ] I **strictly** followed the [client coding and design guidelines](https://docs.artemis.cit.tum.de/dev/guidelines/client/).
- [ ] Following the [theming guidelines](https://docs.artemis.cit.tum.de/dev/guidelines/client-design/), I specified colors only in the theming variable files and checked that the changes look consistent in both the light and the dark theme.
- [ ] I added multiple integration tests (Jest) related to the features (with a high test coverage), while following the [test guidelines](https://docs.artemis.cit.tum.de/dev/guidelines/client-tests/).
- [ ] I added `authorities` to all new routes and checked the course groups for displaying navigation elements (links, buttons).
- [ ] I documented the TypeScript code using JSDoc style.
- [ ] I added multiple screenshots/screencasts of my UI changes.
- [ ] I translated all newly inserted strings into English and German.

### Motivation and Context

<!-- Why is this change required? What problem does it solve? -->
<!-- If it fixes an open issue, please link to the issue here. -->

### Description

<!-- Describe your changes in detail -->

### Steps for Testing

<!-- Please describe in detail how reviewers can test your changes. Make sure to take all related features and views into account! Below is an example that you can refine. -->

Prerequisites:

1. Log in to TumApply
2.

### Review Progress

<!-- Each PR should be reviewed by at least one other developers. The code, the functionality (= manual test). -->
<!-- The reviewer or author check the following boxes depending on what was reviewed or tested. All boxes should be checked before merge. -->
<!-- You can add additional checkboxes if it makes sense to only review parts of the code or functionality. -->
<!-- When changes are pushed, uncheck the affected boxes. (Not all changes require full re-reviews.) -->

#### Code Review

- [ ] Code Review 1

#### Manual Tests

- [ ] Test 1

#### Performance Tests

- [ ] Test 1

### Test Coverage

<!-- Please add the test coverages for all changed files modified in this PR here. -->
<!-- You can execute the tests locally (see build.gradle and package.json) or look into the corresponding artefacts. -->
<!-- The line coverage must be above 90% for changes files, and you must use extensive and useful assertions for server tests and expect statements for client tests. -->
<!-- Note: Confirm in the last column that you have implemented extensive assertions for server tests and expect statements for client tests. -->
<!--       Remove rows with only trivial changes from the table. -->
<!--
| Class/File | Line Coverage | Confirmation (assert/expect) |
|------------|--------------:|-----------------------------:|
| ExerciseService.java | 85% | ✅                           |
| programming-exercise.component.ts | 95% | ✅              |
-->

### Screenshots

<!-- Add screenshots to demonstrate the changes in the UI. Remove the section if you did not change the UI. -->
<!-- Create a GIF file from a screen recording in a docker container https://toub.es/2017/09/11/high-quality-gif-with-ffmpeg-and-docker/ -->
