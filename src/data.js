export const FIRST_NAMES = [
  "Cotton", "Candy", "Sugar", "Lulu", "Bubbles", "Petal", "Misty", "Bambi", "Fawn", "Honey", "Dolly", "Pearl", "Gigi", "Pixie", "Trixie", "Lola", "Bunny", "Puff", "Sky", "Blossom",
  "Glitter", "Cherry", "Peaches", "Angel", "Diamond", "Sapphire", "Ruby", "Stella", "Luna", "Nova", "Venus", "Flora", "Dawn", "Aura", "Serenade", "Echo", "Melody", "Harmony", "Aria", "Siren",
  "Whisper", "Starlight", "Moonbeam", "Sunshine", "Rainbow", "Crystal", "Lace", "Velvet", "Glow", "Spark", "Twinkle", "Shimmer", "Flash", "Neon", "Plastic", "Glamour", "Beauty", "Glitz", "Dazzle", "Charm",
  "Rose", "Daisy", "Lily", "Jasmine", "Violet", "Orchid", "Iris", "Ivy", "Willow", "Hazel", "Amber", "Jade", "Coral", "Opal", "Ivory", "Ebony", "Raven", "Scarlet", "Crimson", "Magenta",
  "Teal", "Azure", "Indigo", "Cyan", "Aqua", "Sapphire", "Platinum", "Goldie", "Silver", "Bronze", "Copper", "Penny", "Dixie", "Roxy", "Moxie", "Lexi", "Maxi", "Bessie", "Daisy", "Minnie",
  "Kitty", "Kat", "Feline", "Panther", "Tiger", "Lioness", "Bear", "Fox", "Vixen", "Wolf", "Hawk", "Eagle", "Dove", "Swan", "Robin", "Wren", "Lark", "Finch", "Sparrow", "Starling",
  "Coco", "Chanel", "Dior", "Gucci", "Prada", "Versace", "Armani", "Fendi", "Valentino", "Gabbana", "Balenciaga", "Givenchy", "Hermes", "Vuitton", "Kors", "Klein", "Lauren", "Hilfiger", "Madden", "Choo",
  "Elektra", "Storm", "Rogue", "Mystique", "Jean", "Emma", "Kitty", "Jubilee", "Magik", "Polaris", "Dazzler", "Psylocke", "X23", "Domino", "Cable", "Bishop", "Forge", "Banshee", "Havok", "Cyclops"
];

export const LAST_NAMES = [
  "Cloud", "Sweet", "Dream", "Soft", "Twinkle", "Sparkle", "Bloom", "Plum", "Berry", "Swirl", "Glitter", "Pop", "Willow", "Blue", "Velvet", "Whimsy", "Frost", "Glow", "Breeze", "Marshmallow",
  "Rain", "Snow", "Ice", "Fire", "Flame", "Ash", "Cinder", "Ember", "Spark", "Blaze", "Inferno", "Storm", "Thunder", "Lightning", "Gale", "Wind", "Zephyr", "Mist", "Fog", "Haze",
  "Star", "Moon", "Sun", "Sky", "Heaven", "Paradise", "Eden", "Utopia", "Nirvana", "Valhalla", "Olympus", "Asgard", "Midgard", "Earth", "World", "Universe", "Galaxy", "Cosmos", "Space", "Time",
  "Love", "Heart", "Soul", "Spirit", "Mind", "Thought", "Memory", "Dream", "Vision", "Illusion", "Mirage", "Phantom", "Ghost", "Specter", "Wraith", "Shadow", "Shade", "Darkness", "Night", "Midnight",
  "Dawn", "Morning", "Day", "Noon", "Afternoon", "Evening", "Dusk", "Twilight", "Eclipse", "Solstice", "Equinox", "Season", "Spring", "Summer", "Autumn", "Winter", "Year", "Decade", "Century", "Millennium",
  "Rose", "Lily", "Tulip", "Orchid", "Daisy", "Sunflower", "Marigold", "Pansy", "Violet", "Iris", "Lilac", "Peony", "Daffodil", "Hyacinth", "Crocus", "Snowdrop", "Bluebell", "Foxglove", "Snapdragon", "Hollyhock",
  "Apple", "Orange", "Banana", "Grape", "Melon", "Watermelon", "Lemon", "Lime", "Cherry", "Peach", "Plum", "Apricot", "Nectarine", "Mango", "Papaya", "Pineapple", "Coconut", "Kiwi", "Strawberry", "Raspberry",
  "Fierce", "Slay", "Werk", "Huntress", "Diva", "Queen", "Empress", "Goddess", "Idol", "Icon", "Legend", "Starlet", "Vamp", "Siren", "Muse", "Nymph", "Fairy", "Sprite", "Pixie", "Goblin"
];

