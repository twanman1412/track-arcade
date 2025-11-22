import {
    getTrackInfo,
    playTrack,
} from "./spotify.js";

const trackInfo = document.getElementById('track-info');
const albumArt = document.getElementById('album-art');
const trackName = document.getElementById('track-name');
const artistName = document.getElementById('artist-name');

const scoreDisplay = document.getElementById('score');
const activePlayerDisplay = document.getElementById('active-player');
const questionContainer = document.getElementById('question-container');
const comparisonYearElement = document.getElementById('comparison-year');
const beforeBtn = document.getElementById('before-btn');
const afterBtn = document.getElementById('after-btn');
const resultContainer = document.getElementById('result-container');
const resultMessage = document.getElementById('result-message');
const releaseYearElement = document.getElementById('release-year');
const albumNameElement = document.getElementById('album-name');
const nextQuestionBtn = document.getElementById('next-question-btn');
const leaderboardBtn = document.getElementById("leaderboard-btn")

const backButton = document.getElementById('back-button');

let currentTrackId = null;
let currentTrackInfo = null;
let teams = [];
let activeTeamIndex = 0;
let comparisonYear = 2000;
let gamePlaylist = null;
let currentTrackIndex = 0;

let playedSongs = JSON.parse(localStorage.getItem('playedSongs') || '[]');

async function initializeGame() {

    const savedPlaylist = localStorage.getItem('gamePlaylist');
    if (!savedPlaylist) {
        alert('No playlist found. Please select a playlist first.');
        window.location.href = '../pages/select-playlist.html';
        return;
    }

    gamePlaylist = JSON.parse(savedPlaylist);

    currentTrackIndex = parseInt(localStorage.getItem('currentTrackIndex') || 0);
    if (currentTrackIndex >= gamePlaylist.tracks.length) {
        currentTrackIndex = 0;
    }

    const savedTeams = localStorage.getItem('musicGameTeams');
    if (savedTeams) {
        teams = JSON.parse(savedTeams);
    } else {
        alert('No teams found. Please create teams first.');
        window.location.href = '../pages/team-creation.html';
        return;
    }

    if (!localStorage.getItem('teamScores')) {
        const initialScores = teams.reduce((acc, team) => {
            acc[team] = 0;
            return acc;
        }, {});
        localStorage.setItem('teamScores', JSON.stringify(initialScores));
    }

    activeTeamIndex = parseInt(localStorage.getItem('activeTeamIndex') || 0) % teams.length;

    beforeBtn.addEventListener('click', () => submitAnswer('before'));
    afterBtn.addEventListener('click', () => submitAnswer('after'));
    nextQuestionBtn.addEventListener('click', next);
    leaderboardBtn.addEventListener('click', viewLeaderboard);
    backButton.addEventListener('click', () => {
        window.location.href = require('path').join(__dirname, 'team-creation.html');
    });

    updatePlayerDisplay();

    const answer = localStorage.getItem("answer");
    if (answer) {
        console.log(answer)
        currentTrackInfo = JSON.parse(localStorage.getItem("currentTrackInfo"));
        console.log(currentTrackInfo)
        updateTrackInfo();
        await submitAnswer(answer, false);
    } else {
        await loadNextTrack();
    }
}

async function next() {

    localStorage.removeItem("answer")

    const releaseYear = new Date(currentTrackInfo.album.release_date).getFullYear();
    comparisonYearElement.textContent = releaseYear.toString();
    localStorage.setItem('comparisonYear', releaseYear.toString());

    currentTrackIndex++;
    localStorage.setItem('currentTrackIndex', currentTrackIndex.toString());

    activeTeamIndex = (activeTeamIndex + 1) % teams.length;
    localStorage.setItem('activeTeamIndex', activeTeamIndex.toString());

    updatePlayerDisplay();
    await loadNextTrack();
}

