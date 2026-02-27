import { auth, db } from './firebase.js';

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {

  const logoutBtn = document.getElementById("logout");
  const userName = document.getElementById("userName");
  const avatarPreview = document.getElementById("avatarPreview");

  const nomeInput = document.getElementById("nome");
  const cognomeInput = document.getElementById("cognome");
  const dataNascitaInput = document.getElementById("dataNascita");
  const saveBtn = document.getElementById("saveProfile");
  const avatarInput = document.getElementById("avatarInput");


  // ===============================
  // AUTH
  // ===============================

  onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  userName.innerText = user.displayName;

  await setDoc(doc(db, "presence", user.uid), {
    name: user.displayName,
    online: true,
    lastSeen: serverTimestamp()
  }, { merge: true });

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      nome: user.displayName || "",
      cognome: "",
      email: user.email,
      avatarUrl: user.photoURL,
      dataNascita: "",
      createdAt: serverTimestamp()
    });
  }

  const data = (await getDoc(userRef)).data();

  avatarPreview.src = data.avatarUrl || user.photoURL;
  nomeInput.value = data.nome || "";
  cognomeInput.value = data.cognome || "";
  dataNascitaInput.value = data.dataNascita || "";

  await loadContractSettings();
  await loadPayments();
  await loadDocuments();
  loadOnlineUsers();
  await loadPersistentNotifications();
});

  // ===============================
  // AVATAR
  // ===============================

  async function uploadAvatar(file) {

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "affitto_manager");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dzgynfn7t/image/upload",
      { method: "POST", body: formData }
    );

    const data = await response.json();
    return data.secure_url;
  }

  saveBtn.onclick = async () => {

    const userRef = doc(db, "users", currentUser.uid);
    let avatarUrl = avatarPreview.src;

    if (avatarInput.files.length > 0) {
      avatarUrl = await uploadAvatar(avatarInput.files[0]);
    }

    await updateDoc(userRef, {
      nome: nomeInput.value,
      cognome: cognomeInput.value,
      dataNascita: dataNascitaInput.value,
      avatarUrl
    });

    avatarPreview.src = avatarUrl;
    alert("Profilo aggiornato!");
  };

  logoutBtn.onclick = async () => {

    await setDoc(doc(db, "presence", currentUser.uid), {
      online: false,
      lastSeen: serverTimestamp()
    }, { merge: true });

    await signOut(auth);
    window.location.href = "index.html";
  };

});


// =====================================================
// COLLAPSIBLE
// =====================================================

window.toggleSection = function(header) {
  header.parentElement.classList.toggle("active");
};


// =====================================================
// DOCUMENTI
// =====================================================

window.uploadDocument = async function(type, inputId) {

  const input = document.getElementById(inputId);
  const user = auth.currentUser;

  if (!input.files.length) {
    alert("Seleziona almeno un file");
    return;
  }

  const docRef = doc(db, "documents", user.uid);
  const snap = await getDoc(docRef);

  let existingFiles = [];
  if (snap.exists() && snap.data()[type]) {
    existingFiles = snap.data()[type];
  }

  let newFiles = [];

  for (let file of input.files) {

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "affitto_manager");
    formData.append("folder", `affitto_manager/${user.uid}/${type}`);

    // 🔥 SEMPRE image/upload (ANCHE PER PDF)
    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dzgynfn7t/image/upload",
      { method: "POST", body: formData }
    );

    const data = await response.json();
    if (!data.secure_url) continue;

    newFiles.push({
      url: data.secure_url,
      type: file.type,
      name: file.name
    });
  }

  const updatedFiles = [...existingFiles, ...newFiles];

  await setDoc(docRef, { [type]: updatedFiles }, { merge: true });

  loadDocuments();
  alert("File caricati correttamente!");
};


// =====================================================
// LOAD DOCUMENTI (PDF + IMMAGINI APRONO IN NUOVA PAGINA)
// =====================================================

