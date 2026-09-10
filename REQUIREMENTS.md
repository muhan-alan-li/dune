# Requirements

This document describes only user interaction with the game.
It does not describe game rules or system design.
For game rules, see `RULEBOOK.md`.
All sentences use Simplified Technical English.

## 1. Menu

1. User can create a new lobby.
2. User can join a lobby with a unique code.
3. User can set a display name before they join.
4. User can view the rulebook from the menu.
5. User can return to the menu from a lobby.

## 2. Lobby

1. Creator of the lobby is the host.
2. User can view all players in the lobby.
3. User can view the lobby code.
4. User can leave the lobby.
5. Host can remove a player from the lobby.
6. Host can set the color of each player.
7. Host can set the leader of each player.
8. User can view their own color and leader.
9. User can show that they are ready to play.
10. Host can start the game only when the lobby has 3 or 4 players.
11. Host can start the game only when all players are ready.

## 3. Game — View of the Board

1. User can view the current board at all times.
2. User can view all board spaces and their occupants.
3. User can view which board spaces are available for their Agent.
4. User can view the current Conflict card and its rewards.
5. User can view the Imperium Row and Reserve stacks.
6. User can view the Score track and all Victory Points.
7. User can view all Influence tracks and Alliance tokens.
8. User can view the Combat track and all Combat markers.
9. User can view Control markers on Arrakeen, Carthag, and Imperial Basin.
10. User can view bonus spice on Maker spaces.
11. User can view the First Player marker.
12. User can view whose turn it is.
13. User can view the round number and the current phase.

## 4. Game — View of Own State

1. User can view their hand.
2. User can view their deck count and discard pile.
3. User can view their Agents and their positions.
4. User can view their resources: Solari, spice, water, and Persuasion.
5. User can view their troops in supply, in garrison, and in Conflict.
6. User can view their Influence and Alliances.
7. User can view their Intrigue cards.
8. User can view their acquired cards.
9. User can view their Leader abilities.
10. User can view their available actions for the current turn.

## 5. Game — View of Other Players

1. User can view public state of each opponent.
2. Public state includes Victory Points, resources in supply, Influence, troops, Agents on the board, and Combat strength.
3. User can view the number of Intrigue cards of each opponent, but not their content.
4. User can view the number of cards in the hand, deck, and discard pile of each opponent.

## 6. Game — Agent Turn

1. User can select a card from their hand to play.
2. User can view only legal board spaces for the selected card.
3. User can send an Agent to a legal and empty board space.
4. User can pay the cost of a board space when required.
5. User can use the Agent box of the played card.
6. User can select the order of effects when more than one effect applies.
7. User can decide to pay or not to pay an optional cost on a card.
8. User can recruit troops when the effect gives troops.
9. User can deploy troops to the Conflict when on a Combat space.
10. User can select how many troops to deploy, within the allowed limit.
11. User can use their Signet Ring card to activate the Leader Signet ability.
12. User can use their Leader ability when the rules permit it.
13. User can play a Plot Intrigue card during their own Agent turn.
14. User can pass and take a Reveal turn instead, even with Agents left.

## 7. Game — Reveal Turn

1. User can reveal all remaining cards in their hand.
2. User can view all Reveal effects before they resolve them.
3. User can select the order of Reveal effects.
4. User can view total Persuasion gained.
5. User can select a card from the Imperium Row to acquire.
6. User can select Arrakis Liaison or The Spice Must Flow from the Reserve to acquire.
7. User can view the cost of each card before they acquire it.
8. User can acquire more than one card if Persuasion is sufficient.
9. User can view their Combat strength before they confirm it.
10. User can confirm the end of their Reveal turn.

## 8. Game — Combat Phase

1. User can view the strength of all players in Combat.
2. User with troops in the Conflict can play a Combat Intrigue card.
3. User with troops in the Conflict can pass instead of playing a card.
4. User can play more than one Combat Intrigue card in one phase.
5. User can play again after a pass, when the turn returns to them.
6. User can play a “when you win” Intrigue card only after they win.
7. User can view Conflict results and rewards given.

## 9. Game — Makers, Recall, and Endgame

1. User can view bonus spice added to Maker spaces.
2. User can view recalled Agents and the Mentat.
3. User can view the new First Player at the start of a round.
4. User can play an Endgame Intrigue card at the end of the game.
5. User can view the winner, final Victory Points, and tiebreakers.
6. User can view the final board after the game ends.
7. User can return to the menu or lobby after the game ends.

## 10. Game — General Interaction Rules

1. User can interact only on their own turn.
2. User can view what actions are available at all times.
3. User cannot select an illegal card, space, or action.
4. User cannot undo a confirmed action.
5. System shows an error message for an illegal selection.
6. User can view a log of past actions and round events.
7. User can view help text for each board space, card, and icon.
