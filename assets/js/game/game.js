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
  CardType,
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
  takeCardsFrom,
  possessTerritory,
  addTroopsToTerritory,
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
  const currentMove = {
    player: data.currentPlayerId,
    draft: [],
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
  if (playersList[data.currentPlayerId].cards.length >= 5) {
    let cards = getBestSetForTroops();
    console.log(cards);
    addTroops(data.currentPlayerId, claimCards(cards));
    if (possessTerritory(cards) !== null) {
      addTroopsToTerritory(possessTerritory(cards), 2);
    }
    discardCards(data.currentPlayerId, cards);
    console.log(playersList[data.currentPlayerId].cards);
  }

  const nextPhase = () => {
    startAttackPhase(playerCount, callback);

    //send the draft move data to the api
    console.log(currentMove);
    saveMove({
      players: playersList,
      territories: territoiresList,
      move: currentMove,
    }).catch((error) => {
      console.log("Error at api.php when saving draft move: " + error);
    });
  };

  const putTroops = (territoireId, troopsCount) => {
    moveTroopsFromPlayer(territoireId, data.currentPlayerId, troopsCount);
    addTroopsChangeParticle(territoireId, data.currentPlayerId, troopsCount);
    //the drafted troops are add to move data
    currentMove.draft.push({
      territoireId,
      troopsCount,
    });
  };

  if (playersList[data.currentPlayerId].bot) {
    const drafts = playersList[data.currentPlayerId].bot.pickDraftTroops();
    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      setTimeout(() => {
        putTroops(draft.territoire, draft.troops);
      }, data.botSpeed.delay * (i + 1));
    }

    // Attendre un peu avant de passer au prochain stage pour laisser l'utilisateur voir les choix
    setTimeout(() => {
      nextPhase();
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
        putTroops(this.id, result.value);

        // Tous les pieces ont été placé
        if (playersList[data.currentPlayerId].troops <= 0) {
          // Enlever tous les listener sur les territoires
          for (const territoire of ownedTerritoriesIds) {
            document
              .getElementById(territoire)
              .removeEventListener("click", territoireHandler);
          }
          setAttackableTerritoires([]);
          nextPhase();
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
  const currentMove = {
    player: data.currentPlayerId,
    attacks: [],
  };

  const nextPhase = () => {
    //send the attack move data to the api
    console.log(currentMove);
    saveMove({
      players: playersList,
      territories: territoiresList,
      move: currentMove,
    }).catch((error) => {
      console.log("Error at api.php when saving attack move: " + error);
    });

    startFortifyPhase(playerCount, callback, canGetCard);
  };

  const doAttack = (defenderTerritoireId, attackerTerritoireId, attackMode) => {
    // Calculer le nombre de troops perdu des deux bords.
    let defenderLostTroops;
    let attackerLostTroops;
    if (attackMode === 0) {
      [defenderLostTroops, attackerLostTroops] = utils.blitzAttack(
        territoiresList[defenderTerritoireId].troops,
        territoiresList[attackerTerritoireId].troops - 1
      );
    } else {
      [defenderLostTroops, attackerLostTroops] = utils.classicAttack(
        Math.min(territoiresList[defenderTerritoireId].troops, 2),
        attackMode
      );
    }

    // Add attacks result to the Move object,
    //each attack has a attackerTerritoireId-defenderTerritoireId key
    currentMove.attacks.push({
      defenderTerritoireId,
      attackerTerritoireId,
      defenderLostTroops,
      attackerLostTroops,
    });

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
  };

  const doTakeOver = (defenderTerritoireId, attackerTerritoireId) => {
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

    if (checkPlayerDeadState(defenderPlayerId)) {
      takeCardsFrom(data.currentPlayerId, defenderPlayerId);
    }
  };

  const doMoveTroops = (
    defenderTerritoireId,
    attackerTerritoireId,
    troopsCount
  ) => {
    moveTroopsFromTerritory(
      attackerTerritoireId,
      defenderTerritoireId,
      data.currentPlayerId,
      troopsCount
    );

    //add the troops displacement after the attack to the move data
    currentMove.attacks.push({
      defenderTerritoireId,
      attackerTerritoireId,
      movedTroops: troopsCount,
    });
  };

  const doAttackFailed = () => {
    document.getElementById("protect-sound").load();
    document.getElementById("protect-sound").play();
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
          return nextPhase();
        }

        const attackerTerritoireId = attack.attacker;
        const defenderTerritoireId = attack.defender;
        console.log(attack);

        doAttack(defenderTerritoireId, attackerTerritoireId, 0);

        if (territoiresList[defenderTerritoireId].troops <= 0) {
          doTakeOver(defenderTerritoireId, attackerTerritoireId);

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

          doMoveTroops(defenderTerritoireId, attackerTerritoireId, count);
        } else {
          doAttackFailed();
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

      nextPhase();
    }
    turnHudAction.addEventListener("click", nextHandler, { once: true });

    async function territoireHandler() {
      if (
        territoiresList[this.id].playerId === data.currentPlayerId &&
        territoiresList[this.id].troops > 1
      ) {
        setSelectedTerritoire(this.id);
        setAttackableTerritoires(getAttackableNeighbour(this.id));
      }

      if (!data.selectedTerritoire || data.selectedTerritoire === this.id) {
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

      doAttack(defenderTerritoireId, attackerTerritoireId, result.value);

      if (territoiresList[defenderTerritoireId].troops <= 0) {
        doTakeOver(defenderTerritoireId, attackerTerritoireId);

        let count = 2;
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

          if (result.value > 1) {
            count = result.value;
          }
        }

        if (count > 0) {
          doMoveTroops(defenderTerritoireId, attackerTerritoireId, count);
        }
      } else {
        doAttackFailed();
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
  if (canGetCard) {
    console.log("Pickacard");
    drawCard(data.currentPlayerId);
    console.log(playersList[data.currentPlayerId].cards);
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
    // afficher les cartes si c'est le tour d'un joueur
    if (playersList[data.currentPlayerId].bot) {
      document
        .getElementsByClassName("cards-container")[0]
        .classList.add("hidden");
    } else {
      document
        .getElementsByClassName("cards-container")[0]
        .classList.remove("hidden");
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

    // generer les images des cartes du joueur
    generateFullCardImages();
  }
}

function generateFullCardImages() {
  let location = document.getElementById("popup-cards-remaining-cards");
  let nbDeCartesTotal = playersList[data.currentPlayerId].cards.length;

  // pour chaque carte en main, assembler une image de carte pour représenter la carte
  for (let i = 0; i < nbDeCartesTotal; i++) {
    // obtenir les informations de la carte

    let card = document.createElement("img");
    let type = playersList[data.currentPlayerId].cards[i].type.description;
    let cardWrapper = document.createElement("div");

    card.classList.add("image-card");

    // Obtenir le type de carte pour l'image (cavalerie, canon, infanterie, joker)

    if (type == "JOKER") {
      card.src = "./assets/images/riskCardJoker.png";
      // ajouter la classe joker pour savoir quelle carte on manipule
      card.classList.add(type);
      cardWrapper.appendChild(card);
    } else {
      switch (type) {
        case "ARTILLERY":
          card.src = "./assets/images/riskCardCannon.png";
          break;
        case "CAVALRY":
          card.src = "./assets/images/riskCardCavalry.png";
          break;
        case "INFANTRY":
          card.src = "./assets/images/riskCardInfantry.png";
          break;
      }

      cardWrapper.appendChild(card);

      let name = playersList[data.currentPlayerId].cards[i].territory;
      let territory = document.getElementById(name).cloneNode(false);

      territory.id = "territory-card";
      territory.classList.remove("territoire");
      territory.classList.remove("attackable-territory");

      //ajouter les classes de la carte pour savoir quelle carte on manipule
      addClassesToCard(card, type, name);

      let svgWrapper = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      svgWrapper.classList.add("svg-card");

      svgWrapper.setAttribute("preserveAspectRatio", "xMidYMid meet");

      let territoryName = document.createElement("p");
      territoryName.classList.add("territory-name-card");
      name = transformName(name);
      territoryName.innerText = name;

      svgWrapper.appendChild(territory);

      cardWrapper.appendChild(svgWrapper);
      cardWrapper.appendChild(territoryName);

      // doit faire un timeout pour que le viewbox du svg soit initialisé
      setTimeout(() => {
        const bbox = territory.getBBox();
        svgWrapper.setAttribute(
          "viewBox",
          `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
        );
      }, 0);
    }

    // ajouter le setOnClick pour la carte
    card.addEventListener("click", () => addOnClickToCard(cardWrapper));

    // assembler la carte

    cardWrapper.classList.add("card-wrapper");

    location.appendChild(cardWrapper);
  }
}
// ajouter la fonctionalité de clicker sur une carte pour la selectionner
function addOnClickToCard(card) {
  let deck = document.getElementById("popup-cards-remaining-cards");
  let bonusTroopsCountText = document.getElementById("extra-troops-count");
  // si la carte est dans la main, on peut l'ajouter a un des emplacement de carte selectionnés
  if (deck.contains(card)) {
    // le html id de l'emplacement ou la carte va aller sans le numéro
    let slot = "selected-card-";
    for (let i = 1; i <= 3 && i > 0; i++) {
      let slotId = slot + i;
      let selectedCardContainer = document.getElementById(slotId);
      if (selectedCardContainer.childElementCount == 0) {
        selectedCardContainer.appendChild(card);

        // sortir de la boucle for
        i = -1;
      }
    }

    if (
      document.getElementById("selected-card-1").childElementCount != 0 &&
      document.getElementById("selected-card-2").childElementCount != 0 &&
      document.getElementById("selected-card-3").childElementCount != 0
    ) {
      let bonusCount = obtainBonusTroopCount();
      bonusTroopsCountText.innerText = "+" + bonusCount;
    }
  } else {
    // si la carte fait partie de la selection, on la remet dans notre main
    deck.appendChild(card);
    bonusTroopsCountText.innerText = "+" + 0;
  }
}

function obtainBonusTroopCount() {
  // obtenir les elements html des cartes qu'on veut convertir en troop
  let SelectedCard1 =
    document.getElementById("selected-card-1").firstElementChild
      .firstElementChild;
  let SelectedCard2 =
    document.getElementById("selected-card-2").firstElementChild
      .firstElementChild;
  let SelectedCard3 =
    document.getElementById("selected-card-3").firstElementChild
      .firstElementChild;

  let deckArray = [];
  let playerArray = playersList[data.currentPlayerId].cards;

  // traverser la liste des cartes dans la main du joueur pour determiner quelles cartes sont selectionnées
  // et les ajouter dans un tableau
  let classList1 = SelectedCard1.classList;
  let classList2 = SelectedCard2.classList;
  let classList3 = SelectedCard3.classList;

  for (let i = 0; i < playerArray.length; i++) {
    // regarder si la carte i de la main fait partie des cartes selectionnées. Si oui, on la rajoute au tableau
    // on ne regarde pas pour les joker
    if (
      (classList1.contains(playerArray[i].type?.description) &&
        classList1.contains(playerArray[i].territory)) ||
      (classList2.contains(playerArray[i].type?.description) &&
        classList2.contains(playerArray[i].territory)) ||
      (classList3.contains(playerArray[i].type?.description) &&
        classList3.contains(playerArray[i].territory))
    ) {
      deckArray.push(playerArray[i]);
    }
  }
  let nbOfJokers = 3 - deckArray.length;

  for (let i = 0; i < playerArray.length && nbOfJokers > 0; i++) {
    if (playerArray[i].type.description == "JOKER") {
      deckArray.push(playerArray[i]);
      nbOfJokers--;
    }
  }
  console.log("deck to claim: ");
  console.log(deckArray);
  console.log("ammount returned: " + claimCards(deckArray));
  return claimCards(deckArray);
}

function addClassesToCard(card, type, name) {
  card.classList.add(type);
  card.classList.add(name);
}
// turns a territory html element ID into its name by adding spaces if needed
function transformName(name) {
  let newName = name.charAt(0).toUpperCase();
  for (let i = 1; i < name.length; i++) {
    if (name.charAt(i) == name.charAt(i).toUpperCase()) {
      newName += " " + name.charAt(i);
    } else {
      newName += name.charAt(i);
    }
  }
  return newName;
}

/*
 *  DOMContentLoaded
 */

document.addEventListener("DOMContentLoaded", function () {
  const enLigne = false;
  const autoPlacement = true;
  const playerCount = 6;
  // Where does the bots start if there is any. Else set to 0 for no bots. set to 2 for one player
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
              console.log("Game id: " + value["gameId"]);
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
});
