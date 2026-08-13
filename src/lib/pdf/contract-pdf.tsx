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
  content: { lineHeight: 1.5, whiteSpace: "pre-wrap" },
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

export type ContractPdfProps = {
  title: string;
  status: string;
  createdDate: string;
  signedDate: string | null;
  firm: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    gstin: string | null;
  };
  signatureImage: string | null;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  matter: { title: string } | null;
  content: string;
};

export function ContractPdf({
  title,
  status,
  createdDate,
  signedDate,
  firm,
  signatureImage,
  client,
  matter,
  content,
}: ContractPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{firm.name || title}</Text>
            {firm.address && <Text style={styles.metaLabel}>{firm.address}</Text>}
            {firm.phone && <Text style={styles.metaLabel}>{firm.phone}</Text>}
            {firm.email && <Text style={styles.metaLabel}>{firm.email}</Text>}
            {firm.website && <Text style={styles.metaLabel}>{firm.website}</Text>}
          </View>
          <View>
            <Text style={styles.bold}>{title}</Text>
            <Text style={styles.metaLabel}>Created: {createdDate}</Text>
            {signedDate && <Text style={styles.metaLabel}>Signed: {signedDate}</Text>}
            <Text style={styles.metaLabel}>Status: {status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Between</Text>
          <Text style={styles.bold}>{client.name}</Text>
          {client.address && <Text>{client.address}</Text>}
          {client.email && <Text>{client.email}</Text>}
          {client.phone && <Text>{client.phone}</Text>}
          {matter && <Text>Matter: {matter.title}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.content}>{content}</Text>
        </View>

        <View style={styles.signatureBlock}>
          <Text>For {firm.name || "the Firm"}</Text>
          {signatureImage && <Image src={signatureImage} style={styles.signatureImage} />}
          <Text style={styles.signatureLine}>Authorized Signatory</Text>
        </View>
      </Page>
    </Document>
  );
}
