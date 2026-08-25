export function validateProductPayload(req, res, next) {
  const { name, description, price, image_url } = req.body;
  const numericPrice = Number(price);
  const trimmedName = name?.trim();
  const trimmedDescription = description?.trim();
  const trimmedImageUrl = image_url?.trim();

  if (
    !trimmedName ||
    !trimmedDescription ||
    !trimmedImageUrl ||
    !Number.isFinite(numericPrice)
  ) {
    return res.status(400).json({
      message: "Namn, beskrivning, bildlänk och ett giltigt pris krävs.",
    });
  }

  if (numericPrice < 0) {
    return res.status(400).json({ message: "Priset måste vara minst 0." });
  }

  req.product = {
    name: trimmedName,
    description: trimmedDescription,
    price: numericPrice,
    image_url: trimmedImageUrl,
  };

  next();
}
