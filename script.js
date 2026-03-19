/**
 * The Knowledge Portal - V4.3 AAA FULL BUILD
 */

// 🚨 BULLETPROOF SOCKET INITIALIZATION 🚨
let socket;
try {
    socket = (typeof io !== 'undefined') ? io() : { emit: () => {}, on: () => {}, id: 'offline' };
} catch(e) {
    console.warn("Socket.io offline. Loading single-player elements only.");
    socket = { emit: () => {}, on: () => {}, id: 'offline' };
}

let currentUser = "";
let audioCtx = null;
let voiceUnlocked = false;

// ---------------------------------------------------------
// 1. FULL MASSIVE QUESTION DATABASE
// ---------------------------------------------------------
const quizData = {
    kids: { 
        title: "Junior Vanguard", 
        studyText: "Welcome to the Junior Vanguard! You are learning the foundation of the Nation of Islam. Study the history of the Pioneers, the importance of eating properly, and the meaning of our flag.", 
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
        title: "The Awakening", 
        studyText: "Welcome to The Awakening. As a teenager, you are preparing to take on the world. You must understand 'Knowledge of Self' and the concept of 'Do For Self'.", 
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
        title: "M.G.T. & F.O.I. Training", 
        studyText: "Discipline and Civilization. The training units of the M.G.T. and the orders of the F.O.I. maintain the structure, peace, and security of the Nation.", 
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
        title: "The 52 Lessons", 
        studyText: "The Supreme Wisdom. This covers deep mathematical theology and the history of the making of the devil by Yacub.", 
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
        title: "How to Eat to Live", 
        studyText: "The Honorable Elijah Muhammad teaches us that the food we eat can be our life or our death. Study the dietary laws to prolong your life and maintain perfect health.", 
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
    },
    adults: { 
        title: "Registration Track", 
        studyText: "The Student Enrollment. You must memorize these 10 exact questions and answers word-for-word.", 
        exact: [ 
            { question: "Who is the original man?", options: ["The original man is the Asiatic Blackman, the maker, the owner, the cream of the planet Earth, father of civilization, God of the universe.", "The original man is the Asiatic Blackman, the maker, the owner, the father of civilization, God of the universe.", "The original man is the Asiatic Blackman, the maker, the owner, the cream of the planet Earth, God of the universe."], correct: "The original man is the Asiatic Blackman, the maker, the owner, the cream of the planet Earth, father of civilization, God of the universe." }, 
            { question: "Who is the colored man?", options: ["The colored man is the Caucasian white man or Yacub’s grafted devil of the planet Earth.", "The colored man is the Caucasian white man or Yacub’s grafted devil.", "The colored man is the Caucasian white man, the Skunk of the planet Earth."], correct: "The colored man is the Caucasian white man or Yacub’s grafted devil of the planet Earth." }, 
            { question: "What is the population of the original nation in the wilderness of North America and all over the planet Earth?", options: ["The population of the original nation in the wilderness of North America is 17,000,000 with the 2,000,000 Indians makes it 19,000,000; all over the planet Earth 4,400,000,000.", "The population of the original nation in the wilderness of North America is 17,000,000; all over the planet Earth 4,400,000,000.", "The population of the original nation in the wilderness of North America is 19,000,000; all over the planet Earth 4,000,000,000."], correct: "The population of the original nation in the wilderness of North America is 17,000,000 with the 2,000,000 Indians makes it 19,000,000; all over the planet Earth 4,400,000,000." }, 
            { question: "What is the population of the colored people in the wilderness of North America and all over the planet Earth?", options: ["The population of the colored people in the wilderness of North America is 103,000,000; all over the planet Earth 400,000,000.", "The population of the colored people in the wilderness of North America is 103,000,000; all over the planet Earth 4,000,000,000.", "The population of the colored people in the wilderness of North America is 100,000,000; all over the planet Earth 400,000,000."], correct: "The population of the colored people in the wilderness of North America is 103,000,000; all over the planet Earth 400,000,000." }, 
            { question: "What is the area in square miles of the planet Earth?", options: ["The square mileage of the planet Earth is 196,940,000 square miles.", "The square mileage of the planet Earth is 196,940,000.", "The square mileage of the planet Earth is 139,685,000 square miles."], correct: "The square mileage of the planet Earth is 196,940,000 square miles." }, 
            { question: "What is the exact square miles of useful land that’s used every day by the total population of the planet Earth?", options: ["The useful land that’s used every day by the total population of the planet Earth is 29,000,000 square miles.", "The useful land that’s used every day by the total population of the planet Earth is 57,255,000 square miles.", "The useful land that’s used every day by the total population of the planet Earth is 23,000,000 square miles."], correct: "The useful land that’s used every day by the total population of the planet Earth is 29,000,000 square miles." }, 
            { question: "How much useful land is used by the original man?", options: ["The original man uses 23,000,000 square miles.", "The original man uses 29,000,000 square miles.", "The original man uses 57,255,000 square miles."], correct: "The original man uses 23,000,000 square miles." }, 
            { question: "How much useful land is used by the colored man?", options: ["The colored man uses 6,000,000 square miles.", "The colored man uses 23,000,000 square miles.", "The colored man uses 29,000,000 square miles."], correct: "The colored man uses 6,000,000 square miles." }, 
            { question: "What is the said birth record of the Nation of Islam?", options: ["The Nation of Islam has no said birth record; it has no beginning or ending; it is older than the sun, moon and stars.", "The Nation of Islam has no said birth record; it is older than the sun, moon and stars.", "The Nation of Islam has no beginning or ending; it is older than the sun, moon and stars."], correct: "The Nation of Islam has no said birth record; it has no beginning or ending; it is older than the sun, moon and stars." }, 
            { question: "What is the said birth record of nations other than Islam?", options: ["Buddhism is 35,000 years old and Christianity is 551 years old.", "Buddhism is 35,000 years old and Christianity is 550 years old.", "Buddhism is 35,000 years old and Christianity is 555 years old."], correct: "Buddhism is 35,000 years old and Christianity is 551 years old." } 
        ] 
    },
    actualfacts: { 
        title: "Actual Facts", 
        studyText: "Memorize these 20 mathematical facts of our planet and universe.", 
        exact: [ 
            { question: "What is the total area of the land and water of the planet Earth?", options: ["196,940,000 square miles.", "139,685,000 square miles.", "57,255,000 square miles."], correct: "196,940,000 square miles." },
            { question: "What is the circumference of the planet Earth?", options: ["24,896 miles.", "25,000 miles.", "7,926 miles."], correct: "24,896 miles." },
            { question: "What is the diameter of the Earth?", options: ["7,926 miles.", "8,000 miles.", "24,896 miles."], correct: "7,926 miles." },
            { question: "What is the area of the Land?", options: ["57,255,000 square miles.", "29,000,000 square miles.", "139,685,000 square miles."], correct: "57,255,000 square miles." },
            { question: "What is the area of the Water?", options: ["139,685,000 square miles.", "196,940,000 square miles.", "57,255,000 square miles."], correct: "139,685,000 square miles." },
            { question: "How many square miles does the Pacific Ocean cover?", options: ["68,634,000 square miles.", "41,321,000 square miles.", "29,430,000 square miles."], correct: "68,634,000 square miles." },
            { question: "How many square miles does the Atlantic Ocean cover?", options: ["41,321,000 square miles.", "68,634,000 square miles.", "29,430,000 square miles."], correct: "41,321,000 square miles." },
            { question: "How many square miles does the Indian Ocean cover?", options: ["29,430,000 square miles.", "41,321,000 square miles.", "68,634,000 square miles."], correct: "29,430,000 square miles." },
            { question: "How many square miles do the Lakes and Rivers cover?", options: ["1,000,000 square miles.", "1,910,000 square miles.", "4,861,000 square miles."], correct: "1,000,000 square miles." },
            { question: "How many square miles do the Hills and Mountains cover?", options: ["14,000,000 square miles.", "29,000,000 square miles.", "1,910,000 square miles."], correct: "14,000,000 square miles." },
            { question: "How many square miles are the Islands?", options: ["1,910,000 square miles.", "1,000,000 square miles.", "4,861,000 square miles."], correct: "1,910,000 square miles." },
            { question: "How many square miles are the Deserts?", options: ["4,861,000 square miles.", "14,000,000 square miles.", "1,910,000 square miles."], correct: "4,861,000 square miles." },
            { question: "How high is Mount Everest?", options: ["29,141 feet high.", "25,000 feet high.", "14,000 feet high."], correct: "29,141 feet high." },
            { question: "What is the area of the Producing Land?", options: ["29,000,000 square miles.", "57,255,000 square miles.", "23,000,000 square miles."], correct: "29,000,000 square miles." },
            { question: "How much does the Earth weigh?", options: ["Six sextillion tons - (a unit followed by 21 ciphers).", "Ten billion tons.", "One trillion tons."], correct: "Six sextillion tons - (a unit followed by 21 ciphers)." },
            { question: "How far is the Earth from the Sun?", options: ["93,000,000 miles.", "50,000,000 miles.", "186,000 miles."], correct: "93,000,000 miles." },
            { question: "How fast does the Earth travel?", options: ["At the rate of 1,037 1/3 miles per hour.", "At the rate of 1,120 feet per second.", "At the rate of 186,000 miles per second."], correct: "At the rate of 1,037 1/3 miles per hour." },
            { question: "How fast does Light travel?", options: ["At the rate of 186,000 miles per second.", "At the rate of 1,120 feet per second.", "At the rate of 1,037 1/3 miles per hour."], correct: "At the rate of 186,000 miles per second." },
            { question: "How fast does Sound travel?", options: ["At the rate of 1,120 feet per second.", "At the rate of 186,000 miles per second.", "At the rate of 1,037 1/3 miles per hour."], correct: "At the rate of 1,120 feet per second." },
            { question: "What is the diameter of the Sun?", options: ["853,000 miles.", "93,000,000 miles.", "24,896 miles."], correct: "853,000 miles." }
        ] 
    },
    jeopardyVault: {
        title: "The Vault",
        studyText: "Classified files exclusive to Jeopardy.",
        easy: [
            { question: "What is the name of the holy day of fasting and prayer observed by Muslims in the 9th month?", options: ["Ramadan", "Saviours' Day", "Atonement"], correct: "Ramadan" },
            { question: "Which prominent Nation of Islam building is located at 7351 South Stony Island Avenue?", options: ["Mosque Maryam", "The National House", "The Salaam Restaurant"], correct: "Mosque Maryam" },
            { question: "The Nation of Islam teaches that God is a ___, not a spirit.", options: ["Man", "Ghost", "Force of Nature"], correct: "Man" },
            { question: "What is the primary color of the M.G.T. uniform?", options: ["White", "Red", "Gold"], correct: "White" },
            { question: "Which day of the week is traditionally the main public meeting day at the Mosque?", options: ["Sunday", "Friday", "Wednesday"], correct: "Sunday" }
        ],
        medium: [
            { question: "What year was the Million Family March held?", options: ["2000", "1995", "2005"], correct: "2000" },
            { question: "What does the 'M' in M.G.T. stand for?", options: ["Muslim", "Mothers", "Mighty"], correct: "Muslim" },
            { question: "Who was the legendary Supreme Captain of the F.O.I. that helped secure the Nation of Islam during its rapid growth?", options: ["Brother Raymond Sharrieff", "Brother John Ali", "Brother Jabril Muhammad"], correct: "Brother Raymond Sharrieff" },
            { question: "What is the acronym for the General Civilization Class?", options: ["G.C.C.", "G.C.A.", "G.C.M."], correct: "G.C.C." },
            { question: "Who is the wife of the Honorable Minister Louis Farrakhan?", options: ["Mother Khadijah Farrakhan", "Mother Clara Muhammad", "Mother Tynnetta Muhammad"], correct: "Mother Khadijah Farrakhan" }
        ],
        hard: [
            { question: "What year did the Honorable Elijah Muhammad first establish the Fruit of Islam?", options: ["1933", "1930", "1940"], correct: "1933" },
            { question: "Who was the pioneering woman who established the University of Islam schools?", options: ["Mother Clara Muhammad", "Mother Tynnetta Muhammad", "Sister Ava Muhammad"], correct: "Mother Clara Muhammad" },
            { question: "What was the theme of the 20th Anniversary of the Million Man March in 2015?", options: ["Justice Or Else", "The Millions More Movement", "Day of Atonement"], correct: "Justice Or Else" },
            { question: "Which legendary figure was often referred to as the 'Saviour' in the early days of the Nation of Islam?", options: ["Master Fard Muhammad", "Elijah Muhammad", "Marcus Garvey"], correct: "Master Fard Muhammad" },
            { question: "What is the specific age range for the Junior Vanguard?", options: ["Ages 5 to 12", "Ages 13 to 19", "Ages 4 to 10"], correct: "Ages 5 to 12" }
        ],
        extreme: [
            { question: "What was the overarching theme of the 10th Anniversary of the Million Man March in 2005?", options: ["The Millions More Movement", "Justice Or Else", "Day of Atonement"], correct: "The Millions More Movement" },
            { question: "In what year did Minister Farrakhan complete his grueling World Tour spanning over 40 nations?", options: ["1996", "1990", "2000"], correct: "1996" },
            { question: "Which of the following was a renowned musical composition/play created by Minister Louis Farrakhan?", options: ["Orgena", "The Awakening", "The Divine Light"], correct: "Orgena" },
            { question: "What year was the Million Woman March held?", options: ["1997", "1995", "2000"], correct: "1997" },
            { question: "What was the exact date the Honorable Elijah Muhammad departed this timeline?", options: ["February 25, 1975", "February 26, 1970", "October 7, 1975"], correct: "February 25, 1975" },
            { question: "What was the exact date Master Fard Muhammad arrived in Detroit?", options: ["July 4, 1930", "February 26, 1930", "October 10, 1931"], correct: "July 4, 1930" }
        ]
    }
};

