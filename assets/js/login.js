window.addEventListener("pageshow", function (event) {
  sessionStorage.removeItem("token");
});

document.addEventListener("DOMContentLoaded", () => {

  // Remplisage automatic apres l'inscription
  document.getElementById("input-username").value = sessionStorage.getItem("registered-username");
  document.getElementById("input-password").value = sessionStorage.getItem("registered-password");
  sessionStorage.removeItem("registered-username");
  sessionStorage.removeItem("registered-password");

  function updateErrors(errors) {
    // Récuperer le div d'erreur
    const errorsDiv = document.getElementById("errors");
    // Remise à zéro des erreurs
    errorsDiv.innerHTML = "";

    for (const error of errors) {
      // Création du nouveau div
      const newErrorDiv = document.createElement("div");
      newErrorDiv.className = "error";
      newErrorDiv.innerText = error;
      // Attacher le nouveau div au div d'erreurs
      errorsDiv.appendChild(newErrorDiv);
    }
  }

  const formulaire = document.getElementById("formulaire");
  formulaire.addEventListener("submit", async (event) => {
    // Empêcher le rechargement de la page (GET)
    event.preventDefault();

    // Récupérer les données du formulaire
    let nomUtilisateur = document.getElementById("input-username").value.trim();
    let motDePasse = document.getElementById("input-password").value.trim();

    // Envoyer la requête à l'API
    let response = await fetch("http://localhost/riskquest/api/v1/login", {
      method: "POST",
      body: JSON.stringify({ username: nomUtilisateur, password: motDePasse }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Transformer la réponse en JSON
    let responseJSON = await response.json();
    if (responseJSON.success === true) {
      // Enleve tous les anciennes erreurs
      updateErrors([]);

      sessionStorage.setItem("token", responseJSON.token);
      sessionStorage.setItem("saved-username", nomUtilisateur);
      sessionStorage.setItem("saved-userId", responseJSON.id);
      sessionStorage.setItem("guest", false);
      window.location.href = "/riskquest/";
    } else {
      updateErrors([reponseJSON.error || "Erreur inconnue"]);
    }
  });

  const guestButton = document.getElementById("guest-btn");
  guestButton.addEventListener("click", async () => {
    // Envoyer la requête à l'API
    let reponse = await fetch("http://localhost/riskquest/api/v1/guest", {
      method: "POST",
    });

    // Transformer la réponse en JSON
    let reponseJSON = await reponse.json();
    if (reponseJSON.success === true) {
      updateErrors([]);

      sessionStorage.setItem("token", reponseJSON.token);
      sessionStorage.setItem("saved-username", reponseJSON.name);
      sessionStorage.setItem("saved-userId", reponseJSON.id);
      sessionStorage.setItem("guest", true);
      window.location.href = "/riskquest/";
    } else {
      updateErrors([reponseJSON.error || "Erreur inconnue"]);
    }
  });
});
