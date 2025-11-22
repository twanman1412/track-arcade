const teamsLeaderboard = document.getElementById('teams-leaderboard');
const backToGameBtn = document.getElementById('back-to-game-btn');

function initialize() {
    backToGameBtn.addEventListener('click', () => {
        const previousPage = localStorage.getItem('currentPage') || 'index';

        if (previousPage === 'victory') {
            window.location.href = '../pages/victory.html';
        } else {
            window.location.href = '../pages/music-game.ctml';
        }
    });

    loadLeaderboard();
}

function loadLeaderboard() {
    const teams = JSON.parse(localStorage.getItem('musicGameTeams') || '[]');
    const teamScores = JSON.parse(localStorage.getItem('teamScores') || '{}');
    const trackHistory = JSON.parse(localStorage.getItem('trackHistory') || '{}');

    const sortedTeams = [...teams].sort((a, b) => (teamScores[b] || 0) - (teamScores[a] || 0));

    teamsLeaderboard.innerHTML = '';

    if (sortedTeams.length === 0) {
        teamsLeaderboard.innerHTML = '<p class="no-data">No teams found.</p>';
        return;
    }

    sortedTeams.forEach(team => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item';

        const teamHeader = document.createElement('div');
        teamHeader.className = 'team-header';
        teamHeader.addEventListener('click', () => toggleTeamHistory(team));

        const teamName = document.createElement('div');
        teamName.className = 'team-name';
        teamName.textContent = team;

        const teamScore = document.createElement('div');
        teamScore.className = 'team-score';
        teamScore.textContent = `Score: ${teamScores[team] || 0}`;

        teamHeader.appendChild(teamName);
        teamHeader.appendChild(teamScore);

        const teamHistory = document.createElement('div');
        teamHistory.className = 'team-history';
        teamHistory.id = `history-${team.replace(/\s+/g, '-')}`;

        const history = trackHistory[team] || [];
        if (history.length === 0) {
            teamHistory.innerHTML = '<p>No tracks played yet.</p>';
        } else {
            history.forEach(entry => {
                const trackItem = document.createElement('div');
                trackItem.className = 'track-item';

                const trackName = document.createElement('div');
                trackName.className = 'track-name';
                trackName.textContent = `${entry.trackName} - ${entry.artistName} (${entry.releaseYear})`;

                const trackResult = document.createElement('div');
                trackResult.className = `track-result ${entry.correct ? 'correct' : 'incorrect'}`;
                trackResult.textContent = entry.correct ? '✓ Correct' : '✗ Incorrect';

                trackItem.appendChild(trackName);
                trackItem.appendChild(trackResult);
                teamHistory.appendChild(trackItem);
            });
        }

        teamItem.appendChild(teamHeader);
        teamItem.appendChild(teamHistory);

        teamsLeaderboard.appendChild(teamItem);
    });
}

function toggleTeamHistory(team) {
    const historyId = `history-${team.replace(/\s+/g, '-')}`;
    const historyElement = document.getElementById(historyId);
    historyElement.classList.toggle('expanded');
}

document.addEventListener('DOMContentLoaded', initialize);
