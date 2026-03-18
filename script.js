/**
 * The Knowledge Portal - V4.2 AAA FULL BUILD
 * VERSION: 4.2.0-STABLE
 * * FEATURES INCLUDED:
 * 1. Post-Game Analytics (Accuracy, Avg Buzz Speed, Max Streak)
 * 2. Sudden Death Elimination Logic
 * 3. Global Win Streak Bounty System
 * 4. Triple-Point Golden Questions
 * 5. Pressure Bar Timer SFX
 * 6. Mobile Audio Wakeup Hardware Bypass
 * 7. Screen Management System (Fixed Stuck Loading & Highlight Removed)
 * * DATABASE: 180 Questions across 7 Paths
 */

const socket = io();
let currentUser = "";
let audioCtx = null;
let voiceUnlocked = false;

// ---------------------------------------------------------
// 1. FULL MASSIVE QUESTION DATABASE (180 Questions Preserved)
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
        ] 
    },
    teens: { 
        title: "The Awakening", 
        studyText: "Welcome to The Awakening. As a teenager, you are preparing to take on the world. You must understand 'Knowledge of Self' and the concept of 'Do For Self'.", 
        easy: [ 
            { question: "What is the core meaning of the concept 'Do For Self'?", options: ["Working for others", "Building our own schools, farms, and businesses", "Waiting for help"], correct: "Building our own schools, farms, and businesses" }, 
            { question: "Which famous heavyweight boxing champion was a student of the Honorable Elijah Muhammad?", options: ["Mike Tyson", "Muhammad Ali", "Joe Frazier"], correct: "Muhammad Ali" }, 
            { question: "Knowledge of ___ is the first step to success.", options: ["Money", "Self", "Science"], correct: "Self" }, 
            { question: "Why is Saviours' Day celebrated every year?", options: ["To celebrate spring", "To commemorate the birth of Master Fard Muhammad", "To open a Mosque"], correct: "To commemorate the birth of Master Fard Muhammad" }, 
            { question: "According to the teachings, what is the root meaning of the word 'Black'?", options: ["Empty space", "The source of all things / Original", "Darkness"], correct: "The source of all things / Original" },
            { question: "What is the ultimate goal of 'Do For Self'?", options: ["To make a lot of money", "Independence and self-reliance", "To be famous"], correct: "Independence and self-reliance" },
            { question: "Who gave Malcolm X his 'X'?", options: ["He chose it himself", "The Honorable Elijah Muhammad", "Master Fard Muhammad"], correct: "The Honorable Elijah Muhammad" },
            { question: "What was the original name of the Honorable Minister Louis Farrakhan?", options: ["Louis Eugene Walcott", "Louis Shabazz", "Louis Smith"], correct: "Louis Eugene Walcott" },
            { question: "What did the Honorable Elijah Muhammad say is the key to our salvation?", options: ["Going to college", "Unity and Knowledge of Self", "Moving to another country"], correct: "Unity and Knowledge of Self" },
            { question: "What is the official newspaper of the Nation of Islam?", options: ["The Final Call", "The Daily Planet", "The Messenger"], correct: "The Final Call" }
        ], 
        medium: [ 
            { question: "Who wrote the book 'Message to the Blackman in America'?", options: ["Marcus Garvey", "The Honorable Elijah Muhammad", "Malcolm X"], correct: "The Honorable Elijah Muhammad" }, 
            { question: "True wealth in the Nation of Islam is measured by having what?", options: ["Fast cars and jewelry", "Health, Knowledge, and Land", "Fame on social media"], correct: "Health, Knowledge, and Land" }, 
            { question: "What is the purpose of the 10,000 Fearless?", options: ["To stand between the gangs and stop violence", "To join the military", "To travel the world"], correct: "To stand between the gangs and stop violence" }, 
            { question: "What was the original name of the Honorable Elijah Muhammad before he met Master Fard Muhammad?", options: ["Elijah Poole", "Elijah Shabazz", "Elijah X"], correct: "Elijah Poole" }, 
            { question: "What is the name of the farm owned by the Nation of Islam?", options: ["Freedom Farms", "Muhammad Farms", "Crescent Farms"], correct: "Muhammad Farms" },
            { question: "What major historical event did Minister Farrakhan lead on October 16, 1995?", options: ["The March on Washington", "The Million Man March", "The Civil Rights March"], correct: "The Million Man March" },
            { question: "What does the 'X' in a Muslim's name mean?", options: ["A Roman numeral for 10", "An unknown variable replacing the slave name", "Extreme"], correct: "An unknown variable replacing the slave name" },
            { question: "What book did the Honorable Elijah Muhammad write that outlines the core beliefs?", options: ["Message to the Blackman in America", "The Autobiography of Malcolm X", "The Divine Light"], correct: "Message to the Blackman in America" },
            { question: "How many people attended the Million Man March?", options: ["100,000", "500,000", "Over one million men"], correct: "Over one million men" },
            { question: "What is the economic program introduced by the Honorable Elijah Muhammad?", options: ["The Three Year Economic Plan", "The National Economic Blueprint", "The Wealth Program"], correct: "The National Economic Blueprint" }
        ], 
        hard: [ 
            { question: "In what year was the Honorable Minister Louis Farrakhan born?", options: ["1933", "1940", "1925"], correct: "1933" }, 
            { question: "What was the name of the major event led by Minister Farrakhan in Washington D.C. in 1995?", options: ["The Civil Rights March", "The Million Man March", "The Freedom Rally"], correct: "The Million Man March" }, 
            { question: "In the teachings, what does the letter 'X' represent in a believer's name?", options: ["Extreme", "An unknown quality, replacing the slavemaster's name", "A Roman numeral for 10"], correct: "An unknown quality, replacing the slavemaster's name" }, 
            { question: "What is the title of the book written by Minister Farrakhan that deals with divine light?", options: ["A Torchlight for America", "The Divine Light", "Message to the Blackman"], correct: "A Torchlight for America" }, 
            { question: "Who was the first National Representative appointed by the Honorable Elijah Muhammad?", options: ["Malcolm X", "Silis Muhammad", "Louis Farrakhan"], correct: "Malcolm X" },
            { question: "What was the name of the original newspaper published by the Honorable Elijah Muhammad?", options: ["The Final Call", "Muhammad Speaks", "The Islamic News"], correct: "Muhammad Speaks" },
            { question: "In what year did the Honorable Elijah Muhammad depart?", options: ["1965", "1975", "1981"], correct: "1975" },
            { question: "What city did Minister Farrakhan first lead as the Minister?", options: ["Chicago, Mosque No. 2", "Boston, Mosque No. 11", "New York, Mosque No. 7"], correct: "Boston, Mosque No. 11" },
            { question: "Who did the Honorable Elijah Muhammad appoint as the National Representative before Minister Farrakhan?", options: ["Malcolm X", "Muhammad Ali", "Imam W.D. Mohammed"], correct: "Malcolm X" },
            { question: "What was the theme of the 20th Anniversary of the Million Man March?", options: ["The Millions More Movement", "Justice Or Else", "The Holy Day of Atonement"], correct: "Justice Or Else" }
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
            { question: "What day of the week is M.G.T. class?", options: ["Tuesday", "Thursday", "Saturday"], correct: "Thursday" },
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
            { question: "What is the primary purpose of the F.O.I.?", options: ["To sell newspapers", "To protect the Nation and the Black Woman", "To march in parades"], correct: "To protect the Nation and the Black Woman" },
            { question: "What do the F.O.I. sell in the streets to spread the teachings?", options: ["Bean Pies", "The Final Call Newspaper", "Incense"], correct: "The Final Call Newspaper" },
            { question: "Which training unit teaches sisters how to care for their spouses?", options: ["How to take care of their husbands", "How to sew", "How to act abroad"], correct: "How to take care of their husbands" }
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
            { question: "Who is the Father of Civilization?", options: ["Yacub", "The Asiatic Black Man", "The Romans"], correct: "The Asiatic Black Man" },
            { question: "What is the area in square miles of the planet Earth?", options: ["100,000,000 square miles", "196,940,000 square miles", "57,255,000 square miles"], correct: "196,940,000 square miles" },
            { question: "How fast does light travel?", options: ["100,000 miles per second", "1,120 feet per second", "186,000 miles per second"], correct: "186,000 miles per second" },
            { question: "How far is the Earth from the Sun?", options: ["93,000,000 miles", "50,000,000 miles", "10,000,000 miles"], correct: "93,000,000 miles" },
            { question: "What is the total weight of the planet Earth?", options: ["10 billion tons", "1 trillion tons", "6 sextillion tons"], correct: "6 sextillion tons" },
            { question: "What is the exact square miles of useful land used every day?", options: ["57,255,000 square miles", "139,685,000 square miles", "196,940,000 square miles"], correct: "57,255,000 square miles" }
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
        ] 
    },
    history: { 
        title: "Our History", 
        studyText: "Trace the history of the Lost-Found Nation of Islam from the arrival of Master Fard Muhammad in 1930 to the leadership of the Honorable Minister Louis Farrakhan today.", 
        easy: [ 
            { question: "In what year was the Nation of Islam founded in North America?", options: ["1920", "1930", "1955"], correct: "1930" }, 
            { question: "In what city did Master Fard Muhammad first make Himself known?", options: ["Chicago", "New York", "Detroit"], correct: "Detroit" }, 
            { question: "Who was the most famous heavyweight boxing champion to join the Nation of Islam?", options: ["Joe Frazier", "Muhammad Ali", "Mike Tyson"], correct: "Muhammad Ali" }, 
            { question: "What is the name of the official newspaper currently published by the Nation of Islam?", options: ["The Final Call", "Muhammad Speaks", "The Muslim Journal"], correct: "The Final Call" }, 
            { question: "Who is the current National Representative of the Honorable Elijah Muhammad?", options: ["Minister Louis Farrakhan", "Malcolm X", "Imam W.D. Mohammed"], correct: "Minister Louis Farrakhan" },
            { question: "Who founded the Nation of Islam?", options: ["Malcolm X", "Master Fard Muhammad", "Martin Luther King Jr."], correct: "Master Fard Muhammad" },
            { question: "In what city did the Nation of Islam begin?", options: ["Detroit", "Atlanta", "Los Angeles"], correct: "Detroit" },
            { question: "Who did Master Fard Muhammad choose to lead the NOI?", options: ["The Honorable Elijah Muhammad", "Marcus Garvey", "Noble Drew Ali"], correct: "The Honorable Elijah Muhammad" },
            { question: "What was the name of the first school established by the NOI?", options: ["Public School 1", "University of Islam", "The Final Call School"], correct: "University of Islam" },
            { question: "Who was the prominent Civil Rights era spokesman for the NOI before 1964?", options: ["Al Sharpton", "Malcolm X", "Jesse Jackson"], correct: "Malcolm X" }
        ], 
        medium: [ 
            { question: "What was the name of the historic gathering called by Minister Farrakhan in Washington D.C. in 1995?", options: ["The Civil Rights March", "The Million Man March", "The Justice Rally"], correct: "The Million Man March" }, 
            { question: "Who was the pioneering woman who established the University of Islam schools?", options: ["Mother Clara Muhammad", "Mother Tynnetta Muhammad", "Sister Ava Muhammad"], correct: "Mother Clara Muhammad" }, 
            { question: "What was the original name of the newspaper published by the Honorable Elijah Muhammad in the 1960s?", options: ["The Final Call", "Muhammad Speaks", "The Islamic News"], correct: "Muhammad Speaks" }, 
            { question: "In what year did Master Fard Muhammad physically depart and leave the Nation to Elijah Muhammad?", options: ["1934", "1950", "1975"], correct: "1934" }, 
            { question: "What was Muhammad Ali's given 'slave name' before he received his original name?", options: ["Cassius Clay", "Joe Louis", "George Foreman"], correct: "Cassius Clay" },
            { question: "What year did Master Fard Muhammad depart?", options: ["1934", "1950", "1975"], correct: "1934" },
            { question: "What major event did Minister Farrakhan organize in 1995?", options: ["The Million Man March", "The March on Washington", "The Freedom Riders"], correct: "The Million Man March" },
            { question: "What was the primary economic focus of the NOI under Elijah Muhammad?", options: ["Buying stock in white companies", "Buying farmland and establishing independent businesses", "Relying on government assistance"], correct: "Buying farmland and establishing independent businesses" },
            { question: "Who was the first National Secretary of the NOI?", options: ["John Ali", "Elijah Muhammad", "Malcolm X"], correct: "John Ali" },
            { question: "What was the name of the airplane purchased by the NOI?", options: ["The Final Call Jet", "The Jet of Islam", "A Lockheed Jetstar (The 'Saviour')"], correct: "A Lockheed Jetstar (The 'Saviour')" }
        ], 
        hard: [ 
            { question: "In what year did the Honorable Elijah Muhammad depart (escape a death plot)?", options: ["1965", "1975", "1981"], correct: "1975" }, 
            { question: "In what year did the Honorable Minister Louis Farrakhan stand up to rebuild the Nation of Islam?", options: ["1977", "1981", "1995"], correct: "1977" }, 
            { question: "What was Minister Louis Farrakhan's name before he joined the Nation of Islam?", options: ["Louis Eugene Walcott", "Louis X", "Louis Shabazz"], correct: "Louis Eugene Walcott" }, 
            { question: "Which prominent mosque in Chicago was purchased and rebuilt to serve as the National Center?", options: ["Mosque Maryam (Mosque No. 2)", "Mosque No. 1", "Mosque No. 7"], correct: "Mosque Maryam (Mosque No. 2)" }, 
            { question: "What major event did Minister Farrakhan convene in 2015 to commemorate the 20th anniversary of the Million Man March?", options: ["Justice Or Else", "The Millions More Movement", "The Holy Day of Atonement"], correct: "Justice Or Else" },
            { question: "In what year did the Honorable Minister Louis Farrakhan stand up to rebuild the work of Elijah Muhammad?", options: ["1975", "1977", "1981"], correct: "1977" },
            { question: "What is the name of the national headquarters mosque in Chicago?", options: ["Mosque Maryam", "Mosque No. 1", "Mosque No. 7"], correct: "Mosque Maryam" },
            { question: "What was the theme of the 20th Anniversary of the Million Man March?", options: ["Justice Or Else", "The Millions More Movement", "Day of Atonement"], correct: "Justice Or Else" },
            { question: "Who was the first female minister appointed by Minister Farrakhan to lead a mosque?", options: ["Mother Tynnetta Muhammad", "Minister Ava Muhammad", "Sister Clara Muhammad"], correct: "Minister Ava Muhammad" },
            { question: "What was the name of the organization established by Wallace D. Fard before the Nation of Islam?", options: ["The Moorish Science Temple", "Allah's Temple of Islam", "The Black Panther Party"], correct: "Allah's Temple of Islam" }
        ] 
    },
    adults: { 
        title: "Registration Track", 
        studyText: "The Student Enrollment. You must memorize these 10 exact questions and answers word-for-word.", 
        exact: [ 
            { question: "1. Who is the Original Man?", options: ["The Original Man is the Asiatic Black man; the Maker; the Owner; the Cream of the planet Earth - Father of Civilization, God of the Universe.", "The Original Man is the people of the East who study the stars.", "The Original Man is the first man to discover electricity."], correct: "The Original Man is the Asiatic Black man; the Maker; the Owner; the Cream of the planet Earth - Father of Civilization, God of the Universe." }, 
            { question: "2. Who is the Colored Man?", options: ["The Colored Man is the people who live in the islands.", "The Colored Man is the Caucasian (white) man; or Yacub's grafted devil - the Skunk of the planet Earth.", "The Colored Man is the descendants of the Original Man."], correct: "The Colored Man is the Caucasian (white) man; or Yacub's grafted devil - the Skunk of the planet Earth." }, 
            { question: "3. What is the population of the Original Nation in the wilderness of North America, and all over the planet Earth?", options: ["The population of the Original Nation in the wilderness of North America is 10 million, and 1 billion on Earth.", "The population of the Original Nation in the wilderness of North America is 17,000,000. With the 2,000,000 Indians makes it 19,000,000. All over the planet Earth is 4,400,000,000.", "The population of the Original Nation in the wilderness of North America is 50 million, and 3 billion on Earth."], correct: "The population of the Original Nation in the wilderness of North America is 17,000,000. With the 2,000,000 Indians makes it 19,000,000. All over the planet Earth is 4,400,000,000." }, 
            { question: "4. What is the population of the Colored People in the wilderness of North America, and all over the planet Earth?", options: ["The population of the Colored People in the wilderness of North America is 103,000,000. All over the planet Earth is 400,000,000.", "The population of the Colored People in the wilderness of North America is 200 million, and 1 billion on Earth.", "The population of the Colored People in the wilderness of North America is 85 million, and 500 million on Earth."], correct: "The population of the Colored People in the wilderness of North America is 103,000,000. All over the planet Earth is 400,000,000." }, 
            { question: "5. What is the area in square miles of the planet Earth?", options: ["The square mileage of the planet Earth is 100 million square miles.", "The square mileage of the planet Earth is 196,940,000 square miles.", "The square mileage of the planet Earth is 250 million square miles."], correct: "The square mileage of the planet Earth is 196,940,000 square miles." }, 
            { question: "6. What are the exact square miles of the useful land that is used every day by the total population of the planet Earth?", options: ["The useful land that is used every day by the total population of the planet Earth is 57,255,000 square miles.", "The useful land that is used every day by the total population of the planet Earth is 50,000,000 square miles.", "The useful land that is used every day by the total population of the planet Earth is 100,000,000 square miles."], correct: "The useful land that is used every day by the total population of the planet Earth is 57,255,000 square miles." }, 
            { question: "7. What are the exact square miles of the useful water that is used every day by the total population of the planet Earth?", options: ["The useful water that is used every day by the total population of the planet Earth is 20,000,000 square miles.", "The useful water that is used every day by the total population of the planet Earth is 139,685,000 square miles.", "The useful water that is used every day by the total population of the planet Earth is 90,000,000 square miles."], correct: "The useful water that is used every day by the total population of the planet Earth is 139,685,000 square miles." }, 
            { question: "8. What is the total weight of our planet Earth?", options: ["The total weight of our planet Earth is 10 billion tons.", "The total weight of our planet Earth is 6 sextillion tons (a six followed by twenty-one ciphers).", "The total weight of our planet Earth is 1 trillion tons."], correct: "The total weight of our planet Earth is 6 sextillion tons (a six followed by twenty-one ciphers)." }, 
            { question: "9. How far is the planet Earth from the Sun?", options: ["The planet Earth is 10 million miles from the Sun.", "The planet Earth is 50 million miles from the Sun.", "The planet Earth is 93,000,000 miles from the Sun."], correct: "The planet Earth is 93,000,000 miles from the Sun." }, 
            { question: "10. How fast does light travel?", options: ["Light travels at the rate of 100,000 miles per second.", "Light travels at the rate of 186,000 miles per second.", "Light travels at the rate of 1,000 miles per hour."], correct: "Light travels at the rate of 186,000 miles per second." } 
        ] 
    }
};

