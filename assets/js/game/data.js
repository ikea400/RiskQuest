import { randomInteger } from "./utils.js";

export const EPhases = Object.freeze({
  NONE: Symbol("NONE"),
  PICKING: Symbol("PICKING"),
  PLACING: Symbol("PLACING"),
  DRAFT: Symbol("DRAFT"),
  ATTACK: Symbol("ATTACK"),
  FORTIFY: Symbol("FORTIFY"),
});

export const EBotSpeed = Object.freeze({
  SLOW: Object.freeze({ name: "slow", delay: 2000 }),
  NORMAL: Object.freeze({ name: "normal", delay: 1000 }),
  FAST: Object.freeze({ name: "fast", delay: 50 }),
});

export const data = {
  MIN_PLAYER_COUNT: 3,
  MAX_PLAYER_COUNT: 6,

  currentPlayerId: 1,
  selectedTerritoire: undefined,
  currentPhase: EPhases.ATTACK,
  botSpeed: EBotSpeed.FAST,
};

export const territoiresList = {
  alaska: {
    continent: "north-america",
    connection: ["northwestTerritory", "alberta", "kamchakta"],
    pastille: { x: 0.6, y: 0.4 },
  },
  northwestTerritory: {
    continent: "north-america",
    connection: ["alaska", "alberta", "ontario", "greenland"],
    pastille: { x: 0.45, y: 0.82 },
  },
  greenland: {
    continent: "north-america",
    connection: ["northwestTerritory", "ontario", "quebec", "iceland"],
    pastille: { x: 0.61, y: 0.34 },
  },
  alberta: {
    continent: "north-america",
    connection: ["alaska", "northwestTerritory", "ontario", "westernUs"],
    pastille: { x: 0.49, y: 0.49 },
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
    pastille: { x: 0.49, y: 0.52 },
  },
  quebec: {
    continent: "north-america",
    connection: ["ontario", "greenland", "easternUs"],
    pastille: { x: 0.42, y: 0.48 },
  },
  westernUs: {
    continent: "north-america",
    connection: ["alberta", "ontario", "easternUs", "centralAmerica"],
    pastille: { x: 0.49, y: 0.43 },
  },
  easternUs: {
    continent: "north-america",
    connection: ["ontario", "quebec", "westernUs", "centralAmerica"],
    pastille: { x: 0.37, y: 0.52 },
  },
  centralAmerica: {
    continent: "north-america",
    connection: ["easternUs", "westernUs", "venezuela"],
    pastille: { x: 0.34, y: 0.25 },
  },
  venezuela: {
    continent: "south-america",
    connection: ["centralAmerica", "peru", "brazil"],
    pastille: { x: 0.34, y: 0.36 },
  },
  peru: {
    continent: "south-america",
    connection: ["venezuela", "brazil", "argentina"],
    pastille: { x: 0.35, y: 0.57 },
  },
  brazil: {
    continent: "south-america",
    connection: ["venezuela", "peru", "argentina", "northAfrica"],
    pastille: { x: 0.53, y: 0.4 },
  },
  argentina: {
    continent: "south-america",
    connection: ["peru", "brazil"],
    pastille: { x: 0.39, y: 0.37 },
  },
  northAfrica: {
    continent: "africa",
    connection: [
      "brazil",
      "egypt",
      "congo",
      "eastAfrica",
      "westernEurope",
      "southernEurope",
    ],
    pastille: { x: 0.45, y: 0.48 },
  },
  congo: {
    continent: "africa",
    connection: ["northAfrica", "southAfrica", "eastAfrica"],
    pastille: { x: 0.53, y: 0.485 },
  },
  southAfrica: {
    continent: "africa",
    connection: ["madagascar", "congo", "eastAfrica"],
    pastille: { x: 0.46, y: 0.49 },
  },
  madagascar: {
    continent: "africa",
    connection: ["southAfrica", "eastAfrica"],
    pastille: { x: 1.9, y: 1 },
  },
  eastAfrica: {
    continent: "africa",
    connection: [
      "madagascar",
      "southAfrica",
      "congo",
      "northAfrica",
      "egypt",
      "middleEast",
    ],
    pastille: { x: 0.47, y: 0.44 },
  },
  egypt: {
    continent: "africa",
    connection: ["middleEast", "southernEurope", "northAfrica", "eastAfrica"],
    pastille: { x: 0.49, y: 0.42 },
  },
  westernEurope: {
    continent: "europe",
    connection: [
      "northAfrica",
      "southernEurope",
      "northernEurope",
      "greatBritain",
    ],
    pastille: { x: -0.25, y: 0.43 },
  },
  southernEurope: {
    continent: "europe",
    connection: [
      "westernEurope",
      "middleEast",
      "egypt",
      "ukraine",
      "northernEurope",
      "northAfrica",
    ],
    pastille: { x: 0.69, y: 0.35 },
  },
  northernEurope: {
    continent: "europe",
    connection: [
      "greatBritain",
      "westernEurope",
      "southernEurope",
      "ukraine",
      "scandinavia",
    ],
    pastille: { x: 0.6, y: 0.6 },
  },
  greatBritain: {
    continent: "europe",
    connection: ["iceland", "scandinavia", "northernEurope", "westernEurope"],
    pastille: { x: -0.5, y: 0.43 },
  },
  iceland: {
    continent: "europe",
    connection: ["greenland", "greatBritain", "scandinavia"],
    pastille: { x: 1, y: -1 },
  },
  scandinavia: {
    continent: "europe",
    connection: ["greatBritain", "iceland", "northernEurope", "ukraine"],
    pastille: { x: 0.35, y: 0.4 },
  },
  ukraine: {
    continent: "europe",
    connection: [
      "scandinavia",
      "northernEurope",
      "southernEurope",
      "ural",
      "afghanistan",
    ],
    pastille: { x: 0.52, y: 0.62 },
  },
  middleEast: {
    continent: "asia",
    connection: [
      "egypt",
      "eastAfrica",
      "india",
      "afghanistan",
      "southernEurope",
    ],
    pastille: { x: 0.41, y: 0.3 },
  },
  afghanistan: {
    continent: "asia",
    connection: ["middleEast", "india", "china", "ural", "ukraine"],
    pastille: { x: 0.56, y: 0.39 },
  },
  ural: {
    continent: "asia",
    connection: ["ukraine", "afghanistan", "china", "siberia"],
    pastille: { x: 0.45, y: 0.6 },
  },
  india: {
    continent: "asia",
    connection: ["middleEast", "afghanistan", "china"],
    pastille: { x: 0.59, y: 0.35 },
  },
  siberia: {
    continent: "asia",
    connection: ["ural", "china", "mongolia", "irkutsk", "yakutsk"],
    pastille: { x: 0.5, y: 0.53 },
  },
  china: {
    continent: "asia",
    connection: ["siam", "india", "afghanistan", "ural", "siberia", "mongolia"],
    pastille: { x: 0.53, y: 0.46 },
  },
  mongolia: {
    continent: "asia",
    connection: ["japan", "china", "siberia", "irkutsk", "kamchakta"],
    pastille: { x: 0.59, y: 0.43 },
  },
  japan: {
    continent: "asia",
    connection: ["mongolia", "kamchakta"],
    pastille: { x: 1.4, y: 0.43 },
  },
  irkutsk: {
    continent: "asia",
    connection: ["mongolia", "siberia", "yakutsk", "kamchakta"],
    pastille: { x: 0.48, y: 0.5 },
  },
  yakutsk: {
    continent: "asia",
    connection: ["siberia", "irkutsk", "kamchakta"],
    pastille: { x: 0.49, y: 0.65 },
  },
  kamchakta: {
    continent: "asia",
    connection: ["yakutsk", "irkutsk", "mongolia", "japan", "alaska"],
    pastille: { x: 0.61, y: 0.23 },
  },
  siam: {
    continent: "asia",
    connection: ["china", "indonesia"],
    pastille: { x: 0.49, y: 0.31 },
  },
  indonesia: {
    continent: "oceania",
    connection: ["siam", "newGuinea", "westernAustralia"],
    pastille: { x: -0.05, y: 0.75 },
  },
  newGuinea: {
    continent: "oceania",
    connection: ["easternAustralia", "westernAustralia", "indonesia"],
    pastille: { x: 0.5, y: -0.45 },
  },
  westernAustralia: {
    continent: "oceania",
    connection: ["newGuinea", "easternAustralia", "indonesia"],
    pastille: { x: 0.5, y: 0.56 },
  },
  easternAustralia: {
    continent: "oceania",
    connection: ["westernAustralia", "newGuinea"],
    pastille: { x: 0.27, y: 0.42 },
  },
};

