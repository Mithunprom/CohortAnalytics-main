import { hashString, pickIndex } from './dates.js'

const WRITE = 'write'
const CHOICE = 'choice'
const RIDDLE = 'riddle'
const ACTION = 'action'
const BREATHE = 'breathe'
const PLAY = 'play'

export const CATEGORIES = {
  create: { label: 'Create', emoji: '✦', color: '#ffb36b' },
  kindness: { label: 'Kindness', emoji: '♡', color: '#f9a8d4' },
  curious: { label: 'Curious', emoji: '?', color: '#5eead4' },
  body: { label: 'Body', emoji: '✧', color: '#86efac' },
  play: { label: 'Play', emoji: '★', color: '#c4b5fd' }
}

export const QUESTS = [
  { id: 'q1', category: 'create', type: WRITE, title: 'Six-word story', prompt: 'Write a six-word story that includes the word “glow”.', placeholder: 'Night bus. Stranger. Shared umbrella glow.' },
  { id: 'q2', category: 'create', type: WRITE, title: 'Postcard from today', prompt: 'Describe this hour as if it were a postcard from a tiny planet.', placeholder: 'Wish you were floating here…' },
  { id: 'q3', category: 'create', type: WRITE, title: 'Rename the moon', prompt: 'Give the moon a nickname and one reason it fits.', placeholder: 'Lantern Aunt — she never forgets to show up.' },
  { id: 'q4', category: 'create', type: WRITE, title: 'Tiny commercial', prompt: 'Write a 12-word ad for a feeling you want more of.', placeholder: 'Buy one quiet morning, get a second wind free.' },
  { id: 'q5', category: 'create', type: WRITE, title: 'Secret menu', prompt: 'Invent a café drink named after your current mood.', placeholder: 'Fog Latte with extra courage foam.' },
  { id: 'q6', category: 'create', type: WRITE, title: 'Character cameo', prompt: 'A firefly is the hero of a movie. What’s the title?', placeholder: 'The Last Matchstick Ballet' },
  { id: 'q7', category: 'kindness', type: ACTION, title: 'Quiet compliment', prompt: 'Send (or silently compose) a specific compliment to someone who made a small thing easier.', confirm: 'I sent or wrote it' },
  { id: 'q8', category: 'kindness', type: WRITE, title: 'Thank-you fragment', prompt: 'Finish this: “I’m glad you exist because…”', placeholder: 'you notice the tiny things I forget to celebrate.' },
  { id: 'q9', category: 'kindness', type: ACTION, title: 'Leave a light', prompt: 'Do one tiny favor with no announcement — refill a glass, pick up litter, hold a door.', confirm: 'I left a little light' },
  { id: 'q10', category: 'kindness', type: WRITE, title: 'Future you', prompt: 'Write a 2-sentence pep talk to yourself on a tired Thursday.', placeholder: 'Hey. You can do the next inch.' },
  { id: 'q11', category: 'curious', type: RIDDLE, title: 'Lantern riddle', prompt: 'I have a glow but no flame, wings but I am not a bird. What am I?', answer: 'firefly', hints: ['Think summer night.', 'Luma’s cousins.'] },
  { id: 'q12', category: 'curious', type: CHOICE, title: 'Pocket universe', prompt: 'Would you rather carry a pocket ocean or a pocket forest?', options: ['Pocket ocean', 'Pocket forest'] },
  { id: 'q13', category: 'curious', type: CHOICE, title: 'Time snack', prompt: 'If you could taste a time of day, which would you try first?', options: ['Dawn', 'Golden hour', 'Midnight'] },
  { id: 'q14', category: 'curious', type: RIDDLE, title: 'Soft thief', prompt: 'The more you take from me, the bigger I get. What am I?', answer: 'hole', hints: ['Not a person.', 'Think empty space.'] },
  { id: 'q15', category: 'body', type: BREATHE, title: 'Three lanterns', prompt: 'Breathe with Luma: in for 4, hold 2, out for 6. Three rounds.' },
  { id: 'q16', category: 'body', type: ACTION, title: 'Shoulder weather', prompt: 'Roll your shoulders like weather moving off a mountain. Ten slow circles.', confirm: 'Storm rolled out' },
  { id: 'q17', category: 'body', type: ACTION, title: 'Window stretch', prompt: 'Stand, reach for the highest imaginary star, then fold toward your shoes for 20 seconds.', confirm: 'I reached and folded' },
  { id: 'q18', category: 'play', type: PLAY, title: 'Star snack', prompt: 'Play a 30-second round of Star Catch. Feed Luma with light.', game: 'starCatch' },
  { id: 'q19', category: 'play', type: PLAY, title: 'Memory glow', prompt: 'Repeat Luma’s light pattern. Three successful rounds complete the spark.', game: 'glowMemory' },
  { id: 'q20', category: 'play', type: PLAY, title: 'Word ember', prompt: 'Unscramble today’s spark-word before the lantern cools.', game: 'wordSpark' },
  { id: 'q21', category: 'create', type: WRITE, title: 'Color theft', prompt: 'Steal a color from the room and give it a job in a story.', placeholder: 'The mustard curtain became a desert cape.' },
  { id: 'q22', category: 'create', type: WRITE, title: 'Two-line lullaby', prompt: 'Write a lullaby for a tired robot.', placeholder: 'Power down, little comet. The charging dock is warm.' },
  { id: 'q23', category: 'kindness', type: ACTION, title: 'Water the humans', prompt: 'Refill your water, then offer water or tea to someone nearby (or to future-you by setting a glass out).', confirm: 'Hydration shared' },
  { id: 'q24', category: 'curious', type: CHOICE, title: 'Impossible pet', prompt: 'Which companion would you take on a Tuesday errand?', options: ['A polite thundercloud', 'A library fox', 'A folding moon'] },
  { id: 'q25', category: 'body', type: ACTION, title: 'Jaw unclench', prompt: 'Unclench your jaw, drop your tongue from the roof of your mouth, and sigh once like a teapot.', confirm: 'Teapot sighed' },
  { id: 'q26', category: 'create', type: WRITE, title: 'Map a feeling', prompt: 'If today’s mood were a place, what would the souvenir shop sell?', placeholder: 'Tiny umbrellas and extra batteries.' },
  { id: 'q27', category: 'kindness', type: WRITE, title: 'Invisible labor', prompt: 'Name one unnoticed job someone did that made your day smoother.', placeholder: 'Whoever restocked the paper towels.' },
  { id: 'q28', category: 'curious', type: RIDDLE, title: 'Night math', prompt: 'What has cities but no houses, forests but no trees, and water but no fish?', answer: 'map', hints: ['You fold me.', 'I help you not get lost.'] },
  { id: 'q29', category: 'play', type: PLAY, title: 'Arcade interlude', prompt: 'Beat your previous Star Catch high score — or just play for the joy of catching light.', game: 'starCatch' },
  { id: 'q30', category: 'body', type: BREATHE, title: 'Ember reset', prompt: 'Four slow breaths. On each exhale, imagine a small spark landing safely in your chest.' },
  { id: 'q31', category: 'create', type: WRITE, title: 'Found poem', prompt: 'Make a poem from five words you can see right now.', placeholder: 'mug / charger / rain / sock / maybe' },
  { id: 'q32', category: 'kindness', type: ACTION, title: 'Soft ping', prompt: 'Send a “thinking of you” note with zero agenda.', confirm: 'Ping sent (or drafted)' },
  { id: 'q33', category: 'curious', type: CHOICE, title: 'Library of nights', prompt: 'Which section would you browse?', options: ['Unsent letters', 'Dreams that almost happened', 'Jokes from extinct birds'] },
  { id: 'q34', category: 'create', type: WRITE, title: 'Origin myth', prompt: 'In one sentence, explain how fireflies invented friendship.', placeholder: 'They realized one lantern is a bug, two is a party.' },
  { id: 'q35', category: 'body', type: ACTION, title: 'Ankle alphabet', prompt: 'Write the first 8 letters of the alphabet with your right ankle, then your left.', confirm: 'Alphabet danced' },
  { id: 'q36', category: 'play', type: PLAY, title: 'Glow echo', prompt: 'Complete a Glow Memory round. Luma loves a good echo.', game: 'glowMemory' },
  { id: 'q37', category: 'curious', type: RIDDLE, title: 'Always coming', prompt: 'What is always on its way but never arrives?', answer: 'tomorrow', hints: ['A calendar word.', 'Not yesterday.'] },
  { id: 'q38', category: 'kindness', type: WRITE, title: 'Permission slip', prompt: 'Write yourself a permission slip for one imperfect thing today.', placeholder: 'Permitted: a messy kitchen and a finished glass of water.' },
  { id: 'q39', category: 'create', type: WRITE, title: 'Tiny heist', prompt: 'Plan a heist to steal a nap from a busy afternoon. What’s the crew?', placeholder: 'Lookout: curtains. Getaway: couch.' },
  { id: 'q40', category: 'body', type: ACTION, title: 'Sky blink', prompt: 'Look at something 20 feet away for 20 seconds, then blink slowly 10 times.', confirm: 'Eyes vacationed' },
  { id: 'q41', category: 'play', type: PLAY, title: 'Letter lantern', prompt: 'Solve the Word Spark scramble. The letters are already fireflies.', game: 'wordSpark' },
  { id: 'q42', category: 'curious', type: CHOICE, title: 'Weather inside', prompt: 'What’s the weather in your chest right now?', options: ['Clear and cool', 'Soft rain', 'Wind with ideas', 'Fog, but friendly'] },
  { id: 'q43', category: 'create', type: WRITE, title: 'Unused superpower', prompt: 'You can pause one sound in the world for a minute. Which sound, and why?', placeholder: 'Leaf blowers. For the birds.' },
  { id: 'q44', category: 'kindness', type: ACTION, title: 'Future-you gift', prompt: 'Set out one thing tomorrow-you will thank you for (clothes, mug, charger, snack).', confirm: 'Gift planted' },
  { id: 'q45', category: 'body', type: BREATHE, title: 'Square glow', prompt: 'Box breath: in 4, hold 4, out 4, hold 4. Two squares.' },
  { id: 'q46', category: 'curious', type: RIDDLE, title: 'Keys without locks', prompt: 'I have keys but no locks, space but no room, and you can enter but never go outside. What am I?', answer: 'keyboard', hints: ['You type on me.', 'QWERTY lives here.'] },
  { id: 'q47', category: 'create', type: WRITE, title: 'Soundtrack', prompt: 'Name the song that would play if your day were a montage.', placeholder: 'Something with claps and a bicycle bell.' },
  { id: 'q48', category: 'play', type: PLAY, title: 'Catch dusk', prompt: 'Star Catch: imagine each tap is bottling dusk for later.', game: 'starCatch' },
  { id: 'q49', category: 'kindness', type: WRITE, title: 'Borrowed courage', prompt: 'Who would you borrow 10 minutes of courage from, and what would you do with it?', placeholder: 'My 8-year-old cousin. I’d ask the question.' },
  { id: 'q50', category: 'body', type: ACTION, title: 'Palm stars', prompt: 'Press your palms together hard for 10 seconds, then shake them out like sparklers.', confirm: 'Sparklers shook' },
  { id: 'q51', category: 'create', type: WRITE, title: 'Object interview', prompt: 'Interview your favorite mug. What’s its biggest secret?', placeholder: 'It once held soup and still thinks about it.' },
  { id: 'q52', category: 'curious', type: CHOICE, title: 'Door in the sky', prompt: 'A door appears above the clouds. What’s behind it?', options: ['A quiet concert', 'A picnic of extinct fruits', 'Your childhood living room, improved'] },
  { id: 'q53', category: 'kindness', type: ACTION, title: 'Name the helper', prompt: 'The next time you talk to a person at work (barista, coworker, driver), use their name if you know it.', confirm: 'I used a name (or learned one)' },
  { id: 'q54', category: 'play', type: PLAY, title: 'Pattern moth', prompt: 'Glow Memory — follow the moth of light.', game: 'glowMemory' },
  { id: 'q55', category: 'body', type: ACTION, title: 'Calf bounce', prompt: 'Rise onto your toes 15 times, slow enough to feel the spark in your calves.', confirm: 'Bounced' },
  { id: 'q56', category: 'create', type: WRITE, title: 'Headline', prompt: 'Write a newspaper headline for a victory so small it would never be printed.', placeholder: 'LOCAL HUMAN FOLDS TOWEL ON FIRST TRY' },
  { id: 'q57', category: 'curious', type: RIDDLE, title: 'Runs but no legs', prompt: 'What runs but never walks, has a bed but never sleeps?', answer: 'river', hints: ['Outdoor.', 'It has a mouth too.'] },
  { id: 'q58', category: 'kindness', type: WRITE, title: 'Repair kit', prompt: 'Offer a one-line repair to someone (including you) who had a clumsy day.', placeholder: 'Clumsy still counts. Come eat.' },
  { id: 'q59', category: 'play', type: PLAY, title: 'Anagram ember', prompt: 'Word Spark: the letters want to go home.', game: 'wordSpark' },
  { id: 'q60', category: 'body', type: BREATHE, title: 'Candle count', prompt: 'Inhale for 3, exhale like you’re fogging a window for 5. Five windows.' },
  { id: 'q61', category: 'create', type: WRITE, title: 'Alternate Tuesday', prompt: 'In a parallel Tuesday, you have a slightly stranger job. What is it?', placeholder: 'Official namer of clouds for the post office.' },
  { id: 'q62', category: 'curious', type: CHOICE, title: 'One extra sense', prompt: 'Which would you add for a week?', options: ['Taste colors', 'Hear plants grow', 'Smell approaching jokes'] },
  { id: 'q63', category: 'kindness', type: ACTION, title: 'Unsend the spike', prompt: 'If a sharp message is sitting in drafts, soften one sentence — or delete it.', confirm: 'I softened or let it go' },
  { id: 'q64', category: 'create', type: WRITE, title: 'Recipe for a night', prompt: 'Write a recipe whose ingredients are only feelings and weather.', placeholder: '2 cups dusk, pinch of mischief, simmer until stars.' },
  { id: 'q65', category: 'body', type: ACTION, title: 'Neck yes/no', prompt: 'Slow yes (up/down) 5 times, slow no (side to side) 5 times. Tiny movements.', confirm: 'Neck voted' },
  { id: 'q66', category: 'play', type: PLAY, title: 'Meteor snack', prompt: 'Catch 15 stars. Luma will pretend they are marshmallows.', game: 'starCatch' },
  { id: 'q67', category: 'curious', type: RIDDLE, title: 'Full of holes', prompt: 'What is full of holes but still holds water?', answer: 'sponge', hints: ['Kitchen.', 'Also a sea creature.'] },
  { id: 'q68', category: 'kindness', type: WRITE, title: 'Borrowed light', prompt: 'Who loaned you a little hope this year? Write them a 1-line award.', placeholder: 'Awarded: the friend who answers “on my way.”' },
  { id: 'q69', category: 'create', type: WRITE, title: 'Bug ballet', prompt: 'Choreograph a 3-move dance for a firefly. Name it.', placeholder: 'The Porch Waltz: dip, blink, hover.' },
  { id: 'q70', category: 'body', type: ACTION, title: 'Stand like a tree', prompt: 'Stand on one foot for 20 seconds, then the other. Hold a wall if you need.', confirm: 'I was a brief tree' },
  { id: 'q71', category: 'play', type: PLAY, title: 'Echo garden', prompt: 'Three Glow Memory patterns. Bloom, echo, bloom.', game: 'glowMemory' },
  { id: 'q72', category: 'curious', type: CHOICE, title: 'Tiny economy', prompt: 'If kindness were currency, what would a cup of tea cost?', options: ['A true story', 'Five minutes of listening', 'One terrible joke'] },
  { id: 'q73', category: 'create', type: WRITE, title: 'Lost & found', prompt: 'Write a lost-and-found notice for a feeling you misplaced.', placeholder: 'Lost: Saturday ease. Last seen near a grocery list.' },
  { id: 'q74', category: 'kindness', type: ACTION, title: 'Share the map', prompt: 'Tell someone a useful shortcut — a tip, a link, a better way to peel ginger.', confirm: 'Shortcut shared' },
  { id: 'q75', category: 'body', type: BREATHE, title: 'Wave breath', prompt: 'Inhale up the beach, exhale back to sea. Six waves.' },
  { id: 'q76', category: 'play', type: PLAY, title: 'Word moths', prompt: 'Unscramble. The moths already know the word.', game: 'wordSpark' },
  { id: 'q77', category: 'curious', type: RIDDLE, title: 'Up and down', prompt: 'What goes up but never comes down?', answer: 'age', hints: ['Happens to everyone.', 'Birthday related.'] },
  { id: 'q78', category: 'create', type: WRITE, title: 'Stage direction', prompt: 'Write a stage direction for how you enter a room when you feel shy.', placeholder: 'Enters like a cat who meant to do that.' },
  { id: 'q79', category: 'kindness', type: WRITE, title: 'Three true things', prompt: 'List three true, non-spectacular things that are okay about today.', placeholder: 'The light. The socks. The fact I opened this app.' },
  { id: 'q80', category: 'body', type: ACTION, title: 'Shake the day off', prompt: 'Shake your hands, then your arms, then a silly full-body wiggle for 10 seconds.', confirm: 'Wiggled on purpose' },
  { id: 'q81', category: 'play', type: PLAY, title: 'Night harvest', prompt: 'Star Catch under an imaginary orchard of lights.', game: 'starCatch' },
  { id: 'q82', category: 'curious', type: CHOICE, title: 'Museum wing', prompt: 'You are curator for a night. Which wing opens first?', options: ['Unfinished songs', 'Almost-inventions', 'Kindnesses nobody saw'] },
  { id: 'q83', category: 'create', type: WRITE, title: 'Spell', prompt: 'Write a 8-word spell to make a meeting shorter.', placeholder: 'Clocks hurry, agendas shrink, we still like each other.' },
  { id: 'q84', category: 'kindness', type: ACTION, title: 'Return the cart', prompt: 'Do one “nobody asked” tidy: dishes, cart, tabs, or a bed corner.', confirm: 'Tidy spark done' },
  { id: 'q85', category: 'body', type: ACTION, title: 'Wrist orbits', prompt: 'Circle both wrists 10 times each way, like drawing tiny moons.', confirm: 'Moons drawn' },
  { id: 'q86', category: 'curious', type: RIDDLE, title: 'Word in fire', prompt: 'What word becomes shorter when you add two letters to it?', answer: 'short', hints: ['The answer is the word itself.', 'Add “er”.' ] },
  { id: 'q87', category: 'create', type: WRITE, title: 'Guest star', prompt: 'Cast Luma in a job for one day. What’s on the business card?', placeholder: 'Luma — Junior Keeper of Almost-Bedtimes' },
  { id: 'q88', category: 'play', type: PLAY, title: 'Lantern copycat', prompt: 'Glow Memory until you nail a 4-step pattern.', game: 'glowMemory' },
  { id: 'q89', category: 'kindness', type: WRITE, title: 'Pass the spark', prompt: 'Write a spark you’d give a friend who only has 60 seconds.', placeholder: 'Look out a window and name three moving things.' },
  { id: 'q90', category: 'body', type: BREATHE, title: 'Last light', prompt: 'One long inhale through the nose, one longer exhale through the mouth. Repeat until Luma’s glow feels synced.' }
]

