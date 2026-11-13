# CineWorld Mobile Responsiveness Guide

## Overview
Complete mobile-first responsive redesign for touch-friendly, adaptive UI across all devices.

## Breakpoints
- **Mobile (xs)**: 0px - 640px
- **Tablet (sm-md)**: 641px - 1024px
- **Desktop (lg)**: 1025px - 1280px
- **Extra Wide (xl)**: 1281px+

## Components

### 1. useResponsive Hook
```jsx
import { useResponsive, useIsMobile, useIsTablet, useIsDesktop } from "@/hooks/useResponsive";

// Get all breakpoint info
const screen = useResponsive(); // { width, height, isMobile, isTablet, isDesktop }

// Get specific breakpoint
const isMobile = useIsMobile(); // boolean
const isTablet = useIsTablet();
const isDesktop = useIsDesktop();

// Media query hook
const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

// Orientation hook
const orientation = useOrientation(); // "portrait" | "landscape"

// Viewport dimensions
const { vw, vh } = useViewport();
```

### 2. MobileNav Component
```jsx
<MobileNav user={user} onLogout={handleLogout} />
```
Features:
- Hamburger menu (mobile only)
- Slide-out sidebar navigation
- Touch-friendly 48px+ buttons
- Safe area insets for notched devices
- Smooth animations with prefers-reduced-motion support

### 3. ResponsiveGrid Component
```jsx
<ResponsiveGrid columns="auto" gap="16px">
  {/* 2 cols mobile, 3 cols tablet, 4 cols desktop */}
  {movieCards}
</ResponsiveGrid>
```
Features:
- Auto-adjusts columns per breakpoint
- Configurable gap and min-width
- Grid template auto-fill for efficient layout

### 4. MobileContainer Component
```jsx
<MobileContainer padding fullHeight>
  {content}
</MobileContainer>
```
Features:
- Responsive padding based on breakpoint
- Safe area inset support
- Full viewport height option
- Max-width constraints for desktop

### 5. MobileModal Component
```jsx
<MobileModal isOpen={open} onClose={handleClose} title="Title" fullScreen={false}>
  {children}
</MobileModal>
```
Features:
- Bottom-sheet style on mobile
- Centered modal on desktop
- Full-screen option for large forms
- Slide-up animation
- Prevents body scroll when open

## CSS Utilities

### mobile.css
Global responsive stylesheet with:
- Typography scaling (h1, h2, h3, body)
- Layout adjustments (containers, sidebars, grids)
- Button sizing (min 44px/touch-friendly)
- Form inputs (full-width, 16px font for iOS zoom prevention)
- Navigation patterns
- Notch/safe-area support
- Print styles
- Dark mode
- Motion preferences (prefers-reduced-motion)

## Best Practices

### 1. Touch-Friendly Sizing
```jsx
// ✅ Minimum 44x44px touch targets
<button style={{ minHeight: "44px", minWidth: "44px" }} />

// ❌ Avoid small buttons
<button style={{ width: "20px", height: "20px" }} />
```

### 2. Responsive Images
```jsx
// ✅ Max-width 100%, height auto
<img src={url} style={{ maxWidth: "100%", height: "auto" }} />

// ❌ Fixed size images
<img src={url} width="800" height="600" />
```

### 3. Safe Area Insets
```css
/* ✅ Notch support */
padding: max(16px, env(safe-area-inset-left));

/* ❌ No notch support */
padding: 16px;
```

### 4. Form Inputs
```jsx
// ✅ 16px font prevents iOS zoom on focus
<input style={{ fontSize: "16px" }} />

// ❌ Smaller fonts trigger zoom
<input style={{ fontSize: "14px" }} />
```

### 5. Tap Targets Spacing
```css
/* ✅ 8px minimum spacing between interactive elements */
button + button { margin-left: 8px; }

/* ❌ Overlapping tap targets */
button + button { margin-left: 2px; }
```

## Viewport Meta Tag
```html
<!-- In public/index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

## Integration Checklist
- [ ] Import mobile.css in main.css or App.jsx
- [ ] Wrap pages with MobileContainer
- [ ] Use ResponsiveGrid for movie listings
- [ ] Add MobileNav to layout
- [ ] Replace modals with MobileModal
- [ ] Use useResponsive hook for conditional rendering
- [ ] Test on iOS Safari (notch, safe-area-inset)
- [ ] Test on Android Chrome (viewport scaling)
- [ ] Verify button sizes ≥44px
- [ ] Check form input font sizes (16px)
- [ ] Verify landscape orientation behavior
- [ ] Test with screen reader (mobile accessibility)

## Testing

### Device Testing
- iPhone 12/13/14/Pro/Max (notched devices)
- iPhone SE (small screen)
- iPad Air/Pro (tablets)
- Android Galaxy S21+
- Android tablet
- Pixel 6/7

### Browser Testing
- iOS Safari
- Chrome (Android)
- Firefox (both)
- Samsung Internet

### Tools
- Chrome DevTools (Responsive Design Mode)
- Firefox Developer Tools
- Safari Web Inspector (macOS)

## Performance Tips
- Lazy-load images on mobile
- Reduce animations on slow networks
- Use CSS Grid auto-fit over fixed columns
- Minimize JavaScript in critical path
- Compress images for mobile

## Accessibility
- Touch targets ≥44x44px ✓
- Color contrast ≥4.5:1 (WCAG AA)
- Keyboard navigation support
- Screen reader friendly landmarks
- Focus indicators visible
- No auto-playing media without user interaction
- Captions for videos

## Related Files
- `/client/src/styles/mobile.css` — Global styles
- `/client/src/hooks/useResponsive.js` — Responsive hooks
- `/client/src/components/MobileNav.jsx` — Mobile navigation
- `/client/src/components/ResponsiveGrid.jsx` — Responsive grid layout
- `/client/src/components/MobileContainer.jsx` — Container wrapper
- `/client/src/components/MobileModal.jsx` — Bottom sheet modal
