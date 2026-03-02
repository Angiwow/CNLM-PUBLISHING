(function () {
    'use strict';

    var STORAGE_KEY = 'cnlm_mini_player';

    function injectMiniPlayer() {
        if (document.getElementById('mini-player')) return;
        var div = document.createElement('div');
        div.id = 'mini-player';
        div.className = 'mini-player';
        div.innerHTML =
            '<div class="mini-player-art"></div>' +
            '<div class="mini-player-info">' +
                '<span class="mini-player-name">\u2014</span>' +
                '<span class="mini-player-artist">\u2014</span>' +
            '</div>' +
            '<div class="mini-player-controls">' +
                '<button id="mini-player-btn" class="mini-player-play">' +
                    '<i class="fa-solid fa-play"></i>' +
                '</button>' +
            '</div>' +
            '<div class="mini-player-progress"></div>';
        document.body.appendChild(div);
    }

    function saveState(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    function loadState() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function clearState() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }

    var isArtistesPage = !!document.querySelector('.artists-grid-section');
    if (isArtistesPage) return;

    injectMiniPlayer();

    var miniPlayer = document.getElementById('mini-player');
    var miniArt = miniPlayer.querySelector('.mini-player-art');
    var miniName = miniPlayer.querySelector('.mini-player-name');
    var miniArtist = miniPlayer.querySelector('.mini-player-artist');
    var miniBtn = document.getElementById('mini-player-btn');
    var miniProgress = miniPlayer.querySelector('.mini-player-progress');

    var resumeAudio = null;

    function showMini(name, artist, cover) {
        miniName.textContent = name || '\u2014';
        miniArtist.textContent = artist || '\u2014';
        if (cover) miniArt.style.backgroundImage = "url('" + cover + "')";
        miniPlayer.classList.add('visible');
    }

    function hideMini() {
        miniPlayer.classList.remove('visible');
    }

    function setMiniIcon(playing) {
        var icon = miniBtn.querySelector('i');
        if (!icon) return;
        if (playing) {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
        } else {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
        }
    }

    function updateMiniProgress(current, duration) {
        if (!miniProgress || !duration) return;
        miniProgress.style.width = ((current / duration) * 100) + '%';
    }

    var isIndexPage = !!document.querySelector('.players-carousel');

    if (!isIndexPage) {
        var state = loadState();
        if (state && state.song) {
            resumeAudio = new Audio(state.song);
            resumeAudio.currentTime = state.time || 0;
            resumePlaying = false;

            showMini(state.name, state.artist, state.cover);
            setMiniIcon(false);

            resumeAudio.addEventListener('timeupdate', function () {
                if (resumeAudio.duration) {
                    updateMiniProgress(resumeAudio.currentTime, resumeAudio.duration);
                    saveState({
                        song: state.song,
                        name: state.name,
                        artist: state.artist,
                        cover: state.cover,
                        time: resumeAudio.currentTime
                    });
                }
            });

            resumeAudio.addEventListener('ended', function () {
                hideMini();
                setMiniIcon(false);
                clearState();
            });

            miniBtn.addEventListener('click', function () {
                if (!resumeAudio) return;
                if (resumeAudio.paused) {
                    resumeAudio.play().catch(function () {});
                    setMiniIcon(true);
                } else {
                    resumeAudio.pause();
                    setMiniIcon(false);
                }
            });
        }
    }

    if (isIndexPage) {
        var origMini = document.querySelectorAll('#mini-player');
        if (origMini.length > 1) {
            origMini[origMini.length - 1].remove();
        }
    }

    window.cnlmMiniPlayer = {
        show: showMini,
        hide: hideMini,
        setIcon: setMiniIcon,
        updateProgress: updateMiniProgress,
        saveState: saveState,
        clearState: clearState,
        getBtn: function () { return miniBtn; },
        getPlayer: function () { return miniPlayer; }
    };

})();
