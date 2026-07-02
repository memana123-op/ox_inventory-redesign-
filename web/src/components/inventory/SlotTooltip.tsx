import { Inventory, Slot, SlotWithItem } from '../../typings';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Items } from '../../store/items';
import { Locale } from '../../store/locale';
import { useAppSelector } from '../../store';
import { selectLeftInventory } from '../../store/inventory';
import ClockIcon from '../utils/icons/ClockIcon';
import { getItemRarity, getItemUrl, getTotalWeight, isSlotWithItem } from '../../helpers';
import Markdown from '../utils/Markdown';
import { TinyWeight } from './CinematicIcons';
import { Equipment, WeaponComponents, isWeaponExcluded } from '../../store/equipment';
import { fetchNui } from '../../utils/fetchNui';
import useCodePress from '../../hooks/useCodePress';

const componentIcon = (type: string) => {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 } as const;
  switch (type) {
    case 'flashlight':
      return (
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path {...stroke} d="M3 6h5l5-3v10l-5-3H3z" />
        </svg>
      );
    case 'muzzle':
      return (
        <svg viewBox="0 0 16 16" width="12" height="12">
          <rect {...stroke} x="2" y="6" width="9" height="4" rx="1" />
          <path {...stroke} d="M11 8h3" />
        </svg>
      );
    case 'grip':
      return (
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path {...stroke} d="M6 2h4v5l1 7H5l1-7z" />
        </svg>
      );
    case 'barrel':
      return (
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path {...stroke} d="M2 7h12M2 9h12M2 7v2M14 7v2" />
        </svg>
      );
    case 'magazine':
      return (
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path {...stroke} d="M6 2h5l-1 12H5z" />
        </svg>
      );
    case 'sight':
      return (
        <svg viewBox="0 0 16 16" width="12" height="12">
          <circle {...stroke} cx="8" cy="8" r="5" />
          <path {...stroke} d="M8 1v3M8 12v3M1 8h3M12 8h3" />
        </svg>
      );
    case 'skin':
      return (
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path {...stroke} d="M3 10l3-6 3 4 2-2 2 4z" />
          <rect {...stroke} x="2" y="3" width="12" height="10" rx="1" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 16 16" width="12" height="12">
          <rect {...stroke} x="3" y="3" width="10" height="10" rx="2" />
        </svg>
      );
  }
};

const formatWeight = (weight: number): string =>
  weight >= 1000
    ? `${(weight / 1000).toLocaleString('en-us', { minimumFractionDigits: 2 })} kg`
    : `${weight.toLocaleString('en-us')} g`;

// equipment bag slot number (the bag contents live in the player inventory
// partition rather than a separate container inventory)
const bagEquipSlot = (): number => {
  const index = Equipment.slots.findIndex((def) => def.id === 'bag');
  return index === -1 ? -1 : Equipment.baseSlot + index + 1;
};

interface PeekData {
  label?: string;
  items: Array<Pick<SlotWithItem, 'name' | 'count' | 'slot'> & { metadata?: SlotWithItem['metadata'] }>;
  slots?: number;
  weight?: number;
  maxWeight?: number;
}

