# Bezpieczeństwo

## Zgłaszanie podatności
Nie otwieraj publicznego issue. Napisz bezpośrednio do właściciela repozytorium (GitHub: `wiktor-student`) z opisem, krokami odtworzenia i wpływem.

## Model bezpieczeństwa (skrót)
- Konta anonimowe; w bazie wyłącznie SHA-256 tokenu, brak danych osobowych.
- Wyniki rankingowe liczy serwer (replay logu akcji z seeda wydanego przez serwer).
- Rate limiting, limity rozmiaru żądań, `helmet`, CORS z listą dozwolonych originów, parametryzowane zapytania SQL.
- Szczegóły i znane ograniczenia: [docs/ARCHITECTURE.md §6](docs/ARCHITECTURE.md#6-model-zaufania-i-ograniczenia).
