import { auth } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", () => {

  // 🔥 Questo è quello che realmente funziona su iOS
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
      console.error("Login error:", error);
      alert("Errore login");
    }
  });

});
