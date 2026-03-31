export const CATEGORIES = {
  'Temples & Shrines': { color: '#e74c3c', keywords: ['temple','shrine','sensoji','kiyomizu','fushimi inari','kinkakuji','todai-ji','tōdai-ji','nanzen-ji','tenryu-ji','gōtokuji','giōji','otagi nenbutsu','kasuga','jinja','helligdom','meiji','kōdaiji','kodaiji','yasaka','asakusa shrine','hakone jinja','heiwa-no-torii'] },
  'Gaming & Geek': { color: '#9b59b6', keywords: ['super potato','suruga','surugaya','mandarake','animate ','yellow submarine','hareruya','bigmagic','card wing','amenity dream','tokyomtg','mint games','gigo','taito station','hey ','sega store','nintendo tokyo','round one','round-one','joypolis','crane game'] },
  'Food & Restaurants': { color: '#e67e22', keywords: ['ichiran','menya','inoichi','sushiro','mawari sushi','kani doraku','mimasu','bakudan','shakey','freeman shokudo','little bakery','streamer coffee','future train','diner','cafe','cafè','ramen','restaurant','mipig cafe'] },
  'Views': { color: '#3498db', keywords: ['observation','sky building','umeda sky','skytree','tokyo tower','metropolitan government','scramble square','shibuya sky','s view','tourist information center'] },
  'Shopping': { color: '#1abc9c', keywords: ['kappabashi','nakamise','ameyoko','nishiki market','takeshita','yodobashi','don quijote','nakano broadway','nakano sun mall','bape store','bape ','wiggle','hard off','lego store','shopping','market','store railyard','underground street','antique mike'] },
  'Experiences': { color: '#f39c12', keywords: ['teamlab','ghibli museum','nintendo museum','hanayashiki','tokyo dome','pirate ship','mini-golf','lotte kasai golf','chopstick','wood works','making class','sunshine city'] },
  'Nature & Parks': { color: '#2ecc71', keywords: ['park','bamboo','bambú','arashiyama bamboo','take-no-michi','philosopher','funabashi andersen','lotus lake','black egg','alpaca','fureai','nara park','ueno park'] },
  'Landmarks': { color: '#e84393', keywords: ['hachiko','shibuya crossing','godzilla','kejserpalads','imperial palace','glico sign','osaka castle','nijō castle','nijo','statue','gion','dotonbori','shinsekai','kawagoe','akihabara','miyashita park','center-gai','mikuni','arashiyama','saga toriimoto','kyoto university'] },
  'Accommodation': { color: '#636e72', keywords: ['hotel','laforet','richmond','hostel','ryokan','yunosumika'] },
  'Other': { color: '#a0a0b0', keywords: [] }
};

export const CAT_ORDER = Object.keys(CATEGORIES);

export function categorize(name, note) {
  const text = ((name || '') + ' ' + (note || '')).toLowerCase();
  for (const cat of CAT_ORDER) {
    if (cat === 'Other') continue;
    for (const kw of CATEGORIES[cat].keywords) {
      if (text.includes(kw.toLowerCase())) return cat;
    }
  }
  return 'Other';
}

export function getCatColor(cat) {
  return (CATEGORIES[cat] || CATEGORIES['Other']).color;
}

export function assignCategories(list) {
  for (const p of list) {
    if (!p.category) p.category = categorize(p.name, p.note);
  }
}