// Contents preview shown while Z is held over a bag/container item.
const ContainerPeek: React.FC<{ item: SlotWithItem }> = ({ item }) => {
  const leftInventory = useAppSelector(selectLeftInventory);
  const containerId = item.metadata?.container as string | undefined;
  const isBag = !containerId && item.slot === bagEquipSlot();
  const [fetched, setFetched] = useState<PeekData | null | undefined>(undefined);

  useEffect(() => {
    if (!containerId) return;
    let stale = false;

    fetchNui<PeekData | false>('peekContainer', { slot: item.slot })
      .then((resp) => !stale && setFetched(resp || null))
      .catch(() => !stale && setFetched(null));

    return () => {
      stale = true;
    };
  }, [containerId, item.slot]);

  const data: PeekData | null = useMemo(() => {
    if (containerId) return fetched ?? null;
    if (!isBag) return null;

    const bagItems = leftInventory.items.slice(22, Equipment.baseSlot).filter((slot): slot is SlotWithItem =>
      isSlotWithItem(slot)
    );

    return {
      items: bagItems,
      weight: getTotalWeight(bagItems as Slot[]),
      maxWeight: (item.metadata?.maxWeight as number | undefined) ?? leftInventory.maxWeight,
      slots: Equipment.baseSlot - 22,
    };
  }, [containerId, fetched, isBag, leftInventory, item.metadata?.maxWeight]);

  if (containerId && fetched === undefined) {
    return <div className="tooltip-peek loading">…</div>;
  }

  if (!data) return <div className="tooltip-peek empty-note">{Locale.ui_peek_empty || 'Nothing to show'}</div>;

  const cellCount = Math.min(Math.max(data.items.length, 8), 16);
  const cells: Array<PeekData['items'][number] | undefined> = Array.from(
    { length: cellCount },
    (_, index) => data.items[index]
  );

  return (
    <div className="tooltip-peek">
      <div className="peek-head">
        <span>{Locale.ui_items || 'Items'}</span>
        {data.maxWeight !== undefined && (
          <span className="peek-weight">
            <TinyWeight />
            {((data.weight || 0) / 1000).toLocaleString('en-us', { maximumFractionDigits: 1 })}/
            {(data.maxWeight / 1000).toLocaleString('en-us', { maximumFractionDigits: 0 })} kg
          </span>
        )}
      </div>
      <div className="peek-grid">
        {cells.map((cell, index) =>
          cell ? (
            <div className="peek-cell filled" key={`peek-${cell.slot}-${index}`}>
              <span className={`rarity rarity-${getItemRarity(cell) || ''}`} />
              <img src={getItemUrl({ ...cell, weight: 0 } as SlotWithItem)} alt="" draggable={false} />
              {cell.count > 1 && <span className="peek-count">×{cell.count}</span>}
            </div>
          ) : (
            <div className="peek-cell" key={`peek-empty-${index}`} />
          )
        )}
      </div>
      {data.items.length > cellCount && (
        <div className="peek-more">+{data.items.length - cellCount} more</div>
      )}
    </div>
  );
};

const SlotTooltip: React.ForwardRefRenderFunction<
  HTMLDivElement,
  { item: SlotWithItem; inventoryType: Inventory['type']; style: React.CSSProperties }
