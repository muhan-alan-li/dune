# Base game model check

Source: [Dire Wolf Dune: Imperium rules](https://www.direwolfdigital.com/assets/dune/DUNE_IMPERIUM_Rules_2020_10_26.pdf), the [Board Space Guide](https://d19y2ttatozxjp.cloudfront.net/pdfs/DUNE_IMPERIUM_Player_Aid_Icons_and_Board_Spaces.pdf), and the local [rulebook text](RULEBOOK.md).

| Data | Rulebook check | Result |
| --- | --- | --- |
| Imperium cards | 67 cards | The model has 67 cards. The rulebook does not give a list of all card names, copies, icons, costs, or effects. The four copy overrides still need a check against the cards. |
| Starting cards | 10 cards per player, with the seven card names and counts in section 3 | The model agrees. |
| Reserve cards | 8 Arrakis Liaison, 10 The Spice Must Flow, 6 Foldspace | The model agrees. |
| Board spaces | 22 spaces, with the data in the Board Space Guide | All 22 model records agree with the guide. |
| Intrigue cards | 40 cards; Plot, Combat, and Endgame play times | The model has 40 cards. The rulebook does not give all card names, copies, play times, or effects. |
| Conflict cards | 18 cards: 4 level I, 10 level II, 4 level III | The model agrees. The rulebook does not give the reward text on each card. |

The rulebook shows that Duncan Idaho must pay 1 water to get its Agent effect. It also shows that Fremen Camp can pay 2 spice for its Agent effect. The model now records both optional costs. The game does not yet offer these payment choices, so it does not permit these two cards on an Agent turn. The rulebook also gives the name *To the Victor…* and the duration of The Voice. These model notes now agree with it.

The rulebook says that Signet Ring is used on an Agent turn. A [Dire Wolf card image](https://d19y2ttatozxjp.cloudfront.net/wp-content/uploads/2020/09/23000705/SignetRing.jpg) shows its Landsraad, City, and Spice Trade icons. The model now has those icons. The game does not yet apply Leader Signet abilities, so it does not permit Signet Ring on an Agent turn.

The rulebook gives general rules for Fremen Bond, Alliances, and card costs. Some model fields store the reward as a number and put its condition only in a note. Do not use those numbers as effects without the condition. The rulebook cannot confirm the exact text of most card faces. Check the printed cards before you approve those fields as correct. In particular, the model's copy overrides for Imperium cards and the rewards on Conflict cards have no check from the rulebook.

The [card image archive](https://www.duneimperiumassets.com/assets/intrigue) suggests three more errors. Corner the Market appears to be an Endgame card, but the model says Plot. Tiebreaker appears to have a second use at the end of the game; the model says that it gives 10 spice. Master Tactician appears to have a troop retreat choice that the model does not record. The rulebook does not show these card faces. Check the printed cards before you change these fields.

The game code does not yet permit six board spaces with choice effects: Sell Melange, Selective Breeding, Secrets, High Council, Mentat, and Swordmaster. Their board data agrees with the guide.

The test in `server/src/game/engine/data/rulebook.test.ts` checks the rulebook counts and board-space names.
