import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { getMenuItems, type TMenuItem } from './menu-item-data';
import { MenuItem } from './MenuItem';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { isMenuItemData } from './menu-item-data';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash';
import { flushSync } from 'react-dom';

const ListContainer = styled.div`
  padding-top: 6px;
  margin: 0 auto;
  width: 420px;
`;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid;
  border-radius: 4px;
  padding: 2px;
`;

export function List() {
  const [menuItems, setMenuItems] = useState<TMenuItem[]>(() => getMenuItems());

  useEffect(() => {
    return monitorForElements({
      canMonitor({ source }) {
        return isMenuItemData(source.data);
      },
      onDrop({ location, source }) {
        const target = location.current.dropTargets[0];
        if (!target) {
          return;
        }

        const sourceData = source.data;
        const targetData = target.data;

        if (!isMenuItemData(sourceData) || !isMenuItemData(targetData)) {
          return;
        }

        const indexOfSource = menuItems.findIndex(
          (menuItem) => menuItem.id === sourceData.menuItemId,
        );
        const indexOfTarget = menuItems.findIndex(
          (menuItem) => menuItem.id === targetData.menuItemId,
        );

        if (indexOfTarget < 0 || indexOfSource < 0) {
          return;
        }

        const closestEdgeOfTarget = extractClosestEdge(targetData);

        // Using `flushSync` so we can query the DOM straight after this line
        flushSync(() => {
          setMenuItems(
            reorderWithEdge({
              list: menuItems,
              startIndex: indexOfSource,
              indexOfTarget,
              closestEdgeOfTarget,
              axis: 'vertical',
            }),
          );
        });
        // Being simple and just querying for the menu item after the drop.
        // We could use react context to register the element in a lookup,
        // and then we could retrieve that element after the drop and use
        // `triggerPostMoveFlash`. But this gets the job done.
        const element = document.querySelector(`[data-task-id="${sourceData.menuItemId}"]`);
        if (element instanceof HTMLElement) {
          triggerPostMoveFlash(element);
        }
      },
    });
  }, [menuItems]);

  return (
    <ListContainer>
      <MenuContainer>
        {menuItems.map((menuItem) => (
          <MenuItem key={menuItem.id} menuItem={menuItem} />
        ))}
      </MenuContainer>
    </ListContainer>
  );
}
