# Critiques du Mythe

Module Foundry VTT (v13 et v14) pour **L'Appel de Cthulhu** : quand un investigateur obtient une **réussite critique** (01) ou une **maladresse**, une carte s'affiche en plein écran chez tous les joueurs qui voient le jet, avec un effet, un son et un tremblement de l'écran.

## Deux cartes différentes
- **Réussite critique** : la carte apparaît en se retournant, entourée de rayons de lumière et d'étincelles qui montent. Un accord de cloches retentit et l'écran vibre légèrement.
- **Maladresse** : la carte tombe du haut de l'écran, le verre se fissure et des tentacules surgissent du bas, sous une pluie de cendres. Un grondement sourd accompagne une forte secousse de l'écran.

Chaque carte montre le résultat, le portrait et le nom de l'investigateur, le jet concerné et une phrase tirée au hasard, propre à l'époque.

## Six habillages d'époque
1890 (Gaslight), années 20-30 (Art déco), Montagnes Hallucinées (expédition polaire), 1940 (dossier militaire), années 70, époque moderne (écran numérique).

L'habillage se choisit tout seul :
- **CoC7** : il suit le thème du chat du module « Cartes de chat thématiques » (et donc la bascule d'époque) ;
- **Investigateurs de l'Ombre** : il suit l'époque de l'investigateur et l'ambiance de la campagne.

Le MJ peut aussi imposer un habillage dans les réglages.

## Réglages
- MJ : cartes des critiques et des maladresses (chacune activable), PNJ compris ou non, habillage, sons personnalisés (fichiers audio) à la place des sons de synthèse.
- Chaque joueur : afficher ou non, volume, durée, tremblement de l'écran, version sobre sans animation.

Un clic sur la carte la ferme. Les dés 3D (Dice So Nice!) sont attendus avant l'effet.

Essai depuis une macro : `game.modules.get("critiques-du-mythe").api.tester("critical")` ou `tester("fumble")`.

## Systèmes
- CoC7 8.x
- Investigateurs de l'Ombre 0.12 ou plus

## Licence
Code sous licence MIT. Polices sous licence SIL OFL 1.1 (fichiers dans `fonts/`).
