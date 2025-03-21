export default class BotBase {
  constructor(params) {
    this.playerId = params.playerId;
  }

  /**
   * Sélectionne un territoire libre aléatoirement lors de la phase de sélection initiale.
   * @returns {string} L'identifiant d'un territoire libre sélectionné aléatoirement.
   */
  pickTerritory() {}
  /**
   * Sélectionne un territoire possédé par le joueur actuel pour y ajouter une troupe.
   * @returns {string} L'identifiant d'un territoire choisi aléatoirement parmi ceux du joueur.
   */
  pickStartTroop() {}

  /**
   * Sélectionne de manière aléatoire où placer les troupes lors de la phase de draft.
   * @returns {Array<Object>} Un tableau d'objets représentant le placement des troupes.
   * Chaque objet contient un territoire et le nombre de troupes assignées.
   */
  pickDraftTroops() {}

  /**
   * Sélectionne une attaque à effectuer ou retourne null si aucune attaque valide n'est disponible.
   * Cette fonction est appelée en boucle jusqu'à ce qu'elle retourne null, signalant la fin des attaques.
   * @returns {Object|null} Un objet représentant l'attaque ({attacker, defender, odds})
   * ou null si aucune attaque n'est possible.
   */
  pickAttack() {}

  /**
   * Détermine combien de troupes déplacer après une attaque réussie.
   * @param {string} attackerId - L'identifiant du territoire attaquant.
   * @param {string} defenderId - L'identifiant du territoire défenseur.
   * @param {number} minTroopsCount - Nombre minimum de troupes pouvant être déplacées.
   * @returns {number} Le nombre de troupes à déplacer après l'attaque.
   */
  pickPostAttack(attackerId, defenderId, minTroopsCount) {}

  /**
   * Sélectionne un territoire appartenant au bot pour le renforcer ou retourne null si aucun renforcement n'est nécessaire.
   * @returns {string|null} L'identifiant du territoire à renforcer ou null si aucun renforcement n'est souhaité.
   */
  pickFortify() {}
}
