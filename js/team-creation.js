const teamNameInput = document.getElementById('team-name');
const addTeamBtn = document.getElementById('add-team-btn');
const teamsList = document.getElementById('teams-list');
const noTeamsMessage = document.getElementById('no-teams-message');
const continueButton = document.getElementById('continue-button');
const clearButton = document.getElementById('clear-button')

let teams = [];

function initialize() {
    loadTeams();

    addTeamBtn.addEventListener('click', addTeam);
    teamNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTeam();
    });

    continueButton.addEventListener('click', () => {
        saveTeams();
        window.location.href = '../pages/select-playlist.html';
    });

    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all teams and game data?')) {
            const spotifyTokens = localStorage.getItem("spotifyTokens");
            localStorage.clear()
            localStorage.setItem("spotifyTokens", spotifyTokens);
            teams = [];
            updateTeamsList();
            saveTeams();
        }
    });

    updateTeamsList();
}

function addTeam() {
    const teamName = teamNameInput.value.trim();

    if (!teamName) {
        alert('Please enter a team name');
        return;
    }

    if (teams.some(team => team.toLowerCase() === teamName.toLowerCase())) {
        alert('A team with this name already exists');
        return;
    }

    teams.push(teamName);
    teamNameInput.value = '';

    updateTeamsList();
    saveTeams();
}

function removeTeam(index) {
    teams.splice(index, 1);
    updateTeamsList();
    saveTeams();
}

function updateTeamsList() {
    while (teamsList.firstChild) {
        teamsList.removeChild(teamsList.firstChild);
    }

    if (teams.length === 0) {
        teamsList.appendChild(noTeamsMessage);
        continueButton.disabled = true;
        return;
    }

    if (teamsList.contains(noTeamsMessage)) {
        teamsList.removeChild(noTeamsMessage);
    }

    teams.forEach((team, index) => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item';

        const teamName = document.createElement('div');
        teamName.className = 'team-name';
        teamName.textContent = team;

        const teamActions = document.createElement('div');
        teamActions.className = 'team-actions';

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => removeTeam(index));

        teamActions.appendChild(removeBtn);
        teamItem.appendChild(teamName);
        teamItem.appendChild(teamActions);

        teamsList.appendChild(teamItem);
    });

    continueButton.disabled = teams.length === 0;
}

function saveTeams() {
    localStorage.setItem('musicGameTeams', JSON.stringify(teams));
}

function loadTeams() {
    const savedTeams = localStorage.getItem('musicGameTeams');
    if (savedTeams) {
        teams = JSON.parse(savedTeams);
    }
}

document.addEventListener('DOMContentLoaded', initialize);
