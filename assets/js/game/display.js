import { data, EPhases, territoiresList, playersList } from "./data.js";
import { countPlayerTerritoires, countPlayerTroops } from "./logic.js";
import * as utils from "./utils.js";

/**
 * Met à jour les positions des pastilles associées aux territoires en fonction
 * de leur emplacement dans l'interface utilisateur.
 *
 * Chaque pastille est centrée sur le territoire correspondant, en tenant compte
 * des décalages personnalisés s'ils sont définis.
 */
export function updatePastillesPosition() {
  const pastilles = document.getElementsByClassName("pastille");
  for (let i = 0; i < pastilles.length; i++) {
    // Obtient l'ID du territoire associé à la pastille
    const territoireId = pastilles.item(i).getAttribute("territoire");
    const territoire = document.getElementById(territoireId);
    const bbox = territoire.getBoundingClientRect();

    // Définit le décalage personnalisé ou utilise les valeurs par défaut
    const offset = territoiresList[territoireId].pastille ?? { x: 0.5, y: 0.5 };

    // Calcule les coordonnées du centre du rectangle
    const centerX = bbox.x + bbox.width * (offset.x || 0.5);
    const centerY = bbox.y + bbox.height * (offset.y || 0.5);

    // Met à jour la position de la pastille
    pastilles.item(i).style.left = `${centerX}px`;
    pastilles.item(i).style.top = `${centerY}px`;
  }
}

/**
 * Crée une pastille pour un territoire donné et l'ajoute au DOM.
 *
 * La pastille représente les informations visuelles associées au joueur et au territoire,
 * telles que le nombre de troupes.
 *
 * @param {string} territoireId - L'identifiant du territoire pour lequel la pastille est créée.
 * @param {number} playerId - L'identifiant du joueur propriétaire du territoire.
 */
function createPastille(territoireId, playerId) {
  const territoire = document.getElementById(territoireId);
  territoire.classList.add(`svg-player${playerId}`);

  // Obtient le rectangle délimitant le territoire
  const bbox = territoire.getBoundingClientRect();

  // Définit le décalage personnalisé ou utilise les valeurs par défaut
  const offset = territoiresList[territoireId].pastille ?? { x: 0.5, y: 0.5 };

  // Calcule le centre du rectangle en tenant compte du décalage
  const centerX = bbox.x + bbox.width * (offset.x || 0.5);
  const centerY = bbox.y + bbox.height * (offset.y || 0.5);

  // Crée un nouvel élément <div> pour représenter la pastille
  const newDiv = document.createElement("div");
  newDiv.id = `pastille-${territoireId}`;
  newDiv.classList.add(`background-player${playerId}`);
  newDiv.classList.add(`pastille`);
  newDiv.innerText = 1;
  newDiv.setAttribute("territoire", territoireId);
  newDiv.style.position = "fixed";
  newDiv.style.left = `${centerX}px`;
  newDiv.style.top = `${centerY}px`;

  // Ajoute la pastille au DOM
  document.body.appendChild(newDiv);
}

/**
 * Change la classe d'arrière-plan d'un élément pour refléter un nouveau joueur.
 *
 * @param {HTMLElement} element - L'élément dont la classe d'arrière-plan doit être modifiée.
 * @param {number} oldPlayerId - L'identifiant de l'ancien joueur.
 * @param {number} newPlayerId - L'identifiant du nouveau joueur.
 */
export function changeBackgroundPlayer(element, oldPlayerId, newPlayerId) {
  element.classList.remove(`background-player${oldPlayerId}`);
  element.classList.add(`background-player${newPlayerId}`);
}

/**
 * Met à jour le propriétaire d'un territoire, modifie son affichage visuel et réinitialise le nombre de troupes.
 *
 * @param {string} territoireId - L'identifiant du territoire à mettre à jour.
 * @param {number} playerId - L'identifiant du joueur qui devient le nouveau propriétaire du territoire.
 */
export function updateTerritoryOwer(territoireId, playerId) {
  const territoire = territoiresList[territoireId];
  const territoireSvg = document.getElementById(territoireId);

  // Supprime l'ancienne classe SVG du joueur précédent (le cas échéant)
  if (territoire.playerId)
    territoireSvg.classList.remove(`svg-player${territoire.playerId}`);
  territoireSvg.classList.add(`svg-player${playerId}`);

  // Gère la pastille associée au territoire
  let pastille = document.getElementById(`pastille-${territoireId}`);
  if (!pastille) {
    createPastille(territoireId, playerId);
  } else {
    changeBackgroundPlayer(pastille, territoire.playerId, playerId);
  }

  // Réinitialise le nombre de troupes et met à jour le propriétaire du territoire
  territoire.troops = 0;
  territoire.playerId = playerId;
}

/**
 * Met à jour l'affichage du nombre de territoires contrôlés par un joueur spécifique dans le HUD.
 *
 * @param {number} playerId - L'identifiant du joueur dont le nombre de territoires doit être mis à jour.
 */
export function updatePlayersHudTerritoireCount(playerId) {
  let element = document.getElementById(
    `side-player-info-territories-${playerId}`
  );
  element.innerText = countPlayerTerritoires(playerId);
}

/**
 * Met à jour l'affichage du nombre de troupes d'un joueur spécifique dans le HUD.
 *
 * @param {number} playerId - L'identifiant du joueur dont le nombre de troupes doit être mis à jour.
 */
export function updatePlayerHudTroopsCount(playerId) {
  let element = document.getElementById(`side-player-info-troops-${playerId}`);
  element.innerText = countPlayerTroops(playerId);
}

/**
 * Met à jour l'affichage du nombre de troupes présentes sur un territoire spécifique.
 *
 * @param {string} territoireId - L'identifiant du territoire dont le nombre de troupes doit être mis à jour.
 */