async function loadDocuments() {

  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "documents", user.uid));
  if (!snap.exists()) return;

  const data = snap.data();

  for (let key in data) {

    const preview = document.getElementById(key + "Preview");
    if (!preview) continue;

    preview.innerHTML = "";

    const files = data[key];
    updateSectionCounter(key, files.length);

    files.forEach((file, index) => {

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.padding = "10px 14px";
      row.style.margin = "8px 0";
      row.style.borderRadius = "8px";
      row.style.background = "rgba(255,255,255,0.05)";

      const link = document.createElement("a");
      link.href = file.url;
      link.target = "_blank";
      link.style.textDecoration = "none";
      link.style.color = "white";
      link.style.display = "flex";
      link.style.alignItems = "center";
      link.style.gap = "10px";

      const icon = document.createElement("span");
      icon.innerText = file.type.includes("image") ? "🖼" : "📄";

      const name = document.createElement("span");
      name.innerText = file.name;

      link.appendChild(icon);
      link.appendChild(name);

      const deleteBtn = document.createElement("button");
      deleteBtn.innerText = "🗑";
      deleteBtn.style.width = "40px";
      deleteBtn.style.background = "rgba(255,0,0,0.3)";
      deleteBtn.style.border = "none";
      deleteBtn.style.borderRadius = "6px";
      deleteBtn.style.cursor = "pointer";

      deleteBtn.onclick = async () => {
        await deleteFile(key, index);
      };

      row.appendChild(link);
      row.appendChild(deleteBtn);

      preview.appendChild(row);
    });
  }
}

async function deleteFile(sectionKey, index) {

  const user = auth.currentUser;
  if (!user) return;

  const docRef = doc(db, "documents", user.uid);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return;

  const data = snap.data();
  const files = data[sectionKey];

  files.splice(index, 1);

  await setDoc(docRef, {
    [sectionKey]: files
  }, { merge: true });

  loadDocuments();
}

function updateSectionCounter(sectionKey, count) {

  const headers = document.querySelectorAll(".card-header h3");

  headers.forEach(header => {

    if (header.innerText.toLowerCase().includes(sectionKey.toLowerCase())) {
      header.innerText = header.innerText.split("(")[0].trim();
      header.innerText += ` (${count})`;
    }
  });
}


// =====================================================
// PAGAMENTI
// =====================================================

// ======================================
// GENERAZIONE MESI DINAMICA CONTRATTO
// ======================================

function generateContractMonths(dataInizio, numeroMesi) {

  if (!dataInizio || !numeroMesi) return [];

  const mesiItaliani = [
    "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
    "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
  ];

  const startDate = new Date(dataInizio);
  let result = [];

  for (let i = 0; i < numeroMesi; i++) {

    const tempDate = new Date(startDate);
    tempDate.setMonth(startDate.getMonth() + i);

    const nomeMese = mesiItaliani[tempDate.getMonth()];
    const anno = tempDate.getFullYear();

    result.push(nomeMese + " " + anno);
  }

  return result;
}

