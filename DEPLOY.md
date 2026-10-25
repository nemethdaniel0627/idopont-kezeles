# Deploying to Google Cloud Run with a Supabase database

The whole app runs as one Cloud Run service: the Express server serves the built React app and the API.
The data is in a Supabase PostgreSQL database. Both have free tiers; Google Cloud still needs a billing
account (a card) on the project.

You need:
- a Google account and a Google Cloud project with billing turned on;
- a Supabase account;
- on this computer: Node.js (already here) and the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
  (`gcloud`). Docker is not needed: Google builds the container.

The commands below are for PowerShell. Replace everything in `<angle brackets>`.

## 1. Supabase: the database

1. Create a new project in a European region, and write down the database password you set. Then pick the
   Cloud Run region next to it; the commands below call it `<region>`:

   | Supabase region | Cloud Run region |
   |---|---|
   | West EU (Ireland), `eu-west-1` | `europe-west1` (Belgium) |
   | Central EU (Frankfurt), `eu-central-1` | `europe-west3` (Frankfurt) |
   | West EU (London), `eu-west-2` | `europe-west2` (London) |
2. Open **Connect** (top of the project page) and choose **Session pooler**. It works over IPv4, which Cloud Run
   needs; the direct connection is IPv6 only. Note these parts of its connection string:
   - host: `aws-0-<supabase region>.pooler.supabase.com` (its name shows the region);
   - port: `5432`;
   - user: `postgres.<project-ref>`;
   - database: `postgres`.
3. In **Project Settings → Database → SSL Configuration**, download the certificate (`prod-ca-2021.crt`).
   The app checks the database's identity with it.
4. Create the tables. This runs from this computer, in `app\server`. It refuses to run if the tables already
   exist, and it adds no sample data.

   ```powershell
   cd C:\Users\dnemeth\idopont-kezeles\app\server
   $env:PGHOST = "<pooler host>"; $env:PGPORT = "5432"; $env:PGDATABASE = "postgres"
   $env:PGUSER = "postgres.<project-ref>"; $env:PGPASSWORD = "<database password>"
   $env:PGSSLCA = Get-Content -Raw "<path to>\prod-ca-2021.crt"
   npm run setup-db
   ```

   Keep this PowerShell window open: step 4 uses the same settings. (They override `server\.env` only in this
   window.)

## 2. Google Cloud: one-time setup

```powershell
gcloud init
gcloud config set project <project-id>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

Store the database password and the certificate as secrets, so they are not in the service's visible settings:
- **Password:** in the Cloud Console go to **Security → Secret Manager → Create secret**. Name it
  `idopont-db-password` and paste the password as its value.
- **Certificate:**

  ```powershell
  gcloud secrets create idopont-db-ca --data-file="<path to>\prod-ca-2021.crt"
  ```

Let the service read the secrets. It runs as the project's default compute account:

```powershell
gcloud projects describe <project-id> --format="value(projectNumber)"
gcloud projects add-iam-policy-binding <project-id> --member="serviceAccount:<project-number>-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

## 3. Deploy

From the `app` folder (where the `Dockerfile` is):

```powershell
cd C:\Users\dnemeth\idopont-kezeles\app
gcloud run deploy idopont --source . --region <region> --allow-unauthenticated --max-instances 2 --set-env-vars "PGHOST=<pooler host>,PGPORT=5432,PGDATABASE=postgres,PGUSER=postgres.<project-ref>,PGPOOL_MAX=5,MAIL_TRANSPORT=console" --set-secrets "PGPASSWORD=idopont-db-password:latest,PGSSLCA=idopont-db-ca:latest"
```

- The first run asks to create an Artifact Registry repository for the images: answer yes.
- The build takes a few minutes. At the end it prints the service URL, e.g.
  `https://idopont-abc123-ew.a.run.app`.
- `--max-instances 2` limits the cost and the number of database connections (2 × 5).

Then set the address used in emailed links (password reset):

```powershell
gcloud run services update idopont --region <region> --update-env-vars "APP_URL=<service URL>"
```

If the build fails with a permission error, give the build its role, then deploy again:

```powershell
gcloud projects add-iam-policy-binding <project-id> --member="serviceAccount:<project-number>-compute@developer.gserviceaccount.com" --role="roles/run.builder"
```

## 4. The first admin

1. Open the service URL and register.
2. In the PowerShell window from step 1.4 (with the `PG*` settings):

   ```powershell
   npm run make-admin -- <your email>
   ```

3. Reload the app: the Admin menu appears. Add the resources, and give the users their rights on the
   Felhasználók page.

## Later

- **New version:** from the `app` folder, run
  `gcloud run deploy idopont --source . --region <region>`. The settings and secrets stay.
- **Database changes** (when a version needs one, like `server/scripts/add-permissions.sql`): run the SQL in
  Supabase's **SQL Editor**.
- **Logs:** Cloud Console → Cloud Run → idopont → Logs, or
  `gcloud run services logs read idopont --region <region>`.
- **Emails:** with `MAIL_TRANSPORT=console` they are not sent, only written to the logs (e.g. password reset
  links). A real email provider still needs to be chosen and added to `server/mailer.js`.
- **Costs:** set a budget alert in **Billing → Budgets & alerts**. The service scales to zero when unused; the
  first request after a quiet period takes a few seconds.
- **Supabase free plan:** a project with no activity for about a week is paused, and is resumed in the
  Supabase dashboard. Export the data now and then (the free plan has no restorable backups).

## When something is wrong

| Message in the logs | Cause |
|---|---|
| `self-signed certificate in certificate chain` | `PGSSLCA` is missing or is not the downloaded certificate. |
| `ENETUNREACH` / `ENOTFOUND` | The direct database host was used instead of the Session pooler host. |
| `Tenant or user not found` | The user must be `postgres.<project-ref>`, not just `postgres`. |
| `password authentication failed` | The `idopont-db-password` secret does not match the Supabase password. |
| Login works but you are logged out at once | The app was opened over `http://`; use the `https://` URL. |
