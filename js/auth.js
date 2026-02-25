import { auth } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", async () => {

  // 🔹 Gestione ritorno da redirect
  try {
    await getRedirectResult(auth);
  } catch (error) {
    console.error("Redirect error:", error);
  }

  // 🔹 Stato login
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.replace("dashboard.html");
    }
  });

  const loginBtn = document.getElementById("googleLogin");

  loginBtn.addEventListener("click", async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error(error);
      alert("Errore login");
    }
  });

});
