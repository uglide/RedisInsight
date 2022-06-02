import React, { useCallback } from 'react'
import { EuiIcon, EuiTab, EuiTabs } from '@elastic/eui'
import { useDispatch, useSelector } from 'react-redux'

import {
  streamSelector,
  setStreamViewType,
  fetchConsumerGroups,
  streamGroupsSelector,
  selectedGroupSelector,
  selectedConsumerSelector,
} from 'uiSrc/slices/browser/stream'
import { StreamViewType } from 'uiSrc/slices/interfaces/stream'

import { streamViewTypeTabs } from '../constants'

import styles from './styles.module.scss'

const StreamTabs = () => {
  const { viewType } = useSelector(streamSelector)
  const { data: groups = [] } = useSelector(streamGroupsSelector)
  const { name: selectedGroupName = '' } = useSelector(selectedGroupSelector) ?? {}
  const { name: selectedConsumerName = '' } = useSelector(selectedConsumerSelector) ?? {}

  const dispatch = useDispatch()

  const onSelectedTabChanged = (id: StreamViewType) => {
    if (id === StreamViewType.Groups && groups.length === 0) {
      dispatch(fetchConsumerGroups())
    }
    dispatch(setStreamViewType(id))
  }

  const renderTabs = useCallback(() => {
    const tabs = [...streamViewTypeTabs]

    if (selectedGroupName && (viewType === StreamViewType.Consumers || viewType === StreamViewType.Messages)) {
      tabs.push({
        id: StreamViewType.Consumers,
        label: selectedGroupName,
        separator: <EuiIcon type="arrowRight" className={styles.separator} />
      })
    }

    if (selectedConsumerName && viewType === StreamViewType.Messages) {
      tabs.push({
        id: StreamViewType.Messages,
        label: selectedConsumerName,
        separator: <EuiIcon type="arrowRight" className={styles.separator} />
      })
    }

    return tabs.map(({ id, label, separator = '' }) => (
      <>
        {separator}
        <EuiTab
          isSelected={viewType === id}
          onClick={() => onSelectedTabChanged(id)}
          key={id}
          data-testid={`stream-tab-${id}`}
        >
          {label}
        </EuiTab>
      </>
    ))
  }, [viewType, selectedGroupName, selectedConsumerName])

  return (
    <>
      <EuiTabs data-test-subj="stream-tabs">{renderTabs()}</EuiTabs>
    </>
  )
}

export default StreamTabs
