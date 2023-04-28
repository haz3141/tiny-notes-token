const tokenAddress = "0x476011Dc7fa97C9C44B64C2bf2c75C0e5A9591f5";
const faucetAddress = "0x1E6EE46a4D508B4f4BA5A4B1A1088F28B6fBca1c";

let web3, accounts, tntBalance, tokenContract, faucetContract;

async function initWeb3() {
  if (typeof window.ethereum !== "undefined") {
    web3 = new Web3(window.ethereum);
    accounts = await web3.eth.getAccounts();
    balance = displayBalance();

    // Load ABIs
    const tokenABI = await loadABI("TinyNotesTokenABI.json");
    const faucetABI = await loadABI("TinyNotesTokenFaucetABI.json");

    // Initialize contracts
    tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
    faucetContract = new web3.eth.Contract(faucetABI, faucetAddress);

    document.getElementById(
      "address"
    ).textContent = `Connected: ${truncateAddress(accounts[0])}`;

    // Event listeners
    document
      .getElementById("request-tokens")
      .addEventListener("click", requestTokens);
    document
      .getElementById("create-note")
      .addEventListener("click", createNote);

    // Toggle create note button
    toggleCreateNoteButton(balance);

    // Load existing notes
    loadNotes();
  } else {
    document.getElementById("no-metamask").style.display = "block";
  }
}

async function requestTokens() {
  try {
    await faucetContract.methods.requestTokens().send({ from: accounts[0] });
    alert("Tokens successfully requested!");
  } catch (error) {
    console.error(error);
    alert("Error requesting tokens. Check the console for more information.");
  }
}

async function createNote() {
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;

  try {
    await tokenContract.methods
      .createNote(title, content)
      .send({ from: accounts[0] });
    alert("Note successfully created!");
    loadNotes();
  } catch (error) {
    console.error(error);
    alert("Error creating note. Check the console for more information.");
  }
}

async function loadNotes() {
  const notesDiv = document.getElementById("notes");
  notesDiv.innerHTML = "";

  const totalNotes = await tokenContract.methods.noteIds().call();

  for (let noteId = 0; noteId <= totalNotes; noteId++) {
    const noteData = await tokenContract.methods.readNote(noteId).call();
    const noteElement = document.createElement("div");
    noteElement.className = "note";
    noteElement.innerHTML = `
            <h2 class="note-title">${noteData.title}</h2>
            <p class="note-content">${noteData.content}</p>
            <p class="note-creator">Created by: ${noteData.creator}</p>
        `;
    notesDiv.appendChild(noteElement);
  }
}

function truncateAddress(address) {
  const start = address.slice(0, 6);
  const end = address.slice(-6);
  return `${start}...${end}`;
}

async function displayBalance() {
  const balance = await tokenContract.methods.balanceOf(accounts[0]).call();
  const formattedBalance = web3.utils.fromWei(balance, "ether");
  document.getElementById("tnt-balance").textContent = formattedBalance;
  return formattedBalance;
}

async function toggleCreateNoteButton(balance) {
  const createNoteButton = document.getElementById("create-note");
  if (balance > 0) {
    createNoteButton.disabled = false;
    createNoteButton.textContent = "Create Note";
  } else {
    createNoteButton.disabled = true;
    createNoteButton.textContent = "Must hold TNT to post";
  }
}

async function loadABI(filename) {
  try {
    const response = await fetch(`./abis/${filename}`);
    const json = await response.json();
    return json;
  } catch (error) {
    console.error(`Error loading ABI: ${filename}`, error);
  }
}

// Initialize web3 and app
initWeb3();
