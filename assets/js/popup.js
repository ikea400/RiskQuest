import { winningOdds } from "./game/data";

class PopupBase {
  #resolveCallback;
  #rejectCallback;

  constructor(params) {
    this.params = params;
  }

  init() {
    this.#applyDefault();
    this.backgroundDiv = document.createElement("div");
    this.popupDiv = document.createElement("div");

    this.popupDiv.id = this.params.id;

    this.popupDiv.classList.add("popup");
    for (const cssClass of this.params.classList) {
      this.popupDiv.classList.add(cssClass);
    }

    this.backgroundDiv.classList.add("background-popup");
    this.backgroundDiv.classList.add(
      this.params.bottom ? "background-popup-bottom" : "background-popup-center"
    );

    this.backgroundDiv.hidden = true;

    this.backgroundDiv.appendChild(this.popupDiv);
    document.body.appendChild(this.backgroundDiv);

    if (this.params.cancel) {
      this.backgroundDiv.addEventListener("click", (event) => {
        if (event.target != event.currentTarget) {
          return;
        }

        this.resolve({ cancel: true });
      });
    }
  }

  show(callback) {
    return new Promise((resolve, reject) => {
      this.#resolveCallback = resolve;
      this.#rejectCallback = reject;
      if (callback) {
        callback();
      }
    });
  }

  #applyDefault() {
    this.params.id ??= "PopupBase";
    this.params.classList ??= [];
    this.params.bottom ??= false;
    this.params.cancel ??= true;
  }

  resolve(result) {
    this.backgroundDiv.remove();
    this.#resolveCallback(result);
  }

  reject(reason) {
    this.backgroundDiv.remove();
    this.#rejectCallback(reason);
  }
}

class TestPopup extends PopupBase {
  constructor(params = {}) {
    super(params);
    this.init();
  }

  init() {
    this.#applyDefault();
    super.init();

    this.popupDiv.addEventListener("click", () => {
      this.resolve({ cancel: false });
    });
  }

  show() {
    return super.show(function () {
      console.log("SHould be there");
    });
  }

  #applyDefault() {
    this.params.id ??= "TestPopup";
  }
}

class CountPopup extends PopupBase {
  constructor(params = {}) {
    super(params);
    this.init();
  }

  init() {
    this.#applyDefault();
    super.init();

    const rangeMax = this.params.max - this.params.min + 1;
    this.popupDiv.innerHTML = `
    <div class="popup-count-countainer">
      <div class="number-display">
          <div class="center-indicator"></div>
          <div class="number-track" id="numberTrack">
          
        </div>
      </div>
      <div class="slider-countainer" autofocus>
        <input type="range" id="popup-count-range" name="count" min="1" max="${rangeMax}" value="0" class="slider">
      </div>
      <div id="popup-count-confirm">
          <img id="popup-count-confirm-img" src="./assets/images/circle-check-solid.svg" alt="next">
      </div>
      
    </div>`;

    //this.#updateDisplayText();

    const numberTrack = document.getElementById("numberTrack");
    for (let i = this.params.min; i <= this.params.max; i++) {
      this.popupCountNumber = document.createElement("div");
      this.popupCountNumber.id = `popup-count-number-${i}`;
      this.popupCountNumber.className = "number";
      this.popupCountNumber.textContent = i;
      numberTrack.appendChild(this.popupCountNumber);
      numberTrack.style.width = i * 45 + "px";
    }

    const slider = document.getElementById("popup-count-range");

    this.updateNumber(1);

    slider.addEventListener("input", (event) => {
      let value = parseInt(event.target.value);
      this.params.current = value + this.params.min - 1;
      this.updateNumber(value);
    });

    const popupCountConfirm = document.getElementById("popup-count-confirm");
    popupCountConfirm.addEventListener("click", () => {
      this.resolve({ cancel: false, value: this.params.current });
    });
  }

