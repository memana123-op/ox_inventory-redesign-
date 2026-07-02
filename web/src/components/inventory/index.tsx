import React, { useEffect, useMemo, useState } from 'react';
import useNuiEvent from '../../hooks/useNuiEvent';
import InventoryControl from './InventoryControl';
import InventoryHotbar from './InventoryHotbar';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  refreshSlots,
  selectIsBusy,
  selectLeftInventory,
  selectRightInventory,
  setAdditionalMetadata,
  setupInventory,
} from '../../store/inventory';
import { useExitListener } from '../../hooks/useExitListener';
import type { Inventory as InventoryProps } from '../../typings';
import Tooltip from '../utils/Tooltip';
import { closeTooltip } from '../../store/tooltip';
import InventoryContext from './InventoryContext';
import { closeContextMenu } from '../../store/contextMenu';
import Fade from '../utils/transitions/Fade';
import InventorySlot from './InventorySlot';
import UsefulControls from './UsefulControls';
import SettingsPanel from './SettingsPanel';
import { useSettings } from '../../store/settings';
import { fetchNui } from '../../utils/fetchNui';
import { getItemRarity, getItemUrl, getTotalWeight, isSlotWithItem } from '../../helpers';
import { Items } from '../../store/items';
import { Equipment } from '../../store/equipment';
import { useDrop } from 'react-dnd';
import { onDrop } from '../../dnd/onDrop';
import type { DragSource } from '../../typings';
import { GhostIcon, HeaderIcon, TinyBullet, TinyShield, TinyWeight } from './CinematicIcons';
import { Slot, SlotWithItem } from '../../typings';

const ghostForType: Record<string, React.ReactNode> = {
  weapon: GhostIcon.bag,
  vest: GhostIcon.vest,
  bag: GhostIcon.bag,
  outfit: GhostIcon.shirt,
  mask: GhostIcon.mask,
  hat: GhostIcon.cap,
  glasses: GhostIcon.glasses,
  watch: GhostIcon.watch,
  chain: GhostIcon.chain,
  earring: GhostIcon.earring,
  necklace: GhostIcon.necklace,
  gloves: GhostIcon.shirt,
  shoes: GhostIcon.shirt,
  accessory: GhostIcon.chain,
};

const slotLabel = (item?: SlotWithItem) => item && (item.metadata?.label || Items[item.name]?.label || item.name);