// ---------------------------------------------------------
// 2. SYSTEM STATE & ACCOUNTS
// ---------------------------------------------------------
let currentPoints = 0;
let currentStreak = 1;
let currentPath = "";
let currentDiff = "";
let currentIdx = 0;
let correctAnswers = 0;
let pointsThisSession = 0;
let pointMultiplier = 100;
let activeQuestions = []; 
let usedJeopardyQuestions = [];
let tugActiveQs = [];
let tugIdx = 0;
let sessionCancelToken = 0;

// ---------------------------------------------------------
// 🚀 THE BLUEPRINT COLLECTION (FAMILY GAME) STATE 🚀
// ---------------------------------------------------------
let bpRoomCode = "";
let bpIsHost = false;
let bpTimerInt = null;
let bpMyHand = [];
let bpMyBoard = { wisdom: 0, health: 0, facts: 0 };
let bpActiveCardToPlay = null; 

// ---------------------------------------------------------
// 3. TRUE UNBIASED RANDOMIZER
// ---------------------------------------------------------
function trueShuffle(array) {
    return [...array]
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

// ---------------------------------------------------------
// 4. MASTER SCREEN MANAGEMENT & TOAST NOTIFICATIONS
// ---------------------------------------------------------
function switchScreen(screenId) {
    const screens = ['login-screen', 'home-screen', 'study-screen', 'quiz-screen', 'result-screen', 'leaderboard-screen', 'jeopardy-screen', 'tug-screen', 'arena-screen', 'blueprint-game-screen'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
}

function showToast(msg) {
    masterUnlockAudio();
    if(sfx.correct) sfx.correct(); 
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-msg');
    if(toast && toastMsg) {
        toastMsg.innerHTML = msg;
        toast.classList.add('show');
        if (typeof confetti !== 'undefined' && msg.includes('earned')) {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.2 }, zIndex: 10000 });
        }
        setTimeout(() => { toast.classList.remove('show'); }, 4000);
    }
}

// ---------------------------------------------------------
// 5. RANK BADGES & AVATARS
// ---------------------------------------------------------
function getRankBadge(points) {
    if (points >= 15000) return "🟡 Captain";
    if (points >= 5000) return "🔵 Builder";
    return "🟢 Student";
}

function getAvatar(name, points, isOnFire = false, hasBounty = false) {
    const safeName = name && typeof name === 'string' && name.trim() !== "" ? name : "Student";
    const colors = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-green)', 'var(--accent-yellow)', '#8b5cf6', '#ec4899'];
    const color = colors[safeName.length % colors.length];
    const initial = safeName.charAt(0).toUpperCase();
    const fireClass = isOnFire ? "on-fire-avatar" : "";
    const rank = getRankBadge(points || 0);
    const bountyStyle = hasBounty ? 'color: var(--accent-red); text-shadow: 0 0 5px var(--accent-red);' : '';
    const bountyIcon = hasBounty ? '🎯' : '';
    
    return `<div style="display:flex; align-items:center;">
        <div class="${fireClass}" style="width:36px; height:36px; min-width:36px; border-radius:50%; background:${color}; color:white; display:flex; align-items:center; justify-content:center; font-family:var(--font-heading); font-weight:800; font-size:18px; border:2px solid var(--primary-gold); margin-right:12px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
            ${isOnFire ? '🔥' : initial}
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
            <span style="font-family:var(--font-heading); font-weight:800; color:var(--text-main); font-size:16px;">${safeName}</span>
            <span class="rank-badge" style="${bountyStyle}">${bountyIcon} ${rank}</span>
        </div>
    </div>`;
}

