# 🎨 Color System & Theming

TUMApply uses a scalable and customizable theming system that's built on PrimeNG Themes and Tailwind CSS. It supports
both light and dark mode through a centralized theme management.

---

## 🧱 Structure

The theming system is structured as follows:

- `src/main/webapp/content/theming/tumapplypreset.ts`: defines the custom PrimeNG theme with TUMApply-specific colors
- CSS variables are provided by PrimeNG's theming system and are available globally
- Tailwind CSS is used for additional styling options and is aligned with the PrimeNG theme

---

## 🌞 Light and 🌚 Dark Mode

Theme switching is controlled through the `toggleTheme()` method in the `NavbarComponent`:

- The selected theme preference is stored in `sessionStorage`
- The theme is toggled by adding/removing the `dark-theme` class to the `<html>` element
- PrimeNG components automatically respond to theme changes

---

## 🎨 Using Colors

To ensure a consistent design, avoid hard-coded hex values. Instead, use:

### ✅ PrimeNG variables (CSS custom properties)

```scss
color: var (--text-color);
background-color: var (--surface-ground);
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

```

```
