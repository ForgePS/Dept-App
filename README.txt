Dept-App Render live-site recovery

Recovered from: https://dept-app-k85k.onrender.com
Date: 2026-05-24

What is included:
- index.html: live app shell from Render
- index-BM19ecBW.js: compiled/minified frontend JavaScript bundle
- index-bgVZvQOB.css: compiled stylesheet
- hydrants.json: live hydrant API data from /api/hydrants
- api-hydrants-export.csv: live hydrant CSV export from /api/hydrants/export
- tests.json: live /api/tests response
- inspections.json: live /api/inspections response

Important notes:
- This is not the clean original GitHub source repository.
- It is enough to preserve the deployed frontend and hydrant data.
- The JavaScript bundle can be reverse-engineered/reformatted, but component filenames and original source structure are not preserved unless source maps are later found.
- The daily activity CSV endpoint did not appear to be live; its response looked like the frontend app shell.
