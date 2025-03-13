export const MIN_PLAYER_COUNT = 3;
export const MAX_PLAYER_COUNT = 6;

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
  if (playerCount < MIN_PLAYER_COUNT || playerCount > MAX_PLAYER_COUNT) {
    throw new Error("There must be between 3 and 6 player");
  }

  const troopsList = [35, 30, 25, 20];
  return troopsList[playerCount - MIN_PLAYER_COUNT];
}

export const EPhases = Object.freeze({
  NONE: Symbol("NONE"),
  PICKING: Symbol("PICKING"),
  PLACING: Symbol("PLACING"),
  DRAFT: Symbol("DRAFT"),
  ATTACK: Symbol("ATTACK"),
  FORTIFY: Symbol("FORTIFY"),
});

export const territoiresList = {
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
