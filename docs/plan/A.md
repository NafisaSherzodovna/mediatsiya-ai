# Role A — backend core (20 %)

You own Django: project config, accounts, cases, mediators, stats and the EC2 deploy. B builds the frontend and
the AI app against `contract/api.md` and fixtures, so you never wait for B and B never waits for you.

- Read `docs/plan/00-overview.md` (global constraints, ownership, pitch-docs rule) and `contract/api.md` first.
- Your serializers must produce exactly the fixture shapes in `contract/fixtures/`.

Order when time is short: A1 → A2 → A3 → A4 are P0; A5 is P1.

---

### A1: Django scaffold (P0, ~30 min)

**Files:**
- Create: `backend/manage.py`, `backend/config/{__init__,settings,urls,wsgi}.py`, `backend/requirements.txt`,
  `backend/.env.example`, `backend/{accounts,cases,mediators,stats}/` (`startapp`),
  `backend/ai/{__init__,apps,urls,views}.py` and `backend/demo/{__init__,apps,urls}.py` as **empty stubs for B**
  (`urlpatterns = []`).

**Interfaces — produces:**
- `INSTALLED_APPS` includes `rest_framework`, `rest_framework.authtoken`, `accounts`, `cases`, `mediators`,
  `stats`, `ai`, `demo`.
- `config/urls.py` routes:
  - `api/health` → `{ok, ai}`;
  - `api/auth/` → `accounts.urls`;
  - `api/` → `cases.urls` and `mediators.urls`;
  - `api/stats/` → `stats.urls`;
  - `api/ai/` → `ai.urls`;
  - `api/demo/` → `demo.urls`;
  - `admin/` → admin.
- Settings read env via python-dotenv (`backend/.env`): `DJANGO_SECRET_KEY`, `DEBUG` (default `0`),
  `GEMINI_API_KEYS`, `GEMINI_MODELS`, `DEMO_RESET_KEY`.
- Fixed settings: `ALLOWED_HOSTS=["*"]`,
  `CSRF_TRUSTED_ORIGINS=["https://*.netlify.app","http://localhost:3000"]`, SQLite at `backend/db.sqlite3`,
  `LANGUAGE_CODE="uz"`, `TIME_ZONE="Asia/Tashkent"`, whitenoise middleware, `STATIC_ROOT=backend/staticfiles`.
- DRF defaults: `TokenAuthentication`; `AllowAny` default permission (views tighten it); anon throttle
  `60/min`; scoped throttle `ai: 30/min`.
- `requirements.txt`, pinned: `Django>=5.2,<5.3`, `djangorestframework>=3.16`, `gunicorn`, `whitenoise`,
  `httpx`, `pydantic>=2.7`, `rank-bm25`, `python-dotenv`.

- [x] **Step 1:** Scaffold with the files above. `health` returns `ai = bool(settings.GEMINI_API_KEYS)`.
- [x] **Step 2:** Run `cd backend && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt && .venv/Scripts/python manage.py check`.
  Expected: `System check identified no issues`. Then `python manage.py runserver 8000` and
  `curl localhost:8000/api/health` → `{"ok": true, "ai": false}`.
- [x] **Step 3:** Pitch docs: add a `progress.md` line ("Backend skeleti ishga tushdi").
- [x] **Step 4:** Commit `feat(api): django scaffold with health endpoint`, then sync and push. **Push within
  30 min**, because B's AI app plugs into these stubs.
- Note: Netlify proxies only `/api/*` and `/admin/*`, so `STATIC_URL="/admin/static/"`; WhiteNoise serves it before URL routing (curl with gunicorn, DEBUG=0: admin CSS 200).

### A2: Models + admin as the "operator panel" (P0)

**Files:**
- Create: `backend/accounts/models.py` (`Profile`), `backend/cases/models.py` (`Case`, `CaseEvent`),
  `backend/mediators/models.py` (`Mediator`), each app's `admin.py`, migrations.
- Data migration `backend/accounts/migrations/0002_demo_users.py`.