async function loadNextTrack() {

    comparisonYear = parseInt(localStorage.getItem('comparisonYear') || 2000);
    comparisonYearElement.textContent = comparisonYear;

    beforeBtn.disabled = false;
    afterBtn.disabled = false;
    questionContainer.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    trackInfo.classList.add('hidden');

    if (currentTrackIndex >= gamePlaylist.tracks.length) {
        alert('You have played all tracks in the playlist!');
        window.location.href = require('path').join(__dirname, 'select-playlist.html');
        return;
    }

    const track = gamePlaylist.tracks[currentTrackIndex];
    currentTrackId = track.id;

    try {
        const doPlay = await loadTrackInfo();
        if (doPlay) {
            await playTrack(currentTrackId);
        }
    } catch (error) {
        console.error('Error loading track:', error);
        alert('Failed to load track: ' + error.message);
    }
}

async function loadTrackInfo() {
    try {
        currentTrackInfo = await getTrackInfo(currentTrackId);
        localStorage.setItem("currentTrackInfo", JSON.stringify(currentTrackInfo));

        updateTrackInfo();

        if (playedSongs.includes(currentTrackId)) {
            console.warn("track has been played")
            return false;
        } else {
            playedSongs.push(currentTrackId);
            localStorage.setItem('playedSongs', JSON.stringify(playedSongs));
            return true;
        }

    } catch (error) {
        console.error('Error loading track info:', error);
        return false;
    }
}

function updateTrackInfo() {
    trackName.textContent = currentTrackInfo.name;
    artistName.textContent = currentTrackInfo.artists.map(artist => artist.name).join(', ');

    if (currentTrackInfo.album && currentTrackInfo.album.images && currentTrackInfo.album.images.length > 0) {
        albumArt.style.backgroundImage = `url(${currentTrackInfo.album.images[0].url})`;
    }
}

async function submitAnswer(answer, doScore = true) {

    trackInfo.classList.remove('hidden');
    beforeBtn.disabled = true;
    afterBtn.disabled = true;

    const releaseYear = new Date(currentTrackInfo.album.release_date).getFullYear();
    let isCorrect =
        (answer === 'before' && releaseYear <= comparisonYear) ||
        (answer === 'after' && releaseYear >= comparisonYear);

    if (doScore) {
        localStorage.setItem("answer", String(isCorrect));
    } else {
        isCorrect = Boolean(localStorage.getItem("answer"));
    }

    resultMessage.textContent = isCorrect ?
        '✓ Correct! You earned 1 point.' :
        '✗ Incorrect! No points earned.';

    resultContainer.className = isCorrect ? 'result-correct' : 'result-incorrect';

    releaseYearElement.textContent = String(releaseYear);
    albumNameElement.textContent = currentTrackInfo.album.name;

    if (doScore) {
        const activeTeam = teams[activeTeamIndex];

        const teamScores = JSON.parse(localStorage.getItem('teamScores'));
        if (isCorrect) {
            teamScores[activeTeam] += 1;
            localStorage.setItem('teamScores', JSON.stringify(teamScores));
            updatePlayerDisplay();
        }

        saveTrackHistory(activeTeam, isCorrect, currentTrackId, currentTrackInfo);

        if (teamScores[activeTeam] >= 10) {
            localStorage.setItem('winnerTeam', activeTeam);
            window.location.href = '../pages/victory.html';
            return;
        }
    }

    questionContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
}

function updatePlayerDisplay() {
    const teamScores = JSON.parse(localStorage.getItem('teamScores'));
    const activeTeam = teams[activeTeamIndex];
    activePlayerDisplay.textContent = activeTeam;
    scoreDisplay.textContent = teamScores[activeTeam];
}

function viewLeaderboard() {
    localStorage.setItem("currentTrackInfo", JSON.stringify(currentTrackInfo));
    localStorage.setItem("currentPage", "music-game");
    window.location.href = '../pages/leaderboard.html';
}

function saveTrackHistory(team, isCorrect) {
    const trackHistory = JSON.parse(localStorage.getItem('trackHistory') || '{}');

    if (!trackHistory[team]) {
        trackHistory[team] = [];
    }

    trackHistory[team].push({
        trackId: currentTrackId,
        trackName: currentTrackInfo.name,
        artistName: currentTrackInfo.artists.map(artist => artist.name).join(', '),
        releaseYear: new Date(currentTrackInfo.album.release_date).getFullYear(),
        correct: isCorrect
    });

    localStorage.setItem('trackHistory', JSON.stringify(trackHistory));
}

document.addEventListener('DOMContentLoaded', initializeGame);
