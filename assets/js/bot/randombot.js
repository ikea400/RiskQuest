import BotBase from "./botbase.js";

import { playersList, territoiresList } from "../game/data.js";
import { getAttackableNeighbour } from "../game/logic.js";
import { winningOdds } from "../game/data.js";
import * as utils from "../game/utils.js";

export default class RandomBot extends BotBase {
  constructor(params) {
    super(params);
  }

  /**
   * Sélectionne un territoire libre aléatoirement lors de la phase de sélection initiale.
   * @returns {string} L'identifiant d'un territoire libre sélectionné aléatoirement.
   */
  pickTerritory() {
    // Filtre les territoires pour obtenir uniquement ceux qui n'ont pas encore de joueur assigné
    const territoiresLibres = Object.keys(territoiresList).filter(
      (territoiresId) => territoiresList[territoiresId].playerId == null
    );

    // Retourne un territoire libre choisi aléatoirement
    return territoiresLibres[
      utils.randomInteger(0, territoiresLibres.length - 1)
    ];
  }

  /**
   * Sélectionne un territoire possédé par le joueur actuel pour y ajouter une troupe.
   * @returns {string} L'identifiant d'un territoire choisi aléatoirement parmi ceux du joueur.
   */
  pickStartTroop() {
    // Filtre les territoires pour obtenir uniquement ceux appartenant au joueur actuel
    const territoires = Object.keys(territoiresList).filter(
      (territoiresId) =>
        territoiresList[territoiresId].playerId === this.playerId
    );

    // Choisit un territoire aléatoire parmi ceux du joueur
    const choice = territoires[utils.randomInteger(0, territoires.length - 1)];

    // Affiche dans la console la liste des territoires disponibles
    console.log(territoires);

    // Retourne l'identifiant du territoire choisi
    return choice;
  }

  /**
   * Sélectionne de manière aléatoire où placer les troupes lors de la phase de draft.
   * @returns {Array<Object>} Un tableau d'objets représentant le placement des troupes.
   * Chaque objet contient un territoire et le nombre de troupes assignées.
   */
  pickDraftTroops() {
    // Nombre total de troupes disponibles pour le joueur actuel
    let troopsCount = playersList[this.playerId].troops;

    // Obtenir la liste des territoires appartenant au joueur actuel
    const ownedTerritoiresId = Object.keys(territoiresList).filter(
      (territoiresId) =>
        territoiresList[territoiresId].playerId === this.playerId
    );

    // Tableau pour stocker les informations de placement des troupes
    const drafts = [];

    // Tant qu'il reste des troupes à placer
    while (troopsCount > 0) {
      // Génère un nombre aléatoire de troupes à placer (au moins 1, au plus le total restant)
      const troops = utils.randomInteger(1, troopsCount);
      troopsCount -= troops;

      // Sélectionne un territoire aléatoire parmi ceux appartenant au joueur
      const territoireId =
        ownedTerritoiresId[
          utils.randomInteger(0, ownedTerritoiresId.length - 1)
        ];

      // Ajoute le placement des troupes dans le tableau
      drafts.push({ territoire: territoireId, troops: troops });
    }

    // Retourne le tableau contenant les placements des troupes
    return drafts;
  }

  /**
   * Sélectionne une attaque à effectuer ou retourne null si aucune attaque valide n'est disponible.
   * Cette fonction est appelée en boucle jusqu'à ce qu'elle retourne null, signalant la fin des attaques.
   * @returns {Object|null} Un objet représentant l'attaque ({attacker, defender, odds})
   * ou null si aucune attaque n'est possible.
   */
  pickAttack() {
    // Définir le seuil minimum de chances de succès pour une attaque en mode blitz
    const MIN_ODDS = 0.7; // 70%

    // Récupère tous les territoires appartenant au bot
    const ownedTerritoiresId = Object.keys(territoiresList).filter(
      (territoiresId) =>
        territoiresList[territoiresId].playerId === this.playerId
    );

    // Construit une liste de candidats possibles pour une attaque
    const candidats = ownedTerritoiresId
      .map((territoireId) => {
        // Récupère les territoires voisins attaquables
        const attackables = getAttackableNeighbour(territoireId);

        // Construit une liste des attaques possibles avec leurs probabilités de succès
        return (
          attackables
            .map((defenderId) => {
              return {
                attacker: territoireId,
                defender: defenderId,
                odds: winningOdds.blitz[
                  territoiresList[territoireId].troops - 1
                ][territoiresList[defenderId].troops],
              };
            })
            // Filtre pour ne garder que les attaques ayant une probabilité suffisante
            .filter((attackableObj) => attackableObj.odds >= MIN_ODDS)
        );
      })
      // Aplati la liste des candidats en une seule dimension
      .flat();

    // Retourne une attaque aléatoire parmi les candidats ou null si aucun n'est disponible
    return candidats.length > 0
      ? candidats[utils.randomInteger(0, candidats.length - 1)]
      : null;
  }

  /**
   * Détermine combien de troupes déplacer après une attaque réussie.
   * @param {string} attackerId - L'identifiant du territoire attaquant.
   * @param {string} defenderId - L'identifiant du territoire défenseur.
   * @param {number} minTroopsCount - Nombre minimum de troupes pouvant être déplacées.
   * @returns {number} Le nombre de troupes à déplacer après l'attaque.
   */
  pickPostAttack(attackerId, defenderId, minTroopsCount) {
    // Récupère les territoires voisins pouvant être attaqués depuis le territoire défenseur
    const possibleEnemy = getAttackableNeighbour(defenderId);

    // Si aucun territoire voisin n'est attaquable, retourner le nombre minimum de troupes
    if (possibleEnemy.length == 0) return minTroopsCount;

    // Sinon, retourne un nombre aléatoire de troupes à déplacer
    return utils.randomInteger(
      minTroopsCount,
      territoiresList[attackerId].troops - 1
    );
  }

  /**
   * Sélectionne un territoire appartenant au bot pour le renforcer ou retourne null si aucun renforcement n'est nécessaire.
   * @returns {string|null} L'identifiant du territoire à renforcer ou null si aucun renforcement n'est souhaité.
   */
  pickFortify() {
    // Récupère tous les territoires appartenant au bot
    const ownedTerritoiresId = Object.keys(territoiresList).filter(
      (territoiresId) =>
        territoiresList[territoiresId].playerId === this.playerId
    );

    // TODO: Ajouter une logique de renforcement ici si nécessaire.
    // Actuellement, cette méthode retourne toujours null, indiquant qu'aucun territoire ne sera renforcé.
    return null;
  }
}