// ---------------------------------------------------------
// 6. AUDIO ENGINE
// ---------------------------------------------------------
function masterUnlockAudio() {
    if (voiceUnlocked && audioCtx && audioCtx.state === 'running') return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const buffer = audioCtx.createBuffer(1, 1, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const wakeup = new SpeechSynthesisUtterance("Welcome");
            wakeup.volume = 0.1;
            window.speechSynthesis.speak(wakeup);
        }
        voiceUnlocked = true;
    } catch(e) { console.error("Audio Bypass Failed", e); }
}

document.addEventListener('touchstart', masterUnlockAudio, { once: true });
document.addEventListener('click', masterUnlockAudio, { once: true });

const sfx = {
    playTone: (freq, type, duration) => {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            osc.type = type; osc.frequency.value = freq;
            osc.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + duration);
        } catch(e) {}
    },
    buzz: () => sfx.playTone(400, 'square', 0.2),    
    tick: () => sfx.playTone(800, 'sine', 0.05),    
    correct: () => { sfx.playTone(523, 'sine', 0.1); setTimeout(() => sfx.playTone(659, 'sine', 0.2), 100); },   
    wrong: () => sfx.playTone(150, 'sawtooth', 0.4),
    heartbeat: () => { sfx.playTone(100, 'sine', 0.1); setTimeout(() => sfx.playTone(100, 'sine', 0.1), 150); },
    siren: () => {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 1);
            osc.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 2);
            osc.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 2);
        } catch(e) {}
    },
    alarm: () => {
        sfx.playTone(900, 'sawtooth', 0.1);
        setTimeout(() => sfx.playTone(700, 'sawtooth', 0.1), 100);
        setTimeout(() => sfx.playTone(900, 'sawtooth', 0.1), 200);
    }
};

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const msg = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
        if (preferredVoice) msg.voice = preferredVoice;
        msg.rate = 0.95; 
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        window.speechSynthesis.speak(msg);
    }
}

// ---------------------------------------------------------
// 🚨 7. BULLETPROOF INITIALIZATION, LOGIN & DATA RECOVERY 🚨
// ---------------------------------------------------------
function checkDailyStreak() {
    const today = new Date().toLocaleDateString('en-CA'); 
    const lastDate = localStorage.getItem('noi_last_date');

    if (!lastDate) {
        localStorage.setItem('noi_last_date', today);
        return;
    }
    if (today === lastDate) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    if (lastDate === yesterdayStr) {
        currentStreak++;
        let bonus = 100;
        let msg = `Welcome Back!<br><span style="color:var(--primary-gold);">Daily Streak: ${currentStreak} 🔥</span><br>You earned +100 points!`;
        if (currentStreak % 7 === 0) { bonus = 500; msg = `7-DAY STREAK ACHIEVED! 🔥<br><span style="color:var(--accent-green);">You earned a massive +500 points!</span>`; }
        
        currentPoints += bonus;
        try { localStorage.setItem('noi_streak', currentStreak); localStorage.setItem('noi_points', currentPoints); localStorage.setItem('noi_last_date', today); } catch(e) {}
        
        document.getElementById('display-points').innerText = currentPoints;
        document.getElementById('display-streak').innerText = currentStreak;
        document.getElementById('nav-avatar-container').innerHTML = getAvatar(currentUser, currentPoints);
        setTimeout(() => { showToast(msg); }, 1000);
    } else {
        currentStreak = 1;
        try { localStorage.setItem('noi_streak', currentStreak); localStorage.setItem('noi_last_date', today); } catch(e) {}
        document.getElementById('display-streak').innerText = currentStreak;
        setTimeout(() => { showToast(`Welcome Back!<br><span style="color:var(--text-muted); font-size:12px;">Your streak reset to 1. Come back tomorrow to build it up!</span>`); }, 1000);
    }
}

window.onload = () => {
    try {
        const savedUser = localStorage.getItem('noi_user');
        const savedPoints = localStorage.getItem('noi_points');
        const savedStreak = localStorage.getItem('noi_streak');
        if (savedUser && savedUser.trim() !== "") {
            currentUser = savedUser;
            currentPoints = savedPoints && !isNaN(parseInt(savedPoints)) ? parseInt(savedPoints) : 0;
            currentStreak = savedStreak && !isNaN(parseInt(savedStreak)) ? parseInt(savedStreak) : 1;
            document.getElementById('display-points').innerText = currentPoints;
            document.getElementById('display-streak').innerText = currentStreak;
            document.getElementById('nav-avatar-container').innerHTML = getAvatar(currentUser, currentPoints);
            socket.emit('join_game', { name: currentUser, points: currentPoints });
            checkDailyStreak(); 
            switchScreen('home-screen');
        } else {
            switchScreen('login-screen');
        }
    } catch(err) { switchScreen('login-screen'); }
};

function registerUser() {
    masterUnlockAudio();
    const nameInput = document.getElementById('username-input');
    if (!nameInput) return;
    const nameVal = nameInput.value.trim();
    if (nameVal === "") return alert("Please enter a name to begin.");
    
    const savedUser = localStorage.getItem('noi_user');
    if (savedUser && savedUser.toLowerCase() === nameVal.toLowerCase()) {
        currentUser = savedUser;
        currentPoints = parseInt(localStorage.getItem('noi_points')) || 0;
        currentStreak = parseInt(localStorage.getItem('noi_streak')) || 1;
        setTimeout(() => { showToast("Profile Recovered! Your points are safe."); }, 500);
    } else {
        currentUser = nameVal; 
        currentPoints = 0; 
        currentStreak = 1;
    }
    
    const today = new Date().toLocaleDateString('en-CA');
    try { 
        localStorage.setItem('noi_user', currentUser); 
        localStorage.setItem('noi_points', currentPoints); 
        localStorage.setItem('noi_streak', currentStreak); 
        localStorage.setItem('noi_last_date', today); 
    } catch(e) {}
    
    socket.emit('join_game', { name: currentUser, points: currentPoints });
    
    document.getElementById('display-points').innerText = currentPoints;
    document.getElementById('display-streak').innerText = currentStreak;
    document.getElementById('nav-avatar-container').innerHTML = getAvatar(currentUser, currentPoints);
    switchScreen('home-screen');
}

// ---------------------------------------------------------
// 🚀 THE BLUEPRINT COLLECTION (FAMILY GAME) LOGIC 🚀
// ---------------------------------------------------------
function openBlueprintLobbyMenu() {
    masterUnlockAudio();
    document.getElementById('blueprint-room-input').value = "";
    document.getElementById('blueprint-join-modal').classList.add('active');
}

function closeBlueprintLobbyMenu() {
    document.getElementById('blueprint-join-modal').classList.remove('active');
}

function switchBpView(viewId) {
    const views = ['bp-lobby-view', 'bp-trivia-view', 'bp-board-view'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    const target = document.getElementById(viewId);
    if(target) target.style.display = 'block';
}

function hostBlueprintGame() {
    masterUnlockAudio();
    closeBlueprintLobbyMenu();
    bpIsHost = true;
    showToast("Connecting to Server...");
    socket.emit('bp_create_room', { name: currentUser });

    setTimeout(() => {
        if (!bpRoomCode) {
            alert("🚨 SERVER UPDATE REQUIRED 🚨\n\nYour backend server (server.js) needs to be updated to handle 'The Blueprint Collection' logic.");
            bpIsHost = false;
            switchScreen('home-screen');
        }
    }, 4000);
}

function joinBlueprintGame() {
    masterUnlockAudio();
    const code = document.getElementById('blueprint-room-input').value.trim().toUpperCase();
    if(code.length !== 4) return alert("Enter a valid 4-digit code.");
    closeBlueprintLobbyMenu();
    bpIsHost = false;
    showToast("Connecting to Server...");
    socket.emit('bp_join_room', { name: currentUser, code: code });
    
    setTimeout(() => {
        if (!bpRoomCode) {
            alert("🚨 SERVER UPDATE REQUIRED 🚨\n\nYour backend server (server.js) needs to be updated to handle 'The Blueprint Collection' logic.");
            bpIsHost = false;
            switchScreen('home-screen');
        }
    }, 4000);
}

socket.on('bp_room_created', (code) => {
    bpRoomCode = code;
    switchScreen('blueprint-game-screen');
    switchBpView('bp-lobby-view');
    document.getElementById('bp-room-code-display').innerText = code;
    document.getElementById('bp-host-start-btn').style.display = 'block';
    document.getElementById('bp-wait-msg').style.display = 'none';
    updateBpLobbyPlayers([]);
});

socket.on('bp_joined_successfully', (data) => {
    bpRoomCode = data.code;
    switchScreen('blueprint-game-screen');
    switchBpView('bp-lobby-view');
    document.getElementById('bp-room-code-display').innerText = data.code;
    document.getElementById('bp-host-start-btn').style.display = 'none';
    document.getElementById('bp-wait-msg').style.display = 'block';
});

socket.on('bp_join_error', (msg) => {
    alert(msg);
    if (!bpRoomCode) openBlueprintLobbyMenu();
});

socket.on('bp_lobby_update', (players) => {
    updateBpLobbyPlayers(players);
});

function updateBpLobbyPlayers(players) {
    const list = document.getElementById('bp-lobby-players');
    if(!list) return;
    list.innerHTML = "";
    players.forEach(p => {
        list.innerHTML += `<div class="bp-player-row ready" style="width: 45%; min-width: 150px;">
            <div style="display:flex; align-items:center;">
                <div style="width:28px; height:28px; border-radius:50%; background:#000; color:#c084fc; display:flex; align-items:center; justify-content:center; font-family:var(--font-heading); font-weight:800; font-size:14px; border:1px solid #c084fc; margin-right:10px;">
                    ${p.name.charAt(0).toUpperCase()}
                </div>
                <span class="white-text" style="font-weight: bold; font-size:13px; text-transform: uppercase;">${p.name}</span>
            </div>
        </div>`;
    });
}

function leaveBlueprintRoom() {
    sessionCancelToken++;
    clearInterval(bpTimerInt);
    socket.emit('bp_leave_room');
    bpIsHost = false;
    bpRoomCode = "";
    switchScreen('home-screen');
}

function hostStartBlueprintGame() {
    masterUnlockAudio();
    socket.emit('bp_host_start_game');
}

// Phase 1: Trivia
socket.on('bp_start_trivia', (qData) => {
    switchBpView('bp-trivia-view');
    
    document.getElementById('bp-question-box').innerText = qData.question;
    speak(qData.question);
    
    const optBox = document.getElementById('bp-options-box');
    optBox.innerHTML = "";
    optBox.classList.remove('locked');
    document.getElementById('bp-waiting-trivia-msg').style.display = 'none';
    
    let options = trueShuffle(qData.options);
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = function(e) {
            e.preventDefault();
            this.blur();
            submitBpTriviaAnswer(opt, this);
        };
        optBox.appendChild(btn);
    });
    
    startBpTimer('bp-trivia-timer', 'bp-pressure-bar', 15, () => {
        sfx.wrong();
        optBox.classList.add('locked');
    });
});

