import type { CardRef, FactionId } from '@dune/shared';
import { getCard, type CardOnPlay, type CardOnReveal } from './data/cards.js';
import { getBoardSpace, type BoardSpaceDef } from './data/board.js';
import { SELL_MELANGE_CHART } from './data/constants.js';
import type { ConflictReward } from './data/conflicts.js';

const factions: Record<FactionId, string> = {
    emperor: 'Emperor',
    spacingGuild: 'Spacing Guild',
    beneGesserit: 'Bene Gesserit',
    fremen: 'Fremen',
};
const labels: Record<string, string> = {
    solari: 'Solari',
    spice: 'spice',
    water: 'water',
    persuasion: 'Persuasion',
    swords: 'Swords',
    vp: 'Victory Points',
    troops: 'troops to garrison',
    draw: 'cards',
    drawIntrigue: 'Intrigue cards',
};
function effects(value: CardOnPlay | CardOnReveal | null): string[] {
    if (!value) return [];
    const result = Object.entries(value).flatMap(([key, amount]) =>
        labels[key] && typeof amount === 'number' && amount > 0
            ? [`+${amount} ${labels[key]}`]
            : [],
    );
    if ('trash' in value && value.trash) result.push('Trash 1 card');
    if ('trashSelf' in value && value.trashSelf) result.push('Trash this card');
    if ('influenceAny' in value && value.influenceAny)
        result.push(`+${value.influenceAny} Influence with one Faction of your choice`);
    if ('influence' in value && value.influence)
        result.push(
            `+1 Influence: ${[value.influence]
                .flat()
                .map((f) => factions[f])
                .join(' or ')}`,
        );
    if (value.bumps) result.push(...value.bumps.map((f) => `+1 ${factions[f]} Influence`));
    if ('loseInfluence' in value && value.loseInfluence)
        result.unshift(`Pay ${value.loseInfluence} Influence`);
    if ('deployFromGarrison' in value && value.deployFromGarrison)
        result.push(`Deploy up to ${value.deployFromGarrison} troops from garrison`);
    if ('optionalCost' in value && value.optionalCost)
        return [
            `You may pay ${Object.entries(value.optionalCost)
                .map(([k, v]) => `${v} ${labels[k]}`)
                .join(' + ')} to receive: ${result.join('; ')}`,
        ];
    return result;
}

/** Keep card conditions next to the effects they change. */
export function cardRef(card: { id: string; key: string }): CardRef {
    const def = getCard(card.key);
    const ref: CardRef = { cardId: card.id, cardKey: card.key };
    if (!def) return ref;
    let agentEffects = effects(def.onPlay);
    let revealEffects = effects(def.onReveal);
    const note = def.note
        ?.replace(/TODO:.*?(?:\.|$)/g, '')
        .replace(/Copy override:.*?(?:\.|$)/g, '')
        .replace(/\s*\(FAQ[^)]*\)/g, '')
        .replace(/The rulebook gives this example\./g, '')
        .trim();
    const key = def.key.replace('dune-imperium-', '');
    switch (key) {
        case 'power-play':
            agentEffects = ['Gain 1 extra Influence on the Faction space; trash this card'];
            break;
        case 'missionaria-protectiva':
            agentEffects = ['With another Bene Gesserit card in play: +1 Bene Gesserit Influence'];
            break;
        case 'imperial-spy':
            agentEffects = ['Trash this card to draw 1 Intrigue card'];
            break;
        case 'spice-smugglers':
            agentEffects = ['Pay 2 spice: +3 Solari and +1 Spacing Guild Influence'];
            break;
        case 'gene-manipulation':
            agentEffects = ['Trash 1 card', 'With another Bene Gesserit card in play: +2 spice'];
            break;
        case 'shifting-allegiances':
            agentEffects = ['Pay 1 Influence and 2 spice: +2 Influence with another Faction'];
            break;
        case 'firm-grip':
            agentEffects = ['Pay 2 Solari: +1 Influence with a Faction of your choice'];
            revealEffects = ['With an Emperor Alliance: +4 Persuasion'];
            break;
        case 'guild-ambassador':
            agentEffects = ['+1 Spacing Guild Influence or +2 spice'];
            revealEffects = ['Pay 3 spice: +1 Victory Point'];
            break;
        case 'smuggler-s-thopter':
            agentEffects = ['With 2 Spacing Guild Influence: draw 2 cards'];
            break;
        case 'gurney-halleck':
            agentEffects = ['Draw 1 card', 'Pay 3 Solari: +2 troops to garrison or Conflict'];
            break;
        case 'the-voice':
            agentEffects = ['Block one space for opponents until your next turn'];
            break;
        case 'test-of-humanity':
            agentEffects = ['Each opponent discards 1 card or loses 1 troop from the Conflict'];
            break;
        case 'gun-thopter':
            agentEffects = ['Each opponent loses 1 troop from garrison, if available'];
            break;
        case 'other-memory':
            agentEffects = ['Draw 1 card or take 1 Bene Gesserit card from your discard pile'];
            break;
        case 'carryall':
            agentEffects = ['Double the base spice harvest; do not double bonus spice'];
            break;
        case 'reverend-mother-mohiam':
            agentEffects = ['Each opponent discards 2 cards'];
            break;
        case 'kwisatz-haderach':
            agentEffects.push('Send an Agent from its current space to another space');
            break;
        case 'scout':
            revealEffects.push('Retreat up to 2 troops from the Conflict');
            break;
        case 'guild-bankers':
            revealEffects = ['The Spice Must Flow costs 3 less this turn'];
            break;
        case 'seek-allies':
            agentEffects = ['Trash this card'];
            break;
        case 'signet-ring':
            agentEffects = ['Use your Leader Signet ability'];
            break;
        case 'spice-hunter':
            revealEffects = [
                '+1 Persuasion',
                '+1 Sword',
                'With another Fremen card in play: +1 spice',
            ];
            break;
        case 'crysknife':
            revealEffects = ['+1 Sword', 'With another Fremen card in play: +1 Fremen Influence'];
            break;
        case 'fedaykin-death-commando':
            revealEffects = ['+1 Persuasion', 'Swords: up to 3 with another Fremen card in play'];
            break;
        case 'sietch-reverend-mother':
            revealEffects = ['With a Fremen card in play: +3 Persuasion and +1 spice'];
            break;
        case 'opulence':
            revealEffects = ['+1 Persuasion', 'Pay 6 Solari: +1 Victory Point'];
            break;
        case 'worm-riders':
            revealEffects = [
                'With 2 Fremen Influence: +6 Swords',
                'With a Fremen Alliance: +2 more Swords',
            ];
            break;
        case 'assassination-mission':
            revealEffects = ['+1 Sword'];
            break;
        case 'liet-kynes':
            revealEffects = ['+2 Persuasion for each Fremen card in play'];
            break;
    }
    const excludedNotes = ['dagger', 'signet-ring', 'reconnaissance'];
    ref.details = {
        name: def.name,
        cost: def.cost,
        agentIcons:
            def.icons === 'all'
                ? ['All spaces']
                : def.icons.map(
                      (icon) =>
                          factions[icon as FactionId] ??
                          { landsraad: 'Landsraad', city: 'City', spiceTrade: 'Spice Trade' }[
                              icon as string
                          ] ??
                          icon,
                  ),
        agentEffects,
        revealEffects,
        ...((note && !excludedNotes.includes(key)) || def.acquireNote
            ? {
                  conditionText: [
                      !excludedNotes.includes(key) ? note : '',
                      def.acquireNote?.replace(/\s*\(FAQ[^)]*\)/g, ''),
                  ]
                      .filter(Boolean)
                      .join(' '),
              }
            : {}),
    };
    return ref;
}

