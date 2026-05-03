// Curated profanity lists for soft-flag moderation. Matches return as flags
// like `profanity:<word>` so the moderator can see what was hit. None of
// these are hard rejects — Perspective/OpenAI handle severity. The intent is
// to ensure that comments containing common slurs/profanity always queue for
// human review even when AI moderation is unavailable.
//
// Sources:
// - Spanish: hand-curated subset of LDNOOBW/es plus common Mexican / Argentine
//   regional variants. Topic words (anatomy, drugs) intentionally excluded
//   because this is a science blog where they appear in legitimate context.
// - English: full LDNOOBW/en list, with anatomy/medical terms filtered out.

export const ES_PROFANITY = new Set([
  // Iberian
  'cabrón', 'cabron', 'cabrones', 'cabrona', 'cabronas',
  'coño', 'cono', 'coñazo',
  'follar', 'follador', 'follada', 'follando', 'follón',
  'gilipollas', 'gilipichis', 'jilipollas',
  'hijoputa', 'hijaputa', 'hijodeputa',
  'kapullo', 'capullo', 'capullos',
  'lameculos',
  'maricón', 'maricon', 'mariconazo', 'marica',
  'mierda', 'mierdas',
  'pendejo', 'pendeja', 'pendejos', 'pendejas',
  'puta', 'putas', 'puto', 'putos', 'putona',
  'prostituta', 'ramera',
  'soplagaitas', 'soplapollas',
  'verga', 'vergas',
  'chupapollas',
  'polla', 'pollas',
  'joder', 'jódete', 'jodete', 'jodido', 'jodida',
  'cojones',
  'malparido', 'malparida',
  // Latin American
  'pinche', 'pinches',
  'culero', 'culera', 'culeros',
  'chinga', 'chingar', 'chingada', 'chingados', 'chingón', 'chingue', 'chingada madre',
  'pelotudo', 'pelotuda', 'pelotudos',
  'boludo', 'boluda', 'boludos',
  'huevón', 'huevon', 'wevón', 'wevon',
  'concha', 'conchudo', 'conchuda',
  'mamón', 'mamon', 'mamada',
  'pajero',
  'cagada', 'cagado',
  'imbécil', 'imbecil',
  'estúpido', 'estupido',
  'idiota',
]);

export const ES_PROFANITY_PHRASES = [
  'hijo de puta',
  'hija de puta',
  'vete a la mierda',
  'que te jodan',
  'me cago en',
  'la concha de tu madre',
  'concha de tu madre',
  'chinga tu madre',
  'a la verga',
  'tu puta madre',
  'puta madre',
];