**Interfaces — produces (field names = contract names):**
- `Profile`: `user` (1-1 to `auth.User`), `role` (choices `Role`), `full_name`, `phone`.
- `Mediator`:
  - `id` CharField pk (`m-01`…), `user` FK nullable, `name`, `photo`, `registry_no`;
  - `specialties` JSONField list, `languages` JSONField list;
  - `region` (choices), `price_uzs` int, `rating` float, `sessions` int, `years` int, `bio`;
  - `is_demo` bool.
- `Case`:
  - `id` UUID pk, `code` unique (`MD-<year>-<4-digit seq>`), `status` (choices `CaseStatus`,
    default `new`), `dispute_type`, `region`, `amount_uzs` nullable BigInteger, `description`;
  - `claimant` FK User;
  - `respondent_name`, `respondent_phone`, `invite_token` (uuid4 hex, unique);
  - JSONField nullable: `classification`, `comparison`, `claimant_position`, `respondent_position`,
    `brief`, `agreement`;
  - `invite_text`, `mediator` FK nullable, `session_at` nullable, `agreed_at` nullable;
  - `created_at`, `updated_at`.
- `CaseEvent`: `case` FK (related_name `events`), `kind`, `label`, `at` (auto now).
- Choices labels in Uzbek, copied from the enum table in `contract/api.md`, e.g.
  `("istemolchi", "Isteʼmolchi huquqi")`, `("qoshnichilik", "Qoʻshnichilik")`.
- Admin, with Uzbek `verbose_name`s, is the operator panel shown to judges:
  - `Case`: list = `code, status, dispute_type, region, amount_uzs, mediator, created_at`; filters =
    `status, dispute_type, region`; search = `code, respondent_name, description`; `CaseEvent` inline.
  - `Mediator`: list = `name, region, rating, sessions, price_uzs`.
- `0002_demo_users` creates the four demo users from `contract/api.md` with profiles. `admin` is a superuser.

- [x] **Step 1:** Models, admin and migrations. Run `python manage.py makemigrations && python manage.py migrate`.
- [x] **Step 2:** Verify: `python manage.py check` passes; open `/admin/`, log in as `admin / admin123`, and
  see the "Ishlar" and "Mediatorlar" lists.
- [x] **Step 3:** Pitch docs: `progress.md` line ("Operator paneli (Django admin): ishlar va mediatorlar").
- [x] **Step 4:** Commit `feat(api): case, mediator and profile models with admin`, then push.
- Note: `Case.created_at` and `CaseEvent.at` use `default=timezone.now`, not `auto_now_add`, because `auto_now_add` overwrites a passed value and `seed_demo` must backdate cases for `monthly`.

### A3: REST API per contract (P0)

**Files:**
- Create: `backend/accounts/{serializers,views,urls}.py`, `backend/cases/{serializers,views,urls}.py`,
  `backend/mediators/{serializers,views,urls}.py`, `backend/stats/{views,urls}.py`, `backend/cases/tests.py`.

**Interfaces — produces:** every "Core endpoint" row in `contract/api.md`, with these exact rules:
- `CaseSerializer`:
  - Nests `claimant {id,name,phone}` (name from `Profile.full_name`), `respondent {name,phone}`, full
    `mediator` and `events [{kind,label,at}]`.
  - Writable JSON fields are exactly the PATCH list.
  - `code` comes from `Case.objects.count()+1` padded to 4 digits.
- Visibility in `GET /api/cases/`: claimant → own; mediator → `mediator.user == request.user`;
  ministry or admin → all; newest first, `[:50]`.
- Status changes add a `CaseEvent` with these labels:
  - `created` "Murojaat yaratildi"
  - `invited` "Ikkinchi tomonga taklif yuborildi"
  - `accepted` "Ikkinchi tomon rozi boʻldi"
  - `declined` "Ikkinchi tomon rad etdi"
  - `scheduled` "Mediator bilan sessiya belgilandi"
  - `agreed` "Kelishuvga erishildi"
  - `closed` "Ish yopildi"
