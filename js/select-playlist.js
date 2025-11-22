const playlistUrlInput = document.getElementById('playlist-url');
const loadPlaylistBtn = document.getElementById('load-playlist-btn');
const usePlaylistBtn = document.getElementById('use-playlist-btn');
const playlistInfo = document.getElementById('playlist-info');
const playlistImage = document.getElementById('playlist-image');
const playlistName = document.getElementById('playlist-name');
const playlistOwner = document.getElementById('playlist-owner');
const trackCount = document.getElementById('track-count');
const tracksContainer = document.getElementById('tracks-container');
const loadingElement = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');

import { isAuthenticated, initiateSpotifyLogin, getPlaylistInfo, getPlaylistTracks } from './spotify.js';

// Track list data
let currentPlaylist = JSON.parse(localStorage.getItem('gamePlaylist')) ?? {
    name: '',
    owner: '',
    image: '',
    tracks: []
};

async function initialize() {
    loadPlaylistBtn.addEventListener('click', handleLoadPlaylist);
    usePlaylistBtn.addEventListener('click', handleUsePlaylist);

    if (!isAuthenticated()) {
        try {
            await initiateSpotifyLogin();
        } catch (error) {
            showError('Failed to authenticate with Spotify. Please try again.');
            console.error('Authentication error:', error);
        }
    }

	if (currentPlaylist.tracks.length > 0) {
		displayPlaylistInfo();
		usePlaylistBtn.disabled = false;
	}
}

async function handleLoadPlaylist() {
    const url = playlistUrlInput.value.trim();

    if (!url) {
        showError('Please enter a valid Spotify playlist URL');
        return;
    }

    const playlistId = extractPlaylistId(url);

    if (!playlistId) {
        showError('Invalid Spotify playlist URL format');
        return;
    }

    showLoading(true);

    try {
        await fetchPlaylistData(playlistId);
        showLoading(false);
        displayPlaylistInfo();
        usePlaylistBtn.disabled = false;
    } catch (error) {
        showError('Failed to load playlist: ' + error.message);
        showLoading(false);
    }
}

function extractPlaylistId(url) {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

async function fetchPlaylistData(playlistId) {
    try {
        const playlistData = await getPlaylistInfo(playlistId);
        const tracks = await getPlaylistTracks(playlistId);

        currentPlaylist = {
            name: playlistData.name,
            owner: playlistData.owner.display_name,
            image: playlistData.images[0]?.url || '',
            tracks: tracks
        };

        return currentPlaylist;
    } catch (error) {
        console.error('Error fetching playlist:', error);
        throw new Error('Could not load playlist from Spotify');
    }
}

function displayPlaylistInfo() {
    playlistName.textContent = currentPlaylist.name;
    playlistOwner.textContent = `Created by: ${currentPlaylist.owner}`;
    trackCount.textContent = `${currentPlaylist.tracks.length} songs`;

    if (currentPlaylist.image) {
        playlistImage.style.backgroundImage = `url(${currentPlaylist.image})`;
    }

    playlistInfo.classList.remove('hidden');

    renderTracks();
}

function renderTracks() {
    tracksContainer.innerHTML = '';

    currentPlaylist.tracks.slice(0, 20).forEach((track, index) => {
        const trackElement = document.createElement('div');
        trackElement.className = 'track-item';
        trackElement.innerHTML = `
            <div class="track-number">${index + 1}</div>
            <div class="track-info">
                <div class="track-name">${track.name}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
        `;
        tracksContainer.appendChild(trackElement);
    });

    if (currentPlaylist.tracks.length > 20) {
        const moreTracksElement = document.createElement('div');
        moreTracksElement.className = 'more-tracks';
        moreTracksElement.textContent = `+ ${currentPlaylist.tracks.length - 20} more songs`;
        tracksContainer.appendChild(moreTracksElement);
    }
}

function handleUsePlaylist() {
    const randomizedTracks = [...currentPlaylist.tracks];
    shuffleArray(randomizedTracks);

    const playlistData = {
        name: currentPlaylist.name,
        owner: currentPlaylist.owner,
        image: currentPlaylist.image,
        tracks: randomizedTracks
    };

    localStorage.setItem('gamePlaylist', JSON.stringify(playlistData));

    window.location.href = require('path').join(__dirname, 'music-game.html');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingElement.style.display = 'block';
        errorMessage.style.display = 'none';
    } else {
        loadingElement.style.display = 'none';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    loadingElement.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', initialize);
