-- Inventory ped preview: a scripted camera frames the real player ped in the
-- world so it shows through the transparent Player column of the NUI
-- (NextGen style). The world behind is dimmed/blurred with a timecycle
-- modifier and shallow depth-of-field keeps the ped sharp.
--
-- While the inventory is open the UI forwards A/D (rotate) and W/S (zoom)
-- through the 'pedPreviewControl' NUI callback.
--
-- Player info (name / job / cash / bank) is also pushed to the UI header.
-- Configured via data/custom.lua -> cinematic.

local config = shared.custom and shared.custom.cinematic

if not config or not config.enabled then return end

local camCfg = config.camera or {}
local fov = camCfg.fov or 46.0
local baseDistance = camCfg.distance or 3.2
local camHeight = camCfg.height or 0.25
local targetHeight = camCfg.targetHeight or 0.05
local lateral = camCfg.lateral or 0.55
local rotateSpeed = camCfg.rotateSpeed or 140.0
local zoomCfg = camCfg.zoom or {}
local zoomMin = zoomCfg.min or 2.2
local zoomMax = zoomCfg.max or 4.2
local zoomSpeed = zoomCfg.speed or 2.0
local easeMs = camCfg.ease or 750

local dofCfg = config.dof
local tcCfg = config.timecycle

local cam
local active = false
local origHeading
local control = { rotate = 0.0, zoom = 0.0 }
local distance = baseDistance
local mirrored = false -- UI layout flipped: frame the ped on the right instead

local function getPlayerInfo()
    local info = {}

    local ok, playerData = pcall(function()
        return exports.qbx_core:GetPlayerData()
    end)

    if not ok or not playerData then
        ok, playerData = pcall(function()
            return exports['qb-core']:GetCoreObject().Functions.GetPlayerData()
        end)
    end

    if ok and type(playerData) == 'table' then
        local charinfo = playerData.charinfo

        if charinfo and charinfo.firstname then
            info.name = ('%s %s'):format(charinfo.firstname, charinfo.lastname or '')
        end

        local job = playerData.job

        if job and job.label then
            local grade = job.grade and (job.grade.name or job.grade.label)
            info.job = grade and ('%s - %s'):format(job.label, grade) or job.label
        end

        local money = playerData.money

        if money then
            info.cash = tonumber(money.cash)
            info.bank = tonumber(money.bank)
        end
    end

    return info
end

-- Camera position derived from the ped's heading when the preview opened, so
-- rotating the ped (A/D) spins it in place while the camera stays put.
local function updateCamera(ped, heading)
    local pedCoords = GetEntityCoords(ped)
    local rad = math.rad(heading)
    -- forward vector for the captured heading
    local forward = vector3(-math.sin(rad), math.cos(rad), 0.0)
    local right = vector3(forward.y, -forward.x, 0.0)
    -- shift camera and aim point together so the ped sits left of screen
    -- centre, inside the Player column of the UI (right when mirrored)
    local side = right * (mirrored and lateral or -lateral)

    local camPos = pedCoords + forward * distance + side + vector3(0.0, 0.0, camHeight)
    local aim = pedCoords + side + vector3(0.0, 0.0, targetHeight)

    SetCamCoord(cam, camPos.x, camPos.y, camPos.z)
    PointCamAtCoord(cam, aim.x, aim.y, aim.z)

    if dofCfg and dofCfg.enabled ~= false then
        SetCamUseShallowDofMode(cam, true)
        SetCamNearDof(cam, distance * 0.45)
        SetCamFarDof(cam, distance + (dofCfg.focusDepth or 1.6))
        SetCamDofStrength(cam, dofCfg.strength or 0.85)
    end
end

local function startPreview()
    local ped = cache.ped
    if not ped or ped == 0 then return end

    origHeading = GetEntityHeading(ped)
    distance = baseDistance
    control.rotate = 0.0
    control.zoom = 0.0

    cam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, fov, false, 2)
    updateCamera(ped, origHeading)
    SetCamActive(cam, true)
    RenderScriptCams(true, true, easeMs, true, true)

    if tcCfg and tcCfg.name then
        SetTimecycleModifier(tcCfg.name)
        SetTimecycleModifierStrength(tcCfg.strength or 0.3)
    end

    CreateThread(function()
        while active do
            local frameTime = GetFrameTime()

            if dofCfg and dofCfg.enabled ~= false then
                SetUseHiDof()
            end

            HideHudAndRadarThisFrame()
            InvalidateIdleCam()

            local dirty = false

            if control.rotate ~= 0.0 then
                local pedNow = cache.ped
                SetEntityHeading(pedNow, (GetEntityHeading(pedNow) + control.rotate * rotateSpeed * frameTime) % 360.0)
            end

            if control.zoom ~= 0.0 then
                distance = math.min(zoomMax, math.max(zoomMin, distance + control.zoom * zoomSpeed * frameTime))
                dirty = true
            end

            if dirty then
                updateCamera(cache.ped, origHeading)
            end

            Wait(0)
        end
    end)
end

local function stopPreview()
    if cam then
        RenderScriptCams(false, true, easeMs, true, true)
        DestroyCam(cam, false)
        cam = nil
    end

    if tcCfg and tcCfg.name then
        ClearTimecycleModifier()
    end

    if origHeading then
        local ped = cache.ped
        if ped and ped ~= 0 then SetEntityHeading(ped, origHeading) end
        origHeading = nil
    end
end

local function onOpened()
    if active then return end
    active = true

    SendNUIMessage({
        action = 'setPlayerInfo',
        data = getPlayerInfo()
    })

    startPreview()
end

local function onClosed()
    if not active then return end
    active = false

    stopPreview()
end

-- The UI reports its column layout so the camera frames the ped on the
-- correct side: { mirrored = boolean }
RegisterNUICallback('inventoryLayout', function(data, cb)
    cb(1)
    mirrored = type(data) == 'table' and data.mirrored == true

    if active and cam then
        updateCamera(cache.ped, origHeading)
    end
end)

-- The UI forwards held preview keys: { control = 'rotate'|'zoom', value = -1|0|1 }
RegisterNUICallback('pedPreviewControl', function(data, cb)
    cb(1)
    if type(data) ~= 'table' then return end

    if data.control == 'rotate' then
        control.rotate = tonumber(data.value) or 0.0
    elseif data.control == 'zoom' then
        control.zoom = tonumber(data.value) or 0.0
    end
end)

CreateThread(function()
    while not cache.serverId do Wait(100) end

    AddStateBagChangeHandler('invOpen', ('player:%s'):format(cache.serverId), function(_, _, value)
        if value then onOpened() else onClosed() end
    end)
end)

AddEventHandler('onResourceStop', function(resourceName)
    if resourceName ~= cache.resource then return end
    onClosed()
end)
