// js/auth.js

import { auth, provider } from "./firebase.js";
import {
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const loginBtn = document.getElementById("googleLogin");

// Login con REDIRECT (compatibile iOS PWA)
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    alert("Errore accesso Google: " + error.message);
  }
});

// Gestione risultato redirect
getRedirectResult(auth)
  .then((result) => {
    if (result?.user) {
      window.location.href = "dashboard.html";
    }
  })
  .catch((error) => {
    alert("Errore accesso Google: " + error.message);
  });

// Se già autenticato
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});
