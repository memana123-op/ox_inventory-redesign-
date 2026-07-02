import React, { useCallback, useRef } from 'react';
import { DragSource, Inventory, InventoryType, Slot, SlotWithItem } from '../../typings';
import { useDrag, useDragDropManager, useDrop } from 'react-dnd';
import { useAppDispatch } from '../../store';
import { onDrop } from '../../dnd/onDrop';
import { onBuy } from '../../dnd/onBuy';
import { Items } from '../../store/items';
import { canCraftItem, canPurchaseItem, getItemRarity, getItemUrl, isSlotWithItem } from '../../helpers';
import { onUse } from '../../dnd/onUse';
import { Locale } from '../../store/locale';
import { onCraft } from '../../dnd/onCraft';
import useNuiEvent from '../../hooks/useNuiEvent';
import { ItemsPayload } from '../../reducers/refreshSlots';
import { closeTooltip, openTooltip } from '../../store/tooltip';
import { openContextMenu } from '../../store/contextMenu';
import { useMergeRefs } from '@floating-ui/react';
import { TinyBullet, TinyShield } from './CinematicIcons';
import { playInventorySound } from '../../utils/sounds';

interface SlotProps {
  inventoryId: Inventory['id'];
  inventoryType: Inventory['type'];
  inventoryGroups: Inventory['groups'];
  item: Slot;
  variant?: 'default' | 'quick';
  badge?: number;
  className?: string;
  ghost?: React.ReactNode;
  dimmed?: boolean;
  revealIndex?: number;
}

