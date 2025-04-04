import {
  data,
  territoiresList,
  playersList,
  continentsList,
  CardType,
  gameCards,
} from "./data.js";
import {
  updateTerritoryOwer as updateTerritoryOwner,
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
  updateTerritoryOwner(territoryId, playerId);

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

  updateTerritoryOwner(territoryId, playerId);

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
      console.log(
        `+ ${continent.bonus}(${newTroops}) troups to ${playerId} for owning ${continentId}`
      );
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

/**
 * Vérifie si la carte donnée est de type INFANTRY.
 * @param {Object} card - L'objet carte à vérifier.
 * @returns {boolean} - Retourne true si la carte est INFANTERIE, sinon false.
 */
function isInfantry(card) {
  return card.type === CardType.INFANTRY;
}

/**
 * Vérifie si la carte donnée est de type ARTILLERY.
 * @param {Object} card - L'objet carte à vérifier.
 * @returns {boolean} - Retourne true si la carte est ARTILLERIE, sinon false.
 */
function isArtillery(card) {
  return card.type === CardType.ARTILLERY;
}

/**
 * Vérifie si la carte donnée est de type CAVALRY.
 * @param {Object} card - L'objet carte à vérifier.
 * @returns {boolean} - Retourne true si la carte est CAVALERIE, sinon false.
 */
function isCavalry(card) {
  return card.type === CardType.CAVALRY;
}

/**
 * Vérifie si la carte n'est pas un JOKER.
 * @param {Object} card - L'objet carte à vérifier.
 * @returns {boolean} - Retourne true si la carte n'est pas un JOKER, sinon false.
 */
function isJoker(card) {
  return card.type === CardType.JOKER;
}

/**
 * Calcule le nombre de troupes obtenues en échangeant des cartes.
 *
 * @param {Object[]} playerCards - La liste des cartes du joueur.
 * @returns {number|undefined} - Retourne le nombre de troupes ou undefined si l'échange n'est pas possible.
 */
export function claimCards(playerCards) {
  let bonus = 0;
  for (const card of playerCards) {
    if (!isJoker(card)) {
      if (territoiresList[card.territory].playerId === data.currentPlayerId) {
        bonus = 2;
      }
    }
  }
  switch (getSelectionType(playerCards)) {
    case CardType.INFANTRY:
      return 4 + bonus;
    case CardType.CAVALRY:
      return 6 + bonus;
    case CardType.ARTILLERY:
      return 8 + bonus;
    case 1:
      return 10 + bonus;
    default:
      return null;
  }
}

/**
 * Détermine le type de sélection en fonction des cartes fournies.
 *
 * @param {Array} cards - La liste des cartes sélectionnées.
 * @returns {CardType|null|number} Le type de carte correspondant ou null si aucune combinaison valide n'est trouvée.
 */
function getSelectionType(cards) {
  const infantryCards = cards.filter(isInfantry);
  const artilleryCards = cards.filter(isArtillery);
  const cavalryCards = cards.filter(isCavalry);
  const jokerCards = cards.filter(isJoker);

  if (
    infantryCards.length === 3 ||
    (infantryCards.length === 2 && jokerCards.length === 1)
  ) {
    return CardType.INFANTRY;
  }
  if (
    artilleryCards.length === 3 ||
    (artilleryCards.length === 2 && jokerCards.length === 1)
  ) {
    return CardType.ARTILLERY;
  }
  if (
    cavalryCards.length === 3 ||
    (cavalryCards.length === 2 && jokerCards.length === 1)
  ) {
    return CardType.CAVALRY;
  }

  //3 different cards with or without jokers
  if (
    (infantryCards.length === 1 &&
      artilleryCards.length === 1 &&
      cavalryCards.length === 1) ||
    (infantryCards.length === 1 &&
      artilleryCards.length === 1 &&
      jokerCards.length === 1) ||
    (infantryCards.length === 1 &&
      cavalryCards.length === 1 &&
      jokerCards.length === 1) ||
    (artilleryCards.length === 1 &&
      cavalryCards.length === 1 &&
      jokerCards.length === 1)
  ) {
    return 1;
  }
  return null;
}

/**
 * Génère un jeu de cartes pour le jeu, en attribuant aléatoirement des types aux territoires.
 *
 * @returns {Array} Le jeu de cartes mélangé, comprenant 42 cartes de territoire et 2 jokers.
 */
export function generateGameCards() {
  let gameCards = [];
  let shuffledTerritories = shuffleArray(Object.keys(territoiresList));
  for (let i = 0; i < 42; i++) {
    let card = {};
    switch (utils.randomInteger(1, 3)) {
      case 1:
        card.type = CardType.INFANTRY;
        break;
      case 2:
        card.type = CardType.CAVALRY;
        break;
      case 3:
        card.type = CardType.ARTILLERY;
        break;
    }
    card.territory = shuffledTerritories[i];
    gameCards.push(card);
  }
  //On rajoute les 2 jokers.
  for (let i = 0; i < 2; i++) {
    let card = {};
    card.type = CardType.JOKER;
    gameCards.push(card);
  }
  gameCards = shuffleArray(gameCards);
  return gameCards;
}

/**
 * Mélange les éléments d'un tableau de manière aléatoire en utilisant l'algorithme de Fisher-Yates.
 *
 * @param {Array} array - Le tableau à mélanger.
 * @returns {Array} Le tableau mélangé.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = utils.randomInteger(0, i);
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

/**
 * Pioche une carte pour le joueur spécifié et l'ajoute à sa main.
 *
 * @param {number} playerId - L'identifiant du joueur qui pioche une carte.
 * @returns {Array} La liste mise à jour des cartes du joueur.
 */
export function drawCard(playerId) {
  if (!playersList[playerId].cards) {
    playersList[playerId].cards = [];
  }
  const drawnCard = gameCards.shift();
  playersList[playerId].cards.push(drawnCard);
  return playersList[playerId].cards;
}

/**
 * Défausse les cartes spécifiées du joueur et les ajoute à la pile de défausse.
 * Mélange et remet les cartes dans le jeu si la pile de défausse contient moins de 5 cartes.
 *
 * @param {number} playerId - L'identifiant du joueur qui défausse les cartes.
 * @param {Array} cards - Les cartes à défausser.
 */
export function discardCards(playerId, cards) {
  for (const card of cards) {
    let index = playersList[playerId].cards.indexOf(card);
    playersList[playerId].cards.splice(index, 1);
    data.discardPile.push(card);
  }
  if (gameCards.length < 5) {
    data.discardPile = shuffleArray(data.discardPile);
    for (const card of data.discardPile) {
      gameCards.push(card);
    }
    data.discardPile = [];
  }
}

/**
 * Trouve le meilleur ensemble de trois cartes qui rapporte le maximum de troupes.
 *
 * @returns {Array} Le meilleur ensemble de trois cartes qui fournit le plus de troupes.
 */
export function getBestSetForTroops() {
  const cards = playersList[data.currentPlayerId].cards;
  let bestSet = null;
  let maxTroops = 0;
  for (let i = 0; i < cards.length - 2; i++) {
    for (let j = i + 1; j < cards.length - 1; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        let set = [cards[i], cards[j], cards[k]];
        let troops = claimCards(set);
        if (troops > maxTroops) {
          bestSet = set;
          maxTroops = troops;
        }
      }
    }
  }
  return bestSet;
}

export function takeCardsFrom(attakerId, defenderId) {
    while(playersList[defenderId].cards.length > 0){
      playersList[attakerId].cards.push(playersList[defenderId].cards.pop());
    }
}
