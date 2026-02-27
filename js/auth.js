// js/auth.js

import { auth, provider } from "./firebase.js";
import {
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const loginBtn = document.getElementById("googleLogin");

// 🔥 RILEVA SE È PWA STANDALONE iOS
function isInStandaloneMode() {
  return window.navigator.standalone === true;
}

loginBtn.addEventListener("click", async () => {

  // 🚨 SE È PWA → apri Safari vero
  if (isInStandaloneMode()) {
    window.location.href = window.location.origin;
    return;
  }

  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    alert("Errore accesso Google: " + error.message);
  }
});

// Gestione redirect
getRedirectResult(auth)
  .then((result) => {
    if (result?.user) {
      window.location.href = "dashboard.html";
    }
  })
  .catch((error) => {
    console.error(error);
  });

// Se già autenticato
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});
