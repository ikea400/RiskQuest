import { data, EPhases, territoiresList, playersList } from "./data.js";
import { countPlayerTerritoires, countPlayerTroops } from "./logic.js";
import * as utils from "./utils.js";

export function updatePastillesPosition() {
  const pastilles = document.getElementsByClassName("pastille");
  for (let i = 0; i < pastilles.length; i++) {
    // Get the bounding box of the path
    const territoireId = pastilles.item(i).getAttribute("territoire");
    const territoire = document.getElementById(territoireId);
    const bbox = territoire.getBoundingClientRect();

    const offset = territoiresList[territoireId].pastille ?? { x: 0.5, y: 0.5 };
    // Calculate the center of the bounding box
    const centerX = bbox.x + bbox.width * (offset.x || 0.5);
    const centerY = bbox.y + bbox.height * (offset.y || 0.5);

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

export function changeBackgroundPlayer(element, oldPLayerId, newPlayerId) {
  element.classList.remove(`background-player${oldPLayerId}`);
  element.classList.add(`background-player${newPlayerId}`);
}

export function updateTerritoryOwer(territoireId, playerId) {
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

export function updatePlayersHudTerritoireCount(playerId) {
  let element = document.getElementById(
    `side-player-info-territories-${playerId}`
  );
  element.innerText = countPlayerTerritoires(playerId);
}

export function updatePlayerHudTroopsCount(playerId) {
  let element = document.getElementById(`side-player-info-troops-${playerId}`);
  element.innerText = countPlayerTroops(playerId);
}

export function updatePastilleTroopsCount(territoireId) {
  const element = document.getElementById(`pastille-${territoireId}`);
  element.innerText = territoiresList[territoireId].troops || 0;
}

export function updatePhaseTroopsCount(troopsCount) {
  const turnHubActionTroopsCount = document.getElementById(
    "turn-hub-action-troops-count"
  );
  turnHubActionTroopsCount.innerText = troopsCount;
}

export function initializePlayersHud(playerCount) {
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

export function updatePhaseHudPlayer(oldPlayerId, playerId) {
  let element = getPhaseElement(data.currentPhase);

  if (element) {
    changeBackgroundPlayer(element, oldPlayerId, playerId);
  }
}

export function updateCurrentPhase(phase) {
  if (phase === data.currentPhase) {
    throw new Error(
      `updateCurrentPhase was called with the same phase as the current one: ${phase.description}`
    );
  }

  // Remove the class from the current phase's element
  const currentElement = getPhaseElement(data.currentPhase);
  if (currentElement) {
    currentElement.classList.remove(`background-player${data.currentPlayerId}`);
  }

  // Add/remove the class for the new phase's element
  const newElement = getPhaseElement(phase);
  if (newElement) {
    newElement.classList.add(`background-player${data.currentPlayerId}`);
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
    turnHubActionTroopsCount.innerText =
    playersList[data.currentPlayerId].troops;
  } else if (data.currentPhase === EPhases.DRAFT) {
    const turnHubActionImg = document.getElementById("turn-hub-action-img");
    turnHubActionImg.src = "./assets/images/chevrons-right-solid.svg";
    const turnHubActionTroopsCount = document.getElementById(
      "turn-hub-action-troops-count"
    );
    turnHubActionTroopsCount.hidden = true;
  }

  // Update the current phase
  data.currentPhase = phase;
}

export function setAttackableTerritoires(territoiresId) {
  utils.removeCssClass("attackable-territory");
  for (const territoireId of territoiresId) {
    const territoire = document.getElementById(territoireId);
    territoire.classList.add("attackable-territory");
    // Déplace l'element a la fin de son parent pour qu'il soit afficher pardessus ces frère
    // pour permettre a sont stroke d'aparraite et ne pas etre cacher.
    territoire.parentElement.appendChild(territoire);
  }
}
