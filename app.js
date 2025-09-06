"use strict";
// need to fetch my data then put it in the right places in the DOM
// would need to do two fetchs maybe

// need to figure out how to fetch when the site is loaded

// will hold the cases objects for all of them
const rulesText = `
<h4>ESI 1 — Immediate</h4>
<p>Needs life-saving intervention right now. Examples: cardiac arrest, not breathing, severe anaphylaxis.</p>

<h4>ESI 2 — Very Urgent</h4>
<p>High risk or severe distress, but not requiring immediate resuscitation. Examples: chest pain with abnormal vitals, severe respiratory distress, new stroke symptoms.</p>

<h4>ESI 3 — Urgent</h4>
<p>Stable but needs multiple resources (labs, imaging, procedures). Examples: abdominal pain needing workup, pneumonia needing IV antibiotics.</p>

<h4>ESI 4 — Less Urgent</h4>
<p>Stable, likely one resource. Examples: laceration needing sutures, sprained ankle needing an X-ray.</p>

<h4>ESI 5 — Non-Urgent</h4>
<p>Stable, needs no resources beyond a simple exam or prescription refill. Examples: medication refill, minor rash.</p>
`;

let Cases = [];

let global_index = 0;
let matching = 0;
let correct = -1;

const state = {
  rules: null, // from rules.json
  current: null, // runtime case (template + randomized vitals/symptoms)
  score: { attempts: 0, correct: 0, streak: 0 },
};

state.rules = rulesText;
let nextbtn = document.querySelector("#next-case");

class CaseTemplet {
  //name will be a string, age will be a int, sex will be a string or could be a bool
  // Vitals will be a list
  // function to set up this objects meta data
  constructor(
    mName,
    mAge,
    mSex,
    mVitals,
    mCorrectAns,
    mCheifReport,
    msymptomsCore,
    msymptomsOptional
  ) {
    this.name = mName;
    this.age = mAge;
    this.sex = mSex;
    this.vitals = mVitals;
    this.CorrectAns = mCorrectAns;
    this.CheifReport = mCheifReport;
    this.symptoms = msymptomsCore;
    this.optionalSymptoms = msymptomsOptional;
  }

  update_corectAns() {
    if (this.CorrectAns > 1) {
      this.CorrectAns -= 1;
    }
  }
}

// this will call the funciton in the second arg when the document gets loaded
// aka when the app starts
document.addEventListener("DOMContentLoaded", start);

//will run at the begining, and will fill up the cases array with the objects it gets from the url but will also make the objects themself
function start() {
  Cases = [];
  // console.log("hello");

  fetch("https://api.jsonbin.io/v3/b/68bca8e6d0ea881f4074404d").then(function (
    response
  ) {
    // console.log(response);

    response.json().then(function (data) {
      // now we have the actaul data from the object so now we can set up our class objects
      //   console.log(data);
      //   console.log(data.record);
      //   console.log(data.record.cases);
      // i think i would need to loop over the objecsts and make a new object for each
      for (let i = 0; i < data.record.cases.length; i++) {
        // console.log(data.record.cases);
        let case_data = data.record.cases[i];
        // console.log(case_data);
        // console.log(case_data.demographics.age);
        // console.log(case_data.vitalsRanges);
        let case_entry = new CaseTemplet(
          case_data.name,
          case_data.age,
          case_data.sex,
          case_data.vitalsRanges,
          case_data.correctTriage,
          case_data.CheifReport,
          case_data.symptoms,
          case_data.optionalSymptoms
        );
        Cases.push(case_entry);
        // console.log(Cases);
      }
      global_index = Math.floor(Math.random() * Cases.length);
      matching = global_index;
      setUpCard(Cases[global_index]);
    });
  });
}
const buttons = document.querySelectorAll("#triage-buttons button");

for (const item of buttons) {
  //html object has data set on it and we can access that then the number asociated with level to get what button number was clicked
  item.onclick = function () {
    const number = Number(item.dataset.level);

    checkanswer(number);
  };
}
let Title_header = document.querySelector("#title-case");
let symptoms_ul = document.querySelector("#symptoms-list");
let vitals_holder = document.querySelector("#vitals");
let feedback_complaint = document.querySelector("#feedback");
let demographics = document.querySelector("#demographics");