export const ARCHETYPES = [
    { name: "Comedy Queen", icon: "🎭" },
    { name: "Look Queen", icon: "✨" },
    { name: "Pageant Queen", icon: "👑" },
    { name: "Dancing Queen", icon: "💃" },
    { name: "Camp Queen", icon: "🍭" },
    { name: "Spooky Queen", icon: "🦇" },
    { name: "Fashion Queen", icon: "👠" },
    { name: "Theater Queen", icon: "🎟️" },
    { name: "Alternative Queen", icon: "🖤" }
];

export const CHALLENGES = [
    { id: 'snatch', name: "The Snatch Game", type: 'solo', minCast: 1, weights: { acting_comedy: 0.6, improv: 0.4, nerve: 0.1 }, desc: "Get ready to impersonate your favorite stars! Make Ru laugh." },
    { id: 'ball', name: "The Pastel Ball", type: 'solo', minCast: 1, weights: { design: 0.5, sewing: 0.5, runway: 0.2, performance: 0.1 }, desc: "Serve three distinct looks on the main stage runway!" },
    { id: 'rusical', name: "Dreamy Rusical", type: 'team', minCast: 6, weights: { performance: 0.4, lip_sync: 0.4, acting_comedy: 0.2, nerve: 0.1 }, desc: "A musical theater journey through a magical pastel world." },
    { id: 'improv', name: "Whimsical Improv", type: 'solo', minCast: 1, weights: { improv: 0.8, acting_comedy: 0.3, nerve: 0.2 }, desc: "Think on your feet and make us laugh without a script." },
    { id: 'makeover', name: "Magical Makeover", type: 'duo', minCast: 4, weights: { design: 0.3, sewing: 0.3, performance: 0.2, branding: 0.2, runway: 0.2 }, desc: "Transform a literal stranger into your beautiful drag sister." },
    { id: 'branding', name: "Pastel Soda Commercial", type: 'solo', minCast: 1, weights: { branding: 0.7, acting_comedy: 0.3, improv: 0.2 }, desc: "Sell out and make a television commercial for your own soda brand." },
    { id: 'sewing', name: "Unconventional Materials", type: 'solo', minCast: 1, weights: { sewing: 0.8, design: 0.4, runway: 0.1 }, desc: "Make a high-fashion couture dress out of literal garbage." },
    { id: 'girlgroup', name: "Girl Group Realness", type: 'team', minCast: 6, weights: { performance: 0.5, lip_sync: 0.3, branding: 0.2 }, desc: "Write, record, and perform choreography for a new girl group track." },
    { id: 'roast', name: "The Reading Roast", type: 'solo', minCast: 1, weights: { acting_comedy: 0.7, nerve: 0.5, improv: 0.2 }, desc: "Step up to the podium and ruthlessly read the judges and your sisters." },
    { id: 'talentshow', name: "The Variety Talent Show", type: 'solo', minCast: 1, weights: { performance: 0.6, branding: 0.4, lip_sync: 0.2, nerve: 0.2 }, desc: "Showcase your most unique talent in front of a live audience." },
    { id: 'acting', name: "Scripted Acting Challenge", type: 'team', minCast: 6, weights: { acting_comedy: 0.7, branding: 0.2, nerve: 0.2 }, desc: "Memorize your lines and overact in a cheesy parody movie." },
    { id: 'dance', name: "Partner Dance Challenge", type: 'duo', minCast: 4, weights: { performance: 0.8, nerve: 0.3, lip_sync: 0.1 }, desc: "Pair up and execute complex choreography perfectly." },
    { id: 'standup', name: "Stand Up Comedy Special", type: 'solo', minCast: 1, weights: { acting_comedy: 0.8, improv: 0.2, nerve: 0.4 }, desc: "Write a tight 5-minute stand-up set and deliver the punchlines." },
    { id: 'talkshow', name: "Hosting a Talk Show", type: 'duo', minCast: 4, weights: { improv: 0.6, branding: 0.5, nerve: 0.2 }, desc: "Interview celebrity guests dynamically while keeping the audience engaged." },
    { id: 'rumix', name: "The Finale Rumix", type: 'solo', minCast: 1, weights: { performance: 0.5, lip_sync: 0.4, runway: 0.3, nerve: 0.2 }, desc: "Write a verse and perform intense choreography to a mega hit song." },
    { id: 'photoshoot', name: "Editorial Photo Shoot", type: 'solo', minCast: 1, weights: { branding: 0.6, runway: 0.5, design: 0.2 }, desc: "Model for your life and direct a stunning editorial magazine cover." },
    { id: 'dragcon', name: "Drag Convention Panels", type: 'team', minCast: 6, weights: { improv: 0.5, branding: 0.6, acting_comedy: 0.2 }, desc: "Moderate a live panel answering questions and showcasing your brand." },
    { id: 'magic', name: "Drag Magic Show", type: 'duo', minCast: 4, weights: { performance: 0.5, acting_comedy: 0.4, nerve: 0.3 }, desc: "Perform jaw-dropping illusions while keeping the audience laughing." },
    { id: 'app', name: "App Design Challenge", type: 'team', minCast: 6, weights: { branding: 0.8, acting_comedy: 0.3 }, desc: "Conceptualize a lifestyle app and present it to investors." },
    { id: 'sewing_twins', name: "Conjoined Twins Makeover", type: 'duo', minCast: 4, weights: { sewing: 0.6, design: 0.5, acting_comedy: 0.3 }, desc: "Sew a massive outfit connecting you and your eliminated sister." },
    { id: 'cryptid', name: "The Drag Cryptid Hunt", type: 'team', minCast: 6, weights: { acting_comedy: 0.7, improv: 0.5, nerve: 0.3 }, desc: "Film a found-footage documentary investigating a terrifying new drag monster." },
    { id: 'wrestling', name: "Pastel Wrestling Federation", type: 'duo', minCast: 4, weights: { performance: 0.8, improv: 0.4, nerve: 0.5 }, desc: "Choreograph over-the-top wrestling promos and matches." },
    { id: 'apocalyptic', name: "The Apocalyptic Runway", type: 'solo', minCast: 1, weights: { design: 0.7, sewing: 0.6, runway: 0.3 }, desc: "Construct a survival-ready garment using post-apocalyptic scavenged items." },
    { id: 'shopping', name: "Late Night Shopping Network", type: 'duo', minCast: 4, weights: { branding: 0.8, improv: 0.7, acting_comedy: 0.4 }, desc: "Sell ridiculous homeware products live on air." },
    { id: 'vr_popstar', name: "Virtual Reality Popstar", type: 'solo', minCast: 1, weights: { performance: 0.7, lip_sync: 0.6, nerve: 0.2 }, desc: "Perform a high-energy routine in a motion-capture green screen environment." },
    { id: 'podcast', name: "The True Crime Podcast", type: 'team', minCast: 6, weights: { acting_comedy: 0.8, branding: 0.5, nerve: 0.2 }, desc: "Write, record, and voice a campy murder mystery podcast episode." },
    { id: 'hair_show', name: "Avant-Garde Hair Show", type: 'solo', minCast: 1, weights: { design: 0.8, runway: 0.6, sewing: 0.3 }, desc: "Create gravity-defying, structural hairpieces that tell an emotional story." },
    { id: 'courtroom', name: "Fairy Tale Courtroom", type: 'team', minCast: 6, weights: { improv: 0.8, acting_comedy: 0.6, nerve: 0.4 }, desc: "Defend or prosecute famous villains in a televised court session." },
    { id: 'restaurant', name: "Pop-Up Restaurant", type: 'team', minCast: 6, weights: { branding: 0.7, performance: 0.5, improv: 0.4 }, desc: "Design a bizarre themed dining experience and serve the judges." },
    { id: 'lipsync_tournament', name: "The Lip Sync Extravaganza", type: 'solo', minCast: 1, weights: { lip_sync: 0.9, performance: 0.6, nerve: 0.8 }, desc: "Endure a grueling, multi-round lip sync tournament." },
    { id: 'return_slay_off', name: "The Slay-Off Smackdown", type: 'solo', minCast: 6, weights: { lip_sync: 0.8, performance: 0.5, nerve: 0.5 }, desc: "Eliminated queens face off in a lip-sync tournament. The last one standing returns." },
    { id: 'return_makeover', name: "Makeover Redemption", type: 'duo', minCast: 4, weights: { design: 0.4, sewing: 0.3, branding: 0.3, performance: 0.2 }, desc: "Eliminated queens are paired with current contestants for a makeover. Win, and you're back in." },
    { id: 'return_rusical', name: "The Ghost of Drag Race Past", type: 'team', minCast: 5, weights: { performance: 0.5, acting_comedy: 0.3, lip_sync: 0.2 }, desc: "A spooky rusical spectacular starring the eliminated queens. Steal the show to return." },
    { id: 'return_talent_show', name: "The Return Talent Show", type: 'solo', minCast: 4, weights: { performance: 0.6, branding: 0.4, nerve: 0.3 }, desc: "A talent show for the fallen queens. Show us what we've been missing." },
    { id: 'return_conjoined', name: "Conjoined Twins Redemption", type: 'duo', minCast: 4, weights: { sewing: 0.5, design: 0.4, acting_comedy: 0.2, runway: 0.2 }, desc: "Paired with a remaining queen, create a conjoined look. The winning eliminated queen returns." },

];

