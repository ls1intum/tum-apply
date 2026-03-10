# Client Best Practices

Essential patterns and common mistakes for client development in TUMApply.

---

## 🔧 **TypeScript / Component Patterns**

### 1. **Use `inject()` for Dependency Injection**

✅ **GOOD:**

```typescript
export class MyComponent {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private api = inject(ApplicationResourceApiService);
}
```

❌ **AVOID** — Old constructor injection:

```typescript
constructor(
  private router: Router,
  private toastService: ToastService
) { }
```

---

### 2. **Handle Async Operations with `async/await`**

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

### 3. **Use `computed()` for Derived State**

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

### 4. **Use `effect()` Only for Side Effects**

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

### 5. **Use Modern Control Flow (`@if`, `@for`, `@switch`)**

✅ **GOOD** — Modern Angular 17+ syntax:

```html
@if (applications(); as apps) { @if (apps.length > 0) { @for (app of apps; track app.id) {
<jhi-application-card [application]="app" />
} } @else {
<p>No applications found</p>
} }
```

❌ **AVOID** — Old structural directives:

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

### 6. **Internationalization (i18n)**

✅ **GOOD** — All user-visible text must use translation:

```html
<!-- Simple translation -->
<h1 jhiTranslate="application.title">Application</h1>

<!-- With parameters -->
<span [jhiTranslate]="'application.count'" [translateValues]="{ count: count() }"> {{ count() }} applications </span>

<!-- In attributes -->
<jhi-button [label]="'button.save'" [shouldTranslate]="true" />
```

❌ **WRONG** — Never hard-code user-visible text:

```html
<h1>Application</h1>
<button>Save</button>
```

---

### 7. **Component Communication**

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

### 8. **NEVER Hard-Code Colors**

✅ **GOOD** — Use semantic color tokens:

```html
<!-- Tailwind semantic tokens -->
<div class="border-border-default bg-background-surface">...</div>
<div class="text-text-primary bg-background-default">...</div>
<a class="text-primary-default hover:underline">...</a>

<!-- Semantic tokens in conditional classes -->
<div [class]="isError ? 'bg-negative-default text-text-on-danger' : 'bg-info-default text-text-on-info'"></div>
```

❌ **WRONG**:

```html
<!-- Hard-coded Tailwind colors -->
<div class="border-blue-300 bg-blue-50">...</div>
<div class="text-gray-700 bg-amber-100">...</div>
<div class="text-blue-600 hover:underline">...</div>

<!-- Hard-coded colors in conditional classes -->
<div [class]="isError ? 'bg-amber-100 text-amber-900' : 'bg-blue-50 text-sky-700'"></div>
```

**Why:** Hard-coded colors break dark mode, custom themes (blossom, aquabloom), and maintainability.

See [Color Theming Documentation](../theming/color-theming.md) for complete reference.

---

### 9. **Avoid Inline Styles**

✅ **GOOD** — Use Tailwind classes only:

```html
<!-- Use Tailwind utility classes -->
<span class="font-bold">Text</span>

<!-- Complex layouts use Tailwind grid utilities -->
<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.75rem),1fr))] gap-4">...</div>

<!-- Conditional styling with class binding -->
<p [class.text-text-disabled]="isDisabled()">...</p>
```

❌ **WRONG**:

```html
<span style="font-weight: bold">Text</span>

<div style="grid-template-columns: repeat(auto-fit, minmax(min(100%, 13.75rem), 1fr))">...</div>

<!-- Mixing inline styles with bindings -->
<p [style.color]="'var(--p-text-disabled)'">...</p>
```

---

### 10. **Use Conditional Class Bindings Correctly**

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

### 11. **Use Computed Signals for Complex Conditional Styling**

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

### 12. **Don't Mix CSS Variables with Tailwind Arbitrary Values**

✅ **GOOD** — Use the semantic token directly:

```html
<i class="text-primary-default"></i> <span class="text-text-tertiary"></span>
```

❌ **WRONG**:

```html
<i class="text-[var(--p-primary-400)]"></i> <span class="text-[var(--p-text-tertiary)]"></span>
```

**Why:** The semantic tokens are already mapped in `_tokens.scss`. Using arbitrary values bypasses the system.

---

### 13. **Use Custom Arbitrary Values for Specific Needs**

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

### 14. **Structure Responsive Classes Consistently**

✅ **GOOD** — Mobile-first, ordered by breakpoint:

```html
<div class="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">...</div>

<div class="text-sm md:text-base lg:text-lg">...</div>
```

❌ **WRONG** — Mixed breakpoints:

```html
<div class="lg:gap-8 flex-col gap-4 md:flex-row md:gap-6 flex">...</div>
```

