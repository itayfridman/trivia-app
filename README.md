# Daily Trivia App - Multiplayer & International Edition

A comprehensive trivia app with daily challenges, real-time multiplayer, and multi-language support.

## Features

### Core Gameplay
- **10 categories** with 10 levels each, 10 questions per level
- **Daily Challenge** - Same 10 questions for all players, refreshed daily
- **Real-time Multiplayer** - Friend matches and random matchmaking
- **ELO rating system** and coin economy
- **Streak bonuses** and power-ups (hints, skips, extra lives)

### Multiplayer System
- **Friend Matches**: Challenge players by their unique ID
- **Random Matches**: Automatic matchmaking with waiting room
- **Live Progress**: See opponent's progress in real-time
- **Supabase Realtime**: Instant updates and notifications

### Language Support
- **5 Languages**: English, Hebrew (He), Arabic (Ar), French (Fr), Spanish (Es)
- **RTL Support**: Automatic right-to-left layout for Hebrew and Arabic
- **Persistent Settings**: Language preference saved in localStorage

### Technical Features
- **PWA Support**: Installable on mobile devices
- **Dark/Light Mode**: Theme switching with persistence
- **Responsive Design**: Works on all screen sizes
- **Real-time Updates**: Using Supabase Realtime for multiplayer

## Setup & Deployment

### Prerequisites
- Node.js 20+
- Supabase account and project
- Vercel/Netlify/Next.js hosting (recommended)

### 1. Install Dependencies
```bash
npm install
```

### 2. Supabase Setup
1. Create a new Supabase project
2. Run the SQL migration in `supabase/migrations/001_create_multiplayer_tables.sql`
3. Enable Realtime for `matches` and `waiting_room` tables
4. Get your project URL and anon key

### 3. Environment Configuration
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Production Deployment

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

#### Other Platforms
```bash
npm run build
npm start
```

## Database Schema

### Tables Created
- `daily_challenges`: Stores daily questions (date, questions_json)
- `daily_attempts`: Player attempts (player_id, date, score, time)
- `matches`: Multiplayer matches (id, players, questions, scores, status)
- `waiting_room`: Random matchmaking queue

### Realtime Subscriptions
- Match updates for live opponent progress
- Waiting room notifications for random matches

## API Endpoints

### Daily Challenge
- `GET /api/daily-challenge` - Get today's questions
- `POST /api/daily-challenge` - Submit daily attempt
- `GET /api/daily-challenge/leaderboard` - Get daily leaderboard

### Multiplayer
- `POST /api/multiplayer` - Create friend match
- `PUT /api/multiplayer` - Join random match
- `DELETE /api/multiplayer` - Leave waiting room
- `GET /api/multiplayer/[matchId]` - Get match details
- `PUT /api/multiplayer/[matchId]` - Update match score
- `POST /api/multiplayer/[matchId]` - Update match status

## Important Files

### Core Application
- `src/app/page.tsx` - Main application logic and UI
- `src/lib/supabase.ts` - Supabase client and types
- `src/lib/storage.ts` - Local storage management
- `src/lib/trivia.ts` - Trivia question handling
- `src/lib/translations.ts` - Multi-language support

### API Routes
- `src/app/api/daily-challenge/` - Daily challenge endpoints
- `src/app/api/multiplayer/` - Multiplayer endpoints

### Database
- `supabase/migrations/001_create_multiplayer_tables.sql` - Database schema

## Game Mechanics

### Daily Challenge
- 10 questions from Open Trivia DB API
- Same questions for all players on the same day
- One attempt per player per day
- Countdown timer to next challenge (UTC midnight)

### Multiplayer
- 10 simultaneous questions for both players
- Real-time score updates
- ELO rating adjustments based on results
- Friend invitations and random matchmaking

### Progression System
- Coins earned from correct answers
- ELO rating for competitive ranking
- Streak bonuses for consecutive correct answers
- Power-ups: Hints, Question Skips, Extra Lives

## Development Notes

### Open Trivia DB Integration
- Questions fetched from https://opentdb.com/api.php
- Automatic HTML decoding and answer shuffling
- Category and difficulty mapping
- Error handling for API failures

### Realtime Features
- Supabase Realtime for instant updates
- Match progress broadcasting
- Waiting room notifications
- Connection management and cleanup

### Internationalization
- Translation system with fallbacks
- RTL layout support for Arabic/Hebrew
- Language preference persistence
- Dynamic direction switching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for learning or commercial purposes.
