# Weightwatch Dashboard

A beautiful, interactive weight tracking dashboard built with React, TypeScript, and Tailwind CSS. Inspired by Headspace's playful design language with vibrant colors and organic shapes.

## Features

- **BMI Calculator** - Visual gauge showing current BMI with color-coded categories
- **Progress Overview** - Hero metrics tracking your weight loss journey
- **Timeline Chart** - Interactive weight progression chart with target trajectory
- **Statistics Panel** - Detailed daily/weekly/monthly performance breakdowns
- **Comparison View** - Actual vs. target analysis with performance indicators
- **Playful Design** - Organic shapes and vibrant colors inspired by Headspace
- **Mobile Responsive** - Fully responsive design that works on all devices
- **Apercu Font** - Custom font family for a polished, professional look

## Project Structure

```
Weightwatch/
├── public/
│   └── fonts/           # Apercu font files
├── src/
│   ├── components/      # React components
│   │   ├── BMIGauge.tsx
│   │   ├── ProgressOverview.tsx
│   │   ├── TimelineChart.tsx
│   │   ├── StatisticsPanel.tsx
│   │   └── OrganicShapes.tsx
│   ├── services/        # Data services
│   │   └── dataService.ts
│   ├── utils/           # Utility functions
│   │   └── calculations.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
└── package.json
```

## Getting Started

> Deploy trigger: refresh main branch build.

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   Navigate to `http://localhost:5173/`

## Available Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Data Source

Currently using mock data from your Google Sheets. To connect to live data:

1. Enable Google Sheets API
2. Get API credentials
3. Update `src/services/dataService.ts` with your Sheet ID and API key

## Design System

### Colors
- **Green**: Progress, success (#51CC66)
- **Orange**: Targets, warnings (#FF8700)
- **Yellow**: Highlights (#FFF200)
- **Blue**: Information (#00A1FF)
- **Pink**: Achievements (#FF7F88)
- **Purple**: Special metrics (#A14AA8)

### Typography
- **Font Family**: Apercu
- **Weights**: Light (300), Regular (400), Medium (500), Bold (700)

## Technologies

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts (for visualizations)
- date-fns (for date handling)

## Future Enhancements

- [ ] Real-time Google Sheets integration
- [ ] Export data as PDF/CSV
- [ ] Dark mode support
- [ ] Goal adjustment simulator
- [ ] Weekly email reports
- [ ] Social sharing features
