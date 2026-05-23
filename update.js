const { Client } = require("@notionhq/client");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// ── CONFIG ──────────────────────────────────────────────────────
const NOTION_TOKEN        = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID  = process.env.NOTION_DATABASE_ID;
const GOOGLE_CREDENTIALS  = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const GOOGLE_TOKEN        = JSON.parse(process.env.GOOGLE_TOKEN);

// Stage = work | tout le reste = personal
const WORK_CALENDAR_ID = "ebb0e8efa5ab713dd1ee224033515e197f2e56ab1440f6ed97e7f62a9731b3d0@group.calendar.google.com";
const PERSONAL_CALENDAR_IDS = [
  "sine.amina@gmail.com",
  "1c63601ff5a84cc2d65b94b975f42d5c3991118d34d4fecf93d4f37ef20b63ba@group.calendar.google.com", // Sorties
  "28090cd827dedf9b585e4ee7abe9a514acd27b8f9feecded539f770556d15019@group.calendar.google.com", // Sport
  "ba3440cc418f8c694708f50e9c298651f0e4f54729d0ca03dd776314cac250e1@group.calendar.google.com"  // Évènements famille
];
// ────────────────────────────────────────────────────────────────

async function buildAuthClient() {
  const auth = new google.auth.OAuth2(
    GOOGLE_CREDENTIALS.installed.client_id,
    GOOGLE_CREDENTIALS.installed.client_secret
  );
  auth.setCredentials(GOOGLE_TOKEN);
  return auth;
}

async function fetchEvents(auth, calendarId, isWork) {
  const calendar = google.calendar({ version: "v3", auth });
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  try {
    const res = await calendar.events.list({
      calendarId,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return (res.data.items || []).map(ev => {
      const s = ev.start.dateTime || ev.start.date;
      const e = ev.end.dateTime   || ev.end.date;
      const startStr = s.includes("T")
        ? new Date(s).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "Toute la journée";
      const endStr = e && e.includes("T")
        ? new Date(e).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : null;
      return {
        title: ev.summary || "Sans titre",
        time:  endStr ? `${startStr}–${endStr}` : startStr,
        link:  ev.hangoutLink || null,
        isWork,
      };
    });
  } catch (err) {
    console.warn(`⚠️  Calendrier ${calendarId} inaccessible : ${err.message}`);
    return [];
  }
}

async function getAllEvents() {
  const auth = await buildAuthClient();
  const workEvents = await fetchEvents(auth, WORK_CALENDAR_ID, true);
  let perso = [];
  for (const id of PERSONAL_CALENDAR_IDS) {
    perso = perso.concat(await fetchEvents(auth, id, false));
  }
  return [...workEvents, ...perso].sort((a, b) => a.time.localeCompare(b.time));
}

function getDayNameFR() {
  return ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"][new Date().getDay()];
}

async function getNotionTodos() {
  const notion = new Client({ auth: NOTION_TOKEN });
  const today  = new Date().toISOString().split("T")[0];
  const todayFR = getDayNameFR();

  try {
    const res = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        and: [
          { property: "Fait ?", checkbox: { equals: false } },
          { or: [
            { property: "Deadline", date: { equals: today } },
            { property: "Day",      multi_select: { contains: todayFR } },
          ]},
        ],
      },
    });

    return res.results.map(page => {
      const name = page.properties.Name?.title?.[0]?.plain_text || "Tâche sans nom";
      const type = page.properties.Type?.select?.name || "Perso";
      const workTypes = ["Administratif", "Bourse", "Stage"];
      return { title: name, type, isWork: workTypes.includes(type) };
    });
  } catch (err) {
    console.warn(`⚠️  Notion inaccessible : ${err.message}`);
    return [];
  }
}

// ── HTML Builders ────────────────────────────────────────────────

function buildEventsHTML(events) {
  if (!events.length)
    return `<li><span class="event-icon event-personal">personal</span><span class="label">No event YAYY</span></li>`;
  return events.map(ev => {
    const cls  = ev.isWork ? "work" : "personal";
    const link = ev.link ? ` <a href="${ev.link}">link</a>` : "";
    return `<li><span class="event-icon event-${cls}">${cls}</span><span class="label">${ev.title}</span><span class="time">${ev.time}</span>${link}</li>`;
  }).join("\n          ");
}

function buildTodosHTML(todos) {
  if (!todos.length)
    return `<li class="todo"><span class="todo-icon todo-personal">personal</span><span class="label">Nothing to do YAYYY</span></li>`;
  return todos.map(t => {
    const cls = t.isWork ? "work" : "personal";
    return `<li class="todo"><span class="todo-icon todo-${cls}">${cls}</span><span class="label">${t.title}</span></li>`;
  }).join("\n          ");
}

// ── Main ─────────────────────────────────────────────────────────

async function run() {
  const [events, todos] = await Promise.all([getAllEvents(), getNotionTodos()]);
  const indexPath = path.join(__dirname, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");

  // Inject events
  html = html.replace(
    /(<ul class="events">)[\s\S]*?(<\/ul>)/,
    `$1\n          ${buildEventsHTML(events)}\n        $2`
  );
  // Inject todos
  html = html.replace(
    /(<ul class="todos">)[\s\S]*?(<\/ul>)/,
    `$1\n          ${buildTodosHTML(todos)}\n        $2`
  );

  fs.writeFileSync(indexPath, html, "utf8");
  console.log(`✅ index.html mis à jour — ${events.length} événement(s), ${todos.length} tâche(s)`);
}

run().catch(err => { console.error(err); process.exit(1); });
