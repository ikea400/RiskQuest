import { winningOdds } from "./game/data.js";

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

export class CountPopup extends PopupBase {
  constructor(params = {}) {
    super(params);
    this.init();
  }

  init() {
    this.#applyDefault();
    super.init();

    this.isDragging = false;
    this.moved = false;
    this.startingOffset = 0;
    this.currentOffset = null;
    this.lastOffsets = 0;
    this.lastValue = null;

    this.popupDiv.innerHTML = `
        <div id="popup-count-cancel-back"></div>
        <div id="popup-count-cancel">
          <img
            id="popup-count-cancel-img"
            src="./assets/images/circle-x.svg"
            alt="next"
          />
        </div>
        <div id="popup-count-confirm-back"></div>
        <div id="popup-count-confirm">
          <img
            id="popup-count-confirm-img"
            src="./assets/images/circle-check-solid.svg"
            alt="next"
          />
        </div>
        <div id="popup-count-overlay"></div>
        <div id="popup-count-overlay-back"></div>
        <div id="popup-count-countainer" autofocus>
          <div id="popup-count-number-1" class="popup-count-number">1</div>
          <div id="popup-count-number-2" class="popup-count-number">2</div>
          <div id="popup-count-number-3" class="popup-count-number">3</div>
          <div id="popup-count-number-4" class="popup-count-number">4</div>
          <div id="popup-count-number-5" class="popup-count-number">5</div>
        </div>`;

    this.#updateNumbers();

    const container = document.getElementById("popup-count-countainer");
    container.focus();

    container.addEventListener("mousedown", (event) => {
      this.isDragging = true;
      this.startingOffset = event.clientX;
      this.moved = false;
    });

    container.addEventListener("mouseleave", () => {
      this.isDragging = false;
      this.#updateNumbers();
    });

    container.addEventListener("mouseup", (event) => {
      this.isDragging = false;
      if (!this.moved) {
        const rect = container.getBoundingClientRect();
        this.currentOffset -= event.clientX - (rect.right + rect.left) * 0.5;
        this.startingOffset = event.clientX;
      }
      this.#updateNumbers();
    });

    container.addEventListener("mousemove", (event) => {
      if (this.isDragging) {
        this.moved = true;

        this.currentOffset += event.clientX - this.startingOffset;
        this.startingOffset = event.clientX;
        this.#updateNumbers();
      }
    });

    container.addEventListener(
      "wheel",
      (event) => {
        const rect = document
          .querySelector(".popup-count-number")
          .getBoundingClientRect();
        this.currentOffset += rect.width * Math.sign(event.deltaY);
        this.#updateNumbers();
      },
      { passive: true }
    );

    document.addEventListener("keyup", (event) => {
      switch (event.key) {
        case "Enter":
          this.resolve({ cancel: false, value: this.value });
          break;
        case "Escape":
          this.resolve({ cancel: true });
          break;
      }
    });

    const popupCountConfirm = document.getElementById("popup-count-confirm");
    popupCountConfirm.addEventListener("click", () => {
      this.resolve({ cancel: false, value: this.value });
    });

    const popupCountCancel = document.getElementById("popup-count-cancel");
    if (this.params.cancel === true) {
      popupCountCancel.addEventListener("click", () => {
        this.resolve({ cancel: true });
      });
    } else {
      popupCountCancel.hidden = true;
      popupCountCancel.style.opacity = 0;
      popupCountCancel.style.pointerEvents = "none";
      document.getElementById("popup-count-cancel-back").hidden = true;
    }
  }

  #applyDefault() {
    this.params.id ??= "count-popup";
    this.params.bottom ??= true;
    this.params.cancel ??= true;
    this.params.current ??= this.params.max;
    this.params.tempCallback ??= () => {};
    this.params.speed ??= 5;
  }

  #updateNumbers() {
    const rotate = (num) => {
      const range = this.params.max - this.params.min + 1; // Calculate the range
      return (
        ((((num - this.params.min) % range) + range) % range) + this.params.min
      );
    };

    const numbersDiv = document.getElementsByClassName("popup-count-number");

    const rect = numbersDiv[0].getBoundingClientRect();

    if (this.currentOffset == null) {
      this.currentOffset =
        rect.width *
        (this.params.max - this.params.current + (3 - this.params.min + 1));
    }

    if (!this.isDragging) {
      this.currentOffset =
        Math.round(this.currentOffset / rect.width) * rect.width;
    }

    let current = 3 - Math.round(this.currentOffset / rect.width);

    const duration =
      Math.abs(this.currentOffset - this.lastOffsets) /
      (rect.width * this.params.speed); // Time = Distance / Speed
    for (const number of numbersDiv) {
      number.style.transition = this.isDragging
        ? ""
        : `transform ${duration}s linear`;
      number.style.transform = `translateX(${
        this.currentOffset - (3 - current) * rect.width
      }px)`;
    }
    this.lastOffsets = this.currentOffset;

    const numbers = [
      rotate(current - 2),
      rotate(current - 1),
      rotate(current),
      rotate(current + 1),
      rotate(current + 2),
    ];

    this.value = numbers[2];
    if (this.lastValue !== this.value) {
      this.params.tempCallback(this.value);
      this.lastValue = this.value;
    }

    for (let i = 0; i < numbers.length; i++) {
      const popupCountNumber = document.getElementById(
        `popup-count-number-${i + 1}`
      );
      popupCountNumber.innerText = numbers[i];
    }
  }
}

export class AttackPopup extends PopupBase {
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

    this.#updateDisplayText(0);

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
    console.log(this.current);

    const attackPopupDice = document.getElementById("attack-popup-dice");

    let dices = "";
    for (let i = 0; i < this.current; i++) {
      dices += `<div>
                  <img src="./assets/images/perspective-dice-six-faces-one.svg" class="dice" alt="dice"/>
                </div>`;
    }

    attackPopupDice.innerHTML = dices;

    const attackPopupName = document.getElementById("attack-popup-name");
    attackPopupName.textContent = this.current === 0 ? "Blitz" : "Classic";

    if (this.params.defender && this.params.attacker) {
      let odds;
      if (this.current === 0 && winningOdds.blitz) {
        odds = winningOdds.blitz;
      } else if (this.current > 0 && winningOdds.classic) {
        odds = winningOdds.classic;
      }

      if (odds) {
        attackPopupName.textContent += `(${Math.floor(
          odds[this.params.attacker][this.params.defender] * 100
        )}%)`;
      }
    }
  }
}

export class SettingsPopup extends PopupBase {
  constructor(params = {}) {
    super(params);
    this.init();
  }

  init() {
    this.#applyDefault();
    super.init();


  }

  #applyDefault() {
    this.params.id ??= "popup-settings";
  }
}