function submitBpTriviaAnswer(selectedAnswer, btn) {
    masterUnlockAudio();
    const optBox = document.getElementById('bp-options-box');
    optBox.classList.add('locked');
    
    const btns = optBox.querySelectorAll('.option-btn');
    btns.forEach(b => b.classList.add('locked'));
    btn.classList.add('selected');
    
    socket.emit('bp_submit_trivia', { answer: selectedAnswer });
    document.getElementById('bp-waiting-trivia-msg').style.display = 'block';
    sfx.buzz();
}

// Phase 2: Show Answers & Draw
socket.on('bp_trivia_results', (data) => {
    clearInterval(bpTimerInt);
    const optBox = document.getElementById('bp-options-box');
    const btns = optBox.querySelectorAll('.option-btn');
    
    btns.forEach(b => {
        if (b.innerText === data.correctAnswer) {
            b.classList.add('correct');
        } else if (b.classList.contains('selected')) {
            b.classList.add('wrong');
        }
    });

    if (data.iGotItRight) {
        sfx.correct();
        showToast("Correct! You draw a card.");
    } else {
        sfx.wrong();
        showToast("Incorrect. No cards drawn.");
    }
});

// Phase 3: The Board / Action Phase
socket.on('bp_board_phase', (gameState) => {
    switchBpView('bp-board-view');
    renderBpBoard(gameState);
    startBpTimer('bp-hand-count', null, 25, () => {
        // Auto skip turn if timeout
        skipBlueprintTurn();
    });
});

function renderBpBoard(state) {
    // 1. Render Opponents
    const oppArea = document.getElementById('bp-opponents-area');
    oppArea.innerHTML = "";
    state.opponents.forEach(opp => {
        let dots = '';
        for(let i=0; i<opp.board.wisdom; i++) dots += `<div class="bp-dot wisdom"></div>`;
        for(let i=0; i<opp.board.health; i++) dots += `<div class="bp-dot health"></div>`;
        for(let i=0; i<opp.board.facts; i++) dots += `<div class="bp-dot facts"></div>`;
        if(dots === '') dots = '<span class="muted-text" style="font-size:10px;">Empty</span>';

        oppArea.innerHTML += `
            <div class="bp-opp-board">
                <span class="white-text" style="font-size:12px; font-weight:bold; text-transform:uppercase;">${opp.name}</span>
                <div class="bp-opp-dots">${dots}</div>
            </div>
        `;
    });

    // 2. Render My Board
    document.getElementById('bp-my-wisdom').innerText = state.myBoard.wisdom;
    document.getElementById('bp-my-health').innerText = state.myBoard.health;
    document.getElementById('bp-my-facts').innerText = state.myBoard.facts;

    // 3. Render My Hand
    bpMyHand = state.myHand;
    document.getElementById('bp-hand-count').innerText = `(${bpMyHand.length})`;
    const handContainer = document.getElementById('bp-my-hand-container');
    handContainer.innerHTML = "";
    
    if (bpMyHand.length === 0) {
        handContainer.innerHTML = `<p class="muted-text" style="width: 100%; text-align: center; margin-top: 40px; font-style: italic;">Your hand is empty.</p>`;
    } else {
        bpMyHand.forEach(card => {
            handContainer.innerHTML += createCardHTML(card);
        });
    }
}

function createCardHTML(card) {
    let cardClass = "";
    let icon = "";
    let title = "";
    let desc = "";

    if (card.type === "blueprint") {
        if (card.category === "wisdom") { cardClass = "card-wisdom"; icon = "👑"; title = "Wisdom"; desc = "Blueprint"; }
        if (card.category === "health") { cardClass = "card-health"; icon = "🍎"; title = "Health"; desc = "Blueprint"; }
        if (card.category === "facts") { cardClass = "card-facts"; icon = "🌍"; title = "Facts"; desc = "Blueprint"; }
    } else {
        if (card.action === "thief") { cardClass = "card-thief"; icon = "🦹"; title = "Thief"; desc = "Steal 1 Card"; }
        if (card.action === "tax") { cardClass = "card-tax"; icon = "💥"; title = "Tax"; desc = "Destroy 1 Card"; }
        if (card.action === "shield") { cardClass = "card-shield"; icon = "🛡️"; title = "Shield"; desc = "Auto-Block"; }
    }

    return `
        <div class="playing-card ${cardClass}" onclick="handleCardClick('${card.id}', '${card.type}', '${card.action || card.category}')">
            <div class="card-title">${title}</div>
            <div class="card-icon">${icon}</div>
            <div style="font-size: 8px;">${desc}</div>
        </div>
    `;
}

function handleCardClick(cardId, type, subtype) {
    masterUnlockAudio();
    if (type === "blueprint" || subtype === "shield") {
        // Play instantly to board
        socket.emit('bp_play_card', { cardId: cardId, targetId: null });
        document.getElementById('bp-my-hand-container').innerHTML = `<p class="gold-text" style="width: 100%; text-align: center; margin-top: 40px; font-weight: bold;">Card Played!</p>`;
    } else if (type === "action") {
        // Needs a target
        bpActiveCardToPlay = cardId;
        openBlueprintTargetModal();
    }
}

function openBlueprintTargetModal() {
    const list = document.getElementById('bp-target-list');
    list.innerHTML = "";
    
    // Request current opponents from server to target
    socket.emit('bp_get_targets');
    document.getElementById('bp-target-modal').classList.add('active');
}

function closeBlueprintTargetModal() {
    document.getElementById('bp-target-modal').classList.remove('active');
    bpActiveCardToPlay = null;
}

socket.on('bp_receive_targets', (opponents) => {
    const list = document.getElementById('bp-target-list');
    list.innerHTML = "";
    if(opponents.length === 0) {
        list.innerHTML = `<p class="muted-text text-center">No targets available.</p>`;
        return;
    }
    opponents.forEach(opp => {
        list.innerHTML += `
            <div class="bp-target-btn" onclick="executeActionCard('${opp.id}')">
                <span class="white-text" style="font-weight: bold;">${opp.name}</span>
                <span class="red-text" style="font-size: 10px; font-weight: bold; text-transform: uppercase;">TARGET</span>
            </div>
        `;
    });
});

function executeActionCard(targetId) {
    if (!bpActiveCardToPlay) return;
    masterUnlockAudio();
    closeBlueprintTargetModal();
    socket.emit('bp_play_card', { cardId: bpActiveCardToPlay, targetId: targetId });
    document.getElementById('bp-my-hand-container').innerHTML = `<p class="red-text" style="width: 100%; text-align: center; margin-top: 40px; font-weight: bold;">Sabotage Deployed!</p>`;
}

