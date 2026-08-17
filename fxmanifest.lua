--[[
----------------------------------------
RIG Loadscreen (built for RIG-CFX)

Author: Case (https://caseirl.dev)
Repo: https://github.com/rig-framework/rig_loadscreen-cfx
License: https://github.com/rig-framework/rig_loadscreen-cfx/blob/main/LICENSE
----------------------------------------
]]

fx_version "cerulean"
games { "gta5", "rdr3" }
name "rig_loadscreen"
version "0.1.0"
description "A simple load screen built for RIG - CFX platforms (FiveM/RedM)."
license "Apache 2.0"
author "Case"
lua54 "yes"

loadscreen "ui/index.html"
loadscreen_manual_shutdown "yes"
loadscreen_cursor 'yes'

files {
    "locales/*.json",
    "ui/**/*",
}

shared_script "init.lua"
client_script "src/client.lua"
server_script "src/server.lua"

dependency "rig" 