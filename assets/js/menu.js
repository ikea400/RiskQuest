window.addEventListener("pageshow", function (event) {
  // S'assurer qu'un token et username est disponible sinon redirection vers la page principale
  if (
    !sessionStorage.getItem("token") ||
    !sessionStorage.getItem("saved-username") ||
    !sessionStorage.getItem("saved-userId")
  ) {
    window.location.replace("/riskquest/login");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const humanPastilles = document.querySelectorAll("#human-players .pastille");
  const botPastilles = document.querySelectorAll("#bot-players .pastille");
  const playButton = document.getElementById("play-button");
  const statusMessage = document.getElementById("status-message");

  // Objet pour stocker les couleurs sélectionnées pour les humains et les bots
  const selectedPlayers = {
    human: [],
    bot: [],
  };

  // Met à jour l'état des pastilles (activation/désactivation)
  function updatePastilleStates() {
    // Réactive toutes les pastilles
    humanPastilles.forEach((pastille) => {
      pastille.classList.remove("disabled");
    });

    botPastilles.forEach((pastille) => {
      pastille.classList.remove("disabled");
    });

    // Désactive les pastilles bots ayant des couleurs déjà choisies par un humain
    selectedPlayers.human.forEach((color) => {
      const matchingBotPastille = document.querySelector(
        `#bot-players .pastille[data-color="${color}"]`
      );
      if (matchingBotPastille) {
        matchingBotPastille.classList.add("disabled");
      }
    });

    // Désactive les pastilles humains ayant des couleurs déjà choisies par un bot
    selectedPlayers.bot.forEach((color) => {
      const matchingHumanPastille = document.querySelector(
        `#human-players .pastille[data-color="${color}"]`
      );
      if (matchingHumanPastille) {
        matchingHumanPastille.classList.add("disabled");
      }
    });
  }

  // Vérifie si la configuration du jeu est valide
  function validateGameSetup() {
    const totalPlayers =
      selectedPlayers.human.length + selectedPlayers.bot.length;
    const hasHumanPlayer = selectedPlayers.human.length > 0;

    // Moins de 3 joueurs
    if (totalPlayers < 3) {
      statusMessage.textContent = "Sélectionnez au moins 3 joueurs au total";
      playButton.disabled = true;
      playButton.classList.remove("valid");
      return false;
    }

    // Aucun joueur humain
    if (!hasHumanPlayer) {
      statusMessage.textContent = "Sélectionnez au moins 1 joueur humain";
      playButton.disabled = true;
      playButton.classList.remove("valid");
      return false;
    }

    // Plus de 6 joueurs
    if (totalPlayers > 6) {
      statusMessage.textContent = "Maximum de 6 joueurs autorisé";
      playButton.disabled = true;
      playButton.classList.remove("valid");
      return false;
    }

    // Configuration valide
    statusMessage.textContent = "";
    playButton.disabled = false;
    playButton.classList.add("valid");
    return true;
  }

  // Gère le clic sur une pastille
  function handlePastilleClick(e) {
    const pastille = e.target;
    const type = pastille.dataset.type; // "human" ou "bot"
    const color = pastille.dataset.color;

    // Ignore si la pastille est désactivée
    if (pastille.classList.contains("disabled")) {
      return;
    }

    // Si la pastille était déjà sélectionnée, on la désélectionne
    if (pastille.classList.contains("selected")) {
      pastille.classList.remove("selected");
      selectedPlayers[type] = selectedPlayers[type].filter((c) => c !== color);
    } else {
      // Sinon, on la sélectionne
      pastille.classList.add("selected");
      selectedPlayers[type].push(color);
    }

    // Met à jour l'interface
    updatePastilleStates();
    validateGameSetup();
  }

  // Ajoute les écouteurs de clic pour toutes les pastilles
  humanPastilles.forEach((pastille) => {
    pastille.addEventListener("click", handlePastilleClick);
  });

  botPastilles.forEach((pastille) => {
    pastille.addEventListener("click", handlePastilleClick);
  });

  // Gère le bouton "quitter"
  document.getElementById("exit-button").addEventListener("click", function () {
    window.location.href = "login"; // Redirige vers la page de login
  });

  // Gère le clic sur le bouton "jouer"
  playButton.addEventListener("click", function () {
    if (validateGameSetup()) {
      const randomAssignment =
        document.getElementById("random-assignment").checked;
      window.location.href = "game"; // Redirige vers le jeu
    }
  });

  // Sélectionne automatiquement la première pastille humaine (couleur 1) par défaut
  const firstHumanPastille = document.querySelector(
    '#human-players .pastille[data-color="1"]'
  );
  if (firstHumanPastille) {
    firstHumanPastille.classList.add("selected");
    selectedPlayers.human.push("1");
    updatePastilleStates();
    validateGameSetup();
  }
});