function skipBlueprintTurn() {
    masterUnlockAudio();
    socket.emit('bp_skip_turn');
    document.getElementById('bp-my-hand-container').innerHTML = `<p class="muted-text" style="width: 100%; text-align: center; margin-top: 40px; font-style: italic;">Turn Skipped. Waiting for next trivia round...</p>`;
}

socket.on('bp_game_over', (data) => {
    clearInterval(bpTimerInt);
    switchScreen('result-screen');
    const fScore = document.getElementById('final-score');
    const ePoints = document.getElementById('earned-points');
    const rDisp = document.getElementById('rank-display');
    
    if (data.winner === currentUser) {
        fScore.innerText = "VICTORY!";
        fScore.style.color = "var(--accent-green)";
        ePoints.innerText = "10,000";
        currentPoints += 10000;
        speak("Congratulations. You have completed the Blueprints.");
        if (typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    } else {
        fScore.innerText = "DEFEAT";
        fScore.style.color = "var(--accent-red)";
        ePoints.innerText = "0";
        speak(`${data.winner} has completed the Blueprints and won the game.`);
    }
    
    rDisp.innerText = `${data.winner} Wins!`;
    try { localStorage.setItem('noi_points', currentPoints); } catch(e){}
    document.getElementById('display-points').innerText = currentPoints;
    socket.emit('update_global_score', { name: currentUser, points: currentPoints });
});

function startBpTimer(textId, barId, duration, onEnd) {
    clearInterval(bpTimerInt);
    let timer = duration;
    const tDisplay = document.getElementById(textId);
    const bDisplay = document.getElementById(barId);
    
    bpTimerInt = setInterval(() => {
        timer--;
        if(tDisplay) {
            if(tDisplay.id === 'bp-trivia-timer') tDisplay.innerText = timer + "s";
            else tDisplay.innerText = `(${timer}s)`; // For hand count label reuse
        }
        
        if(bDisplay) {
            const pct = (timer / duration) * 100;
            bDisplay.style.width = pct + "%";
            if(pct < 30) bDisplay.style.background = "var(--accent-red)";
            else bDisplay.style.background = "#a855f7";
        }
        
        if (timer <= 0) {
            clearInterval(bpTimerInt);
            if(onEnd) onEnd();
        }
    }, 1000);
}

// ---------------------------------------------------------
// THE ARENA (High Stakes Duel) LOGIC
// ---------------------------------------------------------
let arenaActiveQuestion = null;

function startArena() {
    sessionCancelToken++;
    masterUnlockAudio();
    switchScreen('arena-screen');
    
    document.getElementById('a-lobby-view').style.display = 'block';
    document.getElementById('a-wager-view').style.display = 'none';
    document.getElementById('a-game-view').style.display = 'none';
    document.getElementById('a-results-view').style.display = 'none';
    
    const rBtn = document.getElementById('a-ready-btn');
    rBtn.disabled = false;
    rBtn.innerText = "ENTER"; 
    
    socket.emit('join_arena', { name: currentUser });
}

function sendArenaReady() {
    masterUnlockAudio();
    socket.emit('arena_ready');
    const rBtn = document.getElementById('a-ready-btn');
    rBtn.innerText = "WAITING..."; 
    rBtn.disabled = true;
}

socket.on('arena_lobby_update', (data) => {
    const rc = document.getElementById('a-lobby-count');
    if (rc) rc.innerText = data.ready;
});

socket.on('arena_wager_phase', () => {
    document.getElementById('a-lobby-view').style.display = 'none';
    document.getElementById('a-wager-view').style.display = 'block';
    
    let displayPoints = currentPoints;
    if (displayPoints < 10) displayPoints = 10;
    
    document.getElementById('a-available-points').innerText = displayPoints;
    document.getElementById('arena-wager-input').value = "";
    document.getElementById('arena-wager-input').max = displayPoints;
    
    document.getElementById('a-submit-wager-btn').style.display = 'block';
    document.getElementById('a-wager-status').style.display = 'none';
    
    speak("Place your bets.");
});

function setWager(type) {
    masterUnlockAudio();
    const input = document.getElementById('arena-wager-input');
    let displayPoints = currentPoints < 10 ? 10 : currentPoints;
    
    if (type === 'min') input.value = 10;
    if (type === 'half') input.value = Math.max(10, Math.floor(displayPoints / 2));
    if (type === 'max') input.value = displayPoints;
}

function submitArenaWager() {
    masterUnlockAudio();
    const input = document.getElementById('arena-wager-input');
    let wager = parseInt(input.value);
    
    let maxAllowed = currentPoints < 10 ? 10 : currentPoints;
    
    if (isNaN(wager) || wager < 1) {
        return alert("You must wager at least 1 point.");
    }
    if (wager > maxAllowed) {
        return alert(`You can only wager up to ${maxAllowed} points.`);
    }
    
    document.getElementById('a-submit-wager-btn').style.display = 'none';
    document.getElementById('a-wager-status').style.display = 'block';
    
    socket.emit('arena_wager', { wager: wager });
}

socket.on('arena_start_question', (data) => {
    document.getElementById('a-wager-view').style.display = 'none';
    document.getElementById('a-game-view').style.display = 'block';
    
    document.getElementById('a-p1-name').innerText = data.p1Name;
    document.getElementById('a-p1-bet').innerText = data.p1Wager;
    document.getElementById('a-p2-name').innerText = data.p2Name;
    document.getElementById('a-p2-bet').innerText = data.p2Wager;
    
    let deepCuts = [];
    for (let path in quizData) {
        if (path !== 'adults' && path !== 'actualfacts') {
            if (quizData[path].hard) deepCuts = deepCuts.concat(quizData[path].hard);
            if (quizData[path].extreme) deepCuts = deepCuts.concat(quizData[path].extreme);
        }
    }
    deepCuts = trueShuffle(deepCuts);
    arenaActiveQuestion = deepCuts[0];
    
    document.getElementById('a-question-box').innerText = arenaActiveQuestion.question;
    
    const optBox = document.getElementById('a-options-box');
    optBox.innerHTML = "";
    optBox.classList.remove('locked');
    document.getElementById('a-waiting-answer').style.display = 'none';
    
    let options = trueShuffle(arenaActiveQuestion.options);
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = function(e) {
            e.preventDefault();
            this.blur();
            submitArenaAnswer(opt, this, arenaActiveQuestion.correct);
        };
        optBox.appendChild(btn);
    });
});

function submitArenaAnswer(selected, btn, correct) {
    masterUnlockAudio();
    const optBox = document.getElementById('a-options-box');
    optBox.classList.add('locked');
    
    if (document.activeElement) document.activeElement.blur();
    
    const quizBtns = optBox.querySelectorAll('.option-btn');
    quizBtns.forEach(b => {
        b.disabled = true;
        b.blur();
    });
    
    if (selected === correct) {
        btn.classList.add('correct');
        sfx.correct();
    } else {
        btn.classList.add('wrong');
        quizBtns.forEach(b => {
            if (b.innerText === correct) b.classList.add('correct');
        });
        sfx.wrong();
    }
    
    document.getElementById('a-waiting-answer').style.display = 'block';
    
    socket.emit('arena_answer', { correct: selected === correct });
}

socket.on('arena_game_over', (data) => {
    sessionCancelToken++;
    document.getElementById('a-game-view').style.display = 'none';
    document.getElementById('a-results-view').style.display = 'block';
    
    const wText = document.getElementById('a-winner-text');
    const subText = document.getElementById('a-results-subtext');
    
    let myResult = data.p1Name === currentUser ? data.p1Result : data.p2Result;
    
    if (myResult > 0) {
        wText.innerText = "VICTORY!";
        wText.style.color = "var(--accent-green)"; 
        subText.innerHTML = `${data.message}<br><br><span style="color: var(--primary-gold);">+${myResult} Points</span>`;
        speak("You have crushed your opponent.");
        
        if (typeof confetti !== 'undefined') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    } else if (myResult < 0) {
        wText.innerText = "DEFEAT";
        wText.style.color = "var(--accent-red)"; 
        subText.innerHTML = `${data.message}<br><br><span style="color: var(--accent-red);">${myResult} Points</span>`;
        speak("You have lost your wager.");
    } else {
        wText.innerText = "STALEMATE";
        wText.style.color = "var(--text-muted)"; 
        subText.innerHTML = `${data.message}<br><br><span style="color: var(--text-muted);">0 Points Lost</span>`;
    }
    
    currentPoints += myResult;
    if (currentPoints < 0) currentPoints = 0; 
    
    try { localStorage.setItem('noi_points', currentPoints); } catch(e){}
    document.getElementById('display-points').innerText = currentPoints;
    document.getElementById('nav-avatar-container').innerHTML = getAvatar(currentUser, currentPoints);
    socket.emit('update_global_score', { name: currentUser, points: currentPoints });
});

