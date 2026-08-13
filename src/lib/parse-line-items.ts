export function parseLineItems(formData: FormData) {
  const descriptions = formData.getAll("itemDescription") as string[];
  const quantities = formData.getAll("itemQuantity") as string[];
  const rates = formData.getAll("itemRate") as string[];

  const items = descriptions
    .map((description, i) => {
      const quantity = parseFloat(quantities[i] || "1") || 0;
      const rate = parseFloat(rates[i] || "0") || 0;
      const amount = Math.round(quantity * rate * 100) / 100;
      return { description: description.trim(), quantity, rate, amount };
    })
    .filter((item) => item.description.length > 0);

  const subtotal =
    Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;

  return { items, subtotal };
}
