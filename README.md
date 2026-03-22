# 🎓 TUMApply – Application Portal for Doctoral Candidates

**TUMApply** is a modern, inclusive, and efficient application portal for doctoral positions at the Technical University
of Munich. It streamlines application management, improves usability for applicants and research groups, and supports
scalable, secure, and transparent recruitment processes.

## 👥 Who is this for?

- **Applicants**: Search and apply for open doctoral positions across all TUM research groups.
- **Professors and Research Groups**: Create job positions, review applications, and manage evaluations in one place.

## 🚀 What can you do on TUMApply?

### For Applicants

- Browse doctoral openings across TUM ([Video](https://live.rbg.tum.de/w/artemisintro/61935))
- View job details and requirements ([Video](https://live.rbg.tum.de/w/artemisintro/61934))
- Apply with your documents (CV, transcripts, motivation letter,
  etc.) ([Video](https://live.rbg.tum.de/w/artemisintro/61939))
- Save, submit and delete application drafts ([Save](https://live.rbg.tum.de/w/artemisintro/61942)) ([
  Submit](https://live.rbg.tum.de/w/artemisintro/61941)) ([
  Delete](https://live.rbg.tum.de/w/artemisintro/61940))
- Track/Review your application details and submission for multiple
  positions ([Video](https://live.rbg.tum.de/w/artemisintro/61943))
- Withdraw applications ([Video](https://live.rbg.tum.de/w/artemisintro/61944))
- Get notified when a decision is made

### For Professors & Research Groups

- Create and publish doctoral positions ([Video](https://live.rbg.tum.de/w/artemisintro/61937))
- View published positions ([Video](https://live.rbg.tum.de/w/artemisintro/61932))
- View position details ([Video](https://live.rbg.tum.de/w/artemisintro/61933))
- Edit jobs ([Video](https://live.rbg.tum.de/w/artemisintro/61936))
- Close and delete job postings ([Video](https://live.rbg.tum.de/w/artemisintro/61938))
- Manage incoming applications ([Video](https://live.rbg.tum.de/w/artemisintro/61948))
- Evaluate candidates and assign
  status ([Review](https://live.rbg.tum.de/w/artemisintro/61947)) ([Accept](https://live.rbg.tum.de/w/artemisintro/61945))
  ([Reject](https://live.rbg.tum.de/w/artemisintro/61946))
- Notify applicants directly via the system

## 🧭 How to Get Started

1. Visit the portal: [TUMApply](https://tumapply.aet.cit.tum.de/)
2. Browse available doctoral positions
3. Register/Log in with your preferred account
4. Start applying or managing applications

## Registration

New users can register directly on the TUMApply portal using their email address or social login
options. ([Video](https://live.rbg.tum.de/w/artemisintro/67995))

## 🔐 Login

TUMApply supports **secure login** via:

- TUM Single Sign-On (SSO) ([Video](https://live.rbg.tum.de/w/artemisintro/67993))
- Apple and Google
- Email and code ([Video](https://live.rbg.tum.de/w/artemisintro/67994))
- Email and password ([Video](https://live.rbg.tum.de/w/artemisintro/67996))

## 🧱 Architecture Overview

TUMApply is designed with modularity, scalability, and maintainability in mind. While it follows a monolithic
architecture for now, clear service boundaries allow for potential migration to microservices in the future.

### Technology Stack

| Component      | Technology                         |
| -------------- | ---------------------------------- |
| Client         | Angular                            |
| Server         | Spring Boot (Java)                 |
| Proxy          | Nginx                              |
| Database       | MySQL with Hibernate               |
| Authentication | Keycloak (with Google / Apple SSO) |
| Deployment     | GitHub + GitHub Actions (CI/CD)    |

### Core Modules & Responsibilities

| Module/Service         | Responsibilities                                     |
| ---------------------- | ---------------------------------------------------- |
| User Authentication    | Handles logins via Keycloak                          |
| Job Management         | Professors create and manage doctoral positions      |
| Application Handling   | Applicants submit documents for a position           |
| Evaluation System      | Professors review, rate, and comment on applications |
| User Management System | Manage users, roles, and permissions                 |
| Notification System    | Sends automated status updates via email             |

### Areas of Work

| Area                      | Tasks                                                       |
| ------------------------- | ----------------------------------------------------------- |
| Client-Side               | Angular UI development with role-based views                |
| Server-Side               | Implement REST APIs using Spring Boot                       |
| Database Management       | Design and optimize MySQL schema                            |
| Authentication & Security | Keycloak integration for user and role handling             |
| Proxy & Load Balancing    | Nginx setup for secure request routing                      |
| CI/CD Pipeline            | Automated builds, tests, and deployments via GitHub Actions |

### UML Diagram

![TUMApply Project Architecture UML Diagram](docs-github/architecture/tumapply-project-architecture.svg)

## 📄 Documentation for Developers

If you're a developer or contributor, head over to the full documentation on our [Docusaurus site](https://ls1intum.github.io/tum-apply/developer/intro):

- 📚 [Development Setup](https://ls1intum.github.io/tum-apply/developer/setup/dev-environment)
- 💡 [General Documentation](https://ls1intum.github.io/tum-apply/developer/general/general-documentation)
- 🧪 [Testing Guide](https://ls1intum.github.io/tum-apply/developer/testing/testing-guide)
- 🎨 [Theming & Color Tokens](https://ls1intum.github.io/tum-apply/developer/theming/color-theming)
- 💼 [Job Documentation](https://ls1intum.github.io/tum-apply/developer/modules/job)
- 📝 [Application Documentation](https://ls1intum.github.io/tum-apply/developer/modules/application)
- 📊 [Evaluation Documentation](https://ls1intum.github.io/tum-apply/developer/modules/evaluation)

Full documentation is available on the [Developer Docs](https://ls1intum.github.io/tum-apply/developer/intro) site.

---

© 2025 Technische Universität München – Built with ❤️ by the TUMApply Team at [Applied Education
Technologies (AET)](https://aet.cit.tum.de/)
