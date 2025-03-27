import BotBase from "./botbase.js";
import { playersList, territoiresList, continentsList } from "../game/data.js";
import {
  getAttackableNeighbour,
  getReachableTerritories,
} from "../game/logic.js";
import { winningOdds } from "../game/data.js";
import * as utils from "../game/utils.js";

export default class Bot extends BotBase {
  constructor(params) {
    super(params);
  }

  // Phase de sélection initiale des territoires
  pickTerritory() {
    const territoiresLibres = Object.keys(territoiresList).filter(
      (territoiresId) => territoiresList[territoiresId].playerId == null
    );
    return territoiresLibres[
      utils.randomInteger(0, territoiresLibres.length - 1)
    ];
  }

  // Phase de placement initial des troupes
  pickStartTroop() {
    const territoires = Object.keys(territoiresList).filter(
      (territoiresId) =>
        territoiresList[territoiresId].playerId === this.playerId
    );
    return territoires[utils.randomInteger(0, territoires.length - 1)];
  }

  //Phase Draft - Placement stratégique des troupes
  pickDraftTroops() {
    const troopsCount = playersList[this.playerId].troops;
    const ownedTerritoires = Object.keys(territoiresList).filter(
      (territoiresId) =>
        territoiresList[territoiresId].playerId === this.playerId
    );
    //Trouver les zones continues (groupes de territoires connectés)
    const zones = this.findConnectedZones(ownedTerritoires);

    //Trier les zones par taille en ordre décroissant
    zones.sort((a, b) => b.length - a.length);

    //Objet des territoires classés par continent pour obtenir le pourcentage
    const pourcentageContinents = {
      "north-america": {
        territoires: [],
        pourcentage: 0,
        name: "north-america",
      },
      "south-america": {
        territoires: [],
        pourcentage: 0,
        name: "south-america",
      },
      europe: { territoires: [], pourcentage: 0, name: "europe" },
      africa: { territoires: [], pourcentage: 0, name: "africa" },
      asia: { territoires: [], pourcentage: 0, name: "asia" },
      oceania: { territoires: [], pourcentage: 0, name: "oceania" },
    };

    //Tableau des continents à focus
    const focus = [];

    // Évaluer le pourcentage de continents possédé
    for (const idTerritoire of ownedTerritoires) {
      //Déterminer le continent du territoire
      const continent = territoiresList[idTerritoire].continent;
      pourcentageContinents[continent].territoires.push(idTerritoire);
      //Évalue le pourcentage actuel de possession du continent
      pourcentageContinents[continent].pourcentage = Math.round(
        (pourcentageContinents[continent].territoires.length /
          continentsList[continent].territoires.length) *
          100
      );

      //Détermine les continents sur lesquels se concentrer
      if (100 < pourcentageContinents[continent].pourcentage >= 75) {
        focus.push(pourcentageContinents[continent].name);
      }
    }

    //Pour chaque zone, trouver le territoire avec le plus de troupes qui a des voisins ennemis
    let targetTerritories = [];
    for (const zone of zones) {
      //Trier les territoires de la zone par nombre de troupes (décroissant)
      const sortedZone = zone.sort(
        (a, b) => territoiresList[b].troops - territoiresList[a].troops
      );

      //Trouver le premier territoire qui a des voisins ennemis
      for (const territoireId of sortedZone) {
        const attackables = getAttackableNeighbour(territoireId);
        if (attackables.length > 0) {
          targetTerritories.push(territoireId);
        }
      }
    }

    let territoireFocus = [];
    //Trouve les territoires à focus pour compléter un continent qui est bientôt complété
    for (const territoire of targetTerritories) {
      for (const continent of focus) {
        //Conditions (le territoire est dans un continent à focus et son voisin attackable est dans le continent)
        if (
          territoiresList[territoire].continent == focus &&
          getAttackableNeighbour(territoire).length > 0
        ) {
          for (const attackableNeighbour of getAttackableNeighbour(
            territoire
          )) {
            if (territoiresList[attackableNeighbour].continent == continent) {
              const index = targetTerritories.indexOf(territoire);
              targetTerritories.splice(index, index);
              territoireFocus.push(territoire);
            }
          }
        }
      }
    }

    //Ajout des territoires à focus en haut des priorités des territoires ciblés
    for (const territoire of territoireFocus) {
      targetTerritories.unshift(territoire);
    }

    // Répartir les troupes proportionnellement sur les territoires cibles
    const drafts = [];
    let remainingTroops = troopsCount;
    let iterator = 0;

    while (remainingTroops > 0) {
      const troops = utils.randomInteger(1, remainingTroops);
      const territoireId = targetTerritories[iterator];
      iterator = ++iterator % targetTerritories.length;
      remainingTroops -= troops;
      drafts.push({ territoire: territoireId, troops: troops });
    }

    return drafts;
  }

