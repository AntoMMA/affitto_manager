import { auth } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", () => {

  // 🔥 Questo intercetta il login dopo il redirect
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