// ---------------------------------------------------------
// 8. TUG OF WAR MULTIPLAYER LOGIC
// ---------------------------------------------------------
function startTugOfWar() {
    sessionCancelToken++;
    masterUnlockAudio();
    switchScreen('tug-screen');
    document.getElementById('t-lobby-view').style.display = 'block';
    document.getElementById('t-game-view').style.display = 'none';
    document.getElementById('t-results-view').style.display = 'none';
    
    const rBtn = document.getElementById('t-ready-btn');
    rBtn.disabled = false; 
    rBtn.innerText = "I'M READY"; 
    
    socket.emit('join_tug', { name: currentUser });
}

function sendTugReady() {
    masterUnlockAudio();
    socket.emit('tug_ready');
    const rBtn = document.getElementById('t-ready-btn');
    rBtn.innerText = "WAITING..."; 
    rBtn.disabled = true;
}

socket.on('tug_lobby_update', (data) => {
    const rc = document.getElementById('t-lobby-count');
    if (rc) rc.innerText = data.ready;
});

socket.on('tug_start', (data) => {
    tugIdx = 0;
    
    document.getElementById('t-p1-name').innerText = currentUser;
    document.getElementById('t-p2-name').innerText = data.opponentName;
    document.getElementById('tug-flag').style.left = "50%";
    
    document.getElementById('t-streak-p1').innerText = "0";
    document.getElementById('t-streak-p2').innerText = "0";

    document.getElementById('t-lobby-view').style.display = 'none';
    document.getElementById('t-game-view').style.display = 'block';
    
    speak("The Tug of War has begun.");
    
    let allQs = [];
    for (let path in quizData) if (path !== 'adults' && path !== 'actualfacts') for (let diff in quizData[path]) if (Array.isArray(quizData[path][diff])) allQs = allQs.concat(quizData[path][diff]);
    tugActiveQs = trueShuffle(allQs);
    
    loadTugQuestion();
});

function loadTugQuestion() {
    if (tugIdx >= tugActiveQs.length) return;
    
    const q = tugActiveQs[tugIdx];
    document.getElementById('t-question-box').innerText = q.question;
    
    const optBox = document.getElementById('t-options-box');
    optBox.innerHTML = "";
    optBox.classList.remove('locked');
    
    let options = trueShuffle(q.options);
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = function(e) {
            e.preventDefault();
            this.blur();
            submitTugAnswer(opt, this, q.correct);
        };
        optBox.appendChild(btn);
    });
}

function submitTugAnswer(selected, btn, correct) {
    masterUnlockAudio();
    const optBox = document.getElementById('t-options-box');
    optBox.classList.add('locked');
    
    if (document.activeElement) document.activeElement.blur();
    
    const quizBtns = optBox.querySelectorAll('.option-btn');
    quizBtns.forEach(b => {
        b.disabled = true;
        b.blur();
    });
    
    if (selected === correct) {
        btn.classList.add('correct');
        sfx.correct();
    } else {
        btn.classList.add('wrong');
        quizBtns.forEach(b => {
            if (b.innerText === correct) b.classList.add('correct');
        });
        sfx.wrong();
    }
    
    socket.emit('tug_answer', { name: currentUser, correct: selected === correct });
    
    let currentToken = sessionCancelToken;
    setTimeout(() => {
        if (currentToken !== sessionCancelToken) return;
        tugIdx++;
        loadTugQuestion();
    }, 1500);
}

socket.on('tug_update', (data) => {
    document.getElementById('tug-flag').style.left = `${data.ropePosition}%`;
    document.getElementById('t-streak-p1').innerText = data.p1Streak;
    document.getElementById('t-streak-p2').innerText = data.p2Streak;
});

socket.on('tug_muddy', () => {
    const overlay = document.getElementById('muddy-overlay');
    overlay.style.display = 'flex';
    sfx.wrong();
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 3000);
});