export function updatePastilleTroopsCount(territoireId) {
  const element = document.getElementById(`pastille-${territoireId}`);
  element.innerText = territoiresList[territoireId].troops || 0;
}

/**
 * Met à jour l'affichage du nombre de troupes dans l'interface utilisateur pour la phase actuelle.
 *
 * @param {number} troopsCount - Le nombre de troupes à afficher.
 */
export function updatePhaseTroopsCount(troopsCount) {
  const turnHubActionTroopsCount = document.getElementById(
    "turn-hub-action-troops-count"
  );
  turnHubActionTroopsCount.innerText = troopsCount;
}

/**
 * Initialise l'affichage du HUD des joueurs en fonction du nombre total de joueurs.
 *
 * Cette fonction génère dynamiquement le contenu HTML pour chaque joueur, incluant le nombre de territoires
 * et de troupes, et met à jour l'élément HUD correspondant dans l'interface utilisateur.
 *
 * @param {number} playerCount - Le nombre total de joueurs dans la partie.
 */
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

/**
 * Récupère l'élément HTML correspondant à une phase donnée.
 *
 * @param {Object} phase - La phase dont on souhaite obtenir l'élément.
 * @returns {HTMLElement|null} L'élément HTML correspondant à la phase, ou null si la phase est invalide.
 */
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

/**
 * Met à jour l'élément HUD de phase en modifiant le style de l'arrière-plan
 * pour refléter le joueur actuel.
 *
 * @param {number} oldPlayerId - L'identifiant du joueur précédent.
 * @param {number} playerId - L'identifiant du nouveau joueur.
 */
export function updatePhaseHudPlayer(oldPlayerId, playerId) {
  let element = getPhaseElement(data.currentPhase);

  if (element) {
    changeBackgroundPlayer(element, oldPlayerId, playerId);
  }

  updatePhaseTroopsCount(playersList[playerId].troops);
}

/**
 * Met à jour la phase actuelle du jeu et applique les modifications visuelles associées.
 *
 * @param {Object} phase - La nouvelle phase à définir.
 * @throws {Error} Lance une erreur si la phase passée est identique à la phase actuelle.
 */
export function updateCurrentPhase(phase) {
  if (phase === data.currentPhase) {
    throw new Error(
      `updateCurrentPhase was called with the same phase as the current one: ${phase.description}`
    );
  }

  // Retire la classe de l'élément de la phase actuelle
  const currentElement = getPhaseElement(data.currentPhase);
  if (currentElement) {
    currentElement.classList.remove(`background-player${data.currentPlayerId}`);
  }

  // Ajoute/retire la classe pour le nouvel élément de phase
  const newElement = getPhaseElement(phase);
  if (newElement) {
    newElement.classList.add(`background-player${data.currentPlayerId}`);
  }

  // Met à jour le nom de la phase dans l'interface utilisateur
  const turnHudPhaseName = document.getElementById("turn-hud-phase-name");
  turnHudPhaseName.innerText = phase.description;

  // Gestion spécifique de la phase "DRAFT"
  if (phase === EPhases.DRAFT || phase === EPhases.PLACING) {
    const turnHubActionImg = document.getElementById("turn-hub-action-img");
    turnHubActionImg.src = "./assets/images/person-solid.svg";
    const turnHubActionTroopsCount = document.getElementById(
      "turn-hub-action-troops-count"
    );
    turnHubActionTroopsCount.hidden = false;
    turnHubActionTroopsCount.innerText =
      playersList[data.currentPlayerId].troops;
  } else if (
    data.currentPhase === EPhases.DRAFT ||
    data.currentPhase === EPhases.PLACING
  ) {
    const turnHubActionImg = document.getElementById("turn-hub-action-img");
    turnHubActionImg.src = "./assets/images/chevrons-right-solid.svg";
    const turnHubActionTroopsCount = document.getElementById(
      "turn-hub-action-troops-count"
    );
    turnHubActionTroopsCount.hidden = true;
  }

  // Met à jour la phase actuelle
  data.currentPhase = phase;
}

/**
 * Définit les territoires attaquables en ajoutant une classe CSS spécifique à chaque territoire donné.
 *
 * @param {string[]} territoiresId - Un tableau contenant les identifiants des territoires à marquer comme attaquables.
 */
export function setAttackableTerritoires(territoiresId) {
  utils.removeClassFromElements("attackable-territory");
  for (const territoireId of territoiresId) {
    const territoire = document.getElementById(territoireId);
    territoire.classList.add("attackable-territory");
    // Déplace l'élément à la fin de son parent pour qu'il s'affiche par-dessus ses frères,
    // ce qui permet à son contour (stroke) de ne pas être masqué.
    territoire.parentElement.appendChild(territoire);
  }
}

export function addTroopsChangeParticle(territoireId, playerId, troopsCount) {
  console.log(`addTroopsChangeParticle(${territoireId}, ${troopsCount})`);
  const formatter = new Intl.NumberFormat("en-US", {
    signDisplay: "always", // Always show "+" or "-"
  });

  const pastille = document.getElementById(`pastille-${territoireId}`);

  const particule = document.createElement("div");
  particule.textContent = formatter.format(troopsCount);
  particule.className = `change-particule kanit-900 color-player${playerId}`;
  particule.style.left = pastille.style.left; // Position the particule
  particule.style.top = pastille.style.top;

  requestAnimationFrame(() => {
    particule.style.transform = "translate(-50%, -50%) translateY(-70px)"; // Move upwards
    particule.style.fontSize = 0; // Fade out
  });

  console.log(pastille.style.left, pastille.style.top);

  setTimeout(() => {
    particule.remove();
  }, 1000);

  document.body.appendChild(particule);
}