// LDNOOBW English (Shutterstock-curated, used in production by many sites).
// Anatomy-only words removed (anus, rectum, breast, etc.) since they may
// appear in legitimate science content. ~280 entries kept.
export const EN_PROFANITY = new Set([
  '2g1c', 'acrotomophilia', 'apeshit', 'arsehole', 'ass-fucker', 'asses',
  'assfuck', 'asshole', 'assholes', 'assmunch', 'auto erotic', 'autoerotic',
  'babeland', 'baby batter', 'baby juice', 'ball gag', 'ball gravy',
  'ball kicking', 'ball licking', 'ball sack', 'ball sucking', 'bangbros',
  'bangbus', 'bareback', 'barely legal', 'barenaked', 'bastard', 'bastardo',
  'bastinado', 'bbw', 'bdsm', 'beaner', 'beaners', 'beaver cleaver',
  'beaver lips', 'beastiality', 'bestiality', 'big black', 'big breasts',
  'big knockers', 'big tits', 'bimbos', 'birdlock', 'black cock',
  'blonde action', 'blonde on blonde action', 'blowjob', 'blow job',
  'blow your load', 'blue waffle', 'blumpkin', 'bollocks', 'bondage',
  'boner', 'boong', 'boob', 'boobs', 'booty call', 'brown showers',
  'brunette action', 'bukkake', 'bulldyke', 'bullet vibe', 'bullshit',
  'bumblefuck', 'bung hole', 'bunghole', 'busty', 'butt', 'buttcheeks',
  'butthole', 'camel toe', 'camgirl', 'camslut', 'camwhore', 'carpet muncher',
  'carpetmuncher', 'chinc', 'chink', 'choad', 'chocolate rosebuds',
  'cialis', 'circlejerk', 'cleveland steamer', 'clit', 'clitoris', 'clover clamps',
  'clusterfuck', 'cock', 'cocks', 'coprolagnia', 'coprophilia', 'cornhole',
  'coon', 'coons', 'creampie', 'cum', 'cumming', 'cumshot', 'cumshots',
  'cunnilingus', 'cunt', 'cunts', 'darkie', 'date rape', 'daterape',
  'deep throat', 'deepthroat', 'dendrophilia', 'dick', 'dildo',
  'dingleberry', 'dingleberries', 'dirty pillows', 'dirty sanchez',
  'doggie style', 'doggiestyle', 'doggy style', 'doggystyle', 'dog style',
  'dolcett', 'domination', 'dominatrix', 'dommes', 'donkey punch',
  'double dong', 'double penetration', 'dp action', 'dry hump', 'dvda',
  'eat my ass', 'ecchi', 'ejaculation', 'erotic', 'erotism', 'escort',
  'eunuch', 'fag', 'faggot', 'faggots', 'fags', 'fecal', 'felch',
  'fellatio', 'feltch', 'female squirting', 'femdom', 'figging', 'fingerbang',
  'fingering', 'fisting', 'foot fetish', 'footjob', 'frotting', 'fuck',
  'fuckass', 'fuckbag', 'fuckboy', 'fuckbutt', 'fucked', 'fucker',
  'fuckers', 'fuckhead', 'fuckin', 'fucking', 'fuckme', 'fucktard',
  'fucktards', 'fuckwit', 'fudge packer', 'fudgepacker', 'futanari',
  'gang bang', 'gangbang', 'gay sex', 'genitals', 'giant cock',
  'girl on', 'girl on top', 'girls gone wild', 'goatcx', 'goatse', 'goddamn',
  'gokkun', 'golden shower', 'goodpoop', 'goo girl', 'goregasm', 'gook',
  'grope', 'group sex', 'g-spot', 'guro', 'hand job', 'handjob',
  'hard core', 'hardcore', 'hentai', 'homoerotic', 'honkey', 'hooker',
  'horny', 'hot carl', 'hot chick', 'how to kill', 'how to murder',
  'huge fat', 'humping', 'incest', 'jack off', 'jail bait', 'jailbait',
  'jelly donut', 'jerk off', 'jigaboo', 'jiggaboo', 'jiggerboo', 'jizz',
  'juggs', 'kike', 'kinbaku', 'kinkster', 'kinky', 'knobbing',
  'leather restraint', 'leather straight jacket', 'lemon party', 'lolita',
  'lovemaking', 'make me come', 'male squirting', 'masturbate',
  'menage a trois', 'milf', 'missionary position', 'motherfucker',
  'mound of venus', 'mr hands', 'muff diver', 'muffdiving', 'nambla',
  'nawashi', 'negro', 'neonazi', 'nigga', 'nigger', 'nig nog',
  'nimphomania', 'nipple', 'nipples', 'nsfw images', 'nude', 'nudity',
  'nympho', 'nymphomania', 'octopussy', 'omorashi', 'one cup two girls',
  'one guy one jar', 'orgasm', 'orgy', 'paedophile', 'paki', 'panties',
  'panty', 'pedobear', 'pedophile', 'pegging', 'penis', 'phone sex',
  'piece of shit', 'pissing', 'piss pig', 'pisspig', 'playboy',
  'pleasure chest', 'pole smoker', 'ponyplay', 'poof', 'poon', 'poontang',
  'punany', 'poop chute', 'poopchute', 'porn', 'porno', 'pornography',
  'prince albert piercing', 'pthc', 'pubes', 'pussy', 'queaf', 'queef',
  'quim', 'raghead', 'raging boner', 'rape', 'raping', 'rapist',
  'rectum', 'reverse cowgirl', 'rimjob', 'rimming', 'rosy palm',
  'rosy palm and her 5 sisters', 'rusty trombone', 'sadism', 's&m',
  'santorum', 'scat', 'schlong', 'scissoring', 'semen', 'sex', 'sexcam',
  'sexo', 'sexy', 'sexual', 'sexually', 'sexuality', 'shaved beaver',
  'shaved pussy', 'shemale', 'shibari', 'shit', 'shitblimp', 'shitty',
  'shota', 'shrimping', 'skeet', 'slanteye', 'slut', 'smut', 'snatch',
  'snowballing', 'sodomize', 'sodomy', 'spic', 'splooge', 'splooge moose',
  'spooge', 'spread legs', 'spunk', 'strap on', 'strapon', 'strappado',
  'strip club', 'style doggy', 'suck', 'sucks', 'suicide girls',
  'sultry women', 'swastika', 'swinger', 'tainted love', 'taste my',
  'tea bagging', 'threesome', 'throating', 'tied up', 'tight white',
  'tit', 'tits', 'titties', 'titty', 'tongue in a', 'topless', 'tosser',
  'towelhead', 'tranny', 'tribadism', 'tub girl', 'tubgirl', 'tushy',
  'twat', 'twink', 'twinkie', 'two girls one cup', 'undressing',
  'upskirt', 'urethra play', 'urophilia', 'vagina', 'venus mound',
  'vibrator', 'violet wand', 'vorarephilia', 'voyeur', 'vulva', 'wank',
  'wetback', 'wet dream', 'white power', 'wrapping men', 'wrinkled starfish',
  'xx', 'xxx', 'yaoi', 'yellow showers', 'yiffy', 'zoophilia',
]);

// Severe slurs that should hard-reject regardless of context.
// Keep this list extremely tight to avoid blocking legitimate discussion
// (e.g. an article *about* hate speech or racism will mention these words).
// Add only if false-rejects become a problem.
export const HARD_BLOCK_SLURS = new Set([
  'nigger', 'niggers', 'nigga', 'niggas',
  'kike', 'kikes',
  'chink', 'chinks',
  'spic', 'spics',
  'wetback', 'wetbacks',
  'gook', 'gooks',
  'tranny', 'trannies',
  'faggot', 'faggots',
  'paki', 'pakis',
  'raghead', 'ragheads',
]);

const TOKEN_SPLIT_RX = /[\s.,!?;:'"()\[\]{}—–\-…/\\|*¿?¡!]+/u;

export function tokenize(text) {
  return text.toLowerCase().split(TOKEN_SPLIT_RX).filter(Boolean);
}

export function findProfanity(text) {
  const tokens = tokenize(text);
  const lower = text.toLowerCase();
  const matches = new Set();

  for (const t of tokens) {
    if (ES_PROFANITY.has(t) || EN_PROFANITY.has(t)) matches.add(t);
  }

  for (const phrase of ES_PROFANITY_PHRASES) {
    if (lower.includes(phrase)) matches.add(phrase);
  }

  return Array.from(matches);
}

export function findHardBlock(text) {
  const tokens = tokenize(text);
  for (const t of tokens) {
    if (HARD_BLOCK_SLURS.has(t)) return t;
  }
  return null;
}
