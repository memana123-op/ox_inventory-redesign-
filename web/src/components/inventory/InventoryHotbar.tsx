import React, { useState } from 'react';
import { getItemRarity, getItemUrl, isSlotWithItem } from '../../helpers';
import useNuiEvent from '../../hooks/useNuiEvent';
import { Items } from '../../store/items';
import { useAppSelector } from '../../store';
import { selectLeftInventory } from '../../store/inventory';
import { Slot, SlotWithItem } from '../../typings';
import Fade from '../utils/transitions/Fade';
import { TinyBullet, TinyShield } from './CinematicIcons';
import { Equipment } from '../../store/equipment';

const slotLabel = (item: SlotWithItem) => item.metadata?.label || Items[item.name]?.label || item.name;

const rarityClass = (item: Slot) => {
  if (!isSlotWithItem(item)) return '';
  const rarity = getItemRarity(item);
  return rarity ? `hud-rarity-${rarity}` : '';
};

const WeaponCard: React.FC<{ item: Slot; index: number }> = ({ item, index }) => {
  const filled = isSlotWithItem(item);

  return (
    <div className={`hud-weapon-card ${filled ? 'filled' : 'empty'} ${rarityClass(item)}`}>
      <span className="hud-key">{index}</span>
      {filled && (
        <>
          <div className="hud-weapon-name">{slotLabel(item)}</div>
          <div className="hud-weapon-body">
            <img src={getItemUrl(item)} alt="" draggable={false} />
            <div className="hud-weapon-stats">
              {item.durability !== undefined && (
                <span className="hud-stat">
                  <TinyShield />
                  {Math.trunc(item.durability)}
                </span>
              )}
              {item.metadata?.ammo !== undefined && (
                <span className={`hud-stat ammo ${item.metadata.ammo === 0 ? 'out' : ''}`}>
                  <TinyBullet />
                  {item.metadata.ammo}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const InventoryHotbar: React.FC = () => {
  const [hotbarVisible, setHotbarVisible] = useState(false);
  const items = useAppSelector(selectLeftInventory).items;

  //stupid fix for timeout
  const [handle, setHandle] = useState<ReturnType<typeof setTimeout>>();
  useNuiEvent('toggleHotbar', () => {
    if (hotbarVisible) {
      setHotbarVisible(false);
    } else {
      if (handle) clearTimeout(handle);
      setHotbarVisible(true);
      setHandle(setTimeout(() => setHotbarVisible(false), 3000));
    }
  });

  // Keys 1-2 are the equipped weapon slots, keys 3-8 the quick-use slots 1-6
  const weaponSlots =
    Equipment.slots.length > 0 ? items.slice(Equipment.baseSlot, Equipment.baseSlot + 2) : items.slice(0, 2);
  const quickSlots = Equipment.slots.length > 0 ? items.slice(0, 6) : items.slice(2, 5);

  return (
    <Fade in={hotbarVisible}>
      <div className="hud-root">
        {weaponSlots.map((item, index) => (
          <WeaponCard key={`hud-weapon-${item.slot}`} item={item} index={index + 1} />
        ))}
        <div className="hud-slot-row">
          {quickSlots.map((item, index) => (
            <div
              key={`hud-slot-${item.slot}`}
              className={`hud-item-slot ${isSlotWithItem(item) ? 'filled' : 'empty'} ${rarityClass(item)}`}
            >
              <span className="hud-key">{index + 3}</span>
              {isSlotWithItem(item) && (
                <>
                  <img src={getItemUrl(item)} alt="" draggable={false} />
                  {item.count > 1 && <span className="hud-count">×{item.count}</span>}
                  {item.durability !== undefined && item.durability < 100 && (
                    <span className="slot-durability">
                      <i style={{ width: `${Math.max(0, Math.min(100, item.durability))}%` }} />
                    </span>
                  )}
                  <span className="hud-slot-label">{slotLabel(item)}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Fade>
  );
};

export default InventoryHotbar;
