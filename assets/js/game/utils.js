/**
 * Génère un nombre entier aléatoire dans une plage donnée.
 * Utilise l'API Web Crypto pour produire un nombre sécurisé.
 *
 * @param {number} min - La valeur minimale (incluse).
 * @param {number} max - La valeur maximale (incluse).
 * @returns {number} Un nombre entier entre min et max.
 *
 * @see https://stackoverflow.com/a/42321673
 */
export function randomInteger(min, max) {
  const randomBuffer = new Uint32Array(1);

  const crypto = window.crypto || window.msCrypto;
  crypto.getRandomValues(randomBuffer);

  let randomNumber = randomBuffer[0] / (0xffffffff + 1);

  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(randomNumber * (max - min + 1)) + min;
}

/**
 * Lance un dé à six faces.
 *
 * @returns {number} Un nombre entier entre 1 et 6.
 */
export function rollDice() {
  return randomInteger(1, 6);
}

/**
 * Lance plusieurs dés et retourne les résultats sous forme de tableau.
 *
 * @param {number} count - Le nombre de dés à lancer.
 * @returns {number[]} Un tableau contenant les résultats de chaque dé.
 */
export function rollDices(count) {
  return Array.from({ length: count }, rollDice);
}

/**
 * Determines a random starting player by rolling dice for each player and narrowing down
 * to the player(s) with the highest rolls until one player remains.
 *
 * @param {number} playerCount - The total number of players (must be at least 1).
 * @returns {number} - The ID of the randomly selected starting player.
 */
export function getRandomStartingPlayer(playerCount) {
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
 * Simulates a blitz attack, determining troop losses for both sides based on dice rolls.
 * @param {number} defenderTroopsCount - Number of troops on the defending side.
 * @param {number} attackerTroopsCount - Number of troops on the attacking side.
 * @returns {Array} [defenderLostTroops, attackerLostTroops] - The troop losses for the defender and attacker, respectively.
 */
export function blitzAttack(defenderTroopsCount, attackerTroopsCount) {
  console.log(`blitzAttack(${defenderTroopsCount}, ${attackerTroopsCount})`);
  let defenderTotalLostTroops = 0;
  let attackerTotalLostTroops = 0;
  while (defenderTroopsCount > 0 && attackerTroopsCount > 0) {
    // Determine the minimum number of dice rolls to compare
    const keepingCount = Math.min(defenderTroopsCount, attackerTroopsCount);

    // Roll dice for the defender, sort in descending order, and keep the biggest rolls
    const defenderDices = rollDices(defenderTroopsCount)
      .sort((a, b) => b - a)
      .slice(0, keepingCount);

    // Roll dice for the attacker, sort in descending order, and keep the biggest rolls
    const attackerDices = rollDices(attackerTroopsCount)
      .sort((a, b) => b - a)
      .slice(0, keepingCount);

    console.log(defenderDices, attackerDices);

    // Initialize counters for troop losses
    let defenderLostTroops = 0;
    let attackerLostTroops = 0;

    // Compare dice rolls to determine troop losses
    for (let i = 0; i < keepingCount; i++) {
      if (attackerDices[i] > defenderDices[i]) {
        defenderLostTroops++; // Defender loses a troop
      } else {
        attackerLostTroops++; // Attacker loses a troop
      }
    }

    defenderTroopsCount -= defenderLostTroops;
    attackerTroopsCount -= attackerLostTroops;
    defenderTotalLostTroops += defenderLostTroops;
    attackerTotalLostTroops += attackerLostTroops;
  }
  // Return the troop losses for both sides
  return [defenderTotalLostTroops, attackerTotalLostTroops];
}

export function classicAttack(defenderTroopsCount, attackerTroopsCount) {
  console.log(`classicAttack(${defenderTroopsCount}, ${attackerTroopsCount})`);

  // Determine the minimum number of dice rolls to compare
  const keepingCount = Math.min(defenderTroopsCount, attackerTroopsCount);

  // Roll dice for the defender, sort in descending order, and keep the biggest rolls
  const defenderDices = rollDices(defenderTroopsCount)
    .sort((a, b) => b - a)
    .slice(0, keepingCount);

  // Roll dice for the attacker, sort in descending order, and keep the biggest rolls
  const attackerDices = rollDices(attackerTroopsCount)
    .sort((a, b) => b - a)
    .slice(0, keepingCount);

  console.log(defenderDices, attackerDices);

  // Initialize counters for troop losses
  let defenderLostTroops = 0;
  let attackerLostTroops = 0;

  // Compare dice rolls to determine troop losses
  for (let i = 0; i < keepingCount; i++) {
    if (attackerDices[i] > defenderDices[i]) {
      defenderLostTroops++; // Defender loses a troop
    } else {
      attackerLostTroops++; // Attacker loses a troop
    }
  }

  // Return the troop losses for both sides
  return [defenderLostTroops, attackerLostTroops];
}

/**
 * Supprime une classe CSS spécifique de tous les éléments HTML qui possèdent cette classe.
 *
 * @param {string} cssClass - Le nom de la classe CSS à supprimer.
 */
export function removeClassFromElements(cssClass) {
  const elements = Array.from(document.getElementsByClassName(cssClass));
  for (const element of elements) {
    element.classList.remove(cssClass);
  }
}

/**
 * Calcule l'identifiant du prochain joueur dans un jeu, basé sur l'identifiant actuel et le nombre total de joueurs.
 *
 * @param {number} playerId - L'identifiant actuel du joueur.
 * @param {number} playerCount - Le nombre total de joueurs.
 * @returns {number} L'identifiant du prochain joueur.
 */
export function getNextPlayerId(playerId, playerCount) {
  return (playerId % playerCount) + 1;
}
