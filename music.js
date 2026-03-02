(function () {
    'use strict';

    var TOTAL_PLAYERS = window.TOTAL_PLAYERS_COUNT || 9;
    var currentlyPlaying = null;
    var initializedPlayers = {};
    var playerStates = {};
    var STORAGE_KEY = 'cnlm_mini_player';

    var miniPlayer = document.getElementById('mini-player');
    var miniArt = miniPlayer ? miniPlayer.querySelector('.mini-player-art') : null;
    var miniName = miniPlayer ? miniPlayer.querySelector('.mini-player-name') : null;
    var miniArtist = miniPlayer ? miniPlayer.querySelector('.mini-player-artist') : null;
    var miniBtn = document.getElementById('mini-player-btn');
    var miniProgress = miniPlayer ? miniPlayer.querySelector('.mini-player-progress') : null;

    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function getCurrentTrackInfo(id) {
        var container = document.getElementById('player-' + id);
        if (!container) return null;
        var art = container.querySelector('.album-art');
        var nameEl = container.querySelector('.name');
        var artistEl = container.querySelector('.artist');
        var audio = document.getElementById('main-audio-' + id);
        return {
            song: audio ? audio.getAttribute('src') : '',
            name: nameEl ? nameEl.textContent : '',
            artist: artistEl ? artistEl.textContent : '',
            cover: art ? art.style.backgroundImage.replace(/url\(['"]?/, '').replace(/['"]?\)/, '') : '',
            time: audio ? audio.currentTime : 0
        };
    }

    function persistState() {
        if (!currentlyPlaying) return;
        var info = getCurrentTrackInfo(currentlyPlaying);
        if (info) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
            } catch (e) {}
        }
    }

    function initAllPlayers() {
        TOTAL_PLAYERS = window.TOTAL_PLAYERS_COUNT || document.querySelectorAll('.player-container').length || 9;
        for (var i = 1; i <= TOTAL_PLAYERS; i++) {
            if (!initializedPlayers[i]) {
                initPlayer(i);
            }
        }
    }

    window.initAllPlayers = initAllPlayers;

    initAllPlayers();

    function initPlayer(id) {
        var audio = document.getElementById('main-audio-' + id);
        var playBtn = document.getElementById('play-' + id);
        var progressArea = document.querySelector('.progress-area-' + id);
        var progressBar = progressArea ? progressArea.querySelector('.progress-bar') : null;
        var currentTimeEl = progressArea ? progressArea.querySelector('.current') : null;
        var totalTimeEl = progressArea ? progressArea.querySelector('.total') : null;

        if (!audio || !playBtn || !progressArea || !progressBar) return;

        initializedPlayers[id] = true;
        playerStates[id] = false;

        playBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!playerStates[id]) {
                stopAllExcept(id);
                playerStates[id] = true;
                setPlayIcon(playBtn, true);
                currentlyPlaying = id;
                updateMiniPlayer(id, true);
                audio.play().catch(function () {
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

        var container = audio.closest('.player-container');
        var albumArt = container ? container.querySelector('.album-art') : null;
        if (albumArt) {
            albumArt.style.cursor = 'pointer';
            var touchStartPos = { x: 0, y: 0 };
            albumArt.addEventListener('touchstart', function (e) {
                touchStartPos.x = e.changedTouches[0].screenX;
                touchStartPos.y = e.changedTouches[0].screenY;
            }, { passive: true });
            albumArt.addEventListener('click', function (e) {
                e.stopPropagation();
                if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) {
                    return;
                }
                playBtn.click();
            });
            albumArt.addEventListener('touchend', function (e) {
                var dx = Math.abs(e.changedTouches[0].screenX - touchStartPos.x);
                var dy = Math.abs(e.changedTouches[0].screenY - touchStartPos.y);
                if (dx < 10 && dy < 10) {
                    e.preventDefault();
                    playBtn.click();
                }
            });
        }

        audio.addEventListener('timeupdate', function () {
            if (audio.duration) {
                var percent = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = percent + '%';
            }
            if (currentTimeEl) {
                currentTimeEl.textContent = formatTime(audio.currentTime);
            }
            if (currentlyPlaying === id) {
                persistState();
            }
        });

        audio.addEventListener('loadedmetadata', function () {
            if (totalTimeEl) {
                totalTimeEl.textContent = formatTime(audio.duration);
            }
        });

        audio.addEventListener('canplaythrough', function () {
            if (totalTimeEl && audio.duration) {
                totalTimeEl.textContent = formatTime(audio.duration);
            }
        });

        var isDraggingBar = false;

        function getPercentFromEvent(e) {
            var rect = progressArea.getBoundingClientRect();
            var clientX = e.clientX;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
            } else if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
            }
            var x = clientX - rect.left;
            var w = rect.width;
            if (w <= 0) w = 1;
            var pct = x / w;
            return Math.max(0, Math.min(1, pct));
        }

        function seekTo(percent) {
            if (audio.duration && isFinite(audio.duration)) {
                audio.currentTime = percent * audio.duration;
                progressBar.style.width = (percent * 100) + '%';
                if (currentTimeEl) {
                    currentTimeEl.textContent = formatTime(audio.currentTime);
                }
            }
        }

        function ensurePlaying() {
            if (audio.paused && audio.duration) {
                stopAllExcept(id);
                playerStates[id] = true;
                setPlayIcon(playBtn, true);
                currentlyPlaying = id;
                audio.play().catch(function () {
                    playerStates[id] = false;
                    setPlayIcon(playBtn, false);
                    currentlyPlaying = null;
                });
            }
        }

        var wrapperEl = progressArea.closest('.wrapper');

        function handleSeekStart(e) {
            var rect = progressArea.getBoundingClientRect();
            var clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            if (clientX >= rect.left - 5 && clientX <= rect.right + 5) {
                e.preventDefault();
                e.stopPropagation();
                isDraggingBar = true;
                seekTo(getPercentFromEvent(e));
                ensurePlaying();
            }
        }

        progressArea.addEventListener('mousedown', function (e) {
            e.preventDefault();
            e.stopPropagation();
            isDraggingBar = true;
            seekTo(getPercentFromEvent(e));
            ensurePlaying();
        });

        if (wrapperEl) {
            wrapperEl.addEventListener('mousedown', handleSeekStart);
        }

        document.addEventListener('mousemove', function (e) {
            if (isDraggingBar) {
                e.preventDefault();
                seekTo(getPercentFromEvent(e));
            }
        });

        document.addEventListener('mouseup', function () {
            isDraggingBar = false;
        });

        progressArea.addEventListener('touchstart', function (e) {
            e.stopPropagation();
            isDraggingBar = true;
            seekTo(getPercentFromEvent(e));
            ensurePlaying();
        }, { passive: true });

        progressArea.addEventListener('touchmove', function (e) {
            if (isDraggingBar) {
                seekTo(getPercentFromEvent(e));
            }
        }, { passive: true });

        progressArea.addEventListener('touchend', function () {
            isDraggingBar = false;
        }, { passive: true });

        audio.addEventListener('ended', function () {
            playerStates[id] = false;
            setPlayIcon(playBtn, false);
            progressBar.style.width = '0%';
            if (currentTimeEl) currentTimeEl.textContent = '0:00';
            currentlyPlaying = null;
            if (miniProgress) miniProgress.style.width = '0%';

            var nextId = id + 1;
            var nextAudio = document.getElementById('main-audio-' + nextId);
            var nextPlayBtn = document.getElementById('play-' + nextId);

            if (nextId <= TOTAL_PLAYERS && nextAudio && nextPlayBtn) {
                var nextPlayer = nextAudio.closest('.player-container');
                if (nextPlayer) {
                    nextPlayer.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
                setTimeout(function () {
                    nextPlayBtn.click();
                }, 300);
            } else {
                try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
            }
        });
    }

    function stopAllExcept(exceptId) {
        for (var i = 1; i <= TOTAL_PLAYERS; i++) {
            if (i === exceptId) continue;
            var a = document.getElementById('main-audio-' + i);
            var b = document.getElementById('play-' + i);
            if (a) {
                a.pause();
            }
            if (b) {
                setPlayIcon(b, false);
            }
            playerStates[i] = false;
        }
    }

    function setPlayIcon(btn, isPlaying) {
        if (!btn) return;
        var icon = btn.querySelector('i');
        if (!icon) return;
        var container = btn.closest('.player-container');

        if (isPlaying) {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            if (container) container.classList.add('is-playing');
        } else {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            if (container) container.classList.remove('is-playing');
        }
    }

    var SKIP_SECONDS = 10;

    document.querySelectorAll('.player-control.rewind').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var playerId = parseInt(this.getAttribute('data-player'));
            var audio = document.getElementById('main-audio-' + playerId);
            if (audio) {
                audio.currentTime = Math.max(0, audio.currentTime - SKIP_SECONDS);
            }
        });
    });

    document.querySelectorAll('.player-control.forward').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var playerId = parseInt(this.getAttribute('data-player'));
            var audio = document.getElementById('main-audio-' + playerId);
            if (audio && audio.duration) {
                audio.currentTime = Math.min(audio.duration, audio.currentTime + SKIP_SECONDS);
            }
        });
    });

    function updateMiniPlayer(id, isPlaying) {
        if (!miniPlayer) return;
        if (isPlaying && id) {
            var progressEl = document.querySelector('.progress-area-' + id);
            var container = document.getElementById('player-' + id) || (progressEl ? progressEl.closest('.player-container') : null);
            if (!container) return;
            var art = container.querySelector('.album-art');
            var name = container.querySelector('.name');
            var artist = container.querySelector('.artist');
            if (art && miniArt) miniArt.style.backgroundImage = art.style.backgroundImage;
            if (name && miniName) miniName.textContent = name.textContent;
            if (artist && miniArtist) miniArtist.textContent = artist.textContent;
            if (miniBtn) miniBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            miniPlayer.classList.add('visible');
        } else {
            if (miniBtn) miniBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            miniPlayer.classList.remove('visible');
        }
    }

    function updateMiniProgress() {
        if (!miniProgress || !currentlyPlaying) return;
        var audio = document.getElementById('main-audio-' + currentlyPlaying);
        if (audio && audio.duration) {
            miniProgress.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
        }
    }

    setInterval(updateMiniProgress, 300);

    if (miniBtn) {
        miniBtn.addEventListener('click', function () {
            if (currentlyPlaying) {
                var playBtn = document.getElementById('play-' + currentlyPlaying);
                if (playBtn) playBtn.click();
            }
        });
    }


    function restoreFromStorage() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            var state = JSON.parse(raw);
            if (!state || !state.song) return;

            for (var i = 1; i <= TOTAL_PLAYERS; i++) {
                var a = document.getElementById('main-audio-' + i);
                if (a && a.getAttribute('src') === state.song) {
                    a.currentTime = state.time || 0;
                    var playBtn = document.getElementById('play-' + i);
                    if (playBtn) {
                        currentlyPlaying = i;
                        updateMiniPlayer(i, false);
                        setPlayIcon(playBtn, false);
                    }
                    return;
                }
            }

            updateMiniPlayer(null, false);
        } catch (e) {}
    }

    restoreFromStorage();

    window.addEventListener('beforeunload', function () {
        persistState();
    });

    document.addEventListener('keydown', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (currentlyPlaying === null) return;
        var audio = document.getElementById('main-audio-' + currentlyPlaying);
        if (!audio) return;

        if (e.code === 'Space') {
            e.preventDefault();
            var playBtn = document.getElementById('play-' + currentlyPlaying);
            if (playBtn) playBtn.click();
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            audio.currentTime = Math.max(0, audio.currentTime - SKIP_SECONDS);
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            if (audio.duration) {
                audio.currentTime = Math.min(audio.duration, audio.currentTime + SKIP_SECONDS);
            }
        }
    });

})();
