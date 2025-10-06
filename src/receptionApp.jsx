import React, { useEffect, useState } from "react";

// Renseigne l'URL de l'API si le backend tourne (ex: "http://localhost:4000")
const API_URL = "http://localhost:4000/api";

function useStore(key, initial) {
  const [data, setData] = useState(() => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : initial;
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(data)), [key, data]);
  return [data, setData];
}

// Fonctions API
async function apiGet(path) {
  if (!API_URL) return null;
  const r = await fetch(`${API_URL}${path}`);
  return (await r.json()).data;
}
async function apiPost(path, body) {
  if (!API_URL) return null;
  const r = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await r.json()).data;
}
async function apiPatch(path, body) {
  if (!API_URL) return null;
  const r = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  return (await r.json()).data;
}
async function apiDelete(path) {
  if (!API_URL) return null;
  const r = await fetch(`${API_URL}${path}`, { method: "DELETE" });
  return (await r.json()).data;
}

// Composants utilitaires
const Card = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow p-4">
    <h2 className="text-lg font-semibold mb-2">{title}</h2>
    <div className="text-sm text-gray-700 space-y-2">{children}</div>
  </div>
);

const Tabs = ({ tabs, current, onChange }) => (
  <div className="flex flex-wrap items-center gap-2 mb-4">
    {tabs.map((t) => (
      <button
        key={t}
        onClick={() => onChange(t)}
        className={`px-3 py-2 rounded-xl border ${
          current === t
            ? "bg-black text-white"
            : "bg-white hover:bg-gray-100"
        }`}
      >
        {t}
      </button>
    ))}
  </div>
);