- `GET /api/stats/` computes from the database:
  - `avg_days` = mean of (`agreed_at − created_at`) over agreed cases;
  - `refunded_fees_uzs` = sum over agreed cases of `comparison.court.items[label startswith "Davlat boji"].uzs` (0 if missing);
  - `monthly` = last 11 months by `created_at`.
  - Ministry and admin only, otherwise 403.

- [ ] **Step 1:** Write `backend/cases/tests.py` with exactly **one** test, `test_invite_flow`:
  - create a case with `invite_text`;
  - `GET /api/invite/<token>/` is 200 without auth and contains `claimant_name`;
  - `POST .../respond/ {"accept": true, "position": null}` returns `{"status": "accepted"}`;
  - `GET /api/invite/nope/` returns 404.

  This is the respondent's phone flow, the riskiest part. Check everything else by hand with `curl`.
- [ ] **Step 2:** Implement serializers, views and urls until `python manage.py test cases` passes.
- [ ] **Step 3:** Contract check: `curl` the login, cases, mediators and stats endpoints and compare the key sets
  with `contract/fixtures/*.json` by eye.
- [ ] **Step 4:** Pitch docs: `progress.md` line ("REST API kontrakt boʻyicha tayyor").
- [ ] **Step 5:** Commit `feat(api): auth, cases, invite, mediators, stats endpoints`, then push.

### A4: EC2 deploy (P0)

**Files:**
- Create: `deploy/setup.sh` (one-time server setup), `deploy/deploy.sh` (pull + migrate + collectstatic +
  restart), `deploy/mediatsiya.service` (systemd unit for gunicorn), `deploy/README.md`.

**Interfaces — produces:**
- The backend at `http://<ELASTIC_IP>:8000`. Post the IP to B in issue `[for-B] backend URL` with a body like
  `BACKEND=http://1.2.3.4:8000`.

- [ ] **Step 1:** In AWS (Abdulloh's account), region **eu-central-1 (Frankfurt)**:
  - launch Ubuntu 24.04, `t3.small`, 20 GB gp3;
  - security group: 22 from your IP only, 8000 from `0.0.0.0/0`;
  - attach an Elastic IP;
  - set a billing budget alert at $20.
- [ ] **Step 2:** `deploy/setup.sh` installs `python3.12-venv git ffmpeg`, clones the repo to `/srv/mediatsiya`,
  creates `.venv`, installs requirements and writes `/etc/mediatsiya.env` from prompts (never from git).
  Gemini keys come from the team privately.
- [ ] **Step 3:** The systemd unit runs
  `gunicorn config.wsgi -b 0.0.0.0:8000 -w 3 --threads 4 --timeout 30` in `/srv/mediatsiya/backend` with
  `EnvironmentFile=/etc/mediatsiya.env`. `deploy.sh` runs `git pull`, `pip install -r`, `migrate`,
  `collectstatic --noinput` and `systemctl restart mediatsiya`.
- [ ] **Step 4:** Verify from your laptop: `curl http://<IP>:8000/api/health` → `{"ok": true, "ai": true}`.
- [ ] **Step 5:** Open the issue for B. Pitch docs: `progress.md` line ("Backend AWS'da (Frankfurt) ishlayapti").
- [ ] **Step 6:** Commit `feat(deploy): ec2 setup, systemd unit and deploy script`, then push.

### A5: Hardening that the demo touches (P1)

- [ ] **Step 1:** In `POST /api/cases/` reject `description` shorter than 20 chars with
  400 `{detail:"Nizoni batafsilroq yozing"}`; reject an unknown `dispute_type` or `region` with 400.
- [ ] **Step 2:** Apply `ScopedRateThrottle` with scope `ai` to the AI views by default
  (B's views set `throttle_scope = "ai"`; you only configure it).
- [ ] **Step 3:** Run `deploy.sh` on EC2 after every push that touches `backend/` (B pings you in issues).
- [ ] **Step 4:** Pitch docs: `progress.md` line. Commit `fix(api): input validation and ai throttle`, then push.

**When you are done or blocked:** handle `[for-A]` issues first, then help B on request (the user decides).
Never edit B's paths without the user asking.
