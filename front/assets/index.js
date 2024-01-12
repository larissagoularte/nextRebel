const SocketEmitEvents = {
  PING: "ping",
  HANDLE_SKILL: "handle-skill",
  VOTE: "vote",
  CHAT: "chat",
  CHAT_NIGHT: "chat-night",
  CHAT_TO: "chat-to",
  UPDATE: "update",
};

const SocketOnEvents = {
  CONNECT: "connect",
  PONG: "pong",
  ROOM: "room",
  VOTE: "vote",
  CHAT: "chat",
  CHAT_NIGHT: "chat-night",
  CHAT_TO: "chat-to",
  DISCONNECT: "disconnect",
  PLAYERS: "players",
  CHAT_ALERT: "chat-alert",
};

const STYLES = {
  messageChat: " rounded p-2 mb-2",
  ping: "absolute top-2 right-2 bg-green-400 rounded p-2 mb-2 z-50 text-xs",
};

let SKILL = false;
let PLAYERS = [];
let ROOM = {};
let images = {
  man: null,
  woman: null,
};

let CLICKED_PLAYER = null;

const API_URL_WS = "http://localhost:3001";
// const API_URL_WS = "https://gameubi.onrender.com";

const socket = io(API_URL_WS, {
  auth: {
    token: localStorage.getItem("token"),
  },
  reconnectionAttempts: 3,
  transports: ["websocket"],
});

socket.on(SocketOnEvents.CONNECT, () => {
  console.log("connected");
});

socket.on(SocketOnEvents.DISCONNECT, () => {
  console.log("disconnected");
  window.location.href = "/dashboard.html";
});

socket.on(SocketOnEvents.ROOM, (room) => {
  if (!room) {
    return;
  }
  const { turn, turnNumber, startedAt } = room;
  ROOM = room;
  if (ROOM.finished) return finishGame();
  const roomDiv = document.querySelector("#room");
  // roomDiv.innerText = turn + " - " + turnNumber + " - " + startedAt;
  roomDiv.innerText = turn;
  if (ROOM.turn === "NIGHT") {
    const chat = document.querySelector("#chat");
    const chatNight = document.querySelector("#chat-night");
    chat.classList.add("hidden");
    chatNight.classList.remove("hidden");
  } else {
    const chat = document.querySelector("#chat");
    const chatNight = document.querySelector("#chat-night");
    chat.classList.remove("hidden");
    chatNight.classList.add("hidden");
  }
});

socket.on(SocketOnEvents.PLAYERS, (data) => {
  if (!data) {
    return;
  }

  PLAYERS = [];

  PLAYERS = data.map((player) => {
    return new Player({ date: Date.now(), ...player });
  });

  const powersDiv = document.querySelector("#powers");

  const selfPlayer = PLAYERS.find(
    (player) => player.data.profile.id === localStorage.getItem("id")
  );

  if (CLICKED_PLAYER != null) {
  }

  //if (ROOM.turn === "LOBBY") return;

  const rolesDiv = document.querySelector("#roles");

  rolesDiv.innerHTML = "";

  PLAYERS.forEach((player) => {
    rolesDiv.innerHTML += `
      <div class="w-[25%] h-[110px] flex items-center justify-center flex-col bg-zinc-700 rounded-lg">
        <img
          class="inline-block h-10 w-10 rounded-lg ${
            player.data.alive ? "" : "grayscale"
          }"
          src="${player.data.role.image}"
          alt=""
        />
        <p class="text-white text-xs text-center uppercase">${
          player.data.role.name
        }</p>
      </div>
      `;
  });
  if (selfPlayer.data.role.name) {
    // document.querySelector("#skill-button").innerHTML = `
    //   <img
    //     class="inline-block h-[25px] w-[25px]"
    //     src="${selfPlayer.data.role.image}"
    //     alt=""
    //   />
    // `;

    powersDiv.innerHTML = `
    <div class="w-full flex items-center justify-between flex-row p-4 gap-4" onclick="clickPower()">
      <div class="w-[100px] h-[100px] bg-zinc-700 flex justify-center items-center rounded-md">
        <img
          class="inline-block h-[50px] w-[50px]"
          src="${selfPlayer.data.role.image}"
          alt=""
        />    
      </div>
      <div class="w-[90%] flex-col items-start justify-evenly">
        <p class="text-white">You are: ${selfPlayer.data.role.name} (${selfPlayer.data.role.team})</p>
        <p class="text-left text-white text-xs">${selfPlayer.data.role.description}</p>
      </div>
      </div>
    `;
  } else {
    powersDiv.innerHTML = `
    <div class="w-full flex items-center justify-center flex-col p-8" onclick="clickPower()">
      <div class="rounded-full bg-zinc-700 h-[20px] w-[20px]"></div>
    </div>
    `;
  }
});

