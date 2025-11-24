# End-to-End Testing Strategy

## Overview

The end-to-end (e2e) testing strategy for Attax is designed to ensure gameplay accuracy, state management reliability, and UI correctness through comprehensive replay and verification capabilities. This document outlines the approach for recording, replaying, and validating complete game sessions.

## Testing Philosophy

The e2e testing framework serves two critical purposes:

1. **Regression Prevention**: Ensure that changes to the game logic, rendering system, or state management don't alter the behavior of previously validated gameplay scenarios.

2. **Visual Verification**: Provide human reviewers with clear, documented evidence that the game simulation produces expected results at key moments throughout gameplay.

## Core Testing Approach

### Three-Tier Testing Model

The testing strategy employs three complementary testing modes that validate different aspects of the system and enable precise isolation of issues. Tests should be verified in order from bottom to top of the stack:

#### 1. State Management Testing (Action Replay without Rendering)

This mode validates the core game simulation and state management by directly replaying recorded player actions into the Redux store.

**Purpose**: Verify that the game rules, move validation, and state transitions produce consistent, deterministic results.

**How it works**: The test framework injects recorded MAKE_MOVE actions directly into the Redux store, bypassing the UI and rendering layers entirely. Each MAKE_MOVE action contains the precise parameters that define a player's move: source position and destination position. The system then runs the game logic and validates the resulting state programmatically.

**What it validates**:
- Game logic determinism and accuracy
- State transitions and rule enforcement
- Turn management and player switching
- Piece conversion calculations
- Win/draw condition detection

**Advantages**: Fastest execution, deterministic results, isolation from rendering and UI concerns.

#### 2. Rendering Verification Testing (Action Replay with Screenshot Validation)

This mode validates that the renderer correctly displays game states by replaying actions and capturing visual output.

**Purpose**: Verify that the Canvas rendering system correctly visualizes game states produced by the game logic and state management.

**How it works**: The test framework injects recorded MAKE_MOVE actions directly into the Redux store, runs the game logic, and captures screenshots at significant moments. These screenshots are compared against baseline images to ensure the renderer produces pixel-perfect output for known game states.

**What it validates**:
- Renderer correctness for all game states
- Visual consistency across code changes
- Proper rendering of pieces, board, grid, and UI elements
- Selection highlights and valid move indicators
- Score display and turn indicator accuracy
- Screenshot baseline accuracy

**Advantages**: Fast execution, isolates rendering issues from input handling, establishes visual regression baselines.

#### 3. UI-Driven Testing (Playwright-Based)

This mode validates the complete user interaction flow by simulating actual user inputs through the UI.

**Purpose**: Verify that the click/tap interface, input handling, and UI-to-state pipeline correctly translate user gestures into the intended game actions.

**How it works**: The test framework uses computed click locations (derived from the recorded move positions) to simulate click interactions on the game canvas. These interactions trigger the normal input handling pipeline, which processes click events and ultimately dispatches the same actions to the Redux store.

**What it validates**:
- Click/tap input processing
- Coordinate transformations and hit detection
- Piece selection flow
- Move execution through UI
- Complete user interaction flow
- Input-to-action translation accuracy

**Advantages**: End-to-end validation, real-world scenario simulation, UI regression detection.

### Diagnostic Value of the Three-Tier Approach

This three-tier structure enables precise issue isolation when verified bottom-up:

- **If State Management Testing fails**: The issue is in the core game logic or Redux reducers
- **If Rendering Verification fails but State Management Testing passes**: The issue is in the Canvas renderer
- **If UI-Driven Testing fails but Rendering Verification passes**: The issue is in input handling or event processing

This diagnostic capability significantly reduces debugging time by immediately identifying which subsystem contains the defect.

## Game Recording

### Move Action Recording

During actual gameplay, the system records every move made by players as MAKE_MOVE actions. Each recorded action captures the complete set of parameters needed to reproduce that exact move.

**Recorded Parameters**:
- Source position (row, col) of the piece being moved
- Destination position (row, col) where the piece moves to
- Implicit: Current player (derived from game state)
- Implicit: Move type (clone or jump, derived from distance)

