import * as utils from "./utils.js";
import {
  getStartingTroops,
  data,
  EPhases,
  territoiresList,
  playersList,
  setMusicVolume,
  setSFXVolume,
  gameCards,
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
  drawCard,
  claimCards,
  getBestSetForTroops,
  discardCards,
} from "./logic.js";
import {
  updatePastillesPosition,
  setAttackableTerritoires,
  initializePlayersHud,
  updateCurrentPhase,
  addTroopsChangeParticle,
  updatePastilleFakeTroops,
} from "./display.js";
import { initializeGame, saveMove, setAsGest } from "../api/gameDataService.js";
import { CountPopup, AttackPopup, SettingsPopup, CardPopup } from "../popup.js";

import RandomBot from "../bot/bot.js";

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
/**
 * Démarre la phase de sélection des territoires pour les joueurs.
 * @param {number} playerCount - Nombre total de joueurs participant au jeu.
 * @param {Function} callback - Fonction à appeler lorsque tous les territoires ont été sélectionnés.
 */
function startTurnTerritoriesSelection(playerCount, callback) {
  // Mise à jour de la phase courante à l'état de sélection
  updateCurrentPhase(EPhases.PICKING);

  // Obtient tous les éléments HTML représentant des territoires
  const territoires = document.getElementsByClassName("territoire");

  // Identifiant du joueur en cours
  let playerId = data.currentPlayerId;

  /**
   * Gestionnaire d'événements pour le clic sur un territoire.
   */
  function handler() {
    const territoireId = this.id;

    // Prend possession du territoire pour le joueur en cours
    takeOverTerritory(territoireId, playerId, 1);

    // Vérifie s'il reste des territoires non sélectionnés
    if (
      Object.values(territoiresList).some((territoire) => !territoire.playerId)
    ) {
      // Passe au joueur suivant
      playerId = utils.getNextPlayerId(playerId, playerCount);
      setCurrentPlayer(playerId);

      // Si le joueur suivant est un bot, sélectionne automatiquement un territoire
      if (playersList[playerId].bot) {
        document
          .getElementById(playersList[playerId].bot.pickTerritory())
          .dispatchEvent(new Event("click"));
      }
    } else {
      // Tous les territoires ont été sélectionnés, exécute le callback
      callback();
    }
  }

  // Ajoute un gestionnaire de clic pour chaque territoire disponible
  for (const territoire of territoires) {
    if (territoiresList[territoire.id]) {
      territoire.addEventListener("click", handler, { once: true });
    }
  }
}

/**
 * Démarre la phase de placement des troupes pour les joueurs.
 * @param {number} playerCount - Nombre total de joueurs participant au jeu.
 * @param {Function} callback - Fonction à appeler lorsque toutes les troupes ont été placées.
 */
function startTurnTroopsPlacement(playerCount, callback) {
  // Mise à jour de la phase courante à l'état de placement
  updateCurrentPhase(EPhases.PLACING);

  // Obtient tous les éléments HTML représentant des territoires
  const territoires = document.getElementsByClassName("territoire");

  // Identifiant du joueur en cours
  let playerId = data.currentPlayerId;

  /**
   * Gestionnaire d'événements pour le clic sur un territoire.
   */
  function handler() {
    const territoireId = this.id;

    // Vérifie si le territoire appartient au joueur en cours
    if (territoiresList[territoireId].playerId !== playerId) return;

    // Déplace une troupe du joueur vers ce territoire
    moveTroopsFromPlayer(territoireId, playerId, 1);

    // Vérifie s'il reste des troupes à placer pour un joueur
    if (
      Object.values(playersList).some(
        (player) => player !== undefined && player.troops > 0
      )
    ) {
      // Passe au joueur suivant
      playerId = utils.getNextPlayerId(playerId, playerCount);
      setCurrentPlayer(playerId);

      // Si le joueur suivant est un bot, sélectionne automatiquement un territoire
      if (playersList[playerId].bot) {
        document
          .getElementById(playersList[playerId].bot.pickStartTroop())
          .dispatchEvent(new Event("click"));
      }
    } else {
      // Une fois que toutes les troupes ont été placées, retire les gestionnaires d'événements
      for (const territoire of territoires) {
        if (territoiresList[territoire.id]) {
          territoire.removeEventListener("click", handler);
        }
      }

      // Tous les territoires sont mis à jour après le placement des troupes
      callback();
    }
  }

  // Ajoute un gestionnaire de clic pour chaque territoire disponible
  for (const territoire of territoires) {
    if (territoiresList[territoire.id]) {
      territoire.addEventListener("click", handler);
    }
  }

  // Si le joueur actuel est un bot, déclenche automatiquement l'action de placement
  if (playersList[playerId].bot) {
    document
      .getElementById(playersList[playerId].bot.pickStartTroop())
      .dispatchEvent(new Event("click"));
  }
}