async function loadPayments() {

  const container = document.getElementById("paymentsTable");
  const user = auth.currentUser;
  if (!user) return;

  const paymentsSnap = await getDoc(doc(db, "payments", user.uid));
  const paymentsData = paymentsSnap.exists() ? paymentsSnap.data() : {};

  const contractSnap = await getDoc(doc(db, "contractSettings", user.uid));
  if (!contractSnap.exists()) return;

  const contractData = contractSnap.data();

  const months = generateContractMonths(
    contractData.dataInizio,
    contractData.numeroMesi
  );

  container.innerHTML = "";

  let totalPaid = 0;
  let mesiPagati = 0;
  let mesiDaPagare = 0;

  // ===============================
  // 🔹 CAPARRA
  // ===============================

  const caparraSnap = await getDoc(doc(db, "payments", user.uid + "_CAPARRA"));
  const caparraData = caparraSnap.exists() ? caparraSnap.data() : null;

  const caparraRow = document.createElement("div");
  caparraRow.classList.add("card");

  if (caparraData?.status === "pagato") {
    caparraRow.classList.add("green");
    totalPaid += Number(caparraData.amount || 0);
  } else {
    caparraRow.classList.add("red");
  }

  caparraRow.innerHTML = `
    <h4>CAPARRA</h4>
    <input type="number" placeholder="Importo" id="imp_CAPARRA" value="${caparraData?.amount || ""}">
    <input type="text" placeholder="Note" id="note_CAPARRA" value="${caparraData?.note || ""}">
    <select id="status_CAPARRA">
      <option value="non_pagato" ${caparraData?.status==="non_pagato"?"selected":""}>Non Pagato</option>
      <option value="in_arrivo" ${caparraData?.status==="in_arrivo"?"selected":""}>In Arrivo</option>
      <option value="pagato" ${caparraData?.status==="pagato"?"selected":""}>Pagato</option>
    </select>
    <button onclick="savePayment('CAPARRA')">Salva</button>
  `;

  container.appendChild(caparraRow);

  // ===============================
  // 🔹 MESI
  // ===============================

    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0-11

  for (let m of months) {

    const data = paymentsData[m] || null;

    const row = document.createElement("div");
    row.classList.add("card");

    const monthDateParts = m.split(" ");
const meseNome = monthDateParts[0];
const annoNumero = parseInt(monthDateParts[1]);

const mesiItaliani = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
];

const monthIndex = mesiItaliani.indexOf(meseNome);
const today = new Date();

const isPastMonth =
  annoNumero < today.getFullYear() ||
  (annoNumero === today.getFullYear() && monthIndex < today.getMonth());

const isCurrentMonth =
  annoNumero === today.getFullYear() && monthIndex === today.getMonth();

if (data?.status === "pagato") {

  row.classList.add("green");
  totalPaid += Number(data.amount || 0);
  mesiPagati++;

} else {

  mesiDaPagare++;

  if (isPastMonth) {
  row.classList.add("red");
  unpaidMonths.push(m);
}
else if (isCurrentMonth) {
  row.classList.add("orange");
}
else {
  row.classList.add("red");
}

}

    row.innerHTML = `
      <h4>${m}</h4>
      <input type="number" placeholder="Importo" id="imp_${m}" value="${data?.amount || ""}">
      <input type="text" placeholder="Note" id="note_${m}" value="${data?.note || ""}">
      <select id="status_${m}">
        <option value="non_pagato" ${data?.status==="non_pagato"?"selected":""}>Non Pagato</option>
        <option value="in_arrivo" ${data?.status==="in_arrivo"?"selected":""}>In Arrivo</option>
        <option value="pagato" ${data?.status==="pagato"?"selected":""}>Pagato</option>
      </select>
      <button onclick="savePayment('${m}')">Salva</button>
    `;

    container.appendChild(row);
  }

  await updateDashboardStats(totalPaid, mesiPagati, mesiDaPagare);
}

