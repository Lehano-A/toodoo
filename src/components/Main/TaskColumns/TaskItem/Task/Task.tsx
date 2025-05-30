import { DraggableProvided } from '@hello-pangea/dnd'
import React, { TransitionEvent, useContext, useMemo, useRef, useState } from 'react'
import styled, { useTheme } from 'styled-components'

import { TaskBodyContext } from '../../../../../contexts/TaskBodyContext'
import { TaskItemContext } from '../../../../../contexts/TaskItemContext'
import { useCalcHeightTask } from '../../../../../hooks/useCalcHeightTask'
import { simpleFocusOutlineStyle } from '../../../../../styled/css/highlighting'
import { visibleTaskControlsStyle } from '../../../../../styled/css/visibleTaskControlsStyle'
import Deadline from './Deadline/Deadline'
import TaskBody from './TaskBody/TaskBody'
import { InnerBoxTaskBodyProps, StyleParamsTaskType, TaskElementsRefs } from './task.types'
import { calcRestOfDaysBeforeDeadline } from './utils/calcRestOfDaysBeforeDeadline'
import { getColorsTaskElements } from './utils/getColorsTaskElements'

const CommonWrapper = styled('div')<{ $hasDeadline: boolean; $isTaskDone: InnerBoxTaskBodyProps['$isTaskDone'] }>`
  position: relative;
  margin: 8px 0;
  padding-top: ${({ $isTaskDone, $hasDeadline }) => ($isTaskDone || $hasDeadline ? '25px' : 0)};
  min-width: 222px;
  width: 100%;
  &:focus-visible {
    ${simpleFocusOutlineStyle}
  }

  &:focus-within {
    ${visibleTaskControlsStyle}
  }
`

const InnerBoxTaskBody = styled('div')<InnerBoxTaskBodyProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 20px 20px 50px 20px;
  transition: height 0.6s ease;
  overflow: hidden;
  box-shadow: 4px 4px 8px 0px rgba(34, 60, 80, 0.1);
  word-break: break-word;
  background-color: ${({ $styleTaskElements }) => $styleTaskElements.bg};
  border-radius: ${({ $isTaskDone, $hasDeadline }) => ($isTaskDone || $hasDeadline ? 0 : '12px')} 12px 12px 12px;

  height: ${({ $wasToggledButtonShowContent, $styleParamsTask }) =>
    $wasToggledButtonShowContent && $styleParamsTask?.opened.task.height
      ? `${$styleParamsTask?.opened.task.height}px`
      : `${$styleParamsTask?.closed.task.height}px`};

  &:hover,
  &:focus {
    ${visibleTaskControlsStyle}
  }
`

const OuterBoxTaskBody = styled('div')`
  position: relative;
`

// На более верхнем уровне не определён этот элемент потому, что необходима оцентровка именно по телу задачи, не учитывая Deadline
const OrdinalNumber = styled('span')`
  pointer-events: none; // отменяем возможность перетаскивать задачу за порядковый номер.
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: -18px;
  color: ${({ theme }) => theme.palette.grey[400]};
`

function Task({ provided }: { provided: DraggableProvided }) {
  const theme = useTheme()

  const { dataTask, ordinalNumber, currentColumnLocation } = useContext(TaskItemContext)

  const [wasToggledButtonShowContent, setWasToggledButtonShowContent] = useState(false) // сам факт нажатия кнопки
  const [isDisabledButtonShowContent, setIsDisabledButtonShowContent] = useState(false)
  const [isOpenedContent, setIsOpenedContent] = useState(false) // открыто - при нажатии кнопки, закрыто - при завершении transition (handleTransitionEnd) (данное состояние необходимо для корректного отображения/скрытия при старте/финише анимации)

  const [styleParamsTask, setStyleParamsTask] = useState<StyleParamsTaskType>({
    closed: {
      task: { heightWithoutContent: null, height: null },
    }, // Task в закрытом виде
    opened: {
      task: { heightWithoutContent: null, height: null },
    }, // Task с открытым ContentBox
  })

  const refs: TaskElementsRefs = {
    refTask: useRef<HTMLDivElement>(null),
    refTitle: useRef<HTMLHeadingElement>(null),
    refContentBox: useRef<HTMLParagraphElement>(null),
  }

  const isTaskDone = currentColumnLocation === 'done' // находится ли задача в колонке 'done'

  const restOfDays = useMemo(() => calcRestOfDaysBeforeDeadline(dataTask.deadline), [dataTask.deadline])

  const styleTaskElements = useMemo(() => getColorsTaskElements(theme, restOfDays, isTaskDone), [restOfDays])

  // высчитываем высоту задачи
  useCalcHeightTask({
    dataTask,
    refs,
    styleParamsTask,
    setStyleParamsTask,
    wasToggledButtonShowContent,
  })

  // показать контент задачи
  function handleShowContent() {
    setWasToggledButtonShowContent((prevState) => !prevState)
    setIsDisabledButtonShowContent(true)

    if (!isOpenedContent) {
      setIsOpenedContent(true)
    }
  }

  // обработать окончание перехода (завершения открытия/закрытия описания задачи)
  function handleTransitionEnd(e: TransitionEvent) {
    if (e.propertyName === 'height') {
      if (!wasToggledButtonShowContent) {
        setIsOpenedContent(false)
      }

      setIsDisabledButtonShowContent(false)
    }
  }

  return (
    <CommonWrapper
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={provided?.innerRef}
      $hasDeadline={Boolean(dataTask.deadline)}
      $isTaskDone={isTaskDone}
    >
      <TaskBodyContext.Provider
        value={{
          isOpenedContent,
          isDisabledButtonShowContent,
          wasToggledButtonShowContent,
          styleTaskElements,
          restOfDays,
          isTaskDone,
          handleShowContent,
        }}
      >
        {(dataTask.deadline || isTaskDone) && <Deadline />}

        <OuterBoxTaskBody>
          <OrdinalNumber>{ordinalNumber}</OrdinalNumber>

          <InnerBoxTaskBody
            ref={refs.refTask}
            $isTaskDone={isTaskDone}
            $hasDeadline={Boolean(dataTask.deadline)}
            $styleParamsTask={styleParamsTask}
            $wasToggledButtonShowContent={wasToggledButtonShowContent}
            $styleTaskElements={styleTaskElements}
            onTransitionEnd={handleTransitionEnd}
          >
            <TaskBody refs={refs} />
          </InnerBoxTaskBody>
        </OuterBoxTaskBody>
      </TaskBodyContext.Provider>
    </CommonWrapper>
  )
}

export default Task
