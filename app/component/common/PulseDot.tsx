type PulseDotProps = {
  tone?: "green" | "amber";
};

const TONES = {
  green: "bg-green-500",
  amber: "bg-amber-500",
};

export default function PulseDot({
  tone = "green",
}: PulseDotProps) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${TONES[tone]}`}
      />
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${TONES[tone]}`}
      />
    </span>
  );
}
