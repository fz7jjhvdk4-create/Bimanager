"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 25,
    backgroundColor: "#FFFFFF",
  },
  header: {
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#d97706",
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#78350f",
    marginBottom: 2,
  },
  receiptNumber: {
    fontSize: 11,
    color: "#92400e",
  },
  companySection: {
    alignItems: "center",
    marginBottom: 15,
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
  },
  companyDetail: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 1,
  },
  mainSection: {
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    color: "#6b7280",
  },
  value: {
    fontSize: 10,
    color: "#1f2937",
    fontWeight: "bold",
  },
  descriptionSection: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#fde68a",
  },
  descriptionLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 10,
    color: "#1f2937",
  },
  totalSection: {
    backgroundColor: "#78350f",
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    color: "#fef3c7",
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
    marginBottom: 1,
  },
  thankYou: {
    fontSize: 11,
    color: "#78350f",
    fontWeight: "bold",
    marginTop: 6,
  },
  productSection: {
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  productHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
    paddingBottom: 4,
    marginBottom: 6,
  },
  productRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  colBeskrivning: {
    flex: 3,
  },
  colAntal: {
    flex: 1,
    textAlign: "right",
  },
  colPris: {
    flex: 1,
    textAlign: "right",
  },
  headerText: {
    fontSize: 8,
    color: "#92400e",
    fontWeight: "bold",
  },
  productText: {
    fontSize: 10,
    color: "#1f2937",
  },
  productTextBold: {
    fontSize: 10,
    color: "#1f2937",
    fontWeight: "bold",
  },
});

interface Settings {
  foretagsnamn?: string | null;
  organisationsnummer?: string | null;
  adress?: string | null;
  postnummer?: string | null;
  ort?: string | null;
  telefon?: string | null;
  epost?: string | null;
}

interface ReceiptPDFProps {
  receipt: {
    kvittoNummer: string;
    datum: string;
    beskrivning: string;
    koparensNamn?: string;
    antalBurkar?: number;
    belopp: number;
    momsSats: number;
    exMoms: number;
    moms: number;
  };
  settings?: Settings | null;
}

export default function ReceiptPDF({ receipt, settings }: ReceiptPDFProps) {
  const companyName = settings?.foretagsnamn || "BiManager";

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>KVITTO</Text>
          <Text style={styles.receiptNumber}>{receipt.kvittoNummer}</Text>
        </View>

        {/* Company Info */}
        <View style={styles.companySection}>
          <Text style={styles.companyName}>{companyName}</Text>
          {settings?.organisationsnummer && (
            <Text style={styles.companyDetail}>
              Org.nr: {settings.organisationsnummer}
            </Text>
          )}
          {settings?.adress && (
            <Text style={styles.companyDetail}>{settings.adress}</Text>
          )}
          {(settings?.postnummer || settings?.ort) && (
            <Text style={styles.companyDetail}>
              {settings.postnummer} {settings.ort}
            </Text>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.mainSection}>
          <View style={styles.row}>
            <Text style={styles.label}>Datum:</Text>
            <Text style={styles.value}>
              {new Date(receipt.datum).toLocaleDateString("sv-SE")}
            </Text>
          </View>
          {receipt.koparensNamn && (
            <View style={styles.row}>
              <Text style={styles.label}>Köpare:</Text>
              <Text style={styles.value}>{receipt.koparensNamn}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Betalningssätt:</Text>
            <Text style={styles.value}>Kontant</Text>
          </View>
        </View>

        {/* Produktrad */}
        <View style={styles.productSection}>
          <View style={styles.productHeader}>
            <Text style={[styles.headerText, styles.colBeskrivning]}>Beskrivning</Text>
            <Text style={[styles.headerText, styles.colAntal]}>Antal</Text>
            <Text style={[styles.headerText, styles.colPris]}>Summa</Text>
          </View>
          <View style={styles.productRow}>
            <Text style={[styles.productText, styles.colBeskrivning]}>{receipt.beskrivning}</Text>
            <Text style={[styles.productText, styles.colAntal]}>
              {receipt.antalBurkar ? `${receipt.antalBurkar} st` : "-"}
            </Text>
            <Text style={[styles.productTextBold, styles.colPris]}>
              {receipt.exMoms.toFixed(2)} kr
            </Text>
          </View>
        </View>

        {/* Amounts */}
        <View style={styles.mainSection}>
          <View style={styles.row}>
            <Text style={styles.label}>Belopp ex moms:</Text>
            <Text style={styles.value}>
              {receipt.exMoms.toLocaleString("sv-SE")} kr
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              Moms ({(receipt.momsSats * 100).toFixed(0)}%):
            </Text>
            <Text style={styles.value}>
              {receipt.moms.toLocaleString("sv-SE")} kr
            </Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTALT:</Text>
            <Text style={styles.totalValue}>
              {receipt.belopp.toLocaleString("sv-SE")} kr
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {settings?.telefon && (
            <Text style={styles.footerText}>Tel: {settings.telefon}</Text>
          )}
          {settings?.epost && (
            <Text style={styles.footerText}>{settings.epost}</Text>
          )}
          <Text style={styles.thankYou}>Tack för ditt köp!</Text>
        </View>
      </Page>
    </Document>
  );
}