// ---------------------------------------------------------
// 2. SYSTEM STATE & ACCOUNTS
// ---------------------------------------------------------
let currentPoints = 0;
let currentPath = "";
let currentDiff = "";
let currentIdx = 0;
let correctAnswers = 0;
let pointsThisSession = 0;
let pointMultiplier = 100;
let activeQuestions = []; 
let usedJeopardyQuestions = [];

// ---------------------------------------------------------
// 3. MASTER SCREEN MANAGEMENT (Fixes Loading & Scroll)
// ---------------------------------------------------------
function switchScreen(screenId) {
    const screens = ['login-screen', 'home-screen', 'study-screen', 'quiz-screen', 'result-screen', 'leaderboard-screen', 'jeopardy-screen'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ---------------------------------------------------------
// 4. RANK BADGES, AVATARS & BOUNTY RENDERER
// ---------------------------------------------------------
function getRankBadge(points) {
    if (points >= 15000) return "🟡 Captain";
    if (points >= 5000) return "🔵 Builder";
    return "🟢 Student";
}

function getAvatar(name, points, isOnFire = false, hasBounty = false) {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const color = colors[name.length % colors.length];
    const initial = name.charAt(0).toUpperCase();
    const fireClass = isOnFire ? "on-fire-avatar" : "";
    const rank = getRankBadge(points || 0);
    const bountyStyle = hasBounty ? 'color: #ef4444; text-shadow: 0 0 5px #ef4444;' : '';
    const bountyIcon = hasBounty ? '🎯' : '';
    
    return `<div style="display:flex; align-items:center;">
        <div class="${fireClass}" style="width:32px; height:32px; min-width:32px; border-radius:50%; background:${color}; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px; border:2px solid var(--gold); margin-right:10px; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
            ${isOnFire ? '🔥' : initial}
        </div>
        <span class="rank-badge" style="${bountyStyle}">${bountyIcon} ${rank}</span>
    </div>`;
}

// ---------------------------------------------------------
// 5. RESTORED WORKING AUDIO ENGINE (GLOBAL TOUCH ENABLED)
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
            const wakeup = new SpeechSynthesisUtterance(" ");
            wakeup.volume = 0;
            window.speechSynthesis.speak(wakeup);
        }
        voiceUnlocked = true;
    } catch(e) { console.error("Audio Bypass Failed", e); }
}

