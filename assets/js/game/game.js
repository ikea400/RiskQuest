import * as utils from "./utils.js";
import {
  getStartingTroops,
  EPhases,
  territoiresList,
  playersList,
  checkPlayerDeadState,
  initializePlayersHud,
  updateCurrentPhase,
} from "./data.js";
import {
  getAttackableNeighbour,
  getReachableTerritories,
  takeOverTerritory,
  updatePlayerDeadState,
  setCurrentPlayer,
} from "./logic.js";
import { updatePastillesPosition, changeBackgroundPlayer } from "./display.js";

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

function getNextplayerId(playerId, playerCount) {
  return (playerId % playerCount) + 1;
}

const resizeObserver = new ResizeObserver(updatePastillesPosition);

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
