// Attax game - Main entry point
import { configureStore, type CombinedState } from './store';
import { newGame } from './store/actions';
import { 
  createGame, 
  joinGame, 
  cancelOnline, 
  setGameMode,
  getGameCodeFromUrl,
  clearGameCodeFromUrl 
} from './network';
import { GameRenderer } from './renderer';
import { InputHandler } from './input';

class AttaxGame {
  private store;
  private renderer: GameRenderer;
  private canvas: HTMLCanvasElement;
  private container: HTMLElement | null = null;
  private header: HTMLElement | null = null;
  private canvasContainer: HTMLElement | null = null;
  private menuOverlay: HTMLElement | null = null;

  constructor() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    
    // Setup store
    this.store = configureStore();
    
    // Setup renderer
    this.renderer = new GameRenderer(this.canvas);
    
    // Subscribe to state changes
    this.store.subscribe(() => {
      const state = this.store.getState();
      this.renderer.render(state.game);
      this.updateUI(state);
    });
    
    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    if (this.canvasContainer) {
      const rect = this.canvasContainer.getBoundingClientRect();
      this.renderer.resize(rect.width, rect.height);
      this.renderer.render(this.store.getState().game);
    }
  }

  private updateUI(state: CombinedState): void {
    // Update turn indicator for online play
    const turnIndicator = document.getElementById('turn-indicator');
    if (turnIndicator && state.network.mode === 'online' && state.network.connectionStatus === 'connected') {
      const isMyTurn = state.game.currentPlayer === state.network.playerColor;
      if (state.game.gameStatus === 'finished') {
        if (state.game.winner === 'draw') {
          turnIndicator.textContent = "It's a Draw!";
          turnIndicator.style.color = '#FFFFFF';
        } else if (state.game.winner === state.network.playerColor) {
          turnIndicator.textContent = 'You Win!';
          turnIndicator.style.color = '#48BB78';
        } else {
          turnIndicator.textContent = 'You Lose!';
          turnIndicator.style.color = '#E53E3E';
        }
      } else {
        turnIndicator.textContent = isMyTurn ? 'Your Turn' : "Opponent's Turn";
        turnIndicator.style.color = isMyTurn ? '#48BB78' : '#E2E8F0';
      }
    } else if (turnIndicator) {
      turnIndicator.textContent = '';
    }

    // Update connection status
    const statusIndicator = document.getElementById('connection-status');
    if (statusIndicator) {
      if (state.network.mode === 'online') {
        statusIndicator.style.display = 'flex';
        const dot = statusIndicator.querySelector('.status-dot') as HTMLElement;
        const text = statusIndicator.querySelector('.status-text') as HTMLElement;
        
        if (state.network.connectionStatus === 'connected') {
          dot.style.backgroundColor = '#48BB78';
          text.textContent = 'Connected';
        } else if (state.network.connectionStatus === 'connecting' || state.network.connectionStatus === 'waiting') {
          dot.style.backgroundColor = '#ECC94B';
          text.textContent = 'Waiting...';
        } else {
          dot.style.backgroundColor = '#E53E3E';
          text.textContent = 'Disconnected';
        }
      } else {
        statusIndicator.style.display = 'none';
      }
    }

    // Show/hide menu overlay based on state
    if (this.menuOverlay) {
      // Only show menu on initial load or when explicitly showing mode selection
      // For now, always show the game and use the menu button
    }
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.padding = '10px';
    header.style.display = 'flex';
    header.style.justifyContent = 'center';
    header.style.alignItems = 'center';
    header.style.gap = '20px';
    header.style.flexWrap = 'wrap';
    
    const title = document.createElement('h1');
    title.textContent = 'Attax';
    title.style.color = '#FFFFFF';
    title.style.margin = '0';
    title.style.fontFamily = 'Arial, sans-serif';
    
    // Connection status indicator
    const connectionStatus = document.createElement('div');
    connectionStatus.id = 'connection-status';
    connectionStatus.style.display = 'none';
    connectionStatus.style.alignItems = 'center';
    connectionStatus.style.gap = '5px';
    
    const statusDot = document.createElement('div');
    statusDot.className = 'status-dot';
    statusDot.style.width = '10px';
    statusDot.style.height = '10px';
    statusDot.style.borderRadius = '50%';
    statusDot.style.backgroundColor = '#E53E3E';
    
    const statusText = document.createElement('span');
    statusText.className = 'status-text';
    statusText.style.color = '#FFFFFF';
    statusText.style.fontSize = '14px';
    statusText.textContent = 'Disconnected';
    
    connectionStatus.appendChild(statusDot);
    connectionStatus.appendChild(statusText);
    
    // Turn indicator
    const turnIndicator = document.createElement('span');
    turnIndicator.id = 'turn-indicator';
    turnIndicator.style.color = '#48BB78';
    turnIndicator.style.fontSize = '16px';
    turnIndicator.style.fontWeight = 'bold';
    
    const newGameBtn = document.createElement('button');
    newGameBtn.id = 'new-game-btn';
    newGameBtn.textContent = 'New Game';
    newGameBtn.style.padding = '10px 20px';
    newGameBtn.style.fontSize = '16px';
    newGameBtn.style.cursor = 'pointer';
    newGameBtn.style.backgroundColor = '#48BB78';
    newGameBtn.style.color = 'white';
    newGameBtn.style.border = 'none';
    newGameBtn.style.borderRadius = '5px';
    newGameBtn.addEventListener('click', () => {
      const state = this.store.getState();
      if (state.network.mode === 'online') {
        this.store.dispatch(cancelOnline());
      }
      this.store.dispatch(newGame());
      this.showModeSelection();
    });
    
    header.appendChild(title);
    header.appendChild(connectionStatus);
    header.appendChild(turnIndicator);
    header.appendChild(newGameBtn);
    
    return header;
  }

  private showModeSelection(): void {
    if (this.menuOverlay) {
      this.menuOverlay.remove();
    }

    this.menuOverlay = document.createElement('div');
    this.menuOverlay.id = 'menu-overlay';
    this.menuOverlay.style.position = 'fixed';
    this.menuOverlay.style.top = '0';
    this.menuOverlay.style.left = '0';
    this.menuOverlay.style.width = '100%';
    this.menuOverlay.style.height = '100%';
    this.menuOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.menuOverlay.style.display = 'flex';
    this.menuOverlay.style.flexDirection = 'column';
    this.menuOverlay.style.justifyContent = 'center';
    this.menuOverlay.style.alignItems = 'center';
    this.menuOverlay.style.zIndex = '1000';

    const menuContainer = document.createElement('div');
    menuContainer.style.backgroundColor = '#2D3748';
    menuContainer.style.padding = '40px';
    menuContainer.style.borderRadius = '10px';
    menuContainer.style.textAlign = 'center';
    menuContainer.style.maxWidth = '400px';
    menuContainer.style.width = '90%';

    const menuTitle = document.createElement('h2');
    menuTitle.textContent = 'ATTAX';
    menuTitle.style.color = '#FFFFFF';
    menuTitle.style.marginBottom = '30px';
    menuTitle.style.fontFamily = 'Arial, sans-serif';

    // Local Play button
    const localBtn = this.createMenuButton('LOCAL PLAY', 'Two players, one device', () => {
      this.store.dispatch(setGameMode('local'));
      this.hideMenuOverlay();
    });

    // Create Online Game button
    const createBtn = this.createMenuButton('CREATE ONLINE GAME', 'Get a code to share', () => {
      this.store.dispatch(createGame());
      this.showWaitingScreen();
    });

    // Join Online Game button
    const joinBtn = this.createMenuButton('JOIN ONLINE GAME', 'Enter a game code', () => {
      this.showJoinScreen();
    });

    menuContainer.appendChild(menuTitle);
    menuContainer.appendChild(localBtn);
    menuContainer.appendChild(createBtn);
    menuContainer.appendChild(joinBtn);
    this.menuOverlay.appendChild(menuContainer);
    document.body.appendChild(this.menuOverlay);
  }

  private createMenuButton(title: string, subtitle: string, onClick: () => void): HTMLElement {
    const btn = document.createElement('button');
    btn.style.display = 'block';
    btn.style.width = '100%';
    btn.style.padding = '15px 20px';
    btn.style.marginBottom = '15px';
    btn.style.fontSize = '16px';
    btn.style.cursor = 'pointer';
    btn.style.backgroundColor = '#4A5568';
    btn.style.color = 'white';
    btn.style.border = '2px solid #718096';
    btn.style.borderRadius = '8px';
    btn.style.textAlign = 'center';
    btn.style.transition = 'all 0.2s';

    const titleSpan = document.createElement('div');
    titleSpan.textContent = title;
    titleSpan.style.fontWeight = 'bold';
    titleSpan.style.marginBottom = '5px';

    const subtitleSpan = document.createElement('div');
    subtitleSpan.textContent = subtitle;
    subtitleSpan.style.fontSize = '12px';
    subtitleSpan.style.opacity = '0.8';

    btn.appendChild(titleSpan);
    btn.appendChild(subtitleSpan);

    btn.addEventListener('mouseover', () => {
      btn.style.backgroundColor = '#718096';
      btn.style.borderColor = '#A0AEC0';
    });

    btn.addEventListener('mouseout', () => {
      btn.style.backgroundColor = '#4A5568';
      btn.style.borderColor = '#718096';
    });

    btn.addEventListener('click', onClick);

    return btn;
  }

  private showWaitingScreen(): void {
    if (this.menuOverlay) {
      this.menuOverlay.remove();
    }

    this.menuOverlay = document.createElement('div');
    this.menuOverlay.id = 'menu-overlay';
    this.menuOverlay.style.position = 'fixed';
    this.menuOverlay.style.top = '0';
    this.menuOverlay.style.left = '0';
    this.menuOverlay.style.width = '100%';
    this.menuOverlay.style.height = '100%';
    this.menuOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.menuOverlay.style.display = 'flex';
    this.menuOverlay.style.flexDirection = 'column';
    this.menuOverlay.style.justifyContent = 'center';
    this.menuOverlay.style.alignItems = 'center';
    this.menuOverlay.style.zIndex = '1000';

    const container = document.createElement('div');
    container.style.backgroundColor = '#2D3748';
    container.style.padding = '40px';
    container.style.borderRadius = '10px';
    container.style.textAlign = 'center';
    container.style.maxWidth = '450px';
    container.style.width = '90%';

    const title = document.createElement('h2');
    title.textContent = 'WAITING FOR OPPONENT';
    title.style.color = '#FFFFFF';
    title.style.marginBottom = '20px';
    title.style.fontFamily = 'Arial, sans-serif';

    // Game code display
    const codeLabel = document.createElement('div');
    codeLabel.textContent = 'Game Code:';
    codeLabel.style.color = '#A0AEC0';
    codeLabel.style.marginBottom = '10px';

    const codeDisplay = document.createElement('div');
    codeDisplay.id = 'game-code-display';
    codeDisplay.textContent = '...';
    codeDisplay.style.fontSize = '36px';
    codeDisplay.style.fontWeight = 'bold';
    codeDisplay.style.color = '#48BB78';
    codeDisplay.style.letterSpacing = '5px';
    codeDisplay.style.marginBottom = '20px';
    codeDisplay.style.fontFamily = 'monospace';

    // Copy link button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'COPY LINK TO SHARE';
    copyBtn.style.padding = '15px 30px';
    copyBtn.style.fontSize = '14px';
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.backgroundColor = '#3182CE';
    copyBtn.style.color = 'white';
    copyBtn.style.border = 'none';
    copyBtn.style.borderRadius = '5px';
    copyBtn.style.marginBottom = '20px';
    copyBtn.addEventListener('click', () => {
      const state = this.store.getState();
      if (state.network.shareableLink) {
        navigator.clipboard.writeText(state.network.shareableLink).then(() => {
          copyBtn.textContent = 'COPIED!';
          setTimeout(() => {
            copyBtn.textContent = 'COPY LINK TO SHARE';
          }, 2000);
        });
      }
    });

    // Share link display
    const linkLabel = document.createElement('div');
    linkLabel.textContent = 'Share this link with your opponent:';
    linkLabel.style.color = '#A0AEC0';
    linkLabel.style.marginBottom = '10px';
    linkLabel.style.fontSize = '14px';

    const linkDisplay = document.createElement('div');
    linkDisplay.id = 'share-link-display';
    linkDisplay.style.fontSize = '12px';
    linkDisplay.style.color = '#718096';
    linkDisplay.style.wordBreak = 'break-all';
    linkDisplay.style.marginBottom = '20px';
    linkDisplay.style.padding = '10px';
    linkDisplay.style.backgroundColor = '#1A202C';
    linkDisplay.style.borderRadius = '5px';

    // Waiting spinner
    const waitingText = document.createElement('div');
    waitingText.textContent = '⏳ Waiting for player...';
    waitingText.style.color = '#ECC94B';
    waitingText.style.marginBottom = '20px';

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.style.padding = '10px 30px';
    cancelBtn.style.fontSize = '14px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.backgroundColor = '#718096';
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '5px';
    cancelBtn.addEventListener('click', () => {
      this.store.dispatch(cancelOnline());
      this.showModeSelection();
    });

    container.appendChild(title);
    container.appendChild(codeLabel);
    container.appendChild(codeDisplay);
    container.appendChild(copyBtn);
    container.appendChild(linkLabel);
    container.appendChild(linkDisplay);
    container.appendChild(waitingText);
    container.appendChild(cancelBtn);
    this.menuOverlay.appendChild(container);
    document.body.appendChild(this.menuOverlay);

    // Subscribe to update code display when available
    const unsubscribe = this.store.subscribe(() => {
      const state = this.store.getState();
      if (state.network.gameCode) {
        codeDisplay.textContent = state.network.gameCode;
      }
      if (state.network.shareableLink) {
        linkDisplay.textContent = state.network.shareableLink;
      }
      if (state.network.connectionStatus === 'connected') {
        unsubscribe();
        this.hideMenuOverlay();
      }
      if (state.network.error) {
        waitingText.textContent = `Error: ${state.network.error}`;
        waitingText.style.color = '#E53E3E';
      }
    });
  }

  private showJoinScreen(): void {
    if (this.menuOverlay) {
      this.menuOverlay.remove();
    }

    this.menuOverlay = document.createElement('div');
    this.menuOverlay.id = 'menu-overlay';
    this.menuOverlay.style.position = 'fixed';
    this.menuOverlay.style.top = '0';
    this.menuOverlay.style.left = '0';
    this.menuOverlay.style.width = '100%';
    this.menuOverlay.style.height = '100%';
    this.menuOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.menuOverlay.style.display = 'flex';
    this.menuOverlay.style.flexDirection = 'column';
    this.menuOverlay.style.justifyContent = 'center';
    this.menuOverlay.style.alignItems = 'center';
    this.menuOverlay.style.zIndex = '1000';

    const container = document.createElement('div');
    container.style.backgroundColor = '#2D3748';
    container.style.padding = '40px';
    container.style.borderRadius = '10px';
    container.style.textAlign = 'center';
    container.style.maxWidth = '400px';
    container.style.width = '90%';

    const title = document.createElement('h2');
    title.textContent = 'JOIN ONLINE GAME';
    title.style.color = '#FFFFFF';
    title.style.marginBottom = '20px';
    title.style.fontFamily = 'Arial, sans-serif';

    const label = document.createElement('div');
    label.textContent = 'Enter Game Code:';
    label.style.color = '#A0AEC0';
    label.style.marginBottom = '10px';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'game-code-input';
    input.maxLength = 6;
    input.placeholder = 'ABC123';
    input.style.width = '100%';
    input.style.padding = '15px';
    input.style.fontSize = '24px';
    input.style.textAlign = 'center';
    input.style.letterSpacing = '5px';
    input.style.textTransform = 'uppercase';
    input.style.border = '2px solid #4A5568';
    input.style.borderRadius = '8px';
    input.style.backgroundColor = '#1A202C';
    input.style.color = '#FFFFFF';
    input.style.marginBottom = '20px';
    input.style.fontFamily = 'monospace';
    input.style.boxSizing = 'border-box';

    // Error message
    const errorMsg = document.createElement('div');
    errorMsg.id = 'join-error';
    errorMsg.style.color = '#E53E3E';
    errorMsg.style.marginBottom = '10px';
    errorMsg.style.display = 'none';

    // Join button
    const joinBtn = document.createElement('button');
    joinBtn.textContent = 'JOIN';
    joinBtn.style.padding = '15px 50px';
    joinBtn.style.fontSize = '16px';
    joinBtn.style.cursor = 'pointer';
    joinBtn.style.backgroundColor = '#48BB78';
    joinBtn.style.color = 'white';
    joinBtn.style.border = 'none';
    joinBtn.style.borderRadius = '5px';
    joinBtn.style.marginBottom = '15px';
    joinBtn.style.display = 'block';
    joinBtn.style.width = '100%';
    joinBtn.addEventListener('click', () => {
      const code = input.value.trim().toUpperCase();
      if (code.length === 6) {
        this.doJoinGame(code);
      } else {
        errorMsg.textContent = 'Please enter a 6-character code';
        errorMsg.style.display = 'block';
      }
    });

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.style.padding = '10px 30px';
    cancelBtn.style.fontSize = '14px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.backgroundColor = '#718096';
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '5px';
    cancelBtn.style.display = 'block';
    cancelBtn.style.width = '100%';
    cancelBtn.addEventListener('click', () => {
      this.showModeSelection();
    });

    container.appendChild(title);
    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(errorMsg);
    container.appendChild(joinBtn);
    container.appendChild(cancelBtn);
    this.menuOverlay.appendChild(container);
    document.body.appendChild(this.menuOverlay);

    // Focus the input
    setTimeout(() => input.focus(), 100);

    // Handle enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        joinBtn.click();
      }
    });
  }

  private doJoinGame(code: string): void {
    this.store.dispatch(joinGame(code));

    // Show connecting state
    const errorMsg = document.getElementById('join-error');
    if (errorMsg) {
      errorMsg.textContent = 'Connecting...';
      errorMsg.style.color = '#ECC94B';
      errorMsg.style.display = 'block';
    }

    // Subscribe to connection state
    const unsubscribe = this.store.subscribe(() => {
      const state = this.store.getState();
      if (state.network.connectionStatus === 'connected') {
        unsubscribe();
        this.hideMenuOverlay();
      }
      if (state.network.error) {
        if (errorMsg) {
          errorMsg.textContent = state.network.error;
          errorMsg.style.color = '#E53E3E';
          errorMsg.style.display = 'block';
        }
      }
    });
  }

  private hideMenuOverlay(): void {
    if (this.menuOverlay) {
      this.menuOverlay.remove();
      this.menuOverlay = null;
    }
  }

  public mount(containerId: string): void {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    
    // Setup container styles
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.backgroundColor = '#2D3748';
    
    // Create header
    this.header = this.createHeader();
    
    // Create canvas container
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.style.flex = '1';
    this.canvasContainer.style.width = '100%';
    this.canvasContainer.style.display = 'flex';
    this.canvasContainer.style.justifyContent = 'center';
    this.canvasContainer.style.alignItems = 'center';
    this.canvasContainer.style.overflow = 'hidden';
    
    this.canvasContainer.appendChild(this.canvas);
    
    this.container.appendChild(this.header);
    this.container.appendChild(this.canvasContainer);
    
    // Set initial canvas size
    const rect = this.canvasContainer.getBoundingClientRect();
    this.renderer.resize(rect.width, rect.height);
    
    // Setup input handler with store that includes network state awareness
    new InputHandler(this.canvas, this.store, this.renderer);
    
    // Initial render
    this.renderer.render(this.store.getState().game);

    // Check for game code in URL
    const gameCode = getGameCodeFromUrl();
    if (gameCode) {
      clearGameCodeFromUrl();
      this.doJoinGame(gameCode);
    } else {
      // Show mode selection
      this.showModeSelection();
    }
  }
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new AttaxGame();
  game.mount('app');
});
