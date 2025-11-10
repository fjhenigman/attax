# Attax

A modern web implementation of the classic strategy board game **Ataxx** (also known as Spot, Infection, or Frog Cloning).

## 🎮 About the Game

Ataxx is a two-player abstract strategy game that was popular in arcades during the early 1990s. Players compete to control the board by converting their opponent's pieces through strategic cloning and jumping moves.

### Game Rules

- **Board**: 7×7 grid (classic configuration)
- **Players**: Two players (Red vs Blue)
- **Objective**: Have the most pieces on the board when no more moves are possible

### How to Play

1. **Clone Move**: Duplicate your piece to any adjacent empty square (horizontally, vertically, or diagonally - 8 possible positions)
2. **Jump Move**: Move a piece up to 2 squares away, leaving the original square empty
3. **Conversion**: After each move, all opponent pieces adjacent to your new piece are converted to your color
4. **Winning**: The game ends when no more moves are possible. The player with the most pieces wins!

### Special Features

- **Blockers**: Some board configurations include blocked squares that cannot be occupied
- **Strategy**: Balance between cloning (conservative, builds density) and jumping (aggressive, gains territory)

## 🎯 Project Vision

### Mission
Create an engaging, accessible, and visually appealing web-based version of Ataxx that honors the classic gameplay while leveraging modern web technologies to enhance the player experience.

### Goals

#### Short-term Goals (MVP)
- ✅ Implement core game logic and rules engine
- ✅ Create an intuitive web-based UI with responsive design
- ✅ Support two-player local gameplay
- ✅ Provide move validation and game state management
- ✅ Display score and game status in real-time

#### Medium-term Goals
- 🎯 Add AI opponent with multiple difficulty levels
- 🎯 Implement move history and undo functionality
- 🎯 Create animated piece movements and conversions
- 🎯 Add sound effects and visual feedback
- 🎯 Support custom board configurations
- 🎯 Implement game statistics and replay system

#### Long-term Goals
- 🚀 Online multiplayer with matchmaking
- 🚀 User accounts and ranking system
- 🚀 Tournament mode
- 🚀 Mobile-native applications (iOS/Android)
- 🚀 Advanced AI using machine learning
- 🚀 Community features (chat, forums, strategy guides)

### Design Principles

1. **Simplicity First**: Clean, intuitive interface that doesn't require a manual
2. **Performance**: Smooth animations and responsive gameplay, even on mobile devices
3. **Accessibility**: Keyboard navigation, screen reader support, and color-blind friendly palettes
4. **Progressive Enhancement**: Core game works everywhere, enhanced features where supported
5. **Open Source**: Community-driven development with transparent decision-making

## 🏗️ Technical Architecture

### Technology Stack (Planned)

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Vanilla JS initially, potential migration to React/Vue for complex features
- **Canvas/SVG**: For smooth animations and visual effects
- **State Management**: Redux or similar for complex game states
- **Backend** (Future): Node.js/Express for multiplayer functionality
- **Database** (Future): PostgreSQL for user data and game history
- **AI**: Minimax algorithm with alpha-beta pruning, potential ML integration

### Project Structure

```
attax/
├── src/
│   ├── game/          # Core game logic
│   ├── ui/            # User interface components
│   ├── ai/            # AI opponent logic
│   └── utils/         # Utility functions
├── assets/
│   ├── styles/        # CSS files
│   ├── images/        # Game graphics
│   └── sounds/        # Audio files
├── tests/             # Unit and integration tests
└── docs/              # Additional documentation
```

## 🚀 Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- Set up development environment
- Implement core game logic (board, pieces, moves, rules)
- Create basic HTML/CSS interface
- Unit tests for game logic

### Phase 2: User Interface (Weeks 3-4)
- Design and implement game board rendering
- Add piece placement and movement interactions
- Implement score tracking and game status display
- Create game over screen and restart functionality

### Phase 3: Polish & Enhancement (Weeks 5-6)
- Add animations for moves and conversions
- Implement sound effects
- Optimize performance
- Cross-browser testing and bug fixes

### Phase 4: AI Opponent (Weeks 7-8)
- Implement minimax algorithm
- Add difficulty levels
- AI move animation and thinking indicators
- Balance and tuning

### Phase 5: Advanced Features (Ongoing)
- Online multiplayer
- User accounts
- Statistics and analytics
- Mobile optimization
- Community features

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or suggesting ideas, your input is valuable.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write clean, readable code with appropriate comments
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by the original Ataxx arcade game by The Leland Corporation (1990)
- Thanks to the open-source community for tools and libraries
- Special thanks to all contributors and players

## 📧 Contact

- **Project Repository**: [https://github.com/fjhenigman/attax](https://github.com/fjhenigman/attax)
- **Issues & Suggestions**: Please use GitHub Issues

---

**Status**: 🚧 Early Development - This project is actively being developed. Stay tuned for updates!

*Last updated: November 2025*
