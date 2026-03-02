(function () {
    'use strict';

    const TOTAL_PLAYERS = document.querySelectorAll('.player-container').length;
    let currentlyPlaying = null;
    const playerStates = {};
    const initializedPlayers = {};
    const STORAGE_KEY = 'cnlm_mini_player';

    const miniPlayer = document.getElementById('mini-player');
    const miniArt = miniPlayer?.querySelector('.mini-player-art');
    const miniName = miniPlayer?.querySelector('.mini-player-name');
    const miniArtist = miniPlayer?.querySelector('.mini-player-artist');
    const miniBtn = document.getElementById('mini-player-btn');
    const miniProgress = miniPlayer?.querySelector('.mini-player-progress');

    /** Format secondes en mm:ss */
    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    /** Récupérer info d’un track */
    function getTrackInfo(id) {
        const container = document.getElementById('player-' + id);
        if (!container) return null;
        const audio = document.getElementById('main-audio-' + id);
        return {
            audio,
            name: container.querySelector('.name')?.textContent || '',
            artist: container.querySelector('.artist')?.textContent || '',
            cover: container.querySelector('.album-art')?.style.backgroundImage || ''
        };
    }

    /** Sauvegarder l’état actuel */
    function persistState() {
        if (!currentlyPlaying) return;
        const info = getTrackInfo(currentlyPlaying);
        if (info?.audio) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                song: info.audio.src,
                time: info.audio.currentTime
            }));
        }
    }

    /** Stop tous les lecteurs sauf un */
    function stopAllExcept(id) {
        for (let i = 1; i <= TOTAL_PLAYERS; i++) {
            if (i === id) continue;
            const audio = document.getElementById('main-audio-' + i);
            const btn = document.getElementById('play-' + i);
            audio?.pause();
            if (btn) setPlayIcon(btn, false);
            playerStates[i] = false;
        }
    }

    /** Changer l’icône play/pause */
    function setPlayIcon(btn, isPlaying) {
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (!icon) return;
        icon.classList.toggle('fa-play', !isPlaying);
        icon.classList.toggle('fa-pause', isPlaying);
        const container = btn.closest('.player-container');
        container?.classList.toggle('is-playing', isPlaying);
    }

    /** Mettre à jour mini-player */
    function updateMiniPlayer(id, isPlaying) {
        if (!miniPlayer) return;
        if (isPlaying && id) {
            const info = getTrackInfo(id);
            if (!info) return;
            miniArt && (miniArt.style.backgroundImage = info.cover);
            miniName && (miniName.textContent = info.name);
            miniArtist && (miniArtist.textContent = info.artist);
            miniBtn && (miniBtn.innerHTML = '<i class="fa-solid fa-pause"></i>');
            miniPlayer.classList.add('visible');
        } else {
            miniBtn && (miniBtn.innerHTML = '<i class="fa-solid fa-play"></i>');
            miniPlayer.classList.remove('visible');
        }
    }

    /** Initialiser un lecteur */
    function initPlayer(id) {
        if (initializedPlayers[id]) return;

        const audio = document.getElementById('main-audio-' + id);
        const playBtn = document.getElementById('play-' + id);
        const progressArea = document.querySelector('.progress-area-' + id);
        const progressBar = progressArea?.querySelector('.progress-bar');
        const currentTimeEl = progressArea?.querySelector('.current');
        const totalTimeEl = progressArea?.querySelector('.total');

        if (!audio || !playBtn || !progressArea || !progressBar) return;

        initializedPlayers[id] = true;
        playerStates[id] = false;

        /** Play/Pause bouton */
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!playerStates[id]) {
                stopAllExcept(id);
                playerStates[id] = true;
                setPlayIcon(playBtn, true);
                currentlyPlaying = id;
                updateMiniPlayer(id, true);
                audio.play().catch(() => {
                    // Si mobile bloque le play, on affiche quand même l’UI
                    playerStates[id] = false;
                    setPlayIcon(playBtn, false);
                    currentlyPlaying = null;
                    updateMiniPlayer(id, false);
                });
            } else {
                audio.pause();
                playerStates[id] = false;
                setPlayIcon(playBtn, false);
                currentlyPlaying = null;
                updateMiniPlayer(id, false);
            }
        });

        /** Progress bar */
        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                progressBar.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
            }
            currentTimeEl && (currentTimeEl.textContent = formatTime(audio.currentTime));
            persistState();
        });

        audio.addEventListener('loadedmetadata', () => {
            totalTimeEl && (totalTimeEl.textContent = formatTime(audio.duration));
        });

        audio.addEventListener('ended', () => {
            playerStates[id] = false;
            setPlayIcon(playBtn, false);
            progressBar.style.width = '0%';
            currentTimeEl && (currentTimeEl.textContent = '0:00');
            currentlyPlaying = null;
            updateMiniPlayer(null, false);

            // Auto next track
            const nextId = id + 1;
            if (nextId <= TOTAL_PLAYERS) {
                const nextPlayBtn = document.getElementById('play-' + nextId);
                nextPlayBtn?.click();
            }
        });

        /** Interaction progress bar (drag + touch) */
        let isDragging = false;

        function getPercentFromEvent(e) {
            const rect = progressArea.getBoundingClientRect();
            let x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
            return Math.min(1, Math.max(0, (x - rect.left) / rect.width));
        }

        function seekTo(percent) {
            if (audio.duration && isFinite(audio.duration)) {
                audio.currentTime = percent * audio.duration;
            }
        }

        ['mousedown', 'touchstart'].forEach(evt => {
            progressArea.addEventListener(evt, (e) => {
                e.preventDefault();
                isDragging = true;
                seekTo(getPercentFromEvent(e));
                if (audio.paused) playBtn.click();
            }, { passive: false });
        });

        ['mousemove', 'touchmove'].forEach(evt => {
            document.addEventListener(evt, (e) => {
                if (isDragging) {
                    seekTo(getPercentFromEvent(e));
                }
            }, { passive: false });
        });

        ['mouseup', 'touchend'].forEach(evt => {
            document.addEventListener(evt, () => { isDragging = false; }, { passive: true });
        });

        /** Album art tap = toggle play */
        const albumArt = audio.closest('.player-container')?.querySelector('.album-art');
        albumArt?.addEventListener('click', () => playBtn.click());
    }

    /** Initialiser tous les lecteurs */
    for (let i = 1; i <= TOTAL_PLAYERS; i++) initPlayer(i);

    /** Mini-player bouton */
    miniBtn?.addEventListener('click', () => {
        if (currentlyPlaying) {
            const playBtn = document.getElementById('play-' + currentlyPlaying);
            playBtn?.click();
        }
    });

    /** Mini-player progress update */
    setInterval(() => {
        if (!miniProgress || !currentlyPlaying) return;
        const audio = document.getElementById('main-audio-' + currentlyPlaying);
        if (audio && audio.duration) {
            miniProgress.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
        }
    }, 300);

    /** Restaurer état depuis localStorage */
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const state = JSON.parse(raw);
            if (state?.song) {
                for (let i = 1; i <= TOTAL_PLAYERS; i++) {
                    const audio = document.getElementById('main-audio-' + i);
                    if (audio?.src === state.song) {
                        audio.currentTime = state.time || 0;
                        currentlyPlaying = i;
                        updateMiniPlayer(i, false);
                        setPlayIcon(document.getElementById('play-' + i), false);
                        break;
                    }
                }
            }
        }
    } catch (e) { }

    /** Sauvegarder avant fermeture */
    window.addEventListener('beforeunload', persistState);

    /** Débloquer l’audio sur mobile dès le premier tap */
    document.addEventListener('touchstart', function unlockAudio() {
        for (let i = 1; i <= TOTAL_PLAYERS; i++) {
            const audio = document.getElementById('main-audio-' + i);
            audio?.play().then(() => audio.pause()).catch(()=>{});
        }
        document.removeEventListener('touchstart', unlockAudio);
    }, { passive: true });

})();