/**
 * Répartit aléatoirement les territoires entre les joueurs.
 * @param {number} playerCount - Nombre total de joueurs participant au jeu.
 * @param {Function} callback - Fonction à appeler une fois que tous les territoires ont été distribués.
 */
function startRandomTerritoryDistribution(playerCount, callback) {
  // Liste des identifiants de territoires disponibles
  let territoires = Object.keys(territoiresList);

  // Identifiant du joueur en cours
  let playerId = data.currentPlayerId;

  // Boucle jusqu'à ce que tous les territoires soient distribués
  do {
    // Sélectionne un territoire aléatoire parmi ceux restants
    let territoireIndex = utils.randomInteger(0, territoires.length - 1);

    // Assigne ce territoire au joueur courant
    takeOverTerritory(territoires[territoireIndex], playerId, 1);

    // Retire le territoire sélectionné de la liste
    territoires.splice(territoireIndex, 1);

    // Passe au joueur suivant
    playerId = utils.getNextPlayerId(playerId, playerCount);
  } while (territoires.length > 0);

  // Appelle le callback après avoir distribué tous les territoires
  callback();
}

/**
 * Place les troupes aléatoirement sur les territoires des joueurs.
 * @param {number} playerCount - Nombre total de joueurs participant au jeu.
 * @param {Function} callback - Fonction à appeler une fois que toutes les troupes ont été placées.
 */
function startRandomTroopsPlacement(playerCount, callback) {
  // Parcourt chaque joueur
  for (let playerId = 1; playerId <= playerCount; playerId++) {
    const player = playersList[playerId];

    // Liste des territoires appartenant au joueur courant
    let territoires = Object.keys(territoiresList).filter(
      (territoireId) => territoiresList[territoireId].playerId == playerId
    );

    // Place toutes les troupes du joueur sur ses territoires
    while (player.troops > 0) {
      // Sélectionne un territoire aléatoire appartenant au joueur
      let territoireIndex = utils.randomInteger(0, territoires.length - 1);

      // Ajoute une troupe sur ce territoire
      moveTroopsFromPlayer(territoires[territoireIndex], playerId, 1);
    }
  }

  // Appelle le callback après que toutes les troupes ont été placées
  callback();
}

