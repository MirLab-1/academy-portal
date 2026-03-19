/**
 * The Knowledge Portal - V4.3 AAA SERVER
 * MULTIPLAYER BRAIN: Handles Chat, Leaderboards, Jeopardy, and Tug of War.
 */

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, '/')));

// --- MASTER DATA ---
let jeopardyPlayers = [];
let globalScores = {}; 
let globalWinStreaks = {}; 
let readyPlayers = new Set();

// --- JEOPARDY STATE ---
let gameActive = false;
let currentRound = 0;
const MAX_ROUNDS = 21;
let roundTimer = null;
let canBuzz = false;
let currentCorrectAnswer = "";
let goldenRound = 0;
let questionStartTime = 0;  

// --- TUG OF WAR STATE ---
let tugRooms = {};

io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id);

    // ==========================================
    // 1. GLOBAL LOBBY & ACCOUNTS
    // ==========================================
    socket.on('join_game', (data) => {
        socket.userName = data.name;
        globalScores[data.name] = data.points || 0;
        if (!globalWinStreaks[data.name]) globalWinStreaks[data.name] = 0;
    });

    socket.on('update_global_score', (data) => {
        globalScores[data.name] = data.points;
    });

    socket.on('get_leaderboard', () => {
        const boardData = Object.keys(globalScores).map(name => ({ name: name, points: globalScores[name] }));
        socket.emit('leaderboard_data', boardData);
    });

    socket.on('send_chat', (data) => {
        data.globalPoints = globalScores[data.name] || 0;
        io.emit('receive_chat', data);
    });

    // ==========================================
    // 2. NEW: TUG OF WAR (1v1) SERVER LOGIC
    // ==========================================
    socket.on('join_tug', (data) => {
        let roomID = Object.keys(tugRooms).find(id => tugRooms[id].players.length === 1);
        
        if (!roomID) {
            roomID = "tug_" + socket.id;
            tugRooms[roomID] = { players: [], ropePosition: 50 };
        }

        tugRooms[roomID].players.push({
            id: socket.id,
            name: data.name,
            ready: false,
            streak: 0,
            globalPoints: globalScores[data.name] || 0
        });

        socket.join(roomID);
        socket.currentTugRoom = roomID;
        io.to(roomID).emit('tug_lobby_update', { ready: tugRooms[roomID].players.length });
    });

    socket.on('tug_ready', () => {
        const room = tugRooms[socket.currentTugRoom];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (player) player.ready = true;

        if (room.players.length === 2 && room.players.every(p => p.ready)) {
            const dummyQs = new Array(30).fill(true); 
            room.players.forEach(p => {
                const opponent = room.players.find(opp => opp.id !== p.id);
                io.to(p.id).emit('tug_start', { questions: dummyQs, opponentName: opponent.name });
            });
        }
    });

    socket.on('tug_answer', (data) => {
        const room = tugRooms[socket.currentTugRoom];
        if (!room || room.players.length < 2) return;

        const p1 = room.players[0];
        const p2 = room.players[1];
        const isP1 = p1.id === socket.id;

        if (data.correct) {
            if (isP1) {
                p1.streak++; p2.streak = 0;
                room.ropePosition -= 5; // P1 pulls Left
                if (p1.streak >= 3) { io.to(p2.id).emit('tug_muddy'); p1.streak = 0; }
            } else {
                p2.streak++; p1.streak = 0;
                room.ropePosition += 5; // P2 pulls Right
                if (p2.streak >= 3) { io.to(p1.id).emit('tug_muddy'); p2.streak = 0; }
            }
        } else {
            if (isP1) p1.streak = 0; else p2.streak = 0;
        }

        io.to(socket.currentTugRoom).emit('tug_update', {
            ropePosition: room.ropePosition,
            p1Streak: p1.streak,
            p2Streak: p2.streak
        });

        if (room.ropePosition <= 0 || room.ropePosition >= 100) {
            const winner = room.ropePosition <= 0 ? p1.name : p2.name;
            io.to(socket.currentTugRoom).emit('tug_game_over', { winner: winner, reason: "win" });
            delete tugRooms[socket.currentTugRoom];
        }
    });

    // THE FORFEIT FIX: It actively checks who stayed and gives them the win
    socket.on('leave_tug', () => {
        if (socket.currentTugRoom && tugRooms[socket.currentTugRoom]) {
            const room = tugRooms[socket.currentTugRoom];
            const remainingPlayer = room.players.find(p => p.id !== socket.id);
            const winnerName = remainingPlayer ? remainingPlayer.name : "Nobody";
            
            io.to(socket.currentTugRoom).emit('tug_game_over', { winner: winnerName, reason: "forfeit" });
            delete tugRooms[socket.currentTugRoom];
        }
    });

    // ==========================================
    // 3. YOUR ORIGINAL JEOPARDY LOGIC (UNTOUCHED)
    // ==========================================
    socket.on('join_jeopardy', (data) => {
        if (!jeopardyPlayers.find(p => p.id === socket.id)) {
            jeopardyPlayers.push({ 
                id: socket.id, 
                name: data.name, 
                score: 0, 
                streak: 0,
                maxStreak: 0,
                globalPoints: globalScores[data.name] || 0,
                globalWinStreak: globalWinStreaks[data.name] || 0,
                eliminated: false,
                stats: { buzzes: 0, correct: 0, responseTimeSum: 0 },
                bountyCollected: false
            });
        }
        io.emit('receive_chat', { name: "SYSTEM", message: `${data.name} entered the arena.` });
        io.emit('lobby_update', { ready: readyPlayers.size, total: jeopardyPlayers.length });
        io.emit('score_update', jeopardyPlayers);
    });

    socket.on('player_ready', () => {
        readyPlayers.add(socket.id);
        io.emit('lobby_update', { ready: readyPlayers.size, total: jeopardyPlayers.length });
        if (readyPlayers.size >= jeopardyPlayers.length && jeopardyPlayers.length >= 1) {
            startGame();
        }
    });

    socket.on('buzz', (data) => {
        const player = jeopardyPlayers.find(p => p.id === socket.id);
        if (canBuzz && player && !player.eliminated) {
            canBuzz = false;
            if (roundTimer) clearInterval(roundTimer);
            
            const buzzTime = (Date.now() - questionStartTime) / 1000;
            player.stats.buzzes++;
            player.stats.responseTimeSum += buzzTime;

            io.emit('player_buzzed', { name: data.name, id: socket.id });
            startAnswerTimer(socket.id, data.name, 10);
        }
    });

    socket.on('submit_answer', (data) => {
        if (roundTimer) clearInterval(roundTimer);
        const isCorrect = (data.answer === currentCorrectAnswer);
        const isGolden = (currentRound === goldenRound);
        const player = jeopardyPlayers.find(p => p.id === socket.id);
        
        if (player) {
            if (isCorrect) {
                player.score += isGolden ? 1500 : 500;
                player.streak++;
                player.stats.correct++;
                if (player.streak > player.maxStreak) player.maxStreak = player.streak;
            } else {
                player.score -= isGolden ? 1000 : 250;
                player.streak = 0; 
                
                if (player.score <= -1000) {
                    player.eliminated = true;
                    io.to(player.id).emit('player_eliminated');
                    io.emit('receive_chat', { name: "SYSTEM", message: `💀 ${player.name} has been eliminated!` });
                }
            }
        }
        
        io.emit('answer_result', { name: data.name, isCorrect: isCorrect, correctAnswer: currentCorrectAnswer });
        io.emit('score_update', jeopardyPlayers);
        setTimeout(nextRound, 3000);
    });

    socket.on('start_round', (qData) => {
        if (!gameActive) return;
        currentCorrectAnswer = qData.correct;
        const isGolden = (currentRound === goldenRound);
        
        if (isGolden) {
            io.emit('golden_alert');
            setTimeout(() => {
                if (!gameActive) return;
                io.emit('announce_category', { ...qData, isGolden: true });
                setTimeout(() => {
                    if (!gameActive) return;
                    io.emit('new_question', qData);
                    questionStartTime = Date.now();
                    canBuzz = true;
                    startBuzzTimer(15);
                }, 4000);
            }, 4000); 
        } else {
            io.emit('announce_category', { ...qData, isGolden: false });
            setTimeout(() => {
                if (!gameActive) return;
                io.emit('new_question', qData);
                questionStartTime = Date.now();
                canBuzz = true;
                startBuzzTimer(15);
            }, 4000);
        }
    });

    socket.on('disconnect', () => handleLeave(socket));
    socket.on('leave_jeopardy', () => handleLeave(socket));

    function handleLeave(s) {
        if (s.currentTugRoom && tugRooms[s.currentTugRoom]) {
            const room = tugRooms[s.currentTugRoom];
            const remainingPlayer = room.players.find(p => p.id !== s.id);
            const winnerName = remainingPlayer ? remainingPlayer.name : "Nobody";
            io.to(s.currentTugRoom).emit('tug_game_over', { winner: winnerName, reason: "disconnect" });
            delete tugRooms[s.currentTugRoom];
        }

        const player = jeopardyPlayers.find(p => p.id === s.id);
        if (player) {
            io.emit('receive_chat', { name: "SYSTEM", message: `${player.name} left.` });
            jeopardyPlayers = jeopardyPlayers.filter(p => p.id !== s.id);
            readyPlayers.delete(s.id);
            io.emit('lobby_update', { ready: readyPlayers.size, total: jeopardyPlayers.length });
            io.emit('score_update', jeopardyPlayers);

            if (gameActive) {
                const alivePlayers = jeopardyPlayers.filter(p => !p.eliminated);
                if (alivePlayers.length <= 1 && jeopardyPlayers.length > 1) {
                    if (alivePlayers.length === 1) endGameEarly(alivePlayers[0]);
                    else handleGameOver();
                } else if (jeopardyPlayers.length === 1) {
                    endGameEarly(jeopardyPlayers[0]);
                } else if (jeopardyPlayers.length === 0) {
                    gameActive = false;
                    if (roundTimer) clearInterval(roundTimer);
                }
            }
        }
    }
});

