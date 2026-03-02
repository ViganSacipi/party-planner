// === Constants ===
const BASE = "https://fsa-crud-2aa9294fe819.herokuapp.com/api";
const COHORT = "/2601-ftb-ct-web-pt";
const API = BASE + COHORT;

// === State ===
let parties = [];
let selectedParty;
let rsvps = [];
let guests = [];

/** Updates state with all parties from the API */
async function getParties() {
  try {
    const response = await fetch(API + "/events");
    const result = await response.json();
    parties = result.data;
    render();
  } catch (e) {
    console.error(e);
  }
}

/** Updates state with a single party from the API */
async function getParty(id) {
  try {
    const response = await fetch(API + "/events/" + id);
    const result = await response.json();
    selectedParty = result.data;
    render();
  } catch (e) {
    console.error(e);
  }
}

/** Updates state with all RSVPs from the API */
async function getRsvps() {
  try {
    const response = await fetch(API + "/rsvps");
    const result = await response.json();
    rsvps = result.data;
    render();
  } catch (e) {
    console.error(e);
  }
}

/** Updates state with all guests from the API */
async function getGuests() {
  try {
    const response = await fetch(API + "/guests");
    const result = await response.json();
    guests = result.data;
    render();
  } catch (e) {
    console.error(e);
  }
}

// === API Actions ===

/** Create a new party via POST, then refresh parties */
async function addParty(partyFromForm) {
  try {
    // API expects date as an ISO string
    const isoDate = new Date(partyFromForm.date).toISOString();

    const response = await fetch(API + "/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: partyFromForm.name,
        description: partyFromForm.description,
        date: isoDate,
        location: partyFromForm.location,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("POST /events failed:", result);
      return;
    }

    // refresh list and optionally select the new party
    await getParties();
    if (result?.data?.id) await getParty(result.data.id);
  } catch (e) {
    console.error(e);
  }
}

/** Delete selected party via DELETE, then refresh parties */
async function deleteSelectedParty() {
  if (!selectedParty) return;

  try {
    const response = await fetch(API + "/events/" + selectedParty.id, {
      method: "DELETE",
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("DELETE /events/:id failed:", result);
      return;
    }

    selectedParty = undefined;
    await getParties();
    render();
  } catch (e) {
    console.error(e);
  }
}

// === Components ===

/** Party name that shows more details about the party when clicked */
function PartyListItem(party) {
  const $li = document.createElement("li");

  if (party.id === selectedParty?.id) {
    $li.classList.add("selected");
  }

  $li.innerHTML = `
    <a href="#selected">${party.name}</a>
  `;
  $li.addEventListener("click", () => getParty(party.id));
  return $li;
}

/** A list of names of all parties */
function PartyList() {
  const $ul = document.createElement("ul");
  $ul.classList.add("parties");

  const $parties = parties.map(PartyListItem);
  $ul.replaceChildren(...$parties);

  return $ul;
}

/** Form to create a new party */
function NewPartyForm() {
  const $form = document.createElement("form");
  $form.classList.add("new-party-form");

  $form.innerHTML = `
    <h2>Create New Party</h2>

    <label>
      Name
      <input name="name" required />
    </label>

    <label>
      Description
      <input name="description" required />
    </label>

    <label>
      Date
      <input name="date" type="date" required />
    </label>

    <label>
      Location
      <input name="location" required />
    </label>

    <button type="submit">Add Party</button>
  `;

  $form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData($form);
    const party = {
      name: formData.get("name"),
      description: formData.get("description"),
      date: formData.get("date"), // YYYY-MM-DD from <input type="date">
      location: formData.get("location"),
    };

    await addParty(party);
    $form.reset();
  });

  return $form;
}

/** Detailed information about the selected party */
function SelectedParty() {
  if (!selectedParty) {
    const $p = document.createElement("p");
    $p.textContent = "Please select a party to learn more.";
    return $p;
  }

  const $party = document.createElement("section");
  $party.innerHTML = `
    <h3>${selectedParty.name} #${selectedParty.id}</h3>
    <time datetime="${selectedParty.date}">
      ${selectedParty.date.slice(0, 10)}
    </time>
    <address>${selectedParty.location}</address>
    <p>${selectedParty.description}</p>

    <button class="delete-party">Delete This Party</button>

    <GuestList></GuestList>
  `;

  $party.querySelector("GuestList").replaceWith(GuestList());

  $party.querySelector(".delete-party").addEventListener("click", () => {
    deleteSelectedParty();
  });

  return $party;
}

/** List of guests attending the selected party */
function GuestList() {
  const $ul = document.createElement("ul");

  const guestsAtParty = guests.filter((guest) =>
    rsvps.find(
      (rsvp) => rsvp.guestId === guest.id && rsvp.eventId === selectedParty.id
    )
  );

  const $guests = guestsAtParty.map((guest) => {
    const $guest = document.createElement("li");
    $guest.textContent = guest.name;
    return $guest;
  });

  $ul.replaceChildren(...$guests);
  return $ul;
}

// === Render ===
function render() {
  const $app = document.querySelector("#app");
  $app.innerHTML = `
    <h1>Party Planner</h1>
    <main>
      <section>
        <h2>Upcoming Parties</h2>
        <PartyList></PartyList>
        <NewPartyForm></NewPartyForm>
      </section>
      <section id="selected">
        <h2>Party Details</h2>
        <SelectedParty></SelectedParty>
      </section>
    </main>
  `;

  $app.querySelector("PartyList").replaceWith(PartyList());
  $app.querySelector("NewPartyForm").replaceWith(NewPartyForm());
  $app.querySelector("SelectedParty").replaceWith(SelectedParty());
}

async function init() {
  await getParties();
  await getRsvps();
  await getGuests();
  render();
}

init();