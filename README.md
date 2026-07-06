# CampusConnect - Never Lose Anything Again 🎓

CampusConnect is an AI-assisted lost and found platform for colleges. Students and staff can report lost or found items, upload photos, and use AI-based matching to reconnect belongings faster. The goal is to replace scattered WhatsApp groups and paper boards with a central, searchable system that improves recovery rates.

Lost items are often reported long after the moment they were misplaced, and many campus communities never see the right notice at the right time. CampusConnect turns that process into a clearer workflow: report, match, notify, recover, and close. It helps reduce friction for users, reduces admin workload, and improves campus security and convenience.

## Features

- Guest browsing of open found items and search across title, category, and location
- User authentication with secure JWT-based access
- Report lost and found items with image upload
- AI-assisted matching using CLIP embeddings and cosine similarity
- Dashboard for personal report history and recovery flow
- Admin dashboard with user and report management

## Tech Stack

- React
- Vite
- Tailwind CSS
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- @xenova/transformers

## Installation

1. Clone the repository
2. Backend:
   - `cd backend`
   - `npm install`
   - Copy `.env.example` to `.env` and fill in the values
3. Frontend:
   - `cd frontend`
   - `npm install`
   - Copy `.env.example` to `.env` and fill in the values
4. Seed the admin account:
   - `cd backend`
   - `node src/seeder.js`

## API Overview

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/v1/auth/register` | POST | Register a user |
| `/api/v1/auth/login` | POST | Login a user |
| `/api/v1/reports` | POST | Create a report |
| `/api/v1/reports` | GET | Browse reports |
| `/api/v1/reports/my-reports` | GET | Get current user's reports |
| `/api/v1/admin/stats` | GET | Admin overview stats |

## AI Matching Logic

CampusConnect uses CLIP embeddings from the `Xenova/clip-vit-base-patch32` model. Report images are encoded server-side, while text is used for lightweight similarity scoring. The system compares image embeddings using cosine similarity and combines that with text similarity to suggest potential matches when the score exceeds a threshold of 0.75.

## Screenshots

- `/screenshots/home.png`
- `/screenshots/dashboard.png`

## Deployment

### Frontend (Vercel)
1. Connect the frontend folder to Vercel.
2. Set `VITE_API_URL` to your deployed backend URL.
3. Deploy.

### Backend (Render)
1. Create a new Web Service on Render.
2. Connect the backend folder.
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `FRONTEND_URL`.
4. Deploy.

## Future Enhancements

- Real-time chat between matched users
- QR code tagging for items
- Mobile app experience

## Contributing

Contributions are welcome. Please open an issue or submit a pull request with a clear description of the change.

## License

MIT
