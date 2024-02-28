import { combineReducers } from '@reduxjs/toolkit'
import localForage from 'localforage'
import { PersistConfig, persistReducer } from 'redux-persist'
import { isDevelopmentEnv } from 'utils/env'
import logs from './logs/slice'
import application from './application/reducer'
import lists from './lists/reducer'
import transactions from './transactions/reducer'
import user from './user/reducer'
import wallets from './wallets/reducer'
import signatures from './signatures/reducer'
import multicall from 'lib/state/multicall'

const persistedReducers = {
  user,
  transactions,
  signatures,
  lists,
}

const appReducer = combineReducers({
  application,
  wallets,
  logs,
  multicall: multicall.reducer,
  ...persistedReducers,
})

export type AppState = ReturnType<typeof appReducer>

const persistConfig: PersistConfig<AppState> = {
  key: 'interface',
  version: 7, // see migrations.ts for more details about this version
  storage: localForage.createInstance({
    name: 'redux',
  }),
  whitelist: Object.keys(persistedReducers),
  throttle: 1000, // ms
  serialize: false,
  // The typescript definitions are wrong - we need this to be false for unserialized storage to work.
  // We need unserialized storage for inspectable db entries for debugging.
  // @ts-ignore
  deserialize: false,
  debug: isDevelopmentEnv(),
}

const persistedReducer = persistReducer(persistConfig, appReducer)

export default persistedReducer