function clickPower() {
  SKILL = true;
}

socket.on(SocketOnEvents.CHAT, ({ message, sockId, sender }) => {
  if (sockId === socket.id) {
    appendOnChat(`You: ${message}`);
  } else {
    appendOnChat(`${sender}: ${message}`);
  }
});

socket.on(SocketOnEvents.CHAT_NIGHT, ({ message, sockId, sender }) => {
  const self = PLAYERS.find(
    (player) => player.data.profile.id === localStorage.getItem("id")
  );
  console.log(self);
  if (self.data.role.team === "REBEL" || self.data.role.team === "SOLO") {
    return;
  }

  if (sockId === socket.id) {
    appendOnChat(`You: ${message}`, null, true);
  } else {
    appendOnChat(`${sender}: ${message}`, null, true);
  }
});

socket.on(SocketOnEvents.CHAT_TO, ({ message, sender }) => {
  appendOnChat(`${sender}: ${message}`, "bg-blue-800", ROOM.turn === "NIGHT");
});

function finishGame() {
  const chat = document.querySelector("#chat");
  const chatNight = document.querySelector("#chat-night");
  chat.classList.add("hidden");
  chatNight.classList.add("hidden");
  const room = document.querySelector("#room");
  room.innerText = `Game finished - Time ${ROOM.winner} ganhou!`;
}

function vote(sockId) {
  socket.emit(SocketEmitEvents.VOTE, { target: sockId });
}

function handleSkill(sockId) {
  socket.emit(SocketEmitEvents.HANDLE_SKILL, { target: sockId });
}

const chatForm = document.getElementById("chat-form");
chatForm.onsubmit = (e) => {
  e.preventDefault();
  sendMessage();
};

function sendMessage() {
  const msg = document.querySelector("#message");
  socket.emit(
    ROOM.turn === "NIGHT" ? SocketEmitEvents.CHAT_NIGHT : SocketEmitEvents.CHAT,
    { message: msg.value }
  );

  msg.value = "";
}

function appendOnChat(message, background = null, night = false) {
  const chat = document.querySelector(`${"#chat"}${night ? "-night" : ""}`);
  const msg = document.createElement("div");
  msg.setAttribute(
    "class",
    background ? background + " " + STYLES.messageChat : STYLES.messageChat
  );
  msg.textContent = message;
  chat.insertBefore(msg, chat.firstChild);
}

function clickedOn(sockId) {
  console.log("turn is " + ROOM + " clickedOn " + sockId);
  if (SKILL) {
    handleSkill(sockId);
    SKILL = false;
  } else {
    if (ROOM.turn === "NIGHT" || ROOM.turn === "VOTE") {
      vote(sockId);
    }
  }
}

function createPlayerDom(name, id, sockId, player) {
  return `
    <div class="${STYLES.userCard}" data-user-id="${id}" onclick="${
    sockId && sockId !== socket.id ? `clickedOn('${sockId}')` : "() => {}"
  }">
      ${name}
      ${
        player.role
          ? `<img src="${player.role.image}" alt="${player.role.name}" class="w-16 h-16 rounded-full">`
          : ""
      }
      vivo: ${player.alive}
    </div>
  `;
}