const InventorySlot: React.ForwardRefRenderFunction<HTMLDivElement, SlotProps> = (
  { item, inventoryId, inventoryType, inventoryGroups, variant = 'default', badge, className, ghost, dimmed, revealIndex },
  ref
) => {
  const manager = useDragDropManager();
  const dispatch = useAppDispatch();
  const timerRef = useRef<number | null>(null);

  const canDrag = useCallback(() => {
    return canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) && canCraftItem(item, inventoryType);
  }, [item, inventoryType, inventoryGroups]);

  const [{ isDragging }, drag] = useDrag<DragSource, void, { isDragging: boolean }>(
    () => ({
      type: 'SLOT',
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      item: () => {
        if (!isSlotWithItem(item, inventoryType !== InventoryType.SHOP)) return null;
        playInventorySound('pickup', item);
        return {
          inventory: inventoryType,
          item: {
            name: item.name,
            slot: item.slot,
          },
          image: item?.name && `url(${getItemUrl(item) || 'none'}`,
        };
      },
      canDrag,
    }),
    [inventoryType, item]
  );

  const [{ isOver }, drop] = useDrop<DragSource, void, { isOver: boolean }>(
    () => ({
      accept: 'SLOT',
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
      drop: (source) => {
        dispatch(closeTooltip());
        playInventorySound('drop', source.item);
        switch (source.inventory) {
          case InventoryType.SHOP:
            onBuy(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
          case InventoryType.CRAFTING:
            onCraft(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
          default:
            onDrop(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
        }
      },
      canDrop: (source) =>
        (source.item.slot !== item.slot || source.inventory !== inventoryType) &&
        inventoryType !== InventoryType.SHOP &&
        inventoryType !== InventoryType.CRAFTING,
    }),
    [inventoryType, item]
  );

  useNuiEvent('refreshSlots', (data: { items?: ItemsPayload | ItemsPayload[] }) => {
    if (!isDragging && !data.items) return;
    if (!Array.isArray(data.items)) return;

    const itemSlot = data.items.find(
      (dataItem) => dataItem.item.slot === item.slot && dataItem.inventory === inventoryId
    );

    if (!itemSlot) return;

    manager.dispatch({ type: 'dnd-core/END_DRAG' });
  });

  const connectRef = (element: HTMLDivElement | null) => {
    if (!element) return;
    drag(drop(element));
  };

  const handleContext = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (inventoryType !== 'player' || !isSlotWithItem(item)) return;

    dispatch(openContextMenu({ item, coords: { x: event.clientX, y: event.clientY } }));
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(closeTooltip());
    if (timerRef.current) clearTimeout(timerRef.current);
    // Shift (or Ctrl) + click quick-moves the item to the other inventory
    if ((event.shiftKey || event.ctrlKey) && isSlotWithItem(item) && inventoryType !== 'shop' && inventoryType !== 'crafting') {
      onDrop({ item: item, inventory: inventoryType });
    }
  };

  // Middle-click drops the item on the ground
  const handleAuxClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 1) return;
    event.preventDefault();
    if (!isSlotWithItem(item) || inventoryType !== 'player') return;
    dispatch(closeTooltip());
    playInventorySound('drop', item);
    onDrop({ item: item, inventory: inventoryType }, { inventory: 'newdrop', item: { slot: 1 } });
  };

  // Double-click uses the item
  const handleDoubleClick = () => {
    if (!isSlotWithItem(item) || inventoryType !== 'player') return;
    dispatch(closeTooltip());
    onUse(item);
  };

  const refs = useMergeRefs([connectRef, ref]);

  return (
    <div
      ref={refs}
      onContextMenu={handleContext}
      onClick={handleClick}
      onAuxClick={handleAuxClick}
      onDoubleClick={handleDoubleClick}
      className={[
        'inv-slot',
        variant === 'quick' ? 'quick-slot' : '',
        isSlotWithItem(item) ? 'filled' : 'empty',
        isDragging ? 'drag-source' : '',
        isOver ? 'drop-target' : '',
        dimmed ? 'search-dim' : '',
        revealIndex !== undefined ? 'reveal' : '',
        className || '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-slot={item.slot}
      style={{
        ...(revealIndex !== undefined ? ({ '--ri': revealIndex } as React.CSSProperties) : undefined),
        filter:
          !canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) || !canCraftItem(item, inventoryType)
            ? 'brightness(80%) grayscale(100%)'
            : undefined,
      }}
    >
      {isSlotWithItem(item) && (
        <>
          <span className={`rarity rarity-${getItemRarity(item) || ''}`} />
          <div
            className="item-slot-wrapper"
          onMouseEnter={() => {
            playInventorySound('hover', item);
            timerRef.current = window.setTimeout(() => {
              dispatch(openTooltip({ item, inventoryType }));
            }, 500) as unknown as number;
          }}
          onMouseLeave={() => {
            dispatch(closeTooltip());
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }}
          >
            <span className="item-icon">
              <img src={getItemUrl(item)} alt={item.metadata?.label || Items[item.name]?.label || item.name} draggable={false} />
            </span>
            {badge !== undefined && <span className="inv-badge">{badge}</span>}
            {inventoryType === 'shop' && item?.price !== undefined && (
              <span className="item-price">
                {item?.currency !== 'money' && item.currency !== 'black_money' && item.price > 0 && item.currency ? (
                  <>
                    <img
                      src={item.currency ? getItemUrl(item.currency) : 'none'}
                      alt=""
                    />
                    {item.price.toLocaleString('en-us')}
                  </>
                ) : (
                  item.price > 0 && `${Locale.$ || '$'}${item.price.toLocaleString('en-us')}`
                )}
              </span>
            )}
            <span className="item-caption">
              <span className="item-name">
                {item.metadata?.label ? item.metadata.label : Items[item.name]?.label || item.name}
              </span>
              {inventoryType !== 'shop' && item.durability !== undefined && (
                <span className="item-stat">
                  <TinyShield />
                  {Math.trunc(item.durability)}
                </span>
              )}
              {item.metadata?.ammo !== undefined && (
                <span className="item-stat">
                  <TinyBullet />
                  {item.metadata.ammo}
                </span>
              )}
              {item.count > 1 && <span className="item-count">×{item.count.toLocaleString('en-us')}</span>}
            </span>
            {inventoryType !== 'shop' && item.durability !== undefined && item.durability < 100 && (
              <span
                className={`slot-durability ${item.durability <= 25 ? 'low' : item.durability <= 50 ? 'mid' : ''}`}
              >
                <i style={{ width: `${Math.max(0, Math.min(100, item.durability))}%` }} />
              </span>
            )}
          </div>
        </>
      )}
      {!isSlotWithItem(item) && badge !== undefined && <span className="inv-badge">{badge}</span>}
      {!isSlotWithItem(item) && ghost !== undefined && <span className="ghost-icon">{ghost}</span>}
    </div>
  );
};

export default React.memo(React.forwardRef(InventorySlot));
