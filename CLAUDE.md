# Development Guidelines

## Core Principles
- Mobile-first UI development
- User-centric development - main flows must always work
- Atomic commits addressing single aspects
- Zero 500 errors, no dead links, handle all zero-states
- Offline-capable development

## Required Documentation
Maintain machine-readable files for:
- **User Flows**: Use cases and user journeys
- **System Diagrams**: Page/module relationships and connections  
- **Business Logic**: Rules, invariants, tie-breaking, feature priorities

## Testing & Quality
- Run tests after every change
- Add tests for new features and bugs
- Prefer single test runs over full suite
- Use robust, varied test data
- Stress test all interactive elements (buttons, inputs, videos, links)

## Code Standards
- Build small, reusable modules
- Typecheck after code changes
- Fix console errors immediately or add to todo
- Don't break existing functionality