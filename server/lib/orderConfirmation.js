function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return entities[character];
  });
}

function formatPrice(value) {
  return `${Number(value).toFixed(2)} kr`;
}

// The shop owns this presentation; the e-mail provider only delivers it.
export function orderConfirmation(order) {
  const subject = `Orderbekräftelse #${order.id}`;
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td align="right">${item.quantity}</td>
          <td align="right">${formatPrice(item.price)}</td>
          <td align="right">${formatPrice(item.price * item.quantity)}</td>
        </tr>`,
    )
    .join("");
  const textItems = order.items
    .map(
      (item) =>
        `${item.name} - ${item.quantity} st x ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}`,
    )
    .join("\n");
  const customerName = escapeHtml(order.customerName || "kund");

  const html = `
    <h1>Tack för din beställning!</h1>
    <p>Hej ${customerName},</p>
    <p>Vi har tagit emot betalningen för order <strong>#${order.id}</strong>.</p>
    <table>
      <thead><tr><th align="left">Produkt</th><th>Antal</th><th>Pris</th><th>Summa</th></tr></thead>
      <tbody>${itemRows}</tbody>
      <tfoot><tr><th colspan="3" align="right">Totalt</th><th align="right">${formatPrice(order.totalPrice)}</th></tr></tfoot>
    </table>
    <p>Välkommen åter!</p>`;

  const text = `Tack för din beställning!\n\nHej ${order.customerName || "kund"},\n\nVi har tagit emot betalningen för order #${order.id}.\n\n${textItems}\n\nTotalt: ${formatPrice(order.totalPrice)}\n\nVälkommen åter!`;

  return { subject, html, text };
}
