import styled from '@emotion/styled';
import { GripVertical } from 'lucide-react';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { type HTMLAttributes, useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import { createPortal } from 'react-dom';
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { DropIndicator } from './drop-indicator';
import { getMenuItemData, isMenuItemData, type TMenuItem } from './menu-item-data';
import { Status } from './status';

// Styled components using Emotion
const Container = styled.div`
  position: relative;
`;

const MenuItemContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid;
  border-radius: 0.25rem;
  padding: 0.5rem 0;
  padding-left: 0;
  &:hover {
    background-color: #f1f5f9;
    cursor: grab;
  }
`;

const IconContainer = styled.div`
  width: 1.5rem;
  display: flex;
  justify-content: center;
`;

const Label = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-grow: 1;
  flex-shrink: 1;
`;

const DragPreviewConteiner = styled.div`
  width: 100px;
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid;
  border-radius: 0.25rem;
  padding: 0.5rem 0;
`;

type MenuItemState =
  | {
      type: 'idle';
    }
  | {
      type: 'preview';
      container: HTMLElement;
    }
  | {
      type: 'is-dragging';
    }
  | {
      type: 'is-dragging-over';
      closestEdge: Edge | null;
    };

const stateStyles: {
  [Key in MenuItemState['type']]?: HTMLAttributes<HTMLDivElement>['className'];
} = {
  'is-dragging': 'opacity-40',
};

const idle: MenuItemState = { type: 'idle' };

export function MenuItem({ menuItem }: { menuItem: TMenuItem }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<MenuItemState>(idle);

  useEffect(() => {
    const element = ref.current;
    invariant(element);
    return combine(
      draggable({
        element,
        getInitialData() {
          return getMenuItemData(menuItem);
        },
        onGenerateDragPreview({ nativeSetDragImage }) {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({
              x: '16px',
              y: '8px',
            }),
            render({ container }) {
              setState({ type: 'preview', container });
            },
          });
        },
        onDragStart() {
          setState({ type: 'is-dragging' });
        },
        onDrop() {
          setState(idle);
        },
      }),
      dropTargetForElements({
        element,
        canDrop({ source }) {
          // not allowing dropping on yourself
          if (source.element === element) {
            return false;
          }
          // only allowing menu items to be dropped on me
          return isMenuItemData(source.data);
        },
        getData({ input }) {
          const data = getMenuItemData(menuItem);
          return attachClosestEdge(data, {
            element,
            input,
            allowedEdges: ['top', 'bottom'],
          });
        },
        getIsSticky() {
          return true;
        },
        onDragEnter({ self }) {
          const closestEdge = extractClosestEdge(self.data);
          setState({ type: 'is-dragging-over', closestEdge });
        },
        onDrag({ self }) {
          const closestEdge = extractClosestEdge(self.data);

          // Only need to update react state if nothing has changed.
          // Prevents re-rendering.
          setState((current) => {
            if (current.type === 'is-dragging-over' && current.closestEdge === closestEdge) {
              return current;
            }
            return { type: 'is-dragging-over', closestEdge };
          });
        },
        onDragLeave() {
          setState(idle);
        },
        onDrop() {
          setState(idle);
        },
      }),
    );
  }, [menuItem]);

  return (
    <>
      <Container className="relative">
        <MenuItemContainer
          // Adding data-attribute as a way to query for this for our post drop flash
          data-menu-item-id={menuItem.id}
          ref={ref}
          className={`flex text-sm bg-white flex-row items-center border border-solid rounded p-2 pl-0 hover:bg-slate-100 hover:cursor-grab ${stateStyles[state.type] ?? ''}`}
        >
          <IconContainer className="w-6 flex justify-center">
            <GripVertical size={10} />
          </IconContainer>
          <Label className="truncate flex-grow flex-shrink">{menuItem.label}</Label>
          <Status status={menuItem.status} />
        </MenuItemContainer>
        {state.type === 'is-dragging-over' && state.closestEdge ? (
          <DropIndicator edge={state.closestEdge} gap={'8px'} />
        ) : null}
      </Container>
      {state.type === 'preview'
        ? createPortal(<DragPreview menuItem={menuItem} />, state.container)
        : null}
    </>
  );
}

// A simplified version of our menu item for the user to drag around
function DragPreview({ menuItem }: { menuItem: TMenuItem }) {
  return <DragPreviewConteiner>{menuItem.label}</DragPreviewConteiner>;
}
