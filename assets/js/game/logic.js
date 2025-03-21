import { data, territoiresList, playersList, continentsList } from "./data.js";
import {
  updateTerritoryOwer,
  updatePlayersHudTerritoireCount,
  updatePlayerHudTroopsCount,
  updatePastilleTroopsCount,
  updatePhaseTroopsCount,
  changeBackgroundPlayer,
  updatePhaseHudPlayer,
} from "./display.js";
import * as utils from "./utils.js";

/**
 * Récupère les territoires voisins attaquables d'un territoire donné.
 *
 * @param {string} territoireId - L'ID du territoire pour lequel trouver les voisins attaquables.
 * @returns {Array<string>} Une liste des IDs des territoires voisins attaquables.
 */
export function getAttackableNeighbour(territoireId) {
  let playerId = territoiresList[territoireId].playerId;
  let voisins = territoiresList[territoireId].connection;
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
  console.log(reachables);
  return reachables;
}

/**
 * Compte le nombre de territoires appartenant à un joueur donné.
 *
 * @param {number} playerId - L'ID du joueur pour lequel compter les territoires.
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
 * @param {number} playerId - L'ID du joueur pour lequel compter les troupes.
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
 * @param {number} playerId - L'ID du joueur qui prend le contrôle du territoire.
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
 * @param {number} playerId - L'ID du joueur qui déplace les troupes.
 * @param {number} troopsCount - Le nombre de troupes à déplacer.
 * @throws {Error} Si le joueur ne possède pas le territoire ou s'il n'a pas assez de troupes.
 */
export function moveTroopsFromPlayer(territoireId, playerId, troopsCount) {
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
export function removeTroopsFromTerritory(territoireId, troopsCount) {
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
 * @param {number} playerId - L'ID du joueur effectuant le déplacement.
 * @param {number} troopsCount - Le nombre de troupes à déplacer.
 * @throws {Error} Si le joueur ne contrôle pas l'un des territoires ou si le territoire source n'a pas assez de troupes.
 */
export function moveTroopsFromTerritory(
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
 * @param {number} playerId - L'ID du joueur qui prend le contrôle du territoire.
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
 * @param {number} playerId - L'ID du joueur à vérifier.
 * @returns {boolean} `true` si le joueur ne possède plus aucun territoire, `false` sinon.
 */
export function checkPlayerDeadState(playerId) {
  return !Object.values(territoiresList).some(
    (territoire) => territoire.playerId === playerId
  );
}

/**
 * Met à jour l'état de mort d'un joueur.
 *
 * @param {number} playerId - L'identifiant du joueur à mettre à jour.
 * @param {boolean} dead - Indique si le joueur est mort (true) ou vivant (false).
 */
export function updatePlayerDeadState(playerId, dead) {
  playersList[playerId].dead = dead;
  document.getElementById(`side-player-info-${playerId}`).hidden = dead;
}

/**
 * Définit le joueur actuel et met à jour l'affichage de l'interface utilisateur en conséquence.
 *
 * @param {number} playerId - L'identifiant du joueur qui devient le joueur actuel.
 */
export function setCurrentPlayer(playerId) {
  const player = playersList[playerId];

  // Met à jour le nom sur la barre d'interface du tour
  let turnHudName = document.getElementById("turn-hud-name");
  changeBackgroundPlayer(turnHudName, data.currentPlayerId, playerId);
  turnHudName.innerText = player.name;

  // Met à jour l'image de profil sur l'interface du tour
  let turnHubImg = document.getElementById("turn-hub-img");
  turnHubImg.src = player.img;

  // Met à jour l'arrière-plan de l'action sur l'interface du tour
  let turnHudAction = document.getElementById("turn-hud-action");
  changeBackgroundPlayer(turnHudAction, data.currentPlayerId, playerId);

  // Met à jour la couleur de la phase sur l'interface du tour
  updatePhaseHudPlayer(data.currentPlayerId, playerId);

  data.currentPlayerId = playerId;
}

/**
 * Compte le nombre de nouvelles troupes qu'un joueur reçoit à chaque début de tour.
 *
 * @param {Array} ownedTerritoriesIds - Liste des identifiants des territoires possédés par le joueur.
 * @param {number} playerId - Identifiant du joueur en cours.
 * @returns {number} - Nombre total de nouvelles troupes attribuées au joueur.
 */
export function countNewTroops(ownedTerritoriesIds, playerId) {
  /*
  At the beginning of every turn (including your first), count the
  number of territories you currently occupy, then divide the total by three
  (ignore any fraction).
  You will always receive at least 3 armies on a turn, even if you occupy fewer
  than 9 territories.
  */
  const territoiresCount = ownedTerritoriesIds.length;
  let newTroops = Math.max(Math.floor(territoiresCount / 3), 3);

  for (const continentId in continentsList) {
    const continent = continentsList[continentId];

    const territoireNotOwnedByPlayer = (territoireId) =>
      territoiresList[territoireId].playerId !== playerId;

    if (!continent.territoires.some(territoireNotOwnedByPlayer)) {
      newTroops += continent.bonus;
    }
  }

  return newTroops;
}

/**
 * Ajoute un nombre spécifié de troupes au joueur donné.
 *
 * @param {number} playerId - Identifiant du joueur à qui ajouter les troupes.
 * @param {number} troopsCount - Nombre de troupes à ajouter.
 * @throws {Error} - Génère une erreur si le nombre de troupes à ajouter est inférieur ou égal à zéro.
 */
export function addTroops(playerId, troopsCount) {
  console.log(`addTroops(${playerId}, ${troopsCount})`);
  if (troopsCount <= 0) {
    throw new Error(`player${playerId} tried to add ${troopsCount} troops`);
  }

  let player = playersList[playerId];
  player.troops += troopsCount;
  updatePlayerHudTroopsCount(playerId);
  updatePhaseTroopsCount(player.troops);
}

/**
 * Définit le territoire sélectionné en ajoutant une classe CSS et met à jour la variable correspondante.
 *
 * @param {string|null} territoireId - Identifiant du territoire à sélectionner.
 * Si null ou undefined, aucun territoire ne sera sélectionné.
 */
export function setSelectedTerritoire(territoireId) {
  utils.removeClassFromElements("selected-territory");
  if (territoireId)
    document.getElementById(territoireId).classList.add("selected-territory");
  data.selectedTerritoire = territoireId;
}
