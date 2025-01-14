import React from 'react'
import { instance, mock } from 'ts-mockito'
import { streamDataSelector, streamRangeSelector } from 'uiSrc/slices/browser/stream'
import { bufferToString, stringToBuffer } from 'uiSrc/utils'
import { render, screen } from 'uiSrc/utils/test-utils'
import { MAX_FORMAT_LENGTH_STREAM_TIMESTAMP } from './constants'
import StreamDetailsWrapper, { Props } from './StreamDetailsWrapper'

jest.mock('uiSrc/slices/browser/stream', () => ({
  ...jest.requireActual('uiSrc/slices/browser/stream'),
  streamRangeSelector: jest.fn().mockReturnValue({ start: '', end: '' }),
  streamDataSelector: jest.fn().mockReturnValue({
    total: 0,
    entries: [],
    keyName: '',
    keyNameString: '',
    lastGeneratedId: '',
    firstEntry: {
      id: '',
      fields: []
    },
    lastEntry: {
      id: '',
      fields: []
    },
    lastRefreshTime: null,
  }),
}))

const mockedProps = mock<Props>()

const mockedEntryData = {
  keyName: bufferToString('stream_example'),
  keyNameString: 'stream_example',
  total: 1,
  lastGeneratedId: '1652942518811-0',
  lastRefreshTime: 1231231,
  firstEntry: {
    id: '1652942518810-0',
    fields: [{ value: stringToBuffer('1'), name: stringToBuffer('2') }]
  },
  lastEntry: {
    id: '1652942518811-0',
    fields: [{ value: stringToBuffer('1'), name: stringToBuffer('2') }]
  },
  entries: [{
    id: '1652942518810-0',
    fields: [{ value: stringToBuffer('1'), name: stringToBuffer('2') }]
  },
  {
    id: '1652942518811-0',
    fields: [{ value: stringToBuffer('1'), name: stringToBuffer('2') }]
  }]
}

const mockedRangeData = {
  start: '1675751507404',
  end: '1675751507406',
}

describe('StreamDetailsWrapper', () => {
  it('should render', () => {
    expect(render(<StreamDetailsWrapper {...instance(mockedProps)} />)).toBeTruthy()
  })

  it('should render Stream Data container', () => {
    render(<StreamDetailsWrapper {...instance(mockedProps)} />)

    expect(screen.getByTestId('stream-entries-container')).toBeInTheDocument()
  })

  it('should render Range filter', () => {
    streamDataSelector.mockImplementation(() => ({
      ...mockedEntryData,
    }))

    streamRangeSelector.mockImplementation(() => ({
      ...mockedRangeData,
    }))

    render(<StreamDetailsWrapper {...instance(mockedProps)} />)

    expect(screen.getByTestId('range-bar')).toBeInTheDocument()
  })

  it(`should not render Range filter if id more than ${MAX_FORMAT_LENGTH_STREAM_TIMESTAMP}`, () => {
    const entryWithHugeId = {
      id: '3123123123123123123123-123123123',
      fields: [{ value: stringToBuffer('1'), name: stringToBuffer('2') }]
    }

    const mockedEntries = [
      ...mockedEntryData.entries,
      entryWithHugeId
    ]

    streamDataSelector.mockImplementation(() => ({
      ...mockedEntryData,
      lastEntry: entryWithHugeId,
      entries: mockedEntries,
    }))

    streamRangeSelector.mockImplementation(() => ({
      ...mockedRangeData,
    }))

    const { queryByTestId } = render(<StreamDetailsWrapper {...instance(mockedProps)} />)

    expect(queryByTestId('range-bar')).not.toBeInTheDocument()
  })
})
