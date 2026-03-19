/**
 * The Knowledge Portal - V4.3 AAA SERVER
 * MULTIPLAYER BRAIN: Handles Chat, Leaderboards, Jeopardy, Tug of War, THE ARENA, and THE 4 SQUARES.
 */

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');

app.use(express.static(path.join(__dirname, '/')));

// --- PERSISTENT DATABASE LOGIC ---
const DB_FILE = path.join(__dirname, 'database.json');
let globalScores = {}; 
let globalWinStreaks = {}; 

function loadDatabase() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            globalScores = data.scores || {};
            globalWinStreaks = data.streaks || {};
            console.log("✅ Database Loaded. Leaderboard Restored.");
        } catch(e) {
            console.error("🚨 DB Load Error:", e);
        }
    }
}

function saveDatabase() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify({ scores: globalScores, streaks: globalWinStreaks }), 'utf8');
    } catch (e) {
        console.error("🚨 DB Save Error:", e);
    }
}

// Load it when server starts
loadDatabase();


// --- MASTER DATA ---
let jeopardyPlayers = [];
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

// --- 🚀 THE 4 SQUARES (FAMILY GAME) STATE 🚀 ---
let sqRooms = {};

// Helper: Generate Random 4-Digit Code
function generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// ---------------------------------------------------------
// 🚀 THE 4 SQUARES DEDUCTION DATABASE 🚀
// ---------------------------------------------------------
const fourSquaresData = [
    {
        answer: "Master Fard Muhammad",
        options: ["The Honorable Elijah Muhammad", "Master Fard Muhammad", "Marcus Garvey", "Noble Drew Ali"],
        clues: [
            "IMG:cinematic_vintage_1930s_passenger_airplane_dark_moody",
            "IMG:detroit_skyline_black_and_white_vintage_photography",
            "TEXT:1930",
            "IMG:dark_chalkboard_with_complex_physics_equations_cinematic"
        ]
    },
    {
        answer: "The Pig (Swine)",
        options: ["The Catfish", "The Cow", "The Pig (Swine)", "The Crow"],
        clues: [
            "IMG:muddy_swamp_dark_cinematic",
            "TEXT:1/3 Cat, 1/3 Rat, 1/3 Dog",
            "IMG:poisonous_toxin_bottle_glowing_green",
            "TEXT:Scavenger"
        ]
    },
    {
        answer: "6 Sextillion Tons",
        options: ["6 Sextillion Tons", "10 Billion Tons", "196,940,000 Tons", "1 Trillion Tons"],
        clues: [
            "IMG:massive_planet_earth_floating_in_dark_space",
            "TEXT:Weight",
            "IMG:heavy_metal_scale_cinematic",
            "TEXT:21 Ciphers"
        ]
    },
    {
        answer: "The Moon",
        options: ["The Sun", "The Moon", "The Stars", "Island of Pelan"],
        clues: [
            "IMG:massive_explosion_in_space_cinematic",
            "TEXT:66 Trillion Years Ago",
            "IMG:ocean_tides_crashing_at_night",
            "TEXT:Separation"
        ]
    },
    {
        answer: "24,896 Miles",
        options: ["25,000 Miles", "196,940,000 Miles", "24,896 Miles", "93,000,000 Miles"],
        clues: [
            "IMG:equator_line_glowing_around_earth",
            "TEXT:Circumference",
            "IMG:measuring_tape_wrapping_a_globe",
            "TEXT:Mathematical Fact"
        ]
    },
    {
        answer: "Speed of Sound",
        options: ["Speed of Light", "Speed of Sound", "Rotation of Earth", "Speed of Thought"],
        clues: [
            "IMG:soundwave_frequency_glowing_blue_neon",
            "TEXT:1,120",
            "TEXT:Feet Per Second",
            "IMG:jet_breaking_the_sound_barrier_cinematic"
        ]
    },
    {
        answer: "Yacub",
        options: ["Elijah", "Fard", "Yacub", "Nimrod"],
        clues: [
            "IMG:scientist_looking_through_microscope_cinematic",
            "TEXT:Big Head",
            "IMG:island_in_the_middle_of_the_ocean_dark_moody",
            "TEXT:600 Years"
        ]
    },
    {
        answer: "The Navy Bean",
        options: ["The Pinto Bean", "The Lima Bean", "The Navy Bean", "The Lentil"],
        clues: [
            "IMG:hot_bowl_of_bean_soup_cinematic_lighting",
            "TEXT:Prescribed",
            "IMG:golden_wheat_bread_loaf",
            "TEXT:Prolong Life"
        ]
    },
    {
        answer: "Mosque Maryam",
        options: ["Mosque No. 1", "Mosque Maryam", "The Salaam Restaurant", "The National House"],
        clues: [
            "IMG:beautiful_mosque_dome_cinematic_lighting",
            "TEXT:Chicago",
            "IMG:headquarters_building_blueprint",
            "TEXT:Stony Island Ave"
        ]
    },
    {
        answer: "Red, Sun, Moon, Star",
        options: ["Red, Black, Green", "Red, Sun, Moon, Star", "Crescent and Star", "White and Gold"],
        clues: [
            "TEXT:Freedom",
            "TEXT:Justice",
            "TEXT:Equality",
            "IMG:solid_red_background_with_shadows"
        ]
    }
];

