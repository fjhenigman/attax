// Unit tests for Redux reducer
import { describe, it, expect } from 'vitest';
import { gameReducer, createInitialState } from './reducer';
import { selectPiece, deselectPiece, makeMove, newGame } from './actions';

describe('createInitialState', () => {
  it('creates initial game state', () => {
    const state = createInitialState();
    
    expect(state.currentPlayer).toBe('red');
    expect(state.selectedPiece).toBeNull();
    expect(state.validMoves).toEqual([]);
    expect(state.gameStatus).toBe('playing');
    expect(state.winner).toBeNull();
    expect(state.scores.red).toBe(2);
    expect(state.scores.blue).toBe(2);
  });
});

describe('gameReducer', () => {
  describe('SELECT_PIECE', () => {
    it('selects a piece belonging to current player', () => {
      const state = createInitialState();
      const newState = gameReducer(state, selectPiece({ row: 0, col: 0 }));
      
      expect(newState.selectedPiece).toEqual({ row: 0, col: 0 });
      expect(newState.validMoves.length).toBeGreaterThan(0);
    });

    it('does not select opponent piece', () => {
      const state = createInitialState();
      // Try to select blue piece as red player
      const newState = gameReducer(state, selectPiece({ row: 0, col: 6 }));
      
      expect(newState.selectedPiece).toBeNull();
      expect(newState.validMoves).toEqual([]);
    });

    it('does not select empty cell', () => {
      const state = createInitialState();
      const newState = gameReducer(state, selectPiece({ row: 3, col: 3 }));
      
      expect(newState.selectedPiece).toBeNull();
    });
  });

  describe('DESELECT_PIECE', () => {
    it('clears selection and valid moves', () => {
      const state = createInitialState();
      const selectedState = gameReducer(state, selectPiece({ row: 0, col: 0 }));
      const newState = gameReducer(selectedState, deselectPiece());
      
      expect(newState.selectedPiece).toBeNull();
      expect(newState.validMoves).toEqual([]);
    });
  });

  describe('MAKE_MOVE', () => {
    it('makes a valid clone move', () => {
      let state = createInitialState();
      state = gameReducer(state, selectPiece({ row: 0, col: 0 }));
      state = gameReducer(state, makeMove({ row: 0, col: 0 }, { row: 1, col: 0 }));
      
      // Piece should be cloned
      expect(state.board[0][0]).toEqual({ type: 'piece', owner: 'red' });
      expect(state.board[1][0]).toEqual({ type: 'piece', owner: 'red' });
      
      // Score should increase
      expect(state.scores.red).toBe(3);
      
      // Turn should switch
      expect(state.currentPlayer).toBe('blue');
      
      // Selection should be cleared
      expect(state.selectedPiece).toBeNull();
    });

    it('makes a valid jump move', () => {
      let state = createInitialState();
      state = gameReducer(state, selectPiece({ row: 0, col: 0 }));
      state = gameReducer(state, makeMove({ row: 0, col: 0 }, { row: 2, col: 0 }));
      
      // Piece should be moved (not cloned)
      expect(state.board[0][0]).toEqual({ type: 'empty' });
      expect(state.board[2][0]).toEqual({ type: 'piece', owner: 'red' });
      
      // Score should stay the same (no conversion)
      expect(state.scores.red).toBe(2);
    });

    it('converts adjacent opponent pieces', () => {
      let state = createInitialState();
      // Red at (0,0), Blue at (6,0)
      // First clone red to (1,0)
      state = gameReducer(state, selectPiece({ row: 0, col: 0 }));
      state = gameReducer(state, makeMove({ row: 0, col: 0 }, { row: 1, col: 0 }));
      
      // Now it's blue's turn - let's make red's turn again for testing
      state = { ...state, currentPlayer: 'red' as const };
      
      // Clone to (2,0)
      state = gameReducer(state, selectPiece({ row: 1, col: 0 }));
      state = gameReducer(state, makeMove({ row: 1, col: 0 }, { row: 2, col: 0 }));
      
      state = { ...state, currentPlayer: 'red' as const };
      
      // Clone to (3,0)
      state = gameReducer(state, selectPiece({ row: 2, col: 0 }));
      state = gameReducer(state, makeMove({ row: 2, col: 0 }, { row: 3, col: 0 }));
      
      state = { ...state, currentPlayer: 'red' as const };
      
      // Clone to (4,0)
      state = gameReducer(state, selectPiece({ row: 3, col: 0 }));
      state = gameReducer(state, makeMove({ row: 3, col: 0 }, { row: 4, col: 0 }));
      
      state = { ...state, currentPlayer: 'red' as const };
      
      // Jump to (5,0) to convert blue at (6,0)
      state = gameReducer(state, selectPiece({ row: 4, col: 0 }));
      state = gameReducer(state, makeMove({ row: 4, col: 0 }, { row: 5, col: 0 }));
      
      // Blue piece at (6,0) should now be red (it's adjacent to new piece at 5,0)
      expect(state.board[6][0]).toEqual({ type: 'piece', owner: 'red' });
    });

    it('ignores move without selection', () => {
      const state = createInitialState();
      const newState = gameReducer(state, makeMove({ row: 0, col: 0 }, { row: 1, col: 0 }));
      
      expect(newState).toBe(state);
    });

    it('ignores invalid move', () => {
      let state = createInitialState();
      state = gameReducer(state, selectPiece({ row: 0, col: 0 }));
      // Try to move to an occupied cell
      const newState = gameReducer(state, makeMove({ row: 0, col: 0 }, { row: 0, col: 6 }));
      
      // Board should be unchanged except for selection
      expect(newState.board[0][0]).toEqual({ type: 'piece', owner: 'red' });
    });

    it('ends the game when one color is eliminated', () => {
      let state = createInitialState();
      
      // Set up a board state where blue has only one piece at (1,1)
      // and red has a piece at (0,0) that can eliminate it by cloning to (0,1)
      // which will convert the blue piece
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
          state.board[row][col] = { type: 'empty' };
        }
      }
      state.board[0][0] = { type: 'piece', owner: 'red' };
      state.board[1][1] = { type: 'piece', owner: 'blue' };
      state.scores = { red: 1, blue: 1 };
      state.currentPlayer = 'red';
      
      // Select the red piece
      state = gameReducer(state, selectPiece({ row: 0, col: 0 }));
      
      // Clone to (1,0), which is adjacent to blue at (1,1)
      // This will convert blue's only piece to red
      state = gameReducer(state, makeMove({ row: 0, col: 0 }, { row: 1, col: 0 }));
      
      // Blue should now have 0 pieces and the game should be over
      expect(state.scores.blue).toBe(0);
      expect(state.scores.red).toBe(3); // original red + clone + converted blue
      expect(state.gameStatus).toBe('finished');
      expect(state.winner).toBe('red');
    });
  });

  describe('NEW_GAME', () => {
    it('resets the game state', () => {
      let state = createInitialState();
      // Make some moves
      state = gameReducer(state, selectPiece({ row: 0, col: 0 }));
      state = gameReducer(state, makeMove({ row: 0, col: 0 }, { row: 1, col: 0 }));
      
      // Reset
      const newState = gameReducer(state, newGame());
      
      expect(newState.currentPlayer).toBe('red');
      expect(newState.scores.red).toBe(2);
      expect(newState.scores.blue).toBe(2);
      expect(newState.board[1][0]).toEqual({ type: 'empty' });
    });
  });
});