  updateNumber(activeNumber) {
    const numberTrack = document.querySelector(".number-track");
    const numbers = document.querySelectorAll(".number");
    const numberWidth = 30;

    numbers.forEach((element) => {
      element.className = "number hidden";
    });

    numbers[activeNumber - 1].className = "number active";

    if (activeNumber > 1 && numbers[activeNumber - 2]) {
      numbers[activeNumber - 2].className = "number visible";
    }
    if (activeNumber < numbers.length && numbers[activeNumber]) {
      numbers[activeNumber].className = "number visible";
    }

    if (numberTrack) {
      const containerWidth = numberTrack.offsetWidth;
      const centerPosition = containerWidth / 2;
      const activeNumberElement = numbers[activeNumber - 1];
      const activeNumberPosition =
        activeNumberElement.offsetLeft + activeNumberElement.offsetWidth / 2;
      const translateX = centerPosition - activeNumberPosition;

      numberTrack.style.transition =
        "transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)";
      numberTrack.style.transform = `translateX(${translateX}px)`;
    }
  }

  #applyDefault() {
    this.params.id ??= "count-popup";
    this.params.classList ??= [];
    this.params.bottom ??= true;
    this.params.cancel ??= true;
    this.params.min ??= 3;
    this.params.max ??= 7;
    this.params.current ??= this.params.min;
  }

  #updateDisplayText() {
    const rotate = (num) => {
      const range = this.params.max - this.params.min + 1; // Calculate the range
      return (
        ((((num - this.params.min) % range) + range) % range) + this.params.min
      );
    };

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    this.params.current = clamp(
      this.params.current,
      this.params.min,
      this.params.max
    );

    const numbers = [
      rotate(this.params.current - 2),
      rotate(this.params.current - 1),
      rotate(this.params.current),
      rotate(this.params.current + 1),
      rotate(this.params.current + 2),
    ];

    for (let i = 0; i < numbers.length; i++) {
      const popupCountNumber = document.getElementById(
        `popup-count-number-${i + 1}`
      );
      popupCountNumber.innerText = numbers[i];
    }
  }
}

class AttackPopup extends PopupBase {
  constructor(params = {}) {
    super(params);
    this.init();
  }

  init() {
    this.#applyDefault();
    super.init();

    this.current = this.params.current;

    this.popupDiv.innerHTML = `
        <div id="attack-container">
          <div class="left-right-button" id="left-button">
            <img
              src="./assets/images/chevron-left-solid.svg"
              alt="left"
              id="attack-popup-left-img"
              class="attack-popup-action-img"
            />
          </div>
          <div id="attack-popup-center">
            <div id="attack-popup-dice">
            </div>
            <div id="attack-popup-name" class="kanit-900">Blitz</div>
          </div>
          <div class="left-right-button" id="right-button">
            <img
              src="./assets/images/chevron-right-solid.svg"
              alt="left"
              id="attack-popup-right-img"
              class="attack-popup-action-img"
            />
          </div>
        </div>
        `;

    const attackPopupLeft = document.getElementById("left-button");
    attackPopupLeft.addEventListener("click", () => {
      this.#updateDisplayText(-1);
    });

    const attackPopupRight = document.getElementById("right-button");
    attackPopupRight.addEventListener("click", () => {
      this.#updateDisplayText(1);
    });

    const attackPopupCenter = document.getElementById("attack-popup-center");
    attackPopupCenter.addEventListener("click", () => {
      this.resolve({ cancel: false, value: this.current });
    });
  }

  #applyDefault() {
    this.params.id ??= "attack-popup";
    this.params.bottom ??= true;
    this.params.cancel ??= true;
    this.params.max ??= 3;
    this.params.min ??= 0; // 0 representing blitz
    this.params.current ??= this.params.min === 0 ? 0 : this.params.max;
  }

  #updateDisplayText(offset) {
    const rotate = (num) => {
      const range = this.params.max - this.params.min + 1; // Calculate the range
      return (
        ((((num - this.params.min) % range) + range) % range) + this.params.min
      );
    };

    this.current = rotate(this.current + offset);

    const attackPopupDice = document.getElementById("attack-popup-dice");
    const attackDice = document.createElement("div");
    attackDice.innerHTML = `<img src="./assets/images/perspective-dice-six-faces-one.svg" class="dice" alt="dice">`;
    console.log(this.current);
    if (this.current === 0) {
      attackPopupDice.innerHTML = "";
    } else {
      attackPopupDice.appendChild(attackDice);
    }

    const attackPopupName = document.getElementById("attack-popup-name");
    attackPopupName.textContent = this.current === 0 ? "Blitz" : "Classic";
    if (this.params.defender) {
      if (this.current === 0 && winningOdds.blitz) {
        attackPopupName.textContent +=
          winningOdds[this.params.defender][this.params.max];
      }
    }
  }
}
