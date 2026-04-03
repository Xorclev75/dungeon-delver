import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

const HEROES = [
  {
    id: "warrior",
    name: "Warrior",
    emoji: "⚔️",
    hp: 42,
    maxHp: 42,
    attack: 8,
    defense: 4,
    magic: 1,
    specialName: "Shield Slam",
    description: "A durable frontline fighter with heavy armor and powerful strikes.",
  },
  {
    id: "rogue",
    name: "Rogue",
    emoji: "🗡️",
    hp: 32,
    maxHp: 32,
    attack: 10,
    defense: 2,
    magic: 2,
    specialName: "Backstab",
    description: "Fast and deadly. Crits often and dodges danger with ease.",
  },
  {
    id: "mage",
    name: "Mage",
    emoji: "🔮",
    hp: 26,
    maxHp: 26,
    attack: 4,
    defense: 1,
    magic: 9,
    specialName: "Arcane Burst",
    description: "Fragile, but devastating with magical attacks and healing.",
  },
];

const MONSTER_TYPES = [
  { name: "Goblin", hp: 16, attack: 5, defense: 1, gold: 8, xp: 10, emoji: "👺" },
  { name: "Skeleton", hp: 18, attack: 6, defense: 2, gold: 10, xp: 12, emoji: "💀" },
  { name: "Slime", hp: 14, attack: 4, defense: 0, gold: 7, xp: 8, emoji: "🟢" },
  { name: "Orc", hp: 24, attack: 7, defense: 3, gold: 14, xp: 16, emoji: "🪓" },
  { name: "Shade", hp: 20, attack: 8, defense: 1, gold: 15, xp: 18, emoji: "👻" },
];

const BOSS_TYPES = [
  { name: "Ogre Warlord", hp: 48, attack: 12, defense: 4, gold: 40, xp: 45, emoji: "👹" },
  { name: "Bone Tyrant", hp: 52, attack: 11, defense: 5, gold: 42, xp: 48, emoji: "☠️" },
  { name: "Ancient Wyrm", hp: 58, attack: 13, defense: 4, gold: 48, xp: 54, emoji: "🐉" },
  { name: "Shadow King", hp: 50, attack: 14, defense: 5, gold: 50, xp: 56, emoji: "🖤" },
];

const GRID_SIZE = 7;
const START_POS = { x: 0, y: 0 };

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function key(x, y) {
  return `${x},${y}`;
}

function pickMonster(floor) {
  const isBossFloor = floor % 5 === 0;
  const pool = isBossFloor ? BOSS_TYPES : MONSTER_TYPES;
  const base = pool[rand(0, pool.length - 1)];

  const hpScale = isBossFloor ? 1 + (floor - 1) * 0.22 : 1 + (floor - 1) * 0.18;
  const attackScale = isBossFloor ? 1 + (floor - 1) * 0.16 : 1 + (floor - 1) * 0.12;
  const rewardScale = isBossFloor ? 1 + (floor - 1) * 0.2 : 1 + (floor - 1) * 0.15;

  return {
    ...base,
    isBoss: isBossFloor,
    hp: Math.round(base.hp * hpScale),
    maxHp: Math.round(base.hp * hpScale),
    attack: Math.max(base.attack, Math.round(base.attack * attackScale)),
    defense: base.defense + Math.floor((floor - 1) / (isBossFloor ? 1.5 : 2)),
    gold: Math.round(base.gold * rewardScale),
    xp: Math.round(base.xp * rewardScale),
  };
}

function createDungeon(floor) {
  const monsters = {};
  const treasures = {};
  const fountains = {};
  const traps = {};
  const exit = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
  const isBossFloor = floor % 5 === 0;

  if (isBossFloor) {
    const bossX = Math.max(1, GRID_SIZE - 2);
    const bossY = Math.max(1, GRID_SIZE - 2);
    monsters[key(bossX, bossY)] = pickMonster(floor);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (x === 0 && y === 0) continue;
        if (x === exit.x && y === exit.y) continue;
        if (x === bossX && y === bossY) continue;
        const roll = Math.random();
        if (roll < 0.14) treasures[key(x, y)] = rand(12, 24) + floor * 3;
        else if (roll < 0.2) fountains[key(x, y)] = rand(10, 18) + floor * 2;
        else if (roll < 0.28) traps[key(x, y)] = rand(8, 14) + floor;
      }
    }
  } else {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (x === 0 && y === 0) continue;
        if (x === exit.x && y === exit.y) continue;
        const roll = Math.random();
        if (roll < 0.24) monsters[key(x, y)] = pickMonster(floor);
        else if (roll < 0.38) treasures[key(x, y)] = rand(8, 18) + floor * 2;
        else if (roll < 0.46) fountains[key(x, y)] = rand(8, 14) + floor * 2;
        else if (roll < 0.58) traps[key(x, y)] = rand(5, 10) + floor;
      }
    }
  }

  return { monsters, treasures, fountains, traps, exit, discovered: { [key(0, 0)]: true } };
}

