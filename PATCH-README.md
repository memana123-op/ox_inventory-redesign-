# Inventory UI — Cinematic Redesign Patch

This folder contains the finished files for the dark cinematic redesign of your
`ox_inventory` web UI. Your codebase already has most of the redesign applied —
these two files complete it (reference-style white tooltip card).

## What's in this patch

| File | What changed |
|---|---|
| `web/src/index.scss` | Tooltip restyled as a white card: rounded corners, soft shadow, rarity badge pills (COMMON / UNCOMMON / RARE / EPIC / LEGENDARY), clean label/value metadata rows, weight footer, smooth appear animation. Everything else is identical to your current file. |
| `web/src/components/inventory/SlotTooltip.tsx` | Markup upgraded to the reference card: bold uppercase item name, rarity badge next to it, metadata rows (durability, ammo, ammo type, serial, type, components, tint, custom metadata) rendered as aligned label/value rows, weight shown in the footer. **All metadata logic, locale strings, and crafting-ingredient handling preserved.** |
| `web/src/components/utils/Tooltip.tsx` | **Bug fix:** replaced broken FloatingPortal + floating-ui positioning (causes tooltip to appear at 0,0 in FiveM NUI) with a simple manual mouse tracker using `window.addEventListener('mousemove')`. Tooltip now follows the cursor correctly and clamps to screen edges. No floating-ui dependency removed — the fix just avoids the broken portal path. |

## How to install

1. **Backup** (you already have `.backup-inventory-ui-20260608-194355/`, but to be safe):
   ```
   copy ox_inventory\web\src\index.scss index.scss.bak
   copy ox_inventory\web\src\components\inventory\SlotTooltip.tsx SlotTooltip.tsx.bak
   ```

2. **Copy the patched files** over your source:
   - `patched/web/src/index.scss` → `ox_inventory/web/src/index.scss`
   - `patched/web/src/components/inventory/SlotTooltip.tsx` → `ox_inventory/web/src/components/inventory/SlotTooltip.tsx`

3. **Rebuild the web UI:**
   ```
   cd ox_inventory/web
   pnpm install        (first time only — or npm install / yarn)
   pnpm build          (or npm run build / yarn build)
   ```

4. **Restart the resource** in your server console:
   ```
   restart ox_inventory
   ```

## Item rarity badges

The tooltip reads rarity from item metadata. To give an item a rarity, set it
server-side, e.g. when creating the item:

```lua
metadata = { rarity = 'legendary' }   -- common / uncommon / rare / epic / legendary
```

Items without a rarity show a black **COMMON** pill.

## Georgian font (Nino Mtavruli)

The UI currently falls back to **Noto Sans Georgian** (loaded from Google
Fonts). If you have the BPG Nino Mtavruli Bold `.woff2`/`.ttf` file, drop it in
`ox_inventory/web/public/fonts/` and add an `@font-face` at the top of
`index.scss` pointing to it, then put it first in `--font-ui`.
