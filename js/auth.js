import { auth } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", () => {

  // Se già loggato → vai dashboard
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "dashboard.html";
    }
  });

  const loginBtn = document.getElementById("googleLogin");

  loginBtn.onclick = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      alert("Errore login");
    }
  };

});