function battleDamage(attacker, defender, boost = 0) {
  return Math.max(1, attacker + boost - defender + rand(0, 3));
}

function levelXpNeeded(level) {
  return 18 + (level - 1) * 12;
}

function tileType(x, y, dungeon) {
  const k = key(x, y);
  if (x === 0 && y === 0) return "start";
  if (x === dungeon.exit.x && y === dungeon.exit.y) return "exit";
  if (dungeon.monsters[k]) return "monster";
  if (dungeon.treasures[k]) return "treasure";
  if (dungeon.fountains[k]) return "fountain";
  if (dungeon.traps?.[k]) return "trap";
  return "empty";
}

function ProgressBar({ value, max }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ background: "#1f2937", borderRadius: 999, height: 12, overflow: "hidden", border: "1px solid #374151" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "linear-gradient(90deg, #22c55e, #3b82f6)",
          transition: "width 0.2s ease",
        }}
      />
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 14,
        padding: 12,
      }}
    >
      <div style={{ color: "#9ca3af", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function ActionButton({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#374151" : "#2563eb",
        color: "white",
        border: "none",
        borderRadius: 14,
        padding: "12px 14px",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [screen, setScreen] = useState("select");
  const [hero, setHero] = useState(null);
  const [floor, setFloor] = useState(1);
  const [dungeon, setDungeon] = useState(() => createDungeon(1));
  const [pos, setPos] = useState(START_POS);
  const [log, setLog] = useState([{ text: "Choose your hero to begin your descent.", type: "info" }]);
  const [battle, setBattle] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [showLog, setShowLog] = useState(true);
  const logContainerRef = useRef(null);

  const appendLog = (text, type = "info") => {
    setLog((prev) => [...prev, { text, type }].slice(-40));
  };

  const startGame = (baseHero) => {
    setHero({
      ...baseHero,
      hp: baseHero.maxHp,
      gold: 0,
      xp: 0,
      level: 1,
      potions: 2,
      critChance: baseHero.id === "rogue" ? 0.3 : 0.12,
    });
    setFloor(1);
    setDungeon(createDungeon(1));
    setPos(START_POS);
    setBattle(null);
    setGameOver(false);
    setShowLog(true);
    setLog([
      { text: `You enter Floor 1 as the ${baseHero.name}.`, type: "info" },
      { text: "Find treasure, survive monsters, and reach the exit.", type: "info" },
    ]);
    setScreen("game");
  };

  const revealTile = (x, y) => {
    const k = key(x, y);
    setDungeon((d) => ({ ...d, discovered: { ...d.discovered, [k]: true } }));
  };

  const checkLevelUp = (updatedHero) => {
    let h = { ...updatedHero };
    let leveled = false;
    while (h.xp >= levelXpNeeded(h.level)) {
      h.xp -= levelXpNeeded(h.level);
      h.level += 1;
      h.maxHp += 6;
      h.hp = Math.min(h.maxHp, h.hp + 6);
      h.attack += 2;
      h.defense += 1;
      h.magic += 1;
      leveled = true;
    }
    if (leveled) appendLog(`You leveled up to ${h.level}! Your power grows.`, "level");
    return h;
  };

  const triggerTile = useCallback((x, y) => {
    const k = key(x, y);
    const kind = tileType(x, y, dungeon);

    if (kind === "monster") {
      setBattle({ monster: dungeon.monsters[k], tileKey: k });
      appendLog(
        dungeon.monsters[k].isBoss
          ? `Boss encounter! ${dungeon.monsters[k].name} blocks your path!`
          : `A ${dungeon.monsters[k].name} appears!`,
        dungeon.monsters[k].isBoss ? "danger" : "enemy"
      );
      return;
    }

    if (kind === "treasure") {
      const amount = dungeon.treasures[k];
      setHero((h) => ({ ...h, gold: h.gold + amount }));
      setDungeon((d) => {
        const next = { ...d, treasures: { ...d.treasures } };
        delete next.treasures[k];
        return next;
      });
      appendLog(`You found ${amount} gold in a dusty chest.`, "loot");
      return;
    }

    if (kind === "fountain") {
      const heal = dungeon.fountains[k];
      setHero((h) => ({ ...h, hp: Math.min(h.maxHp, h.hp + heal) }));
      setDungeon((d) => {
        const next = { ...d, fountains: { ...d.fountains } };
        delete next.fountains[k];
        return next;
      });
      appendLog(`A glowing fountain restores ${heal} HP.`, "heal");
      return;
    }

    if (kind === "trap") {
      const damage = dungeon.traps[k];
      let defeated = false;
      setHero((h) => {
        const nextHp = Math.max(0, h.hp - damage);
        defeated = nextHp <= 0;
        return { ...h, hp: nextHp };
      });
      setDungeon((d) => {
        const next = { ...d, traps: { ...d.traps } };
        delete next.traps[k];
        return next;
      });
      appendLog(`A hidden trap springs! You take ${damage} damage.`, "danger");
      if (defeated) {
        setBattle(null);
        setGameOver(true);
        appendLog("The trap was fatal. You collapse in the dungeon.", "danger");
      }
      return;
    }

    if (kind === "exit") {
      const nextFloor = floor + 1;
      setFloor(nextFloor);
      setDungeon(createDungeon(nextFloor));
      setPos(START_POS);
      appendLog(
        nextFloor % 5 === 0
          ? `You descend to Floor ${nextFloor}. A boss lurks in the darkness...`
          : `You descend to Floor ${nextFloor}. The dungeon grows darker.`,
        nextFloor % 5 === 0 ? "danger" : "info"
      );
      return;
    }

    appendLog("The corridor is eerily quiet.", "info");
  }, [dungeon, floor]);

  const move = useCallback((dx, dy) => {
    if (battle || gameOver || !hero) return;

    const nx = clamp(pos.x + dx, 0, GRID_SIZE - 1);
    const ny = clamp(pos.y + dy, 0, GRID_SIZE - 1);

    if (nx === pos.x && ny === pos.y) return;

    setPos({ x: nx, y: ny });
    revealTile(nx, ny);
    triggerTile(nx, ny);
  }, [pos, battle, gameOver, hero, dungeon, triggerTile]);

  useEffect(() => {
    const onKey = (e) => {
      if (screen !== "game") return;
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") move(0, -1);
      if (k === "arrowdown" || k === "s") move(0, 1);
      if (k === "arrowleft" || k === "a") move(-1, 0);
      if (k === "arrowright" || k === "d") move(1, 0);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, move]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [log, showLog]);

  const heroAttack = (type) => {
    if (!battle || !hero) return;
    let workingHero = { ...hero };
    let workingMonster = { ...battle.monster };

    if (type === "attack") {
      let dmg = battleDamage(workingHero.attack, workingMonster.defense);
      let note = "";
      if (Math.random() < workingHero.critChance) {
        dmg += 5;
        note = " Critical hit!";
      }
      workingMonster.hp -= dmg;
      appendLog(`You strike the ${workingMonster.name} for ${dmg} damage.${note}`, "damage");
    }

    if (type === "special") {
      let power = 0;
      if (workingHero.id === "warrior") power = 6;
      if (workingHero.id === "rogue") power = 8;
      if (workingHero.id === "mage") power = 10 + workingHero.magic;
      const dmg = battleDamage(Math.max(workingHero.attack, workingHero.magic), workingMonster.defense, power);
      workingMonster.hp -= dmg;
      appendLog(`${workingHero.specialName} deals ${dmg} damage to the ${workingMonster.name}.`, "damage");
    }

    if (type === "potion") {
      if (workingHero.potions <= 0) {
        appendLog("You have no potions left.", "warning");
        return;
      }
      const heal = 14 + workingHero.level * 2;
      workingHero.hp = Math.min(workingHero.maxHp, workingHero.hp + heal);
      workingHero.potions -= 1;
      appendLog(`You drink a potion and restore ${heal} HP.`, "heal");
    }

    if (type === "heal") {
      if (workingHero.id !== "mage") return;
      const heal = 10 + workingHero.magic;
      workingHero.hp = Math.min(workingHero.maxHp, workingHero.hp + heal);
      appendLog(`You cast a healing spell and recover ${heal} HP.`, "heal");
    }

    if (workingMonster.hp <= 0) {
      const gainedGold = workingMonster.gold;
      const gainedXp = workingMonster.xp;
      const leveledHero = checkLevelUp({
        ...workingHero,
        gold: workingHero.gold + gainedGold,
        xp: workingHero.xp + gainedXp,
      });
      setHero(leveledHero);
      setDungeon((d) => {
        const next = { ...d, monsters: { ...d.monsters } };
        delete next.monsters[battle.tileKey];
        return next;
      });
      setBattle(null);
      appendLog(
        workingMonster.isBoss
          ? `Boss defeated! ${workingMonster.name} falls. You gain ${gainedXp} XP and ${gainedGold} gold.`
          : `The ${workingMonster.name} is defeated. You gain ${gainedXp} XP and ${gainedGold} gold.`,
        "victory"
      );
      return;
    }

    const enemyDamage = Math.max(1, workingMonster.attack - workingHero.defense + rand(0, 2));
    const dodge = workingHero.id === "rogue" && Math.random() < 0.18;
    if (dodge) {
      appendLog(`The ${workingMonster.name} attacks, but you dodge out of the way.`, "info");
    } else {
      workingHero.hp -= enemyDamage;
      appendLog(`The ${workingMonster.name} hits you for ${enemyDamage} damage.`, "enemy");
    }

    if (workingHero.hp <= 0) {
      workingHero.hp = 0;
      setHero(workingHero);
      setBattle(null);
      setGameOver(true);
      appendLog("You have fallen in the dungeon.", "danger");
      return;
    }

    setHero(workingHero);
    setBattle({ ...battle, monster: workingMonster });
  };

  const buyPotion = () => {
    if (!hero || hero.gold < 20) {
      appendLog("You need 20 gold to buy a potion.", "warning");
      return;
    }
    setHero((h) => ({ ...h, gold: h.gold - 20, potions: h.potions + 1 }));
    appendLog("You prepare an extra potion for the road.", "loot");
  };

  const visibleGrid = useMemo(() => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const discovered = dungeon.discovered[key(x, y)] || (x === pos.x && y === pos.y);
        cells.push({ x, y, discovered, type: tileType(x, y, dungeon) });
      }
    }
    return cells;
  }, [dungeon, pos]);

  const pageStyle = {
    minHeight: "100vh",
    backgroundColor: "#111111",
    backgroundImage: `
      radial-gradient(circle at 20% 15%, rgba(245, 158, 11, 0.12), transparent 18%),
      radial-gradient(circle at 80% 12%, rgba(239, 68, 68, 0.10), transparent 20%),
      radial-gradient(circle at 50% 85%, rgba(59, 130, 246, 0.08), transparent 24%),
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 35%, #1c1c1c 55%, #0d0d0d 100%)
    `,
    backgroundSize: "auto, auto, auto, 38px 38px, 38px 38px, 100% 100%",
    color: "#e5e7eb",
    padding: 20,
    fontFamily: 'Trebuchet MS, Arial, sans-serif',
    position: "relative",
  };

  const panelStyle = {
    background: "linear-gradient(180deg, rgba(38, 38, 38, 0.96), rgba(20, 20, 20, 0.98))",
    border: "1px solid #5b5b5b",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 16px 34px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
    overflow: "hidden",
    position: "relative",
  };

  const statsPanelStyle = {
    ...panelStyle,
    background: "linear-gradient(180deg, rgba(55, 65, 81, 0.97), rgba(30, 41, 59, 0.99))",
    border: "1px solid #64748b",
    boxShadow: "0 16px 36px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)",
  };

  const mapPanelStyle = {
    ...panelStyle,
    background: "linear-gradient(180deg, rgba(58, 33, 18, 0.97), rgba(28, 25, 23, 0.99))",
    border: "1px solid #a16207",
    boxShadow: "0 16px 36px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.05)",
  };

  const logPanelStyle = {
    ...panelStyle,
    background: "linear-gradient(180deg, rgba(31, 41, 55, 0.97), rgba(17, 24, 39, 0.99))",
    border: "1px solid #7c3aed",
    boxShadow: "0 16px 36px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.05)",
  };

  const toggleButtonStyle = {
    background: "#1d4ed8",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
  };

  const getLogItemStyle = (type) => {
    const map = {
      info: { background: "#111827", border: "#374151", color: "#e5e7eb" },
      damage: { background: "#3f1d1d", border: "#7f1d1d", color: "#fecaca" },
      enemy: { background: "#431407", border: "#9a3412", color: "#fdba74" },
      heal: { background: "#052e16", border: "#166534", color: "#bbf7d0" },
      loot: { background: "#3b2f0a", border: "#a16207", color: "#fde68a" },
      victory: { background: "#0c4a6e", border: "#0369a1", color: "#bae6fd" },
      level: { background: "#4c1d95", border: "#7c3aed", color: "#e9d5ff" },
      warning: { background: "#3f3f0a", border: "#a16207", color: "#fef08a" },
      danger: { background: "#450a0a", border: "#b91c1c", color: "#fecaca" },
    };
    return map[type] || map.info;
  };

  if (screen === "select") {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ textAlign: "center", fontSize: 48, marginBottom: 10 }}>Dungeon Delver</h1>
          <p style={{ textAlign: "center", color: "#cbd5e1", maxWidth: 700, margin: "0 auto 30px" }}>
            Choose your hero, explore a dangerous dungeon, collect treasure, and survive turn-based battles.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {HEROES.map((h) => (
              <div key={h.id} style={panelStyle}>
                <div style={{ fontSize: 42 }}>{h.emoji}</div>
                <h2 style={{ margin: "10px 0" }}>{h.name}</h2>
                <p style={{ color: "#cbd5e1", minHeight: 48 }}>{h.description}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "16px 0" }}>
                  <StatBox label="HP" value={h.maxHp} />
                  <StatBox label="Attack" value={h.attack} />
                  <StatBox label="Defense" value={h.defense} />
                  <StatBox label="Magic" value={h.magic} />
                </div>
                <ActionButton onClick={() => startGame(h)}>Begin as {h.name}</ActionButton>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        <div
          style={{
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(70, 38, 12, 0.96), rgba(24, 24, 27, 0.99))",
            border: "1px solid #d97706",
            borderRadius: 24,
            padding: "22px 24px",
            boxShadow: "0 18px 42px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center top, rgba(245, 158, 11, 0.14), transparent 55%)", pointerEvents: "none" }} />
          <div style={{ fontSize: 16, letterSpacing: 3, textTransform: "uppercase", color: "#cbd5e1", marginBottom: 6, position: "relative" }}>
            Explore • Battle • Survive
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 900,
              color: "#f8fafc",
              letterSpacing: 1,
              textShadow: "0 0 10px rgba(245,158,11,0.22), 0 2px 16px rgba(59,130,246,0.28)",
              position: "relative",
            }}
          >
            Dungeon Delver
          </h1>
          <div style={{ marginTop: 8, color: "#e2e8f0", fontSize: 16, position: "relative" }}>
            Descend into the depths and see how far your hero can go.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          <div style={statsPanelStyle}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(59,130,246,0.12), transparent 45%)", pointerEvents: "none" }} />
            <h2 style={{ marginTop: 0, position: "relative" }}>{hero?.name} — Floor {floor}</h2>
            <div style={{ marginBottom: 14 }}>
              <div style={{ marginBottom: 6 }}>HP: {hero?.hp}/{hero?.maxHp}</div>
              <ProgressBar value={hero?.hp || 0} max={hero?.maxHp || 1} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 6 }}>XP: {hero?.xp}/{levelXpNeeded(hero?.level || 1)}</div>
              <ProgressBar value={hero?.xp || 0} max={levelXpNeeded(hero?.level || 1)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatBox label="Level" value={hero?.level} />
              <StatBox label="Gold" value={hero?.gold} />
              <StatBox label="Attack" value={hero?.attack} />
              <StatBox label="Defense" value={hero?.defense} />
              <StatBox label="Magic" value={hero?.magic} />
              <StatBox label="Potions" value={hero?.potions} />
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              <ActionButton onClick={buyPotion}>Buy Potion (20 gold)</ActionButton>
              <ActionButton onClick={() => setScreen("select")}>Choose New Hero</ActionButton>
            </div>
          </div>

          <div style={mapPanelStyle}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top center, rgba(245,158,11,0.12), transparent 50%)", pointerEvents: "none" }} />
            <h2 style={{ marginTop: 0, position: "relative" }}>Dungeon Map</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`, gap: 8, width: "100%", maxWidth: 500, margin: "0 auto 20px" }}>
              {visibleGrid.map((cell) => {
                const isPlayer = cell.x === pos.x && cell.y === pos.y;
                const discovered = cell.discovered;
                let content = "";
                if (isPlayer) {
                  if (hero?.id === "warrior") content = "⚔️";
                  else if (hero?.id === "rogue") content = "🗡️";
                  else content = "🔮";
                }
                else if (!discovered) content = "";
                else if (cell.type === "start") content = "🏕️";
                else if (cell.type === "exit") content = "🚪";
                else if (cell.type === "monster") {
                  const monster = dungeon.monsters[key(cell.x, cell.y)];
                  content = monster?.isBoss ? "👑" : "👾";
                }
                else if (cell.type === "treasure") content = "💰";
                else if (cell.type === "fountain") content = "💧";
                else if (cell.type === "trap") content = "🪤";
                else content = "·";

                return (
                  <div
                    key={`${cell.x}-${cell.y}`}
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: 14,
                      border: isPlayer ? "2px solid #f59e0b" : "1px solid #475569",
                      background: isPlayer
                        ? "linear-gradient(180deg, #78350f, #451a03)"
                        : discovered
                        ? "linear-gradient(180deg, #334155, #1e293b)"
                        : "linear-gradient(180deg, #020617, #0f172a)",
                      boxShadow: isPlayer ? "0 0 16px rgba(245,158,11,0.28)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      minHeight: 50,
                    }}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "60px 60px 60px", gap: 8, justifyContent: "center" }}>
              <div />
              <ActionButton onClick={() => move(0, -1)}>↑</ActionButton>
              <div />
              <ActionButton onClick={() => move(-1, 0)}>←</ActionButton>
              <ActionButton onClick={() => move(0, 1)}>↓</ActionButton>
              <ActionButton onClick={() => move(1, 0)}>→</ActionButton>
            </div>
            <p style={{ textAlign: "center", color: "#94a3b8", marginTop: 12 }}>Use arrow keys or WASD too.</p>
          </div>

          <div style={logPanelStyle}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(124,58,237,0.14), transparent 48%)", pointerEvents: "none" }} />
            {battle ? (
              <>
                <h2 style={{ marginTop: 0 }}>Battle</h2>
                <div style={{ background: "#111827", border: "1px solid #374151", borderRadius: 14, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                    <strong>{battle.monster.emoji} {battle.monster.name}</strong>
                    <span>{battle.monster.hp}/{battle.monster.maxHp} HP</span>
                  </div>
                  <ProgressBar value={battle.monster.hp} max={battle.monster.maxHp} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <ActionButton onClick={() => heroAttack("attack")}>Attack</ActionButton>
                  <ActionButton onClick={() => heroAttack("special")}>{hero?.specialName}</ActionButton>
                  <ActionButton onClick={() => heroAttack("potion")}>Use Potion</ActionButton>
                  <ActionButton onClick={() => heroAttack("heal")} disabled={hero?.id !== "mage"}>Cast Heal</ActionButton>
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Battle Log</div>
                  <div ref={logContainerRef} style={{ display: "grid", gap: 10, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
                    {[...log].slice(-8).reverse().map((entry, i) => {
                      const logStyle = getLogItemStyle(entry.type);
                      return (
                        <div
                          key={i}
                          style={{
                            background: logStyle.background,
                            border: `1px solid ${logStyle.border}`,
                            color: logStyle.color,
                            borderRadius: 14,
                            padding: 12,
                          }}
                        >
                          {entry.text}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : gameOver ? (
              <>
                <h2 style={{ marginTop: 0 }}>Game Over</h2>
                <p>You reached Floor {floor} and collected {hero?.gold ?? 0} gold.</p>
                <ActionButton onClick={() => setScreen("select")}>Play Again</ActionButton>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <h2 style={{ margin: 0 }}>Adventure Log</h2>
                  <button style={toggleButtonStyle} onClick={() => setShowLog((v) => !v)}>
                    {showLog ? "Hide Log" : "Show Log"}
                  </button>
                </div>
                {showLog ? (
                  <div ref={logContainerRef} style={{ display: "grid", gap: 10, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
                    {[...log].reverse().map((entry, i) => {
                      const logStyle = getLogItemStyle(entry.type);
                      return (
                        <div
                          key={i}
                          style={{
                            background: logStyle.background,
                            border: `1px solid ${logStyle.border}`,
                            color: logStyle.color,
                            borderRadius: 14,
                            padding: 12,
                          }}
                        >
                          {entry.text}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8", margin: 0 }}>The adventure log is hidden.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
