async function login(e) {
  e.preventDefault();

  const form = e.target;

  const body = {
    email: form.email.value,
    password: form.password.value,
  };

  const errorP = document.getElementById("error");

  fetch(`${API_URL}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  })
    .then((x) => x.json())
    .then((x) => {
      if (x.token) {
        localStorage.setItem("token", x.token);
        localStorage.setItem("id", x.id);
        window.location.href = "/game.html";
      } else {
        errorP.innerText = "Invalid email or password";
      }
    })
    .catch((x) => {
      errorP.innerText = "Invalid email or password";
    });
}

document.getElementById("login").addEventListener("submit", login);
