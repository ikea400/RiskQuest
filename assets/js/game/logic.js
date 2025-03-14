import { territoiresList, playersList } from "./data.js";
import {
  updateTerritoryOwer,
  updatePlayersHudTerritoireCount,
  updatePlayerHudTroopsCount,
  updatePastilleTroopsCount,
  updatePhaseTroopsCount,
} from "./display.js";

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

/**
 * Prend le contrôle d'un territoire pour un joueur donné et met à jour les troupes.
 *
 * @param {string} territoryId - L'ID du territoire à conquérir.
 * @param {string} playerId - L'ID du joueur qui prend le contrôle du territoire.
 * @param {number} troopsCount - Le nombre de troupes utilisées pour conquérir le territoire.
 * @throws {Error} Si le joueur n'a pas assez de troupes ou s'il possède déjà le territoire.
 */
export function takeOverTerritory(territoryId, playerId, troopsCount) {
  console.log(`takeOverTerritory(${territoryId}, ${playerId}, ${troopsCount})`);
  let player = playersList[playerId];
  if (player.troops < troopsCount) {
    throw new Error(
      `player${playerId} tried to take a territory with not enough troops left`
    );
  }

  let territoire = territoiresList[territoryId];
  if (territoire.playerId === playerId) {
    throw new Error(
      `player${playerId} tried to take a territory that he had already`
    );
  }

  let oldOwnerId = territoire.playerId;
  updateTerritoryOwer(territoryId, playerId);

  if (oldOwnerId) updatePlayersHudTerritoireCount(oldOwnerId);
  updatePlayersHudTerritoireCount(playerId);

  moveTroopsFromPlayer(territoryId, playerId, troopsCount);
}

/**
 * Ajoute des troupes à un territoire spécifique.
 *
 * @param {string} territoireId - L'ID du territoire auquel ajouter des troupes.
 * @param {number} troopsCount - Le nombre de troupes à ajouter.
 */
function addTroopsToTerritory(territoireId, troopsCount) {
  territoiresList[territoireId].troops += troopsCount;
  updatePastilleTroopsCount(territoireId);
  updatePlayerHudTroopsCount(territoiresList[territoireId].playerId);
}

/**
 * Déplace des troupes d'un joueur vers un territoire spécifique.
 *
 * @param {string} territoireId - L'ID du territoire vers lequel déplacer les troupes.
 * @param {string} playerId - L'ID du joueur qui déplace les troupes.
 * @param {number} troopsCount - Le nombre de troupes à déplacer.
 * @throws {Error} Si le joueur ne possède pas le territoire ou s'il n'a pas assez de troupes.
 */
function moveTroopsFromPlayer(territoireId, playerId, troopsCount) {
  console.log(
    `moveTroopsFromPlayer(${territoireId}, ${playerId}, ${troopsCount})`
  );
  let territoire = territoiresList[territoireId];
  if (territoire.playerId != playerId) {
    throw new Error(
      `player${playerId} tried to move troops into ${territoireId} while not owning it`
    );
  }

  let player = playersList[playerId];
  if (player.troops < troopsCount) {
    throw new Error(
      `player${playerId} tried to move ${troopsCount} but didnt have enough`
    );
  }

  player.troops -= troopsCount;
  addTroopsToTerritory(territoireId, troopsCount);
  updatePhaseTroopsCount(player.troops);
}

/**
 * Supprime un certain nombre de troupes d'un territoire donné.
 *
 * @param {string} territoireId - L'ID du territoire dont les troupes doivent être retirées.
 * @param {number} troopsCount - Le nombre de troupes à retirer du territoire.
 * @throws {Error} Si le territoire n'a pas suffisamment de troupes pour effectuer le retrait.
 */
function removeTroopsFromTerritory(territoireId, troopsCount) {
  if (territoiresList[territoireId].troops < troopsCount) {
    throw new Error(
      `Error: removeTroopsFromTerritory tried to remove ${troopsCount} troops from ${territoireId} with only ${territoiresList[territoireId].troops} troops`
    );
  }

  territoiresList[territoireId].troops -= troopsCount;
  updatePastilleTroopsCount(territoireId);
  updatePlayerHudTroopsCount(territoiresList[territoireId].playerId);
}

/**
 * Déplace des troupes d'un territoire à un autre appartenant au même joueur.
 *
 * @param {string} fromTerritoireId - L'ID du territoire source.
 * @param {string} territoireId - L'ID du territoire cible.
 * @param {string} playerId - L'ID du joueur effectuant le déplacement.
 * @param {number} troopsCount - Le nombre de troupes à déplacer.
 * @throws {Error} Si le joueur ne contrôle pas l'un des territoires ou si le territoire source n'a pas assez de troupes.
 */