export function spaceRewards(space: BoardSpaceDef, bonusSpice: number): string[] {
    const e = space.effect;
    const rewards: string[] = space.faction ? [`+1 ${factions[space.faction]} Influence`] : [];
    if ('troops' in e) rewards.push(`+${e.troops} troops to garrison`);
    if ('draw' in e) rewards.push(`Draw ${e.draw} cards`);
    if ('water' in e) rewards.push(`+${e.water} water`);
    if ('solari' in e) rewards.push(`+${e.solari} Solari`);
    switch (e.kind) {
        case 'maker':
            rewards.push(
                `+${e.spice + bonusSpice} spice${bonusSpice ? ` (includes ${bonusSpice} bonus)` : ''}`,
            );
            break;
        case 'troopsAndIntrigue':
            rewards.push('Draw 1 Intrigue card');
            break;
        case 'conspire':
            rewards.push('+5 Solari', '+2 troops to garrison', 'Draw 1 Intrigue card');
            break;
        case 'foldspace':
            rewards.push('Acquire 1 Foldspace card');
            break;
        case 'secrets':
            rewards.push(
                'Draw 1 Intrigue card',
                'Take 1 random Intrigue from each opponent with 4 or more',
            );
            break;
        case 'highCouncil':
            rewards.push('+2 Persuasion on each Reveal turn');
            break;
        case 'mentat':
            rewards.push('Draw 1 card', 'Take the Mentat: 1 extra Agent this round');
            break;
        case 'swordmaster':
            rewards.push('Gain your third Agent for the rest of the game');
            break;
        case 'sellMelange':
            rewards.push(
                ...Object.entries(SELL_MELANGE_CHART).map(
                    ([spice, solari]) => `${spice} spice → ${solari} Solari`,
                ),
            );
            break;
        case 'selectiveBreeding':
            rewards.push('You may trash 1 card to draw 2 cards');
            break;
        case 'hallOfOratory':
            rewards.push('+1 troop to garrison');
            break;
    }
    if (space.revealBonus?.persuasion)
        rewards.push(`+${space.revealBonus.persuasion} Persuasion on your Reveal turn`);
    return rewards;
}

export function rewardText(reward: ConflictReward): string {
    switch (reward.kind) {
        case 'influence':
            return `+${reward.amount} ${factions[reward.faction]} Influence`;
        case 'influenceAny':
            return `+${reward.amount} Influence with one Faction of your choice`;
        case 'trashCard':
            return 'Trash 1 card';
        case 'mentat':
            return 'Take the Mentat next round';
        case 'control':
            return `Control ${getBoardSpace(reward.spaceId)?.name ?? reward.spaceId}`;
        case 'chooseOne':
            return `Choose 1: ${reward.options.map(rewardText).join(' / ')}`;
        case 'chooseTwo':
            return `Choose 2 different rewards: ${reward.options.map(rewardText).join(' / ')}`;
        default:
            return `+${reward.amount} ${reward.kind === 'intrigue' ? 'Intrigue cards' : labels[reward.kind]}`;
    }
}
