import { verifyPassword, verifyUsername } from "./utility.js";

document.addEventListener("DOMContentLoaded", () => {
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
    let motDePasseConfirmer = document
      .getElementById("input-confirm-password")
      .value.trim();

    if (motDePasse !== motDePasseConfirmer) {
      updateErrors(["Les mot de passes ne concordent pas"]);
    }

    const errors = [
      ...verifyPassword(motDePasse),
      ...verifyUsername(nomUtilisateur),
    ];
    updateErrors(errors);

    if (errors.length !== 0) {
      return;
    }

    // Envoyer la requête à l'API
    let reponse = await fetch("http://localhost/riskquest/api/v1/register", {
      method: "POST",
      body: JSON.stringify({ username: nomUtilisateur, password: motDePasse }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Transformer la réponse en JSON
    let reponseJSON = await reponse.json();
    if (reponseJSON.success === true) {
      sessionStorage.setItem("registered-username", nomUtilisateur);
      sessionStorage.setItem("registered-password", motDePasse);
      window.location.href = "/riskquest/login";
    } else {
      updateErrors([reponseJSON.error || "Erreure inconnue"]);
    }
  });
});
