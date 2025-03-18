export const EPhases = Object.freeze({
  NONE: Symbol("NONE"),
  PICKING: Symbol("PICKING"),
  PLACING: Symbol("PLACING"),
  DRAFT: Symbol("DRAFT"),
  ATTACK: Symbol("ATTACK"),
  FORTIFY: Symbol("FORTIFY"),
});

export const data = {
  MIN_PLAYER_COUNT: 3,
  MAX_PLAYER_COUNT: 6,

  currentPlayerId: 1,
  selectedTerritoire: undefined,
  currentPhase: EPhases.ATTACK,
};

export const territoiresList = {
  alaska: {
    continent: "north-america",
    connection: ["northwestTerritory", "alberta","kamchakta"],
    pastille:{ x: 0.5, y: 0.35},
  },
  northwestTerritory: {
    continent: "north-america",
    connection: ["alaska", "alberta", "ontario", "greenland"],
    pastille:{ x: 0.42, y: 0.8},
  },
  greenland: {
    continent: "north-america",
    connection: ["northwestTerritory", "ontario", "quebec","iceland"],
    pastille:{ x: 0.58, y: 0.35},
  },
  alberta: {
    continent: "north-america",
    connection: ["alaska", "northwestTerritory", "ontario", "westernUs"],
    pastille:{ x: 0.43, y: 0.44},
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
    pastille:{ x: 0.4, y: 0.47},
  },
  quebec: {
    continent: "north-america",
    connection: ["ontario", "greenland", "easternUs"],
    pastille:{ x: 0.38, y: 0.42},
  },
  westernUs: {
    continent: "north-america",
    connection: ["alberta", "ontario", "easternUs", "centralAmerica"],
    pastille:{ x: 0.43, y: 0.37},
  },
  easternUs: {
    continent: "north-america",
    connection: ["ontario", "quebec", "westernUs", "centralAmerica"],
    pastille:{ x: 0.32, y: 0.47},
  },
  centralAmerica: {
    continent: "north-america",
    connection: ["easternUs", "westernUs", "venezuela"],
    pastille:{ x: 0.32, y: 0.24},
  },
  venezuela: {
    continent: "south-america",
    connection: ["centralAmerica", "peru", "brazil"],
    pastille:{ x: 0.27, y: 0.325},
  },
  peru: {
    continent: "south-america",
    connection: ["venezuela", "brazil", "argentina"],
    pastille:{ x: 0.41, y: 0.57},
  },
  brazil: {
    continent: "south-america",
    connection: ["venezuela", "peru", "argentina","northAfrica"],
    pastille:{ x: 0.48, y: 0.35},
  },
  argentina: {
    continent: "south-america",
    connection: ["peru", "brazil"],
    pastille:{ x: 0.335, y: 0.32},
  },
  northAfrica: {
    continent: "africa",
    connection: ["brazil","egypt","congo","eastAfrica","westernEurope","southernEurope"],
    pastille:{ x: 0.4, y: 0.43},
  },
  congo: {
    continent: "africa",
    connection: ["northAfrica","southAfrica","eastAfrica"],
    pastille:{ x: 0.465, y: 0.425},
  },
  southAfrica: {
    continent: "africa",
    connection: ["madagascar","congo","eastAfrica"],
    pastille:{ x: 0.4, y: 0.43},
  },
  madagascar: {
    continent: "africa",
    connection: ["southAfrica","eastAfrica"],
    pastille:{ x: 1.4, y: 0.5},
  },
  eastAfrica: {
    continent: "africa",
    connection: ["madagascar","southAfrica","congo","northAfrica","egypt","middleEast"],
    pastille:{ x: 0.4, y: 0.43},
  },
  egypt: {
    continent: "africa",
    connection: ["middleEast","southernEurope","northAfrica","eastAfrica"],
    pastille:{ x: 0.42, y: 0.35},
  },
  westernEurope: {
    continent: "europe",
    connection: ["northAfrica","southernEurope","northernEurope","greatBritain"],
    pastille:{ x: -0.25, y: 0.43},
  },
  southernEurope: {
    continent: "europe",
    connection: ["westernEurope","middleEast","egypt","ukraine","northernEurope","northAfrica"],
    pastille:{ x: 0.63, y: 0.255},
  },
  northernEurope: {
    continent: "europe",
    connection: ["greatBritain","westernEurope","southernEurope","ukraine","scandinavia"],
    pastille:{ x: 0.5, y: 0.5},
  },
  greatBritain: {
    continent: "europe",
    connection: ["iceland","scandinavia","northernEurope","westernEurope"],
    pastille:{ x: -0.5, y: 0.43},
  },
  iceland: {
    continent: "europe",
    connection: ["greenland","greatBritain","scandinavia"],
    pastille:{ x: 1, y: -1},
  },
  scandinavia: {
    continent: "europe",
    connection: ["greatBritain","iceland","northernEurope","ukraine"],
    pastille:{ x: 0.35, y: 0.4},
  },
  ukraine: {
    continent: "europe",
    connection: ["scandinavia","northernEurope","southernEurope","ural","afghanistan"],
    pastille:{ x: 0.5, y: 0.6},
  },
  middleEast: {
    continent: "asia",
    connection: ["egypt","eastAfrica","india","afghanistan","southernEurope"],
    pastille:{ x: 0.37, y: 0.25},
  },
  afghanistan: {
    continent: "asia",
    connection: ["middleEast","india","china","ural","ukraine"],
    pastille:{ x: 0.52, y: 0.35},
  },
  ural: {
    continent: "asia",
    connection: ["ukraine","afghanistan","china","siberia"],
    pastille:{ x: 0.37, y: 0.56},
  },
  india: {
    continent: "asia",
    connection: ["middleEast","afghanistan","china"],
    pastille:{ x: 0.52, y: 0.31},
  },
  siberia: {
    continent: "asia",
    connection: ["ural","china","mongolia","irkutsk","yakutsk"],
    pastille:{ x: 0.45, y: 0.5},
  },
  china: {
    continent: "asia",
    connection: ["siam","india","afghanistan","ural","siberia","mongolia"],
    pastille:{ x: 0.5, y: 0.43},
  },
  mongolia: {
    continent: "asia",
    connection: ["japan","china","siberia","irkutsk","kamchakta"],
    pastille:{ x: 0.54, y: 0.35},
  },
  japan: {
    continent: "asia",
    connection: ["mongolia","kamchakta"],
    pastille:{ x: 1.2, y: 0.43},
  },
  irkutsk: {
    continent: "asia",
    connection: ["mongolia","siberia","yakutsk","kamchakta"],
    pastille:{ x: 0.44, y: 0.43},
  },
  yakutsk: {
    continent: "asia",
    connection: ["siberia","irkutsk","kamchakta"],
    pastille:{ x: 0.45, y: 0.62},
  },
  kamchakta: {
    continent: "",
    connection: ["yakutsk","irkutsk","mongolia","japan","alaska"],
    pastille:{ x: 0.58, y: 0.2},
  },
  siam: {
    continent: "asia",
    connection: ["china","indonesia"],
    pastille:{ x: 0.45, y: 0.23},
  },
  indonesia: {
    continent: "oceania",
    connection: ["siam","newGuinea","westernAustralia"],
    pastille:{ x: -0.05, y: 0.75},
  },
  newGuinea: {
    continent: "oceania",
    connection: ["easternAustralia","westernAustralia","indonesia"],
    pastille:{ x: 0.5, y: -0.45},
  },
  westernAustralia: {
    continent: "oceania",
    connection: ["newGuinea","easternAustralia","indonesia"],
    pastille:{ x: 0.45, y: 0.47},
  },
  easternAustralia: {
    continent: "oceania",
    connection: ["westernAustralia","newGuinea"],
    pastille:{ x: 0.25, y: 0.39},
  },
};

export const continentsList = {
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

  continentsList[territoire.continent].territoires.push(territoireId);
}

export const playersList = [
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
