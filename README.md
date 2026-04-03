# 🏰 Dungeon Delver

Dungeon Delver is a browser-based dungeon exploration RPG built with React. Players choose a hero, navigate a grid-based dungeon, encounter monsters, avoid traps, and survive increasingly difficult floors.

This project showcases front-end game logic, state management, and UI/UX design using modern JavaScript and React.

---

## 🎮 Features

### 🧙 Hero Selection

Choose from three unique classes:

* **Warrior** – High durability and defense
* **Rogue** – High damage with dodge and critical chance
* **Mage** – Powerful magic with healing abilities

---

### 🗺️ Dungeon Exploration

* Procedurally generated dungeon per floor
* Fog-of-war discovery system
* Movement via buttons or keyboard (WASD / Arrow keys)
* Increasing difficulty with each floor

---

### ⚔️ Combat System

* Turn-based battle mechanics
* Actions include:

  * Attack
  * Special Ability (with cooldown)
  * Use Potion
  * Cast Heal (Mage only, with cooldown)
* Enemies scale with dungeon depth
* Boss battles every 5 floors

---

### ☠️ Hazards & Events

* Random traps (damage or dodge chance)
* Treasure chests
* Healing fountains
* Environmental flavor events for immersion

---

### 📜 Adventure Log

* Scrollable, color-coded log
* Latest events shown at the top
* Toggle visibility on/off
* Separate battle log during combat

---

### ❤️ Player Systems

* Health bar with dramatic low-HP warning
* XP and leveling system
* Gold and potion economy
* Game over condition when HP reaches zero

---

### 🎨 UI & Experience

* Themed dungeon-style UI
* Dynamic panels for map, stats, and logs
* Custom button colors for clarity
* Responsive layout
* Custom favicon and title branding

---

## 🛠️ Tech Stack

* **React (Create React App)**
* **JavaScript (ES6+)**
* **CSS-in-JS styling**
* **Netlify** (deployment)

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/dungeon-delver.git
cd dungeon-delver
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm start
```

### 4. Build for production

```bash
npm run build
```

---

## 🌐 Deployment

This project is deployed using Netlify.

To deploy:

1. Push your code to GitHub
2. Connect your repo to Netlify
3. Set build command:

   ```
   npm run build
   ```
4. Set publish directory:

   ```
   build
   ```

---

## 🧠 What This Project Demonstrates

* Component-based UI architecture
* React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`)
* Game state management without external libraries
* Procedural content generation
* Turn-based logic implementation
* UX improvements through visual feedback and logging
* Debugging and deployment workflows

---

## 🔮 Future Improvements

* Equipment and inventory system
* Save/load progress
* Sound effects and animations
* Expanded enemy variety
* Skill trees or upgrades
* Mobile optimization

---

## 👤 Author

**Josh Schwartzkopf**

---

## 📄 License

This project is open source and available under the MIT License.
