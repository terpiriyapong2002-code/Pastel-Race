import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Trophy, Heart, Trash2, Play, ChevronRight, Crown, Music, PenTool, Star, Save, FolderOpen, ArrowLeft, RefreshCw, Dice5, Library, Users, Medal } from 'lucide-react';
import { FIRST_NAMES, LAST_NAMES, ARCHETYPES, CHALLENGES, DRAMA_TEMPLATES } from './data';

const getPPEValue = (placement) => {
    switch (placement) {
        case 'WIN': return 5;
        case 'TOP2': return 4.5;
        case 'HIGH': return 4;
        case 'SAFE': return 3;
        case 'LOW': return 2;
        case 'BTM': return 1.5;
        case 'BTM2': return 1;
        case 'SAVE': return 1;
        case 'ELIM': return 0;
        case 'RETURN': return 0;
        case 'LOSS': return 0;
        default: return 0;
    }
};

const calculatePPE = (trackRecord) => {
    if (!trackRecord || trackRecord.length === 0) return 0;
    const scoredPlacements = trackRecord.filter(p => p != null && !['GUEST', 'RUNNER UP', 'WINNER', 'MISS CON', 'RETURN', 'LOSS'].includes(p));
    if (scoredPlacements.length === 0) return 0;
    const total = scoredPlacements.reduce((sum, p) => sum + getPPEValue(p), 0);
    return (total / scoredPlacements.length).toFixed(2);
};

const getEliminationIndex = (q) => {
    if (!q.trackRecord || q.trackRecord.length === 0) return -1;
    // The "last active episode" for an eliminated queen is the index of their last 'ELIM' or 'RUNNER UP'
    const lastElim = q.trackRecord.lastIndexOf('ELIM');
    const lastRu = q.trackRecord.lastIndexOf('RUNNER UP');
    return Math.max(lastElim, lastRu);
};

const getPerformanceReview = (queen, score, rank, total) => {
    if (rank === 0) return `${queen.name} absolutely obliterated the challenge! A star is born!`;
    if (rank === 1) return `${queen.name} did amazing and kept everyone extremely entertained.`;
    if (rank === 2) return `${queen.name} did a great job, showing off exactly what her brand is about.`;
    if (rank >= total - 2) return `${queen.name} stumbled hard. The performance was cringey and completely missed the mark.`;
    if (rank === total - 3 && total > 4) return `${queen.name} was underwhelming and lost in the background.`;
    return `${queen.name} was mostly fine. Not the best, but certainly not the worst.`;
};

const getTrColors = (status) => {
    switch (status) {
        case 'WIN': return 'bg-blue-600 text-white font-black';
        case 'TOP2': return 'bg-cyan-300 text-cyan-900 font-bold';
        case 'HIGH': return 'bg-sky-200 text-sky-900 font-bold';
        case 'SAFE': return 'bg-white text-slate-500 font-medium';
        case 'LOW': return 'bg-pink-100 text-pink-500 font-bold';
        case 'BTM': return 'bg-orange-100 text-orange-600 font-bold';
        case 'BTM2': return 'bg-orange-200 text-orange-900 font-bold';
        case 'SAVE': return 'bg-green-200 text-green-900 font-bold';
        case 'RETURN': return 'bg-emerald-300 text-emerald-900 font-bold';
        case 'LOSS': return 'bg-rose-100 text-rose-400 font-bold';
        case 'GUEST': return 'bg-slate-200 text-slate-500 font-bold';
        case 'ELIM': return 'bg-red-600 text-white font-black';
        case 'WINNER': return 'bg-yellow-400 text-yellow-900 font-black';
        case 'MISS CON': return 'bg-purple-200 text-purple-900 font-black';
        case 'RUNNER UP': return 'bg-slate-300 text-slate-800 font-black';
        default: return 'bg-slate-100 text-transparent'; // empty
    }
}

const getShortLabel = (status) => {
    switch (status) {
        case 'WIN': return 'W';
        case 'TOP2': return 'T2';
        case 'HIGH': return 'H';
        case 'SAFE': return 'S';
        case 'LOW': return 'L';
        case 'BTM': return 'BT';
        case 'BTM2': return 'B2';
        case 'SAVE': return 'SV';
        case 'RETURN': return 'RT';
        case 'LOSS': return 'LS';
        case 'GUEST': return 'G';
        case 'ELIM': return 'E';
        case 'WINNER': return '👑';
        case 'MISS CON': return 'MC';
        case 'RUNNER UP': return 'RU';
        default: return '';
    }
}

const getPlacementLabel = (index, total, trackRecord) => {
    if (index === 0) return "1st (Winner)";
    if (trackRecord.includes('RUNNER UP')) return "2nd (Runner-up)";
    
    const place = index + 1;
    let suffix = 'th';
    if (place === 1) suffix = 'st';
    else if (place === 2) suffix = 'nd';
    else if (place === 3) suffix = 'rd';
    
    return `${place}${suffix}`;
};

