import { VehicleStatus } from "@/app/types/vehicle-status";

interface VehicleNotificationData {
  vehicleNumber: string;
  status: VehicleStatus;
  transporter?: string;
  driverName?: string;
  driverMobile?: string;
  location?: string;
}

const statusMessages: Record<string, string> = {
  WAITING_FOR_DETAILS: "⏳ Waiting for vehicle details",
  ENTRY_DONE: "🚪 Vehicle entry completed",
  LOADING_STARTED: "🔄 Loading started",
  LOADING_DONE: "📦 Loading completed",
  LOADING_SLIP_SENT: "📄 Loading slip sent",
  ETP_DONE: "✅ ETP completed",
  ETP_INVOICE_DONE: "🧾 ETP & Invoice completed",
  DISPATCH_DONE: "🚚 Vehicle dispatched",
};

export async function sendGoogleChatVehicleUpdate({
  vehicleNumber,
  status,
  transporter,
  driverName,
  driverMobile,
  location,
}: VehicleNotificationData) {
  const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("Google Chat webhook URL is not configured");
  }

  const statusMessage = statusMessages[status] || `📌 ${status}`;

  const message = [
    "🚚 *Vehicle Status Update*",
    "",
    `🚛 *Vehicle No:* ${vehicleNumber}`,
    `📌 *Status:* ${statusMessage}`,
    transporter ? `🏢 *Transporter:* ${transporter}` : "",
    driverName ? `👤 *Driver:* ${driverName}` : "",
    driverMobile ? `📱 *Driver Contact:* ${driverMobile}` : "",
    location ? `📍 *Destination:* ${location}` : "",
    "",
    `🕐 *Time:* ${new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: message,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Chat error: ${error}`);
  }

  return true;
}
