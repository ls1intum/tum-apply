# Client Best Practices

Essential patterns and common mistakes for client development in TUMApply.

---

## 🔧 **TypeScript / Component Patterns**

### 11. **Use `inject()` for Dependency Injection**

✅ **GOOD:**

```typescript
export class MyComponent {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private api = inject(ApplicationResourceApiService);
}
```

❌ **OLD STYLE:**

```typescript
constructor(
  private router: Router,
  private toastService: ToastService
) { }
```

---

### 12. **Handle Async Operations with `async/await`**

✅ **GOOD:**

```typescript
async loadApplications(): Promise<void> {
  this.isLoading.set(true);
  try {
    const apps = await firstValueFrom(this.api.getApplications());
    this.applications.set(apps);
  } catch (error) {
    this.toastService.showError('Failed to load applications');
  } finally {
    this.isLoading.set(false);
  }
}
```

❌ **AVOID** — Manual subscriptions:

```typescript
loadApplications(): void {
  this.api.getApplications().subscribe({
    next: apps => this.applications.set(apps),
    error: err => this.handleError(err)
  }); // Memory leak if not unsubscribed
}
```

---

### 13. **Use `computed()` for Derived State**

✅ **GOOD:**

```typescript
applications = signal<ApplicationDTO[]>([]);
searchTerm = signal('');

// Automatically memoized, reactive
filteredApplications = computed(() => this.applications().filter(app => app.name.toLowerCase().includes(this.searchTerm().toLowerCase())));
```

❌ **AVOID** — Getters (recalculate on every change detection):

```typescript
get filteredApplications(): ApplicationDTO[] {
  return this.applications().filter(app =>
    app.name.toLowerCase().includes(this.searchTerm().toLowerCase())
  );
}
```

---

### 14. **Use `effect()` Only for Side Effects**

✅ **GOOD** — Side effects (DOM, logging, API calls):

```typescript
constructor() {
  effect(() => {
    console.log('Count changed:', this.count());
  });

  effect(() => {
    void this.saveToStorage(this.formData());
  });
}
```

❌ **WRONG** — Deriving values (use `computed()` instead):

```typescript
constructor() {
  effect(() => {
    // ❌ Don't do this
    this.doubleCount = this.count() * 2;
  });
}

// ✅ Use computed instead
doubleCount = computed(() => this.count() * 2);
```

---

## 🎯 **Angular Template Patterns**

### 8. **Use Modern Control Flow (`@if`, `@for`, `@switch`)**

✅ **GOOD** — Modern Angular 17+ syntax:

```html
@if (applications(); as apps) { @if (apps.length > 0) { @for (app of apps; track app.id) {
<jhi-application-card [application]="app" />
} } @else {
<p>No applications found</p>
} }
```

❌ **OLD SYNTAX** — Don't use in new code:

```html
<ng-container *ngIf="applications() as apps">
  <div *ngIf="apps.length > 0; else empty">
    <jhi-application-card *ngFor="let app of apps; trackBy: trackById" [application]="app" />
  </div>
  <ng-template #empty>
    <p>No applications found</p>
  </ng-template>
</ng-container>
```

---

### 9. **Internationalization (i18n)**

✅ **ALL user-visible text must use translation:**

```html
<!-- Simple translation -->
<h1 jhiTranslate="application.title">Application</h1>

<!-- With parameters -->
<span [jhiTranslate]="'application.count'" [translateValues]="{ count: count() }"> {{ count() }} applications </span>

<!-- In attributes -->
<jhi-button [label]="'button.save'" [shouldTranslate]="true" />
```

❌ **NEVER hard-code user-visible text:**

```html
<h1>Application</h1>
<button>Save</button>
```

---

### 10. **Component Communication**

✅ **GOOD** — Use signals for inputs/outputs:

```typescript
export class MyComponent {
  // Inputs
  title = input.required<string>();
  count = input<number>(0);

  // Outputs
  countChange = output<number>();

  // Internal state
  isLoading = signal(false);

  // Derived state
  displayText = computed(() => `${this.title()}: ${this.count()}`);
}
```