**Storage Format**: Game recordings are stored as ordered sequences of MAKE_MOVE actions, preserving the chronological flow of gameplay. This recording serves as the "golden master" reference for that game session.

## Significant Moment Detection

### Event Categories

The testing framework identifies and captures significant moments in the game simulation. These moments represent state changes or interactions that are meaningful for verification purposes.

**Significant Moment Types**:

1. **Piece Selection**: When a player selects one of their pieces
2. **Clone Move**: When a piece is duplicated to an adjacent cell
3. **Jump Move**: When a piece moves 2 cells, leaving the original cell empty
4. **Piece Conversion**: When opponent pieces are converted after a move
5. **Turn Transition**: When control passes between players
6. **Game State Changes**: Skipped turns (no valid moves), win conditions, draw conditions

### Moment Capture

When a significant moment is detected during simulation replay, the testing framework captures the complete game state at that instant. This includes board state, piece positions, scores, current player, and any relevant metadata about what just occurred.

## Screenshot Generation

### Visual Documentation

For each significant moment captured during test execution, the framework generates a screenshot showing the game state at that instant.

**Screenshot Content**:
- Complete board view showing all piece positions
- Visual indicators for the significant event (selection highlights, valid moves)
- Game state overlay (scores, current player indicator)
- Contextual annotations explaining the moment

**Purpose**: Provide human reviewers with visual evidence of game behavior, enabling manual verification that the game logic and rendering are behaving correctly.

### Screenshot Organization

Each e2e test is organized in its own numbered subdirectory (e.g., `001-initial-setup/`, `002-first-move/`, etc.), which contains the test file, its README, and its screenshots subdirectory. This organization keeps all artifacts for a single user story test together.

**Directory Structure**:
```
e2e/
├── 001-initial-setup/
│   ├── README.md
│   ├── initial.spec.ts
│   └── initial.spec.ts-snapshots/
│       ├── 0000-initial-board-chromium-linux.png
│       └── 0001-red-player-turn-chromium-linux.png
├── 002-clone-move/
│   ├── README.md
│   ├── clone.spec.ts
│   └── clone.spec.ts-snapshots/
│       ├── 0000-before-move-chromium-linux.png
│       ├── 0001-piece-selected-chromium-linux.png
│       └── 0002-after-clone-chromium-linux.png
├── 003-jump-move/
│   ├── README.md
│   ├── jump.spec.ts
│   └── jump.spec.ts-snapshots/
│       ├── 0000-before-jump-chromium-linux.png
│       └── 0001-after-jump-chromium-linux.png
```

Screenshots within each test's snapshots subdirectory (named `<test-file>.spec.ts-snapshots/` by Playwright convention) are numbered with leading zeros to enable lexicographic sorting, making it easy to review the game progression in order. Playwright automatically appends the browser and platform suffix (e.g., `-chromium-linux.png`).

**Screenshot Naming Convention**: `####-description-browser-platform.png` where `####` is a zero-padded sequence number and the browser/platform suffix is added automatically by Playwright.

**Examples** (as stored by Playwright):
- `0000-initial-board-chromium-linux.png` - Initial game board setup
- `0001-red-selects-piece-chromium-linux.png` - Red player selects a piece
- `0002-valid-moves-shown-chromium-linux.png` - Valid move destinations highlighted
- `0003-after-clone-move-chromium-linux.png` - Board state after clone move
- `0004-pieces-converted-chromium-linux.png` - Opponent pieces converted

Each screenshot corresponds to exactly one significant moment in the simulation, with the sequence number indicating the chronological order of events.

## Test Artifact Generation

### Test README Generation

For each e2e test, the framework automatically generates a README file that serves as a verification guide for human reviewers.

**README Contents**:

1. **Test Overview**: Description of the game scenario being tested, including starting positions and expected outcomes
2. **Chronological Event Log**: Sequential listing of all significant moments
3. **Screenshot Links**: For each moment, an **embedded image link** showing the screenshot directly in the markdown (using `![alt text](path/to/screenshot.png)` syntax), not just file path references
4. **Moment Descriptions**: Text description of what the verifier should observe in each screenshot
5. **Expected State**: Description of the game state that should be visible (piece positions, scores, current player)