function moveTroopsFromTerritory(
  fromTerritoireId,
  territoireId,
  playerId,
  troopsCount
) {
  console.log(
    `moveTroopsFromTerritory(${fromTerritoireId}, ${territoireId}, ${playerId}, ${troopsCount})`
  );
  let territoire = territoiresList[territoireId];
  let fromTerritoire = territoiresList[fromTerritoireId];

  // Check if the territories belong to the player
  if (territoire.playerId !== playerId) {
    throw new Error(
      `Error: Target territoire (${territoireId}) is not controlled by player ${playerId}.`
    );
  }
  if (fromTerritoire.playerId !== playerId) {
    throw new Error(
      `Error: Source territoire (${fromTerritoireId}) is not controlled by player ${playerId}.`
    );
  }

  // Check if there are enough troops to move
  // Check if there are enough troops to move while leaving at least 1 troop in the source
  if (fromTerritoire.troops - troopsCount < 1) {
    throw new Error(
      `Error: Source territoire (${fromTerritoireId}) must retain at least 1 troop. Available: ${fromTerritoire.troops}, Attempted to move: ${troopsCount}.`
    );
  }

  removeTroopsFromTerritory(fromTerritoireId, troopsCount);
  addTroopsToTerritory(territoireId, troopsCount);
}

/**
 * Prend le contrôle d'un territoire à partir d'un autre territoire appartenant au même joueur.
 *
 * @param {string} fromTerritoireId - L'ID du territoire d'origine.
 * @param {string} territoryId - L'ID du territoire à conquérir.
 * @param {string} playerId - L'ID du joueur qui prend le contrôle du territoire.
 * @param {number} troopsCount - Le nombre de troupes utilisées pour conquérir le territoire.
 * @throws {Error} Si le joueur ne possède pas le territoire d'origine, ou s'il n'a pas assez de troupes, ou s'il possède déjà le territoire.
 */
export function takeOverTerritoryFromTerritory(
  fromTerritoireId,
  territoryId,
  playerId,
  troopsCount
) {
  console.log(
    `takeOverTerritoryFromTerritory(${fromTerritoireId}, ${territoryId}, ${playerId}, ${troopsCount})`
  );

  let fromTerritoire = territoiresList[fromTerritoireId];
  if (fromTerritoire.playerId !== playerId) {
    throw new Error(
      `player${playerId} tried to take a territory from a territory that he didnt owned`
    );
  }
  if (fromTerritoire.troops <= troopsCount) {
    throw new Error(
      `player${playerId} tried to take a territory from a territory with not enough troops left`
    );
  }

  let territoire = territoiresList[territoryId];
  if (territoire.playerId === playerId) {
    throw new Error(
      `player${playerId} tried to take a territory that he had already`
    );
  }

  let oldOwnerId = territoire.playerId;
  updateTerritoryOwer(territoryId, playerId);

  if (oldOwnerId) updatePlayersHudTerritoireCount(oldOwnerId);
  updatePlayersHudTerritoireCount(playerId);

  moveTroopsFromTerritory(fromTerritoireId, territoryId, playerId, troopsCount);
}

/**
 * Vérifie si un joueur est éliminé (ne possède plus aucun territoire).
 *
 * @param {string} playerId - L'ID du joueur à vérifier.
 * @returns {boolean} `true` si le joueur ne possède plus aucun territoire, `false` sinon.
 */
export function checkPlayerDeadState(playerId) {
  return !Object.values(territoiresList).some(
    (territoire) => territoire.playerId === playerId
  );
}

export function updatePlayerDeadState(playerId, dead) {
  playersList[playerId].dead = dead;
  document.getElementById(`side-player-info-${playerId}`).hidden = dead;
}

export function setCurrentPlayer(playerId) {
  const player = playersList[playerId];

  // Update turn hud bar name
  let turnHudName = document.getElementById("turn-hud-name");
  changeBackgroundPlayer(turnHudName, currentPlayerId, playerId);
  turnHudName.innerText = player.name;

  // Update turn hud profile image
  let turnHubImg = document.getElementById("turn-hub-img");
  turnHubImg.src = player.img;

  // Update turn hud action background
  let turnHudAction = document.getElementById("turn-hud-action");
  changeBackgroundPlayer(turnHudAction, currentPlayerId, playerId);

  // Update turn hud phase color
  updatePhaseHudPlayer(currentPlayerId, playerId);

  currentPlayerId = playerId;
}