const App = () => {
    // view: main, creator, presets, archive, queens_archive, game, winner
    const [view, setView] = useState('main'); 
    const [queens, setQueens] = useState([]);
    const [week, setWeek] = useState(1);
    const [logs, setLogs] = useState([]);
    const [gameState, setGameState] = useState('ANNOUNCE');
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [bottomTwo, setBottomTwo] = useState([]);
    const [weeklyWinner, setWeeklyWinner] = useState(null);
    const [weekResults, setWeekResults] = useState(null);
    const [sashayedQueen, setSashayedQueen] = useState(null);
    const [finaleFormat, setFinaleFormat] = useState('TOP_2'); // TOP_2, TOP_3, TOP_4_LSFTC
    const [lsftcPairs, setLsftcPairs] = useState(null); // [[q1, q2], [q3, q4]]
    const [lsftcWinners, setLsftcWinners] = useState([]); // [semi1, semi2]
    const [seasonFormat, setSeasonFormat] = useState('STANDARD'); // STANDARD, AS_LEGACY, AS_ASSASSIN
    const [hasReturnChallengeHappened, setHasReturnChallengeHappened] = useState(false);
    const [isReturnEpisode, setIsReturnEpisode] = useState(false); // Persists through ANNOUNCE->PERFORMANCES->CRITIQUES->PLACEMENTS
    const [lipSyncAssassin, setLipSyncAssassin] = useState(null);
    const [decisionMaker, setDecisionMaker] = useState(null); // Queen making choice
    const [missCongeniality, setMissCongeniality] = useState(null);
    const [currentGroups, setCurrentGroups] = useState([]);
    const [relationships, setRelationships] = useState({}); // { "id1_id2": score }
    const [latestDrama, setLatestDrama] = useState(null);
    const [disqualifiedQueen, setDisqualifiedQueen] = useState(null);
    const [challengeHistory, setChallengeHistory] = useState([]);
    const [riggingIntensity, setRiggingIntensity] = useState('OFF'); // OFF, LOW, MED, HIGH

    // Persistent State for Custom Queens
    const [customQueens, setCustomQueens] = useState(() => {
        try {
            const saved = localStorage.getItem('pastel_custom_queens');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('pastel_custom_queens', JSON.stringify(customQueens));
    }, [customQueens]);

    const uniqueSeasons = useMemo(() => {
        const seasons = [...new Set(customQueens.map(q => q.season))];
        return seasons.sort();
    }, [customQueens]);

    // Persistent State for Archived Seasons
    const [archivedSeasons, setArchivedSeasons] = useState(() => {
        try {
            const saved = localStorage.getItem('pastel_archived_seasons');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('pastel_archived_seasons', JSON.stringify(archivedSeasons));
    }, [archivedSeasons]);

    // Persistent State for All Stars Presets
    const [allStarsPresets, setAllStarsPresets] = useState(() => {
        try {
            const saved = localStorage.getItem('pastel_all_stars_presets');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('pastel_all_stars_presets', JSON.stringify(allStarsPresets));
    }, [allStarsPresets]);

    // Creator & Preset States
    const [searchTerm, setSearchTerm] = useState('');
    const [presetTab, setPresetTab] = useState('standard'); // standard, all_stars, all_stars_creator
    const [draftAllStars, setDraftAllStars] = useState({
        name: 'All Stars 1',
        queens: []
    });
    const [standardSeasonDraft, setStandardSeasonDraft] = useState({
        name: 'Season ' + (uniqueSeasons.length + 1),
        count: 12
    });
    const [draftQueen, setDraftQueen] = useState({
        name: '',
        archetype: ARCHETYPES[0].name,
        icon: ARCHETYPES[0].icon,
        season: 'Season 1',
        stats: { design: 50, performance: 50, acting_comedy: 50, runway: 50, nerve: 50, lip_sync: 50, improv: 50, branding: 50, sewing: 50 }
    });

    // Helper functions
    const generateQueenInfo = () => {
        const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const arch = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
        return {
            id: Math.random().toString(36).substr(2, 9),
            name: `${fn} ${ln}`,
            archetype: arch.name,
            icon: arch.icon,
            season: 'Random',
            eliminated: false,
            wins: 0,
            trackRecord: [],
            stats: {
                design: Math.floor(Math.random() * 50) + 40,
                performance: Math.floor(Math.random() * 50) + 40,
                acting_comedy: Math.floor(Math.random() * 50) + 40,
                runway: Math.floor(Math.random() * 50) + 40,
                nerve: Math.floor(Math.random() * 50) + 40,
                lip_sync: Math.floor(Math.random() * 50) + 40,
                improv: Math.floor(Math.random() * 50) + 40,
                branding: Math.floor(Math.random() * 50) + 40,
                sewing: Math.floor(Math.random() * 50) + 40
            }
        };
    };

    const createCast = (count) => {
        const newCast = Array.from({ length: count }, () => generateQueenInfo());
        setQueens(newCast);
    };

    const loadSeason = (seasonName) => {
        const seasonQueens = customQueens.filter(q => q.season === seasonName).map(q => {
            const history = getQueenHistoryByName(q.name);
            return {
                ...q,
                id: Math.random().toString(36).substr(2, 9), 
                eliminated: false,
                wins: 0,
                trackRecord: [],
                history: history ? history.allPlacements : []
            };
        });
        setQueens(seasonQueens);
        setView('main');
    };

    const loadAllStarsPreset = (preset) => {
        const seasonQueens = preset.queens.map(q => {
            const history = getQueenHistoryByName(q.name);
            return {
                ...q,
                id: Math.random().toString(36).substr(2, 9),
                eliminated: false,
                wins: 0,
                trackRecord: [],
                history: history ? history.allPlacements : []
            };
        });
        setQueens(seasonQueens);
        setView('main');
        setSeasonFormat('AS_LEGACY');
    };

    const saveAllStarsPreset = () => {
        if (!draftAllStars.name || draftAllStars.queens.length === 0) return alert("Please enter a name and add queens!");
        setAllStarsPresets(prev => [...prev, { ...draftAllStars, id: Date.now().toString() }]);
        setDraftAllStars({ name: 'All Stars ' + (allStarsPresets.length + 2), queens: [] });
        setPresetTab('all_stars');
    };

    const randomizeName = () => {
        let fullName;
        let unique = false;
        let attempts = 0;
        while (!unique && attempts < 100) {
            const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
            const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
            fullName = `${fn} ${ln}`;
            
            const existsInCustom = customQueens.some(q => q.name === fullName);
            const existsInRoom = queens.some(q => q.name === fullName);
            
            if (!existsInCustom && !existsInRoom) {
                unique = true;
            }
            attempts++;
        }
        setDraftQueen(prev => ({...prev, name: fullName}));
    };

    const randomizeDraftStats = () => {
        const arch = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
        setDraftQueen(prev => ({
            ...prev,
            archetype: arch.name,
            icon: arch.icon,
            stats: {
                design: Math.floor(Math.random() * 50) + 40,
                performance: Math.floor(Math.random() * 50) + 40,
                acting_comedy: Math.floor(Math.random() * 50) + 40,
                runway: Math.floor(Math.random() * 50) + 40,
                nerve: Math.floor(Math.random() * 50) + 40,
                lip_sync: Math.floor(Math.random() * 50) + 40,
                improv: Math.floor(Math.random() * 50) + 40,
                branding: Math.floor(Math.random() * 50) + 40,
                sewing: Math.floor(Math.random() * 50) + 40
            }
        }));
    };

    const saveDraftQueen = () => {
        if (!draftQueen.name.trim()) return alert("Please enter a name!");
        const newQueen = {
            id: Math.random().toString(36).substr(2, 9),
            ...draftQueen
        };
        setCustomQueens(prev => [...prev, newQueen]);
        // Reset draft name
        setDraftQueen(prev => ({...prev, name: ''}));
    };

    const deleteCustomQueen = (id) => {
        setCustomQueens(prev => prev.filter(q => q.id !== id));
    };

    const deleteSeason = (seasonName) => {
        if (!window.confirm(`Are you sure you want to delete ALL queens from "${seasonName}"?`)) return;
        setCustomQueens(prev => prev.filter(q => q.season !== seasonName));
    };

    const deleteASPreset = (id) => {
        if (!window.confirm("Delete this All Stars preset?")) return;
        setAllStarsPresets(prev => prev.filter(p => p.id !== id));
    };

    const generateAndSaveStandardSeason = () => {
        const { name, count } = standardSeasonDraft;
        if (!name.trim()) return alert("Please enter a season name!");
        
        const newQueens = Array.from({ length: count }, () => ({
            ...generateQueenInfo(),
            season: name,
            id: Math.random().toString(36).substr(2, 9)
        }));

        setCustomQueens(prev => [...prev, ...newQueens]);
        setStandardSeasonDraft({ name: 'Season ' + (uniqueSeasons.length + 2), count: 12 });
        setPresetTab('standard');
    };

    const getRelKey = (id1, id2) => [id1, id2].sort().join('_');

    const updateRelationship = (id1, id2, amount) => {
        const key = getRelKey(id1, id2);
        setRelationships(prev => ({
            ...prev,
            [key]: Math.min(100, Math.max(-100, (prev[key] || 0) + amount))
        }));
    };

    const triggerWorkroomDrama = () => {
        const remaining = queens.filter(q => !q.eliminated);
        if (remaining.length < 2) return;

        const shuffled = [...remaining].sort(() => 0.5 - Math.random());
        const q1 = shuffled[0];
        const q2 = shuffled[1];
        
        const relKey = getRelKey(q1.id, q2.id);
        const currentRel = relationships[relKey] || 0;

        // Filter templates: SECURITY only if very low relation
        let pool = DRAMA_TEMPLATES.filter(t => {
            if (t.type === 'SECURITY') return currentRel < -40;
            return true;
        });

        const template = pool[Math.floor(Math.random() * pool.length)];
        let text = template.template.replace('${q1}', q1.name).replace('${q2}', q2.name);
        
        let isDisqualified = false;
        if (template.type === 'SECURITY' && Math.random() < 0.05) {
            isDisqualified = true;
            text += ` It got so physical that ${q1.name} has been DISQUALIFIED from the competition!`;
        }

        setLatestDrama({ q1, q2, text, type: template.type, disqualified: isDisqualified ? q1 : null });
        updateRelationship(q1.id, q2.id, template.change);
        
        if (isDisqualified) {
            setQueens(prev => prev.map(q => q.id === q1.id ? { ...q, eliminated: true, trackRecord: [...q.trackRecord, 'ELIM'] } : q));
            setDisqualifiedQueen(q1);
        }

        setGameState('WORKROOM');
    };

    const generateGroups = (queensList, challengeType) => {
        const shuffled = [...queensList].sort(() => 0.5 - Math.random());
        let groups = [];
        const groupNames = ["Team Pink", "Team Blue", "Team Lavender", "Team Mint", "Team Peach", "Team Lemon", "Team Sky", "Team Rose"];

        if (challengeType === 'solo') {
            groups = shuffled.map(q => ({ name: q.name, members: [q] }));
        } else if (challengeType === 'duo') {
            const count = shuffled.length;
            for (let i = 0; i < count; i += 2) {
                if (i === count - 3) {
                    // Make a trio for the last group if odd
                    groups.push({ name: `Trio: ${shuffled[i].name}, ${shuffled[i+1].name} & ${shuffled[i+2].name}`, members: [shuffled[i], shuffled[i+1], shuffled[i+2]] });
                    break;
                } else if (i === count - 1) {
                    // This shouldn't happen with the trio logic above, but safety first
                    groups[groups.length - 1].members.push(shuffled[i]);
                    groups[groups.length - 1].name += ` & ${shuffled[i].name}`;
                } else {
                    groups.push({ name: `Duo: ${shuffled[i].name} & ${shuffled[i+1].name}`, members: [shuffled[i], shuffled[i+1]] });
                }
            }
        } else if (challengeType === 'team') {
            const count = shuffled.length;
            let teamCount = 2;
            if (count >= 12) teamCount = 4;
            else if (count >= 9) teamCount = 3;

            for (let i = 0; i < teamCount; i++) {
                groups.push({ name: groupNames[i] || `Team ${i+1}`, members: [] });
            }
            shuffled.forEach((q, index) => {
                groups[index % teamCount].members.push(q);
            });
        }
        return groups;
    };

    // Game logic
    const addLog = (msg, type = 'normal') => {
        setLogs(prev => [{ msg, type, id: Date.now() + Math.random() }, ...prev]);
    };

    const startSeason = () => {
        if (queens.length < 4) return;
        setView('game');
        initWeek();
    };

    const startReturnChallenge = () => {
        setWeek(week + 1);
        const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
        const challengeName = 'The Return: ' + challenge.name;
        const eliminated = queens.filter(q => q.eliminated);
        const groups = generateGroups(eliminated, challenge.type);

        setCurrentChallenge({ ...challenge, name: challengeName, desc: 'Eliminated queens, this is your chance to return to the competition! ' + challenge.desc });
        setChallengeHistory(prev => [...prev, challengeName]);
        setCurrentGroups(groups);
        setIsReturnEpisode(true);
        setGameState('ANNOUNCE');
        setWeekResults(null);
        setSashayedQueen(null);
        setWeeklyWinner(null);
        setBottomTwo([]);
    };
    const initWeek = () => {
        const remaining = queens.filter(q => !q.eliminated);
        
        let threshold = 1;
        if (finaleFormat === 'TOP_2') threshold = 2;
        if (finaleFormat === 'TOP_3') threshold = 3;
        if (finaleFormat === 'TOP_4_LSFTC') threshold = 4;
        if (['TOP_4_RACE', 'LIP_SYNC_GAUNTLET'].includes(finaleFormat)) threshold = 4;
        if (['SUDDEN_DEATH_LIP_SYNC', 'JURY_OF_PEERS'].includes(finaleFormat)) threshold = 3;


        if (remaining.length === 1) {
            setView('winner');
            return;
        }

        if (remaining.length <= threshold) {
            // Finales skip drama
            const finaleName = finaleFormat === 'TOP_4_LSFTC' ? "Grand Finale: LSFTC" : "Grand Finale";
            setChallengeHistory(prev => [...prev, finaleName]);
            
            if (finaleFormat === 'TOP_2') {
                setGameState('FINALE_TOP2_LIPSYNC');
                setBottomTwo(remaining.slice(0, 2));
            } else if (finaleFormat === 'TOP_3') {
                setGameState('FINALE_TOP3_CHALLENGE');
            } else if (finaleFormat === 'TOP_4_LSFTC') {
                setGameState('FINALE_LSFTC_SETUP');
                const shuffled = [...remaining].sort(() => 0.5 - Math.random());
                setLsftcPairs([[shuffled[0], shuffled[1]], [shuffled[2], shuffled[3]]]);
                setLsftcWinners([]);
            } else if (finaleFormat === 'TOP_4_RACE') {
                setGameState('FINALE_TOP4_CHALLENGE');
            } else if (finaleFormat === 'LIP_SYNC_GAUNTLET') {
                // Placeholder: This is a complex format that would require new UI and state for seeding
                // For now, it will act like a Top 4 smackdown
                setGameState('FINALE_LSFTC_SETUP');
                const shuffled = [...remaining].sort(() => 0.5 - Math.random());
                setLsftcPairs([[shuffled[0], shuffled[1]], [shuffled[2], shuffled[3]]]);
                setLsftcWinners([]);
            } else if (finaleFormat === 'SUDDEN_DEATH_LIP_SYNC') {
                setGameState('FINALE_SUDDEN_DEATH');
                setBottomTwo(remaining.slice(0, 3)); // Using bottomTwo to hold the three finalists
            } else if (finaleFormat === 'JURY_OF_PEERS') {
                // Placeholder: This format would require new UI for voting.
                // For now, it will act like a Top 3 challenge finale
                setGameState('FINALE_TOP3_CHALLENGE');
            }
            
            return;
        }

        triggerWorkroomDrama();
    };

    const confirmDrama = () => {
        const remaining = queens.filter(q => !q.eliminated);
        const availableChallenges = CHALLENGES.filter(c => {
            if (remaining.length < c.minCast) return false;
            return true;
        });

        const challenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
        const groups = generateGroups(remaining, challenge.type);
        
        setCurrentChallenge(challenge);
        setChallengeHistory(prev => [...prev, challenge.name]);
        setCurrentGroups(groups);
        setGameState('ANNOUNCE');
        setWeekResults(null);
        setSashayedQueen(null);
        setWeeklyWinner(null);
        setBottomTwo([]);
        setDisqualifiedQueen(null);
    };

    const runPerformances = () => {
        const competitors = isReturnEpisode ? queens.filter(q => q.eliminated) : queens.filter(q => !q.eliminated);
        
        // 1. Calculate base individual scores
        const individualScores = competitors.map(q => {
            let score = 0;
            if (currentChallenge && currentChallenge.weights) {
                Object.entries(currentChallenge.weights).forEach(([stat, weight]) => {
                    score += (q.stats[stat] || 40) * weight;
                });
            } else {
                score = (q.stats.performance * 0.4) + (q.stats.runway * 0.3) + (q.stats.branding * 0.3);
            }
            return { queenId: q.id, score };
        });

        // 2. Calculate group performance averages
        const groupAverages = currentGroups.map(group => {
            const memberScores = group.members.map(m => individualScores.find(is => is.queenId === m.id).score);
            const avg = memberScores.reduce((a, b) => a + b, 0) / memberScores.length;
            return { groupName: group.name, avg };
        });

        // 3. Final weighted scores
        const results = competitors.map(q => {
            const indivScore = individualScores.find(is => is.queenId === q.id).score;
            const group = currentGroups.find(g => g.members.some(m => m.id === q.id));
            const groupAvg = groupAverages.find(ga => ga.groupName === group.name).avg;
            
            // Synergy/Friction Logic
            let socialBonus = 0;
            let relIcons = [];
            
            if (group.members.length > 1) {
                group.members.forEach(m => {
                    if (m.id === q.id) return;
                    const relKey = getRelKey(q.id, m.id);
                    const relScore = relationships[relKey] || 0;
                    
                    if (relScore > 40) {
                        socialBonus += 5;
                        relIcons.push('❤️');
                    } else if (relScore < -40) {
                        socialBonus -= 5;
                        relIcons.push('💀');
                    }
                    if (relScore > 80) socialBonus += 5; // Bestie boost
                    if (relScore < -80) socialBonus -= 5; // Nemesis penalty
                });
            }

            // Weighting: 40% individual, 60% team average
            const finalScore = (indivScore * 0.4) + (groupAvg * 0.6) + socialBonus + (Math.random() * 20);
            
            return { 
                queen: q, 
                score: finalScore, 
                groupName: group.name,
                socialBonus,
                relIcons: [...new Set(relIcons)] // Unique icons
            };
        }).sort((a, b) => b.score - a.score);

        setWeekResults(results);
        setGameState('PERFORMANCES');
    };

    const runCritiques = () => {
        setGameState('CRITIQUES');
    };

    const padTrackRecord = (trackRecord, targetEpisode) => {
        // Pad with null entries for missed episodes so index matches episode number
        const padded = [...trackRecord];
        while (padded.length < targetEpisode - 1) {
            padded.push(null);
        }
        return padded;
    };

    const runPlacements = () => {
        const currentEpisode = week; // week is the current episode number

        if (isReturnEpisode) {
            const winner = weekResults[0].queen;
            const returnCompetitors = weekResults.map(r => r.queen);
            setWeeklyWinner(winner);
            setQueens(prev => prev.map(q => {
                if (q.id === winner.id) {
                    // Return winner: un-eliminate and mark RETURN
                    const padded = padTrackRecord(q.trackRecord, currentEpisode);
                    return { ...q, eliminated: false, trackRecord: [...padded, 'RETURN'] };
                }
                if (returnCompetitors.some(rc => rc.id === q.id)) {
                    // Other eliminated queens who competed but lost
                    const padded = padTrackRecord(q.trackRecord, currentEpisode);
                    return { ...q, trackRecord: [...padded, 'LOSS'] };
                }
                if (!q.eliminated) {
                    // Queens still in the competition sit this one out
                    const padded = padTrackRecord(q.trackRecord, currentEpisode);
                    return { ...q, trackRecord: [...padded, 'GUEST'] };
                }
                return q;
            }));
            setIsReturnEpisode(false);
            setGameState('RETURN_WINNER');
            return;
        }

        if (seasonFormat === 'STANDARD') {
            const firstResult = weekResults[0];
            const winningTeamName = firstResult.groupName;
            const winningTeamMembers = currentGroups.find(g => g.name === winningTeamName)?.members || [];
            
            // "Rare Team Win" condition: 
            // 1. Challenge must be 'duo' or 'team'
            // 2. All members of the top team must be in the top 3 overall OR have very high average
            // 3. 15% random chance if the above is met
            const topTeamResults = weekResults.filter(r => r.groupName === winningTeamName);
            const isExcellentTeam = currentChallenge.type !== 'solo' && 
                                   topTeamResults.every(r => r.score > 60) && 
                                   Math.random() < 0.15;

            let winners = isExcellentTeam ? winningTeamMembers : [firstResult.queen];

            // --- PRODUCTION RIGGING: WINNER SPREAD ---
            if (riggingIntensity !== 'OFF' && !isExcellentTeam) {
                const threshold = riggingIntensity === 'LOW' ? 5 : riggingIntensity === 'MED' ? 10 : 15;
                const topContenders = weekResults.slice(0, 3);
                const nonWinners = topContenders.filter(r => r.queen.wins === 0 && r.score >= firstResult.score - threshold);
                
                if (nonWinners.length > 0) {
                    // Pick the one with highest score among non-winners who are close enough
                    const newWinner = nonWinners[0].queen;
                    winners = [newWinner];
                    // Tag them for the UI
                    const resultIndex = weekResults.findIndex(r => r.queen.id === newWinner.id);
                    weekResults[resultIndex].isProducerPick = true;
                }
            }

            let btm = weekResults.slice(-2).map(r => r.queen);

            // --- PRODUCTION RIGGING: VULNERABILITY MOMENT ---
            if (riggingIntensity !== 'OFF' && weekResults.length > 4) {
                const vulnerabilityChance = riggingIntensity === 'LOW' ? 0.05 : riggingIntensity === 'MED' ? 0.1 : 0.15;
                if (Math.random() < vulnerabilityChance) {
                    // Pick a frontrunner who isn't already in the bottom or winning
                    const frontrunners = weekResults.filter(r => 
                        !winners.some(w => w.id === r.queen.id) && 
                        !btm.some(b => b.id === r.queen.id) &&
                        Number(calculatePPE(r.queen.trackRecord)) > 3.5
                    );
                    if (frontrunners.length > 0) {
                        const victim = frontrunners[Math.floor(Math.random() * frontrunners.length)];
                        // Swap with the better of the bottom two to keep the "shocker" realistic
                        const btmIndex = weekResults.indexOf(weekResults.find(r => r.queen.id === btm[0].id));
                        weekResults[btmIndex] = { ...victim, isShockBottom: true };
                        btm[0] = victim.queen;
                    }
                }
            }

            let tops = weekResults.filter(r => !winners.some(w => w.id === r.queen.id) && !btm.some(b => b.id === r.queen.id)).slice(0, 2).map(r => r.queen);
            let low = weekResults.length > 5 ? weekResults[weekResults.length - 3].queen : null;

            setWeeklyWinner(isExcellentTeam ? { name: winningTeamName, id: 'TEAM_WIN', icon: '👯' } : firstResult.queen);
            setBottomTwo(btm);
            
            setQueens(prev => prev.map(q => {
                const padded = padTrackRecord(q.trackRecord, currentEpisode);
                if (winners.some(w => w.id === q.id)) return { ...q, wins: q.wins + 1, trackRecord: [...padded, 'WIN'] };
                if (btm.some(b => b.id === q.id)) return q; // BTM2 added later
                if (low && low.id === q.id) return { ...q, trackRecord: [...padded, 'LOW'] };
                if (tops.some(t => t.id === q.id)) return { ...q, trackRecord: [...padded, 'HIGH'] };
                if (!q.eliminated) return { ...q, trackRecord: [...padded, 'SAFE'] };
                return q;
            }));
            setGameState('PLACEMENTS');

        } else if (seasonFormat === 'AS_LEGACY') {
            let top2 = weekResults.slice(0, 2).map(r => r.queen);

            // --- PRODUCTION RIGGING: WINNER SPREAD (AS) ---
            if (riggingIntensity !== 'OFF') {
                const threshold = riggingIntensity === 'LOW' ? 5 : riggingIntensity === 'MED' ? 10 : 15;
                const candidates = weekResults.slice(0, 4);
                const nonWinners = candidates.filter(r => r.queen.wins === 0 && !top2.some(t => t.id === r.queen.id) && r.score >= weekResults[1].score - threshold);
                
                if (nonWinners.length > 0) {
                    const newWinner = nonWinners[0].queen;
                    top2[1] = newWinner; // Replace the 2nd place
                    const resultIndex = weekResults.findIndex(r => r.queen.id === newWinner.id);
                    weekResults[resultIndex].isProducerPick = true;
                }
            }

            const btmCount = weekResults.length > 4 ? 3 : 2;
            let btm = weekResults.slice(-btmCount).map(r => r.queen);

            // --- PRODUCTION RIGGING: VULNERABILITY MOMENT (AS) ---
            if (riggingIntensity !== 'OFF' && weekResults.length > 4) {
                const vulnerabilityChance = riggingIntensity === 'LOW' ? 0.05 : riggingIntensity === 'MED' ? 0.1 : 0.15;
                if (Math.random() < vulnerabilityChance) {
                    const frontrunners = weekResults.filter(r => 
                        !top2.some(t => t.id === r.queen.id) && 
                        !btm.some(b => b.id === r.queen.id) &&
                        Number(calculatePPE(r.queen.trackRecord)) > 3.5
                    );
                    if (frontrunners.length > 0) {
                        const victim = frontrunners[Math.floor(Math.random() * frontrunners.length)];
                        const btmIndex = weekResults.indexOf(weekResults.find(r => r.queen.id === btm[0].id));
                        weekResults[btmIndex] = { ...victim, isShockBottom: true };
                        btm[0] = victim.queen;
                    }
                }
            }

            const safe = weekResults.filter(r => !top2.some(t => t.id === r.queen.id) && !btm.some(b => b.id === r.queen.id)).map(r => r.queen);

            setWeeklyWinner(null);
            setBottomTwo(btm);
            setDecisionMaker(top2);
            setLipSyncAssassin(null);

            setQueens(prev => prev.map(q => {
                const padded = padTrackRecord(q.trackRecord, currentEpisode);
                if (top2.some(t => t.id === q.id)) return q; 
                if (btm.some(b => b.id === q.id)) return q; // Track record added at elimination based on format
                if (safe.some(s => s.id === q.id)) return { ...q, trackRecord: [...padded, 'SAFE'] };
                return q;
            }));
            setGameState('PLACEMENTS_LEGACY');

        } else if (seasonFormat === 'AS_ASSASSIN') {
            let winner = weekResults[0].queen;

            // --- PRODUCTION RIGGING: WINNER SPREAD (AS) ---
            if (riggingIntensity !== 'OFF') {
                const threshold = riggingIntensity === 'LOW' ? 5 : riggingIntensity === 'MED' ? 10 : 15;
                const topContenders = weekResults.slice(0, 3);
                const nonWinners = topContenders.filter(r => r.queen.wins === 0 && r.score >= weekResults[0].score - threshold);
                
                if (nonWinners.length > 0) {
                    winner = nonWinners[0].queen;
                    const resultIndex = weekResults.findIndex(r => r.queen.id === winner.id);
                    weekResults[resultIndex].isProducerPick = true;
                }
            }

            const tops = weekResults.filter(r => r.queen.id !== winner.id).slice(0, 2).map(r => r.queen);
            const btmCount = weekResults.length > 5 ? 3 : 2;
            let btm = weekResults.slice(-btmCount).map(r => r.queen);

            // --- PRODUCTION RIGGING: VULNERABILITY MOMENT (AS) ---
            if (riggingIntensity !== 'OFF' && weekResults.length > 4) {
                const vulnerabilityChance = riggingIntensity === 'LOW' ? 0.05 : riggingIntensity === 'MED' ? 0.1 : 0.15;
                if (Math.random() < vulnerabilityChance) {
                    const frontrunners = weekResults.filter(r => 
                        r.queen.id !== winner.id &&
                        !tops.some(t => t.id === r.queen.id) && 
                        !btm.some(b => b.id === r.queen.id) &&
                        Number(calculatePPE(r.queen.trackRecord)) > 3.5
                    );
                    if (frontrunners.length > 0) {
                        const victim = frontrunners[Math.floor(Math.random() * frontrunners.length)];
                        const btmIndex = weekResults.indexOf(weekResults.find(r => r.queen.id === btm[0].id));
                        weekResults[btmIndex] = { ...victim, isShockBottom: true };
                        btm[0] = victim.queen;
                    }
                }
            }

            setWeeklyWinner(winner);
            setBottomTwo(btm);
            setDecisionMaker(winner);

            // Gen random assassin
            const lsaPool = customQueens.length > 0 ? customQueens : queens;
            const lsaGen = lsaPool[Math.floor(Math.random() * lsaPool.length)];
            const lsaBase = { ...lsaGen, name: lsaGen.name + ' (LSA)' };
            
            // Boost assassin stats so they are a threat
            lsaBase.stats = { ...lsaBase.stats, lip_sync: (lsaBase.stats.lip_sync || 50) + 30, nerve: (lsaBase.stats.nerve || 50) + 20 };
            setLipSyncAssassin(lsaBase);

            setQueens(prev => prev.map(q => {
                const padded = padTrackRecord(q.trackRecord, currentEpisode);
                if (q.id === winner.id) return { ...q, wins: q.wins + 1, trackRecord: [...padded, 'WIN'] };
                if (tops.some(t => t.id === q.id && q.id !== winner.id)) return { ...q, trackRecord: [...padded, 'HIGH'] };
                if (btm.some(b => b.id === q.id)) return q; 
                if (!q.eliminated) return { ...q, trackRecord: [...padded, 'SAFE'] };
                return q;
            }));
            setGameState('PLACEMENTS_ASSASSIN');
        }
    };

    const runLipsync = () => {
        const [q1, q2] = bottomTwo;
        let s1 = (q1.stats.lip_sync * 0.6) + (q1.stats.nerve * 0.4) + (Math.random() * 30);
        let s2 = (q2.stats.lip_sync * 0.6) + (q2.stats.nerve * 0.4) + (Math.random() * 30);

        // --- PRODUCTION RIGGING: LIPSNC保护 ---
        if (riggingIntensity !== 'OFF') {
            const ppeMultiplier = riggingIntensity === 'LOW' ? 2 : riggingIntensity === 'MED' ? 4 : 6;
            const ppe1 = Number(calculatePPE(q1.trackRecord));
            const ppe2 = Number(calculatePPE(q2.trackRecord));
            s1 += ppe1 * ppeMultiplier;
            s2 += ppe2 * ppeMultiplier;
        }

        // Double Shantay/Sashay Checks
        const diffThreshold = riggingIntensity === 'HIGH' ? 15 : riggingIntensity === 'MED' ? 10 : 5;
        const ppe1 = Number(calculatePPE(q1.trackRecord));
        const ppe2 = Number(calculatePPE(q2.trackRecord));
        
        if (s1 > 85 && s2 > 85 && Math.abs(s1 - s2) < diffThreshold) {
            setSashayedQueen(null);
            setWeeklyWinner(null);
            setQueens(prev => prev.map(q => {
                if (q.id === q1.id || q.id === q2.id) {
                    const padded = padTrackRecord(q.trackRecord, week);
                    return { ...q, trackRecord: [...padded, 'SAVE'] };
                }
                return q;
            }));
            setGameState('LIPSYNC_DOUBLE_SHANTAY');
            return;
        }

        if (s1 < 30 && s2 < 30) {
            setSashayedQueen({ id: 'DOUBLE_SASHAY' });
            setWeeklyWinner(null);
            setQueens(prev => prev.map(q => {
                if (q.id === q1.id || q.id === q2.id) {
                    const padded = padTrackRecord(q.trackRecord, week);
                    return { ...q, eliminated: true, trackRecord: [...padded, 'ELIM'] };
                }
                return q;
            }));
            setGameState('LIPSYNC_DOUBLE_SASHAY');
            return;
        }

        const survivor = s1 > s2 ? q1 : q2;
        const sashay = s1 > s2 ? q2 : q1;

        setSashayedQueen(sashay);
        setWeeklyWinner(survivor); 

        setQueens(prev => prev.map(q => {
            const padded = padTrackRecord(q.trackRecord, week);
            if (q.id === survivor.id) return { ...q, trackRecord: [...padded, 'BTM2'] };
            if (q.id === sashay.id) return { ...q, eliminated: true, trackRecord: [...padded, 'ELIM'] };
            return q;
        }));

        setGameState('LIPSYNC');
    };

    const runLegacyLipsync = () => {
        const [q1, q2] = decisionMaker; // The top 2
        const s1 = (q1.stats.lip_sync * 0.6) + (q1.stats.nerve * 0.4) + (Math.random() * 30);
        const s2 = (q2.stats.lip_sync * 0.6) + (q2.stats.nerve * 0.4) + (Math.random() * 30);

        const lipSyncWinner = s1 > s2 ? q1 : q2;
        const lipSyncLoser = s1 > s2 ? q2 : q1;

        setWeeklyWinner(lipSyncWinner);
        
        setQueens(prev => prev.map(q => {
            const padded = padTrackRecord(q.trackRecord, week);
            if (q.id === lipSyncWinner.id) return { ...q, wins: q.wins + 1, trackRecord: [...padded, 'WIN'] };
            if (q.id === lipSyncLoser.id) return { ...q, trackRecord: [...padded, 'TOP2'] };
            return q;
        }));
        
        setGameState('LIPSYNC_DECISION_LEGACY');
    };

    const runLegacyDecision = (eliminatedQueenId) => {
        const sashay = bottomTwo.find(q => q.id === eliminatedQueenId);
        setSashayedQueen(sashay);
        setQueens(prev => prev.map(q => {
            const padded = padTrackRecord(q.trackRecord, week);
            if (q.id === sashay.id) return { ...q, eliminated: true, trackRecord: [...padded, 'ELIM'] };
            if (bottomTwo.some(b => b.id === q.id && q.id !== sashay.id)) return { ...q, trackRecord: [...padded, 'BTM'] };
            return q;
        }));
        setGameState('FAREWELL');
    };

    const runAssassinLipsync = () => {
        const q1 = decisionMaker; // Winner
        const q2 = lipSyncAssassin;
        
        const s1 = (q1.stats.lip_sync * 0.6) + (q1.stats.nerve * 0.4) + (Math.random() * 30);
        const s2 = (q2.stats.lip_sync * 0.6) + (q2.stats.nerve * 0.4) + (Math.random() * 30);

        if (s1 > s2) {
            // Winner wins => picks lipstick
            setGameState('LIPSYNC_DECISION_ASSASSIN_WIN');
        } else {
            // Assassin wins => group vote logic
            const groupPick = bottomTwo[Math.floor(Math.random() * bottomTwo.length)];
            runLegacyDecision(groupPick.id); // Reusing logic!
        }
    };

    const runFarewell = () => {
        if (sashayedQueen && sashayedQueen.id !== 'DOUBLE_SASHAY') {
            const allies = queens.filter(q => !q.eliminated && getRelKey(q.id, sashayedQueen.id) in relationships && relationships[getRelKey(q.id, sashayedQueen.id)] > 60);
            if (allies.length > 0) {
                setQueens(prev => prev.map(q => {
                    if (allies.some(a => a.id === q.id)) {
                        return { ...q, stats: { ...q.stats, nerve: Math.max(0, (q.stats.nerve || 50) - 10) } };
                    }
                    return q;
                }));
            }
        }
        setGameState('FAREWELL');
    };

    const calculateMissCongeniality = () => {
        const eliminated = queens.filter(q => q.eliminated);
        if (eliminated.length === 0) return;
        // The one with highest PPE gets it
        const mc = eliminated.reduce((highest, q) => Number(calculatePPE(q.trackRecord)) > Number(calculatePPE(highest.trackRecord)) ? q : highest, eliminated[0]);
        setMissCongeniality(mc);
    };

    const runFinaleTop2 = () => {
        const [q1, q2] = bottomTwo;
        const ppe1 = Number(calculatePPE(q1.trackRecord));
        const ppe2 = Number(calculatePPE(q2.trackRecord));
        const s1 = (q1.stats.lip_sync * 0.6) + (q1.stats.nerve * 0.4) + (ppe1 * 5) + (Math.random() * 30);
        const s2 = (q2.stats.lip_sync * 0.6) + (q2.stats.nerve * 0.4) + (ppe2 * 5) + (Math.random() * 30);
        const survivor = s1 > s2 ? q1 : q2;
        const sashay = s1 > s2 ? q2 : q1;

        setQueens(prev => prev.map(q => {
            if (q.id === survivor.id) return { ...q, trackRecord: [...q.trackRecord, 'WIN'] }; 
            if (q.id === sashay.id) return { ...q, eliminated: true, trackRecord: [...q.trackRecord, 'RUNNER UP'] }; 
            return q;
        }));

        calculateMissCongeniality();
        setTimeout(() => setView('winner'), 1500);
    };

    const runFinaleTop3 = () => {
        const remaining = queens.filter(q => !q.eliminated);
        const results = remaining.map(q => {
            const ppe = Number(calculatePPE(q.trackRecord));
            let score = (q.stats.performance * 0.4) + (q.stats.branding * 0.3) + (q.stats.runway * 0.3) + (ppe * 5) + (Math.random() * 20);
            return { queen: q, score };
        }).sort((a, b) => b.score - a.score);

        const winner = results[0].queen;
        
        setQueens(prev => prev.map(q => {
            if (q.id === winner.id) return { ...q, trackRecord: [...q.trackRecord, 'WIN'] };
            if (!q.eliminated) return { ...q, eliminated: true, trackRecord: [...q.trackRecord, 'RUNNER UP'] };
            return q;
        }));

        calculateMissCongeniality();
        setTimeout(() => setView('winner'), 1500);
    };

const runFinaleTop4 = () => {
    const remaining = queens.filter(q => !q.eliminated);
    const results = remaining.map(q => {
        const ppe = Number(calculatePPE(q.trackRecord));
        let score = (q.stats.performance * 0.4) + (q.stats.branding * 0.3) + (q.stats.runway * 0.3) + (ppe * 5) + (Math.random() * 20);
        return { queen: q, score };
    }).sort((a, b) => b.score - a.score);

    const winner = results[0].queen;
    
    setQueens(prev => prev.map(q => {
        if (q.id === winner.id) return { ...q, trackRecord: [...q.trackRecord, 'WIN'] };
        if (!q.eliminated) return { ...q, eliminated: true, trackRecord: [...q.trackRecord, 'RUNNER UP'] };
        return q;
    }));

    calculateMissCongeniality();
    setTimeout(() => setView('winner'), 1500);
};

const runFinaleSuddenDeath = () => {
    const [q1, q2, q3] = bottomTwo;
    const finalists = [q1, q2, q3];

    const results = finalists.map(q => {
        const ppe = Number(calculatePPE(q.trackRecord));
        const score = (q.stats.lip_sync * 0.6) + (q.stats.nerve * 0.4) + (ppe * 5) + (Math.random() * 30);
        return { queen: q, score };
    }).sort((a, b) => b.score - a.score);

    const winner = results[0].queen;

    setQueens(prev => prev.map(q => {
        if (q.id === winner.id) return { ...q, trackRecord: [...q.trackRecord, 'WIN'] };
        if (finalists.some(f => f.id === q.id) && q.id !== winner.id) {
            return { ...q, eliminated: true, trackRecord: [...q.trackRecord, 'RUNNER UP'] };
        }
        return q;
    }));

    calculateMissCongeniality();
    setTimeout(() => setView('winner'), 1500);
};


    const randomizeLsftcPairs = () => {
        const remaining = queens.filter(q => !q.eliminated);
        const shuffled = [...remaining].sort(() => 0.5 - Math.random());
        setLsftcPairs([[shuffled[0], shuffled[1]], [shuffled[2], shuffled[3]]]);
    };

    const runLsftcSemi = (index) => {
        const [q1, q2] = lsftcPairs[index];
        const ppe1 = Number(calculatePPE(q1.trackRecord));
        const ppe2 = Number(calculatePPE(q2.trackRecord));
        const s1 = (q1.stats.lip_sync * 0.6) + (q1.stats.nerve * 0.4) + (ppe1 * 5) + (Math.random() * 30);
        const s2 = (q2.stats.lip_sync * 0.6) + (q2.stats.nerve * 0.4) + (ppe2 * 5) + (Math.random() * 30);
        const survivor = s1 > s2 ? q1 : q2;
        const sashay = s1 > s2 ? q2 : q1;

        setQueens(prev => prev.map(q => {
            if (q.id === sashay.id) return { ...q, eliminated: true, trackRecord: [...q.trackRecord, 'ELIM'] }; 
            return q; // Survivor gets NO track record update until the final!
        }));
        
        setLsftcWinners(prev => {
            const newWinners = [...prev, survivor];
            if (newWinners.length === 2) {
                setGameState('FINALE_LSFTC_FINAL');
            } else {
                setGameState('FINALE_LSFTC_SEMI_2');
            }
            return newWinners;
        });
    };

    const runLsftcFinal = () => {
        const [q1, q2] = lsftcWinners;
        const ppe1 = Number(calculatePPE(q1.trackRecord));
        const ppe2 = Number(calculatePPE(q2.trackRecord));
        const s1 = (q1.stats.lip_sync * 0.6) + (q1.stats.nerve * 0.4) + (ppe1 * 5) + (Math.random() * 30);
        const s2 = (q2.stats.lip_sync * 0.6) + (q2.stats.nerve * 0.4) + (ppe2 * 5) + (Math.random() * 30);
        const survivor = s1 > s2 ? q1 : q2;
        const sashay = s1 > s2 ? q2 : q1;

        setQueens(prev => prev.map(q => {
            if (q.id === survivor.id) return { ...q, trackRecord: [...q.trackRecord, 'WIN'] }; 
            if (q.id === sashay.id) return { ...q, eliminated: true, trackRecord: [...q.trackRecord, 'RUNNER UP'] };
            return q;
        }));

        calculateMissCongeniality();
        setTimeout(() => setView('winner'), 1500);
    };

    const reset = () => {
        setView('main');
        setQueens([]);
        setWeek(1);
        setLogs([]);
        setHasReturnChallengeHappened(false);
        setIsReturnEpisode(false);
        setMissCongeniality(null);
        setLipSyncAssassin(null);
        setDecisionMaker(null);
        setChallengeHistory([]);
    };

    const remainingQueens = useMemo(() => queens.filter(q => !q.eliminated), [queens]);
    const sortedQueens = useMemo(() => [...queens].sort((a, b) => {
        // 1. Active queens first
        if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
        
        if (a.eliminated) {
            // 2. Eliminated queens: sort by how long they lasted
            const indexA = getEliminationIndex(a);
            const indexB = getEliminationIndex(b);
            
            if (indexB !== indexA) {
                return indexB - indexA;
            }
            
            // 3. Same elimination episode: sort by PPE
            const ppeA = Number(calculatePPE(a.trackRecord));
            const ppeB = Number(calculatePPE(b.trackRecord));
            if (ppeB !== ppeA) return ppeB - ppeA;
            
            return b.wins - a.wins;
        }
        
        // 4. Active queens: sort by PPE or Wins
        const ppeA = Number(calculatePPE(a.trackRecord));
        const ppeB = Number(calculatePPE(b.trackRecord));
        if (ppeB !== ppeA) return ppeB - ppeA;
        return b.wins - a.wins;
    }), [queens]);



    const queensByOriginalSeason = useMemo(() => {
        // Find all unique queens across all archived seasons
        const queensMap = new Map(); // key: "name"

        // archivedSeasons are [record, record, ...] from newest to oldest due to saveToArchive logic
        // We want to process them chronologically to find the REAL original season
        const chronologicalSeasons = [...archivedSeasons].reverse();

        chronologicalSeasons.forEach(record => {
            record.cast.forEach((q, index) => {
                const queenKey = q.name; 
                if (!queensMap.has(queenKey)) {
                    queensMap.set(queenKey, {
                        name: q.name,
                        icon: q.icon,
                        originalSeason: record.seasonName,
                        originalPlacement: getPlacementLabel(index, record.cast.length, q.trackRecord),
                        wins: record.winner?.name === q.name ? 1 : 0,
                        appearances: [],
                        allPlacements: [{
                            season: record.seasonName,
                            placement: getPlacementLabel(index, record.cast.length, q.trackRecord)
                        }]
                    });
                } else {
                    // This is a subsequent appearance
                    const existing = queensMap.get(queenKey);
                    if (record.winner?.name === q.name) existing.wins += 1;
                    existing.appearances.push({
                        seasonName: record.seasonName,
                        placement: getPlacementLabel(index, record.cast.length, q.trackRecord)
                    });
                    existing.allPlacements.push({
                        season: record.seasonName,
                        placement: getPlacementLabel(index, record.cast.length, q.trackRecord)
                    });
                }
            });
        });

        const groups = {};
        queensMap.forEach(queenData => {
            if (!groups[queenData.originalSeason]) {
                groups[queenData.originalSeason] = [];
            }
            groups[queenData.originalSeason].push(queenData);
        });

        return groups;
    }, [archivedSeasons]);

    const getQueenHistoryByName = (name) => {
        // Flatten queensByOriginalSeason to find a match
        for (const season in queensByOriginalSeason) {
            const match = queensByOriginalSeason[season].find(q => q.name === name);
            if (match) return match;
        }
        return null;
    };

    const saveToArchive = () => {
        if (queens.length === 0) return; // Prevent double trigger when queens array is already cleared

        let seasonName = "Custom Season";
        const customSeasonsPresent = [...new Set(queens.filter(q => q.season && q.season !== 'Random').map(q => q.season))];
        if (customSeasonsPresent.length === 1) {
            seasonName = customSeasonsPresent[0];
        } else if (customSeasonsPresent.length > 1) {
            seasonName = "All Stars Cast";
        }
        
        const sortedQueensArchiveOrder = [...queens].sort((a, b) => {
            if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
            if (a.eliminated) {
                const indexA = getEliminationIndex(a);
                const indexB = getEliminationIndex(b);
                if (indexB !== indexA) return indexB - indexA;
                
                const ppeA = Number(calculatePPE(a.trackRecord));
                const ppeB = Number(calculatePPE(b.trackRecord));
                if (ppeB !== ppeA) return ppeB - ppeA;
                return b.wins - a.wins;
            }
            const ppeA = Number(calculatePPE(a.trackRecord));
            const ppeB = Number(calculatePPE(b.trackRecord));
            if (ppeB !== ppeA) return ppeB - ppeA;
            return b.wins - a.wins;
        });

        const record = {
            id: Date.now().toString(),
            seasonName,
            date: new Date().toLocaleDateString(),
            winner: sortedQueensArchiveOrder[0],
            missCongeniality,
            seasonFormat,
            cast: sortedQueensArchiveOrder
        };

        setArchivedSeasons(prev => [record, ...prev]);
        reset();
    };

    const isSetupView = ['main', 'creator', 'presets', 'archive', 'queens_archive'].includes(view);

    return (
        <div className="min-h-screen bg-[#fff5f8] text-slate-700 p-2 sm:p-4 font-sans selection:bg-pink-200">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <header className="flex flex-col items-center justify-center py-4 sm:py-6">
                    <div className="bg-white p-2 sm:p-3 rounded-full shadow-sm mb-2 sm:mb-3">
                        <Sparkles className="text-pink-400 w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 tracking-tight italic">
                        PASTEL RACE
                    </h1>
                    <p className="text-pink-300 font-medium tracking-widest text-[8px] sm:text-[10px] uppercase mt-1 sm:mt-1.5">Whimsical Edition</p>
                </header>

                {isSetupView && (
                    <div className="flex justify-center mb-2 sm:mb-4 animate-in fade-in zoom-in duration-300">
                        <div className="bg-white/70 backdrop-blur-md rounded-2xl sm:rounded-full shadow-sm p-1.5 sm:p-2 flex flex-wrap justify-center gap-1 sm:gap-2 border border-pink-100 w-full sm:w-auto">
                            <button onClick={() => setView('main')} className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-full font-bold text-xs sm:text-sm transition-all ${view === 'main' ? 'bg-pink-400 text-white shadow-md' : 'text-slate-500 hover:bg-pink-50'}`}>Main Season</button>
                            <button onClick={() => setView('creator')} className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-full font-bold text-xs sm:text-sm transition-all ${view === 'creator' ? 'bg-pink-400 text-white shadow-md' : 'text-slate-500 hover:bg-pink-50'}`}>Create Queen</button>
                            <button onClick={() => setView('presets')} className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-full font-bold text-xs sm:text-sm transition-all ${view === 'presets' ? 'bg-pink-400 text-white shadow-md' : 'text-slate-500 hover:bg-pink-50'}`}>Preset Casts</button>
                            <button onClick={() => setView('archive')} className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-full font-bold text-xs sm:text-sm transition-all ${view === 'archive' ? 'bg-pink-400 text-white shadow-md' : 'text-slate-500 hover:bg-pink-50'}`}>Seasons</button>
                            <button onClick={() => setView('queens_archive')} className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-full font-bold text-xs sm:text-sm transition-all ${view === 'queens_archive' ? 'bg-pink-400 text-white shadow-md' : 'text-slate-500 hover:bg-pink-50'}`}>Queens</button>
                        </div>
                    </div>
                )}

                {view === 'main' && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                        {/* Current Cast */}
                        <div className="bg-white/70 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl border border-pink-100">
                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 border-b border-pink-50 pb-6 gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-pink-500 flex items-center gap-2 mb-2">
                                        <Heart className="fill-pink-500" /> Workroom ({queens.length})
                                    </h2>
                                    <p className="text-slate-500 font-medium">Load preset casts from tabs above, or add randoms.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <select 
                                        value={finaleFormat} 
                                        onChange={(e) => setFinaleFormat(e.target.value)}
                                        className="bg-slate-50 border border-pink-200 text-slate-600 text-sm rounded-xl px-3 py-2 font-bold focus:outline-pink-300 transition-all appearance-none text-center cursor-pointer shadow-sm hover:bg-white"
                                    >
                                        <option value="TOP_2">Top 2 Finale</option>
                                        <option value="TOP_3">Top 3 Grand Finale</option>
                                        <option value="TOP_4_LSFTC">Top 4 Smackdown</option>
                                        <option value="TOP_4_RACE">Top 4 Race</option>
                                        <option value="LIP_SYNC_GAUNTLET">Lip Sync Gauntlet</option>
                                        <option value="SUDDEN_DEATH_LIP_SYNC">Top 3 Sudden Death</option>
                                        <option value="JURY_OF_PEERS">Jury of Peers</option>
                                    </select>
                                    <select 
                                        value={seasonFormat} 
                                        onChange={(e) => setSeasonFormat(e.target.value)}
                                        className="bg-slate-50 border border-purple-200 text-slate-600 text-sm rounded-xl px-3 py-2 font-bold focus:outline-purple-300 transition-all appearance-none text-center cursor-pointer shadow-sm hover:bg-white"
                                    >
                                        <option value="STANDARD">Standard Format</option>
                                        <option value="AS_LEGACY">All Stars (Legacy)</option>
                                        <option value="AS_ASSASSIN">All Stars (Assassin)</option>
                                    </select>
                                    <div className="flex flex-col items-center gap-1 group relative">
                                        <label className="text-[9px] font-black text-pink-400 uppercase tracking-tighter">Rigging Drama</label>
                                        <select 
                                            value={riggingIntensity} 
                                            onChange={(e) => setRiggingIntensity(e.target.value)}
                                            className={`bg-slate-50 border ${riggingIntensity !== 'OFF' ? 'border-yellow-400 text-yellow-700' : 'border-slate-200 text-slate-500'} text-[10px] rounded-xl px-2 py-1 font-black focus:outline-yellow-300 transition-all appearance-none text-center cursor-pointer shadow-sm hover:bg-white`}
                                        >
                                            <option value="OFF">Rigging: OFF</option>
                                            <option value="LOW">Rigging: LOW 🎬</option>
                                            <option value="MED">Rigging: MED ✨</option>
                                            <option value="HIGH">Rigging: HIGH 👑</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => createCast(10)} className="bg-pink-100 text-pink-600 px-4 py-2 rounded-xl font-bold hover:bg-pink-200 transition-colors flex items-center gap-2 text-sm shadow-sm">
                                            <RefreshCw size={16} /> Random 10
                                        </button>
                                        <button onClick={() => setQueens([...queens, generateQueenInfo()])} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm shadow-sm">
                                            + 1
                                        </button>
                                        {queens.length > 0 && (
                                            <button onClick={() => setQueens([])} className="ml-2 text-slate-400 hover:text-red-500 text-sm font-bold transition-colors">
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {queens.map((q) => (
                                    <div key={q.id} className="bg-white border border-pink-100 p-2.5 rounded-2xl flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-xl shadow-inner border border-pink-100 shrink-0">
                                                {q.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-800 leading-tight text-sm truncate">{q.name}</h3>
                                                <div className="flex items-center gap-1">
                                                    <p className="text-[8px] text-pink-400 font-bold uppercase tracking-widest truncate">{q.archetype}</p>
                                                    {q.history && q.history.length > 0 && (
                                                        <span className="text-[7px] bg-purple-50 text-purple-400 px-1 rounded-sm font-black uppercase">All Star</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setQueens(queens.filter(x => x.id !== q.id))} className="text-pink-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {queens.length === 0 && (
                                    <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center text-pink-300 italic font-medium border-2 border-dashed border-pink-100 rounded-3xl">
                                        The workroom is empty right now...
                                    </div>
                                )}
                            </div>

                            {queens.length >= 4 && (
                                <div className="mt-8 text-center animate-in slide-in-from-bottom-4">
                                    <button
                                        onClick={startSeason}
                                        className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-10 py-3 rounded-full text-lg font-black shadow-xl shadow-pink-200 hover:scale-105 transition-transform"
                                    >
                                        START THE SHOW
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Creator View */}
                {view === 'creator' && (
                    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-pink-100 animate-in slide-in-from-right-8 duration-500">
                        <div className="mb-4 border-b border-pink-50 pb-4">
                            <h2 className="text-2xl font-black text-slate-800">Queen Creator</h2>
                            <p className="text-pink-400 font-medium text-sm">Design your custom contestant</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basics */}
                            <div className="space-y-5">
                                <div className="flex justify-between items-center border-b border-purple-100 pb-2">
                                    <h3 className="text-lg font-bold text-purple-400">The Basics</h3>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-sm font-bold text-slate-500">Drag Name</label>
                                        <button 
                                            onClick={randomizeName}
                                            className="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition flex items-center gap-1"
                                        >
                                            <Dice5 size={12} /> Gen Name
                                        </button>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={draftQueen.name}
                                        onChange={e => setDraftQueen({...draftQueen, name: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-2 font-medium text-slate-800 focus:border-pink-300 focus:bg-white outline-none transition-all text-sm"
                                        placeholder="e.g. Trixie Mattel"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-1">Archetype</label>
                                        <select 
                                            value={draftQueen.archetype}
                                            onChange={e => {
                                                const arch = ARCHETYPES.find(a => a.name === e.target.value);
                                                setDraftQueen({...draftQueen, archetype: arch.name, icon: arch.icon});
                                            }}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-medium text-slate-800 focus:border-pink-300 outline-none"
                                        >
                                            {ARCHETYPES.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-1">Emoji Icon</label>
                                        <input 
                                            type="text" 
                                            value={draftQueen.icon}
                                            onChange={e => setDraftQueen({...draftQueen, icon: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-2 font-medium text-center text-lg focus:border-pink-300 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-1">Season Tag</label>
                                    <input 
                                        type="text" 
                                        value={draftQueen.season}
                                        onChange={e => setDraftQueen({...draftQueen, season: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-medium text-slate-800 focus:border-purple-300 focus:bg-white outline-none transition-all"
                                        placeholder="e.g. Season 1, All Stars..."
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-pink-100 pb-2">
                                    <h3 className="text-lg font-bold text-pink-400">Queen Stats</h3>
                                    <button 
                                        onClick={randomizeDraftStats}
                                        className="text-xs font-bold bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg hover:bg-pink-100 flex items-center gap-1 transition-colors"
                                    >
                                        <RefreshCw size={12} /> Randomize Stats
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                    {Object.entries(draftQueen.stats).map(([statName, val]) => (
                                        <div key={statName}>
                                            <div className="flex justify-between mb-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{statName.replace('_', ' ')}</label>
                                                <span className="text-[10px] font-black text-pink-500">{val}</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" max="100" 
                                                value={val}
                                                onChange={e => setDraftQueen({
                                                    ...draftQueen, 
                                                    stats: {...draftQueen.stats, [statName]: parseInt(e.target.value)}
                                                })}
                                                className="w-full accent-pink-400 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end gap-4">
                            <button onClick={() => setDraftQueen({...draftQueen, name: ''})} className="text-slate-500 font-bold px-6 py-4 rounded-xl hover:bg-slate-50 transition-colors">
                                Clear
                            </button>
                            <button 
                                onClick={saveDraftQueen}
                                className="bg-gradient-to-r from-pink-400 to-purple-400 text-white font-black px-10 py-4 rounded-xl hover:scale-105 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl shadow-pink-200"
                            >
                                <Save size={20} /> Save Queen to Library
                            </button>
                        </div>
                    </div>
                )}

                {/* Presets View */}
                {view === 'presets' && (
                    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-pink-100 animate-in slide-in-from-right-8 duration-500">
                        <div className="mb-6 border-b border-pink-50 pb-4">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Users className="text-purple-400" /> Cast Presets</h2>
                            <p className="text-purple-400 font-medium text-sm">Load your custom casts or assemble an All Stars season</p>
                        </div>

                        {/* Preset Sub-Tabs */}
                        <div className="flex flex-wrap gap-2 mb-6 bg-purple-50 p-1 rounded-xl w-fit">
                            <button onClick={() => setPresetTab('standard')} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${presetTab === 'standard' ? 'bg-purple-500 text-white shadow-sm' : 'text-purple-400 hover:bg-purple-100'}`}>Standard Series</button>
                            <button onClick={() => setPresetTab('standard_creator')} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${presetTab === 'standard_creator' ? 'bg-purple-500 text-white shadow-sm' : 'text-purple-400 hover:bg-purple-100'}`}>+ Create Standard</button>
                            <button onClick={() => setPresetTab('all_stars')} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${presetTab === 'all_stars' ? 'bg-purple-500 text-white shadow-sm' : 'text-purple-400 hover:bg-purple-100'}`}>All Stars Records</button>
                            <button onClick={() => setPresetTab('all_stars_creator')} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${presetTab === 'all_stars_creator' ? 'bg-purple-500 text-white shadow-sm' : 'text-purple-400 hover:bg-purple-100'}`}>+ Create All Stars</button>
                        </div>
                        
                        {presetTab === 'standard' && (
                            uniqueSeasons.length === 0 ? (
                                <div className="py-12 text-center text-purple-300 italic font-medium border-2 border-dashed border-purple-100 rounded-3xl">
                                    No custom seasons found. Use the Create Queen tab to make some!
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {uniqueSeasons.map(s => (
                                        <div key={s} className="bg-purple-50 rounded-2xl p-4 border border-purple-100 shadow-sm flex flex-col items-start justify-between">
                                            <div className="w-full">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="text-lg font-black text-purple-800">{s}</h3>
                                                    <span className="bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{customQueens.filter(q => q.season === s).length} Queens</span>
                                                </div>
                                                <div className="flex -space-x-2 mb-4 overflow-hidden py-1">
                                                    {customQueens.filter(q => q.season === s).map((q, i) => (
                                                        <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-purple-100 flex items-center justify-center text-xs shadow-sm z-10 hover:z-20 hover:scale-110 transition-transform" title={q.name}>
                                                            {q.icon}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="w-full flex gap-2">
                                                <button 
                                                    onClick={() => loadSeason(s)}
                                                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <FolderOpen size={16} /> Load
                                                </button>
                                                <button 
                                                    onClick={() => deleteSeason(s)}
                                                    className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all border border-red-100"
                                                    title="Delete Season"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {presetTab === 'standard_creator' && (
                            <div className="max-w-md mx-auto bg-purple-50 rounded-3xl p-8 border border-purple-100 shadow-inner animate-in zoom-in duration-300">
                                <div className="text-center mb-8">
                                    <div className="text-4xl mb-2">✨</div>
                                    <h3 className="text-xl font-black text-purple-800">Standard Season Creator</h3>
                                    <p className="text-sm text-purple-500">Quickly generate a random cast for a new season</p>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-purple-400 uppercase tracking-widest mb-2">Season Tag</label>
                                        <input 
                                            type="text"
                                            value={standardSeasonDraft.name}
                                            onChange={e => setStandardSeasonDraft({...standardSeasonDraft, name: e.target.value})}
                                            placeholder="e.g. Season 15"
                                            className="w-full bg-white border-2 border-purple-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:border-purple-400 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-xs font-black text-purple-400 uppercase tracking-widest">Number of Queens</label>
                                            <span className="text-sm font-black text-purple-600">{standardSeasonDraft.count} Queens</span>
                                        </div>
                                        <input 
                                            type="range"
                                            min="8" max="16"
                                            value={standardSeasonDraft.count}
                                            onChange={e => setStandardSeasonDraft({...standardSeasonDraft, count: parseInt(e.target.value)})}
                                            className="w-full accent-purple-500 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between mt-1 px-1">
                                            <span className="text-[10px] font-bold text-purple-300">8</span>
                                            <span className="text-[10px] font-bold text-purple-300">12</span>
                                            <span className="text-[10px] font-bold text-purple-300">16</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={generateAndSaveStandardSeason}
                                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Plus size={20} /> Generate & Save Season
                                    </button>
                                </div>
                            </div>
                        )}

                        {presetTab === 'all_stars' && (
                            allStarsPresets.length === 0 ? (
                                <div className="py-12 text-center text-purple-300 italic font-medium border-2 border-dashed border-purple-100 rounded-3xl">
                                    No All Stars presets created yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {allStarsPresets.map(p => (
                                        <div key={p.id} className="bg-purple-50 rounded-2xl p-4 border border-purple-100 shadow-sm flex flex-col items-start justify-between">
                                            <div className="w-full">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="text-lg font-black text-purple-800">{p.name}</h3>
                                                    <span className="bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{p.queens.length} Queens</span>
                                                </div>
                                                <div className="flex -space-x-2 mb-4 overflow-hidden py-1">
                                                    {p.queens.map((q, i) => (
                                                        <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-purple-100 flex items-center justify-center text-xs shadow-sm z-10 hover:z-20 hover:scale-110 transition-transform" title={q.name}>
                                                            {q.icon}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="w-full flex gap-2">
                                                <button 
                                                    onClick={() => loadAllStarsPreset(p)}
                                                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <Crown size={16} /> Cast AS
                                                </button>
                                                <button 
                                                    onClick={() => deleteASPreset(p.id)}
                                                    className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all border border-red-100"
                                                    title="Delete Preset"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {presetTab === 'all_stars_creator' && (
                            <div className="space-y-6">
                                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Session Name</label>
                                            <input 
                                                type="text" 
                                                value={draftAllStars.name}
                                                onChange={e => setDraftAllStars({...draftAllStars, name: e.target.value})}
                                                className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:outline-purple-300"
                                                placeholder="e.g. All Stars 1"
                                            />
                                        </div>
                                        <div className="text-right">
                                            <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Count</label>
                                            <p className="text-2xl font-black text-purple-600">{draftAllStars.queens.length}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 min-h-[50px] p-2 bg-white/50 rounded-xl border border-dashed border-purple-200 mb-4 items-center">
                                        {draftAllStars.queens.map(q => (
                                            <button 
                                                key={q.id}
                                                onClick={() => setDraftAllStars({...draftAllStars, queens: draftAllStars.queens.filter(x => x.id !== q.id)})}
                                                className="flex items-center gap-1 bg-white border border-purple-200 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-red-50 hover:border-red-200 transition-all group"
                                            >
                                                <span>{q.icon}</span> {q.name} <Trash2 size={10} className="text-slate-300 group-hover:text-red-400" />
                                            </button>
                                        ))}
                                        {draftAllStars.queens.length === 0 && <p className="text-xs text-purple-300 italic px-2">Click queens below to add them to the cast...</p>}
                                    </div>

                                    <button 
                                        onClick={saveAllStarsPreset}
                                        disabled={draftAllStars.queens.length === 0}
                                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black py-3 rounded-xl shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                                    >
                                        SAVE AS ALL STARS PRESET
                                    </button>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center justify-between">
                                        Select from Queen Library
                                        <input 
                                            type="text" 
                                            placeholder="Search..." 
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="text-xs font-normal border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-purple-300"
                                        />
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {customQueens
                                            .filter(q => !searchTerm || q.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(q => {
                                                const history = getQueenHistoryByName(q.name);
                                                const isSelected = draftAllStars.queens.some(x => x.id === q.id);
                                                return (
                                                    <button 
                                                        key={q.id}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setDraftAllStars({...draftAllStars, queens: draftAllStars.queens.filter(x => x.id !== q.id)});
                                                            } else {
                                                                setDraftAllStars({...draftAllStars, queens: [...draftAllStars.queens, q]});
                                                            }
                                                        }}
                                                        className={`text-left p-3 rounded-2xl border transition-all flex items-start gap-3 group relative overflow-hidden ${isSelected ? 'bg-purple-100 border-purple-300 ring-2 ring-purple-200' : 'bg-white border-slate-100 hover:border-purple-200 hover:bg-purple-50/30'}`}
                                                    >
                                                        <span className="text-2xl mt-1">{q.icon}</span>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-slate-800 text-sm leading-tight mb-1">{q.name}</p>
                                                            {history ? (
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-black text-purple-500 uppercase tracking-tighter">History Found:</p>
                                                                    {history.allPlacements.map((p, i) => (
                                                                        <p key={i} className="text-[8px] text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                                                            {p.season}: <span className="font-bold text-purple-600">{p.placement}</span>
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-[9px] text-slate-400 italic">No debut recorded yet.</p>
                                                            )}
                                                        </div>
                                                        {isSelected && <div className="absolute top-1 right-1 bg-purple-500 text-white rounded-full p-0.5"><Crown size={10} fill="currentColor"/></div>}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Seasons Archive View */}
                {view === 'archive' && (
                    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-pink-100 animate-in slide-in-from-right-8 duration-500">
                        <div className="flex justify-between items-center mb-6 border-b border-pink-50 pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Library className="text-pink-400" /> Season Archive</h2>
                                <p className="text-pink-400 font-medium text-sm">The official hall of fame 👑</p>
                            </div>
                            {archivedSeasons.length > 0 && (
                                <button onClick={() => {if(window.confirm('Clear archive?')) setArchivedSeasons([])}} className="text-slate-400 hover:text-red-500 text-xs font-bold transition-colors">
                                    Clear History
                                </button>
                            )}
                        </div>

                        {archivedSeasons.length === 0 ? (
                            <div className="py-12 text-center text-pink-300 italic font-medium border-2 border-dashed border-pink-100 rounded-3xl">
                                No seasons recorded yet. Play a game and save it at the end!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {archivedSeasons.map(record => (
                                    <div key={record.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-3">
                                            <div>
                                                <h3 className="text-base sm:text-xl font-black text-slate-800">{record.seasonName} <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-lg ml-1">{record.seasonFormat || 'STANDARD'}</span></h3>
                                                <p className="text-[10px] font-medium text-slate-500">Saved on {record.date}</p>
                                                {record.missCongeniality && (
                                                    <p className="text-[10px] font-bold text-purple-500 mt-1 flex items-center gap-1"><Heart size={10}/> Miss Congeniality: {record.missCongeniality.name}</p>
                                                )}
                                            </div>
                                            <div className="bg-yellow-100 text-yellow-700 font-black px-3 py-1 rounded-xl flex items-center gap-2 border border-yellow-200 shadow-sm text-[10px] sm:text-xs self-start">
                                                <Crown size={12} /> {record.winner?.name || 'Unknown'} {record.winner?.icon || ''}
                                            </div>
                                        </div>

                                        <div className="mt-2 w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm custom-scrollbar bg-white">
                                            <table className="w-full text-center border-collapse text-[9px] sm:text-xs">
                                                <thead>
                                                    <tr className="bg-slate-100 border-b border-slate-200">
                                                        <th className="p-1.5 sm:p-2.5 text-left font-black text-slate-700 uppercase tracking-wider min-w-[70px] sm:min-w-[130px] text-[9px] sm:text-xs">Queen</th>
                                                        {Array.from({ length: Math.max(...record.cast.map(q => q.trackRecord.length)) }).map((_, i) => (
                                                            <th key={i} className="p-1 sm:p-2 font-bold text-slate-500 w-6 sm:w-12 text-[8px] sm:text-xs">{i + 1}</th>
                                                        ))}
                                                        <th className="p-1 sm:p-2 font-black text-slate-700 uppercase tracking-wider text-[8px] sm:text-xs hidden sm:table-cell">Place</th>
                                                        <th className="p-1 sm:p-2 font-black text-slate-700 uppercase tracking-wider text-[8px] sm:text-xs">PPE</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {record.cast.map((q, idx) => {
                                                        const maxEp = Math.max(...record.cast.map(c => c.trackRecord.length));
                                                        return (
                                                            <tr key={`${q.id}-${idx}`} className="border-b border-slate-100 last:border-none hover:bg-slate-50 transition-colors">
                                                                <td className="p-1 sm:p-2.5 text-left font-bold text-slate-800 border-r border-slate-100">
                                                                    <div className="flex items-center gap-1 sm:gap-2">
                                                                        <span className="text-xs sm:text-lg bg-slate-50 rounded-full w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center border border-slate-100 shrink-0">{q.icon}</span>
                                                                        <span className="truncate max-w-[50px] sm:max-w-none text-[9px] sm:text-xs">{q.name}</span>
                                                                    </div>
                                                                </td>
                                                                {Array.from({ length: maxEp }).map((_, i) => {
                                                                    let status = q.trackRecord[i] || null;

                                                                    const colors = status ? getTrColors(status) : 'bg-slate-50 text-transparent';
                                                                    return (
                                                                        <td key={i} className={`p-0.5 sm:p-1.5 border-r border-slate-100 text-[7px] sm:text-[10px] ${colors}`}>
                                                                            <span className="hidden sm:inline">{status || '-'}</span>
                                                                            <span className="sm:hidden">{status ? getShortLabel(status) : '-'}</span>
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td className={`p-1 sm:p-2 border-l-2 border-slate-200 text-[7px] sm:text-xs hidden sm:table-cell ${idx === 0 ? getTrColors('WINNER') : q.eliminated ? getTrColors('ELIM') : getTrColors('RUNNER UP')}`}>
                                                                    {idx === 0 ? 'WINNER' : q.eliminated ? 'ELIMINATED' : 'RUNNER UP'}
                                                                </td>
                                                                <td className="p-1 sm:p-2 font-bold text-slate-600 bg-slate-50 border-l border-slate-100 w-7 sm:w-14 text-[8px] sm:text-[10px] text-center">
                                                                    {calculatePPE(q.trackRecord)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Queens Archive View */}
                {view === 'queens_archive' && (
                    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-pink-100 animate-in slide-in-from-right-8 duration-500">
                        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 border-b border-pink-50 pb-4 gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Users className="text-pink-400" /> Queens Archive</h2>
                                <p className="text-pink-400 font-medium text-sm">Competition history by debut season 🌸</p>
                            </div>
                            <div className="relative w-full md:w-56">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ArrowLeft className="text-pink-300 w-3 h-3 rotate-180" />
                                </span>
                                <input 
                                    type="text" 
                                    placeholder="Search queens..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-9 pr-3 py-1.5 border border-pink-100 rounded-xl bg-pink-50/30 text-xs placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:bg-white transition-all font-medium"
                                />
                            </div>
                        </div>

                        {Object.keys(queensByOriginalSeason).length === 0 ? (
                            <div className="py-12 text-center text-pink-300 italic font-medium border-2 border-dashed border-pink-100 rounded-3xl">
                                No records found. Complete a season and save it to see your queens here!
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(queensByOriginalSeason)
                                    .filter(([seasonName, queens]) => {
                                        if (!searchTerm) return true;
                                        return queens.some(q => q.name.toLowerCase().includes(searchTerm.toLowerCase()));
                                    })
                                    .map(([seasonName, queens]) => {
                                        const filteredQueensInSeason = queens.filter(q => q.name.toLowerCase().includes(searchTerm.toLowerCase()));
                                        if (filteredQueensInSeason.length === 0) return null;

                                    return (
                                        <div key={seasonName} className="animate-in fade-in slide-in-from-bottom-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-pink-100"></div>
                                                <h3 className="text-base font-black text-pink-300 uppercase tracking-[0.2em] px-3">{seasonName}</h3>
                                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-pink-100"></div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                                {filteredQueensInSeason.map((q) => (
                                                    <div key={q.name} className="bg-white group border border-pink-50 rounded-xl p-2.5 shadow-sm hover:shadow-lg hover:border-pink-200 transition-all duration-300">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg flex items-center justify-center text-xl shadow-inner border border-pink-100 group-hover:scale-110 transition-transform shrink-0">
                                                                {q.icon}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-[11px] font-black text-slate-800 group-hover:text-pink-500 transition-colors truncate">{q.name}</h4>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[7px] font-black text-pink-400 bg-pink-50 px-1 py-0.5 rounded-md uppercase tracking-tighter">{q.originalPlacement}</span>
                                                                    {q.wins > 0 && <span className="text-[7px] font-black text-yellow-600 bg-yellow-50 px-1 py-0.5 rounded-md uppercase tracking-tighter">{q.wins} 👑</span>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {q.appearances.length > 0 && (
                                                            <div className="pt-1.5 border-t border-dashed border-pink-100">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {q.appearances.slice(0, 2).map((app, idx) => (
                                                                        <div key={idx} className="flex gap-0.5 items-center bg-purple-50 px-1 py-0.5 rounded-md border border-purple-100/50">
                                                                            <span className="text-[6px] font-black text-purple-400 uppercase tracking-tighter truncate max-w-[30px]">{app.seasonName}</span>
                                                                            <span className="text-[7px] font-black text-purple-600">{app.placement}</span>
                                                                        </div>
                                                                    ))}
                                                                    {q.appearances.length > 2 && <span className="text-[6px] font-bold text-slate-400">+{q.appearances.length - 2}</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Game view */}
                {view === 'game' && (
                    <div className="animate-in slide-in-from-bottom-10 duration-700">
                        {/* Main Stage */}
                        <div className="space-y-6 max-w-4xl mx-auto">
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-8 shadow-xl border border-pink-50 min-h-[400px] sm:min-h-[500px] flex flex-col">
                                <div className="flex justify-between items-start mb-4 sm:mb-6">
                                    <div>
                                        <span className="bg-pink-100 text-pink-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest">Week {week}</span>
                                        <h2 className="text-xl sm:text-4xl font-black text-slate-800 mt-1 sm:mt-2">{currentChallenge?.name}</h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-[10px] sm:text-sm font-medium">Remaining</p>
                                        <p className="text-lg sm:text-2xl font-black text-pink-400">{remainingQueens.length}</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto mb-4 sm:mb-6 pr-1 sm:pr-2 custom-scrollbar">
                                    {gameState === 'WORKROOM' && latestDrama && (
                                        <div className="text-center p-4 sm:p-8 animate-in zoom-in duration-500 flex flex-col items-center">
                                            <div className="flex items-center justify-center gap-4 sm:gap-12 mb-8 relative">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 sm:w-32 sm:h-32 bg-pink-50 rounded-full flex items-center justify-center text-4xl sm:text-6xl shadow-inner border-4 border-white ring-4 ring-pink-100">
                                                        {latestDrama.q1.icon}
                                                    </div>
                                                    <p className="mt-2 font-black text-slate-700 text-xs sm:text-sm">{latestDrama.q1.name}</p>
                                                </div>
                                                
                                                <div className="text-2xl sm:text-4xl font-black text-pink-200">VS</div>
                                                
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 sm:w-32 sm:h-32 bg-purple-50 rounded-full flex items-center justify-center text-4xl sm:text-6xl shadow-inner border-4 border-white ring-4 ring-purple-100">
                                                        {latestDrama.q2.icon}
                                                    </div>
                                                    <p className="mt-2 font-black text-slate-700 text-xs sm:text-sm">{latestDrama.q2.name}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg relative border-4 border-slate-800">
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    {latestDrama.type === 'SECURITY' ? '⚠️ SECURITY ALERT' : '🎬 WORKROOM DRAMA'}
                                                </div>
                                                <p className="text-base sm:text-xl font-bold leading-relaxed italic">
                                                    "{latestDrama.text}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {gameState === 'ANNOUNCE' && (
                                        <div className="text-center p-8 animate-in fade-in zoom-in duration-500">
                                            <div className="text-6xl mb-6">📢</div>
                                            <h3 className="text-2xl font-black text-slate-800 mb-4">"Hello, hello, hello!"</h3>
                                            <p className="text-lg font-medium text-slate-600 mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
                                                {currentChallenge?.desc}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {gameState === 'PERFORMANCES' && weekResults && (
                                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                            <h3 className="text-xl font-black text-pink-500 flex items-center gap-2 mb-4"><Star /> Main Stage Performances</h3>
                                            {currentGroups.map((group, gIdx) => {
                                                const groupResults = weekResults.filter(r => r.groupName === group.name);
                                                if (groupResults.length === 0) return null;
                                                return (
                                                    <div key={gIdx} className="space-y-3">
                                                        {currentChallenge.type !== 'solo' && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-px flex-1 bg-slate-100"></div>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.name}</span>
                                                                <div className="h-px flex-1 bg-slate-100"></div>
                                                            </div>
                                                        )}
                                                        {groupResults.map((r, i) => (
                                                            <div key={`${r.queen.id}-${i}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                                                                <div className="relative shrink-0">
                                                                    <span className="text-4xl bg-slate-50 rounded-full w-14 h-14 flex items-center justify-center shadow-inner relative z-10">{r.queen.icon}</span>
                                                                    {r.relIcons && r.relIcons.length > 0 && (
                                                                        <div className="absolute -top-1 -right-1 flex gap-0.5 z-20">
                                                                            {r.relIcons.map((icon, idx) => (
                                                                                <span key={idx} className="text-xs animate-bounce" style={{ animationDelay: `${idx * 0.2}s` }}>{icon}</span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="font-medium text-slate-700 leading-snug">{getPerformanceReview(r.queen, r.score, weekResults.indexOf(r), weekResults.length)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {gameState === 'CRITIQUES' && weekResults && (
                                        <div className="text-center p-8 animate-in slide-in-from-bottom-8 duration-500">
                                            <div className="text-6xl mb-6">👀</div>
                                            <h3 className="text-2xl font-black text-slate-800 mb-6">Judges' Critiques</h3>
                                            <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100 mb-6">
                                                <p className="font-bold text-sky-800 mb-2">SAFE QUEENS</p>
                                                <p className="text-sky-600 font-medium leading-relaxed">
                                                    {weekResults.length > 5 ? weekResults.slice(3, -2).map(r => r.queen.name).join(', ') : 'No one'}
                                                </p>
                                                <p className="text-sm mt-2 text-sky-500 italic">You are safe to slay another day.</p>
                                            </div>
                                            <p className="text-slate-600 font-bold mb-4">The tops and bottoms of the week are:</p>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {[...weekResults.slice(0, 3), ...weekResults.slice(-2)].map(r => (
                                                    <span key={r.queen.id} className="bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm">{r.queen.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {gameState === 'PLACEMENTS' && weeklyWinner && (
                                        <div className="space-y-4 animate-in zoom-in duration-500">
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 text-center relative overflow-hidden">
                                                <Sparkles className="absolute top-4 right-4 text-blue-300 animate-pulse" />
                                                <span className="text-5xl block mb-4">{weeklyWinner.icon}</span>
                                                <h3 className="text-xl font-bold text-blue-900 mb-1">{weeklyWinner.name}</h3>
                                                 <p className="text-blue-700 font-black uppercase tracking-widest text-sm">
                                                    {weeklyWinner.id === 'TEAM_WIN' ? "Condragulations, your entire team is the winner of this week's challenge!" : "Condragulations, you are the winner of this week's challenge!"}
                                                </p>
                                                {weekResults?.[0]?.isProducerPick && (
                                                    <div className="mt-2 inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-[10px] font-black animate-bounce shadow-sm">
                                                        🎬 PRODUCER'S PICK
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-center relative overflow-hidden">
                                                <h3 className="text-lg font-bold text-orange-900 mb-4">I'm sorry my dears, but you are up for elimination.</h3>
                                                <div className="flex justify-center items-center gap-6">
                                                    <div className="text-center relative">
                                                        <span className="text-4xl">{bottomTwo[0]?.icon}</span>
                                                        <p className="mt-2 font-bold text-orange-800">{bottomTwo[0]?.name}</p>
                                                        {weekResults?.find(r => r.queen.id === bottomTwo[0]?.id)?.isShockBottom && (
                                                            <div className="absolute -top-4 -left-4 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded rotate-[-15deg] shadow-sm animate-pulse whitespace-nowrap">SHOCKER! ⚠️</div>
                                                        )}
                                                    </div>
                                                    <span className="text-orange-300 font-black italic">VS</span>
                                                    <div className="text-center relative">
                                                        <span className="text-4xl">{bottomTwo[1]?.icon}</span>
                                                        <p className="mt-2 font-bold text-orange-800">{bottomTwo[1]?.name}</p>
                                                        {weekResults?.find(r => r.queen.id === bottomTwo[1]?.id)?.isShockBottom && (
                                                            <div className="absolute -top-4 -right-4 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded rotate-[15deg] shadow-sm animate-pulse whitespace-nowrap">SHOCKER! ⚠️</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {['LIPSYNC', 'PLACEMENTS_LEGACY', 'PLACEMENTS_ASSASSIN'].includes(gameState) && (
                                        <div className="text-center animate-in fade-in duration-500 pt-8">
                                            <h3 className="text-2xl font-black text-purple-600 bg-purple-50 py-4 px-6 rounded-2xl border border-purple-200 mb-8 inline-block shadow-sm transform -rotate-2 relative">
                                                Good luck, and don't f*ck it up! Let the music play!
                                                {riggingIntensity !== 'OFF' && (
                                                    <span className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-[10px] px-2 py-1 rounded-lg font-black animate-pulse shadow-md border border-yellow-200">✨ STORYLINE POWER UP</span>
                                                )}
                                            </h3>
                                            <div className="flex justify-between items-center max-w-sm mx-auto mb-10 relative">
                                                {gameState === 'LIPSYNC' && (
                                                    <>
                                                        <div className="text-[5rem] animate-bounce">{bottomTwo[0]?.icon}</div>
                                                        <Music size={40} className="text-pink-400 absolute left-1/2 -translate-x-1/2 animate-spin-slow" />
                                                        <div className="text-[5rem] animate-bounce" style={{animationDelay: '0.2s'}}>{bottomTwo[1]?.icon}</div>
                                                    </>
                                                )}
                                                {gameState === 'PLACEMENTS_LEGACY' && (
                                                    <>
                                                        <div className="text-[5rem] animate-bounce relative">
                                                            {decisionMaker[0]?.icon}
                                                            {weekResults?.find(r => r.queen.id === decisionMaker[0]?.id)?.isProducerPick && (
                                                                <div className="absolute -top-4 -left-4 bg-yellow-400 text-yellow-900 text-[8px] font-black px-1.5 py-0.5 rounded rotate-[-15deg] shadow-sm animate-bounce">PICK! 🎬</div>
                                                            )}
                                                        </div>
                                                        <Music size={40} className="text-pink-400 absolute left-1/2 -translate-x-1/2 animate-spin-slow" />
                                                        <div className="text-[5rem] animate-bounce relative" style={{animationDelay: '0.2s'}}>
                                                            {decisionMaker[1]?.icon}
                                                            {weekResults?.find(r => r.queen.id === decisionMaker[1]?.id)?.isProducerPick && (
                                                                <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 text-[8px] font-black px-1.5 py-0.5 rounded rotate-[15deg] shadow-sm animate-bounce">PICK! 🎬</div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                                {gameState === 'PLACEMENTS_ASSASSIN' && (
                                                    <>
                                                        <div className="text-[5rem] animate-bounce relative">
                                                            {decisionMaker?.icon}
                                                            {weekResults?.find(r => r.queen.id === decisionMaker?.id)?.isProducerPick && (
                                                                <div className="absolute -top-4 -left-4 bg-yellow-400 text-yellow-900 text-[8px] font-black px-1.5 py-0.5 rounded rotate-[-15deg] shadow-sm animate-bounce">PICK! 🎬</div>
                                                            )}
                                                        </div>
                                                        <Music size={40} className="text-purple-600 absolute left-1/2 -translate-x-1/2 animate-spin-slow" />
                                                        <div className="text-[5rem] animate-bounce" style={{animationDelay: '0.2s', filter: 'hue-rotate(180deg) brightness(80%)'}}>{lipSyncAssassin?.icon}</div>
                                                    </>
                                                )}
                                            </div>
                                            {sashayedQueen && sashayedQueen.id !== 'DOUBLE_SASHAY' && (
                                                <div className="space-y-4 animate-in slide-in-from-bottom-8">
                                                    <div className="bg-green-50 text-green-700 p-4 rounded-2xl border border-green-200 shadow-sm">
                                                        <p className="font-bold text-lg">{weeklyWinner?.name}, shantay you stay.</p>
                                                    </div>
                                                    <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 shadow-sm">
                                                        <p className="font-bold text-lg">{sashayedQueen.name}, sashay away...</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {gameState === 'LIPSYNC_DOUBLE_SHANTAY' && (
                                        <div className="text-center p-8 animate-in zoom-in duration-500">
                                            <div className="text-6xl mb-6">✨✨</div>
                                            <h3 className="text-3xl font-black text-green-600 mb-4">DOUBLE SHANTAY!</h3>
                                            <p className="text-lg font-bold text-slate-700 mb-6">Both queens performed so brilliantly that neither can be sent home!</p>
                                            <div className="flex justify-center items-center gap-8 mb-6">
                                                <div className="text-center"><span className="text-[4rem]">{bottomTwo[0]?.icon}</span><p className="mt-2 font-bold text-green-700">{bottomTwo[0]?.name}</p></div>
                                                <span className="text-green-300 font-black text-2xl">&</span>
                                                <div className="text-center"><span className="text-[4rem]">{bottomTwo[1]?.icon}</span><p className="mt-2 font-bold text-green-700">{bottomTwo[1]?.name}</p></div>
                                            </div>
                                            <p className="text-green-500 font-black uppercase tracking-widest text-sm">Shantay, you BOTH stay!</p>
                                        </div>
                                    )}

                                    {gameState === 'LIPSYNC_DOUBLE_SASHAY' && (
                                        <div className="text-center p-8 animate-in zoom-in duration-500">
                                            <div className="text-6xl mb-6">💀💀</div>
                                            <h3 className="text-3xl font-black text-red-600 mb-4">DOUBLE SASHAY!</h3>
                                            <p className="text-lg font-bold text-slate-700 mb-6">Neither queen brought it to the stage. Both must leave immediately.</p>
                                            <div className="flex justify-center items-center gap-8 mb-6">
                                                <div className="text-center grayscale opacity-60"><span className="text-[4rem]">{bottomTwo[0]?.icon}</span><p className="mt-2 font-bold text-red-700">{bottomTwo[0]?.name}</p></div>
                                                <span className="text-red-300 font-black text-2xl">&</span>
                                                <div className="text-center grayscale opacity-60"><span className="text-[4rem]">{bottomTwo[1]?.icon}</span><p className="mt-2 font-bold text-red-700">{bottomTwo[1]?.name}</p></div>
                                            </div>
                                            <p className="text-red-500 font-black uppercase tracking-widest text-sm">Sashay away... BOTH of you.</p>
                                        </div>
                                    )}

                                    {gameState === 'FAREWELL' && sashayedQueen && (
                                        <div className="text-center p-8 animate-in zoom-in">
                                            <div className="text-[6rem] mb-6 grayscale opacity-80">{sashayedQueen.icon}</div>
                                            <h3 className="text-2xl font-black text-slate-800 mb-8">{sashayedQueen.name} has left the workroom.</h3>
                                            <div className="bg-pink-500 p-6 rounded-2xl text-white transform rotate-2 shadow-lg max-w-sm mx-auto border-2 border-pink-400">
                                                <p className="font-['Bangers'] tracking-widest text-xl mb-4 text-pink-200">Mirror Message:</p>
                                                <p className="text-3xl font-bold handwritten font-['Bangers'] italic">"Keep it pastel, dolls! xoxo"</p>
                                            </div>
                                        </div>
                                    )}

                                    {gameState === 'RETURN_WINNER' && weeklyWinner && (
                                        <div className="text-center p-8 animate-in zoom-in duration-500">
                                            <div className="text-[6rem] mb-6">{weeklyWinner.icon}</div>
                                            <h3 className="text-3xl font-black text-emerald-600 mb-4">SHE'S BACK!</h3>
                                            <p className="text-xl font-bold text-slate-800 mb-2">{weeklyWinner.name}</p>
                                            <p className="text-emerald-500 font-black uppercase tracking-widest text-sm mb-6">
                                                You have won the Return Challenge and are back in the competition!
                                            </p>
                                            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 max-w-sm mx-auto shadow-sm">
                                                <p className="text-emerald-700 font-medium italic">"The queen has returned to reclaim her throne!"</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Finales logic preserves the UI block but waits for actions */}
                                    {gameState.startsWith('FINALE') && (
                                        <div className="text-center p-8 animate-in fade-in">
                                            <div className="text-6xl mb-6 animate-pulse">👑</div>
                                            <h3 className="text-3xl font-black text-yellow-500 mb-4">THE GRAND FINALE!</h3>
                                            <p className="text-slate-500 font-medium">The time has come to crown our superstar.</p>
                                        </div>
                                    )}

                                    {gameState === 'TRACK_RECORD' && (
                                        <div className="space-y-8 animate-in fade-in duration-500">
                                            <div className="text-center">
                                                <h3 className="text-3xl font-black text-slate-800 mb-2">Current Standings</h3>
                                                <p className="text-pink-400 font-medium">Week {week} Track Record</p>
                                            </div>
                                            
                                            <div className="overflow-x-auto bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm custom-scrollbar pb-2 sm:pb-4">
                                                <table className="w-full text-[10px] sm:text-sm">
                                                    <thead>
                                                                <tr className="bg-pink-50 text-left border-b-2 border-pink-100">
                                                                    <th className="p-1.5 sm:p-3 font-black text-pink-600 rounded-tl-xl w-24 sm:w-48 text-[10px] sm:text-sm">Queen</th>
                                                                    {Array.from({ length: week }).map((_, i) => {
                                                                        const name = challengeHistory[i] || (i + 1).toString();
                                                                        const truncatedName = name.length > 10 ? name.substring(0, 10) + "..." : name;
                                                                        return (
                                                                            <th key={i} className="p-1 sm:p-3 font-bold text-slate-500 w-8 sm:w-20 uppercase text-center text-[6px] sm:text-[9px] tracking-tighter" title={name}>
                                                                                {truncatedName}
                                                                            </th>
                                                                        );
                                                                    })}
                                                                    <th className="p-1 sm:p-3 font-black text-slate-700 uppercase tracking-wider text-center text-[8px] sm:text-sm">PPE</th>
                                                                </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sortedQueens.map((q) => (
                                                            <tr key={q.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                                                                <td className="p-1 sm:p-3 text-left font-bold text-slate-800 border-r border-slate-50">
                                                                    <div className="flex items-center gap-1 sm:gap-3">
                                                                        <span className="text-sm sm:text-xl bg-white rounded-full w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center border border-slate-100 shadow-sm shrink-0">{q.icon}</span>
                                                                        <span className={`truncate max-w-[50px] sm:max-w-none text-[10px] sm:text-sm ${q.eliminated ? 'line-through text-slate-400 opacity-60' : ''}`}>{q.name}</span>
                                                                    </div>
                                                                </td>
                                                                {Array.from({ length: week }).map((_, i) => {
                                                                    const status = q.trackRecord[i];
                                                                    const colors = status ? getTrColors(status) : 'bg-slate-50 text-transparent';
                                                                    return (
                                                                        <td key={i} className={`p-0.5 sm:p-2 border-r border-slate-50 text-center text-[7px] sm:text-xs ${colors}`}>
                                                                            <span className="hidden sm:inline">{status || '-'}</span>
                                                                            <span className="sm:hidden">{status ? getShortLabel(status) : '-'}</span>
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td className="p-1 sm:p-3 font-bold text-slate-600 bg-slate-50/50 border-l border-slate-50 w-8 sm:w-16 text-center text-[8px] sm:text-xs">
                                                                    {calculatePPE(q.trackRecord)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            
                                            <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl border border-pink-50 max-w-md mx-auto">
                                                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
                                                    <Trophy size={16} className="text-yellow-400" /> Recent Placements
                                                </h3>
                                                <div className="space-y-3">
                                                    {sortedQueens.map((q) => (
                                                        <div key={q.id} className={`flex items-center justify-between p-2 rounded-2xl border transition-all ${q.eliminated ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-pink-50'}`}>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xl">{q.icon}</span>
                                                                <div>
                                                                    <p className={`text-sm font-bold ${q.eliminated ? 'line-through text-slate-400' : 'text-slate-700'}`}>{q.name}</p>
                                                                    <div className="flex gap-1 mt-1">
                                                                        {q.trackRecord.slice(-4).map((tr, i) => (
                                                                            <span key={i} className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${tr === 'WIN' ? 'bg-yellow-100 text-yellow-600' :
                                                                                    tr === 'HIGH' ? 'bg-green-100 text-green-600' :
                                                                                        tr === 'LOW' ? 'bg-pink-100 text-pink-500' :
                                                                                            tr === 'BTM2' ? 'bg-orange-100 text-orange-600' :
                                                                                                tr === 'ELIM' ? 'bg-red-100 text-red-600' :
                                                                                                    'bg-slate-100 text-slate-400'
                                                                                }`}>
                                                                                {tr}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xs font-black text-pink-400 bg-pink-50 px-2 py-1 rounded-full">{q.wins}👑</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Relationship Status */}
                                            {!isReturnEpisode && (
                                                <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl border border-purple-50 max-w-md mx-auto">
                                                    <h3 className="text-base sm:text-lg font-black text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
                                                        <Heart size={16} className="text-pink-400" /> Relationships
                                                    </h3>
                                                    <div className="space-y-4">
                                                        {remainingQueens.map(q => {
                                                            const allies = remainingQueens.filter(m => m.id !== q.id && relationships[getRelKey(q.id, m.id)] > 40);
                                                            const rivals = remainingQueens.filter(m => m.id !== q.id && relationships[getRelKey(q.id, m.id)] < -40);
                                                            
                                                            if (allies.length === 0 && rivals.length === 0) return null;

                                                            return (
                                                                <div key={q.id} className="border-b border-slate-50 last:border-none pb-3 last:pb-0">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="text-sm font-bold text-slate-700">{q.icon} {q.name}</span>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {allies.map(a => (
                                                                            <span key={a.id} className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded-full flex items-center gap-1">
                                                                                ❤️ {a.name}
                                                                            </span>
                                                                        ))}
                                                                        {rivals.map(r => (
                                                                            <span key={r.id} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1">
                                                                                💀 {r.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {remainingQueens.every(q => {
                                                            const rels = remainingQueens.filter(m => m.id !== q.id && Math.abs(relationships[getRelKey(q.id, m.id)] || 0) > 40);
                                                            return rels.length === 0;
                                                        }) && (
                                                            <p className="text-center text-slate-400 italic text-sm py-4">No major alliances or rivalries yet...</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    {gameState === 'WORKROOM' && (
                                        <button onClick={confirmDrama} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-100">
                                            {latestDrama?.disqualified ? "A Queen Leaves... Continue" : "Challenge Time!"} <ChevronRight size={20} />
                                        </button>
                                    )}
                                    {gameState === 'ANNOUNCE' && (
                                        <button onClick={runPerformances} className="w-full bg-pink-400 text-white py-4 rounded-2xl font-bold text-lg hover:bg-pink-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-100">
                                            <Play size={20} fill="currentColor" /> Watch Performances
                                        </button>
                                    )}
                                    {gameState === 'PERFORMANCES' && (
                                        <button onClick={runCritiques} className="w-full bg-sky-400 text-white py-4 rounded-2xl font-bold text-lg hover:bg-sky-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-100">
                                            To The Main Stage <ChevronRight size={20} />
                                        </button>
                                    )}
                                    {gameState === 'CRITIQUES' && (
                                        <button onClick={runPlacements} className="w-full bg-indigo-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                                            Hear The Placements
                                        </button>
                                    )}
                                    {gameState === 'PLACEMENTS_LEGACY' && (
                                        <button onClick={runLegacyLipsync} className="w-full bg-cyan-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-cyan-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-200">
                                            <Music size={20} /> Lip Sync For Your Legacy!
                                        </button>
                                    )}
                                    {gameState === 'PLACEMENTS_ASSASSIN' && (
                                        <button onClick={runAssassinLipsync} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                                            <Music size={20} /> Face The Lip Sync Assassin!
                                        </button>
                                    )}
                                    {gameState === 'LIPSYNC_DECISION_LEGACY' && (
                                        <div className="space-y-3">
                                            <p className="text-center font-bold text-slate-700">Winner, choose the lipstick to eliminate:</p>
                                            <div className="flex gap-2 justify-center">
                                                {bottomTwo.map(bq => (
                                                    <button key={bq.id} onClick={() => runLegacyDecision(bq.id)} className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-red-600 transition-all">
                                                        {bq.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {gameState === 'LIPSYNC_DECISION_ASSASSIN_WIN' && (
                                        <div className="space-y-3">
                                            <p className="text-center font-bold text-slate-700">Winner, you defeated the Assassin! Choose who goes home:</p>
                                            <div className="flex gap-2 justify-center">
                                                {bottomTwo.map(bq => (
                                                    <button key={bq.id} onClick={() => runLegacyDecision(bq.id)} className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-red-600 transition-all">
                                                        {bq.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {gameState === 'RETURN_WINNER' && (
                                        <button onClick={() => setGameState('TRACK_RECORD')} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                                            Back To The Workroom <ChevronRight size={20} />
                                        </button>
                                    )}
                                    {gameState === 'LIPSYNC_DOUBLE_SHANTAY' && (
                                        <button onClick={() => setGameState('TRACK_RECORD')} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                                            Both Queens Survive! View Track Records <ChevronRight size={20} />
                                        </button>
                                    )}
                                    {gameState === 'LIPSYNC_DOUBLE_SASHAY' && (
                                        <button onClick={() => setGameState('TRACK_RECORD')} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                                            Both Queens Go Home! View Track Records <ChevronRight size={20} />
                                        </button>
                                    )}
                                    {gameState === 'PLACEMENTS' && (
                                        <button onClick={runLipsync} className="w-full bg-purple-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-purple-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
                                            <Music size={20} /> Lip Sync For Your Life!
                                        </button>
                                    )}
                                    {gameState === 'LIPSYNC' && sashayedQueen && (
                                        <button onClick={runFarewell} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                                            Say Goodbye
                                        </button>
                                    )}
                                    {gameState === 'FAREWELL' && (
                                        <button onClick={() => setGameState('TRACK_RECORD')} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 mt-4">
                                            View Track Records <ChevronRight size={20} />
                                        </button>
                                    )}
                                    {gameState === 'TRACK_RECORD' && (
                                        <>
                                            <button onClick={() => { setWeek(week + 1); initWeek(); }} className="w-full bg-pink-400 text-white py-4 rounded-2xl font-black text-lg hover:bg-pink-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200">
                                                Start Next Episode <ChevronRight size={20} />
                                            </button>
                                            {!hasReturnChallengeHappened && queens.filter(q => q.eliminated && !q.trackRecord.includes('GUEST')).length >= 4 && remainingQueens.length >= 4 && (
                                                <button onClick={() => { setHasReturnChallengeHappened(true); startReturnChallenge(); }} className="w-full bg-emerald-400 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 mt-3">
                                                    <Sparkles size={20} /> Trigger Return Challenge 
                                                </button>
                                            )}
                                        </>
                                    )}
                                    
                                    {/* Finale Buttons */}
                                    {gameState === 'FINALE_TOP2_LIPSYNC' && (
                                        <button onClick={runFinaleTop2} className="w-full bg-yellow-400 text-yellow-900 py-4 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-100">
                                            <Crown size={20} /> Final Lip Sync For The Crown!
                                        </button>
                                    )}
                                    {gameState === 'FINALE_TOP3_CHALLENGE' && (
                                        <button onClick={runFinaleTop3} className="w-full bg-yellow-400 text-yellow-900 py-4 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-100">
                                            <Crown size={20} /> Perform Top 3 Grand Finale!
                                        </button>
                                    )}

                                    {gameState === 'FINALE_TOP4_CHALLENGE' && (
                                        <button onClick={runFinaleTop4} className="w-full bg-yellow-400 text-yellow-900 py-4 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-100">
                                            <Crown size={20} /> Perform Top 4 Grand Finale!
                                        </button>
                                    )}
                                    {gameState === 'FINALE_SUDDEN_DEATH' && (
                                        <button onClick={runFinaleSuddenDeath} className="w-full bg-yellow-400 text-yellow-900 py-4 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-100">
                                            <Crown size={20} /> Sudden Death Lip Sync For The Crown!
                                        </button>
                                    )}

                                    {/* LSFTC Buttons */}
                                    {gameState === 'FINALE_LSFTC_SETUP' && (
                                        <div className="space-y-3">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <h4 className="font-bold text-slate-700 mb-2 text-center text-sm uppercase">Tournament Bracket</h4>
                                                <div className="flex justify-between items-center text-sm font-bold text-pink-600">
                                                    <span className="truncate w-24 text-center">{lsftcPairs?.[0]?.[0]?.name}</span> <span className="text-slate-400 text-xs text-center w-8">VS</span> <span className="truncate w-24 text-center">{lsftcPairs?.[0]?.[1]?.name}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-bold text-purple-600 mt-2 pt-2 border-t border-slate-200">
                                                    <span className="truncate w-24 text-center">{lsftcPairs?.[1]?.[0]?.name}</span> <span className="text-slate-400 text-xs text-center w-8">VS</span> <span className="truncate w-24 text-center">{lsftcPairs?.[1]?.[1]?.name}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={randomizeLsftcPairs} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 transition-all text-sm">
                                                    Randomize Pairs
                                                </button>
                                                <button onClick={() => setGameState('FINALE_LSFTC_SEMI_1')} className="flex-1 bg-pink-400 text-white py-3 rounded-xl font-bold hover:bg-pink-500 transition-all text-sm">
                                                    Lock In & Start
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {gameState === 'FINALE_LSFTC_SEMI_1' && (
                                        <button onClick={() => runLsftcSemi(0)} className="w-full bg-pink-400 text-white py-4 rounded-2xl font-bold text-lg hover:bg-pink-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-100">
                                            <Music size={20} /> Semi-Final 1 Lip Sync!
                                        </button>
                                    )}
                                    {gameState === 'FINALE_LSFTC_SEMI_2' && (
                                        <button onClick={() => runLsftcSemi(1)} className="w-full bg-purple-400 text-white py-4 rounded-2xl font-bold text-lg hover:bg-purple-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100">
                                            <Music size={20} /> Semi-Final 2 Lip Sync!
                                        </button>
                                    )}
                                    {gameState === 'FINALE_LSFTC_FINAL' && (
                                        <button onClick={runLsftcFinal} className="w-full bg-yellow-400 text-yellow-900 py-4 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-100">
                                            <Crown size={20} /> Final Lip Sync For The Crown!
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {view === 'winner' && (
                    <div className="fixed inset-0 bg-white/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-1000">
                        <div className="max-w-md w-full">
                            <div className="relative inline-block mb-10">
                                <div className="w-48 h-48 bg-gradient-to-tr from-pink-300 to-purple-300 rounded-full flex items-center justify-center text-7xl animate-bounce shadow-2xl">
                                    {remainingQueens[0]?.icon}
                                </div>
                                <Crown className="absolute -top-6 -right-6 w-16 h-16 text-yellow-400 rotate-12 drop-shadow-lg" fill="currentColor" />
                            </div>
                            <h2 className="text-2xl font-bold text-pink-400 mb-2 uppercase tracking-tighter">Condragulations!</h2>
                            <h1 className="text-6xl font-black text-slate-800 mb-8 title-font">{remainingQueens[0]?.name}</h1>
                            <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                                You are the Next Pastel Superstar! Now prance, my queen, prance!
                                </p>
                                {missCongeniality && (
                                    <div className="mb-8 p-4 bg-purple-50 border border-purple-100 rounded-2xl shadow-sm max-w-xs mx-auto text-center">
                                        <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1">Miss Congeniality</p>
                                        <p className="font-bold text-purple-700 text-lg flex justify-center items-center gap-2"><Heart className="fill-purple-400 text-purple-400"/> {missCongeniality.name}</p>
                                    </div>
                                )}
                            <div className="flex flex-col gap-4 max-w-xs mx-auto">
                                <button
                                    onClick={saveToArchive}
                                    className="bg-yellow-400 text-yellow-900 border-2 border-yellow-300 px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex justify-center items-center gap-2"
                                >
                                    <Save size={20} /> Save as Official Season
                                </button>
                                <button
                                    onClick={reset}
                                    className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all flex justify-center items-center gap-2"
                                >
                                    <ArrowLeft size={20} /> Back to Main Menu
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fbcfe8; border-radius: 10px; }
        .title-font { font-family: 'Bangers', cursive; }
      `}</style>
        </div>
    );
};

export default App;