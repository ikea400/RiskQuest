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

        console.log("Test");

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
    this.params.classList ??= [];
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

    this.popupDiv.innerHTML = `
        <div id="popup-count-confirm">
            <img id="popup-count-confirm-img" src="./assets/images/circle-check-solid.svg" alt="next">
        </div>
        <div class="popup-count-overlay"></div>
        <div class="popup-count-countainer">
          <div id="popup-count-number-1" class="popup-count-number">1</div>
          <div id="popup-count-number-2" class="popup-count-number">2</div>
          <div id="popup-count-number-3" class="popup-count-number">3</div>
          <div id="popup-count-number-4" class="popup-count-number">4</div>
          <div id="popup-count-number-5" class="popup-count-number">5</div>
        </div>`;

    this.#updateDisplayText();

    const popupCountConfirm = document.getElementById("popup-count-confirm");
    popupCountConfirm.addEventListener("click", () => {
      this.resolve({ cancel: false });
    });
  }

  show() {
    return super.show(function () {
      console.log("SHould be there");
    });
  }

  #applyDefault() {
    this.params.id ??= "count-popup";
    this.params.classList ??= [];
    this.params.bottom ??= true;
    this.params.cancel ??= true;
    this.params.min ??= 3;
    this.params.max ??= 7;
    this.params.current ??= this.params.max;
  }

  #updateDisplayText() {
    const rotate = (num) => {
      const range = this.params.max - this.params.min + 1; // Calculate the range
      return (
        ((((num - this.params.min) % range) + range) % range) +
        this.params.min
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
      const popupCountNumber = document.getElementById(`popup-count-number-${i + 1}`);
      popupCountNumber.innerText = numbers[i];
    }
  }
}