function startGame() {
    gameActive = true;
    currentRound = 0;
    goldenRound = Math.floor(Math.random() * (MAX_ROUNDS - 3)) + 3; 
    
    io.emit('game_starting');
    setTimeout(nextRound, 2000);
}

function nextRound() {
    if (!gameActive) return;
    
    const alivePlayers = jeopardyPlayers.filter(p => !p.eliminated);
    if (alivePlayers.length <= 1 && jeopardyPlayers.length > 1) {
        if (alivePlayers.length === 1) endGameEarly(alivePlayers[0]);
        else handleGameOver();
        return;
    }

    currentRound++;
    if (currentRound > MAX_ROUNDS) {
        handleGameOver();
        return;
    }
    
    canBuzz = false;
    io.emit('reset_buzzer');
    io.emit('round_update', { round: currentRound, max: MAX_ROUNDS });
    
    let host = alivePlayers.length > 0 ? alivePlayers[0] : jeopardyPlayers[0];
    io.to(host.id).emit('request_question', { hostId: host.id });
}

function startBuzzTimer(maxTime) {
    let timeLeft = maxTime;
    if (roundTimer) clearInterval(roundTimer);
    roundTimer = setInterval(() => {
        timeLeft--;
        io.emit('timer_update', { text: `Time left: ${timeLeft}s`, timeLeft: timeLeft, maxTime: maxTime });
        if (timeLeft <= 0) {
            clearInterval(roundTimer);
            canBuzz = false;
            io.emit('answer_result', { name: "Nobody", timedOut: true, correctAnswer: currentCorrectAnswer });
            jeopardyPlayers.forEach(p => p.streak = 0);
            io.emit('score_update', jeopardyPlayers);
            setTimeout(nextRound, 3000);
        }
    }, 1000);
}

