class Popup {
  constructor(params = {}) {
    this.params = params;
    this.init();
  }

  init() {
    this.params.id ??= "popup";
    this.params.classList ??= [];

    const backgroundDiv = document.createElement("div");
    const popupDiv = document.createElement("div");

    popupDiv.classList.add("popup");
    for (const cssClass of this.params.classList) {
      popupDiv.classList.add(cssClass);
    }

    backgroundDiv.classList.add("background-popup");

    backgroundDiv.appendChild(popupDiv);
    document.body.appendChild(backgroundDiv);

    backgroundDiv.addEventListener("click", function (event) {
      document.body.removeChild(this);

      // Get the underlying element
      const underneathElement = document.elementFromPoint(
        event.clientX,
        event.clientY
      );

      if (underneathElement) {
        // Create a custom event to simulate a click for SVG elements or paths
        const simulatedClickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });

        // Dispatch the simulated click event on the underlying element
        underneathElement.dispatchEvent(simulatedClickEvent);
      }
    });
  }
}
