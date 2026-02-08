const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function randomChar() {
  const index = Math.floor(Math.random() * SLUG_ALPHABET.length);
  return SLUG_ALPHABET[index];
}

export function generateSlug(size = 7) {
  let slug = "";
  for (let i = 0; i < size; i += 1) {
    slug += randomChar();
  }
  return slug;
}

