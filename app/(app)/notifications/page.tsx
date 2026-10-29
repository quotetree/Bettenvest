import { store } from "@/lib/store";

export default async function NotificationsPage() {
  const events = await store.listEvents();
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <p className="mt-3 text-slate-600">
        This section is coming later, once the rest of the site is in use. Offers, sent emails, link views, pipeline moves, and uploads are already being recorded.
      </p>
      <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
        {events.length} event{events.length === 1 ? "" : "s"} recorded
      </p>
    </div>
  );
}
