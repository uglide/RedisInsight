import axios, { AxiosError, CancelTokenSource } from 'axios'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import successMessages from 'uiSrc/components/notifications/success-messages'

import { ApiEndpoints } from 'uiSrc/constants'
import { apiService } from 'uiSrc/services'
import { getApiErrorMessage, getUrl, isStatusSuccessful, Nullable } from 'uiSrc/utils'
import { DEFAULT_SEARCH_MATCH } from 'uiSrc/constants/api'
import { IKeyPropTypes } from 'uiSrc/constants/prop-types/keys'

import { GetKeysWithDetailsResponse } from 'apiSrc/modules/browser/dto'
import { CreateRedisearchIndexDto, ListRedisearchIndexesResponse } from 'apiSrc/modules/browser/dto/redisearch'

import { AppDispatch, RootState } from '../store'
import { RedisResponseBuffer, StateRedisearch } from '../interfaces'
import { addErrorNotification, addMessageNotification } from '../app/notifications'

export const initialState: StateRedisearch = {
  loading: false,
  error: '',
  search: '',
  selectedIndex: null,
  data: {
    total: 0,
    scanned: 0,
    nextCursor: '0',
    keys: [],
    shardsMeta: {},
    previousResultCount: 0,
    lastRefreshTime: null,
  },
  list: {
    loading: false,
    error: '',
    data: []
  },
  createIndex: {
    loading: false,
    error: '',
  },
}

// A slice for recipes
const redisearchSlice = createSlice({
  name: 'redisearch',
  initialState,
  reducers: {
    setRedisearchInitialState: () => initialState,

    // load redisearch keys
    loadKeys: (state) => {
      state.loading = true
      state.error = ''
    },
    loadKeysSuccess: (state, { payload }: PayloadAction<GetKeysWithDetailsResponse>) => {
      state.data = {
        ...state.data,
        ...payload,
        nextCursor: `${payload.cursor}`,
        previousResultCount: payload.keys?.length,
      }
      state.loading = false
      state.data.lastRefreshTime = Date.now()
    },
    loadKeysFailure: (state, { payload }) => {
      state.error = payload
      state.loading = false
    },

    // load more redisearch keys
    loadMoreKeys: (state) => {
      state.loading = true
      state.error = ''
    },
    loadMoreKeysSuccess: (state, { payload }: PayloadAction<GetKeysWithDetailsResponse>) => {
      state.data.keys = payload.keys
      state.data.total = payload.total
      state.data.scanned = payload.scanned
      state.data.nextCursor = `${payload.cursor}`
      state.data.previousResultCount = payload.keys.length

      state.loading = false
    },
    loadMoreKeysFailure: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },

    // load list of indexes
    loadList: (state) => {
      state.list = {
        ...state.list,
        loading: true,
        error: '',
      }
    },
    loadListSuccess: (state, { payload }: PayloadAction<RedisResponseBuffer[]>) => {
      state.list = {
        ...state.list,
        loading: false,
        data: payload,
      }
    },
    loadListFailure: (state, { payload }) => {
      state.list = {
        ...state.list,
        loading: false,
        error: payload,
      }
    },

    // create an index
    createIndex: (state) => {
      state.createIndex = {
        ...state.createIndex,
        loading: true,
        error: '',
      }
    },
    createIndexSuccess: (state) => {
      state.createIndex = {
        ...state.createIndex,
        loading: false,
      }
    },
    createIndexFailure: (state, { payload }: PayloadAction<string>) => {
      state.createIndex = {
        ...state.createIndex,
        loading: false,
        error: payload,
      }
    },

    // create an index
    setSelectedIndex: (state, { payload }: PayloadAction<RedisResponseBuffer>) => {
      state.selectedIndex = payload
    },

    setLastBatchRedisearchKeys: (state, { payload }) => {
      const newKeys = state.data.keys
      newKeys.splice(-payload.length, payload.length, ...payload)
      state.data.keys = newKeys
    },

    setQueryRedisearch: (state, { payload }: PayloadAction<string>) => {
      state.search = payload
    },
  },
})

// Actions generated from the slice
export const {
  loadKeys,
  loadKeysSuccess,
  loadKeysFailure,
  loadMoreKeys,
  loadMoreKeysSuccess,
  loadMoreKeysFailure,
  loadList,
  loadListSuccess,
  loadListFailure,
  createIndex,
  createIndexSuccess,
  createIndexFailure,
  setRedisearchInitialState,
  setSelectedIndex,
  setLastBatchRedisearchKeys,
  setQueryRedisearch,
} = redisearchSlice.actions

// Selectors
export const redisearchSelector = (state: RootState) => state.browser.redisearch
export const redisearchDataSelector = (state: RootState) => state.browser.redisearch.data
export const redisearchListSelector = (state: RootState) => state.browser.redisearch.list
export const createIndexStateSelector = (state: RootState) => state.browser.redisearch.createIndex