export const DRAMA_TEMPLATES = [
    { 
        id: 'bonding_makeup',
        template: "${q1} helped ${q2} with her signature makeup look.", 
        type: 'BONDING', 
        change: 25, 
        desc: "A sweet moment of sisterhood in the workroom." 
    },
    { 
        id: 'bonding_sewing',
        template: "${q1} lent her sewing machine to ${q2} when hers broke down.", 
        type: 'BONDING', 
        change: 30, 
        desc: "Generosity wins the day!" 
    },
    { 
        id: 'friction_wig',
        template: "${q1} and ${q2} got into a minor disagreement over a missing wig.", 
        type: 'FRICTION', 
        change: -20, 
        desc: "Tensions are rising..." 
    },
    { 
        id: 'friction_critique',
        template: "${q1} made a shady comment about ${q2}'s runway look from last week.", 
        type: 'FRICTION', 
        change: -25, 
        desc: "The library is officially OPEN." 
    },
    { 
        id: 'security_fight',
        template: "Security had to step in after ${q1} and ${q2} almost squared up over a shared outfit concept!", 
        type: 'SECURITY', 
        change: -50, 
        desc: "BAD GIRLS CLUB VIBES! Security is on high alert." 
    },
    { 
        id: 'alliance_form',
        template: "${q1} and ${q2} decided to form a secret alliance to reach the finale.", 
        type: 'ALLIANCE', 
        change: 40, 
        desc: "Strategy is in the air." 
    },
    { 
        id: 'bonding_laugh',
        template: "${q1} and ${q2} spent the afternoon laughing and sharing stories.", 
        type: 'BONDING', 
        change: 20, 
        desc: "Pure joy in the workroom." 
    },
    { 
        id: 'friction_makeup',
        template: "${q1} accidentally knocked over ${q2}'s expensive foundation palette.", 
        type: 'FRICTION', 
        change: -30, 
        desc: "Accident or sabotage? You decide." 
    }
];