function startDraftPhase(playerCount, callback) {
  //the move value defines the players actions during this draft phase
  const Move = {
    player: data.currentPlayerId,
    draft: {},
  };

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

  console.log(playersList[data.currentPlayerId].cards.length);
  if(playersList[data.currentPlayerId].cards.length >= 5){
    let cards = getBestSetForTroops();
    console.log(cards);
    addTroops(data.currentPlayerId, claimCards(cards));
    discardCards(data.currentPlayerId, cards);
    console.log(playersList[data.currentPlayerId].cards);
  }

  if (playersList[data.currentPlayerId].bot) {
    const drafts = playersList[data.currentPlayerId].bot.pickDraftTroops();
    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      setTimeout(() => {
        moveTroopsFromPlayer(
          draft.territoire,
          data.currentPlayerId,
          draft.troops
        );
        addTroopsChangeParticle(
          draft.territoire,
          data.currentPlayerId,
          draft.troops
        );
      }, data.botSpeed.delay * (i + 1));
    }

    // Attendre un peu avant de passer au prochain stage pour laisser l'utilisateur voir les choix
    setTimeout(() => {
      startAttackPhase(playerCount, callback);
    }, data.botSpeed.delay * (drafts.length + 1));
  } else {
    async function territoireHandler() {
      const popup = new CountPopup({
        min: 1,
        max: playersList[data.currentPlayerId].troops,
        tempCallback: (value) => {
          updatePastilleFakeTroops(this.id, value);
        },
      });
      const result = await popup.show();

      // S'assurer que les fake troops ne reste pas afficher
      updatePastilleFakeTroops(this.id, 0);

      if (result.cancel === false && result.value > 0) {
        moveTroopsFromPlayer(this.id, data.currentPlayerId, result.value);
        addTroopsChangeParticle(this.id, data.currentPlayerId, result.value);
        //the drafted troops are add to move data
        Move.draft[this.id] = result.value;

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

          //send the draft move data to the api
          console.log(Move);
          saveMove({
            players: playersList,
            territories: territoiresList,
            move: Move,
          }).catch((error) => {
            console.log("Error at api.php when saving draft move: " + error);
          });
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
}

function startAttackPhase(playerCount, callback) {
  let canGetCard = false;
  const Move = {
    player: data.currentPlayerId,
    attacks: {},
  };

  console.log("startAttackPhase");
  updateCurrentPhase(EPhases.ATTACK);

  if (playersList[data.currentPlayerId].bot) {
    const bot = playersList[data.currentPlayerId].bot;
    let limit = 10;

    const handler = () => {
      setTimeout(() => {
        const attack = bot.pickAttack();
        if (!attack || limit-- <= 0) {
          return startFortifyPhase(playerCount, callback, canGetCard);
        }

        const attackerTerritoireId = attack.attacker;
        const defenderTerritoireId = attack.defender;
        console.log(attack);

        const [defenderLostTroops, attackerLostTroops] = utils.blitzAttack(
          territoiresList[defenderTerritoireId].troops,
          territoiresList[attackerTerritoireId].troops - 1
        );
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
          canGetCard = true;
          document.getElementById("canon-sound").load();
          document.getElementById("canon-sound").play();

          const defenderPlayerId =
            territoiresList[defenderTerritoireId].playerId;
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

          let count = 2;
          if (territoiresList[attackerTerritoireId].troops > 3) {
            count = bot.pickPostAttack(
              attackerTerritoireId,
              defenderTerritoireId,
              2
            );
          } else {
            count = territoiresList[attackerTerritoireId].troops - 1;
          }

          moveTroopsFromTerritory(
            attackerTerritoireId,
            defenderTerritoireId,
            data.currentPlayerId,
            count
          );
        } else {
          document.getElementById("protect-sound").load();
          document.getElementById("protect-sound").play();
        }

        handler();
      }, data.botSpeed.delay);
    };
    handler();
  } else {
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

      //send the attack move data to the api
      console.log(Move);
      saveMove({
        players: playersList,
        territories: territoiresList,
        move: Move,
      }).catch((error) => {
        console.log("Error at api.php when saving attack move: " + error);
      });

      startFortifyPhase(playerCount, callback, canGetCard);
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

      // Add attacks result to the Move object,
      //each attack has a attackerTerritoireId-defenderTerritoireId key
      Move.attacks[`${attackerTerritoireId}-${defenderTerritoireId}`] = {
        defenderLostTroops: defenderLostTroops,
        attackerLostTroops: attackerLostTroops,
      };

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

        canGetCard = true;
        document.getElementById("canon-sound").load();
        document.getElementById("canon-sound").play();
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
            tempCallback: (value) => {
              updatePastilleFakeTroops(defenderTerritoireId, value);
              updatePastilleFakeTroops(attackerTerritoireId, -value);
            },
          });

          const result = await popup.show();

          // S'assurer que les fake troops ne reste pas afficher
          updatePastilleFakeTroops(defenderTerritoireId, 0);
          updatePastilleFakeTroops(attackerTerritoireId, 0);

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

          //add the troops displacement after the attack to the move data
          Move.attacks[
            `${attackerTerritoireId}-${defenderTerritoireId}`
          ].movedTroops = count;
        }
      } else {
        document.getElementById("protect-sound").load();
        document.getElementById("protect-sound").play();
      }

      setSelectedTerritoire(null);
      setAttackableTerritoires([]);
    }

    for (const territoireSvg of territoiresSvgs) {
      territoireSvg.addEventListener("click", territoireHandler);
    }
  }
}

