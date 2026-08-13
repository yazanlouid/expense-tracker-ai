# How to export expenses to CSV or PDF

*Last updated: 2026-08-13*

Download your expenses as a CSV or PDF file, ready to open in a spreadsheet app, send to your
accountant, or keep as a backup.

## Before you start

You need at least one expense logged — the **Export Center** button is disabled until then.

## Steps

1. Click **Export Center** in the top-right of the dashboard header.

   ![Screenshot: dashboard header with the Export Center button highlighted](./assets/export-center-csv-pdf-download/step-1.png)

2. Open the **Templates** tab and pick the report that fits what you need — *Tax Report* (this
   year, ready for your accountant), *Monthly Summary* (this month only), *Category Analysis*
   (everything grouped by category with subtotals), or *Full Export* (everything, no grouping).
   Each card shows a live record count and total so you know what you'll get before downloading.

   ![Screenshot: Templates tab showing the four template cards with preview counts](./assets/export-center-csv-pdf-download/step-2.png)

3. Click **Use this template →** on the one you want. This takes you to the **Destinations** tab
   with that template already selected.

   ![Screenshot: Destinations tab with the Download card and format toggle visible](./assets/export-center-csv-pdf-download/step-3.png)

4. In the **Download** card, choose **CSV** or **PDF**, then click **Download CSV** /
   **Download PDF**. The file saves to your browser's default downloads location.

   ![Screenshot: Download card mid-download showing the "Preparing…" state](./assets/export-center-csv-pdf-download/step-4.png)

Every export you run also shows up in the **History** tab, where you can trigger a repeat
download of the same data later.

## Tips

- The exported file always covers **all** of your expenses for the chosen template — any search,
  category, or date filter you've applied on the main dashboard is ignored during export.
- Tax Report and Monthly Summary use your device's current date to decide what "this year" and
  "this month" mean, so results can shift if your computer's clock is off.
- "Download again" from the History tab always regenerates a **CSV**, even if you originally
  downloaded a PDF.
- Everything happens locally in your browser — no data leaves your device for a CSV/PDF download.

## Related guides

None yet — this is the first user guide in this project.

---
For implementation details, see the [developer doc](../dev/export-center-csv-pdf-download-implementation.md).
