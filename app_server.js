/**
 * The Knowledge Portal - V4.3 AAA SERVER
 * MULTIPLAYER BRAIN: Handles Chat, Leaderboards, Jeopardy, Tug of War, THE ARENA, and THE BLUEPRINT COLLECTION.
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

// --- 🚀 THE BLUEPRINT COLLECTION (FAMILY GAME) STATE 🚀 ---
let bpRooms = {};

// Helper: Generate Random 4-Digit Code
function generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// ---------------------------------------------------------
// FULL MASSIVE QUESTION DATABASE (FOR SERVER-SIDE DRAWS)
// ---------------------------------------------------------
const quizData = {
    kids: { 
        easy: [ 
            { question: "What does the word 'Islam' mean?", options: ["War", "Peace", "Power"], correct: "Peace" }, 
            { question: "What is the greeting of peace used in the Nation of Islam?", options: ["Hello", "As-Salaam Alaikum", "Good Morning"], correct: "As-Salaam Alaikum" }, 
            { question: "Who was the teacher of the Honorable Elijah Muhammad?", options: ["Master Fard Muhammad", "Malcolm X", "Marcus Garvey"], correct: "Master Fard Muhammad" }, 
            { question: "In what city was the Nation of Islam founded?", options: ["Chicago", "Detroit", "New York"], correct: "Detroit" }, 
            { question: "What color is the flag of Islam?", options: ["Red, White, and Blue", "Solid Red with a White Sun, Moon, and Star", "Green and Black"], correct: "Solid Red with a White Sun, Moon, and Star" },
            { question: "Who is the Supreme Being in the Nation of Islam?", options: ["Allah", "The President", "The Mayor"], correct: "Allah" },
            { question: "What month is Saviours' Day celebrated?", options: ["December", "February", "July"], correct: "February" },
            { question: "What does the word 'Muslim' mean?", options: ["One who fights", "One who submits to the will of God", "One who reads a lot"], correct: "One who submits to the will of God" },
            { question: "What instrument does the Honorable Minister Louis Farrakhan play?", options: ["The Drums", "The Piano", "The Violin"], correct: "The Violin" },
            { question: "What is the best and only drink we should have between meals?", options: ["Soda", "Juice", "Water"], correct: "Water" }
        ], 
        medium: [ 
            { question: "How many meals a day does the Honorable Elijah Muhammad teach us to eat?", options: ["Three meals a day", "One meal a day", "Five small meals"], correct: "One meal a day" }, 
            { question: "What animal are we taught never to eat because it is a scavenger?", options: ["Cow", "Chicken", "The Pig (Swine)"], correct: "The Pig (Swine)" }, 
            { question: "What is the name of the official newspaper of the Nation of Islam?", options: ["The Final Call", "The Daily News", "The Messenger"], correct: "The Final Call" }, 
            { question: "Who is the current National Representative of the Nation of Islam?", options: ["Malcolm X", "The Honorable Minister Louis Farrakhan", "Muhammad Ali"], correct: "The Honorable Minister Louis Farrakhan" }, 
            { question: "What is the holy book of Islam?", options: ["The Holy Qur'an", "The Dictionary", "The Encyclopedia"], correct: "The Holy Qur'an" },
            { question: "Who was the wife of the Honorable Elijah Muhammad?", options: ["Mother Clara Muhammad", "Rosa Parks", "Coretta Scott King"], correct: "Mother Clara Muhammad" },
            { question: "What day of the week is our main congregational meeting?", options: ["Friday", "Saturday", "Sunday"], correct: "Sunday" },
            { question: "What do the letters N.O.I. stand for?", options: ["National Organization of Intelligence", "Nation of Islam", "New Order of Islam"], correct: "Nation of Islam" },
            { question: "What is the name of the school system established by the NOI?", options: ["Public School 1", "Muhammad University of Islam", "The Crescent Academy"], correct: "Muhammad University of Islam" },
            { question: "What city was the Honorable Elijah Muhammad born in?", options: ["Atlanta, Georgia", "Sandersville, Georgia", "Macon, Georgia"], correct: "Sandersville, Georgia" }
        ], 
        hard: [ 
            { question: "On the flag of Islam, what does the Sun represent?", options: ["Freedom", "Justice", "Equality"], correct: "Freedom" }, 
            { question: "On the flag of Islam, what does the Star represent?", options: ["Justice", "Power", "Wealth"], correct: "Justice" }, 
            { question: "On the flag of Islam, what does the Moon represent?", options: ["Sleep", "Equality", "Tides"], correct: "Equality" }, 
            { question: "In what year did Master Fard Muhammad make Himself known in North America?", options: ["1920", "1930", "1955"], correct: "1930" }, 
            { question: "What city is recognized as the headquarters of the Nation of Islam today?", options: ["Detroit", "Atlanta", "Chicago"], correct: "Chicago" },
            { question: "How many years did Master Fard Muhammad teach the Honorable Elijah Muhammad in person?", options: ["10 years", "3 and a half years", "1 year"], correct: "3 and a half years" },
            { question: "What was the Honorable Minister Louis Farrakhan's calypso singing name?", options: ["The Calypso King", "The Charmer", "The Star"], correct: "The Charmer" },
            { question: "What is the name of the NOI's main mosque in Chicago?", options: ["Mosque Maryam", "Mosque No. 1", "The Grand Mosque"], correct: "Mosque Maryam" },
            { question: "In what year did the Honorable Minister Louis Farrakhan join the Nation of Islam?", options: ["1955", "1965", "1975"], correct: "1955" },
            { question: "What does the 'White' in the Flag of Islam represent?", options: ["Clouds", "Purity and Truth", "Peace"], correct: "Purity and Truth" }
        ],
        extreme: [
            { question: "What is the mathematical meaning of the word 'Allah'?", options: ["Arm, Leg, Leg, Arm, Head", "The Supreme Being", "Peace and Power"], correct: "Arm, Leg, Leg, Arm, Head" },
            { question: "How many languages did Master Fard Muhammad speak perfectly?", options: ["10 Languages", "5 Languages", "16 Languages"], correct: "16 Languages" },
            { question: "What year was the Honorable Elijah Muhammad born?", options: ["1897", "1910", "1930"], correct: "1897" },
            { question: "Who was the first person to accept the teachings of Master Fard Muhammad?", options: ["The Honorable Elijah Muhammad", "Mother Clara Muhammad", "Malcolm X"], correct: "Mother Clara Muhammad" },
            { question: "What was the exact date the Honorable Elijah Muhammad was born?", options: ["October 7, 1897", "February 26, 1897", "July 4, 1897"], correct: "October 7, 1897" },
            { question: "What does the word 'orthodox' mean when referring to Orthodox Islam?", options: ["Strict", "Standard or conventional", "Ancient"], correct: "Standard or conventional" },
            { question: "What is the literal translation of the Arabic word 'Quran'?", options: ["The Holy Book", "The Divine Law", "That which is to be read"], correct: "That which is to be read" },
            { question: "Which prominent figure said 'Elijah Muhammad is the man who taught me that I am somebody'?", options: ["Malcolm X", "Muhammad Ali", "Louis Farrakhan"], correct: "Muhammad Ali" },
            { question: "In what year did Mother Clara Muhammad establish the University of Islam?", options: ["1934", "1940", "1950"], correct: "1934" },
            { question: "What was the name of the organization established by Wallace D. Fard before it became the Nation of Islam?", options: ["Allah's Temple of Islam", "The Moorish Science Temple", "The Black Panther Party"], correct: "Allah's Temple of Islam" }
        ]
    },
    teens: { 
        easy: [ 
            { question: "What is the core meaning of the concept 'Do For Self'?", options: ["Working for others", "Building our own schools, farms, and businesses", "Waiting for help"], correct: "Building our own schools, farms, and businesses" }, 
            { question: "Knowledge of ___ is the first step to success.", options: ["Money", "Self", "Science"], correct: "Self" }, 
            { question: "According to the teachings, what is the root meaning of the word 'Black'?", options: ["Empty space", "The source of all things / Original", "Darkness"], correct: "The source of all things / Original" },
            { question: "What is the ultimate goal of 'Do For Self'?", options: ["To make a lot of money", "Independence and self-reliance", "To be famous"], correct: "Independence and self-reliance" },
            { question: "Who gave Malcolm X his 'X'?", options: ["He chose it himself", "The Honorable Elijah Muhammad", "Master Fard Muhammad"], correct: "The Honorable Elijah Muhammad" },
            { question: "What was the original name of the Honorable Minister Louis Farrakhan?", options: ["Louis Eugene Walcott", "Louis Shabazz", "Louis Smith"], correct: "Louis Eugene Walcott" },
            { question: "What did the Honorable Elijah Muhammad say is the key to our salvation?", options: ["Going to college", "Unity and Knowledge of Self", "Moving to another country"], correct: "Unity and Knowledge of Self" },
            { question: "What is the primary message behind the phrase 'Up You Mighty Nation'?", options: ["We can accomplish what we will", "We must move to Africa", "We should fight back"], correct: "We can accomplish what we will" },
            { question: "What is the significance of the crescent moon in Islamic symbolism?", options: ["It represents the night", "It represents equality and new beginnings", "It represents space travel"], correct: "It represents equality and new beginnings" },
            { question: "What is the focus of the '10,000 Fearless'?", options: ["To stand between the gangs and stop violence", "To join the military", "To travel the world"], correct: "To stand between the gangs and stop violence" }
        ], 
        medium: [ 
            { question: "Who wrote the book 'Message to the Blackman in America'?", options: ["Marcus Garvey", "The Honorable Elijah Muhammad", "Malcolm X"], correct: "The Honorable Elijah Muhammad" }, 
            { question: "True wealth in the Nation of Islam is measured by having what?", options: ["Fast cars and jewelry", "Health, Knowledge, and Land", "Fame on social media"], correct: "Health, Knowledge, and Land" }, 
            { question: "What was the original name of the Honorable Elijah Muhammad before he met Master Fard Muhammad?", options: ["Elijah Poole", "Elijah Shabazz", "Elijah X"], correct: "Elijah Poole" }, 
            { question: "What major historical event did Minister Farrakhan lead on October 16, 1995?", options: ["The March on Washington", "The Million Man March", "The Civil Rights March"], correct: "The Million Man March" },
            { question: "What does the 'X' in a Muslim's name mean?", options: ["A Roman numeral for 10", "An unknown variable replacing the slave name", "Extreme"], correct: "An unknown variable replacing the slave name" },
            { question: "How many people attended the Million Man March?", options: ["100,000", "500,000", "Over one million men"], correct: "Over one million men" },
            { question: "What is the economic program introduced by the Honorable Elijah Muhammad called?", options: ["The Three Year Economic Plan", "The National Economic Blueprint", "The Wealth Program"], correct: "The National Economic Blueprint" },
            { question: "What does the term 'Tricknology' refer to?", options: ["Advanced computers", "Lies, deceit, and manipulation used by the enemy", "A type of magic"], correct: "Lies, deceit, and manipulation used by the enemy" },
            { question: "Who was appointed by the Honorable Elijah Muhammad as his first National Representative?", options: ["Malcolm X", "Muhammad Ali", "Louis Farrakhan"], correct: "Malcolm X" },
            { question: "In what city did Minister Farrakhan first lead as the Minister?", options: ["Chicago, Mosque No. 2", "Boston, Mosque No. 11", "New York, Mosque No. 7"], correct: "Boston, Mosque No. 11" }
        ], 
        hard: [ 
            { question: "In what year was the Honorable Minister Louis Farrakhan born?", options: ["1933", "1940", "1925"], correct: "1933" }, 
            { question: "What is the title of the book written by Minister Farrakhan that acts as a guiding light for the country?", options: ["A Torchlight for America", "The Divine Light", "Message to the Blackman"], correct: "A Torchlight for America" }, 
            { question: "What was the name of the original newspaper published by the Honorable Elijah Muhammad?", options: ["The Final Call", "Muhammad Speaks", "The Islamic News"], correct: "Muhammad Speaks" },
            { question: "In what year did the Honorable Elijah Muhammad depart this timeline?", options: ["1965", "1975", "1981"], correct: "1975" },
            { question: "What was the theme of the 20th Anniversary of the Million Man March?", options: ["The Millions More Movement", "Justice Or Else", "The Holy Day of Atonement"], correct: "Justice Or Else" },
            { question: "What was Minister Farrakhan's first assignment as a Minister?", options: ["New York, Mosque No. 7", "Boston, Mosque No. 11", "Chicago, Mosque No. 2"], correct: "Boston, Mosque No. 11" },
            { question: "Who was the founder of the Moorish Science Temple, preceding the NOI?", options: ["Marcus Garvey", "Noble Drew Ali", "Booker T. Washington"], correct: "Noble Drew Ali" },
            { question: "What year was 'Message to the Blackman in America' published?", options: ["1955", "1965", "1975"], correct: "1965" },
            { question: "What was the name of the airplane purchased by the NOI?", options: ["The Final Call Jet", "The Jet of Islam", "A Lockheed Jetstar (The 'Saviour')"], correct: "A Lockheed Jetstar (The 'Saviour')" },
            { question: "What year was the Million Woman March held?", options: ["1997", "1995", "2000"], correct: "1997" }
        ],
        extreme: [
            { question: "In what year did Minister Louis Farrakhan receive his Vision on the Mother Plane?", options: ["1975", "1985", "1995"], correct: "1985" },
            { question: "What was the original name of the foundational document for the Million Man March?", options: ["The Divine Blueprint", "Atonement, Reconciliation, and Responsibility", "Justice Or Else"], correct: "Atonement, Reconciliation, and Responsibility" },
            { question: "What year was the Final Call newspaper first published by Minister Farrakhan?", options: ["1979", "1985", "1990"], correct: "1979" },
            { question: "What specific vision did Minister Farrakhan receive on September 17, 1985?", options: ["The Million Man March", "The Vision on the Mother Plane in Tepotzlan, Mexico", "The rebuilding of Mosque Maryam"], correct: "The Vision on the Mother Plane in Tepotzlan, Mexico" },
            { question: "What year was the Nation of Islam's flagship farm in Georgia purchased?", options: ["1989", "1994", "2000"], correct: "1994" },
            { question: "What was the overarching theme of the 10th Anniversary of the Million Man March in 2005?", options: ["The Millions More Movement", "Justice Or Else", "Day of Atonement"], correct: "The Millions More Movement" },
            { question: "In what year did Minister Farrakhan complete his World Tour spanning over 40 nations?", options: ["1996", "1990", "2000"], correct: "1996" },
            { question: "Which of the following was a renowned musical composition by Minister Louis Farrakhan?", options: ["Let Us Make Man", "The Awakening", "The Divine Light"], correct: "Let Us Make Man" },
            { question: "What is the exact date of Minister Farrakhan's birth?", options: ["May 11, 1933", "October 7, 1933", "February 26, 1933"], correct: "May 11, 1933" },
            { question: "What is the significance of the year 1977 in NOI history?", options: ["Minister Farrakhan stood up to rebuild the work of Elijah Muhammad", "The Final Call was published", "Mosque Maryam was purchased"], correct: "Minister Farrakhan stood up to rebuild the work of Elijah Muhammad" }
        ]
    },
    training: { 
        easy: [ 
            { question: "What does F.O.I. stand for?", options: ["Force of Intelligence", "Fruit of Islam", "Foundation of Islam"], correct: "Fruit of Islam" }, 
            { question: "What does M.G.T. & G.C.C. stand for?", options: ["Muslim Girls Training & General Civilization Class", "Mothers Guiding Teens & Girls Class", "Muslim Group Training"], correct: "Muslim Girls Training & General Civilization Class" }, 
            { question: "What color is the official M.G.T. uniform often seen in?", options: ["White", "Red", "Black"], correct: "White" }, 
            { question: "What is the primary duty of the F.O.I.?", options: ["To protect the Nation and uphold the laws of Islam", "To travel the world", "To work in factories"], correct: "To protect the Nation and uphold the laws of Islam" }, 
            { question: "What are the men in the Nation of Islam trained to respect and protect above all else?", options: ["Money", "The Black Woman", "Cars"], correct: "The Black Woman" },
            { question: "What day of the week is F.O.I. class?", options: ["Monday", "Wednesday", "Friday"], correct: "Monday" },
            { question: "What day of the week is M.G.T. class?", options: ["Tuesday", "Thursday", "Saturday"], correct: "Saturday" }, 
            { question: "What color are the F.O.I. uniforms usually?", options: ["White suits", "Navy Blue / Dark suits", "Khaki suits"], correct: "Navy Blue / Dark suits" },
            { question: "Who are the F.O.I. trained to obey?", options: ["Themselves", "Those in authority over them", "The military"], correct: "Those in authority over them" },
            { question: "What is the key element of F.O.I. and M.G.T. training?", options: ["Physical strength", "Strict Discipline", "Financial wealth"], correct: "Strict Discipline" }
        ], 
        medium: [ 
            { question: "How many specific Training Units are there in the M.G.T.?", options: ["5", "7", "10"], correct: "7" }, 
            { question: "Which of the following is ONE of the 7 Training Units of the M.G.T.?", options: ["How to build cars", "How to sew", "How to code computers"], correct: "How to sew" }, 
            { question: "Which of the following is another of the 7 Training Units of the M.G.T.?", options: ["How to cook", "How to pilot an airplane", "How to box"], correct: "How to cook" }, 
            { question: "What is the standard uniform for the F.O.I.?", options: ["A tracksuit", "A sharp suit and a bow tie", "Jeans and a t-shirt"], correct: "A sharp suit and a bow tie" }, 
            { question: "In the M.G.T. classes, what does the 'General Civilization Class' teach?", options: ["How to act at home and abroad", "How to build cities", "How to speak foreign languages"], correct: "How to act at home and abroad" },
            { question: "What is the first training unit of the M.G.T.?", options: ["How to cook", "How to keep house", "How to rear children"], correct: "How to keep house" },
            { question: "What does G.C.C. stand for?", options: ["Girls Cooking Class", "General Civilization Class", "Global Citizen Center"], correct: "General Civilization Class" },
            { question: "What do the F.O.I. sell in the streets to spread the teachings?", options: ["Bean Pies", "The Final Call Newspaper", "Incense"], correct: "The Final Call Newspaper" },
            { question: "Which training unit teaches sisters how to care for their spouses?", options: ["How to take care of their husbands", "How to sew", "How to act abroad"], correct: "How to take care of their husbands" },
            { question: "What is the minimum age to be classified as a Junior M.G.T.?", options: ["12", "15", "18"], correct: "15" }
        ], 
        hard: [ 
            { question: "Who is recognized as the Supreme Captain of the F.O.I.?", options: ["Brother Jabril Muhammad", "The Honorable Elijah Muhammad", "Brother Raymond Sharrieff"], correct: "The Honorable Elijah Muhammad" }, 
            { question: "Who is the Supreme Captain under the Honorable Minister Louis Farrakhan today?", options: ["Brother Ishmael Muhammad", "Brother Mustapha Farrakhan", "Brother Nuri Muhammad"], correct: "Brother Mustapha Farrakhan" }, 
            { question: "Who was the first Captain of the M.G.T. appointed by Master Fard Muhammad?", options: ["Sister Clara Muhammad", "Sister Mother Tynnetta", "Sister Ava Muhammad"], correct: "Sister Clara Muhammad" }, 
            { question: "What is the primary purpose of the 'General Orders' given to the F.O.I.?", options: ["To memorize poetry", "To maintain strict military bearing, discipline, and alertness", "To learn how to farm"], correct: "To maintain strict military bearing, discipline, and alertness" }, 
            { question: "The discipline of the FOI and MGT is designed to strip away the habits of what?", options: ["The Original Nation", "The 6,000 year rule of the Caucasian", "The ancient Egyptians"], correct: "The 6,000 year rule of the Caucasian" },
            { question: "Who was the first Supreme Captain appointed by the Honorable Elijah Muhammad?", options: ["Raymond Sharrieff", "John Ali", "Elijah Muhammad Jr."], correct: "Raymond Sharrieff" },
            { question: "Which training unit specifically covers behavior in public?", options: ["Unit 3", "Unit 5: How to act at home and abroad", "Unit 7"], correct: "Unit 5: How to act at home and abroad" },
            { question: "What is the highest rank an F.O.I. can achieve locally in a Mosque?", options: ["Lieutenant", "Student Captain", "General"], correct: "Student Captain" },
            { question: "What does the military drill of the F.O.I. represent?", options: ["Unity, order, and acting as one body", "Preparing for physical war", "Exercise"], correct: "Unity, order, and acting as one body" },
            { question: "According to the teachings, who gave the M.G.T. their 7 training units?", options: ["Mother Clara Muhammad", "Master Fard Muhammad", "Minister Farrakhan"], correct: "Master Fard Muhammad" }
        ],
        extreme: [
            { question: "What does the 'Fruit' in Fruit of Islam symbolize?", options: ["Sweetness", "The finest and most productive of the Nation", "Farming"], correct: "The finest and most productive of the Nation" },
            { question: "Who authored the book 'The Cultural Revolution'?", options: ["Mother Tynnetta Muhammad", "Mother Clara Muhammad", "Minister Farrakhan"], correct: "Mother Tynnetta Muhammad" },
            { question: "In what year did the Honorable Elijah Muhammad institute the F.O.I.?", options: ["1930", "1933", "1955"], correct: "1933" },
            { question: "What year was the Muhammad University of Islam established?", options: ["1930", "1934", "1960"], correct: "1934" },
            { question: "Who was the legendary Supreme Captain of the F.O.I. that helped secure the Nation of Islam during its rapid growth?", options: ["Brother Raymond Sharrieff", "Brother John Ali", "Brother Jabril Muhammad"], correct: "Brother Raymond Sharrieff" },
            { question: "What is the exact quote regarding the 'Scavenger of the Sea'?", options: ["The shark and the whale", "The crab and the catfish", "The eel and the shrimp"], correct: "The crab and the catfish" },
            { question: "Who is recognized as the mother of the Nation of Islam?", options: ["Mother Clara Muhammad", "Mother Tynnetta Muhammad", "Sister Khadijah"], correct: "Mother Clara Muhammad" },
            { question: "What is the specific age range for the Junior Vanguard?", options: ["Ages 5 to 12", "Ages 13 to 19", "Ages 4 to 10"], correct: "Ages 5 to 12" },
            { question: "Which legendary figure was often referred to as the 'Saviour' in the early days of the Nation of Islam?", options: ["Master Fard Muhammad", "Elijah Muhammad", "Marcus Garvey"], correct: "Master Fard Muhammad" },
            { question: "What is the literal translation of the word 'Quran'?", options: ["That which is to be read", "The Holy Book", "The Divine Law"], correct: "That which is to be read" }
        ]
    },
    lessons: { 
        easy: [ 
            { question: "According to the lessons, who is the Maker, the Owner, the Cream of the planet Earth?", options: ["The Asiatic Black Man", "The Scientist Yacub", "The 10,000"], correct: "The Asiatic Black Man" }, 
            { question: "Who was the scientist that grafted the Caucasian race?", options: ["Elijah", "Yacub", "Fard"], correct: "Yacub" }, 
            { question: "According to the lessons, how old is the Black Nation?", options: ["6,000 years", "Without a birth record (Eternal)", "100,000 years"], correct: "Without a birth record (Eternal)" }, 
            { question: "In the lessons, what does the 'Wilderness of North America' refer to?", options: ["The forests in Canada", "The condition and society of the United States", "South America"], correct: "The condition and society of the United States" }, 
            { question: "How long was Yacub given to rule the Earth?", options: ["1,000 years", "6,000 years", "10,000 years"], correct: "6,000 years" },
            { question: "Who is the Original Man?", options: ["The Asiatic Black Man", "The American Indian", "The European"], correct: "The Asiatic Black Man" },
            { question: "Who is the colored man?", options: ["The African", "The Caucasian/Yacub's grafted devil", "The Asian"], correct: "The Caucasian/Yacub's grafted devil" },
            { question: "Who is the Father of Civilization?", options: ["The Asiatic Black Man", "The Greeks", "The Romans"], correct: "The Asiatic Black Man" },
            { question: "What is the population of the Colored People on Earth?", options: ["1 Billion", "400,000,000", "85 Million"], correct: "400,000,000" },
            { question: "How fast does sound travel?", options: ["1,120 feet per second", "186,000 miles per second", "100 miles per hour"], correct: "1,120 feet per second" }
        ], 
        medium: [ 
            { question: "Where did Yacub go to graft the new race of people?", options: ["The Island of Patmos (Pelan)", "Mecca", "Detroit"], correct: "The Island of Patmos (Pelan)" }, 
            { question: "How many people went with Yacub to the Island?", options: ["144,000", "59,999", "10,000"], correct: "59,999" }, 
            { question: "What was the scientific process Yacub used to create the Caucasian?", options: ["Cloning", "Strict birth control and grafting (separating the brown germ from the black)", "Evolution"], correct: "Strict birth control and grafting (separating the brown germ from the black)" }, 
            { question: "According to the Lessons, what is the Devil's greatest weapon?", options: ["Guns", "Money", "Tricknology (Lies and Deceit)"], correct: "Tricknology (Lies and Deceit)" }, 
            { question: "What is the area in square miles of the planet Earth?", options: ["100,000,000 square miles", "196,940,000 square miles", "57,255,000 square miles"], correct: "196,940,000 square miles" },
            { question: "How fast does light travel?", options: ["100,000 miles per second", "1,120 feet per second", "186,000 miles per second"], correct: "186,000 miles per second" },
            { question: "How far is the Earth from the Sun?", options: ["93,000,000 miles", "50,000,000 miles", "10,000,000 miles"], correct: "93,000,000 miles" },
            { question: "What is the total weight of the planet Earth?", options: ["10 billion tons", "1 trillion tons", "6 sextillion tons"], correct: "6 sextillion tons" },
            { question: "What is the exact square miles of useful land used every day?", options: ["57,255,000 square miles", "139,685,000 square miles", "196,940,000 square miles"], correct: "57,255,000 square miles" },
            { question: "According to the lessons, who is the 85%?", options: ["The civilized world", "The uncivilized people suffering from mental death", "The poor teachers"], correct: "The uncivilized people suffering from mental death" }
        ], 
        hard: [ 
            { question: "In the English Lesson No. C1, what is the name of the Uncle of Mr. W. F. Muhammad?", options: ["Trader Bates", "Trader John", "Trader Smith"], correct: "Trader Bates" }, 
            { question: "What is the mathematical circumference of the Earth at the Equator according to the lessons?", options: ["24,896 miles", "25,000 miles", "20,000 miles"], correct: "24,896 miles" }, 
            { question: "How deep is the Pacific Ocean according to the measurements in the lessons?", options: ["10 miles", "6 miles", "4 miles"], correct: "6 miles" }, 
            { question: "According to the lessons, what is the percentage of Original people on the Earth?", options: ["85%", "100%", "Approximately 90% (or 11/12ths)"], correct: "Approximately 90% (or 11/12ths)" }, 
            { question: "What is the science of breaking atoms into pieces referred to in the lessons regarding the moon?", options: ["Nuclear Fission", "The blasting of the moon from the earth 66 trillion years ago", "Gravity"], correct: "The blasting of the moon from the earth 66 trillion years ago" },
            { question: "What is the population of the Original Nation in the wilderness of North America?", options: ["17,000,000 plus 2,000,000 Indians", "30,000,000", "10,000,000"], correct: "17,000,000 plus 2,000,000 Indians" },
            { question: "How long did it take Yacub to graft the Caucasian race?", options: ["600 years", "6,000 years", "100 years"], correct: "600 years" },
            { question: "What is the distance from the Earth to the Moon?", options: ["100,000 miles", "237,000 miles", "93,000,000 miles"], correct: "237,000 miles" },
            { question: "How many tribes were in the Original Nation?", options: ["12 tribes", "13 tribes", "10 tribes"], correct: "13 tribes" },
            { question: "What is the fraction of the Earth that is covered by water?", options: ["1/2", "3/4", "7/10ths (or roughly 139 million sq miles)"], correct: "7/10ths (or roughly 139 million sq miles)" }
        ],
        extreme: [
            { question: "What is the exact weight of the planet Earth?", options: ["10 billion tons", "1 trillion tons", "6 sextillion tons"], correct: "6 sextillion tons" },
            { question: "What is the exact speed of sound in the lessons?", options: ["1,120 feet per second", "186,000 miles per second", "24 billion miles per second"], correct: "1,120 feet per second" },
            { question: "How many years did Yakub's grafted history last before the original man takes over?", options: ["1,000 years", "6,000 years", "10,000 years"], correct: "6,000 years" },
            { question: "Who is the 5% according to the 14th degree of the 1-40?", options: ["The poor, righteous Teachers", "The rich slave-makers", "The uncivilized people"], correct: "The poor, righteous Teachers" },
            { question: "How far is the Earth from the Moon?", options: ["100,000 miles", "237,000 miles", "93,000,000 miles"], correct: "237,000 miles" },
            { question: "How much useful land is used every day by the population of the Earth?", options: ["57,255,000 square miles", "196,940,000 square miles", "139,685,000 square miles"], correct: "57,255,000 square miles" },
            { question: "What is the exact population of the Original Nation all over the planet Earth in the original lessons?", options: ["1 Billion", "4,400,000,000", "85 Million"], correct: "4,400,000,000" },
            { question: "Where did Yacub go to graft the new race of people?", options: ["Mecca", "Detroit", "The Island of Patmos / Pelan"], correct: "The Island of Patmos / Pelan" },
            { question: "How many people went with Yacub to the Island?", options: ["59,999", "144,000", "10,000"], correct: "59,999" },
            { question: "What is the mathematical circumference of the Earth at the Equator according to the lessons?", options: ["20,000 miles", "24,896 miles", "25,000 miles"], correct: "24,896 miles" }
        ]
    },
    health: { 
        easy: [ 
            { question: "How many meals a day does the Honorable Elijah Muhammad prescribe for optimal health?", options: ["Three meals", "One meal a day", "Five small meals"], correct: "One meal a day" }, 
            { question: "What animal are believers strictly forbidden from eating because it is a scavenger?", options: ["The Cow", "The Chicken", "The Pig (Swine)"], correct: "The Pig (Swine)" }, 
            { question: "According to 'How to Eat to Live', what is the best bread to eat?", options: ["White Bread", "Whole Wheat Bread (Baked thoroughly)", "Cornbread"], correct: "Whole Wheat Bread (Baked thoroughly)" }, 
            { question: "What type of bean is highly recommended for consumption?", options: ["The Navy Bean", "The Pinto Bean", "The Black Bean"], correct: "The Navy Bean" }, 
            { question: "How long is a standard fast recommended to clear the body of disease?", options: ["12 Hours", "3 Days (72 Hours)", "1 Week"], correct: "3 Days (72 Hours)" },
            { question: "What is the most forbidden animal to eat?", options: ["Beef", "Lamb", "The Pig (Swine)"], correct: "The Pig (Swine)" },
            { question: "What should you drink between meals?", options: ["Soda", "Water", "Milk"], correct: "Water" },
            { question: "What is the main benefit of eating one meal a day?", options: ["Saving money", "Prolonging your life and preventing illness", "Losing weight fast"], correct: "Prolonging your life and preventing illness" },
            { question: "Are Muslims allowed to drink alcohol or use tobacco?", options: ["Yes, in moderation", "No, they are strictly forbidden", "Only on holidays"], correct: "No, they are strictly forbidden" },
            { question: "According to the teachings, what happens if you eat three meals a day?", options: ["You get stronger", "You wear out your digestive system early", "You digest food faster"], correct: "You wear out your digestive system early" }
        ], 
        medium: [ 
            { question: "Why are we taught to avoid eating scavenger fish like catfish?", options: ["They are too expensive", "They eat the filth and poison at the bottom of the water", "They are too hard to cook"], correct: "They eat the filth and poison at the bottom of the water" }, 
            { question: "Between meals, what is the only thing we are encouraged to consume if necessary?", options: ["A small snack", "Pure Water or Coffee/Milk with no sugar", "Fruit juice"], correct: "Pure Water or Coffee/Milk with no sugar" }, 
            { question: "What does the Honorable Elijah Muhammad say is the true cause of most of our ailments?", options: ["Bad genetics", "Eating too often and eating the wrong foods", "Lack of exercise"], correct: "Eating too often and eating the wrong foods" }, 
            { question: "How should foods, especially breads and meats, be prepared?", options: ["Rare or lightly cooked", "Fried quickly", "Baked thoroughly and cooked well-done"], correct: "Baked thoroughly and cooked well-done" }, 
            { question: "What common white crystal is described as a poison that destroys the blood?", options: ["White Sugar", "Sea Salt", "Ice"], correct: "White Sugar" },
            { question: "What kind of vegetables should be avoided because they are considered cattle food?", options: ["Carrots and Spinach", "Collard greens and cabbage", "Onions and Garlic"], correct: "Collard greens and cabbage" },
            { question: "How many days should a standard fast last?", options: ["1 day", "3 days (72 hours)", "7 days"], correct: "3 days (72 hours)" },
            { question: "What type of milk is considered better than cow's milk if you must drink it?", options: ["Almond Milk", "Soy Milk", "Evaporated or canned milk"], correct: "Evaporated or canned milk" },
            { question: "Why is baking bread slowly and thoroughly important?", options: ["It tastes better", "It kills the yeast completely so it doesn't expand in your stomach", "It makes the crust soft"], correct: "It kills the yeast completely so it doesn't expand in your stomach" },
            { question: "Is it better to eat vegetables raw or cooked?", options: ["Raw", "Cooked thoroughly", "Juiced"], correct: "Cooked thoroughly" }
        ], 
        hard: [ 
            { question: "According to the dietary law, how long does it take for a full meal to properly digest?", options: ["12 hours", "24 to 72 hours", "6 hours"], correct: "24 to 72 hours" }, 
            { question: "What specific nut is warned against because it is grown in the earth and is hard to digest?", options: ["Almonds", "The Peanut", "Walnuts"], correct: "The Peanut" }, 
            { question: "The Honorable Elijah Muhammad teaches that proper fasting and eating one meal a day can extend your life to what age?", options: ["80 years", "100 years", "140 years or more"], correct: "140 years or more" }, 
            { question: "What type of meat is considered the absolute best if you must eat meat?", options: ["Beef", "Lamb (Kosher/Halal)", "Chicken"], correct: "Lamb (Kosher/Halal)" }, 
            { question: "Which Book number of 'How to Eat to Live' was published first?", options: ["Book 1 (1967)", "Book 2 (1972)", "Book 3 (1980)"], correct: "Book 1 (1967)" },
            { question: "What is the ruling on eating wild game like rabbit or squirrel?", options: ["It is highly recommended", "It is strictly forbidden", "Only in winter"], correct: "It is strictly forbidden" },
            { question: "What does the Honorable Elijah Muhammad say about sweet potatoes vs. white potatoes?", options: ["White potatoes are better", "Sweet potatoes are better", "Both are forbidden"], correct: "Sweet potatoes are better" },
            { question: "What temperature should water be when you drink it?", options: ["Ice cold", "Boiling hot", "Room temperature or warm"], correct: "Room temperature or warm" },
            { question: "Why are peas (other than the navy bean) generally discouraged?", options: ["They are hard to digest for the original man", "They are too expensive", "They cause sleepiness"], correct: "They are hard to digest for the original man" },
            { question: "What is the maximum frequency you should eat meat?", options: ["Every day", "Never", "No more than 2 or 3 times a week"], correct: "No more than 2 or 3 times a week" }
        ],
        extreme: [
            { question: "According to Book 2, how many days does the Honorable Elijah Muhammad suggest fasting to cure serious illnesses?", options: ["3 days", "7 days", "9 days"], correct: "9 days" },
            { question: "At what temperature does the Honorable Elijah Muhammad recommend drinking water?", options: ["Ice cold", "Room temperature", "Boiling hot"], correct: "Room temperature" },
            { question: "What does the Honorable Elijah Muhammad say about the consumption of soybeans?", options: ["They are highly nutritious", "They are strictly for cattle, not humans", "They should be eaten daily"], correct: "They are strictly for cattle, not humans" },
            { question: "What kind of bread does the Honorable Elijah Muhammad say causes the stomach to stretch?", options: ["Whole wheat bread", "Freshly baked, hot bread with active yeast", "White bread"], correct: "Freshly baked, hot bread with active yeast" },
            { question: "What is the exact quote regarding the 'Scavenger of the Sea'?", options: ["The shark and the whale", "The crab and the catfish", "The eel and the shrimp"], correct: "The crab and the catfish" },
            { question: "Why are nuts discouraged in the dietary law?", options: ["They contain too much fat", "They are too hard on the digestive system", "They cause allergies"], correct: "They are too hard on the digestive system" },
            { question: "How long did the Honorable Elijah Muhammad say one meal every 72 hours could extend your life?", options: ["100 years", "120 years", "140 years or more"], correct: "140 years or more" },
            { question: "What does the Honorable Elijah Muhammad describe as 'the white poison'?", options: ["White sugar and white flour", "Salt and pepper", "Milk and cheese"], correct: "White sugar and white flour" },
            { question: "What meat is described as being 'divinely prohibited' besides swine?", options: ["Lamb", "Scavenger birds like crow and buzzard", "Chicken"], correct: "Scavenger birds like crow and buzzard" },
            { question: "What is the recommended resting period after a full meal before heavy physical activity?", options: ["30 minutes", "1 hour", "At least 2 hours"], correct: "At least 2 hours" }
        ]
    }
};

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
    // 2. THE ARENA (High Stakes Duel)
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

    // 🚨 MODIFIED FOR BOTH JEOPARDY AND THE BLUEPRINT GAME 🚨
    socket.on('start_round', (qData) => {
        
        // INTERCEPT FOR BLUEPRINT FAMILY GAME
        if (socket.currentBpRoom && bpRooms[socket.currentBpRoom]) {
            const room = bpRooms[socket.currentBpRoom];
            room.currentQuestion = qData;
            
            // Broadcast discussion phase
            io.to(room.code).emit('bp_start_trivia', qData);
            return; // STOP IT from bleeding into Jeopardy
        }
        
        // REGULAR JEOPARDY LOGIC
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
    // 🚀 5. THE BLUEPRINT COLLECTION LOGIC 🚀
    // ==========================================
    
    socket.on('bp_create_room', (data) => {
        const code = generateRoomCode();
        bpRooms[code] = {
            host: socket.id, 
            code: code,
            players: [{ 
                id: socket.id, name: data.name, ready: true, 
                hand: [], board: {wisdom:0, health:0, facts:0}, 
                answeredCorrectly: false, hasShield: false, turnSkipped: false, hasPlayedCard: false 
            }],
            state: 'lobby',
            currentQuestion: null,
            timer: null
        };
        socket.join(code);
        socket.currentBpRoom = code;
        socket.emit('bp_room_created', code);
    });

    socket.on('bp_join_room', (data) => {
        const room = bpRooms[data.code];
        if (!room) {
            socket.emit('bp_join_error', "Table code not found.");
            return;
        }
        if (room.state !== 'lobby') {
            socket.emit('bp_join_error', "Game already in progress.");
            return;
        }
        if (room.players.find(p => p.id === socket.id)) return; 
        
        room.players.push({ 
            id: socket.id, name: data.name, ready: true, 
            hand: [], board: {wisdom:0, health:0, facts:0}, 
            answeredCorrectly: false, hasShield: false, turnSkipped: false, hasPlayedCard: false 
        });
        socket.join(data.code);
        socket.currentBpRoom = data.code;
        socket.emit('bp_joined_successfully', { code: data.code });
        
        io.to(data.code).emit('bp_lobby_update', room.players.map(p => ({ name: p.name, isReady: true })));
    });

    socket.on('bp_leave_room', () => {
        handleBpDisconnect(socket);
    });

    socket.on('bp_host_start_game', () => {
        const room = bpRooms[socket.currentBpRoom];
        if(!room || room.host !== socket.id) return;
        
        // Give everyone 3 random starting cards
        room.players.forEach(p => {
            p.hand = [drawRandomCard(), drawRandomCard(), drawRandomCard()];
            p.board = {wisdom:0, health:0, facts:0};
        });
        startBpTriviaRound(room);
    });

    function drawRandomCard() {
        const rand = Math.random();
        const id = Math.random().toString(36).substring(2, 9);
        
        // 75% chance for a Blueprint, 25% chance for Action
        if (rand < 0.25) return { id, type: 'blueprint', category: 'wisdom' };
        if (rand < 0.50) return { id, type: 'blueprint', category: 'health' };
        if (rand < 0.75) return { id, type: 'blueprint', category: 'facts' };
        if (rand < 0.85) return { id, type: 'action', action: 'thief' };
        if (rand < 0.95) return { id, type: 'action', action: 'tax' };
        return { id, type: 'action', action: 'shield' };
    }

    function startBpTriviaRound(room) {
        room.state = 'trivia';
        
        // Pick random question from global quizData
        const categories = ['kids', 'teens', 'training', 'lessons', 'health'];
        const diffs = ['easy', 'medium', 'hard'];
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const diff = diffs[Math.floor(Math.random() * diffs.length)];
        
        let qList = quizData[cat] ? quizData[cat][diff] : null;
        if(!qList) qList = quizData['kids']['easy']; // safety fallback
        
        const q = qList[Math.floor(Math.random() * qList.length)];
        
        room.currentQuestion = q;
        room.players.forEach(p => { p.answeredCorrectly = false; p.triviaVote = null; p.turnSkipped = false; p.hasPlayedCard = false; });

        io.to(room.code).emit('bp_start_trivia', q);

        room.timer = setTimeout(() => {
            evaluateBpTrivia(room);
        }, 15000);
    }

    socket.on('bp_submit_trivia', (data) => {
        const room = bpRooms[socket.currentBpRoom];
        if(!room || room.state !== 'trivia') return;
        const p = room.players.find(p => p.id === socket.id);
        if(p) p.triviaVote = data.answer;
    });

    function evaluateBpTrivia(room) {
        room.players.forEach(p => {
            if (p.triviaVote === room.currentQuestion.correct) {
                p.answeredCorrectly = true;
                p.hand.push(drawRandomCard()); // Draw a card!
            }
            io.to(p.id).emit('bp_trivia_results', {
                correctAnswer: room.currentQuestion.correct,
                iGotItRight: p.answeredCorrectly
            });
        });

        setTimeout(() => {
            startBpBoardPhase(room);
        }, 4000);
    }

    function startBpBoardPhase(room) {
        room.state = 'board';
        
        room.players.forEach(p => {
            const opponents = room.players.filter(opp => opp.id !== p.id).map(opp => ({
                id: opp.id, name: opp.name, board: opp.board
            }));
            io.to(p.id).emit('bp_board_phase', {
                myHand: p.hand,
                myBoard: p.board,
                opponents: opponents
            });
        });

        room.timer = setTimeout(() => {
            checkBpWinConditionOrNextRound(room);
        }, 25000);
    }

    socket.on('bp_get_targets', () => {
        const room = bpRooms[socket.currentBpRoom];
        if(!room) return;
        const opponents = room.players.filter(p => p.id !== socket.id).map(p => ({id: p.id, name: p.name}));
        socket.emit('bp_receive_targets', opponents);
    });

    socket.on('bp_play_card', (data) => {
        const room = bpRooms[socket.currentBpRoom];
        if(!room || room.state !== 'board') return;
        const p = room.players.find(p => p.id === socket.id);
        if(!p || p.hasPlayedCard) return;

        const cardIndex = p.hand.findIndex(c => c.id === data.cardId);
        if (cardIndex === -1) return;
        const card = p.hand[cardIndex];

        // Apply effect
        if (card.type === 'blueprint') {
            p.board[card.category]++;
        } else if (card.type === 'action') {
            if (card.action === 'shield') {
                p.hasShield = true;
            } else if (data.targetId) {
                const target = room.players.find(t => t.id === data.targetId);
                if (target) {
                    if (target.hasShield) {
                        target.hasShield = false; // Consume shield
                    } else {
                        if (card.action === 'thief') {
                            // Steal a random card from hand or board
                            if (target.hand.length > 0) {
                                const stolen = target.hand.pop();
                                p.hand.push(stolen);
                            } else {
                                // Steal from board
                                const available = Object.keys(target.board).filter(k => target.board[k] > 0);
                                if (available.length > 0) {
                                    const stealCat = available[Math.floor(Math.random() * available.length)];
                                    target.board[stealCat]--;
                                    p.board[stealCat]++;
                                }
                            }
                        } else if (card.action === 'tax') {
                            // Destroy a board piece
                            const available = Object.keys(target.board).filter(k => target.board[k] > 0);
                            if (available.length > 0) {
                                const destroyCat = available[Math.floor(Math.random() * available.length)];
                                target.board[destroyCat]--;
                            } else if (target.hand.length > 0) {
                                target.hand.pop();
                            }
                        }
                    }
                }
            }
        }
        
        p.hand.splice(cardIndex, 1);
        p.hasPlayedCard = true;

        // Force UI update for everyone
        room.players.forEach(player => {
            const opponents = room.players.filter(opp => opp.id !== player.id).map(opp => ({ id: opp.id, name: opp.name, board: opp.board }));
            io.to(player.id).emit('bp_board_phase', { myHand: player.hand, myBoard: player.board, opponents: opponents });
        });

        // Check if everyone is done
        if (room.players.every(pl => pl.turnSkipped || pl.hasPlayedCard)) {
            clearTimeout(room.timer);
            checkBpWinConditionOrNextRound(room);
        }
    });

    socket.on('bp_skip_turn', () => {
        const room = bpRooms[socket.currentBpRoom];
        if(!room || room.state !== 'board') return;
        const p = room.players.find(p => p.id === socket.id);
        if(p) p.turnSkipped = true;

        if (room.players.every(pl => pl.turnSkipped || pl.hasPlayedCard)) {
            clearTimeout(room.timer);
            checkBpWinConditionOrNextRound(room);
        }
    });

    function checkBpWinConditionOrNextRound(room) {
        let winner = null;
        room.players.forEach(p => {
            if (p.board.wisdom >= 3 && p.board.health >= 3 && p.board.facts >= 3) {
                winner = p.name;
            }
        });

        if (winner) {
            io.to(room.code).emit('bp_game_over', { winner: winner });
            delete bpRooms[room.code];
        } else {
            startBpTriviaRound(room);
        }
    }

    function handleBpDisconnect(s) {
        if (s.currentBpRoom && bpRooms[s.currentBpRoom]) {
            const room = bpRooms[s.currentBpRoom];
            room.players = room.players.filter(p => p.id !== s.id);
            
            if (room.players.length === 0) {
                delete bpRooms[s.currentBpRoom];
            } else if (room.host === s.id) {
                io.to(s.currentBpRoom).emit('bp_join_error', "The Host disconnected. The table has closed.");
                delete bpRooms[s.currentBpRoom];
            } else {
                io.to(s.currentBpRoom).emit('bp_lobby_update', room.players.map(p => ({ name: p.name, isReady: true })));
            }
        }
    }


    // ==========================================
    // DISCONNECT HANDLER (Master)
    // ==========================================
    socket.on('disconnect', () => {
        handleLeave(socket);
        handleBpDisconnect(socket);
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