async function updateDashboardStats(totalPaid, mesiPagati = 0, mesiDaPagare = 0) {

  let stats = document.getElementById("dashboardStats");

  if (!stats) {
    stats = document.createElement("div");
    stats.id = "dashboardStats";
    stats.style.padding = "20px";
    stats.style.marginBottom = "20px";
    stats.style.borderRadius = "15px";
    stats.style.background = "rgba(0,255,255,0.1)";
    stats.style.border = "1px solid rgba(0,255,255,0.3)";
    document.querySelector(".container").prepend(stats);
  }

  if (!currentUser) return;

  const snap = await getDoc(doc(db, "contractSettings", currentUser.uid));

  let totalContract = 0;
  let giorniRestanti = 0;   // 🔥 IMPORTANTE

  if (snap.exists()) {

    const data = snap.data();

    const importoPrimoMensile = Number(data.importoPrimoMensile || 0);
    const importoMensile = Number(data.importoMensile || 0);
    const numeroMesi = Number(data.numeroMesi || 0);

    if (numeroMesi > 0) {
      totalContract =
        importoPrimoMensile +
        (numeroMesi - 1) * importoMensile;
    }

    // 🔥 CALCOLO GIORNI RESTANTI
    if (data?.dataFine) {
      const fine = new Date(data.dataFine);
      const oggi = new Date();
      const diff = fine - oggi;
      giorniRestanti = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
  }

  const restante = Math.max(totalContract - totalPaid, 0);

  const percent = totalContract > 0
    ? Math.round((totalPaid / totalContract) * 100)
    : 0;

    renderPaymentsChart(totalPaid, totalContract);

  // 🔥 LOGICA STATO
  let statoScadenza = "";
  let coloreScadenza = "white";
  let coloreBarra = "linear-gradient(90deg,magenta,cyan)";

  if (giorniRestanti < 0) {
    statoScadenza = "⚠️ CONTRATTO SCADUTO";
    coloreScadenza = "red";
    coloreBarra = "red";
  }
  else if (giorniRestanti <= 10) {
    statoScadenza = "⚠️ Scadenza imminente";
    coloreScadenza = "red";
    coloreBarra = "red";
  }
  else if (giorniRestanti <= 30) {
    statoScadenza = "⏳ In scadenza";
    coloreScadenza = "orange";
    coloreBarra = "orange";
  }
  else {
    statoScadenza = "✔️ Contratto attivo";
    coloreScadenza = "lime";
  }


  /* 🔴 QUI INSERISCI IL BADGE */

const badge = document.getElementById("contractBadge");

if (badge) {

  badge.classList.remove("badge-urgent", "badge-expired");

  if (giorniRestanti < 0) {

    badge.innerHTML = "🔴 SCADUTO";
    badge.style.color = "red";
    badge.classList.add("badge-expired");

    showNotification("⚠️ Il contratto è scaduto!", "error");
    await updatePersistentNotification("contractExpired", true);

  } 
  else if (giorniRestanti <= 10) {

    badge.innerHTML = "⚠️ URGENTE";
    badge.style.color = "orange";
    badge.classList.add("badge-urgent");

    showNotification("⏳ Il contratto sta per scadere!", "warning");
    await updatePersistentNotification("contractUrgent", true);

  } 
  else {

    badge.innerHTML = "";
    await updatePersistentNotification("contractExpired", false);
    await updatePersistentNotification("contractUrgent", false);
  }
}

  stats.innerHTML = `
    <h3>Stato Attuale CONTRATTO</h3>

    <p>💰 Totale Contratto: € ${totalContract}</p>
    <p>💳 Totale Pagato: € ${totalPaid}</p>
    <p>❗ Restante da Pagare: € ${restante}</p>

    <p>📆 Mesi Pagati: ${mesiPagati}</p>
    <p>📌 Mesi da Pagare: ${mesiDaPagare}</p>

    <p style="color:${coloreScadenza}; font-weight:bold;">
      📅 ${statoScadenza} (${giorniRestanti > 0 ? giorniRestanti + " giorni" : "0 giorni"})
    </p>

    <div style="background:#222;border-radius:8px;height:20px;margin-top:10px;">
      <div style="width:${percent}%;height:20px;background:${coloreBarra};border-radius:8px;"></div>
    </div>

    <p style="margin-top:8px;">Completamento: ${percent}%</p>
  `;
}

window.savePayment = async function(monthName) {

  const user = auth.currentUser;
  if (!user) return;

  const amount = Number(document.getElementById("imp_" + monthName).value || 0);
  const note = document.getElementById("note_" + monthName).value;
  const status = document.getElementById("status_" + monthName).value;

  const docRef = doc(db, "payments", user.uid);

  const snap = await getDoc(docRef);
  let existingData = snap.exists() ? snap.data() : {};

  existingData[monthName] = {
    amount,
    note,
    status,
    updatedAt: serverTimestamp()
  };

  await setDoc(docRef, existingData);

  loadPayments();
};


// =====================================================
// PRESENZA REALTIME
// =====================================================

function loadOnlineUsers() {

  const container = document.getElementById("onlineUsers");

  onSnapshot(collection(db, "presence"), snapshot => {

    container.innerHTML = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.innerText = data.name + (data.online ? " 🟢" : " 🔴");
      container.appendChild(div);
    });

  });
}

// ===============================
// IMPOSTAZIONI CONTRATTO
// ===============================

window.saveContractSettings = async function() {

  const user = auth.currentUser;
  if (!user) return;

  const importoPrimoMensile = Number(document.getElementById("importoPrimoMensile").value);
  const importoMensile = Number(document.getElementById("importoMensile").value);
  const numeroMesi = Number(document.getElementById("numeroMesi").value);
  const caparra = Number(document.getElementById("caparraImporto").value);
  const dataInizio = document.getElementById("dataInizio").value;
  const dataFine = document.getElementById("dataFine").value;

  await setDoc(doc(db, "contractSettings", currentUser.uid), {
    importoPrimoMensile,
    importoMensile,
    numeroMesi,
    caparra,
    dataInizio,
    dataFine
  });

  alert("Impostazioni salvate!");
  loadPayments();
};

