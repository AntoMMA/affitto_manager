import { auth } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", async () => {

  // 🔥 Gestione ritorno da redirect (iOS compatibile)
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      window.location.href = "dashboard.html";
      return;
    }
  } catch (error) {
    console.error(error);
    alert("Errore login");
  }

  // Se già loggato → vai dashboard
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "dashboard.html";
    }
  });

  const loginBtn = document.getElementById("googleLogin");

  loginBtn.onclick = async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error(error);
      alert("Errore login");
    }
  };

});