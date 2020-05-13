const urls = ['events.json', 'ncGZ.json', 'ncRZ.json'];
let jsonArray = [];
let eventsArray = [];
let zaalArray = [];
let voorstellingen = [];
let kleedkamersArray = [];

waitFordata();

// Reload page every 4 hours        1s     1m   1h   4h
setTimeout(() => location.reload(), 1000 * 60 * 60 * 4);

// async method
async function waitFordata() {
  await getData(urls[0]);
  await getData(urls[1]);
  await getData(urls[2]);

  // set data variables
  let eventsJson = jsonArray[0];
  let groteZaalJson = jsonArray[1];
  let raboZaalJson = jsonArray[2];
  let mergedJson = groteZaalJson.concat(raboZaalJson);

  // Process events json data
  processEvents(eventsJson);

  // Process zaal json data
  processZalen(mergedJson);

  // Combine events and zaal data
  combineData(eventsArray, zaalArray);

  // Create kleedkamers
  createKleedkamers(voorstellingen);

  // Create html
  createHTML(kleedkamersArray);
}

// function to get JSON data and push to jsonArray
function getData(url) {
  return new Promise((resolve, reject) => {
    fetch(url).then((response) => {
      return response.json().then((result) => {
        jsonArray.push(result.data);
        return resolve();
      });
    });
  });
}

// Process Event Data
function processEvents(eventsData) {
  let eventObj;

  // Loop over the events array, create data variables
  eventsData.forEach((event) => {
    let eventid = event.id;
    let locatie = event.locations[0].name;
    let start = event.defaultschedulestarttime;
    let eind = event.defaultscheduleendtime;

    // if the location of the event is either grote zaal or rabo zaal, set objects and push to array
    if (locatie.toLowerCase() == 'grote zaal' || locatie.toLowerCase() == 'rabo zaal') {
      eventObj = {
        eventid: eventid,
        locatie: locatie,
        start: start,
        eind: eind,
      };
      eventsArray.push(eventObj);
    }
  });
  // sort array by eventID
  eventsArray.sort(compareID);
}

// Process Zalen data
function processZalen(zaalData) {
  let zaalObj;

  // Loop over array, create data variables
  zaalData.forEach((voorstelling) => {
    let eventid = voorstelling.event.id;
    let titel = voorstelling.items[0].children[0].value;
    let artiest = voorstelling.items[0].children[1].value;
    let kleedkamers = voorstelling.items[2].children;
    let pauze = voorstelling.items[4].children[1].value;
    let vb;
    let afb;

    // Only set value if it exists
    if (voorstelling.items[3].value !== null) {
      vb = voorstelling.items[3].value.contact.name;
    }

    // Only set value if it exists
    if (voorstelling.items[1].value !== null) {
      afb = voorstelling.items[1].value.originalname;
    }

    // Create objects and push to array
    zaalObj = {
      eventid: eventid,
      titel: titel,
      artiest: artiest,
      kleedkamers: kleedkamers,
      pauze: pauze,
      vber: vb,
      afb: afb,
    };
    zaalArray.push(zaalObj);
  });
  // Sort array by eventID

  zaalArray.sort(compareID);
}

// Combine data from eventsArray and zaalArray and push to voorstellingen array
function combineData(eventsArray, zaalArray) {
  // Dates to add timestamps for narrowcasting start & end
  let d = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  eventsArray.forEach((el, i) => {
    if (el.eventid == eventsArray[i].eventid) {
      let mergedObj = {
        eventid: eventsArray[i].eventid,
        locatie: eventsArray[i].locatie,
        titel: zaalArray[i].titel,
        artiest: zaalArray[i].artiest,
        start: eventsArray[i].start,
        ncstart: new Date(`${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${el.start}`).valueOf() / 3600000 - 4,
        nceind: new Date(`${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${el.eind}`).valueOf() / 3600000 - 0.25,
        pauze: zaalArray[i].pauze,
        eind: eventsArray[i].eind,
        vber: zaalArray[i].vber,
        kleedkamers: zaalArray[i].kleedkamers,
        afb: zaalArray[i].afb,
      };
      // Only if there is an uploaded yesplan img, push to array
      if (zaalArray[i].afb) {
        voorstellingen.push(mergedObj);
      }
    }
  });
  // Sort array by voorstelling start time
  voorstellingen.sort(compareTime);

  // Sort array by voorstelling location
  voorstellingen.sort(compareLocatie);
}

