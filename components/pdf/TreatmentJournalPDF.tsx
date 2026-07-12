"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export interface JournalRad {
  datum: string; // yyyy-mm-dd
  samhalle: string;
  atgard: string;
  preparat?: string;
  batchnummer?: string;
  karensDagar?: number;
  anteckning?: string;
}

interface TreatmentJournalPDFProps {
  bigardNamn: string;
  ar: number;
  rader: JournalRad[];
  biodlare?: string | null;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 30,
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#d97706",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#78350f",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: "#92400e",
  },
  meta: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fffbeb",
    borderBottomWidth: 1,
    borderBottomColor: "#d97706",
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontWeight: "bold",
    color: "#78350f",
  },
  rad: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e7e5e4",
    paddingVertical: 5,
    paddingHorizontal: 4,
    color: "#1f2937",
  },
  kolDatum: { width: "12%" },
  kolSamhalle: { width: "18%" },
  kolAtgard: { width: "20%" },
  kolPreparat: { width: "16%" },
  kolBatch: { width: "13%" },
  kolKarens: { width: "8%" },
  kolAnteckning: { width: "13%" },
  tomt: {
    marginTop: 20,
    fontSize: 10,
    color: "#6b7280",
  },
  fot: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default function TreatmentJournalPDF({
  bigardNamn,
  ar,
  rader,
  biodlare,
}: TreatmentJournalPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Behandlingsjournal {ar}</Text>
          <Text style={styles.subtitle}>Bigård: {bigardNamn}</Text>
          {biodlare ? (
            <Text style={styles.meta}>Biodlare: {biodlare}</Text>
          ) : null}
          <Text style={styles.meta}>
            Journal över hälsoåtgärder och läkemedelsbehandlingar
          </Text>
        </View>

        {rader.length === 0 ? (
          <Text style={styles.tomt}>
            Inga hälsoåtgärder registrerade för {ar}.
          </Text>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={styles.kolDatum}>Datum</Text>
              <Text style={styles.kolSamhalle}>Samhälle</Text>
              <Text style={styles.kolAtgard}>Åtgärd</Text>
              <Text style={styles.kolPreparat}>Preparat</Text>
              <Text style={styles.kolBatch}>Batchnr</Text>
              <Text style={styles.kolKarens}>Karens</Text>
              <Text style={styles.kolAnteckning}>Anteckning</Text>
            </View>
            {rader.map((rad, i) => (
              <View key={i} style={styles.rad} wrap={false}>
                <Text style={styles.kolDatum}>{rad.datum}</Text>
                <Text style={styles.kolSamhalle}>{rad.samhalle}</Text>
                <Text style={styles.kolAtgard}>{rad.atgard}</Text>
                <Text style={styles.kolPreparat}>{rad.preparat || "-"}</Text>
                <Text style={styles.kolBatch}>{rad.batchnummer || "-"}</Text>
                <Text style={styles.kolKarens}>
                  {rad.karensDagar !== undefined ? `${rad.karensDagar} d` : "-"}
                </Text>
                <Text style={styles.kolAnteckning}>{rad.anteckning || ""}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.fot} fixed>
          Genererad {new Date().toLocaleDateString("sv-SE")} med BiManager
        </Text>
      </Page>
    </Document>
  );
}