// ---------------------------------------------------------
// SERVER-SIDE FULL QUIZ DATA FOR JEOPARDY & ARENA FIX
// ---------------------------------------------------------
const quizData = {
    kids: { 
        easy: [ 
            { question: "What does the word 'Islam' mean?", options: ["War", "Peace", "Power"], correct: "Peace" }, 
            { question: "What is the greeting of peace used in the Nation of Islam?", options: ["Hello", "As-Salaam Alaikum", "Good Morning"], correct: "As-Salaam Alaikum" }, 
            { question: "Who was the teacher of the Honorable Elijah Muhammad?", options: ["Master Fard Muhammad", "Malcolm X", "Marcus Garvey"], correct: "Master Fard Muhammad" }, 
            { question: "In what city was the Nation of Islam founded?", options: ["Chicago", "Detroit", "New York"], correct: "Detroit" }, 
            { question: "What color is the flag of Islam?", options: ["Red, White, and Blue", "Solid Red with a White Sun, Moon, and Star", "Green and Black"], correct: "Solid Red with a White Sun, Moon, and Star" },
            { question: "Who is the Supreme Being in the Nation of Islam?", options: ["Allah", "The President", "The Mayor"], correct: "Allah" }
        ],
        medium: [
            { question: "How many meals a day does the Honorable Elijah Muhammad teach us to eat?", options: ["Three meals a day", "One meal a day", "Five small meals"], correct: "One meal a day" }, 
            { question: "What animal are we taught never to eat because it is a scavenger?", options: ["Cow", "Chicken", "The Pig (Swine)"], correct: "The Pig (Swine)" }
        ]
    },
    lessons: {
        hard: [
            { question: "On the flag of Islam, what does the Sun represent?", options: ["Freedom", "Justice", "Equality"], correct: "Freedom" }, 
            { question: "On the flag of Islam, what does the Star represent?", options: ["Justice", "Power", "Wealth"], correct: "Justice" }
        ],
        extreme: [
            { question: "What is the mathematical meaning of the word 'Allah'?", options: ["Arm, Leg, Leg, Arm, Head", "The Supreme Being", "Peace and Power"], correct: "Arm, Leg, Leg, Arm, Head" }
        ]
    }
};

