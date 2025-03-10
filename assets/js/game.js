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

const MIN_PLAYER_COUNT = 3;
const MAX_PLAYER_COUNT = 6;

function randomInteger(min, max) {
  return min + Math.round(Math.random() * (max - min));
}

function rollDice() {
  return randomInteger(1, 6);
}

function rollDices(count) {
  return Array.from({ length: count }, () => rollDice());
}

/**
 * Determines a random starting player by rolling dice for each player and narrowing down
 * to the player(s) with the highest rolls until one player remains.
 *
 * @param {number} playerCount - The total number of players (must be at least 1).
 * @returns {number} - The ID of the randomly selected starting player.
 */
function getRandomStartingPlayer(playerCount) {
  // Maximize attemps to avoid infinite loop. But should never be even close to 100 when we have up to 6 players.
  let attempts = 100;
  // Create an array of players with IDs from 1 to playerCount
  let players = Array.from({ length: playerCount }, (_, i) => i + 1);

  // Continue rolling dice until only one player remains
  while (players.length > 1 && --attempts > 0) {
    // Roll dice for each remaining player and store their player ID and dice value
    let dices = players.map((playerId) => ({
      playerId: playerId,
      dice: rollDice(),
    }));

    // Find the highest dice value rolled in this round
    const maxDice = Math.max(...dices.map((obj) => obj.dice));

    // Keep only the players who rolled the highest dice value (handle ties)
    dices = dices.filter((obj) => obj.dice === maxDice);

    // Update the list of remaining players based on the filtered results
    players = dices.map((obj) => obj.playerId);
  }

  // Return the last remaining player ID as the starting player
  return players[0];
}

/**
 * Retourne le nombre de troupes initial pour chaque joueur en fonction du nombre de joueurs.
 *
 * @param {number} playerCount - Le nombre de joueurs participant à la partie.
 * @returns {number} - Le nombre de troupes initial attribué à chaque joueur.
 * @throws {Error} - Lance une erreur si le nombre de joueurs est inférieur à MIN_PLAYER_COUNT ou supérieur à MAX_PLAYER_COUNT.
 *
 * @reference https://www.hasbro.com/common/instruct/risk.pdf
 * Si 3 joueurs participent, chaque joueur reçoit 35 unités d'infanterie.
 * Si 4 joueurs participent, chaque joueur reçoit 30 unités d'infanterie.
 * Si 5 joueurs participent, chaque joueur reçoit 25 unités d'infanterie.
 * Si 6 joueurs participent, chaque joueur reçoit 20 unités d'infanterie.
 */
function getStartingTroops(playerCount) {
  if (playerCount < MIN_PLAYER_COUNT || playerCount > MAX_PLAYER_COUNT) {
    throw new Error("There must be between 3 and 6 player");
  }

  const troopsList = [35, 30, 25, 20];
  return troopsList[playerCount - MIN_PLAYER_COUNT];
}

const EPhases = Object.freeze({
  NONE: Symbol("NONE"),
  PICKING: Symbol("PICKING"),
  PLACING: Symbol("PLACING"),
  DRAFT: Symbol("DRAFT"),
  ATTACK: Symbol("ATTACK"),
  FORTIFY: Symbol("FORTIFY"),
});

const territoiresList = {
  alaska: {
    continent: "north-america",
    connection: ["northwestTerritory", "alberta"],
  },
  northwestTerritory: {
    continent: "north-america",
    connection: ["alaska", "alberta", "ontario", "greenland"],
  },
  greenland: {
    continent: "north-america",
    connection: ["northwestTerritory", "ontario", "quebec"],
  },
  alberta: {
    continent: "north-america",
    connection: ["alaska", "northwestTerritory", "ontario", "westernUs"],
  },
  ontario: {
    continent: "north-america",
    connection: [
      "northwestTerritory",
      "alberta",
      "greenland",
      "quebec",
      "westernUs",
      "easternUs",
    ],
  },
  quebec: {
    continent: "north-america",
    connection: ["ontario", "greenland", "easternUs"],
  },
  westernUs: {
    continent: "north-america",
    connection: ["alberta", "ontario", "easternUs", "centralAmerica"],
  },
  easternUs: {
    continent: "north-america",
    connection: ["ontario", "quebec", "westernUs", "centralAmerica"],
  },
  centralAmerica: {
    continent: "north-america",
    connection: ["easternUs", "westernUs", "venezuela"],
  },
  venezuela: {
    continent: "south-america",
    connection: ["centralAmerica", "peru", "brazil"],
  },
  peru: {
    continent: "south-america",
    connection: ["venezuela", "brazil", "argentina"],
  },
  brazil: {
    continent: "south-america",
    connection: ["venezuela", "peru", "argentina"],
  },
  argentina: {
    continent: "south-america",
    connection: ["peru", "brazil"],
  },
};