function fillContinents() {
  const continents = {
    "north-america": { bonus: 5, territoires: [] },
    "south-america": { bonus: 2, territoires: [] },
    europe: { bonus: 5, territoires: [] },
    africa: { bonus: 3, territoires: [] },
    asia: { bonus: 7, territoires: [] },
    oceania: { bonus: 2, territoires: [] },
  };

  // Remplie les continents avec leurs territoires pour éviter de devoir le faire manuellement.
  for (const territoireId in territoiresList) {
    const territoire = territoiresList[territoireId];

    continents[territoire.continent].territoires.push(territoireId);
  }
  return continents;
}

export const continentsList = fillContinents();

console.log(continentsList);

export const playersList = [
  undefined,
  {
    name: "Player01",
    img: "./assets/images/player1-profile.webp",
    bot: false,
  },
  {
    name: "Player02",
    img: "./assets/images/player2-profile.webp",
    bot: true,
  },
  {
    name: "Player03",
    img: "./assets/images/player3-profile.webp",
    bot: true,
  },
  {
    name: "Player04",
    img: "./assets/images/player4-profile.webp",
    bot: true,
  },
  {
    name: "Player05",
    img: "./assets/images/player5-profile.webp",
    bot: true,
  },
  {
    name: "Player06",
    img: "./assets/images/player6-profile.webp",
    bot: true,
  },
];

