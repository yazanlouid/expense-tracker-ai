import QRCode from "qrcode";

export async function generateQRDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 220,
    margin: 1,
    color: { dark: "#1e1b4b", light: "#ffffff" },
  });
}