const playersList = [
  undefined,
  {
    name: "Player01",
    img: "./assets/images/player1-profile.webp",
  },
  {
    name: "Player02",
    img: "./assets/images/player2-profile.webp",
  },
  {
    name: "Player03",
    img: "./assets/images/player3-profile.webp",
  },
  {
    name: "Player04",
    img: "./assets/images/player4-profile.webp",
  },
  {
    name: "Player05",
    img: "./assets/images/player5-profile.webp",
  },
  {
    name: "Player06",
    img: "./assets/images/player6-profile.webp",
  },
];

let currentPlayerId = 1;
let selectedTerritoire = undefined;
let currentPhase = EPhases.ATTACK;
let gameFinished = false;

function getAttackableNeighbour(territoire) {
  let playerId = territoiresList[territoire].playerId;
  let voisins = territoiresList[territoire].connection;
  let listFinales = [];
  for (const voisin of voisins) {
    if (territoiresList[voisin].playerId != playerId) {
      listFinales.push(voisin);
    }
  }
  return listFinales;
}

function getReachableTerritories(territoire) {
  playerId = territoiresList[territoire].playerId;
  let listeTemporaires = [territoire];
  let listFinales = [];
  do {
    const territoire = listeTemporaires.pop();
    listFinales.push(territoire);
    let voisins = territoiresList[territoire].connection;
    for (const voisin of voisins) {
      if (territoiresList[voisin].playerId === playerId) {
        if (
          !listeTemporaires.includes(voisin) &&
          !listFinales.includes(voisin)
        ) {
          listeTemporaires.push(voisin);
        }
      }
    }
  } while (listeTemporaires.length != 0);
  return listFinales;
}

function removeCssClass(cssClass) {
  const elements = Array.from(document.getElementsByClassName(cssClass));
  for (const element of elements) {
    element.classList.remove(cssClass);
  }
}

function countPlayerTerritoires(playerId) {
  let count = 0;
  for (const territoireId in territoiresList) {
    if (territoiresList[territoireId].playerId === playerId) {
      count++;
    }
  }
  return count;
}

function countPlayerTroops(playerId) {
  let count = playersList[playerId].troops;
  for (const territoireId in territoiresList) {
    if (territoiresList[territoireId].playerId === playerId) {
      count += territoiresList[territoireId].troops || 0;
    }
  }
  return count;
}

function takeOverTerritory(territoryId, playerId, troopsCount) {
  console.log(`takeOverTerritory(${territoryId}, ${playerId}, ${troopsCount})`);
  let player = playersList[playerId];
  if (player.troops <= 0) {
    throw new Error(
      `player${playerId} tried to take a territory with no troops left`
    );
  }

  let territoire = territoiresList[territoryId];
  if (territoire.playerId === playerId) {
    throw new Error(
      `player${playerId} tried to take a territory that he had already`
    );
  }

  let oldOwnerId = territoire.playerId;
  territoire.playerId = playerId;
  territoire.troops = 0;

  updateTerritoryColor(territoryId, playerId);

  if (oldOwnerId) updatePlayersHudTerritoireCount(oldOwnerId);
  updatePlayersHudTerritoireCount(playerId);

  moveTroops(territoryId, playerId, troopsCount);
}

function moveTroops(territoireId, playerId, troopsCount) {
  console.log(`moveTroops(${territoireId}, ${playerId}, ${troopsCount})`);
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
  territoire.troops += troopsCount;
  updatePastilleTroopsCount(territoireId);
}

