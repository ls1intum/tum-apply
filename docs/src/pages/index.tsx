import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function FAQSection() {
  return (
    <section
      style={{
        maxWidth: 800,
        margin: '2rem auto',
        padding: '2rem',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
      }}
    >
      <h2>Frequently Asked Questions (FAQ)</h2>
      <p>
        This FAQ page provides quick answers to the most common questions from users of TUMApply. If you need more help with a specific
        topic, please refer to the relevant section in the documentation or contact our support team.
      </p>
      <hr />
      <details className={styles.faqDetails}>
        <summary>
          <strong>Do I need an account to browse positions?</strong>
        </summary>
        <div style={{ marginTop: '0.5rem' }}>
          No. You can search and view all open positions on TUMApply without creating an account.
          <br />
          If you want to apply for a position or save your personal data, you need to create an account.
        </div>
      </details>
      <hr />
      <details className={styles.faqDetails}>
        <summary>
          <strong>How do I create an account?</strong>
        </summary>
        <div style={{ marginTop: '0.5rem' }}>
          Applicants can register with Google, Apple, or email. Professors automatically get an account when they log in with their TUM ID.
        </div>
      </details>
      <hr />
      <details className={styles.faqDetails}>
        <summary>
          <strong>How do I log in?</strong>
        </summary>
        <div style={{ marginTop: '0.5rem' }}>
          <strong>Applicants:</strong> To log in, go to the <a href="https://tumapply.aet.cit.tum.de/">TUMApply</a> page and click on the{' '}
          <strong>Login</strong> button in the top-right corner. You can then choose one of three options – email + verification code,
          Google or Apple.
          <br />
          <br />
          <strong>Professors:</strong> To log in, go to the <a href="https://tumapply.aet.cit.tum.de/professor">TUMApply Professor</a> page
          and click on the <strong>Login</strong> button in the top-right corner. Use your TUM ID and TUM password to sign in via the TUM
          Login system. No separate registration is required – your account is created automatically.
        </div>
      </details>
      <hr />
      <details className={styles.faqDetails}>
        <summary>
          <strong>I did not receive my email code. What can I do?</strong>
        </summary>
        <div style={{ marginTop: '0.5rem' }}>First, check your spam folder. If no code arrived, request a new one in the login dialog.</div>
      </details>
      <hr />
      <details className={styles.faqDetails}>
        <summary>
          <strong>What are Research Groups?</strong>
        </summary>
        <div style={{ marginTop: '0.5rem' }}>
          Research Groups are usually equivalent to chairs and professorships at TUM. They are needed for professors to manage applications
          and postings.
        </div>
      </details>
      <hr />
      <details className={styles.faqDetails}>
        <summary>
          <strong>I am a professor and don’t see my professor rights. What should I do?</strong>
        </summary>
        <div style={{ marginTop: '0.5rem' }}>
          On first login, you only have applicant rights. Please send us an email with the name of your Research Group and its head. Our
          team will assign your rights and confirm by email.
        </div>
      </details>
      <hr />
      <details className={styles.faqDetails}>
        <summary>
          <strong>Can I apply without an account?</strong>
        </summary>
        <div style={{ marginTop: '0.5rem' }}>
          No. You can browse all open positions without an account, but as soon as you want to apply, you must create an account.
        </div>
      </details>
    </section>
  );
}

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          Welcome to the TUMApply User Documentation
        </Heading>
        <p className="hero__subtitle">The official guide for Applicants and Professors using TUMApply.</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/applicants/account-creation">
            Get Started →
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout title={`TUMApply Documentation`} description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <FAQSection />
    </Layout>
  );
}
