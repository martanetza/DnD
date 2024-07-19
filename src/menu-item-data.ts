export type TMenuItemStatus = 'active' | 'inactive';
export type TMenuItem = { id: string; label: string; status: TMenuItemStatus };

const menuItemDataKey = Symbol('menuItem');

export type TMenuItemData = { [menuItemDataKey]: true; menuItemId: TMenuItem['id'] };

export function getMenuItemData(menuItem: TMenuItem): TMenuItemData {
  return { [menuItemDataKey]: true, menuItemId: menuItem.id };
}

export function isMenuItemData(data: Record<string | symbol, unknown>): data is TMenuItemData {
  return data[menuItemDataKey] === true;
}

const menuItems: TMenuItem[] = [
  { id: 'item-0', label: 'Home', status: 'active' },
  { id: 'item-1', label: 'About', status: 'inactive' },
  { id: 'item-2', label: 'Services', status: 'active' },
  { id: 'item-3', label: 'Contact', status: 'inactive' },
];

export function getMenuItems() {
  return menuItems;
}
