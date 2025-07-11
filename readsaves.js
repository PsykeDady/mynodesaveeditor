const fs = require("fs");
const path = require("path");
const LZString = require("lz-string");

// Richiede il path alla cartella www
const basePath = process.argv[2];
if (!basePath) {
  console.error("❌ Errore: devi fornire il percorso alla cartella 'www'.");
  console.error("Uso: node readsaves.js /percorso/alla/cartella/www");
  process.exit(1);
}

// Percorsi ai file
const savePath = path.join(basePath, "save", "file1.rpgsave");
const itemsPath = path.join(basePath, "data", "Items.json");

const SystemPath = path.join(basePath, "data", "System.json");

const actorsPath = path.join(basePath, "data", "Actors.json");

// Funzione per leggere e decomprimere il salvataggio
function leggiSalvataggio(filePath) {
  const base64Data = fs.readFileSync(filePath, "utf8");
  const decompressed = LZString.decompressFromBase64(base64Data);
  if (!decompressed) {
    throw new Error("Decompressione fallita. Il file potrebbe non essere compatibile o danneggiato.");
  }
  return JSON.parse(decompressed);
}

// Funzione per caricare gli oggetti
function caricaOggetti(filePath) {
  const json = fs.readFileSync(filePath, "utf8");
  const lista = JSON.parse(json);
  const mappa = {};
  for (const item of lista) {
    if (item?.id && item?.name) {
      mappa[item.id] = item.name;
    }
  }
  return mappa;
}

function mainSolo() { 
    try {
      const saveData = leggiSalvataggio(savePath);
    
      console.log("\n📦 Contenuto completo del salvataggio:");
      console.log(JSON.stringify(saveData, null, 2));  // stampa tutto ben formattato
    
    } catch (err) {
      console.error("❌ Errore:", err.message);
    }
}

function mainMulti() {
  try {
    const saveData = leggiSalvataggio(savePath);
    const itemMap = caricaOggetti(itemsPath);
    const actorList = JSON.parse(fs.readFileSync(actorsPath, "utf8"));
    const systemData = JSON.parse(fs.readFileSync(SystemPath, "utf8"));

    // Mappa attori
    const actorIdToName = {};
    for (const actor of actorList) {
      if (actor && actor.id && actor.name) {
        actorIdToName[actor.id] = actor.name;
      }
    }

    // Mappa switch
    const switchList = systemData.switches || [];
    const switchIdToName = {};
    switchList.forEach((name, i) => {
      if (name) switchIdToName[i] = name;
    });

    // Mappa variabili
    const variableList = systemData.variables || [];
    const variableIdToName = {};
    variableList.forEach((name, i) => {
      if (name) variableIdToName[i] = name;
    });

    // Oggetti
    console.log("\n🎒 Oggetti nell'inventario:");
    const inventory = saveData.party?._items || {};
    Object.entries(inventory).forEach(([id, num]) => {
      const nome = itemMap[+id] || `(ID ${id}) sconosciuto`;
      console.log(`– ${nome}: ${num}`);
    });

    // Oro
    const gold = saveData.party?._gold || 0;
    console.log("\n💰 Silver:", gold);

    // Posizione
    const mapId = saveData.player?._mapId;
    const x = saveData.player?._x;
    const y = saveData.player?._y;
    if (mapId != null && x != null && y != null) {
      console.log(`📍 Posizione: Mappa ${mapId}, X=${x}, Y=${y}`);
    } else {
      console.log("📍 Posizione: (dati mappa non disponibili)");
    }

    // Personaggi nel party
    const partyActors = saveData.party?._actors || [];
    const actorNames = partyActors.map(id => actorIdToName[id] || `(ID ${id})`);
    console.log("👥 Personaggi nel party:", actorNames.join(", "));

    // Switch attivi
    const switches = saveData.switches?._data || [];
    console.log("\n🧭 Switch attivi:");
    switches.forEach((value, id) => {
      if (value === true && switchIdToName[id]) {
        console.log(`✓ ${switchIdToName[id]} (ID ${id})`);
      }
    });

    // Variabili settate (escludi null/undefined/zero)
    const variables = saveData.variables?._data || [];
    console.log("\n📊 Variabili settate:");
    variables.forEach((val, id) => {
      if (val && variableIdToName[id]) {
        console.log(`${variableIdToName[id]} (ID ${id}): ${val}`);
      }
    });

  } catch (err) {
    console.error("❌ Errore:", err.message);
  }
}


const mode = process.argv[3];  

if (mode === "full") {
  mainMulti();
} else {
  mainSolo();
}
