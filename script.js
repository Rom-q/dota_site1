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
    
});