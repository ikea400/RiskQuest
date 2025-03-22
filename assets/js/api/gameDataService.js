//Send initial game data to the api to create game in db
export async function initializeGame(GameData){
  console.log(GameData);
  const resultat = await fetch('http://localhost/riskQuest/api/api.php/initializeGame', {
    method: 'POST',
    body: JSON.stringify({GameData}),
    headers: {
        'Accept': 'application/json', 
        'Content-Type': 'application/json'
      },
    });
  return await resultat.json();
  
}

//Send all move data to api and current game data to keep status
export async function saveMove(Move, GameData){
  const resultat = await fetch('http://localhost/riskQuest/api/api.php/saveMove', {
    method: 'POST',
    body: JSON.stringify({GameData}),
    headers: {
        'Accept': 'application/json', 
        'Content-Type': 'application/json'
      },
    });
  return await resultat.json();
  
}