function startAnswerTimer(id, name, maxTime) {
    let timeLeft = maxTime;
    if (roundTimer) clearInterval(roundTimer);
    roundTimer = setInterval(() => {
        timeLeft--;
        io.emit('timer_update', { text: `${name}'s clock: ${timeLeft}s`, timeLeft: timeLeft, maxTime: maxTime });
        if (timeLeft <= 0) {
            clearInterval(roundTimer);
            const player = jeopardyPlayers.find(p => p.id === id);
            if(player) {
                player.score -= (currentRound === goldenRound) ? 1000 : 250;
                player.streak = 0;
                if (player.score <= -1000) {
                    player.eliminated = true;
                    io.to(player.id).emit('player_eliminated');
                    io.emit('receive_chat', { name: "SYSTEM", message: `💀 ${player.name} eliminated!` });
                }
            }
            io.emit('answer_result', { name: name, timedOut: true, correctAnswer: currentCorrectAnswer });
            io.emit('score_update', jeopardyPlayers);
            setTimeout(nextRound, 3000);
        }
    }, 1000);
}

function endGameEarly(winner) {
    gameActive = false;
    if (roundTimer) clearInterval(roundTimer);
    io.emit('receive_chat', { name: "SYSTEM", message: `Match over. ${winner.name} is the last one standing!` });
    handleGameOver();
}

function handleGameOver() {
    gameActive = false;
    readyPlayers.clear();
    
    jeopardyPlayers.sort((a,b) => b.score - a.score);
    const winner = jeopardyPlayers[0];
    
    let bountyClaimed = false;
    jeopardyPlayers.forEach(p => {
        if (p.id !== winner.id && p.globalWinStreak >= 2) {
            bountyClaimed = true;
        }
    });

    if (bountyClaimed && winner) {
        winner.bountyCollected = true;
        globalScores[winner.name] = (globalScores[winner.name] || 0) + 5000;
    }

    jeopardyPlayers.forEach(p => {
        if (p.id === winner.id) {
            globalWinStreaks[p.name] = (globalWinStreaks[p.name] || 0) + 1;
        } else {
            globalWinStreaks[p.name] = 0;
        }
    });

    io.emit('game_over', jeopardyPlayers);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`AAA SCORING SERVER LIVE ON PORT ${PORT}`);
});
