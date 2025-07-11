# TUMApply

**TUMApply** is a modern, inclusive, and efficient application portal for doctoral programs at the Technical University
of Munich. It streamlines application management, improves usability for applicants and faculty, and supports scalable,
secure, and transparent recruitment processes

### PWA Support

JHipster ships with PWA (Progressive Web App) support, and it's turned off by default. One of the main components of a
PWA is a service worker.

The service worker initialization code is disabled by default. To enable it, uncomment the following code in
`src/main/webapp/app/app.config.ts`:

```typescript
ServiceWorkerModule.register('ngsw-worker.js', {enabled: false}),
```