// GLOBAL EVENT LISTENERS TO FIX MOBILE VOICE AND PREVENT CRASHES
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
// 6. INITIALIZATION & LOGIN
// ---------------------------------------------------------
window.onload = () => {
    const savedUser = localStorage.getItem('noi_user');
    const savedPoints = localStorage.getItem('noi_points');
    if (savedUser) {
        currentUser = savedUser;
        currentPoints = savedPoints ? parseInt(savedPoints) : 0;
        const dName = document.getElementById('display-name');
        const dPts = document.getElementById('display-points');
        if (dName) dName.innerText = currentUser;
        if (dPts) dPts.innerText = currentPoints;
        socket.emit('join_game', { name: currentUser, points: currentPoints });
        switchScreen('home-screen');
    } else {
        switchScreen('login-screen');
    }
};

function registerUser() {
    masterUnlockAudio();
    const nameInput = document.getElementById('username-input');
    if (!nameInput) return;
    const nameVal = nameInput.value.trim();
    if (nameVal === "") return alert("Please enter a name to begin.");
    
    currentUser = nameVal;
    currentPoints = 0;
    localStorage.setItem('noi_user', currentUser);
    localStorage.setItem('noi_points', currentPoints);
    socket.emit('join_game', { name: currentUser, points: currentPoints });
    
    const dName = document.getElementById('display-name');
    const dPts = document.getElementById('display-points');
    if (dName) dName.innerText = currentUser;
    if (dPts) dPts.innerText = currentPoints;
    
    switchScreen('home-screen');
}

