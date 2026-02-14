function setUser(username){
  localStorage.setItem("nr_user", username);
}
function getUser(){
  return localStorage.getItem("nr_user");
}
function go(path){ location.href = path; }

function loginSubmit(){
  const u = document.getElementById("user").value.trim();
  const p = document.getElementById("pass").value;
  if(!u || !p) return alert("Missing fields");
  setUser(u);
  go("/dashboard");
}

function signupSubmit(){
  const u = document.getElementById("user").value.trim();
  const p = document.getElementById("pass").value;
  const p2 = document.getElementById("pass2").value;

  if(!u || !p || !p2) return alert("Missing fields");
  if(p.length < 6) return alert("Password must be at least 6 characters.");
  if(p !== p2) return alert("Passwords do not match.");

  setUser(u);
  go("/dashboard");
}

// auto-skip auth pages if already "logged in"
(function(){
  const path = location.pathname;
  if((path.startsWith("/signup") || path === "/") && getUser()){
    go("/dashboard");
  }
})();