// The reducer
export default redisearchSlice.reducer

// eslint-disable-next-line import/no-mutable-exports
export let controller: Nullable<AbortController> = null

// Asynchronous thunk action
export function fetchRedisearchKeysAction(
  cursor: string,
  count: number,
  onSuccess?: (value: GetKeysWithDetailsResponse) => void,
  onFailed?: () => void,
) {
  return async (dispatch: AppDispatch, stateInit: () => RootState) => {
    dispatch(loadKeys())

    try {
      controller?.abort()
      controller = new AbortController()

      const state = stateInit()
      const { encoding } = state.app.info
      const { selectedIndex: index, search: query } = state.browser.redisearch
      const { data, status } = await apiService.post<GetKeysWithDetailsResponse>(
        getUrl(
          state.connections.instances.connectedInstance?.id,
          ApiEndpoints.REDISEARCH_SEARCH
        ),
        {
          offset: +cursor, limit: count, query: query || DEFAULT_SEARCH_MATCH, index,
        },
        {
          params: { encoding },
          signal: controller.signal,
        }
      )

      controller = null

      if (isStatusSuccessful(status)) {
        dispatch(loadKeysSuccess(data))
        onSuccess?.(data)
      }
    } catch (_err) {
      if (!axios.isCancel(_err)) {
        const error = _err as AxiosError
        const errorMessage = getApiErrorMessage(error)
        dispatch(addErrorNotification(error))
        dispatch(loadKeysFailure(errorMessage))
        onFailed?.()
      }
    }
  }
}
// Asynchronous thunk action
export function fetchMoreRedisearchKeysAction(
  oldKeys: IKeyPropTypes[] = [],
  cursor: string,
  count: number,
) {
  return async (dispatch: AppDispatch, stateInit: () => RootState) => {
    dispatch(loadMoreKeys())

    try {
      controller?.abort()
      controller = new AbortController()

      const state = stateInit()
      const { encoding } = state.app.info
      const { selectedIndex: index, search: query } = state.browser.redisearch
      const { data, status } = await apiService.post<GetKeysWithDetailsResponse>(
        getUrl(
          state.connections.instances.connectedInstance?.id,
          ApiEndpoints.REDISEARCH_SEARCH
        ),
        {
          offset: +cursor, limit: count, query: query || DEFAULT_SEARCH_MATCH, index
        },
        {
          params: { encoding },
          signal: controller.signal,
        }
      )

      controller = null

      if (isStatusSuccessful(status)) {
        dispatch(loadMoreKeysSuccess({
          ...data,
          keys: oldKeys.concat(data.keys)
        }))
      }
    } catch (_err) {
      if (!axios.isCancel(_err)) {
        const error = _err as AxiosError
        const errorMessage = getApiErrorMessage(error)
        dispatch(addErrorNotification(error))
        dispatch(loadMoreKeysFailure(errorMessage))
      }
    }
  }
}

export function fetchRedisearchListAction(
  onSuccess?: (value: RedisResponseBuffer[]) => void,
  onFailed?: () => void,
) {
  return async (dispatch: AppDispatch, stateInit: () => RootState) => {
    dispatch(loadList())

    try {
      const state = stateInit()
      const { encoding } = state.app.info
      const { data, status } = await apiService.get<ListRedisearchIndexesResponse>(
        getUrl(
          state.connections.instances.connectedInstance?.id,
          ApiEndpoints.REDISEARCH
        ),
        {
          params: { encoding },
        }
      )

      if (isStatusSuccessful(status)) {
        dispatch(loadListSuccess(data.indexes))
        onSuccess?.(data.indexes)
      }
    } catch (_err) {
      const error = _err as AxiosError
      const errorMessage = getApiErrorMessage(error)
      dispatch(addErrorNotification(error))
      dispatch(loadListFailure(errorMessage))
      onFailed?.()
    }
  }
}
export function createRedisearchIndexAction(
  data: CreateRedisearchIndexDto,
  onSuccess?: () => void,
  onFailed?: () => void,
) {
  return async (dispatch: AppDispatch, stateInit: () => RootState) => {
    dispatch(createIndex())

    try {
      const state = stateInit()
      const { encoding } = state.app.info
      const { status } = await apiService.post<void>(
        getUrl(
          state.connections.instances.connectedInstance?.id,
          ApiEndpoints.REDISEARCH
        ),
        {
          ...data
        },
        {
          params: { encoding },
        }
      )

      if (isStatusSuccessful(status)) {
        dispatch(createIndexSuccess())
        dispatch(addMessageNotification(successMessages.CREATE_INDEX()))
        dispatch(fetchRedisearchListAction())
        onSuccess?.()
      }
    } catch (_err) {
      const error = _err as AxiosError
      const errorMessage = getApiErrorMessage(error)
      dispatch(addErrorNotification(error))
      dispatch(createIndexFailure(errorMessage))
      onFailed?.()
    }
  }
}