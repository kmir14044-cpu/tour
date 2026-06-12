# Google Sheets Setup

This portal is now ready to use Google Sheets as its live records database.

## 1. Create the Sheet

1. Open Google Sheets and create a new spreadsheet.
2. Name it `Tours De Pakistan Portal`.
3. Go to `Extensions > Apps Script`.

## 2. Add the backend script

1. Delete the starter Apps Script code.
2. Paste everything from `google-apps-script.gs`.
3. Optional: set `CONFIG.TOKEN` to a private text value.
4. Click Save.

The script creates these tabs automatically when first used:

- `Leads`
- `Booked`
- `Cancelled`
- `Bookings`
- `Destinations`
- `Tours`
- `Hotels`
- `Hotel Categories`
- `Transport`
- `Activities`
- `Itineraries`

## 3. Deploy as a Web App

1. Click `Deploy > New deployment`.
2. Select type: `Web app`.
3. Execute as: `Me`.
4. Who has access: `Anyone`.
5. Click Deploy and authorize access.
6. Copy the Web App URL. It should start with `https://script.google.com/macros/s/`.

## 4. Connect the portal

1. Open `login.html`.
2. Login with `admin / tdp12345`.
3. Open `Settings`.
4. Paste the Web App URL into `Google Apps Script Web App URL`.
5. If you set a token in Apps Script, paste the same token into `Sync token optional`.
6. Click `Save Settings`.
7. Click `Sync Now`.

## How records move

- Traveler form submissions save as verified leads in the `Leads` tab.
- In Admin > Leads, changing status to `Booked` moves the lead to the `Booked` tab and creates a matching booking row.
- Changing status to `Cancelled` moves the lead to the `Cancelled` tab.
- Other statuses remain in `Leads`.
- Admin `Sync Now` pulls verified Sheet records back into the portal.

Keep the Web App URL in Admin settings after deployment. Without it, the portal uses browser localStorage only.