**Order:** Base classes → `sm:` → `md:` → `lg:` → `xl:` → `2xl:`

---

### 15. **Styling PrimeNG Components**

PrimeNG components use `styleClass` (and variants like `dialogStyleClass`, `contentStyleClass`, etc.) to accept custom CSS classes.

#### **When to Use `styleClass` vs Global Overrides**

**Use `styleClass` for:**

- ✅ Component-specific, one-off styling unique to a particular usage
- ✅ Layout and spacing adjustments (margins, padding, width, alignment)
- ✅ Conditional styling based on component state

**Use `prime-ng-overrides.scss` for:**

- ✅ Application-wide PrimeNG component defaults (all buttons, all dialogs, etc.)
- ✅ PrimeNG CSS variable customizations (`--p-stepper-step-number-size`, etc.)
- ✅ Theme-related adjustments that apply globally
- ✅ Fixing PrimeNG internal DOM structure styling (`.p-carousel-indicators`, etc.)

**Example decision tree:**

```
Is this styling needed in multiple places across the app?
├─ YES → Is it modifying PrimeNG internals (.p-* classes)?
│  ├─ YES → Add to prime-ng-overrides.scss
│  └─ NO  → Use Tailwind in styleClass
└─ NO  → Use Tailwind in styleClass
```

#### **Using `styleClass` (Component-Specific Styling)**

✅ **GOOD** — Tailwind utilities only:

```html
<!-- Simple Tailwind classes -->
<p-progressSpinner styleClass="w-10 h-10" strokeWidth="4" />
<p-divider layout="vertical" styleClass="mx-2 hidden lg:block" />
<jhi-message severity="warn" styleClass="mb-3" [message]="'...'" />

<!-- With semantic tokens -->
<p-dialog [styleClass]="'max-w-4xl bg-background-surface border-border-default'" />
```

✅ **GOOD** — Use computed for dynamic styling:

```typescript
// Component
mode = signal<'ACCEPT' | 'REJECT'>('ACCEPT');

dialogClasses = computed(() => {
  const base = 'p-6 rounded-lg shadow-lg';
  const modeClass =
    this.mode() === 'REJECT'
      ? 'border-2 border-negative-default bg-negative-surface'
      : 'border-2 border-positive-default bg-positive-surface';
  return `${base} ${modeClass}`;
});
```

```html
<p-dialog [styleClass]="dialogClasses()" />
```

#### **Using `prime-ng-overrides.scss` (Global Defaults)**

✅ **GOOD** — Application-wide defaults:

```scss
// prime-ng-overrides.scss

:root {
  // Override PrimeNG design tokens globally
  --p-stepper-step-number-size: 1.75rem;
  --p-stepper-step-number-font-size: 1rem;
  --p-accordion-header-background: var(--p-background-default);
}

// Style all tags globally
.p-tag {
  border: 0.1rem solid var(--p-border-default) !important;
}

// Fix PrimeNG internal structure for specific components
.p-select-filter.p-component.p-inputtext {
  border: 0.1rem solid var(--p-border-default);

  &:enabled:focus {
    border-color: var(--p-primary-color);
  }
}
```

---

## ⚠️ **Avoid Redundant Styling**

Before adding Tailwind utilities, **check if the styling is already applied** by base styles or component defaults.

```html
<!-- ✅ GOOD - Only override when needed -->
<p class="text-lg">Larger description text</p>
<!-- Only add classes when you need to CHANGE the default -->

<h1 class="text-text-secondary">Subtitle-style heading</h1>
<!-- Only override when design requires different styling -->

<!-- ❌ WRONG - Redundant classes -->
<p class="text-base text-text-primary">Description text</p>
<!-- p elements are ALREADY text-base and text-text-primary by default -->
```

### **How to Check for Redundancy**

1. **Open browser DevTools** (F12) and inspect the element
2. **Check "Computed" tab** to see what styles are already applied
3. **Only add classes that actually change something** from the existing state
4. **Remove the class** and see if the design changes - if not, it's redundant

### **When to Add Styling**

✅ **ADD styling when:**

- The design explicitly requires different styling than defaults
- You need to override base styles for a specific reason
- Layout or spacing needs adjustment

❌ **DON'T ADD styling when:**

- The element already looks correct without it
- You're duplicating base styles
- You're "just in case" adding classes

**Keep it minimal.** Redundant classes clutter templates, hurt performance, and make maintenance harder.

---

## 📚 **Related Documentation**

- [Color Theming & Styling](../theming/color-theming.md) — Complete theming guide
- [General Documentation](./general-documentation.md) — Cross-cutting conventions
- [Testing Guide](../testing/testing-guide.md) — Testing patterns
