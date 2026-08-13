import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  metaLabel: { color: "#666" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, color: "#666", marginBottom: 4 },
  bold: { fontWeight: 700 },
  headerRow: {
    flexDirection: "row",
    borderBottom: "1 solid #000",
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    borderBottom: "1 solid #eee",
    paddingVertical: 5,
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colRate: { flex: 1.2, textAlign: "right" },
  colAmount: { flex: 1.2, textAlign: "right" },
  totals: { marginTop: 12, alignItems: "flex-end" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 2,
  },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingTop: 6,
    marginTop: 4,
    borderTop: "1 solid #000",
    fontWeight: 700,
  },
  notes: { marginTop: 24, fontSize: 9, color: "#444" },
  signatureBlock: {
    marginTop: 40,
    alignItems: "flex-end",
  },
  signatureImage: { width: 140, height: 50, objectFit: "contain" },
  signatureLine: {
    width: 180,
    borderTop: "1 solid #000",
    marginTop: 4,
    paddingTop: 4,
    textAlign: "center",
  },
});

export type InvoicePdfProps = {
  number: string;
  issueDate: string;
  dueDate: string | null;
  status: string;
  firm: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    gstin: string | null;
  };
  banks: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string | null;
    isPrimary: boolean;
  }[];
  signatureImage: string | null;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    gstin: string | null;
  };
  matter: { title: string } | null;
  items: { description: string; quantity: string; rate: string; amount: string }[];
  subtotal: string;
  gstEnabled: boolean;
  cgst: string;
  sgst: string;
  igst: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  notes: string | null;
};

export function InvoicePdf({
  number,
  issueDate,
  dueDate,
  status,
  firm,
  banks,
  signatureImage,
  client,
  matter,
  items,
  subtotal,
  gstEnabled,
  cgst,
  sgst,
  igst,
  total,
  amountPaid,
  balanceDue,
  notes,
}: InvoicePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{firm.name || "Tax Invoice"}</Text>
            {firm.address && <Text style={styles.metaLabel}>{firm.address}</Text>}
            {firm.phone && <Text style={styles.metaLabel}>{firm.phone}</Text>}
            {firm.email && <Text style={styles.metaLabel}>{firm.email}</Text>}
            {firm.website && <Text style={styles.metaLabel}>{firm.website}</Text>}
            {firm.gstin && <Text style={styles.metaLabel}>GSTIN: {firm.gstin}</Text>}
          </View>
          <View>
            <Text style={styles.bold}>Tax Invoice {number}</Text>
            <Text style={styles.metaLabel}>Issued: {issueDate}</Text>
            {dueDate && <Text style={styles.metaLabel}>Due: {dueDate}</Text>}
            <Text style={styles.metaLabel}>Status: {status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billed To</Text>
          <Text style={styles.bold}>{client.name}</Text>
          {client.address && <Text>{client.address}</Text>}
          {client.email && <Text>{client.email}</Text>}
          {client.phone && <Text>{client.phone}</Text>}
          {client.gstin && <Text>GSTIN: {client.gstin}</Text>}
          {matter && <Text>Matter: {matter.title}</Text>}
        </View>

        <View>
          <View style={styles.headerRow}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Rate</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {items.map((item, i) => (
            <View style={styles.row} key={i}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colRate}>₹{item.rate}</Text>
              <Text style={styles.colAmount}>₹{item.amount}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>₹{subtotal}</Text>
          </View>
          {gstEnabled && (
            <>
              <View style={styles.totalRow}>
                <Text>CGST</Text>
                <Text>₹{cgst}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>SGST</Text>
                <Text>₹{sgst}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>IGST</Text>
                <Text>₹{igst}</Text>
              </View>
            </>
          )}
          <View style={styles.totalFinal}>
            <Text>Total</Text>
            <Text>₹{total}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Paid</Text>
            <Text>₹{amountPaid}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.bold}>Balance Due</Text>
            <Text style={styles.bold}>₹{balanceDue}</Text>
          </View>
        </View>

        {banks.length > 0 && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            {banks.map((bank, i) => (
              <View key={i} style={{ marginBottom: i < banks.length - 1 ? 8 : 0 }}>
                <Text style={styles.bold}>
                  {bank.bankName}
                  {bank.isPrimary && banks.length > 1 ? " (Preferred)" : ""}
                </Text>
                <Text>Account Name: {bank.accountName}</Text>
                <Text>Account No: {bank.accountNumber}</Text>
                <Text>IFSC: {bank.ifscCode}</Text>
                {bank.branch && <Text>Branch: {bank.branch}</Text>}
              </View>
            ))}
          </View>
        )}

        {notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{notes}</Text>
          </View>
        )}

        <View style={styles.signatureBlock}>
          <Text>For {firm.name || "the Firm"}</Text>
          {signatureImage && <Image src={signatureImage} style={styles.signatureImage} />}
          <Text style={styles.signatureLine}>Authorized Signatory</Text>
        </View>
      </Page>
    </Document>
  );
}
