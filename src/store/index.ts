// Redux store configuration for Attax game
import { createStore, type Store } from 'redux';
import type { GameState } from '../types';
import { gameReducer } from './reducer';
import type { GameAction } from './actions';

export function configureStore(): Store<GameState, GameAction> {
  return createStore(gameReducer);
}

export type AppStore = Store<GameState, GameAction>;
