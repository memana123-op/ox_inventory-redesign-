# Extended Inventory Systems

This fork adds five systems on top of ox_inventory. Everything is configured in
**`data/custom.lua`** — no convars needed. All features can be toggled
individually with their `enabled` flag.

---

## 1. Custom Equipment Slots

15 reserved slots are appended after your regular inventory slots
(`inventory:slots` convar, default 50 → equipment is slots 51–65):

| UI area | Slots |
|---|---|
| Left column | Primary weapon, Secondary weapon, Vest, Bag |
| Outfit panel | Outfit |
| Accessories grid | Mask, Hat, Glasses, Watch, Chain, Earring, Necklace, Gloves, Shoes, Accessory |

- Drag & drop into these slots is **validated server-side** (swap, move, give,
  shop purchase — all paths). Wrong item type = rejected.
- Only single items, no stacks.
- Items auto-added by scripts (`AddItem`, give, etc.) never land in equipment slots.
- An item's *equip type* resolves in this order:
  1. `metadata.equipType`
  2. `equipment.itemTypes` map in `data/custom.lua`
  3. name patterns (`*mask*` → mask, `*vest*`/`*armour*` → vest, ...)
  4. `WEAPON_*` → weapon

## 2. Clothing Integration

Equipping an item into an equipment slot syncs it to your ped; unequipping
restores what you wore before. Works with illenium-appearance / qb-clothing /
native — we capture and restore the current ped state, so any appearance
resource is compatible.

Clothing visuals resolve from (first match wins):

1. `metadata.clothing = { component = 1, drawable = 14, texture = 0 }`
   (or `{ prop = 0, drawable = 2, texture = 1 }` for hats/glasses/etc.)
2. `clothing.items['item_name']` in `data/custom.lua`
3. The equip type's default component/prop + `metadata.drawable` / `metadata.texture`

Outfit items can carry multiple pieces: `metadata.outfit = { {component=11,...}, {component=4,...} }`.

Clothing re-applies automatically after ped model changes (clothing shops, skin menus).

## 3. Physics-Based Drops

Replaces marker drops with real props:

- Dropped items spawn as 3D props that bounce and settle with physics.
- Prop model per item via `drops.models` (falls back to `drops.defaultModel`).
- Walk up to a drop → **[E] Pick up** prompt opens it.
- `drops.physics = false` for simple ground placement.

## 4. Search & Frisk

- Hold the frisk key (default **E**, rebindable in GTA keybind settings) near a
  player to search them with a body-search animation + progress circle.
- Allowed when the target is *compliant* (hands up, cuffed or downed) or when
  you have a police group (`inventory:police` convar). Server access rules
  still apply — this uses the same secure `otherplayer` view.
- You see everything they carry **including their equipment/clothing slots**.

## 5. Hold, Throw & Place Items

Right-click an item that's configured in `holding.items` (or set
`holding.allowAll = true`) and press **Hold**:

- The item appears as a prop in your hand (one-hand or box carry per item).
- **[G] Throw** — tosses it with physics; where it lands becomes a real drop
  other players can pick up (server validates distance and ownership).
- **[R] Place** — ghost preview placement: aim, rotate with ←/→, confirm with
  ENTER. The item is placed exactly there as a drop.
- **[X] Stow** — put it away.

The hold cancels automatically if the item leaves the slot, you die, get
cuffed or enter a vehicle.

---

## Rebuilding the UI

```
cd ox_inventory/web
npm run build
restart ox_inventory
```

## Notes

- Equipment slot items persist in the database like any other slot.
- Changing `inventory:slots` shifts the equipment range — players with
  equipped items should unequip before you change it.
- Disable any feature via its `enabled = false` in `data/custom.lua`.
