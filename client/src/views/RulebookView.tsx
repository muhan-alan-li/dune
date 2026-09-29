import { Link } from 'react-router-dom';
import { Panel } from '../components/UI';
const sections = [
    {
        title: 'The objective',
        text: 'Lead your House to ten Victory Points or the highest score when the Conflict deck ends. Influence, Alliances, cards, and resources all shape your path to power.',
    },
    {
        title: 'A round',
        text: 'Each round begins with a Conflict. Players take Agent turns by playing a card and sending an Agent to an available board space. After every player reveals, Combat resolves. Makers replenish the desert, then Recall prepares the next round.',
    },
    {
        title: 'Agent turns',
        text: 'Play a card from your hand, choose one legal space shown by the server, and pay its cost. A card may also be revealed instead of sending an Agent. Reveal effects grant Persuasion, resources, and Combat strength.',
    },
    {
        title: 'Combat',
        text: 'Troops in the Conflict and swords determine Combat strength. Players may play eligible Combat Intrigue cards, then rewards go to the strongest Houses. Ties follow the printed reward order.',
    },
    {
        title: 'The Imperium',
        text: 'Acquire cards from the Imperium Row during a Reveal turn by spending Persuasion. Purchased cards improve your deck and may provide new Agent icons and Reveal effects.',
    },
];
export function RulebookView(): React.ReactElement {
    return (
        <main className="shell rules">
            <header className="topbar">
                <div>
                    <p className="eyebrow">Reference</p>
                    <h1>Rulebook</h1>
                </div>
                <Link className="button quiet" to="/">
                    Back to menu
                </Link>
            </header>
            {sections.map((section) => (
                <Panel title={section.title} key={section.title}>
                    <p>{section.text}</p>
                </Panel>
            ))}
        </main>
    );
}