**Purpose**: Enable human reviewers to systematically verify that simulation output matches expectations without needing to run the test themselves or understand the code. The README should be readable as a standalone document with all screenshots visible inline.

**Implementation Requirements**:
- Screenshots must be embedded using markdown image syntax: `![Description](relative/path/to/screenshot.png)`
- Each screenshot should have a descriptive alt text explaining what it shows
- Screenshots should be linked with relative paths from the README location
- The README should be self-contained and readable without needing to open separate image files

### Automated Verification Code

In addition to visual documentation, the framework generates programmatic assertions that validate the simulation state at each significant moment.

**Verification Checks**:
- Board state assertions (correct piece positions)
- Score assertions (correct piece counts)
- Current player assertions
- Game status assertions (playing, finished)
- Winner assertions (when applicable)

**Purpose**: Provide automated regression detection that catches simulation divergence before it requires human review.

## Test Execution Workflow

### State Management Test Execution

When executing a state management test:

1. **Load Recording**: Read the sequence of MAKE_MOVE actions from the game recording
2. **Initialize State**: Set up the initial game state (standard Attax starting position)
3. **Replay Actions**: For each MAKE_MOVE action, inject it into the Redux store
4. **Capture State**: Record complete game state after each move
5. **Run Assertions**: Execute verification code to check state correctness
6. **Validate Determinism**: Ensure exact reproducibility of game logic calculations

### Rendering Verification Test Execution

When executing a rendering verification test:

1. **Load Recording**: Read the sequence of MAKE_MOVE actions from the game recording
2. **Initialize State**: Set up the initial game state (standard Attax starting position)
3. **Replay Actions**: For each MAKE_MOVE action, inject it into the Redux store
4. **Capture Moments**: Detect and record all significant moments during simulation
5. **Generate Screenshots**: Create visual captures at each significant moment in `*.spec.ts-snapshots/` subdirectory
6. **Compare Screenshots**: Perform pixel-perfect comparison against baseline screenshots
7. **Run Assertions**: Execute verification code to check rendering correctness
8. **Generate Documentation**: Produce the test README with screenshots and descriptions

### UI-Driven Test Execution

When executing a UI-driven test:

1. **Load Recording**: Read the sequence of move positions from the game recording
2. **Compute Interactions**: For each move, calculate the click locations needed (piece selection + destination)
3. **Initialize UI**: Launch the game in a browser context via Playwright
4. **Simulate Clicks**: For each move, simulate click on piece then click on destination
5. **Monitor Actions**: Verify that simulated clicks generate the expected MAKE_MOVE actions
6. **Capture Moments**: Detect and record all significant moments during simulation
7. **Generate Screenshots**: Create visual captures via Playwright screenshot API in `*.spec.ts-snapshots/` subdirectory
8. **Compare Screenshots**: Perform pixel-perfect comparison against baseline screenshots
9. **Run Assertions**: Execute verification code via Playwright assertions
10. **Generate Documentation**: Produce the test README with screenshots and descriptions

## Test Suite Organization

### Test Categories

**State Validation Tests**: Action replay tests focused on game logic correctness. These tests validate state without rendering overhead. Should be verified first.

**Rendering Verification Tests**: Action replay tests focused on validating renderer correctness. Each test replays a game scenario and verifies pixel-perfect screenshot accuracy. Should be verified second.

**UI Integration Tests**: UI-driven tests that validate the complete input-to-action pipeline. These ensure click interactions produce the correct MAKE_MOVE actions. Should be verified third.

**Validation Tests**: Short, focused games that test specific scenarios (edge cases, corner moves, multiple conversions). Used for rapid validation during development.

**Regression Tests**: Complete games from actual play sessions. Used to ensure that known-good gameplay continues to work correctly across code changes.

**Edge Case Tests**: Contrived scenarios that exercise unusual game situations or rule corner cases (e.g., no valid moves for one player, all pieces converted, draw conditions).

### Test Naming and Discovery

Tests are organized in numbered subdirectories at the top level of `e2e/`, with each directory representing a single user story or test scenario. The directory contains all artifacts for that test: the test spec file, README documentation, and Playwright snapshots subdirectory.

