import { Link, useParams } from 'react-router-dom';
import { useSession } from '../state/SessionContext';
import { Panel } from '../components/UI';
export function EndView(): React.ReactElement {
    const { id = '' } = useParams();
    const { game } = useSession();
    const winner = game?.players.find((player) => player.playerId === game.winnerId);
    return (
        <main className="shell end">
            <p className="eyebrow">The Imperium has a new ruler</p>
            <h1>Game complete</h1>
            <Panel title="Victory">
                <div className="winner">
                    <span className="crown">♛</span>
                    <h2>{winner?.name ?? 'Unknown House'}</h2>
                    <p>{winner?.score ?? 0} Victory Points</p>
                </div>
            </Panel>
            <Link className="button primary" to="/">
                Return to menu
            </Link>
            <p className="muted">Game {id}</p>
        </main>
    );
}
