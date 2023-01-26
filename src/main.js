const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const ground = {
  x: 0,
  y: window.innerHeight - 200,
  // big numbers
  width: 0xfffffffffffffffffffffff,
  height: window.innerHeight,
};

let keydown = false;
window.addEventListener("keydown", (e) => e.key === " " && (keydown = true));
window.addEventListener("keyup", (e) => e.key === " " && (keydown = false));

const genNoise = (size, maxHeight) => {
  return Array(size)
    .fill()
    .map((_, idx) => Math.abs(noise.perlin2(idx / 100, 1)) * maxHeight);
};

const height = 2000;
const terrain = genNoise(10000, height).filter((item) => item !== 0);
const xScale = 20;
const gap = 400;

const numPlayers = 300;
const batchSize = location.hash.length > 1 ? parseInt(location.hash.slice(1)) : 100 / 5;
let batch = 0;
let gen = 0;
let highestPerformance = 0;
let bestGenScore = 0;
const players = Array(numPlayers)
  .fill()
  .map(() => new Plane());
players.forEach((player) => player.reset_please());

const drawStats = (stats) => {
  ctx.font = "30px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  stats.forEach(([name, value], idx) => {
    ctx.fillText(name + ": " + value.toString(), 30, 40 * idx + 60);
  });
};

const train = () => {
  // where the good stuff happens
  const bestScore = players.reduce((a, b) => (a > b.x ? a : b), players[0].x);
  const totalFitness = players.reduce((a, b) => a + b.x, players[0].x);
  players.reduce((a, b) => a + b.x, players[0].x);
  players.forEach((player, idx) => {
    if (player.x >= bestScore) player.color = "#00ff00";
    else player.color = "red";
    let left = (idx / players.length) * totalFitness;
    for (const otherPlayer of players) {
      if (left <= otherPlayer.x) {
        console.log("evolving off a player with score of", otherPlayer.x);
        player.evolve(otherPlayer.brain);
      } else {
        left -= otherPlayer.x;
      }
    }
  });
  console.log(totalFitness);
};

const render = () => {
  const runPlayers = players.slice(batch * batchSize, (batch + 1) * batchSize);
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  runPlayers.forEach((player) => player.update());
  if (runPlayers.filter((player) => !player.dead).length < 1) {
    if (batch >= numPlayers / batchSize - 1) {
      train();
      players.forEach((player) => {
        player.reset_please();
        player.dead = false;
      });
      batch = 0;
      bestGenScore = 0;
      gen++;
    } else {
      batch++;
    }
  }

  const bestPlayer = runPlayers.reduce((a, b) => (b.x > a.x && !b.dead ? b : a));
  if (bestPlayer.x > highestPerformance) highestPerformance = bestPlayer.x;
  if (bestPlayer.x > bestGenScore) bestGenScore = bestPlayer.x;

  ctx.translate(
    -bestPlayer.x + window.innerWidth / 2,
    -bestPlayer.y + window.innerHeight / 2
  );
  runPlayers.forEach((player) => player.render());
  ctx.fillStyle = "gray";
  ctx.fillRect(
    ground.x - ground.width / 2,
    ground.y - ground.height / 2,
    ground.width,
    ground.height
  );
  ctx.beginPath();
  ctx.moveTo(0, ground.y - ground.height / 2);
  terrain.forEach((point, idx) =>
    ctx.lineTo(idx * xScale, -point + ground.y - ground.height / 2)
  );
  ctx.fillStyle = "black";
  ctx.lineTo(terrain.length * xScale, ground.y - ground.height / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, ground.y - ground.height / 2 - gap);
  terrain.forEach((point, idx) =>
    ctx.lineTo(idx * xScale, -point + ground.y - ground.height / 2 - gap)
  );
  ctx.fillStyle = "black";
  ctx.lineTo(terrain.length * xScale, ground.y - ground.height / 2 - gap);
  // ctx.closePath();
  // ctx.fill();
  ctx.stroke();

  ctx.translate(
    bestPlayer.x - window.innerWidth / 2,
    bestPlayer.y - window.innerHeight / 2
  );

  drawStats([
    ["Gen", gen],
    ["Batch", batch + 1],
    ["Best score", highestPerformance.toFixed(0)],
    ["Best generation score", bestGenScore.toFixed(0)],
  ]);

  bestPlayer.brain.render(
    [
      "Rotational velocity",
      "Rotation",
      "Distance to ground",
      "Distance to bottom terrain",
      "Distance to top terrain",
    ],
    ["nay", "yay"]
  );
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;

  setTimeout(render, 0);
};

requestAnimationFrame(render);