**Directory Naming Convention**: `###-scenario-name/` where `###` is a zero-padded sequence number.

**Examples**:
- `001-initial-setup/` - Initial board rendering verification
- `002-clone-move/` - Clone move mechanics test
- `003-jump-move/` - Jump move mechanics test
- `004-piece-conversion/` - Piece conversion test
- `005-turn-management/` - Turn switching and skip turn test
- `006-game-over/` - Win/draw condition test

Within each test directory:
- Test spec file: `*.spec.ts` (e.g., `initial.spec.ts`, `clone.spec.ts`)
- Documentation: `README.md` with embedded screenshots
- Snapshots: `*.spec.ts-snapshots/` subdirectory (auto-created by Playwright) containing `####-description-browser-platform.png` files

The test framework can discover and execute tests automatically based on directory structure and naming patterns.

## Tolerance and Determinism

### Zero-Tolerance Policy

Since all e2e tests execute exclusively in the GitHub Actions CI environment, the testing framework enforces strict determinism with zero tolerance for variation.

**Game Logic Determinism**: The game logic must produce identical results for identical inputs across all test runs. State transitions must be reproducible exactly.

**Rendering Determinism**: Screenshots must match baseline images pixel-for-pixel. Any rendering variation, no matter how minor, indicates a regression or platform inconsistency.

**Assertion Precision**: Automated verification uses exact equality checks for all comparisons. Board state, piece positions, scores, and game status values must match expected values precisely.

### CI Environment Consistency

All tests run in a controlled GitHub Actions environment with:

- Fixed operating system and browser versions
- Consistent rendering context and canvas implementation
- Deterministic game logic behavior
- Reproducible screenshot capture

This controlled environment eliminates platform variability and enables the strict zero-tolerance policy. Any test failure indicates an actual regression or defect, not environmental differences.

### Baseline Management

Screenshot baselines are stored in the repository and serve as the canonical reference for rendering correctness. When intentional visual changes are made:

1. Review the visual differences carefully
2. Verify the changes are correct and intentional
3. Update the baseline screenshots
4. Document the reason for the baseline update

Baseline updates should be rare and always associated with deliberate rendering improvements or feature additions.

## Benefits and Use Cases

### For Developers

- **Confidence in Changes**: Game logic or rendering changes can be validated against extensive real-game scenarios
- **Debugging Aid**: Step through replays to understand unexpected behavior
- **Performance Tracking**: Compare execution time across test suite runs
- **Documentation**: Tests serve as examples of expected system behavior

### For Reviewers

- **Visual Verification**: Non-technical stakeholders can review screenshots to validate correctness
- **Change Impact Assessment**: Before/after screenshot comparisons show effects of code changes
- **Rule Validation**: Confirm that game rules are enforced correctly in various scenarios

### For Regression Prevention

- **Automated Detection**: Catch unintended changes in game logic or rendering
- **Baseline Establishment**: Lock in known-good behavior as reference points
- **Continuous Integration**: Run test suite automatically on every commit

## Future Extensibility

The testing framework is designed to support future enhancements:

- **Interactive Replay**: Web-based viewer for stepping through test replays
- **Differential Testing**: Compare replay results across code branches
- **Performance Profiling**: Track game simulation performance over time
- **Coverage Analysis**: Identify untested game scenarios
- **Test Generation**: Record new tests from actual gameplay sessions
- **AI Testing**: Validate AI opponent behavior once implemented
- **Network Testing**: Test multiplayer scenarios once implemented

## Summary

This e2e testing strategy provides comprehensive validation of the Attax game through three complementary testing approaches. State management testing validates core game logic correctness through direct action injection. Rendering verification testing validates visual correctness through pixel-perfect screenshot comparison. UI-driven testing validates the complete user interaction pipeline from click input to action generation. Together with strict zero-tolerance policies enabled by the consistent GitHub Actions CI environment, automated verification, and human-reviewable visual documentation, this approach ensures both technical correctness and qualitative gameplay fidelity while enabling precise isolation of defects to specific subsystems.
