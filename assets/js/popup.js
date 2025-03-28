import { EBotSpeed, winningOdds } from "./game/data.js";

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
      console.log("Should be there");
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
    this.wheelAccumulatedDelta = 0;

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
      this.wheelAccumulatedDelta = 0;
    });

    container.addEventListener("mouseleave", () => {
      this.isDragging = false;
      this.#updateNumbers();
      this.wheelAccumulatedDelta = 0;
    });

    container.addEventListener("mouseup", (event) => {
      this.isDragging = false;
      if (!this.moved) {
        const rect = container.getBoundingClientRect();
        this.currentOffset -= event.clientX - (rect.right + rect.left) * 0.5;
        this.startingOffset = event.clientX;
      }
      this.#updateNumbers();
      this.wheelAccumulatedDelta = 0;
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
        const DOM_DELTA_PIXEL = 0;
        // Valeur arbritraire qui peux etre changer pour
        // changer la vitesse avec les tracpad et certaines souris
        const MIN_PIXEL_DELTA = 60;

        if (Math.abs(event.deltaY) > 0) {
          if (
            Math.sign(this.wheelAccumulatedDelta) != Math.sign(event.deltaY)
          ) {
            this.wheelAccumulatedDelta = 0;
          }
          this.wheelAccumulatedDelta +=
            event.deltaMode == DOM_DELTA_PIXEL ? event.deltaY : MIN_PIXEL_DELTA;
          if (Math.abs(this.wheelAccumulatedDelta) >= MIN_PIXEL_DELTA) {
            const rect = document
              .querySelector(".popup-count-number")
              .getBoundingClientRect();
            this.currentOffset +=
              rect.width * Math.sign(this.wheelAccumulatedDelta);
            this.#updateNumbers();
            this.wheelAccumulatedDelta = 0;
          }
        }
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

    this.popupDiv.innerHTML = `<div id="popup-settings-top">
          <div id="popup-settings-top-play-stop">
            <div class="popup-settings-top-button">
              <div
                id="popup-settings-stop-back"
                class="popup-settings-top-back"
              ></div>
              <div id="popup-settings-stop" class="popup-settings-img">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 320 512"
                  id="popup-settings-stop-svg"
                >
                  <!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                  <path
                    id="popup-settings-stop-path"
                    d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"
                  />
                </svg>
              </div>
            </div>
            <div class="popup-settings-top-button">
              <div
                id="popup-settings-play-back"
                class="popup-settings-top-back"
              ></div>
              <div id="popup-settings-play" class="popup-settings-img">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 384 512"
                  id="popup-settings-play-svg"
                >
                  <!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                  <path
                    id="popup-settings-play-path"
                    d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div id="popup-settings-title" class="kanit-900">Settings</div>
          <div id="popup-settings-top-close" class="popup-settings-top-button">
            <div
              id="popup-settings-close-back"
              class="popup-settings-top-back"
            ></div>
            <div id="popup-settings-close" class="popup-settings-img">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 352 512"
                id="popup-settings-close-svg"
              >
                <!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                <path
                  id="popup-settings-close-path"
                  d="M242.7 256l100.1-100.1c12.3-12.3 12.3-32.2 0-44.5l-22.2-22.2c-12.3-12.3-32.2-12.3-44.5 0L176 189.3 75.9 89.2c-12.3-12.3-32.2-12.3-44.5 0L9.2 111.5c-12.3 12.3-12.3 32.2 0 44.5L109.3 256 9.2 356.1c-12.3 12.3-12.3 32.2 0 44.5l22.2 22.2c12.3 12.3 32.2 12.3 44.5 0L176 322.7l100.1 100.1c12.3 12.3 32.2 12.3 44.5 0l22.2-22.2c12.3-12.3 12.3-32.2 0-44.5L242.7 256z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div class="popup-settings-line"></div>
        <div id="popup-settings-categories">
          <div
            id="popup-settings-category-sound"
            class="popup-settings-category"
          >
            <label for="music" class="kanit-900">Volume</label>
            <input
              type="range"
              id="popup-settings-music"
              class="popup-settings-slider"
              name="music"
              min="0"
              max="100"
            />
            <label for="sfx" class="kanit-900">SFX</label>
            <input
              type="range"
              id="popup-settings-sfx"
              class="popup-settings-slider"
              name="sfx"
              min="0"
              max="100"
            />
          </div>
          <div class="popup-settings-line"></div>
          <div id="popup-settings-category-ui" class="popup-settings-category">
            <label for="scale" class="kanit-900">UI Scale</label>
            <input
              type="range"
              id="popup-settings-scale"
              class="popup-settings-slider"
              name="scale"
              min="0"
              max="100"
            />
          </div>
          <div class="popup-settings-line"></div>
          <div id="popup-settings-category-bot" class="popup-settings-category">
            <label for="speed" class="kanit-900">Bot Speed</label>
            <input
              type="range"
              id="popup-settings-speed"
              class="popup-settings-slider"
              min="0"
              max="2"
            />
          </div>
          <div class="popup-settings-line"></div>
        </div>`;

    const sliders = document.getElementsByClassName("popup-settings-slider");
    const updateSliderGradiant = (slider) => {
      slider.style.background = `linear-gradient(to right, #78cff1 0%, #78cff1 ${
        ((slider.value - slider.min) / (slider.max - slider.min)) * 100
      }%, #151515 ${
        ((slider.value - slider.min) / (slider.max - slider.min)) * 100
      }%, #151515 100%)`;
    };

    document.getElementById("popup-settings-music").value =
      this.params.volumeMusic * 100;
    document.getElementById("popup-settings-sfx").value =
      this.params.volumeSFX * 100;
    for (const slider of sliders) {
      updateSliderGradiant(slider);

      slider.addEventListener("input", (event) => {
        updateSliderGradiant(event.currentTarget);
        switch (event.currentTarget.id) {
          case "popup-settings-music":
            this.params.music(slider.value * 0.01);
            break;
          case "popup-settings-sfx":
            this.params.sfx(slider.value * 0.01);
            break;
          case "popup-settings-speed":
            this.params.speed(
              [EBotSpeed.SLOW, EBotSpeed.NORMAL, EBotSpeed.FAST][slider.value]
            );
            break;
        }
      });
    }

    const popupSettingsTopClose = document.getElementById(
      "popup-settings-top-close"
    );
    popupSettingsTopClose.addEventListener("click", () => {
      this.resolve({ cancel: false });
    });
  }

  #applyDefault() {
    this.params.id ??= "popup-settings";
    this.params.bottom ??= true;
    this.params.cancel ??= true;
    this.params.music ??= () => {};
    this.params.sfx ??= () => {};
    this.params.ui ??= () => {};
    this.params.speed ??= (speed) => {};
    this.params.volumeMusic ??= 0.5;
    this.params.volumeSFX ??= 0.5;

    console.log(this.params.volumeMusic);
  }
}