// take in the data then make all the children in dom empty then fill them with the data will needed to be called with differnt cases for the next case button
function setUpCard(case_entry) {
  nextbtn.disabled = true;
  // console.log("hello");
  //seting the title
  Title_header.innerHTML = case_entry.name;

  // how we will add the demograpics
  // also deleted the things in the elemet before ie: replacechild()
  demographics.replaceChildren();
  let p = document.createElement("p");
  p.innerHTML = "age: " + case_entry.age + " sex: " + case_entry.sex;
  demographics.appendChild(p);

  // seting up the symptoms will be a ul
  // will be in a for loop
  // will do one for at least having one
  symptoms_ul.innerHTML = "";
  let li_1 = document.createElement("li");
  li_1.innerHTML = case_entry.symptoms;
  symptoms_ul.appendChild(li_1);

  //set up the optional ones by doing a random select on one
  if (case_entry.optionalSymptoms.length > 0) {
    let li = document.createElement("li");

    let randomIndex = Math.floor(
      Math.random() * case_entry.optionalSymptoms.length
    );

    let randomsymptom = case_entry.optionalSymptoms[randomIndex];

    li.innerHTML = randomsymptom;
    symptoms_ul.appendChild(li);
  }

  // seting up the complaint
  feedback_complaint.replaceChildren();
  let complaint_p = document.createElement("p");
  complaint_p.innerHTML = case_entry.CheifReport;
  feedback_complaint.appendChild(complaint_p);

  // set up the right answer

  //set up viatals
  const vitals_object = setupVitals_ranges(case_entry.vitals);
  render_vitals(vitals_holder, vitals_object);

  correct = case_entry.CorrectAns;
}

//example of the object coming in
// bpSystolic
// :
// (2) [100, 130]
// hr
// :
// (2) [90, 140]
// rr
// :
// (2) [22, 36]
// spo2
// :
// (2) [86, 99]
// tempC
// :
// (2) [36.5, 37.8]

// take in the raw data (arrays) and make them into ranges
function setupVitals_ranges(vital_report) {
  // console.log(randint(vital_report.bpSystolic[0], vital_report.bpSystolic[1]));
  return {
    //blood pressure

    bps: randint(vital_report.bpSystolic[0], vital_report.bpSystolic[1]),
    //heart rate
    heartRate: randint(vital_report.hr[0], vital_report.hr[1]),

    //breath per minute
    resportory_rate: randint(vital_report.rr[0], vital_report.rr[1]),

    //oxygen saturation
    oxygen_saturation: randint(vital_report.spo2[0], vital_report.spo2[1]),

    temp_celsius: randfloat(vital_report.tempC[0], vital_report.tempC[1]),
  };
}

//take in the box and object and make it into one thing
function render_vitals(box, vitals_object) {
  //will replace all the children with in the box element
  //sbp = blood pressure
  box.replaceChildren(
    vital_structuer("HR", vitals_object.heartRate),
    vital_structuer("RR", vitals_object.resportory_rate),
    vital_structuer("SBP", vitals_object.bps),
    vital_structuer("SpO₂", vitals_object.oxygen_saturation),
    vital_structuer("Temp", vitals_object.temp_celsius)
  );
}

// make the elememt and pu tin the subfields
function vital_structuer(label, value) {
  const el = document.createElement("p");
  el.textContent = label + ": " + value;
  return el;
}
function randint(min, max) {
  //ex:
  // max = 90 min = 70
  // max - min = 20 so rand range is within 20
  // then if we add back min so 70 we would get a number between 70 and 90
  // the plus one lets us hit 90 as math.random is not inclusive to the max range so with out it it would go to [0,20) but with the +1 it will do [0,21)
  let num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num;
} //put hte thing in now

function randfloat(min, max) {
  //same as randint but we are working with floats now so we dont need the floor but need to fix it to a decimal place

  let float_num = (Math.random() * (max - min) + min).toFixed(1);

  return float_num;
}

nextbtn.onclick = function () {
  // wrap around the array or add one to the index
  global_index = Math.floor(Math.random() * Cases.length);
  // console.log(global_index);

  setUpCard(Cases[global_index]);
};

function checkanswer(number) {
  if (number == correct) {
    nextbtn.disabled = false;
    state.score.correct += 1;
    state.score.attempts += 1;
    state.score.streak += 1;
    // console.log(state);
    render_score();
  } else {
    state.score.attempts += 1;
    state.score.streak = 0;
    render_score();
    // alert("Wrong answer, try again");
  }
}

const rulesModal = document.querySelector("#rules-modal");
const rulesContent = document.querySelector("#rules-content");
const showRulesBtn = document.querySelector("#show-rules");
const closeRulesBtn = document.querySelector("#close-rules");

//dialog is hiden by defualt
showRulesBtn.addEventListener("click", () => {
  // the div within the dialog and we set it to the rule text
  rulesContent.innerHTML = state.rules;
  //built in method for dialog that makes it show up
  // if it was just show it would do it inline but his does it with a backdrop
  rulesModal.showModal(); // open <dialog>
});

closeRulesBtn.addEventListener("click", () => {
  // button that is within the dialog and when click will close the diaglog
  rulesModal.close();
});
// if you used a div you would manualy hide it and have to add clasess and get rid of classes to make it apear or disapear

function render_score() {
  document.querySelector(
    "#score"
  ).textContent = `${state.score.correct} / ${state.score.attempts}`;
  document.querySelector("#streak").textContent = state.score.streak;
}
