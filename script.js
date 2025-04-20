document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('searchButton');
    const steamIdInput = document.getElementById('steamIdInput');
    const resultContainer = document.getElementById('resultContainer');
    const loader = document.getElementById('loader');
    const errorDiv = document.getElementById('error');
    const matchesList = document.getElementById('matchesList');

    let heroesCache = null;

    searchButton.addEventListener('click', lookupAccount);
    steamIdInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            lookupAccount();
        }
    });

    async function lookupAccount() {
        const steamId = steamIdInput.value.trim();
        
        if (!steamId) {
            showError('Please enter a Steam ID');
            return;
        }

        if (!isValidSteamId(steamId)) {
            showError('Invalid Steam ID format. Please enter only numbers.');
            return;
        }

        loader.style.display = 'block';
        resultContainer.style.display = 'none';
        errorDiv.style.display = 'none';
        matchesList.innerHTML = '';
         
        try {
            if (!heroesCache) {
                heroesCache = await loadHeroesData();
            }

            const [playerData, heroesData, winLoseData, recentMatches] = await Promise.all([
                fetchPlayerData(steamId),
                fetchPlayerHeroes(steamId),
                fetchPlayerWinLose(steamId),
                fetchRecentMatches(steamId)
            ]);

            displayResults(playerData, heroesData, winLoseData, recentMatches);
            
            loader.style.display = 'none';
            resultContainer.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            loader.style.display = 'none';
            showError(error.message || 'Failed to fetch account data. Profile may be private.');
        }
    }

    function isValidSteamId(steamId) {
        return /^\d+$/.test(steamId);
    }

    async function loadHeroesData() {
        try {
            const response = await fetch('https://api.opendota.com/api/heroes');
            if (!response.ok) throw new Error('Failed to load heroes data');
            return await response.json();
        } catch (e) {
            console.warn("Using backup heroes data");
            return backupHeroesData;
        }
    }

    async function fetchPlayerData(steamId) {
        const response = await fetch(`https://api.opendota.com/api/players/${steamId}`);
        if (!response.ok) throw new Error('Account not found or private');
        return await response.json();
    }

    async function fetchPlayerHeroes(steamId) {
        try {
            const response = await fetch(`https://api.opendota.com/api/players/${steamId}/heroes`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            return [];
        }
    }

    async function fetchPlayerWinLose(steamId) {
        try {
            const response = await fetch(`https://api.opendota.com/api/players/${steamId}/wl`);
            if (!response.ok) return {win: 0, lose: 0};
            return await response.json();
        } catch (e) {
            return {win: 0, lose: 0};
        }
    }

    async function fetchRecentMatches(steamId) {
        try {
            const response = await fetch(`https://api.opendota.com/api/players/${steamId}/recentMatches`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            return [];
        }
    }

    function displayResults(playerData, heroesData, winLoseData, recentMatches) {
        
        document.getElementById('avatar').src = playerData.profile.avatarfull || 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
        document.getElementById('profileName').textContent = playerData.profile.personaname || 'Anonymous';
        document.getElementById('profileId').textContent = `Steam ID: ${playerData.profile.steamid}`;
        
        const [splt, splt2] = playerData.profile.last_login.split('T');
        document.getElementById('lastmatch').textContent = splt;
        
       document.getElementById('country').textContent = playerData.profile.loccountrycode || 'Unknown';

        const wins = winLoseData.win || 0;
        const losses = winLoseData.lose || 0;
        const totalGames = wins + losses;
        
        document.getElementById('totalGames').textContent = totalGames;
        document.getElementById('wins').textContent = wins;
        document.getElementById('losses').textContent = losses;
        document.getElementById('winRate').textContent = totalGames > 0 
            ? ((wins / totalGames) * 100).toFixed(2) + '%' 
            : 'No data';

        if (heroesData && heroesData.length > 0) {
            const mostPlayedHero = heroesData.reduce((prev, current) => 
                (prev.games > current.games) ? prev : current);
            
            const heroInfo = heroesCache.find(h => h.id === mostPlayedHero.hero_id);
            
            document.getElementById('mostPlayedHero').textContent = heroInfo?.localized_name || 'Unknown';
            document.getElementById('mostHeroGames').textContent = mostPlayedHero.games;
            
            if (mostPlayedHero.games > 0) {
                const winrate = (mostPlayedHero.win / mostPlayedHero.games * 100).toFixed(2);
                document.getElementById('mostHeroWinrate').textContent = `${winrate}%`;
            } else {
                document.getElementById('mostHeroWinrate').textContent = 'No data';
            }
        } else {
            document.getElementById('mostPlayedHero').textContent = 'No data';
            document.getElementById('mostHeroGames').textContent = 'No data';
            document.getElementById('mostHeroWinrate').textContent = 'No data';
        }

        if (recentMatches && recentMatches.length > 0) {
            const recent = recentMatches.slice(0, 10);
            
            recent.forEach(match => {
                const hero = heroesCache.find(h => h.id === match.hero_id);
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';
                
                const resultClass = match.player_slot < 128 === match.radiant_win ? 'win' : 'loss';
                const resultText = match.player_slot < 128 === match.radiant_win ? 'Victory' : 'Defeat';
                const duration = formatDuration(match.duration);
                const kda = `${match.kills}/${match.deaths}/${match.assists}`;
                const kdaRatio = ((match.kills + match.assists) / Math.max(1, match.deaths)).toFixed(2);
                
                matchCard.innerHTML = `
                    <div class="match-result ${resultClass}">${resultText} (${match.radiant_win ? 'Radiant' : 'Dire'})</div>
                    <div class="match-hero">
                        <img src="images/hero_icon/${hero.id}.jpg" 
                             class="hero-image" 
                             alt="${hero?.localized_name || 'Unknown'}">
                        <div>${hero?.localized_name || 'Unknown'}</div>
                    </div>
                    <div class="match-stats">
                        <div class="stat-item">
                            <div>Duration</div>
                            <div class="stat-value">${duration}</div>
                        </div>
                        <div class="stat-item">
                            <div>K/D/A</div>
                            <div class="stat-value">${kda} (${kdaRatio})</div>
                        </div>
                        <div class="stat-item">
                            <div>Hero Damage</div>
                            <div class="stat-value">${match.hero_damage?.toLocaleString() || '0'}</div>
                        </div>
                        <div class="stat-item">
                            <div>Hero Healing</div>
                            <div class="stat-value">${match.hero_healing?.toLocaleString() || '0'}</div>
                        </div>
                        <div class="stat-item">
                            <div>Last Hits</div>
                            <div class="stat-value">${match.last_hits || '0'}</div>
                        </div>
                        <div class="stat-item">
                            <div>GPM/XPM</div>
                            <div class="stat-value">${match.gold_per_min || '0'}/${match.xp_per_min || '0'}</div>
                        </div>
                        <div class="stat-item">
                            <div>Match ID</div>
                            <div class="stat-value"><a href="https://dota.romq.ru/match?id=${match.match_id}" target="_blank">${match.match_id}</a></div>
                    </div>
                `;
                
                matchesList.appendChild(matchCard);
            });
        } else {
            matchesList.innerHTML = '<p>No recent match data available. Profile may be private.</p>';
        }
    }

    function formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function getVisibilityText(state) {
        switch(state) {
            case 1: return 'Private';
            case 2: return 'Friends Only';
            case 3: return 'Public';
            default: return 'Unknown';
        }
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    const backupHeroesData = [
        {id: 1, name: "npc_dota_hero_antimage", localized_name: "Anti-Mage"},
        {id: 2, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 3, name: "npc_dota_hero_axe", localized_name: "Bane"},
        {id: 4, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 5, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 6, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 7, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 8, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 9, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 10, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 11, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 12, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 13, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 14, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 15, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 16, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 17, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 18, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 19, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 20, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 21, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 22, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 23, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 25, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 26, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 27, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 28, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 29, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 30, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 31, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 32, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 33, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 34, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 35, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 36, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 37, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 38, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 39, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 40, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 41, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 42, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 43, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 44, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 45, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 46, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 47, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 48, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 49, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 50, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 51, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 52, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 53, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 54, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 55, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 56, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 57, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 58, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 59, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 60, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 61, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 62, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 63, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 64, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 65, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 66, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 67, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 68, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 69, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 70, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 71, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 72, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 73, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 74, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 75, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 76, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 77, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 78, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 79, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 80, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 81, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 82, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 83, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 84, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 85, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 86, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 87, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 88, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 89, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 90, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 91, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 92, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 93, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 94, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 95, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 96, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 97, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 98, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 99, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 100, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 101, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 102, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 103, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 104, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 105, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 106, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 107, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 108, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 109, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 110, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 111, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 112, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 113, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 114, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 119, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 120, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 121, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 123, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 126, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 128, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 129, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 131, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 135, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 136, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 137, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 138, name: "npc_dota_hero_axe", localized_name: "Axe"},
        {id: 145, name: "npc_dota_hero_axe", localized_name: "Axe"},
    ];
});