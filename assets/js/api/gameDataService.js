//Send initial game data to the api to create game in db
export async function initializeGame(GameData) {
  console.log(GameData);
  const resultat = await fetch(
    "http://localhost/riskquest/api/v1/initializeGame",
    {
      method: "POST",
      body: JSON.stringify(GameData),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    }
  );
  return await resultat.json();
}

//Send all move data to api and current game data to keep status
export async function saveMove(GameData) {
  const resultat = await fetch("http://localhost/riskquest/api/v1/saveMove", {
    method: "POST",
    body: JSON.stringify(GameData),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    },
  });
  return await resultat.json();
}

export async function setAsGest() {
  const reponse = await fetch("http://localhost/riskquest/api/v1/guest", {
    method: "POST",
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  // Transformer la réponse en JSON
  return await reponse.json();
}

export async function getGame(gameId) {
  const response = await fetch(`/game/${gameId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    },
  });
  return await response.json();
}