function appendUser(userDom) {
  const usersContainer = document.querySelector("#users");
  usersContainer.innerHTML += userDom;
}

function createRoomTimer() {
  if (ROOM.turnNumber === 0) return;

  const timerDiv = document.querySelector("#timer");
  const actualTurnStartedAt = new Date(ROOM.actualTurnStartedAt);
  const now = new Date();
  const timeLeft = 30 - Math.floor((now - actualTurnStartedAt) / 1000);

  timerDiv.innerText = timeLeft < 0 ? 30 : timeLeft;
}

socket.on(SocketOnEvents.CHAT_ALERT, ({ message }) => {
  appendOnChat(message, "bg-red-400", ROOM.turn === "NIGHT" ? true : false);
});

let timeStart = Date.now();
let timeEnd = Date.now();

socket.on(SocketOnEvents.PONG, () => {
  timeEnd = Date.now();
  const ping = timeEnd - timeStart;

  let pingElement;
  pingElement = document.querySelector("#ping");
  if (pingElement) {
    pingElement.innerText = ping + "ms";
  } else {
    const pingElement = document.createElement("div");
    pingElement.setAttribute("id", "ping");
    pingElement.setAttribute("class", STYLES.ping);
    pingElement.innerText = ping + "ms";
    document.body.appendChild(pingElement);
  }
});

setInterval(() => {
  timeStart = Date.now();
  socket.emit(SocketEmitEvents.PING, "ping");

  if (ROOM.turn !== "LOBBY" && ROOM.finished === false) {
    createRoomTimer();
  }

  if (ROOM.actualTurnStartedAt && ROOM.finished === false) {
    let roomTime = new Date(ROOM.actualTurnStartedAt);
    if (roomTime.getTime() + 30000 <= Date.now()) {
      socket.emit(SocketEmitEvents.UPDATE, "update");
    }
  }
}, 1000);

class Utils {
  static elementWidth(element) {
    return (
      element.clientWidth -
      parseFloat(
        window.getComputedStyle(element, null).getPropertyValue("padding-left")
      ) -
      parseFloat(
        window.getComputedStyle(element, null).getPropertyValue("padding-right")
      )
    );
  }

  static elementHeight(element) {
    return (
      element.clientHeight -
      parseFloat(
        window.getComputedStyle(element, null).getPropertyValue("padding-top")
      ) -
      parseFloat(
        window
          .getComputedStyle(element, null)
          .getPropertyValue("padding-bottom")
      )
    );
  }
}

p5DivClone = document.getElementById("canvas");
let WIDTH = Utils.elementWidth(p5DivClone) / 5;
let HEIGHT = Utils.elementHeight(p5DivClone) / 2;
let margin = 5;
let loadedImages = {};

class Player {
  constructor(data) {
    this.data = data;
    this.position = {
      WIDTH: null,
      HEIGHT: null,
    };
  }

