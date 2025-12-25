# Contributing to Dixit

Thank you for your interest in contributing to the Dixit local multiplayer card game! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Mobile-First Requirements](#mobile-first-requirements)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members
- Accept constructive criticism gracefully

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting/derogatory comments
- Publishing others' private information
- Other conduct inappropriate for a professional setting

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- Git
- Modern browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of TypeScript and React

### Find an Issue

1. Browse [open issues](issues) for tasks to work on
2. Look for issues labeled `good first issue` for beginners
3. Comment on the issue to let others know you're working on it
4. If you find a bug not yet reported, create a new issue first

## Development Setup

### Initial Setup

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/dixit.git
cd dixit

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/dixit.git

# Install dependencies
npm install

# Verify setup
npm run build
npm test
```

### Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code ...

# Run tests
npm test

# Build to verify
npm run build

# Commit your changes
git add .
git commit -m "feat: your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge into your main branch
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

## Coding Standards

All code must follow the project's coding standards as defined in [.cursorrules](.cursorrules).

### Critical Workflow

**Before ANY code changes:**
1. Read and understand the relevant code sections
2. Run tests to establish baseline: `npm test`
3. Check for linter errors
4. Verify all imports resolve correctly

**After ANY code changes:**
1. Run linter on modified files
2. Build client: `cd client && npm run build`
3. Test in browser if UI changes
4. Verify no regressions (existing features still work)

**If build fails:**
- STOP - Do not proceed to next task
- Fix TypeScript/build errors immediately
- Verify fix with another build
- Document what broke and how you fixed it

### TypeScript Standards

```typescript
// ✅ GOOD - Explicit types
interface ButtonProps {
  variant: "primary" | "secondary";
  onClick: () => void;
  children: ReactNode;
}

function Button({ variant, onClick, children }: ButtonProps) {
  // Implementation
}

// ❌ BAD - Any types
function doSomething(data: any) {
  // Never use 'any'
}

// ❌ BAD - Implicit types
function processData(data) {
  // Always provide types
}
```

### React Best Practices

```typescript
// ✅ GOOD - Memoize expensive calculations
const sortedList = useMemo(
  () => data.sort((a, b) => a.score - b.score),
  [data]
);

// ✅ GOOD - Stable callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// ✅ GOOD - Clean up effects
useEffect(() => {
  const timer = setTimeout(() => {}, 1000);
  return () => clearTimeout(timer);
}, []);

// ❌ BAD - Hooks in conditions
if (condition) {
  useEffect(() => {}, []); // Never do this!
}
```

### Error Handling

```typescript
// ✅ GOOD - Structured errors with severity
throw new GameError(
  "Cannot vote for own card",
  "INVALID_VOTE",
  400,
  ErrorSeverity.WARNING
);

// ✅ GOOD - Always wrap socket handlers
socket.on("someEvent", (data) => {
  try {
    // Process event
    gameManager.doSomething(data);
    broadcastRoomState();
  } catch (error) {
    socket.emit("error", {
      severity: ErrorSeverity.ERROR,
      message: error.message,
      code: error.code
    });
  }
});

// ❌ BAD - Unhandled errors
socket.on("someEvent", (data) => {
  // This will crash the server if it throws!
  gameManager.doSomething(data);
});
```

### State Management

```typescript
// ✅ GOOD - Server is authoritative
// Server updates state
gameManager.playerVote(playerId, cardId);
broadcastRoomState(); // Clients receive update

// ✅ GOOD - Client only reacts to server
socket.on("roomState", (state: RoomState) => {
  setRoomState(state); // React re-renders
});

// ❌ BAD - Client modifies game state
setRoomState({
  ...roomState,
  phase: "VOTING" // NEVER modify state on client!
});
```

### UI Component Standards

```typescript
// ✅ GOOD - Use UI library components
import { Button, Badge, Icon } from "../components/ui";

<Button variant="primary" onClick={handleClick}>
  <Icon.Rocket size={IconSize.medium} /> Start Game
</Button>

// ❌ BAD - Inline buttons
<button className="btn-primary" onClick={handleClick}>
  Start Game
</button>

// ❌ BAD - Using emojis for UI icons
<button>🚀 Start Game</button>

// ✅ GOOD - Use Icon component
<Icon.Rocket size={IconSize.large} />
```

## Testing Requirements

### Before Submitting PR

All of the following must pass:

```bash
# Run all tests
npm test

# Build client
cd client && npm run build

# Build server
cd server && npm run build

# No TypeScript errors
# No linter warnings
```

### Writing Tests

**Unit Tests:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('GameManager', () => {
  let gameManager: GameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  it('should add first player as admin', () => {
    const player = gameManager.addPlayer('Alice', 'client-1');
    expect(player.isAdmin).toBe(true);
  });
});
```

**Integration Tests:**
- Test complete game flows
- Simulate multiple players
- Verify state transitions
- Check error handling

### Test Coverage

- All new features must include tests
- Bug fixes must include regression tests
- Aim for 80%+ code coverage
- Critical paths must have 100% coverage

## Mobile-First Requirements

This project follows mobile-first design principles. All UI changes must work on mobile devices.

### Touch Targets

```typescript
// ✅ GOOD - Minimum 44x44px touch targets
<Button variant="primary" style={{ minHeight: '44px', minWidth: '44px' }}>
  Click
</Button>

// ❌ BAD - Too small for mobile
<button style={{ padding: '4px' }}>Click</button>
```

### Responsive Design

- Design for mobile first (375px width minimum)
- Test on desktop second (1024px+ width)
- Use flexible layouts (flexbox, grid)
- No horizontal scrolling on mobile

### Performance

- Images compressed to ~500KB
- Debounce search inputs (300ms minimum)
- Lazy load heavy components
- Virtual scrolling for long lists (100+ items)

### Accessibility

- All interactive elements need `aria-label`
- Support keyboard navigation (Tab, Enter, Escape)
- High contrast text (WCAG AA: 4.5:1 ratio)
- Screen reader support

### Testing Checklist

Before submitting UI changes, test on:
- [ ] Mobile Chrome (iOS)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Desktop Safari

## Submitting Changes

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(game): add configurable win target

fix(voting): prevent voting for own card

docs(readme): update installation instructions

refactor(state): centralize config management
```

### Pull Request Process

1. **Create PR from your feature branch**
   - Use descriptive title
   - Reference related issues (#123)
   - Fill out PR template completely

2. **PR Description Must Include:**
   - What changed and why
   - How to test the changes
   - Screenshots (if UI changes)
   - Breaking changes (if any)

3. **Ensure CI Passes:**
   - All tests passing
   - Build successful
   - No linter errors

4. **Request Review:**
   - Tag relevant maintainers
   - Respond to feedback promptly
   - Make requested changes

5. **After Approval:**
   - Squash commits if requested
   - Maintainer will merge

### PR Template

```markdown
## Description
Brief description of changes

## Related Issues
Fixes #123

## Changes Made
- Added X feature
- Fixed Y bug
- Refactored Z component

## Testing Done
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing on mobile
- [ ] Manual testing on desktop

## Screenshots (if applicable)
[Add screenshots here]

## Breaking Changes
None / [Describe breaking changes]

## Checklist
- [ ] Code follows project standards
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Build passes
- [ ] Mobile-first principles followed
```

## Review Process

### What Reviewers Look For

**Code Quality:**
- Follows TypeScript best practices
- Uses existing UI components
- Proper error handling
- Clean, readable code

**Testing:**
- Tests included and passing
- Good test coverage
- Edge cases handled

**Documentation:**
- Code comments where needed
- README updated if necessary
- API changes documented

**Mobile-First:**
- Works on mobile devices
- Touch targets are adequate
- Performance is acceptable

### Review Timeline

- Initial review: Within 48 hours
- Follow-up reviews: Within 24 hours
- Merging: After approval and CI passes

### Addressing Feedback

- Respond to all comments
- Make requested changes promptly
- Ask questions if unclear
- Update tests as needed
- Request re-review when ready

## Best Practices Summary

For comprehensive best practices, see [.cursorrules](.cursorrules).

**Key Points:**

### Error Handling
- Use structured errors with severity (INFO/WARNING/ERROR/FATAL)
- Auto-dismiss INFO/WARNING after 5s
- ERROR/FATAL need manual dismiss
- Always wrap socket handlers in try-catch

### State Management
- Server is authoritative - NEVER modify game state on client
- Client only reacts to server events (roomState, playerState)
- Use React hooks (useGameState, useSocket)
- Clean up socket listeners on unmount

### Socket.IO
- Persist clientId in localStorage for reconnection
- Validate all incoming events with Zod schemas
- Use rate limiting on server (50 events/10s per client)

### Configuration
- All limits in `server/src/config/index.ts`
- Support environment variable overrides
- Never hardcode limits in multiple places

### Testing
- Run tests before committing: `npm test`
- Integration tests for full flows
- Build must pass: `npm run build`

## Questions?

- Check [DEVELOPMENT.md](DEVELOPMENT.md) for development workflow
- See [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Read [GAME_RULES.md](GAME_RULES.md) for gameplay mechanics
- Review [.cursorrules](.cursorrules) for detailed coding standards

## Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

