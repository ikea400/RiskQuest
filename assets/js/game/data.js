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
    connection: ["northwestTerritory", "alberta", "kamchakta"],
  },
  northwestTerritory: {
    continent: "north-america",
    connection: ["alaska", "alberta", "ontario", "greenland"],
  },
  greenland: {
    continent: "north-america",
    connection: ["northwestTerritory", "ontario", "quebec", "iceland"],
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
    connection: ["venezuela", "peru", "argentina", "northAfrica"],
  },
  argentina: {
    continent: "south-america",
    connection: ["peru", "brazil"],
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
  },
  congo: {
    continent: "africa",
    connection: ["northAfrica", "southAfrica", "eastAfrica"],
  },
  southAfrica: {
    continent: "africa",
    connection: ["madagascar", "congo", "eastAfrica"],
  },
  madagascar: {
    continent: "africa",
    connection: ["southAfrica", "eastAfrica"],
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
  },
  egypt: {
    continent: "africa",
    connection: ["middleEast", "southernEurope", "northAfrica", "eastAfrica"],
  },
  westernEurope: {
    continent: "europe",
    connection: [
      "northAfrica",
      "southernEurope",
      "northernEurope",
      "greatBritain",
    ],
    pastille: { x: 0.5, y: 0.5 },
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
  },
  greatBritain: {
    continent: "europe",
    connection: ["iceland", "scandinavia", "northernEurope", "westernEurope"],
  },
  iceland: {
    continent: "europe",
    connection: ["greenland", "greatBritain", "scandinavia"],
  },
  scandinavia: {
    continent: "europe",
    connection: ["greatBritain", "iceland", "northernEurope", "ukraine"],
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
  },
  afghanistan: {
    continent: "asia",
    connection: ["middleEast", "india", "china", "ural", "ukraine"],
  },
  ural: {
    continent: "asia",
    connection: ["ukraine", "afghanistan", "china", "siberia"],
  },
  india: {
    continent: "asia",
    connection: ["middleEast", "afghanistan", "china"],
  },
  siberia: {
    continent: "asia",
    connection: ["ural", "china", "mongolia", "irkutsk", "yakutsk"],
  },
  china: {
    continent: "asia",
    connection: ["siam", "india", "afghanistan", "ural", "siberia", "mongolia"],
  },
  mongolia: {
    continent: "asia",
    connection: ["japan", "china", "siberia", "irkutsk", "kamchakta"],
  },
  japan: {
    continent: "asia",
    connection: ["mongolia", "kamchakta"],
  },
  irkutsk: {
    continent: "asia",
    connection: ["mongolia", "siberia", "yakutsk", "kamchakta"],
  },
  yakutsk: {
    continent: "asia",
    connection: ["siberia", "irkutsk", "kamchakta"],
  },
  kamchakta: {
    continent: "asia",
    connection: ["yakutsk", "irkutsk", "mongolia", "japan", "alaska"],
  },
  siam: {
    continent: "asia",
    connection: ["china", "indonesia"],
  },
  indonesia: {
    continent: "oceania",
    connection: ["siam", "newGuinea", "westernAustralia"],
  },
  newGuinea: {
    continent: "oceania",
    connection: ["easternAustralia", "westernAustralia", "indonesia"],
  },
  westernAustralia: {
    continent: "oceania",
    connection: ["newGuinea", "easternAustralia", "indonesia"],
  },
  easternAustralia: {
    continent: "oceania",
    connection: ["westernAustralia", "newGuinea"],
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
