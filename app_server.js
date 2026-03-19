/**
 * The Knowledge Portal - V4.3 AAA SERVER
 * MULTIPLAYER BRAIN: Handles Chat, Leaderboards, Jeopardy, Tug of War, THE ARENA, and THE MOTHER PLANE.
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

// --- 1V1 MODES STATE ---
let tugRooms = {};
let arenaRooms = {};

// --- 🚀 MOTHER PLANE (FAMILY GAME) STATE 🚀 ---
let familyRooms = {};

// Helper: Generate Random 4-Digit Code
function generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

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
    // 2. NEW: THE ARENA (High Stakes Duel)
    // ==========================================
    socket.on('join_arena', (data) => {
        let roomID = Object.keys(arenaRooms).find(id => arenaRooms[id].players.length === 1);
        
        if (!roomID) {
            roomID = "arena_" + socket.id;
            arenaRooms[roomID] = { players: [], question: null };
        }

        arenaRooms[roomID].players.push({
            id: socket.id,
            name: data.name,
            ready: false,
            wager: 0,
            answer: null,
            globalPoints: globalScores[data.name] || 0
        });

        socket.join(roomID);
        socket.currentArenaRoom = roomID;
        io.to(roomID).emit('arena_lobby_update', { ready: arenaRooms[roomID].players.length });
    });

    socket.on('arena_ready', () => {
        const room = arenaRooms[socket.currentArenaRoom];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (player) player.ready = true;

        if (room.players.length === 2 && room.players.every(p => p.ready)) {
            io.to(socket.currentArenaRoom).emit('arena_wager_phase');
        }
    });

    socket.on('arena_wager', (data) => {
        const room = arenaRooms[socket.currentArenaRoom];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (player) player.wager = data.wager;

        if (room.players.every(p => p.wager > 0)) {
            io.to(socket.currentArenaRoom).emit('arena_start_question', {
                p1Name: room.players[0].name, p1Wager: room.players[0].wager,
                p2Name: room.players[1].name, p2Wager: room.players[1].wager
            });
        }
    });

    socket.on('arena_answer', (data) => {
        const roomID = socket.currentArenaRoom;
        const room = arenaRooms[roomID];
        if (!room || room.players.length < 2) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) player.answer = data.correct; // boolean

        // If both have answered, calculate the payout!
        if (room.players[0].answer !== null && room.players[1].answer !== null) {
            let p1 = room.players[0];
            let p2 = room.players[1];
            
            let resultData = { p1Name: p1.name, p2Name: p2.name, p1Result: 0, p2Result: 0, message: "" };

            if (p1.answer && !p2.answer) {
                // P1 Wins, steals P2's wager
                resultData.p1Result = p2.wager;
                resultData.p2Result = -p2.wager;
                resultData.message = `${p1.name} crushed ${p2.name} and stole their wager!`;
            } else if (p2.answer && !p1.answer) {
                // P2 Wins, steals P1's wager
                resultData.p2Result = p1.wager;
                resultData.p1Result = -p1.wager;
                resultData.message = `${p2.name} crushed ${p1.name} and stole their wager!`;
            } else if (p1.answer && p2.answer) {
                // Both correct
                resultData.message = "STALEMATE! Both warriors survived. No points lost.";
            } else {
                // Both wrong
                resultData.p1Result = -p1.wager;
                resultData.p2Result = -p2.wager;
                resultData.message = "DOUBLE KO! Both were incorrect and lost their bets.";
            }

            // Apply updates to global scores
            globalScores[p1.name] = Math.max(0, (globalScores[p1.name] || 0) + resultData.p1Result);
            globalScores[p2.name] = Math.max(0, (globalScores[p2.name] || 0) + resultData.p2Result);

            io.to(roomID).emit('arena_game_over', resultData);
            delete arenaRooms[roomID];
        }
    });

    socket.on('leave_arena', () => {
        if (socket.currentArenaRoom && arenaRooms[socket.currentArenaRoom]) {
            io.to(socket.currentArenaRoom).emit('arena_game_over', { message: "Opponent fled the Arena. Match cancelled.", p1Result: 0, p2Result: 0 });
            delete arenaRooms[socket.currentArenaRoom];
        }
    });

    // ==========================================
    // 3. TUG OF WAR (1v1) SERVER LOGIC
    // ==========================================
    socket.on('join_tug', (data) => {
        let roomID = Object.keys(tugRooms).find(id => tugRooms[id].players.length === 1);
        if (!roomID) {
            roomID = "tug_" + socket.id;
            tugRooms[roomID] = { players: [], ropePosition: 50 };
        }
        tugRooms[roomID].players.push({ id: socket.id, name: data.name, ready: false, streak: 0 });
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
                p1.streak++; p2.streak = 0; room.ropePosition -= 5;
                if (p1.streak >= 3) { io.to(p2.id).emit('tug_muddy'); p1.streak = 0; }
            } else {
                p2.streak++; p1.streak = 0; room.ropePosition += 5;
                if (p2.streak >= 3) { io.to(p1.id).emit('tug_muddy'); p2.streak = 0; }
            }
        } else {
            if (isP1) p1.streak = 0; else p2.streak = 0;
        }

        io.to(socket.currentTugRoom).emit('tug_update', { ropePosition: room.ropePosition, p1Streak: p1.streak, p2Streak: p2.streak });

        if (room.ropePosition <= 0 || room.ropePosition >= 100) {
            const winner = room.ropePosition <= 0 ? p1.name : p2.name;
            io.to(socket.currentTugRoom).emit('tug_game_over', { winner: winner, reason: "win" });
            delete tugRooms[socket.currentTugRoom];
        }
    });

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
    // 4. LIVE JEOPARDY LOGIC
    // ==========================================
    socket.on('join_jeopardy', (data) => {
        if (!jeopardyPlayers.find(p => p.id === socket.id)) {
            jeopardyPlayers.push({ 
                id: socket.id, name: data.name, score: 0, streak: 0, maxStreak: 0,
                globalPoints: globalScores[data.name] || 0, globalWinStreak: globalWinStreaks[data.name] || 0,
                eliminated: false, stats: { buzzes: 0, correct: 0, responseTimeSum: 0 }, bountyCollected: false
            });
        }
        io.emit('receive_chat', { name: "SYSTEM", message: `${data.name} entered the arena.` });
        io.emit('lobby_update', { ready: readyPlayers.size, total: jeopardyPlayers.length });
        io.emit('score_update', jeopardyPlayers);
    });

    socket.on('player_ready', () => {
        readyPlayers.add(socket.id);
        io.emit('lobby_update', { ready: readyPlayers.size, total: jeopardyPlayers.length });
        if (readyPlayers.size >= jeopardyPlayers.length && jeopardyPlayers.length >= 1) startGame();
    });

    socket.on('buzz', (data) => {
        const player = jeopardyPlayers.find(p => p.id === socket.id);
        if (canBuzz && player && !player.eliminated) {
            canBuzz = false;
            if (roundTimer) clearInterval(roundTimer);
            const buzzTime = (Date.now() - questionStartTime) / 1000;
            player.stats.buzzes++; player.stats.responseTimeSum += buzzTime;
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
                player.streak++; player.stats.correct++;
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


    // ==========================================
    // 🚀 5. THE MOTHER PLANE (FAMILY GAME) LOGIC
    // ==========================================
    
    socket.on('create_family_room', (data) => {
        const code = generateRoomCode();
        familyRooms[code] = {
            host: socket.id,
            code: code,
            players: [{ id: socket.id, name: data.name, role: "", triviaVote: null, accuseVote: null, roundScore: 0, totalScore: 0 }],
            traitorId: null,
            currentQuestion: null
        };
        socket.join(code);
        socket.currentFamilyRoom = code;
        socket.emit('family_room_created', code);
    });

    socket.on('join_family_room', (data) => {
        const room = familyRooms[data.code];
        if (!room) {
            socket.emit('family_join_error', "Room code not found.");
            return;
        }
        if (room.players.find(p => p.id === socket.id)) return; // Prevent double join
        
        room.players.push({ id: socket.id, name: data.name, role: "", triviaVote: null, accuseVote: null, roundScore: 0, totalScore: 0 });
        socket.join(data.code);
        socket.currentFamilyRoom = data.code;
        socket.emit('family_joined_successfully', { code: data.code });
        
        // Broadcast updated player list to the room
        io.to(data.code).emit('family_lobby_update', room.players.map(p => ({ name: p.name, isReady: true })));
    });

    socket.on('leave_family_room', () => {
        handleFamilyDisconnect(socket);
    });

    socket.on('host_start_family_game', () => {
        const room = familyRooms[socket.currentFamilyRoom];
        if (!room || room.host !== socket.id) return;
        if (room.players.length < 3) {
            socket.emit('family_join_error', "Need at least 3 crew members to launch.");
            return;
        }
        startFamilyRound(room);
    });

    function startFamilyRound(room) {
        // 1. Reset round data
        room.players.forEach(p => {
            p.role = "vanguard"; // default
            p.triviaVote = null;
            p.accuseVote = null;
            p.roundScore = 0;
        });

        // 2. Pick the Traitor randomly
        const traitorIndex = Math.floor(Math.random() * room.players.length);
        room.players[traitorIndex].role = "infiltrator";
        room.traitorId = room.players[traitorIndex].id;

        // 3. Tell each player their role privately
        room.players.forEach(p => {
            io.to(p.id).emit('family_assign_role', p.role);
        });

        // 4. Request a question from the host client to feed the server
        // Using the existing jeopardy request mechanic but isolating it to family room
        io.to(room.host).emit('request_question', { hostId: room.host }); 
        
        // Wait a few seconds for roles to sink in, then we expect the host to send 'start_round'
        // We will intercept it in a special family listener below.
    }

    // Since the client reuses the jeopardy request, we intercept it if they are in a family room
    socket.on('start_round', (qData) => {
        if (socket.currentFamilyRoom && familyRooms[socket.currentFamilyRoom]) {
            const room = familyRooms[socket.currentFamilyRoom];
            room.currentQuestion = qData;
            
            // Broadcast discussion phase
            io.to(room.code).emit('family_start_discussion', qData);

            // Set server timer for Discussion Phase (60s)
            setTimeout(() => {
                if(familyRooms[room.code]) startFamilyVotingPhase(room);
            }, 60000);
            
            return; // STOP IT from bleeding into Jeopardy
        }
        
        // ... (Existing Jeopardy start_round logic remains untouched above) ...
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

    function startFamilyVotingPhase(room) {
        // Send everyone into voting
        const safePlayers = room.players.map(p => ({ id: p.id, name: p.name }));
        io.to(room.code).emit('family_start_voting', { players: safePlayers });

        // Set Server Timer for Voting (20s)
        setTimeout(() => {
            if(familyRooms[room.code]) calculateFamilyResults(room);
        }, 20000);
    }

    socket.on('family_vote_trivia', (data) => {
        const room = familyRooms[socket.currentFamilyRoom];
        if(!room) return;
        const p = room.players.find(p => p.id === socket.id);
        if(p) p.triviaVote = data.answer;
    });

    socket.on('family_vote_accuse', (data) => {
        const room = familyRooms[socket.currentFamilyRoom];
        if(!room) return;
        const p = room.players.find(p => p.id === socket.id);
        if(p) p.accuseVote = data.accuseId;
    });

    function calculateFamilyResults(room) {
        if(!room.currentQuestion) return;
        
        let vanguardWon = true;
        let vanguardsCorrect = 0;
        let vanguardsTotal = 0;
        let traitorAccusedCount = 0;

        const traitor = room.players.find(p => p.id === room.traitorId);

        room.players.forEach(p => {
            if (p.role === "vanguard") {
                vanguardsTotal++;
                // Did Vanguard answer trivia right?
                if (p.triviaVote === room.currentQuestion.correct) vanguardsCorrect++;
                // Did Vanguard accuse the traitor?
                if (p.accuseVote === room.traitorId) traitorAccusedCount++;
            }
        });

        // The Infiltrator wins IF the majority of the Vanguards got the trivia WRONG
        if (vanguardsCorrect <= (vanguardsTotal / 2)) {
            vanguardWon = false;
        }

        // Calculate Scores
        room.players.forEach(p => {
            p.roundScore = 0;
            if (p.role === "vanguard") {
                if (vanguardWon) p.roundScore += 500; else p.roundScore -= 200; // Team objective
                if (p.accuseVote === room.traitorId) p.roundScore += 300; // Bonus for catching traitor
            } else {
                // Infiltrator scoring
                if (!vanguardWon) p.roundScore += 1000; // Successfully sabotaged the room
                else p.roundScore -= 500; // Failed
                
                // Bonus for slipping under the radar
                if (traitorAccusedCount === 0) p.roundScore += 500;
            }
            p.totalScore += p.roundScore;
            
            // Update Global Scores immediately
            globalScores[p.name] = Math.max(0, (globalScores[p.name] || 0) + p.roundScore);
        });

        const resultsPayload = {
            vanguardWonRound: vanguardWon,
            traitorName: traitor ? traitor.name : "Unknown",
            scores: room.players.map(p => ({
                name: p.name,
                roundScore: p.roundScore,
                wasTraitor: p.role === "infiltrator"
            }))
        };

        io.to(room.code).emit('family_round_results', resultsPayload);
    }

    socket.on('family_next_round', () => {
        const room = familyRooms[socket.currentFamilyRoom];
        if(room && room.host === socket.id) {
            startFamilyRound(room);
        }
    });

    function handleFamilyDisconnect(s) {
        if (s.currentFamilyRoom && familyRooms[s.currentFamilyRoom]) {
            const room = familyRooms[s.currentFamilyRoom];
            room.players = room.players.filter(p => p.id !== s.id);
            
            if (room.players.length === 0) {
                delete familyRooms[s.currentFamilyRoom];
            } else if (room.host === s.id) {
                // Host left, promote someone else or destroy room
                io.to(s.currentFamilyRoom).emit('family_join_error', "The Host disconnected. The room has collapsed.");
                delete familyRooms[s.currentFamilyRoom];
            } else {
                io.to(s.currentFamilyRoom).emit('family_lobby_update', room.players.map(p => ({ name: p.name, isReady: true })));
            }
        }
    }


    // ==========================================
    // DISCONNECT HANDLER (Master)
    // ==========================================
    socket.on('disconnect', () => {
        handleLeave(socket);
        handleFamilyDisconnect(socket);
    });
    
    socket.on('leave_jeopardy', () => handleLeave(socket));

    function handleLeave(s) {
        if (s.currentTugRoom && tugRooms[s.currentTugRoom]) {
            const room = tugRooms[s.currentTugRoom];
            const remainingPlayer = room.players.find(p => p.id !== s.id);
            io.to(s.currentTugRoom).emit('tug_game_over', { winner: remainingPlayer ? remainingPlayer.name : "Nobody", reason: "disconnect" });
            delete tugRooms[s.currentTugRoom];
        }
        if (s.currentArenaRoom && arenaRooms[s.currentArenaRoom]) {
            io.to(s.currentArenaRoom).emit('arena_game_over', { message: "Opponent disconnected. Match cancelled.", p1Result: 0, p2Result: 0 });
            delete arenaRooms[s.currentArenaRoom];
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

// --- JEOPARDY CORE FUNCTIONS ---
function startGame() {
    gameActive = true; currentRound = 0; goldenRound = Math.floor(Math.random() * (MAX_ROUNDS - 3)) + 3; 
    io.emit('game_starting'); setTimeout(nextRound, 2000);
}

function nextRound() {
    if (!gameActive) return;
    const alivePlayers = jeopardyPlayers.filter(p => !p.eliminated);
    if (alivePlayers.length <= 1 && jeopardyPlayers.length > 1) {
        if (alivePlayers.length === 1) endGameEarly(alivePlayers[0]); else handleGameOver(); return;
    }
    currentRound++;
    if (currentRound > MAX_ROUNDS) { handleGameOver(); return; }
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
            clearInterval(roundTimer); canBuzz = false;
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
                player.score -= (currentRound === goldenRound) ? 1000 : 250; player.streak = 0;
                if (player.score <= -1000) {
                    player.eliminated = true; io.to(player.id).emit('player_eliminated');
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
    gameActive = false; if (roundTimer) clearInterval(roundTimer);
    io.emit('receive_chat', { name: "SYSTEM", message: `Match over. ${winner.name} is the last one standing!` });
    handleGameOver();
}

function handleGameOver() {
    gameActive = false; readyPlayers.clear();
    jeopardyPlayers.sort((a,b) => b.score - a.score);
    const winner = jeopardyPlayers[0];
    let bountyClaimed = false;
    jeopardyPlayers.forEach(p => { if (p.id !== winner.id && p.globalWinStreak >= 2) bountyClaimed = true; });
    if (bountyClaimed && winner) { winner.bountyCollected = true; globalScores[winner.name] = (globalScores[winner.name] || 0) + 5000; }
    jeopardyPlayers.forEach(p => {
        if (p.id === winner.id) globalWinStreaks[p.name] = (globalWinStreaks[p.name] || 0) + 1; else globalWinStreaks[p.name] = 0;
    });
    io.emit('game_over', jeopardyPlayers);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log(`AAA SCORING SERVER LIVE ON PORT ${PORT}`); });
