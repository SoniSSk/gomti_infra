import Link from "next/link";
import Header from "./common/Header";
import Footer from "./common/Footer";
import StatCard from "./common/StatCard";
import Logo from "./common/Logo";

const FEATURES = [
  {
    title: "Vehicle Dispatch",
    description:
      "Track every vehicle from loading to delivery with real-time dispatch status.",
  },
  {
    title: "Weighbridge Records",
    description:
      "Digitize weighbridge slips and keep a searchable history of every weighment.",
  },
  {
    title: "Attendance Tracking",
    description:
      "Monitor site attendance and workforce activity from a single dashboard.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="orange-gradient px-4 py-12 text-center text-white sm:py-16 lg:py-20">
        <div className="mx-auto mb-6 inline-block rounded-2xl bg-white px-6 py-4 shadow-lg">
          <Logo height={72} className="max-w-full sm:hidden" />
          <Logo height={96} className="hidden max-w-full sm:block" />
        </div>
        <h2 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">
          Gomti Infra And Mining
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-orange-50 sm:text-lg">
          Managing mining dispatch, weighbridge, and fleet operations with one
          reliable platform.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-orange-600 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          Login to Dashboard
        </Link>
      </section>

      {/* Stats */}
      <section className="container mx-auto grid grid-cols-2 gap-3 px-4 py-8 sm:gap-4 sm:py-12 md:grid-cols-4">
        <StatCard title="Vehicles" value={128} />
        <StatCard title="Dispatches Today" value={42} />
        <StatCard title="Active Sites" value={6} />
        <StatCard title="Years of Service" value={12} />
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-8 sm:py-12">
        <h3 className="text-center text-2xl font-bold text-gray-900">
          What we manage
        </h3>

        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
            >
              <h4 className="text-lg font-semibold text-orange-600">
                {feature.title}
              </h4>
              <p className="mt-2 text-sm text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
