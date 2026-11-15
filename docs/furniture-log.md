# Furniture Match log

Live searches are written to the Google Sheet **Furniture Match Log**. Demo searches are not. If the two Worker secrets below are empty, the page skips logging and the search still works.

The phone sends the log after the results are on screen. The Worker forwards that message in the background. It does not encode the photo.

## Set it up

1. Open the spreadsheet [Furniture Match Log](https://docs.google.com/spreadsheets/d/1gxZHgUSTWWOcO8orEFqtCMGA-P0BDoi0Df1qyNOFdGY/edit).
2. Choose **Extensions**, then **Apps Script**.
3. Select all of the code in `Code.gs` and delete it. Paste in the contents of `tools/apps-script/Code.gs` from this repo. Save.
4. Choose the gear **Project Settings**. Under **Script properties**, add a property named `LOG_WEBHOOK_SECRET`. Set the value to a password you make up. Save.
5. Choose **Deploy**, then **New deployment**. Click the gear next to **Select type** and choose **Web app**.
6. Set **Execute as** to **Me**. Set **Who has access** to **Anyone**. Click **Deploy**.
7. Click **Authorize access**, pick the `camkuey93@gmail.com` account, and allow the script to use Sheets and Drive.
8. Copy the **Web app URL**. It ends in `/exec`.
9. In the Cloudflare dashboard, open the **cameronkuey-site** Worker, then **Settings**, then **Variables and secrets**. Add two secrets (type **Secret**, not Text):
   - `LOG_WEBHOOK_URL` — the Web app URL from step 8
   - `LOG_WEBHOOK_SECRET` — the same password as step 4

After the next deploy, a live search adds a row and puts the photo in the **photos** folder. On the results screen, **Found it**, **Close**, and **Wrong** fill in **Accurate? (Cam)**. **This one** on a card fills in **Which result was right**.