// array with kleedkamer values
function createKleedkamers(voorstellingen) {
  for (let el of voorstellingen) {
    for (let val of el.kleedkamers) {
      if (val.value) {
        kleedkamersArray.push({
          artiest: el.artiest,
          locatie: el.locatie,
          name: val.name,
          value: val.value,
          vb: el.vber,
        });
      }
    }
  }
}

// PAINT THE DOM
function createHTML(kleedkamers) {
  // SELECT DOM ELEMENTS
  let d = new Date();
  let days = ['ZO', 'MA', 'DI', 'WO', 'DO', 'VR', 'ZA'];
  let months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'October', 'November', 'December'];
  let datum = document.querySelector('.header__date');
  let zalen = document.querySelector('.zalen');
  let vbheading = document.querySelector('.heading-3');
  let vbgz = document.querySelector('.vbGZ');
  let vbrz = document.querySelector('.vbRZ');
  let amp = document.querySelector('.vbtwee');

  // DATE
  datum.innerHTML = `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;

  // unieke array met alleen artiest, locatie, en vber
  let uniek = [];
  let map = new Map();
  console.log(kleedkamers);

  for (let el of kleedkamers) {
    if (!map.has(el.locatie)) {
      map.set(el.locatie);
      map.set(el.artiest);
      uniek.push({
        artiest: el.artiest,
        locatie: el.locatie,
        vb: el.vb,
      });
    }
  }
  console.log(uniek);

  // ARTIEST & ZAAL
  uniek.forEach((voorstelling) => {
    zalen.insertAdjacentHTML(
      'beforeend',
      `
    <div class="zalen__grotezaal">
      <p class="zalen__grotezaal-artiest">${voorstelling.artiest}</p>
      <p class="zalen__grotezaal-zaal">${voorstelling.locatie}</p>
    </div>
    `
    );
  });

  // KLEEDKAMERS BEGANE GROND
  kleedkamers.forEach((kleedkamer) => {
    if (kleedkamer.name.includes('0.')) {
      let kleedkamersBeganeList = document.querySelector('.kleedkamers__beganegrond-list');
      let kleedkamersBeganeListItem = `
      <li class="kleedkamers__beganegrond-list-item">
        <p class="kleedkamers__beganegrond-list-item-artiest">${kleedkamer.value}</p>
        <p class="kleedkamers__beganegrond-list-item-nummer">${kleedkamer.name.slice(11)}</p>
      </li>`;

      kleedkamersBeganeList.insertAdjacentHTML('beforeend', kleedkamersBeganeListItem);
    }

    // KLEEDKAMERS EERSTE VERDIEPING
    if (kleedkamer.name.includes('1.')) {
      let kleedkamersEersteList = document.querySelector('.kleedkamers__eerste-list');
      let kleedkamersEersteListItem = `
    <li class="kleedkamers__eerste-list-item">
      <p class="kleedkamers__eerste-list-item-artiest">${kleedkamer.value}</p>
      <p class="kleedkamers__eerste-list-item-nummer">${kleedkamer.name.slice(11)}</p>
    </li>`;

      kleedkamersEersteList.insertAdjacentHTML('beforeend', kleedkamersEersteListItem);
    }
  });

  // VOORSTELLINGSBEGELEIDERS HEADING
  if (uniek.length > 1) {
    vbheading.innerText = 'De voorstellingsbegeleiders van vandaag zijn';
    amp.style.display = 'inline';
  } else {
    vbheading.innerText = 'De voorstellingsbegeleider van vandaag is';
    amp.style.display = 'none';
  }

  // VOORSTELLINGSBEGELEIDERS
  uniek.forEach((el) => {
    if (el.locatie.toLowerCase() === 'grote zaal') {
      vbgz.innerText = `${el.vb} `;
    }

    if (el.locatie.toLowerCase() === 'rabo zaal') {
      vbrz.innerText = el.vb;
    }
  });
}

// SOME HELPER FUNCTIONS
// Sort by eventid
function compareID(a, b) {
  if (a.eventid < b.eventid) {
    return -1;
  }
  if (a.eventid > b.eventid) {
    return 1;
  }
  return 0;
}

// Sort by start time
function compareTime(a, b) {
  if (a.ncstart < b.ncstart) {
    return -1;
  }
  if (a.ncstart > b.ncstart) {
    return 1;
  }
  return 0;
}

// Sort by location
function compareLocatie(a, b) {
  if (a.locatie < b.locatie) {
    return -1;
  }
  if (a.locatie > b.locatie) {
    return 1;
  }
  return 0;
}