socket.on('tug_game_over', (data) => {
    sessionCancelToken++;
    document.getElementById('t-game-view').style.display = 'none';
    document.getElementById('t-results-view').style.display = 'block';
    
    const wText = document.getElementById('t-winner-text');
    const subText = document.getElementById('t-results-subtext');
    
    if (data.winner === currentUser) {
        wText.innerText = "VICTORY!";
        wText.style.color = "var(--accent-green)"; 
        
        if (data.reason === "forfeit" || data.reason === "disconnect") {
            subText.innerText = "Your opponent fled the battlefield! You win by default.";
            speak("Your opponent has forfeited. You win the war.");
        } else {
            subText.innerText = "You pulled the flag to your side!";
            speak("You have captured the flag. Outstanding victory.");
        }
        
        if (typeof confetti !== 'undefined') {
            var end = Date.now() + 3000;
            (function frame() {
                confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#eab308', '#ffffff', '#3b82f6'] });
                confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#eab308', '#ffffff', '#3b82f6'] });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
        }
        
    } else {
        wText.innerText = "DEFEAT";
        wText.style.color = "var(--accent-red)"; 
        subText.innerText = "Your opponent overpowered you.";
        speak("Your opponent has won the war.");
    }
});

// ---------------------------------------------------------
// 9. PRO JEOPARDY LOGIC
// ---------------------------------------------------------
function startJeopardy() {
    sessionCancelToken++;
    masterUnlockAudio();
    switchScreen('jeopardy-screen');
    
    const lView = document.getElementById('j-lobby-view');
    const gView = document.getElementById('j-game-view');
    const pView = document.getElementById('j-podium-view');
    const rBtn = document.getElementById('ready-btn');
    
    if (lView) lView.style.display = 'block';
    if (gView) gView.style.display = 'none';
    if (pView) pView.style.display = 'none';
    if (rBtn) {
        rBtn.disabled = false;
        rBtn.innerText = "I'M READY"; 
    }
    socket.emit('join_jeopardy', { name: currentUser });
}

function sendReady() {
    masterUnlockAudio();
    socket.emit('player_ready');
    const rBtn = document.getElementById('ready-btn');
    if (rBtn) {
        rBtn.innerText = "WAITING FOR OTHERS..."; 
        rBtn.disabled = true;
    }
}

socket.on('lobby_update', (data) => {
    const rc = document.getElementById('lobby-ready-count');
    const tc = document.getElementById('lobby-total-count');
    if (rc) rc.innerText = data.ready;
    if (tc) tc.innerText = data.total;
});

socket.on('score_update', (scores) => {
    const list = document.getElementById('j-live-scores');
    if (!list) return;
    list.innerHTML = "";
    scores.forEach((p, idx) => {
        const isMe = p.name === currentUser;
        const color = isMe ? "var(--primary-gold)" : "white";
        const isOnFire = p.streak >= 3;
        const isEliminated = p.eliminated;
        const hasBounty = p.globalWinStreak >= 2;
        
        let rowClass = "lb-row";
        if (isEliminated) rowClass += " eliminated";

        list.innerHTML += `<div class="${rowClass}" style="display:flex; align-items:center; justify-content:space-between; color:${color}; font-weight:${isMe?'bold':'normal'}; padding: 10px 5px;">
            <div style="display:flex; align-items:center;">
                ${getAvatar(p.name, p.globalPoints, isOnFire, hasBounty)}
            </div>
            <div style="text-align: right;">
                <span style="font-size:18px; font-weight: bold;">${p.score}</span>
                ${isOnFire ? '<br><span style="font-size:10px; color:var(--accent-red); font-weight:bold;">ON FIRE 🔥</span>' : ''}
                ${isEliminated ? '<br><span style="font-size:10px; color:var(--text-muted); font-weight:bold;">ELIMINATED 💀</span>' : ''}
            </div>
        </div>`;
    });
});

socket.on('game_starting', () => {
    usedJeopardyQuestions = []; 
    const lView = document.getElementById('j-lobby-view');
    const gView = document.getElementById('j-game-view');
    const qBox = document.getElementById('j-question-box');
    
    if (lView) lView.style.display = 'none';
    if (gView) gView.style.display = 'block';
    if (qBox) {
        qBox.innerText = "Game is beginning...";
        qBox.className = "big-tv";
    }
    speak("Welcome to the Academy Live Jeopardy. Let the games begin.");
});

socket.on('round_update', (data) => {
    const rd = document.getElementById('j-round-display');
    if (rd) rd.innerText = `${data.round}/${data.max}`;
});

socket.on('request_question', (data) => {
    if (socket.id === data.hostId) {
        const categories = ['kids', 'teens', 'training', 'lessons', 'health', 'actualfacts', 'jeopardyVault']; 
        const diffs = ['easy', 'medium', 'hard', 'extreme', 'exact'];
        let randomQ = null;
        let randomCat = "";
        
        while (!randomQ) {
            randomCat = categories[Math.floor(Math.random() * categories.length)];
            const randomDiff = diffs[Math.floor(Math.random() * diffs.length)];
            const questions = quizData[randomCat] ? quizData[randomCat][randomDiff] : null;
            if (!questions) continue;
            
            const available = questions.filter(q => !usedJeopardyQuestions.includes(q.question));
            if (available.length > 0) {
                randomQ = available[Math.floor(Math.random() * available.length)];
                randomQ.categoryTitle = quizData[randomCat].title;
            }
        }
        
        socket.emit('start_round', randomQ); 
    }
});

socket.on('golden_alert', () => {
    sfx.siren();
    const qBox = document.getElementById('j-question-box');
    if (qBox) {
        qBox.className = "big-tv golden-tv";
        qBox.innerHTML = "<span style='color: white; font-size:36px;'>🚨 THE GOLDEN QUESTION 🚨<br><span style='font-size:20px; color:var(--accent-yellow); font-family:var(--font-body);'>Triple Points on the Line</span></span>";
    }
    speak("Alert. This is the Golden Question. Triple points are on the line.");
});

socket.on('player_on_fire', (data) => {
    speak(`${data.name} is on fire!`);
});

socket.on('announce_category', (data) => {
    const qBox = document.getElementById('j-question-box');
    if (qBox) {
        if (!data.isGolden) qBox.className = "big-tv";
        qBox.innerHTML = `<span style="font-size:16px; color:var(--primary-gold); font-family:var(--font-body); display:block; margin-bottom:10px; text-transform:uppercase;">Category</span>${data.categoryTitle}`;
    }
    speak(`The category is... ${data.categoryTitle}. Here is the question.`);
});

socket.on('timer_update', (data) => {
    const t = document.getElementById('j-timer-display');
    const bar = document.getElementById('pressure-bar');
    
    if (t) t.innerText = data.text;
    
    if (data.maxTime && bar) {
        const percentage = (data.timeLeft / data.maxTime) * 100;
        bar.style.width = percentage + "%";
        
        if (percentage > 50) {
            bar.style.background = "var(--primary-gold)"; 
            if (t) t.style.color = "var(--primary-gold)";
        } else if (percentage > 25) {
            bar.style.background = "#f97316"; 
            if (t) t.style.color = "#f97316";
        } else {
            bar.style.background = "var(--accent-red)"; 
            if (t) t.style.color = "var(--accent-red)";
            sfx.heartbeat();
        }
    }
});

socket.on('new_question', (qData) => {
    if (!usedJeopardyQuestions.includes(qData.question)) {
        usedJeopardyQuestions.push(qData.question);
    }
    
    const qBox = document.getElementById('j-question-box');
    const bStatus = document.getElementById('buzzer-status');
    const btn = document.getElementById('buzzer-btn');
    const optBox = document.getElementById('j-options-box');
    
    if (qBox) qBox.innerText = qData.question;
    speak(qData.question); 
    
    if (bStatus) {
        bStatus.innerText = "BUZZ IN!";
        bStatus.style.color = "var(--accent-green)"; 
    }
    if (btn) {
        btn.className = "buzzer-ready";
        btn.innerText = "BUZZ!";
    }
    if (optBox) optBox.style.display = "none";
    window.currentJeopardyOptions = trueShuffle(qData.options);
});

function sendBuzz() {
    masterUnlockAudio();
    const btn = document.getElementById('buzzer-btn');
    if(btn && btn.className.includes('buzzer-ready')){
        socket.emit('buzz', { name: currentUser });
    }
}

socket.on('player_eliminated', () => {
    const btn = document.getElementById('buzzer-btn');
    const bStatus = document.getElementById('buzzer-status');
    if (btn) {
        btn.className = "buzzer-locked";
        btn.innerText = "DEAD";
    }
    if (bStatus) {
        bStatus.innerText = "YOU ARE ELIMINATED.";
        bStatus.style.color = "var(--accent-red)";
    }
});

socket.on('player_buzzed', (data) => {
    sfx.buzz(); 
    if (window.speechSynthesis) window.speechSynthesis.cancel(); 
    
    const btn = document.getElementById('buzzer-btn');
    const bStatus = document.getElementById('buzzer-status');
    const optBox = document.getElementById('j-options-box');

    if (btn && !btn.className.includes("DEAD")) {
        btn.className = "buzzer-locked";
        btn.innerText = "LOCKED";
    }
    
    const isMe = (data.name === currentUser);
    if (isMe) {
        if (bStatus) bStatus.innerText = "YOU BUZZED IN!";
        if (optBox) {
            optBox.style.display = "flex";
            optBox.innerHTML = "";
            let shuffled = trueShuffle(window.currentJeopardyOptions); 
            shuffled.forEach(opt => {
                const obtn = document.createElement('button');
                obtn.className = 'option-btn';
                obtn.innerText = opt;
                obtn.onclick = () => { masterUnlockAudio(); submitJeopardyAnswer(opt); };
                optBox.appendChild(obtn);
            });
        }
    } else {
        if (bStatus) bStatus.innerText = `Waiting for ${data.name}...`;
    }
});

function submitJeopardyAnswer(selectedAnswer) {
    const box = document.getElementById('j-options-box');
    if (box) {
        box.classList.add('locked');
        const btns = box.querySelectorAll('.option-btn');
        btns.forEach(b => b.disabled = true);
    }
    socket.emit('submit_answer', { name: currentUser, answer: selectedAnswer });
}

socket.on('answer_result', (data) => {
    const qBox = document.getElementById('j-question-box');
    const optBox = document.getElementById('j-options-box');
    
    if (data.isCorrect) {
        sfx.correct();
        if (qBox) qBox.innerText = `${data.name} got it right!`;
        speak(`Correct. ${data.name} gains points.`);
    } else {
        sfx.wrong();
        if (qBox) qBox.innerText = `${data.name} was incorrect.`;
        speak(`Incorrect.`);
    }
    if (optBox) {
        optBox.style.display = "none";
        optBox.classList.remove('locked');
    }
});

socket.on('reset_buzzer', () => {
    const btn = document.getElementById('buzzer-btn');
    const bStatus = document.getElementById('buzzer-status');
    const pBar = document.getElementById('pressure-bar');
    
    if (btn && !btn.className.includes("DEAD")) {
        btn.className = "buzzer-locked";
        btn.innerText = "WAIT";
    }
    if (bStatus) {
        bStatus.innerText = "Preparing next question...";
        bStatus.style.color = "var(--text-muted)";
    }
    if (pBar) {
        pBar.style.width = "100%";
        pBar.style.background = "var(--primary-gold)";
    }
});

socket.on('game_over', (finalScores) => {
    const gView = document.getElementById('j-game-view');
    const pView = document.getElementById('j-podium-view');
    const pResults = document.getElementById('podium-results');
    
    if (gView) gView.style.display = 'none';
    if (pView) pView.style.display = 'block';
    
    let html = "";
    finalScores.forEach((s, i) => {
        let medal = i === 0 ? "🥇" : (i === 1 ? "🥈" : (i === 2 ? "🥉" : ""));
        let acc = s.stats.buzzes > 0 ? Math.round((s.stats.correct / s.stats.buzzes) * 100) : 0;
        let avgTime = s.stats.buzzes > 0 ? (s.stats.responseTimeSum / s.stats.buzzes).toFixed(1) : 0;

        html += `<div style="margin-bottom:20px; border-bottom:1px solid var(--border-heavy); padding-bottom:15px;">
            <div style="display:flex; align-items:center;">
                <span style="font-size:32px; margin-right:15px;">${medal}</span>
                ${getAvatar(s.name, s.globalPoints)}
                <span style="margin-left:auto; font-size:24px; font-weight:bold; color:var(--accent-green);">${s.score} pts</span>
            </div>
            <div style="display:flex; justify-content:space-around; font-size:14px; color:var(--text-muted); margin-top:15px; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px;">
                <span>🎯 Acc: ${acc}%</span>
                <span>⏱️ Speed: ${avgTime}s</span>
                <span>🔥 Streak: ${s.maxStreak || 0}</span>
            </div>
        </div>`;
        
        if (i === 0 && s.bountyCollected) {
            html += `<div style="text-align:center; color:var(--accent-red); font-weight:800; font-size:16px; margin-bottom:10px;">🎯 BOUNTY COLLECTED! +5,000 Global Points!</div>`;
        }
    });
    
    if (pResults) pResults.innerHTML = html;
    
    if (typeof confetti !== 'undefined') {
        var end = Date.now() + 3000;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#d4af37', '#ffffff', '#000000'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#d4af37', '#ffffff', '#000000'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }

    if (finalScores.length > 0) speak(`The game is over. Congratulations to ${finalScores[0].name}.`);
});

// ---------------------------------------------------------
// 10. STUDY & DIFFICULTY LOGIC
// ---------------------------------------------------------
let selectedModeTemp = "";
function showDifficulty(mode) { 
    selectedModeTemp = mode; 
    const modal = document.getElementById('difficulty-modal');
    if (modal) modal.classList.add('active'); 
}

function closeDifficulty() { 
    const modal = document.getElementById('difficulty-modal');
    if (modal) modal.classList.remove('active'); 
}

function selectDifficulty(diff) {
    closeDifficulty();
    pointMultiplier = diff === 'easy' ? 100 : (diff === 'medium' ? 250 : (diff === 'hard' ? 500 : 1000));
    openStudyLibrary(selectedModeTemp, diff);
}

function openStudyLibrary(mode, diff) {
    masterUnlockAudio();
    currentPath = mode; currentDiff = diff;
    if (mode === 'adults' || mode === 'actualfacts') pointMultiplier = 1000; 
    
    switchScreen('study-screen');
    
    const sTitle = document.getElementById('study-title');
    const sText = document.getElementById('study-text');
    if (sTitle) sTitle.innerText = quizData[mode].title + (diff === 'exact' ? " (Exact Translation)" : ` (${diff.toUpperCase()})`);
    if (sText) sText.innerHTML = quizData[mode].studyText;
}

// ---------------------------------------------------------
// 11. MAIN QUIZ LOGIC
// ---------------------------------------------------------
function beginQuizFromStudy() {
    sessionCancelToken++; 
    masterUnlockAudio();
    currentIdx = 0; correctAnswers = 0; pointsThisSession = 0;
    
    const lp = document.getElementById('live-points');
    if (lp) lp.innerText = "0";
    
    if (!quizData[currentPath] || !quizData[currentPath][currentDiff]) {
        console.error("Quiz data missing for path:", currentPath, currentDiff);
        return; 
    }
    
    activeQuestions = [...quizData[currentPath][currentDiff]];
    
    if (currentPath !== 'adults' && currentPath !== 'actualfacts') {
        activeQuestions = trueShuffle(activeQuestions);
    }
    
    switchScreen('quiz-screen');
    loadQuestion();
}

function loadQuestion() {
    if (!activeQuestions || activeQuestions.length === 0) return;
    
    const q = activeQuestions[currentIdx];
    const progress = ((currentIdx) / activeQuestions.length) * 100;
    
    const pBar = document.getElementById('progress-bar');
    const pText = document.getElementById('progress-text');
    const qText = document.getElementById('question');
    const optionsDiv = document.getElementById('options');
    const mTitle = document.getElementById('mode-title');
    
    if (pBar) pBar.style.width = progress + "%";
    if (pText) pText.innerText = `Question ${currentIdx + 1} of ${activeQuestions.length}`;
    if (qText) qText.innerText = q.question;
    if (mTitle) mTitle.innerText = quizData[currentPath].title;
    
    if (!optionsDiv) return;
    
    optionsDiv.classList.remove('locked');
    optionsDiv.innerHTML = "";
    
    let shuffledOptions = trueShuffle([...q.options]);
    
    shuffledOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn'; 
        btn.innerText = opt;
        
        btn.onclick = function(e) { 
            e.preventDefault();
            this.blur();
            checkAnswer(opt, this, q.correct); 
        };
        optionsDiv.appendChild(btn);
    });
}

function checkAnswer(selected, btn, correct) {
    masterUnlockAudio();
    const optionsDiv = document.getElementById('options');
    
    if (optionsDiv) {
        optionsDiv.classList.add('locked');
        const quizBtns = optionsDiv.querySelectorAll('.option-btn');
        quizBtns.forEach(b => {
            b.disabled = true;
            b.blur();
        });
    }
    
    if (document.activeElement) document.activeElement.blur();
    
    if (selected === correct) {
        correctAnswers++; pointsThisSession += pointMultiplier;
        const lp = document.getElementById('live-points');
        if (lp) lp.innerText = pointsThisSession;
        btn.classList.add('correct');
        sfx.correct();
    } else {
        btn.classList.add('wrong');
        
        if (optionsDiv) {
            const quizBtns = optionsDiv.querySelectorAll('.option-btn');
            quizBtns.forEach(b => {
                if (b.innerText === correct) {
                    b.classList.add('correct');
                }
            });
        }
        sfx.wrong();
    }
    
    let currentToken = sessionCancelToken; 
    setTimeout(() => {
        if (currentToken !== sessionCancelToken) return; 
        currentIdx++;
        if (currentIdx < activeQuestions.length) {
            loadQuestion(); 
        } else {
            showResults();
        }
    }, 1500);
}

// ---------------------------------------------------------
// 12. END GAME & LEADERBOARD
// ---------------------------------------------------------
function showResults() {
    switchScreen('result-screen');
    
    const totalQ = activeQuestions.length;
    const fScore = document.getElementById('final-score');
    const ePoints = document.getElementById('earned-points');
    const rDisp = document.getElementById('rank-display');
    const dPts = document.getElementById('display-points');
    
    if (fScore) fScore.innerText = `${correctAnswers}/${totalQ}`;
    if (ePoints) ePoints.innerText = pointsThisSession;
    
    currentPoints += pointsThisSession;
    
    let rank = "Student";
    if (correctAnswers === totalQ) rank = "Vanguard / Captain";
    else if (correctAnswers >= totalQ / 2) rank = "Builder";
    
    if (rDisp) rDisp.innerText = `Rank Earned: ${rank}`;
    
    try { localStorage.setItem('noi_points', currentPoints); } catch(e){}
    if (dPts) dPts.innerText = currentPoints;
    document.getElementById('nav-avatar-container').innerHTML = getAvatar(currentUser, currentPoints);
    socket.emit('update_global_score', { name: currentUser, points: currentPoints });
}

function showLeaderboard() {
    masterUnlockAudio();
    switchScreen('leaderboard-screen');
    socket.emit('get_leaderboard');
}

socket.on('leaderboard_data', (data) => {
    const listDiv = document.getElementById('leaderboard-list');
    if (!listDiv) return;
    listDiv.innerHTML = "";
    data.sort((a, b) => b.points - a.points);
    data.forEach((user, index) => {
        const isMe = user.name === currentUser;
        const row = document.createElement('div');
        row.className = `lb-row ${isMe ? 'me' : ''}`;
        row.innerHTML = `
            <div style="display:flex; align-items:center;">
                <span style="font-size: 20px; font-weight: bold; color: var(--text-muted); margin-right: 15px;">#${index + 1}</span>
                ${getAvatar(user.name, user.points)}
            </div>
            <span style="font-weight: bold; font-size: 18px; color: var(--primary-gold);">${user.points.toLocaleString()} pts</span>
        `;
        listDiv.appendChild(row);
    });
});

// ---------------------------------------------------------
// 13. MASTER NAVIGATION
// ---------------------------------------------------------
function returnToMenu() {
    sessionCancelToken++; 
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    clearInterval(bpTimerInt);
    socket.emit('bp_leave_room');
    socket.emit('leave_arena');
    socket.emit('leave_jeopardy');
    socket.emit('leave_tug');
    bpIsHost = false;
    bpRoomCode = "";
    switchScreen('home-screen');
}

// ---------------------------------------------------------
// 14. MODERN LOBBY CHAT LOGIC
// ---------------------------------------------------------
function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const msg = input.value.trim();
    if (msg !== "") {
        socket.emit('send_chat', { name: currentUser, message: msg });
        input.value = "";
    }
}