export const WORD_BANK = [
  'ember', 'glow', 'spark', 'lumen', 'orbit', 'comet', 'aurora', 'lantern',
  'nebula', 'quiet', 'kind', 'breeze', 'harbor', 'velvet', 'moss', 'cinder',
  'petal', 'drift', 'haven', 'pulse', 'mirth', 'solace', 'gleam', 'dusk'
]

export function questById(id) {
  return QUESTS.find((q) => q.id === id)
}

export function todaysQuest(dateKey, offset = 0, intentBias = []) {
  const pool = intentBias.length
    ? [...QUESTS.filter((q) => intentBias.includes(q.category)), ...QUESTS]
    : QUESTS
  const index = pickIndex(`${dateKey}:${offset}:luma`, pool.length)
  return pool[index] || QUESTS[0]
}

export function todaysWord(dateKey) {
  return WORD_BANK[pickIndex(`${dateKey}:word`, WORD_BANK.length)]
}

export function scrambleWord(word, dateKey) {
  const chars = word.split('')
  let seed = hashString(`${dateKey}:${word}`)
  for (let i = chars.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  const scrambled = chars.join('')
  return scrambled === word ? word.slice(1) + word[0] : scrambled
}

export function normalizeAnswer(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
}

export function riddleCorrect(quest, guess) {
  return normalizeAnswer(guess) === normalizeAnswer(quest.answer)
}
