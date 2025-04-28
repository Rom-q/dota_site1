document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('searchButton');
    const matchIdInput = document.getElementById('matchIdInput');
    const loader = document.getElementById('loader');
    const error = document.getElementById('error');
    const resultContainer = document.getElementById('resultContainer');
    const toggleJson = document.getElementById('toggleJson');
    const jsonViewer = document.getElementById('jsonViewer');
    
    let matchData = null;
    let jsonVisible = false;
    
    searchButton.addEventListener('click', searchMatch);
    matchIdInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMatch();
        }
    });
    
    toggleJson.addEventListener('click', function() {
        jsonVisible = !jsonVisible;
        jsonViewer.style.display = jsonVisible ? 'block' : 'none';
        toggleJson.textContent = jsonVisible ? 'Hide Full API Response' : 'Show Full API Response';
        
        if (jsonVisible && matchData) {
            jsonViewer.textContent = JSON.stringify(matchData, null, 2);
        }
    });
    
    function searchMatch() {
        const matchId = matchIdInput.value.trim();
        
        if (!matchId) {
            showError('Please enter a Match ID');
            return;
        }
        
        loader.style.display = 'block';
        error.style.display = 'none';
        resultContainer.style.display = 'none';
        jsonViewer.style.display = 'none';
        jsonVisible = false;
        toggleJson.textContent = 'Show Full API Response';
        
        fetch(`https://api.opendota.com/api/matches/${matchId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Match not found or API error');
                }
                return response.json();
            })
            .then(data => {
                matchData = data;
                displayMatchData(data);
                loader.style.display = 'none';
                resultContainer.style.display = 'block';
            })
            .catch(err => {
                loader.style.display = 'none';
                showError(err.message);
            });
    }
    
    function displayMatchData(data) {

        document.getElementById('matchId').textContent = `Match ID: ${data.match_id}`;
        document.getElementById('matchDuration').textContent = `Duration: ${formatDuration(data.duration)}`;
        document.getElementById('matchDate').textContent = `Date: ${new Date(data.start_time * 1000).toLocaleString()}`;
        

        document.getElementById('gameMode').textContent = getGameMode(data.game_mode);
        document.getElementById('lobbyType').textContent = getLobbyType(data.lobby_type);
        document.getElementById('region').textContent = getRegion(data.region);
        

        document.getElementById('radiantScore').textContent = data.radiant_score;
        document.getElementById('radiantKills').textContent = data.radiant_team ? data.radiant_team.team_id : 'N/A';
        document.getElementById('radiantTowers').textContent = data.tower_status_radiant ? countTowers(data.tower_status_radiant) : 'N/A';
        
        document.getElementById('direScore').textContent = data.dire_score;
        document.getElementById('direKills').textContent = data.dire_team ? data.dire_team.team_id : 'N/A';
        document.getElementById('direTowers').textContent = data.tower_status_dire ? countTowers(data.tower_status_dire) : 'N/A';
        

        const radiantWin = data.radiant_win;
        document.getElementById('radiantWin').textContent = radiantWin ? 'Victory' : 'Defeat';
        document.getElementById('radiantWin').className = radiantWin ? 'match-result win' : 'match-result loss';
        document.getElementById('direWin').textContent = radiantWin ? 'Defeat' : 'Victory';
        document.getElementById('direWin').className = radiantWin ? 'match-result loss' : 'match-result win';
        
        document.getElementById('radiantResult').textContent = radiantWin ? 'Victory' : 'Defeat';
        document.getElementById('radiantResult').className = radiantWin ? 'match-result win' : 'match-result loss';
        document.getElementById('direResult').textContent = radiantWin ? 'Defeat' : 'Victory';
        document.getElementById('direResult').className = radiantWin ? 'match-result loss' : 'match-result win';
        

        const radiantPlayers = document.getElementById('radiantPlayers');
        const direPlayers = document.getElementById('direPlayers');
        
        radiantPlayers.innerHTML = '';
        direPlayers.innerHTML = '';
        
        if (data.players && data.players.length > 0) {
            data.players.forEach(player => {
                const playerRow = document.createElement('div');
                playerRow.className = 'player-row';
                
                const heroImg = document.createElement('img');
                heroImg.className = 'hero-image';
                heroImg.src = 'images/hero_icon/${hero.id}.jpg';
                heroImg.alt = 'Hero';
                
                const playerInfo = document.createElement('div');
                playerInfo.className = 'player-info';
                
                const playerName = document.createElement('div');
                playerName.className = 'player-name';
                playerName.textContent = player.personaname || player.name || 'Anonymous';
                
                const playerKDA = document.createElement('div');
                playerKDA.className = 'stat-item';
                playerKDA.innerHTML = `<strong>K/D/A:</strong> <span class="stat-value">${player.kills}/${player.deaths}/${player.assists}</span>`;
                
                const playerGPM = document.createElement('div');
                playerGPM.className = 'stat-item';
                playerGPM.innerHTML = `<strong>GPM:</strong> <span class="stat-value">${player.gold_per_min}</span>`;
                
                const playerXPM = document.createElement('div');
                playerXPM.className = 'stat-item';
                playerXPM.innerHTML = `<strong>XPM:</strong> <span class="stat-value">${player.xp_per_min}</span>`;
                
                const playerLH = document.createElement('div');
                playerLH.className = 'stat-item';
                playerLH.innerHTML = `<strong>LH/DN:</strong> <span class="stat-value">${player.last_hits}/${player.denies}</span>`;
                
                playerInfo.appendChild(playerName);
                playerInfo.appendChild(playerKDA);
                playerInfo.appendChild(playerGPM);
                playerInfo.appendChild(playerXPM);
                playerInfo.appendChild(playerLH);
                
                playerRow.appendChild(heroImg);
                playerRow.appendChild(playerInfo);
                
                if (player.isRadiant) {
                    radiantPlayers.appendChild(playerRow);
                } else {
                    direPlayers.appendChild(playerRow);
                }
            });
        }
    }
    
    function showError(message) {
        error.textContent = message;
        error.style.display = 'block';
    }
    
    function formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    function getGameMode(modeId) {
        const modes = {
            0: 'Unknown',
            1: 'All Pick',
            2: 'Captains Mode',
            3: 'Random Draft',
            4: 'Single Draft',
            5: 'All Random',
            6: 'Intro',
            7: 'Diretide',
            8: 'Reverse Captains Mode',
            9: 'Greeviling',
            10: 'Tutorial',
            11: 'Mid Only',
            12: 'Least Played',
            13: 'Limited Heroes',
            14: 'Compendium Matchmaking',
            15: 'Custom',
            16: 'Captains Draft',
            17: 'Balanced Draft',
            18: 'Ability Draft',
            19: 'Event',
            20: 'All Random Death Match',
            21: '1v1 Mid',
            22: 'All Draft',
            23: 'Turbo',
            24: 'Mutation'
        };
        return modes[modeId] || `Mode ${modeId}`;
    }
    
    function getLobbyType(lobbyId) {
        const lobbies = {
            0: 'Normal',
            1: 'Practice',
            2: 'Tournament',
            3: 'Tutorial',
            4: 'Co-op Bots',
            5: 'Ranked Team MM',
            6: 'Ranked Solo MM',
            7: 'Ranked',
            8: '1v1 Mid',
            9: 'Battle Cup'
        };
        return lobbies[lobbyId] || `Lobby ${lobbyId}`;
    }
    
    function getRegion(regionId) {
        const regions = {
            111: 'US West',
            112: 'US East',
            114: 'Europe West',
            115: 'Europe East',
            116: 'Singapore',
            117: 'Dubai',
            118: 'Australia',
            119: 'Stockholm',
            120: 'Austria',
            121: 'Brazil',
            122: 'South Africa',
            123: 'Perfect World Telecom',
            124: 'Perfect World Unicom',
            125: 'Chile',
            126: 'Peru',
            127: 'India',
            128: 'Perfect World Telecom (Guangdong)',
            129: 'Perfect World Telecom (Zhejiang)',
            130: 'Japan',
            131: 'Perfect World Unicom (Tianjin)',
            132: 'Taiwan',
            133: 'Argentina',
            134: 'Perfect World Unicom (Wuhan)',
            135: 'Perfect World Unicom (Xi\'an)',
            136: 'Perfect World Unicom (Shanghai)'
        };
        return regions[regionId] || `Region ${regionId}`;
    }
    
    function countTowers(towerStatus) {
 
        let count = 0;
        for (let i = 0; i < 16; i++) {
            if (towerStatus & (1 << i)) {
                count++;
            }
        }
        return `${count}/11`;
    }
    
    function getHeroImage(heroId) {

        return `/apps/dota2/images/heroes/antimage_full.png?`;
    }
});