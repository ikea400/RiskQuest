import * as utils from "./utils.js";
import {
  getStartingTroops,
  data,
  EPhases,
  territoiresList,
  playersList,
} from "./data.js";
import {
  getAttackableNeighbour,
  getReachableTerritories,
  takeOverTerritory,
  updatePlayerDeadState,
  setCurrentPlayer,
  countNewTroops,
  setSelectedTerritoire,
  checkPlayerDeadState,
  moveTroopsFromPlayer,
  addTroops,
  removeTroopsFromTerritory,
  moveTroopsFromTerritory,
  takeOverTerritoryFromTerritory,
} from "./logic.js";
import {
  updatePastillesPosition,
  setAttackableTerritoires,
  initializePlayersHud,
  updateCurrentPhase,
  addTroopsChangeParticle,
} from "./display.js";
import { CountPopup, AttackPopup } from "../popup.js";

import RandomBot from "../bot/randombot.js";

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

let gameFinished = false;
const resizeObserver = new ResizeObserver(updatePastillesPosition);

function startTurnTerritoriesSelection(playerCount, callback) {
  // mise à jour de la phase courante
  updateCurrentPhase(EPhases.PICKING);

  const territoires = document.getElementsByClassName("territoire");

  let playerId = data.currentPlayerId;

  function handler() {
    const territoireId = this.id;
    takeOverTerritory(territoireId, playerId, 1);

    if (
      Object.values(territoiresList).some((territoire) => !territoire.playerId)
    ) {
      // Some unselected territories remain
      playerId = utils.getNextPlayerId(playerId, playerCount);
      setCurrentPlayer(playerId);

      if (playersList[playerId].bot) {
        document
          .getElementById(playersList[playerId].bot.pickTerritory())
          .dispatchEvent(new Event("click"));
      }
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

function startTurnTroopsPlacement(playerCount, callback) {
  // mise à jour de la phase courante
  updateCurrentPhase(EPhases.PLACING);

  const territoires = document.getElementsByClassName("territoire");

  let playerId = data.currentPlayerId;
  function handler() {
    const territoireId = this.id;
    if (territoiresList[territoireId].playerId !== playerId) return;

    moveTroopsFromPlayer(territoireId, playerId, 1);

    if (
      Object.values(playersList).some(
        (player) => player !== undefined && player.troops > 0
      )
    ) {
      playerId = utils.getNextPlayerId(playerId, playerCount);
      setCurrentPlayer(playerId);

      if (playersList[playerId].bot) {
        document
          .getElementById(playersList[playerId].bot.pickStartTroop())
          .dispatchEvent(new Event("click"));
      }
    } else {
      for (const territoire of territoires) {
        if (territoiresList[territoire.id]) {
          territoire.removeEventListener("click", handler);
        }
      }

      // All territories when all troops has been placed
      callback();
    }
  }

  for (const territoire of territoires) {
    if (territoiresList[territoire.id]) {
      territoire.addEventListener("click", handler);
    }
  }

  if (playersList[playerId].bot) {
    document
      .getElementById(playersList[playerId].bot.pickStartTroop())
      .dispatchEvent(new Event("click"));
  }
}

function startRandomTerritoryDistribution(playerCount, callback) {
  let territoires = Object.keys(territoiresList);
  let playerId = data.currentPlayerId;
  do {
    let territoireIndex = utils.randomInteger(0, territoires.length - 1);
    takeOverTerritory(territoires[territoireIndex], playerId, 1);
    territoires.splice(territoireIndex, 1);

    playerId = utils.getNextPlayerId(playerId, playerCount);
  } while (territoires.length > 0);

  callback();
}

function startRandomTroopsPlacement(playerCount, callback) {
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

  callback();
}

function startDraftPhase(playerCount, callback) {
  console.log("startDraftPhase");
  updateCurrentPhase(EPhases.DRAFT);

  // Récupère les térritoires possédé par le joueur
  const ownedTerritoriesIds = Object.keys(territoiresList).filter(
    (territoireId) =>
      territoiresList[territoireId].playerId === data.currentPlayerId
  );

  // Calcule le nombre de nouvelle troop de la phase draft
  const newTroops = countNewTroops(ownedTerritoriesIds, data.currentPlayerId);

  // Ajouter les troupes
  addTroops(data.currentPlayerId, newTroops);

  async function territoireHandler() {
    const popup = new CountPopup({
      min: 1,
      max: playersList[data.currentPlayerId].troops,
    });
    const result = await popup.show();
    if (result.cancel === false && result.value > 0) {
      moveTroopsFromPlayer(this.id, data.currentPlayerId, result.value);
      addTroopsChangeParticle(this.id, data.currentPlayerId, result.value);

      // Tous les pieces ont été placé
      if (playersList[data.currentPlayerId].troops <= 0) {
        // Enlever tous les listener sur les territoires
        for (const territoire of ownedTerritoriesIds) {
          document
            .getElementById(territoire)
            .removeEventListener("click", territoireHandler);
        }

        setAttackableTerritoires([]);
        startAttackPhase(playerCount, callback);
      }
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

function startAttackPhase(playerCount, callback) {
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
    startFortifyPhase(playerCount, callback);
  }
  turnHudAction.addEventListener("click", nextHandler, { once: true });

  async function territoireHandler() {
    if (territoiresList[this.id].playerId === data.currentPlayerId) {
      setSelectedTerritoire(this.id);
      setAttackableTerritoires(getAttackableNeighbour(this.id));
    }
    if (!data.selectedTerritoire) {
      return;
    }

    const attackables = getAttackableNeighbour(data.selectedTerritoire);
    if (!attackables.includes(this.id)) {
      return;
    }

    const defenderTerritoireId = this.id;
    const attackerTerritoireId = data.selectedTerritoire;

    const popup = new AttackPopup({
      max: Math.min(territoiresList[attackerTerritoireId].troops - 1, 3),
      defender: territoiresList[defenderTerritoireId].troops,
      attacker: territoiresList[attackerTerritoireId].troops - 1,
    });

    const result = await popup.show();
    if (result.cancel === true) {
      return;
    }

    // Calculer le nombre de troops perdu des deux bords.
    let defenderLostTroops;
    let attackerLostTroops;
    if (result.value === 0) {
      [defenderLostTroops, attackerLostTroops] = utils.blitzAttack(
        territoiresList[defenderTerritoireId].troops,
        territoiresList[attackerTerritoireId].troops - 1
      );
    } else {
      [defenderLostTroops, attackerLostTroops] = utils.classicAttack(
        Math.min(territoiresList[defenderTerritoireId].troops, 2),
        result.value
      );
    }

    console.log(defenderLostTroops, attackerLostTroops);
    // Enlever les troops
    if (defenderLostTroops > 0) {
      removeTroopsFromTerritory(defenderTerritoireId, defenderLostTroops);
      addTroopsChangeParticle(
        defenderTerritoireId,
        territoiresList[defenderTerritoireId].playerId,
        -defenderLostTroops
      );
    }
    if (attackerLostTroops > 0) {
      removeTroopsFromTerritory(attackerTerritoireId, attackerLostTroops);
      addTroopsChangeParticle(
        attackerTerritoireId,
        data.currentPlayerId,
        -attackerLostTroops
      );
    }

    if (territoiresList[defenderTerritoireId].troops <= 0) {
      const defenderPlayerId = territoiresList[defenderTerritoireId].playerId;
      takeOverTerritoryFromTerritory(
        attackerTerritoireId,
        defenderTerritoireId,
        data.currentPlayerId,
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
          data.currentPlayerId,
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

function startFortifyPhase(playerCount, callback) {
  console.log("startFortifyPhase");
  updateCurrentPhase(EPhases.FORTIFY);

  const ownedTerritoriesIds = Object.keys(territoiresList).filter(
    (territoireId) =>
      territoiresList[territoireId].playerId === data.currentPlayerId
  );
  const territoiresSvgs = ownedTerritoriesIds.map((territoireId) =>
    document.getElementById(territoireId)
  );

  const turnHudAction = document.getElementById("turn-hud-action");
  turnHudAction.addEventListener("click", nextHandler);

  function nextHandler() {
    setSelectedTerritoire(null);

    // On doit supprimer le handler manuellement sans utiliser { once: true } car nextHandler peut etre appeler manuellement.
    turnHudAction.removeEventListener("click", nextHandler);

    for (const territoireSvg of territoiresSvgs) {
      territoireSvg.removeEventListener("click", territoireHandler);
    }

    callback();
  }

  async function territoireHandler() {
    if (!data.selectedTerritoire) {
      if (territoiresList[this.id].troops > 1) {
        setSelectedTerritoire(this.id);
      }
      return;
    }

    const reachables = getReachableTerritories(data.selectedTerritoire);
    if (reachables.includes(this.id)) {
      const popup = new CountPopup({
        min: 1,
        max: territoiresList[data.selectedTerritoire].troops - 1,
      });

      const result = await popup.show();

      if (result.cancel === false && result.value > 0) {
        moveTroopsFromTerritory(
          data.selectedTerritoire,
          this.id,
          data.currentPlayerId,
          result.value
        );

        nextHandler();
      }
    } else {
      setSelectedTerritoire(
        territoiresList[this.id].troops > 1 ? this.id : null
      );
    }
  }

  for (const territoireSvg of territoiresSvgs) {
    territoireSvg.addEventListener("click", territoireHandler);
  }
}

function startOneRound(playerCount, callback) {
  startDraftPhase(playerCount, () => {
    if (!gameFinished) {
      let nextPlayerId = data.currentPlayerId;
      do {
        nextPlayerId = utils.getNextPlayerId(nextPlayerId, playerCount);
        console.log(nextPlayerId, playersList[nextPlayerId]);
      } while (
        playersList[nextPlayerId].dead &&
        nextPlayerId !== data.currentPlayerId
      );

      if (nextPlayerId === data.currentPlayerId) {
        gameFinished = true;
      } else {
        setCurrentPlayer(nextPlayerId);
      }
    }
    callback();
  });
}

function startMainLoop(playerCount, callback) {
  let handler = () => {
    if (gameFinished) {
      callback();
      return;
    }

    // Commence un rounde
    startOneRound(playerCount, handler);
  };

  // Demarage de la boucle
  handler();
}

document.addEventListener("DOMContentLoaded", function () {
  const autoPlacement = false;
  const playerCount = 6;
  // Where does the bots start if there is any. Else set to 0
  const botPlayerStart = 2;

  // Initialization des troops
  for (let playerId = 1; playerId <= playerCount; playerId++) {
    playersList[playerId].troops = getStartingTroops(playerCount);
    if (botPlayerStart && playerId >= botPlayerStart) {
      playersList[playerId].bot = new RandomBot({ playerId: playerId });
    }
  }

  // Création dynamiques du side player hud
  initializePlayersHud(playerCount);

  setCurrentPlayer(
    utils.getRandomStartingPlayer(
      botPlayerStart > 0 ? botPlayerStart - 1 : playerCount
    )
  );

  const [distributionFn, placementFn] = autoPlacement
    ? [startRandomTerritoryDistribution, startRandomTroopsPlacement]
    : [startTurnTerritoriesSelection, startTurnTroopsPlacement];

  distributionFn(playerCount, () => {
    console.log("Selection is done");

    placementFn(playerCount, () => {
      console.log("Distribution is done");

      startMainLoop(playerCount, () => {
        console.log("Main game loop is done");
      });
    });
  });

  let containerPays = document.getElementById("pays-background");
  containerPays.addEventListener("click", function () {
    if (data.currentPhase != EPhases.DRAFT) {
      setSelectedTerritoire(null);
      setAttackableTerritoires([]);
    }
  });
  resizeObserver.observe(document.body);
  window.addEventListener("resize", updatePastillesPosition);
});
