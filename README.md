# Dept-App Rebuild

This is a clean rebuild of the Horn Lake Fire/EMS hydrant testing app after the original GitHub repository became unavailable.

## Data Sources

- Recovered Render app hydrant API data from `hydrants.json`
- DeSoto County ArcGIS Fire Hydrants layer, filtered to `CITY = 'Horn Lake'`
- The rebuilt hydrant dataset contains 1,241 hydrants
- 1,236 hydrants matched the recovered app by coordinate proximity
- 5 records came from ArcGIS without a coordinate match to the recovered app data

## Features Included

- Hydrant dashboard with full-space map
- Hydrant icons colored by flow/status
- Out-of-service hydrants shown in black
- No hydrant preselected at startup
- Dashboard-level User, Shift, and Date fields
- Searchable Tested By/User field
- Inspection page with autofilled Hydrant ID
- Removed Weather Conditions, Accessible, Tag Attached/Readable, and Reflective Visible
- Flow test and inspection save endpoints
- Hydrant checked-this-year tracking
- Hydrant CSV export
- Daily activity CSV export
- Daily activity email endpoint with SendGrid environment variable support

## Run Locally

```bash
npm install
npm run build
npm start
```

Then open:

```text
http://localhost:3000/hydrant-testing
```

## Render Deployment

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Optional email variables:

```text
SENDGRID_API_KEY
DAILY_ACTIVITY_FROM_EMAIL
```