async function loadContractSettings() {

  if (!currentUser) return;

  const snap = await getDoc(doc(db, "contractSettings", currentUser.uid));
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("importoPrimoMensile").value = data.importoPrimoMensile || "";
  document.getElementById("importoMensile").value = data.importoMensile || "";
  document.getElementById("numeroMesi").value = data.numeroMesi || "";
  document.getElementById("caparraImporto").value = data.caparra || "";
  document.getElementById("dataInizio").value = data.dataInizio || "";
  document.getElementById("dataFine").value = data.dataFine || "";
}

// ======================================
// CALCOLO AUTOMATICO DATA FINE
// ======================================

function calcolaDataFine() {

  const dataInizio = document.getElementById("dataInizio").value;
  const numeroMesi = Number(document.getElementById("numeroMesi").value);

  if (!dataInizio || !numeroMesi) return;

  const startDate = new Date(dataInizio);
  startDate.setMonth(startDate.getMonth() + numeroMesi);

  const anno = startDate.getFullYear();
  const mese = String(startDate.getMonth() + 1).padStart(2, "0");
  const giorno = String(startDate.getDate()).padStart(2, "0");

  const dataFine = `${anno}-${mese}-${giorno}`;

  document.getElementById("dataFine").value = dataFine;
}

// Trigger automatico
const dataInizioEl = document.getElementById("dataInizio");
const numeroMesiEl = document.getElementById("numeroMesi");

if (dataInizioEl && numeroMesiEl) {
  dataInizioEl.addEventListener("change", calcolaDataFine);
  numeroMesiEl.addEventListener("input", calcolaDataFine);
}

function showNotification(message, type) {

  const existing = document.getElementById("globalNotification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.id = "globalNotification";
  notification.innerText = message;

  notification.style.position = "fixed";
  notification.style.top = "90px";
  notification.style.right = "20px";
  notification.style.padding = "15px 20px";
  notification.style.borderRadius = "12px";
  notification.style.zIndex = "9999";
  notification.style.fontWeight = "bold";
  notification.style.color = "white";
  notification.style.boxShadow = "0 0 15px rgba(0,0,0,0.5)";
  notification.style.transition = "all 0.3s ease";

  if (type === "error") {
    notification.style.background = "linear-gradient(red, darkred)";
  } else {
    notification.style.background = "linear-gradient(orange, darkorange)";
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 500);
  }, 4000);
}

// ======================================
// SALVATAGGIO NOTIFICHE PERSISTENTI
// ======================================