function trueShuffle(array) {
    return [...array]
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id);

    // ==========================================
    // 1. GLOBAL LOBBY & ACCOUNTS
    // ==========================================
    socket.on('join_game', (data) => {
        socket.userName = data.name;
        // Keep the highest score to prevent accidental overwrites
        globalScores[data.name] = Math.max((globalScores[data.name] || 0), data.points || 0);
        if (!globalWinStreaks[data.name]) globalWinStreaks[data.name] = 0;
        saveDatabase();
    });

    socket.on('update_global_score', (data) => {
        globalScores[data.name] = Math.max((globalScores[data.name] || 0), data.points);
        saveDatabase();
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
    // 2. THE ARENA (High Stakes Duel) - FIXED
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
            // Pick ONE exact question for the arena server-side so both see the same
            let deepCuts = [];
            for (let path in quizData) {
                if (path !== 'adults' && path !== 'actualfacts') {
                    if (quizData[path].hard) deepCuts = deepCuts.concat(quizData[path].hard);
                    if (quizData[path].extreme) deepCuts = deepCuts.concat(quizData[path].extreme);
                }
            }
            if (deepCuts.length === 0) deepCuts = quizData['kids']['easy']; // Fallback
            deepCuts = trueShuffle(deepCuts);
            room.question = deepCuts[0];

            io.to(socket.currentArenaRoom).emit('arena_start_question', {
                p1Name: room.players[0].name, p1Wager: room.players[0].wager,
                p2Name: room.players[1].name, p2Wager: room.players[1].wager,
                question: room.question
            });
        }
    });

    socket.on('arena_answer', (data) => {
        const roomID = socket.currentArenaRoom;
        const room = arenaRooms[roomID];
        if (!room || room.players.length < 2) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) player.answer = data.correct; 

        // If both have answered, calculate the payout!
        if (room.players[0].answer !== null && room.players[1].answer !== null) {
            let p1 = room.players[0];
            let p2 = room.players[1];
            
            let resultData = { p1Name: p1.name, p2Name: p2.name, p1Result: 0, p2Result: 0, message: "" };

            if (p1.answer && !p2.answer) {
                resultData.p1Result = p2.wager;
                resultData.p2Result = -p2.wager;
                resultData.message = `${p1.name} crushed ${p2.name} and stole their wager!`;
            } else if (p2.answer && !p1.answer) {
                resultData.p2Result = p1.wager;
                resultData.p1Result = -p1.wager;
                resultData.message = `${p2.name} crushed ${p1.name} and stole their wager!`;
            } else if (p1.answer && p2.answer) {
                resultData.message = "STALEMATE! Both warriors survived. No points lost.";
            } else {
                resultData.p1Result = -p1.wager;
                resultData.p2Result = -p2.wager;
                resultData.message = "DOUBLE KO! Both were incorrect and lost their bets.";
            }

            globalScores[p1.name] = Math.max(0, (globalScores[p1.name] || 0) + resultData.p1Result);
            globalScores[p2.name] = Math.max(0, (globalScores[p2.name] || 0) + resultData.p2Result);
            saveDatabase();

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
    // 4. LIVE JEOPARDY LOGIC - FIXED SERVER SIDE
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

    // ==========================================
    // 🚀 5. THE 4 SQUARES LOGIC (HOST SAFETY NET INCLUDED)
    // ==========================================
    
    socket.on('sq_create_room', (data) => {
        const code = generateRoomCode();
        sqRooms[code] = {
            host: socket.id, 
            code: code,
            players: [{ id: socket.id, name: data.name, score: 0, answer: null }],
            round: 0,
            maxRounds: 5,
            currentPuzzle: null,
            timer: null
        };
        socket.join(code);
        socket.currentSqRoom = code;
        socket.emit('sq_room_created', code);
    });

    socket.on('sq_join_room', (data) => {
        const room = sqRooms[data.code];
        if (!room) {
            socket.emit('sq_join_error', "Table code not found.");
            return;
        }
        if (room.round > 0) {
            socket.emit('sq_join_error', "Game already in progress.");
            return;
        }
        if (room.players.find(p => p.id === socket.id)) return; 
        
        room.players.push({ id: socket.id, name: data.name, score: 0, answer: null });
        socket.join(data.code);
        socket.currentSqRoom = data.code;
        socket.emit('sq_joined_successfully', { code: data.code });
        
        io.to(data.code).emit('sq_lobby_update', room.players.map(p => ({ name: p.name })));
    });

    socket.on('sq_leave_room', () => {
        handleSqDisconnect(socket);
    });

    socket.on('sq_start_game', () => {
        const room = sqRooms[socket.currentSqRoom];
        if(!room || room.host !== socket.id) return;
        
        room.round = 0;
        room.players.forEach(p => { p.score = 0; p.answer = null; });
        startSqRound(room);
    });

    function startSqRound(room) {
        room.round++;
        if(room.round > room.maxRounds) {
            endSqGame(room);
            return;
        }

        room.players.forEach(p => p.answer = null);
        const puzzle = fourSquaresData[Math.floor(Math.random() * fourSquaresData.length)];
        room.currentPuzzle = puzzle;

        const payload = {
            round: room.round,
            maxRounds: room.maxRounds,
            clues: trueShuffle(puzzle.clues), 
            options: trueShuffle(puzzle.options)
        };

        io.to(room.code).emit('sq_start_round', payload);

        room.timer = setTimeout(() => {
            evaluateSqRound(room);
        }, 20000); 
    }

    socket.on('sq_submit_answer', (data) => {
        const room = sqRooms[socket.currentSqRoom];
        if(!room || !room.currentPuzzle) return;
        
        const p = room.players.find(p => p.id === socket.id);
        if(p) p.answer = data.answer;

        if(room.players.every(pl => pl.answer !== null)) {
            clearTimeout(room.timer);
            evaluateSqRound(room);
        }
    });

    function evaluateSqRound(room) {
        room.players.forEach(p => {
            if (p.answer === room.currentPuzzle.answer) {
                p.score += 1000;
                io.to(p.id).emit('sq_round_results', { correctAnswer: room.currentPuzzle.answer, iGotItRight: true });
            } else {
                p.score -= 250;
                io.to(p.id).emit('sq_round_results', { correctAnswer: room.currentPuzzle.answer, iGotItRight: false });
            }
        });

        setTimeout(() => {
            startSqRound(room);
        }, 5000); 
    }

    function endSqGame(room) {
        room.players.sort((a,b) => b.score - a.score);
        const winner = room.players[0];

        const payload = {
            winnerName: winner ? winner.name : "Nobody",
            scores: room.players.map(p => ({ name: p.name, score: p.score }))
        };

        io.to(room.code).emit('sq_game_over', payload);
        delete sqRooms[room.code];
    }

    function handleSqDisconnect(s) {
        if (s.currentSqRoom && sqRooms[s.currentSqRoom]) {
            const room = sqRooms[s.currentSqRoom];
            room.players = room.players.filter(p => p.id !== s.id);
            
            if (room.host === s.id) {
                // 🚨 HOST LEFT - DESTROY ROOM & KICK EVERYONE OUT OF FREEZE 🚨
                io.to(s.currentSqRoom).emit('sq_host_left');
                delete sqRooms[s.currentSqRoom];
            } else if (room.players.length === 0) {
                delete sqRooms[s.currentSqRoom];
            } else {
                io.to(s.currentSqRoom).emit('sq_lobby_update', room.players.map(p => ({ name: p.name })));
            }
        }
    }


    // ==========================================
    // DISCONNECT HANDLER (Master)
    // ==========================================
    socket.on('disconnect', () => {
        handleLeave(socket);
        handleSqDisconnect(socket);
    });
    
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
    
    // 🚨 FIXED: JEOPARDY QUESTION IS NOW GENERATED ENTIRELY SERVER-SIDE 🚨
    const categories = ['kids', 'teens', 'training', 'lessons', 'health']; 
    const diffs = ['easy', 'medium', 'hard', 'extreme'];
    
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const randomDiff = diffs[Math.floor(Math.random() * diffs.length)];
    
    let questions = quizData[randomCat] ? quizData[randomCat][randomDiff] : quizData['kids']['easy'];
    if (!questions) questions = quizData['kids']['easy']; // safety fallback

    let randomQ = questions[Math.floor(Math.random() * questions.length)];
    randomQ.categoryTitle = randomCat.toUpperCase();
    
    currentCorrectAnswer = randomQ.correct;
    const isGolden = (currentRound === goldenRound);
    
    if (isGolden) {
        io.emit('golden_alert');
        setTimeout(() => {
            if (!gameActive) return;
            io.emit('announce_category', { ...randomQ, isGolden: true });
            setTimeout(() => {
                if (!gameActive) return;
                io.emit('new_question', randomQ);
                questionStartTime = Date.now();
                canBuzz = true;
                startBuzzTimer(15);
            }, 4000);
        }, 4000); 
    } else {
        io.emit('announce_category', { ...randomQ, isGolden: false });
        setTimeout(() => {
            if (!gameActive) return;
            io.emit('new_question', randomQ);
            questionStartTime = Date.now();
            canBuzz = true;
            startBuzzTimer(15);
        }, 4000);
    }
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
    
    saveDatabase(); // Save results to disk
    io.emit('game_over', jeopardyPlayers);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log(`AAA SCORING SERVER LIVE ON PORT ${PORT}`); });
