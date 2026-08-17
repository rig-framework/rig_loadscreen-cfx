--[[
----------------------------------------
RIG Loadscreen (built for RIG-CFX)

Author: Case (https://caseirl.dev)
Repo: https://github.com/rig-framework/rig_loadscreen-cfx
License: https://github.com/rig-framework/rig_loadscreen-cfx/blob/main/LICENSE
----------------------------------------
]]

--- @file src/client.lua
--- @description Client side load screen callbacks and messages.

--- @section Variables

local has_clicked_deploy = false

--- @section NUI Callbacks

RegisterNUICallback("loadscreen:deploy", function(data, cb)
    if has_clicked_deploy then return end
    has_clicked_deploy = true
    DoScreenFadeOut(500)
    while not IsScreenFadedOut() do Wait(50) end
    ShutdownLoadingScreen()
    ShutdownLoadingScreenNui()
    Wait(350)
    
    -- @todo Uncomment when profiles resource ready
    -- TriggerServerEvent("rig:server:fetch_profiles")

    DoScreenFadeIn(500)
    cb(true)
end)

RegisterNUICallback("loadscreen:disconnect", function(data, cb)
    TriggerServerEvent("rig:server:disconnect")
    cb(true)
end)

--- @section Threads

CreateThread(function()
    while not NetworkIsPlayerActive(PlayerId()) do 
        Wait(250) 
    end
    Wait(1000)
    SendLoadingScreenMessage(json.encode({ action = "load_complete" }))
end)