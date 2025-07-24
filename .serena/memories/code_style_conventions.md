# Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled (`"strict": true`)
- **Target**: ES5 for browser compatibility
- **Module System**: ESNext with Node module resolution
- **JSX**: Preserve for Next.js compilation
- **Path Aliases**: `@/*` maps to root directory

## Component Patterns
- **Functional Components**: Using React.FC<Props> pattern
- **Props Interfaces**: Named as `ComponentNameProps`
- **File Naming**: PascalCase for components (e.g., `Calendar.tsx`, `Ticket.tsx`)
- **CSS Modules**: `Component.module.css` pattern for styling

## Code Organization
- **Event Handlers**: Prefix with `handle` (e.g., `handleDragStart`, `handleDrop`)
- **Props Destructuring**: In function parameters
- **Comments**: French comments for UI elements and logic explanation
- **Type Safety**: All event handlers and props are properly typed

## Import Order
1. External dependencies (React, Next.js)
2. Types/interfaces
3. Styles
4. Local components

## Best Practices Observed
- Clean separation of concerns
- Props validation through TypeScript
- Consistent naming conventions
- Modular CSS approach