# ⚡ Power Pilot Pro: Margin Optimizer

<p align="center">
  <img src="power_pilot_logo.png" width="200" alt="Power Pilot Logo" />
</p>

<p align="center">
  <strong>Intelligent salgsassistent til Power.dk – Maksimer avance gennem smarte anbefalinger.</strong>
</p>

---

## 🚀 Oversigt
**Power Pilot Pro** er et avanceret værktøj designet specifikt til Powers salgspersonale. Applikationen gør det muligt lynhurtigt at identificere de mest profitable bærbare computere (høj-avance produkter) og matche dem med kundens behov baseret på tekniske specifikationer (CPU, RAM, GPU, Lager).

Værktøjet fungerer som en bro mellem Powers store varelager og den enkelte sælgers succes ved at foreslå "Smart Upgrades" – produkter der giver kunden mere værdi og Power en bedre margin.

## ✨ Key Features
- **🔍 Intelligent Søgning:** Find lynhurtigt produkter via SKU eller modelnavn med avanceret autocomplete.
- **📈 Margin Optimering:** Automatisk identifikation af høj-avance produkter (baseret på brand og prispunkter som 92/98).
- **🤖 Spec DNA Analyse:** Udpakker komplekse hardware-specifikationer direkte fra produktnavne ved brug af Deep Regex Pattern Matching.
- **📊 Sammenlignings-motor:** Visuel sammenligning af kundens valg mod beregnede alternativer med "Upgrade Scores".
- **📝 AI Salgs-Pitches:** Genererer overbevisende salgsargumenter (Value, Loss Aversion, Future Proofing) baseret på tekniske forskelle.
- **🔄 Database Sync:** Fuldt integreret med Supabase PostgreSQL for lynhurtig opslag af over 350+ bærbare modeller.

## 🛠️ Teknisk Stack
- **Frontend:** [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Custom Power.dk Dark Mode Aesthetics)
- **State Management:** [TanStack Query v5](https://tanstack.com/query/latest)
- **Backend:** [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) med [Supabase](https://supabase.com/) & [Drizzle ORM](https://orm.drizzle.team/)
- **Infra:** [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) kompatibel

## ⚙️ Installation & Setup

1. **Klon projektet:**
   ```bash
   git clone https://github.com/Issafiras/power-margin-pro.git
   cd power-margin-pro
   ```

2. **Installer afhængigheder:**
   ```bash
   npm install
   ```

3. **Miljøvariabler (.env):**
   Opret en `.env` fil i roden med din Supabase PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.rsuzznuatnrfvfjfaaol.supabase.co:5432/postgres
   ```

4. **Kør udviklingsmiljøet:**
   ```bash
   npm run dev
   ```

## 🧠 Business Logic: Margin-regler
Værktøjet identificerer automatisk høj-avance produkter ud fra tre primære signaler:
1. **Brand Fokus:** Alle produkter fra **Cepter** markeres som høj-avance.
2. **Psykologiske Prispunkter:** Produkter der ender på **.x92** eller **.x98** identificeres som interne prissætninger med højere margin.
3. **Smart Tiering:** Analyserer CPU og RAM båndbredde for at sikre, at vi aldrig anbefaler et produkt med dårligere ydeevne end kundens udgangspunkt.

---

<p align="center">
  Made with ⚡ for Power Denmark
</p>
