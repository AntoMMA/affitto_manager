import { auth } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", () => {

  // 🔥 Stato auth globale
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.replace("dashboard.html");
    }
  });

  const loginBtn = document.getElementById("googleLogin");

  loginBtn.addEventListener("click", async () => {
    await signInWithRedirect(auth, provider);
  });

});
