import { territoiresList, playersList } from "./data.js";
/**
 * Récupère les territoires voisins attaquables d'un territoire donné.
 *
 * @param {string} territoire - L'ID du territoire pour lequel trouver les voisins attaquables.
 * @returns {Array<string>} Une liste des IDs des territoires voisins attaquables.
 */
export function getAttackableNeighbour(territoire) {
  let playerId = territoiresList[territoire].playerId;
  let voisins = territoiresList[territoire].connection;
  let territoiresAttackables = [];
  for (const voisin of voisins) {
    if (territoiresList[voisin].playerId != playerId) {
      territoiresAttackables.push(voisin);
    }
  }
  return territoiresAttackables;
}

/**
 * Récupère les territoires accessibles à partir d'un territoire donné appartenant au même joueur.
 *
 * @param {string} territoire - L'ID du territoire de départ.
 * @returns {Array<string>} Une liste des IDs des territoires accessibles appartenant au même joueur.
 */
export function getReachableTerritories(territoire) {
  const playerId = territoiresList[territoire].playerId;
  const canditats = [territoire];
  const reachables = [];
  do {
    const territoire = canditats.pop();
    reachables.push(territoire);
    let voisins = territoiresList[territoire].connection;
    for (const voisin of voisins) {
      if (territoiresList[voisin].playerId === playerId) {
        if (!canditats.includes(voisin) && !reachables.includes(voisin)) {
          canditats.push(voisin);
        }
      }
    }
  } while (canditats.length != 0);
  return reachables;
}

/**
 * Compte le nombre de territoires appartenant à un joueur donné.
 *
 * @param {string} playerId - L'ID du joueur pour lequel compter les territoires.
 * @returns {number} Le nombre de territoires appartenant au joueur.
 */
export function countPlayerTerritoires(playerId) {
  let count = 0;
  for (const territoireId in territoiresList) {
    if (territoiresList[territoireId].playerId === playerId) {
      count++;
    }
  }
  return count;
}

/**
 * Compte le nombre total de troupes appartenant à un joueur donné, en incluant les troupes du joueur et celles des territoires qu'il possède.
 *
 * @param {string} playerId - L'ID du joueur pour lequel compter les troupes.
 * @returns {number} Le nombre total de troupes appartenant au joueur.
 */
export function countPlayerTroops(playerId) {
  let count = playersList[playerId].troops;
  for (const territoireId in territoiresList) {
    if (territoiresList[territoireId].playerId === playerId) {
      count += territoiresList[territoireId].troops ?? 0;
    }
  }
  return count;
}
