import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">That record is not here</h1>
      <Link href="/deal-tracker" className="mt-4 inline-block text-blue-600">
        Back to Deal Tracker
      </Link>
    </div>
  );
}