```html
<jhi-my-component [title]="'My Title'" [count]="count()" (countChange)="onCountChange($event)" />
```

❌ **AVOID** — Old decorator syntax for new code:

```typescript
@Input() title!: string;
@Output() countChange = new EventEmitter<number>();
```

---

## 🎨 **Styling & HTML Best Practices**

### 1. **NEVER Hard-Code Colors**

❌ **WRONG**:

```html
<!-- Hard-coded Tailwind colors -->
<div class="border-blue-300 bg-blue-50">...</div>
<div class="text-gray-700 bg-amber-100">...</div>
<div class="text-blue-600 hover:underline">...</div>

<!-- Hard-coded colors in conditional classes -->
<div [class]="isError ? 'bg-amber-100 text-amber-900' : 'bg-blue-50 text-sky-700'"></div>
```

✅ **CORRECT** — Use semantic color tokens:

```html
<!-- Tailwind semantic tokens -->
<div class="border-border-default bg-background-surface">...</div>
<div class="text-text-primary bg-background-default">...</div>
<a class="text-primary-default hover:underline">...</a>

<!-- Semantic tokens in conditional classes -->
<div [class]="isError ? 'bg-negative-default text-text-on-danger' : 'bg-info-default text-text-on-info'"></div>
```

**Why:** Hard-coded colors break dark mode, custom themes (blossom, aquabloom), and maintainability.

See [Color Theming Documentation](../theming/color-theming.md) for complete reference.

---

### 2. **Avoid Inline Styles**

❌ **WRONG**:

```html
<span style="font-weight: bold">Text</span>

<div style="grid-template-columns: repeat(auto-fit, minmax(min(100%, 13.75rem), 1fr))">...</div>

<!-- Mixing inline styles with bindings -->
<p [style.color]="'var(--p-text-disabled)'">...</p>
```

✅ **CORRECT** — Use Tailwind classes only:

```html
<!-- Use Tailwind utility classes -->
<span class="font-bold">Text</span>

<!-- Complex layouts use Tailwind grid utilities -->
<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.75rem),1fr))] gap-4">...</div>

<!-- Conditional styling with class binding -->
<p [class.text-text-disabled]="isDisabled()">...</p>
```

---

### 3. **Use Conditional Class Bindings Correctly**

✅ **GOOD** — Single conditional class:

```html
<div [class.active]="isActive()">...</div>
<div [class.disabled]="disabled()">...</div>
<div [class.error]="inputState() === 'invalid'">...</div>
```

✅ **GOOD** — Multiple conditional classes:

```html
<div class="card" [class.disabled]="disabled()" [class.placeholder]="placeholder()">...</div>
```

❌ **AVOID** — Using `ngClass`:

```html
<!-- ❌ Don't use ngClass -->
<div [ngClass]="{ active: isActive() }">...</div>
<div
  [ngClass]="{
    'border-negative-default': hasError(),
    'border-warning-default': hasWarning()
  }"
>
  ...
</div>

<!-- ✅ Use [class.xyz] for simple conditions -->
<div [class.active]="isActive()">...</div>

<!-- ✅ Use computed() for complex conditions (see next section) -->
<div [class]="borderClasses()">...</div>
```

**Why avoid `ngClass`?** With `computed()` signals and `[class]` binding, there's no need for the object-based `ngClass` syntax. Computed signals are more maintainable and type-safe.

---

### 4. **Use Computed Signals for Complex Conditional Styling**

When you have complex conditional logic determining which classes to apply, use `computed()` to derive the class string or object.

✅ **GOOD** — Compute complex class logic:

```typescript
// Component
status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
hasWarning = signal(false);

// Computed class string
statusClasses = computed(() => {
  const status = this.status();
  const baseClasses = 'px-4 py-2 rounded-lg border';

  if (status === 'error') {
    return `${baseClasses} bg-negative-surface border-negative-default text-text-on-danger`;
  }
  if (status === 'success') {
    return `${baseClasses} bg-positive-surface border-positive-default text-text-on-success`;
  }
  if (status === 'loading') {
    return `${baseClasses} bg-info-surface border-info-default text-text-on-info`;
  }
  if (this.hasWarning()) {
    return `${baseClasses} bg-warning-surface border-warning-default text-text-on-warning`;
  }
  return `${baseClasses} bg-background-surface border-border-default`;
});
```

```html
<!-- Template -->
<div [class]="statusClasses()">Status message</div>
```

✅ **ALSO GOOD** — Build class string conditionally:

```typescript
buttonClasses = computed(() => {
  const classes = ['px-4', 'py-2', 'rounded-lg', 'transition-colors'];

  if (!this.disabled() && !this.loading()) {
    classes.push('bg-primary-default', 'hover:bg-primary-hover');
  }
  if (this.disabled()) {
    classes.push('bg-background-disabled', 'cursor-not-allowed');
  }
  if (this.loading()) {
    classes.push('opacity-50', 'cursor-wait');
  }
  if (this.variant() === 'elevated') {
    classes.push('shadow-lg');
  }
  if (this.variant() === 'outlined') {
    classes.push('border-2');
  }

  return classes.join(' ');
});
```

```html
<button [class]="buttonClasses()">Submit</button>
```

**When to use computed for styling:**

- More than 3-4 conditional branches
- Same conditions used in multiple places
- Complex logic that would clutter the template
- Dynamic combinations of multiple state signals

❌ **AVOID** — Complex logic directly in template:

```html
<!-- Hard to read and maintain -->
<div
  [class]="status() === 'error' ? 'bg-negative-surface border-negative-default' : 
           status() === 'success' ? 'bg-positive-surface border-positive-default' : 
           status() === 'loading' ? 'bg-info-surface border-info-default' : 
           hasWarning() ? 'bg-warning-surface border-warning-default' : 'bg-background-surface'"
></div>
```

---

### 5. **Don't Mix CSS Variables with Tailwind Arbitrary Values**

❌ **WRONG**:

```html
<i class="text-[var(--p-primary-400)]"></i> <span class="text-[var(--p-text-tertiary)]"></span>
```

✅ **CORRECT** — Use the semantic token directly:

```html
<i class="text-primary-default"></i> <span class="text-text-tertiary"></span>
```

**Why:** The semantic tokens are already mapped in `_tokens.scss`. Using arbitrary values bypasses the system.

---

### 6. **Use Custom Arbitrary Values for Specific Needs**

✅ **ACCEPTABLE** — Specific layout needs:

```html
<!-- When standard Tailwind values don't fit -->
<div class="max-w-[75rem]">...</div>
<div class="w-[30%]">...</div>
<div class="min-w-[16.5rem]">...</div>
```

✅ **ACCEPTABLE** — Complex calculations (keep them readable):

```html
<!-- Complex but necessary calculations -->
<div class="w-[calc(100%+2rem)] lg:w-[calc(100%+8rem)]">...</div>

<!-- Grid with specific patterns -->
<div class="grid-cols-[repeat(auto-fit,minmax(13.75rem,1fr))]">...</div>
```

**Tip:** For frequently used custom values, consider adding them to the Tailwind config instead.

---

### 7. **Structure Responsive Classes Consistently**

✅ **GOOD** — Mobile-first, ordered by breakpoint:

```html
<div class="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">...</div>

<div class="text-sm md:text-base lg:text-lg">...</div>
```

❌ **CONFUSING** — Mixed breakpoints:

```html
<div class="lg:gap-8 flex-col gap-4 md:flex-row md:gap-6 flex">...</div>
```

**Order:** Base classes → `sm:` → `md:` → `lg:` → `xl:` → `2xl:`

---

## 📚 **Related Documentation**

- [Color Theming & Styling](../theming/color-theming.md) — Complete theming guide
- [General Documentation](./general-documentation.md) — Cross-cutting conventions
- [Testing Guide](../testing/testing-guide.md) — Testing patterns
