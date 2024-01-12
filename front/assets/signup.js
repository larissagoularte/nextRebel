async function register(e) {
  e.preventDefault();

  const form = e.target;

  const body = {
    email: form.email.value,
    name: form.name.value,
    gender: form.gender.value,
    password: form.password.value,
  };

  const errorP = document.getElementById("error");

  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (response.ok) {
      window.location.href = "/index.html";
    } else {
      const errorData = await response.json();
      errorP.innerText = "Error occurred while signing up";
    }
  } catch (error) {
    errorP.innerText = "Error occurred while signing up";
  }
}

document.getElementById("signup").addEventListener("submit", register);