socket.on('receive_chat', (data) => {
    const box = document.getElementById('chat-box');
    if (!box) return;
    const msgDiv = document.createElement('div');
    const isSystem = data.name === "SYSTEM";
    const isMe = data.name === currentUser;
    
    if (isSystem) {
        msgDiv.style.textAlign = "center";
        msgDiv.style.margin = "10px 0";
        msgDiv.innerHTML = `<span style="background:rgba(255,255,255,0.05); padding:6px 12px; border-radius:12px; font-size:12px; color:var(--text-muted);">${data.message}</span>`;
    } else {
        msgDiv.style.display = "flex";
        msgDiv.style.margin = "10px 0";
        msgDiv.style.justifyContent = isMe ? "flex-end" : "flex-start";
        
        let bubble = `<div style="background:${isMe ? 'var(--primary-gold-glow)' : 'var(--bg-card)'}; border:1px solid var(--border-light); padding:10px 15px; border-radius:12px; max-width:80%;">
            <div style="font-size:11px; font-weight:800; color:var(--primary-gold); margin-bottom:4px; text-transform:uppercase; font-family:var(--font-heading);">${data.name}</div>
            <div style="color:white; font-size:14px; line-height:1.4; word-break:break-word;">${data.message}</div>
        </div>`;
        
        msgDiv.innerHTML = isMe ? bubble : getAvatar(data.name, data.globalPoints) + bubble;
    }

    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight; 
});

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement && document.activeElement.id === 'chat-input') {
        sendChatMessage();
    }
});