export default function ReceptionApp() {
  const [tab, setTab] = useState("Dashboard");
  const [visitors, setVisitors] = useStore("visitors", []);
  const [appointments, setAppts] = useStore("appointments", []);
  const [calls, setCalls] = useStore("calls", []);
  const [mail, setMail] = useStore("mail", []);
  const [tasks, setTasks] = useStore("tasks", []);

  // Charger depuis API si dispo
  useEffect(() => {
    (async () => {
      if (!API_URL) return; // si pas de backend → on reste en localStorage
      const [v, a, c, m, t] = await Promise.all([
        apiGet("/visitors"),
        apiGet("/appointments"),
        apiGet("/calls"),
        apiGet("/mail"),
        apiGet("/tasks"),
      ]);
      if (v) setVisitors(v);
      if (a) setAppts(a);
      if (c) setCalls(c);
      if (m) setMail(m);
      if (t) setTasks(t);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">📋 Application Réception</h1>

      {/* Onglets */}
      <Tabs
        tabs={["Dashboard", "Visiteurs", "Rendez-vous", "Appels", "Courrier", "Tâches"]}
        current={tab}
        onChange={setTab}
      />

      {tab === "Dashboard" && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card title="Visiteurs">{visitors.length} visiteurs enregistrés</Card>
          <Card title="Rendez-vous">{appointments.length} rdv prévus</Card>
          <Card title="Appels">{calls.length} appels reçus</Card>
          <Card title="Courrier">{mail.length} courriers</Card>
          <Card title="Tâches">{tasks.length} tâches</Card>
        </div>
      )}

{tab === "Visiteurs" && (
  <Card title="Visiteurs">
    {/* Formulaire d’ajout */}
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target;
        const visitorData = {
          full_name: form.full_name.value,
          company: form.company.value,
          purpose: form.purpose.value,
          host_department: form.host_department.value,
          departure_time: form.departure_time.value,
        };

        const newVisitor = await apiPost("/visitors", visitorData);
        if (newVisitor) setVisitors([...visitors, newVisitor]);
        form.reset();
      }}
      className="grid grid-cols-2 gap-2 mb-4"
    >
      <input name="full_name" placeholder="Nom complet" className="border rounded px-2 py-1" />
      <input name="company" placeholder="Entreprise" className="border rounded px-2 py-1" />
      <input name="purpose" placeholder="Motif" className="border rounded px-2 py-1" />
      <input name="host_department" placeholder="Département hôte" className="border rounded px-2 py-1" />
      <input type="datetime-local" name="departure_time" className="border rounded px-2 py-1" />
      <button className="col-span-2 bg-black text-white px-3 py-1 rounded">
        Ajouter
      </button>
    </form>

    {/* Liste des visiteurs */}
    <ul className="space-y-2">
      {visitors.map((v) => (
        <li key={v.id} className="flex justify-between items-center border-b py-1">
          <div>
            <b>{v.full_name}</b> ({v.company})  
            <div className="text-sm text-gray-600">
              Motif : {v.purpose} | Département : {v.host_department} | Départ : {v.departure_time}
            </div>
          </div>
          <button
            onClick={async () => {
              await apiDelete(`/visitors/${v.id}`);
              setVisitors(visitors.filter((x) => x.id !== v.id));
            }}
            className="text-red-500 hover:underline"
          >
            Supprimer
          </button>
        </li>
      ))}
    </ul>
  </Card>
)}
{tab === "Rendez-vous" && (
  <Card title="Rendez-vous">
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target;
        const appt = {
          title: form.title.value,
          with_person: form.with_person.value,
          location: form.location.value,
          start_time: form.start_time.value,
          end_time: form.end_time.value,
          notes: form.notes.value,
        };

        const newAppt = await apiPost("/appointments", appt);
        if (newAppt) setAppts([...appointments, newAppt]);
        form.reset();
      }}
      className="grid grid-cols-2 gap-2 mb-4"
    >
      <input name="title" placeholder="Titre" className="border rounded px-2 py-1" />
      <input name="with_person" placeholder="Avec" className="border rounded px-2 py-1" />
      <input name="location" placeholder="Lieu" className="border rounded px-2 py-1" />
      <input type="datetime-local" name="start_time" className="border rounded px-2 py-1" />
      <input type="datetime-local" name="end_time" className="border rounded px-2 py-1" />
      <input name="notes" placeholder="Notes" className="border rounded px-2 py-1 col-span-2" />
      <button className="col-span-2 bg-black text-white px-3 py-1 rounded">Ajouter</button>
    </form>

    <ul className="space-y-2">
      {appointments.map((a) => (
        <li key={a.id} className="flex justify-between items-center border-b py-1">
          <div>
            <b>{a.title}</b> avec {a.with_person} ({a.location})  
            <div className="text-sm text-gray-600">
              {a.start_time} → {a.end_time} | Notes : {a.notes}
            </div>
          </div>
          <button
            onClick={async () => {
              await apiDelete(`/appointments/${a.id}`);
              setAppts(appointments.filter((x) => x.id !== a.id));
            }}
            className="text-red-500 hover:underline"
          >
            Supprimer
          </button>
        </li>
      ))}
    </ul>
  </Card>
)}
{tab === "Appels" && (
  <Card title="Appels">
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target;
        const call = {
          caller_name: form.caller_name.value,
          phone: form.phone.value,
          message: form.message.value,
          received_at: form.received_at.value,
          transferred_to: form.transferred_to.value,
        };

        const newCall = await apiPost("/calls", call);
        if (newCall) setCalls([...calls, newCall]);
        form.reset();
      }}
      className="grid grid-cols-2 gap-2 mb-4"
    >
      <input name="caller_name" placeholder="Nom de l'appelant" className="border rounded px-2 py-1" />
      <input name="phone" placeholder="Téléphone" className="border rounded px-2 py-1" />
      <input name="message" placeholder="Message" className="border rounded px-2 py-1 col-span-2" />
      <input type="datetime-local" name="received_at" className="border rounded px-2 py-1" />
      <input name="transferred_to" placeholder="Transféré à" className="border rounded px-2 py-1" />
      <button className="col-span-2 bg-black text-white px-3 py-1 rounded">Ajouter</button>
    </form>

    <ul className="space-y-2">
      {calls.map((c) => (
        <li key={c.id} className="flex justify-between items-center border-b py-1">
          <div>
            <b>{c.caller_name}</b> ({c.phone})  
            <div className="text-sm text-gray-600">
              Message : {c.message} | Reçu : {c.received_at} | Transféré à : {c.transferred_to}
            </div>
          </div>
          <button
            onClick={async () => {
              await apiDelete(`/calls/${c.id}`);
              setCalls(calls.filter((x) => x.id !== c.id));
            }}
            className="text-red-500 hover:underline"
          >
            Supprimer
          </button>
        </li>
      ))}
    </ul>
  </Card>
)}
{tab === "Courrier" && (
  <Card title="Courrier">
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target;
        const mail = {
          type: form.type.value,
          sender: form.sender.value,
          recipient: form.recipient.value,
          received_at: form.received_at.value,
          status: form.status.value,
        };

        const newMail = await apiPost("/mail", mail);
        if (newMail) setMail([...mail, newMail]);
        form.reset();
      }}
      className="grid grid-cols-2 gap-2 mb-4"
    >
      <input name="type" placeholder="Type (Lettre/Colis...)" className="border rounded px-2 py-1" />
      <input name="sender" placeholder="Expéditeur" className="border rounded px-2 py-1" />
      <input name="recipient" placeholder="Destinataire" className="border rounded px-2 py-1" />
      <input type="datetime-local" name="received_at" className="border rounded px-2 py-1" />
      <input name="status" placeholder="Statut" className="border rounded px-2 py-1" />
      <button className="col-span-2 bg-black text-white px-3 py-1 rounded">Ajouter</button>
    </form>

    <ul className="space-y-2">
      {mail.map((m) => (
        <li key={m.id} className="flex justify-between items-center border-b py-1">
          <div>
            <b>{m.type}</b> — {m.sender} → {m.recipient}  
            <div className="text-sm text-gray-600">
              Reçu : {m.received_at} | Statut : {m.status}
            </div>
          </div>
          <button
            onClick={async () => {
              await apiDelete(`/mail/${m.id}`);
              setMail(mail.filter((x) => x.id !== m.id));
            }}
            className="text-red-500 hover:underline"
          >
            Supprimer
          </button>
        </li>
      ))}
    </ul>
  </Card>
)}
{tab === "Tâches" && (
  <Card title="Tâches">
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target;
        const task = {
          title: form.title.value,
          due_date: form.due_date.value,
          done: false,
        };

        const newTask = await apiPost("/tasks", task);
        if (newTask) setTasks([...tasks, newTask]);
        form.reset();
      }}
      className="grid grid-cols-2 gap-2 mb-4"
    >
      <input name="title" placeholder="Titre de la tâche" className="border rounded px-2 py-1 col-span-2" />
      <input type="date" name="due_date" className="border rounded px-2 py-1" />
      <button className="col-span-2 bg-black text-white px-3 py-1 rounded">Ajouter</button>
    </form>

    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="flex justify-between items-center border-b py-1">
          <div>
            <b>{t.title}</b> — échéance : {t.due_date}  
            <div className="text-sm text-gray-600">
              Statut : {t.done ? "✔️ Terminé" : "⏳ En cours"}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await apiPatch(`/tasks/${t.id}`, { done: !t.done });
                setTasks(tasks.map((x) => x.id === t.id ? { ...x, done: !x.done } : x));
              }}
              className="text-blue-500 hover:underline"
            >
              {t.done ? "Marquer en cours" : "Marquer terminé"}
            </button>
            <button
              onClick={async () => {
                await apiDelete(`/tasks/${t.id}`);
                setTasks(tasks.filter((x) => x.id !== t.id));
              }}
              className="text-red-500 hover:underline"
            >
              Supprimer
            </button>
          </div>
        </li>
      ))}
    </ul>
  </Card>
)}
    </div>
  );
}
