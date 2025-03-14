import * as utils from "./utils.js";
import {
  getStartingTroops,
  EPhases,
  territoiresList,
  playersList,
} from "./data.js";
import {
  getAttackableNeighbour,
  getReachableTerritories,
  countPlayerTerritoires,
  countPlayerTroops,
} from "./logic.js";

// window.addEventListener("pageshow", function (event) {
//   // S'assurer qu'un token et username est disponible sinon redirection vers la page principale
//   if (
//     !sessionStorage.getItem("token") ||
//     !sessionStorage.getItem("saved-username") ||
//     !sessionStorage.getItem("saved-userId")
//   ) {
//     window.location.replace("/riskquest/login");
//   }
// });

let currentPlayerCount = undefined;
let currentPlayerId = 1;
let selectedTerritoire = undefined;
let currentPhase = EPhases.ATTACK;
let gameFinished = false;

/**
 * Prend le contrôle d'un territoire pour un joueur donné et met à jour les troupes.
 *
 * @param {string} territoryId - L'ID du territoire à conquérir.
 * @param {string} playerId - L'ID du joueur qui prend le contrôle du territoire.
 * @param {number} troopsCount - Le nombre de troupes utilisées pour conquérir le territoire.
 * @throws {Error} Si le joueur n'a pas assez de troupes ou s'il possède déjà le territoire.
 */