  display() {
    push();
    let multiplier = 0;
    if (this.data.index <= 4) {
      multiplier = 0;
    } else if (this.data.index <= 8) {
      multiplier = 1;
    } else if (this.data.index <= 12) {
      multiplier = 2;
    } else {
      multiplier = 3;
    }

    //DRAW PLAYERS
    if (this.data.index <= 4) {
      const backgroundX =
        WIDTH * (this.data.index - 1) + margin * (this.data.index - 1);

      const imageX = backgroundX + 25;

      let nameWidth = textWidth(this.data.index + " " + this.data.profile.name);

      fill(39, 39, 42);
      noStroke();
      rect(
        backgroundX,
        HEIGHT * multiplier + margin * multiplier + 20,
        WIDTH,
        HEIGHT
      );

      if (ROOM.turn === "NIGHT") {
        image(images.bgNight, backgroundX, this.position.HEIGHT, WIDTH, HEIGHT);

        if (this.data.alive) {
          image(
            this.data.profile.gender === "Female" ? images.woman : images.man,
            imageX,
            HEIGHT * multiplier + 50,
            110,
            HEIGHT - 50
          );
        } else {
          image(
            images.tombstone,
            imageX + 15,
            HEIGHT * multiplier + 79,
            80,
            80
          );
        }
      } else {
        image(images.bgDay, backgroundX, this.position.HEIGHT, WIDTH, HEIGHT);

        if (this.data.alive) {
          image(
            this.data.profile.gender === "Female" ? images.woman : images.man,
            imageX,
            HEIGHT * multiplier + 50,
            110,
            HEIGHT - 50
          );
        } else {
          image(
            images.tombstone,
            imageX + 15,
            HEIGHT * multiplier + 79,
            80,
            80
          );
        }
      }

      fill(0, 0, 0, 120);
      rect(
        WIDTH * (this.data.index - 1) + WIDTH / 2 - (nameWidth + 30) / 2,
        HEIGHT * multiplier + 5,
        nameWidth + 30,
        HEIGHT / 9,
        5
      );

      textSize(12);
      if (
        this.data.profile.id === localStorage.getItem("id") &&
        ROOM.turn === "NIGHT"
      ) {
        textStyle(BOLD);
        fill("#1f5b4e");
      } else if (
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "DAY") ||
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "LOBBY") ||
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "VOTE")
      ) {
        push();
        textStyle(BOLD);
        fill("#22323f");
      } else {
        fill(255);
      }
      text(
        this.data.index + " " + this.data.profile.name,
        WIDTH * (this.data.index - 1) + WIDTH / 2 - nameWidth / 2,
        HEIGHT * multiplier + HEIGHT / 5 - 14
      );
      pop();

      this.position = {
        WIDTH: WIDTH * (this.data.index - 1),
        HEIGHT: HEIGHT * multiplier,
      };

      if (
        (ROOM.turn === "VOTE" || ROOM.turn === "NIGHT") &&
        this.data.voteIn != null
      ) {
        push();
        fill("red");
        text(
          ">" + this.data.voteIn + "<",
          WIDTH * (this.data.index - 1) + WIDTH / 2 + 90,
          HEIGHT * multiplier + HEIGHT / 5 - 14 - 17
        );
        pop();
      }
    } else if (this.data.index <= 8) {
      const backgroundX =
        WIDTH * (this.data.index - 1 - 4) + margin * (this.data.index - 1 - 4);

      const imageX = backgroundX + 30;

      let nameWidth = textWidth(this.data.index + " " + this.data.profile.name);

      fill(39, 39, 42);
      noStroke();
      rect(
        backgroundX,
        HEIGHT * multiplier + margin * multiplier,
        WIDTH,
        HEIGHT
      );

      if (ROOM.turn === "NIGHT") {
        image(images.bgNight, backgroundX, this.position.HEIGHT, WIDTH, HEIGHT);

        if (this.data.alive) {
          image(
            this.data.profile.gender === "Female" ? images.woman : images.man,
            imageX,
            HEIGHT * multiplier + 30,
            100,
            HEIGHT - 30
          );
        } else {
          image(
            images.tombstone,
            imageX + 15,
            HEIGHT * multiplier + 79,
            80,
            80
          );
        }
      } else {
        image(images.bgDay, backgroundX, this.position.HEIGHT, WIDTH, HEIGHT);

        if (this.data.alive) {
          image(
            this.data.profile.gender === "Female" ? images.woman : images.man,
            imageX,
            HEIGHT * multiplier + 30,
            100,
            HEIGHT - 30
          );
        } else {
          image(
            images.tombstone,
            imageX + 15,
            HEIGHT * multiplier + 79,
            80,
            80
          );
        }
      }

      fill(0, 0, 0, 120);
      rect(
        WIDTH * (this.data.index - 1 - 4) + WIDTH / 2 - (nameWidth + 30) / 2,
        HEIGHT * multiplier + 5,
        nameWidth + 30,
        HEIGHT / 6,
        5
      );
      textSize(12);
      if (
        this.data.profile.id === localStorage.getItem("id") &&
        ROOM.turn === "NIGHT"
      ) {
        textStyle(BOLD);
        fill("#1f5b4e");
      } else if (
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "DAY") ||
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "LOBBY") ||
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "VOTE")
      ) {
        textStyle(BOLD);
        fill("#22323f");
      } else {
        fill(255);
      }
      text(
        this.data.index + " " + this.data.profile.name,
        WIDTH * (this.data.index - 1 - 4) + WIDTH / 2 - nameWidth / 2,
        HEIGHT * multiplier + HEIGHT / 5 - 4
      );

      this.position = {
        WIDTH: WIDTH * (this.data.index - 1 - 4),
        HEIGHT: HEIGHT * multiplier,
      };
    } else if (this.data.index <= 12) {
      const backgroundX =
        WIDTH * (this.data.index - 1 - 8) + margin * (this.data.index - 1 - 8);

      const imageX = backgroundX + 30;

      let nameWidth = textWidth(this.data.index + " " + this.data.profile.name);

      fill(39, 39, 42);
      noStroke();
      rect(
        backgroundX,
        HEIGHT * multiplier + margin * multiplier,
        WIDTH,
        HEIGHT
      );

      if (ROOM.turn === "NIGHT") {
        image(images.bgNight, backgroundX, this.position.HEIGHT, WIDTH, HEIGHT);

        if (this.data.alive) {
          image(
            this.data.profile.gender === "Female" ? images.woman : images.man,
            imageX,
            HEIGHT * multiplier + 30,
            100,
            HEIGHT - 30
          );
        } else {
          image(
            images.tombstone,
            imageX + 15,
            HEIGHT * multiplier + 79,
            80,
            80
          );
        }
      } else {
        image(images.bgDay, backgroundX, this.position.HEIGHT, WIDTH, HEIGHT);

        if (this.data.alive) {
          image(
            this.data.profile.gender === "Female" ? images.woman : images.man,
            imageX,
            HEIGHT * multiplier + 30,
            100,
            HEIGHT - 30
          );
        } else {
          image(
            images.tombstone,
            imageX + 15,
            HEIGHT * multiplier + 79,
            80,
            80
          );
        }
      }
      fill(0, 0, 0, 120);
      rect(
        WIDTH * (this.data.index - 1 - 8) + WIDTH / 2 - (nameWidth + 30) / 2,
        HEIGHT * multiplier + 5,
        nameWidth + 30,
        HEIGHT / 6,
        5
      );
      textSize(12);
      if (
        this.data.profile.id === localStorage.getItem("id") &&
        ROOM.turn === "NIGHT"
      ) {
        textStyle(BOLD);
        fill("#1f5b4e");
      } else if (
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "DAY") ||
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "LOBBY") ||
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "VOTE")
      ) {
        textStyle(BOLD);
        fill("#22323f");
      } else {
        fill(255);
      }
      text(
        this.data.index + " " + this.data.profile.name,
        WIDTH * (this.data.index - 1 - 8) + WIDTH / 2 - nameWidth / 2,
        HEIGHT * multiplier + HEIGHT / 5 - 4
      );

      this.position = {
        WIDTH: WIDTH * (this.data.index - 1 - 8),
        HEIGHT: HEIGHT * multiplier,
      };
    } else {
      const backgroundX =
        WIDTH * (this.data.index - 1 - 12) +
        margin * (this.data.index - 1 - 12);
      const imageX = backgroundX + 30;
      let nameWidth = textWidth(this.data.index + " " + this.data.profile.name);

      fill(39, 39, 42);
      noStroke();
      rect(
        backgroundX,
        HEIGHT * multiplier + margin * multiplier,
        WIDTH,
        HEIGHT
      );

      image(images.bgDay, backgroundX, this.position.HEIGHT, WIDTH, HEIGHT);
      if (this.data.alive) {
        image(
          this.data.profile.gender === "Female" ? images.woman : images.man,
          imageX,
          HEIGHT * multiplier + 30,
          100,
          HEIGHT - 30
        );
      }
      fill(0, 0, 0, 120);
      rect(
        WIDTH * (this.data.index - 1 - 12) + WIDTH / 2 - (nameWidth + 30) / 2,
        HEIGHT * multiplier + 5,
        nameWidth + 30,
        HEIGHT / 6,
        5
      );
      textSize(12);
      if (
        this.data.profile.id === localStorage.getItem("id") &&
        ROOM.turn === "NIGHT"
      ) {
        textStyle(BOLD);
        fill("#1f5b4e");
      } else if (
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "DAY") ||
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "LOBBY") ||
        (this.data.profile.id === localStorage.getItem("id") &&
          ROOM.turn === "VOTE")
      ) {
        textStyle(BOLD);
        fill("#22323f");
      } else {
        fill(255);
      }
      text(
        this.data.index + " " + this.data.profile.name,
        WIDTH * (this.data.index - 1 - 12) + WIDTH / 2 - nameWidth / 2,
        HEIGHT * multiplier + HEIGHT / 5 - 4
      );

      this.position = {
        WIDTH: WIDTH * (this.data.index - 1 - 12),
        HEIGHT: HEIGHT * multiplier,
      };
    }

    // if (this.data.role.image || loadedImages[this.data.id]) {
    //   if (loadedImages[this.data.id]) {
    //     image(
    //       loadedImages[this.data.id],
    //       smallImageX,
    //       smallImageY,
    //       smallImageSize,
    //       smallImageSize
    //     );
    //   } else {
    //     let smallImageSize = 50; // Tamanho da imagem pequena
    //     let smallImageX = WIDTH * (this.data.index - 1) - smallImageSize;
    //     let smallImageY = HEIGHT - smallImageSize;

    //     loadImage(this.data.role.image, (img) => {
    //       loadedImages[this.data.id] = img;
    //       image(img, smallImageX, smallImageY, smallImageSize, smallImageSize);
    //     });
    //   }
    // }
  }

  clicked(mouseX, mouseY) {
    // Verifica se o mouse está dentro do retângulo
    if (
      mouseX >= this.position.WIDTH &&
      mouseX <= this.position.WIDTH + WIDTH &&
      mouseY >= this.position.HEIGHT &&
      mouseY <= this.position.HEIGHT + HEIGHT
    ) {
      if (ROOM.turn === "LOBBY") {
        return;
      }
      if (this.data.role.team === "REBEL" && ROOM.turn === "NIGHT" && !SKILL) {
        return;
      }
      CLICKED_PLAYER = this.data.index;
      this.data.socketId && clickedOn(this.data.socketId);
    }
  }
}

function setup() {
  p5Div = document.getElementById("canvas");
  const p5Canvas = createCanvas(
    Utils.elementWidth(p5Div),
    Utils.elementHeight(p5Div)
  );
  p5Canvas.parent(p5Div);
  loadImage("assets/images/avatars/man.png", (img) => (images.man = img));
  loadImage("assets/images/avatars/woman.png", (img) => (images.woman = img));
  loadImage("assets/images/bgs/playerDayBg.png", (img) => (images.bgDay = img));
  loadImage(
    "assets/images/bgs/playerNightBg.png",
    (img) => (images.bgNight = img)
  );
  loadImage(
    "assets/images/avatars/tombstone.png",
    (img) => (images.tombstone = img)
  );
}

function draw() {
  PLAYERS.forEach((player) => player.display());
}

function mouseClicked() {
  PLAYERS.length > 0 &&
    PLAYERS.forEach((player) => player.clicked(mouseX, mouseY));
}

function windowResized() {
  p5Div = document.getElementById("canvas");
  resizeCanvas(Utils.elementWidth(p5Div), Utils.elementHeight(p5Div));

  WIDTH = Utils.elementWidth(p5Div) / 4;
  HEIGHT = Utils.elementHeight(p5Div) / 4;
}