function initializePlayersHud(playerCount) {
  let hudContent = "";
  for (let playerId = 1; playerId <= playerCount; playerId++) {
    const territoireCount = countPlayerTerritoires(playerId);
    const troopsCount = countPlayerTroops(playerId);
    hudContent += `<div class="side-player">
        <div class="background-player${playerId} side-player-color"></div>
        <div class="side-player-info">
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
      `updateCurrentPhase was called with the same phase as the current one: ${phase}`
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

  // Update the current phase
  currentPhase = phase;
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
  newDiv.style.position = "absolute";
  newDiv.style.left = centerX - 12.5 + "px";
  newDiv.style.top = centerY - 12.5 + "px";

  // Append the div to the body
  document.body.appendChild(newDiv);
}

function updateTerritoryColor(territoireId, playerId) {
  const territoire = territoiresList[territoireId];
  let territoireSvg = document.getElementById(territoireId);

  if (territoire.playerId)
    territoireSvg.classList.remove(`svg-player${territoire.playerId}`);
  territoireSvg.classList.add(`svg-player${playerId}`);

  let pastille = document.getElementById(`pastille-${territoireId}`);
  if (!pastille) {
    createPastille(territoireId, playerId);
  } else {
    changeBackgroundPlayer(pastille, territoire.playerId, playerId);
  }
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
    console.log("Test" + playerId);

    this.removeEventListener("click", handler);

    const territoireId = this.id;
    takeOverTerritory(territoireId, playerId, 1);

    if (
      Object.values(territoiresList).some((territoire) => !territoire.playerId)
    ) {
      // Some unselected territories remain
      playerId = (playerId % playerCount) + 1;
      setCurrentPlayer(playerId);
    } else {
      // All territories where selected
      callback();
    }
  }

  for (const territoire of territoires) {
    if (territoiresList[territoire.id]) {
      territoire.addEventListener("click", handler);
    }
  }
}

function startRandomTerritoryDistribution(playerCount) {
  let territoires = Object.keys(territoiresList);
  let playerId = currentPlayerId;
  do {
    let territoireIndex = randomInteger(0, territoires.length - 1);
    takeOverTerritory(territoires[territoireIndex], playerId, 1);
    territoires.splice(territoireIndex, 1);

    playerId = (playerId % playerCount) + 1;
  } while (territoires.length > 0);
}

function startRandomTroopsPlacement(playerCount) {
  for (let playerId = 1; playerId <= playerCount; playerId++) {
    const player = playersList[playerId];

    let territoires = Object.keys(territoiresList).filter(
      (territoireId) => territoiresList[territoireId].playerId == playerId
    );

    while (player.troops > 0) {
      let territoireIndex = randomInteger(0, territoires.length - 1);
      moveTroops(territoires[territoireIndex], playerId, 1);
    }
  }
}

function startDraftPhase(callback) {
  const territoiresCount = Object.values(territoiresList).filter(
    (territoire) => territoire.playerId === currentPlayerId
  ).length;

  startAttackPhase(callback);
}

function startAttackPhase(callback) {
  startFortifyPhase(callback);
  //startDraftPhase(callback);
}

function startFortifyPhase(callback) {
  callback();
}

function startOneRound(callback) {
  startDraftPhase(callback);
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

  // Initialization des tropps
  for (let i = 1; i <= playerCount; i++) {
    playersList[i].troops = getStartingTroops(playerCount);
  }

  // Création dynamiques du side player hud
  initializePlayersHud(playerCount);

  setCurrentPlayer(getRandomStartingPlayer(playerCount));

  startRandomTerritoryDistribution(playerCount);

  console.log("Selection is done");

  startRandomTroopsPlacement(playerCount);

  console.log("Distribution is done");
  startMainLoop();
  return;
  let pays = document.getElementsByClassName("pays");
  for (let continent of pays) {
    for (let territoire of continent.children) {
      territoire.addEventListener("click", function () {
        selectedTerritoire = this.id;

        // Remove any previously selected territorys
        removeCssClass("selected-territory");
        removeCssClass("attackable-territory");

        this.classList.add("selected-territory");
        continent.appendChild(this); // rerender

        console.log(territoiresList[this.id]);

        const attackables = getAttackableNeighbour(this.id);
        console.log(attackables);
        for (const attackable of attackables) {
          document
            .getElementById(attackable)
            .classList.add("attackable-territory");
        }
      });

      territoire.addEventListener("contextmenu", function (event) {
        event.preventDefault();

        removeCssClass("attackable-territory");
        const reachables = getReachableTerritories(this.id);
        console.log(reachables);
        for (const reachable of reachables) {
          document
            .getElementById(reachable)
            .classList.add("attackable-territory");
        }
      });
    }
  }

  let containerPays = document.getElementById("pays-background");
  containerPays.addEventListener("click", function () {
    selectedTerritoire = undefined;
    removeCssClass("selected-territory");
    removeCssClass("attackable-territory");
  });
});
