import type { Metadata } from "next";
import PuntoPngScene from "@/components/puntopng/PuntoPngScene";

export const metadata: Metadata = {
  title: "puntopng — Ponle punto y inicio",
  description: "Ponle punto y inicio.",
};

export default function PuntoPngPage() {
  return <PuntoPngScene />;
}