// ---------------------------------------------------------
// 7. PRO JEOPARDY LOGIC (AAA BUILD RESTORED)
// ---------------------------------------------------------
function startJeopardy() {
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
        rBtn.style.background = 'var(--gold)'; 
        rBtn.style.color = 'black'; 
        rBtn.innerText = "I'M READY"; 
        rBtn.disabled = false;
    }
    socket.emit('join_jeopardy', { name: currentUser });
}

function sendReady() {
    masterUnlockAudio();
    socket.emit('player_ready');
    const rBtn = document.getElementById('ready-btn');
    if (rBtn) {
        rBtn.style.background = '#555'; 
        rBtn.style.color = 'white'; 
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
        const color = isMe ? "var(--gold)" : "white";
        const isOnFire = p.streak >= 3;
        const isEliminated = p.eliminated;
        const hasBounty = p.globalWinStreak >= 2;
        
        let rowClass = "lb-row";
        if (isEliminated) rowClass += " eliminated";

        list.innerHTML += `<div class="${rowClass}" style="display:flex; align-items:center; justify-content:space-between; color:${color}; font-weight:${isMe?'bold':'normal'}; padding: 10px 5px; border-bottom:1px solid #333;">
            <div style="display:flex; align-items:center;">
                ${getAvatar(p.name, p.globalPoints, isOnFire, hasBounty)}
                <span class="${hasBounty ? 'bounty-target' : ''}" style="margin-left: 5px;">${idx+1}. ${p.name}</span>
            </div>
            <div style="text-align: right;">
                <span style="font-size:18px;">${p.score}</span>
                ${isOnFire ? '<br><span style="font-size:10px; color:#ef4444; font-weight:bold;">ON FIRE 🔥</span>' : ''}
                ${isEliminated ? '<br><span style="font-size:10px; color:#555; font-weight:bold;">ELIMINATED 💀</span>' : ''}
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
        const categories = ['kids', 'teens', 'training', 'lessons', 'health', 'history']; 
        const diffs = ['easy', 'medium', 'hard'];
        let randomQ = null;
        let randomCat = "";
        while (!randomQ) {
            randomCat = categories[Math.floor(Math.random() * categories.length)];
            const randomDiff = diffs[Math.floor(Math.random() * diffs.length)];
            const questions = quizData[randomCat][randomDiff];
            const available = questions.filter(q => !usedJeopardyQuestions.includes(q.question));
            if (available.length > 0) {
                randomQ = available[Math.floor(Math.random() * available.length)];
                randomQ.categoryTitle = quizData[randomCat].title;
            }
        }
        usedJeopardyQuestions.push(randomQ.question);
        socket.emit('start_round', randomQ); 
    }
});

socket.on('golden_alert', () => {
    sfx.siren();
    const qBox = document.getElementById('j-question-box');
    if (qBox) {
        qBox.className = "big-tv golden-tv";
        qBox.innerHTML = "<span style='color: white; font-size:36px;'>🚨 THE GOLDEN QUESTION 🚨<br><span style='font-size:20px; color:#fbbf24;'>Triple Points on the Line</span></span>";
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
        qBox.innerHTML = `<span style="font-size:20px; color:var(--gold); display:block; margin-bottom:10px; text-transform:uppercase;">Category</span>${data.categoryTitle}`;
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
            bar.style.background = "var(--gold)"; 
            if (t) t.style.color = "var(--gold)";
        } else if (percentage > 25) {
            bar.style.background = "#f97316"; 
            if (t) t.style.color = "#f97316";
        } else {
            bar.style.background = "#ef4444"; 
            if (t) t.style.color = "#ef4444";
            sfx.heartbeat();
        }
    }
});

socket.on('new_question', (qData) => {
    const qBox = document.getElementById('j-question-box');
    const bStatus = document.getElementById('buzzer-status');
    const btn = document.getElementById('buzzer-btn');
    const optBox = document.getElementById('j-options-box');
    
    if (qBox) qBox.innerText = qData.question;
    speak(qData.question); 
    
    if (bStatus) {
        bStatus.innerText = "BUZZ IN!";
        bStatus.style.color = "#10b981"; 
    }
    if (btn) {
        btn.className = "buzzer-ready";
        btn.innerText = "BUZZ!";
    }
    if (optBox) optBox.style.display = "none";
    window.currentJeopardyOptions = qData.options;
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
        bStatus.style.color = "#ef4444";
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
            optBox.style.display = "grid";
            optBox.innerHTML = "";
            let shuffled = [...window.currentJeopardyOptions].sort(() => Math.random() - 0.5); 
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
    if (optBox) optBox.style.display = "none";
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
        bStatus.style.color = "#aaa";
    }
    if (pBar) {
        pBar.style.width = "100%";
        pBar.style.background = "var(--gold)";
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

        html += `<div style="margin-bottom:20px; border-bottom:1px solid #333; padding-bottom:10px;">
            <div style="display:flex; align-items:center;">
                <span style="font-size:32px; margin-right:15px;">${medal}</span>
                ${getAvatar(s.name, s.globalPoints)}
                <span style="font-size:28px; color:${i===0?'var(--gold)':'white'}; font-weight:bold; margin-left:10px;">${s.name}</span>
                <span style="margin-left:auto; font-size:28px; color:#10b981;">${s.score} pts</span>
            </div>
            <div style="display:flex; justify-content:space-around; font-size:14px; color:#aaa; margin-top:10px;">
                <span>🎯 Accuracy: ${acc}%</span>
                <span>⏱️ Avg Buzz: ${avgTime}s</span>
                <span>🔥 Max Streak: ${s.maxStreak || 0}</span>
            </div>
        </div>`;
        
        if (i === 0 && s.bountyCollected) {
            html += `<div style="text-align:center; color:#ef4444; font-weight:bold; font-size:18px; margin-bottom:10px;">🎯 BOUNTY COLLECTED! +5,000 Global Points!</div>`;
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
// 8. ORIGINAL DIFFICULTY & STUDY LOGIC
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
    pointMultiplier = diff === 'easy' ? 100 : (diff === 'medium' ? 250 : 500);
    openStudyLibrary(selectedModeTemp, diff);
}

function openStudyLibrary(mode, diff) {
    masterUnlockAudio();
    currentPath = mode; currentDiff = diff;
    if (mode === 'adults') pointMultiplier = 1000; 
    
    switchScreen('study-screen');
    
    const sTitle = document.getElementById('study-title');
    const sText = document.getElementById('study-text');
    if (sTitle) sTitle.innerText = quizData[mode].title + (diff === 'exact' ? " (Exact Translation)" : ` (${diff.toUpperCase()})`);
    if (sText) sText.innerHTML = quizData[mode].studyText;
}

// ---------------------------------------------------------
// 9. ORIGINAL QUIZ LOGIC (FIXED BEGIN BUTTON AND HIGHLIGHTS)
// ---------------------------------------------------------
function beginQuizFromStudy() {
    masterUnlockAudio();
    currentIdx = 0; correctAnswers = 0; pointsThisSession = 0;
    
    const lp = document.getElementById('live-points');
    if (lp) lp.innerText = "0";
    
    activeQuestions = [...quizData[currentPath][currentDiff]];
    
    if (currentPath !== 'adults') {
        for (let i = activeQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [activeQuestions[i], activeQuestions[j]] = [activeQuestions[j], activeQuestions[i]];
        }
    }
    
    switchScreen('quiz-screen');
    loadQuestion();
}

function loadQuestion() {
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
    optionsDiv.innerHTML = "";
    
    let shuffledOptions = [...q.options];
    if (currentPath !== 'adults') {
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }
    }
    
    shuffledOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn'; btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, btn, q.correct);
        optionsDiv.appendChild(btn);
    });
}

function checkAnswer(selected, btn, correct) {
    masterUnlockAudio();
    const optionsDiv = document.getElementById('options');
    if (optionsDiv) {
        const quizBtns = optionsDiv.querySelectorAll('.option-btn');
        quizBtns.forEach(b => b.disabled = true);
    }
    
    if (selected === correct) {
        correctAnswers++; pointsThisSession += pointMultiplier;
        const lp = document.getElementById('live-points');
        if (lp) lp.innerText = pointsThisSession;
        btn.classList.add('correct');
        sfx.correct();
    } else {
        btn.classList.add('wrong');
        // NO HIGHLIGHTING OF CORRECT ANSWER
        sfx.wrong();
    }
    setTimeout(() => {
        currentIdx++;
        if (currentIdx < activeQuestions.length) loadQuestion(); else showResults();
    }, 1500);
}

// ---------------------------------------------------------
// 10. REAL-TIME GLOBAL LEADERBOARD FIX
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
    
    localStorage.setItem('noi_points', currentPoints);
    if (dPts) dPts.innerText = currentPoints;
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
        row.className = `lb-row ${index === 0 ? 'first' : ''} ${isMe ? 'me' : ''}`;
        row.innerHTML = `
            <div style="display:flex; align-items:center;">
                ${getAvatar(user.name, user.points)}
                <span style="margin-left:5px;">#${index + 1} ${user.name} ${isMe ? "(You)" : ""}</span>
            </div>
            <span>${user.points.toLocaleString()} pts</span>
        `;
        listDiv.appendChild(row);
    });
});

// ---------------------------------------------------------
// 11. MASTER NAVIGATION FIX
// ---------------------------------------------------------
function returnToMenu() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    socket.emit('leave_jeopardy');
    switchScreen('home-screen');
}

// ---------------------------------------------------------
// 12. MODERN LOBBY CHAT LOGIC (No Sound)
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
        msgDiv.innerHTML = `<span style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:12px; font-size:11px; color:#aaa;">${data.message}</span>`;
    } else {
        msgDiv.style.display = "flex";
        msgDiv.style.margin = "10px 0";
        msgDiv.style.justifyContent = isMe ? "flex-end" : "flex-start";
        
        let bubble = `<div style="background:${isMe ? 'rgba(212,175,55,0.15)' : '#222'}; border:1px solid #333; padding:10px 15px; border-radius:12px; max-width:80%;">
            <div style="font-size:11px; font-weight:bold; color:var(--gold); margin-bottom:4px; text-transform:uppercase;">${data.name}</div>
            <div style="color:white; font-size:14px; line-height:1.4; word-break:break-word;">${data.message}</div>
        </div>`;
        
        msgDiv.innerHTML = isMe ? bubble + getAvatar(data.name, data.globalPoints) : getAvatar(data.name, data.globalPoints) + bubble;
    }

    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight; 
});

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement && document.activeElement.id === 'chat-input') {
        sendChatMessage();
    }
});