> = ({ item, inventoryType, style }, ref) => {
  const additionalMetadata = useAppSelector((state) => state.inventory.additionalMetadata);
  const itemData = useMemo(() => Items[item.name], [item]);
  const peekHeld = useCodePress('KeyZ');
  const peekable =
    inventoryType === 'player' && (item.metadata?.container !== undefined || item.slot === bagEquipSlot());
  const ingredients = useMemo(() => {
    if (!item.ingredients) return null;
    return Object.entries(item.ingredients).sort((a, b) => a[1] - b[1]);
  }, [item]);
  const description = item.metadata?.description || itemData?.description;
  const ammoName = itemData?.ammoName && Items[itemData?.ammoName]?.label;
  const rarity = getItemRarity(item);

  // weapon attachment slots: every supported type with its attached item (if any)
  const attachmentSlots = useMemo(() => {
    if (!itemData?.weapon || WeaponComponents.slotTypes.length === 0 || isWeaponExcluded(item.name)) return null;

    const attached: string[] = item.metadata?.components || [];

    return WeaponComponents.slotTypes.map((slotType) => {
      const componentName = attached.find((name) => Items[name]?.componentType === slotType.type);

      return {
        ...slotType,
        attachedName: componentName,
        attachedLabel: componentName ? Items[componentName]?.label || componentName : undefined,
      };
    });
  }, [item, itemData]);

  return (
    <>
      {!itemData ? (
        <div className="tooltip-wrapper" ref={ref} style={style}>
          <div className="tooltip-header-wrapper">
            <p>{item.name}</p>
          </div>
        </div>
      ) : (
        <div style={{ ...style }} className="tooltip-wrapper" ref={ref}>
          <div className="tooltip-header-wrapper">
            <p>{item.metadata?.label || itemData.label || item.name}</p>
            {inventoryType === 'crafting' ? (
              <div className="tooltip-crafting-duration">
                <ClockIcon />
                <p>{(item.duration !== undefined ? item.duration : 3000) / 1000}s</p>
              </div>
            ) : (
              rarity && <span className={`tooltip-rarity-badge ${rarity}`}>{rarity}</span>
            )}
          </div>
          {description && (
            <div className="tooltip-description">
              <Markdown content={description} className="tooltip-markdown" />
            </div>
          )}
          {inventoryType !== 'crafting' ? (
            <div className="tooltip-rows">
              {item.durability !== undefined && (
                <div className="tooltip-row">
                  <span className="k">{Locale.ui_durability || 'Durability'}</span>
                  <span className="v">{Math.trunc(item.durability)}%</span>
                </div>
              )}
              {item.metadata?.serial && (
                <div className="tooltip-row">
                  <span className="k">{Locale.ui_serial || 'Serial'}</span>
                  <span className="v">{item.metadata.serial}</span>
                </div>
              )}
              {ammoName && (
                <div className="tooltip-row">
                  <span className="k">{Locale.ammo_type || 'Ammo Type'}</span>
                  <span className="v">{ammoName}</span>
                </div>
              )}
              {item.metadata?.ammo !== undefined && (
                <div className="tooltip-row">
                  <span className="k">{Locale.ui_loaded || 'Loaded'}</span>
                  <span className="v">{item.metadata.ammo}</span>
                </div>
              )}
              {item.metadata?.registered && (
                <div className="tooltip-row">
                  <span className="k">{Locale.ui_registered || 'Registered'}</span>
                  <span className="v">{item.metadata.registered}</span>
                </div>
              )}
              {item.metadata?.type && (
                <div className="tooltip-row">
                  <span className="k">{Locale.ui_type || 'Type'}</span>
                  <span className="v">{item.metadata.type}</span>
                </div>
              )}
              {!attachmentSlots && item.metadata?.components && item.metadata?.components[0] && (
                <div className="tooltip-row">
                  <span className="k">{Locale.ui_components || 'Components'}</span>
                  <span className="v">
                    {(item.metadata?.components).map((component: string, index: number, array: []) =>
                      index + 1 === array.length ? Items[component]?.label : Items[component]?.label + ', '
                    )}
                  </span>
                </div>
              )}
              {item.metadata?.weapontint && (
                <div className="tooltip-row">
                  <span className="k">{Locale.ui_tint || 'Tint'}</span>
                  <span className="v">{item.metadata.weapontint}</span>
                </div>
              )}
              {additionalMetadata.map((data: { metadata: string; value: string }, index: number) => (
                <Fragment key={`metadata-${index}`}>
                  {item.metadata && item.metadata[data.metadata] && (
                    <div className="tooltip-row">
                      <span className="k">{data.value}</span>
                      <span className="v">{item.metadata[data.metadata]}</span>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          ) : (
            <div className="tooltip-ingredients">
              {ingredients &&
                ingredients.map((ingredient) => {
                  const [item, count] = [ingredient[0], ingredient[1]];
                  return (
                    <div className="tooltip-ingredient" key={`ingredient-${item}`}>
                      <img src={item ? getItemUrl(item) : 'none'} alt="item-image" />
                      <p>
                        {count >= 1
                          ? `${count}x ${Items[item]?.label || item}`
                          : count === 0
                            ? `${Items[item]?.label || item}`
                            : count < 1 && `${count * 100}% ${Items[item]?.label || item}`}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
          {peekable && peekHeld && <ContainerPeek item={item} />}
          {peekable && !peekHeld && (
            <div className="tooltip-peek-hint">
              <span className="inv-kbd">Z</span> {Locale.ui_peek_hint || 'Hold to view contents'}
            </div>
          )}
          {attachmentSlots && inventoryType !== 'crafting' && (
            <div className="tooltip-attachments">
              {attachmentSlots.map((slot) => (
                <div className={`tooltip-attachment-cell ${slot.attachedName ? 'filled' : 'empty'}`} key={slot.type}>
                  <span className="att-label">{slot.label}</span>
                  <span className="att-box" title={slot.attachedLabel}>
                    {slot.attachedName ? <img src={getItemUrl(slot.attachedName)} alt="" /> : componentIcon(slot.type)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {item.weight !== undefined && (
            <div className="tooltip-weight-footer">
              <TinyWeight />
              {Locale.ui_weight || 'Weight'}: {formatWeight(item.weight)}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default React.forwardRef(SlotTooltip);
