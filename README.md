# Poptin MVP - Popup & Lead Capture Platform

A production-ready MVP web app for creating and managing popups with lead capture functionality.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: MongoDB (Mongoose)
- **Charts**: Recharts
- **Hosting**: Vercel

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/poptin
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/poptin
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Sites Management**: Create and manage websites
- **Popup Builder**: Create customizable popups with live preview
- **Triggers**: Time delay and exit intent triggers
- **Embed Script**: Easy integration script for client websites
- **Leads Management**: View and export leads
- **Analytics**: Track popup views and conversions

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utilities and MongoDB connection
├── models/                # Mongoose models
└── public/                # Static files (including popup.js)
```

