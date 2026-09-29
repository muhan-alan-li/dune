import type { CardRef, GameAction, GameState, LegalAction, PlayerState } from '@dune/shared';
import { Button, HelpPopover, Panel, StatusPill } from './UI';
function label(value: string): string {
    return value
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function cardName(card: CardRef): string {
    return card.details?.name ?? label(card.cardKey);
}
function Effects({
    items,
    empty = 'No effect',
}: {
    items?: string[] | undefined;
    empty?: string;
}): React.ReactElement {
    return (
        <span className="effect-list">
            {items?.length ? (
                items.map((item, index) => <span key={index}>{item}</span>)
            ) : (
                <span className="muted">{empty}</span>
            )}
        </span>
    );
}
function CardEffects({ card }: { card: CardRef }): React.ReactElement {
    return (
        <span className="card-effects">
            <span className="effect-section agent-effect">
                <span className="effect-heading">Agent · Play</span>
                <span className="agent-icons">
                    {card.details ? (
                        card.details.agentIcons.length ? (
                            card.details.agentIcons.map((icon) => (
                                <span key={icon}>{label(icon)}</span>
                            ))
                        ) : (
                            <span>No Agent icons</span>
                        )
                    ) : (
                        <span>Card details unavailable</span>
                    )}
                </span>
                <Effects
                    items={card.details?.agentEffects}
                    empty={card.details ? 'No extra card effect' : 'Effects not available'}
                />
            </span>
            <span className="effect-section reveal-effect">
                <span className="effect-heading">Reveal</span>
                <Effects
                    items={card.details?.revealEffects}
                    empty={card.details ? 'No Reveal effect' : 'Effects not available'}
                />
            </span>
            {card.details?.conditionText && (
                <span className="card-condition">{card.details.conditionText}</span>
            )}
        </span>
    );
}
export function ResourceBar({ player }: { player: PlayerState }): React.ReactElement {
    const strength =
        player.troopsInConflict > 0 && player.combatStrength === 0
            ? 'Pending'
            : player.combatStrength;
    return (
        <section className="resource-bar" aria-label="Your resources and units">
            <div className="resource-group">
                <span className="group-heading">Resources</span>
                <div className="resource-grid">
                    {(['solari', 'spice', 'water', 'persuasion'] as const).map((key) => (
                        <div className={`resource-stat ${key}`} key={key}>
                            <strong>{player.resources[key]}</strong>
                            <span>{label(key)}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="resource-group">
                <span className="group-heading">Your troops</span>
                <div className="resource-grid troops-grid">
                    <div className="resource-stat">
                        <strong>{player.troopsInSupply}</strong>
                        <span>In supply</span>
                    </div>
                    <div className="resource-stat">
                        <strong>{player.troopsInGarrison}</strong>
                        <span>In garrison</span>
                    </div>
                    <div className="resource-stat conflict-stat">
                        <strong>{player.troopsInConflict}</strong>
                        <span>Committed to Conflict</span>
                    </div>
                    <div className="resource-stat">
                        <strong>{strength}</strong>
                        <span>Combat strength</span>
                    </div>
                </div>
            </div>
            <div className="resource-group agent-group">
                <span className="group-heading">Agents</span>
                <div className="resource-stat">
                    <strong>
                        {player.agentsRemaining}
                        <small> available</small>
                    </strong>
                    <span>{player.agentsOnBoard} on the board</span>
                </div>
            </div>
        </section>
    );
}
export function BoardMap({
    state,
    selectedCard,
    legalSpaces,
    onSpace,
}: {
    state: GameState;
    selectedCard: CardRef | null;
    legalSpaces: string[];
    onSpace: (id: string) => void;
}): React.ReactElement {
    const playerName = (id: string): string =>
        state.players.find((player) => player.playerId === id)?.name ?? 'Unknown player';
    return (
        <Panel title="The board">
            <p className="section-note">
                Pay the cost. Receive the rewards. Combat spaces also let you deploy troops.
            </p>
            <div className="board-map">
                {state.board.map((space) => {
                    const available = legalSpaces.includes(space.id);
                    const cost =
                        space.costText ??
                        (space.cost
                            ? Object.entries(space.cost)
                                  .filter(([, value]) => value)
                                  .map(([key, value]) => `${value} ${key}`)
                                  .join(', ')
                            : '');
                    return (
                        <button
                            key={space.id}
                            className={`space ${available ? 'legal' : ''} ${space.occupantPlayerId ? 'occupied' : ''}`}
                            disabled={!available}
                            onClick={() => onSpace(space.id)}
                        >
                            <span className="space-header">
                                <strong>{space.name}</strong>
                                <span className="space-icon">
                                    {space.icon ? label(space.icon) : 'Open space'}
                                </span>
                            </span>
                            <span className="space-cost">
                                <span className="detail-label">Cost</span>
                                {cost || 'Free'}
                            </span>
                            <span className="space-rewards">
                                <span className="detail-label">Receive</span>
                                <Effects items={space.rewards} empty="Rewards not available" />
                                {space.bonusSpice > 0 && (
                                    <span className="bonus-spice">
                                        Includes {space.bonusSpice} accumulated spice
                                    </span>
                                )}
                            </span>
                            {space.combatSpace && (
                                <span className="combat-tag">⚔ May deploy troops</span>
                            )}
                            {space.requirementText && (
                                <span className="space-requirement">
                                    Requires: {space.requirementText}
                                </span>
                            )}
                            {(space.occupantPlayerId || space.controllerPlayerId) && (
                                <span className="space-owners">
                                    {space.occupantPlayerId && (
                                        <span>Agent: {playerName(space.occupantPlayerId)}</span>
                                    )}
                                    {space.controllerPlayerId && (
                                        <span>Control: {playerName(space.controllerPlayerId)}</span>
                                    )}
                                </span>
                            )}
                            {available && <span className="space-action">Send Agent →</span>}
                        </button>
                    );
                })}
            </div>
            {selectedCard && (
                <p className="hint">Select a highlighted space for {cardName(selectedCard)}.</p>
            )}
        </Panel>
    );
}
export function ConflictPanel({ state }: { state: GameState }): React.ReactElement {
    const details = state.conflict.details;
    return (
        <Panel title="Current Conflict">
            <div className="conflict-card">
                {state.conflict.card ? (
                    <>
                        <span className="eyebrow">Conflict {details?.tier ?? ''}</span>
                        <h3>{details?.name ?? cardName(state.conflict.card)}</h3>
                        <div className="conflict-rewards">
                            {[
                                { place: '1st', rewards: details?.first },
                                { place: '2nd', rewards: details?.second },
                                ...(state.players.length === 4
                                    ? [{ place: '3rd', rewards: details?.third }]
                                    : []),
                            ].map(({ place, rewards }) => (
                                <div className="rank-reward" key={place}>
                                    <strong>{place}</strong>
                                    <Effects
                                        items={rewards}
                                        empty={details ? 'No reward' : 'Rewards not available'}
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="section-note">
                            You need Combat strength to receive a reward. Ties change which reward
                            each player receives.
                        </p>
                    </>
                ) : (
                    <p>Conflict not revealed</p>
                )}
                <div className="strengths">
                    <span className="group-heading">Forces in Conflict</span>
                    {state.players.map((player) => {
                        const combatStrength = state.combat?.strengths.find(
                            (entry) => entry.playerId === player.playerId,
                        )?.strength;
                        const strength =
                            combatStrength ??
                            (player.troopsInConflict > 0 && player.combatStrength === 0
                                ? null
                                : player.combatStrength);
                        return (
                            <div className="conflict-force" key={player.playerId}>
                                <span>
                                    {player.name}
                                    <small>{player.troopsInConflict} committed troops</small>
                                </span>
                                <strong>
                                    {strength ?? 'Pending'}
                                    <small>{strength === null ? 'until Reveal' : 'strength'}</small>
                                </strong>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Panel>
    );
}
export function ImperiumRow({
    state,
    actions,
    onAcquire,
}: {
    state: GameState;
    actions: LegalAction[];
    onAcquire: (key: string) => void;
}): React.ReactElement {
    const legal = actions.filter(
        (action): action is Extract<LegalAction, { kind: 'acquireCard' }> =>
            action.kind === 'acquireCard',
    );
    return (
        <Panel title="Imperium Row">
            <div className="card-row">
                {state.imperiumRow.map((card) => {
                    const option = legal.find((action) => action.card.cardKey === card.cardKey);
                    return (
                        <button
                            className={`market-card ${option ? 'legal' : ''}`}
                            disabled={!option}
                            onClick={() => onAcquire(card.cardKey)}
                            key={card.cardId}
                        >
                            <span className="card-title">{cardName(card)}</span>
                            <span className="card-price">
                                {card.details?.cost ?? option?.cost ?? '?'} persuasion
                            </span>
                            <CardEffects card={card} />
                            <span className="card-action">
                                {option ? 'Acquire card →' : 'Cannot acquire now'}
                            </span>
                        </button>
                    );
                })}
            </div>
        </Panel>
    );
}
export function PlayerHand({
    cards,
    actions,
    onPlay,
}: {
    cards: CardRef[];
    actions: LegalAction[];
    onPlay: (card: CardRef) => void;
}): React.ReactElement {
    const legal = new Set(
        actions
            .filter(
                (action): action is Extract<LegalAction, { kind: 'playCard' }> =>
                    action.kind === 'playCard',
            )
            .map((action) => action.card.cardId),
    );
    return (
        <Panel title="Your hand">
            <p className="section-note">
                Play a card to send an Agent and use its Agent effect. Reveal the cards left in your
                hand to use their Reveal effects.
            </p>
            <div className="card-row hand">
                {cards.map((card) => (
                    <button
                        className={`hand-card ${legal.has(card.cardId) ? 'legal' : ''}`}
                        disabled={!legal.has(card.cardId)}
                        onClick={() => onPlay(card)}
                        key={card.cardId}
                    >
                        <span className="card-title">{cardName(card)}</span>
                        <CardEffects card={card} />
                        <span className="card-action">
                            {legal.has(card.cardId) ? 'Play Agent →' : 'Cannot play Agent now'}
                        </span>
                    </button>
                ))}
            </div>
            {cards.length === 0 && <p className="muted">No cards in hand.</p>}
        </Panel>
    );
}
export function IntrigueHand({
    player,
    actions,
    onPlay,
}: {
    player: PlayerState;
    actions: LegalAction[];
    onPlay: (id: string) => void;
}): React.ReactElement {
    const legal = new Set(
        actions
            .filter(
                (action): action is Extract<LegalAction, { kind: 'playIntrigue' }> =>
                    action.kind === 'playIntrigue',
            )
            .map((action) => action.intrigue.cardId),
    );
    if (!player.intrigueCards)
        return (
            <Panel title="Intrigue">
                <p className="muted">Hidden ({player.intrigueCount})</p>
            </Panel>
        );
    return (
        <Panel title="Intrigue">
            <div className="card-row">
                {player.intrigueCards.map((card) => (
                    <button
                        className="hand-card"
                        disabled={!legal.has(card.cardId)}
                        onClick={() => onPlay(card.cardId)}
                        key={card.cardId}
                    >
                        {cardName(card)}
                    </button>
                ))}
            </div>
        </Panel>
    );
}
export function OpponentPanel({
    players,
    me,
}: {
    players: PlayerState[];
    me: string;
}): React.ReactElement {
    return (
        <Panel title="Houses">
            <div className="opponents">
                {players.map((player) => (
                    <div
                        className={player.playerId === me ? 'opponent self' : 'opponent'}
                        key={player.playerId}
                    >
                        <span className={`avatar ${player.color}`}>{player.name.slice(0, 1)}</span>
                        <span>
                            <strong>{player.name}</strong>
                            <small>
                                {player.score} VP · {player.handCount} cards ·{' '}
                                {player.intrigueCount} intrigue
                            </small>
                        </span>
                    </div>
                ))}
            </div>
        </Panel>
    );
}
export function GameLog({ state }: { state: GameState }): React.ReactElement {
    return (
        <Panel title="Game log">
            <div className="game-log">
                {state.log
                    .slice(-10)
                    .reverse()
                    .map((entry) => (
                        <p key={entry.id}>{entry.text}</p>
                    ))}
            </div>
        </Panel>
    );
}
export function ActionPanel({
    state,
    me,
    selectedCard,
    onAction,
}: {
    state: GameState;
    me: PlayerState;
    selectedCard: CardRef | null;
    onAction: (action: GameAction) => void;
}): React.ReactElement {
    const actions = state.legalActions;
    const can = (kind: LegalAction['kind']) => actions.some((action) => action.kind === kind);
    const deploy = actions.filter(
        (action): action is Extract<LegalAction, { kind: 'deployTroops' }> =>
            action.kind === 'deployTroops',
    );
    return (
        <div className="action-panel">
            <div>
                <StatusPill
                    good={
                        state.currentPlayerId === me.playerId ||
                        state.combat?.activePlayerId === me.playerId
                    }
                >
                    {state.phase} · Round {state.roundNumber}
                </StatusPill>
                <HelpPopover label="Phase help">
                    Play a card to send an Agent, or reveal your remaining cards.
                </HelpPopover>
            </div>
            {selectedCard && (
                <p>
                    Card selected: <strong>{cardName(selectedCard)}</strong>
                </p>
            )}
            {deploy.length > 0 && (
                <label>
                    Deploy troops
                    <select
                        onChange={(event) =>
                            onAction({ kind: 'deployTroops', count: Number(event.target.value) })
                        }
                        defaultValue=""
                    >
                        <option value="" disabled>
                            Choose count
                        </option>
                        {deploy.map((action) => (
                            <option key={action.count} value={action.count}>
                                {action.count}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            {can('confirmCombat') && (
                <Button onClick={() => onAction({ kind: 'confirmCombat' })}>Confirm Reveal</Button>
            )}
            {can('pass') && (
                <Button variant="quiet" onClick={() => onAction({ kind: 'pass' })}>
                    {state.phase === 'combat' ? 'Pass Combat' : 'Reveal hand'}
                </Button>
            )}
            {can('advancePhase') && (
                <Button onClick={() => onAction({ kind: 'advancePhase' })}>Advance phase</Button>
            )}
        </div>
    );
}
