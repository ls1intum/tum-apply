# 🎨 Color System & Theming

TUMApply uses a scalable and customizable theming system that's built on PrimeNG Themes and Tailwind CSS. It supports
both light and dark mode through a centralized theme management.

---

## 🧱 Structure

The theming system is structured as follows:

- `src/main/webapp/content/theming/tumapplypreset.ts`: defines the custom PrimeNG theme with TUMApply-specific colors
- **Tailwind CSS (Primary):** Always try to use Tailwind utility classes first.
- **SCSS (Secondary):** Only use custom SCSS if the desired design cannot be achieved with Tailwind.

---

## 🎨 Using Colors

To ensure a consistent design, avoid hard-coded hex values. Instead, use:

### ✅ PrimeNG variables (CSS custom properties)

```
color: var(--text-color);
background-color: var(--surface-ground);
```

### ✅ Tailwind utility classes

```html
<div class="text-primary bg-surface-200 dark:bg-surface-700">...</div>
```

---

## ⚠️ Theme Customization

To customize the theme, edit the color definitions in:

```
src/main/webapp/content/theming/tumapplypreset.ts
```

You can define new variables, override existing ones, or align Tailwind and PrimeNG settings for full consistency.
For that please use:
```
src/main/webapp/content/scss/prime-ng-overrides.scss
```