export class CardPopup extends PopupBase {
  constructor(params = {}) {
    super(params);
    this.init();
  }
  init() {
    super.init();

    this.popupDiv.innerHTML = `

    <header id="popup-cards-header">
      <h1 id="popup-cards-title">Cards</h1>
    </header>

    <div id="flex-center-popup-cards">
      <div id="selected-card-1" class="selected-card-holder">
        <img class='image-card' src='./assets/images/riskCardInfantry.png' alt='infantry'img>
      </div>

      <div id="selected-card-2" class="selected-card-holder">
        <img class='image-card' src='./assets/images/riskCardCavalry.png' alt='cavalry'img>
      </div>

      <div id="selected-card-3" class="selected-card-holder">
        
      </div>
      
      
      
    </div>

    <div id="popup-cards-button-container">
      <div id="popup-background-image-button-close">
        <img id="card-cancel-button-background" src="./assets/images/riskCancelButton.png" alt="close">
        <button id="popup-cards-button-close">
          <img id="popup-image-close" src="./assets/images/riskXImage.png" alt="close">
        </button>
      </div>

      <button id="popup-cards-button">
        <span id="trade-text">Trade cards</span>
        <span id="extra-troops-count">+10</span>
      </button>
    </div>
    
    <footer id="popup-cards-footer">
      <div id="popup-cards-remaining-cards">
        <div class="card-wrapper">
          <img class='image-card' src='./assets/images/riskCardCavalry.png' alt='cavalry'img>
        </div>
        <img class='image-card' src='./assets/images/riskCardCavalry.png' alt='cavalry'img>
        <img class='image-card' src='./assets/images/riskCardJoker.png' alt='cavalry'img>
        <img class='image-card' src='./assets/images/riskCardCavalry.png' alt='cavalry'img>
        <img class='image-card' src='./assets/images/riskCardCavalry.png' alt='cavalry'img>
      </div>
    </footer>
    `;

    document
      .getElementById("popup-cards-button-close")
      .addEventListener("click", function () {
        document.getElementById("popup-cards-container").remove();
      });

    this.backgroundDiv.classList.add("background-popup-cards");
    this.backgroundDiv.classList.remove("background-popup-center");
    this.backgroundDiv.id = "popup-cards-container";
  }
}
