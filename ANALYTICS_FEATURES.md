# Analytics & Charts Features

## Overview
Comprehensive analytics dashboard with charts and graphs showing monthly and daily upload analytics for all employees. Employees can see who uploaded videos and who didn't for both Instagram and YouTube platforms.

## Features Implemented

### 1. **Daily Analytics** (`/api/analytics/daily`)
- **Line Chart**: Daily upload trends over time (YouTube, Instagram, Total)
- **Bar Chart**: Daily uploads breakdown by platform
- **Area Charts**: Team-wide compliance showing who uploaded vs who missed each day
  - YouTube compliance (uploaded vs missed)
  - Instagram compliance (uploaded vs missed)
- **Summary Cards**: Total uploads, averages, and period statistics
- **Date Range Selection**: 7, 14, 30, 60, or 90 days

### 2. **Monthly Analytics** (`/api/analytics/monthly`)
- **Bar Chart**: Monthly uploads by employee (YouTube, Instagram, Total)
- **Stacked Bar Charts**: Uploaded vs Missed comparison
  - YouTube: Shows who uploaded and who missed
  - Instagram: Shows who uploaded and who missed
- **Compliance Status Chart**: Visual representation of compliance
- **Summary Cards**: Total uploads, averages, and compliance statistics
- **Month Selection**: View analytics for any month (last 6 months)

### 3. **Team-Wide Comparison Charts**
- **Who Uploaded vs Who Didn't**: Clear visualization showing:
  - Green areas: Employees who uploaded
  - Red areas: Employees who missed
- **Daily Compliance Tracking**: See daily patterns across the team
- **Platform-Specific Views**: Separate charts for YouTube and Instagram

### 4. **Employee-Specific Analytics**
- Individual employee dashboards show:
  - Personal daily upload trends
  - Monthly performance charts
  - Compliance status over time
- Employees can see their own analytics in their dashboard

## API Endpoints

### `/api/analytics/daily`
**Query Parameters:**
- `employeeId` (optional): Filter by specific employee
- `days` (optional): Number of days to fetch (default: 30)
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "startDate": "2024-11-01",
  "endDate": "2024-11-30",
  "data": [
    {
      "date": "2024-11-01",
      "youtube": 5,
      "instagram": 6,
      "total": 11,
      "employees_uploaded_yt": 5,
      "employees_missed_yt": 1,
      "employees_uploaded_ig": 6,
      "employees_missed_ig": 0,
      "total_employees": 6
    }
  ],
  "summary": {
    "total_days": 30,
    "total_youtube_uploads": 90,
    "total_instagram_uploads": 180,
    "avg_youtube_per_day": 3.0,
    "avg_instagram_per_day": 6.0
  }
}
```

### `/api/analytics/monthly`
**Query Parameters:**
- `month` (optional): Month in YYYY-MM format (default: current month)
- `employeeId` (optional): Filter by specific employee

**Response:**
```json
{
  "month": "2024-11",
  "data": [
    {
      "employee_id": 1,
      "employee_name": "John Doe",
      "youtube_uploads": 12,
      "instagram_uploads": 30,
      "total_uploads": 42,
      "required_youtube": 12,
      "required_instagram": 30,
      "insta_compliant": true,
      "youtube_compliant": true,
      "insta_extra": 0,
      "youtube_extra": 0
    }
  ],
  "summary": {
    "total_employees": 6,
    "total_youtube_uploads": 72,
    "total_instagram_uploads": 180,
    "compliant_employees": 5
  }
}
```

## Components

### `DailyAnalytics`
- Location: `components/analytics/daily-analytics.tsx`
- Features:
  - Daily upload trends (line chart)
  - Daily uploads breakdown (bar chart)
  - Team compliance (area charts)
  - Date range selector
  - Summary statistics

### `MonthlyAnalytics`
- Location: `components/analytics/monthly-analytics.tsx`
- Features:
  - Monthly uploads by employee (bar chart)
  - Uploaded vs Missed comparison (stacked bar charts)
  - Compliance status visualization
  - Month selector
  - Summary statistics

### `AnalyticsDashboard`
- Location: `components/analytics/analytics-dashboard.tsx`
- Features:
  - Tabbed interface for daily and monthly analytics
  - Unified analytics view

## Chart Types Used

1. **Line Charts**: Show trends over time
   - Daily upload trends
   - Platform comparison

2. **Bar Charts**: Show comparisons
   - Monthly uploads by employee
   - Daily uploads breakdown
   - Compliance status

3. **Stacked Bar Charts**: Show composition
   - Uploaded vs Missed (YouTube)
   - Uploaded vs Missed (Instagram)

4. **Area Charts**: Show team-wide compliance
   - Daily compliance tracking
   - Who uploaded vs who missed

## Where Analytics Appear

### 1. **Main Dashboard** (`/`)
- New "Analytics" tab
- Shows team-wide analytics
- Daily and monthly views

### 2. **Admin Dashboard** (`/admin`)
- New "Analytics" tab
- Comprehensive analytics for all employees
- Management view with all charts

### 3. **Employee Dashboard** (`/employee/[id]`)
- Analytics section in employee profile
- Personal analytics charts
- Daily and monthly views for individual employee

## Key Features

### Visibility
- ✅ **Everyone can see who uploaded**: Charts clearly show uploaded vs missed
- ✅ **Platform-specific views**: Separate charts for YouTube and Instagram
- ✅ **Daily patterns**: See daily upload patterns across the team
- ✅ **Monthly trends**: Track monthly performance and compliance

### Charts Show:
1. **Who uploaded YouTube videos** (green)
2. **Who missed YouTube videos** (red)
3. **Who uploaded Instagram posts** (green)
4. **Who missed Instagram posts** (red)
5. **Daily trends** over time
6. **Monthly comparisons** between employees
7. **Compliance status** for each employee

### Interactive Features
- Date range selection (7, 14, 30, 60, 90 days)
- Month selection (last 6 months)
- Hover tooltips with detailed information
- Responsive charts that adapt to screen size
- Color-coded indicators (green = uploaded, red = missed)

## Color Coding

- **Green (#22c55e)**: Uploaded/Compliant
- **Red (#ef4444)**: Missed/Non-compliant
- **Pink (#ec4899)**: Instagram
- **Red (#ef4444)**: YouTube
- **Blue (#3b82f6)**: Total/Combined

## Data Visualization

### Daily Analytics
- Shows upload activity day by day
- Tracks team compliance daily
- Identifies patterns and trends
- Highlights days with low compliance

### Monthly Analytics
- Shows total uploads per employee
- Compares employees side by side
- Highlights top performers
- Shows compliance gaps

## Benefits

1. **Transparency**: Everyone can see who is uploading and who isn't
2. **Accountability**: Visual representation encourages compliance
3. **Trend Analysis**: Identify patterns and improve performance
4. **Competition**: Leaderboards and comparisons motivate employees
5. **Data-Driven Decisions**: Make informed decisions based on analytics

## Technical Details

- **Chart Library**: Recharts 2.15.4
- **Chart Components**: Custom chart components from `components/ui/chart.tsx`
- **Responsive**: Charts adapt to different screen sizes
- **Performance**: Efficient data fetching and rendering
- **Real-time**: Data refreshes automatically

## Future Enhancements

- Export charts as images/PDF
- Custom date range picker
- More chart types (pie charts, heatmaps)
- Historical comparisons
- Email reports with charts
- Mobile-optimized views