function startFortifyPhase(playerCount, callback, canGetCard) {
  const Move = {
    player: data.currentPlayerId,
    fortifyDraft: {},
  };

  console.log("startFortifyPhase");
  updateCurrentPhase(EPhases.FORTIFY);
  if(canGetCard){
    console.log("Pickacard")
    drawCard(data.currentPlayerId);
    console.log(playersList[data.currentPlayerId].cards)
  }
  if (playersList[data.currentPlayerId].bot) {
    setTimeout(() => {
      const bot = playersList[data.currentPlayerId].bot;
      const fortify = bot.pickFortify();

      if (fortify) {
        moveTroopsFromTerritory(
          fortify.from,
          fortify.to,
          data.currentPlayerId,
          fortify.troops
        );
        Move.fortifyDraft[fortify.to] = fortify.troops;
      }
      callback();
    }, data.botSpeed.delay);
  } else {
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

      //send the fortify move data to the api
      console.log(Move);
      saveMove({
        players: playersList,
        territories: territoiresList,
        move: Move,
      }).catch((error) => {
        console.log("Error at api.php when saving fortify move: " + error);
      });
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
          tempCallback: (value) => {
            updatePastilleFakeTroops(this.id, value);
            updatePastilleFakeTroops(data.selectedTerritoire, -value);
          },
        });

        const result = await popup.show();

        // S'assurer que les fake troops ne reste pas afficher
        updatePastilleFakeTroops(this.id, 0);
        updatePastilleFakeTroops(data.selectedTerritoire, 0);

        if (result.cancel === false && result.value > 0) {
          moveTroopsFromTerritory(
            data.selectedTerritoire,
            this.id,
            data.currentPlayerId,
            result.value
          );

          //the drafted troops are saved in move data
          Move.fortifyDraft[this.id] = result.value;
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

function cardHandler() {
  if (document.getElementById("popup-cards-container") == null) {
    const popup = new CardPopup({});
    popup.show();

    let card = document.getElementsByClassName("card-wrapper");

    let country = document.getElementById("alaska").cloneNode(false);
    country.id = "territory-card";
    country.classList.remove("territoire");
    country.classList.remove("attackable-territory");

    let svgWrapper = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    svgWrapper.classList.add("svg-card");

    svgWrapper.setAttribute("preserveAspectRatio", "xMidYMid meet");

    svgWrapper.appendChild(country);

    card[0].appendChild(svgWrapper);

    const bbox = country.getBBox();
    svgWrapper.setAttribute(
      "viewBox",
      `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
    );
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const enLigne = true;
  const autoPlacement = true;
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
      botPlayerStart > 1 ? botPlayerStart - 1 : playerCount
    )
  );

  const [distributionFn, placementFn] = autoPlacement
    ? [startRandomTerritoryDistribution, startRandomTroopsPlacement]
    : [startTurnTerritoriesSelection, startTurnTroopsPlacement];

  const setAsGestFn = enLigne
    ? async () =>
        sessionStorage.getItem("token") ? { success: false } : setAsGest()
    : async () => {
        return { success: false };
      };

  //met le player a guest avant chaque partie TEMPORAIREMENT
  setAsGestFn()
    .then((response) => {
      if (response.success === true) {
        sessionStorage.setItem("token", response.token);
        sessionStorage.setItem("saved-username", response.name);
        sessionStorage.setItem("saved-userId", response.id);
        sessionStorage.setItem("guest", true);
      } else {
        console.log([response.error || "Erreur inconnue"]);
      }
    })
    .then(() => {
      distributionFn(playerCount, () => {
        console.log("Selection is done");

        placementFn(playerCount, () => {
          playersList[1].userId = sessionStorage.getItem("saved-userId");
          //create game with player info
          initializeGame({
            players: playersList,
            playerCount: playerCount,
          })
            .then((value) => {
              playersList[7] = value["gameId"];
              //nesting saveMove beacause it is dependent on playersList, save the move only after receiving game_id
              //make inital move to save inital territory and troop distribution
              console.log("Game id: " + value["game_id"]);
              saveMove({
                players: playersList,
                territories: territoiresList,
                move: { player: 0 },
              }).catch((error) => {
                console.log(
                  "Error at api.php when making inital move: " + error
                );
              });
            })
            .catch((error) => {
              console.log("Error at api.php when initializing game: " + error);
            });

          console.log("Distribution is done");

          startMainLoop(playerCount, () => {
            console.log("Main game loop is done");
          });
        });
      });
    });

  let containerPays = document.getElementById("pays-background");
  containerPays.addEventListener("click", function () {
    document
      .getElementById("sea-music")
      .play()
      .catch((error) => {
        console.error(error);
      });

    if (data.currentPhase != EPhases.DRAFT) {
      setSelectedTerritoire(null);
      setAttackableTerritoires([]);
    }
  });

  let settingsButton = document.getElementById("settings-button");
  settingsButton.addEventListener("click", async () => {
    const popup = new SettingsPopup({
      music: setMusicVolume,
      sfx: setSFXVolume,
      volumeMusic: document.getElementById("sea-music").volume,
      volumeSFX: document.getElementById("charge1-sound").volume,
      speed: (speed) => {
        data.botSpeed = speed;
      },
      currentSpeed: data.botSpeed,
    });
    await popup.show();
  });

  new ResizeObserver(updatePastillesPosition).observe(document.body);
  window.addEventListener("resize", updatePastillesPosition);
  // établir le popup des cartes quand on clique sur l'image des cartes
  document.getElementById("cards-img").addEventListener("click", cardHandler);

  const list = [];
  for (const territoireId in territoiresList) {
    const element = document.getElementById(territoireId);
    const bbox = element.getBBox();
    list.push({
      id: territoireId,
      path: document.getElementById(territoireId).getAttribute("d"),
      pastille: territoiresList[territoireId].pastille,
      bbox: { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height },
    });
  }

  console.log(JSON.stringify(list));
});
