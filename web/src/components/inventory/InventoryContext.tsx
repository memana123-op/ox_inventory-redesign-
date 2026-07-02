import { onUse } from '../../dnd/onUse';
import { onGive } from '../../dnd/onGive';
import { onDrop } from '../../dnd/onDrop';
import { Items } from '../../store/items';
import { fetchNui } from '../../utils/fetchNui';
import { Locale } from '../../store/locale';
import { getItemRarity, getItemUrl, isSlotWithItem } from '../../helpers';
import { setClipboard } from '../../utils/setClipboard';
import { useAppSelector } from '../../store';
import React from 'react';
import { Menu, MenuDivider, MenuItem } from '../utils/menu/Menu';

interface DataProps {
  action: string;
  component?: string;
  slot?: number;
  serial?: string;
  id?: number;
}

interface Button {
  label: string;
  index: number;
  group?: string;
}

interface Group {
  groupName: string | null;
  buttons: ButtonWithIndex[];
}

interface ButtonWithIndex extends Button {
  index: number;
}

interface GroupedButtons extends Array<Group> {}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

// Per-action glyphs, same inline style as the rest of the UI (CinematicIcons)
const ActionIcon = {
  use: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path {...stroke} d="M8.5 1.5 4 9h3.2L6 14.5 12 7H8.6z" />
    </svg>
  ),
  give: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <rect {...stroke} x="2.5" y="6" width="11" height="8" rx="1" />
      <path {...stroke} d="M8 6v8M2.5 9.5h11M8 6C6 6 4.5 4.8 4.5 3.5 4.5 2.4 5.4 2 6.2 2 7.4 2 8 3.5 8 6zm0 0c2 0 3.5-1.2 3.5-2.5C11.5 2.4 10.6 2 9.8 2 8.6 2 8 3.5 8 6z" />
    </svg>
  ),
  drop: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path {...stroke} d="M8 2v7m0 0L5 6m3 3 3-3M2.5 11v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" />
    </svg>
  ),
  ammo: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path {...stroke} d="M6 6.5C6 4 7 2 8 2s2 2 2 4.5V12H6zM6 12h4v2H6z" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <rect {...stroke} x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path {...stroke} d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
    </svg>
  ),
  attachments: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <circle {...stroke} cx="8" cy="8" r="4.5" />
      <path {...stroke} d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" />
    </svg>
  ),
  custom: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path {...stroke} d="M8 2.5 9.6 6 13 6.5l-2.5 2.4.6 3.6L8 10.8l-3.1 1.7.6-3.6L3 6.5 6.4 6z" />
    </svg>
  ),
};

const InventoryContext: React.FC = () => {
  const contextMenu = useAppSelector((state) => state.contextMenu);
  const item = contextMenu.item;

  const handleClick = (data: DataProps) => {
    if (!item) return;

    switch (data && data.action) {
      case 'use':
        onUse({ name: item.name, slot: item.slot });
        break;
      case 'give':
        onGive({ name: item.name, slot: item.slot });
        break;
      case 'drop':
        isSlotWithItem(item) && onDrop({ item: item, inventory: 'player' });
        break;
      case 'remove':
        fetchNui('removeComponent', { component: data?.component, slot: data?.slot });
        break;
      case 'removeAmmo':
        fetchNui('removeAmmo', item.slot);
        break;
      case 'copy':
        setClipboard(data.serial || '');
        break;
      case 'custom':
        fetchNui('useButton', { id: (data?.id || 0) + 1, slot: item.slot });
        break;
    }
  };

  const groupButtons = (buttons: any): GroupedButtons => {
    return buttons.reduce((groups: Group[], button: Button, index: number) => {
      if (button.group) {
        const groupIndex = groups.findIndex((group) => group.groupName === button.group);
        if (groupIndex !== -1) {
          groups[groupIndex].buttons.push({ ...button, index });
        } else {
          groups.push({
            groupName: button.group,
            buttons: [{ ...button, index }],
          });
        }
      } else {
        groups.push({
          groupName: null,
          buttons: [{ ...button, index }],
        });
      }
      return groups;
    }, []);
  };

  const itemLabel = item && (item.metadata?.label || Items[item.name]?.label || item.name);
  const itemRarity = item && isSlotWithItem(item) ? getItemRarity(item) : undefined;
  const hasWeaponExtras = item && (item.metadata?.ammo > 0 || item.metadata?.serial || item.metadata?.components?.length > 0);
  const customButtons = ((item && item.name && Items[item.name]?.buttons?.length) || 0) > 0;

  return (
    <>
      <Menu>
        {item && isSlotWithItem(item) && (
          <div className="context-menu-header">
            <span className="cmh-icon">
              <img src={getItemUrl(item)} alt="" draggable={false} />
            </span>
            <span className="cmh-text">
              <span className="cmh-label">{itemLabel}</span>
              {itemRarity && <span className={`cmh-rarity ${itemRarity}`}>{itemRarity}</span>}
            </span>
          </div>
        )}
        <MenuItem onClick={() => handleClick({ action: 'use' })} label={Locale.ui_use || 'Use'} icon={ActionIcon.use} />
        <MenuItem
          onClick={() => handleClick({ action: 'give' })}
          label={Locale.ui_give || 'Give'}
          icon={ActionIcon.give}
        />
        <MenuItem
          onClick={() => handleClick({ action: 'drop' })}
          label={Locale.ui_drop || 'Drop'}
          icon={ActionIcon.drop}
          danger
        />
        {hasWeaponExtras && <MenuDivider />}
        {item && item.metadata?.ammo > 0 && (
          <MenuItem
            onClick={() => handleClick({ action: 'removeAmmo' })}
            label={Locale.ui_remove_ammo || 'Remove ammo'}
            icon={ActionIcon.ammo}
          />
        )}
        {item && item.metadata?.serial && (
          <MenuItem
            onClick={() => handleClick({ action: 'copy', serial: item.metadata?.serial })}
            label={Locale.ui_copy || 'Copy serial'}
            icon={ActionIcon.copy}
          />
        )}
        {item && item.metadata?.components && item.metadata?.components.length > 0 && (
          <Menu label={Locale.ui_removeattachments || 'Remove attachments'}>
            {item &&
              item.metadata?.components.map((component: string, index: number) => (
                <MenuItem
                  key={index}
                  onClick={() => handleClick({ action: 'remove', component, slot: item.slot })}
                  label={Items[component]?.label || ''}
                  icon={ActionIcon.attachments}
                />
              ))}
          </Menu>
        )}
        {customButtons && (
          <>
            <MenuDivider />
            {item &&
              item.name &&
              groupButtons(Items[item.name]?.buttons).map((group: Group, index: number) => (
                <React.Fragment key={index}>
                  {group.groupName ? (
                    <Menu label={group.groupName}>
                      {group.buttons.map((button: Button) => (
                        <MenuItem
                          key={button.index}
                          onClick={() => handleClick({ action: 'custom', id: button.index })}
                          label={button.label}
                          icon={ActionIcon.custom}
                        />
                      ))}
                    </Menu>
                  ) : (
                    group.buttons.map((button: Button) => (
                      <MenuItem
                        key={button.index}
                        onClick={() => handleClick({ action: 'custom', id: button.index })}
                        label={button.label}
                        icon={ActionIcon.custom}
                      />
                    ))
                  )}
                </React.Fragment>
              ))}
          </>
        )}
      </Menu>
    </>
  );
};

export default InventoryContext;
