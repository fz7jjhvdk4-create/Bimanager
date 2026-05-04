"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Path,
  Circle,
  Ellipse,
  Rect,
} from "@react-pdf/renderer";

// Registrera svenska tecken-stöd
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#78350f",
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#92400e",
    marginTop: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#78350f",
    textAlign: "right",
  },
  companyTagline: {
    fontSize: 10,
    color: "#92400e",
    textAlign: "right",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
  },
  customerInfo: {
    marginBottom: 4,
  },
  customerName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  customerDetail: {
    fontSize: 10,
    color: "#4b5563",
    marginBottom: 1,
  },
  dateLabel: {
    fontSize: 9,
    color: "#92400e",
  },
  dateValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fef3c7",
    borderBottomWidth: 1,
    borderBottomColor: "#d97706",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colDescription: {
    flex: 4,
  },
  colQuantity: {
    flex: 1,
    textAlign: "right",
  },
  colPrice: {
    flex: 1.5,
    textAlign: "right",
  },
  colVat: {
    flex: 1,
    textAlign: "right",
  },
  colTotal: {
    flex: 1.5,
    textAlign: "right",
  },
  headerText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#78350f",
  },
  cellText: {
    fontSize: 10,
    color: "#1f2937",
  },
  totalsSection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  totalValue: {
    fontSize: 10,
    color: "#1f2937",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: "#d97706",
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#78350f",
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#78350f",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 15,
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerSection: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#78350f",
    marginBottom: 4,
  },
  footerText: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 2,
  },
  statusBadge: {
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: "flex-end",
  },
  statusPaid: {
    backgroundColor: "#d1fae5",
  },
  statusSent: {
    backgroundColor: "#dbeafe",
  },
  statusDraft: {
    backgroundColor: "#f3f4f6",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  statusPaidText: {
    color: "#065f46",
  },
  statusSentText: {
    color: "#1e40af",
  },
  statusDraftText: {
    color: "#4b5563",
  },
});

interface Customer {
  namn: string;
  adress?: string | null;
  postnummer?: string | null;
  ort?: string | null;
  epost?: string | null;
  telefon?: string | null;
  organisationsnummer?: string | null;
}

interface InvoiceLine {
  beskrivning: string;
  antal: number;
  enhet: string;
  prisPerEnhet: number;
  momsSats: number;
}

interface Settings {
  foretagsnamn?: string | null;
  organisationsnummer?: string | null;
  adress?: string | null;
  postnummer?: string | null;
  ort?: string | null;
  telefon?: string | null;
  epost?: string | null;
  bankgiro?: string | null;
  swish?: string | null;
}

interface InvoicePDFProps {
  invoice: {
    fakturaNummer: string;
    fakturaDatum: string;
    forfallDatum: string;
    rader: string;
    totaltExMoms: number;
    totaltMoms: number;
    totaltInklMoms: number;
    status: string;
    kund: Customer;
  };
  settings?: Settings | null;
}

