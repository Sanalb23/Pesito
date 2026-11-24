/* ============================================================
   REPRODUCTOR DE MUSICA - PESITO (Howler.js)

   Para agregar una cancion: sube el archivo a src/public/Tracks/
   y agrega una entrada en TRACKS con su titulo y ruta.
   ============================================================ */

const TRACKS = [
    { title: 'Spiral Track (Pes 5)', file: 'src/public/Tracks/spiral-track-pes-5.mp3' },
];

const musicBackdrop = document.getElementById('music-backdrop');
const musicButton = document.getElementById('music-button');
const closeMusicButton = document.getElementById('close-music-modal');
const trackListEl = document.getElementById('track-list');

const npTitleEl = document.getElementById('np-title');
const npEqEl = document.getElementById('np-eq');
const progressBarEl = document.getElementById('progress-bar');
const progressFillEl = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const btnPrev = document.getElementById('btn-prev');
const btnPlay = document.getElementById('btn-play');
const btnNext = document.getElementById('btn-next');
const playIcon = btnPlay.querySelector('i');

let currentIndex = -1;
let currentHowl = null;
let progressTimer = null;
const metaHowls = [];
const trackRows = [];

function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function openMusicModal(event) {
    event.preventDefault();
    musicBackdrop.classList.remove('hidden');
}

function closeMusicModal() {
    musicBackdrop.classList.add('hidden');
}

function stopProgressTimer() {
    if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
    }
}

function updateProgressUI() {
    if (!currentHowl) return;
    const duration = currentHowl.duration() || 0;
    const seek = currentHowl.seek() || 0;
    const percent = duration > 0 ? (seek / duration) * 100 : 0;

    progressFillEl.style.width = `${percent}%`;
    progressBarEl.setAttribute('aria-valuenow', Math.round(percent));
    currentTimeEl.textContent = formatTime(seek);
    totalTimeEl.textContent = formatTime(duration);
}

function startProgressTimer() {
    stopProgressTimer();
    updateProgressUI();
    progressTimer = setInterval(updateProgressUI, 500);
}

function setPlayingState(isPlaying) {
    playIcon.className = isPlaying ? 'ph ph-pause' : 'ph ph-play';
    btnPlay.title = isPlaying ? 'Pausar' : 'Reproducir';
    npEqEl.classList.toggle('is-playing', isPlaying);
}

function markActiveRow() {
    trackRows.forEach((row, i) => {
        row.classList.toggle('is-active', i === currentIndex);
        const icon = row.querySelector('.mp-row-icon i');
        if (icon) {
            icon.className = (i === currentIndex && currentHowl && currentHowl.playing())
                ? 'ph ph-pause-circle'
                : 'ph ph-play-circle';
        }
    });
}

function playTrack(index) {
    if (index < 0 || index >= TRACKS.length) return;

    if (currentHowl) {
        currentHowl.stop();
        currentHowl.unload();
        currentHowl = null;
    }
    stopProgressTimer();

    currentIndex = index;
    const track = TRACKS[index];

    npTitleEl.textContent = track.title;

    currentHowl = new Howl({
        src: [track.file],
        html5: true,
        onload: updateProgressUI,
        onplay: () => {
            setPlayingState(true);
            startProgressTimer();
            markActiveRow();
        },
        onpause: () => {
            setPlayingState(false);
            stopProgressTimer();
            updateProgressUI();
            markActiveRow();
        },
        onstop: () => {
            setPlayingState(false);
            stopProgressTimer();
        },
        onend: () => {
            nextTrack();
        },
        onloaderror: () => {
            npTitleEl.textContent = `${track.title} (error al cargar)`;
        }
    });

    currentHowl.play();
    markActiveRow();
}

function stopMusicPlayback() {
    if (currentHowl) {
        currentHowl.stop();
        currentHowl.unload();
        currentHowl = null;
    }
    stopProgressTimer();
    setPlayingState(false);
    currentIndex = -1;
    npTitleEl.textContent = 'Selecciona una canción';
    progressFillEl.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent = '0:00';
    markActiveRow();
}

function togglePlayPause() {
    if (!currentHowl) {
        playTrack(currentIndex >= 0 ? currentIndex : 0);
        return;
    }
    if (currentHowl.playing()) {
        currentHowl.pause();
    } else {
        currentHowl.play();
    }
}

function nextTrack() {
    playTrack((currentIndex + 1) % TRACKS.length);
}

function prevTrack() {
    if (currentHowl && currentHowl.seek() > 3) {
        currentHowl.seek(0);
        return;
    }
    playTrack((currentIndex - 1 + TRACKS.length) % TRACKS.length);
}

function seekToEvent(event) {
    if (!currentHowl) return;
    const rect = progressBarEl.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const duration = currentHowl.duration() || 0;
    currentHowl.seek(duration * ratio);
    updateProgressUI();
}

function renderTrackList() {
    trackListEl.innerHTML = '';
    trackRows.length = 0;

    TRACKS.forEach((track, index) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'mp-track-row';

        const icon = document.createElement('span');
        icon.className = 'mp-row-icon';
        icon.innerHTML = '<i class="ph ph-play-circle"></i>';

        const title = document.createElement('span');
        title.className = 'mp-row-title';
        title.textContent = track.title;

        const duration = document.createElement('span');
        duration.className = 'mp-row-duration';
        duration.textContent = '...';

        row.append(icon, title, duration);
        row.addEventListener('click', () => playTrack(index));

        trackListEl.appendChild(row);
        trackRows.push(row);
    });
}

function loadTrackDurations() {
    TRACKS.forEach((track, index) => {
        const metaHowl = new Howl({
            src: [track.file],
            html5: true,
            preload: 'metadata',
            volume: 0
        });
        metaHowls.push(metaHowl);

        const updateDuration = () => {
            const durationEl = trackRows[index]?.querySelector('.mp-row-duration');
            if (durationEl) durationEl.textContent = formatTime(metaHowl.duration());
        };

        metaHowl.on('load', updateDuration);
        metaHowl.on('loaderror', () => {
            const durationEl = trackRows[index]?.querySelector('.mp-row-duration');
            if (durationEl) durationEl.textContent = '--:--';
        });
    });
}

musicButton.addEventListener('click', openMusicModal);
closeMusicButton.addEventListener('click', closeMusicModal);
musicBackdrop.addEventListener('click', (event) => {
    if (event.target === musicBackdrop) closeMusicModal();
});

btnPlay.addEventListener('click', togglePlayPause);
btnNext.addEventListener('click', nextTrack);
btnPrev.addEventListener('click', prevTrack);

progressBarEl.addEventListener('click', seekToEvent);
progressBarEl.addEventListener('keydown', (event) => {
    if (!currentHowl) return;
    const duration = currentHowl.duration() || 0;
    if (event.key === 'ArrowRight') currentHowl.seek(Math.min((currentHowl.seek() || 0) + 5, duration));
    if (event.key === 'ArrowLeft') currentHowl.seek(Math.max((currentHowl.seek() || 0) - 5, 0));
    updateProgressUI();
});

renderTrackList();
loadTrackDurations();
