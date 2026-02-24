import { auth } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", async () => {

  // 🔥 1. Gestione ritorno da redirect
  try {
    await getRedirectResult(auth);
  } catch (error) {
    console.error("Redirect error:", error);
    alert("Errore login");
  }

  // 🔥 2. Se loggato → vai dashboard
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "dashboard.html";
    }
  });

  // 🔥 3. Bottone login
  const loginBtn = document.getElementById("googleLogin");

  loginBtn.onclick = async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
      alert("Errore login");
    }
  };

});
