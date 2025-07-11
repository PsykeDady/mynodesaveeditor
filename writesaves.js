
const fs = require("fs");
const path = require("path");
const LZString = require("lz-string");
const readline = require("readline");

// Funzione di utilità per input da terminale
function promptInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Percorso base passato da argomento
const basePath = process.argv[2];
if (!basePath) {
  console.error("❌ Errore: devi fornire il percorso alla cartella 'www'.");
  console.error("Uso: node writesaves.js /percorso/alla/cartella/www");
  process.exit(1);
}

const savePath = path.join(basePath, "save", "file1.rpgsave");

// Leggi il salvataggio
function leggiSalvataggio(filePath) {
  const base64Data = fs.readFileSync(filePath, "utf8");
  const decompressed = LZString.decompressFromBase64(base64Data);
  if (!decompressed) throw new Error("Decompressione fallita.");
  return JSON.parse(decompressed);
}

// Scrivi il salvataggio
function scriviSalvataggio(filePath, jsonData) {
  const jsonString = JSON.stringify(jsonData);
  const compressed = LZString.compressToBase64(jsonString);
  fs.writeFileSync(filePath, compressed, "utf8");
}

// Main async per prompt interattivo
async function main() {
  const saveData = leggiSalvataggio(savePath);

  console.log("\nPrompt: Cosa vuoi cambiare?");
  console.log("1 - Soldi");
  console.log("2 - Esci");

  const scelta = await promptInput("> ");

  switch (scelta.trim()) {
    case "1":
      const attuali = saveData.party?._gold || 0;
      console.log(`💰 Oro attuale: ${attuali}`);
      const nuovoVal = await promptInput("Inserisci il nuovo ammontare: ");
      const nuovoNumero = parseInt(nuovoVal);
      if (!isNaN(nuovoNumero)) {
        saveData.party._gold = nuovoNumero;
        scriviSalvataggio(savePath+'.new', saveData);
        console.log("✅ Salvataggio aggiornato con successo.");
      } else {
        console.log("❌ Valore non valido.");
      }
      break;

    case "2":
      console.log("Uscita...");
      break;

    default:
      console.log("❌ Scelta non valida.");
  }
}

main();