const PreviewSlot = ({
  item,
  wide,
  ghost,
}: {
  item?: SlotWithItem;
  wide?: boolean;
  ghost?: React.ReactNode;
}) => (
  <div className={['inv-slot', wide ? 'wide' : '', item ? 'filled preview-slot' : 'empty'].filter(Boolean).join(' ')}>
    {item ? (
      <>
        <span className="item-icon">
          <img src={getItemUrl(item)} alt={slotLabel(item)} draggable={false} />
        </span>
        <span className="item-caption">
          <span className="item-name">{slotLabel(item)}</span>
          {item.durability !== undefined && (
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
        </span>
      </>
    ) : (
      ghost && <span className="ghost-icon">{ghost}</span>
    )}
  </div>
);

// Dashed drop target shown when no secondary inventory is open: dragging an
// item here drops it on the ground.
const GroundDropZone: React.FC = () => {
  const [{ isOver }, drop] = useDrop<DragSource, void, { isOver: boolean }>(() => ({
    accept: 'SLOT',
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    drop: (source) => onDrop(source, { inventory: 'newdrop', item: { slot: 1 } }),
  }));

  return (
    <div
      ref={(el) => {
        drop(el);
      }}
      className={`ground-drop-zone ${isOver ? 'over' : ''}`}
    >
      <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3v10m0 0l-4-4m4 4l4-4" />
        <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
      </svg>
      <span>DROP ITEM</span>
    </div>
  );
};

const Weight = ({ items, maxWeight }: { items: InventoryProps['items']; maxWeight?: number }) => {
  const current = getTotalWeight(items) / 1000;
  const max = (maxWeight || 0) / 1000;
  const percent = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  return (
    <div className={`inv-weight ${percent > 70 ? 'warn' : ''}`}>
      <span className="val">
        <TinyWeight />
        {current.toFixed(2)}/{max.toFixed(0)} kg
      </span>
      <span className="bar">
        <i style={{ width: `${percent}%` }} />
      </span>
    </div>
  );
};

interface PlayerInfo {
  name?: string;
  job?: string;
  cash?: number;
  bank?: number;
}

interface VicinityDrop {
  id: string;
  items: Array<{
    name: string;
    count: number;
    slot: number;
    metadata?: { label?: string; rarity?: string; imageurl?: string };
  }>;
}

const formatMoney = (value?: number) =>
  value === undefined ? undefined : `$${Math.trunc(value).toLocaleString('en-US')}`;

const Inventory: React.FC = () => {
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [stageScale, setStageScale] = useState(1);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bagOpen, setBagOpen] = useState(true);
  const [vicinity, setVicinity] = useState<VicinityDrop[]>([]);
  const settings = useSettings();
  const dispatch = useAppDispatch();
  const leftInventory = useAppSelector(selectLeftInventory);
  const rightInventory = useAppSelector(selectRightInventory);
  const isBusy = useAppSelector(selectIsBusy);

  useNuiEvent<boolean>('setInventoryVisible', setInventoryVisible);
  useNuiEvent<PlayerInfo>('setPlayerInfo', setPlayerInfo);
  useNuiEvent<VicinityDrop[]>('setVicinity', (data) => setVicinity(Array.isArray(data) ? data : []));
  useNuiEvent<false>('closeInventory', () => {
    setInventoryVisible(false);
    setControlsVisible(false);
    setInfoVisible(false);
    setSettingsVisible(false);
    setSearchOpen(false);
    setSearchQuery('');
    setVicinity([]);
    dispatch(closeContextMenu());
    dispatch(closeTooltip());
  });
  useExitListener(setInventoryVisible);

  useNuiEvent<{
    leftInventory?: InventoryProps;
    rightInventory?: InventoryProps;
  }>('setupInventory', (data) => {
    dispatch(setupInventory(data));
    !inventoryVisible && setInventoryVisible(true);
  });

  useNuiEvent('refreshSlots', (data) => dispatch(refreshSlots(data)));

  useNuiEvent('displayMetadata', (data: Array<{ metadata: string; value: string }>) => {
    dispatch(setAdditionalMetadata(data));
  });

  useEffect(() => {
    const resize = () =>
      setStageScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080) * (settings.scale / 100));
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [settings.scale]);

  // Forward held preview keys to the ped camera: A/D rotates, W/S zooms.
  useEffect(() => {
    if (!inventoryVisible) return;

    const held: Record<'rotate' | 'zoom', number> = { rotate: 0, zoom: 0 };

    const send = (control: 'rotate' | 'zoom', value: number) => {
      if (held[control] === value) return;
      held[control] = value;
      fetchNui('pedPreviewControl', { control, value });
    };

    const keyControl = (code: string): ['rotate' | 'zoom', number] | undefined => {
      switch (code) {
        case 'KeyA':
          return ['rotate', -1];
        case 'KeyD':
          return ['rotate', 1];
        case 'KeyW':
          return ['zoom', -1];
        case 'KeyS':
          return ['zoom', 1];
      }
    };

    const isTyping = (target: EventTarget | null) =>
      target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const mapped = keyControl(event.code);
      if (mapped) send(mapped[0], mapped[1]);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const mapped = keyControl(event.code);
      if (mapped && held[mapped[0]] === mapped[1]) send(mapped[0], 0);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      send('rotate', 0);
      send('zoom', 0);
    };
  }, [inventoryVisible]);

  const equipCount = Equipment.slots.length;
  const baseSlot = equipCount > 0 ? Equipment.baseSlot : leftInventory.items.length;

  // slots 1-6 are the quick-use row (keys 3-8; 1-2 draw the equipped weapons)
  const hotbarItems = leftInventory.items.slice(0, 6);
  const pocketItems = leftInventory.items.slice(6, 22);
  const bagItems = leftInventory.items.slice(22, baseSlot);
  // reserved equipment slots appended after the regular slots
  const equipmentItems = leftInventory.items.slice(baseSlot, baseSlot + equipCount);
  const equipSlot = (id: string): { def?: (typeof Equipment.slots)[number]; item?: Slot } => {
    const index = Equipment.slots.findIndex((slotDef) => slotDef.id === id);
    return index === -1 ? {} : { def: Equipment.slots[index], item: equipmentItems[index] };
  };
  const accessorySlots = Equipment.slots
    .map((def, index) => ({ def, item: equipmentItems[index] }))
    .filter(({ def }) => !['weapon1', 'weapon2', 'vest', 'bag', 'outfit'].includes(def.id));
  const rightItems = useMemo<Slot[]>(() => {
    if (rightInventory.type !== 'shop' && rightInventory.type !== 'crafting') return rightInventory.items;

    const items: Slot[] = rightInventory.items.filter((item) => isSlotWithItem(item));
    const emptyCount = Math.max(0, 24 - items.length);
    return [...items, ...Array.from({ length: emptyCount }, (_, index) => ({ slot: -(index + 1) }))];
  }, [rightInventory]);
  const playerItems = leftInventory.items.filter((item): item is SlotWithItem => isSlotWithItem(item));
  const weapons = playerItems.filter(
    (item) => item.name.toUpperCase().startsWith('WEAPON_') || item.metadata?.ammo !== undefined
  );
  const vest = playerItems.find((item) => /armou?r|vest/i.test(item.name));
  const bag = playerItems.find((item) => item.metadata?.container !== undefined || /bag|backpack/i.test(item.name));
  const outfit = playerItems.find((item) => /outfit|clothes|shirt/i.test(item.name));
  const rightLabel = rightInventory.label || (rightInventory.type === 'player' ? 'Player Inventory' : 'Inventory');
  const groupLabel = useMemo(() => {
    const group = leftInventory.groups && Object.entries(leftInventory.groups)[0];
    return group ? `${group[0]} - ${group[1]}` : 'Player inventory';
  }, [leftInventory.groups]);

  const matchesSearch = (slot: Slot) => {
    if (!searchQuery) return true;
    if (!isSlotWithItem(slot)) return true;
    const label = String(slot.metadata?.label || Items[slot.name]?.label || slot.name);
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <>
      <Fade in={inventoryVisible}>
        <div className="viewport">
          <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${stageScale})` }}>
            <div className="atmo-scene" />
            <div className="atmo-fog">
              <i />
              <i />
            </div>
            <div className="atmo-scanlines" />
            <div className="atmo-noise" />
            <div className="atmo-vignette" />

            <div className="inv-root">
              <header className="inv-header">
                <div>
                  <div className="title-row">
                    <h1>Inventory</h1>
                    <span className="player-name">{playerInfo.name || leftInventory.label || 'Player'}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-item">
                      {HeaderIcon.job} {playerInfo.job || groupLabel}
                    </span>
                    {playerInfo.cash !== undefined && (
                      <>
                        <span className="sep" />
                        <span className="meta-item">
                          {HeaderIcon.cash} {formatMoney(playerInfo.cash)}
                        </span>
                      </>
                    )}
                    {playerInfo.bank !== undefined && (
                      <>
                        <span className="sep" />
                        <span className="meta-item">
                          {HeaderIcon.bank} {formatMoney(playerInfo.bank)}
                        </span>
                      </>
                    )}
                    {playerInfo.cash === undefined && playerInfo.bank === undefined && (
                      <>
                        <span className="sep" />
                        <span className="meta-item">
                          {HeaderIcon.cash} {leftInventory.slots} slots
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="header-actions">
                  <button className="icon-btn" type="button" title="Item actions" onClick={() => setControlsVisible(true)}>
                    {HeaderIcon.search}
                  </button>
                  <button className="icon-btn" type="button" title="Settings" onClick={() => setSettingsVisible(true)}>
                    {HeaderIcon.settings}
                  </button>
                  <button className="icon-btn" type="button" title="Useful controls" onClick={() => setInfoVisible(true)}>
                    {HeaderIcon.info}
                  </button>
                  <button className="icon-btn" type="button" title="Close" onClick={() => fetchNui('exit')}>
                    {HeaderIcon.close}
                  </button>
                </div>
              </header>

              <main className="inv-main" style={{ pointerEvents: isBusy ? 'none' : 'auto' }}>
                <div className="col">
                  <div className="equip-stack">
                    {equipCount > 0 ? (
                      <>
                        {(['weapon1', 'weapon2'] as const).map((id, weaponIndex) => {
                          const { def, item } = equipSlot(id);
                          return (
                            def &&
                            item && (
                              <InventorySlot
                                key={`equip-${id}`}
                                item={item}
                                inventoryType={leftInventory.type}
                                inventoryId={leftInventory.id}
                                inventoryGroups={leftInventory.groups}
                                className="wide"
                                badge={weaponIndex + 1}
                                ghost={ghostForType[def.type]}
                              />
                            )
                          );
                        })}
                        <div className="equip-row">
                          {(['vest', 'bag'] as const).map((id) => {
                            const { def, item } = equipSlot(id);
                            return (
                              def &&
                              item && (
                                <InventorySlot
                                  key={`equip-${id}`}
                                  item={item}
                                  inventoryType={leftInventory.type}
                                  inventoryId={leftInventory.id}
                                  inventoryGroups={leftInventory.groups}
                                  ghost={ghostForType[def.type]}
                                />
                              )
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <PreviewSlot item={weapons[0]} wide ghost={GhostIcon.bag} />
                        <PreviewSlot item={weapons[1]} wide ghost={GhostIcon.bag} />
                        <div className="equip-row">
                          <PreviewSlot item={vest} ghost={GhostIcon.vest} />
                          <PreviewSlot item={bag} ghost={GhostIcon.bag} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="col char-zone">
                  {/* transparent window: the real game ped is framed here by the
                      cinematic camera (modules/custom/cinematic) */}
                  <div className="char-render" />
                  <div className="char-health">
                    <span className="heart">♥</span>
                    <span className="pips">
                      {Array.from({ length: 10 }, (_, index) => (
                        <i key={index} className={index < 8 ? '' : 'off'} />
                      ))}
                    </span>
                  </div>
                </div>

                <div className="col">
                  <div className="outfit-slot-wrap">
                    <div className="inv-mini-label">Outfit</div>
                    <div className="outfit-preview">
                      {equipCount > 0 && equipSlot('outfit').item ? (
                        <InventorySlot
                          item={equipSlot('outfit').item as Slot}
                          inventoryType={leftInventory.type}
                          inventoryId={leftInventory.id}
                          inventoryGroups={leftInventory.groups}
                          ghost={GhostIcon.shirt}
                        />
                      ) : (
                        <PreviewSlot item={outfit} ghost={GhostIcon.shirt} />
                      )}
                    </div>
                  </div>
                  <div className="inv-mini-label">Accessories</div>
                  <div className="acc-grid">
                    {equipCount > 0
                      ? accessorySlots.map(
                          ({ def, item }) =>
                            item && (
                              <InventorySlot
                                key={`acc-${def.id}`}
                                item={item}
                                inventoryType={leftInventory.type}
                                inventoryId={leftInventory.id}
                                inventoryGroups={leftInventory.groups}
                                className="sm"
                                ghost={ghostForType[def.type]}
                              />
                            )
                        )
                      : [
                          GhostIcon.shirt,
                          GhostIcon.vest,
                          GhostIcon.mask,
                          GhostIcon.cap,
                          GhostIcon.glasses,
                          GhostIcon.watch,
                          GhostIcon.chain,
                          GhostIcon.earring,
                          GhostIcon.necklace,
                          GhostIcon.bag,
                        ].map((icon, index) => (
                          <div className="inv-slot sm empty" key={index}>
                            <span className="ghost-icon">{icon}</span>
                          </div>
                        ))}
                  </div>
                </div>

                <div className="col">
                  <div className="inv-section-head">
                    <span className="label">
                      Pockets
                      <button
                        className={`search-toggle ${searchOpen ? 'active' : ''}`}
                        type="button"
                        title="Search"
                        onClick={() => {
                          setSearchOpen(!searchOpen);
                          if (searchOpen) setSearchQuery('');
                        }}
                      >
                        {HeaderIcon.search}
                      </button>
                      {searchOpen && (
                        <input
                          className="search-input"
                          autoFocus
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                        />
                      )}
                    </span>
                    <Weight items={leftInventory.items} maxWeight={leftInventory.maxWeight} />
                  </div>
                  <div className="slot-grid pocket-grid">
                    {pocketItems.map((item) => (
                      <InventorySlot
                        key={`pocket-${item.slot}`}
                        item={item}
                        inventoryType={leftInventory.type}
                        inventoryId={leftInventory.id}
                        inventoryGroups={leftInventory.groups}
                        dimmed={!matchesSearch(item)}
                      />
                    ))}
                  </div>
                  <div className="bag-head">
                    <span className="bag-chip">{GhostIcon.bag}</span>
                    <span>
                      <div className="bag-title">Bag</div>
                      <div className="bag-sub">
                        {(getTotalWeight(bagItems) / 1000).toFixed(1)}/
                        {((bag?.metadata?.maxWeight ?? leftInventory.maxWeight ?? 0) as number) / 1000} kg
                      </div>
                    </span>
                    <button
                      className={`bag-expand ${bagOpen ? 'open' : ''}`}
                      type="button"
                      onClick={() => setBagOpen(!bagOpen)}
                    >
                      ▾
                    </button>
                  </div>
                  {bagOpen && (
                    <div className="slot-grid bag-grid">
                      {bagItems.map((item) => (
                        <InventorySlot
                          key={`bag-${item.slot}`}
                          item={item}
                          inventoryType={leftInventory.type}
                          inventoryId={leftInventory.id}
                          inventoryGroups={leftInventory.groups}
                          dimmed={!matchesSearch(item)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="col">
                  {rightInventory.type === 'newdrop' || !rightInventory.type ? (
                    <>
                      <div className="inv-section-head">
                        <span className="label">Vicinity</span>
                        {vicinity.length > 0 && (
                          <span className="vicinity-count">
                            {vicinity.reduce((total, drop) => total + drop.items.length, 0)} items
                          </span>
                        )}
                      </div>
                      {vicinity.length > 0 && (
                        <div className="slot-grid vicinity-grid">
                          {vicinity.flatMap((drop) =>
                            drop.items.map((dropItem) => (
                              <div
                                key={`vic-${drop.id}-${dropItem.slot}`}
                                className="inv-slot filled vicinity-slot"
                                title="Open drop"
                                onClick={() => fetchNui('openVicinityDrop', { id: drop.id })}
                              >
                                <span className={`rarity rarity-${getItemRarity(dropItem) || ''}`} />
                                <span className="item-icon">
                                  <img
                                    src={getItemUrl({ ...dropItem, weight: 0 } as SlotWithItem)}
                                    alt={dropItem.metadata?.label || Items[dropItem.name]?.label || dropItem.name}
                                    draggable={false}
                                  />
                                </span>
                                <span className="item-caption">
                                  <span className="item-name">
                                    {dropItem.metadata?.label || Items[dropItem.name]?.label || dropItem.name}
                                  </span>
                                  {dropItem.count > 1 && (
                                    <span className="item-count">×{dropItem.count.toLocaleString('en-us')}</span>
                                  )}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      <GroundDropZone />
                    </>
                  ) : (
                    <>
                      <div className="inv-section-head">
                        <span className="label">{rightLabel}</span>
                        <Weight items={rightInventory.items} maxWeight={rightInventory.maxWeight} />
                      </div>
                      <div className="slot-grid right-grid" key={`grid-${rightInventory.id}`}>
                        {rightItems.map((item, index) => (
                          <InventorySlot
                            key={`right-${rightInventory.id}-${item.slot}`}
                            item={item}
                            inventoryType={rightInventory.type}
                            inventoryId={rightInventory.id}
                            inventoryGroups={rightInventory.groups}
                            revealIndex={isSlotWithItem(item) ? Math.min(index, 40) : undefined}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </main>

              <div className="quickuse">
                <div className="inv-section-head">
                  <span className="label">Quick Use</span>
                </div>
                <div className="slot-row">
                  {hotbarItems.map((item, index) => (
                    <InventorySlot
                      key={`quick-${item.slot}`}
                      item={item}
                      inventoryType={leftInventory.type}
                      inventoryId={leftInventory.id}
                      inventoryGroups={leftInventory.groups}
                      variant="quick"
                      badge={index + 3}
                    />
                  ))}
                </div>
              </div>

              <footer className="inv-footer">
                <span className="keyhint">
                  <span className="inv-kbd">ALT</span> Split stack
                </span>
                <span className="keyhint">
                  <span className="inv-kbd">SHIFT</span> Quick move
                </span>
                <span className="keyhint">
                  <span className="inv-kbd">MMB</span> Quick drop
                </span>
                <span className="keyhint">
                  <span className="inv-kbd">A/D</span> Rotate
                </span>
              </footer>
            </div>
          </div>

          <InventoryControl visible={controlsVisible} onClose={() => setControlsVisible(false)} />
          <SettingsPanel visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
          <UsefulControls infoVisible={infoVisible} setInfoVisible={setInfoVisible} />
          <Tooltip />
          <InventoryContext />
        </div>
      </Fade>
      <InventoryHotbar />
    </>
  );
};

export default Inventory;
