import BotBase from "./botbase.js";

import { territoiresList } from "../game/data.js";
import * as utils from "../game/utils.js";

export default class RandomBot extends BotBase {
  constructor(params) {
    super(params);
  }

  pickTerritory() {
    const territoiresLibres = Object.keys(territoiresList).filter(
      (territoiresId) => territoiresList[territoiresId].playerId == null
    );
    return territoiresLibres[
      utils.randomInteger(0, territoiresLibres.length - 1)
    ];
  }

  pickStartTroop() {
    const territoires = Object.keys(territoiresList).filter(
      (territoiresId) =>
        territoiresList[territoiresId].playerId === this.playerId
    );

    const choice = territoires[utils.randomInteger(0, territoires.length - 1)];
    console.log(territoires);
    return choice;
  }
}