function takeOverTerritory(territoryId, playerId, troopsCount) {
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

function takeOverTerritoryFromTerritory(
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

function addTroopsToTerritory(territoireId, troopsCount) {
  territoiresList[territoireId].troops += troopsCount;
  updatePastilleTroopsCount(territoireId);
  updatePlayerHudTroopsCount(territoiresList[territoireId].playerId);
}

function checkPlayerDeadState(playerId) {
  return !Object.values(territoiresList).some(
    (territoire) => territoire.playerId === playerId
  );
}

function updatePlayerDeadState(playerId, dead) {
  playersList[playerId].dead = dead;
  document.getElementById(`side-player-info-${playerId}`).hidden = dead;
}

function initializePlayersHud(playerCount) {
  let hudContent = "";
  for (let playerId = 1; playerId <= playerCount; playerId++) {
    const territoireCount = countPlayerTerritoires(playerId);
    const troopsCount = countPlayerTroops(playerId);
    hudContent += `<div class="side-player">
        <div class="background-player${playerId} side-player-color"></div>
        <div class="side-player-info" id="side-player-info-${playerId}">
            <div class="side-player-info-troops" id="side-player-info-troops-${playerId}">${troopsCount}</div>
            <div class="side-player-info-territories" id="side-player-info-territories-${playerId}">${territoireCount}</div>
        </div>
    </div>`;
  }
  document.getElementById("hud-side").innerHTML = hudContent;
}

function updatePlayersHudTerritoireCount(playerId) {
  let element = document.getElementById(
    `side-player-info-territories-${playerId}`
  );
  element.innerText = countPlayerTerritoires(playerId);
}

function updatePlayerHudTroopsCount(playerId) {
  let element = document.getElementById(`side-player-info-troops-${playerId}`);
  element.innerText = countPlayerTroops(playerId);
}

function changeBackgroundPlayer(element, oldPLayerId, newPlayerId) {
  element.classList.remove(`background-player${oldPLayerId}`);
  element.classList.add(`background-player${newPlayerId}`);
}

const getPhaseElement = (phase) => {
  switch (phase) {
    case EPhases.DRAFT:
      return document.getElementById("turn-hud-draft-bar");
    case EPhases.ATTACK:
      return document.getElementById("turn-hud-attack-bar");
    case EPhases.FORTIFY:
      return document.getElementById("turn-hud-fortify-bar");
    default:
      return null;
  }
};

function updatePhaseHudPlayer(oldPlayerId, playerId) {
  let element = getPhaseElement(currentPhase);

  if (element) {
    changeBackgroundPlayer(element, oldPlayerId, playerId);
  }
}

function updateCurrentPhase(phase) {
  if (phase === currentPhase) {
    throw new Error(
      `updateCurrentPhase was called with the same phase as the current one: ${phase.description}`
    );
  }

  // Remove the class from the current phase's element
  const currentElement = getPhaseElement(currentPhase);
  if (currentElement) {
    currentElement.classList.remove(`background-player${currentPlayerId}`);
  }

  // Add/remove the class for the new phase's element
  const newElement = getPhaseElement(phase);
  if (newElement) {
    newElement.classList.add(`background-player${currentPlayerId}`);
  }

  const turnHudPhaseName = document.getElementById("turn-hud-phase-name");
  turnHudPhaseName.innerText = phase.description;

  if (phase === EPhases.DRAFT) {
    const turnHubActionImg = document.getElementById("turn-hub-action-img");
    turnHubActionImg.src = "./assets/images/person-solid.svg";
    const turnHubActionTroopsCount = document.getElementById(
      "turn-hub-action-troops-count"
    );
    turnHubActionTroopsCount.hidden = false;
    turnHubActionTroopsCount.innerText = playersList[currentPlayerId].troops;
  } else if (currentPhase === EPhases.DRAFT) {
    const turnHubActionImg = document.getElementById("turn-hub-action-img");
    turnHubActionImg.src = "./assets/images/chevrons-right-solid.svg";
    const turnHubActionTroopsCount = document.getElementById(
      "turn-hub-action-troops-count"
    );
    turnHubActionTroopsCount.hidden = true;
  }

  // Update the current phase
  currentPhase = phase;
}

function updatePhaseTroopsCount(troopsCount) {
  const turnHubActionTroopsCount = document.getElementById(
    "turn-hub-action-troops-count"
  );
  turnHubActionTroopsCount.innerText = troopsCount;
}

function setCurrentPlayer(playerId) {
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

function getNextplayerId(playerId, playerCount) {
  return (playerId % playerCount) + 1;
}

const resizeObserver = new ResizeObserver(updatePastillesPosition);

function updatePastillesPosition() {
  const pastilles = document.getElementsByClassName("pastille");
  for (let i = 0; i < pastilles.length; i++) {
    // Get the bounding box of the path
    const territoireId = pastilles.item(i).getAttribute("territoire");
    const territoire = document.getElementById(territoireId);
    const bbox = territoire.getBoundingClientRect();

    // Calculate the center of the bounding box
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;

    pastilles.item(i).style.left = centerX - 12.5 + "px";
    pastilles.item(i).style.top = centerY - 12.5 + "px";
  }
}

function createPastille(territoireId, playerId) {
  const territoire = document.getElementById(territoireId);
  territoire.classList.add(`svg-player${playerId}`);

  // Get the bounding box of the path
  const bbox = territoire.getBoundingClientRect();

  // Calculate the center of the bounding box
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;

  // Create a new div element
  const newDiv = document.createElement("div");
  newDiv.id = `pastille-${territoireId}`;
  newDiv.classList.add(`background-player${playerId}`);
  newDiv.classList.add(`pastille`);
  newDiv.innerText = 1;
  newDiv.setAttribute("territoire", territoireId);
  newDiv.style.position = "fixed";
  newDiv.style.left = centerX - 12.5 + "px";
  newDiv.style.top = centerY - 12.5 + "px";

  // Append the div to the body
  document.body.appendChild(newDiv);
}

function updateTerritoryOwer(territoireId, playerId) {
  const territoire = territoiresList[territoireId];
  const territoireSvg = document.getElementById(territoireId);
  if (territoire.playerId)
    territoireSvg.classList.remove(`svg-player${territoire.playerId}`);
  territoireSvg.classList.add(`svg-player${playerId}`);

  let pastille = document.getElementById(`pastille-${territoireId}`);
  if (!pastille) {
    createPastille(territoireId, playerId);
  } else {
    changeBackgroundPlayer(pastille, territoire.playerId, playerId);
  }

  territoire.troops = 0;
  territoire.playerId = playerId;
}

function updatePastilleTroopsCount(territoireId) {
  const element = document.getElementById(`pastille-${territoireId}`);
  element.innerText = territoiresList[territoireId].troops || 0;
}

function startTurnTerritoriesSelection(playerCount, callback) {
  // mise à jour de la phase courante
  updateCurrentPhase(EPhases.PICKING);

  const territoires = document.getElementsByClassName("territoire");

  let playerId = currentPlayerId;

  function handler() {
    const territoireId = this.id;
    takeOverTerritory(territoireId, playerId, 1);

    if (
      Object.values(territoiresList).some((territoire) => !territoire.playerId)
    ) {
      // Some unselected territories remain
      playerId = getNextplayerId(playerId, playerCount);
      setCurrentPlayer(playerId);
    } else {
      // All territories where selected
      callback();
    }
  }

  for (const territoire of territoires) {
    if (territoiresList[territoire.id]) {
      territoire.addEventListener("click", handler, { once: true });
    }
  }
}

function startRandomTerritoryDistribution(playerCount) {
  let territoires = Object.keys(territoiresList);
  let playerId = currentPlayerId;
  do {
    let territoireIndex = utils.randomInteger(0, territoires.length - 1);
    takeOverTerritory(territoires[territoireIndex], playerId, 1);
    territoires.splice(territoireIndex, 1);

    playerId = getNextplayerId(playerId, playerCount);
  } while (territoires.length > 0);
}

function startRandomTroopsPlacement(playerCount) {
  for (let playerId = 1; playerId <= playerCount; playerId++) {
    const player = playersList[playerId];

    let territoires = Object.keys(territoiresList).filter(
      (territoireId) => territoiresList[territoireId].playerId == playerId
    );

    while (player.troops > 0) {
      let territoireIndex = utils.randomInteger(0, territoires.length - 1);
      moveTroopsFromPlayer(territoires[territoireIndex], playerId, 1);
    }
  }
}

function countNewTroops(ownedTerritoriesIds, playerId) {
  /*
  At the beginning of every turn (including your first), count the
  number of territories you currently occupy, then divide the total by three
  (ignore any fraction).
  You will always receive at least 3 armies on a turn, even if you occupy fewer
  than 9 territories.
  */
  const territoiresCount = ownedTerritoriesIds.length;
  let newTroops = Math.max(Math.floor(territoiresCount / 3), 3);

  /*
  In addition, at the beginning of your turn you will receive
  armies for each continent you control. (To control a continent, you must
  occupy all its territories at the start of your turn.)
  */
  const continents = [];
  for (const territoireId of Object.keys(territoiresList)) {
    const territoire = territoiresList[territoireId];
    if (territoire.playerId != playerId) {
      continents[territoireId.continent] = false;
    } else if (continents[territoireId.continent] === undefined) {
      continents[territoireId.continent] = true;
    }
  }

  const bonuses = {
    "north-america": 5,
    "south-america": 2,
    europe: 5,
    africa: 3,
    asia: 7,
    australia: 2,
  };
  for (const continentId in continents) {
    if (continents[continentId] === true) {
      newTroops += bonuses[continentId] || 0;
    }
  }
  return newTroops;
}

function addTroops(playerId, troopsCount) {
  console.log(`addTroops(${playerId}, ${troopsCount})`);
  if (troopsCount <= 0) {
    throw new Error(`player${playerId} tried to add ${troopsCount} troops`);
  }

  let player = playersList[playerId];
  player.troops += troopsCount;
  updatePlayerHudTroopsCount(playerId);
  updatePhaseTroopsCount(player.troops);
}

function setSelectedTerritoire(territoireId) {
  utils.removeCssClass("selected-territory");
  if (territoireId)
    document.getElementById(territoireId).classList.add("selected-territory");
  selectedTerritoire = territoireId;
}

function startDraftPhase(callback) {
  console.log("startDraftPhase");
  updateCurrentPhase(EPhases.DRAFT);

  // Récupère les térritoires possédé par le joueur
  const ownedTerritoriesIds = Object.keys(territoiresList).filter(
    (territoireId) => territoiresList[territoireId].playerId === currentPlayerId
  );

  // Calcule le nombre de nouvelle troop de la phase draft
  const newTroops = countNewTroops(ownedTerritoriesIds, currentPlayerId);

  // Ajouter les troupes
  addTroops(currentPlayerId, newTroops);

  function territoireHandler() {
    moveTroopsFromPlayer(this.id, currentPlayerId, 1);

    // Tous les pieces ont été placé
    if (playersList[currentPlayerId].troops <= 0) {
      // Enlever tous les listener sur les territoires
      for (const territoire of ownedTerritoriesIds) {
        document
          .getElementById(territoire)
          .removeEventListener("click", territoireHandler);
      }

      setAttackableTerritoires([]);
      startAttackPhase(callback);
    }
  }

  // Enregistre le territoireHandler sur tous les territoires
  for (const territoire of ownedTerritoriesIds) {
    document
      .getElementById(territoire)
      .addEventListener("click", territoireHandler);
  }
  setAttackableTerritoires(ownedTerritoriesIds);
}

function setAttackableTerritoires(territoiresId) {
  utils.removeCssClass("attackable-territory");
  for (const territoireId of territoiresId) {
    const territoire = document.getElementById(territoireId);
    territoire.classList.add("attackable-territory");
    // Déplace l'element a la fin de son parent pour qu'il soit afficher pardessus ces frère
    // pour permettre a sont stroke d'aparraite et ne pas etre cacher.
    territoire.parentElement.appendChild(territoire);
  }
}

function startAttackPhase(callback) {
  console.log("startAttackPhase");
  updateCurrentPhase(EPhases.ATTACK);

  const territoriesIds = Object.keys(territoiresList);
  const territoiresSvgs = territoriesIds.map((territoireId) =>
    document.getElementById(territoireId)
  );

  const turnHudAction = document.getElementById("turn-hud-action");
  function nextHandler() {
    setSelectedTerritoire(null);
    setAttackableTerritoires([]);
    for (const territoireSvg of territoiresSvgs) {
      territoireSvg.removeEventListener("click", territoireHandler);
    }
    startFortifyPhase(callback);
  }
  turnHudAction.addEventListener("click", nextHandler, { once: true });

  async function territoireHandler() {
    if (territoiresList[this.id].playerId === currentPlayerId) {
      selectedTerritoire = this.id;
      setAttackableTerritoires(getAttackableNeighbour(this.id));
    }
    if (!selectedTerritoire) {
      return;
    }

    const attackables = getAttackableNeighbour(selectedTerritoire);
    if (!attackables.includes(this.id)) {
      return;
    }

    const defenderTerritoireId = this.id;
    const attackerTerritoireId = selectedTerritoire;
    console.log(
      utils.blitzAttack(
        territoiresList[defenderTerritoireId].troops,
        territoiresList[attackerTerritoireId].troops - 1
      )
    );
    // Calculer le nombre de troops perdu des deux bords.
    let [defenderLostTroops, attackerLostTroops] = utils.blitzAttack(
      territoiresList[defenderTerritoireId].troops,
      territoiresList[attackerTerritoireId].troops - 1
    );
    console.log(defenderLostTroops, attackerLostTroops);
    // Enlever les troops
    if (defenderLostTroops > 0)
      removeTroopsFromTerritory(defenderTerritoireId, defenderLostTroops);
    if (attackerLostTroops > 0)
      removeTroopsFromTerritory(attackerTerritoireId, attackerLostTroops);

    if (territoiresList[defenderTerritoireId].troops <= 0) {
      const defenderPlayerId = territoiresList[defenderTerritoireId].playerId;
      takeOverTerritoryFromTerritory(
        attackerTerritoireId,
        defenderTerritoireId,
        currentPlayerId,
        1
      );

      updatePlayerDeadState(
        defenderPlayerId,
        checkPlayerDeadState(defenderPlayerId)
      );

      let count = territoiresList[attackerTerritoireId].troops - 1;
      if (territoiresList[attackerTerritoireId].troops > 3) {
        const popup = new CountPopup({
          min: 2,
          max: territoiresList[attackerTerritoireId].troops - 1,
          cancel: false,
        });
        const result = await popup.show();
        if (result.cancel === true) {
          count = 0;
        } else if (result.value > 1) {
          count = result.value;
        }
      }

      if (count > 0) {
        moveTroopsFromTerritory(
          attackerTerritoireId,
          defenderTerritoireId,
          currentPlayerId,
          count
        );
      }
    }

    setSelectedTerritoire(null);
    setAttackableTerritoires([]);
  }

  for (const territoireSvg of territoiresSvgs) {
    territoireSvg.addEventListener("click", territoireHandler);
  }
}

function startFortifyPhase(callback) {
  console.log("startFortifyPhase");
  updateCurrentPhase(EPhases.FORTIFY);

  const ownedTerritoriesIds = Object.keys(territoiresList).filter(
    (territoireId) =>
      territoiresList[territoireId].playerId === currentPlayerId &&
      territoiresList[territoireId].troops > 1
  );
  const territoiresSvgs = ownedTerritoriesIds.map((territoireId) =>
    document.getElementById(territoireId)
  );

  function nextHandler() {
    setSelectedTerritoire(null);

    for (const territoireSvg of territoiresSvgs) {
      territoireSvg.removeEventListener("click", territoireHandler);
    }

    callback();
  }

  const turnHudAction = document.getElementById("turn-hud-action");
  turnHudAction.addEventListener("click", nextHandler, { once: true });

  async function territoireHandler() {
    if (!selectedTerritoire) {
      setSelectedTerritoire(this.id);
      return;
    }

    const reachables = getReachableTerritories(this.id);
    if (reachables.includes(selectedTerritoire)) {
      const popup = new CountPopup({
        min: 1,
        max: territoiresList[selectedTerritoire].troops - 1,
      });

      const result = await popup.show();

      if (result.cancel === false && result.value > 0) {
        moveTroopsFromTerritory(
          selectedTerritoire,
          this.id,
          currentPlayerId,
          result.value
        );

        nextHandler();
      }
    } else {
      setSelectedTerritoire(this.id);
    }
  }

  for (const territoireSvg of territoiresSvgs) {
    territoireSvg.addEventListener("click", territoireHandler);
  }
}

function startOneRound(callback) {
  startDraftPhase(() => {
    if (!gameFinished) {
      let nextPlayerId = currentPlayerId;
      do {
        nextPlayerId = getNextplayerId(nextPlayerId, currentPlayerCount);
        console.log(nextPlayerId, playersList[nextPlayerId]);
      } while (
        playersList[nextPlayerId].dead &&
        nextPlayerId !== currentPlayerId
      );

      if (nextPlayerId === currentPlayerId) {
        gameFinished = true;
      } else {
        setCurrentPlayer(nextPlayerId);
      }
    }
    callback();
  });
}

function startMainLoop(callback) {
  let handler = () => {
    if (gameFinished) {
      callback();
      return;
    }
    startOneRound(handler);
  };

  handler();
}

document.addEventListener("DOMContentLoaded", function () {
  const playerCount = 6;
  currentPlayerCount = playerCount;

  // Initialization des troops
  for (let i = 1; i <= playerCount; i++) {
    playersList[i].troops = getStartingTroops(playerCount);
  }

  // Création dynamiques du side player hud
  initializePlayersHud(playerCount);

  setCurrentPlayer(utils.getRandomStartingPlayer(playerCount));

  startRandomTerritoryDistribution(playerCount);

  console.log("Selection is done");

  startRandomTroopsPlacement(playerCount);

  console.log("Distribution is done");
  startMainLoop(() => {
    console.log("Main game loop is done");
  });

  let containerPays = document.getElementById("pays-background");
  containerPays.addEventListener("click", function () {
    setSelectedTerritoire(null);
    setAttackableTerritoires([]);
  });
  resizeObserver.observe(document.body);
  window.addEventListener("resize", updatePastillesPosition);
});