  //Phase d'attaque - Stratégie d'attaque
  pickAttack() {
    const MIN_ODDS = 0.8; //80% de chances minimum
    //Trier les territoires par nombre de troupes (décroissant)
    const ownedTerritoires = Object.keys(territoiresList)
      .filter((id) => territoiresList[id].playerId === this.playerId)
      .sort((a, b) => territoiresList[b].troops - territoiresList[a].troops);

    //Pour chaque territoire, évaluer les attaques possibles
    const attackOptions = [];
    for (const territoireId of ownedTerritoires) {
      // On ne peut attaquer qu'avec au moins 2 troupes
      if (territoiresList[territoireId].troops < 2) continue;

      const attackables = getAttackableNeighbour(territoireId);

      for (const defenderId of attackables) {
        const odds =
          winningOdds.blitz[territoiresList[territoireId].troops - 1][
            territoiresList[defenderId].troops
          ];

        if (odds >= MIN_ODDS) {
          // Calculer le nombre de frontières ennemies du défenseur
          const defenderBorders = territoiresList[defenderId].connection.filter(
            (id) => territoiresList[id].playerId !== this.playerId
          ).length;

          attackOptions.push({
            attacker: territoireId,
            defender: defenderId,
            odds,
            defenderBorders,
          });
        }
      }
    }

    if (attackOptions.length === 0) return null;

    //Trier les options d'attaque:
    //D'abord par odds (décroissant)
    //Ensuite par nombre de frontières ennemies du défenseur (croissant)
    attackOptions.sort((a, b) => {
      if (b.odds !== a.odds) return b.odds - a.odds;
      return a.defenderBorders - b.defenderBorders;
    });

    // Retourner la meilleure attaque
    return attackOptions[0];
  }

  //Phase post-attaque - Déplacement des troupes
  pickPostAttack(attackerId, defenderId, minTroopsCount) {
    //Déterminer combien de troupes déplacer (au moins la moitié)
    const availableTroops = territoiresList[attackerId].troops - 1;
    const troopsToMove = Math.max(
      minTroopsCount,
      Math.ceil(availableTroops * 0.5)
    );

    //Vérifier si le territoire conquis a des voisins ennemis
    const newDefenderBorders = territoiresList[defenderId].connection.filter(
      (id) => territoiresList[id].playerId !== this.playerId
    ).length;

    if (newDefenderBorders > 0) {
      //Si oui, déplacer plus de troupes pour sécuriser
      return Math.min(
        availableTroops,
        troopsToMove + Math.floor(newDefenderBorders * 0.5)
      );
    }

    return troopsToMove;
  }

  //Phase de fortification - Renforcement stratégique
  pickFortify() {
    const ownedTerritoires = Object.keys(territoiresList).filter(
      (id) => territoiresList[id].playerId === this.playerId
    );

    //Calculer le score de différence pour chaque territoire
    const territoryScores = [];
    for (const territoireId of ownedTerritoires) {
      if (territoiresList[territoireId].troops == 1) continue;

      //Trouver le voisin ennemi le plus fort
      let maxEnemyTroops = 0;
      for (const neighborId of territoiresList[territoireId].connection) {
        if (territoiresList[neighborId].playerId !== this.playerId) {
          maxEnemyTroops = Math.max(
            maxEnemyTroops,
            territoiresList[neighborId].troops
          );
        }
      }
      const score = territoiresList[territoireId].troops - maxEnemyTroops;
      territoryScores.push({
        territoireId,
        score,
        troops: territoiresList[territoireId].troops,
      });
    }

    if (territoryScores.length === 0) return null;

    //Trouver le territoire avec le score le plus élevé (excédent de troupes)
    territoryScores.sort((a, b) => b.score - a.score);
    const strongest = territoryScores[0];

    //Trouver le territoire avec le score le plus bas (déficit de troupes) dans la même zone
    const reachable = getReachableTerritories(strongest.territoireId);
    const weakInZone = territoryScores
      .filter((t) => reachable.includes(t.territoireId) && t.score < 0)
      .sort((a, b) => a.score - b.score);

    if (weakInZone.length === 0) return null;

    //Calculer combien de troupes transférer
    const weakest = weakInZone[0];
    const troopsToTransfer = Math.min(
      strongest.troops - 1, // Laisser au moins 1 troupe
      Math.abs(weakest.score) + 1 // Assez pour égaler +1
    );

    return {
      from: strongest.territoireId,
      to: weakest.territoireId,
      troops: troopsToTransfer,
    };
  }

  // Helper method pour trouver les zones connectées
  findConnectedZones(territories) {
    const visited = new Set();
    const zones = [];

    for (const territoireId of territories) {
      if (!visited.has(territoireId)) {
        const zone = [];
        const queue = [territoireId];

        while (queue.length > 0) {
          const current = queue.pop();
          if (!visited.has(current)) {
            visited.add(current);
            zone.push(current);

            // Ajouter les voisins appartenant au joueur
            for (const neighbor of territoiresList[current].connection) {
              if (territories.includes(neighbor) && !visited.has(neighbor)) {
                queue.push(neighbor);
              }
            }
          }
        }
        zones.push(zone);
      }
    }
    return zones;
  }
}