export const winningOdds = {};

fetch("http://localhost/riskquest/assets/data/odds.json")
  .then(async (response) => {
    const json = await response.json();
    winningOdds.blitz = json.blitz;
    winningOdds.classic = json.classic;
    console.log(winningOdds);
  })
  .catch((error) => {
    throw Error(`Failed to load odds data from server: ${error}`);
  });

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
export function getStartingTroops(playerCount) {
  if (
    playerCount < data.MIN_PLAYER_COUNT ||
    playerCount > data.MAX_PLAYER_COUNT
  ) {
    throw new Error("There must be between 3 and 6 player");
  }

  const troopsList = [35, 30, 25, 20];
  return troopsList[playerCount - data.MIN_PLAYER_COUNT];
}

export function playImmersiveSounds(newPhase) {
  switch (newPhase) {
    case EPhases.ATTACK:
      switch (randomInteger(1, 6)) {
        case 1:
          document.getElementById("charge1-sound").play();
          break;
        case 2:
          document.getElementById("charge2-sound").play();
          break;
        case 3:
          document.getElementById("advance-sound").play();
          break;
        case 4:
          document.getElementById("killThemAll-sound").play();
          break;
        case 5:
          document.getElementById("forward-sound").play();
          break;
        case 6:
          document.getElementById("goGoGo-sound").play();
          break;
      }
      break;
    case EPhases.FORTIFY:
    case EPhases.DRAFT:
      switch (randomInteger(1, 4)) {
        case 1:
          document.getElementById("reinforcements-sound").play();
          break;
        case 2:
          document.getElementById("standFirm-sound").play();
          break;
        case 3:
          document.getElementById("formRanks-sound").play();
          break;
        case 4:
          document.getElementById("frontlines-sound").play();
          break;
      }
      break;
  }
}
