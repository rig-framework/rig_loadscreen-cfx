/*
----------------------------------------
RIG Framework (built for CFX Platforms)

Author: Case (https://caseirl.dev)
Repo: https://github.com/rig-framework/rig_loadscreen-cfx
License: https://github.com/rig-framework/rig_loadscreen-cfx/blob/main/LICENSE
----------------------------------------
*/

let loading_screen = null;

class LoadScreen {
    constructor() {
        this.resource_name = null;
        this.buttons_shown = false; 
        this.audio_file = '/ui/assets/audio/loadscreen.mp3';

        const root_styles = getComputedStyle(document.documentElement);
        this.color_top = root_styles.getPropertyValue('--block_top').trim() || '#ff781f';
        this.color_mid = root_styles.getPropertyValue('--block_mid').trim() || '#ea580c';
        this.color_bottom = root_styles.getPropertyValue('--block_bottom').trim() || '#c2410c';
        this.shadow_color = root_styles.getPropertyValue('--accent').trim() || '#F97316';

        this.locales = (window.locales && window.locales.loadscreen) || {
            welcome: "WELCOME, ",
            default_player: "PLAYER",
            deploy: "DEPLOY",
            disconnect: "DISCONNECT",
            final_status: "RIG.LI active. Awaiting player deployment...",
            steps: [
                "Establishing secure node handshake...",
                "Allocating memory buffers & asset streams...",
                "Resolving core dependencies & scripts...",
                "Synchronizing telemetry and player state...",
                "Calibrating environmental matrices & lighting...",
                "Injecting client-side resources...",
                "Verifying node integrity & checksums...",
                "Optimizing network pipeline latency..."
            ]
        };

        this.build();

        this.canvas = $('#rig_canvas')[0];
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.animation_progress = 0;
        this.pulse_timer = 0;
        this.blocks = [];
        this.total_cols = 0;

        this.letters = [
            { char: 'R', grid: [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]] },
            { char: 'I', grid: [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[1,1,1]] },
            { char: 'G', grid: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]] },
            { char: '.', grid: [[0],[0],[0],[0],[0],[0],[1]] },
            { char: 'L', grid: [[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,1,1,1]] },
            { char: 'I', grid: [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[1,1,1]] }
        ];

        this.loading_steps = this.locales.steps;

        this.init_data();
        this.init_listeners();
        this.init_blocks(); 
        this.init_button_actions(); 
        this.init_audio();

        $(window).on('resize', () => this.resize_canvas());
        this.resize_canvas();
        requestAnimationFrame(() => this.animate());
    }

    init_data() {
        const handover_data = window.nuiHandoverData || {};
        const player_name = handover_data.name || (config.is_dev_mode ? "Test Player" : this.locales.default_player);
        this.resource_name = handover_data.res_name || "rig_loadscreen-cfx"
        $('#player_name_placeholder').text(player_name);
    }

    init_audio() {
        const $audio = $('#loadscreen_audio');
        if ($audio.length) {
            $audio[0].volume = 0.25;
            $audio[0].play().catch(e => {
                console.log("Audio autoplay prevented or failed:", e);
            });
        }
    }

    init_listeners() {
        $(window).on('message', (event) => {
            let data = event.originalEvent ? event.originalEvent.data : event.data;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) {}
            }

            if (data && data.eventName === 'loadProgress') {
                if (typeof data.loadFraction === 'number') {
                    const target_progress = data.loadFraction * 100;
                    if (target_progress > this.animation_progress) {
                        this.animation_progress = target_progress;
                    }
                }
            }

            if (data && data.eventName === 'onLogLine' && data.message) {
                $('#loading_status').text(data.message + '...');
            }
        });

        if (!config.is_dev_mode) {
            setInterval(() => {
                if (this.animation_progress < 95) {
                    this.animation_progress += 0.3; 
                }
            }, 200);
        }

        if (config.is_dev_mode) {
            let dev_progress = 0;
            const dev_interval = setInterval(() => {
                dev_progress += 0.015;
                if (dev_progress >= 1) {
                    dev_progress = 1;
                    clearInterval(dev_interval);
                }
                this.animation_progress = dev_progress * 100;
            }, 60);
        }
    }

    init_button_actions() {
        $(document).on('click', '#btn_play', () => {
            $('#loadscreen_audio').each(function() {
                this.pause();
            });

            if (!config.is_dev_mode) {
                $.post(`https://${this.resource_name}/loadscreen:deploy`, JSON.stringify({}));
                loading_screen = null;
            }
        });

        $(document).on('click', '#btn_disconnect', () => {
            $('#loadscreen_audio').each(function() {
                this.pause();
            });

            if (!config.is_dev_mode) {
                $.post(`https://${this.resource_name}/loadscreen:disconnect`, JSON.stringify({}));
                loading_screen = null;
            }
        });
    }

    build() {
        const content = `
            <audio id="loadscreen_audio" src="${this.audio_file}" loop preload="auto"></audio>
            <div class="bg_glow_container">
                <div class="ambient_glow_1"></div>
            </div>
            <main>
                <div class="welcome_container">
                    <h1 id="welcome_title">
                        ${this.locales.welcome}<span id="player_name_placeholder"></span>
                    </h1>
                </div>
                <div class="main_content_wrapper">
                    <div class="canvas_wrapper tactical_glow">
                        <canvas id="rig_canvas"></canvas>
                    </div>
                    
                    <div id="progress_wrapper" class="progress_container">
                        <div class="progress_info">
                            <span id="loading_status">...</span>
                            <span id="loading_percent">0%</span>
                        </div>
                        <div class="progress_bar_bg">
                            <div id="progress_bar" class="progress_bar_fill"></div>
                        </div>
                    </div>

                    <div id="action_buttons" class="loadscreen_button_group">
                        <button id="btn_play" class="btn primary">${this.locales.deploy}</button>
                        <button id="btn_disconnect" class="btn secondary">${this.locales.disconnect}</button>
                    </div>
                </div>
            </main>
        `;
        $('body').addClass("scanlines flex_container").append(content);
    }

    init_blocks() {
        this.blocks = [];
        let current_offset = 0;
        const letter_spacing = 2; 

        this.letters.forEach((letter, index) => {
            letter.offset_x = current_offset;
            const letter_width = letter.grid[0].length;
            current_offset += letter_width + (index < this.letters.length - 1 ? letter_spacing : 0);
        });

        this.total_cols = current_offset;

        this.letters.forEach(letter => {
            letter.grid.forEach((row, r_idx) => {
                row.forEach((val, c_idx) => {
                    if (val === 1) {
                        let block_color = this.color_bottom;
                        if (r_idx < 2) block_color = this.color_top;
                        else if (r_idx < 5) block_color = this.color_mid;

                        this.blocks.push({
                            x: letter.offset_x + c_idx,
                            y: r_idx,
                            color: block_color
                        });
                    }
                });
            });
        });
    }

    resize_canvas() {
        const $wrapper = $('.canvas_wrapper');
        if (!$wrapper.length) return;
        const rect = $wrapper[0].getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    transition_to_buttons() {
        this.buttons_shown = true;
        $('#progress_wrapper').addClass('hide');
        $('#action_buttons').addClass('show');
    }

    update_ui_progress(progress) {
        $('#progress_bar').css('width', progress + '%');
        $('#loading_percent').text(Math.floor(progress) + '%');

        const $status = $('#loading_status');
        if ($status.length) {
            let current_step_idx = Math.min(Math.floor((progress / 100) * this.loading_steps.length), this.loading_steps.length - 1);
            if (progress < 100) {
                $status.text(this.loading_steps[current_step_idx]);
            } else {
                $status.text(this.locales.final_status);
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const $wrapper = $('.canvas_wrapper');
        if (!$wrapper.length) {
            requestAnimationFrame(() => this.animate());
            return;
        }
        const width = $wrapper.width();
        const height = $wrapper.height();
        if (!width || !height) {
            requestAnimationFrame(() => this.animate());
            return;
        }

        const total_cols = this.total_cols || 28; 
        const total_rows = 7;
        const block_size = Math.min(width / (total_cols + 8), height / 11, 20); 
        const total_width = total_cols * block_size;
        const total_height = total_rows * block_size;

        const start_x = (width - total_width) / 2; 
        const start_y = (height - total_height) / 2;

        if (this.animation_progress >= 100) {
            this.animation_progress = 100;
            if (!this.buttons_shown) {
                this.transition_to_buttons();
            }
        }

        this.update_ui_progress(this.animation_progress);

        this.pulse_timer += 0.04;

        this.blocks.forEach((block) => {
            const bx = start_x + (block.x * block_size);
            const by = start_y + (block.y * block_size);

            this.ctx.save();
            this.ctx.translate(bx + block_size / 2, by + block_size / 2);

            let pulse = Math.sin(this.pulse_timer + (block.x * 0.18)) * 0.18 + 0.82;
            this.ctx.globalAlpha = pulse;
            this.ctx.shadowColor = this.shadow_color;
            this.ctx.shadowBlur = 10 * pulse;

            this.ctx.fillStyle = block.color;
            this.ctx.fillRect(-block_size / 2 + 1, -block_size / 2 + 1, block_size - 2, block_size - 2);

            this.ctx.restore();
        });

        requestAnimationFrame(() => this.animate());
    }
}

$(document).ready(async function () {
    const lang = (typeof config !== 'undefined' && config.locale) ? config.locale : 'en';

    try {
        const response = await fetch(`./locales/${lang}.json`);
        window.locales = await response.json();
    } catch (e) {
        console.warn(`Failed to load locales/${lang}.json, using fallbacks.`, e);
        window.locales = {};
    }

    loading_screen = new LoadScreen();
});