export default function InvoicePDF({ invoice, settings }: InvoicePDFProps) {
  const rader: InvoiceLine[] = JSON.parse(invoice.rader);
  const companyName = settings?.foretagsnamn || "BiManager";

  const getStatusStyle = () => {
    switch (invoice.status) {
      case "Betald":
        return { badge: styles.statusPaid, text: styles.statusPaidText };
      case "Skickad":
        return { badge: styles.statusSent, text: styles.statusSentText };
      default:
        return { badge: styles.statusDraft, text: styles.statusDraftText };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Svg style={styles.headerIcon} width={56} height={56} viewBox="0 0 80 80">
              {/* Vingar (bakom kroppen) */}
              <Ellipse cx="20" cy="28" rx="9" ry="5.5" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth={0.8} />
              <Ellipse cx="50" cy="28" rx="9" ry="5.5" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth={0.8} />
              {/* Bi-kropp */}
              <Ellipse cx="35" cy="36" rx="14" ry="13" fill="#FCD34D" />
              {/* Ränder */}
              <Ellipse cx="35" cy="31" rx="13" ry="2.5" fill="#1F2937" />
              <Ellipse cx="35" cy="41" rx="11" ry="2" fill="#1F2937" />
              {/* Huvud */}
              <Circle cx="35" cy="16" r={9} fill="#FCD34D" />
              {/* Antenner */}
              <Path d="M30 8 Q27 3 24 1" stroke="#1F2937" strokeWidth={1.5} fill="none" strokeLinecap="round" />
              <Path d="M40 8 Q43 3 46 1" stroke="#1F2937" strokeWidth={1.5} fill="none" strokeLinecap="round" />
              {/* Ögon */}
              <Circle cx="31" cy="15" r={2.5} fill="#1F2937" />
              <Circle cx="39" cy="15" r={2.5} fill="#1F2937" />
              <Circle cx="30.3" cy="14.2" r={0.8} fill="#FFFFFF" />
              <Circle cx="38.3" cy="14.2" r={0.8} fill="#FFFFFF" />
              {/* Leende */}
              <Path d="M31 19 Q35 22 39 19" stroke="#1F2937" strokeWidth={1.2} fill="none" strokeLinecap="round" />
              {/* Armar runt burken */}
              <Path d="M23 41 Q24 51 31 53" stroke="#1F2937" strokeWidth={1.6} fill="none" strokeLinecap="round" />
              <Path d="M47 41 Q46 51 39 53" stroke="#1F2937" strokeWidth={1.6} fill="none" strokeLinecap="round" />
              {/* Honungsburk - lock */}
              <Rect x="28" y="44" width="14" height="3.5" rx={0.8} fill="#78350F" />
              {/* Honungsburk - kropp */}
              <Rect x="29" y="47.5" width="12" height="13" rx={1.5} fill="#F59E0B" />
              {/* Honungsburk - inre/honung */}
              <Rect x="30" y="48.5" width="10" height="11" rx={1} fill="#FBBF24" />
              {/* Etikett */}
              <Rect x="30" y="52" width="10" height="4" fill="#FFFFFF" />
              {/* Litet bi på etiketten */}
              <Ellipse cx="35" cy="54" rx={1.6} ry={1.2} fill="#FCD34D" />
              <Path d="M33.5 54 L36.5 54" stroke="#1F2937" strokeWidth={0.4} />
            </Svg>
            <View>
              <Text style={styles.title}>FAKTURA</Text>
              <Text style={styles.invoiceNumber}>{invoice.fakturaNummer}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            {settings?.organisationsnummer && (
              <Text style={styles.companyTagline}>
                Org.nr: {settings.organisationsnummer}
              </Text>
            )}
          </View>
        </View>

        {/* Customer and Dates */}
        <View style={[styles.section, styles.row]}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Faktureras till</Text>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{invoice.kund.namn}</Text>
              {invoice.kund.organisationsnummer && (
                <Text style={styles.customerDetail}>
                  Org.nr: {invoice.kund.organisationsnummer}
                </Text>
              )}
              {invoice.kund.adress && (
                <Text style={styles.customerDetail}>{invoice.kund.adress}</Text>
              )}
              {(invoice.kund.postnummer || invoice.kund.ort) && (
                <Text style={styles.customerDetail}>
                  {invoice.kund.postnummer} {invoice.kund.ort}
                </Text>
              )}
              {invoice.kund.epost && (
                <Text style={styles.customerDetail}>{invoice.kund.epost}</Text>
              )}
            </View>
          </View>
          <View style={[styles.column, { alignItems: "flex-end" }]}>
            <Text style={styles.dateLabel}>Fakturadatum</Text>
            <Text style={styles.dateValue}>
              {new Date(invoice.fakturaDatum).toLocaleDateString("sv-SE")}
            </Text>
            <Text style={styles.dateLabel}>Förfallodatum</Text>
            <Text style={styles.dateValue}>
              {new Date(invoice.forfallDatum).toLocaleDateString("sv-SE")}
            </Text>
            <View style={[styles.statusBadge, statusStyle.badge]}>
              <Text style={[styles.statusText, statusStyle.text]}>
                {invoice.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Invoice Lines Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDescription]}>
              Beskrivning
            </Text>
            <Text style={[styles.headerText, styles.colQuantity]}>Antal</Text>
            <Text style={[styles.headerText, styles.colPrice]}>à-pris</Text>
            <Text style={[styles.headerText, styles.colVat]}>Moms</Text>
            <Text style={[styles.headerText, styles.colTotal]}>Summa</Text>
          </View>
          {rader.map((rad, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cellText, styles.colDescription]}>
                {rad.beskrivning}
              </Text>
              <Text style={[styles.cellText, styles.colQuantity]}>
                {rad.antal} {rad.enhet}
              </Text>
              <Text style={[styles.cellText, styles.colPrice]}>
                {rad.prisPerEnhet.toLocaleString("sv-SE")} kr
              </Text>
              <Text style={[styles.cellText, styles.colVat]}>
                {(rad.momsSats * 100).toFixed(0)}%
              </Text>
              <Text style={[styles.cellText, styles.colTotal]}>
                {(rad.antal * rad.prisPerEnhet).toLocaleString("sv-SE")} kr
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Summa ex moms:</Text>
              <Text style={styles.totalValue}>
                {invoice.totaltExMoms.toLocaleString("sv-SE")} kr
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Moms:</Text>
              <Text style={styles.totalValue}>
                {invoice.totaltMoms.toLocaleString("sv-SE")} kr
              </Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Att betala:</Text>
              <Text style={styles.grandTotalValue}>
                {invoice.totaltInklMoms.toLocaleString("sv-SE")} kr
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Avsändare</Text>
              <Text style={styles.footerText}>{companyName}</Text>
              {settings?.adress && (
                <Text style={styles.footerText}>{settings.adress}</Text>
              )}
              {(settings?.postnummer || settings?.ort) && (
                <Text style={styles.footerText}>
                  {settings.postnummer} {settings.ort}
                </Text>
              )}
            </View>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Kontakt</Text>
              {settings?.telefon && (
                <Text style={styles.footerText}>Tel: {settings.telefon}</Text>
              )}
              {settings?.epost && (
                <Text style={styles.footerText}>{settings.epost}</Text>
              )}
            </View>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Betalning</Text>
              {settings?.bankgiro && (
                <Text style={styles.footerText}>
                  Bankgiro: {settings.bankgiro}
                </Text>
              )}
              {settings?.swish && (
                <Text style={styles.footerText}>Swish: {settings.swish}</Text>
              )}
              <Text style={styles.footerText}>
                Ange {invoice.fakturaNummer} vid betalning
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
