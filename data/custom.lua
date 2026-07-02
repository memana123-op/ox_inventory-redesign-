-- Configuration for the extended inventory systems (equipment slots, clothing
-- sync, physics drops, frisking, hold/throw/place).
-- Loaded on both server and client via data('custom') in init.lua.

return {
    ---------------------------------------------------------------------------
    -- Custom equipment slots
    ---------------------------------------------------------------------------
    -- Reserved slots appended after the regular inventory slots. Order here
    -- determines the slot number (playerslots + index) and matches the UI.
    equipment = {
        enabled = true,

        -- Slots only accept items whose equip type matches `type` (or any
        -- entry in `accepts`). Equip type is resolved per item, see below.
        slots = {
            { id = 'weapon1',   type = 'weapon',    label = 'Primary' },
            { id = 'weapon2',   type = 'weapon',    label = 'Secondary' },
            { id = 'vest',      type = 'vest',      label = 'Vest' },
            { id = 'bag',       type = 'bag',       label = 'Bag' },
            { id = 'outfit',    type = 'outfit',    label = 'Outfit' },
            { id = 'mask',      type = 'mask',      label = 'Mask' },
            { id = 'hat',       type = 'hat',       label = 'Hat' },
            { id = 'glasses',   type = 'glasses',   label = 'Glasses' },
            { id = 'watch',     type = 'watch',     label = 'Watch' },
            { id = 'chain',     type = 'chain',     label = 'Chain' },
            { id = 'earring',   type = 'earring',   label = 'Earring' },
            { id = 'necklace',  type = 'necklace',  label = 'Necklace' },
            { id = 'gloves',    type = 'gloves',    label = 'Gloves' },
            { id = 'shoes',     type = 'shoes',     label = 'Shoes' },
            { id = 'accessory', type = 'accessory', label = 'Accessory' },
        },

        -- Explicit item name -> equip type. Takes priority over patterns.
        itemTypes = {
            -- ['heavy_vest'] = 'vest',
            -- ['duffel_bag'] = 'bag',
        },

        -- Fallback: lua patterns matched against the item name.
        patterns = {
            { 'mask',          'mask' },
            { 'helmet',        'hat' },
            { 'hat',           'hat' },
            { 'cap',           'hat' },
            { 'beanie',        'hat' },
            { 'glasses',       'glasses' },
            { 'sunglass',      'glasses' },
            { 'watch',         'watch' },
            { 'chain',         'chain' },
            { 'earring',       'earring' },
            { 'necklace',      'necklace' },
            { 'glove',         'gloves' },
            { 'shoe',          'shoes' },
            { 'sneaker',       'shoes' },
            { 'boot',          'shoes' },
            { 'armou?r',       'vest' },
            { 'vest',          'vest' },
            { 'backpack',      'bag' },
            { 'duffel',        'bag' },
            { 'bag$',          'bag' },
            { 'outfit',        'outfit' },
            { 'clothing',      'outfit' },
            { 'parachute',     'bag' },
        },
    },

    ---------------------------------------------------------------------------
    -- Clothing integration (ped appearance sync)
    ---------------------------------------------------------------------------
    clothing = {
        enabled = true,

        -- How clothing visuals are resolved when an item is equipped:
        -- 1. item metadata.clothing = { component = 1, drawable = 5, texture = 0 }
        --    or { prop = 0, drawable = 2, texture = 1 }
        -- 2. items table below (per item name)
        -- 3. default component/prop for the equip type with metadata.drawable/texture
        items = {
            -- ['ski_mask'] = { component = 1, drawable = 14, texture = 0 },
            -- ['black_cap'] = { prop = 0, drawable = 2, texture = 0 },
            test_mask = { component = 1, drawable = 14, texture = 0 },
            test_cap = { prop = 0, drawable = 2, texture = 0 },
            test_glasses = { prop = 1, drawable = 5, texture = 0 },
        },

        -- Default GTA component/prop index per equip type, used when an item
        -- only carries drawable/texture in its metadata.
        typeDefaults = {
            mask      = { component = 1 },
            gloves    = { component = 3 },
            shoes     = { component = 6 },
            chain     = { component = 7 },
            necklace  = { component = 7 },
            accessory = { component = 7 },
            vest      = { component = 9 },
            bag       = { component = 5 },
            hat       = { prop = 0 },
            glasses   = { prop = 1 },
            earring   = { prop = 2 },
            watch     = { prop = 6 },
        },

        -- When unequipping, components are restored to what was worn before
        -- equipping. If that's unknown (e.g. after a reconnect) these are used.
        stripDefaults = {
            [1] = { drawable = 0, texture = 0 },  -- mask off
            [5] = { drawable = 0, texture = 0 },  -- bag off
            [9] = { drawable = 0, texture = 0 },  -- vest off
        },
    },

    ---------------------------------------------------------------------------
    -- Physics-based drops
    ---------------------------------------------------------------------------
    drops = {
        enabled = true,
        physics = true,           -- items bounce/settle instead of floating markers
        settleTime = 4000,        -- ms before the prop is frozen in place
        pickupDistance = 2.0,     -- distance for the [E] pickup prompt
        pickupKey = 38,           -- control id (38 = E)
        vicinityDistance = 8.0,   -- range of the Vicinity panel in the inventory UI
        defaultModel = 'prop_paper_bag_small',

        -- item name -> prop model used when this item starts a new drop
        models = {
            water = 'prop_ld_flow_bottle',
            burger = 'prop_cs_burger_01',
            bandage = 'prop_ld_health_pack',
            money = 'prop_anim_cash_pile_02',
            garbage = 'prop_rub_binbag_05',
            lockpick = 'prop_tool_screwdvr02',
            phone = 'prop_npc_phone_02',
            radio = 'prop_cs_hand_radio',
        },
    },

    ---------------------------------------------------------------------------
    -- Weapon components (attachments)
    ---------------------------------------------------------------------------
    -- Component items (data/weapons.lua -> Components) carry a `type` field.
    -- Dragging one onto a weapon attaches it; the weapon tooltip shows every
    -- attachment slot below with its current state.
    components = {
        enabled = true,

        slotTypes = {
            { type = 'flashlight', label = 'Flashlight' },
            { type = 'muzzle',     label = 'Muzzle' },
            { type = 'grip',       label = 'Grip' },
            { type = 'barrel',     label = 'Barrel' },
            { type = 'magazine',   label = 'Magazine' },
            { type = 'sight',      label = 'Sight' },
            { type = 'skin',       label = 'Skin' },
        },

        -- Weapons that never show attachment slots (melee, throwables...)
        excludeWeapons = {
            'WEAPON_KNIFE', 'WEAPON_BAT', 'WEAPON_HAMMER', 'WEAPON_CROWBAR',
            'WEAPON_GOLFCLUB', 'WEAPON_NIGHTSTICK', 'WEAPON_WRENCH',
            'WEAPON_MACHETE', 'WEAPON_SWITCHBLADE', 'WEAPON_DAGGER',
            'WEAPON_HATCHET', 'WEAPON_KNUCKLE', 'WEAPON_BOTTLE',
            'WEAPON_STUNGUN', 'WEAPON_FLASHLIGHT', 'WEAPON_PETROLCAN',
            'WEAPON_FIREEXTINGUISHER',
        },
    },

    ---------------------------------------------------------------------------
    -- Cinematic ped preview (camera, DOF, player info header)
    ---------------------------------------------------------------------------
    -- A scripted camera frames the real player ped so it shows through the
    -- transparent Player column of the UI. The world is dimmed/blurred behind
    -- it. A/D rotates the ped, W/S zooms (forwarded from the UI).
    cinematic = {
        enabled = true,

        camera = {
            fov = 46.0,           -- vertical field of view
            distance = 3.2,       -- metres in front of the ped
            height = 0.25,        -- camera z offset from ped origin
            targetHeight = 0.05,  -- aim point z offset from ped origin
            lateral = 0.55,       -- shifts the ped left in frame, into the Player column
            rotateSpeed = 140.0,  -- degrees per second while A/D held
            zoom = { min = 2.2, max = 4.2, speed = 2.0 },
            ease = 750,           -- ms camera blend in/out
        },

        -- Shallow depth of field: ped stays sharp, world behind blurs.
        dof = {
            enabled = true,
            strength = 0.85,
            focusDepth = 1.6,     -- metres behind the ped that stay in focus
        },

        -- Post-processing on the game world while the inventory is open.
        -- Avoid full-screen blur modifiers (hud_def_blur) - they blur the
        -- preview ped too; background blur comes from the camera DOF.
        timecycle = {
            name = 'hud_def_desat_Neutral',
            strength = 0.4,
        },
    },

    ---------------------------------------------------------------------------
    -- Item rarity
    ---------------------------------------------------------------------------
    -- Tiers: common (default, no badge), uncommon, rare, epic, legendary.
    -- Resolution order: `rarity` field on the item definition (data/items.lua)
    -- > items map below > name patterns > weaponDefault. A per-instance
    -- metadata.rarity always wins in the UI.
    rarity = {
        enabled = true,

        -- explicit item name -> tier
        items = {
            -- ['radio'] = 'rare',
            -- ['diamond_ring'] = 'legendary',
        },

        -- lua patterns matched against the lowercase item name
        patterns = {
            { 'weapon_.*sniper',   'legendary' },
            { 'weapon_minigun',    'legendary' },
            { 'weapon_rpg',        'legendary' },
            { 'weapon_.+rifle',    'epic' },
            { 'weapon_.+smg',      'rare' },
            { 'weapon_pistol',     'rare' },
            { 'armou?r',           'rare' },
            { 'vest',              'rare' },
            { 'gold',              'epic' },
            { 'diamond',           'legendary' },
            { 'scrapmetal',        'uncommon' },
        },

        -- fallback tier for any weapon not matched above
        weaponDefault = 'rare',
    },

    ---------------------------------------------------------------------------
    -- Search & frisk
    ---------------------------------------------------------------------------
    frisk = {
        enabled = true,
        key = 'E',                -- hold near a player to frisk
        duration = 2500,          -- progress duration in ms
        maxDistance = 1.8,
        -- When true anyone can frisk a compliant target (hands up, cuffed or
        -- downed). Police (shared.police groups) can always frisk.
        requireCompliance = true,
    },

    ---------------------------------------------------------------------------
    -- Hold / throw / place items
    ---------------------------------------------------------------------------
    holding = {
        enabled = true,
        allowAll = false,         -- when true, any non-weapon item can be held
        maxThrowDistance = 40.0,  -- server-side sanity check
        throwForce = 14.0,
        placeDistance = 8.0,

        -- item name -> hold settings; model defaults to drops model resolution
        items = {
            water = { model = 'prop_ld_flow_bottle' },
            burger = { model = 'prop_cs_burger_01' },
            garbage = { model = 'prop_rub_binbag_05', carry = 'box' },
            -- ['box_item'] = { model = 'prop_cs_cardbox_01', carry = 'box' },
        },
    },
}
