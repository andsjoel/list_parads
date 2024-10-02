// app.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addPlayerForm');
    const teamsContainer = document.getElementById('teamsContainer');
    const trash = document.getElementById('trash');

    let teams = [[]]; // Array de arrays para armazenar os times
    let playerIdCounter = 1;
    let winCounts = [0, 0]; // Contadores de vitórias para os dois primeiros times

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('playerName').value.trim();
        const isSetter = document.getElementById('isSetter').checked;
        const isWoman = document.getElementById('isWoman').checked;

        if (name) {
            const newPlayer = {
                id: playerIdCounter++,
                name,
                isSetter,
                isWoman
            };

            addPlayerToTeam(newPlayer);
            renderTeams();
            form.reset();
        }
    });

    // Adicionando o evento para o botão de popular times
    document.getElementById('populateTeamsButton').addEventListener('click', populateTeams);

    function populateTeams() {
        mockPlayers.forEach(player => {
            addPlayerToTeam(player);
        });
        renderTeams();
    }

    // Adiciona um jogador à equipe seguindo as regras
    function addPlayerToTeam(player) {
        let team = findTeamForPlayer(player);
        team.push(player);
    }

    // Encontra um time que precisa de um jogador com base nas regras
    function findTeamForPlayer(player) {
        for (let team of teams) {
            const hasSetter = team.some(p => p.isSetter);
            const hasWoman = team.some(p => p.isWoman);
            const otherPlayersCount = team.filter(p => !p.isSetter && !p.isWoman).length;

            if (team.length < 6) {
                if (player.isSetter && !hasSetter) return team;
                if (player.isWoman && !hasWoman) return team;
                if (!player.isSetter && !player.isWoman && otherPlayersCount < 4) return team;
            }
        }

        // Se não encontrou time, cria um novo
        const newTeam = [];
        teams.push(newTeam);
        return newTeam;
    }

    // Renderiza os times
    function renderTeams() {
        teamsContainer.innerHTML = '';

        teams.forEach((team, index) => {
            const teamElement = document.createElement('div');
            teamElement.classList.add('team');
            teamElement.innerHTML = `<h2>Time ${index + 1}</h2>`;

            if (index < 2) {
                // Adicionar apenas o botão para marcar o vencedor
                const winButton = document.createElement('button');
                winButton.textContent = 'Vencedor';
                winButton.classList.add('win-button');
                winButton.addEventListener('click', () => handleWin(index));

                teamElement.appendChild(winButton);
            }

            team.forEach(player => {
                const playerElement = document.createElement('div');
                playerElement.classList.add('player');
                playerElement.textContent = `${player.name} ${player.isSetter ? '(Levantador)' : ''} ${player.isWoman ? '(Mulher)' : ''}`;
                playerElement.draggable = true;
                playerElement.dataset.id = player.id;

                playerElement.addEventListener('dragstart', handleDragStart);
                playerElement.addEventListener('dragend', handleDragEnd);

                teamElement.appendChild(playerElement);
            });

            teamsContainer.appendChild(teamElement);
        });
    }

    // Funções de drag-and-drop
    let draggedElement = null;

    function handleDragStart(event) {
        draggedElement = event.target;
        setTimeout(() => {
            draggedElement.classList.add('dragging');
        }, 0);
    }

    function handleDragEnd() {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }

    teamsContainer.addEventListener('dragover', (event) => {
        event.preventDefault();
        const afterElement = getDragAfterElement(teamsContainer, event.clientY);
        const team = event.target.closest('.team');
        if (team && draggedElement) {
            if (afterElement == null) {
                team.appendChild(draggedElement);
            } else {
                team.insertBefore(draggedElement, afterElement);
            }
        }
    });

    trash.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    trash.addEventListener('drop', () => {
        if (draggedElement) {
            const playerId = draggedElement.dataset.id;
            removePlayerFromTeams(playerId);
            renderTeams();
        }
    });

    function removePlayerFromTeams(playerId) {
        teams = teams.map(team => team.filter(player => player.id != playerId));
        teams = teams.filter(team => team.length > 0); // Remove times vazios
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.player:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Função para tratar o time vencedor
    function handleWin(winnerIndex) {
        const loserIndex = winnerIndex === 0 ? 1 : 0; // O outro time é o perdedor

        winCounts[winnerIndex] += 1; // Incrementa o contador de vitórias

        if (winCounts[winnerIndex] === 2) {
            // Se o time vencer duas vezes seguidas
            handleTeamOut(winnerIndex);
            winCounts[winnerIndex] = 0; // Reinicia o contador de vitórias para o time que saiu
        } else {
            // Mover o time perdedor para o final da lista
            const loserTeam = teams.splice(loserIndex, 1)[0];
            loserTeam.sort(() => Math.random() - 0.5); // Embaralha os jogadores do time perdedor

            // Redistribuir jogadores do time perdedor
            loserTeam.forEach(player => {
                addPlayerToTeam(player); // Recoloca jogadores aleatoriamente em times que precisem de vagas
            });
        }

        renderTeams();
    }

    // Função para mover o time que ganhou duas partidas seguidas para fora da quadra
    function handleTeamOut(winnerIndex) {
        const winningTeam = teams[winnerIndex];
        const losingTeam = teams[winnerIndex === 0 ? 1 : 0];

        // Adiciona o time vencedor ao final da lista
        teams.splice(winnerIndex, 1);

        // Move o time perdedor para o final da lista
        teams.push(losingTeam);

        // Cria dois novos times se necessário
        createNewTeams();

        // Renderiza novamente os times
        renderTeams();
    }

    // Cria novos times se necessário
    function createNewTeams() {
        while (teams.length < 4) {
            teams.push([]);
        }
    }
});