async function updatePersistentNotification(type, value) {

  if (!currentUser) return;

  await setDoc(
    doc(db, "notifications", currentUser.uid),
    {
      [type]: value,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

// ======================================
// CARICAMENTO NOTIFICHE PERSISTENTI
// ======================================

async function loadPersistentNotifications() {

  if (!currentUser) return;

  const snap = await getDoc(doc(db, "notifications", currentUser.uid));
  if (!snap.exists()) return;

  const data = snap.data();

  if (data.contractExpired) {
    showNotification("⚠️ Il contratto è scaduto!", "error");
  }

  if (data.contractUrgent) {
    showNotification("⏳ Il contratto sta per scadere!", "warning");
  }
}

let paymentsChartInstance = null;

function renderPaymentsChart(totalPaid, totalContract) {

  const ctx = document.getElementById("paymentsChart");
  if (!ctx) return;

  if (paymentsChartInstance) {
    paymentsChartInstance.destroy();
  }

  const restante = Math.max(totalContract - totalPaid, 0);
  const percent = totalContract > 0
    ? Math.round((totalPaid / totalContract) * 100)
    : 0;

  // 🎨 Palette Dark Finanziaria
  let mainColor = "#00f5a0"; // verde neon soft
  if (percent < 100 && percent >= 50) mainColor = "#00c6ff"; // blu premium
  if (percent < 50) mainColor = "#ff3d71"; // rosso elegante

  paymentsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pagato', 'Restante'],
      datasets: [{
        data: [totalPaid, restante],
        backgroundColor: [
          mainColor,
          "rgba(255,255,255,0.06)"
        ],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "78%",
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "#0f0f0f",
          borderColor: "#222",
          borderWidth: 1,
          titleColor: "#fff",
          bodyColor: "#ccc",
          padding: 12,
          callbacks: {
            label: function(context) {
              return context.label + ": € " + context.raw;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        duration: 1400,
        easing: 'easeOutQuart'
      }
    },
    plugins: [{
      id: 'centerText',
      beforeDraw(chart) {

        const { width, height } = chart;
        const ctx = chart.ctx;

        ctx.save();

        // Glow effetto premium
        ctx.shadowColor = mainColor;
        ctx.shadowBlur = 20;

        ctx.font = "bold 36px sans-serif";
        ctx.fillStyle = mainColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(percent + "%", width / 2, height / 2 - 10);

        ctx.shadowBlur = 0;

        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#888";
        ctx.fillText("Completamento", width / 2, height / 2 + 20);

        ctx.restore();
      }
    }]
  });
}

window.generatePDF = async function() {

  const { jsPDF } = window.jspdf;
  const docPdf = new jsPDF();

  // Recupero dati direttamente dal DOM
  const stats = document.getElementById("dashboardStats");
  if (!stats) {
    alert("Nessun dato disponibile");
    return;
  }

  // Recuperiamo valori dal riepilogo (senza emoji)
  const lines = stats.querySelectorAll("p");

  let totaleContratto = "";
  let totalePagato = "";
  let mesiPagati = "";
  let mesiDaPagare = "";
  let restante = "";
  let stato = "";
  let completamento = "";

  lines.forEach(p => {
    const text = p.innerText.replace(/[^\x00-\x7F]/g, ""); // rimuove emoji
    if (text.includes("Totale Contratto")) totaleContratto = text;
    if (text.includes("Totale Pagato")) totalePagato = text;
    if (text.includes("Restante")) restante = text;
    if (text.includes("Mesi Pagati")) mesiPagati = text;
    if (text.includes("Mesi da Pagare")) mesiDaPagare = text;
    if (text.includes("Contratto")) stato = text;
    if (text.includes("Completamento")) completamento = text;
  });

  // ===== STILE PROFESSIONALE =====

  docPdf.setFillColor(15, 15, 20);
  docPdf.rect(0, 0, 210, 297, "F");

  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(18);
  docPdf.text("AFFITTO ANTONIO PASSAFIUME", 105, 25, { align: "center" });

  docPdf.setFontSize(14);
  docPdf.text("STATO ATTUALE CONTRATTO", 105, 35, { align: "center" });

  docPdf.setDrawColor(0, 255, 200);
  docPdf.line(40, 40, 170, 40);

  docPdf.setFont("helvetica", "normal");
  docPdf.setFontSize(12);

  let y = 60;

  function addRow(label) {
    docPdf.text(label, 40, y);
    y += 15;
  }

  addRow(totaleContratto);
  addRow(totalePagato);
  addRow(restante);

  addRow(mesiPagati);
  addRow(mesiDaPagare);

  addRow(stato);
  addRow(completamento);

  // Footer
  docPdf.setFontSize(9);
  docPdf.setTextColor(150);
  // ==============================
// CLAUSOLA DI RISERVATEZZA
// ==============================

const clausola = `
Clausola di Riservatezza e Tutela dei Dati

Il presente documento è generato automaticamente da ANTONIO PASSAFIUME ed è destinato esclusivamente al soggetto intestatario del contratto. 

Le informazioni in esso contenute hanno carattere riservato e sono tutelate ai sensi del Regolamento (UE) 2016/679 (GDPR) e della normativa nazionale vigente in materia di protezione dei dati personali.

È vietata la diffusione, distribuzione, riproduzione o utilizzo, anche parziale, del presente documento senza preventiva autorizzazione scritta del titolare del trattamento.

L’eventuale ricezione del presente documento da parte di soggetti non autorizzati non comporta alcun diritto di utilizzo delle informazioni contenute. In tal caso si invita a darne immediata comunicazione al mittente e a provvedere alla cancellazione del documento.
`;

// Impostazioni font eleganti
docPdf.setFont("helvetica", "normal");
docPdf.setFontSize(8);
docPdf.setTextColor(160);

// Larghezza massima testo (margini professionali)
const maxWidth = 170;

// Divide automaticamente il testo in righe corrette
const clausolaLines = docPdf.splitTextToSize(clausola, maxWidth);

// Calcola altezza totale del blocco
const clausolaHeight = clausolaLines.length * 4;

// Posizione verticale (in fondo pagina ma sopra margine)
const startY = 280 - clausolaHeight;

// Stampa centrata perfetta
docPdf.text(clausolaLines, 105, startY, {
  align: "center"
});

  docPdf.save("Stato_Attuale_Contratto_Antonio_Passafiume.pdf");

};
